The overlay primitives every overlay component composes: outside interaction,
Escape, focus containment and restoration, hiding the rest of the page,
scroll locking, portals, and the order nested layers unwind in. Component
files (dialog, drawer, popover, tooltip, hover-card, menu, select) assert the
component-visible consequences and point here for the primitive contract.

Geometry lives in `positioning.md`.

## dismissable-layer

### Roles and attributes

- [ ] `dismissable-layer.roles.1` Given a pointer-blocking layer on the stack, when it registers, then `document.body` gets inline `pointer-events: none` and a `data-inert` attribute, and both are reverted to the original inline value when no pointer-blocking layer remains, dropping the `style` attribute entirely if it ends up empty. [zag, corvu, reka]
- [ ] `dismissable-layer.roles.2` Given a layer that disables outside pointer events, when it renders, then its own element carries an inline `pointer-events: auto` merged with the author's inline style, so the layer stays interactive while the rest of the page does not. (candidate) [radix]
- [ ] `dismissable-layer.roles.3` Given a layer on the stack, when the stack syncs, then the layer node carries `--layer-index` set to its zero-based position and `--nested-layer-count` set to the number of nested layers of its own type. (candidate) [zag]
- [ ] `dismissable-layer.roles.4` Given a layer with a parent layer of the same type, when the stack syncs, then it carries `data-nested="<type>"`, and a layer with at least one nested layer of its own type carries `data-has-nested="<type>"`; stale values are removed before recomputing. (candidate) [zag]
- [ ] `dismissable-layer.roles.5` Given extra style targets such as a backdrop and a positioner registered alongside the content node, when the stack syncs, then each mirrors `--layer-index`, `--nested-layer-count`, `data-nested` and `data-has-nested`, plus a `--z-index` copied from the primary node's computed `z-index`, and a target that is the layer node itself is skipped. (candidate) [zag]
- [ ] `dismissable-layer.roles.6` Given a layer below the topmost pointer-blocking layer, when the stack syncs, then that node's own inline `pointer-events` is `none` and `auto` otherwise, and a per-node `MutationObserver` filtered to `style` re-asserts the value if anything else rewrites it. (candidate) [zag]
- [ ] `dismissable-layer.roles.7` Given `persistentElements` such as a toast region, when a pointer-blocking layer is active, then those elements are pinned to `pointer-events: auto` so they stay clickable through the block. (candidate) [zag]
- [ ] `dismissable-layer.roles.8` Given a non-Element target such as `document` or a text node, when the layer registry is asked whether the target is inside a layer, then it answers false without throwing. (candidate) [reka]

### Keyboard

- [ ] `dismissable-layer.keyboard.1` Given an open layer, when `keydown` with key `Escape` is dispatched on the document, then the layer emits its escape event once and dismisses once. [radix, base-ui, zag, kobalte, corvu, reka, melt]
- [ ] `dismissable-layer.keyboard.2` Given a layer whose escape handler calls `preventDefault()`, when Escape is dispatched, then the escape event still fires and no dismissal happens. [radix, base-ui, zag, corvu, reka]
- [ ] `dismissable-layer.keyboard.3` Given Escape dismisses a layer, then the layer calls `preventDefault()` on the `keydown` itself before dismissing, and skips that call when the dismissal was cancelled. [base-ui, zag]
- [ ] `dismissable-layer.keyboard.4` Given a focused field inside an open layer in IME composition, when `compositionstart` is followed by Escape, then the layer does not close, not even after the post-`compositionend` `setTimeout(0)` tick Safari needs, and a later plain Escape closes it once. [base-ui, zag]
- [ ] `dismissable-layer.keyboard.5` Given the Escape listener is registered on the document rather than on the layer, when Escape is dispatched on the document with focus anywhere, then the topmost layer handles it, so a conformance test does not have to focus the layer first. [zag, corvu, melt]
- [ ] `dismissable-layer.keyboard.6` Given a layer, when a key other than Escape is dispatched, then no handler runs and nothing dismisses. (candidate) [melt]
- [ ] `dismissable-layer.keyboard.7` Given a layer mounted but not present (its stack index is -1), when Escape is dispatched, then neither the escape event nor the dismissal fires, and both fire once the layer becomes present. (candidate) [reka]
- [ ] `dismissable-layer.keyboard.8` Given a layer whose escape handler closes over component state that changed since mount, when Escape is dispatched, then the handler observes the latest state, not a stale closure. (candidate) [radix]
- [ ] `dismissable-layer.keyboard.9` Given Escape handling matches on `event.key` only, then `event.code` and the legacy `keyCode` are never consulted. (candidate) [corvu]

### Pointer

- [ ] `dismissable-layer.pointer.1` Given an open layer, when a full outside mouse sequence of `pointerdown`, `mousedown`, `pointerup`, `mouseup` and `click` lands on an element outside it, then the pointer-down-outside event, the interact-outside event and the dismissal each fire exactly once. [radix, base-ui, zag, kobalte, corvu, reka, bits]
- [ ] `dismissable-layer.pointer.2` Given an open layer, when `pointerdown` lands on the layer itself or on any descendant, then nothing is dismissed and no outside event fires. [react-aria, radix, base-ui, zag, kobalte, corvu, reka]
- [ ] `dismissable-layer.pointer.3` Given a layer whose pointer-down-outside or interact-outside handler calls `preventDefault()`, when the outside press completes, then no dismissal happens, so each handler is a veto point. [radix, zag, corvu]
- [ ] `dismissable-layer.pointer.4` Given the outside-press listener is registered late (a `setTimeout(0)`, a microtask, or a frame after the layer mounts), when the very press that opened the layer reaches the document, then it does not dismiss the layer it just opened. [radix, zag, kobalte, reka, bits]
- [ ] `dismissable-layer.pointer.5` Divergence: an outside press dismisses on `pointerdown` alone, without waiting for the matching `pointerup` or `click`. (decision needed) [radix, base-ui, zag, kobalte, reka, bits]
- [ ] `dismissable-layer.pointer.6` Divergence: an outside press dismisses on `pointerup`, so the `pointerdown` that opened a layer can never be the event that closes it and no deferred registration is needed. (decision needed) [corvu]
- [ ] `dismissable-layer.pointer.7` Divergence: an outside press dismisses only when a down and its matching up both land outside within one layer lifetime, so a `pointerup` whose `pointerdown` predates the layer is ignored. (decision needed) [react-aria]
- [ ] `dismissable-layer.pointer.8` Given `pointerdown` outside with `pointerType: 'touch'`, when it fires, then dismissal is deferred to the following `click`; the layer stays open until that click arrives, and a `click` that never arrives leaves the layer open. [radix, zag, reka, bits]
- [ ] `dismissable-layer.pointer.9` Given a deferred touch dismissal is pending, when the next `pointerdown` lands back inside the layer or inside a nested layer, then the pending dismissal is cancelled and the layer stays open. [radix, reka]
- [ ] `dismissable-layer.pointer.10` Divergence: a non-primary (`button: 2`) mouse or pen `pointerdown` outside dismisses immediately. (decision needed) [radix]
- [ ] `dismissable-layer.pointer.11` Divergence: a right click (`button: 2`) or a ctrl and left click outside does not dismiss, so opening a context menu outside a popover leaves it open. (decision needed) [base-ui, corvu]
- [ ] `dismissable-layer.pointer.12` Divergence: only the primary button (`button: 0`) is listened for, so a middle-button press outside is ignored. (decision needed) [react-aria]
- [ ] `dismissable-layer.pointer.13` Given a layer whose content lives in an open shadow root, when a composed bubbling `pointerdown` fires on that content, then it counts as inside because the target is resolved from `composedPath()[0]` rather than the retargeted `event.target`, while a sibling in the same shadow root counts as outside and dismisses. [react-aria, base-ui, zag, kobalte]
- [ ] `dismissable-layer.pointer.14` Given a trigger listed as an excluded element, when a composed `pointerdown` fires on it, then the layer is not dismissed, so the press that toggles a trigger cannot close and reopen the layer. [zag, kobalte, corvu]
- [ ] `dismissable-layer.pointer.15` Given an outside element whose own handler calls `stopPropagation()` on `mousedown`, `mouseup` and `click`, when the layer defers dismissal to the click, then nothing dismisses because the deferred dismissal never receives its click. [radix, bits]
- [ ] `dismissable-layer.pointer.16` Given a deferred touch dismissal is pending, when the layer is disabled or unmounted before the `click` arrives, then nothing dismisses and no handler reads the destroyed layer's node. (candidate) [bits]
- [ ] `dismissable-layer.pointer.17` Given the app and the layer share one shadow root, when `document.body` is pressed, then the layer is removed, including when focus is managed. (candidate) [base-ui]
- [ ] `dismissable-layer.pointer.18` Given the same stopped-propagation outside element, when the layer dismisses immediately on `pointerdown`, then it still dismisses once because the decision was already made. (candidate) [radix]
- [ ] `dismissable-layer.pointer.19` Given a sibling element registered as a dismiss surface that stops propagation of the click, when it is pressed, then the layer dismisses exactly once, while a plain outside element that stops propagation does not dismiss, so the exemption applies only to registered surfaces. (candidate) [radix]
- [ ] `dismissable-layer.pointer.20` Given outside touch listeners, then `touchstart`, `touchmove` and `touchend` are registered with `{ capture: true, passive: true }`, so outside-press listening never blocks scrolling. (candidate) [base-ui]
- [ ] `dismissable-layer.pointer.21` Given a pointer event whose coordinates fall inside the layer's bounding rect, when the target is some other element such as a password manager overlay, then it counts as inside; the check is skipped when the rect has zero width or height. (candidate) [zag]
- [ ] `dismissable-layer.pointer.22` Given a pointer event whose coordinates land on the scrollbar of the layer's nearest overflow ancestor, or of the overflow ancestor of whatever element has `aria-controls` pointing at the layer, then it counts as inside; the hit box is the client box widened by 16 pixels on the scrollable axis. (candidate) [zag]
- [ ] `dismissable-layer.pointer.23` Given an intentional outside-press mode, when a drag starts inside the layer (`mousedown` inside) and ends outside (`mouseup` on the body), then the layer stays open and the first following outside `click` is swallowed by a one-shot suppression, while the second one dismisses. (candidate) [base-ui]
- [ ] `dismissable-layer.pointer.24` Given the same intentional mode, when a `click` with `detail: 0` (keyboard or assistive-technology generated, with no observed press) lands outside, then the layer dismisses, so the click count and not `pointerType` gates the press check. (candidate) [base-ui]
- [ ] `dismissable-layer.pointer.25` Given the same intentional mode, when the press that opened the layer emits its compatibility `mousedown`, `mouseup` and `click` after the layer opened, then those are not counted as a new press and the layer stays open. (candidate) [base-ui]
- [ ] `dismissable-layer.pointer.26` Given the same intentional mode, when an outside press is cancelled by `pointercancel`, then it does not count as an outside press. (candidate) [base-ui]
- [ ] `dismissable-layer.pointer.27` Given an outside press observed during one open session, when the layer is closed and reopened, then that press does not leak into the new session, including when the close and reopen land in the same batch and when the listeners are re-attached mid-gesture. (candidate) [base-ui]

