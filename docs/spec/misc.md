# misc

Small components that need a spec but not a file each: separator, visually
hidden, accessible icon, aspect ratio, avatar, live region, announce. Each gets
its own `##` section here. If one grows past about thirty bullets it should move
to its own file.

## separator

### Roles and attributes

- [ ] `separator.roles.1` Given a separator, then it exposes `role="separator"`, whether implicitly through a native `hr` or explicitly through the attribute. [apg, radix, base-ui, kobalte, melt, bits, react-aria, ariakit]
- [ ] `separator.roles.2` [apg] Given a separator, then it should have `aria-orientation` consistent with its visual orientation, and it must not be focusable or interactive when it is dividing a menu.
- [ ] `separator.roles.3` Given `orientation="vertical"`, then `aria-orientation="vertical"` is set, because it differs from the role's implicit default. [base-ui, kobalte, melt, react-aria]
- [ ] `separator.roles.4` Divergence: given `orientation="horizontal"` (or no orientation), then no `aria-orientation` attribute is written at all, because horizontal is the role's implicit default and a default value should never be written out redundantly. [kobalte, react-aria] (decision needed)
- [ ] `separator.roles.5` Divergence: given `orientation="horizontal"`, then `aria-orientation="horizontal"` is written explicitly. [base-ui, ariakit] (decision needed)
- [ ] `separator.roles.6` Given any orientation, then `data-orientation` is always written even when `aria-orientation` is not: the styling hook is unconditional while the ARIA attribute is written only when it carries information. [radix, base-ui, kobalte]
- [ ] `separator.roles.7` Divergence: given no `as`/`render` override, then the rendered element is a native `hr`, and an explicit `role="separator"` is added only when the resolved element is something else. [kobalte, ariakit, react-aria] (decision needed)
- [ ] `separator.roles.8` Divergence: given no override, then the rendered element is a `div` (or `span`) carrying an explicit `role="separator"`. [base-ui, radix, bits] (decision needed)
- [ ] `separator.roles.9` Given `decorative`, then the role becomes `none` rather than `separator`, so a separator carrying no structural meaning is not announced. [radix, melt]
- [ ] `separator.roles.10` Given an `aria-label` or `aria-labelledby`, then it lands on the separator element verbatim. [react-aria]
- [ ] `separator.roles.11` Given each part, then it carries `data-separator-root`. [bits] (candidate)

### SSR and hydration

- [ ] `separator.ssr.1` Given server rendering and hydration, then no errors occur. [react-aria] (candidate)

### Accessibility tooling

- [ ] `separator.a11y.1` Given a horizontal separator and a vertical one, then an axe run reports no violations. [axe, reka, melt]
- [ ] `separator.a11y.2` Divergence: [axe] Given `role="separator"`, then `aria-valuenow` is a required attribute in axe's role table. It is meant for a focusable separator (a splitter), but `aria-required-attr` flags a non-focusable separator that omits it at critical impact, so the suite has to decide deliberately whether to set it. Every library in the research ships a non-focusable separator with no `aria-valuenow`, and Reka's and Melt's axe runs still pass, so the rule's behavior in practice needs checking before this is settled. (decision needed)

### Notes and edge cases

- [ ] `separator.notes.1` Given any part, then props the component does not consume land on the rendered element, the ref resolves to it, a polymorphic escape hatch swaps the element while keeping the role and orientation attributes, and arbitrary `data-*` props pass through. [radix, base-ui, react-aria, bits]
- [ ] `separator.notes.2` Given a slot name plus a context provider mapping that slot to props, then the element carries both the slot name and the provided props. [react-aria] (candidate)

## visually-hidden

### Roles and attributes

