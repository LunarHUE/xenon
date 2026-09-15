import { TagsInput } from '@xenon/solid/tags-input'
import type { TagsInputProps } from '@xenon/solid/tags-input'
import { render } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
function mount(props: TagsInputProps = {}) {
  const root = document.createElement('div')
  document.body.append(root)
  const dispose = render(
    () => (
      <TagsInput {...props}>
        {(state) => (
          <>
            <TagsInput.Label>Tags</TagsInput.Label>
            <TagsInput.Control>
              <For each={state.value}>
                {(_, i) => (
                  <TagsInput.Item index={i()}>
                    <TagsInput.ItemText />
                  </TagsInput.Item>
                )}
              </For>
              <TagsInput.Input />
            </TagsInput.Control>
            <TagsInput.ClearTrigger>Clear</TagsInput.ClearTrigger>
          </>
        )}
      </TagsInput>
    ),
    root
  )
  cleanups.push(() => {
    dispose()
    root.remove()
  })
  flush()
  return { root, input: within(root).getByRole('textbox') }
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('rejects a duplicate draft while allowing the user to correct and resubmit it', () => {
  const change = vi.fn()
  const m = mount({ defaultValue: ['alpha'], onValueChange: change })
  fireEvent.input(m.input, { target: { value: 'alpha' } })
  flush()
  fireEvent.keyDown(m.input, { key: 'Enter' })
  flush()
  expect(change).not.toHaveBeenCalled()
  expect(m.input).toHaveValue('alpha')
  fireEvent.input(m.input, { target: { value: 'beta' } })
  flush()
  fireEvent.keyDown(m.input, { key: 'Enter' })
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(['alpha', 'beta'])
})

test('clear trigger empties the collection but remains silent when already empty', () => {
  const change = vi.fn()
  const m = mount({ defaultValue: ['alpha'], onValueChange: change })
  const clear = within(m.root).getByRole('button', { name: 'Clear tags' })
  expect(m.root.querySelectorAll('[data-part="item"]')).toHaveLength(1)
  fireEvent.click(clear)
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith([])
  fireEvent.click(clear)
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(m.root.querySelectorAll('[data-part="item"]')).toHaveLength(0)
})
