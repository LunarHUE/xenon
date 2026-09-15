# Toast implementation

Approved API: `Toast.Provider`, `Toast.createManager`, `Toast.useManager`,
`Toast.Portal`, `Toast.Viewport`, `Toast.Content`, `Toast.Title`,
`Toast.Description`, `Toast.Action`, and `Toast.Close`. Content is the individual
notification element. The manager owns a collection, not a trigger handle.

## Contract

- Provider defaults: duration 5000 milliseconds, visible limit 3. Explicit zero
  duration is persistent. Loading is persistent until updated to another type.
- Manager methods: add, update, dismiss, promise, success, error, info, warning,
  loading. Add and promise return string IDs. Dismiss without an ID closes all.
- Add with an existing ID updates that record and restarts its duration. A plain
  update preserves remaining time unless it explicitly supplies duration.
- Newest first. Limited notifications wait without consuming duration. Promotion
  restores the remaining duration. Exiting records remain for presence completion.
- Hover, focus, swipe, window blur, and hidden document are independent pause
  reasons. Clearing one reason cannot resume a timer while another still applies.
- Promise settlement updates its original live notification. Dismissal or a newer
  operation for the same ID invalidates stale settlement. Loading duration does
  not leak into success or failure defaults.
- Actions close by default; preventDefault or closeOnAction=false keeps them open.
- Low priority announces politely; high priority assertively. Type is independent
  of announcement urgency. Interactive content uses group semantics with title
  and description associations, separate from the announcement node.
- Alt+T focuses the viewport by default. Focus never moves on arrival. Escape is
  scoped to the focused notification. Closing a focused toast moves to a surviving
  toast or restores the prior external focus. Empty regions do not add tab stops.
- onDismiss runs once at the start of closure with its reason; onRemove runs once
  after presence finishes. Native author event cancellation is respected.
- CSS owns placement, colors, icons, animation durations, and easing. Measured
  heights, indices, offsets, expansion state, and swipe values make stacked and
  expanded presentations possible without library styles.

## Motion guidance

Emil Kowalski explains why Sonner retargets CSS transitions during rapid additions,
uses the front toast height for a collapsed stack, and sums individual heights
plus gaps when expanded. The example follows these patterns. Gestures capture the
pointer, apply resistance in disallowed directions, and retain the release offset
through dismissal. A short flick may dismiss if its recent velocity crosses the
threshold; reversal must not use an earlier fast segment. Gap coverage prevents
hover collapse while moving between expanded notifications. Reduced motion is
handled by the example stylesheet and presence completion.

Source: https://emilkowal.ski/ui/building-a-toast-component

## Slices

1. Pure lifecycle and collection helpers; Solid manager and deterministic tests.
2. Browser viewport interaction and swipe controllers with isolated tests.
3. Solid compound parts, announcements, presence, focus, and adapter tests.
4. Native Chromium/WebKit cases, SSR/hydration, and an example with transitions.
5. Public exports, TSDoc, coverage audit, and full verification.

Each slice receives focused commits. Tests adapted from upstream behavior use our
API and assertions; upstream framework plumbing is not copied.

## Source suites

- Base UI manager: https://github.com/mui/base-ui/blob/master/packages/react/src/toast/useToastManager.test.tsx
- Base UI external manager: https://github.com/mui/base-ui/blob/master/packages/react/src/toast/createToastManager.test.tsx
- Base UI store: https://github.com/mui/base-ui/blob/master/packages/react/src/toast/store.test.ts
- Base UI viewport: https://github.com/mui/base-ui/blob/master/packages/react/src/toast/viewport/ToastViewport.test.tsx
- Base UI root gestures: https://github.com/mui/base-ui/blob/master/packages/react/src/toast/root/ToastRoot.test.tsx
- Sonner browser interactions: https://github.com/emilkowalski/sonner/blob/main/test/tests/basic.spec.ts
- Existing synthesis: docs/spec/toast.md

## Deferred scope

Anchored notifications with Positioner and Arrow follow the stacked viewport.
Toast history is not part of the active notification collection. No styled Toaster
or library-global manager is introduced. Screen-reader announcement quality needs
manual assistive-technology testing beyond DOM assertions and axe.

## Verification

- Core: 255 passing tests.
- DOM: 195 passing tests.
- Solid: 343 passing tests, including manager, adapter, and server fixtures.
- Shared jsdom suite: 640 passing tests.
- Focused toast browser suite: 22 passing tests across Chromium and WebKit.
- Full browser suite: 1922 passing tests across Chromium and WebKit after modal routing changes. The final paused-state styling addition also passes the focused 22-test browser suite.
- Full end-to-end suite: 98 passing tests across Chromium and WebKit.
- Workspace typecheck and lint, formatting, and public subpath/tree-shaking builds pass.
- Public TSDoc member audit reports no missing documentation in core, DOM, or Solid;
  local documentation-link checks report no unresolved references.

The existing Select SSR fixture still prints its server-write warning, and some
Tooltip adapter tests print reactive-read diagnostics. Neither produces an
unhandled exception or failing test. Toast's dedicated server fixture and the
hydrated browser fixture report no such diagnostics.

The [coverage audit](toast-coverage.md) maps all 103 source IDs individually.
Partial and deferred entries are explicitly retained; these totals do not imply
that every upstream edge case or assistive-technology combination is covered.

## Modal integration

Native modal inertness cannot be overridden by z-index or a pointer exemption.
Toast.Portal keeps one host and moves it into the active modal content using
subscribeModalContent, then back to its prior destination after dismissal. This
also keeps notification controls inside the modal's focus scope. Pointer-only
exclusions prevent notification interactions from dismissing unrelated overlays.
Explicit portal containers opt out of automatic routing and must be chosen with
native modality in mind. The browser regression verifies retained nodes, working
controls, and return to the page after the dialog closes.

## Rendering and remaining scope

Use one Viewport for each manager. Rendering the same collection into multiple
Viewports intentionally duplicates the consumer's loop and is not an exactly-once
routing mechanism. Create separate managers for independent notification regions.
The default Alt+T shortcut is configurable. Label props accept translated strings;
no locale-bundle provider is introduced in this slice.

Natural-height measurement excludes CSS transforms, and exits retain their last
stack coordinates while survivors reflow. The example uses interruptible CSS
transitions, gap coverage, starting-style, and a reduced-motion override. The
native regression also re-adds an exiting record and verifies DOM identity.

