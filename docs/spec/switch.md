# switch

A strictly binary on/off switch. Much of its labelling and form contract is the
shared one in `field.md`; only the differences are spelled out here.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## switch

### Roles and attributes

- [ ] `switch.roles.1` Given a switch, then it has `role="switch"`. [apg, headlessui, radix, base-ui, kobalte, react-aria, zag, reka, melt, bits]
- [ ] `switch.roles.2` Given a switch that is on, then `aria-checked` is `"true"`; when off, `"false"`. [apg, axe, headlessui, radix, base-ui, melt, bits]
- [ ] `switch.roles.3` Given a switch built on `input[type="checkbox"]`, then it uses the native `checked` attribute instead of `aria-checked`, and no explicit `aria-checked` management is needed. [apg, axe, kobalte, zag]
- [ ] `switch.roles.4` Given a switch, then `aria-checked` never takes the value `mixed`: a switch is strictly binary, unlike checkbox and toggle button. [apg, zag]
- [ ] `switch.roles.5` Given a switch, then it has an accessible label from exactly one of: visible text content inside the switch element, a visible label referenced by `aria-labelledby`, or `aria-label`; axe additionally accepts `title`, at serious impact. [apg, axe, headlessui, kobalte, react-aria, base-ui, zag]
- [ ] `switch.roles.6` Given a switch, then its label does not change when its state changes. [apg]
- [ ] `switch.roles.7` Given a switch whose visual design shows literal "on" and "off" text inside the control, then those text nodes carry `aria-hidden="true"` so they do not duplicate the state already conveyed by `aria-checked`. [apg]
- [ ] `switch.roles.8` Given a switch built from a non-native element, then it carries `tabindex="0"`; given one built on a native `button`, then no `tabindex` is needed and the role goes on the `button` itself. [apg, headlessui]
- [ ] `switch.roles.9` Given `role="switch"`, then `aria-checked` is a required attribute, so omitting it fails at critical impact; a native `input[type="checkbox"][role="switch"]` relies on native checkedness instead, which is why the APG checkbox-based example sets no `aria-checked`. [axe, apg]
- [ ] `switch.roles.10` Given `role="switch"` in the axe role table, then its superclass is `checkbox`, its role-specific allowed attributes are `aria-expanded`, `aria-readonly` and `aria-required`, a name is required, the name may come from content, and children are presentational, so it must not contain a focusable widget-role descendant. [axe, apg]
- [ ] `switch.roles.11` Given `role="switch"` on a `div`, then `aria-allowed-role` checks whether the host element supports the role at minor impact, and `focus-order-semantics` is satisfied because `switch` is a widget-type role. [axe]
- [ ] `switch.roles.12` Given a native `input[type="checkbox"][role="switch"]`, then the `label`, `label-title-only` and `form-field-multiple-labels` rules apply as for any native checkbox. [axe]
- [ ] `switch.roles.13` Given any element with a `role`, then the role is valid, non-abstract, widely supported and not deprecated, every `aria-*` name and value on it is valid and allowed for that role and host element, all required attributes are present, `aria-label` / `aria-labelledby` are absent on roles that prohibit them, every referenced id is unique, no `tabindex` exceeds 0, and nothing focusable sits inside `aria-hidden="true"`. [axe]
- [ ] `switch.roles.14` Given a clickable control, then its touch target is at least 24 by 24 CSS pixels or leaves sufficient space from its neighbors (WCAG 2.2 AA, serious); the axe rule ships disabled and must be enabled explicitly. [axe]
- [ ] `switch.roles.15` Given a group of switches with a visible label, then either wrap them in `role="group"` with `aria-labelledby`, or in an HTML `fieldset` whose label is in a `legend`; descriptive static text for the group is referenced with `aria-describedby`. [apg]
- [ ] `switch.roles.16` Given a `readOnly` switch, then it exposes `aria-readonly="true"`; given `required`, `aria-required="true"`; given no such prop, the attribute is absent entirely. [base-ui, kobalte, react-aria, bits]
- [ ] `switch.roles.17` Given an invalid switch, then it exposes `aria-invalid="true"`, and an author `aria-errormessage` survives alongside it rather than being clobbered. [kobalte, base-ui, zag, ark]
- [ ] `switch.roles.18` Given a switch, then each state is mirrored as a data attribute on the root, label, control and thumb: `data-state` valued `checked` or `unchecked`, plus `data-checked`, `data-unchecked`, `data-disabled`, `data-readonly`, `data-required`, `data-invalid`, `data-valid`, `data-active`, `data-hover`, `data-focus` and `data-focus-visible`. There is no indeterminate state. [kobalte, base-ui, zag, bits, reka, melt, react-aria]
- [ ] `switch.roles.19` Given a switch label part, then the control gets `aria-labelledby` pointing at the label id AND the label is a real `label` element whose `for` points at the control id. [kobalte, base-ui, react-aria, zag]
- [ ] `switch.roles.20` Given a switch with an explicit `tabIndex` prop, then a positive value wins, but `-1` is forced back to `0` so the switch stays Tab-reachable. [headlessui] (candidate)
- [ ] `switch.roles.21` Given a switch rendered as its default `button` element, then it gets `type="button"`; given an explicit `type`, then that type survives; given a non-button element or a custom component resolving to a non-button, then no `type` attribute is added. [headlessui] (candidate)
- [ ] `switch.roles.22` Given a switch with no `id`, then the parts derive ids as `<rootId>-input`, `<rootId>-control`, `<rootId>-thumb` and `<rootId>-label`; explicit ids on the root or any part win. [kobalte] (candidate)
- [ ] `switch.roles.23` Given both a visible label and an author `aria-labelledby="foo"`, then `aria-labelledby` is `"foo <labelId>"`; adding `aria-label="bar"` makes it `"foo <labelId> <inputId>"` so the control's own `aria-label` joins the name computation. [kobalte] (candidate)
- [ ] `switch.roles.24` Given an error message part but a valid switch, then `aria-describedby` is absent entirely, so the error is not announced while the field is valid. [kobalte] (candidate)
- [ ] `switch.roles.25` Given a group label part rendered before or after the switch, then it wins over the switch's own text content as the accessible name; a description part before or after the switch supplies `aria-describedby` either way. [headlessui] (candidate)
- [ ] `switch.roles.26` Given a sibling `label[for]` pointing at the switch's own id and no library label part, then the switch derives a fallback `aria-labelledby` from that label, and when the id changes the fallback follows to the newly matching label. [base-ui] (candidate)
- [ ] `switch.roles.27` Given a switch with an explicit `role` prop, then the author role overrides the built-in `role="switch"`. [base-ui] (candidate)
- [ ] `switch.roles.28` Given a switch rendered as a native `button` with an `id`, then the `id` lands on the button rather than on the hidden input, and clicking an external `label[for]` still toggles it. [base-ui] (candidate)
- [ ] `switch.roles.29` Divergence: Given a description part plus an author `aria-describedby="foo"`, then `aria-describedby` is `"<descriptionId> foo"` with the library value first; with an error message while invalid it is `"<errorMessageId> foo"`, and with both, `"<descriptionId> <errorMessageId> foo"`. [kobalte] (decision needed)
- [ ] `switch.roles.30` Divergence: Given a field-level description alongside an author `aria-describedby`, then the exposed switch's `aria-describedby` is `"<author value> <descriptionId>"` with the consumer value first, while the hidden input carries the description id alone. [base-ui] (decision needed)
- [ ] `switch.roles.31` Divergence: Given a headless switch, then the exposed element itself carries `role="switch"` and `aria-checked`, and any hidden input is `aria-hidden="true"` and typed `checkbox` rather than `switch`. [radix, base-ui, headlessui, reka, bits] (decision needed)
- [ ] `switch.roles.32` Divergence: Given a headless switch, then a real `input[type="checkbox"]` with an explicit `role="switch"` carries the semantics and the control and thumb parts are both `aria-hidden="true"`. [kobalte, react-aria, zag, ark, melt] (decision needed)

