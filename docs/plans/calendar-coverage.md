# Calendar coverage

This covers the accepted Gregorian date-only slice, not the full upstream research inventory. It includes one or multiple adjacent month grids, single and complete-range selection, adapter-preserved values, and explicit provider configuration.

Verified on 2026-09-14:

- Shared jsdom suite: 10/10 passed.
- Scoped Chromium and WebKit suites: 50/50 passed, comprising ten shared and fifteen native tests per browser.
- Calendar end-to-end suite: 6/6 passed across Chromium and WebKit, reported by the root verification run.
- Full native suite: 1972/1972 passed across 224 browser files in Chromium and WebKit, including the final controlled/canceled range tests.
- Full end-to-end suite: 104/104 passed across Chromium and WebKit, reported by the root verification run.
- Suite/example typechecks and scoped lint passed. The production example builds successfully.

This audit maps accepted behavior to executable assertions; a source citation alone is not coverage.

The repository spec scanner extracts only the first behavior ID from each test title. Compound titles therefore undercount covered rows. The assertion map below includes every behavior asserted inside those tests; checked rows refer to that map and the listed core/end-to-end evidence, not the scanner's count alone.

## Shared adapter tests

`packages/suite/src/calendar/calendar.test.tsx` runs in jsdom and native browsers.

| Contract | Assertion |
| --- | --- |
| `calendar.roles.1`, `.roles.2`, `.roles.3`, `.config.1` | Named month grid, polite heading, full weekday abbreviation, explicit today and native navigation button type. |
| `calendar.value.2`, `.value.3` | No callback on mount, uncontrolled selection updates once, same-day reselection is silent, controlled acceptance updates rendered state. |
| `calendar.cancel.1`, `.layout.1` | Custom Grid/Row/Cell/Day composition keeps semantics and respects Day event cancellation. |
| `calendar.value.1` | A custom ISODate adapter returns an application-class instance after selection. |
| `range-calendar.value.1`, `.selection.1` | Custom adapter ranges emit only after completion and preserve both endpoint instances. A controlled range retains its committed cells until its owner accepts a completed proposal. |
| `range-calendar.readonly.1`, `.cancel.1` | Read-only/disabled range grids cannot begin a draft; Escape remains unclaimed without a draft. A canceled Range.Day activation cannot start a draft. |

## Native interaction tests

`packages/suite/src/calendar/calendar.test-browser.tsx` runs only in real browsers.

| Contract | Assertion |
| --- | --- |
| `calendar.focus.1`, `.keyboard.1` | One roving day, daily and weekly movement, September/October boundary focus, no selection from navigation. |
| `calendar.keyboard.2` | Home/End use a Monday-start week. |
| `calendar.keyboard.3` | Month paging clamps January 31 to leap-day February; Shift paging moves years and clamps February 29. |
| `calendar.keyboard.5` | Paging controls retain native focus. A pointer click on March 5 displayed outside February commits the original date and focuses its canonical March cell, even while the grid repages. |
| `calendar.keyboard.1` RTL | RTL swaps horizontal arrows while vertical arrows still move one week. |
| `calendar.unavailable.1`, `.keyboard.4` | Unavailable dates retain native focus but cannot select; Space selects once and Enter on the same selection remains silent. |
| `calendar.bounds.1` | Inclusive min/max stop arrow movement and disable month controls with no permissible destination. |
| `calendar.readonly.1`, `.disabled.1` | Read-only keeps navigation without selection; disabled grids have no roving day and disabled paging controls. |
| `calendar.value.2`, `.focus.1` | Mounting preserves an already focused outside button; controlled selection remains owner-controlled. |
| `range-calendar.selection.1`, `.selection.2`, `.preview.1`, `.roles.1` | Reverse selection previews before committing once; sorted inclusive endpoints and four selected cells. |
| `range-calendar.selection.3` | Escape removes draft preview, preserves the committed range, and a subsequent same-day pair commits once. |
| `range-calendar.bounds.1`, `.roles.2` | Two available endpoints cannot commit across an unavailable interior day. |
| `calendar.layout.2`, `range-calendar.preview.2`, `.keyboard.1` | Two adjacent grids share one tab stop and complete a September/October range using keyboard navigation. |
| `calendar.a11y.1`, `range-calendar.a11y.1` | Axe reports no violations for selected and unavailable grids under the shared suite exclusions. |

## End-to-end verification

Root-owned `packages/suite/e2e/calendar.spec.ts` covers server/hydration node identity and date labels across time zones, leap-day keyboard selection, and two-month range completion with one roving stop. All six calendar cases passed across Chromium and WebKit, including a server-rendered February 12–14 initial range with the same three selected cells after hydration. The wider 104-case end-to-end run also passed.

## Source and example checks

The core date/calendar/range suites cover date validity and immutability, Gregorian arithmetic, sorted ranges, unavailable barriers, composition-safe Escape and shared keyboard semantics. Range navigation delegates to the same calendar engine whose complete keyboard map is exercised natively above.

The example presents studies 31 and 32 with a fixed September 14, 2026 reference. Calendar demonstrates inclusive appointment bounds and an unavailable date. RangeCalendar shows two adjacent months and an unavailable interior barrier. Consumer CSS distinguishes selection, hover/focus preview, today and neighboring-month cells. Desktop and 390px mobile inspection confirmed both calendar sections fit their containers; each range month has a visible label when stacked on narrow screens.

## Development transforms

The Solid package's normal test command also runs `scripts/check-dev.mjs` with
Solid refresh enabled. This reproduced and now guards the duplicate declarations
caused by component function overloads in the development transform. Calendar
roots keep their overloads in callable interfaces, leaving one runtime declaration.
The example was also checked through its actual Vite development server.

## Limits

Axe excludes color contrast and landmark-region rules in this repository. It does not establish screen-reader announcement quality. No manual assistive-technology run is claimed. The custom adapter tests use Gregorian ISO fields in a separate application class; they do not claim non-Gregorian arithmetic or Temporal integration.
