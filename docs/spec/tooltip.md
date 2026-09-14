## tooltip

### Roles and attributes

- [ ] `tooltip.roles.1` Given the element that serves as the tooltip, when it is rendered, then it has `role="tooltip"` and its accessible name comes from its own content. [apg, axe, react-aria, radix, zag, corvu]
- [ ] `tooltip.roles.2` Given a trigger with a tooltip, when the tooltip is open, then the trigger references the tooltip element by id through `aria-describedby`. [apg, axe, react-aria, radix, zag, corvu, bits]
- [ ] `tooltip.roles.3` Given an open tooltip, when it closes, then `aria-describedby` is removed from the trigger, so the association exists only while the tooltip is mounted. [react-aria, radix, zag, corvu, bits]
- [ ] `tooltip.roles.4` Given a trigger, when the tooltip opens and closes, then the trigger reflects the open state in a data attribute, such as `data-state` moving between `closed`, `delayed-open` and `instant-open`, or `data-popup-open` appearing and disappearing. [radix, base-ui, zag, corvu, bits]
- [ ] `tooltip.roles.5` Given an open tooltip, when it is inspected, then the content reflects both its open state and the resolved placement in data attributes, such as `data-state` plus `data-placement` and `data-side`. [radix, base-ui, zag, corvu, reka, bits]
- [ ] `tooltip.roles.6` Given a trigger that sets its own tab order, when it is rendered, then the tooltip does not override it: the default is `tabindex="0"`, an author `tabindex="-1"` stays `-1`, and a trigger excluded from the tab order keeps `tabindex="-1"`. [react-aria, bits]
- [ ] `tooltip.roles.7` Given a trigger that is only accessibly disabled, when it is rendered, then it has `aria-disabled="true"`, no `disabled` attribute and it stays focusable, while a truly disabled trigger has no `tabindex` and gets `pointer-events: none`. [base-ui, ariakit]
- [ ] `tooltip.roles.8` Divergence: given `aria-label` on the tooltip content, when the tooltip opens, then the element keeps `role="tooltip"` and the description resolves to the label instead of the visible children (decision needed). [radix]
- [ ] `tooltip.roles.9` Divergence: given `aria-label` on the tooltip content, when the tooltip opens, then `role="tooltip"` is dropped from the element (decision needed). [zag]
- [ ] `tooltip.roles.10` Divergence: given a tooltip trigger, when it is rendered, then it carries no `aria-expanded`, because the pattern defines no expanded state (decision needed). [apg]
- [ ] `tooltip.roles.11` Divergence: given a tooltip trigger, when it is rendered, then it carries `aria-expanded` of `"true"` or `"false"` (decision needed). [corvu]
- [ ] `tooltip.roles.12` Given the tooltip content, when it is rendered, then it is a plain element with no `tabindex`, no `aria-labelledby`, no `aria-describedby` and no `aria-modal`, so it has no dialog semantics (candidate). [corvu]
- [ ] `tooltip.roles.13` Given a tooltip with an arrow, when the tooltip opens, then the arrow has `aria-hidden="true"` and mirrors the resolved side (candidate). [base-ui]

### Keyboard

- [ ] `tooltip.keyboard.1` Given a visible tooltip, when Escape is pressed, then the tooltip is dismissed. [apg, react-aria, base-ui, zag, ark, ariakit, corvu, bits]
- [ ] `tooltip.keyboard.2` Given a visible tooltip while focus sits on some other element, such as a text input, when Escape is pressed there, then the tooltip still closes, so the handler is document level. [apg, react-aria, base-ui]
- [ ] `tooltip.keyboard.3` Given Escape dismissal turned off, when Escape is pressed on a visible tooltip, then the tooltip stays open. [ark, corvu, bits]
- [ ] `tooltip.keyboard.4` Given a tooltip opened by keyboard focus, when Enter is pressed and released on the trigger, then the tooltip closes after the close delay just as a click would, unless press dismissal is turned off, in which case it stays visible (candidate). [react-aria]
- [ ] `tooltip.keyboard.5` Given tooltip content the pointer has clicked into, when Escape is pressed, then the tooltip closes and focus returns to its anchor, including for an animated tooltip (candidate). [ariakit]

