import { afterEach, describe, expect, test, vi } from 'vitest'
import { createViewport } from './controller'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function harness() {
  const viewport = document.createElement('div')
  const current = document.createElement('div')
  current.setAttribute('data-current', '')
  viewport.append(current)
  document.body.append(viewport)
  let open = true
  let trigger = document.createElement('button')
  trigger.getBoundingClientRect = () => ({ left: 0, top: 0, width: 20, height: 20 }) as DOMRect
  const controller = createViewport({
    viewport,
    current,
    open: () => open,
    trigger: () => trigger,
    content: () => viewport,
  })
  cleanups.push(controller.dispose)
  return {
    viewport,
    current,
    controller,
    close: () => {
      open = false
      controller.sync()
    },
    move: () => {
      trigger = document.createElement('button')
      trigger.getBoundingClientRect = () => ({ left: 60, top: 0, width: 20, height: 20 }) as DOMRect
    },
  }
}
function animation() {
  let finish!: () => void
  const finished = new Promise<void>((resolve) => {
    finish = resolve
  })
  return { value: { playState: 'running', finished } as unknown as Animation, finish }
}
function frames() {
  let callback: FrameRequestCallback | undefined
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
    callback = fn
    return 1
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    callback = undefined
  })
  return () => {
    const fn = callback
    callback = undefined
    fn?.(0)
  }
}
function animations(read: (node: Element) => Animation[]) {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: function (this: Element) {
      return read(this)
    },
  })
  cleanups.push(() => {
    delete (Element.prototype as { getAnimations?: unknown }).getAnimations
  })
}
async function settle() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('viewport snapshots', () => {
  test('waits for both wrappers and captures live forms without duplicate identifiers', async () => {
    const runFrame = frames()
    const incoming = animation()
    const outgoing = animation()
    animations((node) => [node.hasAttribute('data-previous') ? outgoing.value : incoming.value])
    const { viewport, current, controller, move } = harness()
    current.innerHTML =
      '<label for="field">Label</label><input id="field" name="field" form="form"><input type="checkbox"><textarea>old</textarea><select><option>one</option><option>two</option></select>'
    current.querySelector('input')!.value = 'typed'
    current.querySelectorAll('input')[1]!.checked = true
    current.querySelector('textarea')!.value = 'edited'
    current.querySelector('select')!.selectedIndex = 1
    controller.capture()
    current.textContent = 'new'
    move()
    controller.sync()
    const old = viewport.querySelector<HTMLElement>('[data-previous]')!
    expect(old.getAttribute('inert')).toBe('')
    expect(old.getAttribute('aria-hidden')).toBe('true')
    expect(old.querySelector('[id],[for],[form],[name]')).toBeNull()
    expect(old.querySelector('input')!.value).toBe('typed')
    expect(old.querySelectorAll('input')[1]!.checked).toBe(true)
    expect(old.querySelector('textarea')!.value).toBe('edited')
    expect(old.querySelector('select')!.selectedIndex).toBe(1)
    expect(viewport.getAttribute('data-activation-direction')).toBe('right')
    expect(current.hasAttribute('data-starting-style')).toBe(true)
    runFrame()
    expect(old.hasAttribute('data-ending-style')).toBe(true)
    incoming.finish()
    await settle()
    expect(old.isConnected).toBe(true)
    outgoing.finish()
    await settle()
    expect(old.isConnected).toBe(false)
  })

  test('an interrupted wait cannot remove the latest snapshot, and close clears it', async () => {
    const runFrame = frames()
    let work = animation()
    animations(() => [work.value])
    const { viewport, current, controller, close } = harness()
    current.textContent = 'one'
    controller.capture()
    current.textContent = 'two'
    controller.sync()
    runFrame()
    const first = work
    work = animation()
    controller.capture()
    current.textContent = 'three'
    controller.sync()
    runFrame()
    first.finish()
    await settle()
    expect(viewport.querySelector('[data-previous]')?.textContent).toBe('two')
    close()
    expect(viewport.querySelector('[data-previous]')).toBeNull()
    expect(viewport.hasAttribute('data-transitioning')).toBe(false)
    work.finish()
    await settle()
  })

  test('without WAAPI commits immediately and restores size variables on disposal', () => {
    const { viewport, current, controller } = harness()
    viewport.style.setProperty('--viewport-width', 'original', 'important')
    // A scale transform must not feed scaled visual bounds into layout sizing.
    current.getBoundingClientRect = () => ({ width: 70, height: 32.5 }) as DOMRect
    Object.defineProperties(current, {
      offsetWidth: { get: () => 140 },
      offsetHeight: { get: () => 65 },
    })
    controller.capture()
    controller.sync()
    expect(viewport.querySelector('[data-previous]')).toBeNull()
    expect(viewport.style.getPropertyValue('--viewport-width')).toBe('140px')
    controller.dispose()
    expect(viewport.style.getPropertyValue('--viewport-width')).toBe('original')
    expect(viewport.style.getPropertyPriority('--viewport-width')).toBe('important')
  })

  test('observes live size changes without repeated style writes and disconnects on close', () => {
    let resize!: () => void
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resize = callback
        }
        observe = observe
        disconnect = disconnect
      }
    )
    const { current, viewport, controller, close } = harness()
    let width = 120
    Object.defineProperties(current, {
      offsetWidth: { get: () => width },
      offsetHeight: { get: () => 80 },
    })
    controller.sync()
    expect(observe).toHaveBeenCalledWith(current)
    expect(viewport.style.getPropertyValue('--viewport-width')).toBe('120px')
    const write = vi.spyOn(viewport.style, 'setProperty')
    resize()
    expect(write).not.toHaveBeenCalled()
    width = 180
    resize()
    expect(viewport.style.getPropertyValue('--viewport-width')).toBe('180px')
    close()
    expect(disconnect).toHaveBeenCalledOnce()
    controller.dispose()
    width = 240
    resize()
    expect(viewport.style.getPropertyValue('--viewport-width')).toBe('')
  })
})
