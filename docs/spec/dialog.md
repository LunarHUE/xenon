Covers the modal and non-modal dialog and its parts (trigger, backdrop or
overlay, positioner, content, title, description, close), plus the same
component under its other names: react-aria's `Modal`, `Tray`,
`DialogTrigger`, `DialogContainer` and Spectrum 2 dialogs. `alert-dialog` is
its own section below.

Layer primitives (outside press, Escape stacking, focus scope, scroll lock,
portals) are specified in `layering.md`. Anchored geometry for the popover and
tray forms is in `positioning.md`.

## dialog

### Roles and attributes

- [ ] `dialog.roles.1` Given a dialog container, then it MUST have `role="dialog"`, and every element required to operate the dialog MUST be a descendant of it. [apg]
- [ ] `dialog.roles.2` Given a modal dialog, then the container MUST have `aria-modal="true"`. [apg]
- [ ] `dialog.roles.3` Given a dialog, then it MUST have an accessible name, from `aria-labelledby` referring to a visible title or from `aria-label`; axe reports a missing name at serious impact and the role table requires one. [apg, axe]
- [ ] `dialog.roles.4` Given a dialog, then `aria-describedby` MAY point at the element describing its primary purpose, and SHOULD be omitted when the content holds lists, tables or several paragraphs, because the description is announced as one unbroken string. [apg]
- [ ] `dialog.roles.5` Given `aria-modal="true"`, then the implementation MUST actually prevent interaction with content outside the dialog AND the visual styling MUST obscure that content; marking a dialog modal without both is harmful to assistive technology users. [apg]
- [ ] `dialog.roles.6` Given a dialog that makes outside content inert with `aria-hidden` instead of `aria-modal`, then `aria-hidden="true"` MUST be set on each element containing part of the inert layer and the dialog MUST NOT be a descendant of any `aria-hidden="true"` element. [apg]
- [ ] `dialog.roles.7` Given the dialog container, then it MUST NOT be made focusable through `tabindex`; the APG example says so explicitly and the HTML specification forbids `tabindex` on a `dialog` element. [apg, html]
- [ ] `dialog.roles.8` Given the axe role table, then `dialog` is a window-type role whose only role-specific allowed attributes are `aria-expanded` and `aria-modal`, with no required owned elements, context or attributes; `aria-modal` on any role other than `dialog` or `alertdialog` fails `aria-allowed-attr` at critical impact. [axe]
- [ ] `dialog.roles.9` Given a dialog, then its open state MUST be reflected in the DOM, the native element using the `open` boolean attribute, and a `dialog` without `open` SHOULD NOT be shown. [html]
- [ ] `dialog.roles.10` Given a dialog closed with a return value, then `returnValue` MUST be set before the `close` event fires, and `close()` with no argument MUST set it to null. [html]
- [ ] `dialog.roles.11` Given a modal dialog, then an is-modal flag MUST be tracked separately from the open state, because only a modal dialog enters and leaves the top layer. [html]
- [ ] `dialog.roles.12` Given the `closedby` attribute, then its states are `any`, `closerequest` and `none`, and both the missing and invalid value defaults behave as Close Request when the dialog was shown modally and as None otherwise. [html]
- [ ] `dialog.roles.13` Given a button with `commandfor` pointing at a dialog, then only the `close`, `request-close` and `show-modal` command states are valid, mapping to closing, requesting close and showing modally. [html]
- [ ] `dialog.roles.14` Given a dialog with a rendered title part and no `aria-label`, then the content's `aria-labelledby` points at the title's id; an explicit `aria-label` is used instead and suppresses `aria-labelledby` entirely rather than emitting both; with no title part, `aria-labelledby` is omitted. [react-aria, radix, base-ui, zag, ariakit, kobalte, corvu, reka, melt, bits]
- [ ] `dialog.roles.15` Given a dialog with a rendered description part, then the content's `aria-describedby` points at the description's id, and it is omitted when no description part is rendered. [react-aria, radix, base-ui, zag, kobalte, corvu, bits]
- [ ] `dialog.roles.16` Given title and description parts that mount, change id, or unmount while the dialog stays open, then `aria-labelledby` and `aria-describedby` appear, follow the new ids, and are removed again in step. [radix, base-ui, bits]
- [ ] `dialog.roles.17` Given a role prop, then `dialog` and `alertdialog` are both accepted and applied to the content element, and an invalid value falls back to `dialog`. [react-aria, zag, headlessui, corvu]
- [ ] `dialog.roles.18` Given a dialog trigger, then it is a `button` carrying `aria-haspopup="dialog"`, `aria-expanded` reflecting the open state, and `aria-controls` pointing at the content id. [radix, base-ui, zag, corvu]
- [ ] `dialog.roles.19` Divergence: the trigger emits no `aria-controls` at all while the dialog is closed and its content is unmounted, so the attribute never points at a missing id. (decision needed) [radix, ark]
- [ ] `dialog.roles.20` Divergence: the trigger always emits `aria-controls` set to the content id, which resolves to nothing while the content is unmounted. (decision needed) [corvu]
- [ ] `dialog.roles.21` Given a dialog with several triggers, then only the trigger that opened it carries `aria-expanded="true"` and `aria-controls`, and the others stay at `aria-expanded="false"` with no `aria-controls`, including when the active trigger is chosen by a controlled prop and when another trigger mounts while the dialog is open. [base-ui, zag]
- [ ] `dialog.roles.22` Given an open dialog, then the content element carries `tabindex="-1"` so it can be focused programmatically without joining the tab sequence. [react-aria, zag, corvu]
- [ ] `dialog.roles.23` Given an open dialog, then the content and the backdrop each expose the open state as a data attribute (`data-state="open"` or `"closed"`, or a bare `data-open` and `data-closed` pair) so a stylesheet can target either phase. [radix, base-ui, zag, corvu, reka, bits]
- [ ] `dialog.roles.24` Given each rendered part, then it carries a stable marker attribute naming the component and the part, so styles and tests can address parts without relying on structure. [zag, ark, corvu, reka, bits]
- [ ] `dialog.roles.25` Given a backdrop, then it is exposed as `role="presentation"` rather than as a semantic element, and it is not announced. [base-ui, ariakit]
- [ ] `dialog.roles.26` Given an open dialog nested inside another open dialog, then the parent exposes the number of open nested dialogs as a CSS custom property and gains a nested-open data attribute, while the child exposes its own depth and a nested data attribute; both unwind as each level closes, and the count crosses dialog and alert dialog types. [base-ui, zag, bits]
- [ ] `dialog.roles.27` Given a closed dialog that stays mounted, then its content and backdrop both carry the `hidden` attribute, and opening removes it from both. [zag, ariakit]
- [ ] `dialog.roles.28` Given a dialog title part, then it is exposed as a heading with `aria-level="2"` by default and the level is overridable. (candidate) [bits]
- [ ] `dialog.roles.29` Given a dialog with no title, then `aria-labelledby` falls back to the trigger's id so the dialog is still named. (candidate) [react-aria]
- [ ] `dialog.roles.30` Given an author `aria-describedby` on the content alongside a rendered description, then the final value is whitespace-normalized and de-duplicated with the description's own id appended last. (candidate) [radix]
- [ ] `dialog.roles.31` Given a backdrop element, then it carries `aria-hidden="true"` so it and its children stay out of the accessibility tree even though it is pointer-interactive. (candidate) [corvu]
- [ ] `dialog.roles.32` Given a modal dialog, then the positioner carries inline `pointer-events: none` while the dialog is closed or non-modal, and the content carries inline `pointer-events: auto` when non-modal. (candidate) [zag]