### Focus management

- [ ] `dismissable-layer.focus.1` Given an open layer, when `focusin` fires on an element outside it, then the focus-outside event, the interact-outside event and the dismissal each fire exactly once, and the pointer-down-outside event does not. [radix, zag, kobalte, corvu, reka]
- [ ] `dismissable-layer.focus.2` Given `focusin` fires on the layer itself or a descendant, then nothing fires and nothing dismisses, including when the layer lives in a shadow root and the event is composed. [radix, zag, kobalte, reka]
- [ ] `dismissable-layer.focus.3` Given a layer whose focus-outside handler calls `preventDefault()`, when focus moves outside, then the layer stays open. [radix, corvu, reka]
- [ ] `dismissable-layer.focus.4` Given a layer that both blocks outside pointer events and watches focus, when a single outside click moves focus, then the layer dismisses once rather than twice, because a `pointerdown` sets a flag that swallows the next `focusin`. [zag, corvu]
- [ ] `dismissable-layer.focus.5` Given focus-outside dismissal, then it is gated on registered branches only and never on pointer-blocking layers, unlike pointer-down-outside which is gated on both, while Escape is gated only on being topmost. (candidate) [zag]
- [ ] `dismissable-layer.focus.6` Given Safari does not focus buttons on `pointerdown`, when a pointer press is in flight, then `focusin` events are ignored until the next `pointerup` so focus-based dismissal does not race the pointer path. Safari. (candidate) [zag]
- [ ] `dismissable-layer.focus.7` Given a touch device, then focus-outside tracking is suppressed entirely. (candidate) [zag]
- [ ] `dismissable-layer.focus.8` Given a deferred dismissal whose outside element swallowed the click, when focus moves outside during that gesture, then the focus move does not substitute for the swallowed click and the layer stays open. (candidate) [radix]

### State

- [ ] `dismissable-layer.state.1` Given an element registered as a branch of the layer, when a press or a focus move lands inside that branch, then the layer does not dismiss, and the branch registry is empty again once the branch unmounts. [radix, zag, reka]
- [ ] `dismissable-layer.state.2` Given the layer registry is module-level global state shared across framework roots, when several layers are open, then outside-press resolution and topmost-layer resolution are answered from that one registry. [react-aria, zag, corvu, bits]
- [ ] `dismissable-layer.state.3` Given a layer whose enablement is turned off while it stays mounted, when the flag changes, then it leaves the stack and the layer beneath becomes the topmost one, so disabling and unmounting are equivalent. [zag, corvu, reka]
- [ ] `dismissable-layer.state.4` Given the same DOM node registered twice (React Strict Mode or any double-register race), when the stack is inspected, then it holds one layer with `--layer-index: 0`, `--nested-layer-count: 0` and no `data-has-nested`, and the most recent registration owns the dismissal callback. (candidate) [zag]
- [ ] `dismissable-layer.state.5` Given a layer whose node is replaced by a rerender, when an outside press is already in flight, then the in-flight interaction still dismisses once and the replacement node is registered. (candidate) [bits]
- [ ] `dismissable-layer.state.6` Given a layer that mounts and unmounts within the same opening mutation, when a later outside press fires, then the registry holds no entry for it and nothing reads the destroyed layer's node. (candidate) [bits]

### Dismissal and layering

- [ ] `dismissable-layer.dismissal.1` Given several open layers, when any dismissal trigger fires, then only the topmost layer dismisses and layers beneath stay open. [react-aria, radix, base-ui, zag, corvu, reka, melt]
- [ ] `dismissable-layer.dismissal.2` Given the body pointer-events lock, when several layers hold it, then it is reference counted: the body stays `pointer-events: none` while any holder is mounted or enabled, and the original value is restored only when the last one releases, including across an out-of-order release and a same-tick handoff where an older layer unmounts as a newer one opens. [zag, corvu, reka]
- [ ] `dismissable-layer.dismissal.3` Given one layer that holds a scroll lock and one that does not, when the scroll-lock holder unmounts while the other layer is still open, then the body stays `pointer-events: none` and is restored only when that remaining layer closes. (candidate) [reka]
- [ ] `dismissable-layer.dismissal.4` Given a parent layer with a nested layer of the same type, when the parent is removed from the stack, then the nested layer's dismissal runs exactly once, so removal cascades downward. (candidate) [zag]
- [ ] `dismissable-layer.dismissal.5` Given a layer that wants to veto a cascade, when the cancelable bubbling `layer:request-dismiss` event reaches it and its handler calls `preventDefault()`, then its dismissal never runs. (candidate) [zag]
- [ ] `dismissable-layer.dismissal.6` Given a nested layer is closing, when a removed layer is held in a recently-removed set for two frames, then interactions during that window read as inside a nested layer, so a focus move out of a closing child cannot cascade into dismissing its parent. (candidate) [zag]
- [ ] `dismissable-layer.dismissal.7` Given a layer's cleanup runs, then it leaves the stack, pointer-events are reassigned across the survivors, its own inline `pointer-events` is cleared, its style observer is disconnected, and the escape and interact-outside listeners are removed. (candidate) [zag]
- [ ] `dismissable-layer.dismissal.8` Given two concurrent pointer-blocking layers, when the second applies its body lock, then it refuses to touch the body while `data-inert` is already present, so neither stashes the other's mutated value as the original. (candidate) [zag]

### Animation and presence

- [ ] `dismissable-layer.animation.1` Given a layer still in its opening animation (its content still carries the starting-style marker), when a full outside click sequence fires, then interact-outside fires exactly once with the outermost element as the target, the content is removed, no item is selected, and the same holds on an immediate reopen. (candidate) [bits]
- [ ] `dismissable-layer.animation.2` Given a layer that has just registered, when an outside click happens at any delay from 0 to 20 milliseconds after registration, then it dismisses in every case; the 4 to 14 millisecond window is where a stale timer previously cleared the responsible-layer flag. (candidate) [bits]
- [ ] `dismissable-layer.animation.3` Given an older layer animating out and a newer layer already open, when the older one unmounts, then the body lock and the stack metadata still describe the newer layer, and only closing the newer one releases them. (candidate) [reka]

### Notes and edge cases

- [ ] `dismissable-layer.notes.1` Given a conformance test opens a layer and then fires an outside press, then it must advance past the deferred registration first (a timer flush, a microtask and a frame), or the test passes for the wrong reason. [zag, kobalte, bits]
- [ ] `dismissable-layer.notes.2` Given the layer stack is module-level global state, then a suite must unwind every layer between cases or a pending recently-removed cleanup produces a false inside answer in the next test. [zag, corvu]
- [ ] `dismissable-layer.notes.3` Given any outside-interaction primitive, then targets must be resolved through `event.composedPath()` rather than `event.target`, because a document-level listener sees a target retargeted to the shadow host, which matches neither the layer nor its excluded trigger; the observable symptoms were a select trigger closing and instantly reopening its listbox and a menu item press dismissing the layer before the item could activate (kobalte issue 445). (candidate) [kobalte]

## interact-outside

### Pointer

- [ ] `interact-outside.pointer.1` Given the outside-interaction hook on an element, when a press sequence lands on the element or on any descendant, then nothing fires; when the same sequence lands on the document body, then interact-outside fires exactly once. [react-aria, zag, kobalte]
- [ ] `interact-outside.pointer.2` Given a touch sequence outside followed by the browser's emulated `mouseup`, when both arrive, then interact-outside fires exactly once rather than twice, so emulated mouse events after touch are swallowed. [react-aria, zag]
- [ ] `interact-outside.pointer.3` Given a target that is not an `HTMLElement`, is disconnected from the document, is contained by the node, is a controlled element, or is rejected by the exclude predicate, then it is treated as inside and no event fires. [zag, kobalte, corvu]
- [ ] `interact-outside.pointer.4` Given the hook, when the same behavior is asserted under all three event models (pointer events, mouse events only, and touch events), then it holds identically in each. (candidate) [react-aria]
- [ ] `interact-outside.pointer.5` Given `pointerType: 'touch'`, then the `pointerdown` is not acted on at all: queued handlers are flushed and a single `click` listener is installed on the document, the parent window and every child frame instead, because touch `pointerdown` is not a reliable dismissal signal. (candidate) [zag]
- [ ] `interact-outside.pointer.6` Given a deferral option that evaluates the target a frame later, then it is deliberately ignored on touch devices, so touch interactions are evaluated synchronously inside the click handler. (candidate) [zag]
- [ ] `interact-outside.pointer.7` Given the layer element is an `svg` rather than an `HTMLElement`, or the outside element is an `svg`, when a press lands on either, then containment resolves the same way as for HTML elements in all four combinations. (candidate) [kobalte]
- [ ] `interact-outside.pointer.8` Given `aria-controls` following is on by default, when the press target sits inside an element controlled from within the node, then it counts as inside, which is what keeps portalled nested menus and listboxes from reading as outside. (candidate) [zag]
- [ ] `interact-outside.pointer.9` Given an `ignore` list that contains null entries for refs not yet assigned, when a pointer event is evaluated, then the null entries are skipped rather than throwing. (candidate) [corvu]

