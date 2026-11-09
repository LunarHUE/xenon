# @floating-ui/utils 0.2.12

- Upstream: https://github.com/floating-ui/floating-ui, `packages/utils/src`
- Tag: `@floating-ui/utils@0.2.12`, commit `12d94738472e922e1b3fa31b02b2b61b9ed77e6a`
  (the same commit as `@floating-ui/core@1.8.0` and `@floating-ui/dom@1.8.0`)
- License: MIT, see `LICENSE` (copied from `packages/utils/LICENSE`)

## Dropped

Nothing. `index.ts` and `dom.ts` are the whole package.

## Changed

- Formatted with this repo's prettier config.
- A `/*! @license */` banner at the top of `index.ts`, so the bundle keeps the notice.
- `index.ts`: `alignments[0]!` and `alignments[1]!` in `placements`, for
  `noUncheckedIndexedAccess`. Type-only.

## Tests

`getOppositeAxisPlacements.test.ts` and `getOverflowAncestors.test.ts` are
ported from `packages/utils/test` and run under the dom package's jsdom vitest.