### Keyboard

- [ ] `switch.keyboard.1` Given focus on a switch, when Space is pressed, then its state changes; pressing Space again changes it back, so `aria-checked` reads `"true"` then `"false"`. [apg, headlessui, base-ui, kobalte, zag, melt, bits, react-aria]
- [ ] `switch.keyboard.2` Given a switch built on `input[type="checkbox"]`, when Space is pressed, then the native `checked` IDL property flips and the implementation does not call `preventDefault` on the key event, because the browser supplies the toggle. [apg]
- [ ] `switch.keyboard.3` Given a group of switches, when Tab is pressed repeatedly, then focus visits each switch in DOM order: switches do not use roving tabindex, and a switch never traps Tab. [apg, headlessui]
- [ ] `switch.keyboard.4` Given a `readOnly` switch, when Space is pressed, then the state does not change and no change callback fires. [kobalte, base-ui, react-aria]
- [ ] `switch.keyboard.5` Given Space pressed and held, then `data-pressed` and the pressed class appear while the key is held and clear on release, and `onPress` / `onClick` each fire once. [react-aria] (candidate)
- [ ] `switch.keyboard.6` Given a switch with a separate control part, when Space is pressed and released on the control rather than the input, then the switch turns on and the change callback receives `true`. [kobalte] (candidate)
- [ ] `switch.keyboard.7` Divergence: Given focus on a switch, when Enter is pressed, then its state changes the same way Space does; the APG marks Enter "(Optional)" for switch and its example handles Enter and Space in one branch. [apg, base-ui, reka, melt, bits] (decision needed)
- [ ] `switch.keyboard.8` Divergence: Given focus on a switch, when Enter is pressed, then the change callback is never called, so Enter does not toggle; instead the enclosing form submits exactly once, with or without a submit button present. [headlessui, react-aria] (decision needed)

