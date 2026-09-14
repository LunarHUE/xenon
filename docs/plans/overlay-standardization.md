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
Existing Content naming remains the working convention pending the user's choice.

## References

- [Base UI Popover](https://base-ui.com/react/components/popover#viewport): optional
  content-transition viewport for multiple triggers sharing a popup, plus handles.
- [Base UI Alert Dialog](https://base-ui.com/react/components/alert-dialog#viewport):
  positioning/scrolling viewport and detached trigger handles.
- [Base UI Menu](https://base-ui.com/react/components/menu#viewport): shared-popup
  content transitions, distinct from submenu ownership.

Base UI's Select does not currently expose a Viewport part. A Tenon selection
viewport would be our own consistent list-scrolling API, not a copied Base UI part.