### Focus management

- [ ] `interact-outside.focus.1` Given the hook, when `focusin` fires on an element outside the node, then focus-outside and interact-outside each fire once and pointer-down-outside does not; when it fires inside, nothing fires. [zag, kobalte, corvu]
- [ ] `interact-outside.focus.2` Given a cancelable custom event dispatched on the node for the outside focus, when a handler calls `preventDefault()`, then the consequence is vetoed. [zag, corvu]

### State

- [ ] `interact-outside.state.1` Given the hook is disabled, when a pointer, mouse, touch or focus sequence happens outside, then nothing fires and no listeners are registered at all. [react-aria, kobalte]
- [ ] `interact-outside.state.2` Given an exclude predicate, when it returns true for the outside target, then nothing fires; when it returns false, interact-outside fires once, and it is called with that exact element either way. [zag, kobalte]

### Accessibility tooling

- [ ] `interact-outside.a11y.1` Given the outside events are cancelable custom events dispatched on the tracked node, then each detail carries the original event, whether the gesture was a context menu, whether anything in the composed path is focusable, and the resolved target. (candidate) [zag]

### Notes and edge cases

- [ ] `interact-outside.notes.1` Given the node is portalled into an iframe, when a press targets the node inside the iframe, then nothing fires; when it targets the iframe's own document body, then interact-outside fires once, so listeners attach to the node's owner document rather than the top document. [react-aria, zag]
- [ ] `interact-outside.notes.2` Given the node's window has a frame element, then listeners are also registered defensively on the parent window and on every child frame's document, each wrapped so a cross-origin frame fails silently. (candidate) [zag]
- [ ] `interact-outside.notes.3` Given the trigger lookup builds an unescaped `[aria-controls="<id>"]` selector, then an id containing selector metacharacters throws. (candidate) [zag]
- [ ] `interact-outside.notes.4` Given a pointer event is duck-typed by the presence of `clientY`, then any mouse or touch event carrying coordinates takes the pointer path regardless of its constructor. (candidate) [zag]

## escape-keydown

### Keyboard

- [ ] `escape-keydown.keyboard.1` Given one registered layer whose behavior is close, when Escape is dispatched on the document, then its handler runs exactly once. [radix, base-ui, zag, corvu, reka, melt]
- [ ] `escape-keydown.keyboard.2` Given two layers both set to close, when Escape is dispatched, then only the topmost handler runs. [zag, corvu, reka, melt]
- [ ] `escape-keydown.keyboard.3` Given two layers, when the top layer is destroyed after handling one Escape, then the next Escape runs the lower layer's handler exactly once, so the listener stack unwinds in order. [zag, corvu, melt]
- [ ] `escape-keydown.keyboard.4` Given a destroyed layer, when Escape is dispatched, then its handler is not called. [zag, melt]
- [ ] `escape-keydown.keyboard.5` Given one registered layer whose behavior is ignore, when Escape is dispatched, then no handler runs, and an ignore layer anywhere in the stack swallows the key for every layer beneath it too. (candidate) [melt]
- [ ] `escape-keydown.keyboard.6` Given a layer whose behavior defers to another layer but closes when there is none, when Escape is dispatched as the only layer, then its handler runs; the sibling behavior that defers but otherwise ignores does not run. (candidate) [melt]
- [ ] `escape-keydown.keyboard.7` Given a close layer under a layer that defers, when Escape is dispatched, then the lower handler runs and the top one does not, so a deferring top layer hands the key downward. (candidate) [melt]
- [ ] `escape-keydown.keyboard.8` Given a layer's Escape behavior is updated while it is mounted, then it keeps its position in the stack rather than being pushed to the top, and the next Escape honors the new behavior. (candidate) [melt]

### Notes and edge cases

- [ ] `escape-keydown.notes.1` Given the Escape listener is attached to the document in the capture phase, when Escape is dispatched, then a bubble-phase `stopPropagation()` on an ancestor wrapper does not prevent the layer from handling it. [base-ui, zag]
- [ ] `escape-keydown.notes.2` Divergence: Escape listens in the bubble phase by default, so an ancestor that stops propagation can suppress it, while outside-press listens in the capture phase by default and survives the same handler. (decision needed) [base-ui]

## focus-scope

### Roles and attributes

- [ ] `focus-scope.roles.1` Given a scope with no tabbable candidates inside, when it renders, then the scope container itself carries `tabindex="-1"` so it can take focus. [react-aria, radix]
- [ ] `focus-scope.roles.2` Given a non-modal floating element with no focusable content, when it opens, then it is given `tabindex="0"` so Tab can reach it, and it is downgraded to `tabindex="-1"` as soon as its content becomes tabbable. (candidate) [base-ui]
- [ ] `focus-scope.roles.3` Given a `role="listbox"` floating element, when it opens non-modal, then the managed `tabindex` upgrade is skipped and it keeps `tabindex="-1"`. (candidate) [base-ui]
- [ ] `focus-scope.roles.4` Given a non-modal floating element in a portal, when it opens, then the portal node carries a generated `id` and a portal marker attribute, and a role-less owner element carries `aria-owns` pointing at that id, while the reference element itself gets no `aria-owns`; the owner's role can be set explicitly. (candidate) [base-ui]

### Keyboard

- [ ] `focus-scope.keyboard.1` Given a contained scope holding several tabbable elements, when Tab is pressed from any of them, then focus moves to the next tabbable in the scope, and from the last one it wraps to the first. [react-aria, radix, base-ui, zag, ariakit, headlessui, corvu, reka]
- [ ] `focus-scope.keyboard.2` Given the same scope, when Shift+Tab is pressed from the first tabbable, then focus wraps to the last tabbable in the scope. [react-aria, radix, base-ui, zag, ariakit, headlessui, corvu, reka]
- [ ] `focus-scope.keyboard.3` Given a scope containing exactly one tabbable element, when Tab or Shift+Tab is pressed, then focus stays on that element. [zag, ariakit, headlessui]
- [ ] `focus-scope.keyboard.4` Given a scope containing elements with `tabindex="-1"`, `display: none`, `visibility: hidden`, `visibility: collapse`, the `hidden` attribute, or a native `disabled` attribute, when Tab and Shift+Tab cycle the scope, then every one of those is skipped in both directions. [react-aria, radix, headlessui, reka]
- [ ] `focus-scope.keyboard.5` Given a contained scope wrapping a radio group, when tabbing forward or backward, then the radios that are not the group's tab stop are skipped, resolved by name rather than by enclosing form, and a group with a single radio does not crash. [react-aria, base-ui, zag]
- [ ] `focus-scope.keyboard.6` Given a scope whose last element has a blur handler, when focus cycles backward to it and then forward again, then the handler fires exactly once, so cycling does not double-blur. [radix, reka]
- [ ] `focus-scope.keyboard.7` Given a scope containing spans with `contenteditable`, `contenteditable="false"` and `contenteditable="plaintext-only"`, when tabbing, then the truthy and the plaintext-only spans are tabbable and the false variants are skipped. (candidate) [react-aria]
- [ ] `focus-scope.keyboard.8` Given a contained scope, when a Tab keydown arrives with a modifier such as Alt held, then focus does not move and the browser keeps the key. (candidate) [react-aria]
- [ ] `focus-scope.keyboard.9` Given a contained scope around inputs with values, when Tab moves focus into an input, then its text is selected, so a following Delete clears the whole value. (candidate) [react-aria]
- [ ] `focus-scope.keyboard.10` Given a scope holding two containers, when Tab reaches the end of the first container, then focus moves to the first tabbable of the second, and Tab from the end of the second wraps back to the first. (candidate) [zag]

### Focus management

