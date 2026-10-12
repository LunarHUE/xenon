import { describe, expect, test, vi } from 'vitest'
import { virtualizer } from './virtualizer'

const indices = (items: { index: number }[]) => items.map((item) => item.index)

describe('fixed size', () => {
  test('total size, padding, gap and item positions', () => {
    const list = virtualizer({ count: 3, size: 10, gap: 2, paddingStart: 5, paddingEnd: 7 })
    expect(list.totalSize()).toBe(5 + 10 * 3 + 2 * 2 + 7)
    expect(list.item(2)).toEqual({
      index: 2,
      key: 2,
      start: 29,
      size: 10,
      end: 39,
      sticky: false,
      pinned: false,
    })
    expect(list.item(3)).toBeUndefined()
    expect(list.item(-1)).toBeUndefined()
    expect(virtualizer({ count: 0, size: 10, paddingStart: 4 }).totalSize()).toBe(4)
  })

  test('visible range plus overscan, clamped to the list', () => {
    const list = virtualizer({ count: 100, size: 10, overscan: 2 })
    expect(list.range(0, 50)).toEqual({
      startIndex: 0,
      endIndex: 6,
      visibleStartIndex: 0,
      visibleEndIndex: 4,
    })
    expect(list.range(105, 50)).toEqual({
      startIndex: 8,
      endIndex: 17,
      visibleStartIndex: 10,
      visibleEndIndex: 15,
    })
    expect(indices(list.items(990, 50))).toEqual([97, 98, 99])
    expect(indices(list.items(0, 0))).toEqual([0, 1, 2])
  })

  test('default overscan is 4 and empty lists render nothing', () => {
    expect(indices(virtualizer({ count: 100, size: 10 }).items(200, 10))).toEqual([
      16, 17, 18, 19, 20, 21, 22, 23, 24,
    ])
    const empty = virtualizer({ count: 0, size: 10 })
    expect(empty.items(0, 100)).toEqual([])
    expect(empty.indexAt(10)).toBe(-1)
    expect(empty.range(0, 100).startIndex).toBe(-1)
    expect(empty.scrollOffset(3, 'start', 0, 100)).toBe(0)
  })

  test('index at offset clamps to the list', () => {
    const list = virtualizer({ count: 10, size: 10, paddingStart: 20 })
    expect(list.indexAt(-5)).toBe(0)
    expect(list.indexAt(25)).toBe(0)
    expect(list.indexAt(30)).toBe(1)
    expect(list.indexAt(10_000)).toBe(9)
  })

  test('measurements are ignored', () => {
    const list = virtualizer({ count: 10, size: 10 })
    expect(list.measure(2, 50, 100)).toEqual({ changed: false, scrollAdjustment: 0 })
    expect(list.totalSize()).toBe(100)
  })

  test('ignores non-finite and negative inputs', () => {
    const list = virtualizer({ count: Number.NaN, size: 10 })
    expect(list.count()).toBe(0)
    list.setOptions({ count: 2.7, size: -4, gap: Number.NaN })
    expect(list.count()).toBe(2)
    expect(list.totalSize()).toBe(0)
  })
})

describe('estimated and measured sizes', () => {
  test('estimates by index and defaults to 40', () => {
    expect(virtualizer({ count: 3 }).totalSize()).toBe(120)
    const list = virtualizer({ count: 3, estimateSize: (index) => (index + 1) * 10 })
    expect(list.totalSize()).toBe(60)
    expect(list.item(2)).toMatchObject({ start: 30, size: 30, end: 60 })
    expect(list.indexAt(29)).toBe(1)
  })

  test('measured sizes replace estimates and shift later items', () => {
    const list = virtualizer({ count: 5, estimateSize: () => 20 })
    expect(list.measure(1, 50)).toEqual({ changed: true, scrollAdjustment: 0 })
    expect(list.item(2)?.start).toBe(70)
    expect(list.totalSize()).toBe(130)
    expect(list.measure(1, 50)).toEqual({ changed: false, scrollAdjustment: 0 })
    expect(list.measure(9, 50).changed).toBe(false)
  })

  test('changes above the offset report a scroll adjustment', () => {
    const list = virtualizer({ count: 50, estimateSize: () => 20 })
    expect(list.measure(2, 30, 200)).toEqual({ changed: true, scrollAdjustment: 10 })
    expect(list.measure(2, 25, 200)).toEqual({ changed: true, scrollAdjustment: -5 })
    expect(list.measure(10, 30, 200)).toEqual({ changed: true, scrollAdjustment: 0 })
    expect(list.measure(20, 30, 200)).toEqual({ changed: true, scrollAdjustment: 0 })
  })

  test('measurements follow keys across reorders', () => {
    let order = ['a', 'b', 'c']
    const options = () => ({
      count: order.length,
      estimateSize: () => 10,
      getKey: (index: number) => order[index]!,
    })
    const list = virtualizer(options())
    list.measure(0, 100)
    expect(list.totalSize()).toBe(120)
    order = ['c', 'b', 'a']
    list.setOptions(options())
    expect(list.item(0)).toMatchObject({ key: 'c', size: 10 })
    expect(list.item(2)).toMatchObject({ key: 'a', start: 20, size: 100 })
    list.clearMeasurements()
    expect(list.totalSize()).toBe(30)
  })

  test('the same options object does not invalidate the cache', () => {
    const estimateSize = vi.fn(() => 10)
    const options = { count: 100, estimateSize }
    const list = virtualizer(options)
    list.totalSize()
    expect(estimateSize).toHaveBeenCalledTimes(100)
    list.setOptions(options)
    list.items(500, 100)
    expect(estimateSize).toHaveBeenCalledTimes(100)
    list.setOptions({ ...options })
    list.totalSize()
    expect(estimateSize).toHaveBeenCalledTimes(200)
  })

  test('grows its buffers when count increases', () => {
    const list = virtualizer({ count: 2, estimateSize: () => 10 })
    expect(list.totalSize()).toBe(20)
    list.setOptions({ count: 1000, estimateSize: () => 10 })
    expect(list.totalSize()).toBe(10_000)
    expect(list.item(999)?.start).toBe(9990)
  })
})

