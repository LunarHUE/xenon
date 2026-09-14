# Progress and meter

Two roles, two `##` sections, one file. They share almost all of their
attribute surface and differ on three things: indeterminate state, the default
maximum, and whether the role is a widget.

Bullets tagged `[apg]`, `[html]` or `[axe]` come from a standard or a linter
rather than a library, so they are normative and never carry `(candidate)`.

## progress

### Roles and attributes

- [ ] `progress.roles.1` Given an element that communicates progress of a task, then it MUST have `role="progressbar"` and MUST NOT use `role="meter"`. [apg]
- [ ] `progress.roles.2` Given a progressbar with a known value, then `aria-valuenow` MUST be set and MUST fall within the minimum and maximum. [apg]
- [ ] `progress.roles.3` Given a progressbar whose range is 0 to 100, then `aria-valuemin` and `aria-valuemax` MAY be omitted because those are the role defaults. [apg]
- [ ] `progress.roles.4` Given a progressbar where the bare number is unhelpful, then `aria-valuetext` MAY be set to a readable string. [apg]
- [ ] `progress.roles.5` Given `role="progressbar"`, then all of its descendants are forced presentational by the user agent, so it MUST NOT contain a focusable widget-role descendant. [apg, axe]
- [ ] `progress.roles.6` Given `role="progressbar"`, then it MUST have an accessible name from `aria-label`, `aria-labelledby` or `title`; axe tags this WCAG 1.1.1 A at serious impact, and every library resolves `aria-labelledby` to the label part's generated id. [apg, axe, react-aria, base-ui, kobalte, bits]
- [ ] `progress.roles.7` Given a progressbar in the axe role table, then it is a widget-type role whose superclass is `range`, with NO required attributes and role-specific allowed attributes `aria-expanded`, `aria-valuemax`, `aria-valuemin`, `aria-valuenow` and `aria-valuetext`; the absence of `aria-valuenow` from `requiredAttrs` is what makes an indeterminate progress bar legal. [axe]
- [ ] `progress.roles.8` Given a progress root rendered with no value props, then `aria-valuemin="0"`, `aria-valuemax="100"` and `aria-valuenow="0"` are written explicitly rather than left to the role defaults. [react-aria, base-ui, kobalte, bits, ark]
- [ ] `progress.roles.9` Given a `value` prop, then `aria-valuenow` is that value as a string, and updating the prop updates the attribute in the same commit. [react-aria, radix, base-ui, kobalte, bits, zag]
- [ ] `progress.roles.10` Given explicit `min` and `max` props, for example `min: 10` and `max: 20`, then `aria-valuemin` and `aria-valuemax` reflect them verbatim. [react-aria, base-ui, kobalte, bits]
- [ ] `progress.roles.11` Given no custom formatter, then `aria-valuetext` defaults to the value formatted as a percentage of the min-to-max range, for example `"25%"` at `value={25}` of 0 to 100. [react-aria, base-ui, kobalte, zag, ark]
- [ ] `progress.roles.12` Given `aria-labelledby` and `aria-valuetext` passed in by the consumer, then both appear verbatim on the root instead of being overwritten by the component's own values. [bits] (candidate)
- [ ] `progress.roles.13` Given a progressbar implemented as `role="img"` over a spinner image, then `role-img-alt` requires alternative text from `aria-label`, `aria-labelledby` or `title`, at serious impact. [axe]
- [ ] `progress.roles.14` Given the progress anatomy, then the parts are root, label, track, range (indicator), valueText, view, circle, circleTrack and circleRange, and the root carries `data-max`, `data-value`, `data-state`, `data-orientation` and a `--percent` custom property that is left undefined while indeterminate. [zag] (candidate)
- [ ] `progress.roles.15` Given the value-text part, then it is `aria-live="polite"` so screen readers announce value changes without the progressbar itself being focused. [zag] (candidate)
- [ ] `progress.roles.16` Divergence: the formatted value is exposed as `aria-valuetext` while the accessible name comes from the label part. [apg, react-aria, base-ui, kobalte] (decision needed)
- [ ] `progress.roles.17` Divergence: the formatted value is exposed as `aria-label` on the semantic element, which overwrites the name computed from the label part. [zag] (decision needed)

