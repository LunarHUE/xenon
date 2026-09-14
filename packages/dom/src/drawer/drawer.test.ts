import { afterEach, expect, test, vi } from 'vitest'
import { registerDrawerHandle } from './drawer'

const cleanups: (() => void)[] = []
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup()
  document.body.replaceChildren()
})
function setup(side: 'top' | 'right' | 'bottom' | 'left' = 'bottom') {
  const content = document.createElement('div')
  const handle = document.createElement('button')
  content.append(handle)
  document.body.append(content)
  vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 400 } as DOMRect)
  const dismiss = vi.fn()
  const controller = registerDrawerHandle(handle, content, { side, onDismiss: dismiss })
  cleanups.push(controller.dispose)
  const pointer = (type: string, x: number, y: number, init: PointerEventInit = {}) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        ...init,
      })
    )
  return { content, handle, dismiss, controller, pointer }
}
test('a threshold drag dismisses once and suppresses its click', () => {
  const m = setup()
  const clicked = vi.fn()
  m.handle.addEventListener('click', clicked)
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointermove', 0, 110)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('110px')
  m.pointer('pointerup', 0, 110)
  m.handle.dispatchEvent(new MouseEvent('click', { detail: 1, cancelable: true }))
  expect(m.dismiss).toHaveBeenCalledOnce()
  expect(clicked).not.toHaveBeenCalled()
  expect(m.content.hasAttribute('data-swiping')).toBe(false)
  m.handle.click()
  expect(clicked).toHaveBeenCalledOnce()
})
test('short drags and pointercancel reset without closing', () => {
  const m = setup()
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', 0, 30)
  expect(m.dismiss).not.toHaveBeenCalled()
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointermove', 0, 200)
  m.pointer('pointercancel', 0, 200)
  m.pointer('pointerup', 0, 200)
  expect(m.dismiss).not.toHaveBeenCalled()
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
})
test.each(['bottom', 'right'] as const)(
  'custom pixel thresholds override size-based defaults for %s drawers',
  (side) => {
    const m = setup(side)
    m.controller.update({ side, dragThreshold: 150, onDismiss: m.dismiss })
    const release = (distance: number) => {
      m.pointer('pointerdown', 0, 0)
      m.pointer('pointerup', side === 'right' ? distance : 0, side === 'bottom' ? distance : 0)
    }
    release(149)
    expect(m.dismiss).not.toHaveBeenCalled()
    release(150)
    expect(m.dismiss).toHaveBeenCalledOnce()
    m.controller.update({ side, dragThreshold: 20, onDismiss: m.dismiss })
    release(20)
    expect(m.dismiss).toHaveBeenCalledTimes(2)
  }
)
test.each([-1, NaN, Infinity])(
  'invalid threshold %s uses the existing default',
  (dragThreshold) => {
    const m = setup()
    m.controller.update({ side: 'bottom', dragThreshold, onDismiss: m.dismiss })
    m.pointer('pointerdown', 0, 0)
    m.pointer('pointerup', 0, 99)
    expect(m.dismiss).not.toHaveBeenCalled()
    m.pointer('pointerdown', 0, 0)
    m.pointer('pointerup', 0, 100)
    expect(m.dismiss).toHaveBeenCalledOnce()
  }
)
test('a zero threshold still requires an outward drag', () => {
  const m = setup()
  m.controller.update({ side: 'bottom', dragThreshold: 0, onDismiss: m.dismiss })
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', 0, 0)
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', 10, 0)
  expect(m.dismiss).not.toHaveBeenCalled()
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', 0, 10)
  expect(m.dismiss).toHaveBeenCalledOnce()
})
test.each([
  ['top', 0, -110],
  ['right', 60, 0],
  ['left', -60, 0],
] as const)('respects the %s dismiss direction', (side, x, y) => {
  const m = setup(side)
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', x, y)
  expect(m.dismiss).toHaveBeenCalledOnce()
})
test('author cancellation and disabled handles refuse gestures', () => {
  const m = setup()
  m.pointer('pointerdown', 0, 0)
  m.handle.addEventListener('pointerup', (event) => event.preventDefault(), {
    capture: true,
    once: true,
  })
  m.pointer('pointerup', 0, 200)
  expect(m.dismiss).not.toHaveBeenCalled()
  m.handle.disabled = true
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', 0, 200)
  expect(m.dismiss).not.toHaveBeenCalled()
})
test('dismissal keeps the release offset available to the exit animation', () => {
  const m = setup()
  let releaseOffset = ''
  m.controller.update({
    side: 'bottom',
    onDismiss: () => {
      releaseOffset = m.content.style.getPropertyValue('--drawer-swipe-offset')
    },
  })
  m.pointer('pointerdown', 0, 0)
  m.pointer('pointerup', 0, 110)
  expect(releaseOffset).toBe('110px')
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('110px')
  m.controller.reset()
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
})
test('disposal restores the author offset after a dismissing swipe', () => {
  const content = document.createElement('div')
  const handle = document.createElement('button')
  content.append(handle)
  document.body.append(content)
  content.style.setProperty('--drawer-swipe-offset', '2px', 'important')
  vi.spyOn(content, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 400 } as DOMRect)
  const controller = registerDrawerHandle(handle, content, { side: 'bottom', onDismiss() {} })
  for (const [type, clientY] of [
    ['pointerdown', 0],
    ['pointerup', 120],
  ] as const) {
    handle.dispatchEvent(
      new PointerEvent(type, { pointerId: 1, isPrimary: true, button: 0, clientY })
    )
  }
  expect(content.style.getPropertyValue('--drawer-swipe-offset')).toBe('120px')
  controller.dispose()
  expect(content.style.getPropertyValue('--drawer-swipe-offset')).toBe('2px')
  expect(content.style.getPropertyPriority('--drawer-swipe-offset')).toBe('important')
})
