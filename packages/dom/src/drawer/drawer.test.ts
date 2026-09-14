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
