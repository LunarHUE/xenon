import type {
  CalendarBaseOptions,
  CalendarDay,
  CalendarMonth,
  CalendarWeekday as CoreCalendarWeekday,
} from '@xenon/core/calendar'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import type { DateAdapter, DateValue } from '@xenon/core/date'

/** One visible grid slot; padding at supported year boundaries has no value. */
export type CalendarDateCell<T> = CalendarDay<T>
/** One displayed calendar month and its week rows. */
export type CalendarMonthView<T> = CalendarMonth<T>
/** Localized weekday metadata in displayed order. */
export type CalendarWeekday = CoreCalendarWeekday
/** Reactive values supplied to a root's children callback. Read fields within JSX. */
export interface CalendarRenderState<T = DateValue, Selection = T> {
  /** Current committed selection, absent before the first accepted selection. */
  readonly value: Selection | undefined
  /** Current date used for today markers, in the chosen representation. */
  readonly today: T
  /** Resolved roving day. */
  readonly focusedValue: T
  /** First displayed month. */
  readonly visibleMonth: T
  /** Week rows for the first displayed month. */
  readonly weeks: CalendarDateCell<T>[][]
  /** Every displayed month, in chronological order. */
  readonly months: CalendarMonthView<T>[]
  /** Localized weekday labels in week-start order. */
  readonly weekdays: CalendarWeekday[]
  /** Localized displayed month or month range. */
  readonly heading: string
  /** Whether a previous page intersects the date bounds. */
  readonly canGoPrevious: boolean
  /** Whether a next page intersects the date bounds. */
  readonly canGoNext: boolean
  /** Range-only first selected day while a draft is active. */
  readonly anchorValue: T | undefined
  /** Range-only pointer or keyboard preview endpoint. */
  readonly previewValue: T | undefined
}
/** Calendar-owned state, localization and availability inputs. */
export interface CalendarOwnProps<T, Selection = T> extends Omit<
  CalendarBaseOptions<T>,
  'adapter' | 'today' | 'headingId'
> {
  /** Controlled selection when defined. Mounting never emits a selection callback. */
  value?: Selection
  /** Initial uncontrolled selection, read once. */
  defaultValue?: Selection
  /** Reports accepted selection changes. Range roots report only completed ranges. */
  onValueChange?: (value: Selection) => void
  /** Controlled roving day when defined. */
  focusedValue?: CalendarBaseOptions<T>['focusedValue']
  /** Initial uncontrolled roving day; otherwise selection or today supplies it. */
  defaultFocusedValue?: CalendarBaseOptions<T>['focusedValue']
  /** Reports a changed focus-day request without implying selection. */
  onFocusedValueChange?: CalendarBaseOptions<T>['onFocusedValueChange']
  /** Controlled first visible month, identified by any day in that month. */
  visibleMonth?: CalendarBaseOptions<T>['visibleMonth']
  /** Initial uncontrolled first visible month. */
  defaultVisibleMonth?: CalendarBaseOptions<T>['visibleMonth']
  /** Reports a changed displayed month, including keyboard crossings. */
  onVisibleMonthChange?: CalendarBaseOptions<T>['onVisibleMonthChange']
  /** Formatting locale; defaults to DateProvider or en-US. */
  locale?: CalendarBaseOptions<T>['locale']
  /** Week start, Sunday=0 through Saturday=6; overrides DateProvider. */
  weekStartsOn?: CalendarBaseOptions<T>['weekStartsOn']
  /** Today in the root adapter's representation; otherwise convert DateProvider's snapshot. */
  today?: CalendarBaseOptions<T>['today']
  /** Explicit horizontal direction; otherwise sample the nearest dir attribute after mount. */
  dir?: CalendarBaseOptions<T>['dir']
  /** Receives the calendar root host. */
  ref?: (element: HTMLElement) => void
  /** Static compound parts or a callback receiving reactive calendar state. */
  children?: JSX.Element | ((calendar: CalendarRenderState<T, Selection>) => JSX.Element)
}
/** Polymorphic calendar props before choosing a required or default adapter. */
export type CalendarBaseProps<T, Selection, As extends ValidComponent> = Omit<
  ComponentProps<As>,
  keyof CalendarOwnProps<T, Selection> | 'as' | 'onChange'
> &
  CalendarOwnProps<T, Selection> & {
    /** Root host, defaulting to div; custom components must forward props and ref. */
    as?: As
  }
type ExactlyDateValue<T> = [T] extends [DateValue]
  ? [DateValue] extends [T]
    ? true
    : false
  : false
/** The exact default representation can omit its adapter. Other representations must supply one. */
export type CalendarAdapterProps<T> =
  ExactlyDateValue<T> extends true
    ? {
        /** Date-only adapter override. Omission uses immutable Gregorian DateValue operations. */
        adapter?: DateAdapter<T>
      }
    : {
        /** Required operations for the custom representation, including conversion of provider today fields. */
        adapter: DateAdapter<T>
      }
/** Native host attributes with the usual polymorphic escape hatch. */
export type CalendarHostProps<As extends ValidComponent> = ComponentProps<As> & {
  /** Native tag or a component forwarding its props and ref. */
  as?: As
  /** Receives the rendered host. */
  ref?: (element: HTMLElement) => void
}
