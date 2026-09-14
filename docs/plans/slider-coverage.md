# Slider coverage and decisions

`@tenon/core/slider` exports `slider`, `SliderOptions`, `SliderState`, and
`SliderResult`. The Solid entry point is `@tenon/solid/slider`. It exports
`Slider` with `Control`, `Track`, `Range`, `Thumb`, `Label`, and `ValueText`, plus
`SliderProps`, `SliderPartProps`, `SliderThumbProps`, `SliderLabelProps`, and
`SliderValueTextProps`.

Values always use arrays. A single thumb uses `[20]`; a range uses `[20, 60]`.
Render one `Slider.Thumb index={i}` per value. Index identifies the thumb and
should stay fixed for that mounted part. There is no separate RangeSlider API.
The default is one thumb at `min`, which defaults to zero. Bounds default to
0 and 100, `step` to 1, and `largeStep` to ten steps.

## Shipped contract

- The root is a group. Thumb is the native `input[type=range]` itself. Authors
  style that input as their visible thumb. Control measures the rail rectangle;
  Track and Range are decorative. There is no hidden input or second tab stop.
- Each Thumb accepts native input attributes, ref, and events. Root and other
  parts accept their native host attributes. The hosts are fixed, with no `as`,
  `asChild`, or render callback API. `Slider.Label` is a span associated with
  `aria-labelledby`, avoiding a native range label association. Each range
  thumb should have its own `aria-label` or `aria-labelledby`; an explicit
  thumb aria-label takes precedence over the shared label.
- Thumb positions are exposed as `--slider-thumb-position`, a percentage.
  Range exposes `--slider-range-start` and `--slider-range-end`. They are present
  in server markup. Authors apply inline-axis positioning for horizontal rails
  and bottom positioning for vertical rails. Control supplies relative
  positioning and `touch-action: none`; user styles can override both.
- Pointer presses use the full Control rectangle, with no thumb-size inset.
  A track press selects and focuses the nearest thumb. Equal-distance ties
  prefer the earlier thumb, except coincident thumbs select the later thumb
  when pressing on or above their numeric value. Thumb presses preserve the
  current value until movement. Document pointer listeners track movement
  outside the rail and ignore other pointer IDs. Pointer cancel ends the gesture
  and commits its last requested value. Pointer listeners are removed on
  disposal, release, cancellation, or transition to disabled/readonly.
- Thumb order never changes. Neighbor bounds and `minStepsBetweenThumbs`
  clamp every request. Impossible configured gaps are reduced to fit the range.
  Nonfinite values fall back to the preceding allowed minimum. Initial and
  controlled values are clamped while preserving off-grid values; pointer and
  native input requests snap to the grid anchored at min. Bare arrows move to
  the next grid point in their direction. Page and Shift-arrow requests preserve
  an explicit off-grid large step. The resolved maximum is the last step boundary
  at or below max. Pathological arithmetic overflow collapses the range to min.
- Both arrow axes work. Horizontal arrows mirror only for horizontal RTL rails.
  Up, Down, Page, Home and End remain numeric. Handled keydown events prevent
  default and stop propagation. Author event handlers run first; preventing a
  cancelable event suppresses internal handling. Native noncancelable input
  events cannot be canceled with preventDefault.
- `onValueChange` receives a fresh array only for a request different from the
  current value. Controlled props are authoritative and rejected browser input
  mutations are repaired. `onValueCommit` receives the final requested array
  once on pointer release/cancel, handled key release, native change, or blur.
  Subsequent blur does not duplicate a commit. No-op gestures do not commit.
- `readonly` retains focus and form submission but blocks changes. `disabled`
  uses native input disabling, removes form entries and tab stops, and blurs a
  focused thumb. Field disabled, readonly, required and invalid flags are OR-ed with local
  flags. Field names, labels, descriptions and invalid errors are inherited.
  The first thumb registers as the Field control.
- Each thumb submits a raw value under the same `name`, producing repeated form
  entries. `form` supports an external form. Uncontrolled reset silently restores
  the current defaultValue. Controlled reset restores the controlled value.
  Reset restoration runs after the native default action, and respects reset
  cancellation even by a later listener. Range inputs have no empty state and
  no useful required constraint validation.
