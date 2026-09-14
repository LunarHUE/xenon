## hover-card

### Roles and attributes

- [ ] `hover-card.roles.1` Given a trigger, when the card opens and then closes, then the trigger's open state is reflected in a data attribute, `data-state="open"` or `"closed"` in radix and zag and `data-popup-open` present only while open in base-ui. [radix, base-ui, zag]
- [ ] `hover-card.roles.2` Given an open card, when it is rendered, then its content carries `data-state="open"` and the resolved side as `data-side`, with zag adding `data-placement` for the full placement. [radix, zag]
- [ ] `hover-card.roles.3` Given a trigger with no element override, when it renders, then it is an anchor element, so the trigger under test is a link rather than a button. [react-aria, base-ui, reka]
- [ ] `hover-card.roles.4` Given a closed card, when the trigger is inspected, then it has `aria-haspopup="dialog"`, `aria-expanded="false"` and no `aria-controls`, and when the card opens `aria-expanded` becomes `"true"` and `aria-controls` points at the card's id. (candidate) [react-aria]
- [ ] `hover-card.roles.5` Given a card opened by keyboard focus, when the card appears, then the trigger's `aria-describedby` contains the card's id. (candidate) [react-aria]
- [ ] `hover-card.roles.6` Given a closed card, when the content element is inspected, then it is `hidden`, and when open it has `tabindex="-1"` so the content container itself is never a tab stop. (candidate) [zag]
- [ ] `hover-card.roles.7` Given several triggers sharing one card, when one of them is hovered, then only that trigger carries `data-current`. (candidate) [zag]
- [ ] `hover-card.roles.8` Given explicit ids passed to the component, when it renders, then the trigger's id is the supplied trigger id and the content's id is the supplied content id. (candidate) [melt]

### Keyboard

- [ ] `hover-card.keyboard.1` Given a visually hidden disclosure button beside the trigger, when Tab reaches the trigger, then the disclosure becomes visible (no longer `height: 1px`) and a second Tab focuses it, Tab past it collapses it back to `height: 1px`, Shift+Tab into the region reveals it again, and focusing the trigger by mouse click leaves it hidden. (candidate) [ariakit]
- [ ] `hover-card.keyboard.2` Given the disclosure button, when it is activated by click, Enter or Space, then the card opens and its first link takes focus, and Shift+Tab back to the disclosure plus a second activation closes the card and returns focus to the disclosure. (candidate) [ariakit]

### Pointer

