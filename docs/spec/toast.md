## toast

### Roles and attributes

- [ ] `toast.roles.1` Given a toast region holding at least one toast, when the region element is queried, then it exposes `role="region"`. [react-aria, zag, kobalte]
- [ ] `toast.roles.2` Given a toast region, when it is inspected, then it carries `tabindex="-1"`, so a hotkey can focus it while it stays out of the natural tab order. [radix, zag]
- [ ] `toast.roles.3` Given a toast with a title part, when it renders, then the toast's `aria-labelledby` points at the title's id, the attribute is absent when the toast has no title, and it follows the title when one title element replaces another. [react-aria, base-ui, zag, kobalte]
- [ ] `toast.roles.4` Given a toast with a description part, when it renders, then `aria-describedby` points at the description's id and is absent when the toast has no description. [react-aria, base-ui, zag, kobalte]
- [ ] `toast.roles.5` Given a toast, when it renders, then its root carries `tabindex="0"`, so Tab from the region can reach the toast itself and not only its controls. [zag, reka]
- [ ] `toast.roles.6` Given a toast with a close control, when the control renders, then it is `type="button"` and carries a localized accessible label such as "Close". [react-aria, radix, zag]
- [ ] `toast.roles.7` Given an author-supplied `aria-label` on the region, when it renders, then that label replaces the default one, and a `{hotkey}` placeholder inside it is interpolated to the region hotkey. [react-aria, kobalte]
- [ ] `toast.roles.8` Given a toast added with a title and a description, when it appears, then a live region outside the toast announces the title and the description as plain text, rendered in `document.body` by default or in an author-supplied announcer container, and that announcement node is removed about 1000ms later. [radix, reka]
- [ ] `toast.roles.9` Divergence: the toast root is `role="status"` with `aria-atomic="true"`, so a screen reader reads the whole toast rather than only the part that changed. (decision needed) [zag, kobalte]
- [ ] `toast.roles.10` Divergence: the toast root is `role="alertdialog"` with `aria-modal="false"` and wraps a nested `role="alert"` element with `aria-atomic="true"` that carries the announcement, so both roles are present and both leave the document when the toast closes. (decision needed) [react-aria, base-ui]
- [ ] `toast.roles.11` Given a region, when it renders, then it carries `aria-live="polite"`, `aria-relevant="additions text"` and `aria-atomic="false"`, so an added toast is announced without re-reading the whole stack. (candidate) [zag]
- [ ] `toast.roles.12` Given a toast shown with `priority: "high"`, when it renders, then it carries `aria-live="assertive"`, and a toast shown with `priority: "low"` carries `aria-live="polite"`. (candidate) [kobalte]
- [ ] `toast.roles.13` Given a toast added with `priority: "high"`, when it renders, then a `role="alert"` element exists alongside it, and no `role="alert"` element remains once the toast is closed. (candidate) [base-ui]
- [ ] `toast.roles.14` Given a toast with a variant such as `variant="positive"`, when it renders, then its icon has `role="img"` with a localized label naming the variant, for example "Success". (candidate) [react-aria]
- [ ] `toast.roles.15` Given a region, when it renders, then it also renders hit-area padding elements marked `data-ghost="before"` and `data-ghost="after"`, so the pointer can travel between toasts without leaving the region. (candidate) [zag]

### Keyboard

- [ ] `toast.keyboard.1` Given a toast with focus inside it, when Escape is pressed, then that toast closes and the other open toasts stay open. [radix, base-ui, zag, reka]
- [ ] `toast.keyboard.2` Given a focused region with two toasts, when Tab is pressed, then focus moves to the newest toast first, then through that toast's controls, then to the next older toast and its controls, and Shift+Tab walks the exact reverse order back out of the region. [react-aria, radix, base-ui]
- [ ] `toast.keyboard.3` Given the region focused by its hotkey from a trigger button, when Shift+Tab is pressed on the first toast, or Tab is pressed past the last control of the last toast, then focus returns to the element that was focused before the hotkey. [radix, base-ui]
- [ ] `toast.keyboard.4` Divergence: the region hotkey is F6, and pressing it from outside the region moves focus to the region element. (decision needed) [react-aria, base-ui]
- [ ] `toast.keyboard.5` Divergence: the region hotkey is F8. (decision needed) [radix]
- [ ] `toast.keyboard.6` Divergence: the region hotkey is Alt+T, and pressing it focuses the region, pauses every toast and expands the stack. (decision needed) [zag, kobalte]
- [ ] `toast.keyboard.7` Given three open toasts and focus outside every one of them, when Escape is pressed on `document.body`, then only the topmost, most recent toast closes. (candidate) [radix]
- [ ] `toast.keyboard.8` Given a toast whose content includes a button rendered through a portal, so the button is inside the toast in the framework tree but outside it in the DOM, when Escape is pressed with that button focused, then the toast stays open. (candidate) [base-ui]
- [ ] `toast.keyboard.9` Given focus on a toast's close control, when Enter is pressed, then the toast is dismissed. (candidate) [react-aria]