### Keyboard

- [ ] `progress.keyboard.1` Given a progressbar, then it is not an interactive widget and MUST NOT be focusable; the APG defines no keyboard interaction for the role and has no progressbar pattern page. [apg]
- [ ] `progress.keyboard.2` Given a progressbar given `tabindex="0"`, then axe's `focus-order-semantics` passes on the widget-role branch, because `progressbar` is a widget-type role. [axe]

### Pointer

- [ ] `progress.pointer.1` Given a progressbar, then there is no pointer interaction: it is a read-only display. [apg]
- [ ] `progress.pointer.2` Given a progress ring with a label in its middle, when the pointer moves over the label, then the pointer reaches the label rather than being blocked by the ring. [ariakit] (candidate) (chromium-only)

### State

- [ ] `progress.state.1` Given the native `progress` element, then it is determinate if and only if the `value` attribute is present; with `value` omitted it MUST be an indeterminate progress bar, and `:indeterminate` MUST match it. [html]
- [ ] `progress.state.2` Given a `progress` element's maximum, then it comes from parsing `max`, and if `max` is absent, in error, or less than or equal to zero, the maximum MUST be 1.0. [html]
- [ ] `progress.state.3` Given a determinate `progress` element, then its value comes from parsing `value`, MUST be zero if `value` is absent, in error or not positive, and MUST be clamped to the maximum when it exceeds it; the clamp applies to the current value and is not written back into the DOM. [html]
- [ ] `progress.state.4` Given `progress.position`, then it MUST return -1 for an indeterminate progress bar and otherwise value divided by maximum, so -1 is the sentinel a headless progress component mirrors for indeterminate; `progress.value` returns 0 while indeterminate, so the value alone cannot distinguish indeterminate from zero. [html]
- [ ] `progress.state.5` Given an indeterminate progress bar, then `aria-valuenow` MUST be omitted entirely, the accessibility-tree counterpart of a missing `value` attribute; `progressbar` is the only range role besides `spinbutton` for which `aria-valuenow` is not required. [apg, react-aria, base-ui, kobalte, bits, zag]
- [ ] `progress.state.6` Given an indeterminate progress bar, then `aria-valuemin` and `aria-valuemax` stay present at 0 and 100 while only the current value drops out. [react-aria, kobalte, bits]
- [ ] `progress.state.7` Given a visible value-label part while indeterminate, then it renders as an empty element rather than as `"NaN%"` or a stale value, and the indicator's inline width is left empty so CSS owns the animation. [base-ui, kobalte]
- [ ] `progress.state.8` Given a value below the minimum, then it clamps to the minimum for `aria-valuenow`, `aria-valuetext` and the indicator width; given a value above the maximum, it clamps to the maximum the same way. [react-aria, base-ui, kobalte]
- [ ] `progress.state.9` Given `value={0}` with `minValue={-5}` and `maxValue={5}`, then `aria-valuenow` is `"0"` while `aria-valuetext` is `"50%"`, so the percentage is computed across the min-to-max range rather than from zero. [react-aria, base-ui, kobalte]
- [ ] `progress.state.10` Given a zero-width range, `min === max` at 0 or at a non-zero bound, then `aria-valuetext` is the 0% format and the indicator width is `"0%"`, never `"NaN%"` or a division artifact. [react-aria, base-ui]
- [ ] `progress.state.11` Given a value that reaches or exceeds the maximum, then the progressbar reports complete, and the complete-versus-in-progress distinction is a value-derived status rather than a separate prop. [base-ui, kobalte]
- [ ] `progress.state.12` Given a status data attribute, then it is written on the root and on every composed part (label, value, track, indicator) in the same commit, so a part can be styled without reading up the tree. [base-ui, kobalte]
- [ ] `progress.state.13` Given `value={30}` of 100, then the root carries `data-progress="loading"`, and at `value={100}` it carries `data-progress="complete"`; `data-indeterminate` is present on all five parts only when the `indeterminate` prop is set and absent otherwise. [kobalte] (candidate)
- [ ] `progress.state.14` Given a value cycling `null` → 50 → 100 → `null`, then every composed part carries exactly one of `data-indeterminate`, `data-progressing`, `data-complete` at each step, the indicator's inline width is `""`, `"50%"`, `"100%"`, `""`, and the value text follows. [base-ui] (candidate)
- [ ] `progress.state.15` Given `data-state="loading"` on the root, then the indicator part also carries `data-state` and `data-value`, so the indicator is styleable from its own attributes. [radix] (candidate)
- [ ] `progress.state.16` Given `value` set to `NaN`, `Infinity` or `-Infinity`, then the progressbar is treated as indeterminate: no `aria-valuenow`, an empty value part, and an empty indicator width. [base-ui] (candidate)
- [ ] `progress.state.17` Given a `getAriaValueText` callback, then it is called with the formatted string and the raw, unclamped value, `aria-valuetext` is its return value, and while indeterminate it is called with `('', null)`. [base-ui] (candidate)
- [ ] `progress.state.18` Given a custom `getValueLabel` formatter, then both `aria-valuetext` and the visible value-label text are that one string, so the spoken and visible values cannot drift. [kobalte, react-aria]
- [ ] `progress.state.19` Given an `Intl.NumberFormat` options object as `format`, then the value part's text and `aria-valuetext` are both formatted with it, and changing the options updates the rendered text in the same commit rather than lagging one render behind. [base-ui] (candidate)
- [ ] `progress.state.20` Given a value-part render function, then it receives the formatted string and the raw number, is called again when the value changes, and receives the literal string `'indeterminate'` as the formatted value when the value is `null` or `NaN`. [base-ui] (candidate)
- [ ] `progress.state.21` Given a bound value raised by a parent after render, then the root's `aria-valuenow` and any bound display text update to the new value. [reka, bits]
- [ ] `progress.state.22` Given a determinate indicator, then its inline width is the percentage of the range, `"33%"` at `value={33}` and `0px` at `value={0}`, with `insetInlineStart: 0px`. [base-ui] (candidate) (browser-only)
- [ ] `progress.state.23` Given a circular progress at 0, 25, 50, 75 and 100 percent, then the two fill submasks rotate to `(none, none)`, `(-90deg, -180deg)`, `(0deg, -180deg)`, `(0deg, -90deg)` and `(0deg, 0deg)`. [react-aria] (candidate)
- [ ] `progress.state.24` Given the circular variant, then `--radius` is computed from `--size` and `--thickness`, `--circumference` as `2 * pi * var(--radius)` and `--offset` as the remaining arc; `strokeDashoffset` is set from them and `strokeDasharray` is omitted while indeterminate. [zag] (candidate)
- [ ] `progress.state.25` Given a value change on a rendered bar and ring, then both move to the new value. [ariakit] (candidate) (chromium-only)
- [ ] `progress.state.26` Given a `view` part with a declared `data-state`, then it is `hidden` unless that state matches the machine's current state, giving per-state slots. [zag] (candidate)

