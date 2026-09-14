# Context menu coverage

The public entry points are `@tenon/core/context-menu` and
`@tenon/solid/context-menu`. ContextMenu owns the opening region and pointer
geometry. Popup items, selection, submenu state, presence, portals, arrow geometry,
and native hosting reuse Menu. No additional positioning or dismissal dependency
is introduced.

## Decisions

- The trigger is a region, with a default `tabindex="0"`, no disclosure ARIA,
  and `data-state` / `data-disabled` hooks. Native context menus remain available
  when disabled or when an author cancels the opening handler.
- Right click publishes client coordinates through a virtual zero-size anchor.
  The real region remains the restoration target and the layer's inside branch.
  Keyboard ContextMenu and Shift+F10 open at the region's center.
- Touch hold uses 500ms, choosing `context-menu.pointer.23` over `.24`.
  Movement beyond 10px, release, cancellation, a second touch, scrolling, and
  disposal cancel pending work. Small movements retain the original point. A completed hold suppresses its
  release click, so lifting the finger does not immediately close the menu.
- Opening focuses the surface, with no item highlighted. ArrowDown/Home enter at
  the first item; ArrowUp/End enter at the last. Reopening resets descendants,
  updates geometry even at identical coordinates, and preserves root visibility.
- Escape closes the current layer and restores its opener. Tab closes the chain
  and allows browser navigation after focusing the root region. Native hosting
  uses the existing Menu layer policy, including dialog containment.
- Positioner, Content, Viewport, Portal, Arrow, items, groups, and submenu parts
  are available under ContextMenu. The `as` prop is the host customization API.

## Executable evidence

| Area | Coverage |
| --- | --- |
| Core | `packages/core/src/context-menu/context-menu.test.ts`: client-coordinate requests, ContextMenu and Shift+F10, region roles, disabled/canceled requests. |
| Adapter | `packages/solid/src/context-menu/context-menu.test.tsx`: author composition, disabled native behavior, keyboard mounting, 500ms boundary, movement/release/cancel/scroll cancellation. |
| Server | `packages/solid/src/context-menu/ssr.test.ts`: controlled-open custom ID associations and region focusability without disclosure ARIA. |
| Chromium and WebKit | `packages/suite/src/context-menu/context-menu.test-browser.tsx`: real secondary click, exact client placement, initial surface focus, keyboard entry, Escape restore, Shift+F10, native Tab exit, nested Escape, submenu reset on retrigger, and deduplicated root callbacks. |
| Shared Menu regression | Existing `packages/solid/src/menu/menu.test.tsx` and `handles.test.tsx`: item selection, controlled state, checkbox/radio state, typeahead, submenu behavior, identity and payload lifecycle. |

Direct assertions cover `context-menu.roles.1-.4`, `keyboard.1-.4`,
`pointer.1-.2`, `.4-.5`, `.7-.8`, `.10`, `.22-.23`, `.25-.26`,
`focus.1`, `state.1`, and `positioning.1`. Some rows contain additional
requirements beyond an individual assertion. This is not a claim that every
vendor-specific variation in those rows has been adopted.

## Shared behavior and remaining parity

Checkbox/radio/group/item behavior is the existing Menu implementation, including
disabled activation, cancelable selection, typeahead, RTL submenus, and
force-mounted presence. The new family does not duplicate that implementation or
claim a separate exhaustive test suite for every inherited spec row.

The following remain deferred rather than being silently treated as passing:

- macOS Ctrl+Enter fallback/deduplication and release-to-select gestures;
- delayed outside dismissal following a touch hold and vendor-specific 500ms
  mouse-release windows;
- configurable modal pointer blocking, autofocus cancellation hooks, and
  escape/outside-interaction policies beyond existing Menu hosting;
- collision-aware pointer grace polygons, rather than Menu's existing 200ms delay;
- dedicated current-trigger markers, payload-bearing context triggers, checkbox
  groups, and detached ContextMenu handle helpers;
- backdrop-level context suppression, vendor portal ownership conventions,
  initial-controlled-open warnings, viewport-specific collision rules, and
  extra platform-specific conformance fixtures.

These are library-specific parity candidates or extensions to shared Menu. Their
source spec checkboxes stay unchanged. Native pointer and keyboard behavior, plus server-node retention and hydrated
keyboard input, are verified in Chromium and WebKit; touch cancellation currently has adapter tests,
not a physical mobile-browser gesture test.