### Pointer

- [ ] `tooltip.pointer.1` Given a trigger with a tooltip, when the pointer moves over it, then the tooltip appears after a small delay, and when the pointer moves out of the trigger, then the tooltip disappears. [apg, react-aria, radix, base-ui, zag, ark, ariakit, corvu, melt, bits]
- [ ] `tooltip.pointer.2` Given an explicit open delay, when the trigger is hovered, then the tooltip is absent for the whole delay and present once it elapses, verified at 20ms, 100ms, 150ms, 300ms, 350ms, 500ms, 1000ms and 10000ms. [react-aria, radix, base-ui, ariakit, corvu, bits]
- [ ] `tooltip.pointer.3` Given an open delay of 0, when the trigger is hovered, then the tooltip is shown with no timer advance at all. [react-aria, radix, base-ui, ariakit, corvu, melt, bits]
- [ ] `tooltip.pointer.4` Given an explicit close delay, when the pointer leaves, then the tooltip stays mounted for the whole delay and is removed once it elapses, verified at 100ms, 400ms and 650ms, the latest configured value wins after a prop change, and re-entering before it fires cancels the close. [react-aria, base-ui, corvu]
- [ ] `tooltip.pointer.5` Given a close delay of 0 or a negative close delay, when the pointer leaves, then the tooltip closes immediately with no waiting. [react-aria, base-ui, corvu, melt]
- [ ] `tooltip.pointer.6` Given a delay set on both a provider and a single tooltip, when that tooltip is hovered, then the tooltip's own delay wins and the provider value is used only for tooltips that set none. [base-ui, bits]
- [ ] `tooltip.pointer.7` Given a pending open delay, when the pointer leaves the trigger before the delay elapses, then the pending open is cancelled and the tooltip never appears, even after all timers run. [react-aria, base-ui]
- [ ] `tooltip.pointer.8` Given a tooltip opened by hover, when `pointerdown` or a click lands on the trigger, then the tooltip closes rather than staying open. [react-aria, radix, base-ui, zag, corvu, bits]
- [ ] `tooltip.pointer.9` Given a pending open delay, when the trigger receives `pointerdown` or a click part way through it, then the pending open is cancelled and the tooltip never appears, checked at 300ms into a 600ms delay and at 500ms after a 300ms delay started. [base-ui, bits]
- [ ] `tooltip.pointer.10` Given press dismissal turned off, when the trigger is pressed, whether the tooltip is already open or still inside its open delay, then the tooltip stays visible or still opens on schedule. [react-aria, base-ui, corvu, bits]
- [ ] `tooltip.pointer.11` Given a tooltip that was closed by clicking its trigger, when the pointer hovers the same trigger again, then the tooltip reopens after its open delay. [base-ui, ariakit]
- [ ] `tooltip.pointer.12` Given a touch pointer, when the trigger is tapped or entered with `pointerType` of `touch`, then no tooltip opens and no hover state is reported, checked past 600ms on a mobile viewport. [react-aria, base-ui, ariakit, corvu]
- [ ] `tooltip.pointer.13` Given an open hoverable tooltip, when the pointer travels from the trigger across the gap toward the content, including through an intermediate element that sits between them, then the tooltip stays mounted, because the corridor is a safe area over the trigger and content rectangles rather than the elements themselves (browser-only). [base-ui, corvu, bits]
- [ ] `tooltip.pointer.14` Given an open hoverable tooltip, when the pointer moves out of the corridor or idles in the gap, then the tooltip closes after the intent timeout, measured as closed once the pointer has idled in a sibling gap for 260ms. [base-ui, bits]
- [ ] `tooltip.pointer.15` Given a tooltip configured as not hoverable, when it opens, then the content or its positioner has `pointer-events: none` so the pointer can never enter it, and a move from the trigger onto the content closes it. [base-ui, zag, ark, bits]
- [ ] `tooltip.pointer.16` Divergence: given an open tooltip, when the pointer moves from the trigger onto the tooltip itself, then the tooltip stays open as long as the cursor is over either one (decision needed). [apg, react-aria, base-ui, corvu, bits]
- [ ] `tooltip.pointer.17` Divergence: given an open tooltip built on the bare hover primitive with no safe-area handler, when `mouseleave` fires on the trigger with the tooltip as `relatedTarget`, then the tooltip is removed immediately (decision needed). [base-ui]
- [ ] `tooltip.pointer.18` Divergence: given an accessibly disabled trigger that keeps `aria-disabled="true"` and stays focusable, when it is hovered or focused, then its tooltip still opens so the disabled control can explain itself, in every composition order and whether the disabled markup sits on the trigger or on the element it renders (decision needed). [base-ui, ariakit]
- [ ] `tooltip.pointer.19` Divergence: given a disabled trigger or a disabled tooltip root, when the trigger is hovered or focused, then no tooltip ever opens, and disabling an inner button rather than the trigger suppresses it the same way (decision needed). [react-aria, base-ui, ariakit, reka, bits]
- [ ] `tooltip.pointer.20` Divergence: given no configured delays, when the trigger is hovered, then the tooltip opens after 600ms and closes with no close delay (decision needed). [base-ui]
- [ ] `tooltip.pointer.21` Divergence: given no configured delays, when the trigger is hovered, then the tooltip opens after 500ms, closes with a close delay of 0 and has a skip-delay window of 0 (decision needed). [corvu]
- [ ] `tooltip.pointer.22` Divergence: given no configured delays, when the trigger is hovered, then the tooltip opens after a 1500ms warmup and closes after a 500ms cooldown (decision needed). [react-aria]
- [ ] `tooltip.pointer.23` Divergence: given no configured delays, when the trigger is hovered, then the tooltip opens after 1000ms (decision needed). [zag]
- [ ] `tooltip.pointer.24` Given a rest-based open, when the pointer moves over the trigger, then the tooltip opens only after 100ms of rest, a further significant move resets the rest timer, and a move of one pixel does not (candidate). [base-ui]
- [ ] `tooltip.pointer.25` Given a touch sequence on the trigger, when iOS Safari emits the emulated `pointerType="mouse"` event that follows it, per WebKit bug 214609, then it is ignored and no hover starts, and once 600ms has passed the suppression window has elapsed so real mouse hover works normally again (candidate) (safari-only). [react-aria]
- [ ] `tooltip.pointer.26` Given a tooltip trigger that contains a nested tooltip trigger, when the pointer reaches the nested trigger, then only the innermost tooltip opens and every ancestor tooltip stays closed, through two and three levels of nesting, across sibling nested triggers, and when the event comes from inside an open shadow root (candidate). [base-ui]
- [ ] `tooltip.pointer.27` Given the pointer moving from a nested trigger back to the parent trigger area, when the parent has its own delay, then the parent delay restarts from scratch rather than resuming, and rapidly returning to the nested trigger cancels the pending parent reopen (candidate). [base-ui]
- [ ] `tooltip.pointer.28` Given a tooltip opened by hover, when the trigger is right-clicked or middle-clicked, then the tooltip closes, unless non-primary press dismissal is turned off (candidate). [bits]
- [ ] `tooltip.pointer.29` Given a tooltip that acts as the accessible label for its anchor, when the anchor is clicked, then the tooltip stays open and hides only once the pointer leaves (candidate). [ariakit]