- [ ] `hover-card.pointer.1` Given a closed card, when the pointer hovers the trigger, then the card is still absent immediately and appears only once the open delay elapses. [radix, base-ui, zag, ark, ariakit, reka, melt, bits]
- [ ] `hover-card.pointer.2` Given a card opened by hover, when the pointer moves off both trigger and card onto an outside element, then the card closes once the close delay elapses. [radix, base-ui, zag, ark, melt, bits]
- [ ] `hover-card.pointer.3` Given an open card with a gap between trigger and card, when the pointer crosses that gap, then the card stays open, and it also stays open while the pointer rests on the card or on a control inside it. [react-aria, zag, ariakit, reka, bits]
- [ ] `hover-card.pointer.4` Given several triggers sharing one card and one of them already active, when the pointer moves onto another trigger, then the card stays open and switches to that trigger's content immediately, ignoring that trigger's own open delay (base-ui switches from a 0ms trigger to a 2000ms one with no wait). [base-ui, zag]
- [ ] `hover-card.pointer.5` Divergence: Given a card with no delay props set, when the pointer hovers the trigger and stays there, then the card opens 700ms later. (decision needed) [radix]
- [ ] `hover-card.pointer.6` Divergence: Given a card with no delay props set, when the pointer hovers the trigger and stays there, then the card opens 600ms later. (decision needed) [base-ui]
- [ ] `hover-card.pointer.7` Divergence: Given a card with no delay props set that was opened by hover, when the pointer leaves the trigger, then the card closes 300ms later. (decision needed) [radix, base-ui]
- [ ] `hover-card.pointer.8` Divergence: Given a card with no delay props set that was opened by hover, when the pointer leaves the trigger, then the card closes 500ms later, the same 500ms zag uses to close after the trigger is blurred. (decision needed) [zag, ariakit]
- [ ] `hover-card.pointer.9` Given an open delay of 700ms and a close delay of 300ms, when the pointer enters the trigger, leaves after 300ms, and a further 1000ms passes, then the card never mounts and the trigger stays `data-state="closed"`. (candidate) [radix]
- [ ] `hover-card.pointer.10` Given three sibling cards with 700ms open delays, when the pointer enters and leaves each trigger with only 200ms on each and 1000ms then passes, then none of the three cards is in the document, so sweeping across a list leaves nothing lingering open. (candidate) [radix]
- [ ] `hover-card.pointer.11` Given the pointer resting on an open card, when it moves back onto the trigger, then the card stays open. (candidate) [zag]
- [ ] `hover-card.pointer.12` Given an open card, when the pointer leaves for 100ms and returns to the trigger, then the pending close is cancelled and the card stays open past the hide timeout. (candidate) [ariakit]
- [ ] `hover-card.pointer.13` Given a 100x100 trigger at the origin and a card occupying x 200 to 300, when a `pointerleave` exits the trigger's right edge at (100, 50), then a grace polygon is built as the convex hull of two padded exit points near (99, 49) and (99, 51) plus the card's corners, spanning x 99 to 300, and the pointer is marked in transit. (candidate) [reka]
- [ ] `hover-card.pointer.14` Given the pointer in transit inside that grace polygon, when a document `pointermove` lands at (150, 50) inside the hull, then the card stays open, and when a `pointermove` lands at (150, 500) outside the hull, then the card's exit callback fires exactly once and the in-transit flag clears. (candidate) [reka]
- [ ] `hover-card.pointer.15` Given the pointer in transit, when a `pointermove` is dispatched on the card element itself at coordinates outside the hull, then the grace area is discarded without closing the card, so arriving at the card wins over the geometry check. (candidate) [reka]
- [ ] `hover-card.pointer.16` Given the pointer in transit, when 300ms pass with no pointer movement, then the in-transit flag resets on its own, and unmounting the component also resets it. (candidate) [reka]
- [ ] `hover-card.pointer.17` Given the safe polygon between trigger and card, when a point is tested against it, then points inside or exactly on an edge count as inside while points level with an edge but beyond it do not, a horizontal ray grazing a slanted apex is not counted as a crossing (checked for upward, leftward and downward apexes), and a malformed polygon with a missing vertex reports every point outside rather than throwing. (candidate) [ariakit]
- [ ] `hover-card.pointer.18` Given a card with no touch support enabled, when a `pointerup` with `pointerType: "touch"` is dispatched on the trigger, then the trigger is still `data-state="closed"` 100ms later. (candidate) [reka]
- [ ] `hover-card.pointer.19` Given a card with touch enabled, when a touch `pointerup` hits the trigger, then the card opens and a second touch `pointerup` closes it, a `pointerup` with `pointerType: "mouse"` is ignored by that path, and a touch tap that closes the card also cancels a pending focus open so the card is still closed 150ms later. (candidate) [reka]
- [ ] `hover-card.pointer.20` Given a touch `pointerdown` on the trigger, when it is held past the 500ms long-press threshold, then the card opens, gets `tabindex="-1"` and takes focus itself so touch screen readers move into it. (candidate) [react-aria]
- [ ] `hover-card.pointer.21` Given a touch-capable window, when the modality is keyboard, then no long-press hint is described by the trigger, and after a touch `pointerdown` plus `mousedown` switch the modality to pointer, then the hint text appears and the trigger's `aria-describedby` includes its id. (candidate) [react-aria]
- [ ] `hover-card.pointer.22` Given a disabled trigger, when it is hovered, then no card appears. (candidate) [react-aria]
- [ ] `hover-card.pointer.23` Given an open card, when the mouse wheel scrolls 300px, then the card is still open 300ms later, and moving the pointer away still closes it. Chromium and Firefox only. (browser-only) (candidate) [ariakit]
- [ ] `hover-card.pointer.24` Given a trigger or card content inside a shadow root, when the pointer moves around within the shadow trigger, then the card counts a single opening and leaving and re-entering counts a second, and when the pointer rests on a widget inside a shadow root within the card for 600ms, then the card is still visible past the 500ms hide timeout. (browser-only) (candidate) [ariakit]
- [ ] `hover-card.pointer.25` Given a card opened by something other than trigger hover, a controlled open or a default open, when the pointer enters and then leaves the card and the close delay passes, then the card stays open, while a card opened by trigger hover closes in the same situation. (candidate) [base-ui]
- [ ] `hover-card.pointer.26` Given an open card whose content holds a nested card's trigger, when that nested trigger is hovered, then the parent card stays in the document. (candidate) [base-ui]
- [ ] `hover-card.pointer.27` Given a parent card with a nested card open inside it, when the pointer leaves both onto the document body and re-enters the parent after only 150ms of the 300ms close delay, then the parent stays open while the child closes, hovering the child trigger again for 600ms reopens the child, and moving from the child trigger into the child card keeps both open across another 300ms. (candidate) [base-ui]
- [ ] `hover-card.pointer.28` Given a parent card opened by hover whose nested card was then opened by hover, when the pointer leaves the child card onto the document body, then both the child and the parent are removed together 310ms later. (candidate) [base-ui]

