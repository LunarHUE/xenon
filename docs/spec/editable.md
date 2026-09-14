# Editable and search field

Two `##` sections. `editable` is the click-to-edit inline text control; the
`search-field` section is a text input with a clear button, Escape-to-clear and
Enter-to-submit. They share only the "commit or abandon a text edit" shape, so
they stay separate here.

Bullets tagged `[apg]`, `[html]` or `[axe]` come from a standard or a linter
rather than a library, so they are normative and never carry `(candidate)`.
Neither component has an APG pattern page, so every bullet below is drawn from
libraries.

## editable

### Roles and attributes

- [ ] `editable.roles.1` Given an editable, then the anatomy parts are root, area, label, preview, input, editTrigger, submitTrigger, cancelTrigger and control. [zag] (candidate)
- [ ] `editable.roles.2` Given the preview part, then it carries `data-placeholder-shown`, `aria-readonly`, `data-readonly`, `data-disabled`, `aria-disabled`, `aria-invalid`, `data-invalid`, `data-autoresize`, a translated `aria-label`, and `tabindex="0"` while interactive. [zag] (candidate)
- [ ] `editable.roles.3` Given the input part, then it carries a translated `aria-label`, the edit placeholder, `aria-invalid`, `data-invalid`, `data-disabled`, `data-readonly` and `data-autoresize`. [zag] (candidate)
- [ ] `editable.roles.4` Given not-editing state, then the input carries the `hidden` attribute, and given editing state the preview carries it; `hidden` is how the mode is expressed in the DOM rather than unmounting the part. [zag, ark]
- [ ] `editable.roles.5` Given the area part, then it carries `data-focus` while editing, `data-disabled` when disabled, and `data-placeholder-shown` when empty; the label part carries `data-focus`, `data-invalid` and `data-required`. [zag] (candidate)
- [ ] `editable.roles.6` Given the edit trigger, then it is `type="button"` and hidden while editing; given the submit and cancel triggers, they are `type="button"`, hidden while not editing, and each carries a translated `aria-label`. [zag] (candidate)

### Keyboard

- [ ] `editable.keyboard.1` Given edit mode with new text typed, when Enter is pressed, then the value is committed, the preview shows the new text, the input is no longer visible, and the submit callback receives the new value. [reka, zag, ark]
- [ ] `editable.keyboard.2` Given edit mode with new text typed, when Escape is pressed, then the value reverts to the value held before the edit and the input hides. [zag] (candidate)
- [ ] `editable.keyboard.3` Given edit mode entered from the preview with nothing typed, when Escape is pressed, then the current value is retained rather than cleared. [zag] (candidate)
- [ ] `editable.keyboard.4` Given `submitMode: 'both'`, when Enter is pressed, then the value commits exactly as it does under `submitMode: 'enter'`, so Enter is live in both modes. [reka] (candidate)
- [ ] `editable.keyboard.5` Given a multiline input, then Enter MUST NOT commit, because the commit key is reserved for inserting a newline; the commit path fires with an `src` of `keydown.enter` only for single-line inputs. [zag] (candidate)

### Pointer

- [ ] `editable.pointer.1` Given a preview in the default activation mode, when it is clicked, then edit mode is entered: the input becomes visible and the edit trigger appears. [reka, zag]
- [ ] `editable.pointer.2` Given the edit trigger, when it is clicked, then the input becomes visible and takes focus. [reka, zag]
- [ ] `editable.pointer.3` Given `activationMode: 'dblclick'`, when the preview is double-clicked, then the input becomes visible; typing a value and pressing Enter commits it, including when the preview was showing only a placeholder. [reka, zag, ark]
- [ ] `editable.pointer.4` Given edit mode with new text typed, when the submit trigger is clicked, then the value commits and the preview shows the new text. [zag, ark]
- [ ] `editable.pointer.5` Given edit mode, when the cancel trigger is clicked, then the edit is abandoned and the input regains the `hidden` attribute. [zag, ark]
- [ ] `editable.pointer.6` Given `activationMode: 'dblclick'` and an existing value, when the preview is double-clicked, the text cleared, a new value typed and save clicked, then the new value is shown. [ark] (candidate)
- [ ] `editable.pointer.7` Given `activationMode: 'dblclick'`, when the preview is double-clicked and Escape pressed, then the value is retained. [zag] (candidate)
- [ ] `editable.pointer.8` Divergence: given edit mode with new text typed, when a click lands outside the editable, then the value is committed rather than discarded, with no submit mode needed. [zag] (decision needed)
- [ ] `editable.pointer.9` Divergence: given edit mode with new text typed, when focus leaves, then the value commits only under `submitMode: 'blur'` or `submitMode: 'both'`; the default mode discards nothing and commits nothing on blur. [reka] (decision needed)

