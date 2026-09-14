# navigation-menu

A site-navigation bar whose triggers reveal panels of links. Despite the name it
is not an ARIA `menu`: there is no `menubar` role, no `menuitem` roles, no
typeahead and no roving-tabindex composite. Triggers are ordinary buttons with
`aria-expanded`, panels hold plain tabbable content, and Tab walks through
everything. Only one panel is open at a time, usually revealed in a shared
viewport that animates between sizes.

## navigation-menu

### Roles and attributes

- [ ] `navigation-menu.roles.1` Given a navigation menu trigger, then it MUST be a `button` carrying `aria-expanded`, which reads `"true"` exactly while its panel is open. [radix, base-ui, zag, reka, bits]
- [ ] `navigation-menu.roles.2` Given an open panel, then the trigger's `aria-controls` MUST equal the panel's non-empty `id` and resolve to an element containing the panel content; while closed the attribute MUST be absent rather than pointing at a non-existent id. [radix, zag]
- [ ] `navigation-menu.roles.3` Given a panel, then it MUST be `hidden` unless selected and MUST carry `aria-labelledby` naming its trigger. [zag] (candidate)
- [ ] `navigation-menu.roles.4` Given a navigation menu, then neither the root nor the list MUST carry `aria-orientation` — including for a nested root and list — because neither is an ARIA composite; orientation MUST be published as a data attribute instead. [base-ui, zag, radix]
- [ ] `navigation-menu.roles.5` Given the root, then it MUST carry an accessible label (Zag supplies a translated default). [zag] (candidate)
- [ ] `navigation-menu.roles.6` Given a link marked as the current page, then it MUST carry `aria-current="page"`, and a link not so marked MUST have no `aria-current` attribute at all. [base-ui, zag]
- [ ] `navigation-menu.roles.7` Given a disabled trigger, then it MUST carry a disabled style hook, removed again when the trigger is enabled. [base-ui, zag]
- [ ] `navigation-menu.roles.8` Given a trigger containing an icon part, then the icon of the open item MUST carry the popup-open style hook and the other items' icons MUST NOT. [base-ui] (candidate)
- [ ] `navigation-menu.roles.9` Given the indicator, item indicator and arrow parts, then they MUST be `aria-hidden`, hidden while closed, and carry state and orientation hooks. [zag] (candidate)
- [ ] `navigation-menu.roles.10` Given a value switch between two items, then the newly opened panel MUST publish the direction of travel and the re-opened previous panel the opposite one (`right`/`left` when horizontal, `down`/`up` when vertical). [base-ui, radix]
- [ ] `navigation-menu.roles.11` Given content rendered inside a shared viewport, then a proxy element MUST use `aria-owns` to associate the content with the viewport for assistive technology. [zag, base-ui]
- [ ] `navigation-menu.roles.12` Given a selected item, then a hidden trigger-proxy element with `aria-hidden` and `tabindex="0"` MUST exist so Tab can move between the trigger and the panel in either direction, sending a focus event whose side depends on whether the trigger was focused. [zag] (candidate)
- [ ] `navigation-menu.roles.13` Given the root, then it MUST publish the trigger and viewport geometry as CSS custom properties (`--trigger-width/height/x/y`, `--viewport-width/height/x/y`), which is what drives the sliding viewport animation. [zag] (candidate)

### Keyboard

