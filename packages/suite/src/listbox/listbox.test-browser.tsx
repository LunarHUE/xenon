import { Listbox } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { spec } from '../spec'

/**
 * Mounts a listbox between two sibling buttons so native Tab order is observable,
 * and disposes the rendered tree after the current test.
 */
function mount(node: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <div>
        <button type="button">Before</button>
        {node()}
        <button type="button">After</button>
      </div>
    ),
    container
  )
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

spec('listbox.keyboard.2', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" defaultValue="banana" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  const before = view.getByRole('button', { name: 'Before' })
  const after = view.getByRole('button', { name: 'After' })
  expect(root).toHaveAttribute('tabindex', '-1')
  expect(banana).toHaveAttribute('tabindex', '0')
  expect(apple).toHaveAttribute('tabindex', '-1')

  // Native Tab reaches the selected option, not the container or an unselected sibling.
  before.focus()
  await userEvent.tab()
  await settle()
  expect(banana).toHaveFocus()
  expect(apple).not.toHaveFocus()
  expect(banana).toHaveAttribute('aria-selected', 'true')
  expect(change).not.toHaveBeenCalled()

  // The listbox is a single tab stop: the next Tab leaves it and Shift+Tab returns to it.
  await userEvent.tab()
  await settle()
  expect(after).toHaveFocus()
  await userEvent.tab({ shift: true })
  await settle()
  expect(banana).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
})

spec('listbox.keyboard.4', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      value={['cherry', 'apple']}
      onValueChange={change}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  const before = view.getByRole('button', { name: 'Before' })
  expect(cherry).toHaveAttribute('aria-selected', 'true')
  expect(apple).toHaveAttribute('tabindex', '0')
  expect(cherry).toHaveAttribute('tabindex', '-1')
  before.focus()

  // Entry lands on the first selected option in list order, not the first in value order.
  await userEvent.tab()
  await settle()
  expect(apple).toHaveFocus()
  expect(apple).toHaveAttribute('aria-selected', 'true')
  expect(cherry).toHaveAttribute('aria-selected', 'true')

  // Bare native navigation keeps both selections and moves the single tab stop with focus.
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(banana).toHaveFocus()
  expect(banana).toHaveAttribute('tabindex', '0')
  expect(banana).toHaveAttribute('aria-selected', 'false')
  expect(apple).toHaveAttribute('tabindex', '-1')
  expect(apple).toHaveAttribute('aria-selected', 'true')
  expect(change).not.toHaveBeenCalled()
})

spec('listbox.focus.2', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" virtualFocus onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })
  const before = view.getByRole('button', { name: 'Before' })
  const after = view.getByRole('button', { name: 'After' })
  expect(root).toHaveAttribute('tabindex', '0')
  expect(apple).toHaveAttribute('tabindex', '-1')
  expect(root).toHaveAttribute('aria-activedescendant', apple.id)

  // The container is the only tab stop, and native navigation never moves DOM focus off it.
  before.focus()
  await userEvent.tab()
  await settle()
  expect(root).toHaveFocus()
  expect(apple).not.toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(root).toHaveFocus()
  expect(root).toHaveAttribute('aria-activedescendant', banana.id)
  expect(banana).not.toHaveFocus()
  expect(banana).toHaveAttribute('tabindex', '-1')
  expect(banana).toHaveAttribute('data-highlighted', '')
  expect(banana).toHaveAttribute('aria-selected', 'false')
  expect(change).not.toHaveBeenCalled()

  // The active descendant resolves to a rendered option and Enter commits it.
  const referenced = root.getAttribute('aria-activedescendant')
  expect(referenced).not.toBeNull()
  expect(document.getElementById(referenced!)).toBe(banana)
  await userEvent.keyboard('{Home}')
  await settle()
  expect(root).toHaveAttribute('aria-activedescendant', apple.id)
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(root).toHaveFocus()
  expect(change).toHaveBeenCalledExactlyOnceWith('apple')
  expect(apple).toHaveAttribute('aria-selected', 'true')

  await userEvent.tab()
  await settle()
  expect(after).toHaveFocus()
})

test('clicking a virtual-focus option keeps an external focus owner', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" virtualFocus onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const apple = view.getByRole('option', { name: 'Apple' })
  const before = view.getByRole('button', { name: 'Before' })
  before.focus()
  await settle()

  // A real pointer press is canceled before it can steal the external focus owner's focus.
  await userEvent.click(apple)
  await settle()
  expect(before).toHaveFocus()
  expect(apple).not.toHaveFocus()
  expect(root).not.toHaveFocus()
  expect(change).toHaveBeenCalledExactlyOnceWith('apple')
  expect(apple).toHaveAttribute('aria-selected', 'true')
  expect(root).toHaveAttribute('aria-activedescendant', apple.id)
})

spec('listbox.pointer.6', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" selectionMode="multiple" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const banana = view.getByRole('option', { name: 'Banana' })

  // Each native click toggles one option; re-clicking drops it from the reported payload.
  await userEvent.click(apple)
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple'])
  expect(apple).toHaveAttribute('aria-selected', 'true')
  await userEvent.click(banana)
  await settle()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana'])
  await userEvent.click(apple)
  await settle()
  expect(change).toHaveBeenLastCalledWith(['banana'])
  expect(change).toHaveBeenCalledTimes(3)
  expect(apple).toHaveAttribute('aria-selected', 'false')
  expect(apple).not.toHaveAttribute('data-selected')
  expect(banana).toHaveAttribute('aria-selected', 'true')
})

spec('listbox.keyboard.11', async () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change} onActiveChange={active}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
      <Listbox.Item value="date" disabled>
        Date
      </Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  const date = view.getByRole('option', { name: 'Date' })
  apple.focus()
  await settle()

  // End stops at the last enabled option; a second End neither wraps nor re-reports.
  await userEvent.keyboard('{End}')
  await settle()
  expect(cherry).toHaveFocus()
  expect(cherry).toHaveAttribute('tabindex', '0')
  expect(date).toHaveAttribute('tabindex', '-1')
  expect(date).not.toHaveAttribute('data-highlighted')
  active.mockClear()
  await userEvent.keyboard('{End}')
  await settle()
  expect(cherry).toHaveFocus()
  expect(active).not.toHaveBeenCalled()

  // Home behaves the same at the first option.
  await userEvent.keyboard('{Home}')
  await settle()
  expect(apple).toHaveFocus()
  active.mockClear()
  await userEvent.keyboard('{Home}')
  await settle()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
})
