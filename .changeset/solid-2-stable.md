---
'@xenon-ui/solid': patch
---

Require the stable Solid 2 release. The `solid-js` and `@solidjs/web` peer ranges now start at `2.0.0`, so the 2.0 release candidates no longer satisfy them. Solid 2.0.0 runs ref callbacks under the owner of the component that renders the element, where the release candidates ran them with no owner, and refs passed to Xenon components follow that.
