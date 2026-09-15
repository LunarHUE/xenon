# Pagination

`Pagination count={n}` receives a page count, not an item count. The root defaults
to `nav` named "Pagination". `page` is a one-based controlled value;
`defaultPage` initializes uncontrolled state. `onPageChange` receives the requested
page after uncontrolled state updates. Mounts, external changes, repeated
selection and count clamping do not invoke it. Undefined `page` returns control
to the stored internal state.

`Item page={n}`, `Previous`, `Next`, `First` and `Last` default to buttons with
`type="button"`. Each retains normal Tab order. Boundary controls disable when
no movement is available. Root and per-control `disabled` block activation.
`as="a" href="..."` retains native navigation and modified-click behavior;
disabled links lose href. Author handlers run first and preventDefault cancels
the page request. Current items use `aria-current="page"`.

The root accepts a render function with reactive `page`, `count`, `disabled` and
`pages` getters. `pages` contains numbers and stable `start-ellipsis` or
`end-ellipsis` strings. Render it with Solid's `For`; use `Item` for numbers and
`Ellipsis` for omissions. Ellipsis content is author supplied and aria-hidden.

`siblingCount` and `boundaryCount` default to 1, truncate fractions and clamp to
0..100. Counts clamp to 1..MAX_SAFE_INTEGER; nonfinite counts use 1. Pages clamp
to the count; nonfinite pages use 1. Single-page gaps render that page. The range
contains at most 403 entries, regardless of count. No routing adapter, arrows,
icons, or styling is supplied.

Core tests cover ranges, large counts, normalization, cancellation, boundaries
and current-page semantics. Solid tests cover uncontrolled/controlled updates,
reactive ranges, silent count clamping, author cancellation and disabled links.

- [x] `pagination.alpha.1` The navigation landmark, current page, disabled boundary
  and decorative ellipsis update after activation and pass the shared axe scan.
- [x] `pagination.alpha.2` Native buttons retain sequential Tab navigation and
  Enter/Space activation without submitting their surrounding form.
- [x] `pagination.alpha.3` Disabled anchors lose href; enabled anchors preserve
  link roles and href, ignore Space, and select through native Enter activation.

The alpha checks pass in jsdom and Chromium/WebKit where applicable. The
shared SSR fixture in `packages/solid/src/pagination/ssr.test.ts` verifies
measurement and navigation attributes before client JavaScript. Hydration is
not covered by that serialization test. Axe excludes color contrast and region
coverage; these scans do not establish overall accessibility.
