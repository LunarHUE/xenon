import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
// The DOM package has no runtime dependency on core; tests drive the real layout math.
import { virtualizer } from '../../../core/src/virtualizer/virtualizer'
import type { VirtualizerOptions } from '../../../core/src/virtualizer/virtualizer'
import { createVirtualizerController } from './virtualizer'
import type { VirtualizerControllerOptions } from './virtualizer'

type Entry = { target: Element; borderBoxSize?: { blockSize: number; inlineSize: number }[] }
type Callback = (entries: Entry[]) => void
const observers: { callback: Callback; targets: Set<Element> }[] = []
const disposals: Array<() => void> = []

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      targets = new Set<Element>()
      callback: Callback
      constructor(callback: Callback) {
        this.callback = callback
        observers.push(this)
      }
      observe(target: Element) {
        this.targets.add(target)
      }
      unobserve(target: Element) {
        this.targets.delete(target)
      }
      disconnect() {
        this.targets.clear()
      }
    }
  )
})
afterEach(() => {
  disposals.splice(0).forEach((dispose) => dispose())
  observers.length = 0
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})

/** Report a resize to every observer watching target, with a border box when given. */
function resize(target: Element, blockSize?: number) {
  const entry: Entry =
    blockSize === undefined ? { target } : { target, borderBoxSize: [{ blockSize, inlineSize: 0 }] }
  for (const observer of observers) if (observer.targets.has(target)) observer.callback([entry])
}

function setup(
  layoutOptions: VirtualizerOptions,
  options: Omit<VirtualizerControllerOptions, 'layout'> = {}
) {
  const element = document.createElement('div')
  let height = 100
  Object.defineProperty(element, 'clientHeight', { get: () => height, configurable: true })
  document.body.append(element)
  const layout = virtualizer(layoutOptions)
  const follow = vi.fn()
  const controller = createVirtualizerController(element, {
    layout,
    onFollowChange: follow,
    ...options,
  })
  disposals.push(controller.dispose)
  const changes = vi.fn()
  controller.subscribe(changes)
  const scroll = (top: number) => {
    element.scrollTop = top
    element.dispatchEvent(new Event('scroll'))
  }
  const setHeight = (next: number) => {
    height = next
    resize(element)
  }
  /** Grow the viewport the way a browser does: the clamped scroll event arrives before the resize report. */
  const clamp = (next: number, top: number) => {
    height = next
    scroll(top)
  }
  /** A row whose layout height is rowHeight and whose bounding rect is scaled by scale. */
  const row = (index: number, rowHeight: number, scale = 1) => {
    const node = document.createElement('div')
    node.setAttribute('data-index', String(index))
    let current = rowHeight
    Object.defineProperty(node, 'offsetHeight', { get: () => current, configurable: true })
    node.getBoundingClientRect = () => ({ height: current * scale }) as DOMRect
    element.append(node)
    return {
      node,
      grow(next: number) {
        current = next
        resize(node)
      },
      /** Report a resize that carries the border box, as browsers do. */
      report(next: number) {
        current = Math.round(next)
        resize(node, next)
      },
    }
  }
  return { element, layout, controller, changes, follow, scroll, setHeight, clamp, row }
}

describe('scrolling', () => {
  test('tracks scroll events and the viewport size', () => {
    const m = setup({ count: 100, size: 10 })
    expect(m.controller.offset()).toBe(0)
    expect(m.controller.viewportSize()).toBe(100)
    m.scroll(250)
    expect(m.controller.offset()).toBe(250)
    expect(m.changes).toHaveBeenCalledTimes(1)
    m.setHeight(200)
    expect(m.controller.viewportSize()).toBe(200)
    expect(m.changes).toHaveBeenCalledTimes(2)
  })

  test('the scroll listener is passive and removed on dispose', () => {
    const element = document.createElement('div')
    const add = vi.spyOn(element, 'addEventListener')
    const remove = vi.spyOn(element, 'removeEventListener')
    const controller = createVirtualizerController(element, {
      layout: virtualizer({ count: 1 }),
    })
    expect(add).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    const listener = vi.fn()
    controller.subscribe(listener)
    controller.dispose()
    expect(remove).toHaveBeenCalledWith('scroll', add.mock.calls[0]![1])
    element.dispatchEvent(new Event('scroll'))
    expect(listener).not.toHaveBeenCalled()
  })

  test('scrollToIndex updates the offset before any scroll event', () => {
    const m = setup({ count: 1000, size: 10 })
    m.controller.scrollToIndex(500, { align: 'start' })
    expect(m.element.scrollTop).toBe(5000)
    expect(m.controller.offset()).toBe(5000)
    expect(m.changes).toHaveBeenCalledTimes(1)
    m.controller.scrollToIndex(505)
    expect(m.controller.offset()).toBe(5000)
    m.controller.scrollToIndex(520)
    expect(m.controller.offset()).toBe(5110)
    m.controller.scrollToOffset(-20)
    expect(m.controller.offset()).toBe(0)
  })

  test('scrollToIndex re-aligns its target as rows are measured, until the user scrolls', () => {
    const m = setup({ count: 100, estimateSize: () => 20 })
    m.controller.scrollToIndex(50, { align: 'start' })
    expect(m.controller.offset()).toBe(1000)
    const above = m.row(49, 20)
    m.controller.measureElement(above.node)
    above.grow(60)
    expect(m.controller.offset()).toBe(1040)
    m.scroll(900)
    above.grow(80)
    expect(m.controller.offset()).toBe(900)
  })

  test('sync reapplies a clamped programmatic offset', () => {
    const m = setup({ count: 100, size: 10 })
    let top = 0
    let limit = 300
    Object.defineProperty(m.element, 'scrollTop', {
      get: () => top,
      set: (value: number) => (top = Math.min(value, limit)),
    })
    m.controller.scrollToOffset(800)
    expect(top).toBe(300)
    limit = Infinity
    m.controller.sync()
    expect(top).toBe(800)
  })
})

