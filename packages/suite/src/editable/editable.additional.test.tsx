import { Editable } from '@xenon/solid/editable'
import type { EditableProps } from '@xenon/solid/editable'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
function mount(props: EditableProps = {}) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(
    () => (
      <Editable {...props}>
        <Editable.Preview />
        <Editable.Input />
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable>
    ),
    root
  )
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return { root, q: within(root) }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('defaultEditing exposes the input while keeping the preview mounted and hidden', () => {
  const m = mount({ defaultEditing: true, defaultValue: 'Draft' })
  expect(m.q.getByRole('textbox')).not.toHaveAttribute('hidden')
  expect(m.root.querySelector('[role="button"]')).toHaveAttribute('hidden')
})

test('maxLength truncates an input-event draft and cancel restores the committed preview', () => {
  const changed = vi.fn()
  const m = mount({ defaultValue: 'old', maxLength: 4, onValueChange: changed })
  fireEvent.click(m.q.getByRole('button', { name: 'old' }))
  flush()
  const input = m.q.getByRole('textbox')
  fireEvent.input(input, { target: { value: 'longer' } })
  flush()
  expect(input).toHaveValue('long')
  fireEvent.click(m.q.getByRole('button', { name: 'Cancel' }))
  flush()
  expect(m.q.getByRole('button', { name: 'old' })).toBeVisible()
  expect(changed).not.toHaveBeenCalled()
})