### Focus management

- [ ] `editable.focus.1` Given the preview is focused, then the input becomes visible and receives focus, so focus alone activates edit mode in the default activation mode; a placeholder preview focused programmatically behaves the same, and typing plus Enter commits. [zag, ark]
- [ ] `editable.focus.2` Given `selectOnFocus: true` and a default value, when edit mode is entered, then the input has focus and both `selectionStart` and `selectionEnd` equal the value length, so the whole value is selected. [reka] (candidate)
- [ ] `editable.focus.3` Divergence: focusing the preview enters edit mode, so the preview is a tab stop that cannot be tabbed through without editing. [zag, ark] (decision needed)
- [ ] `editable.focus.4` Divergence: entering edit mode requires a click, double-click or the edit trigger, so focus alone leaves the preview in read mode. [reka] (decision needed)

### State

- [ ] `editable.state.1` Given a `defaultValue` or a controlled value, when rendered, then the preview shows that text; given a `placeholder` and no value, the preview shows the placeholder. [reka, zag]
- [ ] `editable.state.2` Given `startWithEditMode: true`, when rendered, then the input is already visible. [reka] (candidate)
- [ ] `editable.state.3` Given `disabled: true`, when the preview is clicked, then edit mode is not entered and the edit trigger stays hidden. [reka, zag]
- [ ] `editable.state.4` Given `readonly: true` and a default value, when the edit trigger is clicked and text typed, then the input is visible but its value is unchanged. [reka, zag]
- [ ] `editable.state.5` Given a `maxLength`, when a longer string is typed, then the input value is truncated to that length, for example `maxLength: 10` truncating a 26-character string to `lorem ipsu`, and `maxLength: 4` stopping "Naruto" at "Naru"; Backspace followed by a new character still edits within the limit. [reka, zag]
- [ ] `editable.state.6` Given the value is fully deleted and cancel clicked, repeated three times, then the preview reverts to the stored value every time, so repeated full deletion never corrupts it. [zag] (candidate)
- [ ] `editable.state.7` Given the controlled example, then it renders without error; this is the only assertion the ark suites make about controlled mode. [ark] (candidate)

### Forms

- [ ] `editable.forms.1` Given an editable inside a field wrapper, then `required`, `disabled` and `readOnly` propagate to the hidden textbox, helper text renders, and error text appears only when the field is invalid. [ark] (candidate)

### Animation and presence

- [ ] `editable.animation.1` Given `autoResize: true`, then both preview and input stay mounted and swap `visibility: hidden` instead of toggling `hidden`, so the box does not jump between read and edit mode. [reka, zag]

### Accessibility tooling

- [ ] `editable.a11y.1` Given the basic editable, when axe runs over the root, then there are no violations. [reka, zag, ark]

### Notes and edge cases

- [ ] `editable.notes.1` Given the preview entering edit mode, then click, focus and dblclick each carry a distinct event source so the machine can tell which gesture started the edit and apply the right activation mode. [zag] (candidate)
- [ ] `editable.notes.2` Given a conformance harness for editable, then it needs locators for preview, input, save, edit and cancel, a helper that focuses the preview and waits for `input:focus`, a key-at-a-time typing helper, and assertions for input visibility, input focus, input value and committed preview text; zag's Playwright model is exactly that list. [zag] (candidate)
- [ ] `editable.notes.3` Given a framework adapter, then the typing path differs: Solid types straight into the element found by label text, React needs an intermediate clear-and-wait, and Vue needs a 10 ms per-key delay for reactivity to flush. A shared suite MUST therefore drive typing through a harness hook rather than a fixed key delay. [ark] (candidate)