- [ ] `focus-scope.focus.1` Given a scope that autofocuses on mount, when it mounts, then focus lands on the first tabbable element inside it, skipping non-focusable leading content. [react-aria, base-ui, zag, ariakit, headlessui, corvu, reka]
- [ ] `focus-scope.focus.2` Given a child inside the scope carries the native `autofocus` attribute, when the scope mounts, then that child keeps focus instead of the first tabbable element. [react-aria, base-ui, headlessui]
- [ ] `focus-scope.focus.3` Given an explicit initial-focus target, when the scope opens, then that element receives focus, and it wins over both the first tabbable element and a child with `autofocus`. [base-ui, zag, headlessui, corvu]
- [ ] `focus-scope.focus.4` Given initial focus is disabled, when the scope opens, then nothing inside it is focused and focus is left on the trigger. [base-ui, zag, corvu]
- [ ] `focus-scope.focus.5` Given a scope with nothing focusable inside, when it opens, then focus falls back to the scope container itself. [base-ui, zag, ariakit, corvu]
- [ ] `focus-scope.focus.6` Given a scope with nothing focusable and no fallback target, when it activates, then it either throws or warns rather than silently leaving focus outside. [zag, headlessui]
- [ ] `focus-scope.focus.7` Given the focused element inside the scope is removed from the DOM, when the removal settles, then focus moves to the nearest remaining tabbable element, then to a focusable but non-tabbable one, and finally to the scope container. [react-aria, base-ui, zag, reka]
- [ ] `focus-scope.focus.8` Given a scope that restores focus, when it unmounts, then focus returns to the element that was focused before it opened. [react-aria, base-ui, zag, ariakit, headlessui, corvu]
- [ ] `focus-scope.focus.9` Given an explicit final-focus target, when the scope closes, then focus lands there instead of on the pre-open element. [base-ui, zag, corvu]
- [ ] `focus-scope.focus.10` Given focus restoration is disabled, when the scope closes, then focus is left wherever it is and the trigger does not regain it; the flag is read at close time, not at open time. [base-ui, corvu]
- [ ] `focus-scope.focus.11` Given the trigger was removed from the DOM by the same interaction that closed the scope, when focus is restored, then it lands on the tabbable element that took the trigger's place in document order rather than on the body, in both modal and non-modal scopes. [react-aria, base-ui]
- [ ] `focus-scope.focus.12` Given the scope was closed by a keyboard interaction, when focus is restored, then the trigger is focused with `{ preventScroll: true, focusVisible: true }`; when it was closed by a pointer interaction, `focusVisible` is omitted so the browser heuristics decide the focus ring. [base-ui, zag]
- [ ] `focus-scope.focus.13` Given the scope's restore target was itself removed while the scope was open, when the scope closes, then the scope tree falls back to the previous scope's restore target rather than leaving focus on the body. [react-aria, base-ui]
- [ ] `focus-scope.focus.14` Given a contained scope whose focused element is blurred, when focus later lands outside the scope, then it is pushed back to the last focused element inside the scope. [react-aria, radix, base-ui]
- [ ] `focus-scope.focus.15` Given a non-modal scope in a portal with tabbable elements before and after it in the document, when Tab or Shift+Tab leaves the scope, then focus continues in document order at the position of the trigger, not at the portal's position in the DOM. [react-aria, base-ui]
- [ ] `focus-scope.focus.16` Given a scope whose content holds a radio group with a checked radio, when it opens with default initial focus, then the checked radio receives focus rather than the first radio. (candidate) [base-ui]
- [ ] `focus-scope.focus.17` Given restoration on removal is disabled, when the focused element is removed, then focus falls to the document body and is not pulled back into the scope. (candidate) [base-ui]
- [ ] `focus-scope.focus.18` Given the focused element inside the scope becomes `visibility: hidden` and focus falls to the body, when that settles, then focus is restored to the nearest tabbable element in the scope. (candidate) [base-ui]
- [ ] `focus-scope.focus.19` Given the trigger is not itself focusable, when the scope closes, then focus returns to the first focusable descendant of the trigger. (candidate) [base-ui]
- [ ] `focus-scope.focus.20` Given two buttons that both toggle the same scope, when the second one closes it, then focus goes to the element actually interacted with rather than to the original opener. (candidate) [react-aria]
- [ ] `focus-scope.focus.21` Given a scope opened by hover, when it closes, then focus does not return to the trigger, and hovering the trigger never focuses it; Escape and an explicit close button do return focus to it. (candidate) [base-ui]
- [ ] `focus-scope.focus.22` Given a modal scope with no tabbable content opened by click, when an outside press closes it, then focus returns to the trigger only when `focus({ preventScroll })` support can be detected. (candidate) [base-ui]
- [ ] `focus-scope.focus.23` Given the app moves focus to a new outside element after the scope closed but before the deferred restoration runs, when the restoration fires, then it leaves focus where the app put it; a node inside the scope's own now-inert container does not count as such a claim and restoration still runs. (candidate) [zag]
- [ ] `focus-scope.focus.24` Given a cancelable restoration event dispatched on the scope, when an ancestor listener calls `preventDefault()`, then no restoration happens and focus ends on the document body; the event does not bubble out of a nested scope. (candidate) [react-aria]
- [ ] `focus-scope.focus.25` Given a contained scope and a blur whose `relatedTarget` is null (what happens when focus moves into a child iframe), when the blur fires after the active element has already moved, then focus is left where it went rather than being yanked back. (candidate) [react-aria]
- [ ] `focus-scope.focus.26` Given a scope with declared branch nodes outside its subtree, when focus moves into a registered branch, then the branch keeps focus, while a move into an unregistered outside node is reclaimed by the scope. (candidate) [radix]
- [ ] `focus-scope.focus.27` Given a non-modal scope, when Tab moves focus past the last element inside it, then the scope closes and focus rests on the next element in the document; when close-on-focus-out is disabled, the scope stays open and focus still lands outside. (candidate) [base-ui]
- [ ] `focus-scope.focus.28` Given a combobox input with a non-modal scope around its listbox, when the popup opens, then the input keeps focus, Tab moves into the listbox, and Shift+Tab returns to the input; with a modal scope the input loses focus to the first item and Tab cycles inside the listbox. (candidate) [base-ui]
- [ ] `focus-scope.focus.29` Given a modal combobox whose only inside content is not tabbable, when Tab is pressed, then the popup closes and focus lands on the next element after the trigger, and a second open-then-Tab sequence behaves identically. (candidate) [base-ui]
- [ ] `focus-scope.focus.30` Given the floating element is a wrapper whose inner child carries the floating props, when the scope opens, then focus lands on the inner element that holds those props. (candidate) [base-ui]
- [ ] `focus-scope.focus.31` Given a scope whose content is swapped for a new view that focuses its own input on mount, when the swap happens, then the new input keeps focus even though the scope's stored last-focused element points at the removed node. (candidate) [reka]

### State

- [ ] `focus-scope.state.1` Given a scope observes its own subtree, when a node is added or a `tabindex` attribute changes, then the tabbable set is recomputed, while other attribute changes do not trigger a recompute. [zag, corvu]
- [ ] `focus-scope.state.2` Given a disabled scope, when the layer opens, then it does not take focus, and enabling the scope afterwards moves focus into it. (candidate) [base-ui]
- [ ] `focus-scope.state.3` Given a keep-mounted scope that is enabled and disabled rather than mounted and unmounted, when it is opened and closed repeatedly, then each session focuses its content on open and restores focus on close, and the close modality (keyboard versus pointer) is reset between sessions. (candidate) [base-ui]
- [ ] `focus-scope.state.4` Given a keep-mounted scope that is reopened by a layout effect before focus restoration runs, when the restoration fires, then the keyboard close modality is preserved. (candidate) [base-ui]

### Dismissal and layering

- [ ] `focus-scope.dismissal.1` Given several contained scopes, when the newest one activates, then it becomes the only active scope: Tab cycles inside it and a programmatic focus attempt on an ancestor scope's element is rejected and snapped back. [react-aria, zag]
- [ ] `focus-scope.dismissal.2` Given nested contained scopes unmounting from the inside out, when each level closes, then focus is accepted back at the deepest still-mounted scope and ancestor focus attempts are still rejected. [react-aria, zag]
- [ ] `focus-scope.dismissal.3` Given a child scope rendered through a portal into the body from inside a parent contained scope, when a node in the child scope is focused, then the focus is accepted, so scope ancestry follows the component tree rather than the DOM tree. [react-aria, reka]
- [ ] `focus-scope.dismissal.4` Given a dialog scope with a portalled select or combobox popup inside it, when the popup opens, then focus moves into the popup's own content and the dialog's trap does not yank it back. [base-ui, reka]
- [ ] `focus-scope.dismissal.5` Given a modal scope, when it opens, then every node outside it is removed from the accessibility tree while the floating element and any `aria-live` region are left alone, and everything is restored on close. [react-aria, base-ui, zag, kobalte]
- [ ] `focus-scope.dismissal.6` Given a nested scope that does not contain focus, when Tab moves through it, then focus flows through its children and wraps at the outer scope's boundary, so a non-containing child scope adds no lock. (candidate) [react-aria]
- [ ] `focus-scope.dismissal.7` Given a modal scope with explicitly supplied inside elements that live outside the floating node, when it opens, then those elements are left exposed to assistive technology while unrelated outside content is hidden. (candidate) [base-ui]
- [ ] `focus-scope.dismissal.8` Given a non-modal scope, when it opens, then no element receives `inert`, the reference and the top-level outside ancestors receive the library's own inert marker while their descendants do not, and every marker is removed on close. (candidate) [base-ui]
- [ ] `focus-scope.dismissal.9` Given a combobox with a non-modal scope, when the popup opens on focus, then neither the reference, the popup, nor the outside buttons become inert, so a combobox does not hide the rest of the page. (candidate) [base-ui]
- [ ] `focus-scope.dismissal.10` Given a modal scope opened by hover, when it opens, then outside nodes get `aria-hidden` rather than `inert`. (candidate) [base-ui]
- [ ] `focus-scope.dismissal.11` Given a non-modal outer layer whose content opens a modal nested layer, when both are open, then both stay mounted and interactive. (candidate) [base-ui]
- [ ] `focus-scope.dismissal.12` Given a parent trap paused by a child trap, when the child deactivates, then the parent unpauses and reclaims its own initial focus first, and only on the next macrotask does the child's deferred restoration move focus to its own target. (candidate) [zag]

### SSR and hydration

- [ ] `focus-scope.ssr.1` Given a scope rendered on the server and hydrated, when hydration runs, then there are no errors or mismatches. (candidate) [react-aria]

### Notes and edge cases

- [ ] `focus-scope.notes.1` Given a scope portalled into an iframe's document, when Tab is pressed inside the iframe, then focus cycles the iframe's inputs in both directions, so the scope listens on the element's owner document rather than the top document. [react-aria, base-ui]
- [ ] `focus-scope.notes.2` Given both initial focus and restoration are deferred past a paint, then a conformance test must flush a frame before asserting the active element. [zag, kobalte, corvu]
- [ ] `focus-scope.notes.3` Divergence: the focusable set excludes nothing for `disabled` or hidden elements and sorts by ascending `tabindex` with DOM order as the tiebreaker, so a disabled button inside the trap counts as a stop and positive `tabindex` values are honored. (decision needed) [corvu]
- [ ] `focus-scope.notes.4` Divergence: positive `tabindex` values are only supported in a single-container trap and the tabbable scan throws when more than one container reports one. (decision needed) [zag]
- [ ] `focus-scope.notes.5` Given a scope portalled into a shadow root, when its first input is focused, then the document's active element is the shadow host while the shadow root's active element is the input, and Tab cycles the shadow inputs with wrap, including through nested shadow roots. (candidate) [react-aria]
- [ ] `focus-scope.notes.6` Given a scope inside an iframe opened while a top-document element was focused, when the scope unmounts and the iframe is removed, then focus returns to the top-document element. (candidate) [react-aria]
- [ ] `focus-scope.notes.7` Given Firefox briefly focuses the `Document` when the user tabs out of an iframe, then a `Document` target is treated as non-escaping and focus is left alone. Firefox. (candidate) [zag]
- [ ] `focus-scope.notes.8` Given a focus manager exposed to the scope's contents, then `focusNext` and `focusPrevious` stop at the ends unless wrapping is requested, restrict themselves to tabbable candidates on request, accept a container element as the starting point, and accept a predicate that skips candidates. (candidate) [react-aria]
- [ ] `focus-scope.notes.9` Given a contained scope that gains and loses focus repeatedly, when it unmounts, then no animation-frame callbacks are left pending. (candidate) [react-aria]
- [ ] `focus-scope.notes.10` Given a tabbable scan, then an `iframe` is in the tab order, a closed `details` contributes only its first `summary`, a `details` with no summary is itself tabbable, `aria-disabled` does not remove an element while native `disabled` does, a slotted light-DOM element inside a shadow host is included while an unslotted one is not, and a slotted element inside inert shadow content is excluded. (candidate) [base-ui]
- [ ] `focus-scope.notes.11` Given a tabbable scan and a `display: contents` wrapper, then its visible descendants stay in the tab order while the wrapper itself is not tabbable, and descendants of a hidden `display: contents` wrapper are excluded. Chromium. (browser-only) (candidate) [base-ui]
- [ ] `focus-scope.notes.12` Given a tabbable scan, then a zero-size element with `tabindex="0"` and a visually hidden element are both in the tab order, while an element under a block ancestor with `content-visibility: hidden` is not. (browser-only) (candidate) [base-ui]

