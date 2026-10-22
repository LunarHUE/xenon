import { describe, expect, test } from 'vitest'
import { collection } from './collection'

// Exhaust all enabled/disabled patterns of a small ordered collection. A linear
// scan from the source is the reference behavior, including disabled sources.
describe('collection navigation across every four-item disabled pattern', () => {
  const values = ['a', 'b', 'c', 'd']
  for (let mask = 0; mask < 16; mask++) {
    test(`enabled mask ${mask.toString(2).padStart(4, '0')} preserves order, ranges and loop boundaries`, () => {
      const enabled = values.filter((_, index) => Boolean(mask & (1 << index)))
      const result = collection({ items: values, disabled: (value) => !enabled.includes(value) })
      expect(result.navigable).toEqual(enabled)
      expect(result.first()).toBe(enabled[0])
      expect(result.last()).toBe(enabled.at(-1))
      expect(result.next(undefined)).toBe(enabled[0])
      expect(result.previous(undefined)).toBe(enabled.at(-1))
      for (let index = 0; index < values.length; index++) {
        const source = values[index]!
        const forward = values.slice(index + 1).find((value) => enabled.includes(value))
        const backward = values
          .slice(0, index)
          .reverse()
          .find((value) => enabled.includes(value))
        expect(result.next(source)).toBe(forward)
        expect(result.previous(source)).toBe(backward)
        expect(result.next(source, { loop: true })).toBe(forward ?? enabled[0])
        expect(result.previous(source, { loop: true })).toBe(backward ?? enabled.at(-1))
        for (let end = 0; end < values.length; end++) {
          const selected = values.slice(Math.min(index, end), Math.max(index, end) + 1)
          expect(result.range(source, values[end]!)).toEqual(
            selected.filter((value) => enabled.includes(value))
          )
        }
      }
      expect(result.next('missing', { loop: true })).toBeUndefined()
      expect(result.previous('missing', { loop: true })).toBeUndefined()
      expect(result.range('missing', 'a')).toEqual([])
      expect(result.range('a', 'missing')).toEqual([])
      expect(values).toEqual(['a', 'b', 'c', 'd'])
    })
  }
})
