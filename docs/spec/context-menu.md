# context-menu

A menu opened by a secondary-pointer gesture on a region rather than by a
button. Everything inside the popup — item roles, arrow navigation, typeahead,
submenus, checkbox and radio items, groups and labels — is the menu contract in
`menu.md`; the libraries drive both from one implementation. This file records
only what differs: the opening gesture, the pointer anchor, the trigger's
attributes, and the dismissal rules that follow from opening at a point.

## context-menu

### Roles and attributes

- [ ] `context-menu.roles.1` Given an open context menu, then the popup MUST have `role="menu"` and its contents MUST follow the menu role contract: items with `menuitem`/`menuitemcheckbox`/`menuitemradio`, groups with `role="group"` labelled by their label element, and separators with `role="separator"` and `aria-orientation="horizontal"`. [radix, base-ui, zag, ark, reka, melt, bits]
- [ ] `context-menu.roles.2` Given a context-menu trigger, then it MUST NOT carry `aria-haspopup`, `aria-expanded` or `aria-controls` — there is no disclosure button to describe, only a region. [react-aria] (candidate)
- [ ] `context-menu.roles.3` Given a context-menu trigger, then its open state MUST be exposed as a style hook (`data-state`, `data-popup-open`) that appears while the menu is open and is removed when it closes. [radix, base-ui, zag]
- [ ] `context-menu.roles.4` Given a disabled context-menu trigger, then it MUST carry a disabled style hook. [radix, base-ui]
- [ ] `context-menu.roles.5` Given a context menu with several triggers sharing one menu, then only the right-clicked trigger MUST carry the current-trigger marker. [zag] (candidate)
- [ ] `context-menu.roles.6` Given a context-menu submenu, then its trigger MUST carry `aria-haspopup="menu"` with `aria-expanded` flipping to `"true"` while open, and `aria-controls` MUST name the submenu's id only while it is open. [radix]
- [ ] `context-menu.roles.7` Given a disabled context-menu submenu trigger, then it MUST carry a disabled style hook and MUST NOT open. [radix]
- [ ] `context-menu.roles.8` Given a context-menu checkbox item that is disabled, then it MUST carry `aria-disabled="true"` alongside `role="menuitemcheckbox"`. [radix]

### Keyboard

- [ ] `context-menu.keyboard.1` Given an open context menu with focus on the popup, when ArrowDown is pressed, then the first item MUST take focus; further ArrowDown/ArrowUp MUST move item by item, Home MUST return to the first item and End MUST jump to the last. [ariakit, zag, melt, bits]
- [ ] `context-menu.keyboard.2` Given an open context menu, when Escape is pressed, then it MUST close and the trigger MUST return to its closed state. [ariakit, radix, base-ui, zag, melt, bits]
- [ ] `context-menu.keyboard.3` Given an open context menu, when Tab or Shift+Tab is pressed, then the menu MUST close and focus MUST move to the next or previous tabbable element outside it. [bits] (candidate)
- [ ] `context-menu.keyboard.4` Given a context-menu submenu trigger, when ArrowRight, Enter or Space is pressed, then the submenu MUST open with its first item focused; ArrowLeft MUST close it again. [radix, bits]
- [ ] `context-menu.keyboard.5` Given a context-menu submenu opened by hover, when ArrowRight is pressed on its trigger, then the submenu's first item MUST receive focus. [radix]
- [ ] `context-menu.keyboard.6` Given two nested context-menu submenus open, when ArrowLeft is pressed on an item in the deepest one, then only that submenu MUST close, leaving its trigger and the root items in place. [radix]
- [ ] `context-menu.keyboard.7` Given a disabled context-menu submenu trigger, when ArrowRight is pressed on it, then the submenu MUST NOT open. [radix]
- [ ] `context-menu.keyboard.8` Given nested context-menu submenus, then typeahead MUST be scoped to the menu that currently has focus: a prefix matching an item in a parent menu MUST NOT move focus there, while the same prefix typed in the active menu MUST match. [radix]
- [ ] `context-menu.keyboard.9` Given macOS, when Ctrl+Enter is pressed on the trigger and no native `contextmenu` event follows, then the context menu MUST open positioned at the element's center, reported after a short (10ms) deferral so a genuine native `contextmenu` event can preempt it. [react-aria] (candidate)
- [ ] `context-menu.keyboard.10` Given macOS where the browser also fires a real `contextmenu` for Ctrl+Enter, then the keyboard path and the native event MUST be deduplicated into exactly one open. [react-aria] (candidate)
- [ ] `context-menu.keyboard.11` Given a non-macOS platform, when Ctrl+Enter is pressed, then no context menu MUST open; plain Enter without Ctrl MUST NOT open one on macOS either. [react-aria] (candidate)

