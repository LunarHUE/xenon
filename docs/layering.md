# Layering

`@tenon/dom` owns active layer registration, logical containment, Escape routing,
and outside-pointer dismissal. Each owner document has one stack shared across framework roots.
Registration order determines which layer is topmost. Updating callbacks or
dismissal policy preserves that order; closing disposes the registration and
reopening creates a new one.

```ts
const layer = registerLayer(content, {
  parent: parentLayer,
  outsidePointer: 'dismiss',
  onEscapeKeyDown(event) {
    // preventDefault() cancels the dismissal request.
  },
  onDismiss() {
    setOpen(false)
  },
})
const removeBranch = layer.registerBranch(trigger)
layer.update({ escape: 'ignore' })
removeBranch()
layer.dispose()
```

`update` replaces the dismissal options rather than merging them. Omitted
`escape` means `dismiss`; omitted `outsidePointer` means `ignore`. The parent is fixed for the registration's lifetime and must
be an active handle in the same document. Disposing a parent does not dispose
its children; each adapter owns its own cleanup.

Escape listens in the document's bubble phase. A widget can consume it with
`preventDefault()` or `stopPropagation()` before it reaches the stack. Only the
top layer receives a request. An `ignore` layer consumes Escape without calling
callbacks or falling through. A dismissing layer calls `onEscapeKeyDown` first,
then prevents the native default and calls `onDismiss` unless canceled or
disposed. One event cannot dismiss a second layer when the first closes
synchronously. Composition events suppress Escape until the tick after
`compositionend`; `KeyboardEvent.isComposing` also suppresses it.

`contains(event)` resolves the composed path, including content inside open
shadow roots. Content, registered branches, and active logical descendants
count as inside even when their DOM nodes are portal siblings. Duplicate branch
registrations have independent cleanup. Non-element targets and other documents
do not count as inside. Containment is queried during event dispatch, while the
composed path is available.

Core stays pure. Solid will own refs, reactive registration updates, and open
state. A dismissal is a request: a controlled owner can keep its layer open.
Dispose when logically closed even if presence keeps exit content mounted.

This engine does not yet implement focus-outside dismissal, focus containment or
restoration, scroll locking, background inertness, CSS stacking, portals, or
native dialog synchronization. Those have separate lifetimes and platform
decisions. Native dialog `cancel` routing must be settled before connecting this
Escape listener to `<dialog>`, so one key cannot close two layers.

The research checklist in `spec/layering.md` includes conflicting library
behaviors. This slice adopts topmost-only routing and bubble-phase Escape;
deferring layers, capture-phase Escape, and automatically decorated stack
indices are not implemented. Unit tests cover stack lifetime and cancellation;
Chromium and WebKit tests cover real keyboard dispatch and shadow-root pointer
containment. Automated composition events test the suppression state machine,
not a real operating-system IME session.

## Outside-pointer dismissal

Set `outsidePointer: 'dismiss'` to opt in. Both the primary pointer press and its
matching release must land outside the same top layer during the same open
session. Presses beginning inside, releases ending inside, right clicks, middle
clicks, and Control-clicks do not dismiss. A top layer using `ignore` blocks
outside dismissal of the layers below it without blocking native pointer events.
Keyboard-generated clicks have no matching pointer sequence and are left alone.

Content, branches, and logical children use the same containment rules as
`contains`. Pointer capture requires a physical release hit test because the
event target can still point to where the press began. Capture IDs are tracked
from capture events, including retargeted events from closed shadow roots. The
physical hit test follows open shadow roots and assigned slots; an unavailable or off-document hit cancels the dismissal.

Listeners observe pointer events in capture phase. Stopping propagation in a
widget does not hide the gesture. After the release dispatch finishes, the
engine checks whether the original down or up event was canceled. It then calls
`onPointerOutside` with a cancelable wrapper:

```ts
registerLayer(content, {
  outsidePointer: 'dismiss',
  onPointerOutside(event) {
    if (hasUnsavedChanges()) event.preventDefault()
  },
  onDismiss(event) {
    // KeyboardEvent for Escape; PointerEvent for an outside release.
    setOpen(false)
  },
})
```

The wrapper exposes `originalEvent`, `defaultPrevented`, and `preventDefault()`.
Canceling it vetoes dismissal only. It does not cancel the native focus or click.
The callback runs in a following task, so target and bubble listeners can cancel
the original pointer events first. Options are captured at release time, and
callbacks cannot dismiss a replacement layer or fall through to a parent.

Registration and disposal invalidate pending gestures and scheduled requests.
`pointercancel` cancels the current gesture. A new press, including an additional
contact, also cancels an earlier scheduled request. The engine
never changes pointer capture or blocks scrolling. Unit tests exercise pointer
identity, cancellation, and session changes. Chromium and WebKit tests use real
mouse clicks and drags, including explicit pointer capture. Multiple contacts
and pointer cancellation use simulated unit events. Physical touch and pen
devices are not verified.

This adopts the matched down/up choice from `dismissable-layer.pointer.7` and
primary/context-menu filtering from `.11` and `.12`. The research alternatives
that dismiss on pointerdown alone, wait for a touch-generated click, dismiss from
keyboard clicks, or infer inside regions from arbitrary bounding rectangles are
not implemented. The broader research checklist remains unclaimed until its
component-visible contracts are adopted.
