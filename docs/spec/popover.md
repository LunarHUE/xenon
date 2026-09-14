## popover

### Roles and attributes

- [ ] `popover.roles.1` Given a popover trigger, when the popover is closed and then opened, then the trigger's `aria-expanded` goes from "false" to "true". [radix, base-ui, zag, ariakit, corvu]
- [ ] `popover.roles.2` Given a closed popover, when the trigger is inspected, then it has no `aria-controls` attribute at all; when the popover opens, then `aria-controls` equals the content's id and that id resolves to the content element in the document. [react-aria, radix, base-ui, zag, ark, corvu, reka]
- [ ] `popover.roles.3` Given an open popover, when its content element is inspected, then it has `role="dialog"` and `tabindex="-1"`. [react-aria, radix, base-ui, zag, ariakit, corvu]
- [ ] `popover.roles.4` Given a popover trigger, when it renders, then it carries `aria-haspopup="dialog"`. [radix, zag, corvu]
- [ ] `popover.roles.5` Given popover content, when a title or a description part is rendered, then `aria-labelledby` points at the title's id and `aria-describedby` at the description's id, and each attribute is absent when its part is not rendered. [radix, base-ui, zag, corvu]
- [ ] `popover.roles.6` Given several triggers sharing one popover, when it opens from one of them, then only that trigger has `aria-expanded="true"` and an `aria-controls` pointing at the content, and the other triggers report "false" with no `aria-controls`. [base-ui, zag, ariakit]
- [ ] `popover.roles.7` Given a popover, when it opens and closes, then the trigger, the content and the overlay each reflect the current state through a state attribute, `data-state` of open or closed or the equivalent `data-open` and `data-closed` pair. [radix, base-ui, zag, corvu, bits]
- [ ] `popover.roles.8` Given an open popover, when its placement resolves, then the content exposes the resolved placement and side as attributes, and the trigger carries the placement only while the popover is open. [zag, corvu]
- [ ] `popover.roles.9` Given a popover trigger rendered as a native button, when it renders, then it carries `type="button"` unless the author already set a `type`, and no `type` is added when the trigger resolves to a non-button element. [zag, headlessui, corvu]
- [ ] `popover.roles.10` Given a close part with no children, when it renders, then it is a button with a localized default accessible name, and an icon-only close with an undefined label prop is still named. [zag, ariakit, corvu]
- [ ] `popover.roles.11` Given popover content, when the popover is modal, then the content carries `aria-modal`, and a non-modal popover keeps `role="dialog"` without claiming modality. [zag, corvu]
- [ ] `popover.roles.12` Given a disabled trigger, when it renders, then a native button trigger carries the `disabled` attribute while a non-native trigger carries `aria-disabled="true"` instead, both carry a disabled state attribute, neither opens on click or hover, and Tab skips them. (candidate) [base-ui]
- [ ] `popover.roles.13` Given a trigger that opens on hover with no delay, when it is hovered open, then it carries the open state attribute but no pressed attribute, and a trigger opened by click carries both. (candidate) [base-ui]
- [ ] `popover.roles.14` Given an open popover, when it renders, then two hidden buttons named "Dismiss" wrap the content for screen readers and activating the first one closes the popover. (candidate) [react-aria]
- [ ] `popover.roles.15` Given a popover used without an inner dialog element but given an accessible name, when it opens, then the popover element itself takes the dialog role and its id matches the trigger's `aria-controls`. (candidate) [react-aria]
- [ ] `popover.roles.16` Given a popover overlay part, when it renders, then it is `aria-hidden="true"` so it is not exposed to assistive technology. (candidate) [corvu]
- [ ] `popover.roles.17` Given a popover with no heading, when it opens, then it still has an accessible description. (candidate) (chromium-only) [ariakit]

### Keyboard

