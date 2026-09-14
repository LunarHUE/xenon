# TagsInput coverage

The public value is a string array. Root renders a callback with reactive `value`
for explicit Item mapping. Item indexes address occurrences, so duplicates can be
removed independently. Root/Control use ordinary elements; the main textbox has
its native role and tags have actual DOM focus. No listbox, option, or combobox
semantics are invented for editable/removable tokens.

Trim precedes validation and uniqueness. Duplicates are rejected by default;
`allowDuplicates`, `trim`, `max`, and `validate` customize acceptance. Literal
`delimiter` defaults to comma. Enter submits a draft; delimiter input or a split
paste batches accepted values and retains rejected text. `addOnPaste` defaults
true, while `addOnTab` and `addOnBlur` are opt-in. IME input is left intact until
composition ends. Author preventDefault cancels built-in event processing.

An empty-input Backspace first focuses the last tag. A second removes it. Arrows
walk tags without wrapping, respecting RTL. Home selects the first tag, End and
Escape return to the textbox. Backspace removal focuses the preceding tag;
Delete removal returns to the textbox. Enter or double-click opens optional
ItemInput; Enter commits a valid replacement, Escape/blur cancel. Empty replacement
removes the tag. Per-item disabled excludes editing and removal.

Named hidden inputs submit one entry per tag. The main textbox owns required
validation and visible focus, and an unsubmitted draft does not satisfy required.
Field labels/descriptions/errors and shared flags reach the textbox, including an
enclosing Field. Reset reads the live form owner and restores defaults silently.
Changes in controlled mode report proposed arrays while retaining author values.
A polite live region announces additions/removals.

Core tests cover atomic collection rules. Adapter tests cover insertion, rejected
changes, editing, controlled state, field inheritance, reset, paste/IME, and author
cancellation. Chromium and WebKit tests drive real keyboard focus, removal,
replacement and native form participation.

Deferred source-library candidates: object-value conversion, undo/redo history,
regex delimiters, and combined suggestion-combobox integration. The separate
TagGroup component in the same source spec is outside this family.
