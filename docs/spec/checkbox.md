# checkbox

A binary or tri-state checkbox and the group that can drive a set of them.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## checkbox

### Roles and attributes

- [ ] `checkbox.roles.1` Given a non-native checkbox, then it exposes `role="checkbox"`. [apg, ariakit, headlessui, radix, base-ui, bits]
- [ ] `checkbox.roles.2` Given a checked checkbox, then `aria-checked` is `"true"`; given an unchecked one, `aria-checked` is present with the explicit value `"false"` rather than omitted; given a partially checked tri-state one, `aria-checked` is `"mixed"`. [apg, axe, ariakit, headlessui, base-ui, bits]
- [ ] `checkbox.roles.3` Given a checkbox, then it has an accessible name from exactly one of: visible text content inside the checkbox element, a visible label referenced by `aria-labelledby`, or `aria-label`. axe additionally accepts `title` and flags a mismatch between a wrapping `label` and the computed name (aria-toggle-field-name, serious). [apg, axe]
- [ ] `checkbox.roles.4` Given `role="checkbox"`, then `aria-checked` is a required attribute, so omitting it fails `aria-required-attr` at critical impact. [axe]
- [ ] `checkbox.roles.5` Given a native `input[type="checkbox"]` carrying a stray `aria-checked` that disagrees with its real checkedness, then the attribute is removed or corrected; axe reports "Remove aria-checked, or set it to \"${data.checkState}\" to match the real checkbox state" at serious impact. [axe]
- [ ] `checkbox.roles.6` Given a `role="checkbox"` element, then all of its descendants are forced presentational (`childrenPresentational: true`), so it must not contain a focusable widget-role descendant and semantic markup inside the label must not be relied on. [apg, axe]
- [ ] `checkbox.roles.7` Given `role="checkbox"` in the axe role table, then its role-specific allowed attributes are `aria-readonly`, `aria-expanded` and `aria-required`, its superclass is `input`, a name is required and may come from content. [axe]
- [ ] `checkbox.roles.8` Given a native `input[type="checkbox"]`, then it has a label from an implicit wrapping `label`, an explicit `label[for]`, `aria-label`, `aria-labelledby`, `title`, a non-empty `placeholder` or a presentational role, and the explicit `label` is not hidden (critical). Labelling by `title` or `aria-describedby` alone is a serious best-practice failure, and more than one `label` element is reported incomplete at moderate impact. [axe]
- [ ] `checkbox.roles.9` Given a group of independent checkboxes, then every checkbox has `tabindex="0"`: checkboxes do not use roving tabindex and each is its own tab stop. [apg]
- [ ] `checkbox.roles.10` Given any element with a `role`, then the role is valid, non-abstract and widely supported, every `aria-*` name and value on it is valid and allowed for that role and host element, none is deprecated, all required attributes are present, and `aria-label` / `aria-labelledby` are absent on roles that prohibit them. [axe]
- [ ] `checkbox.roles.11` Given an id referenced by `aria-controls`, `aria-labelledby` or `aria-describedby`, then that id is unique in the document (duplicate-id-aria, critical). [axe]
- [ ] `checkbox.roles.12` Given any element with `tabindex`, then the value is never greater than 0, so roving-tabindex implementations only ever use 0 and -1. [axe]
- [ ] `checkbox.roles.13` Given `aria-hidden="true"` on an ancestor, then neither it nor any descendant is focusable. [axe]
- [ ] `checkbox.roles.14` Given a clickable control, then its touch target is at least 24 by 24 CSS pixels or leaves sufficient space from its neighbors (WCAG 2.2 AA, serious); the axe rule ships disabled and must be enabled explicitly. [axe]
- [ ] `checkbox.roles.15` Given a `required` checkbox, then it exposes `aria-required="true"`. [base-ui, reka, bits]
- [ ] `checkbox.roles.16` Given a `readOnly` checkbox, then it exposes `aria-readonly="true"`, and given no `readOnly`, then the attribute is absent entirely. [base-ui, kobalte, react-aria, bits]
- [ ] `checkbox.roles.17` Given an invalid checkbox, then the labelled control carries `aria-invalid="true"`, and an author-supplied `aria-errormessage` is passed through untouched rather than clobbered. [kobalte, react-aria, zag]
- [ ] `checkbox.roles.18` Given an indeterminate checkbox, then `aria-checked="mixed"` appears on the exposed control and `data-indeterminate` style hooks appear on the root and the indicator. [base-ui, headlessui, bits]
- [ ] `checkbox.roles.19` Given a checkbox, then each state is mirrored as a data attribute on every part (root, label, control, indicator): `data-state` valued `checked` / `unchecked` / `indeterminate`, plus `data-checked`, `data-unchecked`, `data-indeterminate`, `data-disabled`, `data-readonly`, `data-required`, `data-invalid`, `data-valid`, `data-active`, `data-hover`, `data-focus`, `data-focus-visible`. [kobalte, base-ui, zag, bits, reka, react-aria]
- [ ] `checkbox.roles.20` Given a checkbox with no `id`, then the root gets a generated id and every part derives its id from it (`<rootId>-input`, `-control`, `-indicator`, `-label`); given explicit ids on the root or any part, then the author value wins and no derived id is applied. [kobalte, headlessui, base-ui]
- [ ] `checkbox.roles.21` Given a visible label part, then the control gets `aria-labelledby` pointing at the label id AND the label is a real `label` element whose `for` points at the control id, so both association mechanisms are set. [kobalte, base-ui, react-aria, zag]
- [ ] `checkbox.roles.22` Given a `value` prop, then the `value` attribute is present on the submitted control. [ariakit, kobalte, bits]
- [ ] `checkbox.roles.23` Given a checkbox rendered through a render prop or `asChild`/`render` slot whose value is `undefined`, then the checkbox semantics survive: the element keeps `role="checkbox"` and `aria-checked` still flips on click. [ariakit, radix]
- [ ] `checkbox.roles.24` Given `indeterminate` and `checked` set together, then `indeterminate` wins and `aria-checked` stays `"mixed"`. [base-ui] (candidate)
- [ ] `checkbox.roles.25` Given a checkbox with an explicit `role` prop such as `role="switch"`, then the author role wins over the built-in one. [base-ui] (candidate)
- [ ] `checkbox.roles.26` Given both a visible label and an author `aria-labelledby="foo"`, then `aria-labelledby` is `"foo <labelId>"` (author value first); given a visible label plus `aria-label="bar"` plus `aria-labelledby="foo"`, then `aria-labelledby` becomes `"foo <labelId> <controlId>"`, the control's own id appended so its `aria-label` joins the name computation. [kobalte] (candidate)
- [ ] `checkbox.roles.27` Given multiple label or description elements inside one field, then `aria-labelledby` lists every label id and `aria-describedby` lists every description id. [headlessui] (candidate)
- [ ] `checkbox.roles.28` Given an invalid checkbox with both a description and an error message plus an author `aria-describedby="foo"`, then `aria-describedby` is `"<descriptionId> <errorMessageId> foo"` in exactly that order; given an error message part but no invalid state, then `aria-describedby` is absent entirely so the error is not announced while the field is valid. [kobalte] (candidate)
- [ ] `checkbox.roles.29` Given a description prop added and then removed by rerender, then `aria-describedby` is added and then removed again. [react-aria] (candidate)
- [ ] `checkbox.roles.30` Given a sibling `label[for]` pointing at the checkbox's own id and no library label part, then the checkbox derives a fallback `aria-labelledby` from that label, and when the id changes the fallback follows to the newly matching label. [base-ui] (candidate)
- [ ] `checkbox.roles.31` Divergence: Given a description part plus an author `aria-describedby="foo"`, then `aria-describedby` is `"<descriptionId> foo"`, the library value first, which is the reverse of the `aria-labelledby` merge order. [kobalte] (decision needed)
- [ ] `checkbox.roles.32` Divergence: Given a field-level description alongside an author `aria-describedby`, then `aria-describedby` is `"<author value> <descriptionId>"`, the consumer value first. [base-ui] (decision needed)
- [ ] `checkbox.roles.33` Divergence: Given a headless checkbox, then the exposed element itself carries `role="checkbox"` and `aria-checked`, and any hidden input is `aria-hidden`. [radix, base-ui, headlessui, ariakit, bits, reka] (decision needed)
- [ ] `checkbox.roles.34` Divergence: Given a headless checkbox, then a real `input[type="checkbox"]` carries the semantics and the visual control part is `aria-hidden="true"`, so state is read from the native `checked` / `indeterminate` properties rather than from `aria-checked`. [react-aria, kobalte, zag, ark, melt] (decision needed)