- [ ] `visually-hidden.roles.1` Given a visually hidden wrapper, then its text contributes to the accessible name of its host while remaining invisible on screen. [radix, base-ui, reka, react-aria, ariakit]
- [ ] `visually-hidden.roles.2` Given no override, then the rendered element is a `span`. [reka, ariakit, base-ui]
- [ ] `visually-hidden.roles.3` Divergence: given the hiding recipe, then the full inline style set is `border-width: 0; clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; width: 1px`. [ariakit, reka] (decision needed)
- [ ] `visually-hidden.roles.4` Divergence: given the hiding recipe, then it is the older `clip: rect(0 0 0 0)` form, with `border: 0`, `height: 1px`, `margin: -1px`, `overflow: hidden`, `padding: 0`, `position: absolute`, `width: 1px`, `white-space: nowrap` and `word-wrap: normal`. [zag] (decision needed)
- [ ] `visually-hidden.roles.5` Divergence: given the hiding recipe, then only `position: absolute` and `overflow: hidden` are library-owned inline styles and the rest is left to the author's stylesheet. [radix] (decision needed)
- [ ] `visually-hidden.roles.6` Given an author `style`, `className` or `ref`, then they all still apply alongside the library's own inline styles. [radix]

### Focus management

- [ ] `visually-hidden.focus.1` Given a visually hidden wrapper around a focusable element, when the user tabs to it, then it does receive focus and the clipping style is unchanged, so the content stays visually hidden while focused. [react-aria]
- [ ] `visually-hidden.focus.2` Divergence: given a focusable variant flag, then the wrapper's inline style is cleared to an empty string while focused, revealing the content. [react-aria] (decision needed)
- [ ] `visually-hidden.focus.3` Divergence: given a two-mode API, then the focusable mode sets `aria-hidden="true"` with no `tabindex` and no extra marker (so the element keeps its natural tab order), while the fully-hidden mode sets `aria-hidden="true"`, `tabindex="-1"` and `data-hidden=""`. The fully-hidden mode is what makes `aria-hidden` safe: the element cannot be focused, which is what prevents axe `label` and `nested-interactive` violations for the hidden form inputs that depend on it. [reka] (decision needed)

### Notes and edge cases

- [ ] `visually-hidden.notes.1` Given a polymorphic escape hatch, then the hiding styles are applied to the supplied element rather than to a wrapper. [radix, ariakit]

## accessible-icon

### Roles and attributes

- [ ] `accessible-icon.roles.1` Given a label and a single icon child, then the label text is present in the document. [radix] (candidate)
- [ ] `accessible-icon.roles.2` Given an `svg` child, then it receives `aria-hidden="true"` so it does not contribute to the accessible name. [radix, apg] (candidate)
- [ ] `accessible-icon.roles.3` Given an `svg` child, then it receives `focusable="false"`, because legacy Internet Explorer and Edge put SVG elements in the tab order otherwise. [radix] (candidate)

### Accessibility tooling

- [ ] `accessible-icon.a11y.1` Given a default accessible icon wrapping an `svg`, then an axe run reports no violations. [axe, radix] (candidate)

### Notes and edge cases

- [ ] `accessible-icon.notes.1` Given no children, then rendering throws, because the component needs exactly one child to clone. [radix] (candidate)

## aspect-ratio

### Roles and attributes

- [ ] `aspect-ratio.roles.1` Given an aspect ratio wrapper, then it renders two elements: an outer wrapper marked with a library-owned data attribute (`data-radix-aspect-ratio-wrapper`, `data-reka-aspect-ratio-wrapper`) carrying `position: relative; width: 100%` plus a `padding-bottom` percentage computed from the ratio, and an inner element carrying `position: absolute; inset: 0`. [radix, reka]
- [ ] `aspect-ratio.roles.2` Given an author `className`, `style`, `ref` or `onClick`, then they land on the inner element alongside the library's own `position: absolute`, and a polymorphic escape hatch swaps that element while keeping the wrapper. [radix]

### Accessibility tooling

- [ ] `aspect-ratio.a11y.1` Given an aspect ratio wrapping content (a `span`, or an `img` with alt text), then an axe run reports no violations. [axe, radix, reka]

