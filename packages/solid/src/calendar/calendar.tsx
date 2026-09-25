import { calendar } from '@xenon-ui/core/calendar'
import type { DateAdapter, DateValue } from '@xenon-ui/core/date'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createCalendarRoot } from '../internal/calendar-root'
import type { InternalCalendarProps } from '../internal/calendar-root'
import type { CalendarAdapterProps, CalendarBaseProps } from '../internal/calendar-types'
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

/** Single-selection calendar props. Custom representations require their matching explicit adapter. */
export type CalendarProps<T = DateValue, As extends ValidComponent = 'div'> = CalendarBaseProps<
  T,
  T,
  As
> &
  CalendarAdapterProps<T>
/** Keep overloads in a type so Solid refresh sees only one runtime component declaration. */
interface CalendarComponentType {
  /** Render date-only values with optional provider defaults. */
  <As extends ValidComponent = 'div'>(props: CalendarProps<DateValue, As>): JSX.Element
  /** Infer a custom representation only from its required adapter. */
  <T, As extends ValidComponent = 'div'>(
    props: CalendarBaseProps<NoInfer<T>, NoInfer<T>, As> & { adapter: DateAdapter<T> }
  ): JSX.Element
}
const CalendarComponent: CalendarComponentType = (props: unknown): JSX.Element => {
  return createCalendarRoot(props as InternalCalendarProps, 'Calendar', (options) =>
    calendar(options)
  )
}
/**
 * Single-selection calendar and its headless native-table parts. Root is the
 * component itself. Grid supplies a complete default table; custom layouts can
 * use a children callback and GridHead, GridBody, Row, Cell, Day and ColumnHeader.
 */
export const Calendar = Object.assign(CalendarComponent, {
  /** Layout wrapper for the heading and paging controls. */
  Header: CalendarHeader,
  /** Localized month interval and accessible calendar name. */
  Heading: CalendarHeading,
  /** Previous displayed page without DOM focus movement. */
  Previous: CalendarPrevious,
  /** Next displayed page without DOM focus movement. */
  Next: CalendarNext,
  /** Complete default native table, or custom children in one month context. */
  Grid: CalendarGrid,
  /** Native table heading section for a custom grid. */
  GridHead: CalendarGridHead,
  /** Native table body section for a custom grid. */
  GridBody: CalendarGridBody,
  /** Native week or heading row. */
  Row: CalendarRow,
  /** Date-bound grid cell carrying selection hooks. */
  Cell: CalendarCell,
  /** Date-bound button with roving focus and native activation. */
  Day: CalendarDay,
  /** Localized weekday column header. */
  ColumnHeader: CalendarColumnHeader,
})