### Keyboard

- [ ] `checkbox.keyboard.1` Given focus on a checkbox, when Space is pressed, then the checked state changes; pressing Space again changes it back, so `aria-checked` reads `"true"` then `"false"`. [apg, ariakit, headlessui, base-ui, zag, kobalte, melt, bits]
- [ ] `checkbox.keyboard.2` Given a dual-state checkbox, then the APG keyboard table lists Space only and does not specify Enter, in contrast to `switch` where Enter is listed as optional. [apg]
- [ ] `checkbox.keyboard.3` Given a set of checkboxes, when Tab is pressed repeatedly, then focus visits every checkbox in DOM order and every implementation variant stays in the tab order. [apg, ariakit]
- [ ] `checkbox.keyboard.4` Given a `readOnly` checkbox, when Space is pressed, then the state does not change, the indicator keeps rendering the unchecked value, the hidden input stays unchecked, and no change callback fires. [bits, kobalte, react-aria]
- [ ] `checkbox.keyboard.5` Given Space pressed and held on a checkbox, then `data-pressed` and the pressed class appear while the key is held and clear on release, and `onPress` / `onClick` each fire once. [react-aria] (candidate)
- [ ] `checkbox.keyboard.6` Given a checkbox with `Checkbox.Control` as a separate part, when Space is pressed and released on the control rather than the input, then the checkbox becomes checked and the change callback receives `true`. [kobalte] (candidate)
- [ ] `checkbox.keyboard.7` Divergence: Given focus on a checkbox, when Enter is pressed, then the checked state does not change. [base-ui, melt, bits] (decision needed)
- [ ] `checkbox.keyboard.8` Divergence: Given a checkbox rendered as a `button` or as a custom visually hidden checkbox, when Enter is pressed, then it toggles, so both Space and Enter work. [ariakit] (decision needed)

### Pointer

- [ ] `checkbox.pointer.1` Given a checkbox, when it is clicked, then `aria-checked` changes exactly as it does on Space, so clicks and key presses share one state machine. [apg, ariakit, headlessui, radix, base-ui, kobalte, zag, ark, reka, melt, bits, react-aria]
- [ ] `checkbox.pointer.2` Given a checkbox activation, then a legacy-pre-activation behavior flips checkedness to its opposite and sets indeterminateness false before the click default action; given the click's default action is prevented, then a legacy-canceled-activation behavior restores both to their prior values. [html]
- [ ] `checkbox.pointer.3` Given a checkbox with an associated label, when the label text is clicked, then the checkbox toggles. [ariakit, headlessui, base-ui, kobalte, zag, ark, react-aria]
- [ ] `checkbox.pointer.4` Given a checkbox inside a clickable ancestor, when the checkbox is clicked once, then the ancestor's `onClick` fires exactly once, with no duplicate click from the hidden input; when `stopPropagation()` is called on the checkbox's own click, then the ancestor handler never runs yet the checkbox still becomes checked. [radix, base-ui]
- [ ] `checkbox.pointer.5` Given a `disabled` checkbox, when it or its label is clicked, then nothing changes and the change callback is never called. [radix, base-ui, kobalte, react-aria, reka, bits]
- [ ] `checkbox.pointer.6` Given a `readOnly` checkbox, when the checkbox or its wrapping label is clicked, then the state does not change and no change callback fires; this holds for the uncontrolled path too, not just the controlled one. [base-ui, kobalte, react-aria, bits]
- [ ] `checkbox.pointer.7` Given a checkbox inside a wrapping `label`, when the checkbox itself is clicked twice, then `aria-checked` goes `"false"` → `"true"` → `"false"`: the wrapping label does not double-toggle it. [base-ui] (candidate)
- [ ] `checkbox.pointer.8` Given a controlled checkbox inside a clickable ancestor inside a form, when `checked` is flipped programmatically by a rerender, then the ancestor's `onClick` is not called while the form still receives a change event with the new state (radix-ui/primitives#3265). [radix] (candidate)
- [ ] `checkbox.pointer.9` Given a hover on the checkbox or its label, then `data-hovered` and the hover class toggle on and off and each hover callback fires the expected number of times; on press, `data-pressed` and the pressed class toggle across the press and `onPress` / `onClick` / `onClickCapture` each fire once. [react-aria] (candidate)
- [ ] `checkbox.pointer.10` Given a checkbox whose hidden input is clicked directly, then the exposed root follows and becomes checked. [base-ui] (candidate)
- [ ] `checkbox.pointer.11` Given a cancelable `click` whose `preventDefault()` already ran before the framework handled it, when it is dispatched on the hidden input, then no change callback fires and the checkbox stays unchecked. [base-ui] (candidate)
- [ ] `checkbox.pointer.12` Given a checkbox activated while Shift is held, then the change callback fires once and its event details expose `shiftKey === true`. [base-ui] (candidate)

### Focus management

