# collapsible

The APG calls this pattern "disclosure"; Radix, Base UI, Zag, Reka, Melt and Bits
call it "collapsible"; React Aria, Ariakit, Headless UI and corvu call it
"disclosure". One component, one spec. An accordion is a group of these plus a
heading wrapper, cross-item state and `role="region"`; see `accordion.md`.

## collapsible

### Roles and attributes

- [ ] `collapsible.roles.1` Given a collapsible, then it has exactly two parts: a control with `role="button"` and a single region of content whose visibility that control governs. [apg, radix, base-ui, zag, ark, kobalte, corvu, reka, melt, bits, react-aria, ariakit, headlessui]
- [ ] `collapsible.roles.2` Given visible content, then the trigger has `aria-expanded="true"`; given hidden content, `aria-expanded="false"`. [apg, radix, base-ui, zag, ark, corvu, react-aria, ariakit, headlessui]
- [ ] `collapsible.roles.3` Given a trigger rendered as a button, then `type="button"` is set by default, is not overwritten when the author already supplied a `type`, and is not added when the resolved element is not a button. [zag, corvu, headlessui]
- [ ] `collapsible.roles.4` Divergence: [apg] Given a collapsible, then the trigger may have `aria-controls` referencing the element containing all the shown or hidden content. The pattern marks this optional, but every APG example sets it and the reference must resolve, so it should be treated as required. (decision needed)
- [ ] `collapsible.roles.5` Divergence: given a closed collapsible, then the trigger has no `aria-controls` attribute at all, so it never points at a missing id; `aria-controls` appears when the content mounts and is removed again on close. [radix, base-ui] (decision needed)
- [ ] `collapsible.roles.6` Divergence: given a collapsible, then the trigger always carries `aria-controls` pointing at the content id, open or closed, which requires the content element to stay mounted or the id to be stable. [zag, ark, corvu, react-aria, kobalte] (decision needed)
- [ ] `collapsible.roles.7` Given an author-supplied `id` on the trigger or the content, then the generated id is replaced by it and `aria-controls` follows. [radix, base-ui]
- [ ] `collapsible.roles.8` Given the content unmounts and remounts, then the generated id is unregistered and re-registered, so the trigger drops `aria-controls` while the content is gone and points at the new id afterwards; this holds under React Strict Mode. [base-ui] (candidate)
- [ ] `collapsible.roles.9` Divergence: given the content element, then it carries `aria-labelledby` pointing at the trigger's id. [react-aria] (decision needed)
- [ ] `collapsible.roles.10` Divergence: given the content element, then it gets no `role` and no `aria-labelledby`: it is a plain container unless the author supplies them, and the `role="region"` plus label wiring belongs to the accordion layer. [corvu, radix, base-ui, zag, bits] (decision needed)
- [ ] `collapsible.roles.11` Given the collapsible is disabled, then the trigger carries `data-disabled` and (where the element is a button) the native `disabled` attribute. [base-ui, zag, ark, react-aria, corvu]
- [ ] `collapsible.roles.12` Given each part, then it exposes open state as `data-state="open"` / `data-state="closed"` (or `data-expanded` / `data-collapsed`, or `data-expanded="true"`), and the trigger additionally exposes whether its panel is open. [radix, base-ui, zag, ark, corvu, reka, melt, bits, react-aria]
- [ ] `collapsible.roles.13` Given each part, then it carries a stable per-part attribute for styling and test selectors: `data-scope="collapsible"` plus `data-part="root|trigger|content|indicator"`. [zag, ark]
- [ ] `collapsible.roles.14` Given each part, then it carries `data-collapsible-root`, `data-collapsible-trigger` and `data-collapsible-content` (or the `data-corvu-disclosure-*` equivalents) respectively. [bits, corvu]
- [ ] `collapsible.roles.15` Given an indicator part, then it carries `dir`, `data-state` and `data-disabled`, and no id. [zag, ark] (candidate)
- [ ] `collapsible.roles.16` Given a trigger with both a visible label and a description, then it is labelled and described; a description-only trigger is named from an `aria-label` or, failing that, from its description. [ariakit] (candidate) (browser-only)
- [ ] `collapsible.roles.17` Given a `collapsedHeight` or `collapsedWidth` prop, then the content carries `data-has-collapsed-size` and pins `min`/`max` on that axis with `overflow: hidden` while closed, so it collapses to a peek rather than to nothing. [zag] (candidate)