### Focus management

- [ ] `hover-card.focus.1` Given a card opened by focusing the trigger, when the trigger is blurred, including by Tab moving focus away, then the card closes after the close delay. [base-ui, zag, bits]
- [ ] `hover-card.focus.2` Given several triggers sharing one card and one already active, when focus moves to another trigger, then the card stays open and switches to that trigger's content immediately, ignoring that trigger's own open delay. [base-ui, zag]
- [ ] `hover-card.focus.3` Given an open card with focus inside it, when the pointer moves outside and the close delay passes, then the card stays open and the focused element inside it keeps focus. [react-aria, ariakit]
- [ ] `hover-card.focus.4` Divergence: Given a closed card, when the trigger receives focus, then the card opens on its own once the open delay elapses. (decision needed) [react-aria, base-ui, zag, reka, bits]
- [ ] `hover-card.focus.5` Divergence: Given a closed card, when the trigger receives focus, then the card never opens, because the keyboard path in is a visually hidden disclosure button beside the trigger, and hovering the trigger after using that disclosure shows the card without pulling focus into it. (decision needed) [ariakit]
- [ ] `hover-card.focus.6` Given an open card, when Tab is pressed from the trigger, then focus moves into the first focusable element inside the card. (candidate) [react-aria]
- [ ] `hover-card.focus.7` Given focus on the last focusable element inside an open card, when Tab is pressed, then focus moves to the element after the trigger in document order rather than to the end of the portal. (candidate) [react-aria]
- [ ] `hover-card.focus.8` Given an open delay of 300ms, when the trigger receives keyboard focus, then the card is not open yet and appears only after 300ms, unlike a tooltip which opens on focus at once, and if focus moves on after only 150ms the card never opens. (candidate) [react-aria]
- [ ] `hover-card.focus.9` Given an open card with focus inside it under keyboard modality, when its hidden dismiss button is clicked, then the card closes, focus returns to the trigger, and the card does not reopen from that restored focus. (candidate) [react-aria]
- [ ] `hover-card.focus.10` Given a card opened by the pointer and then also focused, when the trigger is blurred, then the card stays open and only moving the pointer elsewhere closes it, so pointer intent outranks focus intent. (candidate) [zag]
- [ ] `hover-card.focus.11` Given a card closed by Escape, when another trigger sharing the same card is focused, then the card opens again. (candidate) [base-ui]

### State

- [ ] `hover-card.state.1` Given a card marked open by default, when it mounts, then the content is already in the document and the card is still uncontrolled, so leaving the trigger closes it as usual. [base-ui, ark]
- [ ] `hover-card.state.2` Given a controlled open card, when it first renders, then the content is already in the document. [react-aria, base-ui]
- [ ] `hover-card.state.3` Given an open change handler, when the card opens by hover, then the handler fires exactly once, and it does not fire when the state does not actually change. Base UI also passes the previous open value. [base-ui, ark]
- [ ] `hover-card.state.4` Given a card with no open state set, when the page loads, then the content is not visible. (candidate) [zag]
- [ ] `hover-card.state.5` Given a card that is both open by default and controlled, when it mounts, then the controlled value wins in both directions, staying closed for a controlled `false` and open for a controlled `true`. (candidate) [base-ui]
- [ ] `hover-card.state.6` Given an uncontrolled card whose open change handler cancels the change, when the trigger is hovered, then the content never appears. (candidate) [base-ui]
- [ ] `hover-card.state.7` Given an open card driven by one of several triggers, when the active trigger unmounts, then the card closes and no other trigger becomes active, and if that close is cancelled the card stays open still showing the old trigger's content. (candidate) [base-ui]
- [ ] `hover-card.state.8` Given a two way bound open value, when Escape closes the card, then the binding reads false and the content unmounts, and setting the binding back to true remounts the content. (candidate) [bits]
- [ ] `hover-card.state.9` Given a force mounted card closed by moving the pointer outside, when the trigger is hovered again, then the card opens again. (candidate) [bits]