### Pointer

- [ ] `toast.pointer.1` Given a toast with a close control, when the control is clicked, then the toast and its announcement leave the document. [react-aria, base-ui, zag, ark, kobalte, reka]
- [ ] `toast.pointer.2` Given a toast with the default 5000ms dismiss timer, when the pointer enters the toast or the region partway through, then the timer pauses and the toast is still present well past 5000ms; when the pointer leaves, then the timer resumes for the time that was left rather than restarting, so the toast is removed after the remaining delay elapses. [react-aria, base-ui, kobalte]
- [ ] `toast.pointer.3` Given a stack of toasts, when the pointer enters the region, then the stack expands, marked `data-expanded` on the region in base-ui and `data-stack` on each toast in zag, and when the pointer leaves it collapses again, marked `data-overlap` in zag. [base-ui, zag]
- [ ] `toast.pointer.4` Given three toasts in a region, when the pointer enters the region, then every toast in the stack reports `data-paused=""`, and when the pointer leaves they all resume and eventually dismiss. (candidate) [zag]
- [ ] `toast.pointer.5` Given a region with no toasts, when it renders, then it has `pointer-events: none`, so it never blocks clicks on the page beneath it. (candidate) [kobalte]
- [ ] `toast.pointer.6` Given a toast with a swipe direction, when the pointer drags it 45px in that direction, past the 40px dismiss threshold, then the toast is removed, and when it drags only 5px or 10px the toast stays mounted. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.7` Given a toast with a swipe direction, when the pointer drags 50px in a direction that is not allowed, then the toast stays mounted, and when several directions are allowed a drag past the threshold in any one of them dismisses it. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.8` Given a toast that allows two perpendicular swipe directions, when the first pointer move after pointerdown is diagonal, then the gesture locks to one axis and the movement on the other axis stays at `0px` for the rest of the drag. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.9` Given a swipe that has already passed 40px and armed its direction, when the pointer reverses by 40px and releases, then the toast stays mounted, the armed direction is cleared and the reported swipe movement is back to `0px`, because the cancel baseline moves to the turning point. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.10` Given a toast with a swipe direction, when pointerdown fires with a non-primary button, then no swipe starts and a 100px drag leaves the toast mounted. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.11` Given a toast containing a child marked with the swipe-ignore attribute, when pointerdown fires on that child, then no swipe starts. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.12` Given a toast anchored to an element, when the pointer swipes it 45px past the threshold, then the toast stays mounted, because swipe gestures do not apply to anchored toasts. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.13` Given a toast with a swipe direction, when a touch swipe is in progress, then a cancelable `touchmove` is prevented, and before the swipe starts or after it is canceled `touchmove` is not prevented. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.14` Given a swipe dragged far in the damped, non-dismissing direction, when the pointerup or pointercancel lands on `document` rather than the toast, then the toast clears its swiping state, its armed direction, its swipe movement values and its inline transition and transform, and a following swipe in an allowed direction still dismisses it. (candidate) [base-ui]
- [ ] `toast.pointer.15` Given a touch swipe in progress on a toast, when `mouseleave` fires on the region, then the region stays expanded for the duration of the swipe and only collapses after pointerup or pointercancel. (candidate) (browser-only) [base-ui]
- [ ] `toast.pointer.16` Given a hovered region with its timers paused, when a touch pointerdown lands outside the region, then the region collapses and the timers resume, while a mouse pointerdown outside leaves the region expanded and the timers paused, because a mouse press outside is followed by `mouseleave`. (candidate) [base-ui]
- [ ] `toast.pointer.17` Given four expanded toasts, when the third toast's close control is hovered and clicked, then the surviving toasts are still expanded one frame later rather than collapsing mid-interaction. (candidate) [zag]