- [ ] `checkbox.focus.1` Given a `disabled` checkbox, then it is not a focusable area at all: neither click-focusable, nor tab-reachable, nor focusable by `.focus()`. [html, zag]
- [ ] `checkbox.focus.2` Given a checkbox whose semantics live on a hidden native input, then that input has `tabindex="-1"` where the exposed root is the tab stop, or is itself the tab stop with the control part carrying `data-focus` when it is focused. [zag, bits]
- [ ] `checkbox.focus.3` Given a label click with focus on the body, then the checkbox becomes the active element; given the label has a `passive` prop, or the control is disabled, or an ancestor field or fieldset is disabled, then focus stays on `document.body`. [headlessui, ark]
- [ ] `checkbox.focus.4` Given a `readOnly` checkbox, when it is focused, then it holds focus, so read-only does not remove it from the tab order. [bits] (candidate)
- [ ] `checkbox.focus.5` Given a blur listener on the control, when its label is clicked three times, then zero blur events fire, so label clicks never move focus off the control. [zag] (candidate)
- [ ] `checkbox.focus.6` Given Tab onto and then away from a checkbox, then the root gains `data-focus-visible` and the focus class while keyboard-focused and loses both once focus moves on; `onFocus` / `onFocusChange(true)` fire once on entry and `onBlur` / `onFocusChange(false)` once on exit. [react-aria] (candidate)
- [ ] `checkbox.focus.7` Given two clicks in a row on the same checkbox's label, then `onFocus` fires only on the first and `onBlur` never fires between them, because focus never leaves the checkbox. [react-aria] (candidate)
- [ ] `checkbox.focus.8` Given `excludeFromTabOrder`, then the control has `tabIndex="-1"`. [react-aria] (candidate)
- [ ] `checkbox.focus.9` Given a checkbox in a field whose error arrives from the form layer, when the field is focused for that error, then focus lands on the checkbox and skips one disabled by a `fieldset disabled` ancestor. [base-ui] (candidate)

### State

- [ ] `checkbox.state.1` Given a tri-state checkbox that controls a group, then it reads `aria-checked="true"` when all options are checked, `"mixed"` when some but not all are, and `"false"` when none are. [apg, base-ui]
- [ ] `checkbox.state.2` Given a tri-state checkbox reading `false` or `mixed`, when it is activated, then every option in the group becomes checked; given it reads `true`, when activated, then every option becomes unchecked. [apg, base-ui]
- [ ] `checkbox.state.3` Given a tri-state checkbox whose implementation remembers the option set from the last time it was `mixed`, when it is activated a third time, then that remembered partially-checked set may be restored; the APG example stores it per-checkbox on a `data-last-state` attribute. [apg, base-ui]
- [ ] `checkbox.state.4` Given a tri-state checkbox in the `mixed` state, when Space is pressed or it is clicked three times, then `aria-checked` reads `"true"`, `"false"`, then `"mixed"` again with the previously-checked subset restored; the three-value cycle is a distinct state machine from the two-value cycle and the library exposes which cycle a checkbox uses. [apg]
- [ ] `checkbox.state.5` Given the `indeterminate` IDL attribute, then it is not reflected as a content attribute, is initially false, affects only checkbox controls, and is independent of checkedness, so "mixed" is tracked separately from checked; `:indeterminate` follows the IDL state, and the rendering should obscure the control's selection. [html]
- [ ] `checkbox.state.6` Given an uncontrolled checkbox, when it is mounted, then no change callback fires; when it is clicked, then it becomes checked and the callback receives `true`, and clicking again gives `false`. [kobalte, headlessui, base-ui, radix, react-aria, reka, melt, bits, ark]
- [ ] `checkbox.state.7` Given `defaultChecked` / `defaultSelected`, then the checkbox renders checked and the indicator is already visible; when clicked, then it unchecks and the change callback receives `false`. [radix, base-ui, headlessui, kobalte, react-aria, melt]
- [ ] `checkbox.state.8` Given a fixed controlled `checked` prop, when the checkbox is clicked, then its rendered state stays on the prop and never drifts, while the change callback still receives the requested opposite value. [radix, base-ui, kobalte, react-aria, ark]
- [ ] `checkbox.state.9` Given a controlled checkbox whose value is changed from outside, then `aria-checked` and the hidden input follow the external state. [base-ui, ark, bits]
- [ ] `checkbox.state.10` Given a checkbox bound with a getter/setter pair or a store, then activation routes through the setter and the bound value is what the markup renders. [bits, ariakit, reka]
- [ ] `checkbox.state.11` Given an `indeterminate` checkbox, then `indeterminate` is `true` while `checked` is `false`. [kobalte, react-aria, base-ui, bits]
- [ ] `checkbox.state.12` Given a change callback that cancels the event (`eventDetails.cancel()`), then the handler runs once but nothing commits: the root stays unchecked and the hidden input's `checked` stays `false`. [base-ui] (candidate)
- [ ] `checkbox.state.13` Given a change callback that deliberately does not update the controlled state, then the indicator is not added, so the visual state follows the controlled prop only. [radix] (candidate)
- [ ] `checkbox.state.14` Given two checkboxes bound to dynamically linked stores, when either is clicked, then both follow the link, and after a decoupling click only the clicked one changes. [ariakit] (candidate)
- [ ] `checkbox.state.15` Divergence: Given `indeterminate` set as a fixed prop, when the checkbox is clicked, then `indeterminate` remains `true` while `checked` flips, so indeterminate is an independent sticky flag that is not auto-cleared by interaction, and clicking again returns `checked` to `false` with the change callback receiving `false`. [kobalte, react-aria, base-ui] (decision needed)
- [ ] `checkbox.state.16` Divergence: Given a checkbox whose value is `indeterminate`, when it is clicked or Space is pressed, then `data-state` advances `indeterminate` → `checked` → `unchecked`, so indeterminate is the third value in the cycle and is consumed by the first activation; an `onIndeterminateChange` callback fires with `false`. [reka, melt, bits] (decision needed)

### Forms

