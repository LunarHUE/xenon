import { Listbox } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, expect, onTestFinished, test, vi } from 'vitest'

import { spec } from '../spec'

/**
 * Renders a listbox into a fresh body container and disposes it after the current test.
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

/** Flushes Solid and the microtask queue that delivers child-list mutation records. */
async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

afterEach(() => {
  vi.useRealTimers()
})

spec('listbox.keyboard.21', () => {
  vi.useFakeTimers()
  const change = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
      <Listbox.Item value="plum">Plum</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const pear = view.getByRole('option', { name: 'Pear' })
  apple.focus()
  flush()
  fireEvent.keyDown(apple, { key: 'p' })
  flush()
  expect(pear).toHaveFocus()

  // The in-flight query accepts the space instead of activating the focused option.
  fireEvent.keyDown(pear, { key: ' ' })
  flush()
  expect(pear).toHaveFocus()
  expect(pear).toHaveAttribute('aria-selected', 'false')
  expect(change).not.toHaveBeenCalled()

  // Once the 700 ms buffer expires, Space commits the focused option exactly once.
  vi.advanceTimersByTime(700)
  flush()
  fireEvent.keyDown(pear, { key: ' ' })
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith('pear')
  expect(pear).toHaveAttribute('aria-selected', 'true')

  // A further Space neither clears the committed value nor reports a second change.
  fireEvent.keyDown(pear, { key: ' ' })
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(pear).toHaveAttribute('aria-selected', 'true')
})

test('alt-modified and composing characters never search or move', () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change} onActiveChange={active}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const pear = view.getByRole('option', { name: 'Pear' })
  apple.focus()
  flush()
  fireEvent.keyDown(apple, { key: 'p', altKey: true })
  fireEvent.keyDown(apple, { key: 'p', isComposing: true })
  flush()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()

  // Neither key entered the buffer, so the next plain character still starts a fresh query.
  fireEvent.keyDown(apple, { key: 'p' })
  flush()
  expect(pear).toHaveFocus()
  expect(active).toHaveBeenCalledExactlyOnceWith('pear')
  expect(pear).toHaveAttribute('aria-selected', 'false')
})

