import { Field } from '@xenon-ui/solid'
import { render, type JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, Show, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('Field required and readonly transitions update native validation without replacing or clearing the edited control', async () => {
  const [readonly, setReadonly] = createSignal(false)
  const [required, setRequired] = createSignal(true)
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const view = mount(() => (
    <form onSubmit={submit}>
      <Field name="account" required={required()} readonly={readonly()}>
        <Field.Label>Account</Field.Label>
        <Field.Control />
      </Field>
      <button type="submit">Save</button>
    </form>
  ))
  const input = view.getByRole('textbox', { name: 'Account' }) as HTMLInputElement
  const form = view.container.querySelector('form')!
  expect(input.willValidate).toBe(true)
  expect(form.checkValidity()).toBe(false)
  setReadonly(true)
  await settle()
  expect(view.getByRole('textbox')).toBe(input)
  expect(input.readOnly).toBe(true)
  expect(input.willValidate).toBe(false)
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submit).toHaveBeenCalledOnce()
  setReadonly(false)
  await settle()
  expect(form.checkValidity()).toBe(false)
  await userEvent.fill(input, 'edited')
  expect(form.checkValidity()).toBe(true)
  setRequired(false)
  await settle()
  expect(input.required).toBe(false)
  expect(input).toHaveValue('edited')
  expect(new FormData(form).get('account')).toBe('edited')
})

test('removing a required registered Field control releases native submission blocking while its sibling keeps its draft', async () => {
  const [shown, setShown] = createSignal(true)
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const view = mount(() => (
    <form onSubmit={submit}>
      <Field>
        <Field.Label>Account</Field.Label>
        <Field.Control
          id="field-surviving"
          name="kept"
          defaultValue="kept draft"
          aria-label="Kept"
        />
        <Show when={shown()}>
          <Field.Control id="field-required" name="required" required aria-label="Required" />
        </Show>
      </Field>
      <button type="submit">Save</button>
    </form>
  ))
  const kept = view.getByRole('textbox', { name: /Kept/ }) as HTMLInputElement
  const required = view.getByRole('textbox', { name: /Required/ })
  const label = view.getByText('Account')
  expect(label).toHaveAttribute('for', required.id)
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submit).not.toHaveBeenCalled()
  expect(required).toHaveFocus()
  setShown(false)
  await settle()
  expect(label).toHaveAttribute('for', kept.id)
  expect(view.getByRole('textbox')).toBe(kept)
  expect(kept).toHaveValue('kept draft')
  await userEvent.click(view.getByRole('button', { name: 'Save' }))
  expect(submit).toHaveBeenCalledOnce()
  await userEvent.click(label)
  expect(kept).toHaveFocus()
})
