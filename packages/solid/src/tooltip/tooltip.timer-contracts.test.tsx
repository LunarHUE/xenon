import { cleanup, fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Tooltip } from './tooltip'

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
function pointer(node: Element, type: 'pointerEnter' | 'pointerLeave' | 'pointerDown') {
  fireEvent[type](node, { pointerType: 'mouse', button: 0, isPrimary: true })
  flush()
}
function fixture(delay: number, closeDelay = 0, closeOnPress = true) {
  const changed = vi.fn()
  const view = render(() => (
    <Tooltip
      openDelay={delay}
      closeDelay={closeDelay}
      hoverable={false}
      closeOnPress={closeOnPress}
      onOpenChange={changed}
    >
      <Tooltip.Trigger>Explain control</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Control explanation</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  flush()
  const trigger = view.getByRole('button', { name: 'Explain control' })
  return { ...view, trigger, changed }
}

for (const delay of [20, 100, 150, 300, 350, 500, 1000, 10000]) {
  test(`tooltip.pointer.2 opens at exactly ${delay}ms without an earlier request`, () => {
    const h = fixture(delay)
    pointer(h.trigger, 'pointerEnter')
    tick(delay - 1)
    expect(h.queryByRole('tooltip', { hidden: true })).toBeNull()
    expect(h.trigger).not.toHaveAttribute('aria-describedby')
    expect(h.changed).not.toHaveBeenCalled()
    tick(1)
    const content = h.getByRole('tooltip', { hidden: true })
    expect(h.trigger).toHaveAttribute('aria-describedby', content.id)
    expect(h.changed.mock.calls).toEqual([[true]])
  })
}
for (const delay of [100, 400, 650]) {
  test(`tooltip.pointer.4 closes at exactly ${delay}ms after pointer intent ends`, () => {
    const h = fixture(0, delay)
    pointer(h.trigger, 'pointerEnter')
    expect(h.changed.mock.calls).toEqual([[true]])
    pointer(h.trigger, 'pointerLeave')
    tick(delay - 1)
    expect(h.trigger).toHaveAttribute('data-state', 'open')
    expect(h.changed.mock.calls).toEqual([[true]])
    tick(1)
    expect(h.trigger).toHaveAttribute('data-state', 'closed')
    expect(h.trigger).not.toHaveAttribute('aria-describedby')
    expect(h.changed.mock.calls).toEqual([[true], [false]])
  })
}
for (const delay of [300, 600]) {
  test(`tooltip.pointer.9 a press at ${delay - 1}ms cancels pending opening beyond its deadline`, () => {
    const h = fixture(delay)
    pointer(h.trigger, 'pointerEnter')
    tick(delay - 1)
    pointer(h.trigger, 'pointerDown')
    tick(10000)
    expect(h.trigger).toHaveAttribute('data-state', 'closed')
    expect(h.queryByRole('tooltip', { hidden: true })).toBeNull()
    expect(h.changed).not.toHaveBeenCalled()
  })
}
test('tooltip.pointer.10 closeOnPress false preserves a pending hover deadline', () => {
  const h = fixture(600, 0, false)
  pointer(h.trigger, 'pointerEnter')
  tick(300)
  pointer(h.trigger, 'pointerDown')
  tick(299)
  expect(h.changed).not.toHaveBeenCalled()
  tick(1)
  expect(h.trigger).toHaveAttribute('data-state', 'open')
  expect(h.changed.mock.calls).toEqual([[true]])
})
test('tooltip.pointer.7 leaving before opening removes all pending requests', () => {
  const h = fixture(700)
  pointer(h.trigger, 'pointerEnter')
  tick(300)
  pointer(h.trigger, 'pointerLeave')
  tick(20000)
  expect(h.changed).not.toHaveBeenCalled()
  expect(h.queryByRole('tooltip', { hidden: true })).toBeNull()
})
test('tooltip.pointer.4 reentry cancels closure at the old deadline and starts a fresh deadline on later leave', () => {
  const h = fixture(0, 400)
  pointer(h.trigger, 'pointerEnter')
  pointer(h.trigger, 'pointerLeave')
  tick(200)
  pointer(h.trigger, 'pointerEnter')
  tick(400)
  expect(h.trigger).toHaveAttribute('data-state', 'open')
  expect(h.changed.mock.calls).toEqual([[true]])
  pointer(h.trigger, 'pointerLeave')
  tick(399)
  expect(h.trigger).toHaveAttribute('data-state', 'open')
  tick(1)
  expect(h.changed.mock.calls).toEqual([[true], [false]])
})
test('tooltip.pointer.4 shortening a pending close delay uses elapsed time rather than restarting the clock', () => {
  const [delay, setDelay] = createSignal(650)
  const changed = vi.fn()
  const view = render(() => (
    <Tooltip openDelay={0} closeDelay={delay()} hoverable={false} onOpenChange={changed}>
      <Tooltip.Trigger>Reactive delay</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Reactive explanation</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  flush()
  const trigger = view.getByRole('button', { name: 'Reactive delay' })
  pointer(trigger, 'pointerEnter')
  pointer(trigger, 'pointerLeave')
  tick(150)
  setDelay(400)
  flush()
  tick(249)
  expect(trigger).toHaveAttribute('data-state', 'open')
  tick(1)
  expect(trigger).toHaveAttribute('data-state', 'closed')
  expect(changed.mock.calls).toEqual([[true], [false]])
})