### Forms

- [ ] `progress.forms.1` Given a label part whose `id` changes and which is then unmounted, then the progressbar's `aria-labelledby` follows the new id and is removed entirely once the label is gone. [base-ui] (candidate)

### RTL and i18n

- [ ] `progress.rtl.1` Given a `locale` of `de-DE` and a decimal format with two fraction digits, then the value part renders the German form, dot thousands separator and comma decimal separator. [base-ui] (candidate)

### SSR and hydration

- [ ] `progress.ssr.1` Given a linear or circular progress with an `aria-label`, when server-rendered and hydrated, then no errors or hydration mismatches occur. [react-aria] (candidate)

### Accessibility tooling

- [ ] `progress.a11y.1` Given the rendered progress example, when axe runs, then there are no violations. [reka, ark]
- [ ] `progress.a11y.2` Given `aria-valuenow` on a progressbar set to a non-numeric string, then `aria-valid-attr-value` fails at critical impact. [axe]
- [ ] `progress.a11y.3` Given a progress with no visible label and no `aria-label` or `aria-labelledby`, then a development-mode console warning names the missing attribute. [react-aria] (candidate)
- [ ] `progress.a11y.4` Given any component in this suite, then the shared axe ARIA rules apply and MUST pass: `aria-roles` (no invalid, abstract or unsupported role, critical), `aria-allowed-attr` (every ARIA attribute allowed for role and host element, no deprecated or unsupported attribute, critical), `aria-required-attr` (critical), `aria-valid-attr` and `aria-valid-attr-value` (critical, with unresolved id references reported as incomplete and empty values as ignored), `aria-prohibited-attr` (no `aria-label` or `aria-labelledby` on `none`/`presentation`, serious), `aria-deprecated-role` (minor), `tabindex` (never greater than 0, so roving tabindex uses only 0 and -1, serious), `duplicate-id-aria` (referenced ids unique, critical), `presentation-role-conflict` (minor), `aria-hidden-focus` (no focusable content inside `aria-hidden="true"`, serious, outermost element only), `aria-braille-equivalent` (serious), and `target-size` (24 by 24 CSS pixels, WCAG 2.2 AA, serious, shipped disabled so it must be enabled explicitly). [axe]

