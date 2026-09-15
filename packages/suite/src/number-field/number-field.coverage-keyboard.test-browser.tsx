import { NumberField } from '@xenon/solid/number-field'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(container)
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}
function key(input: HTMLInputElement, keyName: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: keyName,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  input.dispatchEvent(event)
  return event
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  flush()
})

test('number-field.keyboard.4 leaves Home and End unhandled without bounds', () => {
  const view = mount(() => (
    <NumberField defaultValue={12}>
      <NumberField.Input aria-label="Unbounded" />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton', { name: 'Unbounded' }) as HTMLInputElement
  input.focus()
  expect(key(input, 'Home').defaultPrevented).toBe(false)
  expect(key(input, 'End').defaultPrevented).toBe(false)
  expect(input).toHaveValue('12')
})

test.each([
  ['ArrowUp', 'upward'],
  ['ArrowDown', 'downward'],
] as const)(
  'number-field.keyboard.11 seeds an empty fully negative range at its nearest-to-zero maximum (%s)',
  async (direction, _label) => {
    const changed = vi.fn()
    const view = mount(() => (
      <NumberField min={-10} max={-1} step={2} onValueChange={changed}>
        <NumberField.Input aria-label="Negative" />
      </NumberField>
    ))
    const input = view.getByRole('spinbutton', { name: 'Negative' }) as HTMLInputElement
    await userEvent.click(input)
    await userEvent.keyboard(`{${direction}}`)
    await settle()
    expect(input).toHaveValue('-1')
    expect(changed).toHaveBeenCalledExactlyOnceWith(-1)
  }
)

test('number-field.keyboard.12 applies exactly one step for each repeated ArrowUp keydown', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <NumberField defaultValue={0} step={2} onValueChange={changed}>
      <NumberField.Input aria-label="Repeating" />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton', { name: 'Repeating' }) as HTMLInputElement
  input.focus()
  key(input, 'ArrowUp', { repeat: true })
  await settle()
  key(input, 'ArrowUp', { repeat: true })
  await settle()
  expect(input).toHaveValue('4')
  expect(changed.mock.calls).toEqual([[2], [4]])
})

test('number-field.keyboard.14 steps from dirty controlled text after ArrowLeft leaves it unsynced', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <NumberField value={10} step={1} onValueChange={changed}>
      <NumberField.Input aria-label="Controlled draft" />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton', { name: 'Controlled draft' }) as HTMLInputElement
  await userEvent.click(input)
  input.select()
  await userEvent.keyboard('12')
  await settle()
  expect(input).toHaveValue('12')
  key(input, 'ArrowLeft')
  key(input, 'ArrowUp')
  await settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(13)
  expect(input).toHaveValue('13')
})

test('number-field.keyboard.16 leaves IME composition keyCode 229 unhandled', () => {
  const changed = vi.fn()
  const view = mount(() => (
    <NumberField defaultValue={4} onValueChange={changed}>
      <NumberField.Input aria-label="IME" />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton', { name: 'IME' }) as HTMLInputElement
  input.focus()
  const imeEvent = new KeyboardEvent('keydown', {
    key: 'ArrowUp',
    bubbles: true,
    cancelable: true,
  })
  Object.defineProperty(imeEvent, 'keyCode', { configurable: true, value: 229 })
  input.dispatchEvent(imeEvent)
  expect(imeEvent.defaultPrevented).toBe(false)
  expect(changed).not.toHaveBeenCalled()
  expect(input).toHaveValue('4')
})

test('number-field.keyboard.22 uses the default largeStep of ten regular steps for Page keys', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <NumberField defaultValue={0} step={2} onValueChange={changed}>
      <NumberField.Input aria-label="Large step" />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton', { name: 'Large step' }) as HTMLInputElement
  await userEvent.click(input)
  await userEvent.keyboard('{PageUp}')
  await settle()
  expect(input).toHaveValue('20')
  await userEvent.keyboard('{PageDown}')
  await settle()
  expect(input).toHaveValue('0')
  expect(changed.mock.calls).toEqual([[20], [0]])
})