### Notes and edge cases

- [ ] `aspect-ratio.notes.1` Given modern CSS, then the `aspect-ratio` property makes the padding-bottom wrapper unnecessary and both libraries' recipes predate it. Whether to ship this component at all is an open question, not a behavior to merge. [radix, reka] (decision needed)

## avatar

### Roles and attributes

- [ ] `avatar.roles.1` Given an avatar with a root, an image and a fallback, then each part carries its own data attribute (`data-avatar-root`, `data-avatar-image`, `data-avatar-fallback`, or `data-scope="avatar"` plus `data-part`). [zag, ark, bits]
- [ ] `avatar.roles.2` Given an image with an `alt`, then the loaded image is findable by that alt text and exposes `role="img"` with that accessible name. [radix, base-ui, reka, bits]
- [ ] `avatar.roles.3` Given native image props (`crossOrigin`, `referrerPolicy`, `sizes`, `src`, `srcSet`), then they are forwarded to the rendered `img` verbatim. [base-ui]
- [ ] `avatar.roles.4` Given `srcSet` with no `src`, then the image still loads and the fallback is not shown. [base-ui] (candidate)
- [ ] `avatar.roles.5` Given a mounted-while-loading image, then it carries `aria-hidden="true"` and no element exposes `role="img"`, so only the fallback names the avatar; the attribute is removed on load, comes back when the source changes, and stays after an error. [base-ui] (candidate)
- [ ] `avatar.roles.6` Given an explicit author `aria-hidden`, then it is never overwritten by the library's own value. [base-ui] (candidate)
- [ ] `avatar.roles.7` Given a mounted-while-loading image, then its state is exposed as `data-loading` while loading, neither attribute once loaded, and `data-error` after a failure; the root additionally exposes a `data-status`. [base-ui, bits]
- [ ] `avatar.roles.8` Given the image and the fallback, then their visibility is exactly inverse: the image is hidden until it loads and the fallback is hidden once it has, each with the matching `data-state`. [zag, ark]

### State

- [ ] `avatar.state.1` Given an image that has not loaded, then the fallback is shown and no `role="img"` element is in the document; once the image loads the fallback is removed and the image appears. [radix, base-ui, zag, ark, reka, melt, bits]
- [ ] `avatar.state.2` Given an image that loads but reports a natural width of zero, then it is treated as a failure: the status becomes `error` and the fallback is shown. [radix, base-ui]
- [ ] `avatar.state.3` Given no `src`, an `undefined` `src`, or an empty-string `src`, then no `role="img"` element is rendered, the status resolves to `error`, and the fallback is shown. [radix, base-ui, zag, ark, melt, bits]
- [ ] `avatar.state.4` Given a loading-status callback, then it receives exactly the sequence `loading` then `loaded` on success and `loading` then `error` on failure, and it is never called with `idle` while the image is mounted. [radix, base-ui, bits]
- [ ] `avatar.state.5` Given a cached image (the probe reports `complete` with a non-zero natural width), then the image is present immediately with no load wait, the fallback never appears, and the status resolves without emitting `idle`; a cached-but-broken image resolves straight to `error`. [radix, base-ui]
- [ ] `avatar.state.6` Given a loaded image whose `src` then changes, then the `role="img"` element is removed immediately, the status resets to `loading`, the fallback reappears, and the image comes back only once the new source has loaded. [radix, base-ui, bits]
- [ ] `avatar.state.7` Given an in-flight load whose `src` changes or whose component unmounts, then events from the obsolete image are ignored: no status change is reported, a pending display delay is canceled, and only the replacement's events count. [bits]
- [ ] `avatar.state.8` Given a loaded image whose unrelated props change (a `className`, or a render element swapped without changing the source), then the loading-status callback is not called again: only a source change resets a loaded status. [base-ui] (candidate)
- [ ] `avatar.state.9` Given a loaded image element that is then unmounted, then the fallback comes back. [radix, base-ui]
- [ ] `avatar.state.10` Given a `referrerPolicy`, then it is applied to the loading probe as well as to the visible image, so an image that only loads under `no-referrer` loads, and one served with a different policy never appears. [radix]
- [ ] `avatar.state.11` Given author `onLoad` and `onError` handlers, then each is called exactly once for the corresponding event, and a handler that opts out of the library's own handling suppresses the status update. [base-ui] (candidate)
- [ ] `avatar.state.12` Given an imperative API, then load and error can be driven from it as well as from the image element's own events, and the two sources are distinguishable. [zag] (candidate)

