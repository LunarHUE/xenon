import { afterEach, expect, test, vi } from 'vitest'
import {
  createScrollbarInteraction,
  observeScrollArea,
  readScrollArea,
  scrollbarGeometry,
  setScrollAreaOffset,
} from './scroll-area'
const disposals: Array<() => void> = []
afterEach(() => {
  disposals.splice(0).forEach((dispose) => dispose())
  document.body.replaceChildren()
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
})
function fixture() {
  const viewport = document.createElement('div'),
    track = document.createElement('div'),
    thumb = document.createElement('div')
  document.body.append(viewport, track)
  track.append(thumb)
  track.tabIndex = 0
  Object.defineProperties(viewport, {
    clientWidth: { value: 100 },
    clientHeight: { value: 100 },
    scrollWidth: { value: 500 },
    scrollHeight: { value: 500 },
  })
  Object.defineProperties(track, { clientWidth: { value: 100 }, clientHeight: { value: 100 } })
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  } as DOMRect)
  vi.spyOn(thumb, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 20,
    height: 20,
  } as DOMRect)
  const change = vi.fn(),
    dragging = vi.fn()
  const control = createScrollbarInteraction({
    viewport,
    track,
    thumb: () => thumb,
    orientation: 'vertical',
    thumbSize: () => 20,
    onScroll: change,
    onDraggingChange: dragging,
  })
  disposals.push(control.destroy)
  const pointer = (type: string, init: PointerEventInit = {}) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      button: 0,
      buttons: 1,
      isPrimary: true,
      pointerType: 'mouse',
      ...init,
    })
  track.addEventListener('pointerdown', control.pointerDown)
  track.addEventListener('keydown', control.keyDown)
  track.addEventListener('wheel', control.wheel)
  return { viewport, track, thumb, change, dragging, control, pointer }
}
test('geometry clamps overscroll and tiny tracks without losing proportional travel', () => {
  expect(
    scrollbarGeometry({ viewportSize: 100, contentSize: 500, trackSize: 100, offset: 200 })
  ).toEqual({ overflow: true, max: 400, size: 20, travel: 80, position: 40 })
  expect(
    scrollbarGeometry({ viewportSize: 100, contentSize: 10000, trackSize: 10, offset: 20000 })
  ).toEqual({ overflow: true, max: 9900, size: 10, travel: 0, position: 0 })
  expect(
    scrollbarGeometry({ viewportSize: 100, contentSize: 50, trackSize: 100, offset: -1 }).size
  ).toBe(100)
})
test('physical horizontal offsets round trip in RTL and clamp Safari overscroll', () => {
  const { viewport } = fixture()
  viewport.style.direction = 'rtl'
  expect(readScrollArea(viewport).left).toBe(400)
  setScrollAreaOffset(viewport, 'horizontal', 100)
  expect(viewport.scrollLeft).toBe(-300)
  expect(readScrollArea(viewport).left).toBe(100)
  viewport.scrollLeft = -600
  expect(readScrollArea(viewport).left).toBe(0)
})
test('thumb drag preserves grab point, ignores other pointers, and restores styles on missed release', () => {
  const m = fixture()
  m.viewport.style.scrollSnapType = 'y mandatory'
  m.viewport.style.scrollBehavior = 'smooth'
  document.documentElement.style.userSelect = 'text'
  m.thumb.dispatchEvent(m.pointer('pointerdown', { clientY: 5 }))
  expect(m.viewport.scrollTop).toBe(0)
  document.dispatchEvent(m.pointer('pointermove', { pointerId: 2, clientY: 45 }))
  expect(m.viewport.scrollTop).toBe(0)
  document.dispatchEvent(m.pointer('pointermove', { clientY: 45 }))
  expect(m.viewport.scrollTop).toBe(200)
  expect(m.track).toBe(document.activeElement)
  document.dispatchEvent(m.pointer('pointermove', { buttons: 0 }))
  expect(m.dragging.mock.calls).toEqual([[true], [false]])
  expect(m.viewport.style.scrollSnapType).toBe('y mandatory')
  expect(m.viewport.style.scrollBehavior).toBe('smooth')
  expect(document.documentElement.style.userSelect).toBe('text')
  document.dispatchEvent(m.pointer('pointermove', { clientY: 85 }))
  expect(m.viewport.scrollTop).toBe(200)
})
test('track click centers the thumb; cancel, lost capture and disposal release listeners', () => {
  const m = fixture()
  m.track.dispatchEvent(m.pointer('pointerdown', { clientY: 50 }))
  expect(m.viewport.scrollTop).toBe(200)
  document.dispatchEvent(m.pointer('pointercancel'))
  m.track.dispatchEvent(m.pointer('pointerdown', { clientY: 70 }))
  m.track.dispatchEvent(m.pointer('lostpointercapture'))
  m.track.dispatchEvent(m.pointer('pointerdown', { clientY: 30 }))
  document.documentElement.style.userSelect = 'all'
  m.control.destroy()
  expect(document.documentElement.style.userSelect).toBe('all')
  const before = m.viewport.scrollTop
  document.dispatchEvent(m.pointer('pointermove', { clientY: 90 }))
  expect(m.viewport.scrollTop).toBe(before)
  expect(m.dragging.mock.calls).toEqual([[true], [false], [true], [false], [true], [false]])
})
test('rejected and canceled input is inert; keyboard clamps and wheel chains at edges', () => {
  const m = fixture()
  m.track.dispatchEvent(m.pointer('pointerdown', { button: 2 }))
  m.track.dispatchEvent(m.pointer('pointerdown', { isPrimary: false }))
  const canceled = m.pointer('pointerdown')
  canceled.preventDefault()
  m.track.dispatchEvent(canceled)
  expect(m.dragging).not.toHaveBeenCalled()
  const key = (value: string) =>
    m.track.dispatchEvent(
      new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })
    )
  key('PageDown')
  expect(m.viewport.scrollTop).toBe(100)
  key('End')
  expect(m.viewport.scrollTop).toBe(400)
  const wheel = new WheelEvent('wheel', { deltaY: 40, cancelable: true })
  m.track.dispatchEvent(wheel)
  expect(wheel.defaultPrevented).toBe(false)
  key('Home')
  expect(m.viewport.scrollTop).toBe(0)
  key('ArrowDown')
  expect(m.viewport.scrollTop).toBe(40)
  const back = new WheelEvent('wheel', { deltaY: -1, deltaMode: 1, cancelable: true })
  m.track.dispatchEvent(back)
  expect(m.viewport.scrollTop).toBe(24)
  expect(back.defaultPrevented).toBe(true)
})
test('observation deduplicates snapshots and stops after disposal', () => {
  const { viewport } = fixture(),
    change = vi.fn()
  const observer = observeScrollArea(viewport, undefined, change)
  disposals.push(observer.destroy)
  observer.measure()
  expect(change).toHaveBeenCalledTimes(1)
  viewport.scrollTop = 100
  viewport.dispatchEvent(new Event('scroll'))
  expect(change).toHaveBeenCalledTimes(2)
  observer.destroy()
  viewport.scrollTop = 200
  viewport.dispatchEvent(new Event('scroll'))
  observer.measure()
  expect(change).toHaveBeenCalledTimes(2)
})

