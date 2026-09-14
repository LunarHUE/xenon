# accordion

## accordion

### Roles and attributes

- [ ] `accordion.roles.1` Given each accordion header title, then it is contained in an element with `role="button"`, normally a native `button` with `type="button"`. [apg, radix, base-ui, zag, ark, kobalte, corvu, reka, melt, bits, react-aria]
- [ ] `accordion.roles.2` Given a visible panel, then its header button has `aria-expanded="true"`; given a hidden panel, `aria-expanded="false"`. [apg, base-ui, zag, ark, kobalte, corvu, reka, bits, react-aria]
- [ ] `accordion.roles.3` Given a header button, then it has `aria-controls` set to the id of its panel content element. [apg, base-ui, zag, ark, kobalte, corvu, reka, bits, react-aria]
- [ ] `accordion.roles.4` Given the initial render, then the initially expanded panel's trigger reads `aria-expanded="true"` while every other trigger reads `"false"`. [apg, base-ui, zag, ark, kobalte, reka, bits, react-aria]
- [ ] `accordion.roles.5` [apg] Given each accordion header button, then it is wrapped in an element with `role="heading"` carrying an `aria-level` appropriate to the page's information architecture; a native heading element with its implicit role and level may be used instead, and the APG example uses `h3`.
- [ ] `accordion.roles.6` [apg] Given an accordion header, then the `button` is the only element inside the `heading`, so any other visually persistent control lives outside the heading.
- [ ] `accordion.roles.7` Divergence: given an accordion item, then the library ships a dedicated header part that renders a heading element and accepts a `level` prop, which it writes as both `aria-level` and `data-heading-level`. [base-ui, bits, kobalte, react-aria] (decision needed)
- [ ] `accordion.roles.8` Divergence: given an accordion item, then the library ships no header part at all, so the author supplies the heading wrapper; the parts are root, item, trigger, content and indicator only. [zag, ark, corvu, melt] (decision needed)
- [ ] `accordion.roles.9` Divergence: [apg] Given a visible panel in an implementation that does not allow collapsing, then its header button has `aria-disabled="true"`. (decision needed)
- [ ] `accordion.roles.10` Divergence: given a non-collapsible single accordion whose open item's trigger is activated, then the trigger is a silent no-op with no `aria-disabled` lockout. [radix, zag, ark, kobalte, reka] (decision needed)
- [ ] `accordion.roles.11` Given a panel container, then it has `role="region"` with `aria-labelledby` referencing the trigger that controls it. [apg, base-ui, zag, ark, kobalte, corvu, react-aria]
- [ ] `accordion.roles.12` [apg] Given an accordion with more than roughly six simultaneously expandable panels, then `role="region"` should be avoided to prevent landmark proliferation; given panels that contain headings or a nested accordion, then `role="region"` is especially helpful. No library makes the role conditional, so the escape hatch has to be an explicit opt-out. (decision needed)
- [ ] `accordion.roles.13` Given an author-supplied `id` on the trigger or the panel, then the generated id is replaced by it and the paired `aria-controls`/`aria-labelledby` follows the new value, including when the `id` prop is later changed or removed (falling back to a generated id). [base-ui]
- [ ] `accordion.roles.14` Given a trigger or panel that unmounts, then its generated part id is unregistered, so the surviving part drops its `aria-controls` or `aria-labelledby`, and the association is restored when both parts are back; this holds under React Strict Mode's double-invoked effects. [base-ui] (candidate)
- [ ] `accordion.roles.15` Given no trigger is mounted in an item, then `aria-labelledby` is omitted from the `role="region"` element rather than pointing at nothing. [corvu] (candidate)
- [ ] `accordion.roles.16` Given a lazily mounted panel, then the trigger has no `aria-controls` until the panel first mounts. [zag, ark, base-ui]
- [ ] `accordion.roles.17` Given the accordion is disabled at the root, then every part (each item, header, trigger and panel) carries `data-disabled` and every trigger carries the native `disabled` attribute. [base-ui, zag, ark, bits, react-aria, melt]
- [ ] `accordion.roles.18` Given one item is disabled, then only that item's parts carry `data-disabled` and only its trigger is natively `disabled`. [base-ui, zag, ark, bits, react-aria]
- [ ] `accordion.roles.19` Given an item that is not disabled, then `disabled`, `aria-disabled` and `data-disabled` are omitted rather than written as `"false"`. [corvu, bits]
- [ ] `accordion.roles.20` Given a disabled trigger, then it carries `aria-disabled="true"` alongside the native `disabled` attribute. [corvu] (candidate)
- [ ] `accordion.roles.21` Given each part, then it exposes open state as `data-state="open"` / `data-state="closed"` (or `data-expanded` / `data-collapsed`) and the current orientation as `data-orientation`. [radix, base-ui, zag, ark, corvu, reka, melt, bits]
- [ ] `accordion.roles.22` Given each part, then it carries a stable per-part attribute for styling and test selectors: `data-scope="accordion"` plus `data-part="root|item|itemTrigger|itemContent|itemIndicator"`. [zag, ark]
- [ ] `accordion.roles.23` Given each part, then it carries `data-accordion-root`, `data-accordion-item`, `data-accordion-header`, `data-accordion-trigger` and `data-accordion-content` respectively. [bits, corvu]
- [ ] `accordion.roles.24` Given a trigger, then it carries `aria-controls` and a mirrored `data-controls`, plus `data-ownedby` set to the root id, so keyboard navigation can find the trigger set by attribute selector rather than by context. [zag] (candidate)
- [ ] `accordion.roles.25` Given an item indicator part, then it carries `aria-hidden="true"` plus `data-state`, `data-disabled` and `data-orientation`, and no id. [zag, ark] (candidate)
- [ ] `accordion.roles.26` Given a trigger rendered as a non-native element, then it gets `tabindex="0"` so it stays keyboard reachable; an author-supplied `tabindex` is respected. [base-ui, bits]
- [ ] `accordion.roles.27` Given an item with no `value` prop, then its value is a generated unique id, so an uncontrolled item's identity is unpredictable to the consumer. [corvu] (candidate)

