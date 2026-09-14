# Hover card coverage

HoverCard uses the shared Popover registration, presence, positioning, native hosting,
portal, and viewport implementation. Its own adapter supplies native anchor triggers
and the DOM hover-intent controller. The pure `hoverCard` core computes state and
attributes without DOM access or timers.

## Decisions

- Default open delay is 600ms for hover and keyboard focus. Default close delay is
  300ms. This adopts `pointer.6`, `pointer.7`, and `focus.4`; the 700ms/500ms and
  disclosure-only alternatives in `pointer.5`, `pointer.8`, and `focus.5` are not adopted.
- Trigger hosts default to anchors. `href`, Enter, modified clicks, and normal
  browser navigation are untouched. There is no synthetic button activation.
- Content is a nonmodal dialog with `tabindex=-1`; authors supply its name through
  Title or `aria-label`. Active triggers use `aria-haspopup`, `aria-expanded`,
  `aria-controls`, `data-current`, and `data-state`.
- Neither hover nor focus opening moves focus. Escape restores the active trigger
  only when focus was inside Content; restored focus does not reopen the card.
- Pointer and focus intent independently retain the card. A measured convex travel
  corridor permits crossing the trigger/content gap. The corridor expires after
  300ms without movement, then the configured close delay applies. Movement outside
  the corridor starts that close delay immediately. Exact upstream polygon vertex
  values and malformed caller-supplied polygons are not public contracts.
- Touch hover and touch-induced focus do not open the card. Touch toggle, long press,
  touch hints, and hidden disclosure/dismiss controls are not provided.
- A shared typed handle selects payload and anchor immediately when switching an open
  card. The root retains control of visibility. Root render-state getters feed Viewport.
- Portal is explicit. Omitting Portal leaves content inline; its default destination
  is the body or the nearest native modal ancestor. `container` selects another mount.
- Author event handlers run first and can prevent trigger intent. `onOpenChange`
  reports a boolean request; it has no cancelable details or previous-value argument.
  Controlled `open` remains the way to reject a request.
- Root `disabled` cancels pending intent. Trigger-specific native `disabled`
  attributes are respected by the shared helper, but anchors retain native link semantics.

## Direct checks

`packages/core/src/hover-card/hover-card.test.ts` checks closed associations, native
link attributes, current-trigger state, nonmodal content, exit retention, and forced
mounting. These cover `roles.1`, `roles.4`, `roles.6`, `roles.7`, and the pure presence
portion of `animation.3`.

`packages/solid/src/hover-card/hover-card.test.tsx` checks the 600ms default, canceled
short hovers, author cancellation, no touch-hover opening, delayed keyboard focus and
blur cancellation, exact content ID association, controlled visibility, disabled
pending-intent cancellation, and detached typed payload switching. These exercise
`roles.3`, `pointer.1`, `pointer.4`, `pointer.6`, `pointer.9`, `focus.4`, `focus.8`,
`state.3`, `state.4`, and the hover/payload portion of `notes.2`.

`packages/suite/src/hover-card/hover-card.test-browser.tsx` runs in Chromium and WebKit.
It checks native manual-popover hosting, delayed focus opening, no autofocus, retained
content focus, Escape with and without content focus, measured gap travel and return,
detached payload reanchoring without content replacement, modal-ancestor portal
interactivity, and axe in closed/open states. These exercise `pointer.3`, `pointer.11`,
`pointer.12`, `focus.3`, `dismissal.1`, `dismissal.2`, `dismissal.10`, `positioning.1`,
`a11y.1`, and `a11y.2`. The safe-gap test uses actual browser rectangles and dispatched
coordinates between them; opening and entering content use native pointer input.

## Shared implementation and remaining checks

Popover and DOM layer tests cover ordinary outside dismissal, Escape vetoes, controlled
and default visibility, force mounting, exit animation lifetime, positioner geometry,
arrow placement, viewport snapshots, and portal destinations. HoverCard reuses those
implementations; this ledger does not count every shared test as a direct HoverCard
spec assertion. Dedicated HoverCard tests remain for `focus.1`, `focus.2`, `focus.10`,
`focus.11`, `state.1`, `state.2`, `state.5`, `state.8`, `state.9`, `dismissal.3` through
`dismissal.5`, full retained-portal `positioning.1`, and animation interruption.

The following candidate behavior is not claimed:

- Disclosure-button keyboard flows, hidden dismiss buttons, and portal-aware Tab
  order restoration: `keyboard.1`, `keyboard.2`, `focus.6`, `focus.7`, `focus.9`,
  `dismissal.9`.
- Focus-only `aria-describedby`: `roles.5`. Dialog expansion/controls are used instead.
- Touch opt-in, long press, and touch modality hints: `pointer.19` through `pointer.21`.
- Special opening-source immunity after default/controlled opening: `pointer.25`.
- Multiline client-rect anchoring: `positioning.3`, `positioning.4`.
- Cancelable change-details callbacks and the exact canceled-unmount behavior:
  `state.6`, `state.7`. Active trigger removal requests close; underlying registration
  currently selects the next trigger as its fallback, so no-fallback semantics differ.
- Mouse-only reentry without a new pointerenter: `dismissal.7`.
- Automatic immediate reentry throughout an exit animation: `animation.5`.
- Backdrop rendering: `dismissal.11`; no HoverCard backdrop is provided.

The shared floating fixture and `packages/suite/e2e/floating.spec.ts` check closed
server rendering, preserved element identity and IDs through hydration, and hydrated
HoverCard focus opening, content association, Escape closure, and focus return in
Chromium and WebKit.

Nested hover-card pointer retention and dismissal, shadow-root pointer behavior,
scroll-wheel persistence, direct text selection, and all exact upstream polygon edge
cases need dedicated checks. In particular, `pointer.24`,
`pointer.26` through `pointer.28`, and `dismissal.6`, `dismissal.8` are not marked
covered merely because the underlying layers support nested overlays.
