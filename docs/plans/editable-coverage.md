# Editable coverage

Editable owns a committed value and a separate draft. Its native input and preview
remain mounted and switch with `hidden`. Preview focus alone never activates an
edit; click, optional double-click, Enter/Space, or EditTrigger does. Focus moves
to the input after it is visible and selects all text unless selectOnFocus is false.

The default submitMode is both: Enter in a single-line editor or focus leaving the
whole widget commits. Moving focus to Save/Cancel is internal and never commits
early. Multiline Enter inserts a newline. `enter`, `blur`, and `none` modes provide
explicit control. Escape/Cancel restores the pre-edit draft. Explicit completion
returns focus to the preview; outside blur preserves the newly focused target.
The focusout caused by hiding a focused preview is not an outside blur.

`onValueChange` reports changed committed text; `onValueCommit` reports each
successful commit. Controlled value/editing props remain authoritative, and
undefined releases their control. Mount and reset do not emit change callbacks.
Native name/form/required/maxlength and Field associations reach the editor.
Readonly blocks activation; disabled also removes preview tab reachability.
Invalid native submission reveals the editor so validation has a visible target.

Core tests cover session gates. Adapter tests cover drafts, repeated cancel,
controlled proposals, IME, native form/reset, Field inheritance, and cancellation.
Chromium and WebKit tests cover focus movement through real pointer events,
validation activation, canceled reset, and multiline editing. SSR/hydration shares
the numeric family fixture.

Deferred optional candidates: autoresizing layout, separate Area/Control wrappers,
and locale message bundles. Button labels and native attributes remain author
customizable. SearchField, the other component in the source spec, is out of scope.