### Keyboard

- [ ] `accordion.keyboard.1` Given focus on the header of a collapsed panel, when Enter is pressed, then that panel expands; in a single-open implementation any other expanded panel collapses. [apg, base-ui, zag, ark, kobalte, corvu, melt, bits, react-aria]
- [ ] `accordion.keyboard.2` Given focus on the header of a collapsed panel, when Space is pressed, then the same expand and collapse behavior as Enter applies. [apg, base-ui, zag, kobalte, corvu, melt, bits]
- [ ] `accordion.keyboard.3` Given focus on the header of an expanded panel in a collapsible implementation, when Enter or Space is pressed, then the panel collapses. [apg, base-ui, zag, ark, kobalte, bits, react-aria]
- [ ] `accordion.keyboard.4` [apg] Given an implementation that requires one panel to stay open, then it does not support a collapse function at all.
- [ ] `accordion.keyboard.5` Given an accordion, when Tab or Shift+Tab is pressed, then focus moves to the next or previous focusable element in the page tab sequence: every header button is its own tab stop, the accordion is not a composite widget, and it uses no roving tabindex. [apg, zag, ark, kobalte, corvu, bits, react-aria]
- [ ] `accordion.keyboard.6` Given a vertical accordion (the default) with focus on a trigger, when Down Arrow is pressed, then focus moves to the next enabled trigger and the event is default-prevented; Up Arrow moves to the previous one. This extends the APG pattern, which specifies no arrow keys for accordion. [radix, base-ui, zag, ark, kobalte, corvu, reka, melt, bits]
- [ ] `accordion.keyboard.7` Given a vertical accordion, then Left Arrow and Right Arrow are ignored. [radix, zag, corvu]
- [ ] `accordion.keyboard.8` Given `orientation="horizontal"`, when Right Arrow or Left Arrow is pressed, then focus moves to the next or previous enabled trigger, and Up Arrow and Down Arrow do nothing. [radix, zag, corvu, bits]
- [ ] `accordion.keyboard.9` Given focus on a trigger, when Home is pressed, then focus moves to the first enabled trigger; End moves it to the last, in both orientations and without direction inversion. [radix, zag, ark, kobalte, corvu, reka, melt, bits]
- [ ] `accordion.keyboard.10` Given loop is enabled (the default), when the next-item key is pressed on the last trigger, then focus wraps to the first, and the previous-item key on the first trigger wraps to the last. [radix, zag, ark, kobalte, corvu, reka, bits]
- [ ] `accordion.keyboard.11` Given loop is disabled (`loop={false}`, `shouldFocusWrap={false}`), when the next-item key is pressed on the last trigger or the previous-item key on the first, then focus stays put and the following press in the other direction still moves. [zag, ark, kobalte, corvu, bits]
- [ ] `accordion.keyboard.12` Given a disabled item, then its trigger is skipped by arrow, Home and End traversal. [zag, ark, corvu, bits]
- [ ] `accordion.keyboard.13` Given a keydown whose event is already default-prevented, or whose item is disabled, then no navigation happens; an author `onKeyDown` that calls `preventDefault` therefore opts that event out of list navigation. [zag, corvu]
- [ ] `accordion.keyboard.14` Divergence: given a closed item with focus on its trigger, when Space is pressed down nothing happens, and the item only opens on `keyup`. [base-ui] (decision needed)
- [ ] `accordion.keyboard.15` Divergence: given a closed item with focus on its trigger, when Space is pressed, then the item toggles through the native button's synthesized click, with no explicit key handling and therefore on the browser's own timing. [corvu, melt, bits] (decision needed)
- [ ] `accordion.keyboard.16` Given a Tab press with an expanded panel, then focus goes to the next header button rather than into the panel unless the panel itself contains focusable content. [zag, ark, apg]