### Animation and presence

- [ ] `avatar.animation.1` Divergence: given a loading image, then a detached `new Image()` probe does the loading and the real `img` element is only mounted once the probe resolves. The probe receives the same `sizes`, `srcset` and `src` so responsive selection matches what the visible image would pick. [radix, base-ui, melt, bits] (decision needed)
- [ ] `avatar.animation.2` Divergence: given a loading image, then the real `img` element is rendered from the start and hidden (`display: none`, or the `hidden` attribute) until it loads, with the status read from the element's own `load` and `error` events and no detached probe constructed at all. [reka, zag, ark, base-ui] (decision needed)
- [ ] `avatar.animation.3` Divergence: given a fallback render delay, then the prop is named `delayMs`. [radix, bits] (decision needed)
- [ ] `avatar.animation.4` Divergence: given a fallback render delay, then the prop is named `delay`. [base-ui, reka] (decision needed)
- [ ] `avatar.animation.5` Given a fallback delay, then the fallback is absent immediately after render and appears once the delay has elapsed, so a fast-loading image never flashes a fallback. [radix, base-ui, reka]
- [ ] `avatar.animation.6` Given a delay of `0`, then the fallback renders synchronously on mount; given a pending delay changed to `0`, the fallback appears immediately; and given an already-visible fallback, adding or changing a delay never re-hides it. [base-ui] (candidate)
- [ ] `avatar.animation.7` Given an image with an enter transition bound to `[data-starting-style]`, then the transition runs to completion when the image mounts, driven purely by the attribute with no `getAnimations()` call. [base-ui] (candidate) (browser-only)
- [ ] `avatar.animation.8` Given an image with an exit animation bound to `[data-ending-style]`, then it stays mounted for the animation and is only then removed. In the mounted-while-loading mode no ending style is applied at all, because the element never unmounts and the animation would reverse itself. [base-ui] (candidate) (browser-only)
- [ ] `avatar.animation.9` Given an image animating out in the default mode, then it carries neither `data-error` nor `data-loading`: those status attributes belong to the mounted-while-loading mode only. [base-ui] (candidate) (browser-only)
- [ ] `avatar.animation.10` Given a fallback with a long exit animation, when the image loads, then only one of the image and the fallback is ever mounted at a time. [base-ui] (candidate) (browser-only)
- [ ] `avatar.animation.11` Given a fallback that is not rendered, then the framework's own absent-node marker is what remains in the markup, and the image's inline style attribute is emptied rather than left holding a stringified `undefined`. [reka, bits]

### SSR and hydration

- [ ] `avatar.ssr.1` Given an avatar with a fallback and no image, server-rendered and hydrated, then the fallback text is in the document. [radix]
- [ ] `avatar.ssr.2` Given an avatar with a fallback and an image, server-rendered and hydrated, then no `role="img"` element exists right after hydration and it appears once the image loads. [radix]
- [ ] `avatar.ssr.3` Given a browser-cached image in the mounted-while-loading mode, then the image is in the server HTML with its `src` and `aria-hidden="true"`, no `role="img"` is exposed and the fallback is visible; after hydration the layout effect reads `complete` and resolves before paint, so the image is named, `aria-hidden` is gone and the fallback is removed with no flash. The same holds in the default mode: a cached image resolves synchronously on hydration with no fallback flash. [base-ui] (candidate) (browser-only)
- [ ] `avatar.ssr.4` Given a browser-cached image hydrated with animations enabled, then it does not get `data-starting-style`: the browser has already painted it, so animating in would flash. [base-ui] (candidate) (browser-only)