- [ ] `checkbox.forms.1` Given a checkbox whose activation completes, then an `input` event that bubbles and composes fires, followed by a `change` event that bubbles, in that order. [html]
- [ ] `checkbox.forms.2` Given a `required` checkbox whose checkedness is false, then it is suffering from being missing (`valueMissing`). [html, base-ui, react-aria]
- [ ] `checkbox.forms.3` Given a form that is reset, then a `reset` event fires that bubbles and is cancelable, and only if it is not cancelled does each resettable element's reset algorithm run; those changes do not count as user changes and must not fire `input` events. [html]
- [ ] `checkbox.forms.4` Given a checkbox that has been checked by the user and a form reset, then the checkbox reverts to its initial checked state and a resubmitted payload matches the initial one. [html, headlessui, react-aria]
- [ ] `checkbox.forms.5` Given a disabled control, then it is barred from constraint validation, contributes no entry to the submitted entry list, and the user agent prevents queued click events from being dispatched on it; being disabled does not prevent programmatic writes to `checked`. [html, base-ui]
- [ ] `checkbox.forms.6` Given a `fieldset` with `disabled`, then every form control descendant is disabled except those inside the fieldset's first `legend` child, transitively through nested fieldsets. [html, base-ui, headlessui]
- [ ] `checkbox.forms.7` Given a control the library renders as disabled without a native disabled element, then `aria-disabled="true"` alone changes only the accessibility tree: no click suppression, no focus exclusion and no constraint-validation exemption come for free, so each must be implemented in script. [html]
- [ ] `checkbox.forms.8` Given a form-associated element with no `form` attribute, then its form owner is its nearest ancestor `form`, recomputed whenever the element is inserted or removed, its `form` attribute changes, or a matching id appears or disappears; a `form` attribute's value must be the id of a `form` in the element's tree. [html, base-ui]
- [ ] `checkbox.forms.9` Given constraint validation, then `willValidate` reports candidacy, `checkValidity()` fires a cancelable `invalid` event and returns false when constraints are unmet, `reportValidity()` additionally reports to the user and may focus the element, and `setCustomValidity(error)` normalizes newlines before storing; the `ValidityState` flags are `valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `tooShort`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError` and `valid`. [html]
- [ ] `checkbox.forms.10` Given a submitter with `formnovalidate` or a form with `novalidate`, then interactive constraint validation is skipped on submission. [html]
- [ ] `checkbox.forms.11` Given `:user-invalid`, then it matches only elements whose user validity is true, set after a change or blur with a changed value or after submission was attempted, so it is distinct from `:invalid`. [html]
- [ ] `checkbox.forms.12` Given a control that mimics a native form control without using one, then it is only form-associated deliberately: the form-associated elements are `button`, `fieldset`, `input`, `object`, `output`, `select`, `textarea`, `img` and form-associated custom elements, and only `button`, `input`, `select`, `textarea` and form-associated custom elements are submittable. [html]
- [ ] `checkbox.forms.13` Given a headless control that needs real form participation, then the supported mechanism is a form-associated custom element: `static formAssociated = true`, one `attachInternals()` call (a second throws `NotSupportedError`), `setFormValue(value, state)` to report the value, and `setValidity(flags, message, anchor)` to report validity, where any true flag requires a non-empty message or the call throws `TypeError` and `setFormValue(null)` excludes the element from the entry list; the lifecycle callbacks are `formAssociatedCallback`, `formResetCallback`, `formDisabledCallback` and `formStateRestoreCallback` with a reason of `"autocomplete"` or `"restore"`. [html]
- [ ] `checkbox.forms.14` Given a checkbox with a `name` and no `value`, then the submitted value defaults to `"on"`, matching native HTML; given a `value`, then that value is submitted. [kobalte, base-ui, bits, reka, react-aria]
- [ ] `checkbox.forms.15` Given a checkbox inside a form, when it is submitted unchecked then the field is absent from the `FormData` (`get` returns `null`, `getAll` returns `[]`), and when submitted checked then the field carries `"on"` or the custom `value`; this matches a native `input[type="checkbox"]` exactly. [base-ui, headlessui, bits, reka]
- [ ] `checkbox.forms.16` Given a `disabled` checkbox in a form, when the form is submitted, then it contributes no entry at all. [base-ui, headlessui, kobalte]
- [ ] `checkbox.forms.17` Given a checkbox with a `form="<id>"` attribute pointing at a form it is not nested in, when that form is submitted, then the checkbox's entry is included; when the enclosing form is submitted, then it is not. [base-ui, react-aria, bits]
- [ ] `checkbox.forms.18` Given a `required` checkbox with native validation inside a form, when the form is submitted unchecked, then native validation fires, the error element renders (absent before submit), the control reports `validity.valid === false` and carries the `required` attribute rather than `aria-required`; after it is checked, `validity.valid` becomes true. [base-ui, react-aria]
- [ ] `checkbox.forms.19` Given a field with server-supplied errors, then the checkbox starts `aria-invalid="true"` with the error text rendered, and when it is clicked the `aria-invalid` attribute is removed and the error element unmounts. [base-ui, react-aria]
- [ ] `checkbox.forms.20` Given a checkbox inside a field, then `disabled`, `required`, `readOnly`, `invalid` and `name` set on the field propagate to the checkbox, and the field's helper text and error text render accordingly. [base-ui, headlessui, zag, ark]
- [ ] `checkbox.forms.21` Given a focused checkbox inside a form with a submit button, when Enter is pressed, then the form submits exactly once by implicit submission with `SubmitEvent.submitter` equal to that button, the button's own click handler fires once, and the checkbox's checked state does not change. [base-ui, react-aria, bits] (browser-only)
- [ ] `checkbox.forms.22` Given the hidden input that backs a non-native checkbox, then it is rendered outside the interactive control rather than nested inside it, so `button input` matches nothing. [reka] (candidate)
- [ ] `checkbox.forms.23` Given an `indeterminate` checkbox, then the hidden input's `indeterminate` DOM property is set to `true`; given a controlled checkbox whose `indeterminate` stays set while `checked` changes, then a native hidden-input click clears `indeterminate` before toggling and the library restores it, leaving `checked === true` and `indeterminate === true`. [base-ui] (candidate)
- [ ] `checkbox.forms.24` Given a checkbox and a bubble-input part inside a `form` with an `onChange` listener, then the form receives a change event whose `target.checked` is the next state, for uncontrolled, `defaultChecked` and controlled checkboxes alike, and also when the controlled state is set externally rather than clicked. [radix] (candidate)
- [ ] `checkbox.forms.25` Given a legacy uncontrolled checkbox in a form, then the change event's `target.defaultChecked` mirrors the current `defaultChecked` prop; given a legacy controlled one, then `target.defaultChecked` stays at the initial `checked` value rather than tracking the prop. [radix] (candidate)
- [ ] `checkbox.forms.26` Given a checkbox whose `name` comes from an enclosing field, then the hidden input inherits that `name`, and the `name` attribute lands only on the hidden input and never on the element with `role="checkbox"`. [base-ui] (candidate)
- [ ] `checkbox.forms.27` Given a checkbox with a custom `validate` function and `validationMode="onChange"`, when the user clicks it once, then `validate` is called exactly once with the new value and `aria-invalid="true"` appears; with `validationMode="onBlur"` the validation waits for the blur; with the default `validationMode="onSubmit"` no `aria-invalid` appears until submit, after which checking clears it and unchecking re-adds it. [base-ui] (candidate)
- [ ] `checkbox.forms.28` Given a controlled checkbox inside a validating field whose value is changed externally, then `validate` runs exactly one additional time with the new value and `aria-invalid="true"` appears. [base-ui] (candidate)
- [ ] `checkbox.forms.29` Given `validationBehavior="aria"` (the default in that library) with a custom `validate`, then native `validity.valid` stays true and invalidity is reported through `aria-invalid` and `aria-describedby` only; given `validationBehavior="native"`, then native constraint validity drives it. [react-aria] (candidate)
- [ ] `checkbox.forms.30` Given a `required` checkbox whose form submit fails, then the checkbox gains `aria-describedby` referencing a "Constraints not satisfied" message, and checking it clears `aria-invalid`, `data-invalid` and `aria-describedby` together. [react-aria] (candidate)
- [ ] `checkbox.forms.31` Given a checkbox inside a field, then the field exposes `data-touched` after focus then blur, `data-dirty` once the value differs from its default, `data-filled` while checked, `data-focused` while focused (never when disabled), `data-invalid` when the field is invalid, and `data-valid` only after validation has run. [base-ui] (candidate)
- [ ] `checkbox.forms.32` Given a controlled checkbox that remounts unchecked under a new key, then the field's `data-filled` is cleared. [base-ui] (candidate)
- [ ] `checkbox.forms.33` Given a focused checkbox and Enter, then submission is suppressed when the checkbox's own `onKeyDown` prevents default, when an ancestor prevents default (and the ancestor observes `defaultPrevented === false`, so the checkbox does not pre-prevent it), when the form has no submit button at all, or when the form's default submit button is disabled (the default submitter is used rather than falling through to a later enabled one). [base-ui] (candidate) (browser-only)
- [ ] `checkbox.forms.34` Given a `readOnly` checkbox or one rendered as a native `button`, when Enter is pressed, then the form still submits exactly once and no double submit occurs. [base-ui] (candidate) (browser-only)
- [ ] `checkbox.forms.35` Given a checkbox with an explicit `type="button"`, when Enter is pressed on it, then neither a toggle nor a form submission happens; with `type="submit"`, then the form submits and the checked state is preserved. [bits] (candidate)
- [ ] `checkbox.forms.36` Given a React 19 form action driving `defaultChecked` through `useActionState`, when the submit button runs the action, then the checkbox re-renders to the updated `defaultChecked`. [react-aria] (candidate)
- [ ] `checkbox.forms.37` Divergence: Given a checkbox with an `uncheckedValue`, when the form is submitted while unchecked, then the named field is submitted with that value (`"off"`, `"false"`, whatever is given) instead of being omitted; a disabled checkbox still contributes nothing. [base-ui] (decision needed)
- [ ] `checkbox.forms.38` Divergence: Given a checkbox that is unchecked, when the form is submitted, then no entry is contributed under any circumstance, matching native HTML. [html, headlessui, bits, reka, react-aria] (decision needed)
- [ ] `checkbox.forms.39` Divergence: Given a checkbox with no `name` prop, then no hidden input is rendered at all. [bits] (decision needed)
- [ ] `checkbox.forms.40` Divergence: Given a checkbox, then the hidden input is always rendered so the control can participate in a form and in `aria-labelledby` resolution regardless of whether a `name` was supplied. [base-ui, radix, reka] (decision needed)
- [ ] `checkbox.forms.41` Divergence: Given a `disabled` checkbox, then the exposed control carries `aria-disabled="true"` and no native `disabled` attribute. [base-ui] (decision needed)
- [ ] `checkbox.forms.42` Divergence: Given a `disabled` checkbox, then the backing native input carries the real `disabled` attribute, so the browser supplies click suppression, focus exclusion and validation exemption. [kobalte, react-aria, zag, ark, bits] (decision needed)

