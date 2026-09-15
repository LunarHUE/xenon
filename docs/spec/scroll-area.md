# Scroll area

`ScrollArea` keeps scrolling on a native overflow container. Supply
`ScrollArea.Viewport` with an accessible name and bounded dimensions, then put
scrollable content in `ScrollArea.Content`. The content wrapper allows later
content-size changes to update custom thumb geometry. Native viewport wheel and
keyboard behavior stays browser-owned.

Custom `Scrollbar`, `Thumb`, and `Corner` parts are optional. A Scrollbar defaults
to vertical; set `orientation="horizontal"` for the horizontal axis. Give tracks
a cross-axis thickness and style thumbs as needed. The adapter supplies
positioning, thumb dimensions and translation. Put track padding on an outer
wrapper; geometry uses the track's client dimensions.

The viewport is a named region with a tab stop when either axis overflows.
Custom tracks are named scrollbar widgets linked to the viewport through
`aria-controls`, including an updated author viewport ID. Their range is 0..100.
A vertical track relies on the role's default orientation. Horizontal offsets,
thumb movement and arrow keys follow physical left/right coordinates in RTL.

Track clicks center the thumb at the pointer. Thumb dragging retains its grab
point. Custom-track Arrow keys move 40 CSS pixels, Page keys move a viewport,
and Home/End reach physical range boundaries. A custom track accepts wheel input
while the viewport retains native scrolling. Native scrollbars are hidden only
when every overflowing axis has a corresponding custom control.

`type` defaults to `auto`. `auto` shows overflowing tracks, `always` also shows
tracks without overflow, and `hover`/`scroll` provide interaction visibility.
`scrollHideDelay` defaults to 600ms. The alpha browser cases below exercise auto;
visibility-policy timing is outside their passing coverage.

## Verified alpha checks

These checks pass in Chromium and WebKit using real element dimensions,
ResizeObserver, native keyboard input, and Playwright-backed mouse/wheel input.
Only the final cancellation/disposal check dispatches synthetic pointer events.

- [x] `scroll-area.alpha.1` A viewport without custom tracks retains native
  scrollbars, receives Tab focus, scrolls through ArrowDown and wheel, and passes
  the suite's axe scan.
- [x] `scroll-area.alpha.2` A native thumb drag moves the viewport and thumb,
  focuses the track, releases dragging/selection state, and a track-end click
  reaches the final scroll offset and ARIA value.
- [x] `scroll-area.alpha.3` A custom vertical scrollbar handles ArrowDown,
  PageDown, End, Home and wheel input; updates aria-controls after an author ID
  change; and passes the suite's axe scan.
- [x] `scroll-area.alpha.4` A horizontal RTL thumb aligns within the physical
  right edge initially and left edge after Home; ArrowRight and End update the
  native negative scrollLeft model and ARIA value consistently.
- [x] `scroll-area.alpha.5` Both custom tracks reserve a measured corner. Content
  and viewport resizing update proportional thumb geometry without replacing
  hosts. Fitting content hides auto tracks/corner and removes viewport tabindex.
- [x] `scroll-area.alpha.6` If an overflowing horizontal axis lacks a custom
  track, the native scrollbar option remains and native horizontal wheel scrolls.
- [x] `scroll-area.alpha.7` Synthetic touch-pointer input accepts only the active
  pointer. Cancellation and unmount restore selection, snap and smooth-scroll
  styles; subsequent synthetic pointer events cannot move the removed viewport.

The suite excludes axe color-contrast and region coverage. These scans do not
prove overall accessibility. Native touch gestures, screen-reader speech,
hydration, hover/scroll timing, nested wheel chaining, and forced-colors appearance
are not claimed by these browser checks.
