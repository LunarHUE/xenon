import { afterEach, expect, test, vi } from 'vitest'
import { startResizableDrag } from './resizable'
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
})
function setup() {
  const root = document.createElement('div'),
    panel = document.createElement('div'),
    handle = document.createElement('div')
  panel.setAttribute('data-resizable-panel', '')
  root.append(panel, handle)
  document.body.append(root)
  vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 400 } as DOMRect)
  const onMove = vi.fn(),
    onEnd = vi.fn()
  const pointer = (type: string, init: PointerEventInit = {}) =>
    new PointerEvent(type, {
      pointerId: 1,
      isPrimary: true,
      button: 0,
      buttons: 1,
      pointerType: 'mouse',
      bubbles: true,
      cancelable: true,
      ...init,
    })
  const start = (init: PointerEventInit = {}) => {
    const cleanup = startResizableDrag(handle, root, pointer('pointerdown', init), {
      orientation: 'horizontal',
      direction: 'ltr',
      onMove,
      onEnd,
    })
    if (cleanup) cleanups.push(cleanup)
    return cleanup
  }
  return { start, onMove, onEnd, pointer, handle }
}
test('only owning primary pointer transfers measured percentages and release restores style', () => {
  const m = setup()
  document.documentElement.style.userSelect = 'text'
  m.start()
  document.dispatchEvent(m.pointer('pointermove', { clientX: 60, pointerId: 2 }))
  expect(m.onMove).not.toHaveBeenCalled()
  document.dispatchEvent(m.pointer('pointermove', { clientX: 60 }))
  expect(m.onMove).toHaveBeenCalledWith(30)
  document.dispatchEvent(m.pointer('pointerup'))
  expect(m.onEnd).toHaveBeenCalledExactlyOnceWith(false)
  expect(document.documentElement.style.userSelect).toBe('text')
  document.dispatchEvent(m.pointer('pointermove', { clientX: 90 }))
  expect(m.onMove).toHaveBeenCalledTimes(1)
})
test('missed release cancels and cleanup preserves external style changes', () => {
  const m = setup()
  m.start()
  document.documentElement.style.userSelect = 'all'
  document.dispatchEvent(m.pointer('pointermove', { buttons: 0 }))
  expect(m.onEnd).toHaveBeenCalledExactlyOnceWith(true)
  expect(document.documentElement.style.userSelect).toBe('all')
})
test('rejected starts and disposal emit no callbacks', () => {
  const m = setup()
  expect(m.start({ isPrimary: false })).toBeUndefined()
  expect(m.start({ button: 2 })).toBeUndefined()
  m.start()?.()
  document.dispatchEvent(m.pointer('pointerup'))
  expect(m.onEnd).not.toHaveBeenCalled()
})

test('vertical drags use height and cancel on pointercancel', () => {
  const m = setup()
  const panel = m.handle.parentElement!.firstElementChild as HTMLElement
  vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ width: 200, height: 100 } as DOMRect)
  const cleanup = startResizableDrag(
    m.handle,
    m.handle.parentElement!,
    m.pointer('pointerdown', { clientY: 20 }),
    {
      orientation: 'vertical',
      direction: 'ltr',
      onMove: m.onMove,
      onEnd: m.onEnd,
    }
  )
  if (cleanup) cleanups.push(cleanup)
  document.dispatchEvent(m.pointer('pointermove', { clientX: 90, clientY: 70 }))
  // 50px movement across 100px of panel height is 50 percentage points.
  expect(m.onMove).toHaveBeenCalledExactlyOnceWith(50)
  document.dispatchEvent(m.pointer('pointercancel'))
  expect(m.onEnd).toHaveBeenCalledExactlyOnceWith(true)
})

test('RTL horizontal drag reverses horizontal delta', () => {
  const m = setup()
  const cleanup = startResizableDrag(
    m.handle,
    m.handle.parentElement!,
    m.pointer('pointerdown', { clientX: 20, clientY: 20 }),
    {
      orientation: 'horizontal',
      direction: 'rtl',
      onMove: m.onMove,
      onEnd: m.onEnd,
    }
  )
  if (cleanup) cleanups.push(cleanup)
  document.dispatchEvent(m.pointer('pointermove', { clientX: 60, clientY: 80 }))
  // 40px across 200px of panel width, reversed in RTL.
  expect(m.onMove).toHaveBeenCalledExactlyOnceWith(-20)
})

test('window blur cancels an active resize and removes document listeners', () => {
  const m = setup()
  m.start()
  window.dispatchEvent(new Event('blur'))
  expect(m.onEnd).toHaveBeenCalledExactlyOnceWith(true)
  document.dispatchEvent(m.pointer('pointermove', { clientX: 90 }))
  expect(m.onMove).not.toHaveBeenCalled()
})

test('lost pointer capture cancels resize exactly once', () => {
  const m = setup()
  m.start()
  m.handle.dispatchEvent(m.pointer('lostpointercapture', { pointerId: 2 }))
  expect(m.onEnd).not.toHaveBeenCalled()
  m.handle.dispatchEvent(m.pointer('lostpointercapture'))
  expect(m.onEnd).toHaveBeenCalledExactlyOnceWith(true)
  document.dispatchEvent(m.pointer('pointerup'))
  expect(m.onEnd).toHaveBeenCalledOnce()
})
