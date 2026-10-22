import { render } from '@solidjs/web'
import { TagsInput } from '@xenon-ui/solid/tags-input'
import { within } from '@testing-library/dom'
import { createSignal, For, flush } from 'solid-js'
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
  const [readonly, setReadonly] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const changed = vi.fn()
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <form>
        <TagsInput
          name="tags"
          defaultValue={['alpha', 'beta']}
          value={controlled ? ['alpha', 'beta'] : undefined}
          readonly={readonly()}
          disabled={disabled()}
          onValueChange={changed}
        >
          {(state) => (
            <TagsInput.Control>
              <For each={state.value}>
                {(_, index) => (
                  <TagsInput.Item index={index()}>
                    <TagsInput.ItemText />
                    <TagsInput.ItemInput />
                    <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
                  </TagsInput.Item>
                )}
              </For>
              <TagsInput.Input aria-label="Tags" />
            </TagsInput.Control>
          )}
        </TagsInput>
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
  const q = within(host)
  return {
    q,
    input: q.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement,
    form: host.querySelector('form')!,
    changed,
    setReadonly,
    setDisabled,
  }
}

test('reset clears the main draft and a following Enter cannot insert the abandoned text', async () => {
  const m = mount()
  await userEvent.fill(m.input, 'abandoned')
  m.form.reset()
  await settle()
  expect(m.input).toHaveValue('')
  expect(new FormData(m.form).getAll('tags')).toEqual(['alpha', 'beta'])
  await userEvent.keyboard('{Enter}')
  expect(m.changed).not.toHaveBeenCalled()
  await userEvent.type(m.input, 'gamma')
  await userEvent.keyboard('{Enter}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
})

test('reset while a tag editor is active discards its replacement and permits a fresh edit', async () => {
  const m = mount()
  await userEvent.click(m.input)
  await userEvent.keyboard('{ArrowLeft}{Enter}')
  const editor = m.q.getByRole('textbox', { name: 'Edit beta' })
  await userEvent.fill(editor, 'discarded')
  m.form.reset()
  await settle()
  expect(editor).toHaveAttribute('hidden')
  expect(new FormData(m.form).getAll('tags')).toEqual(['alpha', 'beta'])
  expect(m.changed).not.toHaveBeenCalled()
  await userEvent.click(m.input)
  await userEvent.keyboard('{ArrowLeft}{Enter}')
  expect(m.q.getByRole('textbox', { name: 'Edit beta' })).toHaveValue('beta')
  await userEvent.keyboard('fresh{Enter}')
  expect(new FormData(m.form).getAll('tags')).toEqual(['alpha', 'fresh'])
})

test('a canceled reset keeps the tag editor draft for the next native Enter', async () => {
  const m = mount()
  await userEvent.click(m.input)
  await userEvent.keyboard('{ArrowLeft}{Enter}')
  const editor = m.q.getByRole('textbox', { name: 'Edit beta' })
  await userEvent.fill(editor, 'retained')
  m.form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
  m.form.reset()
  await settle()
  expect(editor).toHaveFocus()
  expect(editor).toHaveValue('retained')
  await userEvent.keyboard('{Enter}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'retained'])
  expect(m.input).toHaveFocus()
})

test('readonly applied to a main draft blocks Enter and resumes the pending addition on unlock', async () => {
  const m = mount()
  await userEvent.fill(m.input, 'gamma')
  m.setReadonly(true)
  await settle()
  await userEvent.click(m.input)
  await userEvent.keyboard('{Enter}')
  expect(m.input).toHaveValue('gamma')
  expect(m.changed).not.toHaveBeenCalled()
  m.setReadonly(false)
  await settle()
  await userEvent.keyboard('{Enter}')
  expect(m.input).toHaveValue('')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
})

test('disabled transitions exclude every tag then restore the collection and pending main draft', async () => {
  const m = mount()
  await userEvent.fill(m.input, 'gamma')
  m.setDisabled(true)
  await settle()
  expect(m.input).toBeDisabled()
  expect(new FormData(m.form).getAll('tags')).toEqual([])
  m.setDisabled(false)
  await settle()
  expect(new FormData(m.form).getAll('tags')).toEqual(['alpha', 'beta'])
  expect(m.input).toHaveValue('gamma')
  await userEvent.click(m.input)
  await userEvent.keyboard('{Enter}')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta', 'gamma'])
})

test('rejected controlled tag replacements close the editor and reopen with the authored text', async () => {
  const m = mount(true)
  for (const replacement of ['first', 'second']) {
    await userEvent.click(m.input)
    await userEvent.keyboard('{ArrowLeft}{Enter}')
    const editor = m.q.getByRole('textbox', { name: 'Edit beta' })
    expect(editor).toHaveValue('beta')
    await userEvent.fill(editor, replacement)
    await userEvent.keyboard('{Enter}')
    expect(m.input).toHaveFocus()
    expect(editor).toHaveAttribute('hidden')
    expect(new FormData(m.form).getAll('tags')).toEqual(['alpha', 'beta'])
  }
  expect(m.changed.mock.calls).toEqual([[['alpha', 'first']], [['alpha', 'second']]])
})