### Pointer

- [ ] `context-menu.pointer.1` Given a closed context menu, when a `contextmenu` event (right click) fires on the trigger, then the popup MUST open with `role="menu"` present and the trigger MUST gain its open style hook. [radix, base-ui, ariakit, zag, ark, reka, melt, bits]
- [ ] `context-menu.pointer.2` Given a context-menu trigger, then the native browser context menu MUST be suppressed: the library MUST call `preventDefault` (React Aria also calls `stopPropagation`) on the `contextmenu` event. [react-aria, base-ui]
- [ ] `context-menu.pointer.3` Given the open menu, its own backdrop, and a portaled popup — including a portal container mounted inside the trigger's own DOM subtree — then a `contextmenu` event on any of them MUST be `defaultPrevented` so no native menu appears on top of the open one; a `contextmenu` on `document.body` outside them MUST NOT be prevented. [base-ui] (candidate)
- [ ] `context-menu.pointer.4` Given an author `onContextMenu` handler on the trigger, then it MUST run exactly once and the menu MUST still open: the library composes with the author's handler rather than replacing it. The handler still runs when the trigger is disabled. [kobalte]
- [ ] `context-menu.pointer.5` Given an author `onContextMenu` handler that calls `preventDefault`, then the menu MUST NOT open — the author can veto it. [kobalte] (candidate)
- [ ] `context-menu.pointer.6` Given a trigger whose handler opts out of the library's own open behavior, then the native context menu MUST still be blocked. [base-ui] (candidate)
- [ ] `context-menu.pointer.7` Given a disabled context-menu trigger, when a `contextmenu` event fires, then no popup MUST mount and no open-change callback MUST fire; the native context menu MUST still be allowed through (the event MUST NOT be `defaultPrevented`). [radix, base-ui]
- [ ] `context-menu.pointer.8` Given an open context menu, when a second `contextmenu` event fires on the trigger at different coordinates, then the menu MUST stay open and re-anchor to the new pointer position. [radix, zag]
- [ ] `context-menu.pointer.9` Given an open context menu re-triggered at the very same coordinates, then it MUST still reposition rather than skipping the pass, ending with valid positioner coordinates. [zag] (candidate)
- [ ] `context-menu.pointer.10` Given an open context menu with a submenu showing, when the trigger is right-clicked again, then the root menu MUST re-open fresh and the submenu content MUST be removed. [radix]
- [ ] `context-menu.pointer.11` Given an open context menu, when the trigger is left-clicked, then the menu MUST close. [zag, bits]
- [ ] `context-menu.pointer.12` Given a right-click while another context menu on the page is open, then the first menu MUST close and the second MUST open. [bits] (candidate)
- [ ] `context-menu.pointer.13` Given a context-menu trigger region containing a second, nested context-menu trigger, then right-clicking the nested trigger MUST open the nested menu; Base UI leaves the outer menu closed when it was closed, while bits leaves an already-open outer menu in the DOM. [base-ui, bits]
- [ ] `context-menu.pointer.14` Given a context-menu trigger nested inside a tooltip trigger, when the tooltip trigger is hovered and the context trigger right-clicked, then the context menu MUST open. [bits] (candidate)
- [ ] `context-menu.pointer.15` Given an open context menu with nested submenus, then hovering the sub trigger and then the sub-sub trigger MUST open both levels. [bits] (candidate)
- [ ] `context-menu.pointer.16` Given a context-menu submenu trigger, when it is hovered, then the submenu MUST open without focusing its first item; the grace area between trigger and submenu MUST keep it open while the pointer travels toward it and MUST close it when the pointer leaves away from it, with the safe directions following the side the submenu actually landed on at a collision edge. [radix]
- [ ] `context-menu.pointer.17` Given a context-menu submenu open with the pointer inside it, when the pointer moves back onto its own trigger, then the submenu MUST stay open; moving to any other item in the parent menu — plain, disabled, another sub trigger or a disabled sub trigger — MUST close it. [radix]
- [ ] `context-menu.pointer.18` Given nested context-menu submenus, when the pointer moves back to the root-level trigger, then the deeper unassociated submenus MUST close while the first submenu stays open. [radix]
- [ ] `context-menu.pointer.19` Given an item in an open context menu, when it is clicked, then its select handler MUST fire exactly once and the menu MUST close. [radix, bits, melt]
- [ ] `context-menu.pointer.20` Given a disabled item, when it is clicked, then its select handler MUST NOT fire and the menu MUST stay open. [radix]
- [ ] `context-menu.pointer.21` Given an item whose select handler calls `preventDefault`, then the menu MUST stay open; a sibling item without the call MUST still close it. [radix]
- [ ] `context-menu.pointer.22` Given a touch long press on the trigger, then the menu MUST open at the touch point once the threshold elapses, with the positioner landing near the touch coordinates. [radix, base-ui, react-aria, zag]
- [ ] `context-menu.pointer.23` Divergence: the touch long-press threshold is 500ms. [base-ui, react-aria] (decision needed)
- [ ] `context-menu.pointer.24` Divergence: the touch long-press threshold is 700–750ms. [radix, zag] (decision needed)
- [ ] `context-menu.pointer.25` Given a pending long press, when the touch moves more than 10px, then the pending open MUST be cancelled; movement within the threshold MUST leave it pending. [base-ui] (candidate)
- [ ] `context-menu.pointer.26` Given a pending long press, when the touch ends or is cancelled before the threshold, then no menu MUST open. [base-ui, react-aria]
- [ ] `context-menu.pointer.27` Given a pending long press, when the gesture becomes multi-touch, then it MUST be cancelled, and a fresh single touch followed by a second touch MUST leave the menu closed too. [base-ui] (candidate)
- [ ] `context-menu.pointer.28` Given a disabled trigger, when a long press is performed, then no popup MUST mount and no open-change callback MUST fire. [base-ui] (candidate)
- [ ] `context-menu.pointer.29` Given a platform that fires its own native `contextmenu` during a long press (Android Chrome), then the long-press path and the native event MUST be deduplicated into exactly one open. [react-aria] (candidate)
- [ ] `context-menu.pointer.30` Given a context menu opened by right click, when the pointer is released (`mouseup` with the secondary button) over an item after leaving the initial cursor point, then the item MUST be activated and every open level MUST close with an item-press reason. This release-to-select gesture is macOS-only: on other platforms the release MUST be ignored and the menu MUST stay open. [base-ui] (candidate)
- [ ] `context-menu.pointer.31` Given a context menu that spawned directly under the cursor, when the release lands at the identical point, then it MUST be ignored so the menu is not dismissed by the gesture that opened it; this holds for a negative align offset too. [base-ui] (candidate)
- [ ] `context-menu.pointer.32` Given the release-to-select gesture landing on a submenu trigger, then the submenu MUST NOT be activated by it. [base-ui] (candidate)
- [ ] `context-menu.pointer.33` Given a `mousedown` outside followed by the opening `contextmenu`, when the `mouseup` arrives within 500ms, then the open MUST NOT be cancelled; when it arrives after 500ms, the open MUST be cancelled. [base-ui] (candidate)
- [ ] `context-menu.pointer.34` Given a trigger whose `pointer-events` style is overridden by the author, then right-clicking twice MUST still open and then close the menu. [bits] (candidate)

