import { NumberField } from '@xenon-ui/solid/number-field'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

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
  return { container, ...within(container) }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  flush()
})

test('number-field.forms.1 keeps the visible formatted input unnamed and submits the hidden canonical value', () => {
  const view = mount(() => (
    <form>
      <NumberField name="amount" locale="de-DE" defaultValue={1234.5}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    </form>
  ))
  const input = view.getByRole('spinbutton', { name: 'Amount' }) as HTMLInputElement
  const form = view.container.querySelector('form')!
  const hidden = form.querySelector('input[type="hidden"]') as HTMLInputElement
  expect(input).not.toHaveAttribute('name')
  expect(hidden).toHaveAttribute('name', 'amount')
  expect(hidden.form).toBe(form)
  expect(hidden.value).toBe('1234.5')
  expect(input).toHaveValue('1.234,5')
  expect(new FormData(form).get('amount')).toBe('1234.5')
})

test('number-field.forms.12 submits an unformatted locale number beside its localized currency display', () => {
  const view = mount(() => (
    <form>
      <NumberField
        name="price"
        locale="de-DE"
        defaultValue={54.5}
        formatOptions={{ style: 'currency', currency: 'EUR' }}
      >
        <NumberField.Input aria-label="Price" />
      </NumberField>
    </form>
  ))
  const input = view.getByRole('spinbutton', { name: 'Price' }) as HTMLInputElement
  const form = view.container.querySelector('form')!
  const hidden = form.querySelector('input[type="hidden"]') as HTMLInputElement
  expect(input).not.toHaveAttribute('name')
  expect(hidden).toHaveAttribute('name', 'price')
  expect(hidden.form).toBe(form)
  expect(hidden.value).toBe('54.5')
  expect(input.value).toContain('54,50')
  expect(input.value).toContain('€')
  expect(new FormData(form).get('price')).toBe('54.5')
})
