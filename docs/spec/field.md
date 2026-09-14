# field

The form-field layer: the field wrapper, its label, description and error parts,
the fieldset and form above it, the plain input and textarea below it, and the
controlled/uncontrolled parity rules every stateful component inherits.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## controlled-state

Every component with a value inherits this section. It is written once here and
referenced from the component specs rather than repeated per component.

### State

- [ ] `controlled-state.state.1` Given a component with a `value` prop supplied, then it is controlled: the rendered value is always the prop, and an interaction that would change it calls the change handler without moving the rendered value. [radix, base-ui, kobalte, corvu, react-aria, headlessui, reka]
- [ ] `controlled-state.state.2` Given a component with no `value` prop and a `defaultValue`, then it is uncontrolled: the value starts at the default, interaction writes the internal state, and the change handler fires with the new value. [radix, base-ui, kobalte, corvu, react-aria, headlessui, melt, bits]
- [ ] `controlled-state.state.3` Given a component mounting in either mode, then the change handler is never called on mount. [kobalte, corvu, base-ui, radix, react-aria]
- [ ] `controlled-state.state.4` Given a controlled component whose `value` prop is changed from outside, then the rendered value follows and the change handler does NOT fire: an external write never echoes back through the handler. [kobalte, corvu, radix, base-ui]
- [ ] `controlled-state.state.5` Given the setter is called with a value that is `Object.is`-equal to the current one, then neither the internal state is written nor the change handler fires: a no-op set is completely silent. This is the difference between one and two change events per interaction, so every "handler fired exactly once" assertion depends on it. [kobalte, corvu, ariakit]
- [ ] `controlled-state.state.6` Given `NaN` set twice in a row, then the change handler fires exactly once, because the equality gate uses `Object.is` and not `===`; `+0` and `-0` count as a change for the same reason. [kobalte, corvu, base-ui, ariakit]
- [ ] `controlled-state.state.7` Given the setter is called with an updater function, then the updater receives the currently resolved value (the controlled prop while controlled, the internal state otherwise) and its return value becomes the proposed next value, so the updater form works identically in both modes. [kobalte, corvu]
- [ ] `controlled-state.state.8` Given a controlled component, then the equality gate runs against the controlled value rather than an internal one, so setting the value the component already reports fires nothing. [kobalte, corvu]
- [ ] `controlled-state.state.9` Given `undefined` as the `value` prop, then the component is uncontrolled: `undefined` (not `null`, not absence of the prop) is the sentinel, so a controlled value may legitimately be `null` but never `undefined`. [corvu, kobalte, base-ui]
- [ ] `controlled-state.state.10` Given the setter runs, then its whole body executes untracked, so reading the current value to compute the next one creates no dependency on the calling reactive scope, and the setter returns the new value to match the host framework's setter contract. [corvu] (candidate)
- [ ] `controlled-state.state.11` Given a multi-value component, then a `type` of `single` or `multiple` is inferred from whether the initial value is an array, and an explicit `type` prop overrides the inference, coercing the value to a string or an array accordingly. [reka] (candidate)
- [ ] `controlled-state.state.12` Given a single-value component in toggle mode, when the currently selected value is selected again, then the value clears to `undefined`; given multiple mode, then selection toggles per item; given replace mode, then the value is always set to the selected item regardless. [reka] (candidate)
- [ ] `controlled-state.state.13` Given a component that stores an object value, then it stores a shallow copy rather than the caller's reference, so the stored value is deep-equal but not reference-equal to the input. [reka] (candidate)
- [ ] `controlled-state.state.14` Given a `defaultValue` that changes after the initial render while uncontrolled, then a development error is logged, exactly once for the first change and not again; a `defaultValue` change while controlled logs nothing, since the default is irrelevant then. [base-ui] (candidate)
- [ ] `controlled-state.state.15` Given a `defaultValue` that is `NaN`, a fresh array or object each render, or that holds framework elements, functions or a bigint, then the change detection neither throws nor logs: it must not deep-compare or JSON-serialize the default. [base-ui] (candidate)
- [ ] `controlled-state.state.16` Given a "previous value" helper, then it returns `null` on the first render, one render behind afterwards, and only updates on renders where the value actually changed (`Object.is` semantics, object identity for references). [base-ui] (candidate)
- [ ] `controlled-state.state.17` Given several value writes batched into one commit, then only the final value causes a render and the previous value is the one from before the batch, not an intermediate. [base-ui] (candidate)
- [ ] `controlled-state.state.18` Given a controlled component whose change is cancelled, then a later re-attempt proposes the same transition rather than advancing an internal cycle, so a cancelled `mixed` → `on` is retried rather than becoming `on` → `off`. [base-ui] (candidate)
- [ ] `controlled-state.state.19` Given a component under a store or signal layer, then selectors run only for their subscribed keys, a selector with an empty key set never re-runs, and a selector whose key set changes at runtime stops following the old key and starts following the new one. [ariakit] (candidate)
- [ ] `controlled-state.state.20` Given two connected stores where a parent clamps a child's value, when the child value is raised past the clamp, then every parent stays in sync with the clamped result rather than the requested one. [ariakit] (candidate)
- [ ] `controlled-state.state.21` Divergence: Given a component that switches from controlled to uncontrolled or back, then a development warning names the component and says to pick one mode for the component's lifetime; the component keeps behaving as the new mode reports. [radix] (decision needed)
- [ ] `controlled-state.state.22` Divergence: Given a component whose `value` prop becomes `undefined`, then a development error is logged, the value falls back to `defaultValue`, and the setter is refused: the component does not adopt internal state after the switch. [base-ui] (decision needed)
- [ ] `controlled-state.state.23` Divergence: Given a component whose `value` accessor starts returning `undefined`, then control silently returns to the internal state with whatever stale value it holds, with no warning at all. [kobalte, corvu] (decision needed)
- [ ] `controlled-state.state.24` Divergence: Given a change handler, then its return value decides the committed state: returning the proposed value commits it, returning something else commits that instead, and a handler receiving `{ curr, next }` can clamp. [melt] (decision needed)
- [ ] `controlled-state.state.25` Divergence: Given a change handler that receives event details, then calling `details.cancel()` vetoes the commit: the handler ran but the value, the hidden input and every field style hook stay as they were. [base-ui] (decision needed)

### Notes and edge cases

- [ ] `controlled-state.notes.1` Given a controlled/uncontrolled primitive, then it returns the host framework's ordinary getter/setter pair, so callers cannot tell which mode is active; that opacity is the point of the primitive. [corvu, kobalte]
- [ ] `controlled-state.notes.2` Given a component that switches modes at runtime, given both `value` and `defaultValue` supplied at once, or given a function stored as the value (ambiguous with an updater callback), then no library in the corpus tests any of it; these are the gaps a first implementation should decide deliberately. [kobalte, corvu]
- [ ] `controlled-state.notes.3` Given a render prop or slot exposing state, then it receives exactly the state object the component holds, and boolean entries additionally surface as presence-only data attributes on the rendered element (one attribute per true entry, plus a space-separated list of the true keys), with an author-supplied attribute of the same name winning over the generated one. [headlessui] (candidate)
- [ ] `controlled-state.notes.4` Given a test asserting a controlled component after an interaction, then one microtask flush is needed in a signal-based adapter before reading either the DOM or the change spy, because the setter calls the handler synchronously inside an untracked block while the value accessor is a memo. [kobalte] (candidate)