### Notes and edge cases

- [ ] `progress.notes.1` Given this APG commit, then there is no progressbar pattern page, example or test file; the normative material comes from the range-related-properties practice, the axe role table and the HTML `progress` element. [apg]
- [ ] `progress.notes.2` Given unconsumed props (`ref`, `data-*`, `className`, inline `style`, `onClick`) on the root or the indicator, then they land on the rendered element, the ref resolves to it, and clicking fires `onClick`. [radix, react-aria]
- [ ] `progress.notes.3` Given `asChild` or `render` onto another tag, for example an `<article>`, then that tag is rendered and still carries `role="progressbar"`, `aria-valuenow` and the status data attributes. [radix, base-ui, react-aria]
- [ ] `progress.notes.4` Given a progress part rendered with no progress root ancestor, then it throws a named context error rather than rendering a broken tree. [base-ui] (candidate)
- [ ] `progress.notes.5` Given the root, value, indicator, label and track parts, then each has a declared ref element type: div for root, indicator and track, span for value and label. [base-ui] (candidate)
- [ ] `progress.notes.6` Given a `slot` name and a matching context provider, then the element carries both the `slot` attribute and the slot-provided props such as `aria-label`. [react-aria] (candidate)
- [ ] `progress.notes.7` Given a consumer-supplied indicator transform such as `translateX(-${100 - value}%)`, then the primitive does not position the indicator itself, so a spec test on indicator geometry only applies to libraries that set the width. [reka] (candidate)
- [ ] `progress.notes.8` Given a bits-style data-attribute convention, then the root carries `data-progress-root` for styling hooks independent of the ARIA attributes. [bits] (candidate)

## meter

### Roles and attributes