### Animation and presence

- [ ] `checkbox.anim.1` Given an indicator part with no force-mount flag, then it is absent from the DOM while the checkbox is unchecked and inserted once the checkbox becomes checked; given the checkbox is `indeterminate`, then the indicator mounts even though `checked` is false. [kobalte, base-ui, radix, reka, zag]
- [ ] `checkbox.anim.2` Given an indicator with `forceMount` / `keepMounted`, then it is in the DOM while unchecked, checked and indeterminate alike, which is what lets CSS drive an exit animation. [kobalte, base-ui]
- [ ] `checkbox.anim.3` Given an indicator with no CSS exit animation, when the checkbox is unchecked, then the indicator is removed from the DOM immediately. [base-ui] (candidate) (browser-only)
- [ ] `checkbox.anim.4` Given an indicator whose `[data-ending-style]` runs a CSS animation, when the checkbox is unchecked, then the indicator is first still present carrying `data-ending-style` and is only removed after `onAnimationEnd` fires. [base-ui] (candidate) (browser-only)
- [ ] `checkbox.anim.5` Given an indicator with `[data-starting-style]` and a transition, when the checkbox is checked, then the indicator mounts, `onTransitionEnd` eventually fires, and `getAnimations` is never called. [base-ui] (candidate) (browser-only)
- [ ] `checkbox.anim.6` Given ten checked checkboxes each with an exit-animated indicator, when all are unchecked at once, then every commit observes either all ten indicators or none, never a partial count, so they unmount in a single commit. [base-ui] (candidate) (browser-only)
- [ ] `checkbox.anim.7` Given the indicator part, then it receives library-owned inline `pointer-events: none` merged with, not replacing, the author's `style`. [radix] (candidate)

### SSR and hydration

- [ ] `checkbox.ssr.1` Given a checkbox inside a field with a label and an explicit `id`, when rendered to a string, then the control carries the provider's generated id and the label's `for` points at that id; after hydration both become the explicit `id`. [base-ui] (candidate)
- [ ] `checkbox.ssr.2` Given a runtime with no `useId` (the React 17 fallback), when rendered to a string, then no element has an `id` and the label has no `for`; after hydration the control gets a non-empty fallback id and the label's `for` matches it. [base-ui] (candidate)
- [ ] `checkbox.ssr.3` Given a checkbox remounted under a new key with no `id` prop, then it does not reuse the unmounted checkbox's explicit id and gets a fresh non-empty generated id that the label's `for` follows. [base-ui] (candidate)
- [ ] `checkbox.ssr.4` Given a checkbox server-rendered through an SSR harness, then it renders without errors. [react-aria] (candidate)

### Accessibility tooling

- [ ] `checkbox.a11y.1` Given a checkbox in its default, `disabled`, `defaultChecked` and controlled configurations, when audited with axe, then there are no violations. [radix, reka, melt, zag, ark]
- [ ] `checkbox.a11y.2` Given a headless checkbox audited with axe, then the audit may need the `label` and `nested-interactive` rules disabled, or the hidden bubble input marked `aria-hidden="true"`, because axe does not honour `hidden` on an unlabelled input; a suite that needs those exemptions is recording a real gap in the markup. [radix, reka]

### Notes and edge cases

