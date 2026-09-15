# Scroll area coverage

The alpha contract preserves native scrolling and adds optional custom tracks.
Its browser assertions are in
`packages/suite/src/scroll-area/scroll-area.test-browser.tsx`; the fixture uses
actual content and viewport dimensions with no geometry or observer mocks.
Eight cases pass in both Chromium and WebKit. The shared suite's typecheck and
scoped lint pass for these additions.

## Evidence

| Contract | Verified coverage |
| --- | --- |
| Native viewport | Tab focus, ArrowDown scrolling, actual provider wheel input, no required custom track, named region and axe |
| Custom pointer controls | Actual mouse thumb drag and track click; scroll offset, thumb movement, focus, dragging release and ARIA value |
| Custom keyboard/wheel | ArrowDown, PageDown, Home, End and native wheel; author viewport ID updates aria-controls |
| Horizontal RTL | Actual bounding-box alignment at both physical edges, negative native scrollLeft, ArrowRight, range boundaries, and live inherited direction changes |
| Geometry observation | Native ResizeObserver after content and viewport size changes, stable hosts, both-axis corner reservation, fitting-content cleanup |
| Optional axes | Native horizontal scrollbar eligibility and wheel preserved when only a vertical custom track exists |
| Smooth wheel | Synchronous cancellation with deferred native movement, followed by a trusted native wheel that is also consumed |
| Cancellation/disposal | Clearly synthetic touch-pointer ownership, pointercancel and unmount; style restoration and inert post-unmount handlers |

The wheel calls use Vitest's Playwright-backed `userEvent.wheel`. They do not
manually assign offsets to claim native wheel coverage. The smooth-scroll case
adds a clearly labeled synthetic WheelEvent for synchronous cancellation, then
checks cancellation and movement with a trusted native provider wheel.
The native viewport keyboard test does not call the custom scrollbar's keyboard
handler. Tests use polling for browser scroll/resize delivery rather than fixed
waits or simulated geometry.

## Research decisions

The local Zag/Ark research describes a native viewport with optional custom
anatomy but reports no executed ScrollArea tests. Reka/Melt/Bits research adds
browser overflow, resize and interaction cases, with several wheel/keyboard cases
skipped in WebKit. Tenon's eight cases execute in both browsers. They verify its
own named-region and keyboard-operable-scrollbar contract; they do not claim
compatibility with competing presentation-role, data-attribute, mounting or
imperative API choices.

Native scroll state is not a controlled component value. Consumers use the
viewport's native DOM scrolling API when they need programmatic movement.
Custom visuals require consumer sizes and styling. The library supplies no
virtualization, scroll-snap carousel, scrolling callback API, or themed scrollbars.

## Remaining coverage boundaries

- Native touch/pen gesture input and native pointer-capture-loss delivery. The
  cancellation case uses synthetic events and says so in the test and spec.
- Nested wheel chaining at edges, nested scrolling regions, and multiple
  simultaneous ScrollArea instances.
- Hover and scroll visibility timing, resize during an active drag, custom host
  forwarding, asynchronous image loading, and author event cancellation in this
  native suite.
- Forced-colors and visual contrast, screen-reader behavior, and hydration.

DOM and Solid unit/SSR tests belong to their implementation packages and are
tracked separately. This document claims only the executed native suite above.