- [ ] `popover.keyboard.1` Given a focused popover trigger, when Enter or Space is pressed, then the popover opens, and pressing the same key again on the trigger closes it; this holds for a native button trigger and for a trigger rendered as a div. [base-ui, zag, ariakit, headlessui, bits]
- [ ] `popover.keyboard.2` Given an open popover, when Escape is pressed, then it closes and focus returns to the trigger, whether the key is pressed inside the content or on the trigger itself. [react-aria, base-ui, zag, ark, ariakit, headlessui, corvu, melt, bits]
- [ ] `popover.keyboard.3` Given several stacked popovers, when Escape is pressed, then only the topmost layer closes and the layers beneath it stay open. [ariakit, corvu]
- [ ] `popover.keyboard.4` Given an open popover whose Escape handler calls `preventDefault`, or whose escape behavior is set to ignore, when Escape is pressed, then the popover stays open and keeps focus where it was, and a later unprevented Escape closes it. [corvu, melt, bits]
- [ ] `popover.keyboard.5` Given a disabled trigger, when Enter or Space is pressed on it, then the popover does not open. (candidate) [headlessui]
- [ ] `popover.keyboard.6` Given two sibling popovers, when Escape is pressed on the second popover's trigger, then the second popover closes. (candidate) [headlessui]
- [ ] `popover.keyboard.7` Given a popover opened programmatically that names a trigger other than the text field holding the caret, when Escape is pressed in that field, then the popover dismisses, because the field counts as outside the content. (candidate) [ariakit]
- [ ] `popover.keyboard.8` Given a popover trigger inside a toolbar, when an arrow key is pressed inside the open content, then the toolbar's roving focus does not move and the key still acts on the focused content element, for example moving a text caret. (candidate) [base-ui]

### Pointer

- [ ] `popover.pointer.1` Given a closed popover, when the trigger is clicked, then it opens, and clicking the trigger again closes it. [base-ui, zag, ark, ariakit, headlessui, corvu, melt, bits]
- [ ] `popover.pointer.2` Given an open popover with a close part, when it is clicked, then the popover closes and focus returns to the trigger. [base-ui, zag, ark, ariakit, bits]
- [ ] `popover.pointer.3` Given an open popover, when a click lands inside the content on a focusable or a non-focusable element, then the popover stays open, the clicked element keeps focus, and no outside-interaction handler fires. [ariakit, headlessui, melt, bits]
- [ ] `popover.pointer.4` Given a trigger configured to open on hover with a delay, when the pointer rests on it, then the popover opens only after the delay elapses, measured from the point the pointer stops moving. [base-ui, bits]
- [ ] `popover.pointer.5` Given a popover that was hover-opened from its trigger, when the pointer leaves, then it closes once the close delay elapses; a popover opened by any other means does not close on hover out. [base-ui, bits]
- [ ] `popover.pointer.6` Given a hover-opened popover, when the pointer travels from the trigger onto the content and back again, then the popover stays open without flicker, and leaving the content for an element outside closes it. [base-ui, bits]
- [ ] `popover.pointer.7` Given a hover-opened popover, when the trigger is clicked, or the content is clicked, or an element inside the content takes focus, then the open becomes sticky and a later pointer leave no longer closes it. [base-ui, bits]
- [ ] `popover.pointer.8` Given a trigger that opens on hover, when it is clicked before a patience threshold elapses, then the popover stays open and becomes sticky; when it is clicked after the threshold, the click closes it, and leaving and re-entering the trigger restarts the patience window. (candidate) [base-ui]
- [ ] `popover.pointer.9` Given two hover-enabled triggers, when one is tapped by touch and a sibling is then hovered with the mouse, then the tapped trigger keeps the popover; when the first was pressed with a mouse instead, hovering the sibling hands the popover over to it. (candidate) [base-ui]
- [ ] `popover.pointer.10` Given a trigger that opens on hover with a long delay, when it is clicked or activated with Enter, then the popover opens at once without waiting for the hover delay. (candidate) [bits]
- [ ] `popover.pointer.11` Given a hover trigger with a pending open or close timer, when the pointer leaves before the open delay elapses or re-enters before the close delay elapses, then the pending change is cancelled. (candidate) [bits]
- [ ] `popover.pointer.12` Given a hover-enabled popover closed by a second trigger click while the pointer is still on the trigger, when time passes, then hover does not reopen it until the pointer leaves and returns, and a further click reopens it straight away. (candidate) [bits]
- [ ] `popover.pointer.13` Given a hover-opened popover, when Escape is pressed or an element outside is clicked, then it closes the same way a click-opened popover does. (candidate) [bits]
- [ ] `popover.pointer.14` Given a closed popover, when the trigger is right clicked, then the popover does not open. (candidate) [headlessui]
- [ ] `popover.pointer.15` Given a popover triggered by text selection, when text is selected, then the popover appears, and clicking elsewhere in the text closes it. (candidate) [ariakit]

