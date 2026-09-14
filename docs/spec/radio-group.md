# radio-group

A radio group, its radio items, and the segmented control built on the same
machine.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## radio-group

### Roles and attributes

- [ ] `radio-group.roles.1` Given a set of radio buttons, then they are contained in or owned by an element with `role="radiogroup"`. [apg, radix, base-ui, headlessui, kobalte, react-aria, zag, reka, bits]
- [ ] `radio-group.roles.2` Given a radiogroup, then it has a visible label referenced by `aria-labelledby`, or a label from `aria-label`. [apg, headlessui, kobalte, react-aria, zag, base-ui]
- [ ] `radio-group.roles.3` Given additional descriptive elements for the group, then the `radiogroup` references them with `aria-describedby`. [apg, kobalte, react-aria, base-ui]
- [ ] `radio-group.roles.4` Given `role="radiogroup"` in the axe role table, then it is a composite role whose allowed attributes are `aria-readonly`, `aria-required`, `aria-activedescendant`, `aria-expanded` and `aria-orientation`, it has no required owned elements, and `accessibleNameRequired` is false, which axe marks as a deliberate spec difference. [axe]
- [ ] `radio-group.roles.5` Given a radio group on `div` or `span` elements with `tabindex="0"`, then `radio` is a widget-type role and `radiogroup` a composite-type role, so both satisfy `focus-order-semantics`. [axe]
- [ ] `radio-group.roles.6` Given a group with no `orientation` prop, then the root carries `aria-orientation="vertical"`; given `orientation="horizontal"`, then it carries `aria-orientation="horizontal"`. [kobalte, react-aria, zag]
- [ ] `radio-group.roles.7` Given a `disabled` group, then the root carries `aria-disabled="true"` and every radio is disabled; given no `disabled` prop or an explicit `disabled={false}`, then the root has no `aria-disabled` at all rather than `aria-disabled="false"`. [kobalte, base-ui, react-aria, headlessui, ariakit, zag, reka, bits]
- [ ] `radio-group.roles.8` Given a `readOnly` group, then the root carries `aria-readonly="true"`; given no `readOnly`, then the attribute is absent. [kobalte, base-ui, react-aria, zag, bits]
- [ ] `radio-group.roles.9` Given an invalid group, then the root carries `aria-invalid="true"`, and an author `aria-errormessage` is passed through alongside it rather than clobbered. [kobalte, react-aria, base-ui, zag]
- [ ] `radio-group.roles.10` Given a group with a validation, required, disabled or readonly state, then `data-valid`, `data-invalid`, `data-required`, `data-disabled` and `data-readonly` appear on the root accordingly, and none of them is present on a plain group. [kobalte, base-ui, zag, bits]
- [ ] `radio-group.roles.11` Given a group label part, then the root gets `aria-labelledby` pointing at the label's id, and that label is a plain element with no `for` attribute, because a group label names a container rather than a control. [kobalte, zag]
- [ ] `radio-group.roles.12` Given a group and its items, then every part carries `data-scope` / `data-part` or a per-part data attribute (`data-radio-group-root`, `data-radio-group-item`), plus `data-orientation` and `dir` on the root. [zag, bits]
- [ ] `radio-group.roles.13` Given a group `id`, then it is forwarded to the element with `role="radiogroup"`. [base-ui] (candidate)
- [ ] `radio-group.roles.14` Given a group with an explicit `role` prop, then the author role overrides the built-in `role="radiogroup"`. [base-ui] (candidate)
- [ ] `radio-group.roles.15` Given a group with a `value` prop, then no `value` attribute is spread onto the root element. [base-ui] (candidate)
- [ ] `radio-group.roles.16` Given both a group label and an author `aria-labelledby="foo"`, then `aria-labelledby` is `"foo <labelId>"`; given a group label plus `aria-label="bar"` plus `aria-labelledby="foo"`, then it becomes `"foo <labelId> <rootId>"` so the root's own `aria-label` joins the name computation. [kobalte] (candidate)
- [ ] `radio-group.roles.17` Given a group description plus an author `aria-describedby="foo"`, then the root's `aria-describedby` is `"<descriptionId> foo"`; given an error message while invalid, `"<errorMessageId> foo"`; given both a description and an error message while invalid, `"<descriptionId> <errorMessageId> foo"`. Given an error message part but a valid group, then the root has no `aria-describedby` at all. [kobalte] (candidate)
- [ ] `radio-group.roles.18` Given a group rendered as a fieldset with a legend, then `aria-labelledby` follows the precedence explicit `aria-labelledby` > field label > fieldset legend, updates to a replacement's id, falls back to the remaining source, and is removed entirely when no source is mounted, never retaining a replaced or unmounted id. [base-ui] (candidate)

### Keyboard

