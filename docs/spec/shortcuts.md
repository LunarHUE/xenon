# Keyboard shortcuts

One `##` section. `shortcuts` is the registry behind app-wide and scoped key
bindings, shipped in core as `createShortcutRegistry` and the format functions,
and in Solid as `createShortcut`, `ShortcutScope` and `useShortcuts`. It renders
nothing; hints come from `solid-ui`'s Kbd, which reads the same registration.

No surveyed component library ships this. TanStack Hotkeys is the closest prior
art and the bullets tagged `[tanstack]` match one of its tested behaviors.
`[aria]` and `[html]` bullets come from the `aria-keyshortcuts` definition and
the `dialog` element. `[xenon]` bullets are our own decisions and carry no
`(candidate)` marker, because there is no other library to be a candidate
against.

## shortcuts

### Roles and attributes

- [ ] `shortcuts.roles.1` Given `Mod+K`, then `ariaKeyshortcuts` is `Meta+K` on Apple platforms and `Control+K` elsewhere, with modifiers before the key and letters upper case. [aria, xenon]
- [ ] `shortcuts.roles.2` Given `Shift+?`, `Escape`, `[`, `Control+Space` and `Plus`, then `ariaKeyshortcuts` writes `Shift+?`, `Escape`, `[`, `Control+Space` and `Plus`, using the ARIA names for the space and plus keys. [aria]
- [ ] `shortcuts.roles.3` Given a sequence such as `g n`, then `ariaKeyshortcuts` returns undefined, because ARIA reads a space in the attribute as alternative shortcuts and `G N` would claim that G alone works. [aria, xenon]
- [x] `shortcuts.roles.4` Given a control that renders `aria-keyshortcuts` from its registration handle, then the attribute matches the binding that fires, on both platforms. [xenon]

### Keyboard

- [x] `shortcuts.keyboard.1` Given `Mod+K`, then Meta+K fires it on Apple platforms and Control+K fires it elsewhere; the other modifier, or both together, never fires it. [tanstack, xenon]
- [x] `shortcuts.keyboard.2` Given `?`, then Shift+/ on a US layout fires it without the binding naming Shift, while `j` does not fire on Shift+J; Shift is implied only for printable characters that are not letters. [tanstack]
- [ ] `shortcuts.keyboard.3` Given letter bindings, then matching ignores case, so `Mod+k` and `Mod+K` are the same binding. [tanstack, xenon]
- [ ] `shortcuts.keyboard.4` Given AltGr held to type a character on a European layout, then the press is not read as Control+Alt and does not fire a `Control+Alt` binding. (browser-only) [tanstack]
- [x] `shortcuts.keyboard.5` Given `g n`, when g then n are pressed within 1000 ms, then it fires once; after a 1100 ms gap it does not, and `g x n` does not. [xenon]
- [ ] `shortcuts.keyboard.6` Given a sequence in progress, when a bare modifier key goes down (for example Shift before `N`), then the sequence is neither advanced nor reset. [xenon]
- [ ] `shortcuts.keyboard.7` Given both `g n` and `n` registered, when g then n are pressed, then only the sequence fires; a lone n still fires the single key. [xenon]
- [x] `shortcuts.keyboard.8` Given a held key, then auto-repeat keydowns are ignored unless the registration sets `repeat: true`, in which case every repeat fires. (browser-only) [tanstack, xenon]
- [ ] `shortcuts.keyboard.9` Given a keydown with `isComposing` (IME input), then no shortcut fires and no sequence advances. [tanstack, xenon]
- [x] `shortcuts.keyboard.10` Given a keydown whose default a component or author already prevented, then no shortcut fires. [xenon]
- [ ] `shortcuts.keyboard.11` Given a binding that fires, then its keydown default is prevented unless the registration sets `preventDefault: false`. [tanstack]
- [ ] `shortcuts.keyboard.12` Given an invalid binding such as `Mod+`, `Shift+Shift+A`, `Escpe` or `Mod+Meta+K`, then registration throws an error that quotes the binding. [xenon]

### Focus management

- [x] `shortcuts.focus.1` Given focus in a text input, textarea, select, contenteditable region, pin input slot, or an element with role `textbox`, `combobox`, `searchbox` or `spinbutton`, then `j` does not fire and `Mod+K` does. [tanstack, xenon]
- [x] `shortcuts.focus.2` Given focus on a checkbox, radio, range, color, file or button-type input, then single-key shortcuts still fire. [tanstack]
- [ ] `shortcuts.focus.3` Given `allowInEditable: true` on a plain key, then it fires inside text fields; given `allowInEditable: false` on a chord, then it does not. [tanstack, xenon]
- [x] `shortcuts.focus.4` Given a binding inside a `ShortcutScope`, then it fires only while focus is inside the scope or the scope sits in the topmost open layer. [xenon]
- [x] `shortcuts.focus.5` Given the same binding in nested scopes and globally, then the scope holding focus wins, then the innermost scope, then the latest registration. [xenon]
- [x] `shortcuts.focus.6` Given focus inside an open shadow root, then the focused element inside the shadow tree decides editable and scope checks. (browser-only) [tanstack, xenon]

