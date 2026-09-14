# Date adapters for calendars and date pickers

Status: proposed for later implementation. The API examples describe the intended
shape; these exports do not exist yet.

Keep calendar behavior in Tenon and let consumers choose their date representation.
Ship a native `Date` adapter by default, with a small contract that can also support
date-fns, Temporal, or a consumer's own date type. Tenon should not depend directly
on date-fns to implement calendar behavior.

## Responsibility split

The date adapter handles arithmetic, comparison, date fields, and formatting.
Calendar controllers in `@tenon/core` use those operations to build grids, manage
selection and ranges, calculate focus movement, apply min/max and disabled-date
rules, and produce keyboard behavior and ARIA attributes. The Solid binding owns
context, uncontrolled state, and wiring to DOM focus behavior.

Keep `getCalendarGrid`, `getVisibleRange`, and `getNextPage` out of the date adapter.
Those decisions belong to Tenon and should behave the same across date types.
Business rules such as unavailable days belong in calendar options too.

## Proposed contract

Start with the operations the calendar needs. Review this list against the first
controller before committing to public exports, and remove unused methods.

```typescript
export interface DateAdapter<TDate> {
  today(): TDate

  getYear(date: TDate): number
  getMonth(date: TDate): number
  getDay(date: TDate): number
  getWeekday(date: TDate): number

  addDays(date: TDate, amount: number): TDate
  addMonths(date: TDate, amount: number): TDate
  addYears(date: TDate, amount: number): TDate

  startOfMonth(date: TDate): TDate
  endOfMonth(date: TDate): TDate
  daysInMonth(date: TDate): number

  compare(a: TDate, b: TDate): number
  isSameDay(a: TDate, b: TDate): boolean

  format(date: TDate, options: Intl.DateTimeFormatOptions, locale?: string): string
}
```

Use one set of semantics across adapters. Proposed starting rules:

- Months are 1 through 12. `getDay` means day of month, starting at 1.
  `getWeekday` returns 0 for Sunday through 6 for Saturday. Consider renaming
  `getDay` to `getDayOfMonth` before release to avoid confusion with native `Date`.
- Operations never mutate their inputs. Adding days means calendar days.
- Adding months or years clamps to the last valid day when needed. January 31
  plus one month becomes February 28 in a non-leap year.
- Comparison uses calendar-day order. Its result is negative, zero, or positive,
  and zero agrees with `isSameDay` even when native values have different times.
- Month boundaries represent the first and last calendar days, not timestamp
  limits. Formatting must describe the same day used by arithmetic and comparison.

The first version targets Gregorian date-only controls. Swapping the representation
does not by itself add other calendar systems or time-of-day selection.

## Component and provider API

The single-selection root has this provisional shape, following Tenon's convention
that an empty selection emits `undefined`:

```typescript
type CalendarRootProps<TDate = Date> = {
  adapter?: DateAdapter<TDate>
  value?: TDate
  defaultValue?: TDate
  onValueChange?: (value: TDate | undefined) => void
}
```

Ordinary use needs no adapter prop. A component can override the adapter locally:

```tsx
<Calendar.Root value={date()} onValueChange={setDate} />

<Calendar.Root
  adapter={dateFnsAdapter}
  value={date()}
  onValueChange={setDate}
/>

<Calendar.Root adapter={temporalAdapter} value={plainDate()} />
```

`DateProvider` supplies a shared adapter for calendars and both picker variants.
This lets a styled component library choose its date implementation once:

```tsx
<DateProvider adapter={dateFnsAdapter}>
  <Calendar.Root />
  <DatePicker.Root />
  <DateRangePicker.Root />
</DateProvider>
```

Resolve configuration in the Solid binding, then pass a concrete adapter to core:

```typescript
const adapter = props.adapter ?? useDateContext()?.adapter ?? nativeDateAdapter
```

A local prop wins over the nearest provider. Without either, use the native
adapter. Core never reads Solid context or chooses a fallback.

Provider inheritance needs a type design before implementation. A parent JSX
provider cannot establish the generic type of every descendant at compile time.
The optional prop sketch above must not allow a non-`Date` value to fall through
to the native adapter. Prototype typed component factories or wrappers for
provider-based use, and require a matching explicit adapter where inference
cannot establish the pairing. Do not hide the mismatch with a cast.

## Defaults and migration

Keep native `Date` as the default for the initial major version. Offer other
adapters through separate entry points so consumers only install and bundle the
date libraries they use. Exact package and export names remain open.

Add a `Temporal.PlainDate` adapter as an opt-in when we are ready to support it.
Changing the default to Temporal changes values and callback types, so that
requires a major release. Retain an explicit native adapter export for consumers
who need `Date`, and document how to preserve their existing representation.

## Work before implementation

Decide how the native adapter interprets dates and time zones, how adapters reject
invalid values, and which formatting options date-only controls accept. Resolve
locale and week-start configuration separately from date arithmetic. Parsing and
form serialization need explicit contracts when picker inputs are designed;
display formatting is not a serialization format.

Define how `today()` receives a consistent clock and zone during SSR and hydration.
Core should receive a resolved today value so rendering does not read the clock
again. Also decide whether changing adapters after mount requires a remount,
especially when the new adapter uses a different value type.

Implement the calendar against the native adapter first, then exercise the same
controller with a second date representation before freezing the contract. Add
shared adapter tests for leap years, clamping, day comparison, input immutability,
and daylight-saving boundaries. Add type checks for adapter/value mismatches and
provider wrappers. Calendar conformance tests should cover navigation, selection,
ranges, constraints, announcements, and hydration across both adapters.

The existing calendar and picker research in `docs/research/` can supply behavior
requirements when this work starts. Turn the chosen requirements into conformance
specs then; this plan does not mark any calendar behavior as implemented.
