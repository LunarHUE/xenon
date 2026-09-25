# Positioning

xenon uses `@floating-ui/dom` 1.8 behind `@xenon-ui/dom/positioning`. Geometry stays
in the DOM package. Solid binds refs and reactive options through
`@xenon-ui/solid/positioning`; core has no browser dependency or duplicate geometry
controller. Positioning does not open overlays, dismiss them, assign roles,
move focus, create portals, or choose a z-index.

## Decisions and sources

The comparison covers current Radix, Base UI, Zag, React Aria, and Floating UI.
The existing research checklist contains incompatible choices and some stale
implementation observations. It is evidence, not a requirement to reproduce
all of those implementations.

| Question      | Evidence                                                    | xenon decision                                                             |
| ------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Placement     | Radix and Base UI expose side and align                     | Physical `side`, logical `align`; no competing input placement alias       |
| Gap           | Radix adds arrow height; Base UI uses the popup gap         | `sideOffset` is the distance between boxes, independent of arrow size      |
| Center offset | Radix uses alignmentAxis; Base UI also sets crossAxis       | `alignOffset` works for center, start, and end                             |
| Strategy      | Radix uses fixed; Base UI and Zag use absolute              | Absolute default, fixed explicit                                           |
| Collisions    | Radix defaults to viewport; Base UI uses clipping ancestors | Clipping ancestors default, explicit viewport/element/list/rect override   |
| Detachment    | Radix separates reference clipping from popup collisions    | `hideWhenDetached` always measures reference clipping ancestors            |
| Dimensions    | Libraries mix width matching and axis-dependent matching    | Explicit `matchAnchorSize: 'width'` or `'height'`; otherwise CSS variables |
| Updates       | Floating UI observes scroll, resize and layout movement     | Active-only subscriptions, stable across numeric option changes            |
| Animation     | Radix wraps content; Base UI exposes Positioner             | Positioner owns left/top; nested content owns visual transforms            |

Sources reviewed on 2026-09-14:

