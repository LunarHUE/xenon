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

## The contract

`PartProps` is `{ attrs, on }`. Attribute names use the HTML spelling
(`class`, `for`, `tabindex`); `undefined` means "do not set". Listeners are
keyed by DOM event name and receive the native event. Adapters translate;
core never learns a framework's spelling.

Adapters merge user props over core props. Attributes: the user's win.
Handlers: the user's runs first and `preventDefault()` skips the core one.

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
