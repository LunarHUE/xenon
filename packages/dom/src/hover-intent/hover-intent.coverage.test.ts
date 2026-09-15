import { afterEach, expect, test, vi } from 'vitest'
import { createHoverIntent } from './hover-intent'

afterEach(() => {
  document.body.replaceChildren()
})

test('hover.pointer.6 opens and closes synchronously when both delays are zero', () => {
  const trigger = document.createElement('button')
  const content = document.createElement('div')
  document.body.append(trigger, content)
  let open = false
  const opened = vi.fn(() => {
    open = true
  })
  const closed = vi.fn(() => {
    open = false
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
    onClose: closed,
  })
  const event = (element: HTMLElement) =>
    ({
      currentTarget: element,
      target: element,
      pointerType: 'mouse',
      defaultPrevented: false,
      relatedTarget: null,
      clientX: 0,
      clientY: 0,
    }) as unknown as PointerEvent

  intent.triggerEnter(event(trigger))
  expect(opened).toHaveBeenCalledExactlyOnceWith(trigger, 'hover')
  expect(open).toBe(true)
  intent.triggerLeave(event(trigger))
  expect(closed).toHaveBeenCalledOnce()
  expect(open).toBe(false)
  intent.dispose()
})
