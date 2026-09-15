/** Immutable proleptic Gregorian date, with years 1–9999 and months 1–12. */
export interface DateValue {
  /** Gregorian year, from 1 through 9999. */
  readonly year: number
  /** Calendar month, from 1 through 12. */
  readonly month: number
  /** Day of month, from 1 through the month's length. */
  readonly day: number
}
/** Date-only formatting options. Calendar and time zone are fixed by the adapter. */
export type DateFormatOptions = Pick<
  Intl.DateTimeFormatOptions,
  | 'weekday'
  | 'year'
  | 'month'
  | 'day'
  | 'era'
  | 'dateStyle'
  | 'localeMatcher'
  | 'formatMatcher'
  | 'numberingSystem'
>
/** Date representation boundary. Every operation is immutable and uses Gregorian civil days. */
export interface DateAdapter<T> {
  /** Read validated Gregorian fields without exposing time or zone. */
  getFields(value: T): DateValue
  /** Construct a date from Gregorian fields; reject invalid fields. */
  fromFields(fields: DateValue): T
  /** Add integer calendar days; throw outside supported years. */
  addDays(value: T, amount: number): T
  /** Add integer calendar months, clamping the day to the target month. */
  addMonths(value: T, amount: number): T
  /** Add integer calendar years, clamping leap days when necessary. */
  addYears(value: T, amount: number): T
  /** Return a negative number, zero, or positive number in civil-day order. */
  compare(a: T, b: T): number
  /** Read weekday, Sunday=0 through Saturday=6. */
  getWeekday(value: T): number
  /** Read the number of days in this date's month. */
  daysInMonth(value: T): number
  /** Format this civil date using a Gregorian calendar without time-zone shifts. */
  format(value: T, options: DateFormatOptions, locale?: string): string
}
const leap = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
const monthDays = (year: number, month: number) =>
  month === 2 ? (leap(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31
const yearStart = (year: number) => {
  const previous = year - 1
  return (
    365 * previous +
    Math.floor(previous / 4) -
    Math.floor(previous / 100) +
    Math.floor(previous / 400)
  )
}
/** Create and freeze a valid Gregorian date. Invalid or fractional fields throw RangeError. */
export function createDate(year: number, month: number, day: number): DateValue {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > monthDays(year, month)
  )
    throw new RangeError('Expected a valid Gregorian date in years 1 through 9999')
  return Object.freeze({ year, month, day })
}
/** Parse exactly YYYY-MM-DD. Whitespace, times, invalid dates, and year zero are rejected. */
export function parseDate(value: string): DateValue {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Expected YYYY-MM-DD')
  return createDate(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)),
    Number(value.slice(8, 10))
  )
}
/** Serialize validated date fields as YYYY-MM-DD. */
export function serializeDate(value: DateValue): string {
  const fields = createDate(value.year, value.month, value.day)
  return `${String(fields.year).padStart(4, '0')}-${String(fields.month).padStart(2, '0')}-${String(fields.day).padStart(2, '0')}`
}
/** Stable ISO day key independent of the adapter's representation. */
export function dateKey<T>(adapter: DateAdapter<T>, value: T): string {
  return serializeDate(adapter.getFields(value))
}
const ordinal = (input: DateValue) => {
  const value = createDate(input.year, input.month, input.day)
  let count = yearStart(value.year) + value.day
  for (let month = 1; month < value.month; month++) count += monthDays(value.year, month)
  return count
}
const fromOrdinal = (day: number): DateValue => {
  if (!Number.isSafeInteger(day) || day < 1 || day > yearStart(10000))
    throw new RangeError('Date arithmetic exceeded years 1 through 9999')
  let low = 1,
    high = 10000
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    if (yearStart(middle) < day) low = middle
    else high = middle
  }
  let remaining = day - yearStart(low),
    month = 1
  while (remaining > monthDays(low, month)) {
    remaining -= monthDays(low, month)
    month++
  }
  return createDate(low, month, remaining)
}
const integer = (amount: number) => {
  if (!Number.isSafeInteger(amount))
    throw new RangeError('Date arithmetic requires a safe integer amount')
}
/** Default immutable Gregorian date-only adapter. No operation reads the clock. */
export const dateOnlyAdapter: DateAdapter<DateValue> = Object.freeze({
  getFields(value: DateValue) {
    return createDate(value.year, value.month, value.day)
  },
  fromFields(value: DateValue) {
    return createDate(value.year, value.month, value.day)
  },
  addDays(value: DateValue, amount: number) {
    integer(amount)
    return fromOrdinal(ordinal(value) + amount)
  },
  addMonths(value: DateValue, amount: number) {
    integer(amount)
    const fields = createDate(value.year, value.month, value.day)
    const index = (fields.year - 1) * 12 + fields.month - 1 + amount
    if (!Number.isSafeInteger(index) || index < 0 || index >= 9999 * 12)
      throw new RangeError('Date arithmetic exceeded years 1 through 9999')
    const year = Math.floor(index / 12) + 1,
      month = (index % 12) + 1
    return createDate(year, month, Math.min(fields.day, monthDays(year, month)))
  },
  addYears(value: DateValue, amount: number) {
    integer(amount)
    return dateOnlyAdapter.addMonths(value, amount * 12)
  },
  compare(a: DateValue, b: DateValue) {
    return Math.sign(ordinal(a) - ordinal(b))
  },
  getWeekday(value: DateValue) {
    return ordinal(value) % 7
  },
  daysInMonth(value: DateValue) {
    const fields = createDate(value.year, value.month, value.day)
    return monthDays(fields.year, fields.month)
  },
  format(value: DateValue, options: DateFormatOptions, locale = 'en-US') {
    const {
      weekday,
      year,
      month,
      day,
      era,
      dateStyle,
      localeMatcher,
      formatMatcher,
      numberingSystem,
    } = options
    return new Intl.DateTimeFormat(locale, {
      weekday,
      year,
      month,
      day,
      era,
      dateStyle,
      localeMatcher,
      formatMatcher,
      numberingSystem,
      calendar: 'gregory',
      timeZone: 'UTC',
    }).format((ordinal(value) - 719163) * 86400000)
  },
})
