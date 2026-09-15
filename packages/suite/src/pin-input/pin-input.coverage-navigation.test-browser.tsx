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
  readonly,
  disabled,
  onKeyDown,
  onValueChange,
}: {
  defaultValue?: string
  length?: number
  type?: 'numeric' | 'alphabetic' | 'alphanumeric'
  readonly?: boolean
  disabled?: boolean
  onKeyDown?: (event: KeyboardEvent) => void
  onValueChange?: (value: string) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput
        defaultValue={defaultValue}
        length={length}
        type={type}
        readonly={readonly}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onValueChange={onValueChange}
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

test('pin-input.keyboard.14 numeric filtering rejects invalid characters without advancing and accepts every zero', async () => {
  const slots = mount({ length: 5, type: 'numeric' })
  slots[0]!.focus()

  for (const invalid of ['a', '!', '$']) {
    await userEvent.type(slots[0]!, invalid)
    expect(values(slots)).toEqual(['', '', '', '', ''])
    expect(document.activeElement).toBe(slots[0])
  }

  await userEvent.type(slots[0]!, '00000')
  expect(values(slots)).toEqual(['0', '0', '0', '0', '0'])
  expect(document.activeElement).toBe(slots[4])
})

test('pin-input.keyboard.15 alphabetic filtering rejects digits and advances after a letter', async () => {
  const slots = mount({ type: 'alphabetic' })
  slots[0]!.focus()

  await userEvent.type(slots[0]!, '7')
  expect(values(slots)).toEqual(['', '', '', ''])
  expect(document.activeElement).toBe(slots[0])

  await userEvent.type(slots[0]!, 'a')
  expect(values(slots)).toEqual(['a', '', '', ''])
  expect(document.activeElement).toBe(slots[1])
})

test('pin-input.keyboard.19 Ctrl and Cmd arrows reach the first slot and insertion boundary', async () => {
  for (const modifier of ['Control', 'Meta'] as const) {
    const slots = mount({ defaultValue: '12' })
    slots[1]!.focus()

    await userEvent.keyboard(`{${modifier}>}{ArrowLeft}{/${modifier}}`)
    expect(document.activeElement).toBe(slots[0])

    await userEvent.keyboard(`{${modifier}>}{ArrowRight}{/${modifier}}`)
    expect(document.activeElement).toBe(slots[2])
  }
})

test('pin-input.keyboard.20 readonly preserves value while all six navigation keys still move focus', async () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '1234', readonly: true, onValueChange: changed })
  slots[1]!.focus()

  await userEvent.keyboard('{ArrowLeft}')
  expect(document.activeElement).toBe(slots[0])
  await userEvent.keyboard('{ArrowRight}')
  expect(document.activeElement).toBe(slots[1])
  await userEvent.keyboard('{Home}')
  expect(document.activeElement).toBe(slots[0])
  await userEvent.keyboard('{End}')
  expect(document.activeElement).toBe(slots[3])
  await userEvent.keyboard('{ArrowUp}')
  expect(document.activeElement).toBe(slots[0])
  await userEvent.keyboard('{ArrowDown}')
  expect(document.activeElement).toBe(slots[3])

  await userEvent.type(slots[3]!, '9')
  expect(values(slots)).toEqual(['1', '2', '3', '4'])
  expect(changed).not.toHaveBeenCalled()
  await userEvent.keyboard('{Delete}{Backspace}')
  expect(values(slots)).toEqual(['1', '2', '3', '4'])
  expect(changed).not.toHaveBeenCalled()
})

test('pin-input.keyboard.21 disabled ArrowUp and ArrowDown bubble without being canceled', () => {
  const events: { key: string; defaultPrevented: boolean }[] = []
  const slots = mount({
    disabled: true,
    onKeyDown: (event) => events.push({ key: event.key, defaultPrevented: event.defaultPrevented }),
  })

  for (const key of ['ArrowUp', 'ArrowDown']) {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    expect(slots[0]!.dispatchEvent(event)).toBe(true)
  }

  expect(events).toEqual([
    { key: 'ArrowUp', defaultPrevented: false },
    { key: 'ArrowDown', defaultPrevented: false },
  ])
})