## search-field

### Roles and attributes

- [ ] `search-field.roles.1` Given a search field, then the input has `type="search"` and resolves to the `searchbox` role. [react-aria] (candidate)
- [ ] `search-field.roles.2` Given a search field composed of label, input, clear button and description plus error-message slots, then `aria-labelledby` points at the label, `aria-describedby` resolves to the description and error text in order, and the clear button gets `aria-label="Clear search"` automatically. [react-aria] (candidate)
- [ ] `search-field.roles.3` Given `isReadOnly`, then the input's wrapper carries `data-readonly` and no clear button renders. [react-aria] (candidate)
- [ ] `search-field.roles.4` Given `excludeFromTabOrder`, then the searchbox has `tabindex="-1"`. [react-aria] (candidate)
- [ ] `search-field.roles.5` Given a `form="test"` prop, then the input carries the `form` attribute. [react-aria] (candidate)
- [ ] `search-field.roles.6` Given a custom `icon` element, then it renders in place of the default search icon; given `icon=""`, no icon renders. [react-aria] (candidate)
- [ ] `search-field.roles.7` Given `data-*` attributes on the component, then exactly one element carries them and it is the outer wrapper, not the input. [react-aria] (candidate)

### Keyboard

- [ ] `search-field.keyboard.1` Given a non-empty value and an `onClear` prop, when Escape is pressed, then the value is set to the empty string and `onClear` fires once; pressing Escape again with an empty value fires neither. [react-aria] (candidate)
- [ ] `search-field.keyboard.2` Given an Escape keydown, then neither `preventDefault` nor `stopPropagation` is called, so an enclosing overlay can still close on the same Escape. [react-aria] (candidate)
- [ ] `search-field.keyboard.3` Given an `onSubmit` prop, when Enter is pressed, then `onSubmit` is called once with the current value and `preventDefault` is called; given no `onSubmit`, `preventDefault` is not called so a surrounding form submits normally. [react-aria] (candidate)
- [ ] `search-field.keyboard.4` Given a submitted field that is then cleared, when Enter is pressed again, then `onSubmit` fires a second time with the empty string. [react-aria] (candidate)
- [ ] `search-field.keyboard.5` Given a disabled search field with a value, when Enter or Escape is pressed, then `onSubmit`, `onChange` and `onClear` never fire and the value stays; while disabled no `onKeyDown` handler is returned at all, so the key handling is inert rather than guarded. [react-aria] (candidate)
- [ ] `search-field.keyboard.6` Given a user-supplied `onKeyDown` prop, when Enter is pressed, then the user handler is still called alongside the component's own handling. [react-aria] (candidate)
- [ ] `search-field.keyboard.7` Given an uncontrolled field with a default value, when Escape is pressed, then `onChange` fires once with the empty string, the input clears, `onClear` fires once, and focus stays where it was rather than moving to the input. [react-aria] (candidate)
- [ ] `search-field.keyboard.8` Given a controlled field, when Escape is pressed, then `onChange` fires with the empty string and `onClear` fires, but the displayed value stays unchanged because the parent owns it. [react-aria] (candidate)

### Pointer

- [ ] `search-field.pointer.1` Given an uncontrolled field with a value, when the clear button is clicked, then `onChange` fires once with the empty string, the input empties, `onClear` fires once with no arguments, and focus moves to the input. [react-aria] (candidate)
- [ ] `search-field.pointer.2` Given a controlled field, when the clear button is clicked, then `onChange` and `onClear` fire, the value stays, and focus still moves to the input. [react-aria] (candidate)
- [ ] `search-field.pointer.3` Given a disabled field, when the clear button is clicked, then neither `onChange` nor `onClear` fires and the value is unchanged. [react-aria] (candidate)

### Focus management

- [ ] `search-field.focus.1` Given the clear button, then it is excluded from the tab order, so Tab goes from the input past the button to the next control. [react-aria] (candidate)

### State

