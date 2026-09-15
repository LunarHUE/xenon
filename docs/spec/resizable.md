# Resizable

`Resizable`, `Resizable.Panel`, and `Resizable.Handle` implement a headless split
layout. `orientation` names the panel flow axis. A horizontal layout has vertical
separators. Panels use explicit, stable, contiguous zero-based indices; handle
index `i` transfers size between panels `i` and `i + 1` only.

## Values and constraints

`sizes`, `defaultSizes`, `onSizesChange`, and `onSizesCommit` use percentage arrays
summing to 100. Percentages describe available panel space after handle widths and
layout gaps. Two equal panels are the default. Client registration infers larger
counts. For server rendering, pass `panelCount` or a sizes/defaultSizes array to
establish the count before siblings serialize. The server finalizes attributes and
panel styles after synchronous siblings register. Constraints introduced only after
an asynchronous streaming boundary cannot update markup already sent.

Each panel accepts `minSize`, default 0, and `maxSize`, default 100. Constraints
must be finite, ordered, in 0 through 100, and admit an expanded layout totaling
100. Infeasible constraints render equal sizes and disable handles. Invalid size
arrays, including incorrect length, nonfinite entries, incorrect totals, and
out-of-bounds values, silently use equal sizes clamped into the constraints with
remaining space distributed in index order. Mount and normalization never emit
callbacks. Duplicate or invalid panel indices throw. Missing indices reserve a
slot with default constraints; applications should render contiguous indices.

`undefined` selects uncontrolled state. Controlled owners remain authoritative;
callbacks request changes without mutating their arrays. Different requests emit
change callbacks. Key release or blur commits the latest pending keyboard request
once. Pointer release commits once. Cancellation and disposal retain the current
size but emit no commit. A controlled owner may reject a proposed size; commit
reports the final proposal. Bound no-ops emit neither callback.

## Interaction and semantics

A handle is a focusable `role="separator"` with the primary panel's actual ID in
`aria-controls`, current percentage in `aria-valuenow`, and adjacent constrained
bounds in `aria-valuemin` and `aria-valuemax`. A panel's `aria-label` or
`aria-labelledby` names its handle unless the author supplies a handle name.
Authors must name handles. IDs are generated only by the adapter.

Horizontal Left/Right and vertical Up/Down move one percentage point. RTL reverses
horizontal keys and pointer displacement. Shift uses ten points. `step` and
`largeStep` customize those increments. Home and End reach expanded adjacent bounds.
Unrelated axes and Alt/Ctrl/Meta shortcuts remain unclaimed.

A `collapsible` primary panel supports Enter to zero when its neighbor can absorb
its space. Enter again restores its prior expanded size, clamped to current bounds.
A panel initially at zero restores toward equal allocation. Collapse is explicitly
keyboard-triggered; dragging and Home use expanded minima. Collapsed panels are
inert. The supported collapsed size is zero. Global feasibility requires an
expanded layout even when a panel is currently collapsed.

Primary mouse, pen and touch pointers resize from captured geometry. Other pointers,
secondary buttons and Ctrl starts are ignored. Pointer capture and document listeners
keep the gesture active outside the handle. A missing mouse button, cancellation,
lost capture, window blur, configuration change or disposal clears the gesture.
Selection suppression is restored without overwriting later author style changes.
Touch scrolling is prevented by handle `touch-action: none`; document scroll styles
are not modified. Pointerdown retains native browser focus. User handlers run first
and `preventDefault()` vetoes the corresponding library action.

## Styling and scope

The root supplies flex direction. Panels supply flex weights, zero minimum dimensions,
overflow clipping and `--resizable-panel-size`. Handles supply fixed flex behavior
and touch action. Author styles win. No colors, spacing, handle hit area, cursor or
visual treatment are included. Authors must give handles a usable hit area and the
root a definite size on its axis. Panels and handles must be direct flex children.

The implementation follows the supported behavior described by the
[APG Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/).
That pattern's example remains incomplete; these tests do not claim complete APG
or assistive-technology conformance. Pixel constraints, cascading transfers,
persistence, imperative sizing, and F6 pane navigation are outside this alpha.