### Focus management

- [ ] `popover.focus.1` Divergence: Given a popover opened by click or keyboard, when it opens, then focus moves to the first focusable element inside the content, skipping hidden and non-visible elements. (decision needed) [base-ui, zag, ark, ariakit, headlessui, bits]
- [ ] `popover.focus.2` Divergence: Given a popover opened by click or keyboard, when it opens, then focus moves to the content element itself rather than to its first focusable child, unless a child asks for autofocus. (decision needed) [react-aria]
- [ ] `popover.focus.3` Divergence: Given a popover with no modality configured, when it opens, then it is non-modal, so Tab can leave the content and the page behind stays scrollable and clickable. (decision needed) [radix, base-ui, zag, corvu]
- [ ] `popover.focus.4` Divergence: Given a popover with no modality configured, when it opens, then focus is trapped in the content, so Tab and Shift+Tab cycle inside it. (decision needed) [react-aria, melt]
- [ ] `popover.focus.5` Given popover content with no focusable child, or whose focused child is removed or set to `display: none` while the popover is open, when focus has nowhere else to go, then the content element itself takes focus. [react-aria, base-ui]
- [ ] `popover.focus.6` Given initial focus turned off, when the popover opens, then focus stays on the trigger and the content is not focused. [base-ui, zag]
- [ ] `popover.focus.7` Given a popover opened from one of several triggers, when it closes, then focus returns to the trigger that opened it rather than to the first trigger or to whatever held focus at the time. [base-ui, zag, ariakit, bits]
- [ ] `popover.focus.8` Given a configured final focus target, when the popover closes, then that element receives focus instead of the trigger, and a final focus value of false leaves focus where it is. [base-ui, headlessui, melt]
- [ ] `popover.focus.9` Given a modal popover, when Tab and Shift+Tab move past the ends of the content, then focus cycles inside the content and never reaches the page behind, including when the content has only one effective tab stop. [react-aria, zag, corvu, melt]
- [ ] `popover.focus.10` Given a non-modal popover, when Tab moves past the last element of the content, then focus goes to the next tabbable element after the trigger in document order, skipping the content itself, and the popover closes; when the trigger is the last tabbable element on the page, focus leaves the page instead of looping back into the content. [base-ui, zag, headlessui]
- [ ] `popover.focus.11` Given a non-modal popover, when Shift+Tab is pressed from the first element of the content, then focus returns to the trigger and the popover stays open, and Tab from the trigger moves back into the content; this holds when the content is portaled. [base-ui, zag, ariakit, headlessui]
- [ ] `popover.focus.12` Given a popover configured to close when focus leaves it, when focus moves to an element outside, then the popover closes and the next focusable element in line receives focus; a blur with no replacement, such as switching browser tabs, does not close it. [react-aria, headlessui]
- [ ] `popover.focus.13` Given a popover whose content stays mounted while closed, when it is reopened, then focus moves back into the content rather than staying on the trigger, even when the first child in the content is a hidden input. [base-ui, ariakit]
- [ ] `popover.focus.14` Given an initial focus option that resolves to an element, when the popover opens, then that element receives focus, a falsy result leaves focus on the trigger, and the resolver is told which interaction opened the popover, keyboard, touch or pointer. (candidate) [base-ui]
- [ ] `popover.focus.15` Given a final focus resolver, when the popover closes, then the resolver is told whether the close came from the keyboard or from a pointer, so a keyboard close can land somewhere other than a pointer close. (candidate) [base-ui]
- [ ] `popover.focus.16` Given a popover whose trigger unmounts while the popover is open, when the popover closes, then focus returns to the element that was focused before the popover opened. (candidate) (browser-only) [base-ui]
- [ ] `popover.focus.17` Given a popover opened by hover, when it opens and later closes, then focus never moves into the content and the element that held focus keeps it. (candidate) [base-ui]
- [ ] `popover.focus.18` Given nested popovers where the child was opened programmatically by a button inside the parent, when the child closes, then focus returns to that button and the parent stays open, and closing the parent then returns focus to the parent's trigger. (candidate) [base-ui]
- [ ] `popover.focus.19` Given a page scrolled down, when a popover opens and focuses its content, then the scroll position does not change. (candidate) (browser-only) [ariakit]

