import { TagsInput } from '@xenon/solid/tags-input'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
let dispose: (() => void) | undefined
let container: HTMLDivElement
afterEach(() => {
  dispose?.()
  container?.remove()
  flush()
})
function mount() {
  container = document.createElement('div')
  document.body.append(container)
  dispose = render(
    () => (
      <form>
        <TagsInput name="tags" required defaultValue={['alpha', 'beta']}>
          {(state) => (
            <>
              <TagsInput.Label>Tags</TagsInput.Label>
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
                <TagsInput.Input />
              </TagsInput.Control>
              <TagsInput.ClearTrigger>Clear</TagsInput.ClearTrigger>
            </>
          )}
        </TagsInput>
        <button type="button">Outside</button>
      </form>
    ),
    container
  )
  flush()
  return within(container)
}
test('native arrows and Backspace select then remove tags and retain real DOM focus', async () => {
  const q = mount(),
    input = q.getByRole('textbox', { name: 'Tags' })
  await userEvent.click(input)
  await userEvent.keyboard('{Backspace}')
  flush()
  expect(container.querySelector('[data-value="beta"]')).toHaveFocus()
  await userEvent.keyboard('{Backspace}')
  flush()
  await Promise.resolve()
  flush()
  expect(container.querySelector('[data-value="beta"]')).toBeNull()
  expect(container.querySelector('[data-value="alpha"]')).toHaveFocus()
  await userEvent.keyboard('{End}')
  flush()
  expect(input).toHaveFocus()
  await userEvent.type(input, 'gamma')
  await userEvent.keyboard('{Enter}')
  flush()
  expect(input).toHaveValue('')
  expect(input).toHaveFocus()
  expect(new FormData(container.querySelector('form')!).getAll('tags')).toEqual(['alpha', 'gamma'])
})
test('inline tag edit focuses after revealing input and Enter commits a replacement', async () => {
  const q = mount(),
    input = q.getByRole('textbox', { name: 'Tags' })
  await userEvent.click(input)
  await userEvent.keyboard('{ArrowLeft}{Enter}')
  flush()
  const editor = q.getByRole('textbox', { name: 'Edit beta' })
  expect(editor).toHaveFocus()
  await userEvent.fill(editor, 'updated')
  await userEvent.keyboard('{Enter}')
  flush()
  expect(input).toHaveFocus()
  expect(container.querySelector('[data-value="updated"]')).not.toBeNull()
  await userEvent.click(q.getByRole('button', { name: 'Clear tags' }))
  flush()
  expect(container.querySelector('form')!.checkValidity()).toBe(false)
})
