# @floating-ui/core 1.8.0

- Upstream: https://github.com/floating-ui/floating-ui, `packages/core/src`
- Tag: `@floating-ui/core@1.8.0`, commit `12d94738472e922e1b3fa31b02b2b61b9ed77e6a`
- License: MIT, see `LICENSE` (copied from `packages/core/LICENSE`)

## Dropped

- `middleware/autoPlacement.ts` and `middleware/inline.ts`. Xenon uses `flip`
  and never positions against inline fragments. Their exports from `core.ts`
  and the `autoPlacement` field of `MiddlewareData` went with them.
- `utils/debugRects.ts`, a development helper nothing imports.

## Changed

- `src/index.ts` is `core.ts` here. An `index.d.ts` under `dist/internal/` would match the
  package's `./*` export as a types-only subpath.
- `@floating-ui/utils` imports point at `../floating-ui-utils`.
- Formatted with this repo's prettier config.
- A `/*! @license */` banner at the top of `computePosition.ts`, so the bundle
  keeps the notice.
- `middleware/flip.ts`: non-null assertions on `overflows[0]` and
  `overflows[1]`, for `noUncheckedIndexedAccess`. Type-only.

## Tests

`computePosition.test.ts` and `computeCoordsFromPlacement.test.ts` are ported
from `packages/core/test`. Not ported: `middleware/autoPlacement.test.ts` and
`middleware/inline.test.ts` (their code is dropped) and `index.test-d.ts`
(type assertions about the published API, which this copy does not have).
