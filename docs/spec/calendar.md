## Calendar

This specification separates the accepted xenon contract from broader upstream features. Calendar is an inline single-date grid. Date inputs, popup dismissal, date-time editing are separate work.

### Accepted contract

- [x] `calendar.value.1` A default date is an immutable `{ year, month, day }` value. Selection and navigation use a `DateAdapter`, so custom date objects pass through without conversion to mutable JavaScript dates.
- [x] `calendar.value.2` A controlled value changes only when its owner accepts `onValueChange`; uncontrolled `defaultValue` changes locally. Mounting and focus movement do not emit selection callbacks.
- [x] `calendar.value.3` Selecting the already selected date does not clear it or emit another value change.
- [x] `calendar.config.1` DateProvider supplies locale, first weekday and a reference today. Explicit today makes initial rendering deterministic across server and client.
- [x] `calendar.roles.1` Grid renders an accessible table with `role="grid"`, labeled by the displayed month/year. Weekday column headers expose full weekday names even when their visual labels are abbreviated. [APG, react-aria, corvu]
- [x] `calendar.roles.2` Day cells expose full localized date names; selected cells carry `aria-selected`, and today's day carries `aria-current="date"`. [APG, react-aria]
- [x] `calendar.roles.3` The month heading is a polite live region. Previous and Next are explicitly named non-submit buttons. [APG, corvu]
- [x] `calendar.focus.1` Exactly one eligible day is in the grid's Tab order. Initial tab focus prefers the selected date, otherwise reference today, constrained by the permitted interval. Arrival never moves document focus. [APG, react-aria, reka]
- [x] `calendar.keyboard.1` Left/Right move one day, Up/Down move seven days, crossing week/month/year boundaries. RTL reverses only the horizontal arrow direction. [APG, corvu]
- [x] `calendar.keyboard.2` Home/End focus the first/last date of the configured week. [APG]
- [x] `calendar.keyboard.3` PageUp/PageDown move one month; adding Shift moves one year. Missing day numbers clamp to the last day of the destination month. [APG, corvu]
- [x] `calendar.keyboard.4` Enter and Space select the focused eligible date once. Native button behavior supplies keyboard activation without duplicate key/click callbacks. [APG]
- [x] `calendar.keyboard.5` Navigation to a different month preserves focus on the intended day. Previous/Next update the visible month while retaining focus on the navigation control. [APG, react-aria]
- [x] `calendar.bounds.1` Dates before minValue or after maxValue cannot be selected. Keyboard focus stays within these inclusive boundaries, and navigation buttons disable when their destination month cannot contain an eligible date. [react-aria, reka]
- [x] `calendar.unavailable.1` An unavailable date exposes `aria-disabled="true"` and remains reachable by arrow navigation, allowing its full date to be read. Pointer and keyboard activation do not select it. [react-aria, reka; xenon focus policy]
- [x] `calendar.readonly.1` Read-only calendars allow date focus and month navigation but never change selection. The grid exposes `aria-readonly`. [react-aria, reka]
- [x] `calendar.disabled.1` Disabled calendars prevent selection and navigation, disable Previous/Next, and expose disabled grid/day state. [react-aria, reka]
- [x] `calendar.cancel.1` Author preventDefault on activation or keyboard navigation vetoes the corresponding internal action.
- [x] `calendar.layout.2` With visibleMonths greater than one, Grid month indices render adjacent months while keeping exactly one day in the Tab order across the whole calendar. Cross-month arrows transfer focus without duplicate active days.
- [x] `calendar.layout.1` Default Grid creates weekday headings and complete displayed weeks. Custom anatomy parts preserve the same semantics and controller. Calendar writes no visual theme CSS.
- [x] `calendar.ssr.1` An explicit provider today/locale and value produce matching server/client dates, labels and selected state without reading the current clock during hydration.
- [x] `calendar.a11y.1` Default and constrained calendars have no axe violations under the shared suite configuration. Keyboard assertions separately verify behavior not checked by axe.

### Source reconciliation

The APG example embeds its calendar in a dialog. Its dialog focus trap, trigger focus restoration and Cancel/OK footer do not apply to this inline component. The grid keyboard and table semantics do apply. xenon uses a labeled group rather than introducing `role="application"` solely because some upstream calendars do so.

Upstream implementations disagree about whether unavailable dates are removed from arrow navigation. xenon keeps unavailable dates focusable, while out-of-bounds dates cannot become the active day. Home/End follow the configured chronological week; RTL changes Left/Right, not the meaning of week start/end.

### Sources

- [WAI-ARIA APG date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), calendar grid keyboard and accessibility features.
- `docs/research/react-aria-b.md`, calendar, React Spectrum Calendar and CalendarBase behavior tests.
- `docs/research/reka-melt-bits.md`, calendar, native focus, bounds, disabled/read-only and custom-date evidence.
- `docs/research/kobalte-and-corvu.md`, calendar, default table anatomy, live heading and date navigation.

### Deferred

Multiple selection, month/year selects, alternate calendar arithmetic, date fields and popup date pickers. The adapter is an extension point; accepting it does not claim built-in support for every calendar system. Manual screen-reader verification remains separate from DOM and axe assertions.