### State

- [ ] `popover.state.1` Given a popover with an uncontrolled default open value, when it mounts, then the content is present, and clicking the trigger still toggles it. [base-ui, ark, corvu]
- [ ] `popover.state.2` Given a controlled open value, when it is set, then it wins over any default open value, and the change handler is called with the next open state on every toggle. [react-aria, base-ui, ark, bits]
- [ ] `popover.state.3` Given several triggers sharing one popover with a per-trigger payload, when one trigger opens it and another is then clicked, then the popover stays open, the content swaps to the second trigger's payload, and the same content element is reused rather than remounted. [base-ui, zag]
- [ ] `popover.state.4` Given a change handler that cancels the pending change, when the trigger is clicked, then the popover does not open, and cancelling a close from the close part leaves the popover open without changing which trigger owns it. (candidate) [base-ui]
- [ ] `popover.state.5` Given imperative open and close actions exposed by the popover, when they are called, then the popover opens and closes, and a call made while no popover instance is mounted is ignored with a warning rather than throwing. (candidate) [base-ui]
- [ ] `popover.state.6` Given a popover opened programmatically without naming a trigger, when a trigger is mounted, then that trigger is treated as the opener and keeps `aria-expanded="true"`; when no trigger is mounted, the element focused at open time becomes the opener and is replaced by the next open rather than staying the opener forever. (candidate) [ariakit]

### Dismissal and layering

