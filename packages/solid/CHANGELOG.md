# Changelog

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
