import { afterEach, describe, expect, it, vi } from 'vitest'
import { createViewport } from './controller'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
function setup() {
  const viewport = document.createElement('div')
  const current = document.createElement('div')
  const trigger = document.createElement('button')
  viewport.append(current)
  document.body.append(viewport)
  let rect = { left: 10, top: 10, width: 20, height: 20 }
  vi.spyOn(trigger, 'getBoundingClientRect').mockImplementation(() => rect as DOMRect)
  let frame!: FrameRequestCallback
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frame = callback
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  Object.defineProperty(current, 'getAnimations', { configurable: true, value: () => [] })
  const controller = createViewport({
    viewport,
    current,
    open: () => true,
    trigger: () => trigger,
    content: () => viewport,
  })
  cleanups.push(controller.dispose)
  return {
    viewport,
    current,
    controller,
    move: (next: typeof rect) => {
      rect = next
    },
    frame: () => frame(0),
  }
}

describe('viewport movement contracts', () => {
  for (const [x, y, expected] of [
    [5, 5, null],
    [-5, -5, null],
    [6, 0, 'right'],
    [-6, 0, 'left'],
    [0, 6, 'down'],
    [0, -6, 'up'],
    [6, 6, 'right down'],
    [-6, -6, 'left up'],
    [6, -6, 'right up'],
    [-6, 6, 'left down'],
  ] as const) {
    it(`center movement ${x},${y} publishes ${expected ?? 'no direction'} on all wrappers`, () => {
      const h = setup()
      h.controller.capture()
      h.move({ left: 10 + x, top: 10 + y, width: 20, height: 20 })
      h.controller.sync()
      const previous = h.viewport.querySelector('[data-previous]')!
      for (const host of [h.viewport, h.current, previous]) {
        expect(host.getAttribute('data-activation-direction')).toBe(expected)
      }
      h.frame()
      expect(h.viewport.querySelector('[data-previous]')).toBeNull()
      expect(h.viewport.hasAttribute('data-transitioning')).toBe(false)
      expect(h.current.hasAttribute('data-activation-direction')).toBe(false)
    })
  }
  it('uses trigger centers when anchor dimensions change without a position change', () => {
    const h = setup()
    h.controller.capture()
    h.move({ left: 10, top: 10, width: 40, height: 40 })
    h.controller.sync()
    expect(h.viewport.getAttribute('data-activation-direction')).toBe('right down')
  })

  it('sanitizes the snapshot root and every form descendant while preserving live input state', () => {
    const h = setup()
    h.current.setAttribute('id', 'current')
    h.current.setAttribute('tabindex', '0')
    h.current.setAttribute('autofocus', '')
    h.current.innerHTML =
      '<label for="choice">Choice</label><input id="choice" name="choice" type="checkbox" checked><input type="file" name="file"><button name="send" tabindex="0">Send</button><textarea name="note" autofocus>initial</textarea>'
    const checkbox = h.current.querySelector('input')!
    checkbox.checked = false
    checkbox.indeterminate = true
    h.current.querySelector('textarea')!.value = 'live edited value'
    h.controller.capture()
    h.controller.sync()
    const clone = h.viewport.querySelector<HTMLElement>('[data-previous]')!
    expect(clone.matches('[id],[autofocus]')).toBe(false)
    expect(clone.querySelector('[id],[for],[form],[name],[autofocus]')).toBeNull()
    expect(clone.getAttribute('tabindex')).toBe('-1')
    expect(clone.querySelector('button')!.getAttribute('tabindex')).toBe('-1')
    for (const control of clone.querySelectorAll<HTMLInputElement>('input,button,textarea'))
      expect(control.disabled).toBe(true)
    expect(clone.querySelector('input')!.checked).toBe(false)
    expect(clone.querySelector('input')!.indeterminate).toBe(true)
    expect(clone.querySelector('textarea')!.value).toBe('live edited value')
    expect(clone.style.pointerEvents).toBe('none')
    expect(clone.hasAttribute('inert')).toBe(true)
    expect(clone.getAttribute('aria-hidden')).toBe('true')
    expect(checkbox.disabled).toBe(false)
    expect(checkbox.id).toBe('choice')
    expect(h.current.getAttribute('tabindex')).toBe('0')
  })
})

describe('viewport animation completion contracts', () => {
  for (const playState of ['idle', 'finished'] as const) {
    it(`ignores ${playState} animation promises that never settle`, () => {
      const h = setup()
      Object.defineProperty(h.current, 'getAnimations', {
        value: () => [{ playState, finished: new Promise(() => {}) }],
      })
      h.controller.capture()
      h.controller.sync()
      h.frame()
      expect(h.viewport.querySelector('[data-previous]')).toBeNull()
      expect(h.viewport.hasAttribute('data-transitioning')).toBe(false)
    })
  }
  it('ignores running infinite animations while waiting for a finite animation', async () => {
    const h = setup()
    let finish!: () => void
    const finished = new Promise<void>((resolve) => {
      finish = resolve
    })
    Object.defineProperty(h.current, 'getAnimations', {
      value: () => [
        {
          playState: 'running',
          effect: { getComputedTiming: () => ({ iterations: Infinity }) },
          finished: new Promise(() => {}),
        },
        {
          playState: 'running',
          effect: { getComputedTiming: () => ({ iterations: 2 }) },
          finished,
        },
      ],
    })
    h.controller.capture()
    h.controller.sync()
    h.frame()
    expect(h.viewport.querySelector('[data-previous]')).not.toBeNull()
    finish()
    for (let i = 0; i < 4; i++) await Promise.resolve()
    expect(h.viewport.querySelector('[data-previous]')).toBeNull()
    expect(h.viewport.hasAttribute('data-transitioning')).toBe(false)
  })
  it('treats a rejected animation completion as cancellation and finishes the transition', async () => {
    const h = setup()
    let cancel!: (error: Error) => void
    const finished = new Promise<void>((_resolve, reject) => {
      cancel = reject
    })
    Object.defineProperty(h.current, 'getAnimations', {
      value: () => [{ playState: 'running', finished }],
    })
    h.controller.capture()
    h.controller.sync()
    h.frame()
    expect(h.viewport.querySelector('[data-previous]')).not.toBeNull()
    cancel(new Error('animation canceled'))
    for (let i = 0; i < 4; i++) await Promise.resolve()
    expect(h.viewport.querySelector('[data-previous]')).toBeNull()
    expect(h.current.hasAttribute('data-starting-style')).toBe(false)
  })
})