### Keyboard

- [ ] `collapsible.keyboard.1` Given focus on the trigger, when Enter is pressed, then the content's visibility toggles; pressing again toggles it back. [apg, base-ui, zag, kobalte, corvu, melt, bits, react-aria, ariakit, headlessui]
- [ ] `collapsible.keyboard.2` Given focus on the trigger, when Space is pressed, then the same round trip occurs as for Enter. [apg, base-ui, zag, kobalte, corvu, melt, bits, react-aria, ariakit, headlessui]
- [ ] `collapsible.keyboard.3` Given a disabled collapsible, when Enter or Space is pressed on the trigger, then nothing toggles and no change callback fires. [base-ui, react-aria, headlessui]
- [ ] `collapsible.keyboard.4` Divergence: given a trigger built on a native `button`, then Enter and Space activation arrives through the browser's own `click` event and the implementation adds no key handler of its own. [apg, corvu, melt, bits] (decision needed)
- [ ] `collapsible.keyboard.5` Divergence: given a trigger, when Space is pressed down nothing happens, and the toggle only fires on `keyup`. [base-ui] (decision needed)
- [ ] `collapsible.keyboard.6` Divergence: given a trigger, then a keyboard press expands on `onPressStart` while a mouse press expands on `onPress`, so keyboard activation is earlier than pointer activation. [react-aria] (decision needed)
- [ ] `collapsible.keyboard.7` Given Enter held down long enough to generate repeat keydown events, then only a single toggle occurs on the full press and release, and the change callback fires once. [react-aria] (candidate)
- [ ] `collapsible.keyboard.8` [html] Given a headless control that synthesizes activation, then the HTML spec defines no Enter or Space binding for buttons at all: activation is always caused by a `click` event, non-pointer triggering fires a synthetic `click`, and the key bindings are a platform convention the user agent supplies only for native elements. A non-native trigger has to implement them.
- [ ] `collapsible.keyboard.9` [html] Given `element.click()`, then it returns early for a disabled form control and for a click already in progress on that element, and otherwise fires an untrusted `click` whose `isTrusted` is false, so the method is reentrancy-guarded per element.
- [ ] `collapsible.keyboard.10` [apg] Given a disclosure navigation menu, then only one top-level menu may be open at a time, opening one closes any other; Right/Down Arrow on a closed top-level button moves to the next top-level item while Down Arrow on an open one moves into the menu's first link; arrow navigation clamps at both ends rather than wrapping, unlike tabs and menubar; Home and End move within whichever level has focus; Escape closes the open menu and returns focus to its top-level button; and focus leaving the whole navigation closes the open menu. Arrow navigation may be switched off entirely, leaving plain Tab navigation.

### Pointer