### Focus management

- [ ] `context-menu.focus.1` Given a context menu opened by right click, then the popup element itself MUST take focus with no item highlighted; the first item is reached only by pressing ArrowDown. [ariakit, zag, melt, bits]
- [ ] `context-menu.focus.2` Given an open-autofocus hook that calls `preventDefault` and focuses its own target, then the popup MUST NOT take focus and the author's target MUST. [bits] (candidate)
- [ ] `context-menu.focus.3` Given a close-autofocus hook that calls `preventDefault` and focuses its own target, then closing with Escape MUST land focus there. [bits] (candidate)
- [ ] `context-menu.focus.4` Given an open context menu, when a submenu trigger is focused programmatically with no key pressed, then the submenu MUST stay closed. [radix]

### State

- [ ] `context-menu.state.1` Given a context menu with an open-change callback, when it opens by right click, then the callback MUST be called with `true`; Escape MUST call it with `false`. [radix, base-ui]
- [ ] `context-menu.state.2` Given a controlled `open={false}` not wired back to state, when the trigger is right-clicked, then the callback MUST fire with `true` but the menu MUST NOT open. [radix]
- [ ] `context-menu.state.3` Given a controlled context menu, then an external control setting `open` to `false` MUST close it and return the trigger to its closed state. [radix]
- [ ] `context-menu.state.4` Given a context-menu checkbox item wired to state, then clicking it MUST flip `aria-checked` and the new state MUST survive closing and reopening the menu. [radix, bits]
- [ ] `context-menu.state.5` Given a context-menu radio group, then clicking an unselected item MUST call the value-change callback with that value and MUST move `aria-checked="true"` to it on reopen. [radix, bits]
- [ ] `context-menu.state.6` Given a context-menu checkbox group, then its `value` MUST drive the items' `aria-checked`, clicking an item MUST call the change callback exactly once with the new array, and an external binding change MUST be reflected on reopen. [bits] (candidate)
- [ ] `context-menu.state.7` Given a sub item with a select handler, then clicking it MUST call the handler; Enter and ArrowRight on a sub trigger MUST each call the sub trigger's own select handler. [bits] (candidate)