- Accessible value text is absent unless an author supplies `format(value,
  index)` or an explicit thumb aria-valuetext. The same format callback renders
  ValueText. The output uses `role=status`, `aria-live=off`, and joins values
  with a spaced en dash. Its `for` uses registered author thumb IDs when those
  thumbs render before the output. Explicit author `for` supports other orderings.

## Verification

Core tests cover decimal and tiny steps, off-grid stepping, large steps,
neighbor gaps, nonfinite input, overflow handling, readonly, absent thumbs,
vertical mapping and horizontal RTL mapping. Adapter tests cover stable native
nodes, range keyboard commits, controlled repair, readonly, native forms,
external forms, late canceled reset, Field inheritance, author event
cancellation, formatting and disabled semantics. Browser tests check focus removal when disabled. The SSR test verifies native
values, custom thumb IDs in output, and forward Field descriptions.

Browser tests run in Chromium and WebKit. They use real clicks against measured
rails, real dragging outside the control, native keyboard input and Tab, FormData,
and native reset buttons. A touch PointerEvent test uses actual rail geometry and
checks that a second pointer cannot move or end the active gesture. That test
asserts the Pointer Events contract; it is not a physical-device touch test.
The range fixture passes axe without disabling rules.

The tests deliberately use descriptive contract names rather than marking broad
research bullets as entirely covered. Spec checkboxes remain unchanged.

## Deferred and competing research APIs

The research document records incompatible library behavior. These portions are
not shipped or claimed as verified:

| Research sections | Disposition |
| --- | --- |
| roles.11, roles.20, roles.23–24 | Thumb itself is the native range input, with no wrapper or role-div host option. Native semantics supply the slider role. |
| roles.13–14, roles.17–19, animation.3 | No hidden-output toggle, marker/tick generation, tick labels, thumb labels, or dragging-indicator part. Consumers can render decorative content. |
| roles.22 | No development warning for reversed bounds. Bounds collapse deterministically. |
| keyboard.12, state.9–10 | The grid limits the maximum, but initial/controlled off-grid values are preserved rather than snapped or sorted. Thumbs retain their identities. |
| keyboard.20–21 | Ten steps is the default largeStep. The competing one-tenth-of-range rule is not used. |
| pointer.8, pointer.11–14, pointer.18–19 | No per-thumb disabling, touch movement threshold, duplicate-value callbacks, capture API, thumb-size inset, or special stacked-thumb direction switching. Document listeners implement outside movement. |
| pointer.20–21, notes.7 | Only clamping is supported. No pushing or swapping neighbors. |
| focus.5–7 | Shared Label focuses the first thumb. Per-thumb native labels remain author-owned. No library z-index or focus-visible state tracking. |
| state.13–16 | No rating-specific zero rule or focus-dependent formatter. Numbers remain native unless format is provided; no automatic positional value text. |
| forms.3, forms.5–7 | Controlled props remain authoritative on reset. No validation engine, dirty/touched tracking, or automatic clearing of server errors. Field flags and descriptions compose with the existing Field API. |
| forms.8–11 | Native platform rules are used for form ownership and disabling. The engine supplies its own default value and uses step=any on inputs so explicit large steps can remain off-grid. |
| positioning.1–5, animation.1–2 | Percentage custom properties are supplied, but consumer CSS positions parts. No offset origin, thumb measurement, automatic inset/transform, hidden-until-measured behavior, or ResizeObserver. |
| rtl.4–9 | No inversion or locale provider/Intl options. Authors can pass an Intl-backed format callback or replace output children. |
| ssr.1–3 | Native values and percentage properties render on the server. No measuring script. Forward shared Slider.Label references and output-before-thumb custom IDs require explicit author association props. Existing Field forward descriptions are supported. Hydration preservation is not separately asserted by this focused test suite. |
| a11y.2–6 | Axe is run on the range fixture; no tests of axe's own role database or automated claim about screen-reader announcements. |
| notes.4, notes.8–12 | No polymorphic host, exported browser geometry test helper, or global-event workaround API. Other libraries' skipped tests are research notes, not this component's guarantees. |

Circular angle sliders remain separate future work. The package does not export
an angle mode or angular pointer calculations.
