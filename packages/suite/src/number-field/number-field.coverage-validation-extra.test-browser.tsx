import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { NumberField } from '@xenon-ui/solid/number-field'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { flush } from 'solid-js'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
  flush()
})

function mount(children: () => JSX.Element) {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(children, host)
  flush()
  return host
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('number-field.forms.2: disabled and readonly hidden entries follow native submission rules', async () => {
  const root = mount(() => (
    <form>
      <NumberField name="disabled" disabled defaultValue={2}>
        <NumberField.Input aria-label="Disabled" />
      </NumberField>
      <NumberField name="readonly" readonly defaultValue={3}>
        <NumberField.Input aria-label="Readonly" />
      </NumberField>
    </form>
  ))
  await settle()
  const form = root.querySelector('form')!
  const disabled = root.querySelector<HTMLInputElement>('input[type="hidden"][name="disabled"]')!
  const readonly = root.querySelector<HTMLInputElement>('input[type="hidden"][name="readonly"]')!
  expect(disabled).toBeDisabled()
  expect(new FormData(form).has('disabled')).toBe(false)
  expect(readonly).not.toBeDisabled()
  expect(readonly).not.toHaveAttribute('readonly')
  expect(readonly.readOnly).toBe(false)
  expect(readonly).toHaveValue('3')
  expect(new FormData(form).get('readonly')).toBe('3')
})

test('number-field.forms.8: a required stepper change clears native validation', async () => {
  const change = vi.fn()
  const root = mount(() => (
    <form>
      <NumberField name="amount" required onValueChange={change}>
        <NumberField.Input aria-label="Amount" />
        <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
      </NumberField>
    </form>
  ))
  await settle()
  const form = root.querySelector('form')!
  const input = root.querySelector<HTMLInputElement>('input[role="spinbutton"]')!
  expect(input).not.toBeValid()
  expect(input.reportValidity()).toBe(false)
  expect(input.validationMessage).not.toBe('')
  await userEvent.click(root.querySelector('button')!)
  await settle()
  expect(input).toHaveValue('0')
  expect(input).toBeValid()
  expect(input.reportValidity()).toBe(true)
  expect(input.validationMessage).toBe('')
  expect(form.checkValidity()).toBe(true)
  expect(change).toHaveBeenCalledExactlyOnceWith(0)
})

test('number-field.roles.5: author error messaging follows invalid state and clears invalid state', async () => {
  const root = mount(() => (
    <NumberField defaultValue={2} min={0} max={10}>
      <NumberField.Input aria-label="Amount" aria-errormessage="amount-error" />
      <span id="amount-error">Enter an amount from 0 to 10.</span>
    </NumberField>
  ))
  await settle()
  const input = root.querySelector<HTMLInputElement>('input[role="spinbutton"]')!
  const error = root.querySelector<HTMLElement>('#amount-error')!
  expect(error).toBeVisible()
  expect(error.textContent).toContain('0 to 10')
  await userEvent.fill(input, '-1')
  await settle()
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAttribute('aria-errormessage', 'amount-error')
  await userEvent.fill(input, '11')
  await settle()
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAttribute('aria-errormessage', 'amount-error')
  await userEvent.fill(input, '4')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(input).not.toHaveAttribute('aria-invalid')
  expect(input).toHaveAttribute('aria-errormessage', 'amount-error')
})

test('number-field.state.11: an outside-bound value clamps to the reachable maximum', async () => {
  const root = mount(() => (
    <NumberField defaultValue={13} max={10} step={3}>
      <NumberField.Input aria-label="Amount" />
      <NumberField.DecrementTrigger>−</NumberField.DecrementTrigger>
    </NumberField>
  ))
  await settle()
  const input = root.querySelector<HTMLInputElement>('input[role="spinbutton"]')!
  expect(input).toHaveValue('13')
  await userEvent.click(root.querySelector('button')!)
  await settle()
  expect(input).toHaveValue('10')
})
