import { render } from '@solidjs/web'
import { PinInput } from '@xenon-ui/solid/pin-input'
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
  onValueChange,
  vetoIndex,
}: {
  defaultValue?: string
  length?: number
  onValueChange?: (value: string) => void
  vetoIndex?: number
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <PinInput defaultValue={defaultValue} length={length} onValueChange={onValueChange}>
        <For each={Array.from({ length }, (_value, index) => index)}>
          {(index) => (
            <PinInput.Input
              index={index}
              onMouseDown={index === vetoIndex ? (event) => event.preventDefault() : undefined}
            />
          )}
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

function paste(slot: HTMLInputElement, text: string) {
  const clipboard = new DataTransfer()
  clipboard.setData('text', text)
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: clipboard })
  slot.dispatchEvent(event)
  flush()
}

test('pin-input.pointer.1 redirects past-insertion clicks while filled slots remain directly clickable', async () => {
  const slots = mount({ defaultValue: '12' })

  await userEvent.click(slots[3]!)
  expect(document.activeElement).toBe(slots[2])

  await userEvent.click(slots[1]!)
  expect(document.activeElement).toBe(slots[1])
})

test('pin-input.pointer.2 clicking a filled slot selects its character for replacement', async () => {
  const slots = mount({ defaultValue: '1234' })

  await userEvent.click(slots[1]!)
  expect(document.activeElement).toBe(slots[1])
  expect(slots[1]?.selectionStart).toBe(0)
  expect(slots[1]?.selectionEnd).toBe(1)

  await userEvent.keyboard('9')
  expect(values(slots)).toEqual(['1', '9', '3', '4'])
})

test('pin-input.pointer.3 a consumer mousedown preventDefault vetoes slot focus', async () => {
  const slots = mount({ defaultValue: '1234', vetoIndex: 1 })

  slots[0]!.focus()
  await userEvent.click(slots[1]!)

  expect(document.activeElement).toBe(slots[0])
})

test('pin-input.pointer.5 paste into a filled field overwrites forward and focuses after the paste', () => {
  const changed = vi.fn()
  const slots = mount({ defaultValue: '1234', onValueChange: changed })

  slots[1]!.focus()
  paste(slots[1]!, '98')

  expect(values(slots)).toEqual(['1', '9', '8', '4'])
  expect(document.activeElement).toBe(slots[3])
  expect(changed).toHaveBeenLastCalledWith('1984')
})

test('pin-input.pointer.6 numeric paste keeps digits in mixed text and ignores an all-invalid paste', () => {
  const changed = vi.fn()
  const mixed = mount({ length: 4, onValueChange: changed })
  mixed[0]!.focus()
  paste(mixed[0]!, 'a1b2c3')

  expect(values(mixed)).toEqual(['1', '2', '3', ''])
  expect(changed).toHaveBeenLastCalledWith('123')

  const invalidChanged = vi.fn()
  const invalid = mount({ length: 4, onValueChange: invalidChanged })
  invalid[0]!.focus()
  paste(invalid[0]!, 'abc!$')

  expect(values(invalid)).toEqual(['', '', '', ''])
  expect(invalidChanged).not.toHaveBeenCalled()
})
