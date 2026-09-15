## RangeCalendar

RangeCalendar shares Calendar's date adapter, provider settings, anatomy, grid accessibility, keyboard navigation and bounds. It has a separate value contract with complete `{ start, end }` ranges.

### Accepted contract

- [ ] `range-calendar.value.1` A value contains both start and end dates in chronological order. Controlled/default values retain the adapter's date object type.
- [ ] `range-calendar.selection.1` The first eligible click or keyboard activation begins a draft anchored at that day. It does not call `onValueChange` or publish an incomplete range.
- [ ] `range-calendar.selection.2` The second eligible activation commits one complete inclusive range and calls `onValueChange` once. Reversed selection sorts the endpoints. Selecting the anchor twice commits a one-day range. [react-aria, reka, bits]
- [ ] `range-calendar.selection.3` Starting another draft does not overwrite the last committed range. Escape cancels the draft and restores the committed presentation without a value callback.
- [ ] `range-calendar.preview.1` Pointer hover and keyboard focus update the draft preview. Endpoint and interior data attributes distinguish draft preview from committed selection. [reka, bits]
- [ ] `range-calendar.preview.2` Moving focus across a month boundary while drafting retains the anchor and previews dates in the next month. [react-aria]
- [ ] `range-calendar.bounds.1` Both endpoints and all dates between them must satisfy min/max and unavailable restrictions. A range cannot cross an unavailable interior day even when both endpoints are available. Rejected activation does not emit a committed range. [react-aria; Tenon contiguous-range policy]
- [ ] `range-calendar.roles.1` The grid exposes `aria-multiselectable="true"`. Every day in the committed inclusive interval is selected; endpoint markers distinguish start/end. [react-aria, corvu]
- [ ] `range-calendar.roles.2` Unavailable dates expose disabled semantics while remaining reachable for date inspection. Draft state never reports an incomplete public value.
- [ ] `range-calendar.keyboard.1` Calendar arrow, Home/End, PageUp/PageDown and Shift+Page navigation rules also apply while selecting a range. Enter/Space start or finish the draft once per activation.
- [ ] `range-calendar.readonly.1` Read-only and disabled policies prevent starting or committing a draft. Read-only still permits focus/navigation; disabled prevents interaction. [react-aria, reka]
- [ ] `range-calendar.cancel.1` Author-canceled activation leaves the draft and committed value unchanged. Escape only claims the event when a draft exists.
- [ ] `range-calendar.ssr.1` An explicit provider today and initial complete range produce matching server/client months and inclusive selected cells.
- [ ] `range-calendar.a11y.1` Default, selected and unavailable range grids have no axe violations under the shared suite configuration.

### Source reconciliation

Upstream range APIs differ on incomplete values, automatic sorting, minimum range lengths and noncontiguous ranges. Tenon emits only complete sorted ranges, permits a one-day range and rejects unavailable interior dates. No additional maximum/minimum range-length policy is inferred from upstream options.

### Sources

- [WAI-ARIA APG date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/), shared grid keyboard and labeling guidance. The example does not define range-selection state.
- `docs/research/react-aria-b.md`, calendar, RangeCalendar tests for inclusive selection, cross-month rendering and unavailable-date barriers.
- `docs/research/reka-melt-bits.md`, range-calendar, draft highlights, reversed endpoints, read-only/disabled and date-object preservation.
- `docs/research/kobalte-and-corvu.md`, calendar, range markers and multiselectable grid semantics.

### Deferred

Open-ended ranges, noncontiguous selection, minimum/maximum range lengths, popup range pickers and date-time ranges. Preview is temporary interaction state, not a second form value.
