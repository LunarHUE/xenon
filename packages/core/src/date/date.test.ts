import { describe, expect, it } from 'vitest'
import { createDate, dateKey, dateOnlyAdapter as adapter, parseDate, serializeDate } from './date'

describe('Gregorian date-only adapter', () => {
  it('freezes dates, preserves input fields, and round trips exact ISO values', () => {
    for (const iso of [
      '0001-01-01',
      '0099-12-31',
      '1900-02-28',
      '2000-02-29',
      '2024-02-29',
      '9999-12-31',
    ]) {
      const date = parseDate(iso)
      expect(Object.isFrozen(date)).toBe(true)
      expect(serializeDate(date)).toBe(iso)
      expect(dateKey(adapter, date)).toBe(iso)
      expect(adapter.getFields(date)).toEqual(date)
      expect(adapter.fromFields(date)).toEqual(date)
    }
  })
  it.each([
    '2023-02-29',
    '1900-02-29',
    '0000-01-01',
    '10000-01-01',
    '2024-13-01',
    '2024-01-00',
    '2024-04-31',
    '2024-1-01',
    ' 2024-01-01',
    '2024-01-01T00:00:00Z',
  ])('rejects malformed or invalid date %s', (value) => {
    expect(() => parseDate(value)).toThrow(RangeError)
  })
  it('rejects fractional and nonfinite fields without normalizing them', () => {
    expect(() => createDate(2024.5, 1, 1)).toThrow(RangeError)
    expect(() => createDate(2024, NaN, 1)).toThrow(RangeError)
    expect(() => createDate(2024, 1, Infinity)).toThrow(RangeError)
    expect(() => adapter.addDays(createDate(2024, 1, 1), 0.1)).toThrow(RangeError)
  })
  it('clamps month and year arithmetic across leap days and year boundaries', () => {
    const january = createDate(2024, 1, 31)
    expect(adapter.addMonths(january, 1)).toEqual(createDate(2024, 2, 29))
    expect(adapter.addMonths(january, -1)).toEqual(createDate(2023, 12, 31))
    expect(adapter.addYears(createDate(2000, 2, 29), 100)).toEqual(createDate(2100, 2, 28))
    expect(adapter.addYears(createDate(2000, 2, 29), -400)).toEqual(createDate(1600, 2, 29))
    expect(january).toEqual(createDate(2024, 1, 31))
  })
  it('adds civil days across year, leap, and DST-season boundaries', () => {
    for (const [before, after] of [
      ['2023-12-31', '2024-01-01'],
      ['2000-02-28', '2000-02-29'],
      ['1900-02-28', '1900-03-01'],
      ['2024-03-10', '2024-03-11'],
      ['2024-11-03', '2024-11-04'],
    ]) {
      expect(adapter.addDays(parseDate(before!), 1)).toEqual(parseDate(after!))
      expect(adapter.addDays(parseDate(after!), -1)).toEqual(parseDate(before!))
    }
  })
  it('rejects every arithmetic operation that exceeds supported boundaries', () => {
    const first = createDate(1, 1, 1),
      last = createDate(9999, 12, 31)
    for (const method of [adapter.addDays, adapter.addMonths, adapter.addYears]) {
      expect(() => method(first, -1)).toThrow(RangeError)
      expect(() => method(last, 1)).toThrow(RangeError)
      expect(() => method(first, Number.MAX_SAFE_INTEGER)).toThrow(RangeError)
    }
  })
  it('compares dates and reports Gregorian weekdays and month lengths', () => {
    expect(adapter.getWeekday(createDate(1, 1, 1))).toBe(1)
    expect(adapter.getWeekday(createDate(1970, 1, 1))).toBe(4)
    expect(adapter.getWeekday(createDate(2024, 2, 29))).toBe(4)
    expect(adapter.daysInMonth(createDate(1900, 2, 1))).toBe(28)
    expect(adapter.daysInMonth(createDate(2000, 2, 1))).toBe(29)
    expect(adapter.compare(createDate(1, 1, 1), createDate(1, 1, 1))).toBe(0)
    expect(adapter.compare(createDate(2023, 12, 31), createDate(2024, 1, 1))).toBe(-1)
  })
  it('formats civil dates in Gregorian UTC even with a non-Gregorian locale preference', () => {
    const value = createDate(2024, 2, 29)
    expect(adapter.format(value, { year: 'numeric', month: 'long', day: 'numeric' }, 'en-US')).toBe(
      'February 29, 2024'
    )
    expect(
      adapter.format(
        value,
        { year: 'numeric', month: 'long', day: 'numeric' },
        'en-US-u-ca-buddhist'
      )
    ).toBe('February 29, 2024')
    expect(adapter.format(value, { month: 'long', year: 'numeric' }, 'fr-FR')).toBe('février 2024')
    expect(
      adapter.format(
        createDate(1, 1, 1),
        { year: 'numeric', month: 'long', day: 'numeric' },
        'en-US'
      )
    ).toBe('January 1, 1')
  })
})
