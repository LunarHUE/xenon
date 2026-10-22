import { render } from '@solidjs/web'
import { Editable } from '@xenon-ui/solid/editable'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

let cleanup: (() => void) | undefined
afterEach(() => {
  cleanup?.()
  flush()
})

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

function mount(controlled = false) {
  const [locked, setLocked] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const changed = vi.fn()
  const committed = vi.fn()
  const canceled = vi.fn()
  const editing = vi.fn()
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <form>
        <Editable
          name="title"
          defaultValue="Original"
          value={controlled ? 'Authored' : undefined}
          readonly={locked()}
          disabled={disabled()}
          submitMode="enter"
          onValueChange={changed}
          onValueCommit={committed}
          onCancel={canceled}
          onEditingChange={editing}
        >
          <Editable.Preview />
          <Editable.Input aria-label="Title" />
          <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
          <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
        </Editable>
        <button type="reset">Reset</button>
        <button type="button">Outside</button>
      </form>
    ),
    host
  )
  cleanup = () => {
    dispose()
    host.remove()
  }
  flush()
  return {
    q: within(host),
    input: host.querySelector('input')!,
    form: host.querySelector('form')!,
    changed,
    committed,
    canceled,
    editing,
    setLocked,
    setDisabled,
  }
}

for (const lock of ['readonly', 'disabled'] as const) {
  test(`an active ${lock} session can still be canceled without publishing its draft`, async () => {
    const m = mount()
    await userEvent.click(m.q.getByRole('button', { name: 'Original' }))
    await userEvent.fill(m.input, 'Uncommitted')
    if (lock === 'readonly') m.setLocked(true)
    else m.setDisabled(true)
    await settle()
    expect(m.q.getByRole('button', { name: 'Save' })).toBeDisabled()
    await userEvent.click(m.q.getByRole('button', { name: 'Cancel' }))
    await settle()
    expect(m.input).toHaveAttribute('hidden')
    expect(m.input).toHaveValue('Original')
    expect(m.canceled).toHaveBeenCalledExactlyOnceWith('Original')
    expect(m.changed).not.toHaveBeenCalled()
    expect(m.committed).not.toHaveBeenCalled()
    m.setLocked(false)
    m.setDisabled(false)
    await settle()
    await userEvent.click(m.q.getByRole('button', { name: 'Original' }))
    expect(m.input).toHaveFocus()
    expect(m.input).toHaveValue('Original')
  })
}

test('readonly applied during typing blocks Enter and resumes the same draft when released', async () => {
  const m = mount()
  await userEvent.click(m.q.getByRole('button', { name: 'Original' }))
  await userEvent.fill(m.input, 'Draft')
  m.setLocked(true)
  await settle()
  await userEvent.keyboard('{Enter}')
  expect(m.input).not.toHaveAttribute('hidden')
  expect(m.input).toHaveValue('Draft')
  expect(m.committed).not.toHaveBeenCalled()
  m.setLocked(false)
  await settle()
  await userEvent.keyboard('{Enter}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith('Draft')
  expect(m.committed).toHaveBeenCalledExactlyOnceWith('Draft')
  expect(m.q.getByRole('button', { name: 'Draft' })).toHaveFocus()
})

test('repeated controlled commits propose drafts but reopen from the authored value', async () => {
  const m = mount(true)
  for (const draft of ['First proposal', 'Second proposal']) {
    await userEvent.click(m.q.getByRole('button', { name: 'Authored' }))
    expect(m.input).toHaveValue('Authored')
    await userEvent.fill(m.input, draft)
    await userEvent.keyboard('{Enter}')
    await settle()
    expect(m.q.getByRole('button', { name: 'Authored' })).toHaveFocus()
    expect(new FormData(m.form).get('title')).toBe('Authored')
  }
  expect(m.changed.mock.calls).toEqual([['First proposal'], ['Second proposal']])
  expect(m.committed.mock.calls).toEqual(m.changed.mock.calls)
})

test('a canceled native reset retains an active draft and its next Enter commit', async () => {
  const m = mount()
  await userEvent.click(m.q.getByRole('button', { name: 'Original' }))
  await userEvent.fill(m.input, 'Retained')
  m.form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(m.input).not.toHaveAttribute('hidden')
  expect(m.input).toHaveValue('Retained')
  expect(m.canceled).not.toHaveBeenCalled()
  await userEvent.click(m.input)
  await userEvent.keyboard('{Enter}')
  expect(m.committed).toHaveBeenCalledExactlyOnceWith('Retained')
})

test('a native reset abandons an active draft silently and starts a clean session', async () => {
  const m = mount()
  await userEvent.click(m.q.getByRole('button', { name: 'Original' }))
  await userEvent.fill(m.input, 'Discarded')
  m.editing.mockClear()
  await userEvent.click(m.q.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(m.input).toHaveAttribute('hidden')
  expect(new FormData(m.form).get('title')).toBe('Original')
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.committed).not.toHaveBeenCalled()
  expect(m.canceled).not.toHaveBeenCalled()
  expect(m.editing).not.toHaveBeenCalled()
  await userEvent.click(m.q.getByRole('button', { name: 'Original' }))
  expect(m.input).toHaveValue('Original')
})