## field

### Roles and attributes

- [ ] `field.roles.1` Given a field root, then it exposes `role="group"` when it is not a native `fieldset`, and carries `data-disabled`, `data-invalid` and `data-readonly` only while those flags are true. [zag, ark, base-ui, headlessui]
- [ ] `field.roles.2` Given a field with a label, a description, an error and a control, then every state is mirrored as a data attribute on all of them at once: `data-disabled`, `data-invalid`, `data-valid`, `data-required`, `data-readonly`, `data-touched`, `data-dirty`, `data-filled` and `data-focused`. A plain field carries none of them. [base-ui, kobalte, zag, ark]
- [ ] `field.roles.3` Given a field with no `id`, then the parts derive ids from one generated base: `<base>-label`, `<base>-description`, `<base>-error-message`; given an `id`, then the base is that id; given explicit ids on individual parts, then each author id wins verbatim and no suffix is applied. [kobalte, zag, ark]
- [ ] `field.roles.4` Given a control part, then it receives the shared control props: the field's control `id`, `required`, `disabled`, `readOnly`, `aria-invalid` while invalid, `data-invalid`, `data-required`, `data-readonly`, and a description reference once a description element exists. [zag, ark, base-ui]
- [ ] `field.roles.5` Given a field whose control is replaced, whose control `id` changes, or whose `id` prop is removed, then the label's `for` follows the current control: a stale explicit id is dropped, a removed id falls back to a fresh generated one, and a control named only through `aria-labelledby` (such as a checkbox group) gains a `for` when it is replaced by a labelable control. [base-ui] (candidate)
- [ ] `field.roles.6` Given a field with two controls where one unmounts, then the label keeps the id of the surviving selected control, and falls over to the remaining control when the selected one is the one that unmounts. [base-ui] (candidate)
- [ ] `field.roles.7` Given a field whose subtree is hidden but kept in the DOM (its effects destroyed), then the control keeps its explicit `id`, the label keeps its `for`, and a group label stays suppressed; toggling hidden and back never leaves a dangling id and never logs an update loop. [base-ui] (candidate) (react19-only)
- [ ] `field.roles.8` Given a field item wrapper, then it namespaces its control id by its value (`<control id>::item::<value>`), re-derives the label and control props from that id, and inherits every other field value unchanged; a custom control that opts into the item's props joins the same scoping. [ark] (candidate)
- [ ] `field.roles.9` Given a field root with a `target` naming one item, then the label's `for` points at that item's control while a direct control under the root keeps the plain root control id, so `target` redirects only the label. [ark] (candidate)
- [ ] `field.roles.10` Given a required field, then a required indicator renders as an `aria-hidden` span whose default content is `*`, and when the field is not required the indicator renders its optional fallback instead. [ark] (candidate)
- [ ] `field.roles.11` Given a field error part, then it carries `aria-live="polite"` and renders nothing at all while the field is valid. [ark] (candidate)
- [ ] `field.roles.12` Given a field whose description or error element appears later, then the control's reference to it appears asynchronously, because presence is detected with an id lookup plus a mutation observer on the field's root node; a test must wait for the attribute. [ark] (candidate)
- [ ] `field.roles.13` Given a field inside a shadow root, then description and error presence resolve against the environment's root node rather than the global document. [ark] (candidate)
- [ ] `field.roles.14` Given a field root with a `dirty`, `touched` or `invalid` prop supplied, then that controlled flag wins over what the user does: user input does not set `data-dirty`, a blur does not set `data-touched`, and an explicitly invalid field stays invalid, including while disabled. [base-ui] (candidate)
- [ ] `field.roles.15` Given a disabled and invalid field, then every part carries `data-invalid` while the control has no `aria-invalid`, because a disabled control does not take part in native constraint validation. [base-ui] (candidate)
- [ ] `field.roles.16` Given a field item with `disabled`, then the item element, its label and its description all carry `data-disabled`, and a checkbox or radio wrapped by that item does not fire its change handler when clicked. [base-ui] (candidate)

### Keyboard

- [ ] `field.keyboard.1` Given a field with a validator inside a form, when Enter in the control implicitly submits, then the validator runs exactly once and the submit handler fires once. [base-ui] (candidate) (browser-only)
- [ ] `field.keyboard.2` Given Enter pressed in a control where implicit submission is blocked (a second input present, only a disabled submit button, or no form at all), then the validator still runs exactly once and nothing submits. [base-ui] (candidate) (browser-only)
- [ ] `field.keyboard.3` Given a keydown handler that changes the value before validation runs, then the validator is called once with the latest value rather than the pre-keydown one. [base-ui] (candidate)

### Pointer

- [ ] `field.pointer.1` Given a label next to a control inside a field, when the label is clicked, then focus moves to the control, so the label behaves like `for` even for a non-native control. [headlessui, base-ui, ark, zag, melt, bits]
- [ ] `field.pointer.2` Given a label with a `passive` prop, when it is clicked, then focus stays on the body. [headlessui] (candidate)
- [ ] `field.pointer.3` Given a disabled control, a disabled field or a disabled ancestor fieldset, when the label is clicked, then focus stays on the body. [headlessui] (candidate)

### Focus management

- [ ] `field.focus.1` Given a field part with a stable callback ref, when the parent re-renders for an unrelated reason, then the callback ref is not invoked again, so the parts do not detach and reattach refs. [ark, base-ui]
- [ ] `field.focus.2` Given a field root with `target` naming one item, when the label is clicked, then that item's control receives focus rather than the first item's; with no `target` in a mixed layout, focus lands on the direct control under the root. [ark] (candidate)
- [ ] `field.focus.3` Given a full component (not just a plain input) nested inside a field item, when the label is clicked, then that component's own control takes focus and its id carries the item scope. [ark] (candidate)
- [ ] `field.focus.4` Given a field with no visible label into which the user has typed, when it rerenders as invalid with an error message, then the error renders and the control keeps focus, because the control's DOM node is not recreated. [react-aria] (candidate)

### State