describe('scrollOffset', () => {
  const list = virtualizer({ count: 100, size: 10 })

  test('start, center and end alignment clamp to the scrollable range', () => {
    expect(list.scrollOffset(50, 'start', 0, 100)).toBe(500)
    expect(list.scrollOffset(50, 'center', 0, 100)).toBe(455)
    expect(list.scrollOffset(50, 'end', 0, 100)).toBe(410)
    expect(list.scrollOffset(99, 'start', 0, 100)).toBe(900)
    expect(list.scrollOffset(1, 'end', 0, 100)).toBe(0)
    expect(list.scrollOffset(500, 'start', 0, 100)).toBe(900)
  })

  test('auto scrolls the least distance and keeps fully visible items still', () => {
    expect(list.scrollOffset(5, 'auto', 0, 100)).toBe(0)
    expect(list.scrollOffset(20, 'auto', 0, 100)).toBe(110)
    expect(list.scrollOffset(2, 'auto', 100, 100)).toBe(20)
    expect(list.scrollOffset(10, 'auto', 95, 100)).toBe(95)
    expect(list.scrollOffset(10, 'auto', 105, 100)).toBe(100)
  })

  test('first and last items include padding', () => {
    const padded = virtualizer({ count: 10, size: 10, paddingStart: 8, paddingEnd: 8 })
    expect(padded.scrollOffset(0, 'start', 50, 50)).toBe(0)
    expect(padded.scrollOffset(9, 'end', 0, 50)).toBe(padded.maxOffset(50))
    expect(padded.maxOffset(50)).toBe(66)
  })

  test('items taller than the viewport align to their start', () => {
    const tall = virtualizer({ count: 3, estimateSize: () => 300 })
    expect(tall.scrollOffset(1, 'auto', 0, 100)).toBe(300)
  })
})

describe('sticky headings', () => {
  const headings = new Set([0, 10, 20])
  const list = virtualizer({
    count: 30,
    size: 10,
    overscan: 1,
    sticky: (index) => headings.has(index),
  })

  test('the active heading is pinned and included above the overscan', () => {
    const items = list.items(150, 30)
    expect(indices(items)).toEqual([10, 14, 15, 16, 17, 18])
    expect(items[0]).toMatchObject({ index: 10, sticky: true, pinned: true })
    expect(items.filter((item) => item.pinned)).toHaveLength(1)
  })

  test('a heading inside the range is flagged without duplication', () => {
    const items = list.items(100, 30)
    expect(indices(items)).toEqual([9, 10, 11, 12, 13])
    expect(items.find((item) => item.index === 10)?.pinned).toBe(true)
    expect(items.find((item) => item.index === 9)).toMatchObject({ sticky: false, pinned: false })
  })

  test('start and auto alignment leave room for the pinned heading', () => {
    expect(list.scrollOffset(15, 'start', 0, 50)).toBe(140)
    expect(list.scrollOffset(15, 'auto', 150, 50)).toBe(140)
    expect(list.scrollOffset(15, 'auto', 140, 50)).toBe(140)
    expect(list.scrollOffset(20, 'start', 0, 50)).toBe(200)
  })

  test('no headings means nothing is pinned', () => {
    const plain = virtualizer({ count: 30, size: 10, sticky: () => false })
    expect(plain.items(150, 30).some((item) => item.pinned)).toBe(false)
  })
})

describe('follow helpers', () => {
  test('end detection honours the threshold', () => {
    const list = virtualizer({ count: 10, size: 10 })
    expect(list.maxOffset(40)).toBe(60)
    expect(list.isAtEnd(60, 40)).toBe(true)
    expect(list.isAtEnd(59.5, 40)).toBe(true)
    expect(list.isAtEnd(55, 40)).toBe(false)
    expect(list.isAtEnd(55, 40, 5)).toBe(true)
    expect(list.maxOffset(500)).toBe(0)
    expect(list.isAtEnd(0, 500)).toBe(true)
  })
})
