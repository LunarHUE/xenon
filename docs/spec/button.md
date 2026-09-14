# button

Merged from `docs/research/`. The interaction primitives a button exercises
(press, hover, keyboard, focus) follow the button section as their own `##`
sections, because the button is where each of them is first observable.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## button

### Roles and attributes

- [ ] `button.roles.1` Given a non-native element used as a command button, when rendered, then it exposes `role="button"`. [apg, kobalte, base-ui, react-aria]
- [ ] `button.roles.2` Given a button, then it has an accessible label computed from its text content, or supplied by `aria-labelledby` or `aria-label`; a missing name is a WCAG 4.1.2 failure at critical impact for native `button` and serious impact for `role="button"`. [apg, axe, react-aria]
- [ ] `button.roles.3` Given a button with a separate description element, then it carries `aria-describedby` pointing at that element's id. [apg, react-aria]
- [ ] `button.roles.4` Given a button whose action is unavailable, then it carries `aria-disabled="true"`. [apg]
- [ ] `button.roles.5` Given a button that opens a menu, then it carries `aria-haspopup` set to `menu` or `true`. [apg]
- [ ] `button.roles.6` Given a `role="button"` element, then every descendant is made presentational by the user agent, so nested heading, list or image semantics MUST NOT be relied on. [apg, axe]
- [ ] `button.roles.7` Given a `role="button"` element, then it MUST NOT contain a focusable widget-role descendant; `tabindex="-1"` on the nested control is explicitly not an acceptable fix because assistive technology still reaches it. [axe]
- [ ] `button.roles.8` Given an icon `svg` inside a button, then the `svg` carries `aria-hidden="true"` so it does not contribute to the accessible name. [apg]
- [ ] `button.roles.9` Given a library exposing ARIA 1.2 IDL reflection, then `element.role` reads `"button"` and `element.ariaPressed` reads the string `"false"` or `"true"`, matching the attribute form. [apg]
- [ ] `button.roles.10` Given `role="button"`, then `aria-expanded` and `aria-pressed` are its only role-specific allowed attributes, an accessible name is required, the name may come from content, and its children are presentational; it has no required attributes, no required owned elements and no required context. [axe]
- [ ] `button.roles.11` Given a button, then its `type` attribute has three states, `submit`, `reset` and `button`, with the Auto state as both the missing-value and invalid-value default. [html]
- [ ] `button.roles.12` Given a widget-role element with visible text that also carries `aria-label` or `aria-labelledby`, then the visible text is part of the accessible name (WCAG 2.5.3, serious, experimental). [axe]
- [ ] `button.roles.13` Given a native `button` host with no explicit `type`, when rendered, then `type="button"` is applied so the button does not submit an enclosing form by accident. [ariakit, kobalte, zag, react-aria]
- [ ] `button.roles.14` Given a host that is neither `button` nor `input` (a `div`, `span` or `a`), when rendered, then no `type` attribute is emitted, because `type` is meaningless there. [ariakit, kobalte, base-ui, react-aria]
- [ ] `button.roles.15` Given a `button` or `input` host with an author-supplied `type` of `submit` or `reset`, when rendered, then the author's value wins and is not overwritten with `button`. [ariakit, kobalte]
- [ ] `button.roles.16` Given a native `button` host and a disabled button, when rendered, then the native `disabled` attribute is set and `aria-disabled` is not. [kobalte, base-ui, react-aria]
- [ ] `button.roles.17` Given a non-native host and a disabled button, when rendered, then `aria-disabled="true"` is set and the native `disabled` attribute is not. [kobalte, base-ui, react-aria]
- [ ] `button.roles.18` Given a disabled button on any host, when rendered, then it carries `data-disabled`; an enabled button carries no `data-disabled`. [kobalte, base-ui]
- [ ] `button.roles.19` Given arbitrary DOM props such as `data-testid` or `data-foo="bar"`, when passed to the button, then they land unchanged on the host element. [react-aria, base-ui, ariakit]
- [ ] `button.roles.20` Given `aria-disabled="true"` passed explicitly as a prop (as distinct from the library's own disabled flag), when rendered, then `aria-disabled="true"` is present and the native `disabled` property stays undefined; the explicit attribute is never converted into native `disabled`. [react-aria] (candidate)
- [ ] `button.roles.21` Given an anchor host with `rel`, when rendered, then `rel` passes through unchanged, for both link keywords (`search`) and space-separated lists (`noopener noreferrer`). [react-aria] (candidate)
- [ ] `button.roles.22` Given accessibility props such as `aria-current="page"`, when passed to the button, then they are forwarded to the host element. [react-aria] (candidate)
- [ ] `button.roles.23` Given `autoFocus`, when the button renders, then it carries a `data-autofocus` attribute. [headlessui] (candidate)
- [ ] `button.roles.24` Given a button rendered with a `slot` name inside a context provider whose `slots` map names that slot, when rendered, then the element carries the `slot` attribute and merges in the props that slot configures (for example `aria-label`). [react-aria] (candidate)
- [ ] `button.roles.25` Given a polymorphic button rendered as a textarea or other native control, when rendered, then the host's own semantics survive: `tagName` and attributes such as `placeholder` are untouched. [ariakit] (candidate)

### Keyboard

- [ ] `button.keyboard.1` Given focus is on a button, when Space is pressed, then the button activates. [apg, base-ui, react-aria]
- [ ] `button.keyboard.2` Given focus is on a button, when Enter is pressed, then the button activates. [apg, base-ui, react-aria]
- [ ] `button.keyboard.3` Given a button built on a non-native element, then Space and Enter are handled in script, because the browser supplies key activation only for native controls. [apg, base-ui, react-aria]
- [ ] `button.keyboard.4` Given a button activated by an assigned shortcut key rather than by focus, when the shortcut fires, then focus stays in the context the shortcut was pressed from and does not move to the button. [apg]
- [ ] `button.keyboard.5` Given an element with activation behavior, then activation is always caused by a `click` event: when the user triggers it by keyboard or voice, the default action of that interaction event is to fire a `click` at the element. The HTML spec binds no key to buttons itself, so a headless library MUST synthesize the click. [html]
- [ ] `button.keyboard.6` Given a non-native button, when keyboard activation fires, then a real `click` event is dispatched at the host, so ancestor `onClick` and capture-phase handlers on the host both see it. [base-ui, react-aria]
- [ ] `button.keyboard.7` Given a non-native button and a modified keypress such as `Shift+Enter`, when it activates, then the synthesized click carries the modifier state of the underlying key event (`shiftKey: true`). [base-ui, react-aria]
- [ ] `button.keyboard.8` Given a non-native button whose `onKeyDown` calls `preventDefault()`, when Enter is pressed, then no activation happens, matching native button behavior; the same holds for `preventDefault()` in `onKeyUp` with Space. [base-ui, react-aria]
- [ ] `button.keyboard.9` Given a repeating keydown (`repeat: true`) from OS key repeat, when it arrives, then no activation and no press events fire. [react-aria] (candidate)
- [ ] `button.keyboard.10` Given a button rendered as an anchor with an `href`, when Space is pressed, then the keydown's default is prevented so the page does not scroll, activation fires exactly once, and navigation still happens (`location.hash` becomes the target). [base-ui] (candidate)
- [ ] `button.keyboard.11` Given an `a[href][role="button"]`, when Space is pressed, then the library calls the DOM `.click()` method explicitly rather than relying on a native default action, because browsers do not fire `click` for Space on anchors. [react-aria] (candidate)
- [ ] `button.keyboard.12` Given an element whose role is `link` (a real anchor or `role="link"`), when Space is pressed, then nothing activates; when Enter is pressed, then it activates. [react-aria] (candidate)
- [ ] `button.keyboard.13` Given an `input[type="checkbox"]` host, when Enter is pressed, then nothing activates; when Space is pressed, then activation fires and the keydown default is NOT prevented, so the browser's own checkbox toggle still runs. [react-aria] (candidate)
- [ ] `button.keyboard.14` Given a non-native button whose keydown handler calls the library's own `preventBaseUIHandler()`, when Space or Enter is pressed, then no activation fires, on both the keydown and keyup activation paths. [base-ui] (candidate)
- [ ] `button.keyboard.15` Given one host whose props come from two nested non-native button hooks composed as `outer(inner(props))`, when Space then Enter are typed, then activation fires once per key press, not once per hook. [base-ui] (candidate)
- [ ] `button.keyboard.16` Given a non-native button inside a shadow root, when a composed bubbling `keydown` with key `Enter` originates on a focusable inner element, then the host's activation fires once, because the handler resolves the target through `composedPath()`. [base-ui] (candidate) (browser-only)
- [ ] `button.keyboard.17` Divergence: inside a composite (toolbar, menu, grid), Space activates on `keydown` and does NOT fire again on `keyup`, and the composite context is inherited so a nested button needs no explicit opt-in; an explicit `composite: false` restores keyup activation. [base-ui] (decision needed)
- [ ] `button.keyboard.18` Divergence: outside a composite, Space activation is deferred to `keyup` (0 activations after keydown, 1 after keyup), matching a native button. [base-ui, react-aria] (decision needed)
- [ ] `button.keyboard.19` Given a composite non-native button whose consumer `onKeyDown` calls `preventDefault()` to keep Space for text navigation, when Space is pressed, then a `role="menuitem"` link and a `role="gridcell"` div do not activate, while a `role="switch"` still does. [base-ui] (candidate)
- [ ] `button.keyboard.20` Given a native composite button, when a real Space key press is typed (keydown, keyup and the browser's own click), then activation fires exactly once, not twice. [base-ui] (candidate)

### Pointer

- [ ] `button.pointer.1` Given a button, when it is clicked with a pointer, then it performs the same activation as Enter and Space. [apg, react-aria, base-ui, kobalte]
- [ ] `button.pointer.2` Given a composite that manages focus with roving `tabindex` or `aria-activedescendant`, when one of its items is clicked or tapped, then the same `tabindex` or `aria-activedescendant` update is applied as for keyboard navigation, so pointer and keyboard state do not diverge. [apg]
- [ ] `button.pointer.3` Given `element.click()`, then it returns early if the element is a disabled form control, returns early if a click is already in progress on that element, and otherwise fires a synthetic `click` with the not-trusted flag set, so `isTrusted` is false and the method is reentrancy-guarded per element. [html]
- [ ] `button.pointer.4` Given a button, when it is clicked, then it receives DOM focus; clicking a checkbox's or radio's `label` also focuses the control. [ariakit, react-aria]
- [ ] `button.pointer.5` Given a disabled button, when it is clicked, then no activation callback fires. [react-aria, base-ui, kobalte]
- [ ] `button.pointer.6` Given a clickable control, then its touch target SHOULD be at least 24 by 24 CSS pixels or leave at least 24px of clearance from its neighbors (WCAG 2.2 AA, serious); the rule ships disabled and must be enabled explicitly. [axe]
- [ ] `button.pointer.7` Given a disabled button that keeps hover handlers live, when the pointer moves over it, then `onMouseMove` fires while activation stays blocked, and the element carries `data-disabled` and `aria-disabled="true"` with no native `disabled`. [base-ui] (candidate) (browser-only)
- [ ] `button.pointer.8` Given a truly disabled link (native `disabled` plus `pointer-events: none`), when it is middle-clicked, then nothing opens because the gesture never reaches it; given an accessibly disabled link or disabled tab-as-link, when middle-clicked, then nothing opens and the URL is unchanged, while an enabled link or tab-as-link does open (a new tab on Chromium and Firefox, the current tab on WebKit). [ariakit] (candidate) (browser-only)
- [ ] `button.pointer.9` Given a middle click on the same fixture in a DOM emulator, when a capture-phase `auxclick` listener records it, then exactly one event lands on the element and its `defaultPrevented` flag reports whether activation would have run: true for the enabled link and tab, false for the accessibly disabled ones. [ariakit] (candidate)

### Focus management

- [ ] `button.focus.1` Given a button built from a non-native element, then it carries `tabindex="0"` to enter the page tab sequence. [apg, kobalte, base-ui, react-aria]
- [ ] `button.focus.2` Given a button rendered as an anchor with an `href`, when rendered, then no `tabindex` is added, because the anchor is already tabbable. [kobalte] (candidate)
- [ ] `button.focus.3` Given an explicit `tabIndex` prop, when the button renders, then the explicit value wins over the injected default (a child's own `tabIndex={-1}` also wins over the wrapper's). [base-ui, react-aria]
- [ ] `button.focus.4` Given a button that opens a dialog, when it is activated, then focus moves inside the dialog. [apg]
- [ ] `button.focus.5` Given a button inside a dialog that closes the dialog, when it is activated, then focus returns to the button that opened the dialog unless the completed task logically leads elsewhere. [apg]
- [ ] `button.focus.6` Given a button whose action does not dismiss the current context, such as Apply or Recalculate, when it is activated, then focus remains on the button. [apg]
- [ ] `button.focus.7` Given a button whose action is a context change such as "next step", when it is activated, then focus SHOULD move to the starting point of that new context. [apg]
- [ ] `button.focus.8` Given a button that is removed from the DOM or hidden by its own activation, then focus MUST be moved explicitly to a logical successor, because browsers otherwise move focus to `body` and the focus indicator is lost. [apg]
- [ ] `button.focus.9` Given an element with a negative `tabindex`, then the user agent considers it a focusable area but omits it from tabindex-ordered focus navigation, so `tabindex="-1"` is programmatically and click focusable but not Tab-reachable. This is the spec basis for roving tabindex. [html]
- [ ] `button.focus.10` Given `tabindex="0"`, then the element is included in the sequential focus navigation order at its DOM position. [html]
- [ ] `button.focus.11` Given positive `tabindex` values, then they all come before every omitted, invalid, zero or negative value, ordered ascending with ties broken by tree order; a headless library MUST NOT emit positive values, and axe flags any `tabindex > 0` as a serious best-practice failure. [html, axe]
- [ ] `button.focus.12` Given the `tabIndex` IDL attribute with no content attribute, then it defaults to 0 for `a`, `area`, `button`, `frame`, `iframe`, `input`, `object`, `select`, `textarea`, SVG and MathML `a`, and a `summary` that is its parent `details`'s summary, and to -1 otherwise. [html]
- [ ] `button.focus.13` Given an element to be a focusable area, then all of these hold: its tabindex value is non-null or the user agent determines it focusable; it is not a shadow host, or its shadow root's `delegatesFocus` is false; it is not actually disabled; it is not inert; and it is being rendered, delegating rendering to its children, or used as canvas fallback content. [html]
- [ ] `button.focus.14` Given that an element can be focusable without being sequentially focusable or click focusable, then "focusable", "Tab-reachable" and "click-focusable" are three separate properties, not one. [html]
- [ ] `button.focus.15` Given a shadow host whose shadow root has `delegatesFocus: true`, then the focusable area is the host's focus delegate: the first descendant with `autofocus`, otherwise the first focusable area in tree order, recursing into further delegating hosts, otherwise null. [html]
- [ ] `button.focus.16` Given the focusing steps, then they return early when the resolved target's DOM anchor is inert, no-op when the target is already focused, and otherwise run the focus update steps, firing `blur` on the old chain and `focus` on the new chain with `relatedTarget` set. [html]
- [ ] `button.focus.17` Given `element.focus(options)`, then `preventScroll` defaults to false, so scrolling into view is the default and must be suppressed explicitly with `{ preventScroll: true }`. [html]
- [ ] `button.focus.18` Given `element.blur()`, then the user agent SHOULD run the unfocusing steps but MAY do nothing, so a headless library MUST NOT rely on `blur()` to move focus anywhere in particular. [html]
- [ ] `button.focus.19` Given a focus navigation scope, then each Document, shadow host, slot and popover trigger owns its own tabindex-ordered scope, and Tab traversal walks the flattened recursive composition of those scopes, skipping negative-tabindex elements. [html]
- [ ] `button.focus.20` Given `autofocus`, then at most one element has it within a given nearest-ancestor autofocus scoping root (the nearest ancestor `dialog` or popover, or the document), and the attribute applies to all elements, not only form controls. [html]
- [ ] `button.focus.21` Given page-load autofocus, then the first eligible candidate in the queue wins, the processed flag is then set permanently, and the mechanism is abandoned entirely if focus has already moved elsewhere in the top document. [html]
- [ ] `button.focus.22` Given an `autoFocus` prop, when the button mounts, then it becomes `document.activeElement`. [react-aria] (candidate)
- [ ] `button.focus.23` Given a forwarded ref, when `ref.current.focus()` is called, then the button becomes `document.activeElement`, and the ref resolves to the real host DOM node. [react-aria] (candidate)
- [ ] `button.focus.24` Given a disabled control, then it is not a focusable area at all, so it is neither click-focusable, Tab-reachable, nor focusable by `.focus()`. [html]
- [ ] `button.focus.25` Given a disabled button, when Tab walks the page, then it is skipped. [base-ui, kobalte, react-aria]
- [ ] `button.focus.26` Divergence: a disabled non-native button keeps a `tabindex="-1"` attribute, so it stays programmatically focusable while dropping out of the tab order. [base-ui] (decision needed)
- [ ] `button.focus.27` Divergence: a disabled non-native button has its `tabindex` attribute removed entirely, so it is not focusable at all. [kobalte, react-aria] (decision needed)
- [ ] `button.focus.28` Given a disabled button with the library's "focusable while disabled" opt-in, when rendered, then the native `disabled` attribute is dropped and the element carries `data-disabled`, `aria-disabled="true"` and `tabindex="0"`; Tab focuses it, yet clicking, Space and Enter fire no handlers. [base-ui, ariakit]
- [ ] `button.focus.29` Given a focusable-when-disabled button that disables itself inside its own activation handler, when it is clicked once, then the handler fired once, the button keeps focus, and it now carries `aria-disabled="true"`; further clicks, Enter and Space do not activate it again and focus is retained. [base-ui] (candidate)
- [ ] `button.focus.30` Given a focusable-when-disabled button inside a composite root, when it is focused, then it receives focus, and still does after the component is re-keyed so its ref identity changes. [base-ui] (candidate)
- [ ] `button.focus.31` Given a focused non-native button with the library's custom focusability turned off at runtime, when the flag flips, then `tabindex` is removed and any `data-focus-visible` attribute is cleared; turning it back on restores `tabindex="0"`. [ariakit] (candidate)

### State

- [ ] `button.state.1` Given a command button, then `aria-pressed` is absent; only the toggle variant carries that state, and a plain action button also has no `aria-checked`. [apg, react-aria]
- [ ] `button.state.2` Given a disabled control, then being disabled does not prevent programmatic modification: setting `value` or `checked` from script still works, so a disabled state MUST NOT be relied on to freeze state. [html]
- [ ] `button.state.3` Given a pending (busy) button, when it enters the pending state, then activation is suppressed: a second click or Enter does not invoke the handler again. [react-aria, ariakit]
- [ ] `button.state.4` Given a pending button, when the pending flag is set, then `aria-disabled="true"` appears immediately even though the spinner is delayed; with pending false, the button has no `aria-disabled` at all. [react-aria] (candidate)
- [ ] `button.state.5` Given a pending button whose spinner has a visibility delay, when fake timers advance past that delay (1000ms in the fixture), then the spinner becomes visible and `aria-disabled="true"` remains. [react-aria] (candidate)
- [ ] `button.state.6` Given a button rendered as an anchor with an `href` that becomes pending, when it renders, then the `href` attribute is removed from the anchor so navigation cannot start while pending. [react-aria] (candidate)
- [ ] `button.state.7` Given a pending button, when it loses focus, then the pending state survives the blur. [ariakit] (candidate)

### Forms

- [ ] `button.forms.1` Given a control that mimics a native form control without using one, then form association is deliberate: only `button`, `fieldset`, `input`, `object`, `output`, `select`, `textarea`, `img` and form-associated custom elements are form-associated, and only `button`, `input`, `select`, `textarea` and form-associated custom elements are submittable. [html]
- [ ] `button.forms.2` Given a control with a `form` attribute, then its value MUST be the id of a `form` element in the control's tree, and only listed elements may carry it. [html]
- [ ] `button.forms.3` Given a form-associated element with no `form` attribute, then its form owner is its nearest ancestor `form`, recomputed whenever the element is inserted or removed, its `form` attribute changes, or a matching id appears or disappears. [html]
- [ ] `button.forms.4` Given a headless control that needs form participation, then the supported mechanism is a form-associated custom element: `static formAssociated = true`, one `attachInternals()` call, `setFormValue(value, state)` to report the value, `setValidity(flags, message, anchor)` to report validity; a second `attachInternals()` throws `NotSupportedError`. [html]
- [ ] `button.forms.5` Given `setFormValue(null)`, then the element is excluded from the submitted entry list. [html]
- [ ] `button.forms.6` Given `setValidity` called with any flag true, then the message argument MUST be non-empty or the call throws `TypeError`. [html]
- [ ] `button.forms.7` Given a form-associated custom element, then it handles `formAssociatedCallback` on owner change, `formResetCallback` on reset, `formDisabledCallback` with the new boolean on disabled change, and `formStateRestoreCallback` with reason `"autocomplete"` or `"restore"`. [html]
- [ ] `button.forms.8` Given a control exposing constraint validation, then `willValidate` reports candidacy, `checkValidity()` fires a cancelable `invalid` event and returns false when constraints are unmet, `reportValidity()` additionally reports to the user and MAY focus the element, and `setCustomValidity(error)` normalizes newlines before storing. [html]
- [ ] `button.forms.9` Given a validity state, then the full flag set is `valueMissing`, `typeMismatch`, `patternMismatch`, `tooLong`, `tooShort`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`, `badInput`, `customError` and `valid`. [html]
- [ ] `button.forms.10` Given a submitter with `formnovalidate`, or a form with `novalidate`, then interactive constraint validation is skipped on submission. [html]
- [ ] `button.forms.11` Given a form that is reset, then a bubbling cancelable `reset` event fires first, and only if it is not cancelled does each resettable element's reset algorithm run; those changes do not count as user changes and MUST NOT fire `input`. [html]
- [ ] `button.forms.12` Given `:user-invalid`, then it matches only elements whose user validity is true, set after a change or blur with a changed value or after an attempted submission, so it is distinct from `:invalid`. [html]
- [ ] `button.forms.13` Given a control rendered as disabled without a native disabled element, then `aria-disabled="true"` alone changes only the accessibility tree: no click suppression, no focus exclusion and no constraint-validation exemption come for free, so each MUST be implemented in script. [html]
- [ ] `button.forms.14` Given a native form control that is disabled, then the user agent prevents any click events queued on the user interaction task source from being dispatched on it. [html]
- [ ] `button.forms.15` Given a disabled control, then it is barred from constraint validation and contributes no entry to the submitted entry list. [html]
- [ ] `button.forms.16` Given a `fieldset` with `disabled`, then every form control descendant is disabled except those inside the fieldset's first `legend` child, propagating transitively through nested fieldsets. [html]
- [ ] `button.forms.17` Given `:disabled`, then it matches only elements that are "actually disabled": a disabled `button`, `input`, `select` or `textarea`, an `optgroup` or `option` that is disabled or whose nearest ancestor `select` is disabled, a disabled `fieldset`, and a disabled form-associated custom element. [html]
- [ ] `button.forms.18` Given a `button` in the Auto state with neither `command` nor `commandfor` present and whose parent is not a `select`, then it IS a submit button, as is a button in the explicit Submit Button state. [html]
- [ ] `button.forms.19` Given a button's activation behavior, then it runs in this order: return if disabled; return if its node document is not fully active; if it has a form owner, submit for a submit button, reset for the Reset state, or return for the Auto state; otherwise resolve the `commandfor` target and dispatch a cancelable `CommandEvent` named `command` at it; otherwise run the popover target activation behavior. [html]
- [ ] `button.forms.20` Given a `command` attribute, then its valid keywords are `toggle-popover`, `show-popover`, `hide-popover`, `close`, `request-close`, `show-modal`, or a custom keyword starting with `--` that only dispatches the `command` event; missing and invalid values are the Unknown state. [html]
- [ ] `button.forms.21` Given a `command` event cancelled with `preventDefault()`, or whose target has become disconnected, then the built-in command steps do not run. [html]
- [ ] `button.forms.22` Given a `popovertarget` attribute, then its value MUST be the id of an element with a `popover` attribute in the same tree, and `popovertargetaction` has the states `toggle` (default), `show` and `hide`. [html]
- [ ] `button.forms.23` Given a button that is not a submit button, then it is barred from constraint validation. [html]
- [ ] `button.forms.24` Given a form with a default button (the first submit button in tree order owned by that form), then implicit submission fires a `click` at that button provided it has an activation behavior and is not disabled. [html]
- [ ] `button.forms.25` Given a form with no submit button, then implicit submission returns without submitting if more than one field blocks implicit submission, and otherwise submits from the form element itself with user involvement `"activation"`. [html]
- [ ] `button.forms.26` Given the fields that block implicit submission, then they are `input` elements owned by the form whose type is Text, Search, Telephone, URL, Email, Password, Date, Month, Week, Time, Local Date and Time, or Number. [html]
- [ ] `button.forms.27` Given a submission, then a cancelable `submit` event carrying a `SubmitEvent` with a `submitter` property fires before the entry list is constructed, and cancelling it aborts submission. [html]
- [ ] `button.forms.28` Given a `label`, then its labeled control is resolved either explicitly via `for`, whose value MUST be the id of a labelable element in the same tree, or implicitly as the first labelable descendant in tree order. [html]
- [ ] `button.forms.29` Given a click on a `label`'s interactive content descendant, then the label's own activation behavior does nothing, so activation is not double-forwarded. [html]
- [ ] `button.forms.30` Given a labeled control, then it matches `:active` and `:hover` whenever its `label` does, and that matching does not count as being activated. [html]
- [ ] `button.forms.31` Given the labelable elements list, then it is exactly `button`, `input` whose type is not Hidden, `meter`, `output`, `progress`, `select`, `textarea` and form-associated custom elements, so a `div`-based control can never be a `label` target and MUST use `aria-labelledby`. [html]
- [ ] `button.forms.32` Given a non-submit button inside a form, when Enter and then Space are pressed while it is focused, then both the keydown and keyup have `defaultPrevented` true, so native Enter submission is blocked for a non-submit button. [react-aria] (candidate)
- [ ] `button.forms.33` Given a `type="submit"` button inside a form, when Space is pressed, then the keyup is not prevented, and when Enter is pressed, then the keydown is not prevented, so the browser's native submit behavior runs. [react-aria] (candidate)
- [ ] `button.forms.34` Given a native `type="submit"` or `type="reset"` composite button, when Space fires on keydown, then the form's submit or reset handler runs once on keydown and not again on keyup. [base-ui] (candidate)
- [ ] `button.forms.35` Given a submit button whose pending flag is set asynchronously, when it is clicked or Enter is pressed before the flag lands, then the form submits; once pending is true, the same explicit mouse click or Enter does not submit. [react-aria] (candidate)
- [ ] `button.forms.36` Given a form with two text inputs (so the single-input implicit-submission special case does not apply) and a pending submit button, when Enter is pressed in a focused input, then implicit submission is suppressed. [react-aria] (candidate)
- [ ] `button.forms.37` Given `form` and `formMethod` props, when the button renders, then it carries `form="<id>"` and `formMethod="post"`, associating it with a form by id and setting its submission method. [react-aria] (candidate)

### SSR and hydration

- [ ] `button.ssr.1` Given a button rendered to string on the server and then hydrated, when both phases are inspected, then the server markup declares the same native `type` values as the client, and hydration logs no console errors. A non-native host is the documented exception: it gains `role` and `tabindex` only on the client. [ariakit] (candidate)
- [ ] `button.ssr.2` Given a disabled non-native button rendered to string, then the emitted element carries `role="button"`; given a disabled native button, then it carries the native `disabled` attribute. [base-ui] (candidate) (browser-only)
- [ ] `button.ssr.3` Given each public button export server-rendered with a text child, then it renders without throwing. [react-aria] (candidate)

### Accessibility tooling

- [ ] `button.a11y.1` Given a button implemented as `input[type="button"|"submit"|"reset"]`, then it MUST have a non-empty `value`, or a name from `aria-label`, `aria-labelledby`, `title` or a label (critical). [axe]
- [ ] `button.a11y.2` Given `role="button"`, `role="link"` or `role="menuitem"` on a non-native element, then it MUST have an accessible name from visible text, `aria-label`, `aria-labelledby` or `title` (serious). [axe]
- [ ] `button.a11y.3` Given a `div`, `span`, `p` or heading given `tabindex="0"`, then it MUST carry a widget or composite role; `button` satisfies the widget branch, while `tooltip`, `dialog`, `alertdialog` and `tabpanel` satisfy only the scrollable-region branch (minor, experimental). [axe]
- [ ] `button.a11y.4` Given a `role` attribute on a host element that does not support it, then `aria-allowed-role` flags it as a best-practice violation (minor), with `allowImplicit: true` by default. [axe]
- [ ] `button.a11y.5` Given any element with a `role`, then the role MUST be valid, non-abstract, non-deprecated and widely supported: `invalidrole` and `unsupportedrole` are critical, `abstractrole` serious, `deprecatedrole` minor. [axe]
- [ ] `button.a11y.6` Given any element with a `role`, then every ARIA attribute on it MUST be allowed for that role and host element and MUST NOT be deprecated or poorly supported (critical), and all of that role's required ARIA attributes MUST be present (critical). [axe]
- [ ] `button.a11y.7` Given any `aria-*` attribute, then its name MUST be valid (critical) and its value MUST be valid for that attribute (critical); an unresolved id reference is reported as incomplete rather than a failure, and an empty value is reported as "ignored while empty". [axe]
- [ ] `button.a11y.8` Given an element whose role prohibits `aria-label` and `aria-labelledby`, notably `none` and `presentation`, then neither is present (serious). [axe]
- [ ] `button.a11y.9` Given an id referenced by `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-owns` or `aria-activedescendant`, then that id MUST be unique in the document (critical). [axe]
- [ ] `button.a11y.10` Given an element marked `role="presentation"` or `role="none"`, then it MUST NOT also be focusable or carry a global ARIA attribute (minor). [axe]
- [ ] `button.a11y.11` Given an element with `aria-hidden="true"`, then neither it nor any descendant is focusable; a focusable descendant fails with "Focusable content should have tabindex=\"-1\" or be removed from the DOM" (serious), and only the outermost `aria-hidden="true"` element is tested. [axe]
- [ ] `button.a11y.12` Given `aria-brailleroledescription` or `aria-braillelabel`, then a non-empty non-braille equivalent (`aria-roledescription` or an accessible name respectively) MUST exist (serious). [axe]

### Notes and edge cases

- [ ] `button.notes.1` Given a widget whose function is navigation rather than an action, then it uses the link role, not the button role, because appearance and role both need to match function. [apg]
- [ ] `button.notes.2` Given an element styled as a link that performs a button action, then `role="button"` helps, but the preferred fix is changing the visual design so appearance and role match. [apg]
- [ ] `button.notes.3` Given a button that launches a dialog, then appending an ellipsis to the label ("Save as…") is the conventional signal. [apg]
- [ ] `button.notes.4` Given the whole attribute contract is derived from the resolved tag name, then the conformance suite runs the same attribute matrix against at least `button`, `input`, `div`, `a[href]` and `a` without `href`. [kobalte, base-ui, react-aria]
- [ ] `button.notes.5` Given a polymorphic button whose declared host kind and the actual rendered element disagree, when it mounts in development, then the library logs a `console.error` naming both the expected and the actual element and telling the author which prop to change. [base-ui, react-aria]
- [ ] `button.notes.6` Given a custom render function that does not forward the provided ref to its DOM element, when the component mounts, then a development warning names the broken ref chain. [base-ui, react-aria]
- [ ] `button.notes.7` Given React ref cleanup functions on buttons and portals, when each unmounts, then its cleanup runs: object refs report detached and keyboard shortcuts registered in the ref stop firing. [ariakit] (candidate) (browser-only)
- [ ] `button.notes.8` Given the library ships no button machine at all, then the de facto contract is that every trigger-like part sets `type="button"` explicitly: dialog, popover, menu, select, combobox trigger and clear-trigger, date-picker view and nav triggers, carousel controls, toast close and action triggers, tour action triggers, file-upload trigger, color-picker swatch and format triggers, number-input spinners, qr-code download trigger, timer action triggers, clipboard trigger, and editable edit/submit/cancel triggers. [zag] (candidate)
- [ ] `button.notes.9` Given a test environment with no native `PointerEvent` (jsdom), then any code branching on `pointerType` or `pointerId` needs a `PointerEvent` stub installed for the file's lifetime, so the harness MUST provide one. [kobalte, react-aria]

## press

### Roles and attributes

- [ ] `press.roles.1` Given a press wrapper around a child with no ARIA role, when rendered, then a development warning says the child must have an interactive ARIA role; given a non-interactive role such as `presentation`, then the warning names the offending role. [react-aria] (candidate)

### Keyboard

- [ ] `press.keyboard.1` Given a non-link pressable element, when keydown then keyup fire with `key: ' '`, then the sequence is `pressstart`, `presschange(true)`, `pressup`, `pressend`, `presschange(false)`, `press`, plus a synthesized `click`, every press event reporting `pointerType: 'keyboard'` and the payload carrying the `key` field. [react-aria] (candidate)
- [ ] `press.keyboard.2` Given a keyboard-activated press with no pointer coordinates, then every emitted press event reports x and y at the centre of the target's bounding rect (50,50 for a 100x100 rect at the origin), not 0,0. [react-aria] (candidate)
- [ ] `press.keyboard.3` Given a keydown with `shiftKey: true` and a keyup with `ctrlKey: true`, then `pressstart` reports `shiftKey: true` while `pressup`, `pressend`, `press` and `click` report `ctrlKey: true`: each event carries the modifier state of its own underlying key event. [react-aria] (candidate)
- [ ] `press.keyboard.4` Given `navigator.platform` reporting Mac, when Meta is held, Enter is pressed with `metaKey: true`, and only the Meta keyup arrives (macOS fires no keyup while Meta is held), then the complete press sequence still fires for the Enter press, treating the Meta keyup as the end of the press. [react-aria] (candidate)
- [ ] `press.keyboard.5` Given a keydown with Space on the element but the matching keyup on `document.body`, then `pressend` and `presschange(false)` still fire with no `pressup` or `press`, and a following complete Space cycle on the element fires the full sequence, proving the internal pressed flag was reset rather than stuck. [react-aria] (candidate)
- [ ] `press.keyboard.6` Given a keydown with `repeat: true`, then no press events fire at all. [react-aria] (candidate)

### Pointer

- [ ] `press.pointer.1` Given pointer events with `pointerType: 'mouse'`, when `pointerover`, `pointerdown`, `mousedown`, `focus`, `pointerup`, `mouseup` then `click` fire, then `onPressStart` fires with `{target, pointerType: 'mouse', ctrlKey/metaKey/shiftKey/altKey: false, x, y}`, followed by `onPressChange(true)`, `onPressUp`, `onPressEnd`, `onPressChange(false)`, `onPress`, and the native `onClick` last. [react-aria] (candidate)
- [ ] `press.pointer.2` Given `pointerType: 'touch'`, when `pointerover`/`pointerdown`/`touchstart` fire and the compatibility `mousedown` and `focus` arrive only after `pointerup`, then press events report `pointerType: 'touch'` in the same order as mouse. [react-aria] (candidate)
- [ ] `press.pointer.3` Given a touch press that ends without the browser firing any compatibility `mousedown`/`mouseup`/`click` (a long press), then the full press sequence including a synthesized `click` still fires, and after 90ms the element still becomes `document.activeElement`. [react-aria] (candidate)
- [ ] `press.pointer.4` Given a nested inner element whose own `onClick` calls `stopPropagation()`, when it is clicked, then an outer press hook receives `pressstart` and `pressend` but never `onPress` or `onClick`. [react-aria] (candidate)
- [ ] `press.pointer.5` Given `hasPointerCapture` returning true, when `pointerdown` fires, then the library calls `hasPointerCapture(pointerId)` and `releasePointerCapture(pointerId)` on the target; when it returns false, then `releasePointerCapture` is not called. [react-aria] (candidate)
- [ ] `press.pointer.6` Given a press in progress, when `pointercancel` fires, then `onPressEnd` and `onPressChange(false)` fire with no `onPressUp` and no `onPress`. [react-aria] (candidate)
- [ ] `press.pointer.7` Given a press in progress, when a native `dragstart` fires on the target, then the press is cancelled (`pressend`, `presschange(false)`, no `pressup`, `press` or `click`), in the pointer, mouse and touch worlds alike. [react-aria] (candidate)
- [ ] `press.pointer.8` Given the default configuration, when the pointer leaves the target mid-press, then `pressend` and `presschange(false)` fire immediately at the exit coordinates, and re-entering restarts a fresh `pressstart`/`presschange(true)` that the final `pointerup` completes. [react-aria] (candidate)
- [ ] `press.pointer.9` Given the cancel-on-pointer-exit option, when the pointer leaves and re-enters, then the press is cancelled on exit and does NOT restart on re-entry, in the pointer, mouse and touch worlds alike. [react-aria] (candidate)
- [ ] `press.pointer.10` Given `pointerdown`, `pointerup` and `click` all fired with `button: 1`, then no press events fire at all: only the primary button is handled. [react-aria] (candidate)
- [ ] `press.pointer.11` Given the prevent-focus-on-press option, when a press completes by pointer, touch or a bare `click`, then the target does not become `document.activeElement`; by default it does. [react-aria] (candidate)
- [ ] `press.pointer.12` Given a `pointerdown`/`pointerup` pair with `width: 0, height: 0` (the signature of a screen-reader virtual pointer) reporting `pointerType: 'mouse'`, then no press events fire on the pointer events, and only the following synthetic `click` produces the full sequence, with every press event reporting `pointerType: 'virtual'`. [react-aria] (candidate)
- [ ] `press.pointer.13` Given `navigator.userAgent` reporting Android, when the same zero-size pointer pair fires, then it is NOT treated as virtual: press events report `pointerType: 'mouse'` and fire on the pointer pair rather than being deferred to the click. [react-aria] (candidate)
- [ ] `press.pointer.14` Given Android, when a pointer pair fires with `width: 1, height: 1, pressure: 0, detail: 0` (Android TalkBack's double-tap shape), then no press events fire on the pointer events and only the following `click` produces the full sequence with `pointerType: 'virtual'`. [react-aria] (candidate)
- [ ] `press.pointer.15` Given a non-Android user agent, when a pointer pair fires with `pressure: 0`, then press events fire immediately: `pressure: 0` alone does not trigger the virtual-click heuristic. [react-aria] (candidate)
- [ ] `press.pointer.16` Given the element is disabled, when `pointerdown`, `pointerup` and `click` fire, then no press and no click events fire. [react-aria] (candidate)
- [ ] `press.pointer.17` Given a large hit target (`width: 20, height: 20`) where `pointerup` lands at (10,10) offset from `pointerdown` at (0,0), then `onPress` still fires; the same tolerance applies to touch with `radiusX/radiusY: 15`. [react-aria] (candidate)
- [ ] `press.pointer.18` Given a press, when `pointerdown` fires, then the element gets inline `user-select: none`, removed again on `pointerup`/`click`. [react-aria] (candidate)
- [ ] `press.pointer.19` Given no `PointerEvent` support, when `mousedown`, `focus`, `mouseup` and `click` fire with `detail: 1`, then the same press sequence fires with `pointerType: 'mouse'`, and both the mousedown and the click return true (not prevented), so native focus and click behavior is preserved. [react-aria] (candidate)
- [ ] `press.pointer.20` Given the mouse-events fallback, when `mousedown` then `mouseleave` fire, then `pressend`/`presschange(false)` fire on the `mouseleave`, and a `mouseup` dispatched on `document.body` at different coordinates does not restart the press. [react-aria] (candidate)
- [ ] `press.pointer.21` Given the touch-events fallback, when `touchstart` then `touchend` fire at the same coordinates, then the full press sequence fires with `pointerType: 'touch'`; when the touch moves outside the target, the press is cancelled and re-entry restarts it. [react-aria] (candidate)
- [ ] `press.pointer.22` Given a touch press in progress, when the browser also fires emulated compatibility mouse events interleaved with the touch sequence, then those emulated events are ignored entirely and press state is derived from the touch sequence alone, still reporting `pointerType: 'touch'`. [react-aria] (candidate)
- [ ] `press.pointer.23` Given a touch press in progress, when `touchcancel` fires, then the press is cancelled and the following `touchend` does not re-fire `pressup` or `press`. [react-aria] (candidate)
- [ ] `press.pointer.24` Given a touch press in progress, when a `scroll` event fires on `document.body`, then the press is cancelled even though the touch never left the target; a `scroll` on an unrelated sibling scrollable that is not an ancestor of the target does NOT cancel it. [react-aria] (candidate)
- [ ] `press.pointer.25` Given a press cancelled by a scroll rather than by a pointer end position, then `pressstart` reports the real touch coordinates while `pressend` reports the element centre, because no real end coordinate exists. [react-aria] (candidate)
- [ ] `press.pointer.26` Given a plain `click` with no preceding pointer, mouse, touch or key event (a screen reader dispatching a click directly), then the full press sequence is synthesized with `pointerType: 'virtual'` and x/y 0. [react-aria] (candidate)
- [ ] `press.pointer.27` Given an `onPressUp` handler that itself calls `e.target.click()`, when a bare `mouseup` arrives, then only the single `pressup` fires and the reentrant synthetic click starts no second press cycle. [react-aria] (candidate)
- [ ] `press.pointer.28` Given each press event, then its x and y report the actual coordinates of its own underlying native event: `pressstart` at the pointerdown position and `pressup`/`pressend`/`press` at the pointerup position, for both `pointerType: 'mouse'` and `pointerType: 'touch'`. [react-aria] (candidate)
- [ ] `press.pointer.29` Given a press wrapper around a native `button`, when the button is clicked, then `onPress` fires exactly once, and an existing `onClick` on the child also fires once: the wrapper merges with existing handlers rather than replacing them. [react-aria] (candidate)

### Focus management

- [ ] `press.focus.1` Given a press wrapper around a `span role="button"` with no `tabIndex`, when rendered, then the child is given `tabindex="0"`; given the wrapper is disabled, then the child has no `tabindex` at all and no focusability warning is logged. [react-aria] (candidate)
- [ ] `press.focus.2` Given a press wrapper whose child does not forward its ref to a DOM element (no ref forwarded, or an imperative handle exposing a non-DOM object), when rendered, then a `console.error` says the child must forward its ref to a DOM element. [react-aria] (candidate)
- [ ] `press.focus.3` Given a press wrapper whose child renders a `span role="button"` that never receives `tabIndex`, when rendered, then a `console.warn` says the child must be focusable and names the `tabIndex` prop; inside a `hidden` ancestor the warning is suppressed. [react-aria] (candidate)
- [ ] `press.focus.4` Given a press wrapper with its own ref around a child with its own ref, when rendered, then both refs resolve to the same DOM node. [react-aria] (candidate)

### Notes and edge cases

- [ ] `press.notes.1` Given nested outer and inner press hooks, when a press completes on the inner element, then only the inner handlers fire and the outer ones receive nothing, for mouse, pointer and touch alike; calling `continuePropagation()` on the press event lets it reach the ancestor hook. [react-aria] (candidate)
- [ ] `press.notes.2` Given a pressable rendered inside a portal, when a press completes on the portaled content, then an ancestor press hook in the React tree receives nothing, for mouse, pointer and touch alike. [react-aria] (candidate)
- [ ] `press.notes.3` Given a pressable portaled into an iframe's own document, then pointer, mouse, keyboard and bare-click (virtual) press paths all work, because the library resolves the target's owner document and window rather than assuming the top-level one. [react-aria] (candidate)
- [ ] `press.notes.4` Given a pressable inside a real shadow root, then the pointer, modifier-key, left-click-only, virtual-click, Android, disabled, hit-tolerance and `user-select` behaviors all match the light DOM, and a terminating `pointerup` dispatched outside the shadow tree still cleans up press state rather than leaving it stuck. [react-aria] (candidate)
- [ ] `press.notes.5` Given `navigator.platform` reporting iPhone, when `touchstart` fires, then `document.documentElement.style.webkitUserSelect` is set to `'none'` page-wide and the element itself gets no inline `user-select`; the page-wide value is restored 316ms after press end. [react-aria] (candidate) (safari-only)
- [ ] `press.notes.6` Given Android, when `touchstart` fires, then the page-wide `webkitUserSelect` is untouched and the element itself gets inline `user-select: none`, reverted immediately on press end with no delay. [react-aria] (candidate)
- [ ] `press.notes.7` Given two pressables on iOS, when the second press begins before the first press's cleanup delay elapses, then the page-wide `user-select: none` stays in place until every press has ended; on Android the per-element cleanup is independent per element. [react-aria] (candidate)
- [ ] `press.notes.8` Given iOS, when the pressable unmounts mid-press, then the page-wide `webkitUserSelect` is still restored after the 316ms delay. [react-aria] (candidate)
- [ ] `press.notes.9` Given an application that changes unrelated inline styles during a press, then the library's `user-select` mutation survives and the app's other styles survive press end; if the app explicitly sets `user-select: text` after press start, that value wins and is not force-cleared. [react-aria] (candidate)

## hover

### Pointer

- [ ] `hover.pointer.1` Given pointer events with `pointerType: 'mouse'`, when `pointerover` then `pointerout` fire, then events fire in order `hoverstart` `{target, pointerType: 'mouse'}`, `hoverchange(true)`, `hoverend`, `hoverchange(false)`; the mouse-events fallback (`mouseenter`/`mouseleave`) produces the same sequence. [react-aria, base-ui]
- [ ] `hover.pointer.2` Given a hovered element with inner children, when `pointerover`/`pointerout` fire on an inner child, then the reported `target` is the element the listeners were attached to, not the child. [react-aria] (candidate)
- [ ] `hover.pointer.3` Given `pointerType: 'touch'`, then no hover events fire and no hover-derived rendering changes. [react-aria] (candidate)
- [ ] `hover.pointer.4` Given a touch sequence immediately followed by `pointerover`/`pointerout` reporting `pointerType: 'mouse'` (the iOS Safari bug that emits a mouse event on focus after touch, WebKit 214609), then no hover events fire; after 600ms the suppression window has elapsed and mouse hover events fire normally. [react-aria] (candidate)
- [ ] `hover.pointer.5` Given a hovered element removed from the DOM by its own click handler (so the browser fires no `pointerout` for it), when a later `pointerover` fires on `document.body`, then `onHoverEnd`/`onHoverChange(false)` fire and `data-hovered` is removed from the detached element. [react-aria] (candidate)
- [ ] `hover.pointer.6` Given a hover-driven overlay with no delay, when `mouseenter` fires on the trigger, then the overlay is present immediately with no timer advance, and `mouseleave` removes it immediately. [base-ui] (candidate)
- [ ] `hover.pointer.7` Given a symmetric numeric hover delay of 1000ms, when `mouseenter` fires, then nothing opens at 999ms and the overlay appears at 1000ms; an asymmetric `{open, close}` delay applies each half independently. [base-ui] (candidate)
- [ ] `hover.pointer.8` Given an open delay with the close delay at 0, when the pointer leaves before the open delay elapses, then the pending open timer is cancelled and the overlay never appears. [base-ui] (candidate)
- [ ] `hover.pointer.9` Given a rest-time threshold of 100ms, when `mousemove` events report significant movement (`movementX/Y` of 10), then each move resets the rest timer and the overlay opens only after 100ms of rest; minor movement (`movementX: 1, movementY: 0`) does not reset the timer. [base-ui] (candidate)
- [ ] `hover.pointer.10` Given a `delay` object with no `open` key alongside a rest threshold, when `mouseenter` fires, then the rest threshold governs opening rather than an implicit zero open delay. [base-ui] (candidate)
- [ ] `hover.pointer.11` Given an open hover overlay with no safe-polygon close handler, when a `mouseleave` whose `relatedTarget` is the overlay is dispatched on the trigger, then the overlay closes: moving from trigger into overlay does not keep it open by itself. [base-ui] (candidate)
- [ ] `hover.pointer.12` Given a safe-polygon close handler and a 100x100 reference with a 100x100 overlay offset 20px away, when the pointer moves through the trough between them, then the overlay stays open for all four placements (top, bottom, left, right); moving to the opposite side of the reference closes it exactly once per placement. [base-ui] (candidate)
- [ ] `hover.pointer.13` Given a safe-polygon handler in a floating tree whose child node is open, when the pointer leaves and the intent timeout of 50ms elapses, then close is not called, including when the open descendant sits behind a contextless intermediary node; with no open child, close is called exactly once after the timeout. [base-ui] (candidate)
- [ ] `hover.pointer.14` Given a delay group with `{open: 1000, close: 200}`, when the first trigger is hovered, then nothing opens until 1000ms; hovering a sibling trigger then swaps instantly, and leaving the last one closes it after the 200ms group close delay. [base-ui] (candidate)
- [ ] `hover.pointer.15` Given a delay group with a `timeoutMs` window, when a trigger closes and a sibling is hovered inside that window, then the sibling opens instantly rather than waiting the group's open delay; the window survives both the unmount of an inactive consumer and the unmount of the last closed consumer. [base-ui] (candidate)

### State

- [ ] `hover.state.1` Given hover is disabled, when the pointer enters and leaves, then no `onHoverStart`, `onHoverEnd` or `onHoverChange` fires. [react-aria] (candidate)
- [ ] `hover.state.2` Given hover is active and has already fired `onHoverStart`, when the element is re-rendered as disabled, then `onHoverEnd` and `onHoverChange(false)` fire immediately without any `pointerout`, and the hover-derived rendering is removed; this holds in both the pointer and mouse worlds. [react-aria] (candidate)
- [ ] `hover.state.3` Given a hover-driven open change, then the change reports a hover reason in its event details, so a consumer can distinguish a hover open from a click open. [base-ui] (candidate)

### Notes and edge cases

- [ ] `hover.notes.1` Given a hover-enabled wrapper containing a trigger that opens portaled content, when hover start and end fire on the portaled content, then the wrapper's hover handlers never fire, for both real mouse events and pointer events. [react-aria] (candidate)
- [ ] `hover.notes.2` Given a hover overlay with a 1000ms delay, when the trigger unmounts 1ms into the delay, then the overlay never appears even after the remaining 999ms elapse. [base-ui] (candidate)
- [ ] `hover.notes.3` Given an open hover overlay whose trigger contains a child element, when a bubbling `mousemove` arrives whose native `composedPath()` and the framework's synthetic `target` disagree, then no open change fires and the overlay stays mounted. [base-ui] (candidate)
- [ ] `hover.notes.4` Given hover handlers delegated to a wrapper element rather than the trigger itself, when the pointer moves over the active trigger or a child of it, then no redundant open change fires; a registered-but-disabled trigger inside the wrapper counts as inactive. [base-ui] (candidate)
- [ ] `hover.notes.5` Given a hover overlay that is mid-close-transition, when the same trigger is re-entered, then it reopens immediately without waiting the open delay, whether the transition is reported through the store's transition status or through an external `isClosing` callback. [base-ui] (candidate)
- [ ] `hover.notes.6` Given nested hover overlays where the inner one blocks pointer events while open, when the hover trigger changes, then the pointer-event block is cleaned up so the outer overlay stays usable. [base-ui] (candidate)
- [ ] `hover.notes.7` Given a delay group, when one consumer's group state changes, then unrelated consumers do not re-render. [base-ui] (candidate)

## keyboard

### Keyboard

- [ ] `keyboard.keyboard.1` Given key handlers attached to a focused element, when a key is typed, then a `keydown` followed by a `keyup` fire with `target` equal to that element. [react-aria] (candidate)
- [ ] `keyboard.keyboard.2` Given a key-handling element nested inside an ancestor with its own native key handlers, when a key is typed on the inner element, then the inner handlers fire once each and the ancestor's never do; calling `continuePropagation()` re-enables bubbling. [react-aria] (candidate)
- [ ] `keyboard.keyboard.3` Given a shortcut map, then actions run only on `keydown`, never on `keyup`, including repeated and composing keyups. [react-aria] (candidate)
- [ ] `keyboard.keyboard.4` Given a shortcut with the default repeat policy, when a keydown arrives with `repeat: true`, then the action does not run; with repeats allowed, it runs once. [react-aria] (candidate)
- [ ] `keyboard.keyboard.5` Given a shortcut with the default composition policy, when a keydown arrives with `isComposing: true` (an IME keystroke), then the action does not run; with composing allowed, it runs once. [react-aria] (candidate)
- [ ] `keyboard.keyboard.6` Given both a shortcut map and separate `onKeyDown`/`onKeyUp` handlers on the same element, when the shortcut key is typed, then the action fires once and both plain handlers also fire once: shortcut handling composes with rather than replaces them. [react-aria] (candidate)
- [ ] `keyboard.keyboard.7` Given `Mod` in a shortcut spec, then it resolves to `Meta` on Mac and `Control` on Windows, and the non-matching modifier on each platform does not trigger the action or intercept the event. [react-aria] (candidate)
- [ ] `keyboard.keyboard.8` Given a plain-key shortcut such as `s`, when `Meta+s` is typed, then the action does not run: an unrelated modifier disqualifies a plain-key binding. [react-aria] (candidate)
- [ ] `keyboard.keyboard.9` Given bindings for both `Mod+Shift+a` and `Control+Shift+a` on Mac, when `Meta+Shift+a` is typed, then only the `Mod` binding fires, and `Control+Shift+a` fires only its own: `Mod` and `Control` are distinct modifiers. [react-aria] (candidate)
- [ ] `keyboard.keyboard.10` Given bindings for both `Mod+a` and `Mod+Shift+a`, when `Shift+Meta+a` is typed on Mac, then only `Mod+Shift+a` fires: the most specific modifier combination matches exclusively. [react-aria] (candidate)
- [ ] `keyboard.keyboard.11` Given a shortcut spec, then modifier names are matched case-insensitively and independently of order, so `SHIFT+mod+A` parses to `{shift: true, mod: true, key: 'A'}` and `Shift+Mod+a` and `Mod+Shift+a` canonicalize identically; `Control` is an alias for `ctrl`. [react-aria] (candidate)
- [ ] `keyboard.keyboard.12` Given the key aliases `space`, `esc`, `del`, `ins`, `left`, `right`, `up`, `down`, `pageup` and `pagedown`, then each resolves to `' '`, `escape`, `delete`, `insert`, `arrowleft`, `arrowright`, `arrowup`, `arrowdown`, `pageup` and `pagedown` respectively. [react-aria] (candidate)
- [ ] `keyboard.keyboard.13` Given a keyboard event with `key: 'A'`, `shiftKey` and `metaKey`, when canonicalized, then the result is the string `'Meta+Shift+a'`: the key is lowercased and modifiers are emitted in a fixed order. [react-aria] (candidate)
- [ ] `keyboard.keyboard.14` Given a shortcut spec with only modifiers and no non-modifier key (`Mod+Shift`), or an empty string, when parsed, then it throws an "Invalid keyboard shortcut" error. [react-aria] (candidate)
- [ ] `keyboard.keyboard.15` Given a shortcut action, then its return value controls the event: `undefined` or `true` means prevent default and stop propagation; `false` means neither; an object `{shouldPreventDefault, shouldContinuePropagation}` controls both independently. A non-matching key prevents nothing and continues propagation. [react-aria] (candidate)
- [ ] `keyboard.keyboard.16` Given several handlers bound to the same key, then propagation continues only when every matching handler agrees to continue; one handler stopping propagation stops it overall, and handlers bound to other keys have no say. [react-aria] (candidate)
- [ ] `keyboard.keyboard.17` Given a spec object with two keys that canonicalize to the same shortcut, when it fires, then only the later binding's action runs. [react-aria] (candidate)
- [ ] `keyboard.keyboard.18` Given a shortcut action, then the exact event object instance is passed through to it. [react-aria] (candidate)

### State

- [ ] `keyboard.state.1` Given key handling is disabled, when a key is typed on the focused element, then the hook records no `keydown` or `keyup` at all. [react-aria] (candidate)

## long-press

### Keyboard

- [ ] `long-press.keyboard.1` Given a long-press listener with an 800ms threshold, when Space is held for 600ms, then no long-press events fire: long press does not respond to keyboard interaction. [react-aria] (candidate)

### Pointer

- [ ] `long-press.pointer.1` Given a long-press listener at its default threshold of 500ms, when `pointerdown` fires with `pointerType: 'touch'`, then `onLongPressStart` fires immediately with `{target, pointerType, ctrlKey, metaKey, shiftKey, altKey, x, y}`; nothing fires at 400ms; and by 600ms `onLongPressEnd` and `onLongPress` both fire. A following `pointerup` produces nothing more. [react-aria] (candidate)
- [ ] `long-press.pointer.2` Given a long press released at 200ms, before the threshold, then only `onLongPressStart` and `onLongPressEnd` fire and `onLongPress` never does, even after a further 800ms. [react-aria] (candidate)
- [ ] `long-press.pointer.3` Given a custom threshold of 800ms, when the pointer is held 600ms, then only `longpressstart` has fired; past 800ms `longpressend` and `longpress` follow. [react-aria] (candidate)
- [ ] `long-press.pointer.4` Given long press and press merged on one element, when the hold passes the threshold, then events fire in order `longpressstart`, `pressstart`, `longpressend`, `pressend`, `longpress`, and no `press` fires: a completed long press cancels the ordinary press. [react-aria] (candidate)
- [ ] `long-press.pointer.5` Given long press and press merged on one element, when the pointer is released at 300ms, before the threshold, then events fire in order `longpressstart`, `pressstart`, `longpressend`, `pressend`, `press`: the ordinary press is not cancelled. [react-aria] (candidate)
- [ ] `long-press.pointer.6` Given an `onLongPress` handler, when the threshold is reached on touch, then a native `contextmenu` on the element is prevented, suppressing the platform touch-and-hold menu. [react-aria] (candidate)

### Accessibility tooling

- [ ] `long-press.a11y.1` Given an accessibility description and an `onLongPress` handler, when the element renders, then it carries `aria-describedby` pointing at a hidden element holding that text. [react-aria] (candidate)
- [ ] `long-press.a11y.2` Given the same description while the element is disabled, or with no `onLongPress` handler registered, when it renders, then no `aria-describedby` is present. [react-aria] (candidate)

## focusable

### Roles and attributes

- [ ] `focusable.roles.1` Given a focusable wrapper around a `span` with no `role`, when rendered, then a `console.warn` says the child must have an interactive ARIA role; `role="presentation"` produces the same warning naming the offending role. [react-aria] (candidate)

### Focus management

- [ ] `focusable.focus.1` Given a focusable wrapper around a `span role="button"`, when rendered, then the child gets `tabindex="0"`, and tabbing to it fires `onFocus`, typing fires `onKeyDown` and tabbing away fires `onBlur`. [react-aria] (candidate)
- [ ] `focusable.focus.2` Given the wrapper is disabled, when rendered, then the child has no `tabindex` at all. [react-aria] (candidate)
- [ ] `focusable.focus.3` Given an exclude-from-tab-order flag, when rendered, then the child gets `tabindex="-1"`: focusable but not tabbable. [react-aria] (candidate)
- [ ] `focusable.focus.4` Given `autoFocus` on the wrapper, when it mounts, then the child is the active element. [react-aria] (candidate)
- [ ] `focusable.focus.5` Given a child with its own `tabIndex={-1}`, when rendered, then the child's value wins over the injected one, and the wrapper's ref and the child's ref resolve to the same element. [react-aria] (candidate)
- [ ] `focusable.focus.6` Given a child that does not forward its ref to a DOM element, when rendered, then a `console.error` says so; given a child that drops `tabIndex`, then a `console.warn` says the child must be focusable, suppressed inside a `hidden` subtree. [react-aria] (candidate)
- [ ] `focusable.focus.7` Given a `button` appended to the document, when the focusability predicate runs, then it returns true. [react-aria] (candidate)
- [ ] `focusable.focus.8` Given an element in a detached document (so `ownerDocument.defaultView` is null), when the focusable and tabbable predicates run, then neither throws, including with an `inert` ancestor, and the skip-visibility variant returns true. [react-aria] (candidate)

## focus-visible

### Roles and attributes

- [ ] `focus-visible.roles.1` Given the focus-visible tracker, then it sets no attributes and writes no CSS variables: it exposes the current interaction modality as one of `"keyboard"`, `"pointer"` or `"virtual"` and reports changes through subscriber callbacks. [zag] (candidate)
- [ ] `focus-visible.roles.2` Given the modality, then focus is visible only for `keyboard` and `virtual`; `pointer` and the initial `null` (no interaction yet, which is the case during focus-trap autofocus) both read as not focus-visible. [zag] (candidate)
- [ ] `focus-visible.roles.3` Given a keyboard-focused element, when it receives focus via Tab, then it gains `data-focus-visible="true"`; when Tab moves focus on, the attribute is removed. [react-aria, ariakit]
- [ ] `focus-visible.roles.4` Given the modality, subscriber set and per-window listener map are module-level globals, then there is exactly one modality for the whole document, shared by every component on the page. [zag] (candidate)

### Keyboard

- [ ] `focus-visible.keyboard.1` Given a non-text-input listener, when keydown/keyup for `a`, keydown/keyup for `Escape`, then `mousedown` and `mouseup` fire on the body, then the callback fires 5 times with `[true, true, true, true, false]`: every keydown and keyup flips to keyboard modality, `mousedown` flips to pointer, and `mouseup` alone does not notify. [react-aria] (candidate)
- [ ] `focus-visible.keyboard.2` Given a text input, then only `Tab` and `Escape` make focus visible; printable-character keys such as `a` do not, so the same key sequence notifies 3 times with `[true, true, false]`. [react-aria, zag]
- [ ] `focus-visible.keyboard.3` Given "text input" is inferred rather than only declared, then it covers an `HTMLInputElement` whose `type` is not one of checkbox, radio, range, color, file, image, button, submit or reset, any `HTMLTextAreaElement`, and any `contentEditable` element. [zag] (candidate)
- [ ] `focus-visible.keyboard.4` Given a key event, then it switches modality to keyboard only if it passes the validity filter, which rejects `metaKey`, `ctrlKey` and `altKey` (except on Mac, where Alt produces characters) and the bare `Control`, `Shift` and `Meta` keys. [zag] (candidate)
- [ ] `focus-visible.keyboard.5` Given a plain non-composite focusable element clicked with the pointer so it has no `data-focus-visible`, when `Alt+ArrowDown` is pressed, then it gains `data-focus-visible="true"`, so the modality rule is not composite-specific. [ariakit] (candidate)

### Pointer

- [ ] `focus-visible.pointer.1` Given pointer tracking, then `pointerdown`/`pointermove`/`pointerup` are used when `window.PointerEvent` exists and `mousedown`/`mousemove`/`mouseup` otherwise. [zag] (candidate)
- [ ] `focus-visible.pointer.2` Given any pointer event, then it sets the modality to pointer, but only `mousedown`/`pointerdown` marks that an event preceded focus and notifies subscribers; moves and ups update the modality silently. [zag] (candidate)
- [ ] `focus-visible.pointer.3` Given a trusted `pointermove`/`mousemove` whose `clientX`/`clientY` match the last recorded position, then it is ignored, because WebKit fires such events when content scrolls under a stationary cursor. [zag] (candidate) (safari-only)
- [ ] `focus-visible.pointer.4` Given a click the library identifies as virtual (a screen reader or other assistive activation), then the modality becomes `virtual` and the label logic is skipped. [zag] (candidate)
- [ ] `focus-visible.pointer.5` Given a real click inside a `label` whose associated control is enabled and not already focused, then that control is remembered as a pending label control so the browser's following default focus of it is not mistaken for a virtual interaction; interactive content nested in the label (`a[href]`, `audio[controls]`, `button`, `details`, `embed`, `iframe`, `img[controls]`, `img[usemap]`, `input`, `select`, `textarea`, `video[controls]`) does not arm that path unless it is the label's own control. [zag] (candidate)

### Focus management

- [ ] `focus-visible.focus.1` Given per-window setup, then the tracker installs capture-phase `keydown`, `keyup` and `click` on the document, a capture-phase `focus` and a bubble-phase `blur` on the window, and a `beforeunload` teardown registered `{ once: true }`; setup is idempotent per window, keyed by a module-level `Map<Window, …>`. [zag] (candidate)
- [ ] `focus-visible.focus.2` Given a focus event arriving with no preceding keyboard or pointer event, then the modality becomes `virtual`; this is what catches iOS form next/previous navigation. [zag] (candidate)
- [ ] `focus-visible.focus.3` Given a focus event targeting the `window` or the `document`, then it is ignored, because Firefox fires two extra focus events the first time the user clicks into an iframe, which would otherwise raise a spurious focus ring. [zag] (candidate) (firefox-only)
- [ ] `focus-visible.focus.4` Given an untrusted focus event (`isTrusted === false`), or one arriving while the library's ignore flag is set, then it is ignored, so programmatic focus reverts do not produce focus rings. [zag] (candidate)
- [ ] `focus-visible.focus.5` Given a window blur, then the preceding-event and pending-label-control state is reset and a recently-blurred flag is set, which suppresses the virtual-modality guess on the focus event that arrives when the user tabs back in. [zag] (candidate)
- [ ] `focus-visible.focus.6` Given `HTMLElement.prototype.focus` is monkey-patched per window, then every programmatic focus pre-marks that an event preceded focus, keeping the modality at whatever the user last did (for example `pointer` after a click that opened a dialog) instead of flipping to `virtual` on autofocus or focus-trap focus. The patch is installed with `Object.defineProperty`, and both patch and restore are wrapped in try/catch so a non-configurable property degrades to listener-only tracking. [zag] (candidate)
- [ ] `focus-visible.focus.7` Given a keyboard-focused element, when browser tabs are toggled away and back using Chrome's event order (element blur, window blur, `visibilitychange` hidden, `visibilitychange` visible, window focus, element focus), then focus is still visible; after a real click instead, it is not. [react-aria] (candidate)
- [ ] `focus-visible.focus.8` Given a keyboard-focused element, when tabs are toggled using Safari's event order, where the window/element focus pair fires twice and `visibilitychange` comes after all focus events, then focus is still visible; after a click instead, it is not. [react-aria] (candidate) (safari-only)
- [ ] `focus-visible.focus.9` Given a keyboard-focused element, when the browser window blurs and refocuses with no `visibilitychange`, then focus is still visible; after a click instead, it is not. [react-aria] (candidate)
- [ ] `focus-visible.focus.10` Given a tooltip anchor and a click that dropped keyboard modality, when `Option+Tab` focuses the anchor (how Safari moves focus when the macOS keyboard-navigation setting is off), then the anchor gains `data-focus-visible="true"` and its tooltip shows; clicking it instead leaves the attribute absent. [ariakit] (candidate) (safari-only)

### State

- [ ] `focus-visible.state.1` Given two focus-ring elements, when nothing is focused, then no modality handlers are registered; tabbing to the first registers exactly one handler and sets `data-focus-visible` on it; tabbing to the second swaps to a different single handler and moves the attribute; a following click calls only the current element's handler and leaves neither focus-visible. [react-aria] (candidate)

### Notes and edge cases

- [ ] `focus-visible.notes.1` Given an element rendered into an iframe, when it is clicked before window focus tracking is installed for that window, then it is not focus-visible; after tracking is added for the iframe, a key press inside it makes it focus-visible, so listeners must be installed per window. [react-aria] (candidate)
- [ ] `focus-visible.notes.2` Given tracking installed in an iframe, when `beforeunload` fires on that window, or the returned teardown is called, then later keyboard events no longer flip focus visibility and the window's entry is removed from the module-level listener map. [react-aria, zag]
- [ ] `focus-visible.notes.3` Given an iframe whose `HTMLElement.prototype.focus` has been redefined as an accessor-only property with no writable value, when window focus tracking is installed, then it does not throw. [react-aria] (candidate)
- [ ] `focus-visible.notes.4` Given an element inside a tracked iframe, then toggling browser tabs or blurring and refocusing the top window preserves the existing modality, and clicking it with the left button then pressing Escape makes it focus-visible, so modality switches cross the iframe boundary. [react-aria] (candidate)
- [ ] `focus-visible.notes.5` Given a focus-visible subscription, then `onChange` fires immediately with `autoFocus || isFocusVisible()`, so an autofocused element is reported focus-visible on subscription regardless of the real modality; the modality-only subscription instead fires immediately with the current modality and notifies on every change without the text-input key filtering. [zag] (candidate)
- [ ] `focus-visible.notes.6` Given a caller that knows the interaction kind out of band, then setting the modality explicitly forces it and notifies every subscriber with a `null` event. [zag] (candidate)

## focus-events

### Focus management

- [ ] `focus-events.focus.1` Given focus handling on a `tabIndex={-1}` div, when it is focused then blurred, then events fire in order `focus`, `onFocusChange(true)`, `blur`, `onFocusChange(false)`, with `e.target` the element itself. [react-aria] (candidate)
- [ ] `focus-events.focus.2` Given focus handling on a container with a focusable child, when the child is focused and blurred, then no events fire; focusing the container itself fires `focus`/`onFocusChange(true)`, and moving focus from container to child fires `blur`/`onFocusChange(false)`. [react-aria] (candidate)
- [ ] `focus-events.focus.3` Given focus handling is disabled, when the element is focused and blurred, then no events fire. [react-aria] (candidate)
- [ ] `focus-events.focus.4` Given a wrapper with its own `onFocus`/`onBlur` around a focus-handling element, when focus moves, then both fire once each by default; the inner handlers calling `stopPropagation()` suppress the wrapper's. [react-aria] (candidate)
- [ ] `focus-events.focus.5` Given a focused element that is re-rendered as `disabled`, then `onBlur` fires asynchronously through a MutationObserver, because browsers emit no real blur when the focused element becomes disabled. [react-aria] (candidate)
- [ ] `focus-events.focus.6` Given the same element portalled into a shadow root, then the `focus`/`focuschange(true)`/`blur`/`focuschange(false)` sequence, the disabled suppression and the propagation rules all behave as in the light DOM, with the shadow element as the target. [react-aria] (candidate)

## focus-within

### Focus management

- [ ] `focus-within.focus.1` Given focus-within handling on a `tabIndex={-1}` div with no children, when it is focused then blurred, then events fire in order `focus`, `onFocusWithinChange(true)`, `blur`, `onFocusWithinChange(false)`. [react-aria] (candidate)
- [ ] `focus-within.focus.2` Given a container with a focusable child, when focus enters the child, moves to the container, moves back to the child and finally leaves, then exactly one `focus` (targeting the child) and one `blur` fire, with no spurious events while focus moves within the subtree. [react-aria] (candidate)
- [ ] `focus-within.focus.3` Given focus-within handling is disabled, when a child is focused and blurred, then no events fire. [react-aria] (candidate)
- [ ] `focus-within.focus.4` Given a wrapper with its own `onFocus`/`onBlur` around a focus-within container, when a child is focused and blurred, then both fire once each by default; the inner handlers calling `stopPropagation()` suppress the wrapper's. [react-aria] (candidate)
- [ ] `focus-within.focus.5` Given a focused button inside a focus-within container, when the button becomes `disabled`, then the blur-within callback fires asynchronously through a MutationObserver. [react-aria] (candidate)
- [ ] `focus-within.focus.6` Given a focus-within container whose only focusable child removes itself on click, when focus then lands on an input outside, then the blur-within callback fires with the container as the target rather than the removed child. [react-aria] (candidate)

## focus-safely

### Focus management

- [ ] `focus-safely.focus.1` Given virtual interaction modality, when a safe focus call targets an element that is unmounted inside the following animation frame, then the underlying scroll-free focus is never called, because virtual modality defers focus to the next frame and the element is no longer connected by then. [react-aria] (candidate)
- [ ] `focus-safely.focus.2` Given virtual modality and an element that stays mounted, when a safe focus call runs and timers flush, then the scroll-free focus is called exactly once. [react-aria] (candidate)
- [ ] `focus-safely.focus.3` Given virtual modality and an element portalled into a shadow root, then the connectedness check works across the shadow boundary: focus is skipped when the root has been removed and applied once when it is still connected. [react-aria] (candidate)

## interaction-hooks

### Pointer

- [ ] `interaction-hooks.pointer.1` Given a click-to-open hook with default options on a trigger, when a bubbling `click` with `button: 0` is dispatched twice, then the overlay mounts on the first click and unmounts on the second; with toggling disabled, the second click cannot close it. [base-ui] (candidate)
- [ ] `interaction-hooks.pointer.2` Given the hook configured to open from `mousedown`, when `pointerdown`, `mousedown` and `click` are dispatched in that order and microtasks flush, then the overlay is mounted, and the same sequence closes it when it started open. [base-ui] (candidate)
- [ ] `interaction-hooks.pointer.3` Given the hook configured `mousedown-only`, when a mouse press opens the overlay and a further standalone `click` is dispatched, then the overlay stays mounted: the trailing click is ignored rather than toggling it closed. [base-ui] (candidate)
- [ ] `interaction-hooks.pointer.4` Given the hook set to ignore mouse input, when `pointerdown` with `pointerType: 'mouse'` is followed by `click`, then nothing opens. [base-ui] (candidate)
- [ ] `interaction-hooks.pointer.5` Given a touch open delay of 100ms, when `pointerdown` with `pointerType: 'touch'` is followed by `click`, then nothing opens until 100ms elapses; the delay applies only to opening, so closing on touch is immediate. [base-ui] (candidate)
- [ ] `interaction-hooks.pointer.6` Given both hover and click on the same trigger with the "stick if open" option on, when the trigger is hovered open and then clicked, then it stays open; with the option off, that first click closes it. [base-ui] (candidate)

### Focus management

- [ ] `interaction-hooks.focus.1` Given a focus-to-open hook with a 100ms delay, when the trigger is focused, the `window` then receives a `blur` (the tab or window was left) and a `focus` fires on the trigger again, then advancing 200ms leaves nothing open: focus restored after leaving the tab does not reopen the overlay. [base-ui] (candidate)

### State

- [ ] `interaction-hooks.state.1` Given a click-to-open hook configured with an explicit reason on a typeable `role="textbox"` reference, when the input is clicked, then the open change reports `true` with event details carrying that configured reason. [base-ui] (candidate)

## Sources

Research files and sections merged into this file:

- `apg-and-axe.md`: `## button` (all subsections, including the WHATWG HTML and axe-core bullets it carries).
- `ariakit-and-headlessui.md`: `## button`, `## focusable`.
- `kobalte-and-corvu.md`: `## button`.
- `radix-and-base-ui.md`: `## button`, `## hover-interaction`, `## interaction-hooks`.
- `react-aria-a.md`: `## button`, `## press`, `## press-responder`, `## hover`, `## keyboard`, `## long-press`, `## focusable`, `## focus-visible`, `## focus-events`, `## focus-within`, `## focus-safely`.
- `zag-and-ark.md`: `## button`, `## focus-visible`.

Radix has no button primitive of its own, so the `radix-and-base-ui.md` button
bullets are all Base UI; no bullet here is tagged `radix`. Reka, Melt and Bits
ship no button section at all.

## Deferred

- `## move` (react-aria drag primitive, `react-aria-a.md`): belongs with slider and colour-area, not button. Its keyboard contract (one arrow keydown fires `movestart`/`move`/`moveend` synchronously) is worth lifting when those components land.
- Long-press is specified above but not required for a first button implementation: no component in the inventory depends on it yet.
- Safe-polygon geometry and delay groups (`hover.pointer.12` to `.15`): these are tooltip and hover-card concerns. They stay recorded here because they came from the hover research, but the tests belong in those files.
- `press.notes.5` to `.9` (iOS and Android `user-select` suppression): platform workarounds that need a real engine and platform mocking, so they sit behind the browser-mode harness rather than the first jsdom suite.
- Styling contracts (default class names, `UNSAFE_className`, avatar and badge visual layout from `ariakit-and-headlessui.md`): a headless library emits no classes, so these have no conformance analogue.
- Framework-specific composition warnings (render-prop element mismatch, ref forwarding) are captured as `button.notes.5` and `.6` but will need per-adapter wording; the suite cannot assert React-shaped messages against a Solid adapter.
- Form-associated custom elements (`button.forms.4` to `.7`): the HTML mechanism is recorded, but no component in the inventory uses a custom element host yet.
