# tabbable 6.5.0

- Upstream: https://github.com/focus-trap/tabbable, `src/index.js` and `index.d.ts`
- Tag: `v6.5.0`, commit `7dbb9e9bf1636b02c2fc6955f0719648bb465743`
- License: MIT, see `LICENSE` (copied from the repository root)

## Dropped

Xenon's call sites pass `getShadowRoot: true` and sometimes
`includeContainer: true`, nothing else. So:

- `displayCheck` and every mode but the default `'full'`: the `'full-native'`
  `checkVisibility()` path, `'legacy-full'`, `'non-zero-area'` and `'none'`.
- The function form of `getShadowRoot`, which reported undisclosed (closed)
  shadow roots, and the zero-area fallback in `isHidden` that only applied to it.
  `getShadowRoot` is a boolean. When omitted, the light-DOM-only path still
  runs as upstream; the ported tests use it.
- `isTabbable`. `getTabIndex` is still exported, but only the ported tests
  import it.

## Changed

- `src/index.js` is `tabbable.ts` here. An `index.d.ts` under `dist/internal/` would match the
  package's `./*` export as a types-only subpath.
- Converted from JavaScript to TypeScript, with the option and return types
  from upstream's `index.d.ts` narrowed as above. Casts and non-null
  assertions are type-only.
- Formatted with this repo's prettier config.
- A `/*! @license */` banner at the top, so the bundle keeps the notice.
- Options are no longer threaded through `isNodeMatchingSelectorFocusable`,
  `isNodeMatchingSelectorTabbable` and `isHidden`, which only read the dropped
  ones; the filters are passed directly instead of through `.bind(null, options)`.
- `sortByOrder` uses `if`/`else` where upstream used a ternary as a statement
  (`no-unused-expressions`).
- `isInert` returns its expression unchanged but is typed `boolean`; callers
  only test it for truthiness.
- The `eslint-disable no-console` comment is gone; the rule is not enabled here.

## Tests

`unit.test.ts` is ported from `test/unit/unit.test.js` (Jest to Vitest, same
jsdom environment), with the `basic`, `inert` and `tabindex` fixtures copied
unchanged into `fixtures/`. Upstream runs it with `displayCheck: 'none'`;
the port stubs `getClientRects()` instead, which makes the kept 'full' mode
behave the same, and runs each case with and without `getShadowRoot: true`.
The `displayCheck: 'full-native'` fallback test is left out with the code.
The no-argument throw checks from `test/unit/node.test.js` are kept for
`isFocusable` and `getTabIndex`.

Not ported: `test/unit/node.test.js`, which checks the CommonJS build loads in
Node without a DOM. The module-level `typeof Element` guard it covers is kept.
Also not ported: the Cypress suites in `test/e2e`, which need a real browser.
Xenon's browser suite in `packages/suite` covers visibility, disabled
fieldsets, radios and shadow slots through the focus scope.
