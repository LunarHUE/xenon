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
