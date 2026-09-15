# Date adapters and calendars

Status: date-only values approved. Calendar and RangeCalendar are the first
implementation slice; segmented fields and popover pickers follow separately.
This supersedes the earlier proposal to default to native JavaScript Date.

## Values and adapter ownership

The default DateValue is an immutable Gregorian `{ year, month, day }` value.
Years are 1 through 9999, months 1 through 12, and days are validated against the
month. Date arithmetic never mutates inputs or silently accepts invalid days.
Month and year addition clamps to the final valid day when needed.

A date identifies a calendar day, not an instant. It has no time of day or time
zone. Calendar-day arithmetic and comparison do not depend on the host time zone.
Strict ISO date parsing and serialization use YYYY-MM-DD, independently of display
locale. Formatting must retain Gregorian date identity and exclude time-of-day or
time-zone options.

DateAdapter<TDate> handles conversion to/from fields, arithmetic, comparison,
weekday and month length, and display formatting. The default dateOnlyAdapter
implements that contract. Core always receives an adapter and a resolved today
value; it never reads a clock or framework context. The same core tests must run
against a second representation to expose assumptions about object identity or
plain-object date fields.

Temporal can be added through a separate adapter without changing the default
component API. Native Date is not the default value type. Conversion to timestamps,
zoned time, and native Date representation requires an explicit policy and is
outside this first date-only slice.

## Configuration and typing

DateProvider shares locale, weekStartsOn, and a date-only today snapshot. Root props
win over provider values. Deterministic defaults are en-US and Sunday/0 unless
specified. Locale controls formatting; it does not silently change weekStartsOn.

Custom representations require a matching explicit adapter on the Calendar or
RangeCalendar root. JSX ancestry cannot establish a descendant's generic type, so
an arbitrary adapter in context must not change the value type of a default root.
Type tests must reject mismatched values/callbacks and missing custom adapters.

Without today, the Solid adapter samples local calendar fields once. For SSR,
supply the same date-only today snapshot and locale on server and client. This
avoids ambient time-zone or midnight differences during hydration without putting
clock reads in core. The calendar performs no midnight polling in this slice.

## Anatomy

Calendar is the root component, with Header, Previous, Heading, Next, and Grid.
Grid provides a default native table layout. Custom layouts can compose GridHead,
GridBody, Row, Cell, Day and weekday-heading parts from the root render state.
No icons, styles, or preset animation are included.

RangeCalendar lives in its own module and reuses calendar internals. Its committed
value is a complete `{ start, end }` pair. The first activation starts a draft;
the second commits a sorted valid range. Hover/focus previews do not commit.
Escape cancels a draft and otherwise remains available to ancestor overlays.

Multiple visible months use an explicit month index on each Grid. There is one
roving day tab stop across the calendar. Adjacent-month duplicates must not create
extra stops or ambiguous selection associations.

## Behavior

- Selection and focus are separate. Focus movement does not select a date.
- Native day buttons own Enter/Space activation. Arrows move by day/week, Home/End
  move to week boundaries, PageUp/PageDown change month, and Shift adds year paging.
  Horizontal movement follows direction. Bounds prevent invalid navigation.
- Unavailable dates remain inspectable through focus but cannot be selected.
  Disabled roots block interactions; read-only roots permit navigation without
  changing selection. No change callbacks fire on mounting.
- Ranges cannot cross unavailable dates by default. Disabled endpoints and values
  outside min/max cannot commit. Reverse selection sorts endpoints.
- Heading changes announce month navigation. Date labels and weekday names use
  locale-aware formatting while selection keys remain locale-independent.
- Undefined means uncontrolled, matching the library's existing convention.
  Returning a controlled prop to undefined resumes internal state silently.

## Implementation slices

1. DateValue helpers, generic adapter contract, arithmetic/conformance tests.
2. Pure Calendar and RangeCalendar behavior, bounds, draft selection and semantics.
3. DateProvider and Solid compound parts with type, adapter and SSR tests.
4. Shared/native Chromium and WebKit coverage and consumer-styled examples.
5. Public subpath builds, TSDoc audit, coverage review and verification notes.

Use focused commits per slice. Write TSDoc with the implementation. Preserve
unverified source cases as explicit coverage gaps rather than marking them passed.

## Sources

- Existing calendar, range-calendar, date-field and picker research in docs/research.
- WAI-ARIA calendar keyboard and grid example:
  https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/

The APG example includes dialog dismissal that belongs to the later picker layer;
standalone Calendar does not close an overlay merely because a date was selected.

## Later slices

DateField and DateRangeField introduce segmented editing and incomplete input.
DatePicker and DateRangePicker compose fields, calendars and existing popovers.
TimeField, other calendar systems, and zoned date-time selection require separate
contracts. Adapter representation interchange does not imply support for all of
those domains.

## Verification

Implementation in progress.