- [ ] `search-field.state.1` Given a field with text, then the clear button renders; when the value is emptied the button is removed, and it reappears once there is text again. [react-aria] (candidate)
- [ ] `search-field.state.2` Given a controlled `value`, when the component calls its own setter, then the rendered value stays at the prop value and `onChange` fires once with the new value. [react-aria] (candidate)
- [ ] `search-field.state.3` Given `defaultValue` only, when the setter runs, then the state value updates and `onChange` fires once; given neither `value` nor `defaultValue`, the value starts as the empty string. [react-aria] (candidate)
- [ ] `search-field.state.4` Given a non-string `defaultValue` or `value`, for example the number 13 or the array `['hi','this','is','me']`, then it is coerced to a string with `String()` semantics in both controlled and uncontrolled mode. [react-aria] (candidate)
- [ ] `search-field.state.5` Given a `defaultValue` prop, then the input does not receive a `defaultValue` attribute; the state owns the value so the input stays controlled. [react-aria] (candidate)

### Forms

- [ ] `search-field.forms.1` Given a `description` prop, then the help text has an id and `aria-describedby` points at it; given `errorMessage` with an invalid validation state, the error text has an id and `aria-describedby` points at that. [react-aria] (candidate)
- [ ] `search-field.forms.2` Given `isRequired` with a field-error slot inside a form, when the form's `checkValidity()` runs, then the input carried the native `required` attribute and no `aria-required`, becomes described by the browser's constraint message, receives focus, and its wrapper carries both `data-invalid` and `data-required`; typing makes validity true and blurring clears the description. [react-aria] (candidate) (browser-only)

### RTL and i18n

- [ ] `search-field.rtl.1` Given a `de-DE` locale provider, then the clear button's `aria-label` is the German translation of "Clear search" from the bundled messages, not the English string. [react-aria] (candidate)

### SSR and hydration

- [ ] `search-field.ssr.1` Given a search field with a label, when server-rendered and hydrated, then no errors occur. [react-aria] (candidate)

### Notes and edge cases

- [ ] `search-field.notes.1` Given a `slot` name and a matching context provider, then the wrapper carries the `slot` attribute and the searchbox gets the slot's `aria-label`. [react-aria] (candidate)
- [ ] `search-field.notes.2` Given children as a function of the field state, then the rendered output can read the current value, for example a description reading `You are looking for "test"`. [react-aria] (candidate)
- [ ] `search-field.notes.3` Given a `render` prop returning an element with extra props, then the wrapper is that custom element. [react-aria] (candidate)

## Sources

- `docs/research/reka-melt-bits.md`, section `editable` (reka `Editable.test.ts`; melt and bits ship no editable).
- `docs/research/zag-and-ark.md`, sections `editable` and `e2e/models/editable.model.ts` (zag machine anatomy and connect, zag Playwright e2e, ark React, Solid and Vue tests).
- `docs/research/react-aria-b.md`, section `search-field` (`useSearchField`, `useSearchFieldState`, Spectrum v3 SearchField, react-aria-components SearchField).
- No APG pattern, axe rule or HTML element corresponds to either component, so nothing here is normative. The `searchbox` role material in `apg-and-axe.md` sits under `combobox` and belongs to that spec file.

## Deferred

- The `search-field` section is single-source. react-aria is the only library in the research with a dedicated search field; the others build one from a text input plus a button. Every bullet is a candidate until a second implementation exists, and the whole section is a reasonable candidate for folding into a future `text-field.md`.
- Editable's commit-on-blur default. `editable.pointer.8` and `editable.pointer.9` are the same gesture with opposite outcomes: zag commits on outside click unconditionally, reka commits only when `submitMode` says to. Picking one changes the default prop set, so it needs a decision before the suite can test blur at all.
- Preview focusability. `editable.focus.3` and `editable.focus.4` disagree on whether the preview is a tab stop that starts an edit. This interacts with the commit decision: if focus starts an edit, blur must do something sensible.
- Multiline editable. Only zag mentions it, and only to say Enter behaves differently. No library in the research tests a multiline commit gesture, so `editable.keyboard.5` has no cross-library counterpart.
- `autoResize` geometry. Both reka and zag keep the preview and input mounted, but neither asserts the resulting width, so the spec covers the visibility swap and not the sizing.