### Focus management

- [ ] `toast.focus.1` Given a toast with a 5000ms dismiss timer, when focus enters the region or any control inside a toast partway through, then the timer pauses and the toast is still present well past 5000ms; when focus leaves, then the timer resumes for the time that was left. [react-aria, base-ui, kobalte]
- [ ] `toast.focus.2` Given a toast opened from a trigger button and no other toast in the region, when the toast is dismissed, then focus is restored to the trigger button. [react-aria, base-ui]
- [ ] `toast.focus.3` Given two toasts with focus inside the newest one, when that toast is closed, then focus moves to the next remaining toast itself rather than back to the trigger, and that toast reports `data-focused="true"`; closing the last remaining toast then returns focus to the trigger. [react-aria, base-ui]
- [ ] `toast.focus.4` Divergence: pausing the dismiss timer on focus is opt-in and only happens when the region sets `pauseOnInteraction`. (decision needed) [kobalte]
- [ ] `toast.focus.5` Divergence: pausing the dismiss timer on focus is always on and has no opt-out. (decision needed) [react-aria, base-ui]
- [ ] `toast.focus.6` Given a toast that is still mounted in its exit animation next to an active toast, when focus moves into the region, then the active toast receives focus and the toast animating out is skipped. (candidate) [base-ui]
- [ ] `toast.focus.7` Given a region where no toast can take focus, because the limit is 0 or every toast has just been closed, when focus would move into the region, then focus returns to the element that opened the toasts. (candidate) [base-ui]
- [ ] `toast.focus.8` Given toasts that are closed while focus never entered the region, when they are removed, then focus is left untouched on whatever element held it. (candidate) [base-ui]
- [ ] `toast.focus.9` Given the region focused by its hotkey while the previously focused element was itself inside the region, when Shift+Tab leaves the region element, then focus lands back on that inner element and the timers stay paused, because focus never left the region. (candidate) [base-ui]
- [ ] `toast.focus.10` Given an empty region between two focusable elements, when Tab and Shift+Tab are pressed, then focus moves straight between those two elements, so an empty region does not interrupt the document tab order. (candidate) [radix]
- [ ] `toast.focus.11` Given a single-visible region with a second toast queued, when the visible toast is dismissed, then the queued toast renders and takes focus itself. (candidate) [react-aria]

### State