### Focus management

- [ ] `tooltip.focus.1` Given a tooltip being shown or hidden, when focus is observed, then the tooltip itself never receives focus and focus stays on the triggering element throughout, with no focus restoration step on close. [apg, html, corvu]
- [ ] `tooltip.focus.2` Given a tooltip invoked when the trigger received focus, when the trigger no longer has focus, then the tooltip is dismissed. [apg, react-aria, base-ui, zag, ariakit, reka, melt, bits]
- [ ] `tooltip.focus.3` Given a hover surface that must contain focusable elements, when it is designed, then it is not a tooltip but a non-modal dialog, and focusable content left inside a hidden tooltip is a failure that must be made non-focusable or removed. [apg, axe]
- [ ] `tooltip.focus.4` Given a trigger with an open delay, when it receives keyboard focus, then the tooltip opens immediately without waiting out the hover delay. [react-aria, base-ui, zag, ariakit, corvu, reka, melt, bits]
- [ ] `tooltip.focus.5` Given an open tooltip, when focus moves from its trigger to another trigger, then the first tooltip closes and the second opens. [react-aria, base-ui, zag]
- [ ] `tooltip.focus.6` Divergence: given a tooltip held open by both hover and focus, when one of the two ends, then the tooltip stays open because the other still holds it, and it closes only when both have ended (decision needed). [ariakit, corvu, melt]
- [ ] `tooltip.focus.7` Divergence: given a tooltip held open by both hover and focus, when either the hover leaves or the trigger is blurred, then the tooltip closes without waiting for the other to end (decision needed). [react-aria]
- [ ] `tooltip.focus.8` Given a hover open delay already part way through, when the trigger receives keyboard focus mid-delay, then the tooltip opens immediately and stays visible past the point the hover delay would have fired (candidate). [react-aria]
- [ ] `tooltip.focus.9` Given a trigger that was just pressed with a pointer, when the `focus` event that follows the press arrives, then the focus-driven open is suppressed (candidate). [corvu]
- [ ] `tooltip.focus.10` Given a tooltip that was shown by hover and has since lost keyboard focus, when the pointer re-enters the trigger, then the tooltip waits out the full open delay again rather than appearing at once (candidate). [ariakit]
- [ ] `tooltip.focus.11` Given keyboard modality established by Tab or Shift+Tab, when a trigger receives focus, then its tooltip opens (candidate). [zag]