- [Radix Popper implementation, f7ecd5a](https://github.com/radix-ui/primitives/blob/f7ecd5ab16f5e1e820eb5786a1419a98a2d594ae/packages/react/popper/src/popper.tsx)
  and [public Popover API](https://www.radix-ui.com/primitives/docs/components/popover).
- [Base UI positioning, a4f5e0e](https://github.com/mui/base-ui/blob/a4f5e0ed25575f4abe94bec08bac50903085b034/packages/react/src/internals/useAnchorPositioning.ts)
  and [public Popover API](https://base-ui.com/react/components/popover).
- [Zag positioning](https://github.com/chakra-ui/zag/blob/main/packages/utilities/popper/src/get-placement.ts),
  [types](https://github.com/chakra-ui/zag/blob/main/packages/utilities/popper/src/types.ts),
  and [middleware](https://github.com/chakra-ui/zag/blob/main/packages/utilities/popper/src/middleware.ts).
- [React Aria positioning hook](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/overlays/useOverlayPosition.ts)
  and [calculator](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/overlays/calculatePosition.ts).
- Floating UI [offset](https://floating-ui.com/docs/offset),
  [flip](https://floating-ui.com/docs/flip), [size](https://floating-ui.com/docs/size),
  [arrow](https://floating-ui.com/docs/arrow),
  [overflow](https://floating-ui.com/docs/detectoverflow),
  [virtual elements](https://floating-ui.com/docs/virtual-elements), and
  [updates](https://floating-ui.com/docs/autoupdate).

The implementation is xenon's wrapper around the dependency, not copied
component-library code. In particular, it guards both final results and size
middleware writes against obsolete async requests.

## DOM API

```ts
import { createPositioner } from '@xenon-ui/dom/positioning'

const positioner = createPositioner(wrapper, {
  anchor: trigger,
  side: 'bottom',
  align: 'start',
  sideOffset: 8,
  onPositioned(state) {
    // Read the resolved side, nullable measurements, and referenceHidden.
  },
})

positioner.update({ anchor: trigger, side: 'top', sideOffset: 12 })
await positioner.reposition()
positioner.dispose()
```

`update` replaces options. `reposition` is for changed virtual coordinates or
manual observation. It resolves after its calculation, but a superseding update
may invalidate that calculation. `getState()` returns a snapshot. `onPositioned`
runs when the accepted state changes, including becoming unpositioned when
disabled or changing anchors. It does not run after disposal. Async automatic
errors go to `onError` if supplied; otherwise they are surfaced. Explicit
`reposition()` calls reject on failure.

Defaults:

| Option                      | Default              | Meaning                                                                            |
| --------------------------- | -------------------- | ---------------------------------------------------------------------------------- |
| `side`, `align`             | `bottom`, `center`   | Requested placement                                                                |
| `strategy`                  | `absolute`           | Coordinate containing block; fixed does not escape transformed ancestors           |
| `sideOffset`, `alignOffset` | `0`, `0`             | Box gap and logical alignment offset                                               |
| `collisionBoundary`         | `clipping-ancestors` | Also accepts `viewport`, an element, element array, or viewport-relative rectangle |
| `collisionPadding`          | `8`                  | Number or per-edge values, shared by flip, shift, and size                         |
| `flip`, `shift`, `tether`   | `true`               | Opposite-side/alignment fallback, cross-axis sliding, and limiting detachment      |
| `fallbackPlacements`        | unset                | Explicit ordered fallback list when default flips are unsuitable                   |
| `hideWhenDetached`          | `false`              | Hide when reference is fully clipped                                               |
| `matchAnchorSize`           | `false`              | Explicit width or height matching                                                  |
| `arrow`, `arrowPadding`     | none, `4`            | Square HTML layout box and corner padding                                          |
| `autoUpdate`                | `true`               | Scroll, ancestor resize, element resize, and layout-shift tracking                 |
| `enabled`                   | `true`               | Disable to release subscriptions and owned styles                                  |

`dir` overrides inherited direction. If omitted, the positioner's computed
CSS direction controls alignment. Portaled content must receive the intended
direction if it differs from its new DOM ancestry. Vertical start/end alignments
reverse in RTL. Positive alignOffset moves center/start toward inline-end and
insets end toward inline-start. Horizontal placements align along the y axis and
do not reverse with RTL.

Flip precedes shift for edge-aligned placements. Centered placements shift
before flipping, following Floating UI's current ordering guidance. Shifting is
limited to the cross axis, so it does not intentionally overlap the anchor.
Available dimensions are nonnegative and remain available when flip/shift are
disabled. Custom boundaries cannot remove actual CSS clipping. Render outside a
clipping ancestor, or use a later overlay component's hosting mechanism, when
content needs to escape it.

## Geometry, styles, and arrows

Before measurement, `positioned` is false, requested side/align are available,
and coordinates, dimensions, arrow offsets, and transformOrigin are null.
An active but unmeasured wrapper is measurable, hidden, and noninteractive.
An inactive wrapper is owned by the caller and must be hidden or unmounted there.

The engine writes `position`, `left`, and `top`, rounded to device pixels. It
does not overwrite transform, z-index, overflow, max-width, or max-height.
The wrapper must have a stable measurable size, such as a CSS width or
`width: max-content`. Use border-box sizing when applying maximum dimensions.
Place scale/slide animations on a nested content element.

State is reflected by `data-side`, `data-align`, bare `data-positioned`, and
bare `data-reference-hidden`. CSS can consume:

- `--positioner-anchor-width`, `--positioner-anchor-height`
- `--positioner-available-width`, `--positioner-available-height`
- `--positioner-transform-origin`

For example, set the nested content's max-height to the available-height
variable and overflow to auto. Size variables are written during the guarded
measurement cycle so CSS-driven resizing is measured again before commitment.
`matchAnchorSize` writes the selected dimension and restores it when disabled.
Owned styles and attributes are restored on disposal, including original inline
priorities; unrelated author changes remain intact. Do not concurrently write
properties owned by an active positioner.

An arrow is a square HTML layout box inside the wrapper. Its inner artwork is
author-owned and can use `data-side` for orientation. The engine measures the
untransformed box, centers it toward the anchor, positions half its depth beyond
the nearest edge, hides it if it cannot stay centered, and sets aria-hidden,
role presentation, and pointer-events none. Reserve enough sideOffset for your
artwork. No hidden arrow node or built-in SVG is created when arrow is absent.
Removing or replacing an arrow clears stale state and restores its owned styles.

Transform origin follows the resolved placement and centered arrow, or the
logical aligned edge when no centered arrow exists. Its main-axis coordinate
includes the requested gap, so nested content can grow from the anchor.

## Lifecycle and virtual anchors

Both nodes must exist and be connected before the engine subscribes. Keep it
enabled while exit content remains present, then disable or dispose it. Anchor
identity changes reset readiness. Virtual anchors sharing a contextElement keep
their observation subscriptions while each calculation reads the newest rect.
A virtual anchor without contextElement needs explicit reposition calls for
external coordinate changes. Zero-sized virtual points, including the origin,
are valid anchors. Points beyond their clipping boundary are hidden normally.

`autoUpdate: false` still performs the initial calculation and explicit updates,
but installs no observers. An options object independently controls
ancestorScroll, ancestorResize, elementResize, layoutShift, and animationFrame.
Use animationFrame for anchors moving through transforms; it is off by default.
Element resize uses border-box observation of anchor, wrapper, arrow, clipping
ancestors, and explicit element boundaries, with
writes batched into the owning window's next animation frame. Scroll and layout
tracking use Floating UI. Disposal cancels scheduled work and ignores stale
observer callbacks, results, size writes, and automatic errors.

## Solid API

```tsx
import { createPositioner } from '@xenon-ui/solid/positioning'
import { createSignal } from 'solid-js'

const [anchor, setAnchor] = createSignal<HTMLElement>()
const [floating, setFloating] = createSignal<HTMLElement>()
const positioner = createPositioner({
  anchor,
  floating,
  enabled: () => present(),
  options: () => ({ side: 'bottom', align: 'start', sideOffset: 8 }),
})

// In the component's JSX:
<button ref={setAnchor}>Anchor</button>
<div ref={setFloating} class="positioner" {...positioner.positionerProps()}>
  <div class="popup">Content</div>
</div>
```

Call inside a Solid owner. Add an arrow accessor when needed and spread
`arrowProps()` onto it. The utility returns reactive `state()` and imperative
`reposition()`. Spread positionerProps reactively; it supplies initial visibility
for SSR and hydration without replacing the DOM engine's geometry styles.
Apply sizing through CSS classes. Refs and options update without recreating
subscriptions unnecessarily. Owner cleanup disposes the engine.

## Coverage and deferred choices

Real Chromium and WebKit tests cover all twelve placements, RTL offsets,
clipping and viewport boundaries, transformed/scaled ancestors, virtual anchors,
arrows, live scroll/resize, and CSS dimensions. Unit tests cover async races,
observer lifecycle, style restoration, and errors. Playwright verifies hidden
server output, hydration without node replacement, and moving transform anchors.
Desktop browser coverage does not establish physical mobile keyboard or
pinch-zoom behavior.

Pointer following, hovered-line selection, inline middleware, logical side
aliases, automatic most-space placement, overlapping shifts, and callback-valued
offsets wait for their consuming components. The engine already accepts virtual
rect providers, so those additions need not change its geometry contract.
Popover, Tooltip, Menu, and Select will compose this engine with the existing
layering and presence handles; they are not included in this engine pass.
