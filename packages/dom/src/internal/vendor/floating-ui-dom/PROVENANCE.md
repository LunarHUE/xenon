# @floating-ui/dom 1.8.0

- Upstream: https://github.com/floating-ui/floating-ui, `packages/dom/src`
- Tag: `@floating-ui/dom@1.8.0`, commit `12d94738472e922e1b3fa31b02b2b61b9ed77e6a`
- License: MIT, see `LICENSE` (copied from `packages/dom/LICENSE`)

## Dropped

- The `autoPlacement`, `inline` and `detectOverflow` wrappers in
  `middleware.ts`, with their exports and the `AutoPlacementOptions` and
  `InlineOptions` types. The core `detectOverflow` that the kept middlewares
  call is still there.

## Changed

- `@floating-ui/core`, `@floating-ui/utils` and `@floating-ui/utils/dom`
  imports point at the sibling directories.
- Formatted with this repo's prettier config.
- A `/*! @license */` banner at the top of `index.ts`, so the bundle keeps the notice.
- `autoUpdate.ts`: `timeoutId` is typed `ReturnType<typeof setTimeout>` instead
  of `NodeJS.Timeout`, since the declaration build has no Node types.
- `autoUpdate.ts`: `entries[0]!`; `platform/getClippingRect.ts`:
  `clippingAncestors[0]!` and `clippingAncestors[i]!`. Both for
  `noUncheckedIndexedAccess` and type-only.

## Tests

Ported from `packages/dom/test/unit`: `getClientRects`, `getOffsetParent`,
`getViewportRect` and `getVisualOffsets`, beside the files they test.
`autoUpdate.test.ts` needs a real `IntersectionObserver` and layout (upstream
skips it under jsdom), so it lives in the suite's browser project as
`packages/suite/src/positioning/floating-ui-auto-update.test-browser.tsx`.

Not ported: everything in `test/functional` and `test/visual`. Those are
Playwright screenshot tests that drive upstream's own demo site, so they need
its pages, a real layout engine and its reference images. Xenon's own browser
and E2E suites in `packages/suite` cover positioning in real browsers. Also
not ported: `index.test-d.ts`, type assertions about the published API.