- [ ] `toast.state.1` Given a toast with a dismiss timer, when the timer elapses with no user action, then the toast is removed from the document. [react-aria, base-ui, zag, ark, kobalte]
- [ ] `toast.state.2` Given a region with no explicit timeout, when a toast is added, then it auto-dismisses after the default 5000ms. [react-aria, base-ui]
- [ ] `toast.state.3` Given a region with its own duration and a toast added with a different one, when the toast's duration elapses, then the toast dismisses, so a per-toast duration overrides the region's. [base-ui, kobalte]
- [ ] `toast.state.4` Given a toast added as persistent or with a timeout of 0, when far more than the region's duration elapses, then the toast is still in the document. [base-ui, kobalte]
- [ ] `toast.state.5` Given a toast, when it is closed imperatively by its id, then it is removed, and when close is called with no id then every toast is removed. [react-aria, base-ui, zag, kobalte]
- [ ] `toast.state.6` Given a toast rendering some content, when it is updated by id, then the same toast element's content changes in place and no second toast appears. [base-ui, kobalte]
- [ ] `toast.state.7` Given a region with a limit of n and more than n toasts added, when they render, then only n toasts are rendered and the overflow is queued, with the newest toast kept and the oldest marked as limited. [react-aria, base-ui, kobalte]
- [ ] `toast.state.8` Given a region at its limit, when a rendered toast is dismissed, then it frees its slot and the next queued toast is promoted into view. [react-aria, base-ui, kobalte]
- [ ] `toast.state.9` Given several visible toasts, when they render, then they are ordered newest first, and closing one in the middle leaves the relative order of the rest unchanged. [react-aria, base-ui]
- [ ] `toast.state.10` Given a promise-backed toast, when the promise is pending the toast shows its loading content, when it resolves the same toast shows the success content with the resolved value available to the success renderer, and when it rejects the same toast shows the error content with the error available. [base-ui, kobalte]
- [ ] `toast.state.11` Given two regions or providers on the page, when a toast is added to one of them and updated there, then only that region's toast changes and toasts route to the region they were addressed to. [base-ui, kobalte]
- [ ] `toast.state.12` Given a toast added with an id and a 1000ms timeout, when 900ms have elapsed and the same id is added again, then only one toast exists, its content is the new content, and the timer restarts from the full 1000ms rather than resuming the leftover 100ms. (candidate) [base-ui]
- [ ] `toast.state.13` Given a toast with 900ms of a 1000ms timeout elapsed, when it is updated with the same timeout value, then the timer restarts, and the same holds when a toast is updated from a timeout of 0 to a positive value and then updated again with that same value. (candidate) [base-ui]
- [ ] `toast.state.14` Given a toast added with a loading type, which never auto-dismisses, when it is updated to a non-loading type with a 1000ms timeout, then the content changes and the toast is removed 1000ms later, and a second update in the same handler does not clear the timer the first one scheduled. (candidate) [base-ui]
- [ ] `toast.state.15` Given a promise toast whose loading state set a timeout of 0, when the promise resolves and the success state specifies no timeout of its own, then the success state uses the default 5000ms instead of inheriting 0, and a per-state timeout of 2000ms or 3000ms is honored exactly when one is given. (candidate) [base-ui]
- [ ] `toast.state.16` Given a pending promise toast, when it is dismissed by its close control and the promise then settles, then the toast does not reappear. (candidate) [base-ui]
- [ ] `toast.state.17` Given a region whose timeout prop changes, when a toast is added after the change, then the new timeout applies to it, and a limit that changes recomputes which toasts are limited in both directions. (candidate) [base-ui]
- [ ] `toast.state.18` Given a toast that has been upserted while it was limited, when it renders, then it keeps its limited state rather than jumping the queue. (candidate) [base-ui]
- [ ] `toast.state.19` Given a single-visible region where three toasts were added, when each is added then only the newest is visible and the earlier ones sit in a queue, and closing a queued toast by key leaves the visible toast untouched. (candidate) [react-aria]
- [ ] `toast.state.20` Given three visible toasts where only the middle one has a 1000ms timer, when that timer elapses, then the middle toast is removed even though it is not the oldest, and the other two stay. (candidate) [react-aria]
- [ ] `toast.state.21` Given a toast with a 5000ms timer, when the window fires `blur`, then the timer pauses, and when the window fires `focus` again the remaining 4000ms resumes, so the toast dismisses 4000ms after the window regains focus. (candidate) [base-ui]
- [ ] `toast.state.22` Given a toast whose timer was paused by window blur, when the pointer leaves the toast or focus leaves the region while the window is still blurred, then the timer stays paused and the toast survives a further 10000ms. (candidate) [base-ui]
- [ ] `toast.state.23` Given a toast with a 5000ms timer, when it is paused and resumed repeatedly, then the elapsed active time accumulates and the pauses never extend the remaining time, so 2000ms of hovering consumed leaves exactly 3000ms to run. (candidate) [base-ui]
- [ ] `toast.state.24` Given a toast whose scheduled timeout never ran because the tab was throttled and the clock jumped past it, when the timers are paused and resumed, then the full delay restarts rather than firing immediately. (candidate) [base-ui]
- [ ] `toast.state.25` Given several toasts, when a Pause All control is used, then every toast reports paused, and a Resume All control lets them all finish and disappear. (candidate) [zag]
- [ ] `toast.state.26` Given a toast with an action control, when the action is clicked, then the action handler fires once and the toast is not dismissed unless it was configured to close on action, in which case the close handler fires once and the toast is removed. (candidate) [react-aria]

### Dismissal and layering