### Pointer

- [ ] `accordion.pointer.1` Given a header button, when it is clicked, then the panel toggles exactly as on Enter or Space, because the native button routes key activation through the same click handler. [apg, radix, base-ui, zag, ark, kobalte, corvu, reka, melt, bits, react-aria]
- [ ] `accordion.pointer.2` Given a single-open accordion with item one open, when item two's trigger is clicked, then item two's content becomes visible and item one's content is hidden. [radix, base-ui, zag, ark, kobalte, reka, melt, bits]
- [ ] `accordion.pointer.3` Given a multiple accordion with item one open, when item two's trigger is clicked, then both contents are visible: expanding one item does not hide the other. [radix, base-ui, zag, ark, kobalte, reka, melt, bits]
- [ ] `accordion.pointer.4` Given a multiple accordion with item one open, when item one's trigger is clicked again, then item one closes, so `multiple` always implies collapsible for its own items. [radix, base-ui, zag, kobalte, reka, bits]
- [ ] `accordion.pointer.5` Given a disabled item or a disabled root, when the trigger is clicked (even with a forced click), then no toggle event is sent, the item stays closed, and no change callback fires. [base-ui, zag, ark, kobalte, corvu, melt, bits]
- [ ] `accordion.pointer.6` Given a part-level `disabled={false}` on the trigger of a disabled root or item, then it does not re-enable the trigger: clicking and pressing Space or Enter still do nothing. [base-ui] (candidate)
- [ ] `accordion.pointer.7` Given Safari, when a trigger is clicked, then the implementation calls `focus()` on it explicitly before toggling, because Safari does not focus buttons on mousedown. [zag] (safari-only)
- [ ] `accordion.pointer.8` Given an author `onMouseUp` that opts out of the library handler, then the opt-out is honored without throwing. [base-ui] (candidate)
- [ ] `accordion.pointer.9` Given an author `onClick` on the trigger, then it is composed with the library's toggle handler rather than replacing it, and both run. [radix]

