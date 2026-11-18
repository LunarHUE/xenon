---
'@xenon-ui/dom': minor
'@xenon-ui/solid': minor
---

A press outside an open popup now closes it even when the same press opens another, unrelated popup. Before, opening a Menu while a Popover was open left both open, and two Menus could sit side by side. This applies to every layer: Popover, Menu, ContextMenu, Menubar, NavigationMenu, Select, Combobox, and nonmodal Dialog, AlertDialog and Drawer. Layers opened from inside another still keep their ancestors open, and a press that opens nothing still closes only the newest layer. `closeOnOutside: false` and a `preventDefault()` in `onPointerOutside` keep a layer open and also keep the layers beneath it open. The fix is in `@xenon-ui/dom`'s layer registry.
