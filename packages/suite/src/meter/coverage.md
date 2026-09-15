# Meter coverage

`meter.alpha.1` passes in jsdom, Chromium and WebKit. It verifies native and
generic roles, finite values, author naming, read-only focus behavior, reactive
minimum fallback, CSS percentage and the suite's axe rules. Core tests separately
cover invalid/overflowing bounds, formatting and clamping. Solid tests cover host
stability and author value-text overrides. Pagination's SSR fixture verifies the
native value and name before client JavaScript.

No track/fill/value-label anatomy, indeterminate state, live announcements or
locale formatter is shipped. Consumer children and visual contrast need their
own review. Hydration and assistive-technology speech are not asserted.