### Focus management

- [ ] `accordion.focus.1` Given an accordion with one panel expanded, when Tab is pressed repeatedly, then focus visits each header button and, interleaved at the right position, every focusable element inside the expanded panel only; with all panels collapsed it visits only the header buttons, and Shift+Tab mirrors the order exactly. [apg, kobalte, react-aria]
- [ ] `accordion.focus.2` Given a trigger receives focus, then the implementation records it as the focused value and the item gains `data-focus`; on blur the focused value is cleared. Disabled items report neither. [zag, ark, corvu]
- [ ] `accordion.focus.3` Given the focus change callback, when a trigger is focused, then the callback fires with that item. [zag, ark]
- [ ] `accordion.focus.4` Given triggers registered in any mount order, then the navigable list is sorted by `compareDocumentPosition` so keyboard order follows DOM order, with disabled triggers filtered out. [corvu, zag]
- [ ] `accordion.focus.5` Given a trigger's `disabled` attribute changes after mount, then the navigable list is rebuilt so arrow keys skip the newly disabled trigger. [corvu] (candidate)
- [ ] `accordion.focus.6` Given the active index changes for any reason, then the corresponding trigger is focused programmatically. [corvu] (candidate)

### State

- [ ] `accordion.state.1` Given a collapsed panel, then it is out of the accessibility tree and out of the tab sequence, not merely visually hidden. [apg, radix, base-ui, zag, ark, kobalte, corvu, reka, bits]
- [ ] `accordion.state.2` Divergence: given a collapsed panel, then it is removed from the DOM entirely. [apg, radix, base-ui, kobalte, reka] (decision needed)
- [ ] `accordion.state.3` Divergence: given a collapsed panel, then it stays in the DOM with the native `hidden` attribute. [apg, zag, ark, base-ui, bits] (decision needed)
- [ ] `accordion.state.4` Divergence: given a collapsed panel with `collapseBehavior: 'hide'`, then it stays in the markup with `display: none`, which keeps closed content crawlable. [corvu] (decision needed)
- [ ] `accordion.state.5` Given a header toggled to the state it is already in, then the toggle is a no-op and no change event fires. [apg, radix, zag, kobalte, reka]
- [ ] `accordion.state.6` Given a single-open accordion, then opening one item replaces the open value rather than adding to it; given `multiple`, then a newly opened value is appended in click order, not DOM order. [radix, base-ui, zag, kobalte, corvu, reka, bits]
- [ ] `accordion.state.7` Given a non-collapsible single accordion with one item open, when that item's trigger is activated, then it stays open and no change event fires. [radix, zag, ark, kobalte, reka]
- [ ] `accordion.state.8` Given `collapsible`, when the open item's trigger is activated, then it collapses and activating again re-expands it. [zag, ark, kobalte, corvu, bits]
- [ ] `accordion.state.9` Divergence: given a single accordion, then the change payload is always an array, even for one open item. [base-ui, kobalte] (decision needed)
- [ ] `accordion.state.10` Divergence: given a single accordion, then the change payload is a bare value (`'One'`, or `''`/`null` when nothing is open) and only `multiple` mode uses an array. [radix, reka, corvu, bits] (decision needed)
- [ ] `accordion.state.11` Given a `multiple` accordion, then the change payload is an array that gains and loses values, reaching the empty array when the last item closes. [radix, base-ui, reka, bits]
- [ ] `accordion.state.12` Given a controlled accordion whose parent does not commit the new value, then the change callback fires once but the open state does not move. [radix, kobalte, react-aria]
- [ ] `accordion.state.13` Given a controlled single collapsible accordion with an item open, when the same trigger is clicked, then the item closes in a single click and the change callback fires exactly once more, with an empty value. [radix] (candidate)
- [ ] `accordion.state.14` Given a change handler that cancels the event, then the state does not move: an item-level cancel also short-circuits the root callback, and cancel works in both directions (opening and closing) and in controlled, uncontrolled and multiple modes. [base-ui] (candidate)
- [ ] `accordion.state.15` Given a default value, then the matching panel is open on first render and the others are closed. [base-ui, zag, ark, kobalte, reka, bits, react-aria]
- [ ] `accordion.state.16` Given a controlled value changed programmatically (including mutating a bound array in place), then the matching item opens and the others close. [base-ui, kobalte, bits]
- [ ] `accordion.state.17` Given a single-select accordion, when the value is set to more than one item, then only the first is kept. [zag] (candidate)
- [ ] `accordion.state.18` Given a value supplied as `null`, a bare string or an array, then it is normalized to an array internally. [corvu] (candidate)
- [ ] `accordion.state.19` Given item-level `disabled`, `collapseBehavior` or `preventInitialContentAnimation` props, then the item-level prop wins and the root's value is the fallback. [corvu] (candidate)
- [ ] `accordion.state.20` Given the defaults, then `multiple` is false, `collapsible` is true, `disabled` is false, `orientation` is vertical, `loop` is true and the collapse behavior removes the content. [corvu] (candidate)
- [ ] `accordion.state.21` Given a change, then the change callback reports the reason and carries a real DOM event rather than a synthetic one. [base-ui] (candidate)

