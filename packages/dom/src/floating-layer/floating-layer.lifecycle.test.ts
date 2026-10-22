import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createFloatingLayer } from './floating-layer'
import type { FloatingFocusOutsideEvent, FloatingLayerOptions } from './floating-layer'

const cleanup: (() => void)[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
function setup(extra: Partial<FloatingLayerOptions> = {}) {
  const wrapper = document.createElement('div')
  const content = document.createElement('div')
  const inside = document.createElement('button')
  const outside = document.createElement('button')
  content.append(inside)
  wrapper.append(content)
  document.body.append(wrapper, outside)
  // Explicitly exercise the documented fallback rather than emulate native popovers.
  Object.defineProperty(wrapper, 'showPopover', { value: undefined })
  wrapper.setAttribute('popover', 'auto')
  wrapper.style.setProperty('display', 'inline-flex', 'important')
  const onDismiss = vi.fn()
  const options: FloatingLayerOptions = {
    content,
    open: true,
    active: true,
    positioned: true,
    initialFocus: false,
    onDismiss,
    ...extra,
  }
  const controller = createFloatingLayer(wrapper, options)
  cleanup.push(controller.dispose)
  return { wrapper, content, inside, outside, options, controller, onDismiss }
}

test('outside focus waits for dispatch and wrapper cancellation preserves native focus', () => {
  const onFocusOutside = vi.fn((event: FloatingFocusOutsideEvent) => event.preventDefault())
  const s = setup({ onFocusOutside })
  s.outside.focus()
  expect(onFocusOutside).not.toHaveBeenCalled()
  vi.runAllTimers()
  expect(onFocusOutside).toHaveBeenCalledTimes(1)
  expect(onFocusOutside.mock.calls[0]![0].defaultPrevented).toBe(true)
  expect(onFocusOutside.mock.calls[0]![0].originalEvent.defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(s.outside)
  expect(s.onDismiss).not.toHaveBeenCalled()
})

test('focus returning inside before the timer suppresses the outside request', () => {
  const onFocusOutside = vi.fn()
  const s = setup({ onFocusOutside })
  s.outside.focus()
  s.inside.focus()
  vi.runAllTimers()
  expect(onFocusOutside).not.toHaveBeenCalled()
  expect(s.onDismiss).not.toHaveBeenCalled()
})

test.each(['update', 'deactivate', 'dispose'] as const)(
  '%s invalidates a queued outside-focus request',
  (action) => {
    const onFocusOutside = vi.fn()
    const s = setup({ onFocusOutside })
    s.outside.focus()
    if (action === 'dispose') s.controller.dispose()
    else s.controller.update({ ...s.options, active: action !== 'deactivate' })
    vi.runAllTimers()
    expect(onFocusOutside).not.toHaveBeenCalled()
    expect(s.onDismiss).not.toHaveBeenCalled()
  }
)

test('pointer cancellation suppresses focus dismissal through dispatch then releases the gate', () => {
  const s = setup()
  document.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  s.outside.focus()
  document.dispatchEvent(new Event('pointercancel', { bubbles: true }))
  s.inside.focus()
  s.outside.focus()
  vi.runAllTimers()
  expect(s.onDismiss).not.toHaveBeenCalled()
  s.inside.focus()
  s.outside.focus()
  vi.runAllTimers()
  expect(s.onDismiss).toHaveBeenCalledExactlyOnceWith('focus-outside')
})

test('only the top floating layer can request outside-focus dismissal', () => {
  const lower = setup()
  const upper = setup()
  lower.outside.focus()
  vi.runAllTimers()
  expect(lower.onDismiss).not.toHaveBeenCalled()
  expect(upper.onDismiss).toHaveBeenCalledExactlyOnceWith('focus-outside')
})

test('fallback disposal restores exact hosting attributes and cannot be reopened by stale updates', () => {
  const s = setup({ positioned: false })
  expect(s.wrapper.style.display).toBe('block')
  s.controller.update({ ...s.options, active: false })
  expect(s.controller.layer).toBeUndefined()
  expect(s.wrapper.style.display).toBe('none')
  s.controller.update(s.options)
  expect(s.controller.isShown()).toBe(true)
  s.controller.dispose()
  s.controller.dispose()
  s.controller.update(s.options)
  expect(s.controller.isShown()).toBe(false)
  expect(s.controller.layer).toBeUndefined()
  expect(s.wrapper.getAttribute('popover')).toBe('auto')
  expect(s.wrapper.style.display).toBe('inline-flex')
  expect(s.wrapper.style.getPropertyPriority('display')).toBe('important')
  expect(s.wrapper.isConnected).toBe(true)
})
