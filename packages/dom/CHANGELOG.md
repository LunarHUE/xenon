# @xenon-ui/dom

## 0.3.0

### Minor Changes

- [#80](https://github.com/LunarHUE/xenon/pull/80) [`e83fde0`](https://github.com/LunarHUE/xenon/commit/e83fde093ccce7c7ff2fdfed8a6e03ec29fe6cd9) Thanks [@tristendillon](https://github.com/tristendillon)! - A press outside an open popup now closes it even when the same press opens another, unrelated popup. Before, opening a Menu while a Popover was open left both open, and two Menus could sit side by side. This applies to every layer: Popover, Menu, ContextMenu, Menubar, NavigationMenu, Select, Combobox, and nonmodal Dialog, AlertDialog and Drawer. Layers opened from inside another still keep their ancestors open, and a press that opens nothing still closes only the newest layer. `closeOnOutside: false` and a `preventDefault()` in `onPointerOutside` keep a layer open and also keep the layers beneath it open. The fix is in `@xenon-ui/dom`'s layer registry.

### Patch Changes

- [#80](https://github.com/LunarHUE/xenon/pull/80) [`e83fde0`](https://github.com/LunarHUE/xenon/commit/e83fde093ccce7c7ff2fdfed8a6e03ec29fe6cd9) Thanks [@tristendillon](https://github.com/tristendillon)! - VirtualList and the dom virtualizer measure rows in layout pixels, so a CSS transform on an ancestor no longer changes their sizes. Inside a container scaled to 0.7, 22px rows used to measure 15.4px and overlap. At 1.3 they measured 28.6px and spread apart, and the total size and the follow check were off by the same factor. Rows now report `offsetHeight` when first measured and the border-box block size from `ResizeObserver` after that, which keeps fractional heights. SVG rows, which have no `offsetHeight`, still use `getBoundingClientRect()`.