- [ ] `navigation-menu.keyboard.1` Given a focused trigger, when Enter or Space is pressed, then its panel MUST open; pressing the key again on the same trigger MUST close it. [zag, bits, base-ui]
- [ ] `navigation-menu.keyboard.2` Given a focused trigger in a horizontal menu, when ArrowDown is pressed, then its panel MUST open. [base-ui, reka, bits]
- [ ] `navigation-menu.keyboard.3` Divergence: opening a panel from the keyboard leaves focus on the trigger; a further Tab or ArrowDown is what moves focus into the panel. [base-ui, zag] (decision needed)
- [ ] `navigation-menu.keyboard.4` Divergence: opening a panel with ArrowDown moves focus straight to the panel's first focusable child. [reka, bits] (decision needed)
- [ ] `navigation-menu.keyboard.5` Given focus on a trigger, when ArrowRight is pressed, then focus MUST move to the next trigger and ArrowLeft back to the previous one, walking past plain top-level links as well as triggers. [base-ui, zag, bits]
- [ ] `navigation-menu.keyboard.6` Given focus on a trigger, when Home is pressed, then focus MUST jump to the first trigger and End to the last focusable element in the list. [zag] (candidate)
- [ ] `navigation-menu.keyboard.7` Given a vertical navigation menu, then the list MUST swallow the vertical navigation keys so they do not escape to an ancestor handler, while keys it does not own (PageDown) MUST still bubble. [base-ui] (candidate)
- [ ] `navigation-menu.keyboard.8` Given an item removed from the list, then arrow navigation MUST be computed from the surviving registry rather than a stale index. [base-ui] (candidate)
- [ ] `navigation-menu.keyboard.9` Given an open panel, when Tab is pressed, then focus MUST move to the panel's first tabbable child. [zag, reka, bits]
- [ ] `navigation-menu.keyboard.10` Given focus inside an open panel, then ArrowDown and ArrowUp MUST walk its focusable children one at a time, and ArrowRight/ArrowLeft MUST do the same in a horizontal panel. [zag, reka, bits]
- [ ] `navigation-menu.keyboard.11` Given focus inside an open panel, when Home or End is pressed, then focus MUST jump to its first or last focusable child. [zag] (candidate)
- [ ] `navigation-menu.keyboard.12` Given the first focusable child of a panel, when ArrowUp is pressed, then focus MUST stay put; from the last child ArrowDown MUST also stay put, so navigation inside a panel MUST NOT loop. [zag] (candidate)
- [ ] `navigation-menu.keyboard.13` Given an inline nested navigation menu, then ArrowDown and ArrowUp MUST reach the nested triggers from the parent panel's links and cycle back, at two levels and at three or more. [base-ui] (candidate)
- [ ] `navigation-menu.keyboard.14` Given a nested sub trigger inside an open panel, when ArrowRight is pressed, then focus MUST move to the next sub trigger and ArrowLeft back to the previous one. [bits] (candidate)
- [ ] `navigation-menu.keyboard.15` Given a focused sub trigger, when Enter is pressed, then its panel MUST open, and pressing Enter again MUST leave it open rather than toggling it closed. [bits, base-ui]
- [ ] `navigation-menu.keyboard.16` Given focus inside an open panel, when Escape is pressed, then the panel MUST close and focus MUST return to its trigger, from any position inside the panel; Enter MUST then be able to reopen it. [zag, base-ui]
- [ ] `navigation-menu.keyboard.17` Given a close delay started by an outside click, when Escape is pressed before the delay elapses, then the panel MUST close immediately rather than waiting. [zag] (candidate)
- [ ] `navigation-menu.keyboard.18` Given a panel opened with the keyboard, then moving focus between triggers with an arrow key MUST NOT emit a duplicate value change: only the key that actually opens a panel MUST report the new value. [base-ui] (candidate)
- [ ] `navigation-menu.keyboard.19` Given a disabled trigger with focus, when the open key is pressed, then no panel MUST open and no value change MUST be reported. [base-ui] (candidate)

### Pointer