- [ ] `meter.roles.1` Given the element serving as a meter, then it MUST have `role="meter"`. [apg, kobalte, base-ui, bits]
- [ ] `meter.roles.2` Given a meter, then `aria-valuenow` MUST be set to a decimal value between `aria-valuemin` and `aria-valuemax`; unlike `progressbar`, `aria-valuenow` is REQUIRED for `meter` and omitting it fails axe at critical impact. [apg, axe]
- [ ] `meter.roles.3` Given a meter, then `aria-valuemin` MUST be a decimal value less than `aria-valuemax`, and `aria-valuemax` MUST be a decimal greater than `aria-valuemin`. [apg]
- [ ] `meter.roles.4` Given a meter whose range is 0 to 100, then `aria-valuemin` and `aria-valuemax` MAY be omitted because those are the role defaults; outside that range, for example an alkaline pH gauge from 7 to 14, both MUST be set explicitly. [apg]
- [ ] `meter.roles.5` Given a meter where a bare percentage would not be user friendly, then `aria-valuetext` MUST be set to a readable string such as `"50% (6 hours) remaining"`, because assistive technology otherwise presents `aria-valuenow` as a percentage. [apg]
- [ ] `meter.roles.6` Given a meter with a visible label, then that label MUST be referenced by `aria-labelledby`, otherwise `aria-label` MUST supply the name; axe tags the missing name WCAG 1.1.1 A at serious impact. [apg, axe, react-aria, base-ui, kobalte, bits]
- [ ] `meter.roles.7` Given `role="meter"`, then all of its descendants are forced presentational, so it MUST NOT contain a focusable widget-role descendant, at serious impact. [apg, axe]
- [ ] `meter.roles.8` Given `role="meter"` in the axe role table, then it is a structure-type role whose superclass is `range`, with `aria-valuenow` required and role-specific allowed attributes exactly `aria-valuemax`, `aria-valuemin` and `aria-valuetext`; `aria-expanded` is NOT allowed on `meter`, unlike on `progressbar`. [axe]
- [ ] `meter.roles.9` Given a meter root rendered with no value props, then `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="0"` and `aria-valuetext="0%"` are written explicitly and the value-label part reads `"0%"`. [react-aria, kobalte, bits]
- [ ] `meter.roles.10` Given `value` of 30 with the default range, then `aria-valuenow` is `"30"` and `aria-valuetext` is the percent format of 0.3; changing `value` to 77 updates `aria-valuenow`, `aria-valuetext`, the value text and the indicator width together. [react-aria, base-ui, kobalte, bits]
- [ ] `meter.roles.11` Given explicit `min` and `max` props, then `aria-valuemin` and `aria-valuemax` reflect them verbatim, and changing all three of `min`, `max` and `value` keeps the attributes, the formatted text and the indicator width consistent on rerender. [base-ui, bits]
- [ ] `meter.roles.12` Given `aria-labelledby` and `aria-valuetext` passed in by the consumer, then both appear verbatim on the root. [bits] (candidate)
- [ ] `meter.roles.13` Given the APG meter example, then exactly one `role="meter"` element exists, it is a `div`, and its `aria-labelledby` resolves. [apg]
- [ ] `meter.roles.14` Divergence: the meter root renders `role="meter"` alone. [apg, base-ui, kobalte, bits] (decision needed)
- [ ] `meter.roles.15` Divergence: the meter root renders the literal `role="meter progressbar"`, so browsers without `meter` support fall back to `progressbar`. [react-aria] (decision needed)

### Keyboard

- [ ] `meter.keyboard.1` Given a meter, then the APG keyboard section reads "Not applicable" and the meter MUST NOT be focusable. [apg]
- [ ] `meter.keyboard.2` Given a meter given `tabindex="0"`, then axe's `focus-order-semantics` FAILS at minor impact, because `meter` is a structure-type role and is in neither the widget-role set nor the valid-scrollable-semantics map. [axe]
- [ ] `meter.keyboard.3` Divergence: axe classifies `progressbar` as a widget-type role, so a progressbar with `tabindex="0"` passes `focus-order-semantics`. [axe] (decision needed)
- [ ] `meter.keyboard.4` Divergence: axe classifies `meter` as a structure-type role, so a meter with `tabindex="0"` fails `focus-order-semantics`; the two range roles behave differently under the same rule and a shared implementation MUST pick one focusability policy per role. [axe] (decision needed)

### Pointer

- [ ] `meter.pointer.1` Given a meter, then there is no pointer interaction: a meter is a read-only display, not a control. [apg]

### State