### Pointer

- [ ] `switch.pointer.1` Given a switch, when it is clicked, then its state changes exactly as on Space, and a second click returns it. [apg, headlessui, radix, base-ui, kobalte, react-aria, zag, ark, reka, melt, bits]
- [ ] `switch.pointer.2` Given a switch built on `input[type="checkbox"]`, when it is clicked, then the native `checked` IDL property flips with no scripted handler involved. [apg]
- [ ] `switch.pointer.3` Given a switch with an associated label (a wrapping `label`, an explicit `label[for]`, or a label part), when the label is clicked, then the switch toggles and the switch itself becomes the active element; clicking the label again toggles it back while keeping focus on the switch. [headlessui, base-ui, kobalte, zag, ark, react-aria]
- [ ] `switch.pointer.4` Given a `disabled` switch, when it or its label is clicked, then nothing changes and the change callback is never called. [headlessui, base-ui, kobalte, react-aria, zag, ark, melt, bits]
- [ ] `switch.pointer.5` Given a `readOnly` switch, when the switch or its wrapping label is clicked, then the state does not change and no change callback fires; this holds for the uncontrolled path too. [base-ui, kobalte, react-aria]
- [ ] `switch.pointer.6` Given an author `onClick`, then it is composed with the switch's own toggle handler rather than replacing it, and both run. [radix, base-ui]
- [ ] `switch.pointer.7` Given a label part with a `passive` prop, when it is clicked, then the switch does not toggle. [headlessui] (candidate)
- [ ] `switch.pointer.8` Given a non-native label element (no real `label`, `aria-labelledby` only) over a non-native-button switch, when it is clicked, then the switch does not toggle. [base-ui] (candidate)
- [ ] `switch.pointer.9` Given a switch inside a clickable ancestor, when it is clicked once, then the ancestor's handler fires exactly once with no duplicate from the hidden input; calling `stopPropagation()` on the switch's own click stops the ancestor while the switch still toggles. This holds when the switch renders as a native `button` too. [base-ui] (candidate)
- [ ] `switch.pointer.10` Given a switch inside a clickable ancestor inside a form, when `checked` is flipped programmatically, then the ancestor's handler is not called while the form still receives a change event with the new value (radix-ui/primitives#3265); this holds after a click that produced no change too. [radix] (candidate)
- [ ] `switch.pointer.11` Given a switch's hidden input clicked directly, then the exposed switch follows and becomes checked. [base-ui] (candidate)
- [ ] `switch.pointer.12` Given a cancelable `click` whose `preventDefault()` already ran before the framework handled it, when it is dispatched on the hidden input, then no change callback fires and the switch stays off. [base-ui] (candidate)
- [ ] `switch.pointer.13` Given hover on the switch or its label, then `data-hovered` and the hover class toggle and each hover callback fires the expected number of times; on press, `data-pressed` toggles across the press and `onPress` / `onClick` / `onClickCapture` each fire once. [react-aria] (candidate)

