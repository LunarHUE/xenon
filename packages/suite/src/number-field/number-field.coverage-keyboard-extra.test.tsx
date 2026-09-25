import { NumberField } from '@xenon-ui/solid/number-field'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function fixture(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <NumberField {...props}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  return {
    container,
    async settle() {
      flush()
      await Promise.resolve()
      flush()
    },
  }
}

test('number-field.keyboard.5 handled arrow keys prevent their default action', async () => {
  const m = fixture({ defaultValue: 4 })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  input.dispatchEvent(event)
  expect(event.defaultPrevented).toBe(true)
  const bounded = fixture({ defaultValue: 4, min: 0, max: 10 })
  await bounded.settle()
  const boundedInput = within(bounded.container).getByRole('spinbutton')
  for (const key of ['ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) {
    const handled = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    boundedInput.dispatchEvent(handled)
    expect(handled.defaultPrevented).toBe(true)
    await bounded.settle()
  }
})

test('number-field.state.3 clearing reports null rather than zero', async () => {
  const changed = vi.fn()
  const m = fixture({ defaultValue: 4, onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  fireEvent.input(input, { target: { value: '   ' } })
  await m.settle()
  fireEvent.keyDown(input, { key: 'Enter' })
  await m.settle()
  expect(changed).toHaveBeenLastCalledWith(null)
  expect(input).toHaveValue('')
  fireEvent.input(input, { target: { value: '' } })
  await m.settle()
  fireEvent.keyDown(input, { key: 'Enter' })
  await m.settle()
  expect(input).toHaveValue('')
})

test('number-field.state.10 repeated fine steps retain exact decimal values', async () => {
  const changed = vi.fn()
  const m = fixture({ defaultValue: 1, step: 0.001, onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  for (let index = 0; index < 4; index++) {
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
    )
    await m.settle()
  }
  expect(input).toHaveValue('1.004')
  expect(changed.mock.calls.map(([value]) => value)).toEqual([1.001, 1.002, 1.003, 1.004])
  const bounded = fixture({ defaultValue: 0.7, min: 0.1, max: 24, step: 0.1 })
  await bounded.settle()
  const boundedInput = within(bounded.container).getByRole('spinbutton')
  for (let index = 0; index < 233; index++) {
    boundedInput.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
    )
    await bounded.settle()
    if (index === 0) expect.soft(boundedInput).toHaveValue('0.8')
  }
  expect(boundedInput).toHaveValue('24')
})

test('number-field.state.11 off-grid stepping moves to the next grid line', async () => {
  const changed = vi.fn()
  const m = fixture({ defaultValue: 18.98, step: 1, onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(input).toHaveValue('19')
  expect(changed).toHaveBeenLastCalledWith(19)
  fireEvent.input(input, { target: { value: '18.11' } })
  await m.settle()
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(input).toHaveValue('18')
})

test('number-field.state.15 empty negative range seeds at the in-range maximum', async () => {
  const changed = vi.fn()
  const m = fixture({ min: -10, max: -5, step: 2, onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(input).toHaveValue('-5')
  expect(changed).toHaveBeenLastCalledWith(-5)
  fireEvent.input(input, { target: { value: 'bad' } })
  await m.settle()
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(input).toHaveValue('-5')
})

test('number-field.state.16 unchanged parsed edits correct the display without a second callback', async () => {
  const changed = vi.fn()
  const m = fixture({ defaultValue: 1, onValueChange: changed })
  await m.settle()
  const input = within(m.container).getByRole('spinbutton')
  fireEvent.input(input, { target: { value: '1.0' } })
  await m.settle()
  fireEvent.keyDown(input, { key: 'Enter' })
  await m.settle()
  expect(changed).not.toHaveBeenCalled()
  expect(input).toHaveValue('1')
  fireEvent.input(input, { target: { value: '2' } })
  await m.settle()
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(changed).toHaveBeenCalledWith(2)
  fireEvent.input(input, { target: { value: '2.0' } })
  await m.settle()
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  )
  await m.settle()
  expect(changed).toHaveBeenCalledTimes(1)
  expect(input).toHaveValue('2')
})
