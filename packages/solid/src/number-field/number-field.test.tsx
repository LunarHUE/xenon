import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { NumberField } from './index'
import { Field } from '../field'
afterEach(cleanup)
function type(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  flush()
}
function key(input: HTMLInputElement, value: string) {
  input.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }))
  flush()
}
test('draft preserves trailing decimal, commits on Enter, and resets canonical form value silently', async () => {
  const changed = vi.fn()
  const view = render(() => (
    <form>
      <NumberField name="quantity" defaultValue={2} onValueChange={changed}>
        <NumberField.Input aria-label="Quantity" />
      </NumberField>
    </form>
  ))
  const input = view.getByRole('spinbutton') as HTMLInputElement
  const form = view.container.querySelector('form')!
  type(input, '3.')
  expect(input.value).toBe('3.')
  expect(new FormData(form).get('quantity')).toBe('2')
  key(input, 'Enter')
  expect(input.value).toBe('3')
  expect(new FormData(form).get('quantity')).toBe('3')
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(input.value).toBe('2')
  expect(changed).toHaveBeenCalledTimes(1)
})
test('field flags and labels reach the input, and readonly steppers remain discoverable', () => {
  const view = render(() => (
    <Field readonly required>
      <Field.Label>Quantity</Field.Label>
      <NumberField defaultValue={2}>
        <NumberField.Input />
        <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
      </NumberField>
    </Field>
  ))
  const input = view.getByRole('spinbutton', { name: 'Quantity' }) as HTMLInputElement
  expect(input.readOnly).toBe(true)
  expect(input.required).toBe(true)
  const increase = view.getByRole('button', { name: 'Increase' }) as HTMLButtonElement
  expect(increase.disabled).toBe(false)
  expect(increase.getAttribute('aria-disabled')).toBe('true')
})
test('canceled author handlers prevent steps and controlled null accepts an editable draft', () => {
  const changed = vi.fn()
  const view = render(() => (
    <NumberField value={null} onValueChange={changed}>
      <NumberField.Input aria-label="Quantity" onKeyDown={(event) => event.preventDefault()} />
      <NumberField.IncrementTrigger />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton') as HTMLInputElement
  key(input, 'ArrowUp')
  expect(changed).not.toHaveBeenCalled()
  type(input, '4')
  view.getByRole('button').click()
  flush()
  expect(changed).toHaveBeenCalledWith(5)
})
test('external values update the existing input and author IDs update stepper controls', () => {
  const [value, setValue] = createSignal(2)
  const [id, setId] = createSignal('first')
  const view = render(() => (
    <NumberField value={value()}>
      <NumberField.Input id={id()} aria-label="Quantity" />
      <NumberField.IncrementTrigger />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton')
  setValue(5)
  setId('second')
  flush()
  expect(view.getByRole('spinbutton')).toBe(input)
  expect((input as HTMLInputElement).value).toBe('5')
  expect(view.getByRole('button').getAttribute('aria-controls')).toBe('second')
})

test('nonfinite controlled values never serialize NaN or Infinity', () => {
  const view = render(() => (
    <form>
      <NumberField value={NaN} name="amount">
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    </form>
  ))
  expect(new FormData(view.container.querySelector('form')!).get('amount')).toBe('')
})

test('native validity follows draft range errors and recovers after correction', () => {
  const view = render(() => (
    <NumberField min={0} max={10}>
      <NumberField.Input aria-label="Amount" />
    </NumberField>
  ))
  const input = view.getByRole('spinbutton') as HTMLInputElement
  type(input, '20')
  expect(input.checkValidity()).toBe(false)
  type(input, '4')
  expect(input.checkValidity()).toBe(true)
})

test('readonly and author-canceled input restore the visible DOM', () => {
  const changed = vi.fn()
  const view = render(() => (
    <>
      <NumberField readonly value={2} onValueChange={changed}>
        <NumberField.Input aria-label="Readonly amount" />
      </NumberField>
      <NumberField value={3} onValueChange={changed}>
        <NumberField.Input
          aria-label="Canceled amount"
          onInput={(event) => event.preventDefault()}
        />
      </NumberField>
    </>
  ))
  for (const input of view.getAllByRole('spinbutton') as HTMLInputElement[]) {
    input.value = '99'
    input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }))
  }
  expect(
    (view.getByRole('spinbutton', { name: 'Readonly amount' }) as HTMLInputElement).value
  ).toBe('2')
  expect(
    (view.getByRole('spinbutton', { name: 'Canceled amount' }) as HTMLInputElement).value
  ).toBe('3')
  expect(changed).not.toHaveBeenCalled()
})
