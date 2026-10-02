import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { createSignal, For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Checkbox } from '../checkbox/checkbox'
import { TagsInput } from '../tags-input/tags-input'

afterEach(() => {
  cleanup()
  flush()
})

async function settleReset() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
}

test('stopped reset restores current defaults across adapters without change requests', async () => {
  const [fallback, setFallback] = createSignal(['alpha'])
  const checked = vi.fn()
  const tags = vi.fn()
  const view = render(() => (
    <form>
      <Checkbox aria-label="Enabled" defaultChecked onCheckedChange={checked} />
      <TagsInput defaultValue={fallback()} name="tags" onValueChange={tags}>
        {(state) => (
          <TagsInput.Control>
            <For each={state.value}>
              {(_, index) => (
                <TagsInput.Item index={index()}>
                  <TagsInput.ItemText />
                </TagsInput.Item>
              )}
            </For>
            <TagsInput.Input aria-label="Tags" />
          </TagsInput.Control>
        )}
      </TagsInput>
    </form>
  ))
  flush()
  const form = view.container.querySelector('form')!
  const checkbox = view.getByRole('checkbox', { name: 'Enabled' })
  const input = view.getByRole('textbox', { name: 'Tags' })
  fireEvent.click(checkbox)
  fireEvent.input(input, { target: { value: 'beta' } })
  flush()
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(checkbox).toHaveAttribute('data-state', 'unchecked')
  expect(new FormData(form).getAll('tags')).toEqual(['alpha', 'beta'])
  setFallback(['current-default'])
  flush()
  form.addEventListener('reset', (event) => event.stopPropagation())
  form.reset()
  await settleReset()
  expect(checkbox).toBeChecked()
  expect(checkbox).toHaveAttribute('data-state', 'checked')
  expect(new FormData(form).getAll('tags')).toEqual(['current-default'])
  expect(view.getByText('current-default')).toBeInTheDocument()
  expect(checked).toHaveBeenCalledTimes(1)
  expect(tags).toHaveBeenCalledTimes(1)
})

test('stopped reset preserves controlled checked and tag values over defaults', async () => {
  const changed = vi.fn()
  const view = render(() => (
    <form>
      <Checkbox aria-label="Enabled" checked={false} defaultChecked onCheckedChange={changed} />
      <TagsInput
        value={['controlled']}
        defaultValue={['fallback']}
        name="tags"
        onValueChange={changed}
      >
        {(state) => (
          <>
            <span>{state.value.join(',')}</span>
            <TagsInput.Input aria-label="Tags" />
          </>
        )}
      </TagsInput>
    </form>
  ))
  flush()
  const form = view.container.querySelector('form')!
  form.addEventListener('reset', (event) => event.stopPropagation())
  form.reset()
  await settleReset()
  expect(view.getByRole('checkbox', { name: 'Enabled' })).not.toBeChecked()
  expect(view.getByRole('checkbox', { name: 'Enabled' })).toHaveAttribute('data-state', 'unchecked')
  expect(view.getByText('controlled')).toBeInTheDocument()
  expect(new FormData(form).getAll('tags')).toEqual(['controlled'])
  expect(changed).not.toHaveBeenCalled()
})
