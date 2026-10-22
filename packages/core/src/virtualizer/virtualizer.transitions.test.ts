import { describe, expect, test } from 'vitest'
import { virtualizer } from './virtualizer'

describe('virtualizer layout transitions', () => {
  test('switching fixed sizing on and off retains keyed measurements', () => {
    const list = virtualizer({ count: 3, estimateSize: () => 10 })
    list.measure(1, 30)
    expect(list.totalSize()).toBe(50)
    list.setOptions({ count: 3, size: 5 })
    expect(list.totalSize()).toBe(15)
    expect(list.measure(1, 100)).toEqual({ changed: false, scrollAdjustment: 0 })
    list.setOptions({ count: 3, estimateSize: () => 20 })
    expect(list.item(1)?.size).toBe(30)
    expect(list.totalSize()).toBe(70)
  })

  test('shrinking to empty and growing restores measurements only for matching keys', () => {
    const list = virtualizer({ count: 3, getKey: (i) => `old-${i}`, estimateSize: () => 10 })
    list.measure(2, 50)
    list.setOptions({ count: 0, paddingStart: 3, paddingEnd: 4 })
    expect(list.totalSize()).toBe(7)
    expect(list.range(0, 100)).toEqual({
      startIndex: -1,
      endIndex: -1,
      visibleStartIndex: -1,
      visibleEndIndex: -1,
    })
    list.setOptions({ count: 3, getKey: (i) => `new-${i}`, estimateSize: () => 10 })
    expect(list.totalSize()).toBe(30)
    list.setOptions({ count: 3, getKey: (i) => `old-${i}`, estimateSize: () => 10 })
    expect(list.totalSize()).toBe(70)
  })

  test('recording the current estimate still preserves it when estimates later change', () => {
    const list = virtualizer({ count: 2, estimateSize: () => 10 })
    expect(list.measure(0, 10)).toEqual({ changed: false, scrollAdjustment: 0 })
    list.setOptions({ count: 2, estimateSize: () => 20 })
    expect(list.item(0)?.size).toBe(10)
    expect(list.item(1)?.size).toBe(20)
    list.clearMeasurements()
    expect(list.totalSize()).toBe(40)
  })

  test('measurements at the viewport edge do not move the viewport', () => {
    const list = virtualizer({ count: 4, estimateSize: () => 10, gap: 2, paddingStart: 5 })
    expect(list.measure(1, 20, 17)).toEqual({ changed: true, scrollAdjustment: 0 })
    expect(list.item(2)?.start).toBe(39)
    expect(list.measure(1, 5, 18)).toEqual({ changed: true, scrollAdjustment: -15 })
    expect(list.item(3)?.start).toBe(36)
    expect(list.totalSize()).toBe(46)
  })

  test.each([-1, 0.5, NaN, Infinity, 3])(
    'invalid measurement index %s leaves layout unchanged',
    (index) => {
      const list = virtualizer({ count: 3, estimateSize: () => 10 })
      expect(list.measure(index, 100, 100)).toEqual({ changed: false, scrollAdjustment: 0 })
      expect(list.item(index)).toBeUndefined()
      expect(list.totalSize()).toBe(30)
    }
  )

  test('fractional dimensions retain pixel precision and exclude trailing gaps', () => {
    const list = virtualizer({
      count: 3,
      size: 2.5,
      gap: 0.5,
      paddingStart: 1.25,
      paddingEnd: 0.75,
      overscan: 0,
    })
    expect(list.totalSize()).toBe(10.5)
    expect(list.item(1)).toMatchObject({ start: 4.25, end: 6.75, size: 2.5 })
    expect(list.range(4.25, 3).visibleEndIndex).toBe(1)
    expect(list.range(4.25, 3.01).visibleEndIndex).toBe(2)
  })

  test('sticky section changes replace the pinned heading and never duplicate it', () => {
    const list = virtualizer({
      count: 12,
      size: 10,
      overscan: 0,
      sticky: (i) => i === 2 || i === 7,
    })
    expect(list.items(0, 10).some((item) => item.pinned)).toBe(false)
    expect(
      list
        .items(69, 1)
        .filter((item) => item.pinned)
        .map((item) => item.index)
    ).toEqual([2])
    expect(list.items(70, 10).map((item) => [item.index, item.pinned])).toEqual([[7, true]])
    expect(list.items(90, 10).map((item) => item.index)).toEqual([7, 9])
    list.setOptions({ count: 12, size: 10, overscan: 0, sticky: (i) => i === 5 })
    expect(list.items(90, 10).map((item) => item.index)).toEqual([5, 9])
  })

  test('measured heading height determines the space reserved by start and auto scrolling', () => {
    const list = virtualizer({ count: 20, estimateSize: () => 10, sticky: (i) => i === 0 })
    list.measure(0, 30)
    expect(list.scrollOffset(5, 'start', 0, 50)).toBe(40)
    expect(list.scrollOffset(5, 'auto', 50, 50)).toBe(40)
    expect(list.scrollOffset(5, 'auto', 40, 50)).toBe(40)
    list.clearMeasurements()
    expect(list.scrollOffset(5, 'start', 0, 50)).toBe(40)
  })
})