- [ ] `toast.dismissal.1` Given an open dialog and a toast rendered outside it, when the toast's close control is clicked, then only the toast is removed and the dialog stays open, so a press inside a toast is not an outside press for other layers. (candidate) [zag]
- [ ] `toast.dismissal.2` Given an open modal dialog, when a normal-priority toast is added from inside it, then the toast renders with its title and description readable rather than hidden by the dialog's treatment of its siblings. (candidate) [base-ui]
- [ ] `toast.dismissal.3` Given an open modal dialog, when a high-priority toast is added from inside it, then the toast root itself is `aria-hidden="true"` while a `role="alert"` live region still announces it. (candidate) [base-ui]
- [ ] `toast.dismissal.4` Given a region rendered through a portal container supplied by the application, when a toast is added, then it renders inside that container rather than at the default portal location. (candidate) [react-aria]
- [ ] `toast.dismissal.5` Given several region containers mounted at once over a shared queue, when a toast is triggered and the containers are remounted in different combinations, then exactly one region and one announcement are rendered at any time. (candidate) [react-aria]

### Positioning

- [ ] `toast.positioning.1` Given a stack of toasts, when they render, then the frontmost toast is marked differently from the ones behind it, with index 0 and no behind marker on the front toast in base-ui and `data-first` against `data-sibling` in zag. [base-ui, zag]
- [ ] `toast.positioning.2` Given a stack of toasts, when they render, then the region and each toast expose the measured geometry as CSS custom properties, including the gap, the frontmost toast's height, the viewport offsets, and each toast's own index, offset and height. [base-ui, zag]
- [ ] `toast.positioning.3` Given a toast whose content grows after an update, when the new content is measured, then the toast's height custom property increases above its earlier value. (candidate) (browser-only) [base-ui]
- [ ] `toast.positioning.4` Given a toast anchored to an element with a side of bottom and an offset of 8px, when it renders, then its positioner reports `data-side="bottom"` and sits 8px below the anchor's bottom edge. (candidate) (browser-only) [base-ui]
- [ ] `toast.positioning.5` Given a toast with no anchor, when it renders, then its positioner falls back to the region with the defaults `data-side="top"` and `data-align="center"`, and a side or align set on the positioner element wins over the one carried on the toast while the unset one still comes from the toast. (candidate) [base-ui]
- [ ] `toast.positioning.6` Given an arrow inside an anchored toast's positioner, when it renders, then it reports the resolved side and is `aria-hidden="true"`. (candidate) (browser-only) [base-ui]
- [ ] `toast.positioning.7` Given a region placed at the top or at the bottom of the viewport, when its toasts render, then the sign and lift custom properties flip by placement so one set of animations works for both. (candidate) [zag]

### Animation and presence

- [ ] `toast.animation.1` Given a toast with an exit animation, when it is closed, then it stays mounted in an ending state until the animation finishes and is removed only then, while the remaining toasts reflow around it. (candidate) [base-ui]
- [ ] `toast.animation.2` Given two toasts where the frontmost is closed, when it starts animating out, then it keeps its real stack index rather than collapsing to an out-of-stack value, and the toast behind it becomes index 0. (candidate) [base-ui]
- [ ] `toast.animation.3` Given a toast that is still animating out, when the same id is added again, then the same element is reused, it never enters the starting state, its measured height is restored, any armed swipe state and swipe movement are cleared, and it returns to the front of the stack with the other toasts keeping their own positions. (candidate) (browser-only) [base-ui]
- [ ] `toast.animation.4` Given toasts rendered in an index-keyed list where a swiped element gets reused for a different toast, when a new toast shifts the keys, then the reused element has no leftover swipe direction, no ending state and zero swipe movement. (candidate) (browser-only) [base-ui]

### RTL and i18n

- [ ] `toast.rtl.1` Given a locale provider around the region, when the region and its toasts render with no author-supplied labels, then the region's default label and the close control's label come from the locale bundle, and the default region label names notifications and interpolates the region hotkey, for example "Notifications (alt+T)" in kobalte and "Notifications (F8)" in radix, while react-aria uses a localized count such as "1 notification." instead. [react-aria, radix, zag, kobalte]

### SSR and hydration

- [ ] `toast.ssr.1` Given a provider and a region with no toasts queued, when the tree is server-rendered and hydrated, then it renders without throwing. (candidate) [react-aria]

### Accessibility tooling

- [ ] `toast.a11y.1` Given the page before any toast is open and again with one or more toasts open, when axe-core analyzes it both times, then it reports zero violations in either state. [radix, ark, reka]

### Notes and edge cases

