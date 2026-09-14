import { render, fireEvent, cleanup } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { TagsInput } from './tags-input'
afterEach(() => {
  cleanup()
  flush()
})

test('disabling an item during editing blocks its pending replacement', () => {
  const [disabled, setDisabled] = createSignal(false)
  const change = vi.fn()
  const m = render(() => (
    <TagsInput defaultValue={['alpha']} onValueChange={change}>
      <TagsInput.Item index={0} disabled={disabled()}>
        <TagsInput.ItemText />
        <TagsInput.ItemInput />
      </TagsInput.Item>
      <TagsInput.Input aria-label="Tags" />
    </TagsInput>
  ))
  flush()
  const tag = m.container.querySelector('[data-part="item"]')!
  fireEvent.doubleClick(tag)
  flush()
  const editor = m.getByRole('textbox', { name: 'Edit alpha' })
  setDisabled(true)
  flush()
  fireEvent.input(editor, { target: { value: 'replacement' } })
  fireEvent.keyDown(editor, { key: 'Enter' })
  flush()
  expect(change).not.toHaveBeenCalled()
})
test('readonly transition reaches the active per-tag native editor', () => {
  const [readonly, setReadonly] = createSignal(false)
  const m = render(() => (
    <TagsInput defaultValue={['alpha']} readonly={readonly()}>
      <TagsInput.Item index={0}>
        <TagsInput.ItemText />
        <TagsInput.ItemInput />
      </TagsInput.Item>
      <TagsInput.Input aria-label="Tags" />
    </TagsInput>
  ))
  flush()
  fireEvent.doubleClick(m.container.querySelector('[data-part="item"]')!)
  flush()
  const editor = m.getByRole('textbox', { name: 'Edit alpha' })
  setReadonly(true)
  flush()
  expect(editor).toHaveAttribute('readonly')
})
