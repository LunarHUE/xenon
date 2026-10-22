import { expect, test } from 'vitest'
import { resizable } from './resizable'

for (const amount of [0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`invalid small step ${amount} uses one percentage point`, () => {
    const split = resizable({ panels: [{}, {}], sizes: [40, 60], step: amount })
    expect(split.key(0, 'ArrowRight')).toEqual([41, 59])
    expect(split.key(0, 'ArrowLeft')).toEqual([39, 61])
  })
  test(`invalid large step ${amount} uses ten percentage points`, () => {
    const split = resizable({ panels: [{}, {}], sizes: [40, 60], largeStep: amount })
    expect(split.key(0, 'ArrowRight', true)).toEqual([50, 50])
    expect(split.key(0, 'ArrowLeft', true)).toEqual([30, 70])
  })
}

test('fractional custom steps preserve the adjacent total and snapshot across repeated operations', () => {
  const sizes = [20.25, 49.75, 30]
  const split = resizable({ panels: [{}, {}, {}], sizes, step: 0.125, largeStep: 2.5 })
  expect(split.key(0, 'ArrowRight')).toEqual([20.375, 49.625, 30])
  expect(split.key(0, 'ArrowLeft', true)).toEqual([17.75, 52.25, 30])
  expect(split.state.sizes).toEqual(sizes)
  expect(sizes).toEqual([20.25, 49.75, 30])
  const result = split.resize(0, 35)
  result[0] = 99
  expect(split.state.sizes).toEqual(sizes)
  expect(split.resize(0, 35)).toEqual([35, 35, 30])
})

test('disabled valid snapshots retain bounds and semantics while every operation is inert', () => {
  const split = resizable({
    panels: [{ minSize: 10, collapsible: true }, { minSize: 20 }],
    sizes: [40, 60],
    disabled: true,
  })
  expect(split.state.valid).toBe(true)
  expect(split.bounds(0)).toEqual([10, 80])
  expect(split.parts.handle(0).attrs).toMatchObject({
    tabindex: -1,
    'aria-disabled': 'true',
    'aria-valuenow': '40',
    'aria-valuemax': '80',
  })
  expect(split.resize(0, 75)).toEqual([40, 60])
  expect(split.toggle(0)).toEqual([40, 60])
  expect(split.key(0, 'End')).toBeUndefined()
})

for (const index of [-1, 0.5, 2, Number.NaN, Number.POSITIVE_INFINITY])
  test(`invalid handle ${index} cannot alter a valid three-panel snapshot`, () => {
    const split = resizable({ panels: [{ collapsible: true }, {}, {}], sizes: [30, 40, 30] })
    expect(split.bounds(index)).toEqual([0, 0])
    expect(split.resize(index, 50)).toEqual([30, 40, 30])
    expect(split.toggle(index)).toEqual([30, 40, 30])
    expect(split.key(index, 'Home')).toBeUndefined()
    expect(split.parts.handle(index).attrs).toMatchObject({ tabindex: -1, 'aria-disabled': 'true' })
  })

test('collapse restore clamps remembered size against both current adjacent constraints', () => {
  const split = resizable({
    panels: [
      { minSize: 10, maxSize: 70, collapsible: true },
      { minSize: 40, maxSize: 100 },
    ],
    sizes: [0, 100],
  })
  expect(split.toggle(0, 90)).toEqual([60, 40])
  expect(split.toggle(0, 2)).toEqual([10, 90])
  expect(split.toggle(0, Number.NaN)).toEqual([10, 90])
  expect(split.state.sizes).toEqual([0, 100])
})