- [ ] `field.state.1` Given a control prefilled with a `defaultValue`, then the field already has `data-filled` on mount; given a controlled empty value, then it does not; given a controlled non-empty value on a non-input element, then `data-filled` is still derived from the value. [base-ui] (candidate)
- [ ] `field.state.2` Given a control whose value changes and then returns to its initial value, then `data-dirty` appears and is removed again, and the comparison survives a string/number mismatch, a null-valued control returning to empty and a control that unmounts and remounts. [base-ui] (candidate)
- [ ] `field.state.3` Given a control swapped for a different control with a different default, then the dirty baseline stays the field's original value, not the swapped-in control's default. [base-ui] (candidate)
- [ ] `field.state.4` Given a field rendered in a double-invoking development mode, then the dirty baseline is captured exactly once. [base-ui] (candidate)
- [ ] `field.state.5` Given a controlled control that remounts with an empty value, or an uncontrolled one that remounts with an empty default, then the field loses `data-filled`. [base-ui] (candidate)
- [ ] `field.state.6` Given a control whose value is set programmatically from outside, then the field syncs `data-filled` and `data-dirty` and the validator runs once with the new value. [base-ui] (candidate)
- [ ] `field.state.7` Given a control whose DOM value is written imperatively through a ref and the control is then focused, then the value is not restored to its `defaultValue`, whether the imperative value was empty or not. [base-ui] (candidate)
- [ ] `field.state.8` Given a field with an imperative actions handle, then calling its `validate()` validates the field against the current control value, works for a logical field with no mounted control at all, and works during mount before a fallback id has been assigned. [base-ui] (candidate)
- [ ] `field.state.9` Given a field whose `disabled` prop is absent and a disabled ancestor fieldset, then `disabled` resolves to the fieldset's value, and a reactive `invalid` flag propagates into field items as it changes. [ark] (candidate)

### Forms

- [ ] `field.forms.1` Given a field error slot with a `match`, then it renders only while that constraint-validation flag is set; a slot with `match={false}` or no `match` at all is the default slot and shows a form-level error; `match` literally `true` always renders. [base-ui, radix]
- [ ] `field.forms.2` Given an error supplied by the form layer for this field's name, then the control is `aria-invalid="true"` and the default error slot shows it; when the user changes the value, then the error is removed and the field's own validator runs for the first time on that change. [base-ui, radix, react-aria]
- [ ] `field.forms.3` Given a field with a required control and a form, then submitting while empty renders the error and blocks the submit; changing the value clears the error and a later submit proceeds. [base-ui, radix, react-aria, ark]
- [ ] `field.forms.4` Given `required`, `disabled` or `readOnly` on the field root, then the control carries the matching native attribute, the required indicator renders, and the root, label and helper text all carry the matching data attribute. [ark, kobalte, zag]
- [ ] `field.forms.5` Given a field with a helper text, then it renders regardless of validity; given an invalid field, then the error text renders and the control has an accessible error message equal to it; given a valid field, then the error text is absent from the DOM rather than hidden. [ark, base-ui]
- [ ] `field.forms.6` Given `validationMode="onChange"`, then the validator runs on each value write; `onBlur` defers to the blur; the default `onSubmit` defers to submit and then revalidates on change afterwards. [base-ui] (candidate)
- [ ] `field.forms.7` Given a validator, then it runs after native constraint validation, so a native `valueMissing` message wins until the constraint is satisfied and only then does the custom message appear. [base-ui] (candidate)
- [ ] `field.forms.8` Given a validator result of an empty array, `undefined`, an empty string or an array of empty strings, then the field is valid: no `aria-invalid`, no `data-invalid`, no error rendered, an empty `validationMessage`, and submission proceeds. [base-ui] (candidate)
- [ ] `field.forms.9` Given a validator returning a string, then the published error is that string and the error list is a single entry; given an array, then the published error is the first entry and the list holds all of them, rendered as a list element when there is more than one and as plain text when there is exactly one. [base-ui] (candidate)
- [ ] `field.forms.10` Given an async validator in flight, then the field publishes neutral validity: neither `data-valid` nor `data-invalid`, no `aria-invalid`, no error; a previously valid result retires to neutral while revalidating, while a previously resolved error stays published and keeps blocking submission until the new result lands. [base-ui] (candidate)
- [ ] `field.forms.11` Given a native constraint failure while an async validator is in flight, then the native failure stays published and blocks submission; under `onBlur` the native failure short-circuits the validator entirely so it is never called. [base-ui] (candidate)
- [ ] `field.forms.12` Given a stale async validation result that resolves after a newer one, then it is discarded: neither its message nor its `aria-invalid` appears. This holds across a debounce window and across a controlled value normalized on blur. [base-ui] (candidate)
- [ ] `field.forms.13` Given an async validator that rejects, then the previously published error text and `aria-invalid` are unchanged and submission stays blocked. [base-ui] (candidate)
- [ ] `field.forms.14` Given `validationDebounceTime`, then each change restarts the timer and the validator runs once the full interval has elapsed since the last change; a pending debounce is dropped when the control unmounts or when another field-aware control takes over the field, and a debounce armed before the first control registered still fires. [base-ui] (candidate)
- [ ] `field.forms.15` Given an in-flight async validation and a control that unmounts before it resolves, then no error renders. [base-ui] (candidate)
- [ ] `field.forms.16` Given a lone `valueMissing` on a field that is not yet dirty under `onBlur`, then it is suppressed: no `data-invalid`, no `aria-invalid`, and the published validity reports valid with an empty error list. Once the field is dirty the same blur marks it invalid; errors other than `valueMissing` (such as `typeMismatch`) do not require dirtiness. [base-ui] (candidate)
- [ ] `field.forms.17` Given both `required` and a type constraint active, then `valueMissing` clears on change while other native errors stay deferred to the next blur, and clearing a type mismatch so only `valueMissing` remains swaps the rendered message on change alone. [base-ui] (candidate)
- [ ] `field.forms.18` Given an external `setCustomValidity` call, then that message is owned by the caller: the field preserves it across change, blur, submit and revalidation, does not clobber it with its own or with a native message, defers other native errors while it stands, restores it after the field's own message displaces it, and does not restore it if it was withdrawn while displaced. The field clears only the message it set itself, normalizing CRLF to LF. [base-ui] (candidate)
- [ ] `field.forms.19` Given a control barred from constraint validation (`willValidate === false`, for example a read-only control), then a message set on it from outside is ignored and the field's own message is not written to it, yet the error still renders; once the control becomes editable the external message is visible on it again. [base-ui] (candidate) (browser-only)
- [ ] `field.forms.20` Given a form error map, then inherited `Object.prototype` keys are never treated as errors, an empty array for a field renders nothing, and a single-item array renders as text while a multi-item one renders as a list. [base-ui] (candidate)
- [ ] `field.forms.21` Given a field with no `name` whose control carries one, then the control's `name` acts as the field name for the submitted payload, for the validator's form-value map and for matching form errors; a `name` on the field root wins over it, and changing or clearing either name updates or removes the entry. [base-ui] (candidate)
- [ ] `field.forms.22` Given a validator, then its second argument is the whole form's value map keyed by field name, holding each control's typed value; unmounted fields are excluded from it, and swapping one field-aware control for another submits the replacement's value. [base-ui] (candidate)
- [ ] `field.forms.23` Given a field whose value change is cancelled through the change event details, or whose `input` event is prevented in the capture phase, then the validator is not called and existing errors are not cleared. [base-ui] (candidate)
- [ ] `field.forms.24` Given a control whose value is normalized on blur (trimmed, or reset to its initial value), then the validator's last call receives the normalized value, and a value normalized back to its initial value does not validate at all. [base-ui] (candidate)
- [ ] `field.forms.25` Given a field control with a `name` inside a form, then a native form control carrying that name exists, submitting includes its value, a disabled control contributes nothing, and resetting the form restores the initial payload. [headlessui] (candidate)
- [ ] `field.forms.26` Given a description or error part whose `id` is the empty string, then it is not registered and the control's `aria-describedby` is left as the author wrote it. [base-ui] (candidate)
- [ ] `field.forms.27` Divergence: Given an invalid field with an error element, then the control references the error through `aria-errormessage` and the description through `aria-describedby`. [ark, zag] (decision needed)
- [ ] `field.forms.28` Divergence: Given an invalid field with an error element, then the control references the error through `aria-describedby` together with the description, because VoiceOver and NVDA do not support `aria-errormessage`. [kobalte, base-ui, react-aria, radix] (decision needed)
- [ ] `field.forms.29` Divergence: Given a description part and an author `aria-describedby`, then the merged value is `"<library ids> <author value>"`, library ids first, in the fixed order description, error message, author value. [kobalte] (decision needed)
- [ ] `field.forms.30` Divergence: Given a description part and an author `aria-describedby`, then the merged value is `"<author value> <library ids>"`, consumer value first. [base-ui, radix] (decision needed)