### State

- [ ] `shortcuts.state.1` Given `formatKeys`, `formatLabel` and `ariaKeyshortcuts`, then `Mod+K`, `Shift+?`, `Escape`, `[` and `g n` produce the table in the core tests on both platforms: `["⌘", "K"]` and `Command K` on Apple, `["Ctrl", "K"]` and `Control K` elsewhere. [xenon]
- [ ] `shortcuts.state.2` Given a sequence, then `formatSteps` keeps one token group per step and `formatLabel` joins steps with "then". [xenon]
- [ ] `shortcuts.state.3` Given `list()`, then it returns one entry per binding that can fire now, in registration order, with description, group, keys, label and `ariaKeyshortcuts`, after enabled, scope, modal, Escape and editable-focus filtering. [tanstack, xenon]
- [x] `shortcuts.state.4` Given `useShortcuts().list` and a handle's `active`, then both update after a registration mounts or unmounts, focus moves, a dialog opens or closes, or an `enabled` accessor changes. [xenon]
- [x] `shortcuts.state.5` Given two registrations of the same binding in the same scope, then a development warning names both, the later one wins, and removing it restores the earlier one; production builds stay silent. [tanstack, xenon]
- [ ] `shortcuts.state.6` Given `enabled` as an accessor, then the binding fires only while it reads true. [tanstack]
- [ ] `shortcuts.state.7` Given the platform is detected from `navigator.userAgentData.platform` or `navigator.platform`, then macOS and iOS resolve to Apple and everything else to other; tests can override it with `configureShortcuts`. [tanstack, xenon]

### Dismissal and layering

- [x] `shortcuts.dismissal.1` Given a modal `<dialog>` opened with `showModal()`, then a global `j` does not fire while it is open, a `j` scoped inside it does, and the global one fires again after it closes. (browser-only) [html, xenon]
- [x] `shortcuts.dismissal.2` Given an open Xenon dialog, when Escape is pressed inside it, then the dialog closes exactly once and a registered global Escape binding does not also fire. [xenon]
- [x] `shortcuts.dismissal.3` Given an open non-modal Xenon popover or menu, then global shortcuts other than Escape keep firing, and Escape bindings stay quiet until it closes. [xenon]
- [x] `shortcuts.dismissal.4` Given a native modal `<dialog>` that Xenon did not open, then it suppresses global bindings the same way a Xenon dialog does. (browser-only) [html, xenon]
- [x] `shortcuts.dismissal.5` Given nested modals, then only bindings scoped inside the newest modal fire. [xenon]

### SSR and hydration

- [ ] `shortcuts.ssr.1` Given server rendering, then `createShortcut` registers nothing, `active` is false, and `keys` uses the non-Apple tokens. [xenon]
- [ ] `shortcuts.ssr.2` Given hydration on an Apple client after a server render, then hint text that differs from the server (`Ctrl` versus `⌘`) does not break hydration of the surrounding markup. (decision needed) [xenon]

### Accessibility tooling

- [x] `shortcuts.a11y.1` Given a button with `aria-keyshortcuts` and a `<kbd>` hint built from a registration, when axe runs, then there are no violations. [axe, xenon]

### Notes and edge cases

- [ ] `shortcuts.notes.1` Given every registration disposed, then no `keydown`, `focusin` or `focusout` listener and no mutation observer remains on the document. [xenon]
- [x] `shortcuts.notes.2` Given many registrations, then the document has exactly one shortcut `keydown` listener, installed with the first registration. [xenon]
- [x] `shortcuts.notes.3` Given the shortcut keydown listener runs in the bubble phase on the document, then a component that handles a key and prevents its default (menu typeahead, slider arrows) keeps it from reaching shortcuts. (browser-only) [xenon]

## Sources

- TanStack Hotkeys `packages/hotkeys/src` (`_match.ts`, `_event-target.ts`, `_registration.ts`, `conflicts.ts`, `format.ts`), read from source at version 0.11.0. Its Solid adapter targets Solid 1 and was not used.
- WAI-ARIA 1.2 `aria-keyshortcuts`.
- HTML `dialog` element: `showModal()` and the `:modal` pseudo-class.

## Deferred

- Physical-key bindings (`event.code`). TanStack's `[KeyS]` bracket syntax would add them without changing the grammar.
- User-customisable keymaps and recorders.
- The command palette.
- `<kbd>` rendering and styling, which belong to `solid-ui`.
- Hydration of platform-specific hint text (`shortcuts.ssr.2`). Either render a neutral form on the server and swap after hydration, or accept the text mismatch.