spec('listbox.keyboard.42', () => {
  const change = vi.fn()
  const active = vi.fn()
  const single = mount(() => (
    <Listbox aria-label="Fruit" onValueChange={change} onActiveChange={active}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="banana">Banana</Listbox.Item>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const apple = single.getByRole('option', { name: 'Apple' })
  apple.focus()
  flush()
  fireEvent.keyDown(apple, { key: 'a', ctrlKey: true })
  flush()
  expect(apple).toHaveFocus()
  expect(single.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0)
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()

  // Read-only multiple selection refuses select-all as well, keeping its selection intact.
  const readonlyChange = vi.fn()
  const readonly = mount(() => (
    <Listbox
      aria-label="Readonly fruit"
      selectionMode="multiple"
      readonly
      defaultValue={['apple']}
      onValueChange={readonlyChange}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const pear = readonly.getByRole('option', { name: 'Pear' })
  pear.focus()
  flush()
  fireEvent.keyDown(pear, { key: 'a', ctrlKey: true })
  flush()
  expect(readonlyChange).not.toHaveBeenCalled()
  expect(readonly.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  expect(pear).toHaveAttribute('aria-selected', 'false')
})

spec('listbox.pointer.3', () => {
  const change = vi.fn()
  const active = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      defaultValue={['apple']}
      onValueChange={change}
      onActiveChange={active}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="blocked" disabled>
        Unavailable
      </Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const blocked = view.getByRole('option', { name: 'Unavailable' })
  const pear = view.getByRole('option', { name: 'Pear' })
  fireEvent.click(blocked)
  flush()
  expect(change).not.toHaveBeenCalled()
  expect(active).not.toHaveBeenCalled()
  expect(apple).toHaveAttribute('aria-selected', 'true')
  expect(apple).toHaveAttribute('data-highlighted', '')
  expect(blocked).toHaveAttribute('aria-selected', 'false')
  expect(blocked).toHaveAttribute('data-disabled', '')
  expect(blocked).not.toHaveAttribute('data-selected')
  expect(blocked).not.toHaveAttribute('data-highlighted')
  expect(pear).toHaveAttribute('aria-selected', 'false')
})

test('shift-click replaces the selection with the inclusive anchor range', () => {
  const change = vi.fn()
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      defaultActiveValue="apple"
      onValueChange={change}
    >
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
  const date = view.getByRole('option', { name: 'Date' })
  fireEvent.click(apple)
  flush()
  expect(change).toHaveBeenLastCalledWith(['apple'])

  // The range spans the anchor and the clicked option and steps over the disabled one.
  fireEvent.click(date, { shiftKey: true })
  flush()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana', 'cherry', 'date'])
  expect(blocked).toHaveAttribute('aria-selected', 'false')

  // Shrinking the range overwrites the wider membership instead of merging with it.
  fireEvent.click(banana, { shiftKey: true })
  flush()
  expect(change).toHaveBeenLastCalledWith(['apple', 'banana'])
  expect(view.getByRole('option', { name: 'Cherry' })).toHaveAttribute('aria-selected', 'false')
})

spec('listbox.keyboard.27', () => {
  const change = vi.fn()
  const active = vi.fn()
  const [off, setOff] = createSignal<readonly string[]>(['banana', 'cherry'])
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      defaultActiveValue="apple"
      onValueChange={change}
      onActiveChange={active}
    >
      <Listbox.Item value="apple" disabled={off().includes('apple')}>
        Apple
      </Listbox.Item>
      <Listbox.Item value="banana" disabled={off().includes('banana')}>
        Banana
      </Listbox.Item>
      <Listbox.Item value="cherry" disabled={off().includes('cherry')}>
        Cherry
      </Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const apple = view.getByRole('option', { name: 'Apple' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  expect(apple).toHaveAttribute('tabindex', '0')
  apple.focus()
  flush()

  // A single navigable option keeps focus and the tab stop where they are on both arrows.
  fireEvent.keyDown(apple, { key: 'ArrowDown' })
  fireEvent.keyDown(apple, { key: 'ArrowUp' })
  flush()
  expect(apple).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()

  // Enabling a later option lets the arrow step over the disabled one in between.
  setOff(['banana'])
  flush()
  expect(view.getByRole('option', { name: 'Banana' })).toHaveAttribute('tabindex', '-1')
  fireEvent.keyDown(apple, { key: 'ArrowDown' })
  flush()
  expect(cherry).toHaveFocus()
  expect(active).toHaveBeenCalledExactlyOnceWith('cherry')
  expect(change).not.toHaveBeenCalled()

  // With every option excluded the root itself is the only tab stop and stays inert.
  setOff(['apple', 'banana', 'cherry'])
  flush()
  expect(root).toHaveAttribute('tabindex', '0')
  expect(apple).toHaveAttribute('tabindex', '-1')
  active.mockClear()
  root.focus()
  fireEvent.keyDown(root, { key: 'Home' })
  fireEvent.keyDown(root, { key: 'End' })
  fireEvent.keyDown(root, { key: 'Enter' })
  fireEvent.keyDown(root, { key: ' ' })
  flush()
  expect(root).toHaveFocus()
  expect(active).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  expect(view.container.querySelectorAll('[aria-selected="true"]')).toHaveLength(0)
})

test('removing the roving active option moves the tab stop and skips it', async () => {
  const change = vi.fn()
  const [show, setShow] = createSignal(true)
  const view = mount(() => (
    <Listbox aria-label="Fruit" defaultActiveValue="banana" onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Show when={show()}>
        <Listbox.Item value="banana">Banana</Listbox.Item>
      </Show>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
    </Listbox>
  ))
  const root = view.getByRole('listbox')
  const apple = view.getByRole('option', { name: 'Apple' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  expect(view.getByRole('option', { name: 'Banana' })).toHaveAttribute('tabindex', '0')
  expect(root).toHaveAttribute('tabindex', '-1')

  setShow(false)
  await settle()
  expect(view.queryByRole('option', { name: 'Banana' })).toBeNull()
  expect(apple).toHaveAttribute('tabindex', '0')
  expect(cherry).toHaveAttribute('tabindex', '-1')
  expect(root).toHaveAttribute('tabindex', '-1')

  fireEvent.keyDown(apple, { key: 'ArrowDown' })
  flush()
  expect(cherry).toHaveFocus()
  expect(cherry).toHaveAttribute('tabindex', '0')
  expect(apple).toHaveAttribute('tabindex', '-1')
  expect(change).not.toHaveBeenCalled()
})

test('a removed shift anchor falls back to the active option', async () => {
  const change = vi.fn()
  const [show, setShow] = createSignal(true)
  const view = mount(() => (
    <Listbox
      aria-label="Fruit"
      selectionMode="multiple"
      defaultActiveValue="apple"
      onValueChange={change}
    >
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Show when={show()}>
        <Listbox.Item value="banana">Banana</Listbox.Item>
      </Show>
      <Listbox.Item value="cherry">Cherry</Listbox.Item>
      <Listbox.Item value="date">Date</Listbox.Item>
    </Listbox>
  ))
  const banana = view.getByRole('option', { name: 'Banana' })
  const cherry = view.getByRole('option', { name: 'Cherry' })
  const date = view.getByRole('option', { name: 'Date' })
  fireEvent.click(banana)
  flush()
  expect(change).toHaveBeenLastCalledWith(['banana'])
  fireEvent.keyDown(banana, { key: 'ArrowDown', shiftKey: true })
  flush()
  expect(change).toHaveBeenLastCalledWith(['banana', 'cherry'])

  // The anchored option leaves the collection; the next range anchors at the active option.
  setShow(false)
  await settle()
  expect(view.queryByRole('option', { name: 'Banana' })).toBeNull()
  fireEvent.keyDown(cherry, { key: 'ArrowDown', shiftKey: true })
  flush()
  expect(change).toHaveBeenLastCalledWith(['cherry', 'date'])

  // The repaired anchor keeps shrinking the range rather than extending from the removed value.
  fireEvent.keyDown(date, { key: 'ArrowUp', shiftKey: true })
  flush()
  expect(change).toHaveBeenLastCalledWith(['cherry'])
})

test('controlled single selection follows external value changes without emitting a callback', () => {
  const change = vi.fn()
  const [value, setValue] = createSignal('apple')
  const view = mount(() => (
    <Listbox aria-label="Fruit" value={value()} onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const apple = view.getByRole('option', { name: 'Apple' })
  const pear = view.getByRole('option', { name: 'Pear' })
  expect(apple).toHaveAttribute('aria-selected', 'true')
  setValue('pear')
  flush()
  expect(apple).toHaveAttribute('aria-selected', 'false')
  expect(pear).toHaveAttribute('aria-selected', 'true')
  expect(change).not.toHaveBeenCalled()
})

test('controlled multiple selection rejects a user proposal until the owner updates it', () => {
  const change = vi.fn()
  const [value, setValue] = createSignal<readonly string[]>(['apple'])
  const view = mount(() => (
    <Listbox aria-label="Fruit" selectionMode="multiple" value={value()} onValueChange={change}>
      <Listbox.Item value="apple">Apple</Listbox.Item>
      <Listbox.Item value="pear">Pear</Listbox.Item>
    </Listbox>
  ))
  const pear = view.getByRole('option', { name: 'Pear' })
  fireEvent.click(pear)
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(['apple', 'pear'])
  expect(view.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  expect(pear).toHaveAttribute('aria-selected', 'false')
  setValue(['apple', 'pear'])
  flush()
  expect(change).toHaveBeenCalledTimes(1)
  expect(view.getByRole('option', { name: 'Pear' })).toBe(pear)
  expect(view.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true')
  expect(pear).toHaveAttribute('aria-selected', 'true')
})
