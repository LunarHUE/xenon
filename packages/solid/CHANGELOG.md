# Changelog

## Unreleased

No API or behavior changes. Needs new versions of two packages:
`@xenon-ui/dom` 0.2.6 and `@xenon-ui/solid` 0.2.8, with this package depending
on `^0.2.6` for dom. Core stays at 0.2.6.

### Dependencies

- `@xenon-ui/dom` has no runtime dependencies. It used to install
  `@floating-ui/dom` (with `@floating-ui/core` and `@floating-ui/utils`) and
  `tabbable`. Their code is now vendored into dom, trimmed to the parts Xenon
  calls, with the upstream license notices kept in the bundle.
- Positioning and focus handling run the same code as before: Floating UI 1.8.0
  and tabbable 6.5.0.
- `PositioningAnchor` no longer imports Floating UI's `VirtualElement` type.
  It uses a structurally identical type, so existing virtual anchors still
  type-check.
- If your Vite config listed `tabbable` or `@floating-ui/dom` in
  `optimizeDeps.include`, remove them; they are no longer installed.

## 0.2.7 — 2026-11-09

New features, no breaking changes. Use with `@xenon-ui/core` 0.2.6 and
`@xenon-ui/dom` 0.2.5; this package now depends on `^0.2.6` and `^0.2.5`.

### Shortcuts (`@xenon-ui/solid/shortcuts`)

- A binding can name a physical key by its `KeyboardEvent.code`:
  `createShortcut('Shift+Digit1', fit)`, `Alt+KeyT`, `Mod+BracketLeft`,
  `NumpadAdd`. It fires on that key whatever character the layout or the held
  modifiers make it type, which a character binding cannot do: `Shift+1` never
  fires on a US layout, where the press types `!`. The names are the letter,
  digit, punctuation and numpad codes, matched case-insensitively.
- Modifiers on a physical key match exactly. Shift is not implied, and a press
  with AltGr held matches no physical key.
- Everything else is shared with character bindings: scopes, the modal and
  layer rules, the editable-element rule, `repeat`, sequences (`g Digit1`),
  duplicate warnings and `useShortcuts()` listings.
- Hints show the key's legend. `Shift+Digit1` renders as `Shift` `1`, reads as
  "Shift 1" and sets `aria-keyshortcuts="Shift+1"`. A digit key always shows
  its digit. A letter or punctuation key shows what the user's layout types
  there, so `Alt+KeyQ` reads `Alt` `A` on AZERTY. Chromium reports the layout
  through the Keyboard Map API. Firefox and Safari do not, and show the US
  legend unless you pass `configureShortcuts({ layout })`.
- Core: `ShortcutChord.code`, `ShortcutKeyState.code`, the `ShortcutLayout`
  type, a `layout` registry option and an optional `layout` argument on
  `formatKeys`, `formatSteps`, `formatLabel` and `ariaKeyshortcuts`. DOM:
  `readKeyboardLayout(document)`.
- Existing bindings parse and match as before. Every new name was a parse error
  until now.

### Combobox

- `activationMode="automatic"`: an arrow key in an open list selects the option
  it highlights, and navigation starts from the selected option when nothing is
  highlighted. Hover still only highlights and a click still selects. The input
  text and the popup are left alone, so the field can stay a search box. The
  default, `manual`, is the old behavior.
- `onActiveChange(value, { reason })` is now a root prop. It reports the
  highlighted value and whether the `keyboard` or the `pointer` moved it, or
  `reset` with an undefined value when the highlight is cleared.
- `onInputValueChange(value, { reason })` gains a second argument: `input` for
  typed or composed text, `selection` when choosing an option writes its label,
  `reset` when a popup search closes. A controlled search field ignores
  `selection`.
- An open list rendered inline, with Viewport and Items and no Positioner or
  Content, scrolls the highlighted option into view as Content does.
- With none of these set, nothing changes except the second callback argument.

## 0.2.6 — 2026-11-03

Bug fixes. Use with `@xenon-ui/core` 0.2.5 and `@xenon-ui/dom` 0.2.4; this
package now depends on `^0.2.5` and `^0.2.4`.