- [ ] `collapsible.pointer.1` Given a closed collapsible, when the trigger is clicked, then the content becomes visible; clicking again hides it. [apg, radix, base-ui, zag, ark, kobalte, corvu, reka, melt, bits, react-aria, ariakit, headlessui]
- [ ] `collapsible.pointer.2` Given a disabled collapsible, when the trigger is clicked, then nothing toggles, the content never appears, and no change callback fires. [base-ui, zag, kobalte, melt, bits, react-aria, headlessui]
- [ ] `collapsible.pointer.3` Given a right-click or other non-primary button press on the trigger, then the collapsible does not open. [headlessui]
- [ ] `collapsible.pointer.4` Given a trigger whose click event is already default-prevented, or whose author `onClick` called `preventDefault`, then no toggle happens; otherwise the author handler runs first and the library handler composes with it. [zag, corvu, radix]
- [ ] `collapsible.pointer.5` Given a trigger rendered inside the content panel, when it is clicked, then it acts as a close button, including for a collapsible that started open. [headlessui] (candidate)
- [ ] `collapsible.pointer.6` Given interactive elements adjacent to the trigger (a menu button beside the heading), then operating them does not toggle the collapsible, and toggling the collapsible afterwards does not disturb them. [react-aria] (candidate)
- [ ] `collapsible.pointer.7` [apg] Given a disclosure whose whole card surface is clickable, then the disclosure does not toggle when the click lands on a nested focusable element other than the trigger, on a `label`, or at the end of a text selection (the example checks `window.getSelection()`); when the card body does toggle it, focus is moved to the trigger so the keyboard state matches the pointer state.

### Focus management

- [ ] `collapsible.focus.1` Given a trigger, then it is an ordinary stop in the page tab sequence, reachable by forward Tab from the preceding element. [apg, zag, react-aria]
- [ ] `collapsible.focus.2` Given collapsed content, then it is unreachable by Tab and adds no tab stops; expanding content that holds no focusable elements adds none either. [apg, zag]
- [ ] `collapsible.focus.3` Given expanded content holding several focusable elements, then the tab order is the trigger followed by the content's focusable elements in DOM order. [apg]
- [ ] `collapsible.focus.4` Given the trigger is tabbed to, then the root exposes focus-visible-within state so the whole collapsible can be styled from it. [react-aria] (candidate)
- [ ] `collapsible.focus.5` Given a `close` function exposed on the root or content render props, then calling it closes the collapsible, and passing an element or a ref restores focus there. [headlessui] (candidate)

### State

