import { render } from '@solidjs/web'
import { PinInput } from '@xenon/solid/pin-input'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mount({
  defaultValue,
  length = 4,
  type,
  onValueChange,
  onKeyDown,
}: {
  defaultValue?: string
  length?: number
  type?: 'numeric' | 'alphabetic' | 'alphanumeric'
  onValueChange?: (value: string) => void
  onKeyDown?: (event: KeyboardEvent) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput
        defaultValue={defaultValue}
        length={length}
        type={type}
        onValueChange={onValueChange}
        onKeyDown={onKeyDown}
      >
        <For each={Array.from({ length }, (_value, index) => index)}>
          {(index) => <PinInput.Input index={index} />}
        </For>
      </PinInput>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]'))
}

function values(slots: HTMLInputElement[]) {
  return slots.map((slot) => slot.value)
}

test('pin-input.keyboard.3 multi-character input distributes one character per slot', () => {
  const changed = vi.fn()
  const slots = mount({ length: 4, onValueChange: changed })
  slots[0]!.focus()
  slots[0]!.value = '12'
  slots[0]!.dispatchEvent(new InputEvent('input', { bubbles: true, data: '12' }))
  flush()

  expect(values(slots)).toEqual(['1', '2', '', ''])
  expect(document.activeElement).toBe(slots[2])
  expect(changed).toHaveBeenLastCalledWith('12')
})

test('pin-input.keyboard.17 modifier deletion clears all or the first slot as specified', async () => {
  for (const modifier of ['Control', 'Meta'] as const) {
    const changed = vi.fn()
    const slots = mount({ defaultValue: '1234', onValueChange: changed })
    slots[2]!.focus()
    await userEvent.keyboard(`{${modifier}>}{Backspace}{/${modifier}}`)
    expect(values(slots)).toEqual(['', '', '', ''])
    expect(document.activeElement).toBe(slots[0])
    expect(changed).toHaveBeenLastCalledWith('')
  }

  const changed = vi.fn()
  const slots = mount({ defaultValue: '1234', onValueChange: changed })
  slots[2]!.focus()
  await userEvent.keyboard('{Home}{Delete}')
  expect(values(slots)).toEqual(['2', '3', '4', ''])
  expect(document.activeElement).toBe(slots[0])
  expect(changed).toHaveBeenLastCalledWith('234')
})

test('pin-input.keyboard.18 ArrowUp and ArrowDown move focus and cancel the native event while bubbling', async () => {
  const events: { key: string; defaultPrevented: boolean }[] = []
  const slots = mount({
    defaultValue: '12',
    onKeyDown: (event) => events.push({ key: event.key, defaultPrevented: event.defaultPrevented }),
  })
  slots[1]!.focus()

  await userEvent.keyboard('{ArrowUp}')
  expect(document.activeElement).toBe(slots[0])
  await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(slots[2])
  expect(events).toEqual([
    { key: 'ArrowUp', defaultPrevented: true },
    { key: 'ArrowDown', defaultPrevented: true },
  ])

  const complete = mount({ defaultValue: '1234' })
  complete[1]!.focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(complete[3])
})

test('pin-input.keyboard.24 caret at either edge still replaces a filled slot and advances', async () => {
  for (const selection of [0, 1]) {
    const slots = mount({ defaultValue: '1234' })
    slots[1]!.focus()
    slots[1]!.setSelectionRange(selection, selection)
    expect([slots[1]!.selectionStart, slots[1]!.selectionEnd]).toEqual([selection, selection])
    await userEvent.keyboard('9')

    expect(values(slots)).toEqual(['1', '9', '3', '4'])
    expect(document.activeElement).toBe(slots[2])
  }
})

test('pin-input.rtl.2 suppresses edits and navigation during composition, then commits or rejects composition data', async () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '12', length: 4, onValueChange: changed })
  slots[1]!.focus()
  slots[1]!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  slots[1]!.dispatchEvent(new InputEvent('input', { bubbles: true, data: '9' }))
  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) {
    slots[1]!.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, isComposing: true })
    )
    expect(document.activeElement).toBe(slots[1])
  }
  expect(values(slots)).toEqual(['1', '2', '', ''])
  expect(changed).not.toHaveBeenCalled()

  slots[1]!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '34' }))
  flush()
  expect(values(slots)).toEqual(['1', '3', '4', ''])
  expect(document.activeElement).toBe(slots[3])
  expect(changed).toHaveBeenLastCalledWith('134')

  const rejected = vi.fn()
  const invalid = mount({ length: 4, onValueChange: rejected })
  invalid[0]!.focus()
  invalid[0]!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
  invalid[0]!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'a' }))
  flush()
  expect(values(invalid)).toEqual(['', '', '', ''])
  expect(document.activeElement).toBe(invalid[0])
  expect(rejected).not.toHaveBeenCalled()
})