### Focus management

- [ ] `switch.focus.1` Given a `disabled` switch, then it is not a focusable area at all: `focus()` does not give it focus, and clicking its label does not focus it or set `data-focus`. [html, melt, zag]
- [ ] `switch.focus.2` Given a switch whose semantics live on a hidden native input, then that input has `tabindex="-1"` where the exposed root is the tab stop, or is itself the tab stop with the control part carrying `data-focus` when focused. [zag, bits]
- [ ] `switch.focus.3` Given a blur listener on the control, when its label is clicked three times, then zero blur events fire, so label clicks never move focus off the control. [zag] (candidate)
- [ ] `switch.focus.4` Given Tab onto and then away from a switch, then it gains `data-focus-visible` and the focus class while keyboard-focused and loses both once focus moves on; `onFocus` / `onFocusChange(true)` fire once on entry and `onBlur` / `onFocusChange(false)` once on exit. [react-aria] (candidate)
- [ ] `switch.focus.5` Given `excludeFromTabOrder`, then the control has `tabIndex="-1"`. [react-aria] (candidate)
- [ ] `switch.focus.6` Given a switch inside a field, then it gains `data-focused` on focus and loses it on blur, and never gains it while disabled. [base-ui] (candidate)

### State

- [ ] `switch.state.1` Given two switches in one group, then toggling one does not change the other: switches are independent, unlike radios. [apg]
- [ ] `switch.state.2` Given an uncontrolled switch, when it is mounted, then no change callback fires; when it is clicked, then it turns on with the callback receiving `true`, and clicking again turns it off with `false`. [kobalte, base-ui, headlessui, react-aria, bits, ark]
- [ ] `switch.state.3` Given `defaultChecked` / `defaultSelected`, then the switch renders on; when clicked, then it turns off and the change callback receives `false`. [kobalte, base-ui, headlessui, react-aria, melt]
- [ ] `switch.state.4` Given a fixed controlled `checked` prop, when the switch is clicked, then its rendered state stays on the prop and never drifts, while the change callback still receives the requested opposite value. [kobalte, base-ui, react-aria, headlessui]
- [ ] `switch.state.5` Given a controlled switch whose value is changed from outside, then `aria-checked` and the hidden input follow the external state. [base-ui, bits, melt]
- [ ] `switch.state.6` Given a switch rendered through a render prop or `as` element, then the child receives the current `checked` value so the rendered text can track the state. [headlessui, react-aria]
- [ ] `switch.state.7` Given a change callback that cancels the event, then nothing commits: `aria-checked` stays as it was, the hidden input's `checked` stays as it was, and the field gains neither `data-dirty` nor `data-filled`, whether the cancel came from a root click or a hidden-input click. [base-ui] (candidate)
- [ ] `switch.state.8` Given a change callback whose return value is `false`, then the state does not advance, so the callback's return value decides the next state. [melt] (candidate)
- [ ] `switch.state.9` Given a switch activated while Shift is held, then the change callback fires once and its event details expose `shiftKey === true`. [base-ui] (candidate)
- [ ] `switch.state.10` Given both a `defaultChecked` and a controlled `checked` source, then the controlled source wins. [melt] (candidate)

### Forms

