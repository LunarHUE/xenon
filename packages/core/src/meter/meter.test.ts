import { describe, expect, test } from 'vitest'
import { meter } from './meter'
describe('meter', () => {
  test('clamps values, formats the normalized range and uses native attributes', () => {
    const result = meter({ min: 10, max: 20, value: 30, format: ({ value }) => `${value} GB` })
    expect(result.state).toEqual({
      min: 10,
      max: 20,
      value: 20,
      percentage: 100,
      valueText: '20 GB',
    })
    expect(result.parts.root.attrs).toMatchObject({
      value: '20',
      'aria-valuenow': '20',
      'aria-valuetext': '20 GB',
    })
    expect(result.parts.root.attrs.role).toBeUndefined()
  })
  test.each([undefined, NaN, Infinity, -Infinity])(
    'never becomes indeterminate for %s',
    (value) => {
      expect(meter({ value }).state.value).toBe(0)
      expect(meter({ value }).parts.root.attrs['aria-valuenow']).toBe('0')
    }
  )
  test.each([
    { min: 10, max: 10 },
    { min: 10, max: -1 },
    { min: -Number.MAX_VALUE, max: Number.MAX_VALUE },
  ])('resets invalid bounds %o', (bounds) => {
    expect(meter(bounds).state).toMatchObject({ min: 0, max: 100, percentage: 0 })
  })
  test('generic hosts retain measurement semantics without native values', () => {
    const attrs = meter({ host: 'generic', value: 25 }).parts.root.attrs
    expect(attrs.role).toBe('meter')
    expect(attrs.value).toBeUndefined()
    expect(attrs['aria-valuetext']).toBe('25%')
  })
})
