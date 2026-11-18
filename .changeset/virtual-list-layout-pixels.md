---
'@xenon-ui/dom': patch
'@xenon-ui/solid': patch
---

VirtualList and the dom virtualizer measure rows in layout pixels, so a CSS transform on an ancestor no longer changes their sizes. Inside a container scaled to 0.7, 22px rows used to measure 15.4px and overlap. At 1.3 they measured 28.6px and spread apart, and the total size and the follow check were off by the same factor. Rows now report `offsetHeight` when first measured and the border-box block size from `ResizeObserver` after that, which keeps fractional heights. SVG rows, which have no `offsetHeight`, still use `getBoundingClientRect()`.