- [ ] `navigation-menu.pointer.1` Given a closed navigation menu, when a trigger is hovered with a mouse, then its panel MUST open after the open delay. [radix, base-ui, zag, reka, bits]
- [ ] `navigation-menu.pointer.2` Given a hover-open mode turned off (Radix's `activationMode="manual"`, bits' `openOnHover: false`, Reka's `disableHoverTrigger`), then hovering a trigger MUST NOT open its panel even after the delay elapses, and a click MUST open and close it. [radix, reka, bits]
- [ ] `navigation-menu.pointer.3` Given click-to-open turned off (Reka's `disableClickTrigger`), then clicking the trigger MUST NOT open its panel. [reka] (candidate)
- [ ] `navigation-menu.pointer.4` Given a nested navigation menu with no explicit activation mode, then it MUST inherit the parent's mode, and its own explicit mode MUST override the inherited one in both directions. [radix] (candidate)
- [ ] `navigation-menu.pointer.5` Given a closed navigation menu, when a trigger is clicked, then its panel MUST open. [radix, base-ui, zag, reka, bits]
- [ ] `navigation-menu.pointer.6` Given a panel opened by click, when the same trigger is clicked again, then the panel MUST close. [radix, base-ui, zag, bits]
- [ ] `navigation-menu.pointer.7` Given a panel opened by hover, when the same trigger is clicked, then the panel MUST close and continuing to hover MUST NOT reopen it; moving to another trigger and back MUST reopen it. [zag, base-ui]
- [ ] `navigation-menu.pointer.8` Given a panel opened by hover, when the trigger is clicked before the patient-click threshold (500ms), then the click MUST NOT close the panel; after the threshold it MUST. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.9` Given a panel opened by hover and closed by one click, when the trigger is clicked again immediately, then the second click MUST reopen it rather than being swallowed. [zag] (candidate)
- [ ] `navigation-menu.pointer.10` Given one panel already open, when a different trigger is hovered, then that trigger's panel MUST open and the previous one MUST close, with no open delay — the switch is instant. [radix, base-ui, zag, reka, bits]
- [ ] `navigation-menu.pointer.11` Given rapid hovering across three triggers, then only the last hovered panel MUST end up open. [zag] (candidate)
- [ ] `navigation-menu.pointer.12` Given a panel open by click, when a different trigger is clicked (with mouse or with touch), then the panels MUST swap rather than the menu closing. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.13` Given a panel open by hover, when the pointer leaves the trigger without reaching the panel, then the panel MUST stay open for the close delay and close once it elapses; a custom close delay MUST be honored exactly. [base-ui, zag, reka, bits]
- [ ] `navigation-menu.pointer.14` Given a panel open by hover, when the pointer leaves the panel itself, then the panel MUST close after the close delay. [reka, base-ui]
- [ ] `navigation-menu.pointer.15` Given a custom open delay, then the panel MUST NOT appear before it elapses and MUST appear once it does. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.16` Given a panel opening by hover, then pointer events MUST be blocked on the list (and so on the sibling triggers and any top-level links) while the pointer traverses the gap from the trigger to the panel, and released once the pointer reaches the positioner. The lock MUST be scoped to the list element, leaving `document.body` untouched. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.17` Given the traversal lock, then it MUST be reapplied every time the pointer returns to a trigger and cleared on every entry to the positioner, and it MUST stay active when the pointer moves straight from one trigger to another without visiting the panel. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.18` Given the traversal lock is active, then a `pointerdown` on the trigger MUST clear it immediately. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.19` Given a list rendered as a custom element rather than the default `ul`, then the traversal lock MUST fall back to scoping on the document, locking and clearing `document.body` pointer events in step with each hover and `pointerdown`. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.20` Given the pointer sweeps across a trigger and off again before the open delay elapses, then the traversal lock MUST be released and no panel MUST open. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.21` Given a batched update that closes the menu and unmounts the open trigger while the pointer is still over it, then the traversal lock MUST be released. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.22` Given an inline nested panel opened by hover, then the traversal lock MUST be scoped to the nested list while the pointer crosses the gap toward the nested viewport, held while the pointer stays on the traversal path (for a viewport placed on any of the four sides), and cleared when the pointer leaves that path or reaches the viewport — while the nested panel itself stays open. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.23` Given a nested panel open, when the pointer moves onto the nested panel, then both the nested panel and its parent MUST stay open; returning from the panel to its own trigger MUST also keep both open. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.24` Given a nested panel open, when a sibling nested trigger is hovered, then exactly one nested panel MUST be open at a time and `aria-expanded` MUST follow the hovered trigger. [base-ui, bits]
- [ ] `navigation-menu.pointer.25` Given a nested panel open, when the parent panel closes (its trigger and panel both left by the pointer after the close delay), then every nested panel MUST unmount with it. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.26` Given a nested trigger whose panel is already open, when that trigger is clicked, then the panel MUST stay open rather than toggling closed. [base-ui, bits]
- [ ] `navigation-menu.pointer.27` Given touch input, then hovering MUST NOT open a panel while tapping MUST; after a touch interaction closes the menu, hover opening MUST be restored, including after tapping a nested trigger. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.28` Given a hover-opened panel, when `pointerdown` lands on a link inside it and the pointer then leaves the link, then the panel MUST close. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.29` Given a link with close-on-click inside an open panel, when it is clicked, then the panel MUST close and the trigger MUST return to `aria-expanded="false"`; with close-on-click off the panel MUST stay open. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.30` Given a nested link with close-on-click, when it is clicked, then every level MUST close up to and including the root, and the root's value-change callback MUST report the closed value — at two levels and at three. [base-ui] (candidate)
- [ ] `navigation-menu.pointer.31` Given hover opening disabled and a panel open by click, when a plain top-level link is clicked, then the panel MUST close. [reka] (candidate)
- [ ] `navigation-menu.pointer.32` Given a hovered trigger, then the indicator element MUST be rendered while its panel is open. [bits] (candidate)

### Focus management

- [ ] `navigation-menu.focus.1` Given a panel opened from a focused trigger, when Escape closes it, then focus MUST remain on (or return to) that trigger. [base-ui, zag]
- [ ] `navigation-menu.focus.2` Given a panel closed by hovering out, then focus MUST NOT be moved to the trigger. [base-ui] (candidate)
- [ ] `navigation-menu.focus.3` Given a panel closed by clicking an element outside, then focus MUST stay on that outside element rather than returning to the trigger. [base-ui] (candidate)
- [ ] `navigation-menu.focus.4` Given an open panel, then Tab MUST walk trigger → the panel's tabbable children → the next trigger, and Shift+Tab MUST reverse it, returning to the trigger with the panel still open. [base-ui, zag, bits]
- [ ] `navigation-menu.focus.5` Given focus tabbing forward out of the last trigger or out of arbitrary tabbable panel content, then the panel MUST close and focus MUST NOT be returned to the trigger. [base-ui, zag]
- [ ] `navigation-menu.focus.6` Given focus tabbing backward out of the first trigger, then the panel MUST close. [base-ui, zag]
- [ ] `navigation-menu.focus.7` Given focus that has tabbed out of a panel onto the next trigger, when Shift+Tab is pressed, then focus MUST return to the last visited item inside that panel, not to the panel's trigger. [base-ui] (candidate)
- [ ] `navigation-menu.focus.8` Given a popup with no viewport (so no viewport focus guard is rendered), when a focus guard after the trigger receives focus, then focus MUST be redirected back to the trigger and the panel MUST stay open. [base-ui] (candidate)
- [ ] `navigation-menu.focus.9` Given an inline nested navigation menu, then Tab from the last link of the active nested panel MUST reach the next top-level trigger while the nested panel stays open, and tabbing between nested triggers MUST NOT open the inactive panels. [base-ui] (candidate)
- [ ] `navigation-menu.focus.10` Given an inline nested panel left by Tab, when Shift+Tab is pressed, then focus MUST return to that panel's last visited item. [base-ui] (candidate)
- [ ] `navigation-menu.focus.11` Given a focused link inside an open panel, when it fires `blur` with a null `relatedTarget` (focus leaving to nothing), then the panel MUST stay open. [base-ui] (candidate)
- [ ] `navigation-menu.focus.12` Given a panel opened by hover and then tabbed into, when Escape closes it, then focus MUST return to the trigger and Enter MUST be able to reopen it. [zag] (candidate)
- [ ] `navigation-menu.focus.13` Given one panel opened and closed with the keyboard, then opening a second panel MUST let Tab walk its own content links in order. [zag] (candidate)
- [ ] `navigation-menu.focus.14` Given a focused trigger, when Tab moves focus from the trigger into the panel or from the panel back to the trigger, then the panel MUST NOT close. [zag] (candidate)

### State

- [ ] `navigation-menu.state.1` Given a default value, then the named item MUST be open on first render. [radix, base-ui]
- [ ] `navigation-menu.state.2` Given a value-change callback, then it MUST fire exactly once per switch with the newly open item's value. [base-ui] (candidate)
- [ ] `navigation-menu.state.3` Given a value-change callback that cancels the event, then the callback MUST fire but the panel MUST NOT open. [base-ui] (candidate)
- [ ] `navigation-menu.state.4` Given an item whose value is falsy (`0`, `''`, `false`), then it MUST still be treated as a valid open value: the callback reports that exact value, the trigger reports expanded, and its panel mounts. The same holds for an inline nested item, and a nested close with a falsy open value MUST still propagate to the parent root. [base-ui] (candidate)
- [ ] `navigation-menu.state.5` Given a controlled value, then the open panel MUST follow the prop rather than the pointer. [base-ui] (candidate)
- [ ] `navigation-menu.state.6` Given a disabled trigger, then hover, click, touch and keyboard MUST all fail to open it and no value change MUST be reported. [base-ui] (candidate)
- [ ] `navigation-menu.state.7` Given a nested menu with toggling disabled (Radix's `disableToggle`, the default), then clicking the open item's trigger MUST leave it open; with the option off, that click MUST close it. This holds in both automatic and manual activation modes. [radix] (candidate)
- [ ] `navigation-menu.state.8` Given an actions ref exposing `unmount`, then closing the panel MUST leave it mounted until `unmount()` is called, and calling `unmount()` during a running close animation MUST unmount it immediately without waiting. [base-ui] (candidate)
- [ ] `navigation-menu.state.9` Given content kept mounted while hidden, then an inactive panel's dismiss handler MUST return early so a pointer-down inside the active panel does not clear the active value. [reka] (candidate)

### Dismissal and layering

- [ ] `navigation-menu.dismissal.1` Given an open panel, when a click or `pointerdown` lands outside, then the panel MUST close. [base-ui, zag, reka]
- [ ] `navigation-menu.dismissal.2` Given an open panel, when Escape is pressed, then it MUST close. [base-ui, zag]
- [ ] `navigation-menu.dismissal.3` Given an open panel, when focus moves between two elements that are both outside the menu — a `focusin` with no `relatedTarget`, as an external layer autofocusing on open produces — then the panel MUST NOT be dismissed; a `focusin` whose `relatedTarget` is inside the panel (focus genuinely leaving) MUST dismiss it. [radix] (candidate)
- [ ] `navigation-menu.dismissal.4` Given a dialog or popover nested inside an open panel, then opening it and interacting inside it MUST leave the panel open, including a `pointerdown` on the nested trigger followed by the pointer leaving the panel. [base-ui] (candidate)

### Positioning

- [ ] `navigation-menu.positioning.1` Given a navigation menu positioner, then it MUST position against the layout viewport rather than the visual viewport. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.2` Given a side of `left`, or the logical equivalent for the writing direction (`inline-start` in LTR, `inline-end` in RTL), then the popup MUST be pinned to the right edge so it grows leftward. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.3` Given a viewport switching between panels, then the positioner MUST animate its size to the newly active panel's measured size and settle with the popup's own size vars back to `auto`. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.4` Given content inserted into the active panel while it is open, then the positioner size MUST be updated to the new measurement, and a further insertion mid-transition MUST remain interruptible. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.5` Given a measurement that temporarily returns zero — an interrupted mutation, or a close where the content has lost its open state — then the current size MUST be preserved rather than collapsing to zero. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.6` Given a panel that mounts during opening, or kept content moving into the portal for the first time, then the size MUST NOT animate through the intermediate measurement: only the settled size MUST be written. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.7` Given a trigger switch that starts before an earlier open animation resolves, then the stale animation's size reset MUST be ignored and the positioner MUST report the new panel's size. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.8` Given a trigger whose panel was hovered and then superseded by a later switch, then no size write from the earlier trigger MUST be reapplied after the switch — including a size that came from the mutation-resize path. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.9` Given a reopen after the pointer passed over a top-level link, then the popup width MUST be seeded from the exiting panel before settling on the reopening panel's width. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.10` Given the window is resized while a panel is open, then the positioner MUST take the new measurement instantly (marked as an instant change for one frame) rather than animating to it. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.11` Given a kept panel whose `hidden` attribute is changed directly rather than through a framework update, then the positioner size MUST still follow it. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.12` Given a trigger with no panel between two triggers that have one, then moving the pointer across it and back MUST leave the positioner sized to the panel that is actually open. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.13` Given a horizontal navigation menu, then switching triggers by hover MUST move the positioner along the axis to the newly active trigger. [base-ui] (candidate)
- [ ] `navigation-menu.positioning.14` Given a no-viewport mode, then the panel MUST render inside its own item element and no viewport element MUST exist; the same MUST hold for a sub panel with sub viewports turned off. [bits] (candidate)

### Animation and presence

- [ ] `navigation-menu.animation.1` Given a panel opening and closing, then it MUST carry a starting-style hook while opening and an ending-style hook while closing, with or without a viewport; the viewport and indicator MUST carry them too. [bits] (candidate)
- [ ] `navigation-menu.animation.2` Given a kept-mounted portal, then the popup and its arrow MUST have transitions suppressed while the portal opens and MUST regain them once it has. [base-ui] (candidate)
- [ ] `navigation-menu.animation.3` Given a menu that mounts already open from a default value, then the positioner MUST be marked instant for the first frame so it does not animate in from the unpositioned portal state. [base-ui] (candidate)
- [ ] `navigation-menu.animation.4` Given a controlled value closing externally while an animation runs, then the exiting panel MUST keep its measured size for the exit and MUST drop its activation-direction attribute; this holds with a kept-mounted portal too. [base-ui] (candidate)
- [ ] `navigation-menu.animation.5` Given a close after a content switch, then the short exit path MUST be taken: the open-change-complete callback fires exactly once with `false` and the close completes well inside the full transition budget. (browser-only) [base-ui] (candidate)
- [ ] `navigation-menu.animation.6` Given panels with content kept mounted, then the active panel MUST be moved into the popup's viewport and MUST stay there when switching triggers, with every kept panel remaining mounted inside the viewport; when the menu closes with a kept portal the panel MUST gain `hidden` and stay in the viewport rather than returning to the list. [base-ui] (candidate)
- [ ] `navigation-menu.animation.7` Given content without keep-mounted, then it MUST NOT exist in the DOM while the menu is closed. [base-ui] (candidate)

### RTL and i18n

- [ ] `navigation-menu.rtl.1` Given a right-to-left vertical navigation menu, then the mirrored arrow key (ArrowLeft) MUST open a focused trigger's panel. [base-ui] (candidate)

### SSR and hydration

- [ ] `navigation-menu.ssr.1` Given content marked keep-mounted, then exactly one content element MUST be present in the server-rendered HTML and, after hydration, exactly one MUST exist carrying `hidden`. [base-ui] (candidate)
- [ ] `navigation-menu.ssr.2` Given content without keep-mounted, then zero content elements MUST be present in the server-rendered HTML and none MUST exist after hydration while the menu is closed. [base-ui] (candidate)

### Accessibility tooling

- [ ] `navigation-menu.a11y-tooling.1` Given a navigation menu closed and with a panel open, when axe runs over the container, then there MUST be no violations. [zag, reka]

### Notes and edge cases

- [ ] `navigation-menu.notes.1` Given a navigation menu part rendered without its required ancestor, then it MUST throw a descriptive error naming the missing part (root for the list, portal for the positioner, item for the icon, positioner for the arrow). [base-ui] (candidate)
- [ ] `navigation-menu.notes.2` Given every navigation menu part, then it MUST forward unconsumed props and refs to the element it renders, merge class names and inline styles, support a render/`asChild` escape hatch preserving the part's state attributes, and compose the author's handlers with its own; the list renders a `ul`, the item an `li`, and the link an `a` exposing native anchor props. [radix, base-ui]
- [ ] `navigation-menu.notes.3` Given a re-rendered root or viewport content, then its composed ref identity MUST stay stable so the ref is not detached and reattached on every render. [radix] (candidate)
- [ ] `navigation-menu.notes.4` Given a development build, then each context MUST carry a display name and MUST NOT in production. [base-ui] (candidate)
- [ ] `navigation-menu.notes.5` Given the indicator, then it portals into the list's track and mounts only after measuring the active trigger, so tests must wait for it. [radix] (candidate)
- [ ] `navigation-menu.notes.6` Given an inline nested branch, then it MUST stay open while the pointer crosses the gap between the nested trigger and its popup — asserted end to end in a real browser, not only through mocked rects. [base-ui] (candidate)
- [ ] `navigation-menu.notes.7` Given Safari/WebKit, then the hover traversal lock MUST stay scoped to the list (top level) and to the submenu list (nested) with `document.body` left untouched. (webkit-only) [base-ui] (candidate)
- [ ] `navigation-menu.notes.8` Given a hover-delay debounce in tests, then it should be mocked through synchronously for most assertions, with the real debounce plus fake timers restored for the trigger-switch and content-leave cases. [reka] (candidate)
- [ ] `navigation-menu.notes.9` Given Base UI's viewport `asChild`/conformance coverage, then the viewport prop-forwarding contract and the content conformance suite are unasserted gaps (a `todo` in Radix, a skipped suite in Base UI). [radix, base-ui]

## Sources

- `docs/research/radix-and-base-ui.md` — `## navigation-menu` → tags `radix`, `base-ui`. Base UI carries by far the largest share.
- `docs/research/reka-melt-bits.md` — `## navigation-menu` → tags `reka`, `bits`. Melt ships no navigation menu.
- `docs/research/zag-and-ark.md` — `## navigation-menu` (Zag e2e spec plus the connect source) → tag `zag`.

## Deferred

- APG has no navigation-menu pattern, axe has no navigation-menu rule, and React Aria, Headless UI, Kobalte, Corvu, Ariakit and Melt ship no such component, so this file has no normative `[apg]` bullet at all and no `axe` or `html` tags. Every bullet is library-derived; the multi-library ones are the strongest signal available. Ark ships no navigation-menu tests either, so `zag` bullets stand alone for that pair.
- Base UI's popup auto-sizing machinery (`navigation-menu.positioning.3`–`navigation-menu.positioning.13`) is a large, tightly specified subsystem driven by measured rects, mocked animations and a MutationObserver. Recorded in full because the interruption cases are the hard part, but scheduled after the basic open/close contract lands.
- The inline-nested-viewport family (nested roots each with their own inline viewport, tab-flow boundaries, falsy nested values) is Base UI-only and deep; kept as candidates until we decide whether our controller supports nesting at all.
- Prop-spreading, `asChild`/`render` and `describeConformance` assertions (`navigation-menu.notes.2`) are adapter surface covered by the harness rather than per-bullet tests.
- No source tests a `Forms` concern for this component, so that subsection is absent.
- Unresolved: whether opening a panel from the keyboard moves focus into it (`navigation-menu.keyboard.3` vs `navigation-menu.keyboard.4`).
