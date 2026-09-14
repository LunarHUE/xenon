import { Field } from '../field/field'
import { render, fireEvent, cleanup } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Editable } from './editable'
afterEach(() => {
  cleanup()
  flush()
})
const parts = () => (
  <>
    <Editable.Label>Title</Editable.Label>
    <Editable.Preview />
    <Editable.Input />
    <Editable.EditTrigger>Edit</Editable.EditTrigger>
    <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
    <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
  </>
)
test('focus alone preserves preview, edit selects text, cancel restores and Enter commits', () => {
  const changed = vi.fn()
  const m = render(() => (
    <Editable defaultValue="Old" onValueChange={changed}>
      {parts()}
    </Editable>
  ))
  flush()
  const preview = m.getByRole('button', { name: 'Old' })
  preview.focus()
  flush()
  expect(m.queryByRole('textbox')).toBeNull()
  fireEvent.click(preview)
  flush()
  const input = m.getByRole('textbox') as HTMLInputElement
  expect(input).toHaveFocus()
  expect(input.selectionStart).toBe(0)
  fireEvent.input(input, { target: { value: 'New' } })
  flush()
  fireEvent.click(m.getByRole('button', { name: 'Cancel' }))
  flush()
  expect(preview).toHaveFocus()
  expect(changed).not.toHaveBeenCalled()
  fireEvent.click(preview)
  flush()
  expect(input.value).toBe('Old')
  fireEvent.input(input, { target: { value: 'New' } })
  flush()
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(changed).toHaveBeenCalledExactlyOnceWith('New')
  expect(m.getByRole('button', { name: 'New' })).toBeVisible()
})
test('controlled value remains authoritative, cancellation and IME preserve edits', () => {
  const changed = vi.fn()
  const m = render(() => (
    <Editable value="Fixed" onValueChange={changed}>
      {parts()}
    </Editable>
  ))
  flush()
  fireEvent.click(m.getByRole('button', { name: 'Fixed' }))
  flush()
  const input = m.getByRole('textbox')
  fireEvent.input(input, { target: { value: 'Other' } })
  flush()
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
  flush()
  expect(changed).not.toHaveBeenCalled()
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(changed).toHaveBeenCalledWith('Other')
  expect(m.getByRole('button', { name: 'Fixed' })).toBeVisible()
})
test('native form values and silent reset restore defaults', async () => {
  const changed = vi.fn()
  const m = render(() => (
    <form>
      <Editable name="title" defaultValue="Before" onValueChange={changed}>
        {parts()}
      </Editable>
    </form>
  ))
  flush()
  fireEvent.click(m.getByRole('button', { name: 'Before' }))
  flush()
  fireEvent.input(m.getByRole('textbox'), { target: { value: 'After' } })
  flush()
  fireEvent.keyDown(m.getByRole('textbox'), { key: 'Enter' })
  flush()
  const form = m.container.querySelector('form')!
  expect(new FormData(form).get('title')).toBe('After')
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(m.getByRole('button', { name: 'Before' })).toBeVisible()
  expect(new FormData(form).get('title')).toBe('Before')
  expect(changed).toHaveBeenCalledOnce()
})

test('outer Field label and description reach the native editor, while invalid/readonly propagate', () => {
  const m = render(() => (
    <Field readonly invalid>
      <Field.Label>Outer title</Field.Label>
      <Field.Description>Help</Field.Description>
      <Field.Error>Error</Field.Error>
      <Editable defaultEditing defaultValue="Locked">
        <Editable.Preview />
        <Editable.Input />
      </Editable>
    </Field>
  ))
  flush()
  const input = m.getByRole('textbox', { name: 'Outer title' })
  expect(input).toHaveAttribute('readonly')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  const ids = input.getAttribute('aria-describedby')!.split(' ')
  expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Help', 'Error'])
})
test('author key cancellation prevents commit and blur-none keeps the session', () => {
  const changed = vi.fn()
  const m = render(() => (
    <Editable defaultEditing submitMode="none" onValueChange={changed}>
      <Editable.Label>Name</Editable.Label>
      <Editable.Preview />
      <Editable.Input onKeyDown={(event) => event.preventDefault()} />
    </Editable>
  ))
  flush()
  fireEvent.input(m.getByRole('textbox'), { target: { value: 'Draft' } })
  flush()
  fireEvent.keyDown(m.getByRole('textbox'), { key: 'Enter' })
  flush()
  expect(changed).not.toHaveBeenCalled()
  expect(m.getByRole('textbox')).toBeVisible()
})