## focus-trap

### Roles and attributes

- [ ] `focus-trap.roles.1` Given a trap, then it sets no attributes of its own on the container or on any tabbable node, and only reads `aria-controls` and `aria-expanded` to decide whether an out-of-container element is inside the boundary. (candidate) [zag]
- [ ] `focus-trap.roles.2` Given `aria-controls` following is on by default, when an element inside the container controls a portalled element and reports `aria-expanded="true"`, then that portalled element counts as part of the trap; with `aria-expanded="false"` or with following turned off, it does not. (candidate) [zag]
- [ ] `focus-trap.roles.3` Given a trap, then it observes its containers and discovered portal containers with a `MutationObserver` filtered to `aria-controls`, `aria-expanded`, `childList` and `subtree`, so the tabbable set is recomputed when portalled controlled content mounts or toggles. (candidate) [zag]

### Keyboard

- [ ] `focus-trap.keyboard.1` Given focus on the last tabbable node in the trap, when Tab is pressed, then the event is default-prevented and focus wraps to the first tabbable node; from the first node, Shift+Tab wraps to the last. [zag, ariakit, headlessui, corvu]
- [ ] `focus-trap.keyboard.2` Given an empty but explicitly focusable trapped region, when Tab reaches it, then the region element itself takes focus. [ariakit, corvu]
- [ ] `focus-trap.keyboard.3` Divergence: Escape deactivates the trap by default and the keydown is default-prevented. (decision needed) [zag]
- [ ] `focus-trap.keyboard.4` Divergence: Escape never deactivates the trap; dismissal is the dismissable layer's job and the keydown is left alone. (decision needed) [zag, corvu]
- [ ] `focus-trap.keyboard.5` Given a trap whose only effective tab stop is one radio of a named group, when Tab is pressed on it, then the event is default-prevented and focus stays on that radio. (candidate) [zag]
- [ ] `focus-trap.keyboard.6` Given a trap with sentinel elements around the region, when Tab walks through, then the sentinels take part in the tab order and can redirect focus to a declared target, and Shift+Tab from that target lands on the element the redirect skipped. (candidate) [ariakit]
- [ ] `focus-trap.keyboard.7` Given the trap's enabled flag is toggled from a control inside the region, when it is toggled, then focus stays on that control and the wrap behavior follows the new flag immediately. (candidate) [ariakit]
- [ ] `focus-trap.keyboard.8` Given a trap containing unusual `tabindex` values, when Tab is pressed, then focus still cannot escape. (candidate) [headlessui]
- [ ] `focus-trap.keyboard.9` Given a trap with an empty focusable set (distinct from an unset one), when Tab is pressed anywhere in the document, then the default is prevented outright so focus cannot escape. (candidate) [corvu]
- [ ] `focus-trap.keyboard.10` Given Escape deactivation is enabled, when the key arrives while an IME composition is active, then it is ignored. (candidate) [zag]

### Pointer

- [ ] `focus-trap.pointer.1` Divergence: an outside `mousedown` is default-prevented so the press cannot reach the page, and the capture-phase `click` handler also calls `stopImmediatePropagation()` so no app handler sees it. (decision needed) [zag]
- [ ] `focus-trap.pointer.2` Divergence: outside clicks are allowed through and the trap only contains Tab, leaving outside-press dismissal to the dismissable layer. (decision needed) [zag, corvu]
- [ ] `focus-trap.pointer.3` Given outside-click deactivation is enabled, when `mousedown` fires outside the container, then the trap deactivates. (candidate) [zag]
- [ ] `focus-trap.pointer.4` Given declared persistent elements such as a toast region, when `mousedown` fires on one, then the event is not default-prevented and the trap stays active, while any other outside element is still treated as escaping. (candidate) [zag]
- [ ] `focus-trap.pointer.5` Given the trap tracks the last interaction type, when a `mousedown` is followed by a Tab keydown, then the type flips from pointer to keyboard, and that value decides whether restoration asks for `focusVisible`. (candidate) [zag]

### Focus management

- [ ] `focus-trap.focus.1` Given a trap activating with initial focus undelayed, when it activates, then the first tabbable node receives focus; an explicit initial-focus target wins over it, and initial focus can be declined so focus is left on the trigger. [zag, ariakit, headlessui, corvu]
- [ ] `focus-trap.focus.2` Given the trap deactivates, when a macrotask has elapsed, then focus returns to the element focused before activation, or to a declared return target when one is given. [zag, ariakit, headlessui, corvu]
- [ ] `focus-trap.focus.3` Given the deactivation followed a keyboard interaction, when restoration runs, then it passes `{ focusVisible: true }`; after a pointer interaction it omits `focusVisible` so no focus ring is forced. [base-ui, zag]
- [ ] `focus-trap.focus.4` Given the focused node inside the trap is removed from the DOM, when the mutation is observed, then the trap refocuses its initial-focus node. [zag, corvu, reka]
- [ ] `focus-trap.focus.5` Given a container with no tabbable children and a declared fallback, when the trap activates, then the fallback element receives focus; with no tabbable children and no fallback, activation throws. (candidate) [zag]
- [ ] `focus-trap.focus.6` Given an initial-focus target that was never appended to the document, when the trap activates, then it does not throw and focus lands on the fallback instead. (candidate) [zag]
- [ ] `focus-trap.focus.7` Given initial focus is deferred, when the trap activates, then nothing is focused synchronously and the first tabbable node is focused on the next macrotask. (candidate) [zag]
- [ ] `focus-trap.focus.8` Given a gate callback that must resolve before the trap may claim focus, when activation runs, then initial focus is withheld until the promise settles and then lands on the first tabbable node; the mirror-image gate on deactivation withholds restoration the same way. (candidate) [zag]
- [ ] `focus-trap.focus.9` Given a cancelable initial-focus event dispatched on the container, when a handler calls `preventDefault()`, then nothing is focused. (candidate) [corvu]
- [ ] `focus-trap.focus.10` Given restoration is disabled, when the trap deactivates, then focus is left wherever it is. (candidate) [corvu]
- [ ] `focus-trap.focus.11` Given persistent elements, when focus is moved programmatically to one, then the trap does not pull it back inside the container. (candidate) [zag]
- [ ] `focus-trap.focus.12` Given a programmatic `focus()` call on an element outside the trap, when it runs, then focus is pulled back inside. (candidate) [headlessui]
- [ ] `focus-trap.focus.13` Given a focus escape, when the trap intercepts it, then it calls `stopImmediatePropagation()` on the `focusin` and derives the destination from the most recently focused node, preferring the adjacent tabbable node in that node's own container. (candidate) [zag]
- [ ] `focus-trap.focus.14` Given the trap moves focus programmatically, then it passes `preventScroll` per its configuration, records the node as most recently focused by hand because `focus()` fires no `focusin`, and selects the text of a selectable input. (candidate) [zag]

### Dismissal and layering

- [ ] `focus-trap.dismissal.1` Given two traps sharing one stack, when the second activates, then the first reports paused while staying active, and deactivating the second unpauses the first. (candidate) [zag]
- [ ] `focus-trap.dismissal.2` Given an active trap, when it is paused, then its listeners detach so an outside `mousedown` is no longer default-prevented, and unpausing restores both the flag and the interception. (candidate) [zag]
- [ ] `focus-trap.dismissal.3` Given an outer trap whose only focus target was removed while an inner trap was open, when the inner trap deactivates, then the automatic unpause does not throw, the outer trap stays active, and it is still functional afterwards. (candidate) [zag]
- [ ] `focus-trap.dismissal.4` Given a trap activating, then it moves to the end of its stack (splicing out any existing entry first) and pauses whichever trap was last; deactivating splices it out and unpauses the new last entry. (candidate) [zag]
- [ ] `focus-trap.dismissal.5` Given a trap deactivates, then it clears the pending initial-focus timer, drops all listeners, sets active and paused false, disconnects the observer, and clears its discovered portal containers. (candidate) [zag]

### Notes and edge cases

- [ ] `focus-trap.notes.1` Given the trap contains focus only through Tab, then a pointer click outside is not prevented by the trap itself and outside dismissal is the dismissable layer's job. [zag, corvu]
- [ ] `focus-trap.notes.2` Given the Tab wrap is implemented by listeners on the first and last focusable elements rather than on the container, then a conformance test must fire `keydown` on the boundary element itself. (candidate) [corvu]
- [ ] `focus-trap.notes.3` Given shadow DOM traversal is delegated to a root-resolving option and container matching falls back to `composedPath()` when `contains()` fails, then shadow-root containment is supported but untested upstream. (candidate) [zag]
- [ ] `focus-trap.notes.4` Given a trap mounted over an empty container, then activation errors are swallowed and the machine silently gets no trap rather than an exception. (candidate) [zag]

