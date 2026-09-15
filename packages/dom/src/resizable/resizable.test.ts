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