- [ ] `popover.dismissal.1` Given an open popover, when a press lands outside the content, then the popover closes, whether the target is the body, a non-focusable element, a focusable element, a child of a focusable element, another element inside the same shadow root as the popover, or a node outside that shadow root. [react-aria, base-ui, zag, headlessui, melt, bits]
- [ ] `popover.dismissal.2` Given an open popover, when a mouse press starts outside the content, then `mousedown` alone neither closes the popover nor fires the outside-press handler, and only the following click closes it, firing the handler exactly once. [react-aria, base-ui, bits]
- [ ] `popover.dismissal.3` Given an open popover, when a pointer press starts inside the content and the click lands outside, or when an overlay outside the popover swallows the later mouse events, then the popover stays open. [radix, base-ui]
- [ ] `popover.dismissal.4` Given an open popover whose outside-press handler calls `preventDefault`, or whose outside-press behavior is set to ignore, when an element outside is clicked, then the popover stays open and keeps focus inside the content. [corvu, melt, bits]
- [ ] `popover.dismissal.5` Given several sibling popovers, when one is opened while another is already open, then the previously open one closes. [headlessui, melt, bits]
- [ ] `popover.dismissal.6` Given a modal popover, when it opens, then an internal backdrop is rendered and elements outside the content are made inert or hidden from assistive technology; a non-modal popover renders no internal backdrop and leaves the rest of the page scrollable and clickable. [base-ui, corvu]
- [ ] `popover.dismissal.7` Given a popover with an overlay part, when the popover is closed, then no overlay element exists unless the overlay is force-mounted, and clicking the overlay while open closes the popover. [headlessui, bits]
- [ ] `popover.dismissal.8` Divergence: Given an open popover, when an outside press lands on the body or on a non-focusable element, then the popover closes and focus returns to the trigger, and when it lands on a focusable element focus stays on that element. (decision needed) [react-aria, zag, headlessui]
- [ ] `popover.dismissal.9` Divergence: Given an open popover, when a point outside is clicked, then the popover closes and focus is not restored to the trigger at all. (decision needed) [ariakit]
- [ ] `popover.dismissal.10` Given a popover nested inside an open dialog, when a point outside both layers is clicked, then a non-modal popover dismisses both the popover and the dialog while a modal popover dismisses only itself. (candidate) (browser-only) [radix]
- [ ] `popover.dismissal.11` Given a popover with a nested popup inside its content, when the nested popup opens by pointer or by Enter, or an item in it is clicked, then the popover stays open even when both portal into the same container; clicking the parent content itself closes only the nested popup. (candidate) [base-ui]
- [ ] `popover.dismissal.12` Given an open popover containing a scrollable nested popup, when that popup is scrolled by touch, then neither the popover nor the nested popup closes, because a touch outside press is only acted on at the click. (candidate) (browser-only) [base-ui]
- [ ] `popover.dismissal.13` Given a modal popover opened by a touch press, when the content is as wide as the viewport, then document scrolling is locked, and when the content is narrower than the viewport no scroll lock is applied. (candidate) (browser-only) [base-ui]
- [ ] `popover.dismissal.14` Given a popover closed with Escape and then reopened, when an outside press follows, then it still dismisses, so dismiss handling is rewired on each open. (candidate) [base-ui]
- [ ] `popover.dismissal.15` Given a popover opened by hover with a backdrop rendered, when the backdrop is inspected, then it is not interactive (`pointer-events: none`), while the backdrop of a click-opened popover is interactive. (candidate) [base-ui]
- [ ] `popover.dismissal.16` Given a modal popover that was opened by hover, when its trigger is then clicked, then modal behavior turns on and the internal backdrop appears. (candidate) [base-ui]

### Positioning

- [ ] `popover.positioning.1` Given both an anchor part and a trigger, when the popover opens, then it is positioned against the anchor and the trigger is only a fallback; when the anchor unmounts, the popover realigns to the trigger and stays open. [base-ui, ariakit, corvu]
- [ ] `popover.positioning.2` Given no configured placement, when the popover opens, then it is placed below the anchor, and the resolved side and alignment are readable from the positioner and content so CSS and render props can key off them. [react-aria, zag, corvu]
- [ ] `popover.positioning.3` Given a popover with no room on its preferred side, when the viewport narrows or the page scrolls, then it flips to a side with room and shifts along the cross axis, coming to rest at the configured collision padding from the colliding edge. [base-ui, ariakit, corvu]
- [ ] `popover.positioning.4` Given an open popover, when the anchor moves or an ancestor scrolls, then the popover follows it at a stable offset, and it stops following when anchor tracking is turned off. [base-ui, zag, bits]
- [ ] `popover.positioning.5` Given a popover with an arrow part, when the placement changes or flips, then the arrow moves to keep pointing at the anchor and the inset left over from the previous placement is cleared. [zag, ariakit, corvu]
- [ ] `popover.positioning.6` Given an open popover, when its positioner is inspected, then it exposes the anchor size, the available space and a transform origin as CSS custom properties, and an arrow part adds its own size and offset properties; the overflow padding property is exposed even while the popover is closed. [base-ui, zag, ariakit, corvu]
- [ ] `popover.positioning.7` Given an open popover, when the resolved side, alignment or arrow position changes, then the transform origin moves with it, so a scale animation grows from the edge nearest the anchor. [base-ui, corvu]
- [ ] `popover.positioning.8` Given an open popover, when it renders, then the content is portaled to the document body by default, can be portaled into a container the author names, and stays in place when portalling is turned off. [react-aria, base-ui, bits]
- [ ] `popover.positioning.9` Given author inline styles on the popover and its arrow, when positioning styles are applied, then the author values survive alongside the computed ones. (candidate) [react-aria]
- [ ] `popover.positioning.10` Given a popover aligned to one of several triggers, when a conditional trigger unmounts and the surrounding tree remounts, then the popover stays aligned to its active trigger. (candidate) (browser-only) [base-ui]
- [ ] `popover.positioning.11` Given two overlapping asynchronous positioning runs, when the older one resolves last, then its result is discarded and the placement from the newer run stands. (candidate) (browser-only) [ariakit]

