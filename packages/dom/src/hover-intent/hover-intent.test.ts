import { afterEach, expect, test, vi } from 'vitest'
import { createHoverIntent } from './hover-intent'
afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})
function setup(overrides: Partial<Parameters<typeof createHoverIntent>[0]> = {}) {
  const trigger = document.createElement('button'),
    content = document.createElement('div')
  document.body.append(trigger, content)
  let open = false
  const opened = vi.fn(() => {
      open = true
    }),
    closed = vi.fn(() => {
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
  const event = (element: HTMLElement, extra = {}) =>
    ({
      currentTarget: element,
      target: element,
      pointerType: 'mouse',
      defaultPrevented: false,
      clientX: 0,
      clientY: 0,
      relatedTarget: null,
      ...extra,
    }) as unknown as PointerEvent
  return { trigger, content, intent, opened, closed, event }
}
test('pending hover cancels on leave and real focus opens immediately', () => {
  vi.useFakeTimers()
  const s = setup()
  s.intent.triggerEnter(s.event(s.trigger))
  vi.advanceTimersByTime(80)
  s.intent.triggerLeave(s.event(s.trigger))
  vi.advanceTimersByTime(200)
  expect(s.opened).not.toHaveBeenCalled()
  s.intent.focusIn(s.event(s.trigger) as unknown as FocusEvent)
  expect(s.opened).toHaveBeenCalledExactlyOnceWith(s.trigger, 'focus')
  s.intent.dispose()
})
test('touch and synthesized mouse/focus are suppressed and disposal cancels work', () => {
  vi.useFakeTimers()
  const s = setup()
  s.intent.press(s.event(s.trigger, { pointerType: 'touch' }))
  s.intent.triggerEnter(s.event(s.trigger))
  s.intent.focusIn(s.event(s.trigger) as unknown as FocusEvent)
  vi.advanceTimersByTime(500)
  expect(s.opened).not.toHaveBeenCalled()
  vi.advanceTimersByTime(200)
  s.intent.triggerEnter(s.event(s.trigger))
  s.intent.dispose()
  vi.runAllTimers()
  expect(s.opened).not.toHaveBeenCalled()
})
test('content arrival retains hover while either focus or pointer still holds it', () => {
  vi.useFakeTimers()
  const s = setup({ openDelay: () => 0 })
  s.intent.triggerEnter(s.event(s.trigger))
  s.intent.focusIn(s.event(s.trigger) as unknown as FocusEvent)
  s.intent.triggerLeave(s.event(s.trigger, { relatedTarget: s.content }))
  s.intent.contentEnter(s.event(s.content))
  vi.advanceTimersByTime(500)
  expect(s.closed).not.toHaveBeenCalled()
  s.intent.contentLeave(s.event(s.content))
  vi.advanceTimersByTime(500)
  expect(s.closed).not.toHaveBeenCalled()
  s.intent.focusOut(s.event(s.trigger) as unknown as FocusEvent)
  vi.advanceTimersByTime(50)
  expect(s.closed).toHaveBeenCalledOnce()
  s.intent.dispose()
})
test('corridor expires instead of retaining an idle pointer forever', () => {
  vi.useFakeTimers()
  const s = setup({ openDelay: () => 0 })
  s.content.getBoundingClientRect = () =>
    ({ left: 100, right: 200, top: 0, bottom: 100 }) as DOMRect
  s.intent.triggerEnter(s.event(s.trigger))
  s.intent.triggerLeave(s.event(s.trigger, { clientX: 50, clientY: 50 }))
  vi.advanceTimersByTime(299)
  expect(s.closed).not.toHaveBeenCalled()
  vi.advanceTimersByTime(51)
  expect(s.closed).toHaveBeenCalledOnce()
  s.intent.dispose()
})

test('changed delays reconcile against elapsed intent time and disposal stays final', () => {
  vi.useFakeTimers()
  let opening = 100,
    closing = 100
  const s = setup({ openDelay: () => opening, closeDelay: () => closing, hoverable: () => false })
  s.intent.triggerEnter(s.event(s.trigger))
  vi.advanceTimersByTime(40)
  opening = 60
  s.intent.refresh()
  vi.advanceTimersByTime(19)
  expect(s.opened).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(s.opened).toHaveBeenCalledOnce()
  s.intent.triggerLeave(s.event(s.trigger))
  vi.advanceTimersByTime(30)
  closing = 20
  s.intent.refresh()
  expect(s.closed).toHaveBeenCalledOnce()
  s.intent.triggerEnter(s.event(s.trigger))
  s.intent.dispose()
  opening = 0
  s.intent.refresh()
  vi.runAllTimers()
  expect(s.opened).toHaveBeenCalledOnce()
})

test('a pending open survives either pointer or focus leaving while the other remains', () => {
  vi.useFakeTimers()
  const s = setup({ focusDelay: () => 100 })
  s.intent.focusIn(s.event(s.trigger) as unknown as FocusEvent)
  vi.advanceTimersByTime(50)
  s.intent.triggerLeave(s.event(s.trigger))
  vi.advanceTimersByTime(50)
  expect(s.opened).toHaveBeenCalledExactlyOnceWith(s.trigger, 'focus')
  s.intent.dismiss()
  s.opened.mockClear()
  s.intent.triggerEnter(s.event(s.trigger))
  vi.advanceTimersByTime(50)
  s.intent.focusOut(s.event(s.trigger) as unknown as FocusEvent)
  vi.advanceTimersByTime(50)
  expect(s.opened).toHaveBeenCalledExactlyOnceWith(s.trigger, 'hover')
  s.intent.dispose()
})

test('pending hover refresh retains elapsed time across wall-clock adjustments', () => {
  vi.useFakeTimers()
  const s = setup()
  s.intent.triggerEnter(s.event(s.trigger))
  vi.advanceTimersByTime(50)
  const wallClock = Date.now.bind(Date)
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => wallClock() - 5000)
  try {
    s.intent.refresh()
    vi.advanceTimersByTime(49)
    expect(s.opened).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(s.opened).toHaveBeenCalledExactlyOnceWith(s.trigger, 'hover')
  } finally {
    s.intent.dispose()
    clock.mockRestore()
  }
})

test('shared trigger destinations retain focus intent, but removed registrations and outside focus close normally', () => {
  vi.useFakeTimers()
  const sibling = document.createElement('button')
  const nested = document.createElement('span')
  sibling.append(nested)
  document.body.append(sibling)
  let registered = true
  const s = setup({
    focusDelay: () => 200,
    closeDelay: () => 0,
    triggers: () => (registered ? [sibling] : []),
  })
  s.intent.focusIn(s.event(s.trigger) as unknown as FocusEvent)
  vi.advanceTimersByTime(200)
  expect(s.opened).toHaveBeenCalledExactlyOnceWith(s.trigger, 'focus')
  s.intent.focusOut(s.event(s.trigger, { relatedTarget: nested }) as unknown as FocusEvent)
  expect(s.closed).not.toHaveBeenCalled()
  s.intent.focusIn(s.event(sibling) as unknown as FocusEvent)
  expect(s.opened.mock.calls).toEqual([
    [s.trigger, 'focus'],
    [sibling, 'focus'],
  ])
  s.intent.focusOut(s.event(sibling, { relatedTarget: s.content }) as unknown as FocusEvent)
  expect(s.closed).not.toHaveBeenCalled()
  registered = false
  s.intent.focusOut(s.event(s.content, { relatedTarget: sibling }) as unknown as FocusEvent)
  expect(s.closed).toHaveBeenCalledTimes(1)
  s.intent.dispose()
})