### Keyboard

- [ ] `dialog.keyboard.1` Given an open modal dialog, when Tab is pressed, then focus MUST move to the next tabbable element inside the dialog, and from the last tabbable element it MUST wrap to the first. [apg, radix, base-ui, zag, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.keyboard.2` Given an open modal dialog, when Shift+Tab is pressed, then focus MUST move to the previous tabbable element inside the dialog, and from the first it MUST wrap to the last. [apg, radix, base-ui, zag, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.keyboard.3` Given an open modal dialog, then Tab and Shift+Tab MUST NOT move focus outside it, and there MUST be no way to move keyboard focus out without closing the dialog. [apg, radix, base-ui, ariakit, headlessui, melt, bits]
- [ ] `dialog.keyboard.4` Given an open modal dialog, when Escape is pressed, then the dialog MUST close, from any focusable element inside it. [apg, react-aria, radix, base-ui, zag, ark, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.keyboard.5` Given a modal dialog containing exactly one focusable element, when Tab or Shift+Tab is pressed, then focus MUST stay on that element. [apg, ariakit, headlessui, bits]
- [ ] `dialog.keyboard.6` Given this pattern's use of the term tabbable, then it means any element with a `tabindex` of zero or greater, and values above zero are strongly discouraged. [apg, axe]
- [ ] `dialog.keyboard.7` Given a dialog trigger with focus, when Enter or Space is pressed, then the dialog opens and focus moves inside it. [zag, ariakit]
- [ ] `dialog.keyboard.8` Given a focused field inside an open dialog whose own keydown handler cancels or stops the Escape event, when Escape is pressed, then the dialog stays open. [ariakit, headlessui, melt, bits]
- [ ] `dialog.keyboard.9` Given keyboard dismissal is disabled, when Escape is pressed, then the dialog stays open and keeps focus, while an in-dialog close control still closes it. [react-aria, base-ui, corvu, melt, bits]
- [ ] `dialog.keyboard.10` Given an open dialog containing an open child popup (a menu, select, combobox, popover or tooltip), when Escape is pressed, then only the child popup closes and the dialog stays open; a second Escape closes the dialog. [radix, base-ui, ariakit, melt, bits]
- [ ] `dialog.keyboard.11` Given nested dialogs, when Escape is pressed repeatedly, then exactly one layer closes per press, in reverse order, ending with focus on the original trigger. [react-aria, base-ui, ariakit, headlessui, corvu, melt, bits]
- [ ] `dialog.keyboard.12` Given a dialog closed by Escape, then the change event reports the reason as an escape key press, distinguishable from a trigger press, a close press, an outside press and an imperative action. [base-ui, zag]
- [ ] `dialog.keyboard.13` Given a dialog trigger inside a form, when Enter submits that form, then the dialog closes and focus returns to the control that opened it. (candidate) [ariakit]
- [ ] `dialog.keyboard.14` Given an ancestor with a capture-phase keydown handler that stops Escape, when Escape is pressed inside or outside the dialog, then neither the child popup nor the dialog closes, while the dialog's own bubble-phase or capture-phase handler stopping Escape does not lock it open. (candidate) [ariakit]
- [ ] `dialog.keyboard.15` Given an escape-handling callback, when Escape is pressed, then it is invoked exactly once whether it declines the close, accepts it, or calls `preventDefault()` on the event. (candidate) [ariakit]
- [ ] `dialog.keyboard.16` Given focus on an element outside an open dialog, when Escape is pressed there and nothing else claims it, then the dialog closes. (candidate) [ariakit]

### Pointer

- [ ] `dialog.pointer.1` Given a modal dialog, then backdrop click dismissal is not part of the APG pattern: the example wires no click handler on the backdrop, so a library that dismisses on backdrop click is going beyond the baseline. [apg]
- [ ] `dialog.pointer.2` Given a native dialog whose computed closed-by state is Any, then light dismiss requires a `pointerdown` and a matching `pointerup` on the same non-dialog target, so a drag that starts inside the dialog and ends outside MUST NOT dismiss it. [html]
- [ ] `dialog.pointer.3` Given content outside an active dialog, then an attempt to interact with it MAY close the dialog, which is one of the two conventional signals that the outside content is inert. [apg]
- [ ] `dialog.pointer.4` Given a closed dialog, when its trigger is clicked, then the content mounts and the dialog is shown. [react-aria, radix, base-ui, zag, ark, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.pointer.5` Given an open dialog, when a close control inside it is clicked, then the dialog closes. [react-aria, radix, base-ui, zag, ark, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.pointer.6` Given an open dialog, when the content or any descendant of it is clicked, then the dialog stays open. [radix, base-ui, ariakit, headlessui, reka, melt, bits]
- [ ] `dialog.pointer.7` Divergence: a modal dialog dismisses on an outside press or a backdrop press by default. (decision needed) [radix, base-ui, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.pointer.8` Divergence: a modal dialog ignores outside presses unless it is explicitly marked dismissable, while a non-modal one always dismisses on an outside press regardless of that flag. (decision needed) [react-aria]
- [ ] `dialog.pointer.9` Given a press that begins inside the dialog and ends outside it, or a dialog that opened during the press, when the gesture completes, then the dialog does not close. [base-ui, ariakit, headlessui, melt]
- [ ] `dialog.pointer.10` Given a non-modal dialog, when a press lands outside it, then the dialog closes and the press still reaches the page underneath, so the outside control is activated and can take focus; a modal dialog swallows the same press and restores pointer events after closing. [radix, base-ui]
- [ ] `dialog.pointer.11` Given an outside element whose own handler stops propagation of the interaction (any of `pointerdown`, `pointerup`, `mousedown`, `mouseup`, `click`, `touchstart` or `touchend`), when it is pressed, then the dialog stays open, and a later plain outside press still closes it. [radix, melt]
- [ ] `dialog.pointer.12` Given an open dialog on a touch device, when a tap completes outside it, then the dialog closes on the touch end rather than on the touch start, and the tap does not leak through to the control underneath. [base-ui, melt, bits]
- [ ] `dialog.pointer.13` Given an element inside the dialog that lives in a shadow tree, or is created by a third-party library, or removes itself in its own click handler, when it is clicked or focused, then the dialog stays open. [radix, base-ui, ariakit, headlessui]
- [ ] `dialog.pointer.14` Given an open dialog and a nested open menu, when the dialog body is clicked, then only the menu closes and focus lands on the dialog; when a point outside the dialog is clicked, then both close. [radix, base-ui, ariakit, bits]
- [ ] `dialog.pointer.15` Given an open modal dialog, when a `wheel` event with `ctrlKey` set fires on the content, then it is not prevented, so page and pinch zoom still work while the scroll lock is active. (candidate) [radix]
- [ ] `dialog.pointer.16` Given a right-button `pointerdown` outside an open dialog, then the dialog stays open and no open-change is reported. (candidate) [base-ui]
- [ ] `dialog.pointer.17` Given a single outside touch that moves more than 10 pixels, then the dialog closes on the move itself; a lift under that threshold closes it on touch end; and two simultaneous touches never close it, whether they are lifted together, lifted one at a time, or moved past the threshold. (candidate) [base-ui]
- [ ] `dialog.pointer.18` Given a press whose `pointerdown` opened the dialog, when the browser synthesizes the trailing `click` outside the popup, then it is not treated as an outside press, while a second complete press does dismiss. Chromium. (browser-only) (candidate) [base-ui]
- [ ] `dialog.pointer.19` Given an open dialog whose content is nested inside the backdrop element, when `pointerdown` fires on a control inside the content, then the event is not default-prevented and the dialog stays open. (candidate) [reka]
- [ ] `dialog.pointer.20` Given a scrollable backdrop, when its scrollbar is dragged, then the dialog stays open and the backdrop scrolls, and a plain backdrop click afterwards still closes the dialog. Chromium. (browser-only) (candidate) [ariakit]

### Focus management

- [ ] `dialog.focus.1` Given a dialog that opens, then focus MUST move to an element contained in the dialog, generally the first focusable element, with the most appropriate placement depending on the nature and size of the content. [apg, react-aria, radix, base-ui, zag, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.focus.2` Given a dialog that closes, then focus MUST return to the element that invoked it. [apg, react-aria, radix, base-ui, zag, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.focus.3` Given a dialog whose invoking element no longer exists when it closes, then focus MUST be set on another element that provides a logical work flow rather than falling to the body. [apg, react-aria, base-ui]
- [ ] `dialog.focus.4` Given dialog content whose semantic structure must be perceived, or content long enough that focusing the first interactive element would scroll the start out of view, then a static element at the top SHOULD be given `tabindex="-1"` and focused initially, and `aria-describedby` SHOULD then be omitted from the container. [apg]
- [ ] `dialog.focus.5` Given a dialog limited to providing information or continuing processing, then focus SHOULD be set on the element most likely to be used, such as an OK or Continue button. [apg]
- [ ] `dialog.focus.6` Given a dialog whose completed task feeds directly into a following step and which users are unlikely to re-invoke, then focus MAY move to that next step instead of back to the invoker. [apg]
- [ ] `dialog.focus.7` Given any dialog, then its tab sequence SHOULD include a visible control that closes it, such as a close icon or a cancel button. [apg]
- [ ] `dialog.focus.8` Given a dialog whose initial focus target is a static element, then that element MUST carry `tabindex="-1"` so it is programmatically focusable without entering the tab sequence, and the first Tab from it MUST land on the first real tabbable element. [apg]
- [ ] `dialog.focus.9` Given a dialog implementation, then both the initial focus target and the element to restore focus to MUST be resolvable explicitly rather than only inferred from DOM order, and the restore target MUST be captured at open time. [apg, react-aria, base-ui, zag, corvu, melt, bits]
- [ ] `dialog.focus.10` Given the native dialog focusing steps, then the focus target MUST be resolved in this order: the dialog itself when it carries `autofocus`, otherwise the dialog's focus delegate, otherwise the dialog element itself; and `autofocus` inside a dialog MUST take effect when the dialog is shown rather than at page load. [html]
- [ ] `dialog.focus.11` Given a native dialog closed with `close()`, then the focusing steps for the previously focused element MUST run without scrolling the viewport before the `close` event is queued. [html]
- [ ] `dialog.focus.12` Divergence: initial focus goes to the first tabbable element inside the content. (decision needed) [radix, base-ui, zag, ariakit, headlessui, corvu, reka, bits]
- [ ] `dialog.focus.13` Divergence: initial focus goes to the dialog container itself, which carries `tabindex="-1"`, so screen readers announce the whole dialog rather than one control. (decision needed) [react-aria, melt]
- [ ] `dialog.focus.14` Given a child inside the content that carries the native `autofocus` attribute, when the dialog opens, then that child keeps focus and the dialog does not move it. [react-aria, base-ui, headlessui]
- [ ] `dialog.focus.15` Given an explicit initial-focus target, when the dialog opens, then that element receives focus instead of the default, and a value of false leaves focus on the trigger. [base-ui, zag, headlessui, corvu, melt, bits]
- [ ] `dialog.focus.16` Given a cancelable open-auto-focus event dispatched as the dialog opens, when a handler calls `preventDefault()`, then the library focuses nothing and the handler's own focus call stands. [corvu, reka, bits]
- [ ] `dialog.focus.17` Given an explicit final-focus target, when the dialog closes, then focus lands there instead of on the trigger, and a value of false leaves focus wherever it is. [base-ui, zag, corvu, melt, bits]
- [ ] `dialog.focus.18` Given a cancelable close-auto-focus event dispatched as the dialog closes, when a handler calls `preventDefault()`, then focus restoration is skipped and the handler's own target keeps focus. [corvu, bits]
- [ ] `dialog.focus.19` Given a dialog that stays mounted while closed, then it pulls no focus while closed, focuses its content on every open transition rather than only on first mount, and restores focus to the trigger on every close. [reka, bits]
- [ ] `dialog.focus.20` Given a dialog opened from a control that the opening itself unmounts, such as a menu item, when the dialog later closes, then focus returns to the control that opened the menu rather than to the body. [react-aria, base-ui]
- [ ] `dialog.focus.21` Given nested dialogs, when the inner one closes, then focus returns to the control inside the parent that opened it, not to the parent's first focusable element. [react-aria, base-ui, zag, ariakit, headlessui, bits]
- [ ] `dialog.focus.22` Given nested dialogs, while the inner one is open, then the outer one never reclaims focus, and a programmatic focus attempt on an element outside both leaves focus inside the innermost dialog. [react-aria, base-ui, reka]
- [ ] `dialog.focus.23` Given an open modal dialog whose focused element is removed from the DOM, then focus moves to another element inside the dialog and Tab still cycles within it. [react-aria, radix, base-ui, reka]
- [ ] `dialog.focus.24` Given a non-modal dialog, then focus is not trapped: Tab moves out of it in document order, and the dialog either closes on focus-out or stays open according to its configuration. [radix, base-ui]
- [ ] `dialog.focus.25` Given an open dialog, when Escape or an outside press is configured to be ignored, then the focus trap stays active and ten consecutive Tab presses keep focus inside the content. (candidate) [melt]
- [ ] `dialog.focus.26` Given a dialog opened programmatically while an unrelated element held focus, when it closes, then focus returns to the element that was focused at open time. (candidate) [bits]
- [ ] `dialog.focus.27` Given a dialog opened by touch and no explicit initial-focus target, then the content element itself takes focus rather than an inner text field, so the virtual keyboard does not open. (candidate) [base-ui]
- [ ] `dialog.focus.28` Given an initial-focus callback, then it receives the interaction type that opened the dialog (keyboard, touch or pointer) and is not invoked on close. (candidate) [base-ui]
- [ ] `dialog.focus.29` Given a dialog rendered as a modal, a popover or a tray, then focus is contained in all three forms and Tab cycles the dialog's own fields. (candidate) [react-aria]
- [ ] `dialog.focus.30` Given a portalled descendant of the content registered as a focus-scope branch, when a control inside it is focused, then it keeps focus instead of the trap reclaiming it. (candidate) [radix]
- [ ] `dialog.focus.31` Given a dialog whose content is replaced by a new view that focuses its own field on mount, then the new field keeps focus even though the stored last-focused element points at a removed node. (candidate) [reka]
- [ ] `dialog.focus.32` Given a form control literally named `activeElement`, `self` or `document` inside the dialog, when the dialog opens and closes, then the document lookups the dialog relies on still resolve and focus restoration works. (browser-only) (candidate) [ariakit]
- [ ] `dialog.focus.33` Given a long dialog body, when the dialog opens, then the initially focused control is focused without scrolling the body. (browser-only) (candidate) [ariakit]

### State

- [ ] `dialog.state.1` Given the APG example blanks every input inside the dialog when it is constructed, then a library MUST decide deliberately whether opening a dialog resets its form state. [apg]
- [ ] `dialog.state.2` Given a controlled open prop, when the dialog would open or close itself, then only the change callback fires and the rendered state follows the prop, so Escape and outside presses leave a pinned-open dialog open. [react-aria, base-ui, zag, ark, ariakit, corvu, reka, bits]
- [ ] `dialog.state.3` Given an uncontrolled dialog with a default-open prop, when it mounts, then it is open, and it manages its own state from there. [react-aria, radix, base-ui, zag, corvu, bits]
- [ ] `dialog.state.4` Given a change callback, then it fires once per transition with the new state, and carries the reason for the change (trigger press, close press, escape key, outside press, imperative action). [react-aria, base-ui, zag, ark, corvu, reka, bits]
- [ ] `dialog.state.5` Given a change callback that vetoes the change, when the dialog would open or close, then nothing happens: no content mounts on a vetoed open, and a vetoed close leaves the dialog open with its trigger state unchanged. [base-ui, zag, ariakit, corvu, melt]
- [ ] `dialog.state.6` Given a dialog with several triggers, when one is clicked while the dialog is already open from another, then the content swaps to the new trigger's payload without closing, and the popup DOM node is reused rather than remounted. [base-ui, zag]
- [ ] `dialog.state.7` Given a dialog whose backdrop prop toggles between present and absent while it is open, then only the backdrop mounts or unmounts: the content element identity, its form values and its internal state all survive. (candidate) [ariakit]
- [ ] `dialog.state.8` Given the open state is set twice in one tick, then the last value wins and the change callback fires at most once; repeating the same value fires nothing, and closing an already closed dialog fires nothing. (candidate) [zag]
- [ ] `dialog.state.9` Given a dialog trigger or close control that is disabled, then it carries a disabled state (the native attribute on a button, `aria-disabled` on a custom element, plus a data attribute), does not open or close the dialog when clicked, and is skipped by Tab. (candidate) [base-ui]
- [ ] `dialog.state.10` Given a close control clicked after the dialog has already closed but is still mounted, then the author's own click handler runs but no further open-change is requested. (candidate) [base-ui]
- [ ] `dialog.state.11` Given a detached trigger bound to the dialog by a shared handle rather than by nesting, then it opens and closes the dialog, reports `aria-expanded` and `aria-controls` correctly, keeps working when it is reparented or the handle is recreated, and can carry a payload that the content renders. (candidate) [base-ui]
- [ ] `dialog.state.12` Given imperative handle calls made while no root is attached, or after the root unmounted, then they are ignored, warn in development only, and the dialog state resets rather than carrying a stale payload or open state into a remounted root. (candidate) [base-ui]
- [ ] `dialog.state.13` Given an actions ref, then `close()` closes the dialog and `unmount()` removes a popup that a handler kept mounted by declining the unmount, and that manual state is cleared afterwards. (candidate) [base-ui]

### Forms

- [ ] `dialog.forms.1` Given a form inside an open dialog, when it is submitted, then the submission goes through. [ariakit, headlessui]
- [ ] `dialog.forms.2` Given a dialog with a dirty form whose dismissal is guarded, when Escape is pressed, the backdrop is clicked, or the dismiss control is used, then a confirmation dialog opens with its least destructive action focused and the original dialog stays visible but inert; dismissing the confirmation returns focus to the field, and confirming closes both and returns focus to the original trigger. [base-ui, ariakit]
- [ ] `dialog.forms.3` Given the same dialog with an empty form, when the dismiss control is used, then it closes with no confirmation. (candidate) [ariakit]
- [ ] `dialog.forms.4` Given a dialog whose form is submitted from inside the content, then the dialog closes with the submitted value and focus returns to the opener, while cancelling keeps the previously saved value. (browser-only) (candidate) [ariakit]

### Dismissal and layering

- [ ] `dialog.dismissal.1` Given a modal dialog, then content outside it MUST be inert: users MUST NOT be able to interact with it, and it is typically visually obscured or dimmed. [apg, html]
- [ ] `dialog.dismissal.2` Given `showModal()`, then it MUST throw when the element is not connected, not fully active, or already showing as a popover; MUST set the is-modal flag; MUST block the node document with that dialog; and MUST add the element to the top layer. [html]
- [ ] `dialog.dismissal.3` Given a document blocked by a modal dialog, then every node connected to it MUST become inert except the dialog and its flat-tree descendants, where inert means hit-testing acts as `pointer-events: none`, selection acts as `user-select: none`, editable content becomes non-editable, find-in-page SHOULD skip it, and the node is not exposed to accessibility APIs. [html]
- [ ] `dialog.dismissal.4` Given an inert element, then it MUST NOT be a focusable area, so it cannot be focused by click, by Tab, or by `focus()`. [html]
- [ ] `dialog.dismissal.5` Given `show()` on a native dialog, then it MUST return early when the dialog is already open and non-modal, throw when it is open and modal, fire a cancelable `beforetoggle` and abort when that is cancelled, queue a `toggle` task, add the `open` attribute, record the previously focused element, hide popovers up to the topmost popover ancestor, and then run the dialog focusing steps. [html]
- [ ] `dialog.dismissal.6` Given `requestClose(returnValue)`, then it MUST fire a cancelable `cancel` event first and close exactly as `close()` does only when that is not prevented, and it MUST ignore `closedby` entirely, so even `closedby="none"` still closes. [html]
- [ ] `dialog.dismissal.7` Given several stacked dialogs, then the stack MUST be tracked explicitly so Escape closes only the top one, and closing a child MUST reactivate the parent's focus trap. [apg, react-aria, base-ui, ariakit, corvu, melt, bits]
- [ ] `dialog.dismissal.8` Given a dialog opens, then body scrolling MUST be suppressed, and it MUST be restored only once no dialog remains open. [apg, react-aria, base-ui, zag, ariakit, headlessui, corvu, reka, bits]
- [ ] `dialog.dismissal.9` Given a dialog that replaces another in place, then the replacement inherits the outgoing dialog's focus-restoration target unless a new one is given. [apg]
- [ ] `dialog.dismissal.10` Given a modal dialog that locks page scroll, then the lock is applied to whichever of the document element and the body actually owns the viewport scroll, the author's own inline overflow value is restored exactly on close, and no scrollbar compensation padding is added when `scrollbar-gutter: stable` is already in effect. [base-ui, zag, ariakit, corvu, bits]
- [ ] `dialog.dismissal.11` Given an open modal dialog, then `document.body` gets inline `pointer-events: none` while the dialog's own content keeps `pointer-events: auto`, and the body value is restored to its original on close, including when two dialogs overlap because one is still animating out. [radix, zag, corvu, reka]
- [ ] `dialog.dismissal.12` Given a non-modal dialog, then nothing on the page is made inert, no internal backdrop is rendered, and page scroll is not locked. [radix, base-ui]
- [ ] `dialog.dismissal.13` Given an open modal dialog, then outside content is removed from the accessibility tree and restored on close, and a nested dialog hides the parent dialog too while leaving it visually present. [react-aria, base-ui, zag, ariakit, kobalte]
- [ ] `dialog.dismissal.14` Given a nested popup inside an open dialog (a menu, a select listbox, a popover or another dismissable layer), when that popup is dismissed by Escape or by pressing outside it, then only the popup closes and the dialog stays open with its own dismissal still wired. [radix, base-ui, ariakit, melt, bits]
- [ ] `dialog.dismissal.15` Given several modal dialogs opened in turn, then opening a new one does not dismiss the previous one, and outside presses close them one layer at a time from the top. [base-ui, ariakit]
- [ ] `dialog.dismissal.16` Given a dialog that is closed and reopened, then its dismissal wiring is rebuilt, so Escape and outside presses work in the second session exactly as in the first, and no stale document listener dismisses the new layer. [base-ui, bits]
- [ ] `dialog.dismissal.17` Given a persistent region outside the dialog such as a toast or notification area, then it stays interactive and exposed under a modal dialog, and interacting with it does not dismiss the dialog. [zag, ariakit]
- [ ] `dialog.dismissal.18` Given a screen reader user with no visible close control, then a hidden dismiss control is provided: a tray renders one before and one after its content, and a modal dialog with no dismiss element of its own gets a fallback dismiss button rendered next to the dialog, which is removed as soon as the dialog gains its own. [react-aria, ariakit]
- [ ] `dialog.dismissal.19` Given nested dialogs each rendering a backdrop, then only the outermost backdrop is in the DOM by default, and a per-backdrop flag opts into rendering all of them. (candidate) [base-ui]
- [ ] `dialog.dismissal.20` Given a third-party scroll lock that is still unlocking when a modal dialog opens, then the page stays locked across the handoff with no scrollable gap, and unlocks once the dialog closes. (browser-only) (candidate) [base-ui]
- [ ] `dialog.dismissal.21` Given a document event whose target is not a Node (a window, an XHR, or another third-party dispatch), then the outside-interaction and Escape listeners handle it without throwing and the dialog stays open. (browser-only) (candidate) [ariakit]
- [ ] `dialog.dismissal.22` Given two keep-mounted dialogs where a closed one mounted after the open one, when Escape is pressed, then the open dialog closes and the closed one neither swallows the key nor receives outside-interaction callbacks. (candidate) [reka]
- [ ] `dialog.dismissal.23` Given a modal dialog, then the body pointer-events lock is driven by the content's own flag rather than hardcoded, so turning it off leaves the body untouched. (candidate) [reka]

### Positioning

- [ ] `dialog.positioning.1` Given a dialog with no portal target, then its content is portalled to the document body rather than rendered in place. [react-aria, radix, base-ui, zag, ark, ariakit, headlessui, corvu, reka, melt, bits]
- [ ] `dialog.positioning.2` Given an explicit portal target (an element, a ref, or a selector), then the content's parent is that target; a disabled portal renders the content in place instead, and disabling wins over a supplied target. [react-aria, base-ui, ark, melt, bits]
- [ ] `dialog.positioning.3` Given a trigger with no overlay type, then a modal is rendered; a tray type renders the dialog inside a tray, and a popover type renders it inside an anchored popover whose position comes from `positioning.md`. (candidate) [react-aria]

### Animation and presence

- [ ] `dialog.animation.1` Given a closing dialog with an exit animation or transition, then the content stays in the document until that animation ends and only then unmounts, and it is neither hidden nor display-none while leaving. [base-ui, zag, ark, ariakit, corvu, reka, melt, bits]
- [ ] `dialog.animation.2` Given a dialog that opens and closes, then the content and the backdrop each expose an entering marker and a leaving marker so a stylesheet can drive both phases, and the entering marker is re-added on reopen. [base-ui, ariakit, bits]
- [ ] `dialog.animation.3` Given a dialog configured to stay mounted while closed, then its content remains in the document, is hidden from assistive technology and from pointer interaction, and becomes live again on open. [base-ui, zag, ark, ariakit, reka, bits]
- [ ] `dialog.animation.4` Given a completion callback, then it fires after the enter animation finishes with the open state and after the exit animation finishes with the closed state, fires immediately when no animation is defined, is not called on mount while closed, and fires exactly once even when the animation restarts mid-flight or the dialog is dismissed during the enter animation. [base-ui, ark]
- [ ] `dialog.animation.5` Given a dialog whose backdrop and content have different animation durations, then each has its own presence lifetime, the portal outlives whichever finishes last, and the shorter one does not cut the longer one short. [ariakit, corvu]
- [ ] `dialog.animation.6` Given a dialog with an exit animation, when it closes, then focus returns to the trigger immediately while the content is still visible for the duration of the animation. [react-aria, ariakit]
- [ ] `dialog.animation.7` Given a dialog wrapped in a transition component, then the scroll lock is applied only once the transition actually shows the dialog and released as soon as it begins closing, and it is held across a swap from one dialog to another rather than released in between. (candidate) [headlessui]
- [ ] `dialog.animation.8` Given a lazily mounted dialog, then nothing is in the DOM before the first open, it mounts on open, and it stays mounted after close unless unmount-on-exit is also set. (candidate) [ark]
- [ ] `dialog.animation.9` Given a hide mode of display-none, then the closed content keeps the `hidden` attribute while staying mounted; given a hide mode that preserves activity, then it stays mounted with no `hidden` attribute. (candidate) [ark]
- [ ] `dialog.animation.10` Given a user who prefers reduced motion, when the dialog opens, then neither the dialog nor the backdrop animation runs. (browser-only) (candidate) [ariakit]

### RTL and i18n

- [ ] `dialog.rtl.1` Given each rendered part, then it carries the resolved writing direction so styles can react to it without reading the ancestor chain. (candidate) [zag]
- [ ] `dialog.rtl.2` Given a small screen, then a popover-type dialog degrades to a modal, or to a tray when that is requested, and the fallback stays dismissable by an outside press. (candidate) [react-aria]

### SSR and hydration

- [ ] `dialog.ssr.1` Given a closed dialog rendered on the server, then it emits no dialog markup at all, and after hydration the dialog behaves normally with no mismatch. [react-aria, base-ui, ark, corvu]
- [ ] `dialog.ssr.2` Given ids generated for the content, the title and the description, then they must be stable across server and client render for `aria-labelledby`, `aria-describedby` and `aria-controls` to survive hydration. [base-ui, corvu]
- [ ] `dialog.ssr.3` Given a dialog whose open state is driven by the URL, then direct navigation to that URL renders it open with the right field focused, and back, forward and reload all keep the state and focus consistent. (browser-only) (candidate) [ariakit]

### Accessibility tooling

- [ ] `dialog.a11y.1` Given background content made inert with `aria-hidden="true"` while a modal dialog is open, then that content MUST NOT contain any focusable element; axe reports it at serious impact, evaluates only the outermost `aria-hidden="true"` element, and separately reports incomplete while a modal is open. [axe]
- [ ] `dialog.a11y.2` Given a dialog with a scrollable body, then that scroll container MUST contain a focusable element or be focusable itself, and a container given `tabindex="0"` passes the focus-order rule only through the scrollable-region branch, because `dialog` is a window-type rather than a widget-type role. [axe]
- [ ] `dialog.a11y.3` Given a dialog rendered inside an `iframe`, then the frame MUST NOT have `tabindex="-1"` while it contains focusable content. [axe]
- [ ] `dialog.a11y.4` Given any element with a role, then the role MUST be valid, non-abstract and widely supported, every ARIA attribute on it MUST be allowed for that role and host element and MUST NOT be deprecated, all required attributes MUST be present, every `aria-*` name and value MUST be valid, and ids referenced by `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-owns` or `aria-activedescendant` MUST be unique in the document. [axe]
- [ ] `dialog.a11y.5` Given any element with `tabindex`, then the value MUST NOT be greater than zero, so a library emits only 0 and -1. [axe]
- [ ] `dialog.a11y.6` Given a dialog both closed and open, when the tree is audited with axe, then there are no violations. [radix, zag, ark, reka, melt]
- [ ] `dialog.a11y.7` Given a dialog with no accessible name, then a development warning says a dialog must have a title for accessibility, and no warning is emitted once `aria-label`, `aria-labelledby` or a rendered title part is present. [react-aria, reka]
- [ ] `dialog.a11y.8` Given a dialog with no description part, then a development warning is emitted once, and passing an explicit undefined `aria-describedby` opts out of that warning. (candidate) [reka]

### Notes and edge cases

- [ ] `dialog.notes.1` Given a focus trap, then it MAY be implemented without intercepting Tab at all: the APG example places `tabindex="0"` sentinel elements immediately before and after the dialog plus a capture-phase `focus` listener on the document that redirects focus back inside, inferring the wrap direction from whether the first descendant already held focus. [apg]
- [ ] `dialog.notes.2` Given a dialog implementation, then the focusable descendants SHOULD be discovered by walking the DOM and attempting focus rather than by matching a hard-coded selector list, verifying the active element afterwards. [apg]
- [ ] `dialog.notes.3` Given the APG examples, then modal dialogs are built on a plain `div` rather than the native `dialog` element, and the APG suite has no automated assertion that focus returns to the invoker, so a conformance suite MUST add that test itself. [apg]
- [ ] `dialog.notes.4` Given a dialog whose trigger passes an explicitly undefined click handler, then the built-in handler still runs and the dialog opens, so prop merging never lets undefined overwrite the library's own handler. [radix, base-ui, ariakit]
- [ ] `dialog.notes.5` Given a part rendered with no dialog ancestor, then it throws a descriptive error naming the missing root rather than failing silently. [base-ui, headlessui, corvu]
- [ ] `dialog.notes.6` Given a dialog opened in a test, then the outside-press listener is registered asynchronously (a timer, a microtask or a frame), so a suite must flush that before firing an outside press, and must unmount keep-mounted dialogs explicitly or the layer leaks into module-level tracking across tests. [radix, zag, corvu, reka, bits]
- [ ] `dialog.notes.7` Given jsdom, then presence detection reads an empty computed animation name and concludes an animation is running, scroll-lock measurement reports a zero scrollbar width, and focus work deferred past a paint needs two frames flushed, so exit-unmount, scrollbar compensation and focus assertions all need stubs or a browser harness. (browser-only) [corvu, reka]
- [ ] `dialog.notes.8` Given a dialog opened from a control that unmounts as a result (a menu item), then a warning says the trigger unmounted while open and recommends a container component instead, and using that container keeps the dialog open after the menu disappears. (candidate) [react-aria]
- [ ] `dialog.notes.9` Given a command-menu dialog built from a dialog plus a combobox, then the dialog opens with the combobox focused and the first option active, arrow keys move the active option while DOM focus stays on the input, typing filters the list and reports no results, closing and reopening resets the filter, and Escape returns focus to the trigger. (candidate) [ariakit]
- [ ] `dialog.notes.10` Given a combobox inside a dialog whose result list changes asynchronously, then the input's horizontal scroll position is preserved. (browser-only) (candidate) [ariakit]

## alert-dialog

An alert dialog interrupts the user's workflow to communicate an important
message and get a response. Everything in the `dialog` section above applies
unless a bullet here says otherwise.

### Roles and attributes

- [ ] `alert-dialog.roles.1` Given a dialog that interrupts the workflow to communicate an important message and acquire a response, then the element containing all of its parts, including the message and the buttons, MUST have `role="alertdialog"`, which lets assistive technology give it special treatment such as a system alert sound. [apg, react-aria, radix, base-ui, zag, headlessui, kobalte, corvu, reka, bits]
- [ ] `alert-dialog.roles.2` Given an alert dialog, then the container MUST have `aria-modal="true"`, and the same only-when-both constraint applies: interaction outside MUST actually be prevented and the outside content MUST be visually obscured. [apg]
- [ ] `alert-dialog.roles.3` Given an alert dialog with a visible label, then it MUST have `aria-labelledby` referring to the title element; otherwise it MUST have `aria-label`. [apg, radix, base-ui, kobalte, corvu]
- [ ] `alert-dialog.roles.4` Given an alert dialog, then it MUST have `aria-describedby` referring to the element containing the alert message; unlike a plain dialog this is required rather than optional. [apg, react-aria, base-ui, kobalte, bits]
- [ ] `alert-dialog.roles.5` Given an alert dialog container, then it MUST NOT carry `tabindex`. [apg]
- [ ] `alert-dialog.roles.6` Given the axe role table, then `alertdialog` is a window-type role whose superclasses are `alert` and `dialog`, whose only role-specific allowed attributes are `aria-expanded` and `aria-modal`, and for which an accessible name is required; the same best-practice name rule covers both dialog roles. [axe]
- [ ] `alert-dialog.roles.7` Given an alert dialog with no explicit description reference, then the description is wired automatically from the rendered content, and only alert dialogs do this: a plain dialog emits no `aria-describedby` even when the same content part is rendered. [react-aria, base-ui]
- [ ] `alert-dialog.roles.8` Given an alert dialog trigger, then it carries `aria-haspopup="dialog"` (not `alertdialog`) along with `aria-expanded` and, while open, `aria-controls` pointing at the content. [radix, base-ui]
- [ ] `alert-dialog.roles.9` Given an explicit author `aria-describedby` on an alert dialog, then the author's value is used, it points at exactly the element the author named rather than the whole content, and no unused generated id is emitted. (candidate) [react-aria]
- [ ] `alert-dialog.roles.10` Given an alert dialog title with no level, then it is exposed as a heading with `aria-level="2"`, overridable per instance. (candidate) [bits]

### Keyboard

- [ ] `alert-dialog.keyboard.1` Given an alert dialog, then it MUST implement the full modal dialog keyboard interaction: Tab and Shift+Tab cycle within the dialog and Escape closes it. [apg, base-ui, bits]
- [ ] `alert-dialog.keyboard.2` Given a native alert dialog shown modally, then its computed closed-by state defaults to Close Request, so Escape closes it through the close watcher, firing a cancelable `cancel` and then `close`. [html]
- [ ] `alert-dialog.keyboard.3` Given an alert dialog that must not be dismissable by clicking outside, then `closedby="none"` suppresses light dismiss but `requestClose()` ignores `closedby` entirely and still closes, so a library MUST NOT rely on `closedby` to make a dialog unclosable. [html]
- [ ] `alert-dialog.keyboard.4` Given a widget with an alert dialog, then a keyboard shortcut MAY perform the same action as the primary button. [apg]
- [ ] `alert-dialog.keyboard.5` Given Escape dismissal is configured to be ignored, when Escape is pressed, then the content stays and focus does not return to the trigger. (candidate) [bits]

### Pointer

- [ ] `alert-dialog.pointer.1` Given an open alert dialog, when the backdrop or any point outside the content is pressed, then it does NOT dismiss: an alert dialog demands an explicit response, and the APG example wires no backdrop handler at all. [apg, base-ui, bits]
- [ ] `alert-dialog.pointer.2` Given an open alert dialog, when its cancel or action control is clicked, then the dialog closes. [radix, base-ui, reka, bits]
- [ ] `alert-dialog.pointer.3` Given an open alert dialog, when its content is clicked, then it stays open. [base-ui, bits]
- [ ] `alert-dialog.pointer.4` Given outside dismissal is explicitly opted into, then an outside press fires the interact-outside callback and closes the alert dialog. (candidate) [bits]
- [ ] `alert-dialog.pointer.5` Given an alert dialog with primary, secondary and cancel actions, when each is clicked, then only that action's callback fires, and a disabled primary or secondary action fires nothing. (candidate) [react-aria]

### Focus management

- [ ] `alert-dialog.focus.1` Given an alert dialog that confirms an action which is not easily reversible, such as deleting data or completing a financial transaction, then initial focus MUST land on the least destructive action; the APG example focuses No rather than Yes. [apg, radix]
- [ ] `alert-dialog.focus.2` Divergence: initial focus goes to the least destructive action button inside the alert dialog. (decision needed) [apg, radix]
- [ ] `alert-dialog.focus.3` Given an alert dialog whose action applies to a specific control, then focus on close returns to that control rather than to the button that opened the dialog, because the restore target is passed explicitly. [apg, base-ui]
- [ ] `alert-dialog.focus.4` Given a trigger whose action is currently unavailable, then it MUST use `aria-disabled="true"` rather than the native `disabled` attribute so it stays in the Tab order and discoverable, and the open handler MUST refuse to open while that is set. [apg]
- [ ] `alert-dialog.focus.5` Divergence: initial focus goes to the alert dialog content element itself so screen readers announce the whole alert, unless a specific button is named. (decision needed) [react-aria, bits]
- [ ] `alert-dialog.focus.6` Given an alert dialog closed by Escape, then focus returns to the trigger, including when the content is force-mounted. [base-ui, bits]
- [ ] `alert-dialog.focus.7` Given an explicitly named action to autofocus (primary, secondary or cancel), then that button is the active element when the alert dialog opens. (candidate) [react-aria]
- [ ] `alert-dialog.focus.8` Given cancelable open-auto-focus and close-auto-focus events, then a handler that calls `preventDefault()` can place focus itself on open and on close. (candidate) [bits]

### State

- [ ] `alert-dialog.state.1` Given an alert dialog with a trigger and a close control, then the change callback fires once with the open state on each transition and carries the reason (trigger press, close press, escape key) along with the trigger element. [base-ui, bits]
- [ ] `alert-dialog.state.2` Given a controlled alert dialog whose handler declines a close, then the popup stays open, the trigger keeps its open-state data attribute, and any bound handle still reports it as open. (candidate) [base-ui]
- [ ] `alert-dialog.state.3` Given an actions ref, then `close()` closes the alert dialog and `unmount()` removes a popup that a handler kept mounted, clearing that manual state afterwards. (candidate) [base-ui]
- [ ] `alert-dialog.state.4` Given several triggers or detached triggers bound by one handle, then any of them opens the alert dialog, the active one owns the aria state, each may carry a payload the content renders, and the popup DOM node is reused when switching triggers. (candidate) [base-ui]

### Dismissal and layering

- [ ] `alert-dialog.dismissal.1` Given an open alert dialog, then the rest of the page is made inert and removed from the accessibility tree exactly as for a modal dialog, and modality cannot be turned off. [apg, base-ui]
- [ ] `alert-dialog.dismissal.2` Given an alert dialog built on the native `dialog` element, then every rule of the dialog element applies unchanged: `showModal()` blocks the document and makes everything else inert, `close()` restores focus without scrolling and then fires `close`, and `requestClose()` fires a cancelable `cancel` first. [html]
- [ ] `alert-dialog.dismissal.3` Given the APG example, then only one alert dialog MAY be open at a time: it tracks a single open dialog rather than a stack and restores body scrolling unconditionally on close, and it toggles no `aria-hidden` on siblings, conveying modality through `aria-modal` and the focus trap alone. [apg]
- [ ] `alert-dialog.dismissal.4` Given an alert dialog nested inside a dialog, or a dialog nested inside an alert dialog, then the nesting depth and nested-open counters track across the two types in both directions and unwind as each level closes. [base-ui, bits]
- [ ] `alert-dialog.dismissal.5` Given an open alert dialog with a modal backdrop, then the body carries `pointer-events: none` while the content keeps `pointer-events: auto`. [zag, corvu, reka]

### Animation and presence

- [ ] `alert-dialog.animation.1` Given a force-mounted alert dialog, then its content and backdrop are already in the document before the first open, unless an explicit open check is also used, in which case both appear only once it opens. (candidate) [bits]
- [ ] `alert-dialog.animation.2` Given a completion callback, then it fires with the open state after the enter animation and with the closed state after the exit animation, and immediately when no animation is defined. (candidate) [base-ui]

### Accessibility tooling

- [ ] `alert-dialog.a11y.1` Given `aria-describedby` on an alert dialog, then the referenced id MUST resolve; an unresolvable reference is reported as incomplete rather than as a pass. [axe]
- [ ] `alert-dialog.a11y.2` Given confirm and cancel buttons that use `aria-disabled="true"` to stay focusable, then the aria-hidden-focus rule is not triggered, because only `aria-hidden` and the native `disabled` attribute affect axe's focusability model. [axe]
- [ ] `alert-dialog.a11y.3` Given an alert dialog both closed and open, when the tree is audited with axe, then there are no violations. [radix, reka]

### Notes and edge cases

- [ ] `alert-dialog.notes.1` Given the APG alert dialog example, then a separate `role="alert"` live region sits next to the control it describes, outside the alert dialog, for non-interrupting status messages: `alertdialog` and `alert` are distinct components in the same widget. [apg]
- [ ] `alert-dialog.notes.2` Given the APG alert dialog suite, then it has no Shift+Tab assertion even though the documented keyboard table includes backward wrap, so a conformance suite MUST add it. [apg]
- [ ] `alert-dialog.notes.3` Given the alert dialog's focus trap, then it uses the same sentinel-node and capture-phase focus listener mechanism as the modal dialog with the stack support removed. [apg]

## Sources

- `docs/research/apg-and-axe.md`: `dialog`, `alert-dialog`.
- `docs/research/ariakit-and-headlessui.md`: `dialog`.
- `docs/research/kobalte-and-corvu.md`: `dialog`, `alert-dialog`.
- `docs/research/radix-and-base-ui.md`: `dialog`, `alert-dialog`.
- `docs/research/react-aria-a.md`: `dialog`, `alert-dialog`, `dialog-trigger`, `dialog-container`, `modal`, `tray`, `s2-dialog`.
- `docs/research/reka-melt-bits.md`: `dialog`, `alert-dialog`.
- `docs/research/zag-and-ark.md`: `dialog`.

## Deferred

- The WHATWG `popover` attribute rules arrived inside the `dialog` research section and belong to `popover.md`, not here. They are recorded rather than lost: the `auto`, `manual` and `hint` states with their missing, invalid and empty value defaults; `showPopover()` re-checking validity after `beforetoggle` handlers may have mutated the DOM, hiding siblings in the relevant stack, establishing a close watcher, entering the top layer, then running the popover focusing steps; the previously focused element being recorded only for the bottom popover in a stack, so focus returns once rather than per level; `hidePopover()` recursively hiding descendant hint and auto members and returning focus only when the currently focused area is a shadow-including descendant of the popover and without scrolling; popover focusing steps having no fallback to the popover element itself, unlike dialog focusing steps; `togglePopover(options)` force semantics; light dismiss matched by a `pointerdown` and `pointerup` pair resolved against the popover stack; `beforetoggle` being cancelable and `toggle` being queued, deduplicated and not cancelable; a popover invoker resolving to null when the node is not a button, is disabled, or is a submit button with a form owner; the implicit anchor element being set to the invoking element and cleared on hide; an auto or hint popover leaving the top layer asynchronously so exit animations can run while a manual one leaves immediately; and `:popover-open` matching only a showing popover whose attribute is not in the No Popover state.
- Generic focus-area and `tabindex` rules from the HTML specification (focusable area conditions, sequential focus navigation scopes, shadow host focus delegation, the focusing and focus-update steps, `focus(options)` defaulting `preventScroll` to false, `blur()` being advisory) are cross-cutting and duplicated in several research sections. They belong in one shared place rather than in each component file; `layering.md` already carries the focus-scope consequences.
- Base UI's detached-trigger and handle machinery is folded into four bullets (`dialog.state.10` through `.12`). The finer cases (handle recreation across a route transition, Strict Mode effect replay, an abandoned transition render, ownership handoff during a transient overlap of two roots on one handle, the deferred 20ms more-than-one-root warning, hydrating a detached trigger from the server snapshot) are library-internal store behavior that a DOM-level suite cannot observe without reaching into the store.
- Dropped as library-internal API shape rather than behavior: prop spreading and `asChild` / `render` / `as` forwarding on every part, ref identity and render-loop guards, `describeConformance` and `popupConformanceTests` suites, context error message text, render-prop payload shapes, exported symbol lists, class and style merging, the corvu marker-attribute erasure convention, Solid 2 portability notes, and the `orchestrate` / `walkTreeOutside` / `markTreeOutside` cleanup-stack unit tests (their observable rule, exact restoration of attributes in reverse order, is stated once in `layering.md`).
- Kobalte's dialog and alert-dialog suites are two tests each, covering only labelling. Nothing there tests opening, closing, Escape, outside press, focus trapping, initial or restored focus, scroll locking, the overlay, portalling, `aria-modal`, or the controlled open API, so kobalte tags appear on very few bullets here and its dialog is effectively unsurveyed. corvu's bullets are read from source rather than asserted by tests.
- The initial-focus divergence (`dialog.focus.12` and `.13`) is the most consequential open decision in this file: focusing the container announces the whole dialog but costs a Tab press to reach the first control, and several libraries split the two cases by role, focusing the first control in a dialog and the container in an alert dialog. `alert-dialog.focus.2` and `.3` are the same decision for the alert dialog, where the APG is explicit about the least destructive action.
- The outside-press default (`dialog.pointer.7` and `.8`) is unresolved, and the APG is explicit that backdrop dismissal is not part of the pattern, which argues against the majority behavior.
- Whether opening a dialog resets the form state inside it (`dialog.state.13`) is called out by the APG as a deliberate decision and is not made here.
- No source tests a dialog inside a form for form ownership or validation, so the Forms subsection covers only submission and the dirty-form guard.
- zag's nested focus-return case (focus returning to the child dialog's own trigger) is marked as a known failure upstream, so `dialog.focus.21` rests on the other libraries.