### Animation and presence

- [ ] `field.animation.1` Given an error part with a CSS enter transition under `[data-starting-style]`, when it is matched, then it mounts and the transition runs to completion; given an exit animation under `[data-ending-style]`, when it stops matching, then it keeps `data-ending-style` until the animation finishes and only then leaves the DOM. [base-ui] (candidate) (browser-only)

### SSR and hydration

- [ ] `field.ssr.1` Given a field with no label, when server-rendered, then the control has no `aria-labelledby`; given a non-native label, then the label already has an `id` on the server, the control gains `aria-labelledby` at hydration, and it survives the control being swapped for a different control afterwards. [base-ui] (candidate) (browser-only)
- [ ] `field.ssr.2` Given a label that is unmounted after hydration, then the control's `aria-labelledby` is removed entirely rather than left pointing at a missing id. [base-ui] (candidate) (browser-only)
- [ ] `field.ssr.3` Given a control with `autoFocus` that a browser focuses before hydration, then after hydration the root, control and label all carry `data-focused`. [base-ui] (candidate) (browser-only)
- [ ] `field.ssr.4` Given a runtime with no `useId`, then the control receives a generated fallback id at hydration and the label's `for` follows it; an imperative `validate()` called during mount before that id exists still publishes its error. [base-ui] (candidate)

### Accessibility tooling

- [ ] `field.a11y.1` Given a full field composition (root, label with required indicator, control, helper text, error text), when audited with axe, then there are no violations. [ark, radix]

### Notes and edge cases

- [ ] `field.notes.1` Given a field item rendered outside a field root, then it throws a descriptive error naming the missing parent. [ark, base-ui]
- [ ] `field.notes.2` Given a control part rendered with no field root around it, then it still renders: the control parts tolerate a missing field context. [ark] (candidate)
- [ ] `field.notes.3` Given generated field ids, then their literal text differs per framework runtime, so a conformance suite must match ids by shape and by cross-reference rather than by literal value. [ark] (candidate)
- [ ] `field.notes.4` Given an uncontrolled control that the user types into, then the render count stops growing after the first keystroke and that first keystroke costs at most one extra render; a controlled control costs exactly one render per keystroke with no second render for the controlled echo. [base-ui] (candidate)
- [ ] `field.notes.5` Given a textarea with a `defaultValue` nested inside a fieldset whose context is consumed, then the render count stays bounded: this pins a controlled-value feedback loop between the fieldset context and a defaulted textarea. [ark] (candidate)
- [ ] `field.notes.6` Given a field's label and description merge rules and its state mirroring, then they are one shared form-control contract, so the suite should express them once as a reusable field battery and run it against every field component rather than rewriting them per component. [kobalte] (candidate)

## label

### Roles and attributes

- [ ] `label.roles.1` Given a label part inside a field, then the control's `aria-labelledby` contains the label's generated id, and with several label parts it lists every id in DOM order. [headlessui, kobalte, base-ui, react-aria, zag]
- [ ] `label.roles.2` Given a visible label, then the label gets an `id` and the control gets an `id`, they are distinct, the control's `aria-labelledby` is the label id, and the label's `for` is the control id. [react-aria, kobalte, base-ui]
- [ ] `label.roles.3` Given a visible label plus an author `aria-labelledby`, then the merged value is `"<labelId> <author value>"`; adding an `aria-label` makes it `"<controlId> <labelId> <author value>"` so the control's own `aria-label` joins the name computation, while the `aria-label` itself passes through unchanged. [react-aria, kobalte]
- [ ] `label.roles.4` Given a label rendered as something other than a `label` element, then no `for` attribute is emitted and only `aria-labelledby` links the two. [react-aria, kobalte, base-ui]
- [ ] `label.roles.5` Given a label part, then it carries a per-part data attribute and mirrors the field's `data-disabled`, `data-invalid`, `data-readonly` and `data-required`. [bits, kobalte, zag, base-ui]
- [ ] `label.roles.6` Given a label provider with no label rendered, then no `aria-labelledby` attribute appears at all rather than one pointing at a missing id. [headlessui] (candidate)
- [ ] `label.roles.7` Given only an `aria-label` and no visible label, then the label props carry no `id` and no `for`, the control still gets an `id`, and `aria-labelledby` is absent; adding an author `aria-labelledby` makes it `"<controlId> <author value>"`. [react-aria] (candidate)
- [ ] `label.roles.8` Given a bare label with no props, then the rendered markup is exactly an empty `label` element; with a slot it is the label wrapping that content; with a `for` it carries exactly that attribute. [reka] (candidate)
- [ ] `label.roles.9` Given a label whose target control is a group named through `aria-labelledby` rather than a labelable element, then the label's `for` is suppressed after hydration and the group gains `aria-labelledby` pointing at the label, so the label names the group rather than one control inside it. [base-ui] (candidate)

### Pointer

- [ ] `label.pointer.1` Given a label wired to a control, when the label is clicked, then the control receives focus. [melt, bits, ark, zag, headlessui, base-ui]
- [ ] `label.pointer.2` Given a label with no `for` and a sibling control, or a `for` that matches no element, when the label is clicked, then nothing is focused. [reka] (candidate)
- [ ] `label.pointer.3` Given a non-native label (no real `label` element, `aria-labelledby` only), when it is clicked, then the library moves focus to the associated control itself, since the browser will not. [base-ui] (candidate)

