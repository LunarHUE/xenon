import { TagsInput } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { For, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { fireEvent } from '@testing-library/dom'
import { expectNoViolations } from '../a11y'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mount(defaultValue = ['alpha', 'beta']) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <TagsInput defaultValue={defaultValue}>
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
          </>
        )}
      </TagsInput>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return container
}

test('tags-input.a11y.1 default tags fixture has no scoped axe violations', async () => {
  const container = mount()
  await expectNoViolations(container)
})

test('tags-input.roles.6 per-tag editors are hidden, untabbable, and named for their tag', () => {
  const container = mount()
  const editors = [...container.querySelectorAll<HTMLInputElement>('input[aria-label^="Edit "]')]
  expect(editors).toHaveLength(2)
  expect(editors.map((editor) => editor.getAttribute('aria-label'))).toEqual([
    'Edit alpha',
    'Edit beta',
  ])
  expect(editors.every((editor) => editor.hidden)).toBe(true)
  expect(editors.every((editor) => editor.getAttribute('tabindex') === '-1')).toBe(true)

  fireEvent.doubleClick(container.querySelector('[data-value="beta"]')!)
  flush()
  expect(editors[0]).toHaveAttribute('hidden')
  expect(editors[1]).not.toHaveAttribute('hidden')
  expect(editors[1]).toHaveFocus()
})

test('tags-input.roles.12 names ItemText parts and keeps the accepted plain-element collection anatomy', () => {
  const container = mount()
  const itemText = [...container.querySelectorAll('[data-part="item-text"]')]
  expect(itemText).toHaveLength(2)
  expect(itemText.map((text) => text.textContent)).toEqual(['alpha', 'beta'])
  expect(container.querySelector('[role="listbox"]')).toBeNull()
  expect(container.querySelector('[role="option"]')).toBeNull()
})

test('tags-input.state.1 renders one exact text item per default tag', () => {
  const container = mount(['one', 'two', 'three'])
  const items = [...container.querySelectorAll('[data-part="item"]')]
  expect(items).toHaveLength(3)
  expect(items.map((item) => item.textContent?.replace('Remove', '').trim())).toEqual([
    'one',
    'two',
    'three',
  ])
})