- [ ] `checkbox.notes.1` Given a binary input, then checkbox, switch and toggle button are often functionally interchangeable and the role should match both the visual design and the wording: a "Lights" control reads better as a switch, an item in a "which must be included" checklist as a checkbox. Only checkbox and toggle button support a third middle state; `switch` must not. [apg]
- [ ] `checkbox.notes.2` Given a group of checkboxes with no visible group label, then no `role="group"` wrapper is required: the wrapper requirement is conditional on the presence of a visible label. [apg]
- [ ] `checkbox.notes.3` Given a tri-state checkbox, then its canonical use is a group-controlling checkbox in an installer, where `mixed` means some but not all of the group is selected. [apg]
- [ ] `checkbox.notes.4` Given an indicator part rendered with no enclosing root, then it throws a descriptive error naming the missing context rather than rendering. [base-ui] (candidate)
- [ ] `checkbox.notes.5` Given a ref callback that focuses, blurs and clicks the checkbox before the hidden input has mounted, then nothing throws and the checkbox stays unchecked. [base-ui] (candidate)
- [ ] `checkbox.notes.6` Given `fireEvent.click` dispatched directly on a disabled native input, then it fires anyway because it bypasses the browser's disabled-element gating, so disabled behavior must be tested with a real user-event click or asserted on a sibling. [kobalte] (candidate)
- [ ] `checkbox.notes.7` Given a Solid or Svelte adapter, then a click handler runs synchronously but the resulting DOM property write lands on the microtask queue, so an `await` of one microtask is needed before asserting `checked` or a change spy; a single microtask flush is enough to observe the indicator mounting but not unmounting, since the exit path goes through presence machinery and needs fake timers plus `transitionend`, or a `waitFor`. [kobalte] (candidate)
- [ ] `checkbox.notes.8` Given a shared hidden-input builder used by checkbox, switch and radio group, then all three share the same element and the same `value` / `name` / `disabled` / `required` wiring, so one set of hidden-input tests covers form mirroring for every toggle. [melt] (candidate)
- [ ] `checkbox.notes.9` Given a hidden input whose `value` store is updated, then exactly one `change` event is emitted, and `name`, `disabled` and `required` updates land after one tick. [melt] (candidate)

## checkbox-group

### Roles and attributes

- [ ] `checkbox-group.roles.1` Given a set of checkboxes presented as a logical group with a visible label, then they are wrapped in an element with `role="group"` carrying `aria-labelledby` pointing at the group label, and that label resolves to an element with non-empty text. [apg, ariakit, base-ui, react-aria, bits]
- [ ] `checkbox-group.roles.2` Given a tri-state checkbox controlling a set of checkboxes, then its `aria-controls` is a space-separated list naming every controlled checkbox id, in child order, and every id resolves to exactly one element; the parent also has `tabindex="0"`. [apg, base-ui]
- [ ] `checkbox-group.roles.3` Given descriptive static text relevant to a checkbox group, then the group carries `aria-describedby` referencing the description element. [apg, base-ui, react-aria]
- [ ] `checkbox-group.roles.4` Given a `disabled` group, then every child checkbox is disabled, the group itself may expose `aria-disabled="true"`, and a child's own `disabled={false}` does not win over the group; given no `disabled` or `disabled={false}`, then neither the group nor any child carries a disabled or `aria-disabled` attribute. [base-ui, react-aria, bits, ark]
- [ ] `checkbox-group.roles.5` Given `disabledItems` naming a subset, then only those children are disabled and their siblings stay enabled. [bits, ark]
- [ ] `checkbox-group.roles.6` Given a `readOnly` group, then every child carries `aria-readonly="true"` and `data-readonly`; given `readonlyItems` naming a subset, then only those children do. [react-aria, bits]
- [ ] `checkbox-group.roles.7` Given `required` on the group only, then the group's label gains a "(required)" necessity indicator and no child input receives `required` or `aria-required`; given `required` on the group and on each child, then every child input also carries `aria-required`. [react-aria, bits]
- [ ] `checkbox-group.roles.8` Given a group with an `aria-label` instead of a visible label, then the group carries that `aria-label`. [react-aria] (candidate)
- [ ] `checkbox-group.roles.9` Given a group `id`, then it is forwarded to the element with `role="group"`. [base-ui] (candidate)
- [ ] `checkbox-group.roles.10` Given `invalid` on the group, then every child input carries `aria-invalid`; given `invalid` on individual children only, then only those children do. [react-aria] (candidate)
- [ ] `checkbox-group.roles.11` Given a group of children with no explicit `name`, then their inputs carry no `name` attribute and each input's `value` is its item value. [react-aria] (candidate)
- [ ] `checkbox-group.roles.12` Given a group sharing one field, then each checkbox keeps a unique id, gets its own accessible name from its own label, and the parent's `aria-controls` names the exposed checkboxes rather than the hidden inputs. [base-ui] (candidate)
- [ ] `checkbox-group.roles.13` Given a group whose field carries a description and whose children carry their own `aria-describedby`, then each child's `aria-describedby` is `"<own value> <group description id>"` and the group's is `"<own value> <group description id>"`; a field-level error id is appended to each child's `aria-describedby` too. [base-ui] (candidate)
- [ ] `checkbox-group.roles.14` Given a group-level description, a group-level error message and a per-checkbox description, then the group's `aria-describedby` resolves to the description plus the error, and each checkbox's resolves to its own description plus the group's error and description text. [react-aria] (candidate)
- [ ] `checkbox-group.roles.15` Given a child with a custom `id` and no native-button rendering, then the custom id lands on the hidden input while the exposed child keeps a generated id, and the parent's `aria-controls` names the exposed child; given native-button rendering or an `id` on the rendered element, then the parent's `aria-controls` names that id directly. [base-ui] (candidate)
- [ ] `checkbox-group.roles.16` Given a child with no identifying `value` inside a group, then the hidden input still receives a non-empty `id`. [base-ui] (candidate)
- [ ] `checkbox-group.roles.17` Given a group and a group label part, then the group carries `data-checkbox-group` and the label `data-checkbox-group-label`. [bits] (candidate)

### Keyboard

- [ ] `checkbox-group.keyboard.1` Given a tri-state parent checkbox followed by its controlled checkboxes, when Tab is pressed repeatedly, then focus visits the parent first and then each controlled checkbox in DOM order. [apg]
- [ ] `checkbox-group.keyboard.2` Given a group rendered vertically or horizontally in an LTR or RTL locale, when checkboxes are toggled by index, by keyboard, by label text and by mouse, then each targeted checkbox toggles, disabled checkboxes are skipped, and the selected count updates the same way regardless of orientation or locale. [react-aria] (candidate)
- [ ] `checkbox-group.keyboard.3` Given a `readOnly` group, when Space is pressed on a focused item, then nothing changes, the bound value stays as it was, and no change callback fires. [bits] (candidate)
- [ ] `checkbox-group.keyboard.4` Given a group item with `type="submit"` that is checked, when Enter is pressed on it, then the form submits with the group name carrying the checked values and the item stays checked; with the default item type, then nothing submits. [bits] (candidate)

### Pointer

- [ ] `checkbox-group.pointer.1` Given a group, when one child's label is clicked, then the group's change callback fires once with an array containing just that value and only that input becomes checked. [react-aria, base-ui, reka, bits, ariakit]
- [ ] `checkbox-group.pointer.2` Given a group, when a second child is clicked, then both children read checked and the rest stay unchecked, so the group holds multiple values. [reka, base-ui, bits, ariakit]
- [ ] `checkbox-group.pointer.3` Given one `readOnly` item inside an otherwise editable group, when that item's label is clicked, then neither the group's nor the item's change callback fires and the box stays unchecked; the other items still toggle normally. [react-aria, bits]
- [ ] `checkbox-group.pointer.4` Given a `disabled` group, when any child is clicked, then no indicator appears and no state changes. [reka, base-ui, react-aria]

### Focus management

