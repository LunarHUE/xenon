import { describe, expect, test } from 'vitest'
import { createDate, dateKey, dateOnlyAdapter as adapter, parseDate, serializeDate } from './date'
import { isoAdapter } from './iso-adapter.fixture'

describe('date validation at every entry point', () => {
  test.each([
    { year: 0, month: 1, day: 1 },
    { year: 2024, month: 2, day: 30 },
    { year: 2024, month: 1.5, day: 1 },
    { year: Infinity, month: 1, day: 1 },
    { year: 2024, month: 1, day: NaN },
  ])('rejects invalid external fields %j across all operations', (invalid) => {
    const valid = createDate(2024, 1, 1)
    for (const operation of [
      () => serializeDate(invalid),
      () => adapter.getFields(invalid),
      () => adapter.fromFields(invalid),
      () => adapter.addDays(invalid, 0),
      () => adapter.addMonths(invalid, 0),
      () => adapter.addYears(invalid, 0),
      () => adapter.compare(invalid, valid),
      () => adapter.compare(valid, invalid),
      () => adapter.getWeekday(invalid),
      () => adapter.daysInMonth(invalid),
      () => adapter.format(invalid, { dateStyle: 'short' }),
    ])
      expect(operation).toThrow(RangeError)
  })

  test.each([NaN, Infinity, -Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects unsafe arithmetic amount %s',
    (amount) => {
      const value = createDate(2024, 2, 29)
      for (const add of [adapter.addDays, adapter.addMonths, adapter.addYears]) {
        expect(() => add(value, amount)).toThrow(RangeError)
      }
    }
  )

  test.each([
    '2024-01-01\n',
    '2024-01-01 ',
    '2024-01-01\r\n',
    '２０２４-01-01',
    '2024-00-01',
    '2024-01-32',
  ])('rejects nonexact ISO input %j', (iso) => {
    expect(() => parseDate(iso)).toThrow(RangeError)
  })
})

describe('Gregorian arithmetic invariants', () => {
  test('a complete 400-year Gregorian cycle preserves date and weekday', () => {
    const value = createDate(1600, 2, 29)
    const later = adapter.addDays(value, 146097)
    expect(later).toEqual(createDate(2000, 2, 29))
    expect(adapter.getWeekday(later)).toBe(adapter.getWeekday(value))
    expect(adapter.addDays(later, -146097)).toEqual(value)
  })

  test('every day in a leap year advances weekdays and reverses without changing the input', () => {
    let value = createDate(2024, 1, 1)
    for (let day = 0; day < 366; day++) {
      const next = adapter.addDays(value, 1)
      expect(adapter.addDays(next, -1)).toEqual(value)
      expect(adapter.compare(next, value)).toBe(1)
      expect(adapter.getWeekday(next)).toBe((adapter.getWeekday(value) + 1) % 7)
      expect(Object.isFrozen(next)).toBe(true)
      value = next
    }
    expect(value).toEqual(createDate(2025, 1, 1))
  })

  test('month clamping uses each new snapshot and does not restore an earlier day', () => {
    const january = createDate(2023, 1, 31)
    const february = adapter.addMonths(january, 1)
    expect(february).toEqual(createDate(2023, 2, 28))
    expect(adapter.addMonths(february, 1)).toEqual(createDate(2023, 3, 28))
    expect(adapter.addMonths(january, 2)).toEqual(createDate(2023, 3, 31))
    expect(adapter.addMonths(createDate(2024, 3, 31), -1)).toEqual(createDate(2024, 2, 29))
  })

  test('dateKey reads the supplied representation and validates its fields', () => {
    expect(dateKey(isoAdapter, '0099-02-28')).toBe('0099-02-28')
    expect(() =>
      dateKey(
        { ...adapter, getFields: () => ({ year: 0, month: 1, day: 1 }) },
        createDate(2024, 1, 1)
      )
    ).toThrow(RangeError)
  })
})