### Accessibility tooling

- [ ] `label.a11y.1` Given a label paired with a matching control, when audited with axe, then there are no violations. [reka] (candidate)
- [ ] `label.a11y.2` Given neither a visible label nor an `aria-label` nor an `aria-labelledby`, then a console warning says "If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility". [react-aria] (candidate)

### Notes and edge cases

- [ ] `label.notes.1` Given a `nativeLabel` flag that disagrees with the rendered element, then a development error names the mismatch and explains the consequence: `nativeLabel` true with a non-`label` element disables native association so `for` will not work, and `nativeLabel` false with a real `label` mixes native pointer behavior into a non-native path. A render function returning nothing warns about neither. [base-ui] (candidate)
- [ ] `label.notes.2` Given a label provider whose extra props come from a reactive source, then those props update on the rendered label while its generated `id` stays stable. [headlessui] (candidate)

## description

### Roles and attributes

- [ ] `description.roles.1` Given a description part inside a field, then the control's `aria-describedby` contains the description's generated id, and with several description parts it lists every id in DOM order. [headlessui, kobalte, base-ui, react-aria, zag]
- [ ] `description.roles.2` Given a field with both a description and an error message, then the control's `aria-describedby` lists both ids, so the error is announced in addition to the description rather than replacing it. [react-aria, ark, kobalte]
- [ ] `description.roles.3` Given a field with a description and an invalid state but no error message, then the description is still referenced; given an error message but a valid state, then the error is absent from the DOM and the control has no `aria-describedby`. [react-aria, kobalte]
- [ ] `description.roles.4` Given a field with neither a description nor an error, then the control has no `aria-describedby` at all. [react-aria, kobalte]
- [ ] `description.roles.5` Given a description provider with no description rendered, then no `aria-describedby` attribute appears at all. [headlessui] (candidate)
- [ ] `description.roles.6` Given a description added and then removed by rerender, then `aria-describedby` is added and then removed again. [react-aria] (candidate)
- [ ] `description.roles.7` Given a description or error slot that is passed as a prop but never rendered, then no id is assigned for it, because ids are minted only once the slot is actually in the DOM. [react-aria] (candidate)
- [ ] `description.roles.8` Given a group description plus a per-item description, then each item's control references its own description followed by the group's, and the group references its author value followed by the group description. [base-ui] (candidate)

## fieldset

### Roles and attributes

- [ ] `fieldset.roles.1` Given a fieldset rendered as a native `fieldset`, then no `role="group"` is added because the element already implies it; rendered as anything else, then `role="group"` is added. [headlessui, ark, base-ui]
- [ ] `fieldset.roles.2` Given a fieldset with a legend, then the group carries `aria-labelledby` pointing at the legend's generated id; given the legend an explicit `id`, then `aria-labelledby` is exactly that id. [base-ui, headlessui, ark]
- [ ] `fieldset.roles.3` Given a legend whose `id` changes and which is then unmounted, then `aria-labelledby` follows the new id and is removed entirely once the legend is gone. [base-ui] (candidate)
- [ ] `fieldset.roles.4` Given a fieldset with a helper text, then the group's `aria-describedby` contains the helper-text id; given an invalid fieldset, then it contains both the error-text and the helper-text ids. [ark] (candidate)
- [ ] `fieldset.roles.5` Given a fieldset with a legend around a field that has its own label, then the fieldset is labelled only by the legend, the control only by the field's label, and the field element itself by neither. [headlessui] (candidate)
- [ ] `fieldset.roles.6` Given a disabled fieldset rendered as a native `fieldset`, then it carries the native `disabled` attribute; rendered as another element, then it carries `aria-disabled="true"` instead. [headlessui] (candidate)

### Forms

- [ ] `fieldset.forms.1` Given a disabled fieldset, then every form control descendant is disabled except those inside its first `legend` child, transitively through nested fieldsets, and an ancestor fieldset's disabled state wins over a nested fieldset's enabled one. [html, base-ui, headlessui, ark]
- [ ] `fieldset.forms.2` Given a fieldset whose disabled state changes, then nested controls follow in both directions, and the field's `data-disabled` appears and disappears with them. [base-ui] (candidate)
- [ ] `fieldset.forms.3` Given a fieldset rendered as a component root (a radio group, a checkbox group, a slider), then its disabled state propagates into that component: the group gets `aria-disabled` and the items get `data-disabled`. [base-ui] (candidate)
- [ ] `fieldset.forms.4` Given a disabled fieldset, then the fields inside it are excluded from validation and from the submitted values, and their controls lose `aria-invalid` and their errors unmount; enabling the fieldset restores all of it. [base-ui] (candidate)
- [ ] `fieldset.forms.5` Given a fieldset, then its own helper text always renders and stays reachable alongside a nested field's helper text, and its error text renders only while it is invalid. [ark] (candidate)

### SSR and hydration

- [ ] `fieldset.ssr.1` Given a fieldset with no legend, when server-rendered, then it has no `aria-labelledby`; given one with a legend, then the legend already has an `id` on the server while the fieldset gains `aria-labelledby` only at hydration. [base-ui] (candidate) (browser-only)

### Notes and edge cases

- [ ] `fieldset.notes.1` Given a legend rendered outside a fieldset root, then it throws a descriptive error naming the missing context. [base-ui] (candidate)

## form

### Roles and attributes

