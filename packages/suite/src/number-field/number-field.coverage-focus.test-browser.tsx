import { Field } from '@xenon/solid'
import { NumberField } from '@xenon/solid/number-field'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  flush()
})

test('number-field.a11y.2 passes axe for a basic labeled NumberField', async () => {
  const view = mount(() => (
    <NumberField>
      <NumberField.Label>Quantity</NumberField.Label>
      <NumberField.Input />
      <NumberField.IncrementTrigger />
      <NumberField.DecrementTrigger />
    </NumberField>
  ))
  await expectNoViolations(view.container)
})

test('number-field.focus.5 keeps a readonly NumberField focusable in the Tab order', async () => {
  const view = mount(() => (
    <>
      <button>Before</button>
      <NumberField readonly defaultValue={3}>
        <NumberField.Input aria-label="Readonly quantity" />
      </NumberField>
      <button>After</button>
    </>
  ))
  const before = view.getByRole('button', { name: 'Before' })
  const input = view.getByRole('spinbutton', { name: 'Readonly quantity' })
  before.focus()
  await userEvent.tab()
  expect(input).toHaveFocus()
  expect(input).toHaveAttribute('readonly')
})

test('number-field.focus.6 focuses the visible input when its outer Field.Label is clicked', async () => {
  const view = mount(() => (
    <Field>
      <Field.Label>Amount</Field.Label>
      <NumberField>
        <NumberField.Input />
      </NumberField>
    </Field>
  ))
  await userEvent.click(view.getByText('Amount'))
  expect(view.getByRole('spinbutton', { name: 'Amount' })).toHaveFocus()
})

test('number-field.focus.8 preserves the browser selection when focus arrives by Tab', async () => {
  const view = mount(() => (
    <>
      <button>Before field</button>
      <input aria-label="Native baseline" value="123" />
      <NumberField defaultValue={123}>
        <NumberField.Input aria-label="Tabbed quantity" />
      </NumberField>
    </>
  ))
  const baseline = view.getByRole('textbox', { name: 'Native baseline' }) as HTMLInputElement
  const input = view.getByRole('spinbutton', { name: 'Tabbed quantity' }) as HTMLInputElement
  view.getByRole('button', { name: 'Before field' }).focus()
  await userEvent.tab()
  expect(baseline).toHaveFocus()
  const baselineSelection = [baseline.selectionStart, baseline.selectionEnd]
  expect(baselineSelection).toEqual([0, 3])
  await userEvent.tab()
  expect(input).toHaveFocus()
  await settle()
  expect([input.selectionStart, input.selectionEnd]).toEqual(baselineSelection)
})