- [ ] `meter.state.1` Given a meter, then `aria-valuemin` MUST parse as a number, `aria-valuemax` MUST parse as a number greater than or equal to `aria-valuemin`, and `aria-valuenow` MUST parse as a number lying between them inclusive. [apg]
- [ ] `meter.state.2` Given the native `meter` element, then the `value` attribute must be specified, `min` defaults to 0, and the gauge values MUST be resolved in this order, each depending on the previous: minimum from `min` or 0; maximum from `max` or 1.0, forced equal to the minimum if it would be lower; actual value from `value` or 0, clamped into the minimum-to-maximum range; low boundary from `low` or the minimum, clamped into that range; high boundary from `high` or the maximum, clamped into the low-boundary-to-maximum range; optimum point from `optimum` or the midpoint, clamped into the minimum-to-maximum range. [html]
- [ ] `meter.state.3` Given the optimum point at or between the low and high boundaries, then the region between those boundaries MUST be treated as optimum and the low and high parts as suboptimal; given an optimum below the low boundary, the minimum-to-low region MUST be optimum, low-to-high suboptimal and the remainder even less good; given an optimum above the high boundary, that classification MUST be reversed. [html]
- [ ] `meter.state.4` Given a headless meter, then it MUST reproduce that three-way bucketing itself to choose a good, suboptimal or bad visual state, because nothing in ARIA conveys low, high or optimum. [html]
- [ ] `meter.state.5` Divergence: the native `meter` element's maximum defaults to 1.0 when `max` is absent, so `value="0.5"` is half full. [html] (decision needed)
- [ ] `meter.state.6` Divergence: the ARIA `meter` role's `aria-valuemax` defaults to 100, and every library writes 100 explicitly, so the same `value` means a different fill depending on which default a headless meter adopts. [apg, react-aria, base-ui, kobalte, bits] (decision needed)
- [ ] `meter.state.7` Given a value below the minimum or above the maximum, then `aria-valuenow`, the formatted value text and the indicator width all clamp into range: `"0"` with the 0% format and `"0%"` width below min, `"100"` with the 100% format and `"100%"` width above max. [react-aria, base-ui, kobalte]
- [ ] `meter.state.8` Given `value={0}` with `minValue={-5}` and `maxValue={5}`, then `aria-valuenow` is `"0"` while `aria-valuetext` is `"50%"`; given `value={30}` with `min={20} max={40}`, both `aria-valuetext` and the value text are the 50% format. The percentage is always the position within the range, not the value over the maximum. [react-aria, base-ui, kobalte]
- [ ] `meter.state.9` Given `min === max`, then `aria-valuenow` is that value, `aria-valuetext` is the 0% format and the indicator width is a finite `"0%"` rather than `NaN%`. [react-aria, base-ui]
- [ ] `meter.state.10` Given `value` of `NaN`, then `aria-valuenow` is `"0"` and `aria-valuetext` is the 0% format; a meter has no indeterminate state to fall back to. [base-ui, bits]
- [ ] `meter.state.11` Given a meter whose value does not change, then the implementation MUST NOT rewrite `aria-valuemin`, `aria-valuemax` or `aria-valuenow`; the APG example dirty-checks against cached values. [apg]
- [ ] `meter.state.12` Given `value={33.333}`, then `aria-valuetext` is rounded the same way as the displayed value and the two strings are byte-identical. [base-ui] (candidate)
- [ ] `meter.state.13` Given a `getAriaValueText` callback, then it receives the formatted, clamped string and the raw value, `aria-valuetext` is its return string, and the visible value text stays the plain formatted value, so the callback affects only the spoken text. [base-ui] (candidate)
- [ ] `meter.state.14` Given a custom `getValueLabel` formatter with `value={3} maxValue={10}`, then both `aria-valuetext` and the visible value label read `"3 of 10 completed"`. [kobalte, react-aria]
- [ ] `meter.state.15` Given a currency `format`, then the value part's text and `aria-valuetext` are both the currency-formatted value, and when the value is out of range both show the clamped number. [base-ui] (candidate)
- [ ] `meter.state.16` Given a value-part render function, then it receives the formatted string and the raw number and is called again with fresh arguments when the value changes. [base-ui] (candidate)
- [ ] `meter.state.17` Given a bound value raised by a parent after render, then `aria-valuenow` and any bound display text update to the new value. [bits] (candidate)
- [ ] `meter.state.18` Given a meter with a visible fill, then the fill's rendered width MUST match `(valuenow - valuemin) / (valuemax - valuemin)` of the track width; the APG test allows a 10 px tolerance and subtracts 8 px for border and padding, and its own comment says this is better asserted as a unit test. [apg]
- [ ] `meter.state.19` Given a 100 px wide meter at `value={33}`, then the indicator's computed style is `left: 0px` with `width: 33px`, and at `value={0}` it is `insetInlineStart: 0px` with `width: 0px`. [base-ui] (candidate) (browser-only)

### Forms

- [ ] `meter.forms.1` Given a label part whose `id` changes and which is then unmounted, then the meter's `aria-labelledby` follows the new id and is removed entirely once the label is gone. [base-ui] (candidate)

### RTL and i18n

- [ ] `meter.rtl.1` Given a `locale` of `de-DE`, then `aria-valuetext` is the German percent format, which inserts a narrow no-break space before `%`, and it is byte-identical to the value part's text content. [base-ui] (candidate)
- [ ] `meter.rtl.2` Given a `locale` of `de-DE` with a two-fraction-digit decimal format, then the value part renders the German number form. [base-ui] (candidate)

