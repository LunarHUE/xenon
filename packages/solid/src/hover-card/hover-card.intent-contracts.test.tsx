import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { HoverCard } from './hover-card'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  flush()
  vi.useRealTimers()
})
function tick(ms: number) {
  vi.advanceTimersByTime(ms)
  flush()
}
function pointer(node: Element, type: 'pointerenter' | 'pointerleave') {
  const event = new Event(type, { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: 'mouse' })
  node.dispatchEvent(event)
  flush()
}
function fixture(openDelay = 300, closeDelay?: number) {
  const changed = vi.fn()
  const view = render(() => (
    <>
      <HoverCard openDelay={openDelay} closeDelay={closeDelay} onOpenChange={changed}>
        <HoverCard.Trigger href="#preview">Preview link</HoverCard.Trigger>
        <HoverCard.Positioner>
          <HoverCard.Content aria-label="Preview">
            <button>Preview action</button>
          </HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard>
      <button>Outside preview</button>
    </>
  ))
  flush()
  return {
    ...view,
    changed,
    trigger: view.getByRole('link', { name: 'Preview link' }),
    outside: view.getByRole('button', { name: 'Outside preview' }),
  }
}

test('hover-card.focus.8 focus opens at exactly 300ms while preserving link focus', () => {
  const h = fixture()
  h.trigger.focus()
  flush()
  tick(299)
  expect(h.queryByRole('dialog', { hidden: true })).toBeNull()
  expect(h.changed).not.toHaveBeenCalled()
  tick(1)
  expect(h.getByRole('dialog', { hidden: true })).toHaveTextContent('Preview action')
  expect(h.trigger).toHaveFocus()
  expect(h.changed.mock.calls).toEqual([[true]])
})
test('hover-card.focus.8 blur at 150ms cancels the 300ms focus request permanently', () => {
  const h = fixture()
  h.trigger.focus()
  flush()
  tick(150)
  h.outside.focus()
  flush()
  tick(10000)
  expect(h.changed).not.toHaveBeenCalled()
  expect(h.trigger).toHaveAttribute('data-state', 'closed')
  expect(h.queryByRole('dialog', { hidden: true })).toBeNull()
})
test('hover-card.focus.1 native focus leaving starts the default 300ms closing deadline', () => {
  const h = fixture(0)
  h.trigger.focus()
  flush()
  expect(h.changed.mock.calls).toEqual([[true]])
  h.outside.focus()
  flush()
  tick(299)
  expect(h.trigger).toHaveAttribute('data-state', 'open')
  tick(1)
  expect(h.trigger).toHaveAttribute('data-state', 'closed')
  expect(h.changed.mock.calls).toEqual([[true], [false]])
})
test('hover-card.pointer.9 leaving at 300ms cancels a 700ms opening before any close timer matters', () => {
  const h = fixture(700, 300)
  pointer(h.trigger, 'pointerenter')
  tick(300)
  pointer(h.trigger, 'pointerleave')
  tick(1000)
  expect(h.changed).not.toHaveBeenCalled()
  expect(h.trigger).toHaveAttribute('data-state', 'closed')
  expect(h.queryByRole('dialog', { hidden: true })).toBeNull()
})
test('hover-card.state.3 repeated same-state hover requests produce one opening notification', () => {
  const h = fixture(300, 0)
  pointer(h.trigger, 'pointerenter')
  tick(300)
  pointer(h.trigger, 'pointerenter')
  tick(300)
  expect(h.changed.mock.calls).toEqual([[true]])
  const content = h.getByRole('dialog', { hidden: true })
  for (let i = 0; i < 3; i++) {
    pointer(h.trigger, 'pointerenter')
    tick(1000)
  }
  expect(h.changed.mock.calls).toEqual([[true]])
  expect(h.getByRole('dialog', { hidden: true })).toBe(content)
})
test('focus reentry before closing deadline retains the node and suppresses a close-open callback pair', () => {
  const h = fixture(0, 300)
  h.trigger.focus()
  flush()
  const content = h.getByRole('dialog', { hidden: true })
  h.outside.focus()
  flush()
  tick(100)
  h.trigger.focus()
  flush()
  tick(1000)
  expect(h.getByRole('dialog', { hidden: true })).toBe(content)
  expect(h.changed.mock.calls).toEqual([[true]])
  h.outside.focus()
  flush()
  tick(300)
  expect(h.changed.mock.calls).toEqual([[true], [false]])
})
test('unmount cancels pending focus opening without notifying an unmounted owner', () => {
  const h = fixture(300)
  h.trigger.focus()
  flush()
  tick(150)
  h.unmount()
  tick(10000)
  expect(h.changed).not.toHaveBeenCalled()
})
test('reactive disabling cancels a pending focus deadline and reenabled focus starts a fresh request', () => {
  const [disabled, setDisabled] = createSignal(false)
  const changed = vi.fn()
  const view = render(() => (
    <>
      <HoverCard disabled={disabled()} openDelay={300} onOpenChange={changed}>
        <HoverCard.Trigger href="#preview">Reactive preview</HoverCard.Trigger>
        <HoverCard.Positioner>
          <HoverCard.Content aria-label="Reactive card">Preview</HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard>
      <button>Outside reactive preview</button>
    </>
  ))
  flush()
  const trigger = view.getByRole('link', { name: 'Reactive preview' })
  trigger.focus()
  flush()
  tick(150)
  setDisabled(true)
  flush()
  tick(1000)
  expect(changed).not.toHaveBeenCalled()
  view.getByRole('button', { name: 'Outside reactive preview' }).focus()
  setDisabled(false)
  flush()
  trigger.focus()
  flush()
  tick(299)
  expect(changed).not.toHaveBeenCalled()
  tick(1)
  expect(changed.mock.calls).toEqual([[true]])
})