- [ ] `checkbox-group.focus.1` Given focus handlers on the group, when focus enters from outside, then `onFocus` and `onFocusChange(true)` fire once and do not fire again as focus moves between checkboxes inside the group; when focus leaves the group, then `onBlur` and `onFocusChange(false)` fire once. [react-aria] (candidate)
- [ ] `checkbox-group.focus.2` Given a `readOnly` group, when each item is focused in turn, then each receives focus. [bits] (candidate)
- [ ] `checkbox-group.focus.3` Given a group whose field receives an error from the form layer, then the first child checkbox receives focus and `aria-invalid="true"`, not the parent checkbox; when a later child is the one that failed validation, then focus lands on that child instead. [base-ui] (candidate) (browser-only)
- [ ] `checkbox-group.focus.4` Given a group whose error focus target is unavailable, then focus skips it: a checkbox disabled directly, one disabled by a `fieldset disabled` ancestor, or one unmounted by the same commit are all passed over in favour of a remaining enabled checkbox; a control-less invalid group is skipped entirely and focus lands on the next invalid field. [base-ui] (candidate) (browser-only)
- [ ] `checkbox-group.focus.5` Given a `required` child portaled into a detached container inside the form, when submit is blocked, then that portaled checkbox receives focus. [base-ui] (candidate) (browser-only)

### State

- [ ] `checkbox-group.state.1` Given a group with a `parent` checkbox, when some but not all children are checked, then the parent reads `aria-checked="mixed"`; when all are, `"true"`; when none are, `"false"`. [base-ui, apg]
- [ ] `checkbox-group.state.2` Given a group value, then it is an array; a controlled value of `undefined` or `null` is treated as an empty array rather than throwing, and an omitted default behaves as `[]`. [base-ui, react-aria]
- [ ] `checkbox-group.state.3` Given a controlled group, when children are clicked in turn, then the change callback receives the accumulated array in child order on each call, and unchecking removes just that value. [base-ui, bits, ariakit, react-aria]
- [ ] `checkbox-group.state.4` Given a group change callback, then it fires exactly once per click, with no duplicate callbacks from the parent-child wiring. [base-ui, bits]
- [ ] `checkbox-group.state.5` Given `defaultValue`, then exactly those children render checked; given a controlled `value`, then the group follows the prop and an external write to it re-renders the children. [base-ui, react-aria, bits]
- [ ] `checkbox-group.state.6` Given an empty-string item value in the controlled value array, then that child reads checked, and clicking it unchecks it. [base-ui] (candidate)
- [ ] `checkbox-group.state.7` Given two sibling groups in Strict Mode neither of which was given a `defaultValue`, then their omitted defaults are not shared: toggling a child of one leaves the other's parent and children untouched. [base-ui] (candidate)
- [ ] `checkbox-group.state.8` Given a group with `allValues` and a `parent` checkbox, when the parent is clicked, then the parent and every child become checked and only the parent's change callback fires, no child's; clicking the parent again returns everything to unchecked. [base-ui] (candidate)
- [ ] `checkbox-group.state.9` Given a `parent` checkbox that reached `mixed` from a child click, when the parent is clicked three times, then it checks every child, unchecks every child, then restores the original mixed snapshot with only the originally-checked child checked. [base-ui] (candidate)
- [ ] `checkbox-group.state.10` Given a parent-enabled group where either the parent's or a child's change callback cancels the event, then that handler fires once, the group's own change callback never fires, and nothing becomes checked. [base-ui] (candidate)
- [ ] `checkbox-group.state.11` Given a group whose own change callback cancels a `mixed` → all-checked parent transition, when the parent is clicked twice, then both calls propose the same all-checked array: the cancelled transition is retried rather than advancing the parent's internal toggle cycle. [base-ui] (candidate)
- [ ] `checkbox-group.state.12` Given a group whose change callback cancelled a child change, when the parent is then clicked, then the parent's snapshot of checked children is not polluted by the cancelled change. [base-ui] (candidate)
- [ ] `checkbox-group.state.13` Given a `parent` checkbox and an unchecked `disabled` child, when the parent is clicked, then the parent can only reach `aria-checked="mixed"` and the disabled child stays unchecked; given a checked `disabled` child, then unchecking through the parent leaves the disabled child checked. [base-ui] (candidate)
- [ ] `checkbox-group.state.14` Given a `parent` checkbox and a child with no identifying `value`, when the parent is clicked, then the valueless child is not selected. [base-ui] (candidate)
- [ ] `checkbox-group.state.15` Given the group state layer, then it exposes `value`, `isDisabled`, `isReadOnly`, `setValue`, `addValue`, `removeValue`, `toggleValue` and `isSelected`, where `addValue` never adds a duplicate even when called repeatedly in one update, `toggleValue` re-adds a removed value at the end of the array, and a read-only or disabled group ignores every one of those mutators. [react-aria] (candidate)
- [ ] `checkbox-group.state.16` Given `toggleValue` called twice with the same value synchronously in one batch, then both calls act on the same pre-batch state, so the result is one toggle rather than a no-op round trip. [react-aria] (candidate)
- [ ] `checkbox-group.state.17` Given a `readOnly` group, then an existing checked state is preserved when the group becomes read-only: the checked children stay checked, every child gains `aria-readonly="true"`, and clicking any of them changes nothing. [bits] (candidate)

### Forms

