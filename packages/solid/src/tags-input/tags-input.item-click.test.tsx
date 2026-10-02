import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { TagsInput } from './tags-input'

afterEach(() => {
  cleanup()
  flush()
})

function mount(cancelClick = false) {
  const changed = vi.fn()
  const view = render(() => (
    <TagsInput defaultValue={['alpha']} onValueChange={changed}>
      {(state) => (
        <TagsInput.Control>
          <For each={state.value}>
            {(value, index) => (
              <TagsInput.Item
                index={index()}
                onClick={cancelClick ? (event) => event.preventDefault() : undefined}
              >
                <TagsInput.ItemText>
                  <span>{value}</span>
                  <a href="#tag-details">Details</a>
                  <button type="button">Tag action</button>
                </TagsInput.ItemText>
                <TagsInput.ItemInput />
                <TagsInput.ItemDeleteTrigger>Remove</TagsInput.ItemDeleteTrigger>
              </TagsInput.Item>
            )}
          </For>
          <TagsInput.Input aria-label="Tags" />
        </TagsInput.Control>
      )}
    </TagsInput>
  ))
  flush()
  return {
    ...view,
    changed,
    input: view.getByRole('textbox', { name: 'Tags' }),
    tag: view.container.querySelector<HTMLElement>('[data-value="alpha"]')!,
  }
}

test('clicking nested tag text focuses and highlights its host without changing values', () => {
  const view = mount()
  view.input.focus()
  fireEvent.click(view.getByText('alpha', { selector: 'span span' }))
  flush()
  expect(view.tag).toHaveFocus()
  expect(view.tag).toHaveAttribute('data-highlighted')
  expect(view.changed).not.toHaveBeenCalled()
})

test('clicking an open tag editor keeps editor focus rather than focusing its host', async () => {
  const view = mount()
  view.tag.focus()
  fireEvent.keyDown(view.tag, { key: 'Enter' })
  flush()
  await Promise.resolve()
  flush()
  const editor = view.getByRole('textbox', { name: 'Edit alpha' })
  expect(editor).toHaveFocus()
  fireEvent.click(editor)
  flush()
  expect(editor).toHaveFocus()
  expect(editor).not.toHaveAttribute('hidden')
  expect(view.changed).not.toHaveBeenCalled()
})

for (const role of ['link', 'button'] as const) {
  test(`clicking an authored ${role} inside ItemText preserves its focus`, () => {
    const view = mount()
    const control = view.getByRole(role, { name: role === 'link' ? 'Details' : 'Tag action' })
    control.focus()
    fireEvent.click(control)
    flush()
    expect(control).toHaveFocus()
    expect(view.tag).not.toHaveAttribute('data-highlighted')
    expect(view.changed).not.toHaveBeenCalled()
  })
}

test('author preventDefault cancels the tag-text focus action', () => {
  const view = mount(true)
  view.input.focus()
  fireEvent.click(view.getByText('alpha', { selector: 'span span' }))
  flush()
  expect(view.input).toHaveFocus()
  expect(view.tag).not.toHaveAttribute('data-highlighted')
})

test('clicking remove deletes once and returns to input without refocusing the removed tag', async () => {
  const view = mount()
  const remove = view.getByRole('button', { name: 'Remove alpha' })
  remove.focus()
  fireEvent.click(remove)
  flush()
  await Promise.resolve()
  flush()
  expect(view.container.querySelector('[data-part="item"]')).toBeNull()
  expect(view.input).toHaveFocus()
  expect(view.changed).toHaveBeenCalledExactlyOnceWith([])
})
