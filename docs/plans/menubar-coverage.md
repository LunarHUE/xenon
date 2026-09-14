# Menubar coverage

The public entry points are `@tenon/core/menubar` and `@tenon/solid/menubar`.
Menubar renders the persistent container. Each `Menubar.Menu value="…"` supplies
one top-level menu using shared Menu state, hosting, items, and submenus.

## Decisions

- Root has `role="menubar"`. Authors supply `aria-label` or `aria-labelledby`.
  Top-level triggers have `role="menuitem"`, menu disclosure ARIA, and open-only
  `aria-controls`. Exactly one enabled top-level trigger is the roving tab stop.
- Top-level arrows skip disabled triggers and wrap by default, selecting
  `menubar.keyboard.5` over `.6`. `loop={false}` clamps instead. Horizontal
  navigation follows `dir`; Home and End select the enabled endpoints.
- ArrowDown opens at the first item and ArrowUp at the last. Left/right from an
  open top menu switch menus and focus the new menu's first item, selecting
  `menubar.keyboard.13` over `.12`.
- Escape closes one submenu level before its parent, selecting
  `menubar.keyboard.27` over `.28`. Tab closes the chain and preserves native
  next/previous navigation. Enter and Space toggle from the trigger.
- Hover never opens a closed bar. When another menu is already open, hover
  switches to the new surface without focusing its first item. Clicking opens
  at the surface; ArrowDown then enters the items.
- Root `value` and `defaultValue` select a top-level menu by identity; empty
  string means closed. `onValueChange` reports requests. Each Menu also has
  `onOpenChange`. Closing a menu during a top-level switch resets descendants.
- Positioner, Content, Portal, Viewport, Arrow, items, groups, and Sub parts reuse
  Menu. Selection and checkbox/radio defaults stay consistent across families.

## Executable evidence

| Area | Coverage |
| --- | --- |
| Core | `packages/core/src/menubar/menubar.test.ts`: roles, wrap, disabled skipping, RTL, first/last open requests, and uncanceled Tab. |
| Adapter | `packages/solid/src/menubar/menubar.test.tsx`: named menubar, roving tabs, focus without opening, disabled skip, closed-hover gate, click toggling, and one-open identity. |
| Server | `packages/solid/src/menubar/ssr.test.ts`: controlled-open custom ID associations and the initial enabled roving tab stop. |
| Chromium and WebKit | `packages/suite/src/menubar/menubar.test-browser.tsx`: native Tab entry/exit, arrows, both opening edges, switching open menus, focus restoration, RTL switching, and one-level nested Escape. |
| Shared Menu regression | Existing Menu adapter tests retain item selection, checked state, submenu navigation, typeahead, and controlled-state coverage. |

Direct assertions cover `menubar.roles.1-.2`, `.6-.9`, `keyboard.1-.5`,
`.9`, `.11`, `.13`, `.15`, `.18`, `.27`, `.33`, `pointer.1`, `.4`,
`state.1`, and `rtl.1-.2`. Not every variation within a source row has a dedicated
fixture. Source checkboxes are unchanged rather than implying exhaustive parity.

## Remaining parity

The following remain deferred or application-owned:

- vendor-specific non-composite/either-orientation modes and portal ownership
  sentinel markup;
- APG example-specific PageUp/PageDown aliases, navigation links that also open
  menus, expanded navigation modes, editable-text caret-edge switching, and
  focus transfer to newly loaded page headings;
- alternate Shift+Tab behavior that keeps menus open;
- entire-bar disabled propagation and special disabled-item policies beyond
  the shared Menu implementation;
- collision-aware hover grace polygons and vendor-specific delay controls;
- full vertical popup-axis switching. Vertical top-trigger navigation and the
  direction-aware opening key are supported; native fixtures currently cover
  horizontal menubars in LTR and RTL;
- modal/body pointer blocking, auto-focus cancellation, and custom
  escape/outside-interaction policy props beyond shared Menu hosting.

Author-supplied labels, structural list wrappers, and navigation destinations
remain author responsibilities. Checked-item Enter/Space behavior follows Menu's
existing selection defaults, not the APG editor example's alternate Enter-close
rule. Native tests ran in Chromium and WebKit.
