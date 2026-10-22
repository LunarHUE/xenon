import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createHoverIntent } from './hover-intent'

const cleanup: (() => void)[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
  vi.useRealTimers()
})
function setup() {
  const trigger = document.createElement('button')
  const second = document.createElement('button')
  const content = document.createElement('div')
  document.body.append(trigger, second, content)
  let open = false,
    disabled = false
  const onOpen = vi.fn(() => {
    open = true
  })
  const onClose = vi.fn(() => {
    open = false
  })
  const intent = createHoverIntent({
    trigger: () => trigger,
    triggers: () => [trigger, second],
    content: () => content,
    open: () => open,
    disabled: () => disabled,
    openDelay: () => 100,
    closeDelay: () => 50,
    focusDelay: () => 100,
    hoverable: () => false,
    onOpen,
    onClose,
  })
  cleanup.push(intent.dispose)
  const event = (node = trigger, extra = {}) =>
    ({
      currentTarget: node,
      target: node,
      pointerType: 'mouse',
      relatedTarget: null,
      defaultPrevented: false,
      ...extra,
    }) as unknown as PointerEvent
  return {
    trigger,
    second,
    intent,
    event,
    onOpen,
    onClose,
    disable: () => {
      disabled = true
    },
  }
}

test('a later shared trigger owns the surviving open and its full delay', () => {
  const s = setup()
  s.intent.triggerEnter(s.event())
  vi.advanceTimersByTime(70)
  s.intent.triggerEnter(s.event(s.second))
  vi.advanceTimersByTime(99)
  expect(s.onOpen).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(s.onOpen).toHaveBeenCalledExactlyOnceWith(s.second, 'hover')
})

test.each(['removed', 'disabled'] as const)(
  'a trigger %s during its opening delay cannot open',
  (change) => {
    const s = setup()
    s.intent.triggerEnter(s.event())
    vi.advanceTimersByTime(50)
    if (change === 'removed') s.trigger.remove()
    else s.trigger.disabled = true
    vi.advanceTimersByTime(100)
    expect(s.onOpen).not.toHaveBeenCalled()
  }
)

test('cancel releases pending close without requesting closure and permits a fresh entry', () => {
  const s = setup()
  s.intent.triggerEnter(s.event())
  vi.advanceTimersByTime(100)
  s.intent.triggerLeave(s.event())
  vi.advanceTimersByTime(25)
  s.intent.cancel()
  vi.advanceTimersByTime(1000)
  expect(s.onClose).not.toHaveBeenCalled()
  s.intent.dismiss()
  expect(s.onClose).toHaveBeenCalledTimes(1)
  s.intent.triggerEnter(s.event(s.second))
  vi.advanceTimersByTime(100)
  expect(s.onOpen).toHaveBeenLastCalledWith(s.second, 'hover')
  expect(s.onOpen).toHaveBeenCalledTimes(2)
})

test('disabling with a pending close cancels that timer and closes only once', () => {
  const s = setup()
  s.intent.triggerEnter(s.event())
  vi.advanceTimersByTime(100)
  s.intent.triggerLeave(s.event())
  s.disable()
  s.intent.refresh()
  expect(s.onClose).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1000)
  expect(s.onClose).toHaveBeenCalledTimes(1)
})

test('author cancellation blocks both hover and focus opening before timers are scheduled', () => {
  const s = setup()
  s.intent.triggerEnter(s.event(s.trigger, { defaultPrevented: true }))
  s.intent.focusIn(s.event(s.trigger, { defaultPrevented: true }) as unknown as FocusEvent)
  vi.advanceTimersByTime(1000)
  expect(s.onOpen).not.toHaveBeenCalled()
  s.intent.focusIn(s.event() as unknown as FocusEvent)
  vi.advanceTimersByTime(100)
  expect(s.onOpen).toHaveBeenCalledExactlyOnceWith(s.trigger, 'focus')
})

test('dispose clears a delayed close and all later entry or dismissal calls stay silent', () => {
  const s = setup()
  s.intent.triggerEnter(s.event())
  vi.advanceTimersByTime(100)
  s.intent.triggerLeave(s.event())
  s.intent.dispose()
  s.intent.dispose()
  s.intent.triggerEnter(s.event())
  s.intent.focusIn(s.event() as unknown as FocusEvent)
  s.intent.press(s.event())
  s.intent.dismiss()
  s.intent.refresh()
  vi.runAllTimers()
  expect(s.onOpen).toHaveBeenCalledTimes(1)
  expect(s.onClose).not.toHaveBeenCalled()
})