### Dismissal and layering

- [ ] `context-menu.dismissal.1` Given an open context menu, when a click lands outside it, then it MUST close. [ariakit, radix, base-ui, zag, melt, bits]
- [ ] `context-menu.dismissal.2` Given an open context menu with submenus, when an item in any level is clicked or the page outside is clicked, then every level MUST close. [radix, base-ui, bits]
- [ ] `context-menu.dismissal.3` Given an open context menu, when the menu itself is right-clicked, then it MUST stay open; a right click on the page outside MUST close it so the browser's own context menu can appear. [react-aria, ariakit]
- [ ] `context-menu.dismissal.4` Given a default (modal) context menu, then `document.body.style.pointerEvents` MUST become `"none"` while it is open and return to its previous value on close; a non-modal context menu MUST leave it untouched. [radix]
- [ ] `context-menu.dismissal.5` Given an escape-behavior option set to ignore, then Escape MUST leave the menu open and arrow navigation MUST keep working. [bits, melt]
- [ ] `context-menu.dismissal.6` Given an outside-interaction option set to ignore, or an outside-press handler that calls `preventDefault`, then an outside `pointerdown` or click MUST leave the menu open. [bits, melt]
- [ ] `context-menu.dismissal.7` Given an outside press whose later mouse events are swallowed by another overlay, then the context menu MUST still close on the initial press. [radix] (candidate)
- [ ] `context-menu.dismissal.8` Given a context menu opened inside an open dialog, when a click lands inside the dialog but outside the menu, then only the context menu MUST dismiss and the dialog MUST stay open. [radix, bits]
- [ ] `context-menu.dismissal.9` Given a context-menu trigger inside an open dialog or popover, when that trigger is left-clicked, then the dialog or popover MUST stay open and no context menu MUST appear. [bits] (candidate)
- [ ] `context-menu.dismissal.10` Given other layers (a popover, a select) opened inside a context-menu trigger region, then opening a sibling layer MUST dismiss the first one, in both directions and between two selects. [bits] (candidate)
- [ ] `context-menu.dismissal.11` Given the gesture that opened the menu ending inside the menu's own positioner or inside a portaled submenu popup, then the menu MUST stay open and no extra open-change call MUST fire. [base-ui] (candidate)
- [ ] `context-menu.dismissal.12` Given a menu opened by long press, then outside-press dismissal MUST be delayed: an immediate `mousedown` on the body MUST leave it open while one after a further 500ms MUST close it. [base-ui] (candidate)
- [ ] `context-menu.dismissal.13` Given an open context menu whose trigger unmounts, then the pending document `mouseup` listener MUST be aborted so no late release closes or reopens anything. [base-ui] (candidate)