- [ ] `switch.forms.1` Given a control that mimics a native form control without using one, then form association, constraint validation, disabled semantics, form reset and `:user-invalid` all follow the same HTML rules recorded for checkbox: see `checkbox.forms.3`, `checkbox.forms.5` through `checkbox.forms.13`. [html]
- [ ] `switch.forms.2` Given a switch with a `name` and no `value`, then the submitted value defaults to `"on"`; given a `value`, then that value is submitted. [kobalte, bits, headlessui, react-aria]
- [ ] `switch.forms.3` Given a switch inside a form, when it is submitted while off then the field is absent from the `FormData`, and while on it carries `"on"` or the custom `value`; this matches a native checkbox exactly. [base-ui, headlessui, reka, bits]
- [ ] `switch.forms.4` Given a `disabled` switch, when the form is submitted, then it contributes no entry at all. [headlessui, base-ui, kobalte, zag]
- [ ] `switch.forms.5` Given a switch with a `form="<id>"` attribute pointing at a form it is not nested in, when that form is submitted or reset, then the switch participates in that form instead of the enclosing one. [headlessui, radix, base-ui, react-aria]
- [ ] `switch.forms.6` Given the hidden input that backs a non-native switch, then it is rendered outside the interactive control rather than nested inside it, so `button input` matches nothing, and the `name` and `value` attributes land only on the input, never on the element with `role="switch"`. [reka, base-ui]
- [ ] `switch.forms.7` Given a switch toggled by the user and then a form reset, then the switch reverts to its `defaultChecked` state, and a controlled switch reverts to its initial `checked` value. [radix, headlessui, react-aria]
- [ ] `switch.forms.8` Given `required` with native validation, when the form is submitted while the switch is off, then native validation fires, the `valueMissing` error renders (absent before submit), and `aria-invalid="true"` appears on the switch and its field; turning the switch on clears every marker, and turning it off restores them. [base-ui, react-aria]
- [ ] `switch.forms.9` Given a switch inside a field, then `disabled`, `required`, `invalid` and `name` set on the field propagate to the switch, and the field's helper text renders while its error text renders only while the field is invalid. [base-ui, zag, ark]
- [ ] `switch.forms.10` Given a `required` switch whose failed submit produced an error, then the switch gains `aria-describedby` referencing a "Constraints not satisfied" message, cleared once the switch is turned on. [react-aria] (candidate)
- [ ] `switch.forms.11` Given a switch with a custom `validate` function, then `validationMode="onChange"` calls it exactly once per user change with the new value and marks `aria-invalid` immediately, `onBlur` defers until blur, and the default `onSubmit` defers until submit; a controlled value changed externally triggers one additional validation. [base-ui] (candidate)
- [ ] `switch.forms.12` Given a field with server-supplied errors, then the switch starts `aria-invalid="true"` with the error rendered, and clicking it removes `aria-invalid` and unmounts the error. [base-ui] (candidate)
- [ ] `switch.forms.13` Given a switch inside a field, then the field exposes `data-touched` after focus then blur, `data-dirty` once the value differs from its default, and `data-filled` while on, cleared when the switch is turned off or when a controlled switch remounts off. [base-ui] (candidate)
- [ ] `switch.forms.14` Given a React 19 form action driving `defaultChecked` through `useActionState`, when the action runs, then the switch re-renders to the updated `defaultChecked`. [react-aria] (candidate)
- [ ] `switch.forms.15` Given a switch whose state is library-managed rather than living on a native input, then a native `type="reset"` button does not clear it, so form reset has to be handled explicitly. [base-ui] (candidate)
- [ ] `switch.forms.16` Divergence: Given a switch with an `uncheckedValue`, when the form is submitted while off, then the named field is submitted with that value (`"off"`, `"false"`, whatever is given) rather than being omitted, across a full off/on/off cycle and alongside a custom `value`; a disabled switch still contributes nothing. [base-ui] (decision needed) (browser-only)
- [ ] `switch.forms.17` Divergence: Given a switch that is off, when the form is submitted, then no entry is contributed under any circumstance, matching native HTML. [html, headlessui, reka, bits, react-aria] (decision needed)
- [ ] `switch.forms.18` Divergence: Given a switch with no `name` prop, then no hidden input is rendered at all. [bits] (decision needed)
- [ ] `switch.forms.19` Divergence: Given a switch, then the hidden input is always rendered so the control can participate in a form and in label resolution regardless of whether a `name` was supplied. [base-ui, radix, reka, kobalte] (decision needed)

### Animation and presence

- [ ] `switch.animation.1` Given a thumb part, then it is always mounted: there is no presence gate and no `forceMount`, unlike a checkbox indicator, so the thumb is animated by CSS from `data-state` alone. [kobalte, base-ui, radix, zag, reka, bits]

