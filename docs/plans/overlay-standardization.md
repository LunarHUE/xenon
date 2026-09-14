# Overlay standardization

Unify Dialog, AlertDialog, Drawer, Popover, Menu, Select, and Combobox around
explicit Portal and Viewport parts. Preserve native top-layer hosting and keep
each component in its own public module. Tooltip remains a separate API discussion.

## Responsibilities

- Root owns logical state and active trigger/payload.
- A typed `createHandle<Payload>()` connects detached triggers to one mounted
  root. Commands before attachment or after disposal are ignored. Controlled
  state remains authoritative; a handle requests changes rather than bypassing it.
- Portal chooses the DOM destination and preserves Solid context. Nested
  overlays must retain native modal ancestry and logical layer relationships.
- Floating Positioner owns placement and native manual-popover presentation.
- Dialog Viewport owns the native dialog host, layout, and scrolling. Its inner
  content owns the visible panel, focus targets, and outside-hit boundary.
- Floating Viewport owns content transitions for a shared popup changing trigger.
  Old content must become inert and leave accessibility/navigation registries;
  stale animation completions must not remove current content.

These viewports share lifecycle conventions but have different DOM roles.
Transitions are between trigger-specific views of one shared popup, rather than
an implicit animation relationship between independent roots.

## Implementation slices

1. Typed handle attachment and lifecycle, with unit tests and TSDoc.
2. Portal hosting and native dialog viewport/content separation, including drawer
   drag geometry and nested-modal tests.
3. Popover and Menu detached/multiple triggers with shared handles and payloads.
4. Floating viewport transition lifetime and size/position animation hooks.
5. Consistent Portal/Viewport exports for selection overlays, consumer migration,
   and native Chromium/WebKit coverage.

Keep focus return, outside dismissal, scroll locking, author cancellation, SSR,
and tree-shaking checks in scope. Commit working slices with their documentation.
The user confirmed Content naming; no Popup rename is planned.

## References

- [Base UI Popover](https://base-ui.com/react/components/popover#viewport): optional
  content-transition viewport for multiple triggers sharing a popup, plus handles.
- [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog#viewport):
  positioning/scrolling viewport and detached trigger handles.
- [Base UI Menu](https://base-ui.com/react/components/menu#viewport): shared-popup
  content transitions, distinct from submenu ownership.

Base UI's Select does not currently expose a Viewport part. A Tenon selection
viewport is our own consistent list-scrolling API.

## Delivered API

`Content` remains the visible panel name throughout. Dialog, AlertDialog, and
Drawer share this anatomy:

```tsx
<Dialog.Portal>
  <Dialog.Viewport>
    <Dialog.Content>...</Dialog.Content>
  </Dialog.Viewport>
</Dialog.Portal>
```

The Viewport is the native dialog host and owns its accessible role/name. Content
is the inner panel used for focus, outside-hit testing, and drawer drag geometry.
Existing standalone Content remains supported as a native dialog. Content refs
use `HTMLElement` to cover both forms.

Popover and Menu use the anchored anatomy:

```tsx
<Popover.Portal>
  <Popover.Positioner>
    <Popover.Content>
      <Popover.Viewport>...</Popover.Viewport>
    </Popover.Content>
  </Popover.Positioner>
</Popover.Portal>
```

Dialog, AlertDialog, Drawer, Popover, and Menu expose `createHandle<Payload>()`.
Detached triggers receive `handle` and `payload`; the root receives the same
handle. A root child callback exposes reactive `open`, `triggerId`, and `payload`
getters. Handle commands are `open(triggerId?)`, `openWithPayload(payload)`, and
`close()`, with reactive `isOpen`. Each handle can attach to one root at a time.
Anchored overlays need a mounted trigger before imperative opening can position
content. Mounting and commands issued without an attached root do not replay an
open request later.

A floating Viewport retains an inert DOM snapshot of outgoing content, rather
than a second live component tree. It removes duplicate IDs and form participation
from that snapshot. Current and previous wrappers expose `data-current` and
`data-previous`; `data-transitioning` and `data-activation-direction` describe a
switch. Size hooks include `--viewport-width`, `--viewport-height`, `--popup-width`,
and `--popup-height`. Measurements use untransformed layout dimensions. Consumer
CSS opts into width/height and position transitions; the example app demonstrates
these with Reading note and Workshop note sharing one popover. Keep the current
wrapper intrinsically sized while animating its enclosing viewport. Finite Web
Animations determine snapshot lifetime, with immediate cleanup when unavailable.

Every registered trigger belongs to the shared popup's layer, so switching to an
inactive trigger does not schedule outside dismissal. Menu waits for positioning
visibility before moving focus into replacement content. Portaled submenus retain
an explicit logical parent layer.

Select and Combobox also expose Portal and Viewport. Their Viewport is an optional
list wrapper for scrolling, without trigger-switch snapshots or detached handles.
Their form-owning root remains outside Portal.

Portal defaults to the document body, except within a native modal where it
inherits the inner Content mount. This keeps nested nonmodal overlays inside the
native modal's interactive subtree. An explicit `container` overrides that mount.
Solid Portal emits no server HTML; its children mount on the client. Existing
nonportaled SSR content remains supported, including default-open Menu trigger
associations.

## Verification

- Root unit and jsdom tests, typecheck, lint, and formatting pass.
- Public subpath builds pass; importing Button excludes unrelated components.
- Chromium and WebKit browser conformance: 1,818 tests across 196 files.
- Chromium and WebKit end-to-end: 80 tests pass, including SSR/hydration and
  shared-popup transitions.
- Public TSDoc member audit: core 635, DOM 144, Solid 900, with no missing comments.
  Local TSDoc links resolve across all three packages.