- [ ] `toast.notes.1` Given a region whose duration has not yet elapsed, when the tree unmounts, then the pending dismiss timer is cleared, and advancing the clock past the original duration afterwards throws nothing. (candidate) [radix]
- [ ] `toast.notes.2` Given a region rendered into another document, such as an iframe, when a toast is added, then its keydown, blur, focus and pointerdown listeners are bound to that document and window, the region hotkey pressed there focuses it, and the listeners are removed and rebound exactly once each time the queue empties and fills again. (candidate) [base-ui]
- [ ] `toast.notes.3` Given a list that recreates its toast objects on every render, so no toast keeps its object identity, when the toasts render, then every one still reports a valid stack index and its close control still removes the right toast, because lookups are by id. (candidate) [base-ui]
- [ ] `toast.notes.4` Given an active toast whose root element is unmounted and remounted, when it renders again, then a brand-new element is created without entering the starting state, its height is measured again, and the region hotkey followed by Tab can focus it. (candidate) [base-ui]
- [ ] `toast.notes.5` Given toasts with close and remove callbacks, when one is closed, then each callback fires exactly once, closing a toast that is already in its ending state does not fire them again, and replacing an ending toast with a re-add under the same id defers the remove callback to the replacement's own removal. (candidate) [base-ui]
- [ ] `toast.notes.6` Given a toast whose content observer reports a new height while the toast is animating out, when that height is written, then the toast stays in its ending state and its height is forced to 0, so the exit still completes and the toast is removed. (candidate) [base-ui]
- [ ] `toast.notes.7` Given a region whose timers were paused, when the last timed toast is closed, becomes untimed, or every toast is closed, and a new timed toast is then added and paused again, then the new toast's timer really is paused and it survives twice its timeout. (candidate) [base-ui]

## Sources

- `docs/research/kobalte-and-corvu.md`, section `toast`
- `docs/research/radix-and-base-ui.md`, section `toast`
- `docs/research/react-aria-a.md`, section `toast`
- `docs/research/reka-melt-bits.md`, section `toast`
- `docs/research/zag-and-ark.md`, section `toast`

## Deferred

- No APG or axe research section was read for this component, so no bullet here is normative. The region and toast roles, the live-region politeness and the hotkey all rest on library agreement alone, which is why three of them are recorded as divergences.
- No source tests `role="log"` on a toast, so the spec covers only `role="status"`, `role="alert"` and `role="alertdialog"`. If we want a log-style region for a transcript of past toasts, it needs its own research.
- No source tests a swipe velocity threshold. Only the 40px distance threshold, the direction filter and the axis lock are covered. A fast flick below 40px is unspecified.
- No source tests `visibilitychange`. Pausing on a hidden document is covered only indirectly, by the base-ui case where the clock jumped past the timeout in a throttled background tab.
- No source tests arrow-key navigation between toasts. Every library moves between toasts with Tab and Shift+Tab only, so the spec has no arrow bullets.
- Dropped as library-internal API shape: prop spreading and `asChild` or `render` forwarding for every part, ref identity and stability, the `describeConformance` runs, `isRenderableNode` and `hasRenderableChildren` unit tests, the `ToastStore` selector and custom-data tests, the type-only specs for `useToastManager` and `createToastManager`, the anatomy part list, and the missing-context error messages. Where a cluster of these encoded a real rule it is kept once, as `toast.notes.3` for id-based lookup, `toast.notes.6` for height writes during exit and `toast.notes.7` for re-pausing timers.
- Dropped as framework-specific: react-aria's `react-spectrum-toast` window event with `preventDefault` suppression, kobalte's module-level singleton toaster and its `clear()` reset hook, and reka's listener-teardown assertion. The first is a host-application escape hatch rather than a DOM behavior; the last two are test plumbing.
- kobalte's toast suite has every "the toast goes away" assertion commented out because of an unresolved `solid-presence` problem, and three tests skipped in CI for fake-timer flakiness. Its evidence therefore supports the pause and persistence bullets but not the dismissal ones, which lean on base-ui, radix, react-aria and zag instead.
- Unresolved: the default region label. All four libraries localize it, but kobalte, radix and zag name notifications and interpolate the hotkey while react-aria uses a live count of visible toasts. `toast.rtl.1` records all of them as one bullet rather than a divergence pair, because the disagreement is over the string, not over the behavior. We still have to pick a string.
