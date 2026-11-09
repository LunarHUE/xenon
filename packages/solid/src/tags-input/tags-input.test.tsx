import { Field } from '../field/field'
import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { TagsInput } from './tags-input'
import type { TagsInputProps } from './tags-input'
afterEach(() => {
  cleanup()
  flush()
})
const Demo = (props: TagsInputProps) => (
  <TagsInput {...props}>
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
)
test('insertion normalizes duplicates and empty Backspace selects then removes', async () => {
  const changed = vi.fn()
  const m = render(() => <Demo defaultValue={['alpha']} onValueChange={changed} />)
  flush()
  const input = m.getByRole('textbox', { name: 'Tags' })
  fireEvent.input(input, { target: { value: ' beta ' } })
  flush()
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(changed).toHaveBeenCalledWith(['alpha', 'beta'])
  expect(input).toHaveValue('')
  fireEvent.input(input, { target: { value: 'beta' } })
  flush()
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(changed).toHaveBeenCalledOnce()
  expect(input).toHaveValue('beta')
  fireEvent.input(input, { target: { value: '' } })
  flush()
  fireEvent.keyDown(input, { key: 'Backspace' })
  flush()
  const tag = m.container.querySelector('[data-value="beta"]')!
  expect(tag).toHaveFocus()
  expect(changed).toHaveBeenCalledOnce()
  fireEvent.keyDown(tag, { key: 'Backspace' })
  flush()
  await Promise.resolve()
  flush()
  expect(changed).toHaveBeenLastCalledWith(['alpha'])
})
test('literal paste splits without regex interpretation and respects IME/cancellation', () => {
  const changed = vi.fn()
  const m = render(() => <Demo delimiter="|" onValueChange={changed} />)
  flush()
  const input = m.getByRole('textbox', { name: 'Tags' })
  fireEvent.paste(input, { clipboardData: { getData: () => 'one|two' } })
  flush()
  expect(changed).toHaveBeenCalledWith(['one', 'two'])
  fireEvent.compositionStart(input)
  fireEvent.input(input, { target: { value: 'three|' }, isComposing: true })
  flush()
  expect(changed).toHaveBeenCalledOnce()
  fireEvent.compositionEnd(input)
  flush()
  expect(changed).toHaveBeenLastCalledWith(['one', 'two', 'three'])
})
test('controlled values remain fixed and inline edits are atomic', () => {
  const changed = vi.fn()
  const m = render(() => <Demo value={['alpha', 'beta']} onValueChange={changed} />)
  flush()
  const tag = m.container.querySelector('[data-value="alpha"]')!
  fireEvent.doubleClick(tag)
  flush()
  const editor = m.getByRole('textbox', { name: 'Edit alpha' })
  fireEvent.input(editor, { target: { value: 'beta' } })
  fireEvent.keyDown(editor, { key: 'Enter' })
  flush()
  expect(changed).not.toHaveBeenCalled()
  fireEvent.input(editor, { target: { value: 'gamma' } })
  fireEvent.keyDown(editor, { key: 'Enter' })
  flush()
  expect(changed).toHaveBeenCalledWith(['gamma', 'beta'])
  expect(m.container.querySelector('[data-value="alpha"]')).not.toBeNull()
})
test('native required and repeated submission entries reset silently', async () => {
  const changed = vi.fn()
  const m = render(() => (
    <form>
      <Demo required name="tags" onValueChange={changed} />
    </form>
  ))
  flush()
  const form = m.container.querySelector('form')!
  expect(form.checkValidity()).toBe(false)
  const input = m.getByRole('textbox', { name: 'Tags' })
  fireEvent.input(input, { target: { value: 'draft' } })
  flush()
  expect(form.checkValidity()).toBe(false)
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).getAll('tags')).toEqual(['draft'])
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(new FormData(form).getAll('tags')).toEqual([])
  expect(changed).toHaveBeenCalledOnce()
})

test('outer Field association survives the component field and readonly blocks changes', () => {
  const changed = vi.fn()
  const m = render(() => (
    <Field readonly>
      <Field.Label>Outer tags</Field.Label>
      <Field.Description>Help</Field.Description>
      <TagsInput defaultValue={['fixed']} onValueChange={changed}>
        <TagsInput.Input />
      </TagsInput>
    </Field>
  ))
  flush()
  const input = m.getByRole('textbox', { name: 'Outer tags' })
  expect(input).toHaveAttribute('readonly')
  expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Help')
  fireEvent.input(input, { target: { value: 'other' } })
  flush()
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(changed).not.toHaveBeenCalled()
})
test('author cancellation and addOnPaste=false keep delimiters in the draft', () => {
  const changed = vi.fn()
  const m = render(() => (
    <TagsInput addOnPaste={false} onValueChange={changed}>
      <TagsInput.Input aria-label="Tags" onKeyDown={(e) => e.preventDefault()} />
    </TagsInput>
  ))
  flush()
  const input = m.getByRole('textbox')
  fireEvent.input(input, { target: { value: 'one,two' }, inputType: 'insertFromPaste' })
  flush()
  expect(changed).not.toHaveBeenCalled()
  expect(input).toHaveValue('one,two')
  fireEvent.keyDown(input, { key: 'Enter' })
  flush()
  expect(changed).not.toHaveBeenCalled()
})

test('typing a delimiter commits the tags and clears the field without a stateful-write warning', () => {
  const change = vi.fn()
  const view = render(() => (
    <TagsInput defaultValue={[]} onValueChange={change} required>
      {(state) => (
        <TagsInput.Control>
          <TagsInput.Input aria-label="Tags" />
          <For each={state.value}>
            {(_, index) => (
              <TagsInput.Item index={index()}>
                <TagsInput.ItemText />
              </TagsInput.Item>
            )}
          </For>
        </TagsInput.Control>
      )}
    </TagsInput>
  ))
  const input = view.getByRole('textbox', { name: 'Tags' }) as HTMLInputElement
  fireEvent.input(input, { target: { value: 'one,two' } })
  flush()
  expect(change).toHaveBeenLastCalledWith(['one', 'two'])
  expect(input.value).toBe('')
  // `required` drops once tags exist, re-running the input's spread. The field
  // must already be empty, or Solid rewrites '' over the typed text and warns.
  expect(input).not.toBeRequired()
  // A rejected duplicate stays in the field as the new draft.
  fireEvent.input(input, { target: { value: 'one,three' } })
  flush()
  expect(change).toHaveBeenLastCalledWith(['one', 'two', 'three'])
  expect(input.value).toBe('one')
})
