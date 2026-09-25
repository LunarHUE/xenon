import { Editable } from '@xenon-ui/solid/editable'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mount(props: {
  defaultValue?: string
  placeholder?: string
  activationMode?: 'click' | 'dblclick'
  onValueCommit?: (value: string) => void
}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Editable
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        activationMode={props.activationMode}
        onValueCommit={props.onValueCommit}
      >
        <Editable.Label>Title</Editable.Label>
        <Editable.Preview />
        <Editable.Input />
        <Editable.EditTrigger>Edit</Editable.EditTrigger>
        <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
        <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
      </Editable>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(container)
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('editable.pointer.2 EditTrigger click reveals the editor and focuses its input', async () => {
  const q = mount({ defaultValue: 'Original' })

  await userEvent.click(q.getByRole('button', { name: 'Edit' }))
  await settle()

  expect(q.getByRole('textbox', { name: 'Title' })).toHaveFocus()
  expect(q.getByRole('textbox', { name: 'Title' })).toBeVisible()
})

test('editable.pointer.3 double-click activates existing and placeholder previews, then Enter commits each value', async () => {
  for (const example of [
    { defaultValue: 'Original', preview: 'Original' },
    { defaultValue: undefined, placeholder: 'Add a title', preview: 'Add a title' },
  ]) {
    const committed = vi.fn()
    const q = mount({
      activationMode: 'dblclick',
      defaultValue: example.defaultValue,
      placeholder: example.placeholder,
      onValueCommit: committed,
    })
    const preview = q.getByRole('button', { name: example.preview })

    await userEvent.click(preview)
    expect(q.queryByRole('textbox', { name: 'Title' })).toBeNull()

    await userEvent.dblClick(preview)
    const input = q.getByRole('textbox', { name: 'Title' })
    expect(input).toBeVisible()
    expect(input).toHaveFocus()
    await userEvent.fill(input, 'Typed')
    await userEvent.keyboard('{Enter}')
    await settle()

    expect(committed).toHaveBeenCalledExactlyOnceWith('Typed')
    expect(q.getByRole('button', { name: 'Typed' })).toBeVisible()
  }
})

test('editable.pointer.6 double-click clears and replaces an existing value before Save commits it', async () => {
  const committed = vi.fn()
  const q = mount({
    defaultValue: 'Original',
    activationMode: 'dblclick',
    onValueCommit: committed,
  })

  await userEvent.dblClick(q.getByRole('button', { name: 'Original' }))
  const input = q.getByRole('textbox', { name: 'Title' })
  await userEvent.fill(input, '')
  await userEvent.type(input, 'Replaced')
  await userEvent.click(q.getByRole('button', { name: 'Save' }))
  await settle()

  expect(committed).toHaveBeenCalledExactlyOnceWith('Replaced')
  expect(q.getByRole('button', { name: 'Replaced' })).toBeVisible()
})

test('editable.pointer.7 double-click followed by Escape retains the existing value', async () => {
  const committed = vi.fn()
  const q = mount({
    defaultValue: 'Original',
    activationMode: 'dblclick',
    onValueCommit: committed,
  })

  await userEvent.dblClick(q.getByRole('button', { name: 'Original' }))
  await userEvent.keyboard('{Escape}')
  await settle()

  const preview = q.getByRole('button', { name: 'Original' })
  expect(preview).toBeVisible()
  expect(preview).toHaveFocus()
  expect(committed).not.toHaveBeenCalled()
})