### Positioning

- [ ] `context-menu.positioning.1` Given a context menu opened by right click, then it MUST be anchored to the pointer coordinates rather than to the trigger's box, with the pointer position published to the positioner. [radix, base-ui, zag]
- [ ] `context-menu.positioning.2` Given a context menu whose reported coordinates are element-relative, then they MUST be the client coordinates translated by the trigger's rect origin. [react-aria] (candidate)
- [ ] `context-menu.positioning.3` Given a context menu anchored near the viewport edge with side collision avoidance set to flip, then the resolved side MUST flip to the opposite side. (browser-only) [base-ui] (candidate)
- [ ] `context-menu.positioning.4` Given a root context menu, then cross-axis shifting MUST be measured against the layout viewport, and it MUST be disabled when side collision avoidance is set to flip; an explicit side, align and offsets MUST be preserved. A context-menu submenu MUST use the visual viewport instead. [base-ui] (candidate)
- [ ] `context-menu.positioning.5` Given no portal target, then the content MUST be portaled to `document.body`; a portal target MUST be honored, and a disabled portal MUST leave the content in its original container. [bits] (candidate)
- [ ] `context-menu.positioning.6` Given a context menu with several triggers, then right-clicking a different trigger MUST keep the menu open, keep focus, and move the positioner to the new coordinates. [zag] (candidate)

### Animation and presence

- [ ] `context-menu.animation.1` Given force-mounted context-menu content, then it MUST exist in the DOM before the menu is ever opened; combined with an open guard in the markup, it MUST appear only after the right click. [bits] (candidate)

### RTL and i18n

- [ ] `context-menu.rtl.1` Given a right-to-left context menu, then the submenu open and close keys MUST swap: ArrowLeft opens the submenu with its first item focused and ArrowRight closes it, leaving the root menu open. [radix]
- [ ] `context-menu.rtl.2` Given a right-to-left context menu, then the pointer grace area MUST mirror: leaving the sub trigger left-to-right closes the submenu and right-to-left keeps it open, with the directions inverted again at a collision edge. [radix]

### Accessibility tooling

- [ ] `context-menu.a11y.1` Given a context menu opened by right click, when axe runs over the container, then there MUST be no violations. [radix, reka, melt]
- [ ] `context-menu.a11y.2` Given a modal context menu whose fallback disclosure is the previously focused control, then that captured control MUST NOT join the modal context (it cannot be assumed to close the menu), the fallback dismiss button MUST render next to the menu rather than inside it, and the menu MUST contain no `button` — its accessibility-tree children MUST be only its items and separators. [ariakit] (candidate)

### Notes and edge cases