### SSR and hydration

- [ ] `switch.ssr.1` Given a switch server-rendered through an SSR harness, then it renders without errors. [react-aria] (candidate)

### Accessibility tooling

- [ ] `switch.a11y.1` Given a switch, standalone and inside a form, when audited with axe, then there are no violations. [reka, melt, zag, ark]
- [ ] `switch.a11y.2` Given a headless switch audited with axe, then the audit may need the `label` and `nested-interactive` rules disabled; a suite that needs those exemptions is recording a real gap in the markup. [reka] (candidate)

### Notes and edge cases

- [ ] `switch.notes.1` Given a binary choice whose natural wording is on and off, then `switch` produces better screen reader output than `checkbox` ("Lights switch on" rather than "Lights checkbox checked"); given a checklist framing, `checkbox` reads better. [apg]
- [ ] `switch.notes.2` Given a switch built on `input[type="checkbox"]` with `role="switch"`, then no explicit `aria-checked` management is needed and the APG example ships no keydown handler at all, only a focus class toggle. [apg]
- [ ] `switch.notes.3` Given a ref callback that focuses, blurs and clicks the switch before the hidden input has mounted, then nothing throws and the switch stays off; a ref callback that returns a cleanup function has that cleanup invoked on unmount. [base-ui, radix]
- [ ] `switch.notes.4` Given a thumb part rendered with no enclosing switch root, then it throws a descriptive error naming the missing context rather than rendering. [base-ui] (candidate)
- [ ] `switch.notes.5` Given a bare controlled switch with a change handler, then it renders without throwing. [headlessui] (candidate)
- [ ] `switch.notes.6` Given the switch's label and description merge rules and its `data-*` mirroring, then they are the same shared form-control contract as checkbox's, so the suite should express them once as a reusable field battery and run it against every field component rather than duplicating them per component. See the `field` spec's controlled/uncontrolled parity and labelling sections. [kobalte] (candidate)
- [ ] `switch.notes.7` Given an adapter whose DOM property writes land on the microtask queue, then a test must await one microtask after each click or Space press before asserting `checked` or a change spy; `fireEvent.click` on a natively disabled input still dispatches in jsdom, so disabled behavior has to be driven through the label or a real user-event click. [kobalte] (candidate)
- [ ] `switch.notes.8` Given passthrough `data-*` props, then they land on the outer element rather than on the hidden input. [react-aria] (candidate)

## Sources

- `docs/research/apg-and-axe.md`, section `switch` (the APG switch pattern, its three example variants including the `input[type="checkbox"]` one, the WHATWG HTML form-control rules, and the axe rule set).
- `docs/research/ariakit-and-headlessui.md`, section `switch` (headlessui only; ariakit has no switch section).
- `docs/research/kobalte-and-corvu.md`, section `switch` (kobalte only; corvu ships no switch).
- `docs/research/radix-and-base-ui.md`, section `switch` (covering `Switch.Root`, `Switch.Thumb` and the bubble input).
- `docs/research/react-aria-a.md`, section `switch`.
- `docs/research/reka-melt-bits.md`, section `switch`.
- `docs/research/zag-and-ark.md`, section `switch`.

## Deferred

- `uncheckedValue` (`switch.forms.15`): one library only and a deliberate departure from native submission, so it waits until the divergence is decided.
- Form-associated custom elements: recorded once in the checkbox spec (`checkbox.forms.13`) and out of scope while the implementation uses a hidden native input.
- Hover-style assertions (`should be possible to hover the label and trigger a hover on the switch`): skipped upstream too, because jsdom cannot resolve `:hover` styles; it needs a real browser and a computed-style check.
- Per-library styling hooks that are not state (default class names, `data-scope` / `data-part` pairs, `describeConformance` prop-spreading and ref-forwarding suites, `inputRef` contracts): adapter concerns for `packages/core` and `packages/solid` unit tests.
- Switch groups (`switch.roles.30`): the APG documents the `role="group"` / `fieldset` wrapper, but no library ships a switch-group component, so it belongs to the `field` and `fieldset` layer.
