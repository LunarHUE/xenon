import { expect, test } from 'vitest'
import { slider } from './slider'

test('fractional keys stay precise and page keys use ten steps', () => {
  expect(slider({ value: [0.2], step: 0.1 }).key(0, 'ArrowUp')).toEqual([0.3])
  expect(slider({ value: [20], step: 2, largeStep: 5 }).key(0, 'PageUp')).toEqual([25])
  expect(slider({ value: [49000], min: 1000, max: 100000, step: 5000 }).key(0, 'ArrowUp')).toEqual([
    51000,
  ])
})
test('neighbors bound requests and keep identity', () => {
  const result = slider({ value: [20, 60], step: 2, minStepsBetweenThumbs: 2 })
  expect(result.key(0, 'End')).toEqual([56, 60])
  expect(result.setValue(1, 0)).toEqual([20, 24])
  expect(result.bounds(0)).toEqual([0, 56])
})
test('normalizes bounds, missing values, and blocked requests', () => {
  expect(slider({ max: 100, step: 30 }).state.max).toBe(90)
  expect(slider({ value: [NaN, Infinity], min: 10, max: 0 }).state.value).toEqual([10, 10])
  expect(slider({ value: [20], readonly: true }).key(0, 'End')).toEqual([20])
  expect(slider({ value: [20] }).setValue(9, 30)).toEqual([20])
  expect(slider().parts.thumb(0).attrs['aria-valuetext']).toBeUndefined()
})
test('RTL and vertical map physical coordinates and numeric Home consistently', () => {
  expect(slider({ direction: 'rtl', value: [20] }).key(0, 'ArrowRight')).toEqual([19])
  expect(slider({ orientation: 'vertical' }).fromRatio(0)).toBe(100)
  expect(slider({ direction: 'rtl' }).fromRatio(0)).toBe(100)
})

test('vertical horizontal keys remain numeric in RTL and tiny steps stay finite', () => {
  expect(
    slider({ value: [20], direction: 'rtl', orientation: 'vertical' }).key(0, 'ArrowRight')
  ).toEqual([21])
  expect(slider({ value: [1e-7], step: 1e-7 }).key(0, 'ArrowRight')).toEqual([2e-7])
  expect(Number.isFinite(slider({ step: Number.MIN_VALUE }).state.max)).toBe(true)
})
