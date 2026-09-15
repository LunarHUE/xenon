import { TagsInput } from '@xenon/solid/tags-input'
import { render } from '@solidjs/web'
import { For, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

function mount({
  defaultValue = ['alpha', 'beta', 'gamma'],
  disabledIndex,
  onValueChange,
}: {
  defaultValue?: string[]
  disabledIndex?: number
  onValueChange?: (value: string[]) => void
} = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <TagsInput defaultValue={defaultValue} onValueChange={onValueChange}>
        {(state) => (
          <TagsInput.Control>
            <For each={state.value}>
              {(_, index) => (
                <TagsInput.Item index={index()} disabled={index() === disabledIndex}>
                  <TagsInput.ItemText />
                </TagsInput.Item>
              )}
            </For>
            <TagsInput.Input aria-label="Tags" />
          </TagsInput.Control>
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
  return {
    container,
    input: container.querySelector<HTMLInputElement>('input[aria-label="Tags"]')!,
  }
}

test('tags-input.keyboard.2 arrows walk tags, Home selects first, and End returns to input', async () => {
  const fixture = mount()
  const item = (value: string) => fixture.container.querySelector(`[data-value="${value}"]`)

  fixture.input.focus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(item('gamma')).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(item('beta')).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  expect(item('gamma')).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(item('alpha')).toHaveFocus()
  await userEvent.keyboard('{End}')
  expect(fixture.input).toHaveFocus()
})

test('tags-input.keyboard.6 Delete removes highlighted tag, returns to input, and ArrowLeft selects new last tag', async () => {
  const fixture = mount()
  const item = (value: string) => fixture.container.querySelector(`[data-value="${value}"]`)

  fixture.input.focus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(item('gamma')).toHaveFocus()
  await userEvent.keyboard('{Delete}')
  flush()
  await Promise.resolve()
  flush()
  expect(item('gamma')).toBeNull()
  expect(fixture.input).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  expect(item('beta')).toHaveFocus()
})

test('tags-input.keyboard.11 empty Enter is safe after deleting all tags and a new tag can be added', async () => {
  const fixture = mount({ defaultValue: ['alpha'] })

  fixture.input.focus()
  await userEvent.keyboard('{Backspace}')
  await userEvent.keyboard('{Backspace}')
  flush()
  await Promise.resolve()
  flush()
  expect(fixture.container.querySelectorAll('[data-part="item"]')).toHaveLength(0)
  await userEvent.keyboard('{Enter}')
  expect(fixture.container.querySelectorAll('[data-part="item"]')).toHaveLength(0)
  await userEvent.type(fixture.input, 'new-tag')
  await userEvent.keyboard('{Enter}')
  flush()
  expect(fixture.container.querySelector('[data-value="new-tag"]')).toBeInTheDocument()
  expect(fixture.input).toHaveFocus()
})

test('tags-input.keyboard.13 printable text from a focused tag moves to input and End reselects it', async () => {
  const fixture = mount({ defaultValue: ['alpha'] })
  const tag = fixture.container.querySelector<HTMLDivElement>('[data-value="alpha"]')!

  tag.focus()
  await userEvent.keyboard('x')
  expect(fixture.input).toHaveFocus()
  expect(fixture.input).toHaveValue('x')
  // Return to the tag before testing End's tag-to-input navigation.
  await userEvent.keyboard('{Home}{ArrowLeft}')
  expect(tag).toHaveFocus()
  await userEvent.keyboard('{End}')
  expect(fixture.input).toHaveFocus()
  expect(fixture.input).toHaveValue('x')
  expect(fixture.input.selectionStart).toBe(0)
  expect(fixture.input.selectionEnd).toBe(1)
})

test('tags-input.keyboard.15 repeated Backspace removes removable neighbor but never disabled tag', async () => {
  const changed = vi.fn()
  const fixture = mount({
    defaultValue: ['disabled', 'removable'],
    disabledIndex: 0,
    onValueChange: changed,
  })

  fixture.input.focus()
  await userEvent.keyboard('{Backspace}')
  expect(fixture.container.querySelector('[data-value="removable"]')).toHaveFocus()
  await userEvent.keyboard('{Backspace}')
  flush()
  await Promise.resolve()
  flush()
  expect(fixture.container.querySelector('[data-value="removable"]')).toBeNull()
  expect(fixture.container.querySelector('[data-value="disabled"]')).toHaveFocus()
  expect(changed).toHaveBeenCalledExactlyOnceWith(['disabled'])
  await userEvent.keyboard('{Backspace}{Backspace}')
  expect(fixture.container.querySelector('[data-value="disabled"]')).toBeInTheDocument()
  expect(changed).toHaveBeenCalledTimes(1)
})
