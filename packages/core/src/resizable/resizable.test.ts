import { expect, test } from 'vitest'
import { resizable } from './resizable'

test('adjacent constraints preserve other panels and total', () => {
  const result = resizable({ panels: [{ minSize: 10 }, { minSize: 20 }, {}], sizes: [30, 40, 30] })
  expect(result.resize(0, 90)).toEqual([50, 20, 30])
  expect(result.resize(1, -20)).toEqual([30, 20, 50])
  expect(result.parts.handle(0).attrs['aria-valuemax']).toBe('50')
})
test('invalid sizes distribute inside feasible bounds and invalid constraints disable', () => {
  expect(resizable({ panels: [{ minSize: 70 }, {}], sizes: [NaN] }).state.sizes).toEqual([70, 30])
  expect(resizable({ panels: [{ minSize: 80 }, { minSize: 50 }] }).state.interactive).toBe(false)
  expect(resizable({ panels: [{ maxSize: NaN }, {}] }).state.valid).toBe(false)
})
test('RTL and vertical use their own axis and Home End bounds', () => {
  const rtl = resizable({ panels: [{}, {}], direction: 'rtl' })
  expect(rtl.key(0, 'ArrowRight')).toEqual([49, 51])
  expect(rtl.key(0, 'ArrowUp')).toBeUndefined()
  const vertical = resizable({
    panels: [{ minSize: 20 }, { minSize: 10 }],
    orientation: 'vertical',
  })
  expect(vertical.key(0, 'ArrowDown', true)).toEqual([60, 40])
  expect(vertical.key(0, 'Home')).toEqual([20, 80])
  expect(vertical.key(0, 'End')).toEqual([90, 10])
})
test('collapse and restore respect adjacent capacity', () => {
  const panels = [{ minSize: 20, collapsible: true }, {}]
  expect(resizable({ panels }).toggle(0)).toEqual([0, 100])
  expect(resizable({ panels, sizes: [0, 100] }).toggle(0, 42)).toEqual([42, 58])
  expect(resizable({ panels: [panels[0]!, { maxSize: 80 }] }).toggle(0)).toEqual([50, 50])
})
test('transfer property holds across many requests and handles', () => {
  const panels = [
    { minSize: 10, maxSize: 60 },
    { minSize: 15, maxSize: 60 },
    { minSize: 5, maxSize: 70 },
  ]
  for (let index = 0; index < 2; index++)
    for (let size = -20; size <= 120; size += 0.7) {
      const result = resizable({ panels, sizes: [30, 40, 30] }).resize(index, size)
      expect(result.reduce((a, b) => a + b, 0)).toBeCloseTo(100)
      result.forEach((value, i) => {
        expect(value).toBeGreaterThanOrEqual(panels[i]!.minSize)
        expect(value).toBeLessThanOrEqual(panels[i]!.maxSize)
      })
      expect(result[index === 0 ? 2 : 0]).toBe(30)
    }
})
