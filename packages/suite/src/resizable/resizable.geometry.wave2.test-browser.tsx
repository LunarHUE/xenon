import { startResizableDrag } from '@xenon-ui/dom/resizable'
import { expect, onTestFinished, test, vi } from 'vitest'

/** Real panel boxes deliberately exclude root padding, handles and flex gaps. */
function setup(orientation: 'horizontal' | 'vertical', direction: 'ltr' | 'rtl') {
  const root = document.createElement('div')
  root.style.cssText = `display:flex;flex-direction:${orientation === 'vertical' ? 'column' : 'row'};width:420px;height:420px;gap:13px;padding:17px;border:7px solid;direction:${direction}`
  const panels = [document.createElement('div'), document.createElement('div')]
  for (const panel of panels) {
    panel.setAttribute('data-resizable-panel', '')
    panel.style.cssText = 'flex:1;min-width:0;min-height:0'
  }
  const handle = document.createElement('div')
  handle.style.cssText = 'flex:0 0 20px'
  root.append(panels[0]!, handle, panels[1]!)
  document.body.append(root)
  const onMove = vi.fn(),
    onEnd = vi.fn()
  const pointer = (type: string, init: PointerEventInit = {}) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 71,
      isPrimary: true,
      pointerType: 'mouse',
      button: 0,
      buttons: 1,
      clientX: 100,
      clientY: 100,
      ...init,
    })
  const cleanup = startResizableDrag(handle, root, pointer('pointerdown'), {
    orientation,
    direction,
    onMove,
    onEnd,
  })
  onTestFinished(() => {
    cleanup?.()
    root.remove()
  })
  const extent = panels.reduce(
    (sum, panel) =>
      sum + panel.getBoundingClientRect()[orientation === 'vertical' ? 'height' : 'width'],
    0
  )
  return { root, panels, handle, pointer, onMove, onEnd, extent }
}

for (const orientation of ['horizontal', 'vertical'] as const)
  for (const direction of ['ltr', 'rtl'] as const)
    test(`${orientation} ${direction} percentage excludes real root borders, padding, gaps and handle`, () => {
      const s = setup(orientation, direction)
      expect(s.extent).toBeGreaterThan(300)
      expect(s.extent).toBeLessThan(420)
      const delta = s.extent / 4
      document.dispatchEvent(
        s.pointer('pointermove', {
          clientX: orientation === 'horizontal' ? 100 + delta : 900,
          clientY: orientation === 'vertical' ? 100 + delta : 900,
        })
      )
      expect(s.onMove).toHaveBeenCalledExactlyOnceWith(
        orientation === 'horizontal' && direction === 'rtl' ? -25 : 25
      )
    })

test('an active gesture retains its press-time panel extent after native layout resizes', () => {
  const s = setup('horizontal', 'ltr')
  s.root.style.width = '820px'
  expect(s.panels[0]!.getBoundingClientRect().width).toBeGreaterThan(s.extent / 2)
  document.dispatchEvent(s.pointer('pointermove', { clientX: 100 + s.extent / 2 }))
  expect(s.onMove).toHaveBeenCalledExactlyOnceWith(50)
})

test('author-canceled movement is ignored while an author-canceled release cancels once after cleanup', () => {
  const s = setup('horizontal', 'ltr')
  const move = s.pointer('pointermove', { clientX: 200 })
  move.preventDefault()
  document.dispatchEvent(move)
  expect(s.onMove).not.toHaveBeenCalled()
  const release = s.pointer('pointerup')
  release.preventDefault()
  document.dispatchEvent(release)
  expect(s.onEnd).toHaveBeenCalledExactlyOnceWith(true)
  expect(document.documentElement.style.userSelect).not.toBe('none')
  document.dispatchEvent(s.pointer('pointermove', { clientX: 300 }))
  document.dispatchEvent(s.pointer('pointercancel'))
  expect(s.onMove).not.toHaveBeenCalled()
  expect(s.onEnd).toHaveBeenCalledTimes(1)
})

test('synthetic touch movement with no mouse buttons remains active until its own release', () => {
  const s = setup('vertical', 'rtl')
  document.dispatchEvent(
    s.pointer('pointermove', { pointerType: 'touch', buttons: 0, clientY: 100 + s.extent / 2 })
  )
  expect(s.onMove).toHaveBeenCalledExactlyOnceWith(50)
  document.dispatchEvent(s.pointer('pointerup', { pointerId: 72 }))
  expect(s.onEnd).not.toHaveBeenCalled()
  document.dispatchEvent(s.pointer('pointerup'))
  expect(s.onEnd).toHaveBeenCalledExactlyOnceWith(false)
})

test('zero-size native panels reject a gesture without changing selection or callbacks', () => {
  const root = document.createElement('div'),
    handle = document.createElement('div'),
    panel = document.createElement('div')
  panel.setAttribute('data-resizable-panel', '')
  panel.style.width = '0px'
  root.append(panel, handle)
  document.body.append(root)
  onTestFinished(() => root.remove())
  const onMove = vi.fn(),
    onEnd = vi.fn()
  const before = document.documentElement.style.userSelect
  expect(
    startResizableDrag(
      handle,
      root,
      new PointerEvent('pointerdown', { button: 0, isPrimary: true }),
      {
        orientation: 'horizontal',
        direction: 'ltr',
        onMove,
        onEnd,
      }
    )
  ).toBeUndefined()
  expect(document.documentElement.style.userSelect).toBe(before)
  expect(onMove).not.toHaveBeenCalled()
  expect(onEnd).not.toHaveBeenCalled()
})