### Animation and presence

- [ ] `popover.animation.1` Given a popover configured to keep its content mounted, when it closes, then the content stays in the document with its state attribute set to closed; when it is not kept mounted, the content is removed only after the exit animation finishes. [react-aria, base-ui, ark, headlessui, bits]
- [ ] `popover.animation.2` Given a popover with a CSS transition, when it opens and closes, then the content and the overlay each carry an entering marker at the start of the open and an exiting marker for the whole of the close. [react-aria, base-ui, bits]
- [ ] `popover.animation.3` Given a popover with per-side enter and exit animations, when it closes, then the resolved placement attribute stays on the content and the popover keeps being repositioned until the exit animation finishes. (candidate) [corvu]
- [ ] `popover.animation.4` Given a popover with an open-change completion callback, when it opens and closes, then the callback fires after the enter and exit animations finish, fires right away when no animation is defined, and never fires on a mount that starts closed. (candidate) (browser-only) [base-ui]
- [ ] `popover.animation.5` Given a hover-opened popover part way through its close transition, when the trigger is re-entered, then the popover returns to the open state without waiting for the close to finish. (candidate) (browser-only) [base-ui]
- [ ] `popover.animation.6` Given a popover shared by several triggers with a morph animation, when the active trigger changes, then the outgoing content stays alongside the incoming one and is marked inert until the animation finishes, rapid trigger changes settle on the last trigger, and no inline transform is left behind to override the CSS. (candidate) (browser-only) [base-ui]
- [ ] `popover.animation.7` Given a popover arrow whose theme changes while the popover is closed, when it reopens, then the arrow picks up the new fill, stroke and stroke width, so the colors are read fresh on each open. (candidate) [ariakit]
- [ ] `popover.animation.8` Given a user who prefers reduced motion, when a popover opens, then no animation runs. (candidate) (chromium-only) [ariakit]

### RTL and i18n

- [ ] `popover.rtl.1` Given a popover in a right-to-left context, when it is positioned with a logical side or alignment, then the logical value resolves against the reading direction without flipping, the transform origin points at the logical start or end edge, and the arrow keeps pointing at the anchor after a flip. [base-ui, zag, ariakit]
- [ ] `popover.rtl.2` Given a popover with no direction provider above it, when the floating element carries its own `dir`, then that value drives side and alignment resolution, and every part reflects the resolved direction. [base-ui, zag]

### Accessibility tooling

- [ ] `popover.a11y.1` Given a popover, when axe runs over the page with the popover closed and again with it open, then no violations are reported, with the dialog-name rule set aside for content that carries no title. [zag, ark, reka, melt]

### Notes and edge cases

