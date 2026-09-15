# Date adapters and calendars

Status: date-only adapter, Calendar and RangeCalendar implemented. Segmented
fields and packaged pickers are deferred beyond the 0.1.0 alpha. Consumers can
compose pickers from the existing parts. See [alpha scope](alpha.md).
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

```tsx
import { Calendar } from '@tenon/solid/calendar'
import { DateProvider, createDate } from '@tenon/solid/date'

<DateProvider today={createDate(2026, 9, 14)} locale="en-US" weekStartsOn={1}>
  <Calendar onValueChange={(date) => console.log(date.year, date.month, date.day)}>
    <Calendar.Header>
      <Calendar.Previous />
      <Calendar.Heading />
      <Calendar.Next />
    </Calendar.Header>
    <Calendar.Grid />
  </Calendar>
</DateProvider>
```

The provider's today snapshot should come from the application and be serialized
with its initial page data. The fixed date above only illustrates the shape.

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

Verified on 2026-09-14:

- Full unit suites: 300 core, 195 DOM, 347 Solid and 650 shared jsdom tests passed.
- Full native suite: 1,972 tests passed across 224 files in Chromium and WebKit.
- The new date slice includes 45 core tests, four Solid adapter regressions, ten
  shared tests, fifteen browser-only tests and three end-to-end cases per browser.
- Chromium and WebKit cover native activation, week/month/year navigation,
  unavailable days, controlled range rejection, canceled actions, range previews,
  and one tab stop across multiple months. The complete end-to-end run passed
  104 tests; all six calendar cases also passed after adding an initial selected
  range to the hydration fixture.
- Server elements, IDs and authored heading associations survive hydration.
  Explicit civil dates retain their labels in Honolulu and Kiritimati. An
  explicit root today also avoids sampling the local clock.
- Workspace typecheck, lint, formatting, public-subpath builds and Button bundle
  exclusions passed. TSDoc export/member and link audits found no missing public
  comments or unresolved links.
- Example studies 31 and 32 build and fit desktop and narrow layouts.

Independent arithmetic checks covered 4,750 dates in each of Honolulu and
Kiritimati, comparing weekdays and day addition against UTC reference dates.
Another check covered 144 bounded calendar windows across supported year
boundaries and one, two or twelve months, retaining one canonical day tab stop.

Native tests caught two focus-before-click bugs: an implicit visible month was
being re-derived from focus, and a spillover day could change its represented
date before activation. The binding now retains its initial month window and
defers spillover focus paging until activation. Both have focused regressions.

See [the coverage audit](calendar-coverage.md) for requirement-to-assertion
mappings and limitations. Manual screen-reader validation and non-Gregorian or
Temporal adapters are not claimed by these checks.