describe('measurement', () => {
  test('rows above the viewport keep visible content still', () => {
    const m = setup({ count: 100, estimateSize: () => 20 })
    m.scroll(400)
    const above = m.row(5, 20)
    const below = m.row(30, 20)
    m.controller.measureElement(above.node)
    m.controller.measureElement(below.node)
    m.changes.mockClear()
    above.grow(50)
    expect(m.layout.totalSize()).toBe(2030)
    expect(m.element.scrollTop).toBe(430)
    expect(m.controller.offset()).toBe(430)
    expect(m.changes).toHaveBeenCalledTimes(1)
    below.grow(70)
    expect(m.element.scrollTop).toBe(430)
    expect(m.layout.totalSize()).toBe(2080)
  })

  test('connected rows are measured immediately and unchanged sizes stay quiet', () => {
    const m = setup({ count: 10, estimateSize: () => 20 })
    const first = m.row(0, 35)
    m.controller.measureElement(first.node)
    expect(m.layout.item(1)?.start).toBe(35)
    m.changes.mockClear()
    first.grow(35)
    expect(m.changes).not.toHaveBeenCalled()
  })

  test('disconnected rows stop being observed', () => {
    const m = setup({ count: 10, estimateSize: () => 20 })
    const row = m.row(2, 20)
    m.controller.measureElement(row.node)
    row.node.remove()
    row.grow(0)
    expect(m.layout.item(2)?.size).toBe(20)
    expect(observers.some((observer) => observer.targets.has(row.node))).toBe(false)
  })

  test('rows without a numeric data-index are ignored', () => {
    const m = setup({ count: 10, estimateSize: () => 20 })
    const node = document.createElement('div')
    Object.defineProperty(node, 'offsetHeight', { value: 99 })
    m.element.append(node)
    m.controller.measureElement(node)
    expect(m.layout.totalSize()).toBe(200)
  })
})

describe('measurement under a scaled ancestor', () => {
  test('a direct measurement uses the layout height, not the scaled bounding rect', () => {
    const m = setup({ count: 10, estimateSize: () => 20 })
    const first = m.row(0, 22, 0.5)
    m.controller.measureElement(first.node)
    expect(m.layout.item(0)?.size).toBe(22)
    expect(m.layout.item(1)?.start).toBe(22)
    expect(m.layout.totalSize()).toBe(202)
  })

  test('resize reports use the border-box block size and keep fractions', () => {
    const m = setup({ count: 10, estimateSize: () => 20 })
    const first = m.row(0, 20, 0.7)
    m.controller.measureElement(first.node)
    first.report(22.4)
    expect(m.layout.item(0)?.size).toBe(22.4)
    expect(m.layout.item(1)?.start).toBe(22.4)
    first.grow(30)
    expect(m.layout.item(0)?.size).toBe(30)
  })

  test('scroll anchoring and follow use unscaled sizes', () => {
    const m = setup({ count: 20, estimateSize: () => 20 }, { follow: true })
    expect(m.element.scrollTop).toBe(300)
    const last = m.row(19, 40, 1.3)
    m.controller.measureElement(last.node)
    expect(m.layout.totalSize()).toBe(420)
    expect(m.element.scrollTop).toBe(320)
    expect(m.controller.following()).toBe(true)
    m.scroll(100)
    const above = m.row(1, 50, 0.5)
    m.controller.measureElement(above.node)
    expect(m.element.scrollTop).toBe(130)
  })

  test('elements without offsetHeight fall back to the bounding rect', () => {
    const m = setup({ count: 10, estimateSize: () => 20 })
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    node.setAttribute('data-index', '3')
    node.getBoundingClientRect = () => ({ height: 33 }) as DOMRect
    m.element.append(node)
    m.controller.measureElement(node)
    expect(m.layout.item(3)?.size).toBe(33)
  })
})