- [ ] `popover.notes.1` Given any popover part rendered without its required ancestor, when it mounts, then it throws an error naming the missing ancestor rather than rendering in a broken state. [base-ui, headlessui, corvu]
- [ ] `popover.notes.2` Given an environment with no `ResizeObserver`, when an open popover renders, then the positioning layer throws unless `ResizeObserver` is polyfilled, and with zero-sized rectangles no collision handling happens at all, so flip and shift can only be asserted in a real engine. [corvu, reka]
- [ ] `popover.notes.3` Given a trigger whose DOM node is reparented, replaced or remounted while the popover is in use, when it is clicked, then it still opens and closes the popover and the popover stays aligned to it. [base-ui, ariakit]
- [ ] `popover.notes.4` Given two triggers declared for the same popover outside its content, when they render, then a warning is emitted; triggers placed inside the content do not warn. (candidate) [headlessui]
- [ ] `popover.notes.5` Given a popover whose content is loaded on demand, when it opens, then the dialog appears, focus lands on its first focusable element once the content has loaded, and Escape or a second trigger activation closes it. (candidate) [ariakit]
- [ ] `popover.notes.6` Given a responsive popover, when the viewport is mobile-sized, then the positioning wrapper becomes fixed to the bottom of the viewport and an outside click still closes it. (candidate) (chromium-only) [ariakit]
- [ ] `popover.notes.7` Given an open popover, when its resolved position is read, then the inline offsets are written asynchronously after the position is computed, so a frame must pass before they can be asserted. (candidate) [corvu]
- [ ] `popover.notes.8` Given an open popover whose trigger is hidden by an interaction outside it, when the trigger disappears, then the popover closes before its content can be seen jumping to the viewport origin. (candidate) (browser-only) [bits]

## Sources

- `docs/research/ariakit-and-headlessui.md`, section `popover`
- `docs/research/kobalte-and-corvu.md`, section `popover`
- `docs/research/radix-and-base-ui.md`, section `popover`
- `docs/research/react-aria-a.md`, section `popover`
- `docs/research/reka-melt-bits.md`, section `popover`
- `docs/research/zag-and-ark.md`, section `popover`

## Deferred

- No `apg-and-axe.md` popover section was drawn from, so this file has no normative `[apg]` bullets and no `[axe]` bullets. The axe runs recorded here come from the library suites themselves and are tagged accordingly.
- The `kobalte-and-corvu.md` popover section is entirely corvu source material, so no `[kobalte]` tag appears. Kobalte's popover behavior is still unsurveyed.
- No forms behavior, no SSR or hydration behavior, and no `[html]` popover behavior appeared in the sourced sections, so those subsections are absent. The native HTML popover attribute and the interaction between a popover and a form it sits inside are both unsurveyed.
- Geometry mechanics are left to `positioning.md`: side and align offsets as numbers and as functions, exact collision padding arithmetic, transform-origin string values per side and alignment, viewport anchoring styles per side, transform versus top and left positioning, and arrow stroke derivation from a box-shadow ring.
- Library-internal assertions were dropped: prop spreading and `asChild`, `render` and `as` forwarding, ref identity and stale-ref churn, render-loop and re-render guards, store and selector internals, keyed-context maps, conformance and type-only suites, exported part lists, class and style merging, and test-harness plumbing such as bits' dismissable-layer registry and melt's fixture destructuring.
- Base UI's detached-trigger handle machinery is folded down to two bullets (`popover.state.3` and `popover.state.5`) plus `popover.notes.3`. The handle ownership, root handoff and overlap-warning cases are not spec behavior a DOM-level test of a single popover would assert.
- Base UI's morphing viewport is reduced to `popover.animation.6`. The activation-direction tokens derived from trigger geometry are a viewport feature, not a popover guarantee, and are unresolved for this library.
- Unresolved defaults, all marked as Divergence pairs: the initial focus target (first focusable child versus the content element), whether an unconfigured popover traps focus, and whether an outside press on a focusable element restores focus to the trigger.
- Unresolved single-library behavior worth a decision before implementation: patient versus impatient click on a hover trigger (`popover.pointer.8`), touch tap disarming hover ownership (`popover.pointer.9`), and the touch-specific scroll lock condition (`popover.dismissal.13`). Only Base UI specifies these, and each would be a visible behavior choice.
- Skipped upstream cases noted but not turned into bullets: Zag's refocus-the-trigger-after-outside-click case, Ark Vue's Escape-closes and controlled-usage cases, and Ark Vue's lazy-mount `aria-controls` case. Corvu's `forceMount` on its content part is silently dropped upstream, so the content unmounts on close regardless.