### State

- [ ] `tooltip.state.1` Given a tooltip, when its state is inspected, then it has nothing beyond visible or hidden: the pattern defines no expanded, selected or checked state. [apg]
- [ ] `tooltip.state.2` Given one open tooltip, when a second tooltip opens from hover, focus or a programmatic change, then the first closes, so only one tooltip is open at a time. [react-aria, base-ui, zag, ariakit, corvu, reka, melt]
- [ ] `tooltip.state.3` Given tooltips assigned to different groups, or with grouping off, when one of them opens, then the others stay open, so the single-open rule is scoped to a group. [corvu, melt]
- [ ] `tooltip.state.4` Given a tooltip that has just closed, when another tooltip in the same group is hovered inside the skip-delay window, then it opens with no delay at all, verified with skip windows of 300ms, 400ms, 500ms and 30000ms against open delays of 50ms, 100ms and 1000ms. [react-aria, radix, base-ui, ariakit, corvu, bits]
- [ ] `tooltip.state.5` Given the skip-delay window, when it is set to 0 or has been allowed to elapse, then the next hover waits out the full open delay again, checked after a 400ms group timeout and after a 500ms one. [react-aria, radix, base-ui, ariakit, corvu, bits]
- [ ] `tooltip.state.6` Given a controlled open state, when the trigger is hovered, focused or blurred, then the rendered visibility follows only the controlled value, and the change callback reports what the interaction asked for. [react-aria, base-ui]
- [ ] `tooltip.state.7` Given an uncontrolled tooltip with a default-open flag, when it mounts, then the tooltip is already visible, and it still closes on the next `mouseleave`, so it stays uncontrolled. [react-aria, base-ui]
- [ ] `tooltip.state.8` Given a change callback that cancels the change, when the interaction that would open or close the tooltip happens, then the open or close is skipped even though the tooltip is uncontrolled. [base-ui, corvu]
- [ ] `tooltip.state.9` Given several triggers sharing one tooltip, when the pointer or focus moves between them, then the same content node is reused, the rendered payload follows the active trigger, and only the active trigger carries `aria-describedby` and the active-trigger marker. [base-ui, zag, bits]
- [ ] `tooltip.state.10` Given an open tooltip whose active trigger unmounts, when the removal commits, then the tooltip closes and no sibling trigger takes over the open state. [base-ui, bits]
- [ ] `tooltip.state.11` Given a hovered trigger, when it is removed from the DOM or turns disabled while the hover or a pending open is live, then the hover state ends immediately without a pointer-out and the pending tooltip never opens. [react-aria, base-ui, ariakit]
- [ ] `tooltip.state.12` Given a tooltip held open by a controlled or forced open state, when another tooltip opens, then the controlled one stays visible, so two tooltips can be open at once. [react-aria, ariakit]
- [ ] `tooltip.state.13` Given an open tooltip, when it is turned disabled, then it closes, and a trigger that opts back in under a disabled root still never opens (candidate). [base-ui]
- [ ] `tooltip.state.14` Given a tooltip that has stayed open past the skip-delay window, when its own trigger is re-entered, then it still opens instantly, so the window does not re-arm the delay while a tooltip is open (candidate). [bits]
- [ ] `tooltip.state.15` Given an open request made twice during the warmup, when the second arrives, then the first warmup timer is discarded and the tooltip opens only once the full delay has run from the second request (candidate). [react-aria]

