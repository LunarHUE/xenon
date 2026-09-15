import { calendar, calendarInBounds } from '../calendar'
import type { CalendarBaseOptions, CalendarDay, CalendarParts, CalendarState } from '../calendar'

/** Complete, inclusive range of Gregorian civil dates. */
export interface DateRange<T> {
  /** Earlier endpoint, included in the range. */
  start: T
  /** Later endpoint, included in the range. */
  end: T
}
/** Range calendar snapshot inputs. Draft selection is separate from the committed value. */
export interface RangeCalendarOptions<T> extends CalendarBaseOptions<T> {
  /** Complete committed range. Endpoints are normalized to ascending order for rendering. */
  value?: DateRange<T>
  /** First date selected while drafting a new range. */
  anchorValue?: T
  /** Hovered or focused draft endpoint; omission previews the focused date. */
  previewValue?: T
  /** Propose a complete range only after a valid second activation. */
  onValueChange?: (value: DateRange<T> | undefined) => void
  /** Propose or clear the draft anchor. Escape clears it without changing the committed range. */
  onAnchorValueChange?: (value: T | undefined) => void
  /** Propose or clear the transient hover/focus endpoint. */
  onPreviewValueChange?: (value: T | undefined) => void
}
/** Range selection and the shared calendar grid snapshot. */
export interface RangeCalendarState<T> extends Omit<CalendarState<T>, 'value'> {
  /** Current complete committed range, sorted by date. */
  value: DateRange<T> | undefined
  /** Current draft anchor, independent of committed selection. */
  anchorValue: T | undefined
  /** Requested transient endpoint. */
  previewValue: T | undefined
  /** Valid draft highlight, absent when its path crosses an unavailable date. */
  previewRange: DateRange<T> | undefined
}
/** Pure two-activation range calendar. */
export interface RangeCalendarResult<T> {
  /** Calendar grid and selection snapshot. */
  state: RangeCalendarState<T>
  /** Native table, cell, and day-button semantics. */
  parts: CalendarParts<T>
  /** Start a draft or commit a valid inclusive range. */
  select(value: T): void
  /** Move focus and update the draft preview. */
  focus(value: T): void
  /** Move the visible month window. */
  navigate(monthDelta: number): void
  /** Set the transient hovered endpoint, or return to focus preview. */
  preview(value: T | undefined): void
  /** Discard draft state without changing the committed range. */
  cancel(): void
}
/** Build a generic range calendar; unavailable interior days prevent range commitment. */
export function rangeCalendar<T>(options: RangeCalendarOptions<T>): RangeCalendarResult<T> {
  const { adapter } = options
  const sorted = (a: T, b: T): DateRange<T> =>
    adapter.compare(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a }
  const same = (a: T, b: T) => adapter.compare(a, b) === 0
  const value =
    options.value === undefined ? undefined : sorted(options.value.start, options.value.end)
  const allowed = (candidate: DateRange<T>) => {
    if (!calendarInBounds(options, candidate.start) || !calendarInBounds(options, candidate.end))
      return false
    if (!options.isDateUnavailable) return true
    let cursor = candidate.start
    while (true) {
      if (options.isDateUnavailable(cursor)) return false
      if (same(cursor, candidate.end)) return true
      cursor = adapter.addDays(cursor, 1)
    }
  }
  const preview = (endpoint: T | undefined) => {
    if (options.disabled || options.readOnly || options.anchorValue === undefined) return
    if (endpoint !== undefined && !calendarInBounds(options, endpoint)) return
    if (
      endpoint === undefined
        ? options.previewValue !== undefined
        : options.previewValue === undefined || !same(endpoint, options.previewValue)
    )
      options.onPreviewValueChange?.(endpoint)
  }
  const cancel = () => {
    if (options.disabled || options.anchorValue === undefined) return
    options.onAnchorValueChange?.(undefined)
    options.onPreviewValueChange?.(undefined)
  }
  const commit = (endpoint: T) => {
    if (options.anchorValue === undefined) {
      options.onAnchorValueChange?.(endpoint)
      options.onPreviewValueChange?.(endpoint)
      return
    }
    const next = sorted(options.anchorValue, endpoint)
    if (!allowed(next)) return
    options.onAnchorValueChange?.(undefined)
    options.onPreviewValueChange?.(undefined)
    if (value === undefined || !same(next.start, value.start) || !same(next.end, value.end))
      options.onValueChange?.(next)
  }
  const base = calendar({
    ...options,
    value: undefined,
    focusedValue: options.focusedValue ?? options.anchorValue ?? value?.start ?? options.today,
    onValueChange: (endpoint) => {
      if (endpoint !== undefined) commit(endpoint)
    },
    onFocusedValueChange: (focused) => {
      options.onFocusedValueChange?.(focused)
      preview(focused)
    },
  })
  const endpoint = options.previewValue ?? base.state.focusedValue
  const candidate =
    options.anchorValue === undefined ? undefined : sorted(options.anchorValue, endpoint)
  const previewRange = candidate !== undefined && allowed(candidate) ? candidate : undefined
  const within = (date: T, range: DateRange<T>) =>
    adapter.compare(date, range.start) >= 0 && adapter.compare(date, range.end) <= 0
  const selection = (date: T) =>
    options.anchorValue !== undefined
      ? same(date, options.anchorValue)
      : value !== undefined && within(date, value)
  const flags = (day: CalendarDay<T>) => {
    const date = day.value
    const selected = date !== undefined && selection(date)
    const range = options.anchorValue !== undefined ? previewRange : value
    return {
      'data-state': selected ? 'selected' : 'unselected',
      'data-selected': selected ? '' : undefined,
      'data-highlighted':
        date !== undefined && previewRange !== undefined && within(date, previewRange)
          ? ''
          : undefined,
      'data-selection-start':
        date !== undefined && range !== undefined && same(date, range.start) ? '' : undefined,
      'data-selection-end':
        date !== undefined &&
        range !== undefined &&
        same(date, range.end) &&
        (options.anchorValue === undefined || !same(range.start, range.end))
          ? ''
          : undefined,
    }
  }
  const escape = (event: KeyboardEvent) => {
    if (
      !event.defaultPrevented &&
      !event.isComposing &&
      event.key === 'Escape' &&
      options.anchorValue !== undefined &&
      !options.disabled
    ) {
      event.preventDefault()
      event.stopPropagation()
      cancel()
    }
  }
  const parts: CalendarParts<T> = {
    ...base.parts,
    root: { attrs: base.parts.root.attrs, on: { ...base.parts.root.on, keydown: escape } },
    grid: (index) => {
      const part = base.parts.grid(index)
      return { ...part, attrs: { ...part.attrs, 'aria-multiselectable': 'true' } }
    },
    cell: (day) => {
      const part = base.parts.cell(day)
      return {
        ...part,
        attrs: {
          ...part.attrs,
          ...flags(day),
          'aria-selected': day.value !== undefined && selection(day.value) ? 'true' : 'false',
        },
      }
    },
    day: (day) => {
      const part = base.parts.day(day)
      return {
        attrs: { ...part.attrs, ...flags(day) },
        on: {
          ...part.on,
          pointerenter: () => {
            if (day.value !== undefined) preview(day.value)
          },
          pointerleave: () => preview(undefined),
          keydown: (event) => {
            escape(event)
            if (!event.defaultPrevented) part.on.keydown?.(event)
          },
        },
      }
    },
  }
  return {
    state: {
      ...base.state,
      value,
      anchorValue: options.anchorValue,
      previewValue: options.previewValue,
      previewRange,
    },
    parts,
    select: base.select,
    focus: base.focus,
    navigate: base.navigate,
    preview,
    cancel,
  }
}
