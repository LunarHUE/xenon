import { Editable } from '@xenon-ui/solid/editable'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
let dispose: (() => void) | undefined
let container: HTMLDivElement
function mount() {
  container = document.createElement('div')
  document.body.append(container)
}
afterEach(() => {
  dispose?.()
  container?.remove()
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
test('native pointer focus never commits before Cancel and outside blur preserves the new focus target', async () => {
  mount()
  const changed = vi.fn()
  dispose = render(
    () => (
      <>
        <Editable defaultValue="Original" onValueChange={changed}>
          {parts()}
        </Editable>
        <button>Outside</button>
      </>
    ),
    container
  )
  flush()
  const q = within(container)
  await userEvent.click(q.getByRole('button', { name: 'Original' }))
  flush()
  const input = q.getByRole('textbox', { name: 'Title' }) as HTMLInputElement
  expect(input).toHaveFocus()
  expect(input.selectionStart).toBe(0)
  expect(input.selectionEnd).toBe(8)
  await userEvent.fill(input, 'Discard')
  flush()
  await userEvent.click(q.getByRole('button', { name: 'Cancel' }))
  flush()
  expect(changed).not.toHaveBeenCalled()
  expect(q.getByRole('button', { name: 'Original' })).toHaveFocus()
  await userEvent.click(q.getByRole('button', { name: 'Original' }))
  await userEvent.fill(input, 'Saved')
  flush()
  await userEvent.click(q.getByRole('button', { name: 'Outside' }))
  flush()
  expect(changed).toHaveBeenCalledExactlyOnceWith('Saved')
  expect(q.getByRole('button', { name: 'Outside' })).toHaveFocus()
  expect(q.getByRole('button', { name: 'Saved' })).toBeVisible()
})
test('required native validation opens the editor and canceled form resets preserve committed text', async () => {
  mount()
  dispose = render(
    () => (
      <form>
        <Editable required name="title">
          {parts()}
        </Editable>
        <button type="submit">Send</button>
      </form>
    ),
    container
  )
  flush()
  const q = within(container),
    form = container.querySelector('form')!
  await userEvent.click(q.getByRole('button', { name: 'Send' }))
  flush()
  expect(q.getByRole('textbox', { name: 'Title' })).toHaveFocus()
  await userEvent.fill(q.getByRole('textbox', { name: 'Title' }), 'Valid')
  await userEvent.keyboard('{Enter}')
  flush()
  expect(new FormData(form).get('title')).toBe('Valid')
  form.addEventListener('reset', (e) => e.preventDefault(), { once: true })
  form.reset()
  await Promise.resolve()
  flush()
  expect(q.getByRole('button', { name: 'Valid' })).toBeVisible()
})
test('multiline Enter inserts a line and only explicit Save commits', async () => {
  mount()
  const changed = vi.fn()
  dispose = render(
    () => (
      <Editable defaultValue="Line" submitMode="none" onValueChange={changed}>
        <Editable.Label>Notes</Editable.Label>
        <Editable.Preview />
        <Editable.Input as="textarea" />
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
      </Editable>
    ),
    container
  )
  flush()
  const q = within(container)
  await userEvent.click(q.getByRole('button', { name: 'Line' }))
  await userEvent.fill(q.getByRole('textbox'), 'First')
  await userEvent.keyboard('{Enter}Second')
  flush()
  expect(q.getByRole('textbox')).toHaveValue('First\nSecond')
  expect(changed).not.toHaveBeenCalled()
  await userEvent.click(q.getByRole('button', { name: 'Save' }))
  flush()
  expect(changed).toHaveBeenCalledWith('First\nSecond')
})
