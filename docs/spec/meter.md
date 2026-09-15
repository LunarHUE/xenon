# Meter

A Meter describes a bounded measurement, such as storage usage. It renders a
native `meter` by default. Generic hosts receive `role="meter"`. Supply an
accessible name with a native label, `aria-label`, or `aria-labelledby`.

`value` defaults to the minimum. Bounds default to 0 and 100. Missing or nonfinite
bounds use their defaults; a reversed, equal, or overflowing range resets both
bounds to 0 and 100. Values clamp to this range. A nonfinite value uses the minimum.
There is no indeterminate state. `format` receives value, min, max and percentage;
its text defaults to rounded percentage. Author ARIA attributes win.

The Solid adapter publishes `--meter-percentage` as a number without a percent
suffix. No styles, children, keyboard behavior, or live region are supplied.

Core tests cover normalization, formatting and native/generic attributes. Solid
tests cover native value updates, stable hosts, CSS updates and author text.

Reference: [APG Meter](https://www.w3.org/WAI/ARIA/apg/patterns/meter/).