## focus-guards

### Focus management

- [ ] `focus-guards.focus.1` Given no guards in the document, when a guard consumer mounts, then exactly two guard elements exist, one as the first element child of the body and one as the last. [radix, reka]
- [ ] `focus-guards.focus.2` Given several guard consumers mounted at once, when they render, then still exactly two guard elements exist, because the pair is shared. [radix, reka]
- [ ] `focus-guards.focus.3` Given two guard consumers, when the first unmounts, then the guards remain, and only after the last consumer unmounts do they drop to zero, so the pair is reference counted. [radix, reka]
- [ ] `focus-guards.focus.4` Given a node is appended to the body after the trailing guard (a portal mounting), when another consumer mounts, then the same trailing guard instance is moved back to be the body's last element child rather than duplicated. (candidate) [radix]
- [ ] `focus-guards.focus.5` Given the guards are already in place, when an extra consumer mounts, then nothing is written to the DOM. (candidate) [radix]

### Notes and edge cases

- [ ] `focus-guards.notes.1` Given a non-modal layer in a portal whose reference has sibling elements, when the layer opens, then the outside focus guards do not cause those siblings to be marked inert. (candidate) [base-ui]

## aria-hidden

Covers `ariaHideOutside`, `hideOthers`, `inertOthers` and `markOthers`: hiding
everything outside one or more target elements from assistive technology.

### Roles and attributes

- [ ] `aria-hidden.roles.1` Given a target element among siblings, when the hide runs, then every sibling branch outside the target gets `aria-hidden="true"` while the target itself gets no `aria-hidden` attribute at all rather than `aria-hidden="false"`; the revert removes the attribute outright. [react-aria, base-ui, zag, kobalte]
- [ ] `aria-hidden.roles.2` Given several target elements passed at once, when the hide runs, then all of them stay exposed and only non-target branches are hidden. [react-aria, kobalte]
- [ ] `aria-hidden.roles.3` Given a target nested inside wrapper elements, when the hide runs, then none of the target's own ancestors is hidden, because each target's ancestor chain is collected into a keep set first. [react-aria, zag, kobalte]
- [ ] `aria-hidden.roles.4` Given an outside element wrapped in a container, when the hide runs, then `aria-hidden="true"` lands on the outermost container and the walk does not descend to hide its children individually. [react-aria, base-ui, zag, kobalte]
- [ ] `aria-hidden.roles.5` Given an outside element that already carried an author-supplied `aria-hidden="true"`, when the hide runs and then reverts, then that element's own attribute is left in place and never refcounted or stripped. [react-aria, base-ui, zag, kobalte]
- [ ] `aria-hidden.roles.6` Given a `role="grid"` containing rows and grid cells with one row as the target, when the hide runs, then `aria-hidden="true"` is applied to the sibling row and separately to its grid cell, breaking the usual do-not-descend rule, because WebKit does not treat `aria-hidden` as recursive for table and grid roles (WebKit bug 222623). [react-aria, kobalte]
- [ ] `aria-hidden.roles.7` Given the hide walk, then live regions are exempt: a node is skipped when it is a `script`, `output`, `status` or route-announcer element, when its role is `status`, when it carries any `aria-live` attribute, or when it is marked as a live announcer. [react-aria, base-ui, zag]
- [ ] `aria-hidden.roles.8` Given elements controlled via `aria-controls` from inside a target, then they are kept exposed by default, so a portalled dropdown belonging to the dialog is not hidden. [zag, kobalte]
- [ ] `aria-hidden.roles.9` Given the environment supports the `inert` property, when the suppression runs, then the outside branches get `inert` and a library marker attribute; otherwise they fall back to `aria-hidden`. [base-ui, zag]
- [ ] `aria-hidden.roles.10` Given an element marked as a top layer, when it is added while the hide is active, then it stays exposed while the rest of the new content is hidden, and the marker counts by attribute presence even with an empty value. (candidate) [react-aria]
- [ ] `aria-hidden.roles.11` Given the library marks its own work with a data attribute, then the marker count and the control attribute count are tracked separately, so the marker can be removed on a different release than the attribute. (candidate) [base-ui]
- [ ] `aria-hidden.roles.12` Given `aria-hidden` and `inert` claims on the same node, then the already-hidden test differs by kind: `aria-hidden` must literally be `"true"` while `inert` counts for any present value other than `"false"`. (candidate) [zag]

### State

- [ ] `aria-hidden.state.1` Given the hide is active, when a new element is added outside the targets, then a `MutationObserver` hides it asynchronously, and the revert exposes it again. [react-aria, kobalte]
- [ ] `aria-hidden.state.2` Given the hide is active with an already-hidden container, when a new child is added inside that container, then it gets no `aria-hidden` of its own because the ancestor attribute already covers it, while a new element added at the top level does get one. [react-aria, kobalte]
- [ ] `aria-hidden.state.3` Given the hide is active, when a new element is added inside a target, then it stays exposed while outside siblings stay hidden. [react-aria, kobalte]
- [ ] `aria-hidden.state.4` Given a node is appended, its parent removed, and the node re-appended under a new parent, when the observer flushes, then a node reparented inside a target stays exposed and a node reparented into a hidden container is hidden. (candidate) [react-aria]
- [ ] `aria-hidden.state.5` Given a list of wrapped rows under an active hide, when the list is reordered twice and the hide reverts, then no stale `aria-hidden="true"` is left on a moved row's wrapper. (candidate) [react-aria]

### Dismissal and layering

- [ ] `aria-hidden.dismissal.1` Given one hide active over a wide target set, when a second nested hide narrows the targets, then the newly excluded elements are hidden too; reverting the inner hide exposes them again while the outer hide's own hidden elements stay hidden, and reverting the outer hide exposes everything. [react-aria, base-ui, kobalte]
- [ ] `aria-hidden.dismissal.2` Given two stacked hides, when their reverts run out of order (outer first), then nothing is exposed prematurely and everything is exposed only after the last revert, so the attribute claims are reference counted per node. [react-aria, base-ui, kobalte]
- [ ] `aria-hidden.dismissal.3` Given three stacked calls that use `aria-hidden`, `inert` and marker-only control respectively, when each reverts, then each removes only what it claimed. (candidate) [base-ui]
- [ ] `aria-hidden.dismissal.4` Given an outside element that already carried an externally set `inert` or `aria-hidden`, when overlapping hides claim and release it, then the library-added attribute is removed and the externally owned one survives. (candidate) [base-ui]
- [ ] `aria-hidden.dismissal.5` Given a hide is reverted and a new hide for the same target starts synchronously in the same tick before the deferred write runs, when the tick flushes, then the outside elements stay hidden throughout, so ownership hands off with no window where they become exposed. (candidate) [kobalte]
- [ ] `aria-hidden.dismissal.6` Given the global claim count drops to zero, then the counter maps are thrown away and recreated, which is the only thing that stops module-level state accumulating stale counts. (candidate) [zag]

### Accessibility tooling

- [ ] `aria-hidden.a11y.1` Given the hide is active, when role queries run, then the hidden elements are not matched at all and only the targets and their descendants are, and after the revert every role query matches again. [react-aria, kobalte]
- [ ] `aria-hidden.a11y.2` Given an element hidden only through its wrapping container, when a role query runs, then it is not matched, so hiding a container is enough to remove its descendants from the accessibility tree outside WebKit's grid exception. [react-aria, kobalte]

### SSR and hydration

- [ ] `aria-hidden.ssr.1` Given the hide is deferred to a frame by default, then it runs after the framework has committed portalled content, and the deferral can be turned off to run synchronously. (candidate) [zag]
- [ ] `aria-hidden.ssr.2` Given a target list that resolves to nothing, when the hide runs, then it bails without hiding anything, so a not-yet-mounted dialog never hides the page. (candidate) [zag]

### Notes and edge cases

- [ ] `aria-hidden.notes.1` Given a target inside a shadow root, when the hide runs, then siblings inside the same shadow root and content in the light DOM are both hidden while the shadow host, the host's ancestor chain and the target stay exposed, through arbitrarily nested shadow roots. [react-aria, base-ui]
- [ ] `aria-hidden.notes.2` Given a hide active over a shadow root, when content is added into that shadow root afterwards, then the observer inside the shadow root hides it. (candidate) [react-aria]
- [ ] `aria-hidden.notes.3` Given a combobox pattern where the input and the popup live in separate containers inside one shadow root, when both are passed as targets, then both and their direct containers stay exposed while an unrelated sibling container is hidden. (candidate) [react-aria]
- [ ] `aria-hidden.notes.4` Given a target nested inside an anchor inside a shadow root, when the hide runs, then the walk terminates without infinite recursion and resolves the shadow host as the element to avoid. (candidate) [base-ui]
- [ ] `aria-hidden.notes.5` Given a target that is not contained by the walk's root, then the host chain is retried and, failing that, the target is dropped with a console error rather than throwing; each per-node attribute write is also guarded so one hostile node cannot abort the walk. (candidate) [zag]
- [ ] `aria-hidden.notes.6` Given the attribute writes are deferred behind a timer and a frame to avoid Chromium's warning about `aria-hidden` on an element whose descendant retains focus, then a conformance test must flush both before asserting the attribute. Chromium. (candidate) [kobalte]

## aria-modal-polyfill

### Accessibility tooling

- [ ] `aria-modal-polyfill.a11y.1` Given the modal watcher is installed, when a modal dialog opens, then the rest of the tree is removed from the accessibility tree, focus moves into the dialog, and Escape closes it and restores the tree after the exit animation. The polyfill exists because Safari with VoiceOver ignores `aria-modal`. Safari. (candidate) [react-aria]
- [ ] `aria-modal-polyfill.a11y.2` Given the modal watcher and a dialog containing a nested dialog trigger, when the outer dialog opens, then only the nested trigger is reachable; when the inner dialog opens, nothing outside it is; and each Escape restores exactly one level. (candidate) [react-aria]
- [ ] `aria-modal-polyfill.a11y.3` Given the modal watcher, when a menu, a tray or a popover opens, then the same hide, focus and Escape contract holds for each of them, not only for dialogs. (candidate) [react-aria]

