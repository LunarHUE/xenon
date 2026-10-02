import { afterEach, expect, test, vi } from 'vitest'

afterEach(() => vi.restoreAllMocks())

test('date-only formatting reuses a formatter across dates and equivalent option orderings', async () => {
  vi.resetModules()
  const { createDate, dateOnlyAdapter: adapter } = await import('./date')
  const constructor = vi.spyOn(Intl, 'DateTimeFormat')
  expect(adapter.format(createDate(2024, 2, 15), { month: 'long', year: 'numeric' })).toBe(
    'February 2024'
  )
  expect(adapter.format(createDate(2024, 3, 1), { year: 'numeric', month: 'long' })).toBe(
    'March 2024'
  )
  expect(constructor).toHaveBeenCalledTimes(1)
  expect(adapter.format(createDate(2024, 3, 1), { month: 'long', year: 'numeric' }, 'fr-FR')).toBe(
    'mars 2024'
  )
  expect(constructor).toHaveBeenCalledTimes(2)
  expect(adapter.format(createDate(2024, 3, 1), { month: 'short', year: 'numeric' })).toBe(
    'Mar 2024'
  )
  expect(constructor).toHaveBeenCalledTimes(3)
})

test('reused formatters preserve Gregorian civil dates, numbering preferences, and invalid-option errors', async () => {
  vi.resetModules()
  const { createDate, dateOnlyAdapter: adapter } = await import('./date')
  for (const locale of ['en-US', 'fr-FR', 'ar-EG', 'en-US-u-ca-islamic']) {
    for (const year of [1, 99, 2024]) {
      const native = new Date(0)
      native.setUTCFullYear(year, 1, 15)
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        numberingSystem: 'latn',
      } as const
      const expected = new Intl.DateTimeFormat(locale, {
        ...options,
        calendar: 'gregory',
        timeZone: 'UTC',
      }).format(native)
      expect(adapter.format(createDate(year, 2, 15), options, locale)).toBe(expected)
      expect(adapter.format(createDate(year, 2, 15), options, locale)).toBe(expected)
    }
  }
  expect(() =>
    adapter.format(createDate(2024, 2, 15), { dateStyle: 'short', year: 'numeric' })
  ).toThrow(TypeError)
  expect(() =>
    adapter.format(createDate(2024, 2, 15), { dateStyle: 'short', year: 'numeric' })
  ).toThrow(TypeError)
})
