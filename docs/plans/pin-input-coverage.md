# Pin input coverage

PinInput ships a scalar string root and indexed native Input parts. The default
length is six, and the default accepted characters are ASCII digits. Alphabetic
and alphanumeric modes and password masking are available. Render exactly one
Input per index. Field supplies the shared label, description, error state and
optional form name.

## Decisions

- Use one native input per slot with a roving tab stop at the insertion point.
  This adopts roles.20 and excludes the transparent single-input architecture in
  roles.21 and its selection, fake-caret and password-manager styling candidates.
- Values are contiguous strings. Delete and Backspace splice subsequent characters
  left, adopting keyboard.28 and excluding keyboard.29. End goes to the first
  empty slot, adopting keyboard.31 rather than keyboard.30.
- Paste and autofill distribute accepted characters from the focused slot,
  preserve preceding characters and discard overflow. Ordinary single-character
  input replaces the current character regardless of the native caret position.
- Only the first slot has one-time-code autocomplete. Other slots use off.
  SMS suggestions on physical devices remain unverified.
- Completion is a callback after an accepted edit changes the actual value to a
  complete code. Rejected controlled requests, initialization, reset and no-op
  replacement do not complete. The component never submits a form automatically.
- A clipped native text input submits one named scalar value and validates the
  full-length pattern, including optional nonempty incomplete codes. Required
  rejects empty codes. Invalid events focus the insertion slot. Slots have no name.
- Field.Label targets the first slot; the group references Field labels and
  descriptions. Every slot has a localized position name through getSlotLabel.

## Evidence

Core tests cover normalization, zero preservation, slot semantics, paste filtering
and truncation, readonly/no-op edits, deletion and bounded focus. Adapter tests
cover autofill, focus advance, scalar FormData, accepted-only completion,
controlled rejection, Field required inheritance, native reset, IME and canceled
paste. The Chromium browser test uses native typing and keyboard focus, a native
ClipboardEvent with DataTransfer, required reportValidity, scalar form submission,
splicing deletion and reset. Clipboard integration is synthetic; OS clipboard
permissions and mobile SMS delivery are not claimed.

## Exclusions and limits

There is no clear trigger, custom transform/pattern, auto-submit, blur-on-complete,
external selection/cells API, clipboard failure warning, or cross-slot cut/select
all model. Slot placeholder behavior follows native inputs. The optional focused
root marker and vertical-key propagation stopping are not implemented. Per-slot
host polymorphism is not offered; Input is a native input. Consumers should not
provide native per-slot names through untyped spreads. Dynamic form reassociation
after mount is not observed by the reset listener. The first slot uses the Field control ID during SSR; standalone position labels
are always present.