### Dismissal and layering

- [ ] `hover-card.dismissal.1` Given an open card, when Escape is pressed, then it closes. [react-aria, base-ui, zag, ariakit, melt, bits]
- [ ] `hover-card.dismissal.2` Given an open card with focus inside it, when Escape is pressed, then the card is removed and focus returns to the trigger link, and when the card is open but unfocused Escape closes it without moving focus at all. [react-aria, ariakit]
- [ ] `hover-card.dismissal.3` Given a card configured to ignore Escape, when Escape is pressed after it opens, then the content stays. [melt, bits]
- [ ] `hover-card.dismissal.4` Given an open card, when an element outside both the trigger and the card is pressed, then the card closes. [melt, bits]
- [ ] `hover-card.dismissal.5` Given a card configured to ignore interaction outside, when the card is clicked and then an outside element is clicked, then the content stays. (candidate) [bits]
- [ ] `hover-card.dismissal.6` Given a parent card with a nested card open inside it, when a press starts inside the nested card and the following click lands on an element outside both, then neither card closes, which is what keeps a text selection dragged out of the card from dismissing it. (candidate) [base-ui]
- [ ] `hover-card.dismissal.7` Given a card closed by Escape, when the trigger gets a fresh `mouseenter` plus `mousemove` with no new `pointerenter`, then the card reopens once the open delay elapses. (candidate) [base-ui]
- [ ] `hover-card.dismissal.8` Given a nested card open inside a parent card and focus outside both, when Escape is pressed, then only the nested card closes and the parent stays open. (candidate) [ariakit]
- [ ] `hover-card.dismissal.9` Given a card opened through the keyboard disclosure button, when Escape is pressed, then focus returns to the trigger link rather than to the disclosure. (candidate) [ariakit]
- [ ] `hover-card.dismissal.10` Given a card opened by keyboard focus, when the layer is inspected, then no underlay element exists, so the card is non-modal. (candidate) [react-aria]
- [ ] `hover-card.dismissal.11` Given a card that renders a backdrop, when the card is open, then the backdrop's inline `pointer-events` is `none`, so it never swallows page interaction. (candidate) [base-ui]

### Positioning

- [ ] `hover-card.positioning.1` Given several triggers sharing one card, when the active trigger changes, then the card re-anchors to the new trigger, matching its left edge within 1px in base-ui and shifting its x coordinate in zag, and it re-anchors the same way when the portal is kept mounted across the close. [base-ui, zag]
- [ ] `hover-card.positioning.2` Given a card with default portal settings, when it opens, then its content is portalled into `document.body`, and it goes into a named container instead when one is given or stays inline when portalling is disabled. (candidate) [bits]
- [ ] `hover-card.positioning.3` Given an inline trigger whose text wraps into several client rects, when the pointer opens the card over one of those lines, then the card anchors to that line's rect rather than to the trigger's bounding box, stays anchored to it while the card remains open and across page scroll, and re-anchors to a newly entered line if the pointer arrives during the close transition. (browser-only) (candidate) [base-ui]
- [ ] `hover-card.positioning.4` Given the same inline multiline trigger, when the card is opened by focus or by a controlled open with no hover coordinates, then it anchors to the client rect chosen by the side, the first rect for side top and the last for side bottom, and any hovered-line coordinates left over from an earlier hover are discarded. (browser-only) (candidate) [base-ui]

### Animation and presence

- [ ] `hover-card.animation.1` Given a card kept mounted while closed, when the trigger is hovered, then the content gains a starting-style attribute, and when the pointer then moves outside, then it gains an ending-style attribute. [base-ui, bits]
- [ ] `hover-card.animation.2` Given a lazily mounted card, when the page loads, then the card is absent until the first hover, and with unmount on exit it mounts on hover and unmounts again on unhover. (candidate) [ark]
- [ ] `hover-card.animation.3` Given a force mounted card, when it is closed, then the content element still exists in the document, and gating rendering on the open state keeps it absent until the trigger is hovered. (candidate) [bits]
- [ ] `hover-card.animation.4` Given a card with an exit animation, when it closes, then it stays mounted until the animation finishes and only then unmounts, and its completion callback fires with false at that point and with true once the enter animation finishes. (browser-only) (candidate) [base-ui]
- [ ] `hover-card.animation.5` Given a card mid close transition with an ending-style attribute, when the same trigger or another trigger is hovered, then the card reopens immediately and ignores the 600ms open delay, and once the close lifecycle has finished a later hover honors the full delay again. (browser-only) (candidate) [base-ui]