### SSR and hydration

- [ ] `meter.ssr.1` Given a meter with a label, when server-rendered and hydrated, then no errors occur. [react-aria] (candidate)

### Accessibility tooling

- [ ] `meter.a11y.1` Given `aria-valuenow`, `aria-valuemin` or `aria-valuemax` on a meter set to a non-numeric string, then `aria-valid-attr-value` fails at critical impact. [axe]
- [ ] `meter.a11y.2` Given any component in this suite, then the shared axe ARIA rules listed in `progress.a11y.4` apply to the meter as well. [axe]

### Notes and edge cases

- [ ] `meter.notes.1` Given a value with no meaningful maximum, such as the world population, then `meter` MUST NOT be used. [apg]
- [ ] `meter.notes.2` Given progress such as loading or percent completion of a task, then `meter` MUST NOT be used; use `role="progressbar"`. [apg]
- [ ] `meter.notes.3` Given a meter, then it has no indeterminate mode: there is no `value: null` case and no `data-indeterminate` attribute, which is the one genuine semantic difference from progress. [kobalte, bits]
- [ ] `meter.notes.4` Given a meter part rendered with no meter root ancestor, then it throws a named context error. [base-ui] (candidate)
- [ ] `meter.notes.5` Given the root, value, indicator, label and track parts, then each has a declared ref element type: div for root, indicator and track, span for value and label. [base-ui] (candidate)
- [ ] `meter.notes.6` Given a `slot` name and a matching context provider, then the element carries both the `slot` attribute and the slot-provided `aria-label`. [react-aria] (candidate)
- [ ] `meter.notes.7` Given arbitrary DOM props and a custom render function, then the props pass through to the rendered element. [react-aria] (candidate)
- [ ] `meter.notes.8` Given a bits-style data-attribute convention, then the root carries `data-meter-root`. [bits] (candidate)

## Sources

- `docs/research/apg-and-axe.md`, sections `progress` and `meter` (APG range-related-properties practice, meter pattern and test, axe role table and rules, WHATWG HTML §4.10.13 and §4.10.14).
- `docs/research/ariakit-and-headlessui.md`, section `progress` (`@ariakit/ui` progress bar and ring sandbox tests; headlessui has no progress component).
- `docs/research/kobalte-and-corvu.md`, sections `progress` and `meter` (corvu has neither).
- `docs/research/radix-and-base-ui.md`, sections `progress` and `meter` (radix has progress only; base-ui has both).
- `docs/research/react-aria-a.md`, sections `progress` and `meter` (`useProgressBar`, Spectrum v3 ProgressBar, ProgressCircle and Meter, react-aria-components ProgressBar and Meter).
- `docs/research/reka-melt-bits.md`, sections `progress` and `meter` (melt has neither).
- `docs/research/zag-and-ark.md`, section `progress` (zag machine connect and anatomy, ark React, Solid and Vue tests; neither has a meter).

## Deferred

- Circular and ring variants. Three libraries ship one (react-aria's ProgressCircle, zag's circle parts, ariakit's ring) and each computes geometry differently: submask rotations, stroke-dash custom properties, or a plain SVG arc. Nothing here is agreed enough to test across adapters, so `progress.state.23`, `progress.state.24` and `progress.state.25` stay candidates and no shared circular contract is specified yet.
- Reduced motion and forced-colors behavior for indeterminate animation. Only ariakit tests it, and only as visual snapshots, which the conformance harness cannot assert.
- The `low`, `high` and `optimum` gauge buckets from HTML §4.10.14. No library implements them, so `meter.state.2` through `meter.state.4` describe a contract we may or may not adopt; if we do, the three-way classification needs its own subsection.
- `data-*` naming. Four libraries use four conventions (`data-state`, `data-progress`, three boolean status attributes, `data-indeterminate` alone). The suite tests behavior through ARIA attributes until we pick one naming scheme for `@kit/*`.
- Indeterminate `aria-valuetext`. base-ui sets the literal string `"indeterminate progress"` while apg, react-aria and kobalte omit the attribute; this is close to a divergence pair but base-ui's string is a default that a consumer replaces, so it is filed here rather than flagged.
