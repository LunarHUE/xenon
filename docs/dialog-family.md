# Dialog, AlertDialog, and Drawer

Each family has a separate public module in core and Solid:
`@tenon/solid/dialog`, `@tenon/solid/alert-dialog`, and `@tenon/solid/drawer`.
The root barrel also exports all three. Shared Solid internals own associations,
presence, and the native controller. Drawer gesture code belongs only to the
Drawer module.

```tsx
import { Dialog } from '@tenon/solid/dialog'

;<Dialog>
  <Dialog.Trigger>Edit profile</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Title>Edit profile</Dialog.Title>
    <Dialog.Description>Change your public name.</Dialog.Description>
    <label>
      Name <input />
    </label>
    <Dialog.Close>Done</Dialog.Close>
  </Dialog.Content>
</Dialog>
```

`Dialog` and `Dialog.Root` are the same component. The root supports controlled
`open`/`onOpenChange`, uncontrolled `defaultOpen`, `modal` (default true),
`forceMount`, `closeOnEscape`, and `closeOnOutside`. Mounting does not emit a
change. Setting a controlled value to undefined returns to internal state.
Trigger and Close use Button's host semantics, disabled handling, and cancelable
author click handlers.

Content is a native `<dialog>` with a fixed host. It uses `showModal()` when
modal, and `show()` otherwise. Style its native `::backdrop`; there is no sibling
Backdrop part. Top-layer rendering avoids ancestor clipping without changing
the DOM tree. Title and Description supply associations only while registered;
author IDs and ARIA attributes win. Forward associations work during SSR and
hydration. A missing accessible name produces a development warning.

Focus containment, nested dismissal, inertness, and scroll locking belong to the
[layering controller](layering.md). `initialFocus` and `finalFocus` accept element
references. `initialFocus: false` disables Tenon's initial focus move; native
dialog opening still performs browser focus behavior. `onEscapeKeyDown` can
cancel Escape. `onPointerOutside` receives the layer's cancelable wrapper; its
`preventDefault()` vetoes dismissal without canceling the native pointer event.

Presence keeps native modality and locks through exit animations. Closed,
force-mounted content is hidden and inactive. Styling uses explicit
`data-state="open"`/`"closed"`, plus presence's starting/ending attributes.
Exit timing uses the Web Animations API; missing support completes immediately.

## AlertDialog

AlertDialog adds Cancel and Action to the common parts. It always uses modal
`role="alertdialog"` semantics and ignores outside-pointer dismissal. Cancel is
the default initial focus target, even when Action appears first. Escape remains
cancelable and enabled by default. An accessible description is required and
missing descriptions produce a development warning.

Action is a closing Button, not a validation or asynchronous action manager.
Prevent its click default or keep the root controlled when work must finish
before closing.

## Drawer

Drawer uses dialog semantics with `side="top" | "right" | "bottom" | "left"`
(default bottom). Parts expose `data-side`; consumer CSS owns edge placement and
animation. Handle is a closing Button with the default name "Close drawer".
Keyboard activation closes it. Pointer dragging uses a dedicated handle so
content remains normally scrollable.

During a drag, content exposes `--drawer-swipe-offset` (positive pixels away from
the chosen edge) and content/handle expose `data-swiping`. Apply the offset to
your transform, reversing its sign for top and left. Releasing after at least
25% of the drawer's relevant dimension, with a minimum of 40px, requests close.
Short drags and pointer cancellation reset the offset; the synthetic click after
a drag does not close it a second time. The helper restores its inline styles
on cleanup.

Snap points, velocity-based dismissal, dragging from arbitrary content,
swipe-to-open, and background scaling are not part of this API. Mouse gestures
are tested in Chromium and WebKit; physical touch gestures remain unverified.
