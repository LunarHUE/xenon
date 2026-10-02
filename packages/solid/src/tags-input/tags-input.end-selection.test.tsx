import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { TagsInput } from './tags-input'

afterEach(() => {
  cleanup()
  flush()
})

test('End from a tag restores input focus and selects the retained draft without committing it', () => {
  const changed = vi.fn()
  const view = render(() => (
    <TagsInput defaultValue={['alpha']} onValueChange={changed}>
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
  ))
  flush()
  const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
  const tag = view.container.querySelector<HTMLElement>('[data-value="alpha"]')!
  input.focus()
  fireEvent.input(input, { target: { value: 'draft' } })
  flush()
  input.setSelectionRange(0, 0)
  fireEvent.keyDown(input, { key: 'ArrowLeft' })
  flush()
  expect(tag).toHaveFocus()
  expect(tag).toHaveAttribute('data-highlighted')
  fireEvent.keyDown(tag, { key: 'End' })
  flush()
  expect(input).toHaveFocus()
  expect(input).toHaveValue('draft')
  expect(input.selectionStart).toBe(0)
  expect(input.selectionEnd).toBe(5)
  expect(tag).not.toHaveAttribute('data-highlighted')
  expect(changed).not.toHaveBeenCalled()
})