describe('follow mode', () => {
  test('starts pinned and stays pinned while rows are appended or grow', () => {
    const options = { count: 20, estimateSize: () => 20 }
    const m = setup(options, { follow: true })
    expect(m.controller.following()).toBe(true)
    expect(m.element.scrollTop).toBe(300)
    m.layout.setOptions({ ...options, count: 30 })
    m.controller.update()
    expect(m.element.scrollTop).toBe(500)
    const last = m.row(29, 20)
    m.controller.measureElement(last.node)
    last.grow(80)
    expect(m.element.scrollTop).toBe(560)
    m.setHeight(200)
    expect(m.element.scrollTop).toBe(460)
    expect(m.follow).not.toHaveBeenCalled()
  })

  test('scrolling up stops following; reaching the end resumes it', () => {
    const options = { count: 20, size: 20 }
    const m = setup(options, { follow: true })
    m.scroll(250)
    expect(m.controller.following()).toBe(false)
    expect(m.follow).toHaveBeenLastCalledWith(false)
    m.layout.setOptions({ ...options, count: 40 })
    m.controller.update()
    expect(m.element.scrollTop).toBe(250)
    m.scroll(700)
    expect(m.controller.following()).toBe(true)
    expect(m.follow).toHaveBeenLastCalledWith(true)
    m.scroll(699.5)
    expect(m.controller.following()).toBe(true)
  })

  test('a viewport that grows and clamps scrollTop before its resize report keeps following', () => {
    const m = setup({ count: 20, size: 20 }, { follow: true })
    m.clamp(160, 240)
    expect(m.controller.viewportSize()).toBe(160)
    expect(m.controller.following()).toBe(true)
    expect(m.element.scrollTop).toBe(240)
    m.setHeight(160)
    expect(m.controller.following()).toBe(true)
    expect(m.follow).not.toHaveBeenCalled()
  })

  test('viewport growth after scrolling away resumes following only once the clamp reaches the end', () => {
    const m = setup({ count: 20, size: 20 }, { follow: true })
    m.scroll(100)
    expect(m.follow).toHaveBeenLastCalledWith(false)
    m.setHeight(150)
    expect(m.controller.following()).toBe(false)
    expect(m.element.scrollTop).toBe(100)
    m.clamp(320, 80)
    expect(m.controller.following()).toBe(true)
    expect(m.follow).toHaveBeenLastCalledWith(true)
    expect(m.follow).toHaveBeenCalledTimes(2)
  })

  test('programmatic scrolls update following; scrollToEnd resumes it', () => {
    const m = setup({ count: 20, size: 20 }, { follow: true })
    m.controller.scrollToIndex(0)
    expect(m.controller.following()).toBe(false)
    m.controller.scrollToEnd()
    expect(m.controller.following()).toBe(true)
    expect(m.element.scrollTop).toBe(300)
  })

  test('without follow, appended rows never move scrollTop', () => {
    const options = { count: 20, size: 20 }
    const m = setup(options)
    m.scroll(300)
    m.layout.setOptions({ ...options, count: 40 })
    m.controller.update()
    expect(m.element.scrollTop).toBe(300)
    expect(m.controller.following()).toBe(false)
  })

  test('toggling follow pins on enable and reports disable', () => {
    const options = { count: 20, size: 20 }
    const m = setup(options)
    const layout = m.layout
    m.controller.setOptions({ layout, follow: true, onFollowChange: m.follow })
    expect(m.follow).toHaveBeenLastCalledWith(true)
    expect(m.element.scrollTop).toBe(300)
    m.controller.setOptions({ layout, follow: false, onFollowChange: m.follow })
    expect(m.follow).toHaveBeenLastCalledWith(false)
    expect(m.controller.following()).toBe(false)
  })

  test('the threshold widens what counts as the end', () => {
    const m = setup({ count: 20, size: 20 }, { follow: true, followThreshold: 30 })
    m.scroll(280)
    expect(m.controller.following()).toBe(true)
    m.scroll(260)
    expect(m.controller.following()).toBe(false)
  })
})
