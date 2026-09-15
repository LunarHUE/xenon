import { dateKey } from '../date'
import type { DateAdapter } from '../date'
import type { PartProps } from '../part'

/** One rendered grid position. Boundary padding has no date value. */
export interface CalendarDay<T> {
  /** Date represented by this cell; undefined only outside supported years. */ value: T | undefined
  /** Stable key including the owning month to distinguish duplicate spillover dates. */ key: string
  /** Whether this date is outside its owning grid's month. */ outsideMonth: boolean
  /** Zero-based owning grid index. */ monthIndex: number
}
/** Weekday heading in the requested week order. */
export interface CalendarWeekday {
  /** Sunday=0 through Saturday=6. */ weekday: number
  /** Full localized weekday name for accessibility. */ label: string
  /** Short localized weekday name for display. */ shortLabel: string
}
/** One visible month and its complete week rows. */
export interface CalendarMonth<T> {
  /** First date of the month. */ month: T
  /** Localized month and year heading. */ heading: string
  /** Rows of seven positions, including spillover days. */ weeks: CalendarDay<T>[][]
}
/** Date-independent options shared by single and range calendars. */
export interface CalendarBaseOptions<T> {
  /** Immutable Gregorian date representation adapter. */ adapter: DateAdapter<T>
  /** Today's date supplied by the binding; core never reads the clock. */ today: T
  /** Focused date. When absent, selection or today supplies initial focus. */ focusedValue?: T
  /** First visible month; its day field is ignored. */ visibleMonth?: T
  /** Inclusive minimum date. */ minValue?: T
  /** Inclusive maximum date. Reversed bounds throw RangeError. */ maxValue?: T
  /** Unavailable dates remain focusable but cannot be selected. */ isDateUnavailable?: (
    value: T
  ) => boolean
  /** Prevent selection, keyboard focus, and paging. */ disabled?: boolean
  /** Allow focus and paging, but prevent selection. */ readOnly?: boolean
  /** First weekday, Sunday=0 through Saturday=6. Defaults to Sunday. */ weekStartsOn?: number
  /** BCP 47 formatting locale. Defaults to en-US for deterministic SSR. */ locale?: string
  /** Horizontal arrow direction. Defaults to ltr. */ dir?: 'ltr' | 'rtl'
  /** Render six weeks in every month. Defaults to false. */ fixedWeeks?: boolean
  /** Visible month count, clamped to 1–12 and supported year boundaries. Defaults to one. */ visibleMonths?: number
  /** Heading element ID supplied by the binding. */ headingId?: string
  /** Propose a focused date after user interaction; never called during construction. */ onFocusedValueChange?: (
    value: T
  ) => void
  /** Propose the first visible month after paging or focus crosses the visible window. */ onVisibleMonthChange?: (
    value: T
  ) => void
}
/** Single-selection calendar inputs. */
export interface CalendarOptions<T> extends CalendarBaseOptions<T> {
  /** Committed selection, or undefined for no selection. */ value?: T
  /** Propose a selection after activation. Selecting the existing date is a no-op. */ onValueChange?: (
    value: T | undefined
  ) => void
}
/** Common calendar snapshot. */
export interface CalendarState<T> {
  /** Current committed selection. */ value: T | undefined
  /** Caller-supplied date used for current-date semantics. */ today: T
  /** Resolved date holding the single roving tab stop. */ focusedValue: T
  /** First visible month, normalized to day one. */ visibleMonth: T
  /** All visible grids. */ months: CalendarMonth<T>[]
  /** First month's rows for single-month consumers. */ weeks: CalendarDay<T>[][]
  /** Weekday headings in display order. */ weekdays: CalendarWeekday[]
  /** Localized heading for the whole visible month interval. */ heading: string
  /** Whether paging backward can expose another permitted month. */ canGoPrevious: boolean
  /** Whether paging forward can expose another permitted month. */ canGoNext: boolean
}
/** Native table and button semantic parts. */
export interface CalendarParts<T> {
  /** Labeled calendar group. */ root: PartProps<'div'>
  /** Polite month heading announced when paging. */ heading: PartProps<'h2'>
  /** Native table with grid semantics; one per visible month. */ grid(
    monthIndex?: number
  ): PartProps<'table'>
  /** Native table heading section. */ gridHead: PartProps<'thead'>
  /** Native table body section. */ gridBody: PartProps<'tbody'>
  /** Native table row. */ row: PartProps<'tr'>
  /** Weekday column heading. */ headerCell(weekday: CalendarWeekday): PartProps<'th'>
  /** Grid cell, including selection and disabled semantics. */ cell(
    day: CalendarDay<T>
  ): PartProps<'td'>
  /** Native day button, including focus and activation. */ day(
    day: CalendarDay<T>
  ): PartProps<'button'>
  /** Page backward by the visible month count. */ previousTrigger: PartProps<'button'>
  /** Page forward by the visible month count. */ nextTrigger: PartProps<'button'>
}
/** Single-selection calendar controller. Recompute with accepted callback values. */
export interface CalendarResult<T> {
  /** Resolved date and grid snapshot. */ state: CalendarState<T>
  /** Semantic part bundles. */ parts: CalendarParts<T>
  /** Request date selection, respecting readonly, disabled, bounds, and availability. */ select(
    value: T
  ): void
  /** Request date focus and expose it in the visible month window. */ focus(value: T): void
  /** Request a relative month move; paging controls pass the visible month count. */ navigate(
    monthDelta: number
  ): void
}
/** Normalize a date to the first day of its Gregorian month. */
export function calendarMonthStart<T>(adapter: DateAdapter<T>, value: T): T {
  return adapter.fromFields({ ...adapter.getFields(value), day: 1 })
}
/** Check inclusive date bounds without treating unavailable dates as unfocusable. */
export function calendarInBounds<T>(options: CalendarBaseOptions<T>, value: T): boolean {
  return (
    (options.minValue === undefined || options.adapter.compare(value, options.minValue) >= 0) &&
    (options.maxValue === undefined || options.adapter.compare(value, options.maxValue) <= 0)
  )
}
/** Build Gregorian month grids and native keyboard semantics without DOM or clock access. */
export function calendar<T>(options: CalendarOptions<T>): CalendarResult<T> {
  const { adapter } = options
  if (
    options.minValue !== undefined &&
    options.maxValue !== undefined &&
    adapter.compare(options.minValue, options.maxValue) > 0
  )
    throw new RangeError('Calendar minimum must not follow maximum')
  const locale = options.locale ?? 'en-US'
  const start = (value: T) => calendarMonthStart(adapter, value)
  const same = (a: T, b: T) => adapter.compare(a, b) === 0
  const bounded = (value: T) =>
    options.minValue !== undefined && adapter.compare(value, options.minValue) < 0
      ? options.minValue
      : options.maxValue !== undefined && adapter.compare(value, options.maxValue) > 0
        ? options.maxValue
        : value
  const safe = (operation: () => T): T | undefined => {
    try {
      return operation()
    } catch (error) {
      if (error instanceof RangeError) return undefined
      throw error
    }
  }
  const requestedCount = Number.isFinite(options.visibleMonths)
    ? Math.max(1, Math.min(12, Math.floor(options.visibleMonths!)))
    : 1
  let visibleMonth = start(
    bounded(options.visibleMonth ?? options.focusedValue ?? options.value ?? options.today)
  )
  const lastSupportedMonth = adapter.fromFields({ year: 9999, month: 12, day: 1 })
  const latestBase = adapter.addMonths(lastSupportedMonth, 1 - requestedCount)
  if (adapter.compare(visibleMonth, latestBase) > 0) visibleMonth = latestBase
  const lastMonth = adapter.addMonths(visibleMonth, requestedCount - 1)
  const lastVisibleDay = adapter.fromFields({
    ...adapter.getFields(lastMonth),
    day: adapter.daysInMonth(lastMonth),
  })
  let focusedValue = bounded(options.focusedValue ?? options.value ?? options.today)
  if (adapter.compare(focusedValue, visibleMonth) < 0) focusedValue = bounded(visibleMonth)
  if (adapter.compare(focusedValue, lastVisibleDay) > 0) focusedValue = bounded(lastVisibleDay)
  const weekStartsOn = Number.isInteger(options.weekStartsOn)
    ? ((options.weekStartsOn! % 7) + 7) % 7
    : 0
  const formatMonth = (value: T) =>
    adapter.format(value, { month: 'long', year: 'numeric' }, locale)
  const months: CalendarMonth<T>[] = Array.from({ length: requestedCount }, (_, monthIndex) => {
    const month = adapter.addMonths(visibleMonth, monthIndex)
    const leading = (adapter.getWeekday(month) - weekStartsOn + 7) % 7
    const count = options.fixedWeeks
      ? 42
      : Math.ceil((leading + adapter.daysInMonth(month)) / 7) * 7
    const days = Array.from({ length: count }, (_, index): CalendarDay<T> => {
      const value = safe(() => adapter.addDays(month, index - leading))
      return {
        value,
        key: `${dateKey(adapter, month)}:${value === undefined ? `padding-${index}` : dateKey(adapter, value)}`,
        outsideMonth: value === undefined || !same(start(value), month),
        monthIndex,
      }
    })
    return {
      month,
      heading: formatMonth(month),
      weeks: Array.from({ length: count / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7)),
    }
  })
  const weekdayReference = adapter.fromFields({ year: 2023, month: 1, day: 1 })
  const weekdays = Array.from({ length: 7 }, (_, index): CalendarWeekday => {
    const weekday = (weekStartsOn + index) % 7
    const value = adapter.addDays(weekdayReference, weekday)
    return {
      weekday,
      label: adapter.format(value, { weekday: 'long' }, locale),
      shortLabel: adapter.format(value, { weekday: 'short' }, locale),
    }
  })
  const heading =
    requestedCount === 1 ? months[0]!.heading : `${months[0]!.heading} – ${months.at(-1)!.heading}`
  const monthAllowed = (month: T) =>
    (options.minValue === undefined ||
      adapter.compare(
        adapter.fromFields({ ...adapter.getFields(month), day: adapter.daysInMonth(month) }),
        options.minValue
      ) >= 0) &&
    (options.maxValue === undefined || adapter.compare(month, options.maxValue) <= 0)
  const previous = safe(() => adapter.addMonths(visibleMonth, -1))
  const next = safe(() => adapter.addMonths(lastMonth, 1))
  const canGoPrevious = !options.disabled && previous !== undefined && monthAllowed(previous)
  const canGoNext = !options.disabled && next !== undefined && monthAllowed(next)
  const unavailable = (value: T) => !!options.isDateUnavailable?.(value)
  const isDisabled = (value: T) => !!options.disabled || !calendarInBounds(options, value)
  const selected = (value: T) => options.value !== undefined && same(value, options.value)
  const focus = (input: T) => {
    if (options.disabled) return
    const value = bounded(input)
    let month = visibleMonth
    if (adapter.compare(value, visibleMonth) < 0) month = start(value)
    else if (adapter.compare(value, lastVisibleDay) > 0)
      month = adapter.addMonths(start(value), 1 - requestedCount)
    if (!same(month, visibleMonth)) options.onVisibleMonthChange?.(month)
    if (!same(value, focusedValue)) options.onFocusedValueChange?.(value)
  }
  const select = (value: T) => {
    if (
      options.disabled ||
      options.readOnly ||
      !calendarInBounds(options, value) ||
      unavailable(value)
    )
      return
    focus(value)
    if (!selected(value)) options.onValueChange?.(value)
  }
  const navigate = (monthDelta: number) => {
    if (
      options.disabled ||
      !Number.isSafeInteger(monthDelta) ||
      monthDelta === 0 ||
      (monthDelta < 0 ? !canGoPrevious : !canGoNext)
    )
      return
    let target = safe(() => adapter.addMonths(visibleMonth, monthDelta))
    if (target === undefined)
      target = monthDelta < 0 ? adapter.fromFields({ year: 1, month: 1, day: 1 }) : latestBase
    if (options.minValue !== undefined && adapter.compare(target, start(options.minValue)) < 0)
      target = start(options.minValue)
    if (options.maxValue !== undefined && adapter.compare(target, start(options.maxValue)) > 0)
      target = start(options.maxValue)
    if (adapter.compare(target, latestBase) > 0) target = latestBase
    if (same(target, visibleMonth)) return
    options.onVisibleMonthChange?.(target)
    const oldFields = adapter.getFields(focusedValue)
    const newFocus = bounded(
      adapter.fromFields({
        ...adapter.getFields(target),
        day: Math.min(oldFields.day, adapter.daysInMonth(target)),
      })
    )
    if (!same(newFocus, focusedValue)) options.onFocusedValueChange?.(newFocus)
  }
  const key = (value: T, event: KeyboardEvent) => {
    if (options.disabled || event.isComposing || event.altKey || event.ctrlKey || event.metaKey)
      return
    let result: T | undefined
    const horizontal = options.dir === 'rtl' ? -1 : 1
    switch (event.key) {
      case 'ArrowLeft':
        result = safe(() => adapter.addDays(value, -horizontal))
        break
      case 'ArrowRight':
        result = safe(() => adapter.addDays(value, horizontal))
        break
      case 'ArrowUp':
        result = safe(() => adapter.addDays(value, -7))
        break
      case 'ArrowDown':
        result = safe(() => adapter.addDays(value, 7))
        break
      case 'Home':
        result = safe(() =>
          adapter.addDays(value, -((adapter.getWeekday(value) - weekStartsOn + 7) % 7))
        )
        break
      case 'End':
        result = safe(() =>
          adapter.addDays(value, 6 - ((adapter.getWeekday(value) - weekStartsOn + 7) % 7))
        )
        break
      case 'PageUp':
        result = safe(() =>
          event.shiftKey ? adapter.addYears(value, -1) : adapter.addMonths(value, -1)
        )
        break
      case 'PageDown':
        result = safe(() =>
          event.shiftKey ? adapter.addYears(value, 1) : adapter.addMonths(value, 1)
        )
        break
      default:
        return
    }
    event.preventDefault()
    if (result === undefined) {
      const backward =
        event.key === 'ArrowUp' ||
        event.key === 'Home' ||
        event.key === 'PageUp' ||
        (event.key === 'ArrowLeft' ? horizontal > 0 : event.key === 'ArrowRight' && horizontal < 0)
      result = adapter.fromFields(
        backward ? { year: 1, month: 1, day: 1 } : { year: 9999, month: 12, day: 31 }
      )
    }
    focus(result)
  }
  const flags = (day: CalendarDay<T>) => {
    const value = day.value
    return {
      'data-date': value === undefined ? undefined : dateKey(adapter, value),
      'data-state': value !== undefined && selected(value) ? 'selected' : 'unselected',
      'data-selected': value !== undefined && selected(value) ? '' : undefined,
      'data-today': value !== undefined && same(value, options.today) ? '' : undefined,
      'data-focused':
        value !== undefined && !day.outsideMonth && same(value, focusedValue) ? '' : undefined,
      'data-outside-month': day.outsideMonth ? '' : undefined,
      'data-unavailable': value !== undefined && unavailable(value) ? '' : undefined,
      'data-disabled': value === undefined || isDisabled(value) ? '' : undefined,
    }
  }
  const parts: CalendarParts<T> = {
    root: {
      attrs: {
        role: 'group',
        dir: options.dir ?? 'ltr',
        'aria-label': options.headingId ? undefined : heading,
        'aria-labelledby': options.headingId,
        'data-state': options.disabled ? 'disabled' : options.readOnly ? 'readonly' : 'enabled',
        'data-disabled': options.disabled ? '' : undefined,
        'data-readonly': options.readOnly ? '' : undefined,
      },
      on: {},
    },
    heading: {
      attrs: { id: options.headingId, 'aria-live': 'polite', 'aria-atomic': 'true' },
      on: {},
    },
    grid: (monthIndex = 0) => ({
      attrs: {
        role: 'grid',
        'aria-label': months[monthIndex]?.heading ?? heading,
        'aria-readonly': options.readOnly ? 'true' : undefined,
        'aria-disabled': options.disabled ? 'true' : undefined,
      },
      on: {},
    }),
    gridHead: { attrs: {}, on: {} },
    gridBody: { attrs: {}, on: {} },
    row: { attrs: {}, on: {} },
    headerCell: (weekday) => ({ attrs: { scope: 'col', abbr: weekday.label }, on: {} }),
    cell: (day) => ({
      attrs: {
        ...flags(day),
        role: 'gridcell',
        'aria-selected': day.value !== undefined && selected(day.value) ? 'true' : 'false',
        'aria-disabled':
          day.value === undefined || isDisabled(day.value) || unavailable(day.value)
            ? 'true'
            : undefined,
      },
      on: {},
    }),
    day: (day) => ({
      attrs: {
        ...flags(day),
        type: 'button',
        disabled: day.value === undefined || isDisabled(day.value) ? true : undefined,
        tabindex:
          day.value !== undefined &&
          !day.outsideMonth &&
          !isDisabled(day.value) &&
          same(day.value, focusedValue)
            ? 0
            : -1,
        'aria-label':
          day.value === undefined
            ? undefined
            : adapter.format(
                day.value,
                { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
                locale
              ),
        'aria-disabled': day.value !== undefined && unavailable(day.value) ? 'true' : undefined,
        'aria-current':
          day.value !== undefined && same(day.value, options.today) ? 'date' : undefined,
      },
      on: {
        click: () => {
          if (day.value !== undefined) select(day.value)
        },
        focus: () => {
          if (day.value !== undefined) focus(day.value)
        },
        keydown: (event) => {
          if (day.value !== undefined) key(day.value, event)
        },
      },
    }),
    previousTrigger: {
      attrs: {
        type: 'button',
        disabled: !canGoPrevious ? true : undefined,
        'aria-label': 'Previous month',
      },
      on: { click: () => navigate(-requestedCount) },
    },
    nextTrigger: {
      attrs: {
        type: 'button',
        disabled: !canGoNext ? true : undefined,
        'aria-label': 'Next month',
      },
      on: { click: () => navigate(requestedCount) },
    },
  }
  return {
    state: {
      value: options.value,
      today: options.today,
      focusedValue,
      visibleMonth,
      months,
      weeks: months[0]!.weeks,
      weekdays,
      heading,
      canGoPrevious,
      canGoNext,
    },
    parts,
    select,
    focus,
    navigate,
  }
}