### Dismissal and layering

- [ ] `tooltip.dismissal.1` Given a tooltip implemented with the `popover` attribute, when it is shown, then `popover="hint"` is the state designed for it: showing it closes other hint popovers but not open auto popovers, and it supports light dismiss and close requests. [html]
- [ ] `tooltip.dismissal.2` Given a hint popover shown while nested under another hint ancestor, when the show algorithm runs, then an auto popover can be downgraded to the hint effective type, which changes which stack is closed. [html]
- [ ] `tooltip.dismissal.3` Given a tooltip open above another dismissible layer, when Escape is pressed, then only the tooltip closes and the layer beneath stays open, and where several tooltips are held open only the live one closes (chromium-only for the held-open case). [html, ariakit, corvu]
- [ ] `tooltip.dismissal.4` Given an open tooltip, when a scroll event fires on an element that contains the trigger, or on the document, then the tooltip closes, while a scroll inside the tooltip content leaves it open. [react-aria, corvu, melt, bits]
- [ ] `tooltip.dismissal.5` Given an open tooltip, when the page around it is used, then the tooltip layer is non-modal: it does not dismiss on outside focus or outside pointer events, it blocks no outside pointer events, and the content keeps `pointer-events: auto`. [corvu, bits]
- [ ] `tooltip.dismissal.6` Given an open tooltip, when its container is inspected, then it renders into `document.body` by default, into a supplied container when one is given, and stays in place when portalling is disabled. [react-aria, ariakit, bits]
- [ ] `tooltip.dismissal.7` Given an open tooltip, when a pointer press lands outside the trigger and content, then the tooltip closes (candidate). [zag]
- [ ] `tooltip.dismissal.8` Given a trigger that is both a tooltip trigger and a popover trigger, when it is clicked so the popover opens, then the tooltip content is removed (candidate). [bits]
- [ ] `tooltip.dismissal.9` Given a tooltip whose trigger is inside a fullscreen element, when fullscreen is entered, exited and re-entered, then exactly one portal container exists at each step, it moves between the fullscreen element and `document.body`, the tooltip stays visible when the fullscreen host is removed, and unmounting the tooltip leaves no container behind (candidate) (browser-only). [ariakit]
- [ ] `tooltip.dismissal.10` Given open tooltip content, when it is no longer the last dismissible layer, then it stops applying `pointer-events: auto` (candidate). [corvu]

### Positioning

- [ ] `tooltip.positioning.1` Given an open tooltip, when it is positioned, then it is anchored to its trigger and exposes the resolved side or placement on the content, including after a collision flip. [react-aria, base-ui, zag, corvu, reka, bits]
- [ ] `tooltip.positioning.2` Given an explicit anchor element alongside the trigger, when the tooltip opens, then the anchor takes priority as the positioning reference. [corvu, bits]
- [ ] `tooltip.positioning.3` Given a tooltip shared by several triggers, when the active trigger changes, then the tooltip repositions to the new trigger. [base-ui, zag, bits]
- [ ] `tooltip.positioning.4` Given the tooltip content, when it is not present, then positioning does not run, and it resumes only while the content is mounted (candidate). [corvu]
- [ ] `tooltip.positioning.5` Given cursor tracking on a single axis, when the tooltip opens on hover, then it centers on the cursor rather than the trigger, it re-reads the cursor position on each reopen, and turning tracking off while closed returns it to the trigger center (candidate) (browser-only). [base-ui]
- [ ] `tooltip.positioning.6` Given an open tooltip with an arrow, when the arrow cannot point at the anchor because of arrow padding, then it is marked uncentered, and otherwise it is not (candidate) (browser-only). [base-ui]