- [ ] `context-menu.notes.1` Given a controlled context menu rendered `open={true}` before any user interaction, then a development warning MUST be emitted exactly once, because the pointer position is indeterminate; no warning MUST be emitted for an uncontrolled menu or for a controlled menu opened by interaction. [radix] (candidate)
- [ ] `context-menu.notes.2` Given a context-menu part rendered with no root ancestor, then it MUST throw an error naming the missing root. [base-ui] (candidate)
- [ ] `context-menu.notes.3` Given every context-menu part, then it MUST forward unconsumed props and refs to the element it renders, merge class names and inline styles (including with the trigger's own `WebkitTouchCallout` style), support a render/`asChild` escape hatch that preserves the part's role and state attributes, and compose the author's handlers with its own. [radix, base-ui]
- [ ] `context-menu.notes.4` Given explicit ids for the trigger, menu, sub trigger and submenu, then the rendered elements MUST carry exactly those ids. [melt] (candidate)
- [ ] `context-menu.notes.5` Given a context menu with several triggers, then the menu's item content MUST be derivable from the active trigger, so right-clicking different rows can produce different labels. [zag] (candidate)
- [ ] `context-menu.notes.6` Given no context-menu handler registered at all, then a `contextmenu` event MUST be a safe no-op rather than throwing. [react-aria] (candidate)
- [ ] `context-menu.notes.7` Given the library attaches a handler to a DOM event the author can also handle, then the contract is run-both-and-respect-`preventDefault`; this is worth a cross-cutting suite rule rather than a per-component test. [kobalte] (candidate)
- [ ] `context-menu.notes.8` Given Safari, then a native button with no explicit `tabindex` leaves `BODY` as the active element, so the fallback-disclosure capture reaches the modal context through a different branch than in Chromium. (safari-only) [ariakit] (candidate)
- [ ] `context-menu.notes.9` Given a context-menu fixture gated behind a transition, then `requestAnimationFrame` must be stubbed to a short timeout for the content to resolve in tests. [melt] (candidate)

## Sources

- `docs/research/radix-and-base-ui.md` — `## context-menu` (plus the shared `## menu` popup behavior) → tags `radix`, `base-ui`.
- `docs/research/react-aria-a.md` — `## context-menu` (`useContextMenu` interaction hook) → tag `react-aria`.
- `docs/research/reka-melt-bits.md` — `## context-menu`, and the context-menu cases carried inside `## menu` → tags `reka`, `melt`, `bits`.
- `docs/research/zag-and-ark.md` — `## context-menu` → tags `zag`, `ark`.
- `docs/research/ariakit-and-headlessui.md` — `## context-menu` → tag `ariakit`.
- `docs/research/kobalte-and-corvu.md` — `## context-menu` (trigger handler composition only) → tag `kobalte`.
- Popup internals (item roles, arrow keys, typeahead, submenu grace areas, checkbox and radio items, groups and labels) are specified once in `docs/spec/menu.md`; this file does not repeat them.

## Deferred

- Base UI's macOS release-to-select gesture (`context-menu.pointer.30`–`context-menu.pointer.33`) is platform-conditional behavior needing a platform shim in the harness; recorded, not yet scheduled.
- React Aria's `useContextMenu` platform matrix (Ctrl+Enter on macOS, iOS long press, Android dedup) sits in an interaction hook rather than the component; kept here as candidates until we decide where the gesture layer lives.
- Prop-spreading and `describeConformance`-style assertions (`context-menu.notes.3`) are adapter surface covered by the harness rather than per-bullet tests.
- No source tests a context menu's SSR or hydration behavior, or a `Forms` concern; those subsections are empty on purpose.
- Corvu has no context-menu coverage at all, and kobalte's is three trigger-handler tests pinned to issue #646 — treat the `kobalte` tags here as narrow.
- Unresolved: the touch long-press threshold (`context-menu.pointer.23` vs `context-menu.pointer.24`).
