import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { virtualizer } from '../../../core/src/virtualizer/virtualizer'
import { createVirtualizerController } from './virtualizer'

const observers: { targets: Set<Element>; report: (entries: { target: Element }[]) => void }[] = []
const cleanup: (() => void)[] = []
beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      targets = new Set<Element>()
      report: (entries: { target: Element }[]) => void
      constructor(report: (entries: { target: Element }[]) => void) {
        this.report = report
        observers.push(this)
      }
      observe(element: Element) {
        this.targets.add(element)
      }
      unobserve(element: Element) {
        this.targets.delete(element)
      }
      disconnect() {
        this.targets.clear()
      }
    }
  )
})
afterEach(() => {
  cleanup.splice(0).forEach((dispose) => dispose())
  observers.length = 0
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})
function resize(element: Element) {
  for (const observer of observers) {
    if (observer.targets.has(element)) observer.report([{ target: element }])
  }
}
function setup() {
  const element = document.createElement('div')
  Object.defineProperty(element, 'clientHeight', { value: 100 })
  document.body.append(element)
  const layout = virtualizer({ count: 20, estimateSize: () => 20 })
  const controller = createVirtualizerController(element, { layout })
  cleanup.push(controller.dispose)
  function row(index: number, initial: number) {
    const node = document.createElement('div')
    node.dataset.index = String(index)
    let height = initial
    node.getBoundingClientRect = () => ({ height }) as DOMRect
    element.append(node)
    return {
      node,
      grow(next: number) {
        height = next
        resize(node)
      },
    }
  }
  return { element, layout, controller, row }
}

test('unmeasuring a connected row stops updates and registering it again measures its latest size', () => {
  const s = setup()
  const row = s.row(2, 30)
  s.controller.measureElement(row.node)
  expect(s.layout.item(2)?.size).toBe(30)
  s.controller.unmeasureElement(row.node)
  s.controller.unmeasureElement(row.node)
  row.grow(60)
  expect(s.layout.item(2)?.size).toBe(30)
  s.controller.measureElement(row.node)
  expect(s.layout.item(2)?.size).toBe(60)
})

test('recycling a measured row reads its current data-index on resize', () => {
  const s = setup()
  const row = s.row(2, 30)
  s.controller.measureElement(row.node)
  row.node.dataset.index = '8'
  row.grow(55)
  expect(s.layout.item(2)?.size).toBe(30)
  expect(s.layout.item(8)?.size).toBe(55)
})

test('a programmatic scroll event preserves index alignment through later measurement', () => {
  const s = setup()
  s.controller.scrollToIndex(10, { align: 'start' })
  expect(s.controller.offset()).toBe(200)
  s.element.dispatchEvent(new Event('scroll'))
  const above = s.row(1, 50)
  s.controller.measureElement(above.node)
  expect(s.controller.offset()).toBe(230)
  expect(s.element.scrollTop).toBe(230)
})

test('unsubscribing one listener is repeatable and preserves other listeners', () => {
  const s = setup()
  const first = vi.fn(),
    second = vi.fn()
  const stop = s.controller.subscribe(first)
  s.controller.subscribe(second)
  s.controller.scrollToOffset(20)
  stop()
  stop()
  s.controller.scrollToOffset(40)
  expect(first).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(2)
})

test('disposal disconnects viewport and rows and prevents fresh measurement registrations', () => {
  const s = setup()
  const row = s.row(1, 30)
  s.controller.measureElement(row.node)
  const listener = vi.fn()
  s.controller.subscribe(listener)
  s.controller.dispose()
  s.controller.dispose()
  expect(observers.every((observer) => observer.targets.size === 0)).toBe(true)
  row.grow(80)
  s.element.scrollTop = 200
  s.element.dispatchEvent(new Event('scroll'))
  s.controller.measureElement(s.row(2, 70).node)
  expect(s.layout.item(1)?.size).toBe(30)
  expect(s.layout.item(2)?.size).toBe(20)
  expect(s.controller.offset()).toBe(0)
  expect(listener).not.toHaveBeenCalled()
  expect(observers.every((observer) => observer.targets.size === 0)).toBe(true)
})