### Animation and presence

- [ ] `tooltip.animation.1` Given a closed tooltip, when nothing forces it to stay, then the content is not in the DOM, while a force-mounted or kept-mounted tooltip has the element present but inaccessible. [base-ui, ark, corvu, bits]
- [ ] `tooltip.animation.2` Given an open tooltip with an exit animation or transition, when it is closed by hover leaving, blur or a state change, then the content stays mounted and visible through the animation and unmounts only once it finishes. [react-aria, base-ui, ark, ariakit, bits]
- [ ] `tooltip.animation.3` Given the skip-delay window active, when the pointer moves from one trigger to the next, then the swapped tooltip is marked instant and runs no enter animation, its state history never passes through closed, and the last tooltip still animates out; with a skip window of 0 the enter animation replays and the state does pass through closed. [react-aria, radix, base-ui, bits]
- [ ] `tooltip.animation.4` Given a tooltip opened by focus, when the content is inspected, then it is marked instant, and a tooltip opened by hover is not (candidate). [base-ui]
- [ ] `tooltip.animation.5` Given a tooltip left part way through a long exit animation, when another tooltip opens, then the exiting one is unmounted rather than left animating (candidate). [base-ui]
- [ ] `tooltip.animation.6` Given an open-change-complete callback, when the tooltip opens or closes, then it fires after the enter or exit animation has finished, and it never fires on mount while the tooltip is closed (candidate). [base-ui]
- [ ] `tooltip.animation.7` Given externally controlled entering and exiting flags, when the tooltip opens or closes, then it carries `data-entering` or `data-exiting` and stays in the document until the exiting flag is cleared (candidate). [react-aria]

### RTL and i18n

- [ ] `tooltip.rtl.1` Given a logical side such as `inline-start`, when the tooltip is positioned and a collision flips it, then the resolved side is reported as the logical value `inline-end` rather than a physical side (candidate). [base-ui]

### SSR and hydration

- [ ] `tooltip.ssr.1` Given a server-rendered tooltip that is open by default, when the markup is inspected before hydration, then the trigger carries no open marker, the tooltip stays open across a suspended hydration, the open-change callback is never called, and the trigger gains the open marker once it hydrates (candidate). [base-ui]

### Accessibility tooling

- [ ] `tooltip.a11y.1` Given `role="tooltip"`, when axe runs, then it must have an accessible name from visible text, `aria-label`, `aria-labelledby` or `title`, at serious impact under WCAG 4.1.2. [axe]
- [ ] `tooltip.a11y.2` Given a trigger that references its tooltip with `aria-describedby`, when axe runs, then the id must resolve and must be unique in the document, at critical impact for uniqueness; an unresolved reference is reported as incomplete rather than a failure. [axe]
- [ ] `tooltip.a11y.3` Given a tooltip hidden with `aria-hidden="true"`, when axe runs, then neither it nor any descendant may be focusable, at serious impact, and only the outermost hidden element is tested. [axe]
- [ ] `tooltip.a11y.4` Given a `role="tooltip"` element carrying `tabindex="0"`, when axe runs, then `focus-order-semantics` passes because `tooltip` is the single role allowed by that rule's scrollable-semantics option, making it the one non-widget role the rule admits into the focus order. [axe]
- [ ] `tooltip.a11y.5` Given a control labelled only by a `title` attribute, when axe runs, then it is a best-practice failure at serious impact, so a tooltip must not be the only label. [axe]
- [ ] `tooltip.a11y.6` Given any element the tooltip renders with a `role` or an `aria-*` attribute, when axe runs, then the role must be valid, non-abstract, non-deprecated and widely supported, every `aria-*` name and value must be valid and allowed for that role and host element, prohibited names must be absent, braille attributes must have non-braille equivalents, and no `tabindex` may be greater than 0. [axe]
- [ ] `tooltip.a11y.7` Given a clickable trigger, when the WCAG 2.2 target-size rule is enabled, then the target should be at least 24 by 24 CSS pixels or leave sufficient space from its neighbors; the rule ships disabled and must be turned on explicitly to run. [axe]
- [ ] `tooltip.a11y.8` Given a tooltip both closed and opened by focus, when axe runs over the mounted tree and over the document, then no violations are reported in either pass. [ark, reka]

