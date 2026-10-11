import { cleanup, render } from '@solidjs/testing-library'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { PinInput } from './index'
import type { PinInputProps } from './index'
afterEach(cleanup)

const charset = 'BCDFGHJKLMNPQRSTVWXZ'

/** Eight slots split 4-4 by a hidden dash, as a device code renders. */
function DeviceCode(props: Partial<PinInputProps>) {
  return (
    <PinInput type="alphabetic" case="upper" charset={charset} length={8} {...props}>
      <For each={[0, 1, 2, 3]}>{(index) => <PinInput.Input index={index} />}</For>
      <span aria-hidden="true">-</span>
      <For each={[4, 5, 6, 7]}>{(index) => <PinInput.Input index={index} />}</For>
    </PinInput>
  )
}

function paste(el: HTMLInputElement, text: string) {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', { value: { getData: () => text } })
  el.dispatchEvent(event)
  flush()
}

function key(el: HTMLInputElement, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  flush()
}

test('paste at slot 0 fills all eight slots across the separator in upper case', () => {
  const change = vi.fn()
  const complete = vi.fn()
  const view = render(() => (
    <form>
      <DeviceCode name="code" onValueChange={change} onValueComplete={complete} />
    </form>
  ))
  const slots = view.getAllByRole('textbox') as HTMLInputElement[]
  paste(slots[0]!, 'bcdf-ghjk')
  expect(slots.map((el) => el.value).join('')).toBe('BCDFGHJK')
  expect(change).toHaveBeenCalledExactlyOnceWith('BCDFGHJK')
  expect(complete).toHaveBeenCalledExactlyOnceWith('BCDFGHJK')
  expect(new FormData(view.container.querySelector('form')!).get('code')).toBe('BCDFGHJK')
})

test('typed lower case displays upper case and characters outside the charset are dropped', () => {
  const change = vi.fn()
  const view = render(() => <DeviceCode onValueChange={change} />)
  const slots = view.getAllByRole('textbox') as HTMLInputElement[]
  slots[0]!.value = 'a'
  slots[0]!.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'a' }))
  flush()
  expect(slots[0]!.value).toBe('')
  expect(change).not.toHaveBeenCalled()
  slots[0]!.value = 'b'
  slots[0]!.dispatchEvent(new InputEvent('input', { bubbles: true, data: 'b' }))
  flush()
  expect(slots[0]!.value).toBe('B')
  expect(change).toHaveBeenCalledExactlyOnceWith('B')
})

test('ArrowRight and Backspace cross the separator', () => {
  const view = render(() => <DeviceCode defaultValue="BCDFGHJK" />)
  const slots = view.getAllByRole('textbox') as HTMLInputElement[]
  slots[3]!.focus()
  key(slots[3]!, 'ArrowRight')
  expect(document.activeElement).toBe(slots[4])
  cleanup()

  const change = vi.fn()
  const partial = render(() => <DeviceCode defaultValue="BCDF" onValueChange={change} />)
  const inputs = partial.getAllByRole('textbox') as HTMLInputElement[]
  inputs[4]!.focus()
  key(inputs[4]!, 'Backspace')
  expect(change).toHaveBeenCalledExactlyOnceWith('BCD')
  expect(inputs.map((el) => el.value).join('')).toBe('BCD')
  expect(document.activeElement).toBe(inputs[3])
})

test('slot labels and attributes ignore the separator', () => {
  const view = render(() => <DeviceCode autocomplete="off" />)
  const slots = view.getAllByRole('textbox') as HTMLInputElement[]
  expect(slots).toHaveLength(8)
  expect(slots[4]).toHaveAttribute('aria-label', 'Pin code 5 of 8')
  expect(slots[0]).toHaveAttribute('autocomplete', 'off')
  expect(slots[0]).toHaveAttribute('autocapitalize', 'characters')
  expect(view.container.firstElementChild).not.toHaveAttribute('autocomplete')
})

test('the first slot keeps one-time-code autocomplete by default', () => {
  const view = render(() => (
    <PinInput length={2}>
      <PinInput.Input index={0} />
      <PinInput.Input index={1} />
    </PinInput>
  ))
  const slots = view.getAllByRole('textbox')
  expect(slots[0]).toHaveAttribute('autocomplete', 'one-time-code')
  expect(slots[1]).toHaveAttribute('autocomplete', 'off')
  expect(slots[0]).toHaveAttribute('autocapitalize', 'off')
})
