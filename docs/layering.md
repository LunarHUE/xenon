# Layering: first slice

`@tenon/dom` owns active layer registration, logical containment, and Escape
routing. Each owner document has one stack shared across framework roots.
Registration order determines which layer is topmost. Updating callbacks or
Escape policy preserves that order; closing disposes the registration and
reopening creates a new one.

```ts
const layer = registerLayer(content, {
  parent: parentLayer,
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

`update` replaces the Escape options rather than merging them. Omitted `escape`
means `dismiss`. The parent is fixed for the registration's lifetime and must
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

This slice does not implement outside-pointer dismissal, focus containment or
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
