import { render } from '@solidjs/web'
import { isInaccessible, within } from '@testing-library/dom'
import { PinInput } from '@xenon-ui/solid/pin-input'
import type { PinInputProps } from '@xenon-ui/solid/pin-input'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  flush()
})

const charset = 'BCDFGHJKLMNPQRSTVWXZ'

/** An eight-character device code split 4-4 by a hidden dash, inside a form. */
function mount(props: Partial<PinInputProps> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <form>
        <PinInput
          type="alphabetic"
          case="upper"
          charset={charset}
          length={8}
          name="code"
          autocomplete="off"
          {...props}
        >
          <For each={[0, 1, 2, 3]}>{(index) => <PinInput.Input index={index} />}</For>
          <span aria-hidden="true" data-testid="separator">
            -
          </span>
          <For each={[4, 5, 6, 7]}>{(index) => <PinInput.Input index={index} />}</For>
        </PinInput>
      </form>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  const slots = Array.from(container.querySelectorAll<HTMLInputElement>('[data-index]'))
  const value = () => slots.map((slot) => slot.value).join('')
  const form = container.querySelector('form')!
  return { container, slots, value, form }
}

function paste(slot: HTMLInputElement, text: string) {
  const clipboard = new DataTransfer()
  clipboard.setData('text', text)
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: clipboard })
  slot.dispatchEvent(event)
  flush()
}

test('pin-input.roles.24 an autocomplete token replaces one-time-code on the first slot only', () => {
  const device = mount()
  expect(device.slots.map((slot) => slot.autocomplete)).toEqual(Array(8).fill('off'))
  cleanups.splice(0).forEach((cleanup) => cleanup())
  const sms = mount({
    autocomplete: undefined,
    type: 'numeric',
    case: undefined,
    charset: undefined,
  })
  expect(sms.slots[0]).toHaveAttribute('autocomplete', 'one-time-code')
  expect(sms.slots.slice(1).every((slot) => slot.getAttribute('autocomplete') === 'off')).toBe(true)
})

test('pin-input.roles.25 upper case starts mobile keyboards in capitals', () => {
  const upper = mount()
  expect(upper.slots.every((slot) => slot.getAttribute('autocapitalize') === 'characters')).toBe(
    true
  )
  cleanups.splice(0).forEach((cleanup) => cleanup())
  const lower = mount({ case: 'lower', charset: undefined })
  expect(lower.slots.every((slot) => slot.getAttribute('autocapitalize') === 'off')).toBe(true)
})

test('pin-input.roles.26 a hidden separator stays out of the tree and out of slot numbering', () => {
  const { slots, container } = mount()
  expect(slots[4]).toHaveAccessibleName('Pin code 5 of 8')
  expect(within(container).getAllByRole('textbox')).toHaveLength(8)
  expect(isInaccessible(within(container).getByTestId('separator'))).toBe(true)
})

test('pin-input.keyboard.32 typed lower case shows and reports upper case, and the reverse for lower', async () => {
  const change = vi.fn()
  const upper = mount({ onValueChange: change })
  await userEvent.click(upper.slots[0]!)
  await userEvent.keyboard('b')
  expect(upper.value()).toBe('B')
  expect(change).toHaveBeenLastCalledWith('B')
  await userEvent.click(upper.slots[0]!)
  change.mockClear()
  await userEvent.keyboard('b')
  expect(change).not.toHaveBeenCalled()
  expect(upper.slots[1]).toHaveFocus()
  cleanups.splice(0).forEach((cleanup) => cleanup())

  const lowered = vi.fn()
  const lower = mount({
    case: 'lower',
    charset: undefined,
    type: 'alphanumeric',
    onValueChange: lowered,
  })
  await userEvent.click(lower.slots[0]!)
  await userEvent.keyboard('A')
  expect(lower.value()).toBe('a')
  expect(lowered).toHaveBeenLastCalledWith('a')
})

test('pin-input.keyboard.33 characters outside the charset are rejected without a change', async () => {
  const change = vi.fn()
  const { slots, value } = mount({ onValueChange: change })
  await userEvent.click(slots[0]!)
  await userEvent.keyboard('a')
  await userEvent.keyboard('e')
  await userEvent.keyboard('1')
  expect(value()).toBe('')
  expect(slots[0]).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  cleanups.splice(0).forEach((cleanup) => cleanup())

  const exact = mount({ case: 'preserve', charset: 'BCD' })
  await userEvent.click(exact.slots[0]!)
  await userEvent.keyboard('b')
  expect(exact.value()).toBe('')
  await userEvent.keyboard('B')
  expect(exact.value()).toBe('B')
})

test('pin-input.keyboard.34 arrows and Backspace cross the separator', async () => {
  const full = mount({ defaultValue: 'BCDFGHJK' })
  await userEvent.click(full.slots[3]!)
  await userEvent.keyboard('{ArrowRight}')
  expect(full.slots[4]).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(full.slots[3]).toHaveFocus()
  cleanups.splice(0).forEach((cleanup) => cleanup())

  const change = vi.fn()
  const partial = mount({ defaultValue: 'BCDF', onValueChange: change })
  await userEvent.click(partial.slots[4]!)
  expect(partial.slots[4]).toHaveFocus()
  await userEvent.keyboard('{Backspace}')
  expect(change).toHaveBeenCalledExactlyOnceWith('BCD')
  expect(partial.value()).toBe('BCD')
  expect(partial.slots[3]).toHaveFocus()
})

test.each(['bcdf-ghjk', 'BCDF GHJK', 'bcdfghjk'])(
  'pin-input.pointer.14 pasting %s fills all eight slots across the separator',
  async (text) => {
    const complete = vi.fn()
    const { slots, value, container } = mount({ onValueComplete: complete })
    await userEvent.click(slots[0]!)
    paste(slots[0]!, text)
    expect(value()).toBe('BCDFGHJK')
    expect(complete).toHaveBeenCalledExactlyOnceWith('BCDFGHJK')
    expect(container.querySelector('[role="group"]')).toHaveAttribute('data-complete')
  }
)

test('pin-input.forms.10 typed lower case submits and completes in upper case', async () => {
  const complete = vi.fn()
  const { slots, form } = mount({ onValueComplete: complete })
  await userEvent.click(slots[0]!)
  await userEvent.keyboard('bcdfghjk')
  expect(complete).toHaveBeenCalledExactlyOnceWith('BCDFGHJK')
  expect(new FormData(form).get('code')).toBe('BCDFGHJK')
})