### Accessibility tooling

- [ ] `avatar.a11y.1` Given an avatar showing only its fallback, and again with a loaded image, then an axe run reports no violations. [axe, radix, zag, ark, reka]

### Notes and edge cases

- [ ] `avatar.notes.1` Given an avatar mounted and unmounted, then the number of image `addEventListener` calls equals the number of `removeEventListener` calls: no leaked image listeners. [radix]
- [ ] `avatar.notes.2` Given two image children under one root in development, then a warning says multiple images are not supported; a single image warns nothing. [radix] (candidate)
- [ ] `avatar.notes.3` Given a render callback whose own source props come before the library's spread, then the author's `sizes`, `src` and `srcset` survive: the library does not override source props supplied that way. [base-ui] (candidate)
- [ ] `avatar.notes.4` Given the props object handed to a render callback, then `src` is keyed after `loading`, `sizes` and `srcSet`, because React sets attributes in props order and Safari and Firefox start fetching as soon as `src` lands, so the request-configuring props have to be applied first. [base-ui] (candidate)
- [ ] `avatar.notes.5` Given a render element that deliberately drops the forwarded ref, then the status reported by the element's own `load` event stands: with no element to read, the effect must not overwrite it. [base-ui] (candidate) (browser-only)
- [ ] `avatar.notes.6` Given any part, then props the component does not consume land on the rendered element, the ref resolves to it, and a polymorphic escape hatch swaps the element while keeping the wiring. [radix, base-ui, ark]
- [ ] `avatar.notes.7` Given jsdom, then images never load, so every avatar test needs `window.Image` replaced by a stand-in that reports `complete` and a natural width, or a stubbed class whose `load` and `error` can be dispatched on demand. [radix, reka, bits] (browser-only)

## live-region

### Roles and attributes

- [ ] `live-region.roles.1` Given an announcement, then a fresh element is created carrying a fixed id and a marker attribute, `aria-live` set to the configured level (polite by default) and a matching redundant `role`: `status` for polite, `alert` for assertive. [zag] (candidate)
- [ ] `live-region.roles.2` Given the live region element, then it is visually hidden with inline styles rather than a class, so it needs no stylesheet to work. [zag] (candidate)
- [ ] `live-region.roles.3` Given a configured root element, then the region is appended there, falling back to the document body. [zag] (candidate)
- [ ] `live-region.roles.4` Given a debug flag, then a second visible overlay is created with its own id and marker attribute plus `aria-hidden="true"`, pinned to the viewport with `position: fixed` and `pointer-events: none`, mirroring each message. [zag] (candidate)

### Accessibility tooling

- [ ] `live-region.a11y.1` Given an announcement, then any existing live region node is removed first and a brand-new one is appended: replacing the node is what makes a screen reader re-announce an identical message. [zag] (candidate)
- [ ] `live-region.a11y.2` Given an announcement, then the message text is written in a timeout after the region is appended (zero delay by default, overridable per call), so the region is already in the accessibility tree before its content changes. [zag] (candidate)
- [ ] `live-region.a11y.3` Given the deferred write, then it checks that the region is still connected and does nothing otherwise, so a destroyed announcer cannot resurrect text. [zag] (candidate)
- [ ] `live-region.a11y.4` Given `destroy()`, then both the live region and the debug region are removed if present. [zag] (candidate)

### Notes and edge cases

- [ ] `live-region.notes.1` Given the fixed ids, then there is one live region per document: a second announcer reuses and replaces the same node rather than adding another. [zag] (candidate)
- [ ] `live-region.notes.2` Given the announcer is stored in machine context, then its `toJSON()` returns just the id string, so a serialized state snapshot does not carry the DOM node. [zag] (candidate)
- [ ] `live-region.notes.3` Given a region created for an iframe document, then the timer comes from that document's own `defaultView` rather than the global window. [zag] (candidate)
- [ ] `live-region.notes.4` Given the whole utility, then it ships no tests at all: every bullet above is read from source. [zag]