## prevent-scroll

Covers `usePreventScroll`, `createPreventScroll`, `preventBodyScroll`,
`removeScroll` and `useBodyScrollLock`.

### State

- [ ] `prevent-scroll.state.1` Given no active lock, when a lock is applied, then the scroll container gets inline `overflow: hidden`, and releasing it restores the previous inline value exactly rather than clearing the property. [react-aria, zag, corvu, reka, bits]
- [ ] `prevent-scroll.state.2` Given several holders of the lock, when one releases, then the page stays locked, and only the last release unlocks, in any release order. [react-aria, zag, corvu, reka]
- [ ] `prevent-scroll.state.3` Given a release is called more than once, then it decrements the count only once and does not throw. [zag, reka]
- [ ] `prevent-scroll.state.4` Given a lock that was fully released, when a new lock is applied, then it takes effect again, so the per-document state is deleted rather than left at a stale count. [zag, reka]
- [ ] `prevent-scroll.state.5` Given an active lock, when the holder is re-rendered as disabled without unmounting, then the lock is released. [react-aria, reka]
- [ ] `prevent-scroll.state.6` Given nested locks held by independent callers such as a dialog and a drawer, when the dialog releases, then the lock stays for the drawer and only the drawer's release unlocks. [zag, corvu, reka]
- [ ] `prevent-scroll.state.7` Given the React Strict Mode mount, cleanup, mount sequence where setup runs a second time before the first cleanup fires, when both releases eventually run, then the page ends unlocked. (candidate) [zag]
- [ ] `prevent-scroll.state.8` Given a lock toggled on and off inside the same synchronous tick, when the tick flushes, then both `overflow` and `pointer-events` are back to their original values, so a rapid toggle cannot leave the page permanently locked. (candidate) [reka]
- [ ] `prevent-scroll.state.9` Given the hook is mounted with no lock requested, then the page is never locked. (candidate) [reka]
- [ ] `prevent-scroll.state.10` Given two distinct documents, when each is locked, then both are locked independently and releasing one leaves the other locked, because the lock state is keyed on the document. (candidate) [zag]

### Dismissal and layering

- [ ] `prevent-scroll.dismissal.1` Given several locks, then only the topmost one is active and attaches listeners; unmounting it hands control back to the one below. [zag, corvu]
- [ ] `prevent-scroll.dismissal.2` Divergence: the lock is applied to `document.documentElement`. (decision needed) [react-aria, corvu]
- [ ] `prevent-scroll.dismissal.3` Divergence: the lock is applied to `document.body`. (decision needed) [zag, reka]
- [ ] `prevent-scroll.dismissal.4` Given the document element does not establish its own scroll container, when the lock applies, then `body` gets `overflow: hidden`; given the document element does own the viewport scroll, then the document element gets it instead, so the utility picks whichever of the two is the real overflow element. (candidate) [zag]
- [ ] `prevent-scroll.dismissal.5` Given the document element owns the scroll container, when the lock applies, then the `body` still carries the scroll-lock marker attribute even though the element actually locked is the document element. (candidate) [zag]
- [ ] `prevent-scroll.dismissal.6` Given an external `overflow` lock already applied to the body that cannot stop the page scrolling because the document element owns the scroller, when a dialog opens, then the document element is locked anyway and closing clears the marker. (browser-only) (candidate) [zag]

### Positioning

- [ ] `prevent-scroll.positioning.1` Given a measured scrollbar width of `window.innerWidth` minus the document element's `clientWidth` greater than zero, when the lock applies, then the locked container's `padding-right` becomes the existing computed padding plus the scrollbar width, expressed so the author's own padding survives, and a `--scrollbar-width` custom property is published. [zag, corvu, reka]
- [ ] `prevent-scroll.positioning.2` Given a measured scrollbar width of zero (an overlay scrollbar or a mobile browser), when the lock applies, then neither padding nor margin is touched and no scrollbar-width property is set. [zag, corvu]
- [ ] `prevent-scroll.positioning.3` Given the compensation mode is set to margin, when the lock applies, then `margin-right` is adjusted instead of `padding-right`. (candidate) [corvu]
- [ ] `prevent-scroll.positioning.4` Given either the document element or the body has `scrollbar-gutter: stable`, when the lock applies, then the compensation padding is skipped because the browser already reserves the space. (candidate) [zag]
- [ ] `prevent-scroll.positioning.5` Given a right-to-left document whose body scrollbar sits on the left, when the lock applies, then the compensation goes on `padding-left` instead, chosen from the document element's rounded `left` plus `scrollLeft`. (candidate) [zag]
- [ ] `prevent-scroll.positioning.6` Given scroll-position restoration is on and the scrollbar width is non-zero, when the lock is released, then the window is scrolled back to the offsets captured at lock time, undoing the jump. (candidate) [corvu]

### Pointer

- [ ] `prevent-scroll.pointer.1` Given the active lock, then `wheel`, `touchstart` and `touchmove` listeners are attached to the document with `{ passive: false }` so they can prevent the default, and a non-topmost lock attaches none. (candidate) [corvu]
- [ ] `prevent-scroll.pointer.2` Given a `wheel` event, when the dominant axis is picked by comparing the absolute deltas and the target is inside the allowed element, then the event is prevented only if scrolling would not actually happen on that axis; a target outside the allowed element is always prevented. (candidate) [corvu]
- [ ] `prevent-scroll.pointer.3` Given a `touchstart`, then the starting coordinates are recorded and the cached axis is reset, and the axis is computed once on the first `touchmove` and cached for the rest of the gesture, so a gesture that starts vertical stays vertical even if it curves. (candidate) [corvu]
- [ ] `prevent-scroll.pointer.4` Given a `touchmove` with exactly two touches, when it fires, then it is prevented unless pinch zoom is explicitly allowed, so pinch zoom is blocked by default while the lock is active. (candidate) [corvu]
- [ ] `prevent-scroll.pointer.5` Given a `touchmove` whose target is an `input type="range"`, when it fires, then it is never prevented, so a slider stays draggable inside a locked surface; the wheel handler has no matching exemption. (candidate) [corvu]
- [ ] `prevent-scroll.pointer.6` Given a `wheel` or `touchmove` that is not cancelable, when it would be prevented, then the call is skipped to avoid a console warning. (candidate) [corvu]
- [ ] `prevent-scroll.pointer.7` Given the would-scroll check, then a positive delta reports no scroll when the remaining distance is one pixel or less and a negative delta reports none when the current offset is under one pixel, because Firefox reports an available scroll of 1 when there is none. Firefox. (candidate) [corvu]

### Notes and edge cases

- [ ] `prevent-scroll.notes.1` Given restoration snapshots the previous inline value of each property it writes, then the `style` attribute is removed entirely when the element's inline style ends up empty. [zag, corvu, bits]
- [ ] `prevent-scroll.notes.2` Given the lock is measured in jsdom, then `window.innerWidth` minus the document element's `clientWidth` is zero, `scrollHeight` and `scrollTop` are always zero, and touch and wheel events need constructing by hand, so the scrollbar-shift, would-scroll and gesture paths all need stubs before an assertion means anything. (browser-only) [corvu, reka]
- [ ] `prevent-scroll.notes.3` Given iOS ignores `overflow: hidden` on the body, when the lock applies there, then the body is pinned with `position: fixed`, `overflow: hidden`, `right: 0` and negative `top` and `left` offsets computed from the current scroll position, and the cleanup restores the stashed inline styles and scrolls the page back instantly. iOS Safari. (candidate) [zag]
- [ ] `prevent-scroll.notes.4` Given the iOS offsets, then they subtract the visual viewport's floored `offsetTop` and `offsetLeft` to account for a zoomed or keyboard-shifted viewport, falling back to zero where `visualViewport` is missing. iOS Safari. (candidate) [zag]
- [ ] `prevent-scroll.notes.5` Given the release work is scheduled on a 24 millisecond timer, when the global document has been replaced or removed before that timer fires, then the original document's body style attribute is restored exactly, the scrollbar-width property is cleared, and no other document's body is touched. (candidate) [bits]

## portal

### Roles and attributes

- [ ] `portal.roles.1` Given a portal with no container, when it renders, then its content's parent is the document body rather than its position in the component tree. [radix, base-ui, zag, ark, ariakit, headlessui, reka, bits]
- [ ] `portal.roles.2` Given a portal with a container element, a ref to one, or a selector string by id, class or attribute, when it renders, then the content's parent is that container. [radix, base-ui, ark, headlessui, reka, bits]
- [ ] `portal.roles.3` Given several portals targeting different containers, when they render, then each sits under its own target. [headlessui, bits]
- [ ] `portal.roles.4` Given a portal whose container is initially null and filled in by a ref callback after an effect, when the container resolves, then the content is moved into it. (candidate) [base-ui]
- [ ] `portal.roles.5` Given a portal whose container changes between undefined and an element, when it changes, then the portal node is reparented each time and the previous container no longer holds the content. (candidate) [base-ui]
- [ ] `portal.roles.6` Given a portal with a shared portal root, when the last portal unmounts, then the root element is cleaned up, and external tampering with the root is repaired on the next render. (candidate) [headlessui]

### State

- [ ] `portal.state.1` Given a portal that is disabled, when it renders, then the content stays in place in the component tree, and disabling wins over any declared container. [ark, reka, bits]

### Dismissal and layering