test('overlapping scrollbar gestures retain selection suppression until the final release', () => {
  const first = fixture(),
    second = fixture()
  document.documentElement.style.userSelect = 'text'
  first.thumb.dispatchEvent(first.pointer('pointerdown'))
  second.thumb.dispatchEvent(second.pointer('pointerdown', { pointerId: 2, pointerType: 'touch' }))
  first.control.destroy()
  expect(document.documentElement.style.userSelect).toBe('none')
  second.control.destroy()
  expect(document.documentElement.style.userSelect).toBe('text')
})

test('drag cleanup preserves author changes to an inline style priority', () => {
  const m = fixture()
  document.documentElement.style.userSelect = 'text'
  m.thumb.dispatchEvent(m.pointer('pointerdown'))
  document.documentElement.style.setProperty('user-select', 'none', 'important')
  m.control.destroy()
  expect(document.documentElement.style.userSelect).toBe('none')
  expect(document.documentElement.style.getPropertyPriority('user-select')).toBe('important')
})

test('smooth native offsets may lag while the custom track still consumes wheel input', () => {
  const m = fixture(),
    requested = vi.fn()
  Object.defineProperty(m.viewport, 'scrollTop', { get: () => 0, set: requested })
  const wheel = new WheelEvent('wheel', { deltaY: 100, cancelable: true })
  m.track.dispatchEvent(wheel)
  expect(requested).toHaveBeenCalledExactlyOnceWith(100)
  expect(wheel.defaultPrevented).toBe(true)
})

test('direction attribute changes refresh physical metrics without a scroll event', async () => {
  const { viewport } = fixture(),
    content = document.createElement('div'),
    change = vi.fn()
  viewport.append(content)
  const observer = observeScrollArea(viewport, content, change)
  disposals.push(observer.destroy)
  viewport.style.direction = 'rtl'
  await vi.waitFor(() =>
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ left: 400 }))
  )
})
