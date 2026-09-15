import { afterEach, expect, test, vi } from 'vitest'
import { createHoverIntent } from './hover-intent'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  vi.useRealTimers()
})

function setup(overrides: Partial<Parameters<typeof createHoverIntent>[0]> = {}) {
  const trigger = document.createElement('button')
  const content = document.createElement('div')
  document.body.append(trigger, content)
  let open = true
  const opened = vi.fn()
  const closed = vi.fn(() => {
    open = false
  })
  const intent = createHoverIntent({
    trigger: () => trigger,
    content: () => content,
    open: () => open,
    disabled: () => false,
    openDelay: () => 100,
    closeDelay: () => 50,
    hoverable: () => true,
    onOpen: opened,
    onClose: closed,
    ...overrides,
  })
  cleanups.push(() => {
    intent.dispose()
    trigger.remove()
    content.remove()
  })
  const event = (element: HTMLElement, extra: Partial<PointerEvent> = {}) =>
    ({
      currentTarget: element,
      target: element,
      pointerType: 'mouse',
      defaultPrevented: false,
      clientX: 0,
      clientY: 0,
      relatedTarget: null,
      ...extra,
    }) as PointerEvent
  return { trigger, content, intent, opened, closed, event }
}

test('closeOnPress false preserves an open surface when the trigger is pressed', () => {
  const s = setup({ closeOnPress: () => false })

  s.intent.press(s.event(s.trigger))

  expect(s.closed).not.toHaveBeenCalled()
  const defaultPolicy = setup()
  defaultPolicy.intent.press(defaultPolicy.event(defaultPolicy.trigger))
  expect(defaultPolicy.closed).toHaveBeenCalledOnce()
})

test('focus moving from trigger into content does not schedule a close', () => {
  vi.useFakeTimers()
  const s = setup()

  s.intent.focusIn(s.event(s.trigger) as unknown as FocusEvent)
  s.intent.focusOut(s.event(s.trigger, { relatedTarget: s.content }) as unknown as FocusEvent)
  vi.advanceTimersByTime(200)

  expect(s.closed).not.toHaveBeenCalled()
  s.intent.focusOut(s.event(s.content) as unknown as FocusEvent)
  vi.advanceTimersByTime(50)
  expect(s.closed).toHaveBeenCalledOnce()
})

test('refreshing to non-hoverable closes an open surface after pointer intent leaves', () => {
  vi.useFakeTimers()
  let hoverable = true
  const s = setup({ hoverable: () => hoverable })

  s.intent.triggerEnter(s.event(s.trigger))
  s.intent.contentEnter(s.event(s.content))
  s.intent.contentLeave(s.event(s.content))
  // The active corridor outlasts closeDelay until the live policy disables it.
  vi.advanceTimersByTime(100)
  expect(s.closed).not.toHaveBeenCalled()
  hoverable = false
  s.intent.refresh()
  vi.advanceTimersByTime(49)
  expect(s.closed).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)

  expect(s.closed).toHaveBeenCalledOnce()
})
