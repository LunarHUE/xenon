import { createRoot, createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createVirtualizer } from './virtual-list'

const roots: (() => void)[] = []
const observers: Observer[] = []
class Observer {
  targets = new Set<Element>()
  readonly callback: ResizeObserverCallback
  constructor(callback: ResizeObserverCallback) {
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
  resize(target: Element) {
    this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver)
  }
}
beforeEach(() => vi.stubGlobal('ResizeObserver', Observer))
afterEach(() => {
  roots.splice(0).forEach((dispose) => dispose())
  observers.length = 0
  document.body.replaceChildren()
  vi.unstubAllGlobals()
})
function owner<T>(setup: () => T) {
  return createRoot((dispose) => {
    roots.push(dispose)
    return { ...setup(), dispose }
  })
}
function viewport(height = 100, top = 0) {
  const element = document.createElement('div')
  Object.defineProperty(element, 'clientHeight', { value: height, configurable: true })
  element.scrollTop = top
  document.body.append(element)
  return element
}
function row(index: number, height: number) {
  const element = document.createElement('div')
  element.dataset.index = String(index)
  element.getBoundingClientRect = () => ({ height }) as DOMRect
  document.body.append(element)
  return element
}

describe('createVirtualizer reactive lifecycle', () => {
  test('replaces the scroll element and ignores scrolls from the former owner', () => {
    const first = viewport(100, 40)
    const second = viewport(60, 200)
    const { list, setElement } = owner(() => {
      const [element, setElement] = createSignal(first)
      return {
        setElement,
        list: createVirtualizer({
          count: 100,
          size: 20,
          overscan: 0,
          get scrollElement() {
            return element()
          },
        }),
      }
    })
    flush()
    expect(list.offset()).toBe(40)
    expect(list.viewportSize()).toBe(100)
    const previous = observers.filter((observer) => observer.targets.has(first))
    expect(previous).toHaveLength(1)
    setElement(second)
    flush()
    expect(list.offset()).toBe(200)
    expect(list.viewportSize()).toBe(60)
    expect(previous[0]!.targets.size).toBe(0)
    first.scrollTop = 800
    first.dispatchEvent(new Event('scroll'))
    flush()
    expect(list.offset()).toBe(200)
    second.scrollTop = 300
    second.dispatchEvent(new Event('scroll'))
    flush()
    expect(list.offset()).toBe(300)
    expect(list.isRendered(15)).toBe(true)
    expect(list.isRendered(2)).toBe(false)
  })

  test('disposal disconnects row and viewport observations and scroll reactions', () => {
    const element = viewport()
    const measured = row(0, 35)
    const { list, dispose } = owner(() => ({
      list: createVirtualizer({
        count: 10,
        estimateSize: () => 20,
        scrollElement: element,
      }),
    }))
    flush()
    list.measureElement(measured)
    flush()
    expect(list.totalSize()).toBe(215)
    expect(observers.some((observer) => observer.targets.has(measured))).toBe(true)
    dispose()
    expect(observers.every((observer) => observer.targets.size === 0)).toBe(true)
    element.scrollTop = 80
    element.dispatchEvent(new Event('scroll'))
    flush()
    expect(list.offset()).toBe(0)
  })

  test('queues measurements before attachment and removes rows released before attachment', () => {
    const kept = row(0, 35)
    const removed = row(1, 80)
    const { list, setElement } = owner(() => {
      const [element, setElement] = createSignal<HTMLElement>()
      return {
        setElement,
        list: createVirtualizer({
          count: 10,
          estimateSize: () => 20,
          get scrollElement() {
            return element()
          },
        }),
      }
    })
    list.measureElement(kept)
    list.measureElement(removed)
    list.unmeasureElement(removed)
    setElement(viewport())
    flush()
    expect(list.totalSize()).toBe(215)
    expect(observers.some((observer) => observer.targets.has(kept))).toBe(true)
    expect(observers.some((observer) => observer.targets.has(removed))).toBe(false)
    list.unmeasureElement(kept)
    expect(observers.some((observer) => observer.targets.has(kept))).toBe(false)
  })

  test('viewport resizing changes visible rows without a scroll event', () => {
    const element = viewport(40)
    const { list } = owner(() => ({
      list: createVirtualizer({
        count: 100,
        size: 20,
        overscan: 0,
        scrollElement: element,
      }),
    }))
    flush()
    expect(list.items.map((item) => item.index)).toEqual([0, 1])
    Object.defineProperty(element, 'clientHeight', { value: 80, configurable: true })
    observers.find((observer) => observer.targets.has(element))!.resize(element)
    flush()
    expect(list.viewportSize()).toBe(80)
    expect(list.items.map((item) => item.index)).toEqual([0, 1, 2, 3])
  })

  test('count and geometry updates refresh item positions and empty the rendered set', () => {
    const { list, setCount, setSize, setGap } = owner(() => {
      const [count, setCount] = createSignal(5)
      const [size, setSize] = createSignal(20)
      const [gap, setGap] = createSignal(0)
      return {
        setCount,
        setSize,
        setGap,
        list: createVirtualizer({
          get count() {
            return count()
          },
          get size() {
            return size()
          },
          get gap() {
            return gap()
          },
          scrollElement: viewport(),
          overscan: 0,
        }),
      }
    })
    flush()
    expect(list.totalSize()).toBe(100)
    setSize(30)
    setGap(5)
    flush()
    expect(list.totalSize()).toBe(170)
    expect(list.items[1]).toMatchObject({ index: 1, start: 35, size: 30 })
    setCount(0)
    flush()
    expect(list.count()).toBe(0)
    expect(list.totalSize()).toBe(0)
    expect(list.items).toHaveLength(0)
    expect(list.isRendered(0)).toBe(false)
    setCount(2)
    flush()
    expect(list.items.map((item) => item.index)).toEqual([0, 1])
    expect(list.totalSize()).toBe(65)
  })

  test('measurements follow stable keys when data is reordered', () => {
    const { list, setKeys } = owner(() => {
      const [keys, setKeys] = createSignal(['a', 'b', 'c'])
      return {
        setKeys,
        list: createVirtualizer({
          count: 3,
          estimateSize: () => 20,
          getKey: (index) => keys()[index]!,
          scrollElement: viewport(),
          overscan: 0,
        }),
      }
    })
    flush()
    list.measureElement(row(0, 40))
    flush()
    expect(list.totalSize()).toBe(80)
    setKeys(['c', 'b', 'a'])
    flush()
    expect(list.items.map(({ key, index, start, size }) => ({ key, index, start, size }))).toEqual([
      { key: 'c', index: 0, start: 0, size: 20 },
      { key: 'b', index: 1, start: 20, size: 20 },
      { key: 'a', index: 2, start: 40, size: 40 },
    ])
  })

  test('enabling and disabling follow uses the current callback and respects later appends', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { list, setFollow, setCount, setCallback } = owner(() => {
      const [follow, setFollow] = createSignal(false)
      const [count, setCount] = createSignal(10)
      const [callback, setCallback] = createSignal(() => first)
      return {
        setFollow,
        setCount,
        setCallback,
        list: createVirtualizer({
          get count() {
            return count()
          },
          size: 20,
          scrollElement: viewport(),
          get follow() {
            return follow()
          },
          get onFollowChange() {
            return callback()
          },
        }),
      }
    })
    flush()
    expect(list.following()).toBe(false)
    setFollow(true)
    flush()
    expect(list.following()).toBe(true)
    expect(list.offset()).toBe(100)
    expect(first).toHaveBeenCalledExactlyOnceWith(true)
    setCallback(() => second)
    setFollow(false)
    flush()
    expect(second).toHaveBeenCalledExactlyOnceWith(false)
    setCount(20)
    flush()
    expect(list.offset()).toBe(100)
    setFollow(true)
    flush()
    expect(list.offset()).toBe(300)
    expect(list.following()).toBe(true)
  })
})
