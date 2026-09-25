import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
import { For, flush } from 'solid-js'
import { describe, expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/**
 * Browser-native interaction boundaries for the segmented one-time-code field:
 * Backspace at empty and filled slots, arrow/Home/End/vertical focus navigation,
 * readonly and disabled edit suppression, and synthetic IME composition
 * cancellation.
 *
 * These cases run only in the browser project. The composition events below are
 * constructor-built synthetic ones, not a real OS input method: the engines this
 * suite runs on expose no portable API for driving native IME state, so they
 * verify the component's synthetic composition-event handling and nothing about
 * a real IME.
 */

/** One disposable fixture exposing its native slots in index order. */
interface Fixture {
  /** Native slot inputs ordered by their rendered index. */
  slots: HTMLInputElement[]
}

/** Renders an uncontrolled PinInput into the body and returns its ordered slots. */
function mountPin(props: {
  length: number
  defaultValue?: string
  readonly?: boolean
  disabled?: boolean
  onValueChange?: (value: string) => void
}): Fixture {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput
        length={props.length}
        defaultValue={props.defaultValue}
        readonly={props.readonly}
        disabled={props.disabled}
        onValueChange={props.onValueChange}
      >
        <For each={Array.from({ length: props.length }, (_value, index) => index)}>
          {(index) => <PinInput.Input index={index} />}
        </For>
      </PinInput>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const slots = Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]'))
  return { slots }
}

/** Reads the ordered slot values for whole-code assertions. */
function code(slots: HTMLInputElement[]): string[] {
  return slots.map((slot) => slot.value)
}

describe('pin input native deletion and focus boundaries', () => {
  test('Backspace at the insertion point clears the previous slot and walks focus back to the first slot', async () => {
    const changed = vi.fn()
    const { slots } = mountPin({ length: 4, onValueChange: changed })
    slots[0]!.focus()
    await userEvent.keyboard('12')
    expect(document.activeElement).toBe(slots[2])
    changed.mockClear()

    // The focused slot is empty, so Backspace splices the character before it.
    await userEvent.keyboard('{Backspace}')
    expect(code(slots)).toEqual(['1', '', '', ''])
    expect(document.activeElement).toBe(slots[1])
    expect(changed).toHaveBeenLastCalledWith('1')

    await userEvent.keyboard('{Backspace}')
    expect(code(slots)).toEqual(['', '', '', ''])
    expect(document.activeElement).toBe(slots[0])
    expect(changed).toHaveBeenLastCalledWith('')

    // Backspace on the first empty slot changes neither the code nor the callbacks.
    changed.mockClear()
    await userEvent.keyboard('{Backspace}')
    expect(code(slots)).toEqual(['', '', '', ''])
    expect(document.activeElement).toBe(slots[0])
    expect(changed).not.toHaveBeenCalled()
  })

  test('ArrowLeft stops at the first slot and ArrowRight stops at the insertion point', async () => {
    const { slots } = mountPin({ length: 4 })
    slots[0]!.focus()
    await userEvent.keyboard('12')
    expect(document.activeElement).toBe(slots[2])

    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(slots[1])
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(slots[0])
    // The first slot keeps focus rather than wrapping.
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(slots[0])

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(slots[1])
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(slots[2])
    // Empty slots past the insertion point stay unreachable with the arrow key.
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(slots[2])

    // Typing into the last slot keeps focus there once the code is complete.
    await userEvent.keyboard('34')
    expect(code(slots)).toEqual(['1', '2', '3', '4'])
    expect(document.activeElement).toBe(slots[3])
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(slots[3])
  })

  test('Home and ArrowUp reach the first slot while End and ArrowDown reach the insertion point', async () => {
    const { slots } = mountPin({ length: 4 })
    slots[0]!.focus()
    await userEvent.keyboard('12')
    expect(document.activeElement).toBe(slots[2])

    await userEvent.keyboard('{Home}')
    expect(document.activeElement).toBe(slots[0])
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(slots[2])
    await userEvent.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(slots[0])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(slots[2])

    // End lands on the first empty slot, not the last filled one.
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(slots[1])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(slots[2])
  })

  test('readonly keeps arrow navigation while typing, Backspace, Delete and paste leave the code unchanged', async () => {
    const changed = vi.fn()
    const { slots } = mountPin({
      length: 4,
      defaultValue: '1234',
      readonly: true,
      onValueChange: changed,
    })

    // Readonly is the native attribute on every slot, not the disabling attribute.
    expect(slots.map((slot) => slot.readOnly)).toEqual([true, true, true, true])

    slots[0]!.focus()

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(slots[1])
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.activeElement).toBe(slots[0])
    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(slots[3])

    await userEvent.keyboard('9')
    await userEvent.keyboard('{Backspace}')
    await userEvent.keyboard('{Delete}')
    const clipboard = new DataTransfer()
    clipboard.setData('text', '9')
    slots[3]!.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: clipboard })
    )
    flush()

    expect(code(slots)).toEqual(['1', '2', '3', '4'])
    expect(document.activeElement).toBe(slots[3])
    expect(changed).not.toHaveBeenCalled()
  })

  test('disabled slots are not focusable and reject typing and deletion', async () => {
    const changed = vi.fn()
    const { slots } = mountPin({
      length: 4,
      defaultValue: '12',
      disabled: true,
      onValueChange: changed,
    })

    expect(slots.map((slot) => slot.disabled)).toEqual([true, true, true, true])

    // A disabled input cannot take focus, so native navigation can never start there.
    slots[0]!.focus()
    expect(document.activeElement).not.toBe(slots[0])

    // Even a programmatically dispatched key press must not reach the code engine.
    slots[1]!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true })
    )
    flush()

    expect(code(slots)).toEqual(['1', '2', '', ''])
    expect(changed).not.toHaveBeenCalled()
  })

  test('synthetic composition ignores mid-composition input and deletion, and a canceled composition leaves the code empty', async () => {
    const changed = vi.fn()
    const { slots } = mountPin({ length: 4, onValueChange: changed })
    slots[0]!.focus()

    // A synthetic IME session must not write while it is still composing.
    slots[0]!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    slots[0]!.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: '9' }))
    expect(
      slots[0]!.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Backspace',
          bubbles: true,
          cancelable: true,
          isComposing: true,
        })
      )
    ).toBe(true)
    expect(code(slots)).toEqual(['', '', '', ''])
    expect(changed).not.toHaveBeenCalled()

    // A canceled composition commits nothing.
    slots[0]!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '' }))
    flush()
    expect(code(slots)).toEqual(['', '', '', ''])
    expect(changed).not.toHaveBeenCalled()

    // The next committed composition distributes across slots and advances focus.
    slots[0]!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    slots[0]!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '12' }))
    flush()
    expect(code(slots)).toEqual(['1', '2', '', ''])
    expect(document.activeElement).toBe(slots[2])
    expect(changed).toHaveBeenCalledExactlyOnceWith('12')
  })
})