- [ ] `radio-group.keyboard.1` Given a radio group not inside a toolbar with a checked radio, when Tab or Shift+Tab moves focus into the group, then focus lands on the checked radio; given no radio is checked, then focus lands on the first radio. [apg, ariakit, headlessui, base-ui, zag, bits]
- [ ] `radio-group.keyboard.2` Given focus on an unchecked radio, when Space is pressed, then that radio becomes checked; given focus on an already-checked radio, when Space is pressed, then nothing changes and the change callback does not fire again. [apg, headlessui, ariakit, kobalte, zag, base-ui, bits]
- [ ] `radio-group.keyboard.3` Given focus on a radio in a group not inside a toolbar, when Right Arrow or Down Arrow is pressed, then focus moves to the next radio, the previously focused radio is unchecked and the newly focused one is checked; Left Arrow and Up Arrow do the same backwards. Selection always follows focus, so a test asserts focus position and `aria-checked` together after every arrow press. [apg, ariakit, headlessui, radix, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `radio-group.keyboard.4` Given focus on the last radio, when Right Arrow or Down Arrow is pressed, then focus wraps to the first radio and checks it; given focus on the first radio, when Left Arrow or Up Arrow is pressed, then focus wraps to the last radio and checks it. [apg, ariakit, headlessui, base-ui, react-aria, melt, bits]
- [ ] `radio-group.keyboard.5` Given a radio group nested inside a toolbar, when an arrow key moves focus among its radios, then the checked radio does not change, because users must traverse every toolbar element without altering selection; Space then unchecks the currently checked radio and checks the focused one, and Enter may do the same. [apg]
- [ ] `radio-group.keyboard.6` Given a radio group in a toolbar, when Right Arrow is pressed on the last radio of the group, then focus leaves the group for the next toolbar element, wrapping to the first toolbar element when that radio is also the last toolbar element; Left Arrow mirrors this from the first radio. Down Arrow and Up Arrow may instead stay inside the group, wrapping within it. [apg]
- [ ] `radio-group.keyboard.7` Given a group implemented with `aria-activedescendant`, then the `radiogroup` has `tabindex="0"` and the radios are not tab stops, the group already carries `aria-activedescendant` on load pointing at the radio that will be active, and an arrow key leaves DOM focus on the group while moving `aria-activedescendant` and checking the newly active radio. [apg]
- [ ] `radio-group.keyboard.8` Given a group in an RTL locale, then Left Arrow and Right Arrow swap meaning (Left Arrow is the "next" key) while Up Arrow and Down Arrow stay direction-independent regardless of orientation. [base-ui, react-aria] (browser-only)
- [ ] `radio-group.keyboard.9` Given a group with disabled items, when arrow keys move focus, then each disabled radio is skipped and wrapping happens between the enabled radios only, including runs of two or more adjacent disabled radios. [react-aria, reka, melt, bits]
- [ ] `radio-group.keyboard.10` Given Tab pressed while focus is inside the group, then focus leaves the group entirely rather than moving to the next radio, and Shift+Tab back into the group lands on the last highlighted radio; this holds inside a modal dialog too. [react-aria, headlessui, base-ui]
- [ ] `radio-group.keyboard.11` Given an arrow key pressed with a modifier held (`metaKey`, `ctrlKey`, `altKey`), or pressed when the focused radio is the only navigable one, then focus stays put and nothing is selected; a later refocus of that radio still does not select it. [base-ui] (candidate)
- [ ] `radio-group.keyboard.12` Given an arrow key pressed while Shift is held, then focus moves normally: Shift does not suppress arrow navigation. [base-ui] (candidate) (browser-only)
- [ ] `radio-group.keyboard.13` Given a held-down arrow key producing repeat keydown events, then the selection advances once per repeat rather than once per physical press. [react-aria] (candidate)
- [ ] `radio-group.keyboard.14` Given `loop: false`, when Up Arrow or Left Arrow is pressed on the first radio, or Down Arrow or Right Arrow on the last, then focus stays put. [bits] (candidate)
- [ ] `radio-group.keyboard.15` Divergence: Given a focused radio, when Enter is pressed, then nothing is selected, and a consumer `onKeyDown` handler on the item still fires exactly once. [radix, base-ui] (decision needed)
- [ ] `radio-group.keyboard.16` Divergence: Given a focused radio inside a form with a value selected, when Enter is pressed, then the form submits once by implicit submission, with or without a submit button present. [headlessui, react-aria] (decision needed)

### Pointer

- [ ] `radio-group.pointer.1` Given a radio group, when a radio is clicked, then it becomes checked, every sibling becomes unchecked, and the roving `tabindex="0"` moves to the clicked radio so a later Tab lands there. [apg, ariakit, headlessui, radix, base-ui, kobalte, react-aria, zag, ark, reka, melt, bits]
- [ ] `radio-group.pointer.2` Given a radio activation whose `click` default action is prevented, then the previously checked radio is restored, or this radio is set to false if that radio is gone. [html]
- [ ] `radio-group.pointer.3` Given a checked radio, when it is clicked again, then it stays checked and no change event fires: radios never untoggle. [radix, reka, headlessui, ariakit]
- [ ] `radio-group.pointer.4` Given an item label (implicit wrapping `label` or explicit `label[for]`), when the label text is clicked, then the matching radio is selected and the change callback fires once with its value. [base-ui, kobalte, react-aria, ark, bits]
- [ ] `radio-group.pointer.5` Given a `disabled` group, when any radio or its label is clicked, then nothing becomes checked and the change callback never fires. [radix, base-ui, kobalte, react-aria, headlessui, reka, bits]
- [ ] `radio-group.pointer.6` Given one `disabled` item in an enabled group, when the disabled item is clicked, then nothing changes and no callback fires; when an enabled item is clicked, then it is selected normally, so one disabled item does not poison the group. [radix, kobalte, react-aria, headlessui, ark, bits]
- [ ] `radio-group.pointer.7` Given a `readOnly` group, when a radio, its label or Space is used, then nothing becomes checked, the internal state does not move, and no callback fires. [kobalte, react-aria, bits]
- [ ] `radio-group.pointer.8` Given a radio inside a clickable ancestor, when it is clicked once, then the ancestor's handler fires exactly once (the hidden input's synthetic click must not double-fire), and calling `stopPropagation()` on the radio's own click stops the ancestor while still selecting the radio. [base-ui, radix]
- [ ] `radio-group.pointer.9` Given a radio inside a clickable ancestor, when the controlled value is changed programmatically, then the ancestor's click handler is not called while the form still receives a change event with the new value (radix-ui/primitives#3265); this holds after a click that produced no change too. [radix] (candidate)
- [ ] `radio-group.pointer.10` Given each item wrapped in a container that programmatically clicks its own item through a ref, when the wrapper of an unchecked radio is clicked, then deselecting the previously checked radio does not bubble a click that re-selects it (radix-ui/primitives#1982). [radix] (candidate)
- [ ] `radio-group.pointer.11` Given keyboard selection through an arrow key, then no click is synthesized that bubbles to an ancestor handler. [base-ui] (candidate)
- [ ] `radio-group.pointer.12` Given hover on a radio's label, then `data-hovered` and the hover class toggle and each hover callback fires the expected number of times; on press, `data-pressed` toggles across the press and `onPress` / `onClick` / `onClickCapture` each fire once, by mouse and by Space alike. [react-aria] (candidate)

### Focus management

- [ ] `radio-group.focus.1` Given a radio group with roving tabindex, then exactly one radio has `tabindex="0"` and every other has `tabindex="-1"` at any moment, and the tab stop follows pointer selection as well as keyboard selection. [apg, base-ui, headlessui, react-aria]
- [ ] `radio-group.focus.2` Given a group implemented with `aria-activedescendant`, then the tab stop stays on the `radiogroup` element regardless of which radio is active, and the implementation scrolls a newly active off-screen radio into view itself because the user agent will not, DOM focus having not moved. [apg]
- [ ] `radio-group.focus.3` Given an element with a negative `tabindex`, then the user agent treats it as a focusable area but omits it from tabindex-ordered focus navigation, so `tabindex="-1"` is programmatically and click focusable but not Tab-reachable; `tabindex="0"` is included at the element's DOM position; positive values all come first ordered ascending and must never be emitted by a headless library. [html, axe]
- [ ] `radio-group.focus.4` Given "focusable", "Tab-reachable" and "click-focusable", then they are three separate properties: an element can be focusable without being either of the others, and a focusable area additionally requires that it is not actually disabled, not inert, and is being rendered. [html]
- [ ] `radio-group.focus.5` Given `element.focus(options)`, then `preventScroll` defaults to false, so scrolling into view is the default and must be suppressed explicitly; `element.blur()` may do nothing at all, so it must not be relied on to move focus anywhere in particular. [html]
- [ ] `radio-group.focus.6` Given the focusing steps, then they return early when the target's DOM anchor is inert, no-op when the target is already focused, and otherwise fire `blur` on the old chain and `focus` on the new chain with `relatedTarget` set. [html]
- [ ] `radio-group.focus.7` Given a shadow host whose shadow root has `delegatesFocus: true`, then the focusable area is its focus delegate: the first descendant with `autofocus`, otherwise the first focusable area in tree order, recursing into further delegating hosts, otherwise null. Each Document, shadow host, slot and popover trigger owns its own tabindex-ordered focus navigation scope, and Tab traversal walks the flattened recursive composition of those scopes. [html]
- [ ] `radio-group.focus.8` Given a group with a default value, when it first renders, then only the checked radio has `tabindex="0"`. [base-ui, headlessui]
- [ ] `radio-group.focus.9` Given a radio focused programmatically with no arrow key involved, then it stays unchecked: focus alone never selects. [radix, base-ui, headlessui, bits]
- [ ] `radio-group.focus.10` Given focus moved into the group by Tab or Shift+Tab, then no change callback fires. [headlessui, ariakit, bits]
- [ ] `radio-group.focus.11` Given focus left the group and returned, then it lands on the checked radio again, and no additional change event fires on the way back. [ariakit, bits, base-ui, react-aria]
- [ ] `radio-group.focus.12` Given a controlled group whose value is changed programmatically from outside, then the roving `tabindex="0"` moves to the newly selected radio. [react-aria, base-ui]
- [ ] `radio-group.focus.13` Given a `disabled` group, when the page is tabbed, then no radio receives focus. [zag, kobalte]
- [ ] `radio-group.focus.14` Given focus arrived by keyboard, then the focused item carries both `data-focus` and `data-focus-visible`; given focus arrived by mouse click, then it carries `data-focus` only, and `data-focus-visible` appears once arrow keys are used. [zag, react-aria]
- [ ] `radio-group.focus.15` Given a radio with `autoFocus`, then only that radio ends with `tabindex="0"`. [react-aria] (candidate)
- [ ] `radio-group.focus.16` Given the highlighted radio is unmounted, then the tab stop returns to the checked radio. [base-ui] (candidate)
- [ ] `radio-group.focus.17` Given a group whose item order changes by unmount and remount, then arrow navigation follows DOM order rather than mount order. [headlessui] (candidate)
- [ ] `radio-group.focus.18` Given a radio containing a focusable non-radio descendant, when arrow keys move focus, then focus moves directly between the radio elements and skips the embedded content. [react-aria] (candidate)
- [ ] `radio-group.focus.19` Given a `readOnly` group, then every radio stays focusable and arrow keys still move focus, only selection is blocked. [bits] (candidate)
- [ ] `radio-group.focus.20` Given focus handlers on the group, then `onFocus` / `onFocusChange(true)` fire once when focus enters and not again as arrows move focus inside, and `onBlur` / `onFocusChange(false)` fire once when focus leaves; two clicks on one radio's label fire `onFocus` once with no `onBlur` between them, while clicking a second radio fires the first radio's `onBlur` and the second's `onFocus`. [react-aria] (candidate)
- [ ] `radio-group.focus.21` Given a group inside a popover or dialog whose content auto-focuses on open, then the selected radio takes focus and the value does not change. [bits] (candidate)

### State

- [ ] `radio-group.state.1` Given a radio group, then at most one radio reads `aria-checked="true"` at any time and every other radio in the same group reads `"false"`. [apg, radix, base-ui, react-aria, kobalte, reka, bits]
- [ ] `radio-group.state.2` Given two radio groups on one page, then checking a radio in one does not change any radio in the other. [apg, ariakit]
- [ ] `radio-group.state.3` Given a group that starts with nothing checked, then every radio reads `aria-checked="false"` on load: an empty initial selection is a valid state. [apg, radix, kobalte, react-aria, melt, headlessui]
- [ ] `radio-group.state.4` Given a radio whose checkedness becomes true, then every other radio in the same group is set to false, re-enforced whenever the radio's `name` is set, changed or removed, its form owner changes, a type change is signalled, or it becomes connected. [html]
- [ ] `radio-group.state.5` Given `defaultValue`, then only the matching radio is checked and no change callback fires on mount; when a different radio is then selected, then the selection moves and the callback fires once with the new value. [kobalte, radix, base-ui, react-aria, headlessui, bits]
- [ ] `radio-group.state.6` Given a fixed controlled `value`, when a different radio is clicked, then the change callback fires once with the requested value but the checked radio does not move. [kobalte, radix, base-ui, react-aria, headlessui]
- [ ] `radio-group.state.7` Given a controlled group whose value is set to `null`, then every radio becomes unchecked and every indicator is removed; selecting a radio afterwards works normally. [radix, base-ui]
- [ ] `radio-group.state.8` Given an uncontrolled group with a change handler and no value prop, when radios are clicked in turn, then the handler is called with each new value and the internal state follows. [headlessui, base-ui, bits, melt]
- [ ] `radio-group.state.9` Given a change callback that cancels the event, then nothing commits: the radio stays unchecked, its hidden input stays unchecked, and the field gains none of `data-touched`, `data-dirty` or `data-filled`, whether the cancel came from a root click, a hidden-input click or arrow-key navigation. [base-ui] (candidate)
- [ ] `radio-group.state.10` Given a change callback that is reported with event details, then the details expose the originating event's keyboard modifiers, so a Shift-held click reports `shiftKey === true`. [base-ui] (candidate)
- [ ] `radio-group.state.11` Given a group whose item values are objects and no comparison override, then comparison is object identity; given a `by` field name or a comparator function, then a structurally equal copy matches, and a `null` value matches nothing without throwing. [headlessui] (candidate)
- [ ] `radio-group.state.12` Given a group with no default value, then the exposed value is `undefined` rather than an empty string. [melt] (candidate)

### Forms

- [ ] `radio-group.forms.1` Given the native radio group definition, then two radios are in the same group only when both are `type="radio"`, they share a form owner or both have none, they are in the same tree, and both have non-empty equal `name` attributes; a headless radio group reimplements all four conditions itself. [html]
- [ ] `radio-group.forms.2` Given any radio in a group marked required and every radio in that group unchecked, then the element is suffering from being missing: requiredness is evaluated group-wide, not per radio. [html, radix, base-ui, react-aria]
- [ ] `radio-group.forms.3` Given a control that mimics a native form control without using one, then form association, constraint validation, disabled semantics, form reset and `:user-invalid` all follow the same HTML rules recorded for checkbox: see `checkbox.forms.3`, `checkbox.forms.5` through `checkbox.forms.13`. [html]
- [ ] `radio-group.forms.4` Given a group with no `name` prop, then every radio input shares one generated `name` so they form a single native radio group; given a `name`, then every radio input carries it. [kobalte, base-ui, react-aria, ariakit]
- [ ] `radio-group.forms.5` Given each item carries a `value`, then each radio input's `value` is that item's value, and the value prop itself is not spread onto the exposed element. [kobalte, base-ui, react-aria]
- [ ] `radio-group.forms.6` Given a group with nothing selected inside a form, when the form is submitted, then `FormData.get(name)` is `null`, matching native radio behavior; given a selection, then it is that radio's value. [base-ui, headlessui, reka, bits]
- [ ] `radio-group.forms.7` Given an uncontrolled group with a `defaultValue` inside a form with a reset button, when another radio is selected and the form is reset, then the `defaultValue` selection is restored; with no `defaultValue`, then every radio returns to unchecked; a controlled group returns to its initial value. [radix, headlessui, react-aria]
- [ ] `radio-group.forms.8` Given a group associated to an outside form through `form="<id>"`, then resetting and submitting that external form drives the group, and the group's entry appears in that form's data rather than the enclosing one. [radix, headlessui, base-ui, react-aria]
- [ ] `radio-group.forms.9` Given a `disabled` group or a disabled selected radio, then the group contributes no entry to the submitted data, and re-enabling it before submission restores the entry; a radio disabled only by an ancestor `fieldset disabled` is omitted the same way even though its own `disabled` property is false. [headlessui, base-ui]
- [ ] `radio-group.forms.10` Given a required group with nothing selected, when the form is submitted, then the `valueMissing` error renders, the group and every radio gain `aria-invalid="true"`, and focus moves to the first enabled radio; selecting any radio (by click or by arrow key) clears the error and every invalid marker. [base-ui, react-aria]
- [ ] `radio-group.forms.11` Given a group with server-supplied errors, then the group starts `aria-invalid="true"` with the error rendered, and selecting a radio unmounts the error and removes `aria-invalid`. [base-ui, react-aria]
- [ ] `radio-group.forms.12` Given a group inside a `form` with a change listener, when a radio is clicked, then the form receives a change event whose `target.value` is the newly selected value. [radix] (candidate)
- [ ] `radio-group.forms.13` Given a required group whose selected radio is disabled, then no `valueMissing` error renders because a disabled checked radio still satisfies the group's constraint natively, yet the submitted value is `null`. [base-ui] (candidate) (browser-only)
- [ ] `radio-group.forms.14` Given a required group whose radios all start disabled or sit inside a `fieldset disabled`, then once they are enabled a failed submit focuses the first radio and renders the error. [base-ui] (candidate) (browser-only)
- [ ] `radio-group.forms.15` Given a required group whose trailing radio is individually disabled, then validation and focus targeting still work and land on the first enabled radio. [react-aria] (candidate)
- [ ] `radio-group.forms.16` Given a group with a custom `validate` function, then `validationMode="onSubmit"` defers `aria-invalid` until submit and clears it once a valid value is chosen, `onChange` validates each value write including an external controlled write, and `onBlur` validates only when focus actually leaves the group (a blur whose `relatedTarget` is a sibling radio does not validate). [base-ui] (candidate)
- [ ] `radio-group.forms.17` Given `validationBehavior="native"`, then every radio input carries the `required` attribute rather than `aria-required` and reports native `validity` accordingly; given the default `validationBehavior="aria"`, then native validity stays valid and the state is reported through `aria-invalid` and `aria-describedby` only. [react-aria] (candidate)
- [ ] `radio-group.forms.18` Given a required group with a custom error-message function keyed on `validationDetails.valueMissing`, then the group's `aria-describedby` carries that custom message instead of the browser default; the built-in message is "Constraints not satisfied". [react-aria] (candidate)
- [ ] `radio-group.forms.19` Given a group inside a field, then the field's `name` wins over the group's own `name` on the hidden inputs, and the field's `disabled` propagates to the group and every radio as both `aria-disabled` and `data-disabled`. [base-ui] (candidate)
- [ ] `radio-group.forms.20` Given a group whose every radio unmounts, then required validation stops blocking submission while a custom field validator still runs against the preserved group value. [base-ui] (candidate)
- [ ] `radio-group.forms.21` Given a radio rendered through a portal outside the form element, then it contributes nothing to native `FormData` but is still included in the library's own submit payload, because field registration is context-driven; a group pointed at another form through `form` is omitted from the current form's payload. [base-ui] (candidate) (browser-only)
- [ ] `radio-group.forms.22` Given a group with an `inputRef`, then it points at the checked radio's hidden input, moves as the selection moves, skips disabled radios when nothing is selected, stays on the first radio when the value is cleared, becomes `null` when the radio it points at unmounts, is already attached during layout effects, survives an ancestor `fieldset` being enabled, and a stable callback ref is not detached on unrelated re-renders. [base-ui] (candidate)
- [ ] `radio-group.forms.23` Given a React 19 form action driving `defaultValue` through `useActionState`, when the action runs, then the checked radio moves to the new `defaultValue`. [react-aria] (candidate)
- [ ] `radio-group.forms.24` Given a group whose values are objects, then the submitted payload uses bracketed nested keys (`assignee[id]`, `assignee[name]`, and `delivery[extra][info]` for nested sub-objects), changing to match whichever option is selected and restored by a form reset. [headlessui] (candidate)
- [ ] `radio-group.forms.25` Divergence: Given a `required` group, then `aria-required="true"` goes on the `radiogroup` root only and no individual radio carries `aria-required`. [kobalte, react-aria, zag] (decision needed)
- [ ] `radio-group.forms.26` Divergence: Given a `required` group, then the `required` attribute goes on the backing input(s) so the browser enforces it. [bits, react-aria, radix] (decision needed)
- [ ] `radio-group.forms.27` Divergence: Given a group with a `name`, then exactly one hidden input is rendered for the whole group and its `value` tracks the selection. [bits, melt] (decision needed)
- [ ] `radio-group.forms.28` Divergence: Given a group with a `name`, then one hidden input is rendered per radio, each with the shared `name` and its own `value`, and the checked one is the submitted entry. [base-ui, radix, kobalte, react-aria, zag, reka] (decision needed)
- [ ] `radio-group.forms.29` Divergence: Given a group with no `name` prop, then no hidden input is rendered at all. [bits] (decision needed)

### Animation and presence

- [ ] `radio-group.anim.1` Given an item indicator with no force-mount flag, then it is absent while the item is unselected and inserted when the item is selected; `forceMount` / `keepMounted` keeps it in the DOM either way. [kobalte, base-ui, radix]
- [ ] `radio-group.anim.2` Given an indicator with no CSS exit animation, when the value moves away from that radio, then the indicator is removed immediately; given a `[data-ending-style]` animation, then it synchronously gains `data-ending-style`, fires `onAnimationEnd` and is only then removed. [base-ui] (candidate) (browser-only)
- [ ] `radio-group.anim.3` Given an indicator with a `[data-starting-style]` transition, when the value moves to that radio, then the indicator mounts and the enter transition runs to completion. [base-ui] (candidate) (browser-only)
- [ ] `radio-group.anim.4` Given a single sliding group indicator rather than a per-item one, then it is hidden while no value is selected or its measured rect is empty and it exposes `--left`, `--top`, `--width` and `--height` CSS variables plus `--transition-duration` (default 150ms), `--transition-property` and `--transition-timing-function`. [zag] (candidate)

### RTL and i18n

- [ ] `radio-group.rtl.1` Given a horizontal group in an RTL locale, then the arrow key that means "next" is Left Arrow and the one that means "previous" is Right Arrow, and the group's `dir` is reflected on the root. [base-ui, react-aria, zag] (browser-only)
- [ ] `radio-group.rtl.2` Given a group whose `orientation` prop is not forwarded to the root, then RTL horizontal arrow handling silently breaks, which is the regression a suite should pin by pressing Left Arrow directly rather than through a test helper. [react-aria] (candidate)

### SSR and hydration

- [ ] `radio-group.ssr.1` Given a group server-rendered through an SSR harness, then it renders without errors. [react-aria] (candidate)
- [ ] `radio-group.ssr.2` Given items rendered on the server, then each part carries a `data-ssr` marker until hydration so the measured indicator does not flash. [zag] (candidate)

### Accessibility tooling

- [ ] `radio-group.a11y.1` Given a default, `disabled` or composable radio group, when audited with axe, then there are no violations. [radix, reka, melt, zag, ark]
- [ ] `radio-group.a11y.2` Given a radio group driven by a real screen reader, when the reader is navigated to an item, then the spoken phrase contains both the item's accessible name and the word "radio", so the name and the role are both announced. [base-ui] (candidate) (browser-only)

### Notes and edge cases

- [ ] `radio-group.notes.1` Given a native HTML radio group with nothing selected, then some browsers place focus on the last radio when Shift+Tab enters the group, whereas the APG pattern always specifies the first radio, so a library that follows the pattern deliberately differs from native behavior. [apg]
- [ ] `radio-group.notes.2` Given radio buttons in a toolbar, then they are frequently styled to look like toggle buttons, so visual appearance must not be used to infer which role or keyboard model applies. [apg]
- [ ] `radio-group.notes.3` Given the keyboard-navigation practice, then a radio group is a composite widget whose tab stop is the checked radio, in the same family as tabs, listbox and tree, and unlike menubar and toolbar which put the tab stop on the first item. [apg]
- [ ] `radio-group.notes.4` Given a disabled radio inside a group, then the APG convention is `aria-disabled="true"` where discoverability matters, keeping the control focusable, and the native `disabled` attribute where the user can infer the disabled control from its neighbors. [apg]
- [ ] `radio-group.notes.5` Given arrow-key move-and-check behavior for native radios, then the HTML spec defines no algorithm for it: it is a platform convention, so the APG rule is a de facto convention rather than a spec requirement. [html]
- [ ] `radio-group.notes.6` Given an adapter whose arrow handling is asynchronous, then a test must wait a tick after the keydown before asserting focus and selection; in Solid a single microtask flush after `fireEvent.click` is enough, and disabled behavior has to be driven through the label because `fireEvent.click` on a natively disabled input still dispatches in jsdom. [reka, kobalte]
- [ ] `radio-group.notes.7` Given a group with no children at all, then it renders without throwing. [headlessui] (candidate)
- [ ] `radio-group.notes.8` Given `readOnly` passed to an individual radio instead of the group, then no radio input receives it and clicking that radio still changes the group, because read-only is a group-level concept. [react-aria] (candidate)
- [ ] `radio-group.notes.9` Given a group with a `name`, then rendering its hidden input inside nested overflow containers must not make the page scrollable: `window.scrollY` stays at the baseline and the document scroll height stays within a pixel of the viewport height. [bits] (candidate) (browser-only)

## radio

### Roles and attributes

- [ ] `radio.roles.1` Given each radio button, then it has `role="radio"`. [apg, radix, base-ui, headlessui, kobalte, react-aria, zag, reka, bits]
- [ ] `radio.roles.2` Given a checked radio, then `aria-checked` is `"true"`; given an unchecked one, `"false"`. [apg, axe, radix, base-ui, ariakit, reka, bits]
- [ ] `radio.roles.3` Given a radio, then it is labelled by its own content, by `aria-labelledby`, or by `aria-label`; axe additionally accepts `title` and applies the same `label`, `label-title-only` and `form-field-multiple-labels` rules as for a native checkbox. [apg, axe]
- [ ] `radio.roles.4` Given `role="radio"`, then `aria-checked` is a required attribute, so omitting it on any radio fails at critical impact; a native `input[type="radio"]` with a stray `aria-checked` that disagrees with its real checkedness must have it removed or corrected. [axe]
- [ ] `radio.roles.5` Given `role="radio"` in the axe role table, then its role-specific allowed attributes are `aria-posinset`, `aria-setsize` and `aria-required`, it has no `requiredContext` (so axe does not require a `radiogroup` ancestor even though the APG does), a name is required and may come from content, and children are presentational, so it must not contain a focusable widget-role descendant. [axe, apg]
- [ ] `radio.roles.6` Given a radio group drawn with SVG, then the decorative wrapping `svg` carries `role="none"` and each interactive `g` carries `role="radio"` plus a non-empty `aria-label`, because a `g` has no text content to name it. [apg]
- [ ] `radio.roles.7` Given a selected radio, then `data-state="checked"` (or `data-checked`) appears on the item root, its control, its indicator and its item label at once, and the unselected ones carry `data-unchecked`. [kobalte, base-ui, zag, reka, bits]
- [ ] `radio.roles.8` Given a group-level validation, required, readonly or disabled state, then `data-valid`, `data-invalid`, `data-required`, `data-readonly` and `data-disabled` cascade to every item part, and an individually disabled item gets `data-disabled` on its own parts only. [kobalte, base-ui, zag, bits]
- [ ] `radio.roles.9` Given an item description, then that item's radio is `aria-describedby` the description's id, so items have their own description channel independent of the group's. [kobalte, base-ui, react-aria]
- [ ] `radio.roles.10` Given a `disabled` item, then only that item's input carries the native `disabled` attribute and its siblings do not. [kobalte, react-aria, headlessui, ark, bits]
- [ ] `radio.roles.11` Given an item with no `id`, then it gets a generated id and its parts derive ids as `<itemId>-input`, `<itemId>-control` and `<itemId>-label`; explicit ids on the item or any part win. [kobalte] (candidate)
- [ ] `radio.roles.12` Given an item label plus `aria-labelledby="foo"` on the radio, then `aria-labelledby` is `"foo <itemLabelId>"`, and adding `aria-label` makes it `"foo <itemLabelId> <radioId>"`. [kobalte] (candidate)
- [ ] `radio.roles.13` Given a sibling `label[for]` pointing at the radio's own id and no library label part, then the radio derives a fallback `aria-labelledby` from that label, and when the id changes the fallback follows to the newly matching label. [base-ui] (candidate)
- [ ] `radio.roles.14` Given an item whose label cannot be found in the document, then `aria-label` is absent rather than falling back to the item's `value` as the accessible name. [reka] (candidate)
- [ ] `radio.roles.15` Given a radio rendered as a native `button` with an `id`, then the button carries the `id` and the adjacent hidden input does not, and clicking an external `label[for]` still selects the radio. [base-ui] (candidate)
- [ ] `radio.roles.16` Given a radio whose `value` is `null` or the empty string, then it is still a usable radio value: it can be selected and deselected like any other. [base-ui] (candidate)
- [ ] `radio.roles.17` Divergence: Given an item-level `aria-describedby="foo"` plus a group-level description, then the radio's `aria-describedby` is `"foo <groupDescriptionId>"` with the author value first, which is the opposite order from the group root's own merge. [kobalte, base-ui] (decision needed)
- [ ] `radio.roles.18` Divergence: Given a headless radio, then the exposed element itself carries `role="radio"` and `aria-checked`, and any hidden input is `aria-hidden="true"`. [radix, base-ui, headlessui, reka, bits] (decision needed)
- [ ] `radio.roles.19` Divergence: Given a headless radio, then a real `input[type="radio"]` carries the semantics and the visual control part is `aria-hidden="true"`, so state is read from the native `checked` property; the input also gets `data-ownedby` set to the group root id. [react-aria, kobalte, zag, ark, ariakit, melt] (decision needed)

### Keyboard

- [ ] `radio.keyboard.1` Given an item with a separate control part, when Space is pressed and released on the control rather than the input, then that item becomes checked and the change callback fires once with its value. [kobalte] (candidate)
- [ ] `radio.keyboard.2` Given a focused radio, when Space is pressed down, then nothing changes; when Space is released, then the change callback fires exactly once. [base-ui] (candidate)

### State

- [ ] `radio.state.1` Given a radio with unconsumed extra props, then they land on the rendered element and a `ref` resolves to it; a `value` prop is consumed and never forwarded to the DOM. [radix, base-ui]
- [ ] `radio.state.2` Given a typed `Radio` value, then it accepts a string, a number and `null`, and an explicit generic narrows it so an out-of-union value is a type error. [base-ui] (candidate) (type-only)

### Notes and edge cases

- [ ] `radio.notes.1` Given a radio item rendered with no group ancestor, then it throws a descriptive error naming the missing parent rather than rendering. [headlessui] (candidate)
- [ ] `radio.notes.2` Given a radio's `data-*` props, then they land on the outer item element rather than on the hidden input. [react-aria] (candidate)

## segment-group

### Roles and attributes

- [ ] `segment-group.roles.1` Given a segmented control, then it is a presentation layer over the radio group, so it inherits the radio-group parts, roles, keyboard model and data attributes recorded above. [ark, zag]

### Pointer

- [ ] `segment-group.pointer.1` Given a segment group, when an enabled segment's label is clicked, then the change callback fires with that segment's value; when a disabled segment's label is clicked, then it never fires. [ark] (candidate)

### Animation and presence

- [ ] `segment-group.anim.1` Given a segment group indicator, then it is measured from the selected segment's rect, so a test must wait for that measurement (resolve the label with an async query) before asserting on it. [ark, zag]

### Accessibility tooling

- [ ] `segment-group.a11y.1` Given a segment group, when audited with axe, then there are no violations. [ark] (candidate)

## Sources

- `docs/research/apg-and-axe.md`, section `radio-group` (the APG radio-group pattern, its roving-tabindex, activedescendant, toolbar and SVG test assertions, the WHATWG HTML radio-button-state, focus and form rules, and the axe rule set).
- `docs/research/ariakit-and-headlessui.md`, section `radio-group`.
- `docs/research/kobalte-and-corvu.md`, section `radio-group` (kobalte only; corvu ships no radio group).
- `docs/research/radix-and-base-ui.md`, section `radio-group` (covering `RadioGroup`, `Radio.Root` and `Radio.Indicator`).
- `docs/research/react-aria-a.md`, section `radio-group`.
- `docs/research/reka-melt-bits.md`, section `radio-group`.
- `docs/research/zag-and-ark.md`, sections `radio-group` and `segment-group`.

## Deferred

- `aria-activedescendant` radio groups (`radio-group.keyboard.14`, `radio-group.focus.16`): the APG documents the variant, no library in the corpus ships it, and a first implementation uses roving tabindex only.
- Radio groups nested inside a toolbar (`radio-group.keyboard.12` and `radio-group.keyboard.13`): needs the toolbar component first, since the behavior is defined by the toolbar's focus model.
- SVG radio groups (`radio.roles.14`): a rendering concern for the consumer, not something the controller can enforce.
- Object-valued items and their bracket-path form serialization (`radio-group.forms.23`) plus custom comparison by field or comparator (`radio-group.state.9`): needs a value-identity design first.
- The sliding measured group indicator (`radio-group.anim.4`): depends on element measurement and a resize observer, which the first implementation leaves to the consumer.
- Screen-reader announcement tests (`radio-group.a11y.2`): needs a driven-screen-reader harness the suite does not have.
- `inputRef` targeting rules (`radio-group.forms.21`): a framework-specific ref contract that belongs in adapter unit tests.