### Animation and presence

- [ ] `accordion.animation.1` Given `lazyMount`, then the panel is absent from the DOM until its trigger is first activated, and it then stays mounted while closed; adding `unmountOnExit` removes it again on close. [zag, ark, base-ui]
- [ ] `accordion.animation.2` Given a force-mount option (`forceMount`, `keepMounted`), then every panel is in the DOM from the first render, with the closed ones carrying `hidden`. [base-ui, bits]
- [ ] `accordion.animation.3` Given a force-mounted panel, when its item opens, then the content carries `data-starting-style` at some point during the enter, and when it closes it carries `data-ending-style` during the exit. [base-ui, bits]
- [ ] `accordion.animation.4` Given a closing panel with an exit transition, then it stays visible (no `hidden`) with `data-ending-style` until the transition finishes, and only then gains `hidden`; the incoming panel gets `data-open` immediately. [base-ui] (candidate) (browser-only)
- [ ] `accordion.animation.5` Given the open panel, then it exposes its measured size as a CSS custom property so the open and close can be animated from CSS: `auto` first, then a pixel value once the exit begins. [base-ui] (candidate)
- [ ] `accordion.animation.6` Divergence: the panel size custom properties are named `--accordion-panel-height` (and the width counterpart). [base-ui] (decision needed)
- [ ] `accordion.animation.7` Divergence: the panel size custom properties are named `--kb-accordion-content-height` and `--kb-accordion-content-width`. [kobalte] (decision needed)
- [ ] `accordion.animation.8` Divergence: the panel size custom properties keep the disclosure's own names, `--corvu-disclosure-content-width` and `--corvu-disclosure-content-height`, rather than being renamed per component. [corvu] (decision needed)
- [ ] `accordion.animation.9` Given an item render function, then no render pass ever observes state with both `open === true` and `hidden === true`: the item must not report itself hidden once opening has started. [base-ui] (candidate) (browser-only)
- [ ] `accordion.animation.10` Given a panel opened by the user and then hidden and revealed again by React's `Activity`, then it is still open and runs no animations: revealing must not replay the open keyframes. [base-ui] (candidate) (browser-only)
- [ ] `accordion.animation.11` Given each item wraps a full disclosure, then it gets its own presence tracking, content size measurement and collapse-behavior handling. [corvu] (candidate)
- [ ] `accordion.animation.12` Given jsdom, then panel size measurement through `offsetWidth`/`offsetHeight` always reports `0`, so the height custom property is `"0px"` and any height-animation assertion is vacuous. [corvu, kobalte] (browser-only)

### RTL and i18n

