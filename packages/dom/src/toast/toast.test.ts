import { afterEach, expect, test, vi } from 'vitest'
import { createToastSwipe, createToastViewport, type ToastSwipeOptions } from './toast'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
function setup(options: Partial<ToastSwipeOptions> = {}) {
  const element = document.createElement('div')
  document.body.append(element)
  const dismiss = vi.fn()
  const swiping = vi.fn()
  const controller = createToastSwipe(element, {
    onDismiss: dismiss,
    onSwipingChange: swiping,
    velocityThreshold: Infinity,
    ...options,
  })
  cleanups.push(controller.dispose)
  return { element, dismiss, swiping, controller }
}
function pointer(
  target: EventTarget,
  type: string,
  x = 0,
  y = 0,
  time = 0,
  init: PointerEventInit = {}
) {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: x,
    clientY: y,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  Object.defineProperty(event, 'timeStamp', { value: time })
  target.dispatchEvent(event)
  return event
}
test.each([
  ['right', 45, 0],
  ['left', -45, 0],
  ['up', 0, -45],
  ['down', 0, 45],
] as const)('dismissal retains the actual %s release offset for exit CSS', (direction, x, y) => {
  const m = setup({ directions: [direction] })
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', x, y, 100)
  pointer(document, 'pointerup', x * 2, y * 2, 200)
  expect(m.dismiss).toHaveBeenCalledExactlyOnceWith(direction)
  expect(m.element.style.getPropertyValue('--toast-swipe-movement-x')).toBe(`${x * 2}px`)
  expect(m.element.style.getPropertyValue('--toast-swipe-movement-y')).toBe(`${y * 2}px`)
  expect(m.element.getAttribute('data-swipe-direction')).toBe(direction)
  expect(m.element.hasAttribute('data-swiping')).toBe(false)
  m.controller.reset()
  expect(m.element.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px')
  expect(m.element.hasAttribute('data-swipe-direction')).toBe(false)
})
test('diagonal drags lock their first dominant axis', () => {
  const m = setup({ directions: ['right', 'down'] })
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', 8, 6, 10)
  pointer(document, 'pointermove', 10, 100, 100)
  expect(m.element.style.getPropertyValue('--toast-swipe-movement-y')).toBe('0px')
  pointer(document, 'pointerup', 10, 100, 200)
  expect(m.dismiss).not.toHaveBeenCalled()
})
test('disallowed motion has resistance and document cancellation permits a later swipe', () => {
  const m = setup()
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', -100, 0, 100)
  const movement = parseFloat(m.element.style.getPropertyValue('--toast-swipe-movement-x'))
  expect(movement).toBeLessThan(0)
  expect(movement).toBeGreaterThan(-100)
  pointer(document, 'pointercancel', -100)
  expect(m.element.style.getPropertyValue('--toast-swipe-movement-x')).toBe('0px')
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointerup', 45, 0, 100)
  expect(m.dismiss).toHaveBeenCalledOnce()
})
test.each(['button', 'input', 'textarea', 'select', 'a', 'div'])(
  'interactive %s descendants cannot start swipes',
  (tag) => {
    const m = setup()
    const child = document.createElement(tag)
    if (tag === 'a') child.setAttribute('href', '/')
    if (tag === 'div') child.setAttribute('data-swipe-ignore', '')
    m.element.append(child)
    pointer(child, 'pointerdown')
    pointer(document, 'pointerup', 100)
    expect(m.dismiss).not.toHaveBeenCalled()
  }
)
test('secondary buttons and non-primary pointers do not start swipes', () => {
  const m = setup()
  pointer(m.element, 'pointerdown', 0, 0, 0, { button: 2 })
  pointer(document, 'pointerup', 100)
  pointer(m.element, 'pointerdown', 0, 0, 0, { isPrimary: false })
  pointer(document, 'pointerup', 100)
  expect(m.dismiss).not.toHaveBeenCalled()
})
test('a recent flick dismisses but tiny jitter, stale velocity and reversals do not', () => {
  const m = setup({ velocityThreshold: 0.5 })
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointerup', 10, 0, 1)
  expect(m.dismiss).not.toHaveBeenCalled()
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', 20, 0, 20)
  pointer(document, 'pointerup', 20, 0, 200)
  expect(m.dismiss).not.toHaveBeenCalled()
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', 30, 0, 20)
  pointer(document, 'pointerup', 20, 0, 30)
  expect(m.dismiss).not.toHaveBeenCalled()
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointerup', 20, 0, 20)
  expect(m.dismiss).toHaveBeenCalledOnce()
})
test('reversing 40px cancels an armed direction even with 60px remaining offset', () => {
  const m = setup()
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', 100, 0, 100)
  pointer(document, 'pointerup', 60, 0, 200)
  expect(m.dismiss).not.toHaveBeenCalled()
  expect(m.element.hasAttribute('data-swipe-direction')).toBe(false)
})
test('touch default prevention exists only during movement, and disposal restores author styles', () => {
  const m = setup()
  const touch = () => {
    const event = new Event('touchmove', { cancelable: true })
    m.element.dispatchEvent(event)
    return event.defaultPrevented
  }
  expect(touch()).toBe(false)
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointermove', 20)
  expect(touch()).toBe(true)
  pointer(document, 'pointercancel')
  expect(touch()).toBe(false)
  m.controller.dispose()
  expect(m.element.style.getPropertyValue('touch-action')).toBe('')
  pointer(m.element, 'pointerdown')
  pointer(document, 'pointerup', 100)
  expect(m.dismiss).not.toHaveBeenCalled()
})
test('viewport pause reasons overlap, swiping keeps expansion after leaving, and cleanup resumes all', () => {
  const element = document.createElement('div')
  document.body.append(element)
  const reasons = new Set<string>()
  const expanded = vi.fn()
  const controller = createToastViewport(element, {
    pause: (r) => reasons.add(r),
    resume: (r) => reasons.delete(r),
    onExpandedChange: expanded,
  })
  cleanups.push(controller.dispose)
  pointer(element, 'pointerenter')
  element.dispatchEvent(new FocusEvent('focusin'))
  window.dispatchEvent(new Event('blur'))
  expect(reasons).toEqual(new Set(['hover', 'focus', 'window-blur']))
  controller.setSwiping(true)
  pointer(element, 'pointerleave')
  element.dispatchEvent(new FocusEvent('focusout'))
  expect(expanded).toHaveBeenLastCalledWith(true)
  controller.setSwiping(false)
  expect(expanded).toHaveBeenLastCalledWith(false)
  expect(reasons).toEqual(new Set(['window-blur']))
  controller.dispose()
  expect(reasons.size).toBe(0)
})
test('hidden documents pause immediately and visibility cannot clear a focus pause', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  const element = document.createElement('div')
  document.body.append(element)
  const reasons = new Set<string>()
  const controller = createToastViewport(element, {
    pause: (r) => reasons.add(r),
    resume: (r) => reasons.delete(r),
  })
  cleanups.push(controller.dispose)
  expect(reasons.has('document-hidden')).toBe(true)
  element.dispatchEvent(new FocusEvent('focusin'))
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(reasons).toEqual(new Set(['focus']))
})
test('viewport follows its owner window, not the parent window', () => {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const element = frame.contentDocument!.createElement('div')
  frame.contentDocument!.body.append(element)
  const pause = vi.fn()
  const resume = vi.fn()
  const controller = createToastViewport(element, { pause, resume })
  cleanups.push(controller.dispose)
  window.dispatchEvent(new Event('blur'))
  expect(pause).not.toHaveBeenCalled()
  frame.contentWindow!.dispatchEvent(new Event('blur'))
  expect(pause).toHaveBeenCalledExactlyOnceWith('window-blur')
  controller.dispose()
  frame.contentWindow!.dispatchEvent(new Event('blur'))
  expect(pause).toHaveBeenCalledTimes(1)
})
