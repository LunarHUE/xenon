import { afterEach, expect, test, vi } from 'vitest'
import { createHoverIntent } from './hover-intent'

afterEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})

test('hover.pointer.4 suppresses synthetic mouse hover for 600ms after touch, then accepts real mouse hover', () => {
  vi.useFakeTimers()
  const trigger = document.createElement('button')
  const content = document.createElement('div')
  document.body.append(trigger, content)
  let open = false
  const opened = vi.fn(() => {
    open = true
  })
  const intent = createHoverIntent({
    trigger: () => trigger,
    content: () => content,
    open: () => open,
    disabled: () => false,
    openDelay: () => 0,
    closeDelay: () => 0,
    hoverable: () => false,
    onOpen: opened,
    onClose: vi.fn(),
  })
  const event = (pointerType: string) =>
    ({
      currentTarget: trigger,
      target: trigger,
      pointerType,
      defaultPrevented: false,
      relatedTarget: null,
      clientX: 0,
      clientY: 0,
    }) as unknown as PointerEvent

  intent.press(event('touch'))
  intent.triggerEnter(event('mouse'))
  expect(opened).not.toHaveBeenCalled()
  vi.advanceTimersByTime(599)
  intent.triggerEnter(event('mouse'))
  expect(opened).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  intent.triggerEnter(event('mouse'))
  expect(opened).toHaveBeenCalledExactlyOnceWith(trigger, 'hover')
  expect(open).toBe(true)
  intent.dispose()
})