- [ ] `collapsible.state.1` Given an uncontrolled collapsible, then `defaultOpen` decides the initial state and the default is closed. [radix, base-ui, zag, ark, kobalte, corvu, reka, melt, bits, react-aria, headlessui]
- [ ] `collapsible.state.2` Given an uncontrolled collapsible, when the trigger is activated, then the state flips and the change callback fires with the new value. [radix, base-ui, zag, kobalte, reka, bits, react-aria]
- [ ] `collapsible.state.3` Given a controlled collapsible whose parent does not commit the new value, then the change callback still fires once with the requested value but the open state does not move. [radix, base-ui, zag, ark, kobalte, melt, react-aria]
- [ ] `collapsible.state.4` Given a controlled collapsible toggled by an external button or store, then the trigger's `aria-expanded`, its `aria-controls` and the content's mounted state all follow. [base-ui, melt, bits, react-aria, ariakit]
- [ ] `collapsible.state.5` Given a change handler that vetoes the change (returning false, or calling `cancel()` on the event details), then the state does not move in either direction, in controlled and uncontrolled mode alike. [base-ui, melt]
- [ ] `collapsible.state.6` Given the change callback, then it receives event details carrying the reason, the originating DOM event, a canceled flag and `cancel()`/`allowPropagation()` functions. [base-ui] (candidate)
- [ ] `collapsible.state.7` Given the state primitive, then it exposes `open`, `close`, `toggle` and a setter, `toggle` reads the current value each time it is called, and a controlled `open` prop makes the setter fire only the callback and leave the internal signal untouched. [kobalte, corvu, react-aria]
- [ ] `collapsible.state.8` Given a disabled collapsible with an explicit expanded prop, then the content is still visible: an explicit open value overrides the disabled collapse. [react-aria] (candidate)
- [ ] `collapsible.state.9` Given a disabled prop toggled from false to true while open, then the content becomes hidden, and toggling `disabled` back to false does not re-show it. [react-aria] (candidate)
- [ ] `collapsible.state.10` Given the imperative api, then it exposes the open state, a `visible` flag that stays true through the closing phase, the disabled state, a `measureSize()` re-measure and a `setOpen(next)` whose repeated calls in one tick collapse to the last. [zag] (candidate)
- [ ] `collapsible.state.11` Given nested collapsibles (an inner one inside an outer one's content), then the inner one toggles independently of the outer, and opening the outer does not reveal the inner content. [react-aria]
- [ ] `collapsible.state.12` Given an external open-state provider wrapping the content, then the content is forced always open or always closed and the provider's state is readable from inside. [headlessui] (candidate)

### Animation and presence

- [ ] `collapsible.animation.1` Divergence: given closed content, then the element is removed from the DOM entirely. [apg, radix, base-ui, reka, corvu] (decision needed)
- [ ] `collapsible.animation.2` Divergence: given closed content, then the element stays mounted with the native `hidden` attribute. [zag, ark, base-ui, reka, bits] (decision needed)
- [ ] `collapsible.animation.3` Divergence: given closed content, then the element stays mounted with inline `display: none`, which keeps closed content in the server-rendered markup for crawlers. [corvu, ark] (decision needed)
- [ ] `collapsible.animation.4` Divergence: given closed content, then the element stays mounted with `aria-hidden="true"`. This conflicts with axe's `aria-hidden-focus` rule as soon as the content holds anything focusable. [react-aria] (decision needed)
- [ ] `collapsible.animation.5` Divergence: given closed content, then the element stays mounted with the `inert` IDL property set, which axe's `isFocusable` already treats as not focusable, so it is the cleanest of the keep-mounted options. [apg] (decision needed)
- [ ] `collapsible.animation.6` Divergence: given closed content under React 19, then the element is wrapped in `Activity mode="hidden"`, which pauses effects inside it; under the `display-none` hide mode the same effects keep running. [ark] (decision needed)
- [ ] `collapsible.animation.7` Given `lazyMount`, then the content is absent from the DOM until the first open; adding `unmountOnExit` removes it again on close; the four combinations of the two flags are each distinct. [zag, ark, reka, base-ui]
- [ ] `collapsible.animation.8` Given a force-mount option (`forceMount`, `keepMounted`, `static`, `unmountOnHide: false`), then the content is in the DOM from the first render regardless of state, for third-party animation libraries to drive. [base-ui, corvu, reka, bits, headlessui]
- [ ] `collapsible.animation.9` Given a force-mounted content whose render function only renders when its `open` prop is true, then no content element exists while closed and it appears on open, so force-mount composes with conditional rendering. [bits]
- [ ] `collapsible.animation.10` Given content with an enter transition, then it carries `data-starting-style` (or `data-enter`) while opening, in the same commit as the open state; given an exit transition, it carries `data-ending-style` (or `data-leave`) while closing and is only removed after the transition finishes. [base-ui, bits, ariakit]
- [ ] `collapsible.animation.11` Given content with no transition or animation at all, then it unmounts immediately on close and never receives an ending-style attribute: nothing to animate means no exit phase. [base-ui, ariakit]
- [ ] `collapsible.animation.12` Given content whose measured size is exposed as a CSS custom property, then the property reads `auto` once settled and is rewritten to a pixel value before the closing styles apply, so a `height` transition has a concrete target in both directions. [base-ui, zag, kobalte, corvu, radix]
- [ ] `collapsible.animation.13` Divergence: the content size custom properties are named `--radix-collapsible-content-height` and `--radix-collapsible-content-width`. [radix] (decision needed)
- [ ] `collapsible.animation.14` Divergence: the content size custom property is named `--collapsible-panel-height` (and its width counterpart). [base-ui] (decision needed)
- [ ] `collapsible.animation.15` Divergence: the content size custom properties are named `--kb-collapsible-content-height` and `--kb-collapsible-content-width`. [kobalte] (decision needed)
- [ ] `collapsible.animation.16` Divergence: the content size custom properties are named `--corvu-disclosure-content-width` and `--corvu-disclosure-content-height`. [corvu] (decision needed)
- [ ] `collapsible.animation.17` Divergence: the content size custom properties are the unprefixed `--height`, `--width`, `--collapsed-height` and `--collapsed-width`, always present in pixels. [zag, ark] (decision needed)
- [ ] `collapsible.animation.18` Given an initially open collapsible, then the mount animation is suppressed: the content is open but runs no animation and its computed `animation-name` is `none`. Suppression applies only to the initial mount, so closing and reopening animate normally. [base-ui, corvu, zag]
- [ ] `collapsible.animation.19` Given content whose size is being measured, then the implementation temporarily forces `animation-name: none`, reads the offset size, and restores the original name, updating the stored size only when a dimension actually changed. [corvu, base-ui]
- [ ] `collapsible.animation.20` Given a zero-size content element with an unrelated long transition on its closing styles, then it unmounts within one animation frame rather than waiting for that transition. [base-ui] (candidate) (browser-only)
- [ ] `collapsible.animation.21` Given content with several transitioning properties whose delays and durations differ, then it unmounts at the longest per-property end time, not at `max(delay) + max(duration)`. [ariakit] (candidate) (browser-only)
- [ ] `collapsible.animation.22` Given content with an animation duration but `animation-name: none`, then it is treated as having no animation and unmounts immediately. [ariakit] (candidate) (browser-only)
- [ ] `collapsible.animation.23` Given a numeric animation timeout instead of a detected transition, then the content stays mounted with its leaving attribute until the timeout elapses and then unmounts. [ariakit] (candidate) (browser-only)
- [ ] `collapsible.animation.24` Given a close interrupted by a reopen, then the content reaches the open state without regaining its starting-style attribute, stays the same DOM element, a later-finishing stale close animation does not restart the entrance, and a subsequent close still reaches the ending phase. [base-ui] (candidate) (browser-only)
- [ ] `collapsible.animation.25` Given an open animation that finishes inside the same commit as the close, then the measured size custom property still holds its pixel value rather than being wiped. [base-ui] (candidate) (browser-only)
- [ ] `collapsible.animation.26` Given a content render function that returns `null` as soon as the open state is false, then the close still completes: `aria-expanded` becomes false, the content is removed, and the change callback fires. Given one that only mounts its host element once closing has begun, then a render pass with the ending transition status is observed and the content still ends up removed. [base-ui] (candidate)
- [ ] `collapsible.animation.27` Given both a CSS transition and a CSS keyframe animation on the content, then a development warning is logged that only one of the two should be used, and inline alignment styles temporarily forced to `initial` during measurement are restored afterwards. [base-ui] (candidate) (browser-only)
- [ ] `collapsible.animation.28` Given content revealed again by React's `Activity` after it was opened (initially or by the user), then it stays open and fires no `transitionrun` and runs no animations: revealing must not replay the open transition or keyframes, including when the keyframes came from inline styles. [base-ui] (candidate) (browser-only)
- [ ] `collapsible.animation.29` Given a grid-based expand and collapse, then the wrapper animates between `0fr` and the content's pixel height and only becomes invisible at the end of the collapse. [ariakit] (candidate) (browser-only)
- [ ] `collapsible.animation.30` Given content presence reporting, then the callback reports present and hidden only, with the intermediate hiding state not surfaced. [corvu] (candidate)

### SSR and hydration

- [ ] `collapsible.ssr.1` Given a collapsible rendered open on the server whose content carries a keyframe animation (from a CSS rule or from inline styles), then the emitted element has `animation-name: none` while the duration is preserved, so the open animation does not play on first paint. [base-ui]
- [ ] `collapsible.ssr.2` Given server rendering in either state, then the markup matches the client render and the same assertions hold after hydration. [reka, react-aria, headlessui]
- [ ] `collapsible.ssr.3` Given closed content kept in the markup with `display: none`, then crawlers can read it; this is the documented reason that hide mode exists. [corvu]
- [ ] `collapsible.ssr.4` Given `hidden="until-found"` on closed content, then in-page find can reveal it: a `beforematch` event on the content opens the collapsible and fires the change callback once. A controlled collapsible whose parent does not commit stays closed but still requests the change, an already-open collapsible fires nothing, and a canceled `beforematch` must not install the temporary zero-duration override that suppresses motion for the instant open. [base-ui, bits, react-aria] (browser-only)
- [ ] `collapsible.ssr.5` Given a `beforematch` instant open, then the temporary zero animation and transition durations are held until the next close and then restored (including an inline `transitionDuration`), a later animated open is not permanently suppressed, an instant open interrupted by an `Activity` hide/show restores the inline duration, and closing a `hidden="until-found"` panel leaves no transition running on the hidden element. [base-ui] (candidate) (browser-only, skipped where `onbeforematch` is unsupported, e.g. Firefox)
- [ ] `collapsible.ssr.6` Given `hiddenUntilFound` combined with a force-mount opt-out, then the opt-out is ignored with a development warning, because the content must stay mounted while closed for find-in-page to reach it. [base-ui]
- [ ] `collapsible.ssr.7` Given jsdom, then a closed `hidden="until-found"` element reports `hidden=""` instead, so the stricter assertion cannot run outside a real browser. [reka] (browser-only)

### Accessibility tooling

- [ ] `collapsible.a11y.1` Given a trigger implemented as a native `button`, then `button-name` applies at critical impact; with `role="button"`, `aria-command-name` applies at serious impact. [axe]
- [ ] `collapsible.a11y.2` Given a collapsible built on native `details`/`summary`, then the `summary` must have discernible text; serious impact. [axe]
- [ ] `collapsible.a11y.3` Given a trigger, then it must not contain a focusable widget-role descendant. [axe]
- [ ] `collapsible.a11y.4` Given closed content hidden with `aria-hidden="true"`, then its focusable descendants must be made non-focusable or removed; serious impact. `inert` is the cleaner fix because axe's `isFocusable` already treats inert content as not focusable. [axe]
- [ ] `collapsible.a11y.5` Given a trigger carrying `aria-expanded` and `aria-controls`, then `aria-controls` must resolve to an existing element (otherwise the result is incomplete rather than a pass) and the referenced id must be unique. [axe]
- [ ] `collapsible.a11y.6` Given a trigger whose visible label differs from an added `aria-label`, then the visible text must be part of the accessible name. [axe]
- [ ] `collapsible.a11y.7` Given scrollable content, then it must contain a focusable element or be focusable itself; serious impact. [axe]
- [ ] `collapsible.a11y.8` Given a collapsible closed, open, and with content kept mounted while closed, then an axe run reports no violations. [axe, radix, zag, ark, reka, melt]

### Notes and edge cases

- [ ] `collapsible.notes.1` [apg] Given a collapsed collapsible, then the trigger is conventionally styled with an arrow or triangle that rotates when expanded; this is presentation only and must not be exposed to assistive technology.
- [ ] `collapsible.notes.2` [apg] Given a widget that needs headings, group-level show/hide, or a panel required to stay open, then it is an accordion rather than a collapsible: the collapsible has no heading requirement and no cross-panel state.
- [ ] `collapsible.notes.3` Given a set of independent collapsibles, then expanding one does not collapse the others, because each holds its own state. [apg, react-aria]
- [ ] `collapsible.notes.4` Given any part, then props the component does not consume land on the rendered element, the ref resolves to it, author inline styles survive alongside the library's own custom properties, and a polymorphic escape hatch (`asChild`, `render`, `as`) swaps the element while keeping the state attributes and wiring. [radix, base-ui, react-aria, bits, headlessui]
- [ ] `collapsible.notes.5` Given `className` and `style` supplied as functions of state on the root, the trigger and the content, then all three receive the closed branch while closed and the open branch after opening. [base-ui]
- [ ] `collapsible.notes.6` Given a part rendered without its root, then it throws a descriptive error naming the missing context. [base-ui, corvu, headlessui]
- [ ] `collapsible.notes.7` Given root or content children supplied as a function, then they receive the open state, the setter, the hide mode, the content id, the presence flag, the content ref and the measured size. [corvu, base-ui, react-aria, headlessui]
- [ ] `collapsible.notes.8` Given a collapsible inside a React Suspense boundary, then it does not crash. [headlessui] (candidate)
- [ ] `collapsible.notes.9` Given jsdom, then `offsetWidth` and `offsetHeight` are always `0`, so the measured content size is `[0, 0]` and any size-based assertion is vacuous; corvu's size-changed guard means the signal is then written once and never again, and its template interpolation emits the literal `"undefinedpx"` before the first measurement. [corvu, kobalte] (browser-only)

## Sources

- `docs/research/apg-and-axe.md` `## collapsible` — WAI-ARIA Authoring Practices disclosure pattern, its four example test files (FAQ, card, image description, navigation), the disclosure-menu example JS, axe-core rules, WHATWG HTML §6.5 activation behavior.
- `docs/research/ariakit-and-headlessui.md` `## disclosure` — Ariakit disclosure sandboxes (core interactions, content lifecycle, content animating, transition, `@ariakit/ui` disclosure), Headless UI React and Vue disclosure suites plus the Vue SSR suite.
- `docs/research/kobalte-and-corvu.md` `## collapsible`, `## disclosure`, `## disclosure-state` — Kobalte `collapsible.test.tsx` and `create-disclosure-state.test.ts`, corvu `packages/disclosure` source read (untested).
- `docs/research/radix-and-base-ui.md` `## collapsible` — Radix `packages/react/collapsible`, Base UI `packages/react/src/collapsible/{root,trigger,panel}`.
- `docs/research/react-aria-a.md` `## collapsible` — `useDisclosure`, `useDisclosureState`, `useDisclosureGroupState`, React Aria Components `Disclosure`/`DisclosureGroup` and its SSR suite.
- `docs/research/reka-melt-bits.md` `## collapsible` — Reka `Collapsible.test.ts`, Melt `Collapsible.spec.ts`, Bits `collapsible.browser.test.ts`.
- `docs/research/zag-and-ark.md` `## collapsible` — Zag `packages/machines/collapsible` plus its e2e suite, Ark React/Solid/Vue collapsible tests.

## Deferred

- The generic axe rules that apply to every component are recorded once for the whole suite rather than per component; see the same note in `tabs.md`.
- The APG's disclosure navigation menu (`collapsible.keyboard.10`) is a navigation pattern, not a collapsible: its arrow keys, Escape, focus-out close and `aria-current="page"` handling belong in `navigation-menu.md`. It is recorded here as one bullet because the research filed it under `## collapsible`, and it should move when that file exists.
- Disclosure groups (`DisclosureGroup`, `useDisclosureGroupState`, single vs multiple expansion, controlled `expandedKeys`) are the accordion's state model. The React Aria bullets for them are folded into `accordion.md`; only the per-item behavior stays here.
- Kobalte's collapsible suite is four tests with no attribute assertions at all: nothing checks `aria-expanded`, `aria-controls`, the data attributes or the `--kb-collapsible-content-*` custom properties, and two negative presence assertions are commented out with `// TODO: fix solid-presence vitest`, so the toggle test asserts nothing after the closing click. The whole attribute contract is unverified there. See `presence.md`.
- Corvu's disclosure bullets are read from source, not tests. Two source-level problems surfaced: `initialOpen` inside the root is a plain `let` read once at setup, so the mount-animation decision cannot be re-triggered reactively; and the keyed context cache stores `disclosure-<id>` entries in a module-level `Map` shared across corvu packages that is never evicted.
- Zag's "[closed] content should not be reachable via tab key" e2e test is `test.skip`ped, so `collapsible.focus.2` has no Zag evidence.
- Whether the standalone collapsible should offer `role="region"` on its content at all, or leave that to the accordion layer, is the open question behind `collapsible.roles.9` and `collapsible.roles.10`. The APG only requires the region for accordions.