- [ ] `portal.dismissal.1` Given a layer whose content is portalled out of its trigger's subtree, when a press lands on that portalled content, then it counts as inside the layer and nothing dismisses. [base-ui, zag, melt]
- [ ] `portal.dismissal.2` Given an open popover containing an open tooltip, select or menu whose content is portalled elsewhere, when Escape is pressed, then only the inner layer closes and the popover stays open with its focus containment intact. [base-ui, melt]
- [ ] `portal.dismissal.3` Given an open popover containing an open select whose content is portalled elsewhere, when an outside element is clicked, then the select closes, the popover stays open, and its focus containment still holds. (candidate) [melt]
- [ ] `portal.dismissal.4` Given a popover containing a tooltip, when the tooltip's own content is clicked, then both stay open, whether the two use sibling portals or a single portal. (candidate) [melt]
- [ ] `portal.dismissal.5` Given a deeply nested recursive arrangement of dialogs, menus, selects and popovers, when each trigger is opened depth first, then every level shows its own content and its immediate children's triggers, grandchildren stay hidden until their parent opens, and each level closes on Escape and on an outside click while its trigger and the outside element stay visible; the same holds with and without portalling and with and without forced visibility. (candidate) [melt]
- [ ] `portal.dismissal.6` Given two nested layers rendered into different portal containers, when the inner one opens, then it does not count as an outside press on the outer one and both stay open. (candidate) [base-ui]

### Animation and presence

- [ ] `portal.animation.1` Given a portal with rendered content, when the component unmounts, then the portalled node is removed from the document. [ariakit, headlessui, bits]

### SSR and hydration

- [ ] `portal.ssr.1` Given a portal rendered on the server, when SSR runs, then it does not error and the children are rendered inline, with the portal taking effect only after hydration. [ark, headlessui]

### Notes and edge cases

- [ ] `portal.notes.1` Given an environment provider that resolves a shadow root, when a portal inside it renders, then the content is mounted into that shadow root rather than into the document body, and the mount node is resolved from the root node's own `getRootNode()`. [react-aria, ark]
- [ ] `portal.notes.2` Given a portal whose ref identity changes on every render, when text is typed into a field inside the portalled content, then the whole string lands in the field and focus stays there, because the portal node is not recreated per keystroke. (candidate) [ariakit]
- [ ] `portal.notes.3` Given the portal prop is toggled off, when the content moves back in place, then the ref cleanup runs while the node is still connected and no new ref is attached to the removed node. Chromium. (candidate) [ariakit]
- [ ] `portal.notes.4` Given a document whose `defaultView` is shadowed by a named element, when a portal renders while the page is fullscreen, then the portal node still lands inside the fullscreen element and interacting with the portalled content does not error. (candidate) [ariakit]
- [ ] `portal.notes.5` Given a portal with a declared container, when it mounts, then its children render twice because the container state starts null and an effect fills it in after the ref attaches, while a portal with no container renders once. (candidate) [ark]
- [ ] `portal.notes.6` Given a portal with several element children, when it renders, then all of them appear, because the implementation portals each child rather than one wrapper. (candidate) [ark]

## dismiss-button

### Roles and attributes

- [ ] `dismiss-button.roles.1` Given a bare dismiss button, when it renders, then it is a visually hidden `button` reachable only to assistive technology, carrying `aria-label="Dismiss"` by default. (candidate) [react-aria]
- [ ] `dismiss-button.roles.2` Given a dismiss button with an explicit `aria-label`, when it renders, then the override replaces the default. (candidate) [react-aria]
- [ ] `dismiss-button.roles.3` Given a dismiss button with `aria-labelledby` pointing at an external element, when it renders, then no `aria-label` is emitted; given both, `aria-labelledby` becomes the button's own id followed by the external id and the `aria-label` is kept. (candidate) [react-aria]

## nested-overlay-ordering

Cross-cutting rules for what happens when more than one overlay is open.

### Keyboard

- [ ] `nested-overlay-ordering.keyboard.1` Given two nested open layers, when Escape is pressed once, then only the innermost layer closes and the outer one stays open; a second Escape closes the outer one. [react-aria, radix, base-ui, zag, corvu, reka, melt]
- [ ] `nested-overlay-ordering.keyboard.2` Divergence: Escape can be configured to bubble so one press closes the whole nested chain, and the setting is read per layer so a mixed chain closes only up to the first layer that does not bubble. (decision needed) [base-ui, melt]
- [ ] `nested-overlay-ordering.keyboard.3` Given an open dialog containing a focus-triggered tooltip with no shared layer tree, when Escape is pressed, then only the tooltip closes and the dialog stays open. [base-ui, melt]
- [ ] `nested-overlay-ordering.keyboard.4` Given a nested child layer configured to ignore Escape, when Escape is pressed, then neither the child nor its parent closes, so an ignoring layer swallows the key for the whole stack beneath it. (candidate) [melt]
- [ ] `nested-overlay-ordering.keyboard.5` Given an open parent layer whose Escape behavior is changed while a child layer is open, when Escape is pressed, then the child still closes and the parent stays open, because updating the option does not move the parent to the top of the stack. (candidate) [melt]

### Pointer

- [ ] `nested-overlay-ordering.pointer.1` Given two nested open layers, when a press lands outside both, then only the innermost layer closes and a second outside press closes the outer one. [react-aria, radix, base-ui, zag, corvu, reka]
- [ ] `nested-overlay-ordering.pointer.2` Divergence: outside presses bubble by default, so one press outside a nested chain closes every layer in it. (decision needed) [base-ui]
- [ ] `nested-overlay-ordering.pointer.3` Given two nested open layers, when a press lands inside the inner one, then neither closes; when it lands inside the outer one but outside the inner one, then only the inner one closes. [base-ui, zag, reka, melt]
- [ ] `nested-overlay-ordering.pointer.4` Given a modal parent layer that defers touch dismissal to a click and a nested child layer, when an outside touch tap completes, then only the child closes and the parent stays open. [radix, reka]
- [ ] `nested-overlay-ordering.pointer.5` Given an ancestor wrapper that calls `stopPropagation()` on bubble-phase `pointerdown` around nested portalled layers, when the outer layer's content is clicked, then only the inner layer closes, because outside-press detection listens in the capture phase. (candidate) [base-ui]

### Focus management

- [ ] `nested-overlay-ordering.focus.1` Given nested layers each with their own focus containment, when a layer closes, then focus returns to that layer's own trigger, and closing the next one returns focus to its trigger in turn. [react-aria, base-ui, zag]
- [ ] `nested-overlay-ordering.focus.2` Given nested modal layers, when the inner one opens, then only the innermost layer is exposed to assistive technology, and each close exposes exactly one more level. [react-aria, base-ui]
- [ ] `nested-overlay-ordering.focus.3` Given a layer whose content simultaneously closes it and opens a sibling layer, when the sibling later closes with Escape, then focus returns to the original layer's trigger rather than to the removed content. (candidate) [base-ui]

### Dismissal and layering

- [ ] `nested-overlay-ordering.dismissal.1` Given nested layers of the same type, when the parent is removed, then its nested layers are dismissed with it. [zag, corvu]
- [ ] `nested-overlay-ordering.dismissal.2` Given nested layers, when a layer is disabled rather than unmounted, then it leaves the stack and the layer beneath becomes the topmost one, so disable and unmount are equivalent for ordering. [zag, corvu, reka]
- [ ] `nested-overlay-ordering.dismissal.3` Given nested layers that each lock body pointer events or page scroll, when they unwind in any order, then the lock is released only once the last holder is gone and the original inline values are restored exactly. [react-aria, zag, corvu, reka]
- [ ] `nested-overlay-ordering.dismissal.4` Given a layer that exposes whether it is the topmost one, then its content can render or behave differently while a layer sits above it. (candidate) [corvu]

## Sources

- `docs/research/radix-and-base-ui.md`: `dismissable-layer`, `focus-scope`, `portal`, `roving-focus`.
- `docs/research/reka-melt-bits.md`: `dismissable-layer`, `escape-keydown`, `focus-scope`, `focus-guards`, `body-scroll-lock`, `portal`.
- `docs/research/kobalte-and-corvu.md`: `interact-outside`, `dismissable`, `escape-key`, `hide-outside`, `prevent-scroll`, `focus-trap`.
- `docs/research/react-aria-a.md`: `overlay`, `prevent-scroll`, `dismiss-button`, `aria-hide-outside`, `aria-modal-polyfill`, `focus-scope`, `interact-outside`.
- `docs/research/zag-and-ark.md`: `focus-trap`, `dismissable`, `interact-outside`, `remove-scroll`, `aria-hidden`, `portal`.
- `docs/research/ariakit-and-headlessui.md`: `portal`, `focus-trap`.

## Deferred

- The radix `popper` section was pulled in with this group's extraction but belongs to `positioning.md`, and the bullets were left there rather than duplicated here.
- Base UI's popup store internals (trigger registration maps, active-trigger claiming, open-state transition helpers, change-reason to instant-type mapping) are a store contract rather than DOM behavior. The observable parts that survived are the trigger-ownership rules a component spec needs: a lone trigger is claimed implicitly on open, a programmatic open records that it had no trigger, and a popup can be configured to close when its active trigger unmounts. Those belong in `popover.md` and `dialog.md`, not here.
- Node-tree helpers (`getNodeChildren`, `getNodeAncestors`) and the trigger map's development-only duplicate-id invariant are implementation utilities with no DOM-visible behavior.
- Radix's `RovingFocusGroup` has no test file of its own; its contract is asserted through the components that compose it, so nothing landed here.
- Whether the body pointer-events lock belongs to the dismissable layer at all is unresolved. Radix, reka, zag and corvu all put it there, and zag additionally writes `data-inert` on the body. We have not decided whether to keep a separate pointer-events lock alongside the scroll lock or fold both into one primitive.
- Tabbable-set semantics differ across libraries in ways that are only partly captured by `focus-scope.notes.11` and `focus-scope.notes.12`: whether `aria-disabled` removes an element, how `display: contents` and `content-visibility` are treated, and whether positive `tabindex` values are honored. Most of these assertions need a real layout engine, so they need a browser-mode harness before they can be checked at all.
- Base UI's intentional outside-press mode encodes a drag-and-release model that no other library has. It is captured as candidates under `dismissable-layer.pointer.23` through `.27`, but if we adopt it the whole set becomes the default rather than an option, which is a larger decision.
- corvu's `createStyle` reference-counted inline-style helper and zag's `setStyle` snapshot helper are the same idea with different bookkeeping. The spec asserts the observable outcome (exact restoration, `style` attribute removal when empty) and does not pick an implementation.
