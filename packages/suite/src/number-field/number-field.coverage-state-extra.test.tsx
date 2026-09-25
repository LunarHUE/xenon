import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

import { Field } from '@xenon-ui/solid/field'
import { NumberField } from '@xenon-ui/solid/number-field'

const disposers: (() => void)[] = []
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
  flush()
})

function settle() {
  flush()
}

function stateFixture(props: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  disposers.push(
    render(
      () => (
        <NumberField {...props}>
          <NumberField.Input aria-label="Amount" />
          <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
          <NumberField.DecrementTrigger>−</NumberField.DecrementTrigger>
        </NumberField>
      ),
      container
    )
  )
  settle()
  return { container, ...within(container) }
}

test('number-field.roles.8 exposes disabled and invalid state on the group', () => {
  const view = stateFixture({ disabled: true, invalid: true })
  const root = view.container.firstElementChild!

  expect(root).toHaveAttribute('role', 'group')
  expect(root).toHaveAttribute('aria-disabled', 'true')
  expect(root).toHaveAttribute('aria-invalid', 'true')
})

test('number-field.roles.12 disables an out-of-range draft direction and re-enables after clearing', () => {
  const view = stateFixture({ defaultValue: 5, min: 0, max: 10 })
  const input = view.getByRole('spinbutton') as HTMLInputElement
  const increase = view.getByRole('button', { name: 'Increase' })
  const decrease = view.getByRole('button', { name: 'Decrease' })

  input.value = '20'
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  settle()
  expect(input).toHaveValue('20')
  expect(increase).toHaveAttribute('aria-disabled', 'true')
  expect(decrease).not.toHaveAttribute('aria-disabled')

  input.value = '-5'
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  settle()
  expect(input).toHaveValue('-5')
  expect(increase).not.toHaveAttribute('aria-disabled')
  expect(decrease).toHaveAttribute('aria-disabled', 'true')

  input.value = ''
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  settle()
  expect(increase).not.toHaveAttribute('aria-disabled')
  expect(decrease).not.toHaveAttribute('aria-disabled')
})

test.each([
  ['required', { required: true }, 'required', 'aria-required', 'data-required'],
  ['disabled', { disabled: true }, 'disabled', 'aria-disabled', 'data-disabled'],
  ['readonly', { readonly: true }, 'readonly', 'aria-readonly', 'data-readonly'],
] as const)(
  'number-field.roles.15 mirrors %s on root and input',
  (_name, props, native, aria, data) => {
    const view = stateFixture(props)
    const root = view.container.firstElementChild!
    const input = view.getByRole('spinbutton')

    expect(root).toHaveAttribute(data, '')
    expect(input).toHaveAttribute(data, '')
    expect(input).toHaveAttribute(aria, 'true')
    expect(input).toHaveAttribute(native)
  }
)

test('number-field.roles.16 leaves state data attributes absent on a plain field', () => {
  const view = stateFixture()
  const root = view.container.firstElementChild!
  const input = view.getByRole('spinbutton')

  for (const element of [root, input]) {
    for (const state of [
      'data-valid',
      'data-invalid',
      'data-required',
      'data-disabled',
      'data-readonly',
    ]) {
      expect(element).not.toHaveAttribute(state)
    }
  }
})

test('number-field.roles.16 exposes only the active state data flag', () => {
  const states = [
    ['required', { required: true }, 'data-required'],
    ['disabled', { disabled: true }, 'data-disabled'],
    ['readonly', { readonly: true }, 'data-readonly'],
    ['invalid', { invalid: true }, 'data-invalid'],
  ] as const

  for (const [_name, props, active] of states) {
    const view = stateFixture(props)
    const elements = [view.container.firstElementChild!, view.getByRole('spinbutton')]
    for (const element of elements) {
      expect(element).toHaveAttribute(active, '')
      for (const state of ['data-required', 'data-disabled', 'data-readonly', 'data-invalid']) {
        if (state !== active) expect(element).not.toHaveAttribute(state)
      }
    }
    disposers.splice(-1).forEach((dispose) => dispose())
    view.container.remove()
  }
})

test('number-field.forms.13 renders helper text and conditionally exposes the Field error', () => {
  const [invalid, setInvalid] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const [readonly, setReadonly] = createSignal(false)
  const container = document.createElement('div')
  document.body.append(container)
  disposers.push(
    render(
      () => (
        <Field
          id="amount"
          required={true}
          disabled={disabled()}
          readonly={readonly()}
          invalid={invalid()}
        >
          <Field.Description>Enter a whole amount.</Field.Description>
          <Field.Error>Amount is invalid.</Field.Error>
          <NumberField>
            <NumberField.Input aria-label="Amount" />
          </NumberField>
        </Field>
      ),
      container
    )
  )
  settle()

  const input = within(container).getByRole('spinbutton')
  expect(input).toHaveAttribute('required')
  expect(input).toHaveAttribute('aria-required', 'true')
  expect(input).not.toHaveAttribute('disabled')
  expect(input).not.toHaveAttribute('readonly')
  expect(within(container).getByText('Enter a whole amount.')).toBeVisible()
  expect(within(container).queryByRole('alert')).toBeNull()

  setInvalid(true)
  settle()
  expect(within(container).getByRole('alert')).toHaveTextContent('Amount is invalid.')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input.getAttribute('aria-describedby')).toContain('amount-description')
  expect(input.getAttribute('aria-describedby')).toContain('amount-error')

  setDisabled(true)
  setReadonly(true)
  settle()
  expect(input).toHaveAttribute('disabled')
  expect(input).toHaveAttribute('aria-disabled', 'true')
  expect(input).toHaveAttribute('data-disabled', '')
  expect(input).toHaveAttribute('readonly')
  expect(input).toHaveAttribute('aria-readonly', 'true')
  expect(input).toHaveAttribute('data-readonly', '')

  setInvalid(false)
  settle()
  expect(within(container).queryByRole('alert')).toBeNull()
  expect(input).not.toHaveAttribute('aria-invalid')
  expect(input.getAttribute('aria-describedby')).toBe('amount-description')
})