### Fixed

- Closing a Dialog while a `Toast.Portal` was mounted halted the app under
  Solid's dev build with `REACTIVE_WRITE_IN_OWNED_SCOPE`. The modal registry
  reports the new destination synchronously from the Dialog's cleanup, and
  that cleanup can run inside a computation, such as a `For` dropping a row.
  The portal's destination signals now accept owned writes. The same applied
  to `Toast.Viewport` when it was unmounted while expanded by hover or focus.
- Menu: with a submenu open, the back arrow (ArrowLeft, or ArrowRight in RTL)
  closes only that submenu and keeps focus on its trigger. Reopening a menu
  during its exit transition focuses the requested edge again. (#13, #44, #55)
- ToggleGroup and Toolbar: keyboard navigation follows document order after a
  keyed list moves items without remounting them, and disabled Toolbar items
  are skipped. (#43)
- Combobox: composed text (IME) filters and publishes once, at
  `compositionend`, and controlled owners keep the draft while composing. (#18)
- Command: item IDs encode every non-alphanumeric character, so values such as
  `a b` and `a_b` no longer collide, and keyed rows keep their identity through
  reordering. The collection callback must take `items` as a plain first
  parameter; a zero-length function is rendered as content. (#12, #26)
- Positioning: input-driven resets land in the same flush as the input change,
  without effect relay warnings, and equal snapshots do not notify readers.
  (#16)
- ScrollArea: explicit measurements share the live observer, so a measure
  request after a resize no longer reads stale metrics.
- VirtualList: the viewport height is read before a native scroll clamp is
  classified, so following the end survives viewport growth. (#36)

## 0.2.5 — 2026-10-16

Packaging only. No component behavior changes. Use with `@xenon-ui/core` 0.2.4
and `@xenon-ui/dom` 0.2.3; this package now depends on `^0.2.4` and `^0.2.3`.

### Packaging

- The `default` condition is now one compiled DOM bundle, `index.js`, with a
  one-line re-export per subpath, the same shape the `solid` condition got in
  0.2.4. 0.2.4 still shipped the old per-component tree next to the new JSX
  bundle, so the package was 3.7 MB unpacked in 448 files. It is now 1.1 MB in
  255 files: 395 KB compiled bundle, 367 KB JSX bundle, 337 KB declarations.
- No source maps ship. The JSX bundle's map alone was 1.1 MB. Core and dom
  drop theirs too.
- The runtime bundles no longer carry JSDoc; the declarations do. Pure
  annotations stay, so a consumer's production build still drops unused
  components. Importing any bundle for side effects alone retains nothing.
- The compiled bundle is not minified. Minifying strips the pure annotations
  and would turn every import into the whole library.

## 0.2.4 — 2026-10-16

Packaging only. No component behavior changes. Use with `@xenon-ui/core` 0.2.3
and `@xenon-ui/dom` 0.2.2; this package now depends on `^0.2.3` and `^0.2.2`.

### Packaging

- Under the `solid` condition the package is one JSX-preserved file,
  `src/index.jsx`, and every subpath is a one-line re-export from it. The
  bundle imports `@xenon-ui/core` and `@xenon-ui/dom` by their package roots,
  two specifiers instead of 42 subpaths. A Vite dev server with the Solid
  plugin serves this package file by file, and a page that used five
  components went from 175 module requests to 25 with no consumer config.
  `@xenon-ui/core` 0.2.3 and `@xenon-ui/dom` 0.2.2 are one bundled file each
  for the same reason.
- Context and compound-component initializers are marked pure, and Editable,
  TagsInput, HoverCard and Tooltip import Field and Popover parts directly.
  With everything in one file, a bundler kept those top-level calls and with
  them every component; a build that used only Button retained 420 kB. It
  now retains 27 kB.
- All three packages export `./package.json`.
- The README says what a Vite consumer should see in dev, and gives the two
  `optimizeDeps.include` entries that fold core and dom into `.vite/deps`.
  Vite and the Solid plugin cannot discover them on their own; see the README.

## 0.2.3 — 2026-10-12

Adds a command palette and a virtual list, and packages them so they can be
imported. Use with `@xenon-ui/core` 0.2.2 and `@xenon-ui/dom` 0.2.1; this
package now depends on `^0.2.2` and `^0.2.1`.

### Packaging

- 0.2.2 shipped the `command` and `virtual-list` modules, but its `exports` had
  no `./command` or `./virtual-list` entry, so neither could be imported. A
  turbo cache hit had restored the 0.2.2 build over a newer `dist/` without
  deleting the newer files. 0.2.2 is deprecated.
- `@xenon-ui/dom` 0.2.1 adds `./virtualizer`, which the virtual list imports.
  0.2.2 accepted any `^0.2.0` dom, and none of those had it.
- Release builds now always run without the turbo cache. A new check installs
  each packed tarball into a scratch project and imports every subpath. It
  also resolves cross-package imports and rejects stale files, and it fails
  if a version already on npm would change. It runs in CI.

### Command (`@xenon-ui/solid/command`)

- `Command` with `Input`, `List`, `Group`, `GroupHeading`, `Item`, `Shortcut`,
  `Empty`, `Loading` and `Separator`. The input is a `role="combobox"` that
  keeps DOM focus and points `aria-activedescendant` at the highlighted
  option.
- Filtering defaults to a cmdk-style fuzzy score over `value` and `keywords`.
  `filter(item, query)` replaces it (0 hides an item), and
  `shouldFilter={false}` leaves filtering to a server.
- Mounted `Command.Item` children filter in place and keep author order. Pass
  `items` to rank results instead, and render them from `Command.List`'s
  function child or `renderItem`.
- Arrow Up and Down move and wrap (`loop`), Home and End jump, Ctrl or Meta
  with an arrow jumps between groups, and Enter runs `onSelect`. Disabled
  items are skipped. Groups with no matches hide.
- `pages` is a controlled page stack. Backspace on an empty input and Escape
  pop a page, and Escape only reaches an enclosing dialog on the root page.
  `useCommand()` exposes `pushPage`, `popPage`, the query and the highlight.
- An item's `shortcut` registers through `createShortcut`, scoped to the
  palette. It is announced through `aria-keyshortcuts` and drawn by
  `Command.Shortcut`.
- A polite live region announces the result count once typing settles.
  `announce` changes the text or turns it off.
- `Command.Dialog` puts the palette in a modal Xenon dialog. `openShortcut`
  (default `Mod+K`) registers through the shortcuts package. Opening focuses
  the input, selecting closes unless the handler calls `preventDefault()` or
  opens a page, and closing returns focus.
- Data attributes: `data-active`, `data-disabled`, `data-empty` and
  `data-page`.

### Virtual list (`@xenon-ui/solid/virtual-list`)

- `createVirtualizer` over a scroll element you own, and the
  `VirtualList.Root`, `Viewport` and `Item` parts built on it. Rows can have a
  fixed size, an estimate, or a measured size through ResizeObserver.
  `overscan`, `scrollToIndex(index, { align })` and sticky group headings are
  supported. Vertical lists only for now.
- Scrolling keeps row identity, so only rows entering or leaving the range
  render.
- Rows carry `aria-setsize` and `aria-posinset`. When the focused row scrolls
  out, focus waits on the scroll container and returns when the row comes
  back.
- `follow` keeps an append-only list pinned to its end, as in a log viewer.
  Scrolling up stops following and reaching the end resumes it. Appending
  rows while not following leaves the scroll position alone.
- `Listbox` (with `items`), `Combobox.Viewport` and `Command.List` take a
  `virtual` prop. Keyboard handling works over every item, a move to an
  unmounted option scrolls it in first, and `aria-activedescendant` only
  names options that are mounted.

## 0.2.2 — 2026-10-12

Bug fixes. `@xenon-ui/core` moves to 0.2.1 with them, and this package now
depends on `^0.2.1`. DOM stays at 0.2.0.

### Packaging

- 0.2.1 on npm is incomplete: 192 of its 433 files, so imports such as
  `@xenon-ui/solid/avatar` fail to resolve. It was packed while a second build
  was deleting `dist/`. 0.2.2 ships the same source in full and 0.2.1 is
  deprecated. Upgrade from 0.2.0 or 0.2.1 straight to 0.2.2.
- The `./spread` export's default condition now points at `./spread/index.js`.
  Since 0.2.0 it named a `./spread.js` that was never built.
- Publishing now checks the packed tarball first: every `exports` target under
  every condition, every relative import in a shipped module, and README,
  LICENSE and package.json must be present.

### Overlays

- Removing an open Dialog, AlertDialog, Drawer, Popover, HoverCard or Combobox
  no longer halts Solid. Their parts cleared element signals from `onCleanup`
  without `ownedWrite`. When a list (`For`, or a router built on `mapArray`)
  removed the row holding the overlay, that cleanup ran inside the list's
  computation and Solid threw `REACTIVE_WRITE_IN_OWNED_SCOPE`. `Show` and
  ternaries dispose outside a computation, so they never hit it.
- Every element, arrow and direction signal written from `onCleanup`,
  `onSettled` or a ref callback now sets `ownedWrite`. That covers the dialog
  family, Popover, Menu, Select, Combobox, NavigationMenu and Listbox.
- A Viewport dialog opened after mount could stay hidden. Solid can build
  `Dialog.Content` twice in that flush, and the discarded copy's cleanup
  cleared the live one's element. Cleanup now clears only what it owns.

### Components

- Pagination marks only the current page's Item with `data-state="current"`.
  First, Previous, Next and Last stay `idle`.
- Slider sets `data-focus` on the focused thumb only. The root still sets it
  while any thumb has focus.
- Editable no longer puts `type="text"` on a textarea. Every part gets
  `data-empty` while the value is empty. With no value or placeholder the
  preview renders no text instead of "Edit", and keeps "Edit" as its
  `aria-label`. That empty preview has no size until it's styled, so give
  `[data-empty]` a minimum width or a visible hint, or pointer users can't
  click it.
- RangeCalendar gives a draft anchor `data-selection-start` while its preview
  is invalid. Overflow days from neighbouring months no longer get range
  flags, so side-by-side months draw the band once.
- Calendar and RangeCalendar name the paging buttons "Previous 2 months" and
  "Next 2 months" when `visibleMonths` is above 1.

### Already fixed in 0.2.1

Reported against 0.2.0, and covered by new tests here:

- Lowercase event props (`onclick` and the rest) on rc.14. `spread` emits
  `onClick`-style keys and no part writes a lowercase handler.
- `RangeCalendar.Heading` logging `STRICT_READ_UNTRACKED` in a loop. The
  heading host was rebuilt on every registration under `<Dynamic>`.

### Tests

- The suite fails any test that produces `REACTIVE_WRITE_IN_OWNED_SCOPE`,
  `STRICT_READ_UNTRACKED`, `FLUSH_IN_EFFECT_CALLBACK` or
  `LOWERCASE_EVENT_ATTRIBUTE`.

## 0.2.1 — 2026-10-12

Moves to `solid-js` and `@solidjs/web` 2.0.0-rc.14, which is now the minimum
peer version. Core and DOM stay at 0.2.0.

- Core event listeners now reach the DOM again. rc.14 only binds `on*` props
  whose third letter is uppercase and renders `onkeydown` as an attribute, so
  `spread` now emits `onKeydown`, `onFocus` and so on. Author handlers can
  still use any casing.
- Hosts are built with a hoisted `dynamic()` in place of the deprecated
  `<Dynamic>`. Under rc.14, `<Dynamic>` rebuilt its element whenever a
  sibling registered during the first render. Menubar and HoverCard triggers
  created three buttons on mount and passed two detached ones to the author's
  ref. Each host is now created once.
- Removes the rc.14 `STRICT_READ_UNTRACKED` dev warnings. Refs, Tooltip and
  HoverCard intent refreshes, Tooltip group closing and NumberField draft
  reformatting read their values untracked on purpose, and now say so.

## 0.2.0 — 2026-10-11

Adds keyboard shortcuts and the PinInput options a device-authorization code
needs. `@xenon-ui/core` and `@xenon-ui/dom` move to 0.2.0 with it, and this
package now depends on `^0.2.0` of both.

### Shortcuts (`@xenon-ui/solid/shortcuts`)

- `createShortcut(binding, handler, options)` binds a key for the owner's
  lifetime and returns `keys`, `label`, `ariaKeyshortcuts` and `active`
  accessors from the same registration, so a hint can't show a key that does
  nothing. Bindings look like `Mod+K`, `Shift+?`, `Escape`, `[` or the sequence
  `g n`. Mod is ⌘ on Apple platforms and Ctrl elsewhere.
- `ShortcutScope` ties the bindings below it to its subtree. Scoped bindings
  fire while focus is inside, or while the scope sits in the topmost layer, and
  beat global bindings for the same keys.
- `useShortcuts().list` returns the bindings that can fire right now, with
  descriptions and groups, for help overlays and hint footers.
- While a modal dialog is open only bindings scoped inside it fire. Escape
  bindings stay quiet while any Xenon layer is open, so a dialog or popover
  dismisses once.
- Plain keys such as `j` don't fire while a text field, select, contenteditable
  region or pin input slot has focus. Ctrl and ⌘ chords do.
- `configureShortcuts` overrides the detected platform or the 1000 ms sequence
  timeout.

The framework-free pieces are `createShortcutRegistry`, `parseShortcut`,
`formatKeys`, `formatSteps`, `formatLabel` and `ariaKeyshortcuts` in
`@xenon-ui/core/shortcuts`, and `readShortcutContext`, `watchShortcutContext`
and `detectShortcutPlatform` in `@xenon-ui/dom/shortcuts`.

### PinInput

- `case` (`preserve`, `upper` or `lower`) transforms typed, pasted and autofilled
  text before filtering. The displayed slots, `onValueChange` and the submitted
  value all use the transformed case. `upper` also sets
  `autocapitalize="characters"`.
- `charset` narrows accepted characters after `type` filtering, for example
  `BCDFGHJKLMNPQRSTVWXZ` for device codes.
- `autocomplete` replaces `one-time-code` on the first slot. Pass `off` for codes
  that never arrive by SMS.
- Separators between slots are plain elements. Mark them `aria-hidden="true"`;
  arrow keys, Backspace, paste and slot labels skip them.

### Compatibility notes

- Existing PinInput defaults are unchanged.
- `aria-keyshortcuts` is undefined for sequences, because ARIA reads a space in
  that attribute as alternative shortcuts.
- Server rendering uses the non-Apple key names. On a Mac the hint text changes
  to ⌘ after hydration.

## 0.1.1 — 2026-10-02

This release preserves Solid 2 host prop types and behavior across the adapter.
It is tested against `solid-js` and `@solidjs/web` 2.0.0-rc.8.

- Accept native boolean attribute values for behavior-owned `disabled`, `readonly`,
  `required`, and `autofocus`. Both `true` and `""` enable the attribute.
- Preserve ref inference for default, selected, and custom hosts. Compose consumer
  callback refs and nested ref arrays with internal refs using Solid's lifecycle.
- Compose optional handlers, functions, and bound event tuples. Preserve handler
  receivers, bound data, cancellation, event-name casing, and listener-object options.
- Preserve native `class` values and intrinsic properties. Restore NumberField host
  prop forwarding and distinguish Editable input and textarea props.
- Honor explicit attribute removal, including NumberField associations and
  Dialog/Popover naming. Keep registered IDs consistent with rendered attributes.

### Compatibility notes

- Button and input-button hosts support `button`, `submit`, and `reset`. Omitting
  `type` defaults to `button`; explicit `type={undefined}` removes the attribute.
  Removal restores the native host default: usually submission for a button in a
  form, and a text field for an input. Other hosts retain their own type meaning.
- Ref types now describe the actual host more precisely. Dialog.Content accepts a
  div-or-dialog ref because its host depends on whether it is inside a Viewport.
- `classList` compatibility is not added. Use Solid's native `class` values.
- Core and DOM dependencies remain at `^0.1.0`.
