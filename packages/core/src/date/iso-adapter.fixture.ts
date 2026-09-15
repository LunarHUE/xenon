import { dateOnlyAdapter, parseDate, serializeDate } from './date'
import type { DateAdapter } from './date'

/** Independent public representation used to verify generic calendar operations. */
export const isoAdapter: DateAdapter<string> = {
  getFields: parseDate,
  fromFields: serializeDate,
  addDays: (value, amount) => serializeDate(dateOnlyAdapter.addDays(parseDate(value), amount)),
  addMonths: (value, amount) => serializeDate(dateOnlyAdapter.addMonths(parseDate(value), amount)),
  addYears: (value, amount) => serializeDate(dateOnlyAdapter.addYears(parseDate(value), amount)),
  compare: (a, b) => a.localeCompare(b),
  getWeekday: (value) => dateOnlyAdapter.getWeekday(parseDate(value)),
  daysInMonth: (value) => dateOnlyAdapter.daysInMonth(parseDate(value)),
  format: (value, options, locale) => dateOnlyAdapter.format(parseDate(value), options, locale),
}
