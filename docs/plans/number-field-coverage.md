# Number field implementation coverage

The implementation uses a pure `numberField` snapshot engine, the public
`createNumberFieldFormat` locale codec, and the Solid `NumberField` family.
Parts are Input, Control, Label, ValueText, IncrementTrigger and DecrementTrigger.
No browser controller or dependency was needed.

## API decisions

`value` and `defaultValue` accept `number | null`. Null represents an empty
numeric field, including a controlled empty field. Undefined retains the
adapter-wide uncontrolled convention. This is an explicit exception to selection
components whose callback uses undefined for an empty selection.

The visible input is a text-host spinbutton. Root is a group. Unset bounds and
empty current values omit the corresponding ARIA attributes. Draft range and
parse errors expose invalid state and native custom validity. Field descriptions
and errors use the existing Field association path. Authors provide accessible
names and can provide aria-errormessage directly on Input.

Typing edits only the draft. Blur and Enter commit it; Enter retains native form
submission. A step commits its result. Numeric changes and commits fire once for
a changed numeric value; no-op changes are silent. Invalid text restores the
committed number, empty text commits null, and finite out-of-range text clamps.
The hidden form entry always contains the canonical committed number, independent
of locale. Native reset is silent, cancellation-aware, and retains controlled
values. Required validation belongs to the visible input. Field readonly,
disabled, required, invalid, name, and label/description associations are inherited.

ArrowUp and ArrowDown step on a grid anchored at min or zero. Decimal arithmetic
rounds to sixteen significant digits to remove common binary accumulation noise;
it is ordinary JavaScript Number precision, not arbitrary precision arithmetic.
PageUp/PageDown use largeStep, defaulting to ten steps. Home/End choose exact
bounds. Off-grid boundaries are reachable by clamping. Empty and invalid drafts
seed at zero clamped to the bounds in either direction. This chooses a predictable
seed over library-specific direction-dependent seed matrices. A no-edit blur
preserves full-precision numeric state; stepping chooses the documented grid.

Locale defaults to en-US for stable SSR. Parsing recognizes localized digits,
grouping, decimal marks, currency/unit/percent tokens, and accounting parentheses.
Percent display units convert back to numeric fractions. Parsing requires a
complete finite decimal after token removal; scientific notation is not accepted.
Grouping placement is permissive. Malformed drafts remain editable and invalid
until commit, rather than blocking printable keys and interfering with IME.

## Checks

Core tests cover locale roundtrips, invalid drafts, clamping, decimal steps,
empty semantics, author cancellation, composition keys, and untouched precision.
Adapter tests cover persistent draft text, canonical forms/reset, Field flags and
labels, controlled null, author event cancellation, live IDs and node stability.
The Chromium test exercises native required validation, locale input, Enter
commit, canonical FormData, clicking the stepper, and reset.

## Deferred behavior

Pointer hold/repeat, drag scrubbing, pointer lock, scrub cursors, wheel stepping,
modifier-based small steps, mobile-specific input modes, automatic stepper naming
from a visible label, and focus/touched/dirty metadata are not shipped. Steppers
use native button click activation, including assistive-technology activation.
They do not install gesture timers or global pointer listeners. Composition
keydown events and legacy keyCode 229 do not commit or step. No formatter cache or
custom parser callback is exposed yet. SSR associations finalize labels and stepper IDs after synchronous parts register.

## Follow-up verification

Native validity updates reactively as malformed or out-of-range drafts are
corrected. Nonfinite controlled values submit an empty string. Readonly and
author-canceled input events restore the browser value. Chromium and WebKit cover
native validity, forms and resets, plus no-JavaScript SSR custom associations and
node-preserving hydration with subsequent edits across all five new families.