### Notes and edge cases

- [ ] `tooltip.notes.1` Given the APG tooltip pattern, when it is used as a source, then it is explicitly marked work in progress without task force consensus, tracked in APG issue 128, and it ships no example, tracked in issue 127, so every rule drawn from it is provisional. [apg]
- [ ] `tooltip.notes.2` Given the APG toolbar example as a worked variant, when a hover label is implemented there, then it shows immediately on `mouseover` and on `focus`, hides immediately on `blur`, hides 800ms after `mouseleave` while re-checking whether hover was regained, and every open label hides on a document-level Escape. [apg]
- [ ] `tooltip.notes.3` Given several sibling tooltips, when one of them is hovered open or a shared group's state changes, then the other tooltips do no work: they record no extra renders and their state is untouched. [radix, base-ui]
- [ ] `tooltip.notes.4` Given tooltip content the pointer clicks into after the tooltip was opened by focus, when the click lands, then the content stays visible. [ariakit, melt]
- [ ] `tooltip.notes.5` Given tooltip content with a single child, when the tooltip opens, then the child mounts exactly once and an `aria-label` on the content does not cause the children to render twice (candidate). [radix]

## Sources

- `apg-and-axe.md`: `tooltip`
- `ariakit-and-headlessui.md`: `tooltip`
- `kobalte-and-corvu.md`: `tooltip`
- `radix-and-base-ui.md`: `tooltip`, `hover-interaction`
- `react-aria-a.md`: `tooltip`, `hover`
- `reka-melt-bits.md`: `tooltip`
- `zag-and-ark.md`: `tooltip`

## Deferred

- No `kobalte` or `headlessui` bullets exist: the `kobalte-and-corvu.md` tooltip section is entirely `corvu-src`, and `ariakit-and-headlessui.md` has no Headless UI tooltip. Neither tag appears in this file.
- No source in these sections covers closing on window blur or on `visibilitychange`, and none covers touch long-press to reveal a tooltip. Only the WebKit 214609 emulated-mouse suppression window and the plain "touch never opens" rule are evidenced, both captured above.
- Library-internal API shape dropped: prop spreading and `asChild`/`render`/`as` forwarding, ref identity and `UNSAFE_getDOMNode`, class and style merging, exported part and symbol lists, context-missing error messages, type-only assertions, the shared `describeConformance` and `popupConformanceTests` harnesses, store, handle and selector internals, detached-trigger handle ownership and migration warnings, imperative `actionsRef` and handle methods, `preventUnmountOnClose` bookkeeping, and morphing-viewport container mechanics. Where a cluster of these encoded a real rule, it is stated once: shared content and payload per active trigger in `tooltip.state.9`, close on active-trigger unmount in `tooltip.state.10`, and sibling isolation in `tooltip.notes.3`.
- Raw geometry left to `positioning.md`: side and align offset arithmetic, collision flip math, arrow padding numbers, and activation-direction token geometry. Only the tooltip's own anchoring, placement reporting, reposition-on-trigger-change and cursor-tracking guarantees are kept.
- `apg`, `axe` and `html` bullets are treated as normative sources rather than libraries, so a bullet carried by one of them alone is not marked `(candidate)`.
- Unresolved beyond the marked divergences: whether the corvu safe-area convex hull, the Base UI safe polygon corridor and the Bits tether gap handling are one behavior or three, since each is evidenced only in a real engine and their intent timeouts differ (260ms measured for Bits, 50ms for the Base UI polygon tests). The jsdom notes in the research say hover stability cannot be asserted at all without real layout, so `tooltip.pointer.13` needs a browser harness before it can be ticked.
- Open question carried from the research: whether a conformance suite should copy corvu's `aria-expanded` on the trigger, captured as the divergence at `tooltip.roles.10` and `tooltip.roles.11`.