- [ ] `accordion.rtl.1` Given `orientation="horizontal"` under `dir="rtl"`, then Right Arrow moves to the previous trigger and Left Arrow to the next, while Home and End are not inverted. [radix, zag, corvu]
- [ ] `accordion.rtl.2` Given a vertical accordion under `dir="rtl"`, then Up Arrow and Down Arrow keep their meaning and Left/Right stay ignored. [radix, zag]
- [ ] `accordion.rtl.3` Given a locale provider or `dir` prop, then the resolved direction is propagated to each part as `dir`. [zag, ark]
- [ ] `accordion.rtl.4` Given direction is passed as a prop, then the implementation does not consult `dir` on any ancestor element or `getComputedStyle(...).direction`. [corvu] (candidate)

### SSR and hydration

- [ ] `accordion.ssr.1` Given a server-rendered accordion with generated part ids, then `aria-controls` still equals the panel's `id` and `aria-labelledby` still equals the trigger's `id` both before and after hydration. [base-ui, reka]
- [ ] `accordion.ssr.2` Given server markup produced with one id prefix hydrated by a client app using a different prefix, then the trigger and region ids are unchanged from the server values and hydration logs no attribute-mismatch warning or mismatch error. [reka]
- [ ] `accordion.ssr.3` Given a panel rendered open on the server with an inline keyframe animation, then the emitted element has `animation-name: none` while the duration is preserved, so the open animation does not play on first paint. [base-ui] (candidate)
- [ ] `accordion.ssr.4` Given `hidden="until-found"` on closed panels, then the panels stay mounted so in-page find can reveal them, and a `keepMounted={false}` that contradicts it is ignored with a development warning. [base-ui] (candidate)
- [ ] `accordion.ssr.5` Given server rendering, then the accordion renders without throwing. [react-aria]

### Accessibility tooling

- [ ] `accordion.a11y.1` Given an accordion header implemented as a native `button`, then `button-name` applies at critical impact; implemented with `role="button"`, `aria-command-name` applies at serious impact. [axe]
- [ ] `accordion.a11y.2` Given `aria-expanded` on the header button, then it is in the `button` role's allowed attribute list; on a role that does not allow it the same attribute is a critical-impact failure. [axe]
- [ ] `accordion.a11y.3` Given `aria-level` on the heading wrapper, then a value greater than 6 is reported as incomplete at serious impact, because such levels are not supported in every screen reader and browser combination. [axe]
- [ ] `accordion.a11y.4` Given a header button, then it must not contain a focusable widget-role descendant, which is the axe-side reason a per-section control must live outside the heading. [axe, apg]
- [ ] `accordion.a11y.5` Given `role="region"` on a panel, then axe treats it as a landmark role whose only role-specific allowed attribute is `aria-expanded` and whose `accessibleNameRequired` is false. [axe]
- [ ] `accordion.a11y.6` Given panels hidden with `aria-hidden="true"` instead of `hidden` or removal, then their focusable content must be made non-focusable or removed; serious impact. This is why the APG example toggles the native `hidden` attribute. [axe, apg]
- [ ] `accordion.a11y.7` Given an accordion built on native `details`/`summary`, then the `summary` must have discernible text from visible text, `aria-label`, `aria-labelledby` or `title`; serious impact. [axe]
- [ ] `accordion.a11y.8` Given an accordion in its closed state and again with an item opened, in single, multiple and vertical configurations, then an axe run reports no violations. [axe, radix, zag, ark, reka, melt]

### Notes and edge cases

