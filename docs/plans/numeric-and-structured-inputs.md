# Numeric and structured inputs

Build Slider with multiple thumbs, NumberField, PinInput, TagsInput, and Editable
as independent core/Solid subpaths. Keep reusable measured browser behavior in DOM.
Each component slice includes public TSDoc, focused tests, a coverage note, and a
commit before broad integration checks.

## Defaults

- Slider uses one array model for single and multiple thumbs. Thumb order remains
  fixed; movement clamps against neighboring thumbs. Large steps default to ten
  ordinary steps. Value text is opt-in.
- NumberField separates editable text from committed numeric state. Its public
  empty value is `null`, so `undefined` can continue to mean uncontrolled. This
  is a numeric-input convention, separate from empty single selection.
- PinInput uses one string for the code and indexed input slots. It submits one
  value, distributes paste/autofill, and defaults to six numeric characters.
- TagsInput uses string arrays, trims new entries, rejects duplicates by default,
  and selects the last tag on the first empty-input Backspace. A second removes
  it. Tags use ordinary named elements and remove buttons, without a listbox role.
- Editable activates on click or keyboard activation, with optional double-click.
  Focus alone does not start editing. Enter or leaving the widget commits by
  default; Escape or Cancel restores the pre-edit value. Multiline Enter inserts
  a newline. Explicit submit modes allow consumer control of blur behavior.

Field flags and associations, native form ownership/reset/validation, controlled
state, IME, author event cancellation, and browser focus belong in every relevant
slice. Optional source-library features are tracked explicitly in coverage notes;
source divergences are not all simultaneous requirements.

## Verification

Core and Solid tests cover state and composition. Chromium and WebKit tests cover
native editing, focus, forms, and slider geometry. Integration also checks public
subpath exports, typecheck, lint, formatting, and existing component regressions.

## Delivered API

Each component imports independently:

```tsx
import { Slider } from '@tenon/solid/slider'
import { NumberField } from '@tenon/solid/number-field'
import { PinInput } from '@tenon/solid/pin-input'
import { TagsInput } from '@tenon/solid/tags-input'
import { Editable } from '@tenon/solid/editable'
```

- Slider: Control, Track, Range, Thumb, Label, ValueText. A single slider uses
  `[value]`; a range uses `[minimum, maximum]` and two indexed thumbs. Thumbs are
  native range inputs, and their index is fixed at mount.
- NumberField: Input, Control, Label, ValueText, IncrementTrigger, DecrementTrigger.
  Locale-aware drafts commit on blur, Enter, or stepping. Form values remain
  canonical numbers. Compact/scientific/engineering display notation is rejected
  explicitly because it is not an editable numeric format supported by the parser.
- PinInput: indexed Input slots, one scalar code, full-code validation and one
  submitted value. Slots accept native paste/autofill without numeric conversion,
  preserving leading zeroes.
- TagsInput: Control, Input, Item, ItemText, ItemInput, ItemDeleteTrigger,
  ClearTrigger, Label, Description, Error. The root child callback's reactive
  `value` renders tags explicitly. Forms receive repeated entries under one name.
- Editable: Preview, Input, EditTrigger, SubmitTrigger, CancelTrigger, Label,
  Description, Error. Input accepts `as="textarea"` for multiline editing.

The example app has all five demos, including both slider forms, OTP completion,
localized numeric stepping, tag replacement, and editable cancellation.

## Review fixes

Native reset-button clicks run the browser's default action after synchronous
handlers and may run it after queued microtasks. Slider, NumberField, PinInput,
and Editable restore state and DOM values after that action, including controlled
or unchanged values. Pending reconciliation is canceled on disposal. Form owner
checks follow current native ownership rather than a stale initial form.

TagsInput editors inherit readonly and per-item disabled changes during editing.
Editable ignores blur caused by hiding its activation preview. Slider label
registration uses a plain server registry while retaining matching client signal
allocation for hydration. NumberField handles singular/plural localized units,
including unit-only Arabic forms, without silently parsing unsupported notation.

Focused behavior and deliberate source-library exclusions are recorded in
[Slider](slider-coverage.md), [NumberField](number-field-coverage.md),
[PinInput](pin-input-coverage.md), [TagsInput](tags-input-coverage.md), and
[Editable](editable-coverage.md). These notes do not claim every candidate in the
research specs has shipped.


## Final checks

- Core: 238 tests. DOM: 152. Solid: 290. Shared jsdom suite: 640.
- Chromium and WebKit browser conformance: 1,854 tests across 208 files.
- Chromium and WebKit end-to-end: 84 tests, including all five families' SSR,
  hydration, native associations, and canonical form submission.
- Typecheck, lint, formatting, example build, and public subpath builds pass.
- Final public-member audit: core 777 and Solid 992, with no missing comments.
  All local TSDoc links resolve in core, DOM, and Solid.

The pre-existing Select-only SSR unit fixture still emits Solid's SERVER_WRITE
warning. It also appears in the saved pre-family regression log; the new numeric
SSR fixture and the full end-to-end run emit no such warning. Its test passes.