## announce

### Notes and edge cases

- [ ] `announce.notes.1` Given an announce element, then props it does not consume land on the rendered element, the ref resolves to it, and a polymorphic escape hatch swaps the element. Those two prop-spreading tests are the only coverage the component has: nothing tests the announcement behavior itself. [radix]

## Sources

- `docs/research/apg-and-axe.md` `## menu` and `## menubar` — the only APG and axe separator material in the research (separator role in menus, `aria-orientation`, non-focusable, and axe's `separator` `requiredAttrs`). No APG section exists for visually-hidden, accessible-icon, aspect-ratio, avatar, live-region or announce.
- `docs/research/ariakit-and-headlessui.md` `## separator`, `## visually-hidden` — Ariakit separator-semantics and visually-hidden accessible-name sandboxes.
- `docs/research/kobalte-and-corvu.md` `## separator` — Kobalte `separator.test.tsx` (eight synchronous tests).
- `docs/research/radix-and-base-ui.md` `## separator`, `## visually-hidden`, `## accessible-icon`, `## aspect-ratio`, `## avatar`, `## announce` — Radix `separator`, `visually-hidden`, `accessible-icon`, `aspect-ratio`, `avatar`, `announce`; Base UI `Separator` and `avatar/{root,image,fallback}`.
- `docs/research/react-aria-a.md` `## separator`, `## visually-hidden` — Spectrum v3 `Divider` and its SSR suite, React Aria Components `Separator`, `useVisuallyHidden`.
- `docs/research/reka-melt-bits.md` `## separator`, `## visually-hidden`, `## aspect-ratio`, `## avatar` — Reka `Separator`, `VisuallyHidden`, `AspectRatio`, `Avatar`; Melt separator and avatar; Bits separator and avatar.
- `docs/research/zag-and-ark.md` `## avatar`, `## live-region` — Zag `packages/machines/avatar` and its e2e suite, `packages/utilities/live-region` (source only), Ark React/Solid/Svelte avatar tests.

## Deferred

- The generic axe rules that apply to every component are recorded once for the whole suite rather than per component; see the same note in `tabs.md`.
- `separator.a11y.2` is unresolved. axe's role table marks `aria-valuenow` required on `role="separator"`, which is correct for a focusable splitter and wrong for a decorative rule, yet Reka's and Melt's separator axe runs pass with no `aria-valuenow` anywhere. Either the rule is narrower in practice than the role table suggests or the axe versions differ. This needs a direct check against the axe version the suite pins before a bullet can be written either way.
- A focusable separator (`role="separator"` with `aria-valuenow`, arrow-key resizing) is a splitter, not this component. It belongs in `splitter.md` / `resizable.md` alongside the corvu resizable and Zag splitter research.
- Whether to ship `aspect-ratio` at all (`aspect-ratio.notes.1`) is a product decision. Both library implementations predate the CSS `aspect-ratio` property and exist only to work around its absence.
- `live-region` and `announce` have almost no test evidence between them: Zag's utility ships no tests and Radix's `Announce` has only the two prop-spreading tests. Everything in those two sections is either read from source or absent, so both need their contract designed rather than merged. The APG's live-region guidance and axe's `aria-live` handling are not in the research at all and should be gathered before the announcer is built.
- Kobalte's separator suite has no decorative test (`role="presentation"` or `aria-hidden`), which ARIA requires for a separator carrying no structural meaning, so `separator.roles.9` rests on Radix and Melt alone.
- Ariakit's `@ariakit/ui` showcase bullets for separator, kbd, code, link, layer, prose and list are screenshot-only visual tests with no behavioral assertion, and are not merged into any bullet above.
