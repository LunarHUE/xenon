import { rangeCalendar } from '@tenon/core/range-calendar'
import type { DateRange, RangeCalendarOptions } from '@tenon/core/range-calendar'
import type { DateAdapter, DateValue } from '@tenon/core/date'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createCalendarRoot } from '../internal/calendar-root'
import type { InternalCalendarProps } from '../internal/calendar-root'
import type {
  CalendarAdapterProps,
  CalendarBaseProps,
  CalendarRenderState,
} from '../internal/calendar-types'
import {
  CalendarHeader,
  CalendarHeading,
  CalendarPrevious,
  CalendarNext,
  CalendarGrid,
  CalendarGridHead,
  CalendarGridBody,
  CalendarRow,
  CalendarCell,
  CalendarDay,
  CalendarColumnHeader,
} from '../internal/calendar-parts'

/** Complete inclusive range. Partial pointer/keyboard drafts are kept separate from this value. */
export type CalendarRange<T = DateValue> = DateRange<T>
/** Reactive render callback state with a complete range as its committed value. */
export type RangeCalendarRenderState<T = DateValue> = CalendarRenderState<T, CalendarRange<T>>
/** Range selection props. Custom representations require their matching explicit adapter. */
export type RangeCalendarProps<
  T = DateValue,
  As extends ValidComponent = 'div',
> = CalendarBaseProps<T, CalendarRange<T>, As> & CalendarAdapterProps<T>
/** Render a date-only range calendar. The first activation starts a draft; a valid second activation commits. */
function RangeCalendarComponent<As extends ValidComponent = 'div'>(
  props: RangeCalendarProps<DateValue, As>
): JSX.Element
/** Render a custom range representation inferred only from its required adapter. */
function RangeCalendarComponent<T, As extends ValidComponent = 'div'>(
  props: CalendarBaseProps<NoInfer<T>, CalendarRange<NoInfer<T>>, As> & { adapter: DateAdapter<T> }
): JSX.Element
function RangeCalendarComponent(props: unknown): JSX.Element {
  return createCalendarRoot(props as InternalCalendarProps, 'RangeCalendar', (options) =>
    rangeCalendar(options as RangeCalendarOptions<unknown>)
  )
}
/**
 * Inclusive range calendar with internal draft and hover preview. Only complete,
 * valid ranges reach onValueChange. Escape cancels an active draft; with no draft
 * it remains available to ancestor overlays. Each Grid owns one visible month.
 */
export const RangeCalendar = Object.assign(RangeCalendarComponent, {
  /** Layout wrapper for the heading and paging controls. */
  Header: CalendarHeader,
  /** Localized displayed interval and accessible name. */
  Heading: CalendarHeading,
  /** Previous displayed page without DOM focus movement. */
  Previous: CalendarPrevious,
  /** Next displayed page without DOM focus movement. */
  Next: CalendarNext,
  /** Complete default native table, or custom children for a displayed month. */
  Grid: CalendarGrid,
  /** Native table heading section. */
  GridHead: CalendarGridHead,
  /** Native table body section. */
  GridBody: CalendarGridBody,
  /** Native week or heading row. */
  Row: CalendarRow,
  /** Grid cell with selected and preview-range hooks. */
  Cell: CalendarCell,
  /** Date button starting or completing a draft range. */
  Day: CalendarDay,
  /** Localized weekday column header. */
  ColumnHeader: CalendarColumnHeader,
})