- [ ] `accordion.notes.1` Given any part, then props the component does not consume land on the rendered element, the ref resolves to it, and a polymorphic escape hatch (`asChild`, `render`, `as`) swaps the element while keeping the role, state attributes and wiring. [radix, base-ui, bits, corvu]
- [ ] `accordion.notes.2` Given a part rendered without its required ancestor, then it throws a descriptive error naming the missing context, for both the root and the item level. [base-ui, corvu]
- [ ] `accordion.notes.3` Given root or item children supplied as a function, then they receive the current value, the setter and the resolved `multiple`, `collapsible`, `disabled`, `orientation`, `loop`, direction and collapse-behavior values; item children additionally receive the item's value, disabled state and trigger id. [corvu, base-ui, bits]
- [ ] `accordion.notes.4` Given a force-mounted panel whose render function only renders when its `open` prop is true, then no content element exists while closed and it appears on open, so force-mount composes with conditional rendering. [bits] (candidate)
- [ ] `accordion.notes.5` Given items generated from a keyed list (Solid `<For>`, Vue `v-for`, a `.map`), then item registration works through the keyed list rather than static children, and an item may hold more than one content node. [kobalte, reka, ark]
- [ ] `accordion.notes.6` Given a non-collapsible single accordion, then the library still has to decide what its default is. `collapsible` defaults on in corvu and off in Radix, Reka, Zag and Kobalte, so the same markup behaves differently across libraries. [radix, zag, kobalte, corvu, reka] (decision needed)
- [ ] `accordion.notes.7` Given jsdom, then a `MutationObserver` callback for a `disabled` change runs on the microtask queue, so a test must await a microtask before asserting that arrow keys skip the newly disabled trigger. [corvu]

## Sources

- `docs/research/apg-and-axe.md` `## accordion` — WAI-ARIA Authoring Practices accordion pattern, its example JS and test file, axe-core rules and role tables.
- `docs/research/kobalte-and-corvu.md` `## accordion` — Kobalte `packages/core/src/accordion/accordion.test.tsx` (whole suite `skipIf(GITHUB_ACTIONS)`), corvu `packages/accordion` and `packages/solid-list` source read (untested).
- `docs/research/radix-and-base-ui.md` `## accordion` — Radix `packages/react/accordion`, Base UI `packages/react/src/accordion/{root,item,header,trigger,panel}`.
- `docs/research/react-aria-a.md` `## accordion` — React Spectrum v3 Accordion unit and SSR suites.
- `docs/research/reka-melt-bits.md` `## accordion` — Reka `Accordion.test.ts`, Melt `Accordion.spec.ts`, Bits `accordion.browser.test.ts`.
- `docs/research/zag-and-ark.md` `## accordion` — Zag `packages/machines/accordion` plus its e2e suite, Ark React/Solid/Vue/Svelte accordion tests.

## Deferred

- The generic axe rules that apply to every component are recorded once for the whole suite rather than per component; see the same note in `tabs.md`.
- Arrow-key navigation between headers is a library extension: the APG accordion pattern lists only Enter, Space, Tab and Shift+Tab, and calls the accordion explicitly not a composite widget. Every library in the research adds Up/Down (and Left/Right when horizontal) plus Home and End. The spec above records the library behavior but it has no normative backing, so the question of whether to ship it at all is open.
- Kobalte's entire accordion suite is `describe.skipIf(process.env.GITHUB_ACTIONS)`, three of its arrow-key and Home/End tests are additionally `it.skip` pending a migration to corvu's `solid-list`, and five negative presence assertions across accordion and collapsible are commented out with `// TODO: fix solid-presence vitest`. Every Kobalte tag on a collapse-direction bullet is therefore unverified. See `presence.md`.
- Corvu's accordion bullets are read from source, not from tests, so they carry no test evidence at all. Two source-level bugs turned up while reading: the per-trigger `MutationObserver` effect returns `observer.disconnect` where Solid treats the return value as the next run's previous value, so no observer is ever disconnected; and `<Accordion.Item>` spreads its props onto both the wrapper and the inner disclosure, delivering arbitrary props twice and leaking a stray `accordionId` attribute when `as` is a DOM element. Both belong in the Solid adapter's own test notes, not in the conformance suite.
- Kobalte's "enter / space key" tests only ever fire Enter, so Space activation for the accordion is untested there.
- Nested accordions inside a panel are exercised only through the APG's `role="region"` advice; no library test in the research covers a nested accordion for this component.