### Accessibility tooling

- [ ] `hover-card.a11y.1` Given a closed card, when axe runs over the mounted tree, then no violations are reported. [zag, ark, reka, melt]
- [ ] `hover-card.a11y.2` Given a card opened by hovering the trigger past the open delay, when axe runs over the open content, then no violations are reported. [zag, reka]

### Notes and edge cases

- [ ] `hover-card.notes.1` Given the same component across libraries, when it is looked up by name, then it is a hover card in radix, zag, ark, ariakit and reka, a preview card driven by a preview trigger in react-aria and base-ui, and a link preview in melt and bits, and there is no APG pattern for it, so no bullet in this file is normative. [react-aria, radix, base-ui, zag, ark, ariakit, reka, melt, bits]
- [ ] `hover-card.notes.2` Given triggers that are not descendants of the card's root and are wired to it by a shared handle, when they are hovered, focused or activated, then every open, close, delay and content-switch behavior holds exactly as it does for a trigger nested inside the root, and the card renders content derived from the active trigger's payload. (candidate) [base-ui]
- [ ] `hover-card.notes.3` Given an open card listening for `focusout`, when an event arrives whose `relatedTarget` is an `EventTarget` that is not a `Node`, then no page error is thrown. (candidate) [ariakit]

## Sources

- `ariakit-and-headlessui.md`: `hover-card`
- `radix-and-base-ui.md`: `hover-card`
- `reka-melt-bits.md`: `hover-card`, `grace-area`
- `zag-and-ark.md`: `hover-card`
- `react-aria-a.md`: `preview-trigger`

## Deferred

- Text selection inside the card. No source tests selecting text in the card directly. The closest evidence is base-ui's press that starts inside a nested card and ends outside, recorded as `hover-card.dismissal.6`. Needs its own bullet once we have a real test.
- RTL and i18n. No source exercises the component in an RTL document. Base UI's logical `inline-start` and `inline-end` side handling is positioning behavior and belongs in `positioning.md`.
- SSR and hydration. Nothing in these sections covers server rendering. Base UI's client-root render outside `act` is a React commit-ordering check, not a hydration check.
- Raw positioning geometry left to `positioning.md`: `sideOffset` and `alignOffset` numbers and callbacks, collision flipping and the side and align values read back inside those callbacks, transform versus top/left positioning, collision boundary and padding, and arrow rendering and size.
- Library-internal API shape dropped as agreed: prop spreading and `asChild` forwarding on trigger, content and arrow, ref instance types, missing-ancestor error messages, exported anatomy part lists, type-only assertions, imperative `actionsRef` open and close, handle ownership warnings and the error for an unregistered trigger id, popup and positioner DOM node reuse across trigger switches, inline scale style after a switch, and the parent mousemove listener install count across nested mounts. The one real rule behind the detached-trigger and handle cluster is kept as `hover-card.notes.2`.
- Base UI's viewport morph internals, the `data-previous` inert container and the `data-activation-direction` token set computed from trigger geometry. These are a part specific to one library and read as geometry output rather than hover card behavior.
- Part marker attributes such as bits' `data-link-preview-<part>`, which are naming conventions rather than behavior.
- Base UI's assertion that a zero-delay hover makes the card visible synchronously inside the `mouseenter` handler rather than a tick later. Worth revisiting if we see flakiness around delay-zero opens.
- Unresolved: four divergence bullets need a decision. The default open delay is 700ms in radix and 600ms in base-ui (`hover-card.pointer.5` and `.6`). The default close delay is 300ms in radix and base-ui and 500ms in ariakit and zag (`hover-card.pointer.7` and `.8`). Focus on the trigger opens the card in react-aria, base-ui, zag, reka and bits, while ariakit refuses to open on focus and provides a visually hidden disclosure button instead (`hover-card.focus.4` and `.5`). Picking the ariakit side would also make `hover-card.keyboard.1` and `.2` normative for us rather than candidates.
- Melt's outside-press close test is skipped upstream, so `hover-card.dismissal.4` rests on bits for live coverage.
- Reka's grace-area tests stub both element rects in jsdom, so the polygon under test is supplied rather than measured. The geometry in `hover-card.pointer.13` through `.16` should be re-checked against real layout in a browser.
