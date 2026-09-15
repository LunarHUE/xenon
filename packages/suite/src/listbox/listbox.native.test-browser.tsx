import { Listbox } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { spec } from '../spec'

/**
 * Renders a listbox into a fresh body container and disposes it after the current
 * test, so real pointer and focus input always starts from a clean document.
 * The factory is invoked during rendering so Solid context reaches the options.
 */
function mount(node: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(node, container)
  onTestFinished(() => {
    dispose()
    flush()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}

/** Flushes Solid and one animation frame so native focus and layout work has settled. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

spec('listbox.rtl.1', async () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      orientation="horizontal"
      dir="rtl"
      loop={false}
      onValueChange={change}
      onActiveChange={active}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  expect(root).toHaveAttribute('aria-orientation', 'horizontal')
  expect(root).toHaveAttribute('dir', 'rtl')
  expect(apple).toHaveAttribute('tabindex', '0')

  // In RTL the next option is Left Arrow and the previous is Right Arrow.
  apple.focus()
  await settle()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(banana).toHaveFocus()
  expect(banana).toHaveAttribute('tabindex', '0')
  expect(apple).toHaveAttribute('tabindex', '-1')
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(cherry).toHaveFocus()

  // Looping is disabled, so the forward end clamps instead of wrapping to the first option.
  active.mockClear()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(cherry).toHaveFocus()
  expect(active).not.toHaveBeenCalled()

  // Right Arrow walks back and the backward end clamps at the first option.
  await userEvent.keyboard('{ArrowRight}{ArrowRight}')
  await settle()
  expect(apple).toHaveFocus()
  active.mockClear()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()

  // A vertical key is outside the horizontal axis and leaves focus and selection alone.
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(apple).toHaveFocus()

  expect(change).not.toHaveBeenCalled()
  expect(apple).toHaveAttribute('aria-selected', 'false')
})

spec('listbox.keyboard.37', async () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      onValueChange={change}
      onActiveChange={active}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  apple.focus()
  await settle()

  // Shift+Up at the first option clamps: nothing moves and no range is reported.
  active.mockClear()
  await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
  await settle()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()

  // Ordinary navigation still wraps, so the clamp above belongs to range extension.
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(cherry).toHaveFocus()
  expect(cherry).toHaveAttribute('aria-selected', 'false')

  // Shift+Down at the last option clamps the same way instead of wrapping.
  active.mockClear()
  await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
  await settle()
  expect(cherry).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  expect(view.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0)
})

test('native shift-arrow extends and walks back the inclusive range over disabled options', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" selectionMode="multiple" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="blocked" disabled>
        Unavailable
      </Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
      <Listbox.Item value="date">Date</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  const blocked = view.getByRole('option', { name: 'Unavailable' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  const date = view.getByRole('option', { name: 'Date' })

  // A plain click fixes the anchor together with the initial selection.
  await userEvent.click(apple)
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple'])

  // Shift+Down extends from the anchor and steps over the disabled option.
  await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana'])
  expect(banana).toHaveFocus()
  await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana', 'cherry'])
  expect(cherry).toHaveFocus()
  expect(blocked).toHaveAttribute('aria-selected', 'false')
  await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana', 'cherry', 'date'])
  expect(date).toHaveFocus()

  // Shift+Up walks the trailing edge back while the anchor stays at the first option.
  await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana', 'cherry'])
  expect(cherry).toHaveFocus()
  expect(date).toHaveAttribute('aria-selected', 'false')
})

test('native clicks on nested option text focus and commit the owning option once', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change}>
      <Listbox.Item value="apple">
        <span>Apple label</span>
      </Listbox.Item>
      <Listbox.Item value="banana">
        <span>Banana label</span>
      </Listbox.Item>
      <Listbox.Item value="cherry">
        <span>Cherry label</span>
      </Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple label' })
  const banana = view.getByRole('option', { name: 'Banana label' })
  const cherry = view.getByRole('option', { name: 'Cherry label' })

  // The press lands on the nested text; the owning option takes focus and commits once.
  await userEvent.click(view.getByText('Banana label'))
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith('banana')
  expect(banana).toHaveFocus()
  expect(banana).toHaveAttribute('aria-selected', 'true')
  expect(banana).toHaveAttribute('tabindex', '0')
  expect(apple).toHaveAttribute('tabindex', '-1')
  expect(apple).toHaveAttribute('aria-selected', 'false')
  expect(view.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)

  // Keyboard navigation continues from the owning option, not the nested text.
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(cherry).toHaveFocus()
  expect(cherry).toHaveAttribute('aria-selected', 'false')
  expect(change).toHaveBeenCalledTimes(1)
})

test('author-canceled native navigation and click leave the selection unchanged', async () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change} onActiveChange={active}>
      <Listbox.Item value="apple" onKeyDown={(event) => event.preventDefault()}>
        Apple
      </Listbox.Item>
      <Listbox.Item value="banana" onClick={(event) => event.preventDefault()}>
        Banana
      </Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  const cherry = view.getByRole('option', { name: 'Cherry' })

  // The author handler claims the key before core navigation can move focus.
  apple.focus()
  await settle()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()

  // A canceled click neither selects the option nor reports a change.
  await userEvent.click(banana)
  await settle()
  expect(change).not.toHaveBeenCalled()
  expect(banana).toHaveAttribute('aria-selected', 'false')

  // An unmodified click still commits exactly once.
  await userEvent.click(cherry)
  await settle()
  expect(change).toHaveBeenCalledExactlyOnceWith('cherry')
  expect(cherry).toHaveAttribute('aria-selected', 'true')
  expect(banana).toHaveAttribute('aria-selected', 'false')
})

test('alt-modified native arrow keys neither navigate nor claim the key', async () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change} onActiveChange={active}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
    </Listbox>
  ))
  const claimed: boolean[] = []
  const watch = (event: Event) => {
    if ((event as KeyboardEvent).key === 'ArrowDown') claimed.push(event.defaultPrevented)
  }
  // Added after mount, so this observes the state left by the delegated handlers.
  document.addEventListener('keydown', watch)
  onTestFinished(() => document.removeEventListener('keydown', watch))

  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  apple.focus()
  await settle()
  await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
  await settle()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  expect(claimed).toEqual([false])

  // Without the modifier the same key navigates, so the guard is the modifier.
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(banana).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})