- [ ] `form.roles.1` Given a form, then it renders a `form` element, accepts `action`, `method`, `target`, `encType` and `autoComplete`, and passes `aria-label`, `aria-labelledby`, `aria-describedby` and arbitrary data attributes through to it. [react-aria, radix, base-ui]
- [ ] `form.roles.2` Given a field that fails validation, then the control gets `aria-invalid="true"` and its error message becomes its accessible description; fixing the field flips `aria-invalid` back and drops the description. [ariakit, radix, base-ui]
- [ ] `form.roles.3` Given a form field with a label and a control, then the control is reachable by its label text, carries the field's `name`, and has a generated non-empty `id` that the label points at. [radix] (candidate)
- [ ] `form.roles.4` Given a label, control and message wired explicitly outside a field wrapper by `name` / `htmlFor` / `id`, then the same association holds. [radix] (candidate)
- [ ] `form.roles.5` Given a control with an author `aria-describedby` holding duplicate ids and stray whitespace, then the value normalizes to a deduplicated space-separated list, and a matching message id is appended to it rather than replacing it (radix-ui/primitives#2598). [radix] (candidate)
- [ ] `form.roles.6` Given a submit button on an invalid form, then it carries `aria-disabled="true"`, and loses the attribute once the form becomes valid. [ariakit] (candidate)
- [ ] `form.roles.7` Given an error element with no explicit element type, then it renders as a `span`, and an explicit element type is honoured; a render prop returning a different element than the declared type warns. [react-aria] (candidate)

### Focus management

- [ ] `form.focus.1` Given a failed submit with several invalid fields, when it runs, then focus lands on the first invalid field in document order, not in registration order, across both custom and native validation. [radix, base-ui, ariakit]
- [ ] `form.focus.2` Given server errors arriving after a submit, then focus lands on the first field with a server error, and the form can be resubmitted while those errors are displayed. [radix, base-ui, react-aria]
- [ ] `form.focus.3` Given the first invalid field is a text control, then its text is also selected once. [base-ui] (candidate)
- [ ] `form.focus.4` Given keyed fields that are reordered so registration order and document order diverge, then focus still lands on the first invalid field in document order. [base-ui] (candidate)
- [ ] `form.focus.5` Given invalid fields inside separate shadow roots that cannot be ordered by document position, then the registration-order fallback is stable across repeated submits, including after a control re-registers. [base-ui] (candidate)
- [ ] `form.focus.6` Given repeated submits, then focus moves only on submit: changing one field's value never makes a later invalid field steal focus. [base-ui] (candidate)
- [ ] `form.focus.7` Given a form that already submitted successfully and then mounts a new field, then focus stays where the user put it and is not stolen by a newly invalid field. [ariakit] (candidate)
- [ ] `form.focus.8` Given an array field helper that appends an item, then the newly created field takes focus; focus stays inside the targeted array and never leaks into a sibling array whose name is a prefix of it, and an array name containing regex metacharacters neither throws nor misdirects focus. [ariakit] (candidate)
- [ ] `form.focus.9` Given a form whose `onInvalid` calls `preventDefault()`, then focus is not moved to the invalid control. [react-aria] (candidate)
- [ ] `form.focus.10` Given a form whose `elements` collection contains an object with no `validity` property (a web component, say), then nothing throws and focus still moves to the first invalid control. [react-aria] (candidate)

### State

- [ ] `form.state.1` Given a form with an imperative actions handle, then calling `validate()` validates every field, and calling it with a field name validates only that field. [base-ui] (candidate)
- [ ] `form.state.2` Given a field that is renamed, unmounted or replaced, then the imperative handle targets only the current registration: the old validator is never called and the replacement's is called once. [base-ui] (candidate)
- [ ] `form.state.3` Given a form supplying context props and a child overriding one of them, then the child's prop wins. [react-aria] (candidate)

### Forms

- [ ] `form.forms.1` Given a form that is reset, then a `reset` event fires that bubbles and is cancelable, and only if it is not cancelled does each resettable element's reset algorithm run; those changes do not count as user changes and fire no `input` events. [html]
- [ ] `form.forms.2` Given each `ValidityState` flag in turn (`valueMissing`, `typeMismatch`, `patternMismatch`, `tooShort`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `customError`), then its message appears wired to the control by `aria-describedby` once the constraint fails and is removed once the value satisfies it. `tooLong` cannot be reproduced by typing because the browser enforces `maxlength`. [radix, html] (browser-only)
- [ ] `form.forms.3` Given a form with a validation error, then submission is prevented and the submit handler is never called. [radix, base-ui, react-aria, ariakit]
- [ ] `form.forms.4` Given a validity render prop for a field, then it receives the live validity object and re-renders when the control's validity changes. [radix, base-ui]
- [ ] `form.forms.5` Given a blur on a required field, then its error appears; typing into a field clears only that field's error while the others remain. [ariakit, radix, base-ui]
- [ ] `form.forms.6` Given a reset hook registered on a control, then its callback runs on reset, runs for every registered control, and still runs when a bubble-phase handler calls `stopPropagation()`; a `reset` cancelled in the capture phase suppresses every callback. [react-aria] (candidate)
- [ ] `form.forms.7` Given a pending async validator that has resolved no error, then submission proceeds; given one whose error has resolved, then submission is blocked and the error stays visible. [base-ui] (candidate)
- [ ] `form.forms.8` Given a stale async validation result from an earlier submit, then the next submit retires it rather than showing it against the new value. [base-ui] (candidate)
- [ ] `form.forms.9` Given a cross-field validator reading another field's value from the form value map under `onBlur`, then it re-runs on submit so a fix to the other field clears it. [base-ui] (candidate)
- [ ] `form.forms.10` Given a field with no `name` whose control is registered, then an invalid control still blocks submission, still gets `aria-invalid` and still renders its error, and changing it clears all three. [base-ui] (candidate)
- [ ] `form.forms.11` Given two fields sharing one `name`, then their validity stays scoped: one can be invalid while the other is valid. [base-ui] (candidate)
- [ ] `form.forms.12` Given one field whose later control takes over the registration, then the earlier registration is removed and only the current control's validity counts. [base-ui] (candidate)
- [ ] `form.forms.13` Given an invalid field that unmounts, then it stops blocking submission from that point on. [base-ui] (candidate)
- [ ] `form.forms.14` Given a control that becomes disabled, then it loses `aria-invalid`, its error unmounts and submission proceeds; re-enabling it blocks submission again and re-registers it. [base-ui] (candidate)
- [ ] `form.forms.15` Given a form errors map, then each named field's control is `aria-invalid` with the error rendered; changing a field removes only that field's error, including when several fields change in one commit, and a null-prototype errors object behaves the same. [base-ui] (candidate)
- [ ] `form.forms.16` Given an explicit `invalid` prop on a field, then it keeps blocking submission even when the validator returns no error. [base-ui] (candidate)
- [ ] `form.forms.17` Given a submit handler, then it receives the whole form's typed value map and the submit event with `defaultPrevented` already true; it is not called at all while the form is invalid. [base-ui] (candidate)
- [ ] `form.forms.18` Given a server error reusing a client matcher key, then the matching message slot renders the server text and is wired to the control the same way a client error is. [radix] (candidate)
- [ ] `form.forms.19` Given a form with server errors displayed, when the user fixes a control and blurs, then the error is removed and the control reports valid again; submitting twice without a fix does not clear the server error. [react-aria] (candidate)
- [ ] `form.forms.20` Given a form-value serializer, then a plain object becomes one entry per key, an array is keyed by stringified index, numbers and booleans stringify (`true` becomes `"1"`), and nested objects use bracket notation (`name[first]`, `name[nickname][preferred]`). [headlessui] (candidate)
- [ ] `form.forms.21` Given a form store with nested value paths, then array and object paths both resolve, numeric segments index arrays, non-array index segments use object paths and replace an existing array container, `Object.prototype` segments are ignored while surrounding values survive, and setter functions update nested values in place. [ariakit] (candidate)
- [ ] `form.forms.22` Given array field helpers, then pushing appends and removing preserves array holes. [ariakit] (candidate)
- [ ] `form.forms.23` Given a submit, then nested values are marked touched and `Object.prototype` keys are ignored while marking touched, while updating values and while validating error messages. [ariakit] (candidate)
- [ ] `form.forms.24` Given a composite control (a select with a popover) inside a form, then the field's error appears only once focus leaves both the trigger and the popover, not while moving between them. [ariakit] (candidate)
- [ ] `form.forms.25` Given a form whose submit awaits an animation frame in a hidden tab where `requestAnimationFrame` stops firing, then the submission still completes through a timeout fallback rather than stalling. [ariakit] (candidate)
- [ ] `form.forms.26` Divergence: Given a form, then it sets `novalidate` by default and owns validation itself, so native browser bubbles never appear. [base-ui, react-aria] (decision needed)
- [ ] `form.forms.27` Divergence: Given a form, then native constraint validation is on by default (no `novalidate`) and the controls carry `required` rather than `aria-required`; opting into aria-only validation adds `novalidate` and swaps `required` for `aria-required`. A per-field setting overrides the form's in both directions. [react-aria] (decision needed)

### SSR and hydration

- [ ] `form.ssr.1` Given a form server-rendered and hydrated, then no errors and no hydration warnings occur. [react-aria] (candidate)

### Accessibility tooling

- [ ] `form.a11y.1` Given a label, a required control and a matching message, wired through a field wrapper or explicitly by `name` / `htmlFor` / `id`, when audited with axe, then there are no violations. [radix] (candidate)

### Notes and edge cases

- [ ] `form.notes.1` Given a form part used outside a field wrapper without the prop that replaces the context (`name`, `id` or `htmlFor` depending on the part), then it throws an error naming both the wrapper and the missing prop. [radix] (candidate)
- [ ] `form.notes.2` Given a form-name proxy value, then coercing it to a string yields its dot-joined path, other symbol coercions are ignored rather than throwing, and rendering one as a framework child does not raise a symbol-coercion error. [ariakit] (candidate)
- [ ] `form.notes.3` Given a field whose name looks like an integer, then it still resolves to the right control rather than being treated as an array index. [ariakit] (candidate)

## input

### Roles and attributes

- [ ] `input.roles.1` Given an input, then an `input` element is in the document with a generated `id` when none is given, and an explicit `id` is used verbatim. [headlessui, base-ui]
- [ ] `input.roles.2` Given an input inside a disabled field, then it is disabled, carrying either the native `disabled` attribute or `aria-disabled="true"`. [headlessui] (candidate)
- [ ] `input.roles.3` Given an input with a label and a description in one field, then `aria-labelledby` points at the label and `aria-describedby` at the description, listing every id when there is more than one of either. [headlessui] (candidate)
- [ ] `input.roles.4` Given a field whose only disabled part is a button, a submit input or a select, then the field wrapper itself stays enabled. [ariakit] (candidate) (chromium-only)
- [ ] `input.roles.5` Given a read-only field rendered as a share link, then it stays read-only, and a key hint inside the field is kept out of the control's accessible name. [ariakit] (candidate) (chromium-only)

### Pointer

- [ ] `input.pointer.1` Given an input with a label in a field and focus on the body, when the label is clicked, then the input becomes the active element; with a `passive` label, or a disabled input, field or ancestor fieldset, focus stays on the body. [headlessui] (candidate)
- [ ] `input.pointer.2` Given a field with a prefix element, when the prefix is clicked, then the control receives focus. [ariakit] (candidate) (chromium-only)

### Forms

- [ ] `input.forms.1` Given an input with a `name` inside a form, then a control with that name exists, submitting includes its value, a disabled input contributes nothing, and resetting the form restores the initial payload. [headlessui] (candidate)

### Notes and edge cases

- [ ] `input.notes.1` Given an input rendered as a different element through a render prop, then the forwarded ref type follows the rendered element rather than being pinned to `HTMLInputElement`. [base-ui] (candidate) (type-only)

## textarea

### Roles and attributes

- [ ] `textarea.roles.1` Given a textarea, then a `textarea` element is in the document with a generated `id` when none is given, and an explicit `id` is used verbatim. [headlessui] (candidate)
- [ ] `textarea.roles.2` Given a textarea inside a disabled field, then it is disabled, carrying either the native `disabled` attribute or `aria-disabled="true"`. [headlessui] (candidate)
- [ ] `textarea.roles.3` Given a textarea with a label and a description in one field, then `aria-labelledby` points at the label and `aria-describedby` at the description, listing every id when there is more than one of either. [headlessui] (candidate)
- [ ] `textarea.roles.4` Given a textarea whose Enter key submits rather than inserting a newline, then it carries `aria-multiline="false"`; otherwise `aria-multiline` is absent entirely rather than set to `"true"`, because a textarea is natively multiline. [kobalte] (candidate)
- [ ] `textarea.roles.5` Given a text-field hook told the element is a textarea, then a `type` and a `pattern` passed alongside are both dropped, because a textarea supports neither. [react-aria] (candidate)

### Keyboard

- [ ] `textarea.keyboard.1` Given a submit-on-Enter textarea inside a form, when Shift+Enter is pressed, then the form is not submitted and the newline stands; given a textarea without that option, when Enter is pressed, then the form is not submitted either. [kobalte] (candidate)

### Pointer

- [ ] `textarea.pointer.1` Given a textarea with a label in a field and focus on the body, when the label is clicked, then the textarea becomes the active element; with a `passive` label, or a disabled textarea, field or ancestor fieldset, focus stays on the body. [headlessui] (candidate)

### Forms

- [ ] `textarea.forms.1` Given a textarea with a `name` inside a form, then a control with that name exists, submitting includes its value, a disabled textarea contributes nothing, and resetting the form restores the initial payload. [headlessui] (candidate)

### Positioning

- [ ] `textarea.positioning.1` Given an auto-growing textarea, then its inline height is set from its scroll height on mount, for the default, controlled and uncontrolled cases alike, and updates as the content grows; an explicit `height` prop suppresses the auto-grow entirely. [react-aria] (candidate)

## text-field

### Roles and attributes

- [ ] `text-field.roles.1` Given a text field, then the control exposes `role="textbox"`, defaults to `type="text"`, and a `type` of `search` or another value passes through; a textarea variant has no `type` attribute. [kobalte, react-aria]
- [ ] `text-field.roles.2` Given a plain text field, then the control has none of `required`, `disabled` or `readonly` and none of `data-valid`, `data-invalid`, `data-required`, `data-disabled` or `data-readonly`. [kobalte, react-aria]
- [ ] `text-field.roles.3` Given an invalid text field, then the control carries `aria-invalid="true"`, and an author `aria-errormessage` passes through alongside it. [kobalte, react-aria]
- [ ] `text-field.roles.4` Given `required`, `disabled` or `readOnly`, then the control carries both the native attribute and its aria counterpart, and the matching data attribute appears on both the root and the control. [kobalte] (candidate)
- [ ] `text-field.roles.5` Given `autoCapitalize`, `aria-activedescendant`, `aria-autocomplete` or `aria-haspopup` on a text field, then each lands on the control unchanged, so combobox patterns can be built on it. [react-aria] (candidate)
- [ ] `text-field.roles.6` Given `excludeFromTabOrder`, then the control has `tabIndex="-1"`. [react-aria] (candidate)
- [ ] `text-field.roles.7` Given an `id` on a text field, then it lands on the control and not on the wrapper, and data attributes land on the wrapper and not on the control; an `id` set directly on the control is what the label's `for` matches. [react-aria] (candidate)
- [ ] `text-field.roles.8` Given a `form` prop, then the control carries the `form` attribute so it can associate with a form elsewhere in the document. [react-aria] (candidate)

### Keyboard

- [ ] `text-field.keyboard.1` Given a text field, when the user tabs in and types, then the rendered value reflects the typed text. [react-aria, kobalte]

### Pointer

- [ ] `text-field.pointer.1` Given hover callbacks on the control, when it is hovered then unhovered, then `data-hovered` and the hover class toggle, the start and end callbacks fire once each and the change callback fires twice. [react-aria] (candidate)
- [ ] `text-field.pointer.2` Given a read-only text field, when it is clicked, then it still takes focus; given a disabled one, then it does not become the active element. [react-aria] (candidate)

### Focus management

- [ ] `text-field.focus.1` Given focus handlers, then the focus callback fires once per focus (programmatic and click alike) and the blur callback fires once on blur; `autoFocus` makes the control the active element on mount and fires the focus callback once. [react-aria] (candidate)
- [ ] `text-field.focus.2` Given a focus-visible class, when the control is tabbed to, then it gains `data-focus-visible` and the class, and tabbing away clears both. [react-aria] (candidate)

### State

- [ ] `text-field.state.1` Given a `defaultValue`, then the control shows it and the change handler has not been called; when the user types, then the control shows the full new value and the handler receives that whole value rather than the keystroke, once per keystroke. [kobalte, react-aria]
- [ ] `text-field.state.2` Given a fixed controlled `value`, when the user types, then the change handler fires with the would-be value while the rendered value snaps back to the prop. [kobalte, react-aria]
- [ ] `text-field.state.3` Given a ref on a text field, then it resolves to the control DOM node (directly or through an accessor on the returned handle). [react-aria] (candidate)

### Forms

- [ ] `text-field.forms.1` Given a `name`, then the visible control carries it: there is no separate hidden input, the control is the form field. [kobalte, react-aria]
- [ ] `text-field.forms.2` Given a controlled text field inside a form with a reset button, when reset is clicked, then the value returns to its original controlled value. [react-aria] (candidate)
- [ ] `text-field.forms.3` Given a React 19 form action whose returned state feeds `defaultValue`, when the form is submitted, then the control shows the new default rather than the typed value, and server validation errors returned by the action survive the submit. [react-aria] (candidate)
- [ ] `text-field.forms.4` Given `required` with native validation inside a form, then the control carries `required` and not `aria-required` and reports invalid; after the form checks validity, focus moves to the control and `aria-describedby` points at a "Constraints not satisfied" message; typing makes it valid but the message stays until blur. [react-aria] (candidate)
- [ ] `text-field.forms.5` Given a custom error-message render function reading the validity details, then the described text is the custom message rather than the browser default. [react-aria] (candidate)
- [ ] `text-field.forms.6` Given a text field marked invalid with an empty error element, then the control carries `aria-invalid` and the wrapper `data-invalid` but no `aria-describedby`, so no empty error element is referenced. [react-aria] (candidate)
- [ ] `text-field.forms.7` Given a controlled text field with both a description and an error message, then `aria-describedby` lists the description while valid and swaps to the error id while invalid, returning to the description once the value is valid again. [react-aria] (candidate)

### SSR and hydration

- [ ] `text-field.ssr.1` Given a text field or a textarea server-rendered and hydrated, then no errors occur. [react-aria] (candidate)

### Accessibility tooling

- [ ] `text-field.a11y.1` Given a `placeholder`, then it appears on the control and a console warning says placeholders are deprecated for accessibility and points at the help-text guidance. [react-aria] (candidate)

### Notes and edge cases

- [ ] `text-field.notes.1` Given the positive Enter-to-submit case for a submit-on-Enter textarea, then it cannot be tested in jsdom because `HTMLFormElement.requestSubmit` is unimplemented there; the suite needs a polyfill or a real browser. [kobalte] (candidate)

## Sources

- `docs/research/apg-and-axe.md`: the WHATWG HTML form-owner, constraint-validation, form-reset and disabled rules quoted throughout the `checkbox` and `radio-group` sections; they are cited here rather than re-extracted.
- `docs/research/ariakit-and-headlessui.md`, sections `field`, `label`, `description`, `input`, `textarea`, `form`, `controlled-state` and `render-props`.
- `docs/research/kobalte-and-corvu.md`, sections `form-control`, `text-field` and `controllable-signal` (the last covering both kobalte's `createControllableSignal` and corvu's `controllableSignal`).
- `docs/research/radix-and-base-ui.md`, sections `field`, `label`, `fieldset`, `input`, `form` and `controlled-state`.
- `docs/research/react-aria-b.md`, sections `label` (covering `useLabel`, `useField` and the Spectrum `Field`), `form` and `text-field`.
- `docs/research/reka-melt-bits.md`, sections `label` and `controlled-state`.
- `docs/research/zag-and-ark.md`, sections `field` and `fieldset`.

## Deferred

- Store internals (`ariakit`'s listener ordering, keyed dispatch recovery, parent repair convergence, collection registration snapshots): several hundred bullets describing one library's store implementation rather than a component's observable behavior. `controlled-state.state.24` and `controlled-state.state.25` keep the two rules that are observable from a component.
- Async validation pending states (`field.forms.5` through `field.forms.10`) and `validationDebounceTime`: one library only, and they need a validation scheduler the first implementation does not have.
- External `setCustomValidity` ownership (`field.forms.13`, `field.forms.14`): one library only, and it presumes the field writes native validity, which is undecided.
- Field items and their id scoping (`field.roles.8`, `field.roles.9`, `field.roles.16`): two libraries with incompatible models (`Field.Item` value scoping versus a `target` prop), so the shape needs deciding before it can be tested.
- Array fields and form-value paths (`form.forms.20` through `form.forms.22`, `form.focus.8`): a form-state library in its own right, out of scope for a headless component set.
- Framework-specific render-prop mechanics (`as`/`asChild`/`render` prop resolution, Fragment class merging, `refName`, the "Passing props on Fragment" errors, `data-headlessui-state` and its Tailwind variants, exported-surface snapshots, `describeConformance` suites): adapter concerns for `packages/core` and `packages/solid` unit tests. `controlled-state.notes.2` keeps the part that concerns controlled values.
- Auto-growing textarea height (`textarea.positioning.1`): needs measurement and a resize observer; the first implementation leaves sizing to the consumer.
- Contextual-help triggers and necessity indicators beyond the plain `*`: Spectrum-specific field furniture with no second source.
