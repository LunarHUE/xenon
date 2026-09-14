# Architecture

Decision record. Update it when a decision changes, not when code changes.

## Goal

A headless component library for Solid 2 whose behavior lives in plain
TypeScript, so a React or Vue adapter later is a thin binding job and not a
rewrite. Solid is the only adapter for now and gets the idiomatic API.

## Layers

- `@kit/core`. One function per component, from options to a `PartProps` per
  part. Pure: it may use DOM types but never DOM globals, enforced by eslint
  `no-restricted-globals` and by running its tests in Node. Everything that
  needs a live document (focus trap, dismiss, positioning, presence) goes in a
  future `@kit/dom` package, also framework-free.
- `@kit/solid`. Components that call core inside `createMemo` and spread the
  result. Nothing from core shows up in the public API. Ark UI lets Zag's
  `connect` and `normalizeProps` leak into user code, and we treat that as the
  mistake to avoid.

## Controller shape

A controller returns `{ state, parts }`. `state` is the snapshot adapters
expose and CSS reads through data attributes. `parts` is one `PartProps` per
anatomy part. Options are input and never inherit from `PartProps`; an
option that mirrors an attribute takes its type from the generated
vocabulary. A controller never sees the DOM element; the adapter tells it the
host kind (`button`, `input`, `link`, `generic` for the button) and reads
`state.interactive` to decide whether user handlers run.

## The contract

`PartProps` is `{ attrs, on }`. Attribute names use the HTML spelling
(`class`, `for`, `tabindex`); `undefined` means "do not set". Listeners are
keyed by DOM event name and receive the native event. Adapters translate;
core never learns a framework's spelling.

Adapters merge user props over core props. Attributes: the user's win.
Handlers: the user's runs first and `preventDefault()` skips the core one.

## Decisions taken while making the button pass its spec

- An `a` host with `href` is a link: no button role, no tab stop, Enter is
  native and Space does nothing (`button.notes.1` is normative). Disabled or
  pending drops the `href`, as React Aria does.
- Native hosts delegate activation to the browser. Core never prevents
  default on Enter or Space for them, so `button.forms.32` stays skipped.
- Non-native hosts synthesize a real `click` on Enter keydown and Space
  keyup, carrying modifier state, ignoring OS key repeat.
- `pending` and `focusableWhenDisabled` are part of the API. Both keep the
  element focusable with `aria-disabled` and stop user handlers from running.
- Not adopted: a runtime `focusable` flag, `input[type=checkbox]` as a host.

## Toolchain

bun workspaces with a catalog, turbo for task running, TypeScript 7 for
`tsc` with the 6.x API kept for typescript-eslint, eslint 10, prettier,
vitest. Solid 2 release candidate, pinned exact with `@solidjs/signals`
overridden to the same version because the rc range floats.

## Later

- `@kit/dom` when the first floating component (popover) lands.
- A conformance suite written once against the DOM, run per adapter through a
  small mount harness. Spec source: WAI-ARIA Authoring Practices keyboard and
  role tables, then the React Aria, Radix, Zag and Ariakit suites.
- Docs app. Solid, for dogfooding.