- [ ] `checkbox-group.forms.1` Given a group `name`, then every child input carries it, so the submitted payload is one repeated key. [react-aria, bits]
- [ ] `checkbox-group.forms.2` Given a group with `required` on more than one child, when the form is submitted, then the `valueMissing` error persists until every required child is ticked; a `disabled` required child is exempt from constraint validation entirely, even when it was the last child mounted. [base-ui, react-aria]
- [ ] `checkbox-group.forms.3` Given a group-level `validate` function, then it is called exactly once for the whole group with the group's value array, on submit under `validationMode="onSubmit"`, per change under `onChange`, per blur under `onBlur`, and one extra time when a controlled value changes externally. [base-ui, react-aria]
- [ ] `checkbox-group.forms.4` Given a group with a `name` inside a form, then a hidden input per item backs the submission and unchecking every item leaves the submitted entry list empty. [reka, bits]
- [ ] `checkbox-group.forms.5` Given a group under one field name, when the form is submitted, then `FormData.getAll(name)` equals the selected values in child order, and a `parent` checkbox contributes no entry of its own. [base-ui] (candidate) (browser-only)
- [ ] `checkbox-group.forms.6` Given `required` on the group only, when one child is checked, then the requirement is satisfied; unchecking it again makes the group invalid with `data-invalid` and an `aria-describedby` pointing at "Constraints not satisfied". [react-aria] (candidate)
- [ ] `checkbox-group.forms.7` Given a checked required child that unmounts, then validation keeps running against the remaining required children rather than going quiet. [base-ui] (candidate)
- [ ] `checkbox-group.forms.8` Given a group-level `validate` and children toggled on and off, then no stale custom error survives a commit, and custom validity is cleared from inputs that have since been disabled once the group becomes valid. [base-ui] (candidate)
- [ ] `checkbox-group.forms.9` Given a `parent` checkbox toggled inside a validating field, then `validate` is called with the resulting group value (all values, then the empty array). [base-ui] (candidate)
- [ ] `checkbox-group.forms.10` Given per-child `validate` functions, then only the failing children report invalid, the group's `aria-describedby` lists each custom message, focus moves to the first invalid child, and each message is removed as its own child is satisfied. [react-aria] (candidate)
- [ ] `checkbox-group.forms.11` Given server-supplied validation errors for a group, then the group gains `aria-describedby` with the server message and every child reports invalid; checking any child clears the group's `aria-describedby`. [react-aria] (candidate)
- [ ] `checkbox-group.forms.12` Given `required` with a custom error-message function keyed on `validationDetails.valueMissing`, then the group's `aria-describedby` carries that custom message instead of the browser default. [react-aria] (candidate)
- [ ] `checkbox-group.forms.13` Given a group value that includes disabled, unmounted, externally-owned (`form="<other id>"`) or fieldset-disabled children, then the logical validation value keeps every selected value while the projected form values and the submit payload include only the enabled, mounted, own-form ones; re-enabling or remounting a child restores it to the payload without losing its checked state. [base-ui] (candidate)
- [ ] `checkbox-group.forms.14` Given a checked child with no `value` prop, then it falls back to the field name as its submitted value. [base-ui] (candidate)
- [ ] `checkbox-group.forms.15` Given a child rendered through a portal outside the form element with no native `form` association, then it is still included in the submission because registration is context-driven; a child portaled into a different real `form` with no `form` attribute is excluded, as it belongs to that form natively. [base-ui] (candidate) (browser-only)
- [ ] `checkbox-group.forms.16` Given a `required` child that changes form owner or unmounts, then it stops blocking the original form's submission from that point on; a custom group validator still runs against the preserved group value after every checkbox has unmounted. [base-ui] (candidate) (browser-only)
- [ ] `checkbox-group.forms.17` Given a controlled group with no rendered checkboxes at all, then `validationMode` still governs when `validate` runs: `onChange` validates each value write, `onSubmit` and `onBlur` only on submit, and an imperative `actionsRef.current.validate()` call validates once with the current value. [base-ui] (candidate) (browser-only)
- [ ] `checkbox-group.forms.18` Given duplicate-value child registrations removed in the same commit as a `requestSubmit()` from a parent layout effect, then the registrations are updated before the submit reads them. [base-ui] (candidate)
- [ ] `checkbox-group.forms.19` Given a group controlled by state inside a native form with a reset button, when the form is reset, then the children revert to their original checked state. [react-aria] (candidate)
- [ ] `checkbox-group.forms.20` Given a React 19 form action driving `defaultValue` through `useActionState`, when the submit button runs the action, then exactly the children named by the new `defaultValue` become checked. [react-aria] (candidate)
- [ ] `checkbox-group.forms.21` Given a group `form="<id>"` prop, then every child input carries that `form` attribute. [react-aria] (candidate)
- [ ] `checkbox-group.forms.22` Given a group whose item values are objects, then form serialization uses bracket paths, e.g. `test[0][name]` for the first item's `name` field. [reka] (candidate)

### SSR and hydration

- [ ] `checkbox-group.ssr.1` Given a group of checkboxes sharing one field, when rendered to a string, then every id present is unique and the count is stable between server and client. [base-ui] (candidate)
- [ ] `checkbox-group.ssr.2` Given a field label over a whole group, then the server markup still has the label's `for` (the suppression runs in a layout effect); after hydration the label loses `for` and the element with `role="group"` gains `aria-labelledby` pointing at it, so the label names the group rather than one checkbox inside it. [base-ui] (candidate)
- [ ] `checkbox-group.ssr.3` Given a `parent` checkbox, when rendered to a string, then it has no `aria-controls` at all, and after hydration `aria-controls` resolves to the exposed children's ids once they register. [base-ui] (candidate)
- [ ] `checkbox-group.ssr.4` Given a per-item field label inside a group, when rendered to a string, then each label's `for` already points at its own item's labelable element: the native button when the checkbox renders as one, otherwise the hidden input rendered as its next element sibling. [base-ui] (candidate)

### Notes and edge cases

- [ ] `checkbox-group.notes.1` Given a child checkbox given a prop that only makes sense on the group (`isSelected`, `defaultSelected`, an emphasis flag), then a console warning names the prop and says to apply it to the group instead. [react-aria] (candidate)
- [ ] `checkbox-group.notes.2` Given `allValues` containing a name that collides with an `Object.prototype` key such as `"constructor"`, then it resolves to nothing and `aria-controls` names only the real children. [base-ui] (candidate)
- [ ] `checkbox-group.notes.3` Given two children sharing one value, then both ids stay in the parent's `aria-controls` while both are mounted, and the survivor keeps its entry when the duplicate unmounts. [base-ui] (candidate)
- [ ] `checkbox-group.notes.4` Given a select-all checkbox over a changing child set, then it reflects and toggles its children as the set changes. [ariakit] (candidate) (chromium-only)

## Sources

- `docs/research/apg-and-axe.md`, section `checkbox` (APG checkbox and mixed-checkbox patterns, the APG test assertions, the WHATWG HTML form-control and checkbox-state rules, and the axe rule set).
- `docs/research/ariakit-and-headlessui.md`, section `checkbox`.
- `docs/research/kobalte-and-corvu.md`, section `checkbox` (kobalte only; corvu ships no checkbox).
- `docs/research/radix-and-base-ui.md`, sections `checkbox` and `checkbox-group`.
- `docs/research/react-aria-a.md`, sections `checkbox` and `checkbox-group`.
- `docs/research/reka-melt-bits.md`, section `checkbox` (plus the melt hidden-input bullets that live there).
- `docs/research/zag-and-ark.md`, section `checkbox`.

## Deferred

- Form-associated custom elements (`attachInternals`, `setFormValue`, `setValidity`, `formStateRestoreCallback`): `checkbox.forms.13` records the contract, but a first implementation uses a hidden native input instead, so nothing in the suite exercises it.
- `uncheckedValue` (`checkbox.forms.32`): one library only and a deliberate departure from native submission, so it waits until the divergence is decided.
- Visual and animation-timing assertions (focus-ring geometry, `@visual` snapshots): the suite has no screenshot harness.
- Per-library styling hooks that are not state (default class names such as `react-aria-Checkbox`, `data-scope` / `data-part` pairs, `describeConformance` prop-spreading and ref-forwarding suites): adapter concerns that belong in `packages/core` and `packages/solid` unit tests, not the conformance suite.
- React 17 `useId`-less id fallback (`checkbox.ssr.2` as written for that runtime): our adapter has no equivalent runtime, so only the general "ids appear at hydration" shape is kept.
- Object-valued group items and their bracket-path serialization (`checkbox-group.forms.21`): needs a value-serialization design first.
