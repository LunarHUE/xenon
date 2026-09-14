# Kobalte and Corvu: behaviors under test

Mined for a Solid 2 headless component library's conformance suite.

Bullet conventions, so fragments merge mechanically:

- One bullet per line, never wrapped, always ending in a source tag.
- `(kobalte: <path>: "<test name>")` means a real assertion in that test, at that
  `describe > it` name.
- `(corvu-src: <path>)` means a behavior read out of corvu's implementation. Corvu has
  no tests, so those are behaviors to write tests FOR, not behaviors anyone verifies.
- Behavior bullets use `Given ..., when ..., then ...`. Bullets under
  `Notes and edge cases` are one-line observations about test infrastructure, gaps and
  upstream provenance rather than behaviors, so they do not force that shape; they
  carry the same source tag.

## Sources

### kobalte

- Repo: `https://github.com/kobaltedev/kobalte`
- Branch: `main` (shallow clone, depth 1)
- Commit: `675b4a11f4f074007c98b47a573760a1b60849ff`, `chore: prepare release 0.13.14 (#732)`, 2026-09-07
- Cloned and read: 2026-09-13
- Runner: vitest `4.1.10` on jsdom `29.1.1`, with `@solidjs/testing-library` `0.8.10`,
  `@testing-library/jest-dom` `6.9.1`, `@testing-library/dom` `10.4.1` and
  `@testing-library/user-event` `14.6.1`. Build side: vite `8.1.3`,
  `vite-plugin-solid` `2.11.12`, solid-js `1.9.8` declared (lockfile resolves `1.9.14`),
  typescript `6.0.3`, turbo `1.10.13`, pnpm `11.20.0`.
- Test count: 564 `it(...)` blocks across 43 files
- **No Solid 2 / v2 branch exists.** `git ls-remote --heads` returns only `main`,
  `v2/chip` and `v2/tags-inputs`. Those two are unmerged _component_ feature branches
  (a Chip component and a TagsInput component), not a Solid 2 port, and they carry no
  new test files. Kobalte 0.13.x still pins `solid-js` `^1.9.8` as a peer dependency.

Test files read (all under `packages/core/src/`, paths below are repo-relative):

- `packages/core/src/accordion/accordion.test.tsx`
- `packages/core/src/alert/alert.test.tsx`
- `packages/core/src/alert-dialog/alert-dialog.test.tsx`
- `packages/core/src/badge/badge.test.tsx`
- `packages/core/src/breadcrumbs/breadcrumbs.test.tsx`
- `packages/core/src/button/button.test.tsx`
- `packages/core/src/checkbox/checkbox.test.tsx`
- `packages/core/src/collapsible/collapsible.test.tsx`
- `packages/core/src/colors/utils.test.ts`
- `packages/core/src/combobox/combobox.test.tsx`
- `packages/core/src/context-menu/context-menu-trigger.test.tsx`
- `packages/core/src/dialog/dialog.test.tsx`
- `packages/core/src/dismissable-layer/dismissable-layer.test.tsx`
- `packages/core/src/form-control/create-form-control.test.tsx`
- `packages/core/src/i18n/i18n.test.tsx`
- `packages/core/src/image/image.test.tsx`
- `packages/core/src/link/link.test.tsx`
- `packages/core/src/listbox/listbox.test.tsx`
- `packages/core/src/menubar/menubar.test.tsx`
- `packages/core/src/meter/meter.test.tsx`
- `packages/core/src/number-field/number-field.test.tsx`
- `packages/core/src/pagination/pagination.test.tsx`
- `packages/core/src/polymorphic/polymorphic.test.tsx`
- `packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx`
- `packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts`
- `packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx`
- `packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx`
- `packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx`
- `packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts`
- `packages/core/src/primitives/create-transition/get-transition-styles.test.ts`
- `packages/core/src/progress/progress.test.tsx`
- `packages/core/src/radio-group/radio-group.test.tsx`
- `packages/core/src/search/search.test.tsx`
- `packages/core/src/select/select.test.tsx`
- `packages/core/src/separator/separator.test.tsx`
- `packages/core/src/spin-button/spin-button.test.tsx`
- `packages/core/src/switch/switch.test.tsx`
- `packages/core/src/tabs/tabs.test.tsx`
- `packages/core/src/text-field/text-field.test.tsx`
- `packages/core/src/toast/toast.test.tsx`
- `packages/core/src/toggle-button/toggle-button.test.tsx`
- `packages/core/src/toggle-group/toggle-group.test.tsx`

Shared helper sources read (no tests of their own):

- `packages/tests/src/events.ts`, `packages/tests/src/mocks.ts`, `packages/tests/src/utils.ts`, `packages/tests/src/index.ts`
- `packages/core/vite.config.ts`, `packages/core/package.json`, `packages/tests/package.json`

Kobalte components with **no test file at all** (so nothing to mine, and a gap worth
noting for our own suite): calendar, checkbox-group, color-area, color-channel-field,
color-slider, color-swatch, color-wheel, date-picker, dropdown-menu (only
`context-menu-trigger` and `menubar` exercise the menu machinery), file-field,
hover-card, navigation-menu, popover, segmented-control, skeleton, slider, tooltip,
and the primitives `create-focus-scope`, `create-escape-key-down`, `create-collection`,
`create-dom-collection`, `create-register-id`, `create-form-reset-listener`,
`create-size`, plus the whole `selection/` directory (`selection-manager`,
`create-selectable-collection`, `create-selectable-item`, `create-type-select`,
`create-multiple-selection-state`, `create-controllable-selection-signal`), `popper/`
(`popper-root`, `popper-positioner`, `popper-arrow`), `live-announcer`, `list`, `menu`,
`color-field`, `color-mode`, `rating` and `time-field`.

Two corrections to the brief worth recording. Kobalte has no `create-presence`
primitive: it depends on corvu's `solid-presence` package instead, and likewise on
corvu's `solid-prevent-scroll` rather than a `create-prevent-scroll` of its own. So the
two libraries are not independent, and the presence and scroll-lock behavior documented
under the corvu sections below IS kobalte's behavior too. There is also no
`create-typeahead` primitive; typeahead lives inside the selection managers and is only
exercised through the `listbox` and `select` test files.

### corvu

- Repo: `https://github.com/corvudev/corvu`
- Branch: `main` (shallow clone, depth 1)
- Commit: `8b441a0c6d17f64b17b3ee64d5d94b92e1711754`, `docs: replace Modular Forms with Formisch in OTP Field form example (#109)`, 2026-08-24
- Cloned and read: 2026-09-13

**Corvu has no tests. None.** `find` for `*.test.*`, `*.spec.*`, Playwright configs,
and vitest configs across the whole monorepo returns nothing, and `grep` for `vitest`,
`@solidjs/testing-library`, `playwright` or `jest` in every `package.json` returns
nothing. Per-package scripts are `build`, `clean`, `dev`, `lint`, `typedoc` only. There
is no e2e directory. So there is zero test-asserted behavior to extract from corvu.

Rather than leave the corvu half empty, the corvu bullets below are read out of the
**implementation source**, and every one is tagged `(corvu-src: <path>)` instead of
`(corvu: <path>: "<test name>")` so a mechanical merge can tell the two apart. These
are behaviors corvu _implements_ and that we would want conformance tests for, not
behaviors corvu verifies. Treat the accompanying "not tested upstream" as a standing
caveat on every corvu bullet.

Corvu source files read (all read in full; corvu has no tests, so these are
implementation sources):

- `packages/drawer/src/` all of `Root.tsx`, `Content.tsx`, `Overlay.tsx`, `Trigger.tsx`, `Close.tsx`, `Label.tsx`, `Description.tsx`, `context.ts`, `lib.ts`
- `packages/dialog/src/` all of `Root.tsx`, `Content.tsx`, `Overlay.tsx`, `Portal.tsx`, `Trigger.tsx`, `Close.tsx`, `Label.tsx`, `Description.tsx`, `context.ts`
- `packages/popover/src/` all of `Root.tsx`, `Content.tsx`, `Anchor.tsx`, `Arrow.tsx`, `Overlay.tsx`, `Trigger.tsx`, `Close.tsx`, `Label.tsx`, `Description.tsx`, `context.ts`
- `packages/tooltip/src/` all of `Root.tsx`, `Content.tsx`, `Anchor.tsx`, `Arrow.tsx`, `Portal.tsx`, `Trigger.tsx`, `context.ts`
- `packages/accordion/src/` all of `Root.tsx`, `Item.tsx`, `Trigger.tsx`, `Content.tsx`, `context.ts`, `itemContext.ts`
- `packages/disclosure/src/` all of `Root.tsx`, `Trigger.tsx`, `Content.tsx`, `context.ts`
- `packages/calendar/src/` all of `Root.tsx`, `Table.tsx`, `HeadCell.tsx`, `Cell.tsx`, `CellTrigger.tsx`, `Nav.tsx`, `Label.tsx`, `context.ts`, `utils.ts`
- `packages/otp-field/src/` all of `Root.tsx`, `Input.tsx`, `context.ts`, `lib/style.ts`
- `packages/resizable/src/` all of `Root.tsx`, `Panel.tsx`, `Handle.tsx`, `context.ts`, `panelContext.ts`, `lib/resize.ts`, `lib/handleManager.ts`, `lib/cursor.ts`, `lib/utils.ts`, `lib/types.ts`
- `packages/solid-presence/src/presence.ts`, `packages/solid-persistent/src/persistent.ts`
- `packages/solid-dismissible/src/Dismissible.tsx` and `create/{dismissible,escapeKeyDown,noPointerEvents,outsideFocus,outsidePointer}.ts`
- `packages/solid-focus-trap/src/focusTrap.ts`, `packages/solid-prevent-scroll/src/preventScroll.ts`
- `packages/solid-transition-size/src/transitionSize.ts`, `packages/solid-list/src/{list,multi-list}.ts`
- `packages/utils/src/` `index.ts`, `types.ts`, `assertions.ts`, `create/{controllableSignal,floating,keyedContext,once,register,size,style,tagName,tooltip}.ts`, `dynamic/{Dynamic.tsx,DynamicButton.tsx,types.ts}`, `floating/lib.ts`, `scroll/lib.ts`, `reactivity/lib.ts`, `dom/lib.ts`, `components/FloatingArrow.tsx`, `components/Fragment.tsx`

### Attribute and CSS-variable inventory (kobalte, from source)

The brief asks for all `data-*` attributes and CSS variables. Many exist in the source
but are never asserted by any test, so the complete inventory is worth recording once
here; the per-component sections say which ones a test actually covers.

Every `data-*` attribute kobalte's source sets, across all components:

`data-animate`, `data-checked`, `data-closed`, `data-current`, `data-disabled`,
`data-dragging`, `data-expanded`, `data-focus-trap`, `data-half`, `data-highlighted`,
`data-indeterminate`, `data-invalid`, `data-kb-menu-value-trigger`,
`data-kb-top-layer`, `data-key`, `data-live-announcer`, `data-motion`, `data-opened`,
`data-orientation`, `data-placeholder`, `data-placeholder-shown`,
`data-popper-positioner`, `data-pressed`, `data-progress`, `data-readonly`,
`data-required`, `data-resizing`, `data-selected`, `data-swipe`,
`data-swipe-direction`, `data-type`, `data-valid`, `data-visible`.

Only thirteen of those are ever asserted by a test, and here is the exact count of
assertions per attribute across all 43 files: `data-disabled` 76, `data-key` 57,
`data-required` 13, `data-readonly` 13, `data-invalid` 12, `data-valid` 11,
`data-highlighted` 10, `data-pressed` 5, `data-orientation` 5, `data-indeterminate` 3,
`data-checked` 3, `data-progress` 2, `data-current` 1.

The twenty never asserted anywhere: `data-animate`, `data-closed`, `data-dragging`,
`data-expanded` (only the paired `aria-expanded` is checked), `data-focus-trap`,
`data-half`, `data-kb-menu-value-trigger`, `data-kb-top-layer`, `data-motion`,
`data-opened`, `data-placeholder`, `data-placeholder-shown`, `data-popper-positioner`,
`data-resizing`, `data-selected` (only `aria-selected` is checked), `data-swipe`,
`data-swipe-direction`, `data-type`, `data-visible`, `data-live-announcer`.
`data-expanded`/`data-closed` and `data-opened` being untested matters most, because
they are the attributes every disclosure, dialog, popover and menu animation keys off.

Every CSS custom property kobalte's source sets:

`--kb-accordion-content-height`, `--kb-accordion-content-width`,
`--kb-collapsible-content-height`, `--kb-collapsible-content-width`,
`--kb-color-current`, `--kb-combobox-content-transform-origin`,
`--kb-hovercard-content-transform-origin`, `--kb-menu-content-transform-origin`,
`--kb-meter-fill-width`, `--kb-navigation-menu-viewport-height`,
`--kb-navigation-menu-viewport-width`, `--kb-popover-content-transform-origin`,
`--kb-popper-anchor-width`, `--kb-popper-content-available-height`,
`--kb-popper-content-available-width`, `--kb-popper-content-overflow-padding`,
`--kb-popper-content-transform-origin`, `--kb-progress-fill-width`,
`--kb-select-content-transform-origin`, `--kb-toast-progress-fill-width`,
`--kb-toast-swipe-end-x`, `--kb-toast-swipe-end-y`, `--kb-toast-swipe-move-x`,
`--kb-toast-swipe-move-y`, `--kb-tooltip-content-transform-origin`.

NOT ONE of those 25 CSS custom properties is asserted by any test in the repo: a grep
for `--kb-` across all 43 test files returns zero hits. Since these variables are the
entire public styling contract of a headless library, that is the largest single
category of untested surface, and it is cheap to cover: they are synchronous inline
style writes needing no flush. Our conformance suite should assert every variable it
ships.

### Attribute and CSS-variable inventory (corvu, from source)

Corvu uses two kinds of `data-*` attribute, and the split is worth copying. A
per-part MARKER names the part (`data-corvu-<component>-<part>`), and a set of shared
STATE attributes describe state. A wrapper component swaps the base marker for its own
by setting the inherited one to `null`, so `Drawer.Content` carries
`data-corvu-drawer-content` and explicitly removes `data-corvu-dialog-content`.

Part markers, 40 of them: `data-corvu-accordion-content`, `-accordion-item`,
`-accordion-trigger`, `-calendar-cell`, `-calendar-celltrigger`, `-calendar-headcell`,
`-calendar-label`, `-calendar-nav`, `-calendar-table`, `-dialog-close`,
`-dialog-content`, `-dialog-description`, `-dialog-label`, `-dialog-overlay`,
`-dialog-trigger`, `-disclosure-content`, `-disclosure-trigger`, `-drawer-close`,
`-drawer-content`, `-drawer-description`, `-drawer-label`, `-drawer-overlay`,
`-drawer-trigger`, `-otp-field-input`, `-otp-field-root`, `-popover-anchor`,
`-popover-arrow`, `-popover-close`, `-popover-content`, `-popover-description`,
`-popover-label`, `-popover-overlay`, `-popover-trigger`, `-resizable-handle`,
`-resizable-handle-end-intersection`, `-resizable-handle-start-intersection`,
`-resizable-panel`, `-resizable-root`, `-tooltip-anchor`, `-tooltip-arrow`,
`-tooltip-content`, `-tooltip-trigger`.

State attributes: `data-active`, `data-closed`, `data-closing`, `data-collapsed`,
`data-disabled`, `data-dragging`, `data-expanded`, `data-in-range`, `data-open`,
`data-opening`, `data-orientation`, `data-placement`, `data-range-end`,
`data-range-start`, `data-resizing`, `data-selected`, `data-side`, `data-snapping`,
`data-today`, `data-transitioning`. Plus one INPUT attribute an author writes rather
than the library: `data-corvu-no-drag`, the drawer's opt-out marker.

Every boolean state attribute goes through a `dataIf` helper that renders the EMPTY
STRING when true and OMITS the attribute when false, so `data-open=""` versus no
attribute at all. Nothing is ever written as `"false"`. Kobalte follows the same rule
for its `data-*` family but writes `aria-*` booleans explicitly as `"true"`/`"false"`,
so the two attribute families deliberately differ in convention. That is a rule worth
adopting explicitly and testing.

Corvu declares only THREE CSS custom properties in the whole monorepo:
`--corvu-disclosure-content-width`, `--corvu-disclosure-content-height` and
`--corvu-floating-transform-origin`. Compared with kobalte's 25, corvu pushes far more
of the styling contract into `data-*` attributes and inline styles instead. Notably
the drawer, which is the most animation-heavy component in either library, declares
none at all and exposes its state through `openPercentage` and `translate` on the
context for the author to consume in JS. Two legitimate design positions, and worth
deciding deliberately rather than by accident.

### Upstream provenance (kobalte)

Kobalte's test files carry `Portions of this file are based on code from ...` headers
naming the exact upstream file. Recorded here once; the per-component
"Notes and edge cases" sections say what was dropped.

| kobalte test                    | ported from                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `accordion.test.tsx`            | radix-ui `packages/react/accordion/src/Accordion.test.tsx`                                                              |
| `alert-dialog.test.tsx`         | react-spectrum `@react-spectrum/dialog/test/Dialog.test.js`                                                             |
| `breadcrumbs.test.tsx`          | react-spectrum `@react-aria/breadcrumbs/test/useBreadcrumbs.test.js` + `useBreadcrumbItem.test.js`                      |
| `checkbox.test.tsx`             | react-spectrum `@react-spectrum/checkbox/test/Checkbox.test.js`                                                         |
| `collapsible.test.tsx`          | radix-ui `packages/react/collapsible/src/Collapsible.test.tsx`                                                          |
| `combobox.test.tsx`             | react-spectrum `@react-spectrum/picker/test/Picker.test.js`                                                             |
| `dialog.test.tsx`               | react-spectrum `@react-spectrum/dialog/test/Dialog.test.js`                                                             |
| `create-form-control.test.tsx`  | react-spectrum `@react-aria/label/test/useLabel.test.js` + `useField.test.js`                                           |
| `aria-hide-outside.test.tsx`    | react-spectrum `@react-aria/overlays/test/ariaHideOutside.test.js`                                                      |
| `image.test.tsx`                | radix-ui `packages/react/avatar/src/Avatar.test.tsx`                                                                    |
| `listbox.test.tsx`              | react-spectrum `@react-spectrum/listbox/test/Listbox.test.js`                                                           |
| `meter.test.tsx`                | react-spectrum `@react-aria/meter/src/useMeter.ts` + `@react-spectrum/meter/test/Meter.test.js`                         |
| `polymorphic.test.tsx`          | radix-ui `packages/react/slot/src/Slot.test.tsx`                                                                        |
| `get-transition-styles.test.ts` | mantine `src/mantine-core/src/Transition/get-transition-styles/get-transition-styles.test.ts`                           |
| `progress.test.tsx`             | react-spectrum `@react-aria/progress/test/useProgressBar.test.js` + `@react-spectrum/progress/test/ProgressBar.test.js` |
| `radio-group.test.tsx`          | react-spectrum `@react-spectrum/radio/test/Radio.test.js`                                                               |
| `search.test.tsx`               | react-spectrum `@react-spectrum/picker/test/Picker.test.js`                                                             |
| `select.test.tsx`               | react-spectrum `@react-spectrum/picker/test/Picker.test.js`                                                             |
| `spin-button.test.tsx`          | react-spectrum `@react-aria/spinbutton/test/useSpinButton.test.js`                                                      |
| `switch.test.tsx`               | react-spectrum `@react-spectrum/switch/test/Switch.test.js`                                                             |
| `tabs.test.tsx`                 | react-spectrum `@react-spectrum/tabs/test/Tabs.test.js`                                                                 |

Files with **no** upstream attribution (written for kobalte): `alert`, `badge`,
`button`, `colors/utils`, `context-menu-trigger`, `dismissable-layer`, `i18n`, `link`,
`menubar`, `number-field`, `pagination`, `create-controllable-signal`,
`create-disclosure-state`, `create-interact-outside`, `create-tag-name`,
`create-toggle-state`, `separator`, `text-field`, `toast`, `toggle-button`,
`toggle-group`.

So the suite draws on four upstreams: react-spectrum (React Aria and React Spectrum)
for the form controls, collections and overlays; radix-ui for accordion, collapsible,
avatar and slot; mantine for the transition-styles helper; and kobalte's own authorship
for everything imperative (toast, number-field, pagination, menubar) and for the two
regression pins (`dismissable-layer`, `context-menu-trigger`).

## button

### Roles and attributes

- Given a `Button.Root` with no `as` prop, when rendered, then it carries `type="button"`. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'type=button' by default")
- Given a `Button.Root` rendered `as="div"`, when rendered, then `type="button"` is NOT applied, because the attribute is only meaningful on `button`/`input`. (kobalte: packages/core/src/button/button.test.tsx: "should not have attribute 'type=button' by default when it's not a 'button' tag")
- Given a `Button.Root` rendered `as="input"` with an explicit `type="submit"`, when rendered, then the author's `type` wins and is not overwritten with `button`. (kobalte: packages/core/src/button/button.test.tsx: "should keep attribute 'type' when provided and it's a native 'button' or 'input'")
- Given a native `button` element, when rendered, then no redundant `role="button"` is added. (kobalte: packages/core/src/button/button.test.tsx: "should not have attribute 'role=button' when it's a native button")
- Given a `Button.Root` rendered `as="a"` WITH an `href`, when rendered, then no `role="button"` is added, because the anchor is already natively actionable. (kobalte: packages/core/src/button/button.test.tsx: "should not have attribute 'role=button' when it's an 'a' tag with 'href'")
- Given a `Button.Root` rendered `as="div"`, when rendered, then `role="button"` is added. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'role=button' when it's not a native button")
- Given a `Button.Root` rendered `as="a"` WITHOUT an `href`, when rendered, then `role="button"` IS added, because a bare anchor is not natively actionable. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'role=button' when it's an 'a' tag without 'href'")
- Given a native `button` that is `disabled`, when rendered, then the native `disabled` attribute is set and `aria-disabled` is NOT set. (kobalte: packages/core/src/button/button.test.tsx: "should have correct 'disabled' attribute when disabled and it's a native button")
- Given a `Button.Root` rendered `as="input"` that is `disabled`, when rendered, then the native `disabled` attribute is set and `aria-disabled` is NOT set. (kobalte: packages/core/src/button/button.test.tsx: "should have correct 'disabled' attribute when disabled and it's an input")
- Given a `Button.Root` rendered `as="div"` that is `disabled`, when rendered, then the native `disabled` attribute is NOT set and `aria-disabled` IS set instead. (kobalte: packages/core/src/button/button.test.tsx: "should have correct 'disabled' attribute when disabled and it's not a native button nor input")
- Given an enabled `Button.Root`, when rendered, then `data-disabled` is absent. (kobalte: packages/core/src/button/button.test.tsx: "should not have attribute 'data-disabled' by default")
- Given a `disabled` `Button.Root`, when rendered, then `data-disabled` is present. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'data-disabled' when disabled")

### Focus management

- Given a `Button.Root` rendered `as="div"`, when rendered, then `tabindex="0"` is added so it is reachable by Tab. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'tabindex=0' when it's not a native button")
- Given a `Button.Root` rendered `as="a"` with an `href`, when rendered, then no `tabindex="0"` is added, because the anchor is already tabbable. (kobalte: packages/core/src/button/button.test.tsx: "should not have attribute 'tabindex=0' when it's an 'a' tag with 'href'")
- Given a `Button.Root` rendered `as="div"` that is `disabled`, when rendered, then `tabindex="0"` is removed so the button drops out of the tab order. (kobalte: packages/core/src/button/button.test.tsx: "should not have attribute 'tabindex=0' when it's disabled")

### Notes and edge cases

- The whole `describe("Button")` block calls `installPointerEvent()` in its body (not in a `beforeAll` at the test's own level), which stubs a fake `PointerEvent` class extending `MouseEvent` for the file's lifetime and tears it down in `afterAll`. jsdom has no `PointerEvent`, so any library code branching on `pointerType`/`pointerId` needs this. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'type=button' by default")
- Every button test is synchronous with no reactivity flush, because all assertions are on the initial render output. Solid's `render` is synchronous, so unlike React there is no `act()` wrapper and no `await` needed for a first-paint assertion. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'type=button' by default")
- `render(() => <Button.Root/>)` takes a THUNK, not an element, which is the `@solidjs/testing-library` convention and the single most pervasive difference from React Testing Library across every file in this repo. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'type=button' by default")
- The button file has no upstream attribution header, so it is kobalte-original rather than ported. There are no skipped or todo tests. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'type=button' by default")
- The `as` prop is how kobalte spells polymorphism in these tests, and the button's entire attribute contract is derived from the resolved tag name. A conformance suite has to run the same attribute matrix against at least `button`, `input`, `div`, `a[href]` and `a` without `href`. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'role=button' when it's an 'a' tag without 'href'")

## toggle

### Roles and attributes

- Given a `ToggleButton.Root` with no pressed props, when rendered, then `aria-pressed="false"` is set and `data-pressed` is absent. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "should have correct attributes when the toggle button is off (not selected)")
- Given a `ToggleButton.Root` with `pressed`, when rendered, then `aria-pressed="true"` is set and `data-pressed` is present. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "should have correct attributes when the toggle button is on (selected)")

### State and controlled/uncontrolled

- Given a `ToggleButton.Root` with `defaultPressed`, when rendered, then it starts pressed with `aria-pressed="true"` and `data-pressed`, without any external state. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be default selected (uncontrolled)")
- Given a `ToggleButton.Root` with a fixed `pressed` prop and an `onChange` handler, when it is clicked, then `aria-pressed` stays `"true"` and `data-pressed` stays present, so the DOM never diverges from the controlled prop. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be controlled")
- Given a controlled `ToggleButton.Root` that is pressed, when it is clicked, then `onChange` fires exactly once with the REQUESTED next value `false`, not with the current value. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be controlled")
- Given `createToggleState({ defaultIsSelected: true })`, when read, then `isSelected()` is true. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "can be default selected (uncontrolled)")
- Given `createToggleState({ isSelected: true, onSelectedChange })`, when `toggle()` is called, then `isSelected()` remains true and `onSelectedChange` fires once with `false`. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "can be controlled")
- Given `createToggleState({ defaultIsSelected: false })`, when `setIsSelected(true)` then `setIsSelected(false)` are called, then `isSelected()` tracks each assignment. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "should setSelected with the given value")
- Given `createToggleState({ defaultIsSelected: false, isReadOnly: true })`, when `setIsSelected(true)` is called, then `isSelected()` stays false, so read-only blocks direct assignment and not just user events. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "should not setSelected with the given value when is read only")
- Given `createToggleState({ defaultIsSelected: false })`, when `toggle()` is called twice, then `isSelected()` goes false to true to false. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "should toggle selected state")
- Given `createToggleState({ defaultIsSelected: false, isReadOnly: true })`, when `toggle()` is called, then `isSelected()` stays false. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "should not toggle selected state when is read only")

### Notes and edge cases

- `fireEvent.click(toggle)` is followed by `await Promise.resolve()` before the `aria-pressed` and `onChange` assertions. This single microtask flush is kobalte's universal stand-in for React's `act()`: Solid's event handler runs synchronously but the resulting signal write propagates to DOM attributes on the microtask queue. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be controlled")
- `create-toggle-state` tests wrap every case in `createRoot((dispose) => { ... dispose(); })` and call `dispose()` manually at the end. The primitive needs an owner, and there is no component tree, so `createRoot` replaces `render`. No flush is needed here because the assertions read signal getters directly rather than DOM attributes. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "can be default selected (uncontrolled)")
- `createToggleState` uses `isSelected`/`defaultIsSelected`/`onSelectedChange`/`isReadOnly` naming while the public `ToggleButton` uses `pressed`/`defaultPressed`/`onChange`, so the primitive's prop vocabulary is internal and not part of the component contract. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "can be controlled")
- There is no test for keyboard activation of a toggle button (Space or Enter), no test for `disabled` on it, and no test asserting `data-disabled` or focus behavior. The toggle-button file has only four tests. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be controlled")
- Neither file has an upstream attribution header; both are kobalte-original. No skipped or todo tests. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be default selected (uncontrolled)")

## toggle-group

### Roles and attributes

- Given a `ToggleGroup.Root` wrapping three items, when rendered, then the root exposes `role="group"` and all three items are present. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "can have a default value")
- Given a `ToggleGroup.Root` with no `orientation` prop, when rendered, then the root carries `data-orientation="horizontal"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- Given a `ToggleGroup.Root` with `orientation="vertical"`, when rendered, then the root carries `data-orientation="vertical"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via up/down arrow keys with vertical group")
- Given a `ToggleGroup.Root` with `defaultValue="cats"`, when rendered, then only the matching item has `aria-pressed="true"` and the other two have `aria-pressed="false"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "can have a default value")

### Keyboard

- Given a horizontal group with the first item focused, when ArrowRight is pressed, then roving tabindex moves to the second item, which gains `tabindex="0"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- Given a horizontal group with the second item holding the roving tabindex, when ArrowLeft is pressed, then the first item regains `tabindex="0"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- Given a horizontal group, when ArrowUp is pressed, then the roving tabindex does not move, because the cross-axis arrow keys are inert for a horizontal group. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- Given a horizontal group, when ArrowDown is pressed, then the roving tabindex does not move. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- Given a vertical group with the first item focused, when ArrowDown is pressed, then the second item gains `tabindex="0"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via up/down arrow keys with vertical group")
- Given a vertical group, when ArrowUp is pressed, then the roving tabindex moves back to the first item. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via up/down arrow keys with vertical group")
- Given a vertical group, when ArrowRight is pressed, then the roving tabindex does not move, because the cross-axis arrow keys are inert for a vertical group. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via up/down arrow keys with vertical group")
- Given a vertical group, when ArrowLeft is pressed, then the roving tabindex does not move. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via up/down arrow keys with vertical group")
- Given a horizontal group with the first item focused, when End is pressed, then the LAST item gains `tabindex="0"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "select last item via end key / select first item via home key")
- Given the last item holding the roving tabindex, when Home is pressed, then the FIRST item gains `tabindex="0"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "select last item via end key / select first item via home key")

### Pointer

- Given a single-select group with nothing pressed, when a mouse `pointerdown` is dispatched on the second item, then that item becomes `aria-pressed="true"`. Selection happens on POINTERDOWN, not on click. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "supports using click to change state")
- Given a single-select group with the second item pressed, when a mouse `pointerdown` is dispatched on the first item, then the first becomes `aria-pressed="true"` and the second drops to `aria-pressed="false"`, so single-select replaces rather than adds. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "supports using click to change state")
- Given a `ToggleGroup.Root` with `multiple`, when `pointerdown` is dispatched on the second item and then the first, then BOTH end up `aria-pressed="true"`. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "multi-select")
- Given a group with a `disabled` item, when that item is clicked via `user.click`, then the change handler is never called. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "disabled item should be be pressed")

### Focus management

- Given a horizontal group with NO selected value, when rendered, then the first item has `tabindex="-1"`, so before any focus or selection the group holds no roving tab stop on the first item. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- Given a group with `defaultValue="dragons"`, when the user Tabs into the page for the first time, then focus lands on the SELECTED item (the third), not the first item. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "should focus the selected item when tabbing in for the first time")
- Given a `ToggleGroup.Root` with `disabled` followed by a plain button, when the user Tabs, then focus skips the whole group and lands on the button, so a disabled group is entirely removed from the tab order. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "should not focus if group is disabled")
- Given a group with a `disabled` middle item, when the user Tabs in, then focus lands on the first (enabled) item. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "disabled item should be be pressed")
- Given an item is focused programmatically with `.focus()`, when focus lands, then that item's `tabindex` becomes `"0"`, so the roving tab stop follows real focus and not only arrow keys. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "select last item via end key / select first item via home key")

### State and controlled/uncontrolled

- Given a group with `defaultValue="cats"` and an `onChange` spy, when rendered, then `onChange` has NOT been called, so initialising from a default value does not emit a change. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "can have a default value")
- Given a group with `defaultValue="cats"`, when a different item is clicked, then `onChange` fires once with the new single value `"dragons"` and the pressed state moves to it. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "can have a default value")

### Notes and edge cases

- Three tests are wrapped in `it.skipIf(process.env.GITHUB_ACTIONS)`: "should focus the selected item when tabbing in for the first time", "should not focus if group is disabled", and "disabled item should be be pressed". All three are exactly the tests that use `@testing-library/user-event`'s `user.tab()`. They are disabled on CI, so kobalte's real Tab-order behavior is effectively unverified in CI. Our suite should not lean on `user.tab()` in jsdom without checking this. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "should focus the selected item when tabbing in for the first time")
- `userEvent.setup({ delay: null })` is combined with `vi.useFakeTimers()` in `beforeEach`. `delay: null` is required, because user-event's default inter-event delay uses real timers and deadlocks under fake timers. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "should focus the selected item when tabbing in for the first time")
- Every `fireEvent.keyDown` and every synthetic `pointerdown` is followed by a single `await Promise.resolve()` before asserting `tabindex` or `aria-pressed`. Without it the DOM still shows the pre-event attributes, because Solid batches the attribute write onto the microtask queue. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- The pointer tests use `createPointerEvent("pointerdown", { pointerId: 1, pointerType: "mouse" })` and `fireEvent(el, evt)` rather than `fireEvent.click`, because the library's press logic keys off pointer events and jsdom has no real `PointerEvent`. `installPointerEvent()` supplies the class. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "supports using click to change state")
- The keyDown events pass both `code` and `charCode` as NUMBERS (for example `code: 39`) alongside `key: "ArrowRight"`. That is wrong for `code` (which is a string like `"ArrowRight"`) but harmless, because the implementation only reads `key`. Worth not copying. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "allows user to change toggle item via left/right arrow keys with horizontal group")
- There is no test for arrow-key WRAPPING at the ends of the group, no test for `shouldFocusWrap`, no test for typeahead in a toggle group, no test for RTL arrow-key reversal, and no test for `data-disabled` on items or the root. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "select last item via end key / select first item via home key")
- The test named "disabled item should be be pressed" actually asserts the OPPOSITE (that the change handler is not called). The name is a typo for "should NOT be pressed". (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "disabled item should be be pressed")
- No upstream attribution header; kobalte-original. (kobalte: packages/core/src/toggle-group/toggle-group.test.tsx: "can have a default value")

## checkbox

### Roles and attributes

- Given a `Checkbox.Root` with no `id`, when rendered, then the root gets a generated id and each part derives its id from it as `<rootId>-input`, `<rootId>-control`, `<rootId>-indicator` and `<rootId>-label`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should generate default ids")
- Given a `Checkbox.Root` with `id="foo"`, when rendered, then the parts are `foo-input`, `foo-control`, `foo-indicator` and `foo-label`, so the root id is the id namespace. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should generate ids based on checkbox id")
- Given explicit `id` props on the root and every part, when rendered, then each author-supplied id wins and no derived id is applied. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports custom ids")
- Given a `Checkbox.Input`, when rendered, then it is `type="checkbox"` and is discoverable by `getByRole("checkbox")`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should set input type to checkbox")
- Given `validationState="invalid"`, when rendered, then the input carries `aria-invalid="true"`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be invalid")
- Given `validationState="invalid"` and an `aria-errormessage` on the input, when rendered, then both `aria-invalid="true"` and the author's `aria-errormessage` are present, so the library does not clobber it. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "passes through 'aria-errormessage'")
- Given `checked` plus `readOnly`, when rendered, then the input carries `aria-readonly="true"`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be readonly")
- Given `validationState="valid"`, when rendered, then `data-valid` is present on the root, label, control AND indicator, so the state attribute is mirrored onto every part. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-valid' attribute when checkbox is valid")
- Given `validationState="invalid"`, when rendered, then `data-invalid` is present on the root, label, control and indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-invalid' attribute when checkbox is invalid")
- Given `checked`, when rendered, then `data-checked` is present on the root, label, control and indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-checked' attribute when checkbox is checked")
- Given `indeterminate`, when rendered, then `data-indeterminate` is present on the root, label, control and indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-indeterminate' attribute when checkbox is indeterminate")
- Given `required`, when rendered, then `data-required` is present on the root, label, control and indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-required' attribute when checkbox is required")
- Given `disabled`, when rendered, then `data-disabled` is present on the root, label, control and indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-disabled' attribute when checkbox is disabled")
- Given `readOnly`, when rendered, then `data-readonly` is present on the root, label, control and indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-readonly' attribute when checkbox is read only")

### Keyboard

- Given a checkbox with a `Checkbox.Control`, when Space is pressed and released on the CONTROL (not the input), then the checkbox becomes checked and `onChange` receives `true`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be checked by pressing the Space key on the control")

### Pointer

- Given a checkbox with a `Checkbox.Control`, when the control is clicked, then the hidden input becomes checked and `onChange` receives `true`, so the control forwards activation to the input. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be checked by clicking on the control")
- Given a `disabled` checkbox, when its LABEL is clicked, then nothing changes and `onChange` is never called. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be disabled")

### State and controlled/uncontrolled

- Given an uncontrolled checkbox, when the input is clicked, then it becomes checked and `onChange` receives `true`; clicking again gives `onChange` `false`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "ensure default unchecked can be checked")
- Given an uncontrolled checkbox, when rendered, then `onChange` has NOT been called, so mounting does not emit a change. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "ensure default unchecked can be checked")
- Given `defaultChecked`, when rendered, then the input is checked; when clicked, then it unchecks and `onChange` receives `false`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be default checked")
- Given a fixed `checked` prop, when the input is clicked, then `input.checked` stays `true` and `onChange` receives the requested `false`, so a controlled checkbox never drifts from its prop. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be controlled checked")
- Given a fixed `checked={false}` prop, when the input is clicked, then `input.checked` stays `false` and `onChange` receives the requested `true`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be controlled unchecked")
- Given `indeterminate`, when rendered, then `input.indeterminate` is `true` and `input.checked` is `false`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be indeterminate")
- Given `indeterminate` set as a fixed prop, when the input is clicked, then `input.indeterminate` REMAINS `true` while `input.checked` flips to `true`, so indeterminate is independent of checked and is not auto-cleared on interaction. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be indeterminate")
- Given an `indeterminate` checkbox that was clicked once, when clicked again, then `input.checked` returns to `false`, `input.indeterminate` is still `true`, and `onChange` receives `false` on the second call. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be indeterminate")
- Given `checked readOnly`, when the input is clicked, then it stays checked and `onChange` is never called. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be readonly")
- Given `readOnly` with no checked prop (uncontrolled), when the input is clicked, then it stays unchecked and `onChange` is never called, so read-only also blocks the uncontrolled path. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports uncontrolled readonly")

### Forms

- Given a `Checkbox.Input` with no `value` prop, when rendered, then `input.value` is `"on"`, matching the native HTML default. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should have default value of 'on'")
- Given `Checkbox.Root value="custom"`, when rendered, then `input.value` is `"custom"`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports custom value")
- Given `disabled`, when rendered, then `input.disabled` is `true`, so the native disabled semantics (excluded from form submission) apply. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be disabled")

### Animation and presence

- Given a `Checkbox.Indicator` with no `forceMount` and an unchecked checkbox, when rendered, then the indicator is NOT in the DOM. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "indicator > should not display indicator by default")
- Given a `Checkbox.Indicator`, when the checkbox becomes checked, then the indicator is inserted into the DOM. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "indicator > should display indicator when 'checked'")
- Given `indeterminate`, when rendered, then the indicator is in the DOM even though `checked` is false, so indeterminate also mounts the indicator. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "indicator > should display indicator when 'indeterminate'")
- Given a `Checkbox.Indicator` with `forceMount` and an unchecked checkbox, when rendered, then the indicator IS in the DOM, so `forceMount` overrides the presence gate (needed to drive exit animations from CSS). (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "indicator > should display indicator when 'forceMount'")

### Accessibility tooling

- Given a `Checkbox.Label` with text, when rendered, then the input gets `aria-labelledby` pointing at the label's id, the label is a real `HTMLLabelElement`, and its `for` attribute points at the input's id. Both association mechanisms are set. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports visible label")
- Given only `aria-labelledby="foo"` on the input and no visible label, when rendered, then `aria-labelledby` is exactly `"foo"`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports 'aria-labelledby'")
- Given both a visible label and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId>"`, author value first. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should combine 'aria-labelledby' if visible label is also provided")
- Given only `aria-label="My Label"`, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports 'aria-label'")
- Given a visible label, `aria-label="bar"` AND `aria-labelledby="foo"`, when rendered, then `aria-labelledby` becomes `"foo <labelId> <inputId>"`: the input's OWN id is appended so its `aria-label` participates in the accessible name computation. This three-way merge rule is the subtlest part of the contract. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should combine 'aria-labelledby' if visible label and 'aria-label' is also provided")
- Given a `Checkbox.Description`, when rendered, then the input gets `aria-describedby` pointing at the description's generated id, and that id differs from the input's id. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports visible description")
- Given only `aria-describedby="foo"`, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports 'aria-describedby'")
- Given a `Checkbox.Description` and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> foo"`, library value FIRST (the reverse order from `aria-labelledby`). (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should combine 'aria-describedby' if visible description")
- Given `validationState="invalid"` and a `Checkbox.ErrorMessage`, when rendered, then the input is `aria-describedby` the error message's id. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports visible error message when invalid")
- Given a `Checkbox.ErrorMessage` but NO invalid state, when rendered, then `aria-describedby` is absent entirely, so the error message is not announced while the field is valid. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should not be described by error message when not invalid")
- Given `validationState="invalid"`, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<errorMessageId> foo"`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should combine 'aria-describedby' if visible error message when invalid")
- Given `validationState="invalid"`, a description, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> <errorMessageId> foo"`, in exactly that order. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should combine 'aria-describedby' if visible description and error message when invalid")

### Notes and edge cases

- Every `fireEvent.click` is followed by a single `await Promise.resolve()` before asserting `input.checked` or the `onChange` spy. The click handler runs synchronously but the resulting DOM property write lands on the microtask queue, so this is the Solid equivalent of wrapping the interaction in React's `act()`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "ensure default unchecked can be checked")
- The unmount side of the indicator presence test is COMMENTED OUT with `// TODO: fix vitest delays`: after the second click, `expect(queryByTestId("indicator")).toBeNull()` is disabled. A single microtask flush is enough to observe the indicator MOUNTING but not enough to observe it UNMOUNTING, because the exit path goes through presence/transition machinery. This is the single clearest Solid-specific testing hazard in the file and our suite needs a real strategy for exit assertions (fake timers plus `transitionend`, or `waitFor`). (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "indicator > should display indicator when 'checked'")
- The disabled test clicks the LABEL rather than the input, with the comment "I don't know why but `fireEvent` on the input fire the click even if the input is disabled." `fireEvent.click` dispatches the event directly and bypasses the browser's disabled-element gating, so testing disabled behavior through `fireEvent` on the native control is unsound in jsdom. A conformance suite must either use `user.click` or assert on a sibling. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "can be disabled")
- The `data-attributes` describe block relies on `getAllByTestId(/^checkbox/)` with a REGEX matcher to assert the same attribute across root, label, control and indicator at once. The indicator is queried without `forceMount` in those tests, and in the `data-valid`/`data-invalid`/`data-required`/`data-disabled`/`data-readonly` cases the checkbox is unchecked, so the indicator is absent and only three elements are actually checked. The loop silently passes over the missing part. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "data-attributes > should have 'data-valid' attribute when checkbox is valid")
- `installPointerEvent()` runs for the whole file even though most tests use plain `fireEvent.click`. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should generate default ids")
- A single module-level `onChangeSpy` is shared across the file and cleared in `afterEach` with `mockClear()`, so assertions index into `onChangeSpy.mock.calls[0][0]` and `[1][0]` to distinguish first and second change. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "ensure default unchecked can be checked")
- Ported from react-spectrum `@react-spectrum/checkbox/test/Checkbox.test.js`. What did NOT come across: any test of `useFocusRing`/focus-visible rings, any `data-hover` or `data-focus-visible` assertion, hidden-input form submission via `FormData`, form reset behavior, the `form` attribute, `Checkbox` inside a `<form>` at all, and React Spectrum's label-position and wrapping tests. There are no skipped or todo tests, only the one commented-out assertion. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "should generate default ids")
- There is no test for `name` on the input, so the form-field name contract is unverified despite `value` being covered. (kobalte: packages/core/src/checkbox/checkbox.test.tsx: "supports custom value")

## radio-group

### Roles and attributes

- Given a `RadioGroup.Root` with three `RadioGroup.Item`s, when rendered, then the root exposes `role="radiogroup"` and each `RadioGroup.ItemInput` exposes `role="radio"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Given a group with no `orientation` prop, when rendered, then the root carries `aria-orientation="vertical"`, so vertical is the default for radio groups (the opposite default from toggle-group). (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-orientation' by default")
- Given `orientation="horizontal"`, when rendered, then the root carries `aria-orientation="horizontal"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-orientation' based on the 'orientation' prop")
- Given `validationState="invalid"`, when rendered, then the root carries `aria-invalid="true"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-invalid' when 'validationState=invalid'")
- Given `validationState="invalid"` and an author `aria-errormessage="test"`, when rendered, then both `aria-invalid="true"` and the author's `aria-errormessage` are present. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "passes through 'aria-errormessage'")
- Given `required`, when rendered, then the ROOT carries `aria-required="true"` and NONE of the individual radio inputs carry `aria-required`, so required is a group-level concept only. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-required' when 'isRequired' is true")
- Given `disabled` on the root, when rendered, then the root carries `aria-disabled="true"` and every radio input gets the native `disabled` attribute. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-disabled' and makes radios disabled when 'isDisabled' is true")
- Given no `disabled` prop, when rendered, then the root has no `aria-disabled` and no input has `disabled`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "doesn't set 'aria-disabled' or make radios disabled by default")
- Given `disabled={false}` explicitly, when rendered, then the root has no `aria-disabled` and no input has `disabled`, so an explicit false behaves like absent rather than rendering `aria-disabled="false"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "doesn't set 'aria-disabled' or make radios disabled when 'isDisabled' is false")
- Given `readOnly`, when rendered, then the root carries `aria-readonly="true"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-readonly=true' on radio group")
- Given a plain `RadioGroup.Root` with no validation, required, disabled or readonly props, when rendered, then NONE of `data-valid`, `data-invalid`, `data-required`, `data-disabled`, `data-readonly` are present. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should not have form control 'data-*' attributes by default")
- Given `validationState="valid"`, when rendered, then the root carries `data-valid`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should have 'data-valid' attribute when valid")
- Given `validationState="invalid"`, when rendered, then the root carries `data-invalid`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should have 'data-invalid' attribute when invalid")
- Given `required`, when rendered, then the root carries `data-required`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should have 'data-required' attribute when required")
- Given `disabled`, when rendered, then the root carries `data-disabled`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should have 'data-disabled' attribute when disabled")
- Given `readOnly`, when rendered, then the root carries `data-readonly`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should have 'data-readonly' attribute when readonly")
- Given a `RadioGroup.Item` with no `id`, when rendered, then the item gets a generated id and its parts derive ids as `<itemId>-input`, `<itemId>-control` and `<itemId>-label`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > should generate default ids")
- Given a `RadioGroup.Item` with `id="foo"`, when rendered, then its parts are `foo-input`, `foo-control` and `foo-label`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > should generate ids based on radio id")
- Given explicit `id` props on the item and each of its parts, when rendered, then every author id wins. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > supports custom ids")
- Given `validationState="valid"` on the group and a selected item, when rendered, then `data-valid` is present on the item root, control, indicator AND item label, so group validation state cascades to every item part. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-valid' attribute on radio elements when radio group is valid")
- Given `validationState="invalid"` on the group, when rendered, then `data-invalid` is present on the item root, control, indicator and item label. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-invalid' attribute on radios when radio group is invalid")
- Given `required` on the GROUP, when rendered, then `data-required` is present on the item root, control, indicator and item label, so required cascades down to items as a data attribute even though `aria-required` does not. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-required' attribute on radios when radio group is required")
- Given `readOnly` on the group, when rendered, then `data-readonly` is present on every item part. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-readonly' attribute on radios when radio group is readonly")
- Given `disabled` on the GROUP, when rendered, then `data-disabled` is present on every item part. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-disabled' attribute on radios when radio group is disabled")
- Given `disabled` on a SINGLE item and not the group, when rendered, then `data-disabled` is present on that item's root, control, indicator and label. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-disabled' attribute on single disabled radio")
- Given the group value matches an item, when rendered, then `data-checked` is present on that item's root, control, indicator and label. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-checked' attribute on checked radio")

### Keyboard

- Given a group with nothing selected, when Space is pressed and released on an item's CONTROL, then that item becomes checked and `onChange` fires once with the item's value. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can select value by pressing the Space key on the item control")

### Pointer

- Given a group with nothing selected, when a label is clicked, then the associated input becomes checked, the other two stay unchecked, and `onChange` fires once with the clicked item's value. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Given a group with nothing selected, when an item's `ItemControl` is clicked, then that item becomes checked and `onChange` fires once with its value. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can select value by clicking on the item control")
- Given a `disabled` group, when an item's label is clicked, then nothing is checked and `onChange` is never called. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-disabled' and makes radios disabled when 'isDisabled' is true")
- Given a group where only the middle item is `disabled`, when the disabled item's label is clicked, then nothing becomes checked and `onChange` is not called. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can have a single disabled radio")
- Given a group where only the middle item is `disabled`, when an ENABLED item's label is clicked, then it becomes checked and `onChange` fires once with its value, so one disabled item does not poison the rest of the group. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can have a single disabled radio")
- Given a `readOnly` group, when an item's label is clicked, then nothing becomes checked and `onChange` is not called. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-readonly=true' on radio group")
- Given a `readOnly` group, when an item's label is clicked, then the group's internal state does not update either, verified separately from the aria assertion. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should not update state for readonly radio group")

### State and controlled/uncontrolled

- Given a group with no value props, when rendered, then all three inputs are unchecked. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Given `defaultValue="cats"`, when rendered, then only the matching input is checked and `onChange` has NOT been called. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can have a default value")
- Given `defaultValue="cats"`, when a different item is clicked, then selection moves and `onChange` fires once with the new value. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can have a default value")
- Given a fixed `value="cats"` prop, when a different item is clicked, then `onChange` fires once with the requested value but the checked input does NOT move: `inputs[1].checked` stays true and `inputs[2].checked` stays false. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "value can be controlled")

### Forms

- Given a group with no `name` prop, when rendered, then all three radio inputs share one generated `name`, so they form a single native radio group. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Given each `RadioGroup.Item` carries `value`, when rendered, then each input's `value` is that item's value. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Given `RadioGroup.Root name="test-name"`, when rendered, then every radio input carries `name="test-name"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "name can be controlled")
- Given `disabled` on a single item, when rendered, then only that item's input has the native `disabled` attribute and the siblings do not. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "can have a single disabled radio")

### Animation and presence

- Given a `RadioGroup.ItemIndicator` with no `forceMount` and an unselected item, when rendered, then the indicator is NOT in the DOM. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > indicator > should not display indicator by default")
- Given a `RadioGroup.ItemIndicator`, when the item becomes selected, then the indicator is inserted into the DOM. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > indicator > should display indicator when 'selected'")
- Given a `RadioGroup.ItemIndicator` with `forceMount` and an unselected item, when rendered, then the indicator IS in the DOM. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > indicator > should display indicator when 'forceMount'")

### Accessibility tooling

- Given a `RadioGroup.Label`, when rendered, then the root gets `aria-labelledby` pointing at the label's id, the label is an `HTMLSpanElement` (NOT a `label`), and it has NO `for` attribute. A group label cannot be a `<label>` because it labels a container, not a control, which is the key difference from `Checkbox.Label`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports visible label")
- Given only `aria-labelledby="foo"` on the root, when rendered, then `aria-labelledby` is exactly `"foo"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports 'aria-labelledby'")
- Given both a `RadioGroup.Label` and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId>"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should combine 'aria-labelledby' if visible label is also provided")
- Given `aria-label="My Favorite Pet"` on the root, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports 'aria-label'")
- Given a visible label, `aria-label="bar"` and `aria-labelledby="foo"` on the root, when rendered, then `aria-labelledby` is `"foo <labelId> <rootId>"`, appending the root's own id so its `aria-label` participates in the name. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should combine 'aria-labelledby' if visible label and 'aria-label' is also provided")
- Given a `RadioGroup.Description`, when rendered, then the root gets `aria-describedby` pointing at the description's id, and that id differs from the root's id. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports visible description")
- Given a `RadioGroup.ItemDescription` inside a single item, when rendered, then the ITEM's radio input is `aria-describedby` that description's id, so items have their own description channel independent of the group's. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports visible description on single radio")
- Given only `aria-describedby="foo"` on the root, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports 'aria-describedby'")
- Given a `RadioGroup.Description` and `aria-describedby="foo"` on the root, when rendered, then the root's `aria-describedby` is `"<descriptionId> foo"`, library value first. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should combine 'aria-describedby' if visible description")
- Given `validationState="invalid"` and a `RadioGroup.ErrorMessage`, when rendered, then the root is `aria-describedby` the error message's id and that id differs from the root's. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "supports visible error message when invalid")
- Given a `RadioGroup.ErrorMessage` but a VALID group, when rendered, then the root has no `aria-describedby` at all. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should not be described by error message when not invalid")
- Given `validationState="invalid"`, an error message and `aria-describedby="foo"`, when rendered, then the root's `aria-describedby` is `"<errorMessageId> foo"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should combine 'aria-describedby' if visible error message when invalid")
- Given `validationState="invalid"`, a description, an error message and `aria-describedby="foo"`, when rendered, then the root's `aria-describedby` is `"<descriptionId> <errorMessageId> foo"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "should combine 'aria-describedby' if visible description and error message when invalid")
- Given `aria-label="Label"` on a `RadioGroup.ItemInput`, when rendered, then the radio carries that `aria-label`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > supports 'aria-label'")
- Given `aria-labelledby="foo"` on an `ItemInput` plus an `ItemLabel`, when rendered, then the radio's `aria-labelledby` is `"foo <itemLabelId>"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > supports 'aria-labelledby'")
- Given `aria-label="Label"` AND `aria-labelledby="foo"` on an `ItemInput` plus an `ItemLabel`, when rendered, then the radio's `aria-labelledby` is `"foo <itemLabelId> <radioId>"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > should combine 'aria-label' and 'aria-labelledby'")
- Given only `aria-describedby="foo"` on an `ItemInput`, when rendered, then the radio's `aria-describedby` is exactly `"foo"`. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > supports 'aria-describedby'")
- Given `aria-describedby="foo"` on an `ItemInput` AND a group-level `RadioGroup.Description`, when rendered, then the radio's `aria-describedby` is `"foo <groupDescriptionId>"`, author value FIRST. Note this is the opposite order from the group root's own merge (`<descriptionId> foo`), so the two merge rules disagree. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > should combine 'aria-describedby' from both radio and radio group")

### Notes and edge cases

- Every `fireEvent.click` and every Space keyDown/keyUp pair is followed by exactly one `await Promise.resolve()` before asserting `input.checked` or the change spy. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Disabled and read-only behavior is tested by clicking the LABEL rather than the input, the same workaround the checkbox file documents, because `fireEvent.click` on a natively `disabled` input still dispatches in jsdom. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-disabled' and makes radios disabled when 'isDisabled' is true")
- Unlike the checkbox indicator test, the radio indicator test does NOT attempt to assert unmount after deselection, so the exit-presence gap is the same but not even attempted here. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > indicator > should display indicator when 'selected'")
- The item-level `data-attributes` tests all set the group `value="cats"` so that the `ItemIndicator` is actually mounted and gets included in the `getAllByTestId(/^radio/)` sweep. Contrast with the checkbox file, where that was not done and the indicator was silently missing from the sweep. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "Radio > data-attributes > should have 'data-valid' attribute on radio elements when radio group is valid")
- `installPointerEvent()` runs for the whole file. `getByLabelText` is used to find inputs via their labels, which exercises the `for`/`id` wiring implicitly in almost every interaction test. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Ported from react-spectrum `@react-spectrum/radio/test/Radio.test.js`. What did NOT come across, and is therefore untested here: ALL keyboard navigation between radios (arrow keys moving selection, Home/End, wrapping, arrow behavior in RTL), roving tabindex across the group, Tab entering the group landing on the checked radio, focus-visible rings, the whole `data-hover`/`data-focus`/`data-focus-visible` family, form submission through `FormData`, and form reset. For a radio group that is a very large gap: the arrow-key selection model is the defining behavior of the role and nothing in this 1588-line file touches it. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- There are no skipped, todo or commented-out tests in this file. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "handles defaults")
- Several test names still use React Spectrum's prop vocabulary (`isRequired`, `isDisabled`) while the code under test uses kobalte's (`required`, `disabled`), a leftover from the port. (kobalte: packages/core/src/radio-group/radio-group.test.tsx: "sets 'aria-required' when 'isRequired' is true")

## switch

### Roles and attributes

- Given a `Switch.Root` with no `id`, when rendered, then the parts derive ids as `<rootId>-input`, `<rootId>-control`, `<rootId>-thumb` and `<rootId>-label`. (kobalte: packages/core/src/switch/switch.test.tsx: "should generate default ids")
- Given `Switch.Root id="foo"`, when rendered, then the parts are `foo-input`, `foo-control`, `foo-thumb` and `foo-label`. (kobalte: packages/core/src/switch/switch.test.tsx: "should generate ids based on switch id")
- Given explicit `id` props on the root and every part, when rendered, then each author-supplied id wins. (kobalte: packages/core/src/switch/switch.test.tsx: "supports custom ids")
- Given a `Switch.Input`, when rendered, then the underlying element is `type="checkbox"`, so the switch is a checkbox input wearing a different role. (kobalte: packages/core/src/switch/switch.test.tsx: "should set input type to checkbox")
- Given a `Switch.Input`, when rendered, then it carries an explicit `role="switch"` and is found by `getByRole("switch")`. (kobalte: packages/core/src/switch/switch.test.tsx: "should set input role to switch")
- Given `validationState="invalid"`, when rendered, then the input carries `aria-invalid="true"`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be invalid")
- Given `validationState="invalid"` and an author `aria-errormessage="test"`, when rendered, then both `aria-invalid="true"` and the author's `aria-errormessage` survive. (kobalte: packages/core/src/switch/switch.test.tsx: "passes through 'aria-errormessage'")
- Given `checked readOnly`, when rendered, then the input carries `aria-readonly="true"`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be read only")
- Given `validationState="valid"`, when rendered, then `data-valid` is present on the root, label, control AND thumb. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-valid' attribute when switch is valid")
- Given `validationState="invalid"`, when rendered, then `data-invalid` is present on the root, label, control and thumb. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-invalid' attribute when switch is invalid")
- Given `checked`, when rendered, then `data-checked` is present on the root, label, control and thumb. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-checked' attribute when switch is checked")
- Given `required`, when rendered, then `data-required` is present on the root, label, control and thumb. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-required' attribute when switch is required")
- Given `disabled`, when rendered, then `data-disabled` is present on the root, label, control and thumb. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-disabled' attribute when switch is disabled")
- Given `readOnly`, when rendered, then `data-readonly` is present on the root, label, control and thumb. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-readonly' attribute when switch is read only")

### Keyboard

- Given a switch with a `Switch.Control`, when Space is pressed and released on the control, then the switch turns on and `onChange` receives `true`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be checked by pressing the Space key on the control")

### Pointer

- Given a switch with a `Switch.Control`, when the control is clicked, then the input becomes checked and `onChange` receives `true`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be checked by clicking on the control")
- Given a `disabled` switch, when its label is clicked, then nothing changes and `onChange` is never called. (kobalte: packages/core/src/switch/switch.test.tsx: "can be disabled")

### State and controlled/uncontrolled

- Given an uncontrolled switch, when rendered, then it is off and `onChange` has not been called. (kobalte: packages/core/src/switch/switch.test.tsx: "ensure default unchecked can be checked")
- Given an uncontrolled switch, when clicked twice, then it turns on with `onChange(true)` and then off with `onChange(false)`. (kobalte: packages/core/src/switch/switch.test.tsx: "ensure default unchecked can be checked")
- Given `defaultChecked`, when rendered it is on, and when clicked it turns off with `onChange(false)`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be default checked")
- Given a fixed `checked` prop, when clicked, then the input stays checked and `onChange` receives the requested `false`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be controlled checked")
- Given a fixed `checked={false}` prop, when clicked, then the input stays unchecked and `onChange` receives the requested `true`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be controlled unchecked")
- Given `checked readOnly`, when clicked, then it stays on and `onChange` is never called. (kobalte: packages/core/src/switch/switch.test.tsx: "can be read only")
- Given `readOnly` with no checked prop, when clicked, then it stays off and `onChange` is never called. (kobalte: packages/core/src/switch/switch.test.tsx: "supports uncontrolled read only")

### Forms

- Given a `Switch.Input` with no `value` prop, when rendered, then `input.value` is `"on"`. (kobalte: packages/core/src/switch/switch.test.tsx: "should have default value of 'on'")
- Given `Switch.Root value="custom"`, when rendered, then `input.value` is `"custom"`. (kobalte: packages/core/src/switch/switch.test.tsx: "supports custom value")
- Given `disabled`, when rendered, then `input.disabled` is `true`. (kobalte: packages/core/src/switch/switch.test.tsx: "can be disabled")

### Accessibility tooling

- Given a `Switch.Label`, when rendered, then the input gets `aria-labelledby` pointing at it, the label is an `HTMLLabelElement`, and its `for` points at the input's id. (kobalte: packages/core/src/switch/switch.test.tsx: "supports visible label")
- Given only `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is exactly `"foo"`. (kobalte: packages/core/src/switch/switch.test.tsx: "supports 'aria-labelledby'")
- Given a visible label and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId>"`. (kobalte: packages/core/src/switch/switch.test.tsx: "should combine 'aria-labelledby' if visible label is also provided")
- Given only `aria-label="My Label"`, when rendered, then it is passed through. (kobalte: packages/core/src/switch/switch.test.tsx: "supports 'aria-label'")
- Given a visible label, `aria-label="bar"` and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId> <inputId>"`. (kobalte: packages/core/src/switch/switch.test.tsx: "should combine 'aria-labelledby' if visible label and 'aria-label' is also provided")
- Given a `Switch.Description`, when rendered, then the input gets `aria-describedby` pointing at its id, distinct from the input's id. (kobalte: packages/core/src/switch/switch.test.tsx: "supports visible description")
- Given only `aria-describedby="foo"`, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/switch/switch.test.tsx: "supports 'aria-describedby'")
- Given a `Switch.Description` and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> foo"`. (kobalte: packages/core/src/switch/switch.test.tsx: "should combine 'aria-describedby' if visible description")
- Given `validationState="invalid"` and a `Switch.ErrorMessage`, when rendered, then the input is `aria-describedby` the error message id, distinct from the input's id. (kobalte: packages/core/src/switch/switch.test.tsx: "supports visible error message when invalid")
- Given a `Switch.ErrorMessage` but no invalid state, when rendered, then `aria-describedby` is absent entirely. (kobalte: packages/core/src/switch/switch.test.tsx: "should not be described by error message when not invalid")
- Given `validationState="invalid"`, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<errorMessageId> foo"`. (kobalte: packages/core/src/switch/switch.test.tsx: "should combine 'aria-describedby' if visible error message when invalid")
- Given `validationState="invalid"`, a description, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> <errorMessageId> foo"`. (kobalte: packages/core/src/switch/switch.test.tsx: "should combine 'aria-describedby' if visible description and error message when invalid")

### Notes and edge cases

- The switch file is a near line-for-line clone of the checkbox file: identical id-generation, label-merge, describedby-merge, controlled, readonly and `data-*` matrices. The only genuine differences are `role="switch"`, the `Switch.Thumb` part taking the place of `Checkbox.Indicator`, and the absence of anything indeterminate. That duplication is itself the finding: the label/description merge rules and the `data-*` mirroring are a SHARED form-control contract, so our conformance suite should express them once as a reusable field-conformance battery and run it against every field component rather than rewriting 600 lines per component. (kobalte: packages/core/src/switch/switch.test.tsx: "should generate default ids")
- `Switch.Thumb` is always mounted. Unlike `Checkbox.Indicator` it has no presence gate and no `forceMount`, so there are no animation or presence tests here at all. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-checked' attribute when switch is checked")
- Every `fireEvent.click` and Space keyDown/keyUp pair is followed by one `await Promise.resolve()`. (kobalte: packages/core/src/switch/switch.test.tsx: "ensure default unchecked can be checked")
- The disabled test has the input-click line literally commented out (`// fireEvent.click(input);`) above the label click, with the same "I don't know why" comment as the checkbox file. (kobalte: packages/core/src/switch/switch.test.tsx: "can be disabled")
- Because `Switch.Thumb` is always present, the `getAllByTestId(/^switch/)` sweeps here really do cover four elements, unlike the checkbox equivalents. (kobalte: packages/core/src/switch/switch.test.tsx: "data-attributes > should have 'data-valid' attribute when switch is valid")
- Ported from react-spectrum `@react-spectrum/switch/test/Switch.test.js`. Dropped: focus-visible and hover state tests, `data-hover`/`data-focus-visible`, form submission and reset, and the `name` attribute. No skipped or todo tests. (kobalte: packages/core/src/switch/switch.test.tsx: "should generate default ids")

## number-field

### Roles and attributes

- Given a `NumberField.Input`, when rendered, then it exposes `role="spinbutton"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "can have a default value")
- Given `validationState="invalid"`, when rendered, then the input carries `aria-invalid="true"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "sets 'aria-invalid' on input when 'validationState=invalid'")
- Given a plain `NumberField.Root`, when rendered, then the input has none of `required`, `disabled` or `readonly`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "input should not have 'required', 'disabled' or 'readonly' attributes by default")
- Given `required`, when rendered, then the input carries BOTH the native `required` attribute and `aria-required="true"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "sets 'required' and 'aria-required' on input when 'isRequired' is true")
- Given `disabled`, when rendered, then the input carries BOTH native `disabled` and `aria-disabled="true"`. Note this differs from `Button`, which sets one or the other but never both. (kobalte: packages/core/src/number-field/number-field.test.tsx: "sets 'disabled' and 'aria-disabled' on input when 'isDisabled' is true")
- Given `readOnly`, when rendered, then the input carries BOTH native `readonly` and `aria-readonly="true"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "sets 'readonly' and 'aria-readonly' on input when 'isReadOnly' is true")
- Given a plain `NumberField.Root`, when rendered, then neither the root nor the input carries `data-valid`, `data-invalid`, `data-required`, `data-disabled` or `data-readonly`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should not have form control 'data-*' attributes by default")
- Given `validationState="valid"`, when rendered, then `data-valid` is on BOTH the root and the input. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should have 'data-valid' attribute when valid")
- Given `validationState="invalid"`, when rendered, then `data-invalid` is on both the root and the input. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should have 'data-invalid' attribute when invalid")
- Given `required`, when rendered, then `data-required` is on both the root and the input. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should have 'data-required' attribute when required")
- Given `disabled`, when rendered, then `data-disabled` is on both the root and the input. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should have 'data-disabled' attribute when disabled")
- Given `readOnly`, when rendered, then `data-readonly` is on both the root and the input. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should have 'data-readonly' attribute when readonly")

### Keyboard

- Given `step={4}` and `defaultValue={0}` with the input focused, when ArrowUp is pressed, then the value becomes `4`; pressing again gives `8`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments by `step` on Arrow Up")
- Given `step={4}` and `defaultValue={8}`, when ArrowDown is pressed, then the value becomes `4` and then `0`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "decrements by `step` on Arrow Down")
- Given `step={4}` and `defaultValue={0}` with NO `largeStep` prop, when PageUp is pressed, then the value becomes `40` and then `80`, so `largeStep` defaults to ten times `step`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments by `largeStep` on Page Up")
- Given `step={4}` and `defaultValue={80}`, when PageDown is pressed, then the value becomes `40` and then `0`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "decrements by `largeStep` on Page Down")
- Given `maxValue={100}` and an empty field, when End is pressed, then the value jumps to `100`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "max on End")
- Given `minValue={-100}` and an empty field, when Home is pressed, then the value jumps to `-100`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "min on Home")

### Pointer

- Given `step={4}`, `defaultValue={0}` and a `NumberField.IncrementTrigger`, when the trigger is clicked, then the input value becomes `4`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments on increment trigger")
- Given `step={4}`, `defaultValue={4}` and a `NumberField.DecrementTrigger`, when the trigger is clicked, then the input value becomes `0`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "decrements on decrement trigger")

### Focus management

- Given a `NumberField.IncrementTrigger`, when it is clicked, then `document.activeElement` becomes the INPUT rather than the trigger, so the spinner buttons hand focus back to the field. (kobalte: packages/core/src/number-field/number-field.test.tsx: "focuses input on trigger")

### State and controlled/uncontrolled

- Given `defaultValue={4}`, when rendered, then the input shows `"4"` and `onChange` has not been called. (kobalte: packages/core/src/number-field/number-field.test.tsx: "can have a default value")
- Given `defaultValue={4}`, when the user types `"0"` appending to the existing text, then the input shows `"40"` and `onChange` receives the STRING `"40"`, not the number 40. (kobalte: packages/core/src/number-field/number-field.test.tsx: "can have a default value")
- Given a fixed `value={4}` prop, when the user types `"0"`, then `onChange` receives `"40"` but the input's displayed value snaps back to `"4"`, so a controlled number field does not drift. (kobalte: packages/core/src/number-field/number-field.test.tsx: "value can be controlled")
- Given `defaultValue={1000}` and an `onRawValueChange` handler, when ArrowUp is pressed, then the handler receives the NUMBER `1001`, so `onChange` carries the formatted string and `onRawValueChange` carries the parsed number as two separate channels. (kobalte: packages/core/src/number-field/number-field.test.tsx: "raw value on change")

### Forms

- Given `NumberField.Root name="favorite-number"` with a `NumberField.HiddenInput`, when rendered, then the hidden input carries `name="favorite-number"`. The visible spinbutton input is NOT the form field; a separate `HiddenInput` part is. (kobalte: packages/core/src/number-field/number-field.test.tsx: "name can be controlled")
- Given `defaultValue={4}` with both a visible input and a `HiddenInput`, when rendered, then both read `"4"`; when the user types `"0"`, then both become `"40"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "syncs input and hidden input")
- Given `defaultValue={1000}`, when rendered, then the VISIBLE input shows the formatted `"1,000"` while the `HiddenInput` shows the unformatted `"1000"`, so the form submits a parseable number and the user sees a grouped one. (kobalte: packages/core/src/number-field/number-field.test.tsx: "format on mount")
- Given `defaultValue={1000}`, when ArrowUp is pressed, then the visible input shows `"1,001"` and the hidden input shows `"1001"`, so the split is maintained across updates and not only at mount. (kobalte: packages/core/src/number-field/number-field.test.tsx: "format on change")

### RTL and i18n

- Given `defaultValue={1000}` in the default locale, when rendered, then the input shows the thousands separator as `"1,000"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "format on mount")
- Given `I18nProvider locale="de"` and `value={1.1}`, when rendered, then the input shows `"1,1"` with a COMMA as the decimal separator. (kobalte: packages/core/src/number-field/number-field.test.tsx: "formats decimal value correctly for locale")
- Given `I18nProvider locale="de"` and `rawValue={1.1}`, when rendered, then the input shows `"1,1"`, so `rawValue` goes through the same locale formatter as `value`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "formats decimal rawValue correctly for locale")
- Given `I18nProvider locale="de"`, `defaultValue={1.1}` and no `step`, when the increment trigger is clicked, then the value becomes `"2"`, so the default step of 1 applied to 1.1 rounds to 2 rather than yielding 2.1. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments decimal values correctly for locale")
- Given `I18nProvider locale="de"` and `defaultValue={1.1}`, when the decrement trigger is clicked, then the value becomes `"1"`, so decrementing also snaps to the step grid rather than yielding 0.1. (kobalte: packages/core/src/number-field/number-field.test.tsx: "decrements decimal values correctly for locale")

### Accessibility tooling

- Given a `NumberField.Label`, when rendered, then the input gets `aria-labelledby` pointing at it, the label is an `HTMLLabelElement`, and its `for` points at the input's id. (kobalte: packages/core/src/number-field/number-field.test.tsx: "supports visible label")
- Given only `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is exactly `"foo"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "supports 'aria-labelledby'")
- Given a visible label and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId>"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should combine 'aria-labelledby' if visible label is also provided")
- Given only `aria-label="My Favorite Number"`, when rendered, then it is passed through. (kobalte: packages/core/src/number-field/number-field.test.tsx: "supports 'aria-label'")
- Given a visible label, `aria-label="bar"` and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId> <inputId>"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should combine 'aria-labelledby' if visible label and 'aria-label' is also provided")
- Given a `NumberField.Description`, when rendered, then the input gets `aria-describedby` pointing at its distinct id. (kobalte: packages/core/src/number-field/number-field.test.tsx: "supports visible description")
- Given only `aria-describedby="foo"`, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/number-field/number-field.test.tsx: "supports 'aria-describedby'")
- Given a description and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> foo"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should combine 'aria-describedby' if visible description")
- Given `validationState="invalid"` and a `NumberField.ErrorMessage`, when rendered, then the input is `aria-describedby` the error message's distinct id. (kobalte: packages/core/src/number-field/number-field.test.tsx: "supports visible error message when invalid")
- Given an error message but no invalid state, when rendered, then `aria-describedby` is absent. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should not be described by error message when not invalid")
- Given `validationState="invalid"`, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<errorMessageId> foo"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should combine 'aria-describedby' if visible error message when invalid")
- Given `validationState="invalid"`, a description, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> <errorMessageId> foo"`. (kobalte: packages/core/src/number-field/number-field.test.tsx: "should combine 'aria-describedby' if visible description and error message when invalid")

### Notes and edge cases

- Keyboard tests use `input.focus()` then `fireEvent.keyDown` plus `fireEvent.keyUp` as a PAIR, followed by one `await Promise.resolve()`. Firing only keyDown is not enough for this component. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments by `step` on Arrow Up")
- The two typing tests use `await userEvent.type(input, "0")` with NO fake timers and no `delay: null`, which appends to the existing value rather than replacing it. The `await` on `userEvent.type` is what flushes reactivity here, so no extra `Promise.resolve()` appears. (kobalte: packages/core/src/number-field/number-field.test.tsx: "can have a default value")
- The increment and decrement trigger tests call `trigger.click()` (the raw DOM method) and then assert the new input value with NO flush at all, and they pass. Native `.click()` dispatches synchronously and the value assertion happens to observe the update, whereas the keyboard tests next to them DO need `await Promise.resolve()`. That inconsistency is a real trap: whether a Solid update is observable without a flush depends on the code path, so a conformance suite should flush unconditionally rather than rely on this. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments on increment trigger")
- Locale behavior is driven by wrapping the component in kobalte's own `I18nProvider locale="de"` from `../i18n`, not by a global test locale, so locale is a context value and every locale assertion needs that wrapper. (kobalte: packages/core/src/number-field/number-field.test.tsx: "formats decimal value correctly for locale")
- `data-testId` is spelled with a capital I in several places (`data-testId="hidden-input"`), which still works because `getByTestId` reads the lowercased attribute in the DOM, but it is inconsistent with the rest of the repo. (kobalte: packages/core/src/number-field/number-field.test.tsx: "name can be controlled")
- No `installPointerEvent()` in this file, and no pointer-event tests. There is no test for scroll-wheel increment, no test for press-and-hold repeat on the triggers, no test for clamping at `minValue`/`maxValue` during increment, no test for `format`/`formatOptions` (currency, percent, unit), no test for typing an invalid string, no test for blur-commit or value rounding on blur, and no test that the triggers become disabled at the bounds. Those are all real number-field behaviors that our suite has to cover from scratch. (kobalte: packages/core/src/number-field/number-field.test.tsx: "increments on increment trigger")
- No upstream attribution header on this file, so it is kobalte-original even though the underlying `spin-button` primitive is ported. No skipped or todo tests. (kobalte: packages/core/src/number-field/number-field.test.tsx: "can have a default value")

## spin-button

### Roles and attributes

- Given `SpinButton.Root` with `value={2}`, `textValue="2 items"`, `minValue={1}` and `maxValue={3}`, when rendered, then it carries `role="spinbutton"`, `aria-valuenow="2"`, `aria-valuemin="1"`, `aria-valuemax="3"` and `aria-valuetext="2 items"`, and has NEITHER `aria-disabled` nor `aria-readonly`. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should have role=\"spinbutton\" and aria props")
- Given `disabled`, when rendered, then `aria-disabled="true"` is set. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should have aria-disabled if isDisabled is set")
- Given `readOnly`, when rendered, then `aria-readonly="true"` is set. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should have aria-readonly if isReadOnly is set")
- Given `value={-2}` and `textValue="-2 items"`, when rendered, then `aria-valuenow` is the plain `"-2"` but `aria-valuetext` substitutes U+2212 MINUS SIGN for the ASCII hyphen, giving `"−2 items"`. Screen readers mispronounce a hyphen as a dash, so the announced text uses the real minus character while the machine-readable value does not. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should substitute a minus sign for hyphen in the textValue for negative values")
- Given a STRING `value={"1,402"}`, when rendered, then `aria-valuenow` is `"1,402"` verbatim, so the primitive does not coerce or reformat a string value. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should work with string values")

### Keyboard

- Given an `onIncrement` handler, when ArrowUp is pressed, then `onIncrement` fires exactly once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onIncrement on arrow up")
- Given an `onDecrement` handler, when ArrowDown is pressed, then `onDecrement` fires exactly once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onDecrement on arrow down")
- Given an `onIncrementPage` handler, when PageUp is pressed, then `onIncrementPage` fires exactly once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onIncrementPage on page up")
- Given only `onIncrement` and NO `onIncrementPage`, when PageUp is pressed, then `onIncrement` fires once, so PageUp degrades to a single step when no page handler exists. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should fall back to onIncrement on page up if onIncrementPage is not available")
- Given an `onDecrementPage` handler, when PageDown is pressed, then `onDecrementPage` fires exactly once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onDecrementPage on page up")
- Given only `onDecrement` and no `onDecrementPage`, when PageDown is pressed, then `onDecrement` fires once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should fall back to onDecrement on page up if onDecrementPage is not available")
- Given `onDecrementToMin` and `minValue={1}`, when Home is pressed, then `onDecrementToMin` fires exactly once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onDecrementToMin on home key")
- Given `onIncrementToMax` and `maxValue={1}`, when End is pressed, then `onIncrementToMax` fires exactly once. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onIncrementToMax on end key")

### Notes and edge cases

- Every test here fires only `keyDown` with no matching `keyUp` and asserts the spy synchronously with NO `await Promise.resolve()`. That works because the assertions are on a callback spy rather than on rendered DOM, so no reactivity has to settle. The contrast with `number-field`, which needs keyDown plus keyUp plus a flush, is a useful rule: spy assertions need no flush, DOM assertions do. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onIncrement on arrow up")
- Two test names are copy-paste wrong: "should trigger onDecrementPage on page up" and "should fall back to onDecrement on page up if onDecrementPage is not available" both actually press PageDOWN. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onDecrementPage on page up")
- Ported from react-spectrum `@react-aria/spinbutton/test/useSpinButton.test.js`. What was DROPPED is substantial and specific: React Aria's version tests press-and-hold auto-repeat on the increment and decrement buttons using `jest.useFakeTimers()` plus `act(() => jest.advanceTimersByTime(400))`, and it tests the `useSpinButton` live-announcer integration that announces the new value to screen readers. Neither survived the port. The auto-repeat drop is almost certainly because it requires fake timers interleaved with `act()`, which has no direct Solid equivalent. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onIncrement on arrow up")
- There are no tests for the `disabled`/`readOnly` gating of the keyboard handlers, only for their aria attributes, so a disabled spinbutton could still fire `onIncrement` without failing this suite. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should have aria-disabled if isDisabled is set")
- No `installPointerEvent()` and no pointer tests at all in this file. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should have role=\"spinbutton\" and aria props")

## otp-field

### Roles and attributes

- Given `<OtpField.Root>` with no `as` prop, when it renders, then the element is a `div` carrying `data-corvu-otp-field-root=""` and inline `position: relative`, `user-select: none`, `-webkit-user-select: none`, and `pointer-events: none`. (corvu-src: packages/otp-field/src/Root.tsx)
- Given `<OtpField.Input>` with no `as` prop, when it renders, then the element is an `input` carrying `data-corvu-otp-field-input=""`, `inputMode="numeric"`, `autocomplete` defaulting to `one-time-code`, `spellcheck` defaulting to `false`, and a `pattern` attribute holding the regex source. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the input renders, when its inline style is computed, then it sets `display: flex`, `position: absolute`, `inset: 0`, `height: 100%`, `padding: 0`, `color: transparent`, `background: transparent`, `caret-color: transparent`, `border: 0 solid transparent`, `outline: 0 solid transparent`, `box-shadow: none`, `line-height: 1`, `letter-spacing: -1em`, `font-family: monospace`, `font-variant-numeric: tabular-nums`, `font-size` equal to the measured root height in pixels, and `pointer-events: all`. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `shiftPWManagers` is `true` (the default), when the input renders, then its `width` is `calc(100% + 40px)` and its `clip-path` is `inset(0 40px 0 0)`, reserving 40 pixels on the right for password manager icons; with `shiftPWManagers={false}` the width is `100%` and no clip path is applied. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the OTP field mounts, when the shared style element is created, then a single `<style>` node is appended to `document.head` declaring `[data-corvu-otp-field-input]::selection` fully transparent, `:autofill` and `:-webkit-autofill` transparent with `opacity: 0` and `-webkit-text-fill-color: transparent`, an `@supports (-webkit-touch-callout: none)` block tightening `letter-spacing` to `-.6em` with `font-weight: 100` and a one-pixel offset for iOS, and `[data-corvu-otp-field-input] + *` forced to `pointer-events: all`. (corvu-src: packages/otp-field/src/lib/style.ts)
- Given the OTP field package, when its attributes are enumerated, then it defines exactly two: `data-corvu-otp-field-root` and `data-corvu-otp-field-input`, and it declares no CSS custom properties at all. (corvu-src: packages/otp-field/src/Root.tsx)
- Given slot rendering, when a consumer needs per-slot state, then there is no slot component or slot attribute; `value`, `isFocused`, `isHovered`, `isInserting`, `maxLength`, `activeSlots`, and `shiftPWManagers` come from the context or children props and the consumer renders its own slots. (corvu-src: packages/otp-field/src/context.ts)

### Keyboard

- Given the input, when `keydown` fires, then the only key the component reacts to is `Shift`, which latches an internal `shiftKeyDown` flag used by selection normalisation; `keyup` on `Shift` clears it. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the field is focused with the caret in the middle of the value, when `ArrowLeft` or `ArrowRight` moves the caret, then the `selectionchange` handler snaps the selection to a one-character range and sets `direction` to `backward` or `forward` accordingly. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `shiftKeyDown` is latched and the selection changes with no `inputType`, when the selection is normalised, then the range is widened by one extra character so shift-extension selects more than a single slot. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the caret sits at index `0`, when the selection is normalised, then the range becomes `[0, 1]` with `direction: 'forward'`; at `maxLength` it becomes `[maxLength - 1, maxLength]` with `direction: 'backward'`. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `Backspace` deletes a character, when the shortened value is processed, then `onSelectionChange` is invoked with the `inputType` so `deleteContentForward` can be distinguished from backward navigation when choosing the new one-character range. (corvu-src: packages/otp-field/src/Input.tsx)

### Pointer

- Given the input, when `mouseover` fires and the input is not `disabled`, then `isHovered` becomes `true`; `mouseleave` sets it back to `false` unconditionally. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the root is `pointer-events: none` and the input is `pointer-events: all`, when a user clicks anywhere in the slot layout, then the click lands on the invisible full-size input rather than on a slot element. (corvu-src: packages/otp-field/src/Root.tsx)
- Given the injected stylesheet forces `[data-corvu-otp-field-input] + *` to `pointer-events: all`, when the next sibling of the input is the visible slot wrapper, then that wrapper becomes interactive again despite the root's `pointer-events: none`. (corvu-src: packages/otp-field/src/lib/style.ts)

### Focus management

- Given the input receives focus, when `onFocus` runs, then the selection is first collapsed to the end of the current value, `isFocused` becomes `true`, and the selection is then normalised into `activeSlots`. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the input is blurred, when `onBlur` runs, then `shiftKeyDown` is cleared, `isFocused` becomes `false`, and the selection pass sets `activeSlots` to an empty array and `isInserting` to `false`. (corvu-src: packages/otp-field/src/Input.tsx)
- Given a `selectionchange` fires while `document.activeElement` is not the input, or `selectionStart` / `selectionEnd` is `null`, when it is handled, then the selection is recorded as null, `activeSlots` becomes empty, and `isInserting` becomes `false`. (corvu-src: packages/otp-field/src/Input.tsx)

### State and controlled/uncontrolled

- Given no `value` prop, when the field mounts, then it is uncontrolled starting at the empty string; supplying `value` makes it controlled and only `onValueChange` fires. (corvu-src: packages/otp-field/src/Root.tsx)
- Given the context value changes, when the sync effect runs, then `element.value` is assigned from the context, so a controlled parent that rejects a change snaps the DOM input back. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the value reaches `maxLength`, when the completion effect runs, then `onComplete` fires with the full value; it fires again on every later run where the length still equals `maxLength`. (corvu-src: packages/otp-field/src/Root.tsx)
- Given `maxLength` is declared required with no default, when it is omitted, then nothing supplies a fallback and the slice and insertion logic compare against `undefined`. (corvu-src: packages/otp-field/src/Root.tsx)
- Given `<OtpField.Root>` children are a function, when they resolve, then they receive `value`, `isFocused`, `isHovered`, `isInserting`, `maxLength`, `activeSlots`, and `shiftPWManagers`. (corvu-src: packages/otp-field/src/Root.tsx)
- Given `isInserting`, when the selection is normalised, then it is `true` exactly when the value is shorter than `maxLength` and the caret sits at the end of the value, which is the signal for drawing a fake caret. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `activeSlots`, when it is computed, then it is the array of indexes covered by the normalised selection range, so a single caret yields one index and a shift-selection yields several. (corvu-src: packages/otp-field/src/Input.tsx)
- Given an OTP field part is used outside `<OtpField.Root>`, when it reads context, then it throws `[corvu]: OTP Field context not found. Make sure to wrap OTP Field components in <OtpField.Root>`. (corvu-src: packages/otp-field/src/context.ts)

### Forms

- Given `pattern` defaults to `'^\\d*$'`, when input arrives while inserting at the end or with the whole value selected, then characters outside the pattern's character class are stripped before the value is accepted. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the sanitised value still fails the pattern test, when input is handled, then `preventDefault` is called, the DOM input's value is restored from the context, and the previous selection range is reinstated. (corvu-src: packages/otp-field/src/Input.tsx)
- Given a paste longer than `maxLength`, when it is processed, then the value is sliced to `maxLength` before validation. (corvu-src: packages/otp-field/src/Input.tsx)
- Given input produced a non-empty raw value that filtered down to nothing, or a value identical to the current one, when it is handled, then it is rejected and the DOM value is restored. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `pattern` is set to `null`, when the field is used, then no regex is built, no sanitising happens, the `pattern` attribute is omitted, and every character is accepted. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the input is inside a `<form>`, when that form's `reset` event fires, then after two animation frames the context value is resynced from the DOM input's value. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `autocomplete` is not overridden, when the input renders, then it advertises `one-time-code` so platform SMS autofill offers the code. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `disabled` is passed, when it is forwarded, then it lands on the native input, disabling typing, and it also suppresses the hover state. (corvu-src: packages/otp-field/src/Input.tsx)

### SSR and hydration

- Given `noScriptCSSFallback` is left at its default, when the field renders on the server, then a `<noscript><style>` block is emitted that restores `color`, `background-color`, `caret-color`, `letter-spacing`, `text-align: center`, a visible border, `width: 100%`, `font-size: inherit`, and `clip-path: none` on the input so the field is usable without JavaScript. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the field renders on the client, when `isServer` is `false`, then the `<noscript>` block is not rendered at all, so hydration must tolerate the server having emitted a node the client does not. (corvu-src: packages/otp-field/src/Input.tsx)
- Given `noScriptCSSFallback` is set to `null`, when the field renders, then no fallback style is emitted and the consumer owns the no-JavaScript appearance. (corvu-src: packages/otp-field/src/Input.tsx)

### Accessibility tooling

- Given the input is the only real form control, when assistive tech inspects the field, then it sees one text input with `inputmode="numeric"` and `autocomplete="one-time-code"`, and the visible slots are decorative markup the consumer is responsible for labelling. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the input's text is `color: transparent` with `caret-color: transparent`, when a user relies on browser zoom or high contrast, then the real value is invisible and only the consumer's slot rendering conveys it. (corvu-src: packages/otp-field/src/Input.tsx)

### Notes and edge cases

- Given jsdom, when `<OtpField.Root>` mounts, then `createSize` constructs a `ResizeObserver`, which jsdom does not implement, so rendering the root throws a `ReferenceError` unless `ResizeObserver` is polyfilled; this blocks every OTP field test, not just size assertions. (corvu-src: packages/utils/src/create/size.ts)
- Given jsdom, when the root height is measured, then `offsetHeight` is always `0`, so the input's `font-size` is `"0px"` and any assertion that the hidden input's glyphs line up with the slots is impossible. (corvu-src: packages/otp-field/src/Root.tsx)
- Given jsdom, when selection normalisation runs, then jsdom implements `setSelectionRange` and `selectionStart` / `selectionEnd` on inputs but does not fire `selectionchange` on its own, so every test has to dispatch a synthetic `selectionchange` on `document` after moving the caret before `activeSlots` updates. (corvu-src: packages/otp-field/src/Input.tsx)
- Given jsdom, when the form reset path is tested, then the resync is deferred through `afterPaint`, so the assertion must await two animation frames after dispatching `reset`. (corvu-src: packages/otp-field/src/Input.tsx)
- Given jsdom, when the `clip-path` and `@supports (-webkit-touch-callout: none)` rules are checked, then jsdom's CSS engine neither evaluates the `@supports` condition nor exposes `clip-path` through `getComputedStyle`, so the iOS workaround and the password manager gutter can only be asserted as inline style strings. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the injected stylesheet, when it is created, then `otpFieldStyleElement` and `activeCount` are module-level mutable variables, so a test that unmounts without running Solid cleanup leaves the `<style>` node in `document.head` and a non-zero refcount that prevents any later cleanup from removing it. (corvu-src: packages/otp-field/src/lib/style.ts)
- Given the style element's CSS text, when it is inspected, then several rules carry stray trailing characters (a `';` after the `::selection` rule and `};` after three others), so the sheet does not parse cleanly and a test asserting rule counts will not match the source. (corvu-src: packages/otp-field/src/lib/style.ts)
- Given `previousSelection` and `shiftKeyDown`, when they hold selection history, then they are plain closure variables rather than signals, so the only observable surface for selection behaviour is `activeSlots` and `isInserting`. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the `selectionchange` listener, when it is installed, then it is registered on `document` inside the same effect that creates the shared style element, so the listener's lifetime is tied to that effect rather than to the input element. (corvu-src: packages/otp-field/src/Input.tsx)
- Given the sanitising regex, when it is built, then it is assembled as `new RegExp('[^' + pattern.source + ']', 'g')`, which splices a whole anchored pattern such as `^\d*$` into a character class; the class therefore matches the literal characters `^`, `\d`, `*`, and `$` and the filter's behaviour is incidental rather than designed. (corvu-src: packages/otp-field/src/Input.tsx)
- Given Solid 2 portability, when `<OtpField.Root>` builds its tree, then it returns a `createMemo` as JSX, creates keyed contexts inside that memo, and wraps children in `untrack`, matching the other corvu roots. (corvu-src: packages/otp-field/src/Root.tsx)
- Given a design decision worth copying, when the field needs full control of the caret, then it uses one real transparent input over consumer-drawn slots and exposes selection as an `activeSlots` index array, so no slot ever needs its own input. (corvu-src: packages/otp-field/src/Input.tsx)
- Given a design decision worth avoiding, when the field needs browser workarounds, then it injects a global stylesheet with `!important` rules keyed off `data-corvu-otp-field-input`, which is hard to override and invisible to component-level tests. (corvu-src: packages/otp-field/src/lib/style.ts)

## tabs

### Roles and attributes

- Given a `Tabs.Root` with a `Tabs.List`, three `Tabs.Trigger`s and three `Tabs.Content`s, when rendered, then the list has `role="tablist"` with `aria-orientation="horizontal"` and exactly three `role="tab"` children. (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")
- Given tabs are rendered, when inspected, then EVERY tab carries both a `tabindex` and an `aria-selected` attribute, so neither is conditional. (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")
- Given the selected tab, when inspected, then it carries `aria-controls` pointing at an element that exists, that element has `role="tabpanel"`, its `aria-labelledby` points back at the tab's id, and it holds the first panel's text. The tab and panel are cross-linked in both directions. (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")
- Given `Tabs.Root orientation="vertical"`, when rendered, then the tablist carries `aria-orientation="vertical"`. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via up/down arrow keys with vertical tabs")

### Keyboard

- Given horizontal tabs with the first selected and focused, when ArrowRight is pressed, then the second tab becomes `aria-selected="true"`, so the default activation mode selects on arrow. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via left/right arrow keys with horizontal tabs")
- Given horizontal tabs with the second selected, when ArrowLeft is pressed, then the first becomes selected again. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via left/right arrow keys with horizontal tabs")
- Given horizontal tabs, when ArrowUp is pressed, then selection does not change. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via left/right arrow keys with horizontal tabs")
- Given horizontal tabs, when ArrowDown is pressed, then selection does not change. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via left/right arrow keys with horizontal tabs")
- Given vertical tabs, when ArrowRight is pressed, then selection does not change. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via up/down arrow keys with vertical tabs")
- Given vertical tabs, when ArrowLeft is pressed, then selection does not change. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via up/down arrow keys with vertical tabs")
- Given vertical tabs with the first selected, when ArrowDown is pressed, then the second becomes selected. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via up/down arrow keys with vertical tabs")
- Given vertical tabs with the second selected, when ArrowUp is pressed, then the first becomes selected. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via up/down arrow keys with vertical tabs")
- Given horizontal tabs with the FIRST tab selected and focused, when ArrowLeft is pressed, then selection wraps to the LAST tab. (kobalte: packages/core/src/tabs/tabs.test.tsx: "wraps focus from first to last/last to first item")
- Given the LAST tab selected, when ArrowRight is pressed, then selection wraps to the FIRST tab, so arrow navigation is circular by default (unlike toggle-group, which has no wrap test). (kobalte: packages/core/src/tabs/tabs.test.tsx: "wraps focus from first to last/last to first item")
- Given the first tab focused, when End is pressed, then the last tab becomes selected. (kobalte: packages/core/src/tabs/tabs.test.tsx: "select last item via end key / select first item via home key")
- Given the last tab selected, when Home is pressed, then the first tab becomes selected. (kobalte: packages/core/src/tabs/tabs.test.tsx: "select last item via end key / select first item via home key")
- Given `activationMode="manual"` with the first tab selected, when ArrowRight is pressed, then the second tab receives DOM focus but stays `aria-selected="false"`, so focus and selection decouple. (kobalte: packages/core/src/tabs/tabs.test.tsx: "does not select via left / right keys if 'activationMode' is manual, select on enter / spacebar")
- Given `activationMode="manual"`, when ArrowRight is pressed twice, then focus reaches the third tab and it is still `aria-selected="false"`. (kobalte: packages/core/src/tabs/tabs.test.tsx: "does not select via left / right keys if 'activationMode' is manual, select on enter / spacebar")
- Given `activationMode="manual"` with the third tab focused but unselected, when Enter is pressed, then the third becomes `aria-selected="true"`, the other two become `"false"`, and `onChange` fires exactly once for the whole sequence. Arrow navigation in manual mode emits no change events at all. (kobalte: packages/core/src/tabs/tabs.test.tsx: "does not select via left / right keys if 'activationMode' is manual, select on enter / spacebar")
- Given a group with the middle tab `disabled` and the first tab focused, when ArrowRight is pressed and released on the disabled tab, then `onChange` is called with `"three"`, so arrow navigation SKIPS the disabled tab rather than stopping on it. (kobalte: packages/core/src/tabs/tabs.test.tsx: "disabled tabs cannot be keyboard navigated to")

### Pointer

- Given `defaultValue="one"`, when a mouse `pointerdown` then `pointerup` is dispatched on the second tab, then it becomes `aria-selected="true"`, its `aria-controls` resolves to a `role="tabpanel"` whose `aria-labelledby` is the tab's id and whose text is "Body 2", and `onChange` fires exactly once. (kobalte: packages/core/src/tabs/tabs.test.tsx: "supports using click to change tab")
- Given a group with the middle tab `disabled`, when that tab is clicked via `user.click`, then `onChange` is never called. (kobalte: packages/core/src/tabs/tabs.test.tsx: "disabled tabs cannot be pressed")
- Given `defaultValue="one"` and the first tab already selected, when a `pointerdown` is dispatched on that SAME first tab, then `onChange` still fires once with `"one"`, so re-selecting the current tab is not deduplicated. That is a deliberate choice worth deciding on for our own API. (kobalte: packages/core/src/tabs/tabs.test.tsx: "fires onValueChange when clicking on the current tab")

### Focus management

- Given `defaultValue="two"`, when the user Tabs into the page for the first time, then focus lands on the SELECTED tab (index 1), not the first tab. (kobalte: packages/core/src/tabs/tabs.test.tsx: "should focus the selected tab when tabbing in for the first time")
- Given `Tabs.Root disabled` with `defaultValue="two"`, when the user Tabs in, then focus lands on the TABPANEL rather than on any tab, so a disabled tablist is skipped but the panel remains reachable. (kobalte: packages/core/src/tabs/tabs.test.tsx: "should not focus any tabs when isDisabled tabbing in for the first time")
- Given a group with the middle tab disabled, when the user Tabs in, then focus lands on the first (enabled) tab. (kobalte: packages/core/src/tabs/tabs.test.tsx: "disabled tabs cannot be keyboard navigated to")
- Given ALL tabs `disabled` and no default value, when the user Tabs in, then the first tab is still `aria-selected="true"`, `onChange` has been called with `"one"`, and focus lands on the tabpanel. So a fully disabled tablist still auto-selects its first tab and emits a change on mount. (kobalte: packages/core/src/tabs/tabs.test.tsx: "selects first tab if all tabs are disabled")
- Given panels whose content has no focusable elements, when a panel is shown, then the tabpanel gets `tabindex="0"` so it is reachable; when the panel contains a focusable input, then the tabpanel has NO `tabindex`. (kobalte: packages/core/src/tabs/tabs.test.tsx: "tabpanel should have tabIndex=0 only when there are no focusable elements")

### State and controlled/uncontrolled

- Given no `defaultValue`, when rendered, then the first tab is selected automatically and its panel is shown. (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")
- Given all tabs disabled and no value, when mounted, then `onChange` is called with `"one"` as a side effect of auto-selection, so mounting CAN emit a change event for tabs (unlike checkbox, radio-group and toggle-group, which never do). (kobalte: packages/core/src/tabs/tabs.test.tsx: "selects first tab if all tabs are disabled")

### Notes and edge cases

- One test is fully `it.skip` with the comment `// TODO test create-presence`: "tabpanel should have tabIndex=0 only when there are no focusable elements". It is the only test in the file that calls `vi.runAllTimers()` after the pointer events, and it is skipped because the panel swap goes through `create-presence`, whose timing the test could not pin down. So kobalte's own conditional-tabindex behavior is unverified, and the reason is precisely the Solid presence machinery. This is the second place (after `Checkbox.Indicator`) where presence defeated the test author. (kobalte: packages/core/src/tabs/tabs.test.tsx: "tabpanel should have tabIndex=0 only when there are no focusable elements")
- Five tests are `it.skipIf(process.env.GITHUB_ACTIONS)`, and again every one of them uses `user.tab()`: "should focus the selected tab when tabbing in for the first time", "should not focus any tabs when isDisabled tabbing in for the first time", "disabled tabs cannot be keyboard navigated to", "disabled tabs cannot be pressed", and "selects first tab if all tabs are disabled". All of kobalte's disabled-tab behavior is therefore CI-unverified. (kobalte: packages/core/src/tabs/tabs.test.tsx: "should focus the selected tab when tabbing in for the first time")
- `userEvent.setup({ delay: null })` with a linked comment to testing-library issue 833 explaining that user-event otherwise deadlocks under `vi.useFakeTimers()`. Fake timers are installed in `beforeEach` for the whole file even though only the skipped presence test uses `vi.runAllTimers()`. (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")
- Each `fireEvent.keyDown` is followed by a single `await Promise.resolve()`. Pointer selection needs a `pointerdown` flush AND a `pointerup` flush as two separate awaits. (kobalte: packages/core/src/tabs/tabs.test.tsx: "supports using click to change tab")
- `createPointerEvent` is imported but `installPointerEvent()` is NOT called in this file, unlike toggle-group. `createPointerEvent` builds a plain `Event` with assigned properties so it works without the class stub, which means the two helpers are independent and `installPointerEvent` is only needed when library code does `instanceof PointerEvent` or reads constructor-only fields. (kobalte: packages/core/src/tabs/tabs.test.tsx: "supports using click to change tab")
- The keyDown events again pass numeric `code` and `charCode` values, which the implementation ignores. (kobalte: packages/core/src/tabs/tabs.test.tsx: "allows user to change tab item select via left/right arrow keys with horizontal tabs")
- A module-level `onValueChangeSpy` is shared and reset via `vi.clearAllMocks()` in `afterEach`, but two tests shadow it with a local `vi.fn()` of the same name, so the file mixes both idioms. (kobalte: packages/core/src/tabs/tabs.test.tsx: "supports using click to change tab")
- Ported from react-spectrum `@react-spectrum/tabs/test/Tabs.test.js`. Dropped or absent: any test of `Tabs.Indicator`. Kobalte ships `tabs/tabs-indicator.tsx`, which measures the selected trigger and writes an inline `transform`, `width` and `height`, sets `transition: none` on its very first measurement so it does not animate in from zero, renders `visibility: hidden` until it has measured, and computes the transform from the RIGHT edge of the tab list under RTL. None of that is tested, and all of it depends on `offsetWidth`/`offsetHeight`/`offsetLeft`, which jsdom reports as 0, so it cannot be tested without stubbing layout. Also absent: tab overflow and collapse-to-picker behavior, RTL arrow reversal, and controlled `value` with `onChange` (only `defaultValue` is ever used, so the controlled path for tabs is untested). (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")

## accordion

Two independent accordions. `(kobalte: ...)` bullets come from a test suite that is
entirely `skipIf(GITHUB_ACTIONS)`; `(corvu-src: ...)` bullets are read from corvu's
source and are untested. Where they disagree (part names, whether an item renders a DOM
node, `data-*` vocabulary) the disagreement is itself worth reading.

### Roles and attributes

- Given an accordion with three items and `defaultValue={["one"]}`, when rendered, then there are exactly three `role="heading"` elements, each containing a `role="button"` trigger that carries `aria-expanded`. (kobalte: packages/core/src/accordion/accordion.test.tsx: "renders properly")
- Given the expanded item, when inspected, then its trigger carries `aria-controls` pointing at an element that exists, that element has `role="region"`, its `aria-labelledby` points back at the trigger's id, and it holds the matching content text. (kobalte: packages/core/src/accordion/accordion.test.tsx: "renders properly")
- Given `defaultValue={["one"]}`, when rendered, then the first trigger has `aria-expanded="true"` and its content is visible. (kobalte: packages/core/src/accordion/accordion.test.tsx: "can have default expanded value")
- Given a controlled accordion at `value={["one"]}`, when rendered, then the first trigger is `aria-expanded="true"` and the second is `aria-expanded="false"`. (kobalte: packages/core/src/accordion/accordion.test.tsx: "can be controlled")
- Given `<Accordion.Item>` with no `as` prop, when it renders, then it renders as a `Fragment` with no DOM node, and `data-corvu-accordion-item=""` only appears when the consumer overrides `as` with a real element. (corvu-src: packages/accordion/src/Item.tsx)
- Given `<Accordion.Trigger>`, when it renders, then the element is a `button` carrying `data-corvu-accordion-trigger=""`, `id` equal to the item's registered `triggerId`, `aria-controls` equal to the item's `disclosureId`, `aria-expanded`, `data-expanded` / `data-collapsed`, and `data-corvu-disclosure-trigger` removed. (corvu-src: packages/accordion/src/Trigger.tsx)
- Given an item is disabled, when its trigger renders, then the element gets the native `disabled` attribute, `aria-disabled="true"`, and `data-disabled=""`. (corvu-src: packages/accordion/src/Trigger.tsx)
- Given an item is not disabled, when its trigger renders, then `disabled` resolves to `undefined` and both `aria-disabled` and `data-disabled` are omitted rather than set to `"false"`. (corvu-src: packages/accordion/src/Trigger.tsx)
- Given `<Accordion.Content>`, when it renders, then the element is a `div` with `role="region"`, `aria-labelledby` equal to the item's `triggerId`, `id` equal to the `disclosureId`, `data-expanded` / `data-collapsed`, `data-corvu-accordion-content=""`, and `data-corvu-disclosure-content` removed. (corvu-src: packages/accordion/src/Content.tsx)
- Given `<Accordion.Content>`, when it renders, then it sets the custom properties `--corvu-disclosure-content-width` and `--corvu-disclosure-content-height` (the disclosure names are kept, not renamed to an accordion prefix) for width and height animations. (corvu-src: packages/accordion/src/Content.tsx)

### Keyboard

- Given three triggers with the first focused, when Tab is pressed, then focus moves to the second trigger; Shift+Tab returns to the first; two more Tabs reach the third; one more Tab leaves the accordion entirely; Shift+Tab from outside returns to the third. Every trigger is an independent tab stop, so the accordion uses NO roving tabindex. (kobalte: packages/core/src/accordion/accordion.test.tsx: "allows users to navigate accordion headers through the tab key")
- Given `collapsible defaultValue={["one"]}` with the first trigger focused, when Enter is pressed and released, then it collapses to `aria-expanded="false"`; pressing Enter again re-expands it. (kobalte: packages/core/src/accordion/accordion.test.tsx: "collapsible > should allows users to open and close accordion item with enter / space key when collapsible")
- Given `multiple defaultValue={["one"]}` with the first trigger focused, when Enter is pressed and released, then it collapses; pressing Enter again re-expands it. (kobalte: packages/core/src/accordion/accordion.test.tsx: "multiple > should allows users to open and close accordion item with enter / space key when multiple")
- Given three triggers with the first focused, when ArrowUp is pressed, then focus wraps to the third trigger; ArrowDown from the third wraps to the first; ArrowDown then steps first to second to third; ArrowUp steps back. (kobalte: packages/core/src/accordion/accordion.test.tsx: "allows users to navigate accordion headers through arrow keys")
- Given `shouldFocusWrap={false}` with the first trigger focused, when ArrowUp is pressed, then focus STAYS on the first; ArrowDown past the last trigger stays on the last. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should not wrap focus when navigating accordion headers through arrow keys if 'shouldFocusWrap=false'")
- Given the first trigger focused, when End is pressed, then focus moves to the last trigger; Home returns it to the first. (kobalte: packages/core/src/accordion/accordion.test.tsx: "allows users to navigate to first/last accordion headers through 'Home/End' keys")
- Given `orientation` is `'vertical'` (the default), when `ArrowDown` is pressed on a trigger, then the event is prevented and focus moves to the next selectable trigger; `ArrowUp` moves to the previous one. (corvu-src: packages/solid-list/src/list.ts)
- Given `orientation` is `'horizontal'` and `textDirection` is `'ltr'`, when `ArrowRight` is pressed, then focus moves to the next trigger and `ArrowLeft` moves to the previous one. (corvu-src: packages/accordion/src/Root.tsx)
- Given `Home` is pressed on a trigger, when the list handles it, then the event is prevented and the first selectable trigger is focused; `End` focuses the last. (corvu-src: packages/solid-list/src/list.ts)
- Given `loop` is `true` (the default), when the last trigger is focused and the next key is pressed, then focus wraps to the first trigger; with `loop={false}` nothing happens. (corvu-src: packages/solid-list/src/list.ts)
- Given the accordion creates its list with `handleTab: false`, when `Tab` is pressed on a trigger, then the accordion does not intercept it and the browser's own focus order applies. (corvu-src: packages/accordion/src/Root.tsx)
- Given the active index changes for any reason, when `onActiveChange` fires, then the corresponding selectable trigger is focused programmatically. (corvu-src: packages/accordion/src/Root.tsx)
- Given a consumer supplies `onKeyDown` on a trigger, when it calls `preventDefault`, then the accordion's list navigation is skipped for that event. (corvu-src: packages/accordion/src/Trigger.tsx)
- Given `Enter` or `Space` is pressed on a trigger, when the browser synthesises a click on the native button, then the item toggles through the disclosure trigger's click handler rather than through any explicit key handling. (corvu-src: packages/accordion/src/Trigger.tsx)

### Pointer

- Given a fresh accordion, when the first trigger is clicked, then it expands with `aria-expanded="true"` and its content becomes visible. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should toggle between different accordion items when clicking a trigger")
- Given the first item expanded, when the SECOND trigger is clicked, then the first collapses to `aria-expanded="false"` and the second expands with its content visible. Single-select accordion replaces rather than adds. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should toggle between different accordion items when clicking a trigger")
- Given a default (neither `multiple` nor `collapsible`) accordion with the first item expanded, when the SAME trigger is clicked again, then it stays `aria-expanded="true"`, so the last open item cannot be closed. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should no toggle the same accordion item when clicking its trigger by default")
- Given `collapsible defaultValue={["one"]}`, when the expanded trigger is clicked, then it collapses to `aria-expanded="false"`; clicking again re-expands it. (kobalte: packages/core/src/accordion/accordion.test.tsx: "collapsible > should toggle the same accordion item when clicking its trigger if collapsible")
- Given `multiple`, when the first then the second trigger is clicked, then BOTH end up `aria-expanded="true"` with both contents visible. (kobalte: packages/core/src/accordion/accordion.test.tsx: "multiple > should expand multiple accordion items when clicking triggers")
- Given `multiple defaultValue={["one"]}`, when the expanded trigger is clicked, then it collapses; clicking again re-expands. So `multiple` implies collapsible behavior for its own items. (kobalte: packages/core/src/accordion/accordion.test.tsx: "multiple > should toggle the same accordion item when clicking its trigger if multiple")
- Given a controlled `value={["one"]}` accordion, when the second trigger is clicked, then `onChange` fires once with `["two"]` but the first item STAYS expanded and the second stays collapsed. (kobalte: packages/core/src/accordion/accordion.test.tsx: "can be controlled")
- Given a trigger is clicked, when the disclosure trigger's handler runs, then the disclosure's expanded state is toggled, which the item translates into `toggleValue` on the accordion. (corvu-src: packages/accordion/src/Item.tsx)
- Given an item is disabled, when its expanded state would change, then the item's `onExpandedChange` guard returns early and the accordion value is left untouched. (corvu-src: packages/accordion/src/Item.tsx)

### Focus management

- Given a trigger receives focus, when `onFocus` runs, then the consumer handler is called (its `preventDefault` is ignored here) and the list's active index is set to that trigger's position in the selectable list. (corvu-src: packages/accordion/src/Trigger.tsx)
- Given triggers are registered, when the selectable list is recomputed, then triggers carrying the `disabled` attribute are filtered out and the rest are sorted with `compareDocumentPosition` so keyboard order follows DOM order regardless of mount order. (corvu-src: packages/accordion/src/Root.tsx)
- Given a trigger's `disabled` attribute changes after mount, when a per-trigger `MutationObserver` with `attributeFilter: ['disabled']` fires, then the selectable list is rebuilt so keyboard navigation skips the newly disabled trigger. (corvu-src: packages/accordion/src/Root.tsx)

### State and controlled/uncontrolled

- Given an uncontrolled single-select accordion, when the first trigger is clicked, then `onChange` receives the ARRAY `["one"]`, so the change payload is always an array even in single-select mode. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should call 'onChange' when clicking a trigger")
- Given an uncontrolled single-select accordion with the first item open, when the same trigger is clicked again, then `onChange` has still only been called ONCE in total, so a no-op toggle emits no event. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should call 'onChange' when clicking a trigger")
- Given an uncontrolled single-select accordion, when the second trigger is then clicked, then `onChange` receives `["two"]` and has been called twice in total. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should call 'onChange' when clicking a trigger")
- Given `multiple`, when the first then the second trigger is clicked, then `onChange` receives `["one"]` and then `["one", "two"]`, accumulating in click order, for two calls total. (kobalte: packages/core/src/accordion/accordion.test.tsx: "multiple > should call 'onChange' when clicking triggers")
- Given the root's `mergeProps` defaults, when the accordion sets up, then `multiple` is `false`, `initialValue` is `null`, `collapsible` is `true`, `disabled` is `false`, `orientation` is `'vertical'`, `loop` is `true`, `textDirection` is `'ltr'`, `collapseBehavior` is `'remove'`, and `preventInitialContentAnimation` is `false`. (corvu-src: packages/accordion/src/Root.tsx)
- Given `value` is `null`, a single string, or an array, when the internal value is derived, then it is normalised to an array (`[]`, `[value]`, or the array itself). (corvu-src: packages/accordion/src/Root.tsx)
- Given `multiple` is `false` and the clicked item is already expanded, when it is toggled and `collapsible` is `true`, then the value becomes `null`; when `collapsible` is `false`, the toggle is a no-op. (corvu-src: packages/accordion/src/Root.tsx)
- Given `multiple` is `false` and a different item is clicked, when it is toggled, then the value becomes that item's value as a bare string, not an array. (corvu-src: packages/accordion/src/Root.tsx)
- Given `multiple` is `true`, when an expanded item is toggled, then it is filtered out of the array, except when it is the only expanded item and `collapsible` is `false`, in which case the toggle is a no-op. (corvu-src: packages/accordion/src/Root.tsx)
- Given `multiple` is `true`, when a collapsed item is toggled, then its value is appended to the end of the array, so the array order is click order rather than DOM order. (corvu-src: packages/accordion/src/Root.tsx)
- Given `<Accordion.Item>` has no `value` prop, when it resolves its value, then a `createUniqueId()` is generated inside a memo, so an uncontrolled item's identity is a generated id the consumer cannot predict. (corvu-src: packages/accordion/src/Item.tsx)
- Given `<Accordion.Item>` has a `disabled`, `collapseBehavior`, or `preventInitialContentAnimation` prop, when the item resolves each one, then the item-level prop wins and the root's value is the fallback. (corvu-src: packages/accordion/src/Item.tsx)
- Given `<Accordion.Root>` children are a function, when they resolve, then they receive `multiple`, `value`, `setValue`, `collapsible`, `disabled`, `orientation`, `loop`, `textDirection`, `collapseBehavior`, and `preventInitialContentAnimation`. (corvu-src: packages/accordion/src/Root.tsx)
- Given `<Accordion.Item>` children are a function, when they resolve, then they receive the disclosure children props merged with `value`, `disabled`, and `triggerId`. (corvu-src: packages/accordion/src/Item.tsx)
- Given no `<Accordion.Trigger>` is mounted in an item, when the content renders, then `triggerId()` is `undefined` and `aria-labelledby` is omitted from the `role="region"` element. (corvu-src: packages/accordion/src/Trigger.tsx)
- Given an accordion part is used outside its provider, when it reads context, then it throws either `[corvu]: Accordion context not found...` or `[corvu]: Accordion Item context not found. Make sure to wrap Accordion Item components in <Accordion.Item>`. (corvu-src: packages/accordion/src/itemContext.ts)

### Animation and presence

- Given `multiple` with two items expanded, when both contents are queried, then both are `toBeVisible()`, so expanding does not hide the other. (kobalte: packages/core/src/accordion/accordion.test.tsx: "multiple > should expand multiple accordion items when clicking triggers")
- Given a `disabled` collapsible, when the trigger is clicked, then the content is NOT in the document at all (`queryByText` returns null), so the closed state means unmounted rather than hidden. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should not open the content when clicking the trigger if disabled")
- Given each `<Accordion.Item>` wraps a full `<Disclosure>`, when an item expands or collapses, then it gets its own presence tracking, content size measurement, and `collapseBehavior` handling. (corvu-src: packages/accordion/src/Item.tsx)

### RTL and i18n

- Given `textDirection` is `'rtl'` and `orientation` is `'horizontal'`, when `ArrowLeft` is pressed, then it moves to the next trigger and `ArrowRight` moves to the previous one. (corvu-src: packages/accordion/src/Root.tsx)
- Given `textDirection` is passed as a prop rather than read from the document, when the accordion navigates, then it does not consult `dir` on any ancestor element or `getComputedStyle(...).direction`. (corvu-src: packages/accordion/src/Root.tsx)

### SSR and hydration

- Given `collapseBehavior` is `'hide'`, when an item is collapsed, then its content stays in the markup with `display: none`, which is the documented escape hatch for keeping collapsed content crawlable. (corvu-src: packages/disclosure/src/Content.tsx)

### Notes and edge cases

- THE ENTIRE ACCORDION SUITE IS SKIPPED ON CI. The top-level block is `describe.skipIf(process.env.GITHUB_ACTIONS)("Accordion", ...)`, so not one accordion test runs in CI. Combined with the toggle-group and tabs findings, the pattern is that every kobalte test depending on real focus movement is CI-disabled. If we build a conformance suite that has to pass in CI, jsdom focus behavior is the first thing to validate. (kobalte: packages/core/src/accordion/accordion.test.tsx: "renders properly")
- Three keyboard-navigation tests are `it.skip` each preceded by the comment `// TODO: use solid-list`: "allows users to navigate accordion headers through arrow keys", "should not wrap focus when navigating accordion headers through arrow keys if 'shouldFocusWrap=false'", and "allows users to navigate to first/last accordion headers through 'Home/End' keys". So arrow-key and Home/End navigation for the accordion is doubly disabled (skipped test inside a skipped suite), pending a migration to corvu's `solid-list` package. That is a direct signal that kobalte intends to adopt corvu's list-navigation primitive. (kobalte: packages/core/src/accordion/accordion.test.tsx: "allows users to navigate accordion headers through arrow keys")
- FIVE separate assertions across accordion and collapsible are commented out with `// TODO: fix solid-presence vitest`. Every one of them is the NEGATIVE presence assertion after a collapse: `expect(contentOne).not.toBeVisible()` or `expect(queryByText("Content one")).not.toBeInTheDocument()`. The positive (expand) direction is always asserted; the exit direction never is, in either file. `solid-presence` is a corvu package that kobalte depends on, so this is a known unsolved testing problem shared by both libraries: there is no reliable way in this setup to await an exit transition. Our Solid 2 suite must solve this deliberately, for example by making presence's exit deterministic when no transition is registered, or by exposing a promise or a settled signal to await. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should toggle between different accordion items when clicking a trigger")
- Clicks use `await userEvent.click(...)` with NO fake timers (unlike tabs and toggle-group), and awaiting the click is the flush. Keyboard tests use `fireEvent.keyDown` plus `fireEvent.keyUp` plus `await Promise.resolve()`. Two different flush strategies inside one file. (kobalte: packages/core/src/accordion/accordion.test.tsx: "should toggle between different accordion items when clicking a trigger")
- The test component uses Solid's `<For each={[...]}>` to generate items, so the accordion's item registration works through a keyed list rather than static children. Worth mirroring, since registration order under `<For>` is a real source of bugs in Solid collection components. (kobalte: packages/core/src/accordion/accordion.test.tsx: "renders properly")
- The test named "should no toggle the same accordion item when clicking its trigger by default" has a typo for "should not toggle". (kobalte: packages/core/src/accordion/accordion.test.tsx: "should no toggle the same accordion item when clicking its trigger by default")
- Space-key activation is named in two test titles ("enter / space key") but only Enter is ever fired; Space is never tested for the accordion. (kobalte: packages/core/src/accordion/accordion.test.tsx: "collapsible > should allows users to open and close accordion item with enter / space key when collapsible")
- Kobalte's accordion content sets `--kb-accordion-content-height` and `--kb-accordion-content-width` so the open and close can be animated from CSS, and no test asserts either. (kobalte: packages/core/src/accordion/accordion.test.tsx: "can have default expanded value")
- Ported from radix-ui `packages/react/accordion/src/Accordion.test.tsx`. Not carried across: any `data-expanded`/`data-closed` or `data-orientation` assertions (radix's accordion tests assert its `data-state` heavily and kobalte's assert none), the `dir="rtl"` arrow-key reversal tests, the `orientation="horizontal"` arrow-key mapping, and the "unmount on close" behavior. (kobalte: packages/core/src/accordion/accordion.test.tsx: "renders properly")
- Given the effect that installs the per-trigger `MutationObserver`, when it returns `observer.disconnect`, then Solid treats the return value as the previous-run value passed to the next execution rather than as a cleanup function, so no observer is ever disconnected and a new one is created for every trigger on every re-run; in a test file this accumulates observers for the whole run. (corvu-src: packages/accordion/src/Root.tsx)
- Given `<Accordion.Item>` merges a default `accordionId: createUniqueId()` that it never splits out or uses, when the item renders, then that prop is spread onto both the `Dynamic` wrapper and the inner `<Disclosure>`, so overriding `as` with a DOM element leaks an `accordionId` attribute into the markup. (corvu-src: packages/accordion/src/Item.tsx)
- Given `<Accordion.Item>` spreads `otherProps` onto both the `Dynamic` wrapper and the inner `<Disclosure>`, when a consumer passes an arbitrary prop, then it is delivered twice, once as an element attribute and once as a disclosure prop. (corvu-src: packages/accordion/src/Item.tsx)
- Given jsdom, when disclosure content size is measured with `offsetWidth` / `offsetHeight`, then both are always `0`, so `--corvu-disclosure-content-height` is `"0px"` and any height animation assertion is vacuous. (corvu-src: packages/disclosure/src/Root.tsx)
- Given jsdom, when presence decides whether a collapsing item animates, then `getComputedStyle(element).animationName` is the empty string rather than `none`, so the item enters the `hiding` state and the content is never removed without a synthetic `animationend`. (corvu-src: packages/solid-presence/src/presence.ts)
- Given jsdom, when the trigger `MutationObserver` fires for a `disabled` change, then the callback runs on the microtask queue, so a test must `await` a microtask before asserting that arrow keys skip the disabled trigger. (corvu-src: packages/accordion/src/Root.tsx)
- Given the accordion's active index is stored in `createList`'s own controllable signal without a `value` prop, when a test tries to drive the focused trigger from outside, then there is no controlled entry point and focus can only be moved by dispatching real focus and key events. (corvu-src: packages/solid-list/src/list.ts)
- Given Solid 2 portability, when `<Accordion.Item>` builds its providers, then it returns a `createMemo` as JSX, creates keyed contexts inside that memo, and calls `createUniqueId` inside memo bodies for both `value` and `triggerId`. (corvu-src: packages/accordion/src/Item.tsx)
- Given Solid 2 portability, when the item bridges to the disclosure, then it passes `expanded={expanded()}` as a fully controlled prop and translates `onExpandedChange` back into `toggleValue`, so the accordion owns state while the disclosure owns presentation. (corvu-src: packages/accordion/src/Item.tsx)
- Given a design decision worth copying, when the accordion needs keyboard navigation, then it composes the standalone `solid-list` primitive over a DOM-order-sorted list of registered triggers instead of hard-coding key handling in the component. (corvu-src: packages/accordion/src/Root.tsx)
- Given a design decision worth copying, when the accordion needs per-item expand behaviour, then it reuses the disclosure package verbatim and only adds value coordination, `role="region"`, and the trigger id wiring. (corvu-src: packages/accordion/src/Item.tsx)

## collapsible

### Pointer

- Given a closed collapsible, when the trigger is clicked, then the content becomes visible. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- Given a `disabled` collapsible, when the trigger is clicked, then the content never appears in the document. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should not open the content when clicking the trigger if disabled")

### State and controlled/uncontrolled

- Given `defaultOpen` (uncontrolled) with an `onOpenChange` handler, when the trigger is clicked, then `onOpenChange` is called with `false`. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should close content when clicking the trigger and collapsible is open uncontrolled")
- Given a fixed `open` prop (controlled), when the trigger is clicked, then `onOpenChange` is called with `false` but the content REMAINS visible, so the controlled prop wins. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should not close content when clicking the trigger and collapsible is open controlled")

### Notes and edge cases

- The collapsible suite is only four tests and has NO attribute assertions at all: nothing checks `aria-expanded`, `aria-controls`, `data-expanded`, `data-closed`, or the `--kb-collapsible-content-height` and `--kb-collapsible-content-width` CSS custom properties that kobalte's collapsible actually sets. The entire attribute and CSS-variable contract of the component is untested. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- Two negative presence assertions are commented out with `// TODO: fix solid-presence vitest`: `expect(content).not.toBeVisible()` in the toggle test and in the uncontrolled-close test. The toggle test's second half therefore asserts NOTHING after the closing click; it fires the event, flushes, and ends. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- `fireEvent.click` plus one `await Promise.resolve()` is the pattern here, in contrast to the accordion file's `await userEvent.click`. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- `installPointerEvent()` is installed but no pointer-event test uses it. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- Ported from radix-ui `packages/react/collapsible/src/Collapsible.test.tsx`. Radix's version asserts `data-state` on both trigger and content and checks the content is removed from the DOM when closed. Neither survived. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")

## disclosure

### Roles and attributes

- Given `<Disclosure.Trigger>` with no `as` prop, when it renders, then the element is a `button` carrying `data-corvu-disclosure-trigger=""`, `aria-controls` equal to `disclosureId`, `aria-expanded` of `"true"` or `"false"`, and `data-expanded` / `data-collapsed`. (corvu-src: packages/disclosure/src/Trigger.tsx)
- Given `<Disclosure.Content>` with no `as` prop, when it renders, then the element is a `div` carrying `data-corvu-disclosure-content=""`, `id` equal to `disclosureId`, and `data-expanded` / `data-collapsed`. (corvu-src: packages/disclosure/src/Content.tsx)
- Given `<Disclosure.Content>`, when it renders, then it sets `--corvu-disclosure-content-width` and `--corvu-disclosure-content-height` inline from the measured content size for width and height animations. (corvu-src: packages/disclosure/src/Content.tsx)
- Given `<Disclosure.Content>`, when it renders, then it sets no `role`, so the content region is a plain `div` unless the consumer supplies one. (corvu-src: packages/disclosure/src/Content.tsx)

### Keyboard

- Given a native `button` trigger, when `Enter` or `Space` is pressed, then the browser's synthetic click toggles the expanded state; the disclosure adds no key handlers of its own. (corvu-src: packages/disclosure/src/Trigger.tsx)

### Pointer

- Given `<Disclosure.Trigger>`, when it is clicked, then the consumer `onClick` runs first and, unless it called `preventDefault`, the expanded state is toggled. (corvu-src: packages/disclosure/src/Trigger.tsx)

### State and controlled/uncontrolled

- Given the root's `mergeProps` defaults, when the disclosure sets up, then `initialExpanded` is `false`, `collapseBehavior` is `'remove'`, `preventInitialContentAnimation` is `false`, and `disclosureId` is a `createUniqueId()`. (corvu-src: packages/disclosure/src/Root.tsx)
- Given an `expanded` prop that is not `undefined`, when the internal setter runs, then only `onExpandedChange` fires and the internal signal is untouched. (corvu-src: packages/disclosure/src/Root.tsx)
- Given `<Disclosure.Root>` children are a function, when they resolve, then they receive `expanded`, `setExpanded`, `collapseBehavior`, `preventInitialContentAnimation`, `disclosureId`, `contentPresent`, `contentRef`, and `contentSize` as a `[width, height]` tuple. (corvu-src: packages/disclosure/src/Root.tsx)
- Given a disclosure part is used outside `<Disclosure.Root>`, when it reads context, then it throws `[corvu]: Disclosure context not found. Make sure to wrap Disclosure components in <Disclosure.Root>`. (corvu-src: packages/disclosure/src/context.ts)

### Animation and presence

- Given `collapseBehavior` is `'remove'` (the default), when the disclosure is collapsed and no exit animation is pending, then the content element is not rendered at all. (corvu-src: packages/disclosure/src/Content.tsx)
- Given `collapseBehavior` is `'hide'`, when the disclosure is collapsed, then the content element stays mounted and receives inline `display: none`. (corvu-src: packages/disclosure/src/Content.tsx)
- Given the content ref or presence changes, when the size effect runs, then `animationName` is temporarily forced to `none`, `offsetWidth` and `offsetHeight` are read, the original animation name is restored, and `contentSize` is only updated when either dimension actually changed. (corvu-src: packages/disclosure/src/Root.tsx)
- Given `preventInitialContentAnimation` is `true` and the disclosure starts expanded, when the first effect run happens, then the content element's `animationName` is set to `none` and the original name is restored on the next run, suppressing the mount animation exactly once. (corvu-src: packages/disclosure/src/Root.tsx)
- Given `forceMount` is `true`, when the disclosure is collapsed, then the content stays mounted for third-party animation libraries. (corvu-src: packages/disclosure/src/Content.tsx)
- Given `onContentPresentChange`, when presence becomes `present` then `true` is reported and when it becomes `hidden` then `false` is reported, with the intermediate `hiding` state not surfaced. (corvu-src: packages/disclosure/src/Root.tsx)

### SSR and hydration

- Given `collapseBehavior` is `'hide'`, when the page is server-rendered, then collapsed content is present in the HTML so crawlers can read it, which is the documented reason the option exists. (corvu-src: packages/disclosure/src/Root.tsx)

### Notes and edge cases

- Given `contentSize` is still `null` on the first render, when `<Disclosure.Content>` writes its custom properties, then the template interpolation produces the literal strings `"undefinedpx"` for both `--corvu-disclosure-content-width` and `--corvu-disclosure-content-height`; any conformance test reading those properties before the measuring effect runs sees `"undefinedpx"`, not an empty value. (corvu-src: packages/disclosure/src/Content.tsx)
- Given jsdom, when the content size is measured, then `offsetWidth` and `offsetHeight` are hardcoded to `0`, so `contentSize` is `[0, 0]` and the size-changed guard means the signal is written once and then never again. (corvu-src: packages/disclosure/src/Root.tsx)
- Given jsdom, when `preventInitialContentAnimation` reads and restores `element.style.animationName`, then the value round-trips through inline style only, so the assertion that the initial animation was suppressed cannot distinguish suppression from jsdom simply having no animations. (corvu-src: packages/disclosure/src/Root.tsx)
- Given jsdom, when a collapse is expected to remove the content, then presence reads `getComputedStyle(element).animationName` as the empty string and holds the element in the `hiding` state, so `collapseBehavior: 'remove'` appears not to remove anything. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `initialOpen` inside the root is a plain `let` read once at setup, when `preventInitialContentAnimation` or `expanded` changes later, then that decision is not reactive and cannot be re-triggered. (corvu-src: packages/disclosure/src/Root.tsx)
- Given the keyed context cache, when a disclosure is created with a `contextId`, then the `disclosure-<id>` and `disclosure-internal-<id>` contexts are stored in the module-level `Map` shared by every corvu package and never evicted. (corvu-src: packages/disclosure/src/context.ts)
- Given Solid 2 portability, when `<Disclosure.Root>` returns its tree, then it returns a `createMemo` cast to `JSX.Element`, creates contexts inside that memo, and wraps the children in `untrack`. (corvu-src: packages/disclosure/src/Root.tsx)
- Given Solid 2 portability, when the size effect runs, then it uses `on([contentRef, contentPresent], ...)` with an inner `untrack` to read and write `contentSize` without creating a loop, a pattern that depends on Solid 1's `on` semantics. (corvu-src: packages/disclosure/src/Root.tsx)
- Given a design decision worth avoiding, when the content size is measured, then the DOM is mutated during an effect (setting and restoring `animationName`) to force a synchronous layout read, which is both a forced reflow and unobservable in a headless test. (corvu-src: packages/disclosure/src/Root.tsx)
- Given a design decision worth copying, when animation needs a target size, then the measured pixel size is exposed as CSS custom properties on the content element rather than as an inline `height`, leaving the animation entirely to CSS. (corvu-src: packages/disclosure/src/Content.tsx)

## dialog

Kobalte's dialog test file is two tests long, so almost everything here is corvu's
implementation. `(kobalte: ...)` bullets are asserted; `(corvu-src: ...)` bullets are
read from source and untested.

### Roles and attributes

- Given `Dialog.Root open` containing a `Dialog.Content` with a `Dialog.Title`, when rendered, then the content exposes `role="dialog"` and its `aria-labelledby` points at the title's id. (kobalte: packages/core/src/dialog/dialog.test.tsx: "should be labelled by its dialog title")
- Given `Dialog.Root open` with a `Dialog.Description`, when rendered, then the content's `aria-describedby` points at the description's id. (kobalte: packages/core/src/dialog/dialog.test.tsx: "should be described by its dialog description")
- Given a `<Dialog.Content>` with no `as` prop, when it renders, then the element is a `div` carrying `data-corvu-dialog-content=""`, `id` equal to the root's `dialogId`, `role` from the root's `role` prop, `tabIndex="-1"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, and one of `data-open` / `data-closed`. (corvu-src: packages/dialog/src/Content.tsx)
- Given the root `role` prop is left at its default, when `<Dialog.Content>` renders, then `role="dialog"`; passing `role="alertdialog"` on the root changes the content element's `role` to `alertdialog`. (corvu-src: packages/dialog/src/Root.tsx)
- Given the dialog is open, when `<Dialog.Content>` renders, then `data-open=""` is present and `data-closed` is absent; when closed but still present for an exit animation, `data-closed=""` is present and `data-open` is absent. (corvu-src: packages/dialog/src/Content.tsx)
- Given `modal` is `true` (the default), when `<Dialog.Content>` renders, then `aria-modal="true"`; with `modal={false}` it renders `aria-modal="false"` rather than omitting the attribute. (corvu-src: packages/dialog/src/Content.tsx)
- Given `dataIf` produces attribute values, when a state flag is true, then the attribute is set to the empty string, and when false the attribute is omitted entirely rather than set to `"false"`. (corvu-src: packages/utils/src/assertions.ts)
- Given a `<Dialog.Trigger>` with no `as` prop, when it renders, then the element is a `button` carrying `data-corvu-dialog-trigger=""`, `aria-controls` equal to `dialogId`, `aria-expanded` of `"true"` or `"false"`, `aria-haspopup="dialog"`, and `data-open` / `data-closed`. (corvu-src: packages/dialog/src/Trigger.tsx)
- Given a trigger rendered as a native `button`, when `DynamicButton` resolves the tag name from the ref, then it sets `type="button"` and omits `role`; rendered as any non-button element it omits `type` and sets `role="button"`. (corvu-src: packages/utils/src/dynamic/DynamicButton.tsx)
- Given a trigger rendered `as="input"` with a `type` of `button`, `color`, `file`, `image`, `reset`, or `submit`, when `isButton` evaluates it, then it is treated as a native button and no `role="button"` is added. (corvu-src: packages/utils/src/assertions.ts)
- Given a `<Dialog.Close>` with no `as` prop, when it renders, then the element is a `button` carrying `data-corvu-dialog-close=""` and `aria-label="close"` (lowercase, hardcoded, emitted before spread props so a user-supplied `aria-label` overrides it). (corvu-src: packages/dialog/src/Close.tsx)
- Given a `<Dialog.Overlay>` with no `as` prop, when it renders, then the element is a `div` carrying `data-corvu-dialog-overlay=""`, `aria-hidden="true"`, `data-open` / `data-closed`, and an inline `pointer-events: auto`. (corvu-src: packages/dialog/src/Overlay.tsx)
- Given a `<Dialog.Label>` with no `as` prop, when it renders, then the element is an `h2` carrying `data-corvu-dialog-label=""` and `id` equal to the registered `labelId`. (corvu-src: packages/dialog/src/Label.tsx)
- Given a `<Dialog.Description>` with no `as` prop, when it renders, then the element is a `p` carrying `data-corvu-dialog-description=""` and `id` equal to the registered `descriptionId`. (corvu-src: packages/dialog/src/Description.tsx)
- Given `<Dialog.Portal>`, when it renders, then it emits Solid's `Portal` with no wrapper attributes of its own, so no `data-corvu-*` attribute marks the portal node. (corvu-src: packages/dialog/src/Portal.tsx)
- Given no `<Dialog.Label>` is mounted, when `<Dialog.Content>` renders, then `labelId()` is `undefined` and the `aria-labelledby` attribute is omitted; mounting a label registers the id and adds the attribute. (corvu-src: packages/utils/src/create/register.ts)
- Given no `<Dialog.Description>` is mounted, when `<Dialog.Content>` renders, then `descriptionId()` is `undefined` and `aria-describedby` is omitted. (corvu-src: packages/dialog/src/Description.tsx)
- Given a `<Dialog.Label>` unmounts while the dialog stays open, when its cleanup runs, then `unregisterLabelId` fires and `aria-labelledby` disappears from the content element. (corvu-src: packages/dialog/src/Label.tsx)

### Keyboard

- Given `closeOnEscapeKeyDown` is `true` (the default) and the dialog is the last dismissible layer, when `Escape` is pressed anywhere in the document, then `onEscapeKeyDown` fires and, unless it called `preventDefault`, the open state is set to `false`. (corvu-src: packages/dialog/src/Root.tsx)
- Given the escape listener, when it is installed, then it is a non-capturing `keydown` listener on `document` and it matches `event.key === 'Escape'` exactly. (corvu-src: packages/solid-dismissible/src/create/escapeKeyDown.ts)
- Given `trapFocus` is `true` and the content contains focusable elements, when `Tab` is pressed on the last focusable element, then the event is prevented and focus moves to the first focusable element. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `trapFocus` is `true`, when `Shift+Tab` is pressed on the first focusable element, then the event is prevented and focus moves to the last focusable element. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given the trapped content contains zero focusable elements, when any `Tab` is pressed anywhere in the document, then a document-level `keydown` listener prevents it outright so focus cannot leave. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given the focus trap collects focusable elements, when it builds the tab order, then it queries `a[href]`, `button`, `input`, `textarea`, `select`, `details`, and `[tabindex]`, excludes anything with `tabindex="-1"`, and sorts by `tabIndex` then document order. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)

### Pointer

- Given a `<Dialog.Trigger>`, when it is clicked, then the user `onClick` runs first and, unless it called `preventDefault`, the open state is toggled. (corvu-src: packages/dialog/src/Trigger.tsx)
- Given a `<Dialog.Close>`, when it is clicked, then the user `onClick` runs first and, unless it called `preventDefault`, the open state is set to `false`. (corvu-src: packages/dialog/src/Close.tsx)
- Given `closeOnOutsidePointer` resolves to `true` (default when `modal` is `true`), when a pointer event fires outside the content, then `onOutsidePointer` fires and, unless prevented, the dialog dismisses with reason `outsidePointer`. (corvu-src: packages/dialog/src/Root.tsx)
- Given `closeOnOutsidePointerStrategy` is `'pointerup'` (the default), when the outside listener is installed, then it listens for `pointerup`; setting the prop to `'pointerdown'` swaps the listened event. (corvu-src: packages/solid-dismissible/src/create/outsidePointer.ts)
- Given an outside pointer event with `button === 2`, or `button === 0` together with `ctrlKey`, when it is handled, then it is treated as a right click and the dialog does not dismiss. (corvu-src: packages/solid-dismissible/src/create/dismissible.ts)
- Given `<Dialog.Content>` passes the trigger element as `outsidePointerIgnore`, when the pointer event originates inside the trigger, then no outside-pointer dismissal fires so clicking the trigger to close does not double-toggle. (corvu-src: packages/dialog/src/Content.tsx)
- Given `noOutsidePointerEvents` resolves to `true` (default when `modal` is `true`), when the dialog is enabled, then `pointer-events: none` is applied to `document.body` under the shared style key `no-pointer-events` and reverted once the last consumer cleans up. (corvu-src: packages/solid-dismissible/src/create/noPointerEvents.ts)
- Given several nested dismissibles, when `<Dialog.Content>` is not the last layer, then its inline `pointer-events` is left `undefined` and only the last layer receives `pointer-events: auto`. (corvu-src: packages/dialog/src/Content.tsx)
- Given the overlay is rendered, when it mounts, then it always carries inline `pointer-events: auto` regardless of layer position, so it stays clickable while the body is pointer-events-none. (corvu-src: packages/dialog/src/Overlay.tsx)
- Given `contains` is used to decide whether an event target is inside the content, when the target sits inside a Solid portal, then the walk follows the portal's `_$host` property up the owner tree instead of the DOM parent chain. (corvu-src: packages/utils/src/dom/lib.ts)

### Focus management

- Given `trapFocus` is `true` (the default), when the dialog opens, then the previously focused element is stored and, after two animation frames, focus moves to `initialFocusEl`, else the first focusable element, else the content element itself. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `onInitialFocus` is provided, when initial focus is about to be applied, then a cancelable `focusTrap.initialFocus` CustomEvent is dispatched on the content and calling `preventDefault` skips the focus call entirely. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `restoreFocus` is `true` (the default), when the trap is torn down, then after two animation frames focus returns to `finalFocusEl` if given, otherwise to the element that was focused before the dialog opened. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `onFinalFocus` is provided, when focus restoration is about to run, then a cancelable `focusTrap.finalFocus` CustomEvent is dispatched on the content and `preventDefault` cancels the restore. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `restoreFocus` is `false`, when the dialog closes, then no element is focused and `document.activeElement` is left wherever the browser put it. (corvu-src: packages/dialog/src/Root.tsx)
- Given the trap is active with `observeChanges` defaulting to `true`, when children are added or a descendant's `tabindex` changes, then a `MutationObserver` reloads the focusable list after two animation frames and re-applies initial focus if `document.activeElement` is `null` or `body`. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `closeOnOutsideFocus` resolves to `true` (default when `trapFocus` is `true`), when a `focusin` lands outside the content, then a cancelable `dismissible.outsideFocus` CustomEvent is dispatched on the content and, unless prevented, the dialog dismisses with reason `outsideFocus`. (corvu-src: packages/solid-dismissible/src/create/outsideFocus.ts)
- Given outside-focus dismissal is active and either `noOutsidePointerEvents` or `dismissOnOutsidePointer` is on, when a `focusin` immediately follows a `pointerdown`, then the focus event is swallowed once so a click is not reported as both an outside pointer and an outside focus. (corvu-src: packages/solid-dismissible/src/create/outsideFocus.ts)

### State and controlled/uncontrolled

- Given no `open` prop, when the dialog mounts, then it is uncontrolled starting at `initialOpen`, which defaults to `false`. (corvu-src: packages/dialog/src/Root.tsx)
- Given an `open` prop whose value is not `undefined`, when the internal setter runs, then the internal signal is not updated and only `onOpenChange` fires, so the consumer owns the state. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given `open={undefined}` is passed explicitly, when control is determined, then the dialog silently falls back to uncontrolled because "controlled" is detected as `value() !== undefined`. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the new value is `Object.is`-equal to the current value, when the setter runs, then neither the internal signal nor `onOpenChange` fires. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the setter is called with a function, when it resolves, then the function receives the current value and the whole update runs inside `untrack`. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given `<Dialog.Root>` children are a function, when they are resolved, then they receive a props object exposing `role`, `open`, `setOpen`, `modal`, all close/scroll/focus flags, `contentPresent`, `contentRef`, `overlayPresent`, `overlayRef`, `dialogId`, `labelId`, and `descriptionId`. (corvu-src: packages/dialog/src/Root.tsx)
- Given children are a function declared with zero parameters, when `isFunction` tests it, then it fails the `length > 0` check and the function is rendered as a value instead of being called with the children props. (corvu-src: packages/utils/src/assertions.ts)
- Given `dialogId` is not supplied, when the root sets up, then it defaults to a single `createUniqueId()` evaluated once in `mergeProps`. (corvu-src: packages/dialog/src/Root.tsx)
- Given `labelId` or `descriptionId` is not supplied, when the register memo runs, then the fallback `createUniqueId()` is called inside the memo body, so the id can change if that memo re-evaluates. (corvu-src: packages/dialog/src/Root.tsx)
- Given a `contextId` prop, when the root sets up, then it publishes into keyed contexts named `dialog-<contextId>` and `dialog-internal-<contextId>` and every part accepts the same `contextId` to opt into an ancestor's dialog. (corvu-src: packages/dialog/src/context.ts)
- Given a dialog part is rendered outside any `<Dialog.Root>`, when it reads the context, then it throws `[corvu]: Dialog context not found. Make sure to wrap Dialog components in <Dialog.Root>`. (corvu-src: packages/dialog/src/context.ts)
- Given a part is given a `contextId` with no matching provider, when it reads the keyed context, then it throws an error naming the missing id. (corvu-src: packages/dialog/src/context.ts)

### Dismissal and layering

- Given the outermost `<Dialog.Content>`, when it mounts, then `Dismissible` creates the layer context seeded with its own `dismissibleId`, and nested dismissibles append to that same layer list. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given a layer becomes enabled, when the effect runs, then its id is pushed onto both the local layer list and a module-level `activeDismissibles` signal, and removed again on disable or cleanup. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given several open dialogs, when `Escape` is pressed, then only the layer whose id is last in the layer list dismisses, because escape, outside-focus, and outside-pointer handling are each gated on `isLastLayer()`. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given `<Dialog.Content>` wires the dismissible, when it computes `enabled`, then dismissal stays active while `open() || contentPresent()`, so a closing dialog still owns its layer until its exit animation finishes. (corvu-src: packages/dialog/src/Content.tsx)
- Given `dismissibleId`, when `<Dialog.Content>` creates the layer, then it reuses the dialog's `dialogId` as the layer id rather than a fresh unique id. (corvu-src: packages/dialog/src/Content.tsx)
- Given `preventScroll` resolves to `true` (default when `modal` is `true`), when the content becomes present, then `overflow: hidden` is applied to `document.documentElement` under the shared style key `prevent-scroll`. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `preventScrollbarShift` is `true` (the default) and the scrollbar has width, when scroll is locked, then `padding-right` (or `margin-right` when `preventScrollbarShiftMode` is `'margin'`) is set to `calc(<original> + <scrollbarWidth>px)` and the custom property `--scrollbar-width` is set on the document element. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `restoreScrollPosition` is `true` (the default) and the scrollbar had width, when the lock is released, then `window.scrollTo` restores the scroll offsets captured when the lock was applied. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `allowPinchZoom`, when the dialog passes it through, then the dialog defaults it to `true` even though `solid-prevent-scroll`'s own default is `false`, so two-finger touchmove is not cancelled. (corvu-src: packages/dialog/src/Root.tsx)
- Given scroll is locked and a wheel event fires, when the target sits inside the content and the delta would actually scroll something, then the event is allowed; otherwise `preventDefault` is called on the non-passive listener. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a touchmove on an `input[type=range]`, when scroll locking evaluates it, then it is explicitly allowed through. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)

### Animation and presence

- Given `createPresence` tracks the content, when `open` flips to `false` and the element has a resolved animation name other than `none` and is not `display: none`, then the state becomes `hiding`, `present` stays `true`, and the element is removed only after `animationend` or `animationcancel`. (corvu-src: packages/solid-presence/src/presence.ts)
- Given the content has no CSS animation, when `open` flips to `false`, then the state goes straight to `hidden` and the element unmounts in the same tick. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `onContentPresentChange` or `onOverlayPresentChange`, when the presence state becomes `present` then `true` is reported, when it becomes `hidden` then `false` is reported, and the intermediate `hiding` state is not reported at all. (corvu-src: packages/dialog/src/Root.tsx)
- Given `forceMount` is `false` (the default), when the dialog is closed and no exit animation is pending, then `<Dialog.Content>` renders nothing; `forceMount` keeps it mounted for third-party animation libraries. (corvu-src: packages/dialog/src/Content.tsx)
- Given `<Dialog.Portal>`, when it decides to render, then it mounts while any of `open`, `forceMount`, `contentPresent`, or `overlayPresent` is true, so the portal outlives whichever of content and overlay animates longest. (corvu-src: packages/dialog/src/Portal.tsx)
- Given the overlay and the content animate at different durations, when the dialog closes, then each has its own presence instance, so `data-closed` appears on both at once but they unmount independently. (corvu-src: packages/dialog/src/Root.tsx)
- Given an `animationstart` fires on the tracked element, when the handler runs, then the recorded animation name is refreshed from `getComputedStyle`, and `animationend` only completes the hide when the ended animation name is contained in the current computed animation name. (corvu-src: packages/solid-presence/src/presence.ts)

### SSR and hydration

- Given the dialog renders on the server, when `<Dialog.Portal>` is reached, then it only renders when open or present, so a closed dialog emits no portal markup and hydration has nothing to match. (corvu-src: packages/dialog/src/Portal.tsx)
- Given ids are generated with `createUniqueId`, when the same tree renders on server and client, then `dialogId`, `labelId`, and `descriptionId` must line up for `aria-labelledby` and `aria-controls` to stay stable across hydration. (corvu-src: packages/dialog/src/Root.tsx)

### Accessibility tooling

- Given `<Dialog.Trigger>` always emits `aria-controls={dialogId}`, when the dialog is closed and the content is unmounted, then the attribute points at an element id that does not exist in the document. (corvu-src: packages/dialog/src/Trigger.tsx)
- Given `<Dialog.Label>` and `<Dialog.Description>` exist solely to register ids, when neither is rendered, then the content element has an accessible role but no accessible name or description. (corvu-src: packages/dialog/src/Content.tsx)
- Given the overlay is `aria-hidden="true"`, when assistive tech walks the tree, then the overlay and its children are excluded even though the overlay is pointer-interactive. (corvu-src: packages/dialog/src/Overlay.tsx)

### Notes and edge cases

- The dialog test file is TWO tests and 45 lines. Nothing tests the trigger, opening, closing, Escape dismissal, click-outside dismissal, focus trapping, initial focus, focus restore on close, scroll locking, the overlay, portalling, `aria-modal`, `data-expanded`/`data-closed`, the presence of `aria-hidden` on outside content, or the controlled/uncontrolled `open` API. Every single defining behavior of a modal dialog is untested. Given that dialog is the base for alert-dialog, drawer and popover in practice, this is the biggest coverage hole in kobalte, and our conformance suite has no upstream reference to mine here. (kobalte: packages/core/src/dialog/dialog.test.tsx: "should be labelled by its dialog title")
- Both tests render with `open` as a static prop so the dialog is open on first paint, which is why neither needs a flush or a `waitFor`. No fake timers, no `installPointerEvent()`. (kobalte: packages/core/src/dialog/dialog.test.tsx: "should be labelled by its dialog title")
- Ported (nominally) from react-spectrum `@react-spectrum/dialog/test/Dialog.test.js`. Effectively everything was dropped: React Spectrum's file covers dismiss buttons, Escape, `onDismiss` callbacks, focus containment and restoration, and dialog-within-dialog stacking. Only the two labelling assertions survived. (kobalte: packages/core/src/dialog/dialog.test.tsx: "should be labelled by its dialog title")
- Given jsdom, when `createPresence` reads `getComputedStyle(element).animationName`, then jsdom returns the empty string rather than `none`, so the code concludes an animation is running, moves to `hiding`, and `present` stays `true`; an assertion that the content is removed from the DOM after setting `open` to `false` never passes unless the test dispatches a synthetic `animationend` or stubs `getComputedStyle`. (corvu-src: packages/solid-presence/src/presence.ts)
- Given jsdom, when the focus trap applies initial focus or restores final focus through `afterPaint`, then the work is deferred by two nested `requestAnimationFrame` callbacks, so any `expect(document.activeElement)` assertion must await two frames and fake timers silently break it unless `requestAnimationFrame` is shimmed onto the timer queue. (corvu-src: packages/utils/src/dom/lib.ts)
- Given jsdom, when the `MutationObserver` inside the focus trap fires, then its callback itself calls `afterPaint`, so a newly added focusable element is not in the tab order until two frames after the microtask that delivered the mutation records. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given jsdom, when scroll locking computes `window.innerWidth - documentElement.clientWidth`, then both are constant and the difference is `0`, so the `--scrollbar-width` property and the `padding-right` compensation are never applied and cannot be asserted. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given jsdom, when `isScrollContainer` reads `getComputedStyle(element).overflowY`, then the value is the empty string unless set inline, so no ancestor is ever treated as a scroll container, `availableScroll` stays `0`, and every wheel event inside the content is cancelled. (corvu-src: packages/utils/src/scroll/lib.ts)
- Given jsdom, when the touch branch of scroll locking is exercised, then a real `TouchEvent` with populated `touches` and `changedTouches` has to be constructed by hand because jsdom provides no `TouchEvent` constructor, and the pinch-zoom path additionally needs `touches.length === 2`. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given the shared style helper, when several dialogs lock the same key, then `activeStyles` is a module-level `Map` holding a refcount and the original inline styles, so a test that unmounts without running Solid cleanup leaves `document.body` with `pointer-events: none` and `documentElement` with `overflow: hidden` for every later test. (corvu-src: packages/utils/src/create/style.ts)
- Given `activeDismissibles` is a module-level signal, when a test leaks a mounted dismissible, then its id stays in that list for the whole test file. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given `preventScrollStack` is a module-level signal, when a dialog is not cleaned up, then its id stays at the top of the stack and a later dialog's `isActive` check fails so wheel and touch listeners are never installed. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `createKeyedContext` caches contexts in a module-level `Map` keyed by string, when two tests both render `<Dialog.Root contextId="x">`, then the second test reuses the `Context` object created by the first and the cache is never cleared. (corvu-src: packages/utils/src/create/keyedContext.ts)
- Given Solid 2 portability, when `<Dialog.Root>` returns its provider tree, then it returns a `createMemo` cast to `JSX.Element` and wraps the resolved children in `untrack`, and it calls `createContext` inside that memo body; all three patterns depend on Solid 1 rendering a memo as JSX and tolerating context creation inside a reactive computation. (corvu-src: packages/dialog/src/Root.tsx)
- Given Solid 2 portability, when `createOnce` memoizes the children accessor, then it creates the memo lazily on first call from inside another computation and caches it in a closure variable, so re-entrancy and owner attachment both matter. (corvu-src: packages/utils/src/create/once.ts)
- Given Solid 2 portability, when `Dynamic` receives a function component, then it invokes the component manually inside `untrack` instead of delegating to Solid's own `Dynamic`, bypassing the framework's component boundary. (corvu-src: packages/utils/src/dynamic/Dynamic.tsx)
- Given Solid 2 portability, when `mergeProps` supplies accessor-valued defaults such as `closeOnOutsideFocus: () => props.trapFocus ?? true`, then the same prop is a boolean when the consumer sets it and a function when defaulted, and every read site has to route through `access()`. (corvu-src: packages/dialog/src/Root.tsx)
- Given a design decision worth copying, when every part is authored, then its props are split into `CorvuProps`, `SharedElementProps`, and `ElementProps`, giving a typed contract for which attributes a consumer may override and which are merged. (corvu-src: packages/dialog/src/Content.tsx)
- Given a design decision worth copying, when a child component wants to erase an inherited marker attribute, then it passes `data-corvu-dialog-content={null}`, relying on Solid removing attributes for `null`. (corvu-src: packages/popover/src/Content.tsx)
- Given a design decision worth avoiding, when `combineStyle` parses a string style prop, then it drives a module-level `/g` regex with `exec` in a loop, so the shared `lastIndex` is only reset by the loop running to completion. (corvu-src: packages/utils/src/dom/lib.ts)

## alert-dialog

### Roles and attributes

- Given `AlertDialog.Root open` with an `AlertDialog.Title`, when rendered, then the content exposes `role="alertdialog"` (not `dialog`) and its `aria-labelledby` points at the title's id. (kobalte: packages/core/src/alert-dialog/alert-dialog.test.tsx: "should be labelled by its alert dialog title")
- Given `AlertDialog.Root open` with an `AlertDialog.Description`, when rendered, then the content's `aria-describedby` points at the description's id. (kobalte: packages/core/src/alert-dialog/alert-dialog.test.tsx: "should be described by its alert dialog description")

### Notes and edge cases

- The alert-dialog file is a two-test copy of the dialog file with the role changed. Nothing tests that an alert dialog is non-dismissable by outside click (the behavior that distinguishes it from a plain dialog), nothing tests that Escape is or is not honoured, and nothing tests initial focus landing on a cancel action. (kobalte: packages/core/src/alert-dialog/alert-dialog.test.tsx: "should be labelled by its alert dialog title")

## alert

### Roles and attributes

- Given an `Alert.Root`, when rendered, then it exposes `role="alert"`. (kobalte: packages/core/src/alert/alert.test.tsx: "should have attribute 'role=alert'")

### Notes and edge cases

- The alert file is one test, 13 lines, the smallest in the repo. Nothing tests `aria-live`, `aria-atomic`, or that dynamically inserted alert text is announced. (kobalte: packages/core/src/alert/alert.test.tsx: "should have attribute 'role=alert'")

## badge

### Roles and attributes

- Given `Badge.Root textValue="Online"` with the text "Online", when rendered, then it exposes `role="status"` and its text content is "Online". (kobalte: packages/core/src/badge/badge.test.tsx: "badge with textValue")
- Given `Badge.Root textValue="Online"` and no `aria-label`, when rendered, then `aria-label` is set to the `textValue`, so `textValue` is the fallback accessible name. (kobalte: packages/core/src/badge/badge.test.tsx: "badge with default aria-label as textValue")
- Given `Badge.Root textValue="Online" aria-label="User is online"`, when rendered, then the author's `aria-label` wins over the derived one. (kobalte: packages/core/src/badge/badge.test.tsx: "badge with defined aria-label")

## drawer

Corvu has no tests, so every bullet here is read from the IMPLEMENTATION and tagged
`(corvu-src: ...)`. These are behaviors to write conformance tests FOR, not behaviors
corvu verifies. Drawer is the component with no counterpart anywhere in kobalte, so it
is documented in full.

### Roles and attributes

- Given a `Drawer.Content`, when rendered, then it carries `data-corvu-drawer-content=""` and its inherited `data-corvu-dialog-content` is explicitly set to `null` so the dialog marker is REMOVED. Each wrapper component swaps the base marker for its own, so a stylesheet can target the drawer without also matching plain dialogs. (corvu-src: packages/drawer/src/Content.tsx)
- Given a `Drawer.Content`, when rendered, then it carries `data-side` with the resolved side (`"top"`, `"bottom"`, `"left"` or `"right"`, defaulting to `"bottom"`). (corvu-src: packages/drawer/src/Content.tsx)
- Given a drawer in its open transition, when the content is inspected, then `data-opening` is present as an empty string. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drawer in its close transition, when inspected, then `data-closing` is present. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drawer settling to a snap point after the user releases a drag, when inspected, then `data-snapping` is present. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drawer in ANY transition (opening, closing, snapping or resizing), when inspected, then `data-transitioning` is present, so one attribute covers the union and three others discriminate the cause. (corvu-src: packages/drawer/src/Content.tsx)
- Given `transitionResize` and a content size change, when inspected, then `data-resizing` is present; without `transitionResize` it never appears. (corvu-src: packages/drawer/src/Content.tsx)
- Given the drawer's open state, when the content is inspected, then `data-open` or `data-closed` is present, inherited from `Dialog.Content`. (corvu-src: packages/drawer/src/Content.tsx)
- Given a `Drawer.Overlay`, when rendered, then it carries `data-corvu-drawer-overlay=""` (with `data-corvu-dialog-overlay` nulled) plus the SAME `data-side`, `data-opening`, `data-closing`, `data-snapping`, `data-transitioning` and `data-resizing` set as the content, so the backdrop can be animated in lockstep from CSS alone. (corvu-src: packages/drawer/src/Overlay.tsx)
- Given a `Drawer.Trigger`, when rendered, then it carries `data-corvu-drawer-trigger=""` plus `data-open`/`data-closed`. (corvu-src: packages/drawer/src/Trigger.tsx)
- Given a `Drawer.Close`, when rendered, then it carries `data-corvu-drawer-close=""`. (corvu-src: packages/drawer/src/Close.tsx)
- Given a `Drawer.Label`, when rendered, then it carries `data-corvu-drawer-label=""`. (corvu-src: packages/drawer/src/Label.tsx)
- Given a `Drawer.Description`, when rendered, then it carries `data-corvu-drawer-description=""`. (corvu-src: packages/drawer/src/Description.tsx)
- Given a `Drawer.Content` with any translate value, when inspected, then its inline `transform` is a `translate3d` whose axis and sign are chosen by side: `top` gives `translate3d(0, -T, 0)`, `bottom` gives `translate3d(0, T, 0)`, `right` gives `translate3d(T, 0, 0)` and `left` gives `translate3d(-T, 0, 0)`. The stored `translate` value is always POSITIVE regardless of side, and only the transform expression differs. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drawer being actively dragged, when the content's inline style is inspected, then `transition-duration` is forced to `0ms`, so the element follows the finger with no easing; when the drag ends, the override is removed and the author's CSS transition takes over for the snap. (corvu-src: packages/drawer/src/Content.tsx)
- Given `transitionResize` on a `top` or `bottom` drawer, when the size changes, then an inline `height` of the transition size in pixels is applied and `width` is left alone; for `left` or `right` it is `width` that is pinned. A percentage height cannot be transitioned, so the measured pixel value is written for the duration of the change. (corvu-src: packages/drawer/src/Content.tsx)

### Pointer

- Given a `Drawer.Content`, when `pointerdown` fires with `event.button !== 0`, then the drag is ignored, so only the primary button starts a drag. (corvu-src: packages/drawer/src/Content.tsx)
- Given a pointerdown whose target or any ancestor up to the content root has the `data-corvu-no-drag` attribute, when it fires, then no drag starts. This is the opt-out authors put on a slider or a carousel inside the drawer. (corvu-src: packages/drawer/src/lib.ts)
- Given a pointerdown on an `<input type="range">`, when it fires, then no drag starts, because dragging the thumb must not drag the drawer. (corvu-src: packages/drawer/src/lib.ts)
- Given a MOUSE pointerdown on a `<select>` element, when it fires, then no drag starts; the same pointerdown from a touch pointer DOES allow a drag, because a native mobile select opens a picker overlay rather than dragging. (corvu-src: packages/drawer/src/lib.ts)
- Given the drawer is in its `closing` transition, when pointerdown fires, then no drag starts, so a closing drawer cannot be grabbed back. (corvu-src: packages/drawer/src/Content.tsx)
- Given a pointer is down and `pointermove` fires, when the movement along the drag axis is less than 0.3 pixels, then no drag begins, giving a small dead zone before a tap becomes a drag. (corvu-src: packages/drawer/src/Content.tsx)
- Given a pointer is down and there is a non-empty text selection in the window, when `pointermove` fires, then the gesture is cancelled via the release path rather than dragging, so selecting text inside the drawer does not move it. (corvu-src: packages/drawer/src/Content.tsx)
- Given `handleScrollableElements` (the default) and a pointermove, when the dominant axis of the movement is determined by comparing `|deltaX|` to `|deltaY|`, then the drag is evaluated on that axis only. (corvu-src: packages/drawer/src/Content.tsx)
- Given a pointermove starting inside a scrollable descendant, when there is remaining scroll available in the direction of travel (positive delta with more than 1 pixel of scroll remaining, or negative delta with any scroll offset above zero), then the gesture is released to the scroller and the drawer does not drag. The asymmetric thresholds are deliberate: the comment records that on Firefox the available scroll reads as 1 even when nothing can scroll. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drag has begun, when the pointer moves, then the delta is computed per side (`bottom` uses `startY - y`, `top` uses `-(startY - y)`, `right` uses `startX - x`, `left` uses `-(startX - x)`) and the active snap point's offset is subtracted, so dragging is always measured relative to the current snap point rather than the closed position. (corvu-src: packages/drawer/src/Content.tsx)
- Given the user drags PAST the furthest snap point so the delta goes positive, when the translate is computed, then the delta is passed through `dampFunction`, whose default is `6 * Math.log(distance + 1)`. Overscroll is therefore logarithmically damped rather than clamped, giving rubber-band resistance. (corvu-src: packages/drawer/src/Root.tsx)
- Given a drag in progress, when more than `velocityCacheReset` milliseconds (default 200) have passed since the last cache write, then the cached timestamp and translate are reset, so the release velocity reflects only the most recent motion and a long slow drag ending with a flick still registers the flick. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drag is released, when `pointerup` fires with `pointerType !== "touch"`, then the release handler runs; for touch the release is driven by `touchend` and only once `event.touches.length === 0`, so a multi-touch gesture does not release early. (corvu-src: packages/drawer/src/Content.tsx)
- Given a drag in progress, when a `contextmenu` event fires anywhere, then the drag is released, so a long-press context menu does not leave the drawer stuck to the pointer. (corvu-src: packages/drawer/src/Content.tsx)
- Given a `touchstart` with more than one touch, when it fires, then the handler returns early and leaves the drag start position unset; a single-touch `touchstart` RESETS the drag start position to null so the next move recomputes it. (corvu-src: packages/drawer/src/Content.tsx)
- Given the drawer is being dragged, when the dialog's outside-pointer dismissal is evaluated, then `closeOnOutsidePointer` is forced false for the duration of the drag, so a drag that wanders outside the content does not dismiss the drawer. (corvu-src: packages/drawer/src/Root.tsx)

### State and controlled/uncontrolled

- Given `snapPoints` defaulting to `[0, 1]`, when the drawer is used without configuration, then it has exactly two states, fully closed and fully open. (corvu-src: packages/drawer/src/Root.tsx)
- Given a snap point expressed as a NUMBER, when resolved against a drawer size, then the offset is `drawerSize - point * drawerSize`, so `1` means fully open (offset 0) and `0` means fully closed (offset equal to the size). Numbers are fractions of the drawer's own size, not of the viewport. (corvu-src: packages/drawer/src/lib.ts)
- Given a snap point expressed as a STRING, when resolved, then it must end in `px` and the offset is `drawerSize - parseInt(point)`; any other string throws `[corvu] Snap and break points must be a number or a string ending with 'px'. Got <value>`. So percentages-as-strings and `rem`, `vh` or `%` units are all rejected at runtime. (corvu-src: packages/drawer/src/lib.ts)
- Given `defaultSnapPoint` (default `1`), when the drawer opens, then the active snap point is set to it after the next paint, so opening animates from the closed offset to the default snap point rather than appearing there. (corvu-src: packages/drawer/src/Root.tsx)
- Given `activeSnapPoint` and `onActiveSnapPointChange`, when provided, then the active snap point is a fully controllable signal, and `setActiveSnapPoint` is exposed on both the context and the children callback so a drawer can be snapped programmatically. (corvu-src: packages/drawer/src/Root.tsx)
- Given a released drag, when the closest snap point is computed, then the nearest snap point ABOVE and the nearest BELOW the current offset are found, and if neither has a custom break point the one with the smaller absolute distance to the velocity-adjusted offset wins. (corvu-src: packages/drawer/src/lib.ts)
- Given `breakPoints` overriding the midpoint between two snap points, when a drag is released, then the decision becomes a simple comparison against that break point rather than a nearest-distance test, so an author can make a drawer biased toward opening or closing. `breakPoints` must be `snapPoints.length - 1` long and accepts `null` entries to keep the default midpoint for individual gaps. (corvu-src: packages/drawer/src/lib.ts)
- Given `allowSkippingSnapPoints` (default true), when a drag is released, then the search for nearby snap points uses the VELOCITY-ADJUSTED offset, letting a fast flick jump past intermediate snap points; with it false the search uses the raw offset so a flick can only ever move one snap point. (corvu-src: packages/drawer/src/lib.ts)
- Given a release, when `velocityFunction` runs with the distance travelled since the cache reset and the elapsed milliseconds, then the default returns `distance / time`, except that any velocity strictly between -1 and 1 is coerced to exactly `1` so a slow drag is treated as having no momentum. Returning a constant `1` from a custom function disables velocity entirely. (corvu-src: packages/drawer/src/Root.tsx)
- Given the chosen snap point after a release has an offset equal to the full drawer size, when the release completes, then the dialog's open state is set to false rather than the translate being written, so snapping to the closed position IS the close. (corvu-src: packages/drawer/src/Content.tsx)
- Given the chosen snap point is not the closed one, when the release completes, then `transitionState` becomes `"snapping"`, `isDragging` becomes false, the active snap point is updated and the translate is set, all inside batches so the DOM sees one coherent update. (corvu-src: packages/drawer/src/Content.tsx)
- Given `openPercentage` is read, when the drawer size is zero, then it is `0`; otherwise it is `(drawerSize - translate) / drawerSize`, and it CAN exceed 1 while the user overscrolls past the last snap point because of the damping. Anything driving an overlay opacity from it must tolerate values above 1. (corvu-src: packages/drawer/src/Root.tsx)
- Given `transitionState`, when read, then it is one of `"opening"`, `"closing"`, `"snapping"`, `"resizing"` or `null`, and `isTransitioning` is simply `transitionState() !== null`. (corvu-src: packages/drawer/src/context.ts)
- Given the drawer enters its `closing` state, when that happens, then `isDragging` is forced false by an effect, so a close triggered from outside the drag path also terminates any drag. (corvu-src: packages/drawer/src/Content.tsx)

### Dismissal and layering

- Given a `Drawer.Root`, when rendered, then it delegates entirely to `@corvu/dialog` for open state, portalling, focus trapping, scroll locking, Escape handling and outside-pointer dismissal, wrapping it in two context providers (a public `DrawerContext` and an `InternalDrawerContext`). Everything drawer-specific is the snap-point and gesture layer on top. (corvu-src: packages/drawer/src/Root.tsx)
- Given `Drawer.Root` defaults, when rendered, then `closeOnOutsidePointer` is `true` and `allowPinchZoom` is `false`. The pinch-zoom default differs from a plain dialog's and matters because a drawer is a touch-first surface. (corvu-src: packages/drawer/src/Root.tsx)
- Given a `contextId` prop, when provided, then the drawer registers KEYED contexts (`drawer-<id>` and `drawer-internal-<id>`) instead of the default ones, and `useDrawerContext(id)` reads them. This is how nested drawers stay addressable. Reading a context with a wrong or missing id throws a message naming the id. (corvu-src: packages/drawer/src/context.ts)

### Animation and presence

- Given the drawer's open state flips to true, when the effect runs, then a transition-aware open flag is set first and the snap-point change is deferred to `afterPaint`, so the browser paints the closed position before the transition target is applied. Without that the drawer would jump. (corvu-src: packages/drawer/src/Root.tsx)
- Given the drawer opens and the computed `transitionDuration` on the content is `0`, when measured after paint, then `transitionState` is immediately cleared to `null` instead of waiting for a `transitionend` that will never arrive. The same check runs on close, where a zero duration calls the close path directly. THIS is corvu's answer to the exact problem that defeated kobalte's presence tests: read the computed transition duration and short-circuit when there is none. A conformance suite can then assert exit behavior deterministically simply by not defining a transition. (corvu-src: packages/drawer/src/Root.tsx)
- Given a `transitionend` event, when it fires, then it is IGNORED unless `event.target` is the content element itself, so a transition on a descendant cannot end the drawer's transition early. (corvu-src: packages/drawer/src/Content.tsx)
- Given a `transitionend` on the content while the state is `"closing"`, when it fires, then the drawer is actually torn down; while the state is anything other than `"resizing"`, the transition state is cleared to `null`. A resize transition is deliberately not cleared by `transitionend` because its own size watcher owns that state. (corvu-src: packages/drawer/src/Content.tsx)
- Given `transitionResize` is true and the drawer is open, when the content's height (for top/bottom) or width (for left/right) changes, then `solid-transition-size` reports transitioning and `transitionState` becomes `"resizing"` while the measured pixel size is pinned inline. (corvu-src: packages/drawer/src/Root.tsx)

### Notes and edge cases

- The drag listeners (`pointermove`, `touchmove`, `pointerup`, `touchend`, `contextmenu`) are attached to the DOCUMENT inside a `createEffect` that early-returns when the dialog is closed, with `onCleanup` removing them. Only `pointerdown`, `touchstart` and `transitionend` are on the element. So a drag continues to track once the pointer leaves the drawer, which is essential for a gesture, and a conformance test must dispatch move and up events on `document`, not on the content. (corvu-src: packages/drawer/src/Content.tsx)
- Both `pointermove` and `touchmove` are handled, with the touch variant reading `event.touches[0]`. Two parallel event streams exist rather than relying on pointer events alone, which suggests the author hit real Safari gaps. Any test matrix needs both paths. (corvu-src: packages/drawer/src/Content.tsx)
- Drag state lives in plain local `let` variables (`pointerDown`, `dragStartPos`, `currentPointerStart`, `cachedMoveTimestamp`, `cachedTranslate`) rather than signals, because it must not trigger reactivity on every pointermove. Only `isDragging`, `translate` and `transitionState` are reactive. That split is a deliberate performance design and is worth copying; it also means a test cannot observe the intermediate drag bookkeeping, only its effects. (corvu-src: packages/drawer/src/Content.tsx)
- `translate` and `transitionState` are `createWritableMemo` from `@solid-primitives/memo`: derived by default but imperatively overridable. `translate` derives from the active snap point's offset, and the drag writes over it directly. Solid 2 needs an equivalent, and whether one exists is a real design question for us. (corvu-src: packages/drawer/src/Root.tsx)
- The root returns `memoizedDrawerRoot as unknown as JSX.Element`, a `createMemo` wrapping the provider tree inside `untrack`, plus `createOnce` around the children. That machinery exists so the context objects are created exactly once and the children are not re-instantiated when unrelated props change. A naive implementation re-runs the children on every prop change. (corvu-src: packages/drawer/src/Root.tsx)
- `drawerStyles` is `getComputedStyle(contentRef)` held in a memo and read with a non-null assertion inside the open and close effects. In jsdom `getComputedStyle(...).transitionDuration` returns `""` and `parseFloat("")` is `NaN`, which is NOT `=== 0`, so the zero-duration short-circuit would NOT fire in jsdom and a drawer would never finish opening or closing under test. That is very likely part of why corvu has no tests at all. Our suite must either stub computed styles or make the duration check `NaN`-safe. This is the single most important practical finding on the corvu side. (corvu-src: packages/drawer/src/Root.tsx)
- `createSize` observes the content element to get `drawerSize`, and in jsdom every element measures 0, which makes every snap point resolve to offset 0 and `openPercentage` collapse to 0. Any drawer conformance test needs `ResizeObserver` and layout measurement stubbed with real numbers before a single assertion is meaningful. (corvu-src: packages/drawer/src/Root.tsx)
- `getScrollAtLocation` from `@corvu/utils/scroll` walks up from the event target to the content wrapper to find the nearest scrollable ancestor and its remaining scroll on the given axis. Testing the drag-versus-scroll handoff therefore requires stubbing `scrollHeight`, `clientHeight` and `scrollTop`, which jsdom leaves at 0. (corvu-src: packages/drawer/src/Content.tsx)
- There is no test file, no vitest config and no Playwright setup anywhere in the corvu repo, so none of the above has ever been asserted. (corvu-src: packages/drawer/src/Root.tsx)

## popover

### Roles and attributes

- Given `<Popover.Content>`, when it renders, then it delegates to `<Dialog.Content>`, so the element is a `div` with `role="dialog"`, `tabIndex="-1"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, `data-open` / `data-closed`, plus `data-corvu-popover-content=""`, `data-placement` set to the current resolved placement, and `data-corvu-dialog-content` removed. (corvu-src: packages/popover/src/Content.tsx)
- Given the popover defaults `modal` to `false`, when `<Popover.Content>` renders, then it carries `aria-modal="false"` while still using `role="dialog"`. (corvu-src: packages/popover/src/Root.tsx)
- Given `<Popover.Trigger>`, when it renders, then the element is a `button` with `aria-controls`, `aria-expanded`, `aria-haspopup="dialog"`, `data-open` / `data-closed`, `data-corvu-popover-trigger=""`, `data-corvu-dialog-trigger` removed, and `data-placement` present only while the popover is open. (corvu-src: packages/popover/src/Trigger.tsx)
- Given `<Popover.Anchor>`, when it renders, then the element is a `div` carrying `data-corvu-popover-anchor=""` and its ref becomes the floating reference. (corvu-src: packages/popover/src/Anchor.tsx)
- Given `<Popover.Arrow>`, when it renders, then it delegates to `FloatingArrow` and the element is a `div` carrying `data-corvu-popover-arrow=""`. (corvu-src: packages/popover/src/Arrow.tsx)
- Given `<Popover.Close>`, when it renders, then the element is a `button` with `aria-label="close"`, `data-corvu-popover-close=""`, and `data-corvu-dialog-close` removed. (corvu-src: packages/popover/src/Close.tsx)
- Given `<Popover.Overlay>`, when it renders, then the element is a `div` with `aria-hidden="true"`, `data-open` / `data-closed`, `data-corvu-popover-overlay=""`, and `data-corvu-dialog-overlay` removed. (corvu-src: packages/popover/src/Overlay.tsx)
- Given `<Popover.Label>`, when it renders, then the element is an `h2` carrying `data-corvu-popover-label=""` with `data-corvu-dialog-label` removed. (corvu-src: packages/popover/src/Label.tsx)
- Given `<Popover.Description>`, when it renders, then the element is a `p` carrying `data-corvu-popover-description=""` with `data-corvu-dialog-description` removed. (corvu-src: packages/popover/src/Description.tsx)
- Given `<Popover.Content>` styles itself, when the floating state changes, then the merged inline style includes `position`, `top`, `left`, optional `width`, `height`, `max-width`, `max-height`, and the custom property `--corvu-floating-transform-origin`. (corvu-src: packages/popover/src/Content.tsx)

### Keyboard

- Given the popover inherits the dialog's dismissible wiring, when `Escape` is pressed and the popover is the last layer, then it closes unless `onEscapeKeyDown` prevents it. (corvu-src: packages/popover/src/Root.tsx)
- Given `trapFocus` defaults to `true` through the dialog root, when the popover opens, then `Tab` and `Shift+Tab` cycle inside the content exactly as they do for a dialog. (corvu-src: packages/popover/src/Root.tsx)

### Pointer

- Given `<Popover.Trigger>` is clicked, when the handler runs, then the dialog trigger's toggle behaviour applies and the open state flips. (corvu-src: packages/popover/src/Trigger.tsx)
- Given the popover root defaults `closeOnOutsidePointer` to `true` even though `modal` defaults to `false`, when a `pointerup` lands outside the content, then the popover closes. (corvu-src: packages/popover/src/Root.tsx)
- Given `modal` defaults to `false`, when the popover is open, then `noOutsidePointerEvents` and `preventScroll` both resolve to `false`, so the page stays scrollable and clickable. (corvu-src: packages/popover/src/Root.tsx)

### State and controlled/uncontrolled

- Given `<Popover.Root>`, when it mounts, then it renders a `<Dialog>` internally and forwards every dialog prop, so `open`, `onOpenChange`, and `initialOpen` behave identically to the dialog. (corvu-src: packages/popover/src/Root.tsx)
- Given `<Popover.Root>` children are a function, when they resolve, then they receive the dialog children props merged with `placement`, `strategy`, `floatingOptions`, and the live `floatingState`. (corvu-src: packages/popover/src/Root.tsx)
- Given `<Popover.Root>` resolves children, when it does so, then it captures the dialog context into a signal by calling `Dialog.useContext(contextId)` from inside the children callback, and the floating computation is gated on that signal being populated. (corvu-src: packages/popover/src/Root.tsx)
- Given a popover part is rendered outside `<Popover.Root>`, when it reads context, then it throws `[corvu]: Popover context not found. Make sure to wrap Popover components in <Popover.Root>`. (corvu-src: packages/popover/src/context.ts)

### Positioning

- Given no `placement` prop, when the popover positions itself, then the initial placement is `'bottom'`. (corvu-src: packages/popover/src/Root.tsx)
- Given no `strategy` prop, when the content is styled, then `position: absolute` is used. (corvu-src: packages/popover/src/Root.tsx)
- Given no `floatingOptions` prop, when middleware is built, then the default is `{ flip: true, shift: true }`, so flipping and shifting are on and offset, arrow padding, size, autoPlacement, hide, and inline are off. (corvu-src: packages/popover/src/Root.tsx)
- Given both an `<Popover.Anchor>` and a `<Popover.Trigger>` are rendered, when the reference is resolved, then the anchor wins and the trigger is only used as a fallback. (corvu-src: packages/popover/src/Root.tsx)
- Given positioning is enabled, when the floating computation starts, then it is gated on `contentPresent()`, so a closing popover keeps being repositioned until its exit animation finishes. (corvu-src: packages/popover/src/Root.tsx)
- Given an `<Popover.Arrow>` is rendered, when its ref registers, then the `arrow` middleware is added and `arrowX` / `arrowY` flow back into the arrow element's inline `left` / `top`. (corvu-src: packages/popover/src/Arrow.tsx)

### Animation and presence

- Given `data-placement` on the content, when the placement flips, then the attribute updates so CSS can select per-side enter and exit animations. (corvu-src: packages/popover/src/Content.tsx)
- Given `--corvu-floating-transform-origin`, when the content animates, then the property is intended to anchor a scale animation at the edge nearest the reference. (corvu-src: packages/utils/src/floating/lib.ts)

### Notes and edge cases

- Given `<Popover.Content forceMount>`, when the component splits its props, then `forceMount` is pulled into local props and never forwarded to `<Dialog.Content>`, so the prop is silently dropped and the content still unmounts when closed; `<Popover.Overlay forceMount>` and `<Popover.Portal forceMount>` do work because they spread the whole props object. (corvu-src: packages/popover/src/Content.tsx)
- Given jsdom, when `createFloating` runs, then `autoUpdate` from `@floating-ui/dom` constructs a `ResizeObserver`, which jsdom does not implement, so rendering an open popover throws unless `ResizeObserver` is polyfilled. (corvu-src: packages/utils/src/create/floating.ts)
- Given jsdom, when `computePosition` resolves, then every `getBoundingClientRect` returns zeros so `x` and `y` stay `0`, `flip` never flips, and `data-placement` stays at the initial placement; an assertion that the popover flipped to `top` when there is no room below cannot be written. (corvu-src: packages/utils/src/create/floating.ts)
- Given jsdom, when a test asserts on the content's inline `top` / `left`, then it must await the `computePosition` promise plus the signal update, because the positioning write happens in a `.then` callback rather than synchronously. (corvu-src: packages/utils/src/create/floating.ts)
- Given the popover reuses the dialog, when both roots run, then the popover contributes its own keyed contexts (`popover-<id>`, `popover-internal-<id>`) into the same module-level keyed-context `Map` as the dialog's, so id collisions across tests persist. (corvu-src: packages/popover/src/context.ts)
- Given Solid 2 portability, when `<Popover.Root>` builds its tree, then it nests `untrack` inside a `createMemo` returned as JSX and calls `useContext` from inside a children callback to populate a signal, which is an ordering dependency on Solid 1's synchronous children resolution. (corvu-src: packages/popover/src/Root.tsx)
- Given a design decision worth copying, when the popover reuses the dialog wholesale, then only positioning, the anchor, the arrow, and attribute renaming are added, and every dialog behaviour comes free. (corvu-src: packages/popover/src/Root.tsx)

## tooltip

### Roles and attributes

- Given `<Tooltip.Content>`, when it renders, then the element is a `div` with `role="tooltip"`, `id` equal to `tooltipId`, `data-open` / `data-closed`, `data-placement`, and `data-corvu-tooltip-content=""`. (corvu-src: packages/tooltip/src/Content.tsx)
- Given `<Tooltip.Content>`, when it renders, then it does not receive `tabIndex`, `aria-labelledby`, `aria-describedby`, or `aria-modal`, so the tooltip content is not focusable and has no dialog semantics. (corvu-src: packages/tooltip/src/Content.tsx)
- Given `<Tooltip.Trigger>`, when it renders, then the element is a `button` with `data-corvu-tooltip-trigger=""`, `aria-expanded` of `"true"` or `"false"`, `data-open` / `data-closed`, and both `aria-describedby` and `data-placement` present only while the tooltip is open. (corvu-src: packages/tooltip/src/Trigger.tsx)
- Given `<Tooltip.Anchor>`, when it renders, then the element is a `div` carrying `data-corvu-tooltip-anchor=""` and its ref overrides the floating reference. (corvu-src: packages/tooltip/src/Anchor.tsx)
- Given `<Tooltip.Arrow>`, when it renders, then the element is a `div` carrying `data-corvu-tooltip-arrow=""` with a default `size` of 16 pixels. (corvu-src: packages/tooltip/src/Arrow.tsx)
- Given `<Tooltip.Portal>`, when it renders, then it emits Solid's `Portal` while any of `open`, `forceMount`, or `contentPresent` is true, with no attributes of its own. (corvu-src: packages/tooltip/src/Portal.tsx)
- Given the tooltip package, when its exports are inspected, then there is no `Label`, `Description`, `Overlay`, or `Close` part; the tooltip has only Root, Trigger, Portal, Content, Anchor, and Arrow. (corvu-src: packages/tooltip/src/context.ts)

### Keyboard

- Given `closeOnEscapeKeyDown` is `true` (the default) and the tooltip is the last dismissible layer, when `Escape` is pressed, then `onEscapeKeyDown` fires and, unless prevented, the tooltip closes. (corvu-src: packages/tooltip/src/Content.tsx)
- Given `openOnFocus` is `true` (the default), when the trigger receives keyboard focus, then `onFocus` fires and, unless prevented, the tooltip opens with no delay applied. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given the trigger was just pressed with a pointer, when the resulting `focus` event arrives, then the open is suppressed because `clickedTrigger` is set by the preceding `pointerdown`. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given the trigger is blurred while the pointer is still inside the safe area, when blur is handled, then the internal state switches to `hover` and the tooltip stays open instead of closing. (corvu-src: packages/utils/src/create/tooltip.ts)

### Pointer

- Given `openOnHover` is `true` (the default), when `pointerenter` fires on the trigger, then the open attempt is deferred through `afterPaint` (two animation frames) before any delay logic runs. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given a `pointerenter` whose `pointerType` is `'touch'`, when the hover handler runs, then it returns immediately and the tooltip never opens from touch. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `openDelay` is at its default of 500 and no skip-delay window is active, when the pointer enters the trigger, then the state becomes `entering`, a `pointermove` safe-area listener is installed, and the tooltip only opens after the timeout fires with the pointer still inside the safe area. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `openDelay` is zero or a skip-delay window is active, when the pointer enters, then the tooltip opens synchronously in that handler. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `closeOnPointerDown` is `true` (the default), when `pointerdown` fires on the trigger, then `onPointerDown` fires and, unless prevented, the tooltip closes and `clickedTrigger` is latched. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `pointerleave` fires on the trigger while the state is `hover`, when the handler runs, then it returns without closing, because leaving is decided by the safe-area polygon rather than by `pointerleave`. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given the tooltip is open from hover, when a `pointermove` lands outside the convex hull of the trigger rect corners (plus the content rect corners when `hoverableContent` is on), then the tooltip closes with reason `leave`. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `closeDelay` is greater than zero, when the pointer leaves the safe area, then a timeout is armed and re-entering the safe area before it fires cancels the close. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `closeDelay` is at its default of 0, when the pointer leaves the safe area, then the tooltip closes immediately and the skip-delay window is started. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `hoverableContent` is `true` (the default), when a non-touch `pointerdown` happens on the content while the state is `focus`, then the state is upgraded to `hover` so the tooltip survives the trigger losing focus. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `closeOnScroll` is `true` (the default), when a capture-phase `scroll` event fires on an element that contains the trigger, then `onScroll` fires and, unless prevented, the tooltip closes. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given a scroll event whose target does not contain the trigger, when the scroll handler runs, then nothing happens and the tooltip stays open. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `skipDelayDuration` is greater than zero, when a tooltip closes from hover, then a shared skip-delay flag is set for that duration so the next hover in the same group opens without waiting for `openDelay`. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given a `group` prop of `true` or a string, when the tooltip opens, then every other registered tooltip in the same group has its close callback invoked and its internal state reset. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `group` is `null` (the default), when the skip-delay window is managed, then it uses per-instance local variables instead of the shared group entry. (corvu-src: packages/utils/src/create/tooltip.ts)

### Focus management

- Given the tooltip content, when it mounts, then no focus trap is created and focus is never moved into the content. (corvu-src: packages/tooltip/src/Root.tsx)
- Given `<Tooltip.Content>` configures its dismissible, when it does so, then it sets `dismissOnOutsideFocus`, `dismissOnOutsidePointer`, and `noOutsidePointerEvents` all to `false`, so only escape dismisses it and the page stays fully interactive. (corvu-src: packages/tooltip/src/Content.tsx)
- Given the content is still the last dismissible layer, when it computes its inline style, then `pointer-events: auto` is applied only while it is the last layer. (corvu-src: packages/tooltip/src/Content.tsx)

### State and controlled/uncontrolled

- Given no `open` prop, when the tooltip mounts, then it is uncontrolled starting at `initialOpen`, which defaults to `false`. (corvu-src: packages/tooltip/src/Root.tsx)
- Given the root's `mergeProps` defaults, when the tooltip sets up, then `placement` is `'bottom'`, `strategy` is `'absolute'`, `floatingOptions` is `{ flip: true, shift: true }`, `openDelay` is 500, `closeDelay` is 0, `skipDelayDuration` is 0, `hoverableContent` is `true`, `group` is `null`, `openOnFocus` is `true`, `openOnHover` is `true`, `closeOnEscapeKeyDown` is `true`, `closeOnPointerDown` is `true`, `closeOnScroll` is `true`, and `tooltipId` is a `createUniqueId()`. (corvu-src: packages/tooltip/src/Root.tsx)
- Given every user callback (`onHover`, `onLeave`, `onFocus`, `onBlur`, `onPointerDown`, `onScroll`), when it calls `event.preventDefault`, then the corresponding open or close is skipped because the return of `callEventHandler` is the event's `defaultPrevented`. (corvu-src: packages/tooltip/src/Root.tsx)
- Given `<Tooltip.Root>` children are a function, when they resolve, then they receive `open`, `setOpen`, `placement`, `strategy`, `floatingOptions`, `floatingState`, the three delay values, `hoverableContent`, `group`, the four open/close flags, `contentPresent`, `contentRef`, and `tooltipId`. (corvu-src: packages/tooltip/src/Root.tsx)
- Given a tooltip part is rendered outside `<Tooltip.Root>`, when it reads context, then it throws `[corvu]: Tooltip context not found. Make sure to wrap Tooltip components in <Tooltip.Root>`. (corvu-src: packages/tooltip/src/context.ts)

### Positioning

- Given the tooltip's floating computation, when it is gated, then `enabled` is `contentPresent`, so positioning runs while the content is present and stops once it unmounts. (corvu-src: packages/tooltip/src/Root.tsx)
- Given both an anchor and a trigger, when the reference is resolved, then the anchor takes priority over the trigger. (corvu-src: packages/tooltip/src/Root.tsx)
- Given the content is styled, when the floating state changes, then the same `getFloatingStyle` output as the popover is applied, including `--corvu-floating-transform-origin`. (corvu-src: packages/tooltip/src/Content.tsx)

### Animation and presence

- Given `forceMount` is `false` (the default), when the tooltip is closed and no exit animation is pending, then `<Tooltip.Content>` renders nothing. (corvu-src: packages/tooltip/src/Content.tsx)
- Given `onContentPresentChange`, when presence becomes `present` then `true` is reported and when it becomes `hidden` then `false` is reported. (corvu-src: packages/tooltip/src/Root.tsx)

### Accessibility tooling

- Given `<Tooltip.Trigger>` emits `aria-expanded` on a plain button, when audited against ARIA, then that attribute has no defined meaning for a tooltip trigger and a conformance suite has to decide whether to copy corvu here. (corvu-src: packages/tooltip/src/Trigger.tsx)
- Given the tooltip is open, when the trigger's `aria-describedby` points at the content id, then the association only exists while the content is mounted and disappears the moment the tooltip closes. (corvu-src: packages/tooltip/src/Trigger.tsx)

### Notes and edge cases

- Given jsdom, when the safe-area polygon is built, then `getBoundingClientRect` returns all zeros so all four corner points collapse onto the origin, the convex hull degenerates, and `pointInPolygon` returns `false` for every pointer position; the first `pointermove` after a hover open therefore closes the tooltip and no hover-stability assertion can pass. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given jsdom, when a hover open is triggered, then the `pointerenter` handler defers through `afterPaint`, so a test must await two animation frames before the delay timer even starts, and combining fake timers for `openDelay` with real `requestAnimationFrame` deadlocks the sequence. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given jsdom, when `PointerEvent` is dispatched, then jsdom has no `PointerEvent` constructor, so `pointerType` has to be faked on a synthetic event for the touch-suppression branches to be reachable at all. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `tooltipGroups` is a module-level `Map`, when a grouped tooltip unmounts, then only its own entry is spliced out of the group's `tooltips` array and the group record itself, including `skipDelay` and a possibly pending `skipDelayTimeout`, is never deleted, so a group's skip-delay state leaks into every later test using the same group name. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `getSkipDelay` reads `tooltipGroups.get(group)!.skipDelay` with a non-null assertion, when it is called for a group that was never registered, then it throws; the registration effect and the read path must not be ordered otherwise. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given the `pointermove` and `scroll` listeners, when they are removed, then removal happens lazily from inside the handlers once the internal state is `null` rather than through `onCleanup`, so a tooltip that unmounts while open leaves both document listeners attached. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given the scroll listener is added with `{ capture: true }` but removed with no options, when the handler self-removes, then `removeEventListener('scroll', onScroll)` does not match the capturing registration and the listener stays attached. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given `tooltipState`, `clickedTrigger`, `insideSafeArea`, `shiftKeyDown`-style flags, when they are stored, then they are plain closure variables outside the reactive system, so no test can observe them except through emitted open/close transitions. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given Solid 2 portability, when `<Tooltip.Root>` builds its providers, then the tree is a `createMemo` returned as JSX with a nested `untrack` for both the provider body and the children, the same pattern as the dialog and popover roots. (corvu-src: packages/tooltip/src/Root.tsx)
- Given a design decision worth copying, when hover stability is implemented, then the safe area is a convex hull over the trigger and content rectangles rather than a rectangular corridor, which keeps the tooltip open on diagonal pointer paths. (corvu-src: packages/utils/src/create/tooltip.ts)
- Given a design decision worth copying, when a tooltip opens, then the group mechanism closes siblings and shares a skip-delay window so a row of tooltips feels like a single surface. (corvu-src: packages/utils/src/create/tooltip.ts)

## toast

### Roles and attributes

- Given a `Toast.Region` containing a `Toast.List` and a button calling `toaster.show(...)`, when the button is clicked, then a `role="status"` element is in the document. (kobalte: packages/core/src/toast/toast.test.tsx: "renders correctly")
- Given a toast shown with `{ priority: "high" }`, when rendered, then it carries `aria-live="assertive"`. (kobalte: packages/core/src/toast/toast.test.tsx: "should have 'aria-live' set to 'assertive' when priority is 'high'")
- Given a toast shown with `{ priority: "low" }`, when rendered, then it carries `aria-live="polite"`. (kobalte: packages/core/src/toast/toast.test.tsx: "should have 'aria-live' set to 'polite' when priority is 'low'")
- Given any toast, when rendered, then it carries `aria-atomic="true"` so screen readers re-read the whole toast rather than only the changed part. (kobalte: packages/core/src/toast/toast.test.tsx: "should have 'aria-atomic' set to 'true'")
- Given a toast containing a `Toast.Title`, when rendered, then the toast's `aria-labelledby` points at the title's id. (kobalte: packages/core/src/toast/toast.test.tsx: "should be labelled by its toast title")
- Given a toast containing a `Toast.Description`, when rendered, then the toast's `aria-describedby` points at the description's id. (kobalte: packages/core/src/toast/toast.test.tsx: "should be described by its toast description")
- Given a `Toast.Region`, when rendered, then it exposes `role="region"`. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > renders correctly")

### Pointer

- Given a toast with a `Toast.CloseButton`, when that button is clicked, then the toast begins closing. (kobalte: packages/core/src/toast/toast.test.tsx: "should close when clicking the toast close button")
- Given a `Toast.Region` with no toasts, when rendered, then the region has `pointer-events: none` in its style so it never blocks clicks on the page underneath. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > has 'pointer-events' set to 'none' when no toast")
- Given `Toast.Region duration={1000} pauseOnInteraction`, when a mouse `pointermove` is fired on the `Toast.List` and the full duration then elapses, then the toast is STILL in the document, so pointer entry pauses the dismissal timer. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.List > pauses timers on pointer move and resume on pointer leave when 'pauseOnInteraction'")
- Given a paused toast, when `pointerleave` fires on the list and the duration elapses again, then the toast closes, so the timer RESUMES on pointer leave. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.List > pauses timers on pointer move and resume on pointer leave when 'pauseOnInteraction'")

### Focus management

- Given `Toast.Region duration={1000} pauseOnInteraction`, when `focusin` fires on the `Toast.List` and the duration elapses, then the toast is still in the document, so keyboard focus also pauses the timer. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.List > pauses timers on focus in and resume on focus out when 'pauseOnInteraction'")
- Given a focus-paused toast, when `focusout` fires and the duration elapses, then the toast closes. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.List > pauses timers on focus in and resume on focus out when 'pauseOnInteraction'")

### State and controlled/uncontrolled

- Given `Toast.Region duration={1000}`, when a toast is shown and 1000ms elapse, then the toast's dismissal is triggered. (kobalte: packages/core/src/toast/toast.test.tsx: "should close after duration")
- Given `Toast.Region duration={3000}` and a toast shown with `{ duration: 1000 }`, when 1000ms elapse, then the toast dismisses, so a per-toast duration overrides the region's. (kobalte: packages/core/src/toast/toast.test.tsx: "supports overriding toast region duration")
- Given a toast shown with `{ persistent: true }` inside a region with `duration={1000}`, when 1000ms elapse, then the toast is STILL in the document, so `persistent` disables the timer entirely. (kobalte: packages/core/src/toast/toast.test.tsx: "should not close after duration if persistent")
- Given a toast created by `toaster.show`, when `toaster.dismiss(toastId)` is called from inside the toast's own content, then the toast begins closing, so dismissal is available imperatively by id. (kobalte: packages/core/src/toast/toast.test.tsx: "should close when using toaster dismiss method")
- Given a toast rendering "Initial", when `toaster.update(toastId, newRenderFn)` is called, then the same `role="status"` element's text becomes "Updated", so update replaces content in place rather than creating a second toast. (kobalte: packages/core/src/toast/toast.test.tsx: "can be updated with the toaster")
- Given `toaster.promise(promiseFn, render)` where the render reads `props.state` and `props.data`, when the toast appears, then its text contains `"pending"`; after the promise resolves, the same toast's text becomes `"fulfilled - data"`. (kobalte: packages/core/src/toast/toast.test.tsx: "supports promise resolve")
- Given `toaster.promise` with a rejecting promise and a render reading `props.state` and `props.error?.message`, when the promise rejects, then the toast text becomes `"rejected - error"`. (kobalte: packages/core/src/toast/toast.test.tsx: "supports promise reject")
- Given `Toast.Region limit={3}` and five `toaster.show` calls in one click handler, when rendered, then exactly 3 `role="status"` elements exist, so the region queues the overflow rather than rendering it. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > should not show move toasts than the limit as the same time")
- Given `Toast.Region limit={1}`, when a toast is shown and then dismissed, then the list holds ZERO toasts; when a new toast is shown, the list holds exactly 1. So a dismissed toast frees its slot and does not permanently consume the limit. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > should not use dismissed toasts for list")
- Given two `Toast.Region`s, one default and one with `regionId="custom-id"`, and five toasts of which two are shown with `{ region: "custom-id" }`, when rendered, then the default list holds 3 toasts and the custom list holds 2, so toasts route to regions by id independently. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > should render multiple regions simultaneously")

### RTL and i18n

- Given `I18nProvider locale="en"` and a `Toast.Region` with no `aria-label`, when rendered, then the region's `aria-label` is exactly `"Notifications (alt+T)"`, so the default label is localized AND has the region hotkey interpolated into it. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > has default 'aria-label' with hot keys")
- Given `Toast.Region aria-label="Toasts - {hotkey}"`, when rendered, then the `{hotkey}` placeholder is replaced, giving `"Toasts - alt+T"`. So an author-supplied label participates in hotkey interpolation via a named placeholder. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > supports custom 'aria-label' with hot keys placeholder replacement")

### Notes and edge cases

- SIX negative presence assertions are commented out with `// TODO: fix solid-presence vitest`, in "should close after duration", "supports overriding toast region duration", "should close when clicking the toast close button", "should close when using toaster dismiss method", and both `Toast.List` pause tests. Every single "toast actually goes away" assertion in the file is disabled. What IS verified is the inverse: that a persistent toast and a paused toast are still present. So the toast suite proves toasts do not close when they should not, and never proves they close when they should. This is the same `solid-presence` exit problem as accordion, collapsible and checkbox, and by now it is clearly the single largest structural weakness of kobalte's suite. (kobalte: packages/core/src/toast/toast.test.tsx: "should close after duration")
- Three tests are `it.skipIf(process.env.GITHUB_ACTIONS)`: "supports promise resolve" and both `Toast.List` pause tests. Unlike the focus-related skips elsewhere, these are timing-sensitive rather than focus-sensitive (they interleave `vi.advanceTimersByTime` with `await Promise.resolve()`), so CI flakiness here comes from fake-timer plus microtask ordering. (kobalte: packages/core/src/toast/toast.test.tsx: "supports promise resolve")
- "supports promise reject" is `it.skip` with the comment `// don't know how to test implicit promise rejection`. The test body's attempt is `await Promise.reject()` inside a try/catch, which rejects an unrelated promise and does nothing to advance the toast's own. Testing rejection paths under fake timers needs a real strategy (an explicit deferred whose reject you call, then flush), and our suite should provide one rather than skipping. (kobalte: packages/core/src/toast/toast.test.tsx: "supports promise reject")
- `toaster` is a MODULE-LEVEL SINGLETON imported directly, and `beforeEach` calls `toaster.clear()` to reset it between tests. Global imperative state shared across a test file is a real hazard, especially with vitest's `isolate: false` in this repo, and the clear is mandatory. If our API has an imperative toaster, its reset hook is part of the test contract. (kobalte: packages/core/src/toast/toast.test.tsx: "renders correctly")
- `vi.useFakeTimers()` runs in `beforeEach` for the whole file and `vi.advanceTimersByTime(duration)` is the only way durations are exercised. Notably `fireEvent.click(trigger)` is followed by NO `await Promise.resolve()` in most of these tests, and `getByRole("status")` still finds the toast immediately, so toast insertion is observable synchronously while removal is not. (kobalte: packages/core/src/toast/toast.test.tsx: "renders correctly")
- The promise test interleaves `vi.advanceTimersByTime(timeout)` with `await Promise.resolve()` to let the resolved promise's continuation run; advancing timers alone fires the `setTimeout` but the `.then` continuation needs the microtask drain. That two-step flush is the pattern for any timer-driven async state in Solid. (kobalte: packages/core/src/toast/toast.test.tsx: "supports promise resolve")
- The pause tests use `createPointerEvent("pointermove", ...)` and `createPointerEvent("pointerleave", ...)` with `installPointerEvent()` active, and each pointer event needs its own `await Promise.resolve()` before advancing timers. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.List > pauses timers on pointer move and resume on pointer leave when 'pauseOnInteraction'")
- NOTHING tests swipe-to-dismiss. `Toast.Root` supports `swipeDirection` and sets `data-swipe`, `data-swipe-direction` and the `--kb-toast-swipe-move-x`/`--kb-toast-swipe-end-x` CSS custom properties, and not one of those appears in the test file. Nor is the region hotkey (alt+T focusing the region) ever actually pressed, only named in the label. Nor is `toaster.clear()` tested as a behavior, only used as a fixture. (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > has default 'aria-label' with hot keys")
- The test name "should not show move toasts than the limit as the same time" is garbled for "should not show more toasts than the limit at the same time". (kobalte: packages/core/src/toast/toast.test.tsx: "Toast.Region > should not show move toasts than the limit as the same time")
- No upstream attribution header; the toast implementation and its tests are kobalte-original, so there is no React Aria counterpart to compare against. (kobalte: packages/core/src/toast/toast.test.tsx: "renders correctly")

## context-menu

### Pointer

- Given a `ContextMenu.Trigger` with an author `onContextMenu` handler and a root `onOpenChange`, when a `contextmenu` event fires on the trigger, then the author's handler runs exactly once AND the menu still opens (`onOpenChange` called with `true`), so the library composes with the author handler rather than replacing it. (kobalte: packages/core/src/context-menu/context-menu-trigger.test.tsx: "calls a provided onContextMenu handler when the trigger is not disabled")
- Given a `disabled` `ContextMenu.Trigger` with an author `onContextMenu` handler, when a `contextmenu` event fires, then the author's handler STILL runs exactly once, so `disabled` suppresses the library's own behavior but not the author's event handler. (kobalte: packages/core/src/context-menu/context-menu-trigger.test.tsx: "calls a provided onContextMenu handler when the trigger is disabled")
- Given a `ContextMenu.Trigger` whose author `onContextMenu` calls `e.preventDefault()`, when a `contextmenu` event fires, then `onOpenChange` is never called, so the author can veto the menu by preventing the default. (kobalte: packages/core/src/context-menu/context-menu-trigger.test.tsx: "does not open the menu when the consumer calls preventDefault")

### Notes and edge cases

- The file's header comment links kobalte issue #646, so like `dismissable-layer` it is a regression pin rather than a spec. Its lesson generalises: for every component where the library attaches a handler to a DOM event the author can also handle, the contract is run-both-and-respect-preventDefault. That is worth making a cross-cutting rule in our conformance suite rather than a per-component test. (kobalte: packages/core/src/context-menu/context-menu-trigger.test.tsx: "calls a provided onContextMenu handler when the trigger is not disabled")
- All three tests are fully synchronous with no flush, because they assert only on spies. (kobalte: packages/core/src/context-menu/context-menu-trigger.test.tsx: "calls a provided onContextMenu handler when the trigger is not disabled")
- Nothing tests long-press-to-open on touch, positioning the menu at the pointer coordinates, the second contextmenu while already open, or any of the menu content behavior. (kobalte: packages/core/src/context-menu/context-menu-trigger.test.tsx: "does not open the menu when the consumer calls preventDefault")

## menubar

### Roles and attributes

- Given a `Menubar.Root` with three `Menubar.Menu`s each holding a trigger, items and a `Menubar.Sub`, when rendered, then all three triggers are visible. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- Given a menubar with nothing interacted with, when inspected, then the FIRST trigger has `tabindex="0"` and the other two have `tabindex="-1"`, so the menubar is a single tab stop with a roving tabindex. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given a fresh menubar, when inspected, then no trigger has `data-highlighted="true"`. Note that kobalte asserts `data-highlighted` with the literal string VALUE `"true"` here rather than as a bare attribute, unlike `data-checked` and friends elsewhere. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")

### Keyboard

- Given the first trigger, when it receives focus, then it gains `data-highlighted="true"` but its menu does NOT open, so focus highlights without expanding. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given the first trigger highlighted and closed, when ArrowRight is pressed, then highlight and DOM focus move to the second trigger, the roving `tabindex="0"` moves with them, the first drops to `tabindex="-1"`, and the second menu does NOT open. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given the second trigger highlighted, when ArrowRight is pressed, then highlight, focus and `tabindex="0"` move to the third trigger without opening it. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given the LAST trigger highlighted, when ArrowRight is pressed, then focus wraps around to the FIRST trigger. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given a closed, highlighted trigger, when ArrowDown is pressed, then its menu OPENS and the first item becomes visible. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given menu 1 is OPEN, when ArrowRight is pressed, then menu 2 opens instead, so while a menu is open ArrowRight switches the open menu rather than just moving highlight. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given menu 2 is open with focus on the content, when ArrowDown is pressed, then the first item of menu 2 takes focus. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given the first item focused, when ArrowDown is pressed twice more, then focus lands on the `SubTrigger`, so the sub-menu trigger participates in normal item navigation. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given a `SubTrigger` focused, when ArrowRight is pressed, then the sub-menu opens and its FIRST item takes focus immediately. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given focus inside an open sub-menu, when ArrowLeft is pressed, then the sub-menu closes and focus returns to its `SubTrigger`. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- Given a `SubTrigger` focused, when ArrowRight is pressed twice (once to enter the sub-menu, once more), then the NEXT top-level menu opens, so ArrowRight from the deepest level escapes to the next menubar menu. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")

### Pointer

- Given a closed menubar, when the first trigger is clicked, then it gains `data-highlighted="true"` and its items and sub-trigger all become visible. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- Given menu 1 open, when the second trigger is clicked, then menu 1's highlight is removed, menu 2 gains `data-highlighted="true"`, menu 1's items are removed from the DOM entirely, and menu 2's items become visible. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- Given menu 2 open, when its `SubTrigger` is clicked, then the sub-menu's items become visible. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- Given menu 2 open, when an element OUTSIDE the menubar is clicked, then menu 2's highlight is removed and all of its items are removed from the DOM. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- Given a closed menubar, when the mouse ENTERS the second trigger, then the roving `tabindex="0"` stays on the FIRST trigger and menu 2's items are NOT in the DOM, so hover alone neither opens a menu nor moves the tab stop while the menubar is closed. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles hover correctly")
- Given a menubar where menu 1 has been opened by click, when the second trigger is clicked, then menu 1's items leave the DOM and menu 2's items appear. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles hover correctly")

### Animation and presence

- Given a menu that closes because another menu opened or because of an outside click, when queried, then its items are `not.toBeInTheDocument()`, so closed menu content is unmounted rather than hidden. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")

### Notes and edge cases

- ALL THREE MENUBAR TESTS ARE `it.skip`, each carrying the comment "Can't be tested as jsdom doesn't support onPointer events. Test code should be valid for the future." So zero menubar behavior is verified; the file is an executable specification that has never run. Every behavior bullet above is aspirational, not asserted. I have listed them anyway because they are the most complete written statement of kobalte's intended menu semantics anywhere in the repo, and they are exactly the matrix our conformance suite needs for menu, context-menu, dropdown-menu and menubar. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- The stated reason for skipping is wrong in an interesting way: `installPointerEvent()` exists in `@kobalte/tests` precisely to give jsdom a `PointerEvent`, and toggle-group and tabs use it successfully. This file does not import it. So the real blocker is more likely the combination of hover intent timers, portals and `solid-presence` than the absence of `PointerEvent` per se. Worth not repeating that mistake: a pointer-event shim plus fake timers does make menu behavior testable in jsdom. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles hover correctly")
- The skipped tests use `fireEvent.keyPress`, which is deprecated and does not trigger `keydown` handlers, so they would not pass as written even if unskipped. Another sign they have never been run. (kobalte: packages/core/src/menubar/menubar.test.tsx: "handles keyboard navigation correctly")
- `Menubar.Portal` wraps every `Content` and `SubContent`, so menu content is portalled out of the root's DOM position. Queries therefore have to be document-wide, and `within(root)` would find nothing. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- The test JSX shows the full menu part vocabulary kobalte settled on: `Root`, `Menu`, `Trigger`, `Portal`, `Content`, `Item`, `Sub`, `SubTrigger`, `SubContent`. There is no `Menubar.Menu` value-driven open state tested, though each `Menu` carries a `value` prop. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")
- No test file exists for `dropdown-menu` at all, and the `menu` machinery has no test file of its own, so these three skipped menubar tests plus the three `context-menu-trigger` tests are the entire menu-family coverage in kobalte. (kobalte: packages/core/src/menubar/menubar.test.tsx: "renders correctly")

## select

Note: the entire `describe("Select")` block is `describe.skip`, so NONE of the bullets in
this section are verified. They are read out of a 4168-line executable specification that
has never run in CI. See the first Notes bullet.

### Roles and attributes

- Given a fully assembled `Select.Root` with `HiddenSelect`, `Label`, `Trigger`, `Value`, `Portal`, `Content` and `Listbox`, when rendered, then the root is `role="group"` and an `HTMLDivElement`, the hidden select proxy is not disabled, the trigger carries `aria-haspopup="listbox"`, and both the label and the placeholder text are visible. (kobalte: packages/core/src/select/select.test.tsx: "renders correctly")
- Given an open select, when inspected, then the trigger carries `aria-expanded="true"` and `aria-controls` equal to the listbox's id. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on mouse down")
- Given a select that has been closed again, when inspected, then the trigger carries `aria-expanded="false"` and `aria-controls` is REMOVED entirely rather than left pointing at a hidden listbox. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by clicking on the button")
- Given options mapped with `optionValue="id"` from a sectioned source, when the listbox opens, then the three nested items appear as `role="option"` elements with `data-key` set to the mapped id and `data-disabled` present only on the disabled one. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports string based option mapping for object options with string keys")
- Given the same mapping expressed as FUNCTIONS, when the listbox opens, then the items, `data-key` values and `data-disabled` flags are identical. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports function based option mapping for object options with string keys")
- Given a sectioned source whose ids are NUMBERS and string-based mapping, when the listbox opens, then `data-key` is the stringified number (`"1"`, `"2"`, `"3"`) and disabled mapping still works. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports string based option mapping for object options with number keys")
- Given number ids with function-based mapping, when the listbox opens, then `data-key` is again the stringified number. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports function based option mapping for object options with number keys")
- Given `options={["One","Two","Three"]}` and NO mapping props at all, when the listbox opens, then each option's `data-key` is the string itself and none is disabled, so a plain string array needs no mapping configuration. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports string options without mapping")
- Given a string array with identity mapping functions and `optionDisabled={(o) => o === "Two"}`, when the listbox opens, then only "Two" carries `data-disabled`. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports function based option mapping for string options")
- Given `options={[1, 2, 3]}` and no mapping props, when the listbox opens, then the number options render with stringified `data-key` values. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports number options without mapping")
- Given a number array with function-based mapping, when the listbox opens, then the same result holds. (kobalte: packages/core/src/select/select.test.tsx: "option mapping > supports function based option mapping for number options")
- Given `multiple`, when the listbox opens, then it carries `aria-multiselectable="true"`. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > supports selecting multiple options")
- Given a disabled option in the collection, when the listbox opens, then that option carries `aria-disabled="true"`. (kobalte: packages/core/src/select/select.test.tsx: "selection > skips disabled items")
- Given a selected option, when the listbox opens, then that option carries `aria-selected="true"`. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports controlled selection")

### Keyboard

- Given a closed select, when Space is pressed and released on the trigger, then the listbox opens, `onOpenChange` fires once with `true`, and focus moves to the FIRST item. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on Space key down")
- Given a closed select, when Enter is pressed and released on the trigger, then the listbox opens and focus moves to the first item. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on Enter key down")
- Given a closed select, when ArrowDown is pressed on the trigger, then the listbox opens and focus AUTO-MOVES to the first item. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on ArrowDown key down and auto focuses the first item")
- Given a closed select, when ArrowUp is pressed on the trigger, then the listbox opens and focus auto-moves to the LAST item. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on ArrowUp key down and auto focuses the last item")
- Given an open select with the first item focused, when ArrowDown is pressed twice on the listbox then ArrowUp once, then focus walks first to second to third and back to second. (kobalte: packages/core/src/select/select.test.tsx: "opening > can change item focus with arrow keys")
- Given an open select, when Escape is pressed on the listbox, then it closes, the trigger returns to `aria-expanded="false"` with `aria-controls` removed, `onOpenChange` fires with `false`, and focus is restored to the trigger. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by pressing the Escape key")
- Given an open select with a mouse-opened listbox holding focus, when ArrowDown then Space are pressed, then the first item is selected, `onValueChange` fires once with the first data item, the listbox closes, focus returns to the trigger, and the trigger's text becomes the selected label. (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items with the Space key")
- Given a select opened with ArrowUp so the last item is focused, when ArrowUp then Enter are pressed, then the SECOND item is selected, the listbox closes and the trigger shows its label. (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items with the Enter key")
- Given an open listbox whose second option is disabled and focus is on the listbox, when ArrowDown is pressed twice, then focus lands on the THIRD option, so arrow navigation skips disabled options. (kobalte: packages/core/src/select/select.test.tsx: "selection > skips disabled items")
- Given an open listbox over four options, when the letters `t` then `h` are typed, then focus moves to "Two" and then to "Three", so typeahead accumulates a multi-character buffer. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports type to select")
- Given a select reopened after a previous typeahead selection, when `f` is typed and Enter pressed, then "Four" is selected and `onValueChange` has been called twice in total. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports type to select")
- Given a CLOSED, focused select with no value, when ArrowLeft is pressed, then the FIRST option is selected directly without opening the listbox, `onValueChange` fires once, and the trigger shows "One". So Left and Right cycle the value in place, the native `<select>` behavior. (kobalte: packages/core/src/select/select.test.tsx: "selection > move selection on Arrow-Left/Right")
- Given a closed select already at the first option, when ArrowLeft is pressed again, then the value does not change, so leftward cycling CLAMPS at the start rather than wrapping. (kobalte: packages/core/src/select/select.test.tsx: "selection > move selection on Arrow-Left/Right")
- Given a closed select at the first option, when ArrowRight is pressed twice, then the value advances to the second then the third option, with `onValueChange` reaching three calls. (kobalte: packages/core/src/select/select.test.tsx: "selection > move selection on Arrow-Left/Right")
- Given a closed select at the LAST option, when ArrowRight is pressed, then the value does not change, so rightward cycling clamps at the end. (kobalte: packages/core/src/select/select.test.tsx: "selection > move selection on Arrow-Left/Right")
- Given a closed, FOCUSED select, when `t` is typed, then "Two" is selected immediately WITHOUT opening the listbox and the trigger text updates; typing `h` next then selects "Three", so typeahead on a closed select commits selection rather than only moving focus. (kobalte: packages/core/src/select/select.test.tsx: "type to select > supports focusing items by typing letters in rapid succession without opening the menu")
- Given a closed focused select where `t` selected "Two" and the typeahead timeout has then elapsed, when `h` is typed, then NOTHING changes (`onValueChange` still at one call, trigger still "Two"), because the buffer reset means `h` alone matches nothing. (kobalte: packages/core/src/select/select.test.tsx: "type to select > resets the search text after a timeout")
- Given a closed focused select where `t` selected "Two" and the timeout elapsed, when `o` is typed, then "One" is selected, so a fresh single-letter search WRAPS around the collection from the current position. (kobalte: packages/core/src/select/select.test.tsx: "type to select > wraps around when no items past the current one match")
- Given a `disabled` select, when Space is pressed and released on the trigger, then no listbox appears, `onOpenChange` is never called, `aria-expanded` stays `"false"`, and the trigger does NOT even receive focus. (kobalte: packages/core/src/select/select.test.tsx: "disabled > does not open on Space key press when disabled is true")

### Pointer

- Given a closed select, when a mouse `pointerdown` then `pointerup` are dispatched on the trigger, then the listbox opens with its three options, `onOpenChange` fires once with `true`, and `document.activeElement` is the LISTBOX itself rather than an item. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on mouse down")
- Given a closed select, when a TOUCH `pointerdown` is dispatched, then the listbox does NOT open yet; only after the touch `pointerup` and the subsequent `click` does it open, so touch defers opening to avoid opening on a scroll gesture. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on touch up")
- Given an open select, when the trigger is pressed again, then the listbox closes, `aria-expanded` becomes `"false"`, `aria-controls` is removed, `onOpenChange` reaches two calls ending with `false`, and focus returns to the trigger. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by clicking on the button")
- Given an open select, when a pointer press lands OUTSIDE the select, then the listbox closes and `onOpenChange` fires with `false`. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by clicking outside")
- Given an open select, when the third option is pressed, then `onValueChange` fires once with the third data OBJECT (identity-equal to the source entry), the listbox closes, focus returns to the trigger, and the trigger's text becomes "Three". (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items on press")
- Given an open select whose listbox holds focus, when a mouse `pointermove` enters the second option, then focus moves to that option; a subsequent ArrowDown then moves to the third. So hover and keyboard share one focus cursor. (kobalte: packages/core/src/select/select.test.tsx: "selection > focuses items on hover")
- Given `defaultValue` set and `disallowEmptySelection`, when the ALREADY-SELECTED option is pressed, then `onValueChange` fires once with that same option (rather than with null), the listbox closes, and the trigger's text is unchanged. So the press is treated as a re-selection, not a deselection. (kobalte: packages/core/src/select/select.test.tsx: "selection > does not deselect when pressing an already selected item when 'disallowEmptySelection' is true")
- Given `multiple`, when options one and three are pressed in turn, then both become `aria-selected="true"`, `onValueChange` fires twice with arrays containing the respective items, the listbox STAYS VISIBLE, and the trigger's text becomes `"One, Three"`. Multi-select does not close on pick. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > supports selecting multiple options")
- Given `multiple` with `defaultValue` of the first two items, when the third is pressed, then it becomes selected and `onValueChange` fires once with an array containing ALL THREE items, so uncontrolled multi-select accumulates. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > supports multiple defaultValue (uncontrolled)")
- Given `multiple` with a fixed `value` of the first two items, when the third is pressed, then it stays `aria-selected="false"` and `onValueChange` fires once with an array containing only the third item. Controlled multi-select reports just the clicked item, the same inconsistency the listbox file shows. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > supports multiple value (controlled)")
- Given `multiple` with nothing selected, when the THIRD then the FIRST option are pressed, then the trigger's text is `"Three, One"`, so the displayed value preserves CLICK order rather than collection order. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > should keep the selection order")
- Given `multiple` with the first two items selected, when the FIRST is pressed again, then it becomes `aria-selected="false"` and `onValueChange` fires once with an array that no longer includes it but still includes the second. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > supports deselection")
- Given a `disabled` select, when a mouse press lands on the trigger, then no listbox appears, `onOpenChange` is never called, and `aria-expanded` stays `"false"`. (kobalte: packages/core/src/select/select.test.tsx: "disabled > does not open on mouse down when disabled is true")

### Focus management

- Given a select opened by MOUSE, when inspected, then `document.activeElement` is the listbox container. Given a select opened by KEYBOARD, it is an option. That asymmetry is the whole design: mouse users get no visible focus ring on an item, keyboard users do. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on mouse down")
- Given a select with a `Select.Label`, when the label is clicked, then focus moves to the TRIGGER, so the label behaves like a native `<label for>` even though the trigger is a button. (kobalte: packages/core/src/select/select.test.tsx: "labeling > focuses on the trigger when you click the label")
- Given a select closed by selecting an item, when the restore-focus `requestAnimationFrame` runs, then `document.activeElement` is the trigger again. (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items on press")
- Given a select closed by Escape, when the restore-focus rAF runs, then focus is back on the trigger. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by pressing the Escape key")
- Given a select with `value` set, when the listbox opens, then focus lands on the SELECTED option rather than the first. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports controlled selection")
- Given a select with `defaultValue` set, when the listbox opens, then focus lands on the selected option and it is `aria-selected="true"`. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports default selection")
- Given a `Select.HiddenSelect`, when inspected, then it contains a hidden `role="textbox"` with `tabIndex="0"`, an inline style of exactly `font-size: 16px;`, and a parent with `aria-hidden="true"`. (kobalte: packages/core/src/select/select.test.tsx: "autofill > should have a hidden input to marshall focus to the button")
- Given the hidden focus proxy, when it is focused, then `document.activeElement` becomes the real trigger BUTTON and the proxy's `tabIndex` flips to `"-1"`; when the button then blurs, the proxy's `tabIndex` returns to `"0"`. (kobalte: packages/core/src/select/select.test.tsx: "autofill > should have a hidden input to marshall focus to the button")

### State and controlled/uncontrolled

- Given `Select.Root open` (controlled), when rendered, then the listbox is visible and `onOpenChange` has NOT been called, so a controlled-open mount emits no event. (kobalte: packages/core/src/select/select.test.tsx: "opening > supports controlled open state")
- Given `defaultOpen` (uncontrolled), when rendered, then the listbox is visible, `onOpenChange` has not been called, and focus is on the listbox. (kobalte: packages/core/src/select/select.test.tsx: "opening > supports default open state")
- Given `Select.Root open` with a fixed prop, when Escape is pressed, then the listbox REMAINS visible while `onOpenChange` fires once with `false`, so the controlled prop wins. (kobalte: packages/core/src/select/select.test.tsx: "closing > does not close in controlled open state")
- Given `defaultOpen`, when Escape is pressed, then the listbox closes, the trigger drops to `aria-expanded="false"` with `aria-controls` removed, and `onOpenChange` fires once with `false`. (kobalte: packages/core/src/select/select.test.tsx: "closing > closes in default open state")
- Given a fixed `value` of the second item, when the first item is selected with Enter, then `onValueChange` fires once with the first item but the trigger's text stays "Two", so a controlled select never drifts. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports controlled selection")
- Given `defaultValue` of the second item, when the first is selected, then `onValueChange` fires once and the trigger's text DOES change to "One". (kobalte: packages/core/src/select/select.test.tsx: "selection > supports default selection")
- Given a select whose `value` is driven by a Solid signal and an external button that sets that signal to `null`, when the button is clicked, then the trigger's text returns to the PLACEHOLDER, so clearing a controlled select is supported and the placeholder is the empty rendering. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports controlled clear selection")
- Given a select where an item was selected and the listbox reopened, when Escape closes the listbox, then `onValueChange` has STILL only been called once and the trigger's text is unchanged, so closing without picking must not clear the existing selection. `onOpenChange` reaches four calls across the open/select/reopen/escape sequence. (kobalte: packages/core/src/select/select.test.tsx: "selection > does not clear selection on escape closing the listbox")

### Forms

- Given `Select.HiddenSelect autocomplete="address-level1"`, when rendered, then the hidden native select carries `tabIndex="-1"` and that `autocomplete` value. (kobalte: packages/core/src/select/select.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given three data options, when the hidden select is inspected, then it holds FOUR `role="option"` children: a leading empty option plus one per item, each carrying the item's label. (kobalte: packages/core/src/select/select.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given the hidden select, when a `change` event sets its value to `"FR"`, then `onValueChange` fires once with the full option object and the trigger's text becomes "France", so browser autofill drives the visible select. (kobalte: packages/core/src/select/select.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given `Select.Root disabled`, when rendered, then the hidden proxy control is disabled. (kobalte: packages/core/src/select/select.test.tsx: "disabled > disables the hidden select when disabled is true")
- Given `Select.Root name="test"` with no value inside a `<form>`, when the form is submitted, then the `FormData` entry for `test` is the EMPTY STRING. (kobalte: packages/core/src/select/select.test.tsx: "form > Should submit empty option by default")
- Given `Select.Root name="test" defaultValue={DATA_SOURCE[0]}`, when the form is submitted, then the `FormData` entry for `test` is `"1"`, the option's `optionValue`. (kobalte: packages/core/src/select/select.test.tsx: "form > Should submit default option")

### Accessibility tooling

- Given a `Select.Label` and a `Select.Value` showing the placeholder, when rendered, then the TRIGGER's `aria-labelledby` is `"<labelId> <valueId>"`, so the accessible name is the label plus the current value read together, the native `<select>` pattern. (kobalte: packages/core/src/select/select.test.tsx: "labeling > supports labeling with a visible label")
- Given a visible label and an open listbox, when inspected, then the LISTBOX's `aria-labelledby` points at the label's id, so the popup borrows the field's label. (kobalte: packages/core/src/select/select.test.tsx: "labeling > supports labeling with a visible label")
- Given `Select.Trigger aria-label="foo"` and no visible label, when rendered, then the trigger keeps `aria-label="foo"` AND gets `aria-labelledby` of `"<triggerId> <valueId>"`, self-referencing so its own `aria-label` is folded into the composite name; the open listbox's `aria-labelledby` is then the TRIGGER's id. (kobalte: packages/core/src/select/select.test.tsx: "labeling > supports labeling via aria-label")
- Given `Select.Trigger aria-labelledby="foo"`, when rendered, then the trigger's `aria-labelledby` is `"foo <valueId>"` and the open listbox's `aria-labelledby` is just `"foo"`. (kobalte: packages/core/src/select/select.test.tsx: "labeling > supports labeling via aria-labelledby")
- Given `Select.Trigger aria-label="bar" aria-labelledby="foo"`, when rendered, then the trigger's `aria-labelledby` is `"foo <triggerId> <valueId>"` and the open listbox's is `"foo <triggerId>"`. (kobalte: packages/core/src/select/select.test.tsx: "labeling > supports labeling via aria-label and aria-labelledby")
- Given a `Select.Description`, when rendered, then it has an `id` and the TRIGGER's `aria-describedby` points at it. (kobalte: packages/core/src/select/select.test.tsx: "help text > supports description")
- Given a `Select.ErrorMessage` with an invalid select, when rendered, then it has an `id` and the trigger's `aria-describedby` points at it. (kobalte: packages/core/src/select/select.test.tsx: "help text > supports error message")

### Notes and edge cases

- THE ENTIRE SELECT SUITE IS DISABLED: line 29 is `describe.skip("Select", ...)` preceded by the comment `// Skipped: jsdom stub for pointerEvent issue with vitest`. 4168 lines and roughly 50 tests, covering the single most intricate component in the library, never execute. Combined with combobox (also fully skipped) and menubar (all three tests skipped), the most complex components in kobalte have zero running coverage while `button` and `badge` are thoroughly covered. That inversion is the headline finding of this whole exercise: a conformance suite is only worth what actually runs, and the hard components are exactly the ones where jsdom friction wins. Making these run in our Solid 2 suite should be treated as the primary design constraint on our test infrastructure, not an afterthought. (kobalte: packages/core/src/select/select.test.tsx: "renders correctly")
- Opening by mouse needs FOUR steps: `createPointerEvent("pointerdown", { pointerType: "mouse" })`, `await Promise.resolve()`, `pointerup`, `await Promise.resolve()`, and then `vi.runAllTimers()` before the listbox is queryable. So a select open is gated on a timer, not just microtasks. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on mouse down")
- Focus RESTORE after close is gated on a `requestAnimationFrame`. Every test that asserts focus returned to the trigger has the comment `// run restore focus rAF` followed by `vi.runAllTimers()`. That comment appears 20 times in the file. Under fake timers, vitest's `runAllTimers` does fire rAF callbacks; the listbox file instead stubs rAF to be synchronous. Two different strategies for the same problem in one repo. (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items on press")
- When the select is open, outside content becomes `aria-hidden`, so the TRIGGER can no longer be found by a plain `getByRole("button")`. The controlled-open and default-open tests use `getByRole("button", { hidden: true })` and two closing tests use `getByLabelText("Placeholder")` instead. Any conformance assertion about a trigger while its popup is open has to account for the `aria-hidden` sweep. (kobalte: packages/core/src/select/select.test.tsx: "opening > supports controlled open state")
- The touch-open test is the clearest demonstration of the pointer-type branch: a `pointerType: "touch"` pointerdown must NOT open, and the open happens on the later `click`. Testing that needs both a pointer-event shim and a synthetic click. (kobalte: packages/core/src/select/select.test.tsx: "opening > can be opened on touch up")
- Closing asserts `expect(listbox).not.toBeVisible()` on a RETAINED element reference rather than `queryByRole("listbox")` being null. That is how the file sidesteps the `solid-presence` unmount problem: it checks visibility of a still-referenced node instead of absence. Two tests do use `queryByRole("listbox")).toBeNull()` after selection, so the file is inconsistent about which it trusts. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by clicking on the button")
- Keyboard tests fire `keyDown` and `keyUp` as separate events EACH followed by its own `await Promise.resolve()`, so a single key press costs four statements. (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items with the Enter key")
- `onValueChange` assertions use `.toBe(DATA_SOURCE[2])` for single select (IDENTITY on the original object, not a key or a clone) and `.includes(DATA_SOURCE[0])` on an ARRAY for multi-select. So kobalte's select value is the caller's own option object, which matters for reference stability in a reactive system. (kobalte: packages/core/src/select/select.test.tsx: "selection > can select items on press")
- The controlled-clear test is the only place in the repo that drives a controlled prop from a real Solid signal (`createSignal(DATA_SOURCE[1])` read as `value={value()}` inside the render thunk, with an external button calling `setValue(null)`). Everywhere else "controlled" means a static prop that never changes, which tests only that the component ignores its own intent and never that it FOLLOWS a prop change. That is a significant hole across the whole suite and our conformance tests should always drive controlled props from a signal. (kobalte: packages/core/src/select/select.test.tsx: "selection > supports controlled clear selection")
- `installPointerEvent()` IS called here, unlike in tabs and listbox, so the select's press logic does depend on a real `PointerEvent` class. (kobalte: packages/core/src/select/select.test.tsx: "renders correctly")
- `vi.useFakeTimers()` in `beforeEach` and `vi.clearAllTimers()` in `afterEach`, with no `vi.useRealTimers()`. (kobalte: packages/core/src/select/select.test.tsx: "renders correctly")
- Several comments still say `// SelectBase a different option` where "Select" was find-and-replaced into "SelectBase", a fossil of an earlier component name. (kobalte: packages/core/src/select/select.test.tsx: "multi-select > supports multiple defaultValue (uncontrolled)")
- Ported from react-spectrum `@react-spectrum/picker/test/Picker.test.js`. Notably absent even from this large spec: Home/End and PageUp/PageDown inside the listbox, `aria-activedescendant` (kobalte's select moves real DOM focus to options rather than using virtual focus, unlike its combobox), section `role="group"` labelling, positioning and collision handling for the popup content, the `--kb-select-content-transform-origin` CSS variable, scroll-into-view of the focused option, `Select.Arrow`, and RTL behavior for the Left/Right value cycling. (kobalte: packages/core/src/select/select.test.tsx: "selection > move selection on Arrow-Left/Right")

## combobox

Note: `describe("Combobox")` is `describe.skip`, so everything below EXCEPT the
"Combobox filter then click" test is unverified. That one separate top-level describe at
line 3490 is the only combobox test that actually runs.

### Roles and attributes

- Given a fully assembled `Combobox.Root` with `HiddenSelect`, `Label`, `Control`, `Input`, `Trigger`, `Portal`, `Content` and `Listbox`, when rendered, then the root is `role="group"` and an `HTMLDivElement`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "renders correctly")
- Given a closed combobox, when the input is inspected, then it carries `aria-autocomplete="list"` and has NEITHER `aria-controls` NOR `aria-activedescendant`, and is not disabled. (kobalte: packages/core/src/combobox/combobox.test.tsx: "renders correctly")
- Given a `Combobox.Trigger` next to the input, when inspected, then the trigger carries `tabindex="-1"` and `aria-haspopup="listbox"`. The trigger is deliberately OUT of the tab order because the input is the tab stop, which is the opposite of `Select.Trigger`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "renders correctly")
- Given an open combobox, when inspected, then the INPUT (not the trigger) carries `aria-expanded="true"` and `aria-controls` equal to the listbox's id. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can be opened on mouse down")
- Given a combobox closed again, when inspected, then `aria-expanded` is `"false"` and `aria-controls` is removed. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > can be closed by clicking on the button")
- Given `multiple`, when the listbox opens, then it carries `aria-multiselectable="true"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "multi-select > supports selecting multiple options")
- Given a disabled option, when the listbox opens, then it carries `aria-disabled="true"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > skips disabled items")
- Given a selected option, when the listbox opens, then it carries `aria-selected="true"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > supports controlled selection")
- Given a sectioned source with string ids and string-based mapping, when the listbox opens, then the flattened options carry `data-key` of `"1"`, `"2"`, `"3"` and only the disabled one carries `data-disabled`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports string based option mapping for object options with string keys")
- Given the same mapping via functions, when the listbox opens, then the result is identical. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports function based option mapping for object options with string keys")
- Given a sectioned source with NUMBER ids and string-based mapping, when the listbox opens, then `data-key` is the stringified number. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports string based option mapping for object options with number keys")
- Given number ids with function-based mapping, when the listbox opens, then the same holds. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports function based option mapping for object options with number keys")
- Given `options={["One","Two","Three"]}` and no mapping props, when the listbox opens, then each `data-key` is the string itself. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports string options without mapping")
- Given a string array with identity mapping and `optionDisabled={(o) => o === "Two"}`, when the listbox opens, then only "Two" is disabled. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports function based option mapping for string options")
- Given `options={[1, 2, 3]}` with no mapping, when the listbox opens, then the number options render with stringified `data-key`s. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports number options without mapping")
- Given a number array with function mapping, when the listbox opens, then the same holds. (kobalte: packages/core/src/combobox/combobox.test.tsx: "option mapping > supports function based option mapping for number options")

### Keyboard

- Given a closed combobox, when ArrowDown is pressed on the input, then the listbox opens, `onOpenChange` fires once with `(true, "manual")`, and the input's `aria-activedescendant` points at the FIRST item's id. Focus never leaves the input; the combobox uses VIRTUAL focus. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can be opened on ArrowDown key down and virtual focuses the first item")
- Given a closed combobox, when ArrowUp is pressed on the input, then the listbox opens and `aria-activedescendant` points at the LAST item. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can be opened on ArrowUp key down and virtual focuses the last item")
- Given an open combobox with the first item virtually focused, when ArrowDown is pressed twice then ArrowUp once, then `aria-activedescendant` walks first to second to third and back to second, all while DOM focus stays on the input. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can change item focus with arrow keys")
- Given an open combobox, when Escape is pressed on the input, then the listbox closes, `aria-expanded` becomes `"false"`, `aria-controls` is removed, `onOpenChange` fires with `(false, "manual")`, and focus stays on the input. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > can be closed by pressing the Escape key")
- Given a combobox opened with ArrowUp so the last item is active, when ArrowUp then Enter are pressed, then the SECOND item is selected, `onValueChange` fires once with it, the listbox closes, and the input's VALUE becomes "Two". (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > can select items with the Enter key")
- Given an open listbox whose second option is disabled, when ArrowDown is pressed twice, then `aria-activedescendant` lands on the THIRD option, so virtual focus skips disabled options. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > skips disabled items")
- Given a combobox whose listbox is ALREADY CLOSED and which has a selected value, when Escape is pressed again, then `onValueChange` fires a SECOND time and the input's value becomes the empty string. So Escape on a closed combobox CLEARS the selection, while Escape on an open one only closes. That two-stage Escape is subtle and worth copying deliberately. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > clear selection on escape when listbox is not visible")
- Given a `disabled` combobox, when Space is pressed and released on the trigger, then nothing opens, `onOpenChange` is never called, `aria-expanded` stays `"false"`, and the trigger does not receive focus. (kobalte: packages/core/src/combobox/combobox.test.tsx: "disabled > does not open on Space key press when disabled is true")

### Pointer

- Given a closed combobox, when a mouse `pointerdown`, `pointerup` and `click` are dispatched on the trigger, then the listbox opens, `onOpenChange` fires once with `(true, "manual")`, and `document.activeElement` is the INPUT. Note that unlike select, combobox needs the trailing `click` even for mouse. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can be opened on mouse down")
- Given a closed combobox, when a TOUCH `pointerdown` is dispatched, then nothing opens; only after the touch `pointerup` and the `click` does the listbox appear, with focus on the input. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can be opened on touch up")
- Given an open combobox, when the trigger is pressed again, then it closes with `onOpenChange` reaching two calls, ending `(false, "manual")`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > can be closed by clicking on the button")
- Given an open combobox, when a pointer press lands outside, then it closes with `onOpenChange` `(false, "manual")`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > can be closed by clicking outside")
- Given an open combobox, when the third option is pressed, then `onValueChange` fires once with a value DEEP-EQUAL to the third data item, the listbox closes, the input's value becomes "Three", and focus is on the input. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > can select items on press")
- Given an open combobox, when a mouse `pointermove` enters the second option, then `aria-activedescendant` moves to it; a following ArrowDown moves it to the third; Enter then selects the third. Hover and arrows share the virtual focus cursor. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > focuses items on hover")
- Given `defaultValue` set and `disallowEmptySelection`, when Enter is pressed on the already-selected option, then `onValueChange` fires once with that same option and the input's value is unchanged. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > does not deselect when pressing an already selected item when 'disallowEmptySelection' is true")
- Given `multiple`, when options one and three are pressed, then both become `aria-selected="true"`, `onValueChange` fires twice, the listbox STAYS VISIBLE, and a `Combobox.Value` render slot shows `"One, Three"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "multi-select > supports selecting multiple options")
- Given `multiple` with `defaultValue` of the first two, when the third is pressed, then `onValueChange` fires once with an array containing all three. (kobalte: packages/core/src/combobox/combobox.test.tsx: "multi-select > supports multiple defaultValue (uncontrolled)")
- Given `multiple` with a fixed `value` of the first two, when the third is pressed, then it stays `aria-selected="false"` and `onValueChange` fires once with an array containing only the third. (kobalte: packages/core/src/combobox/combobox.test.tsx: "multi-select > supports multiple value (controlled)")
- Given `multiple` with the first two selected, when the first is pressed again, then it becomes `aria-selected="false"` and `onValueChange` fires once with an array that excludes it and still includes the second. (kobalte: packages/core/src/combobox/combobox.test.tsx: "multi-select > supports deselection")
- Given a `disabled` combobox, when a mouse press lands on the trigger, then nothing opens and `aria-expanded` stays `"false"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "disabled > does not open on mouse down when disabled is true")
- Given a combobox filtered to three options by typing `"ap"` with `defaultFilter="contains"`, when a mouse `pointerdown` lands on the second visible option ("Grapes"), then the input blurs (because virtual-focus items are not focusable so focus falls to the body with a null `relatedTarget`), and CRITICALLY the input's value must remain `"ap"` rather than resetting. If the blur reset the value, the filtered collection would be rebuilt with all five options and the item under the pointer would be replaced before `pointerup` landed, so the user would select the wrong row. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- Given that same in-progress press, when `pointerup` and `click` follow on the option, then `onValueChange` fires exactly once with `"Grapes"` and the input's value becomes `"Grapes"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")

### Focus management

- Given a combobox opened by ANY means, mouse or keyboard, when inspected, then `document.activeElement` is always the input and item focus is expressed only through `aria-activedescendant`. This is the fundamental difference from select, which moves real DOM focus onto options. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > can be opened on mouse down")
- Given a combobox closed by selecting an item, when the restore-focus rAF runs, then focus is on the input. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > can select items on press")
- Given a `Combobox.HiddenSelect`, when inspected, then it contains a hidden `role="textbox"` with `tabIndex="0"`, inline style `font-size: 16px;`, and a parent with `aria-hidden="true"`; focusing it moves focus to the real input and flips its own `tabIndex` to `"-1"`, and blurring the input restores `"0"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "autofill > should have a hidden input to marshall focus to the combobox input")

### State and controlled/uncontrolled

- Given `Combobox.Root open`, when rendered, then the listbox is visible and `onOpenChange` has not been called. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > supports controlled open state")
- Given `defaultOpen`, when rendered, then the listbox is visible and `onOpenChange` has not been called. (kobalte: packages/core/src/combobox/combobox.test.tsx: "opening > supports default open state")
- Given `Combobox.Root open` with a fixed prop, when Escape is pressed, then the listbox remains visible while `onOpenChange` fires once with `(false, "focus")`. Note the REASON is `"focus"` here and `"manual"` for pointer and Escape-on-open paths, so `onOpenChange` carries a second argument describing WHY. That reason channel does not exist on select. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > does not close in controlled open state")
- Given `defaultOpen`, when Escape is pressed, then the listbox closes and `onOpenChange` fires once with `(false, "focus")`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > closes in default open state")
- Given a fixed `value` of the second item, when the first is selected with Enter, then `onValueChange` fires once with the first item but the input's value stays "Two". (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > supports controlled selection")
- Given `defaultValue` of the second item, when the first is selected, then the input's value becomes "One". (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > supports default selection")
- Given a combobox where an item was selected and the listbox reopened, when Escape closes the listbox, then `onValueChange` is still at one call and the input's value is unchanged, so closing without picking preserves the selection. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > does not clear selection on escape closing the listbox")

### Forms

- Given `Combobox.HiddenSelect autocomplete="address-level1"`, when rendered, then the hidden select carries `tabIndex="-1"` and that autocomplete value, holds four `role="option"` children (a leading empty one plus one per item), and a `change` to `"FR"` fires `onValueChange` once with the full option and sets the input's value to "France". (kobalte: packages/core/src/combobox/combobox.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given `Combobox.Root disabled`, when rendered, then the hidden proxy control is disabled. (kobalte: packages/core/src/combobox/combobox.test.tsx: "disabled > disables the hidden select when disabled is true")
- Given `Combobox.Root name="test"` with no value in a `<form>`, when submitted, then the `FormData` entry for `test` is the empty string. (kobalte: packages/core/src/combobox/combobox.test.tsx: "form > Should submit empty option by default")
- Given `Combobox.Root name="test" defaultValue={DATA_SOURCE[0]}`, when submitted, then the `FormData` entry for `test` is `"1"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "form > Should submit default option")

### Accessibility tooling

- Given a `Combobox.Label`, when rendered, then the input's `aria-labelledby` is JUST the label's id, with no value element folded in (unlike select, whose trigger composes label plus value). (kobalte: packages/core/src/combobox/combobox.test.tsx: "labeling > supports labeling with a visible label")
- Given a visible label and an open listbox, when inspected, then the LISTBOX's `aria-labelledby` is `"<labelId> <listboxId>"`, self-referencing the listbox. (kobalte: packages/core/src/combobox/combobox.test.tsx: "labeling > supports labeling with a visible label")
- Given `Combobox.Input aria-labelledby="foo"`, when rendered, then the input's `aria-labelledby` is exactly `"foo"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "labeling > supports labeling via aria-labelledby")
- Given `Combobox.Input aria-label="bar" aria-labelledby="foo"`, when rendered, then the input keeps `aria-label="bar"` and its `aria-labelledby` is `"foo <inputId>"`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "labeling > supports labeling via aria-label and aria-labelledby")
- Given a `Combobox.Description`, when rendered, then it has an `id` and the input's `aria-describedby` points at it. (kobalte: packages/core/src/combobox/combobox.test.tsx: "help text > supports description")
- Given a `Combobox.ErrorMessage` on an invalid combobox, when rendered, then it has an `id` and the input's `aria-describedby` points at it. (kobalte: packages/core/src/combobox/combobox.test.tsx: "help text > supports error message")

### Notes and edge cases

- `describe.skip("Combobox", ...)` at line 30, with the same `// Skipped: jsdom stub for pointerEvent issue with vitest` comment as select. Everything from "renders correctly" through the `form` describe is dead. (kobalte: packages/core/src/combobox/combobox.test.tsx: "renders correctly")
- The one LIVE combobox test lives in a SEPARATE top-level `describe("Combobox filter then click")` added after the skipped block, and it is a regression pin for the filter-then-click bug. Its own comments spell out the mechanism better than any doc: virtual-focus items are not focusable, so a pointerdown on an option blurs the input with a null `relatedTarget`; if blur resets the input text the filtered collection rebuilds mid-press and the row under the cursor changes identity before `pointerup`. The fix is to suppress the blur-reset while a pointer press is in progress over the content. This is a MUST-HAVE test for any filtering combobox and it is the single most valuable test in the whole kobalte repo. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- That live test needs TWO consecutive `await Promise.resolve()` calls after `fireEvent.input`, then `vi.runAllTimers()`, before the filtered listbox is queryable. A single flush is not enough because the filter runs through its own derived computation before the collection rebuild. Doubled flushes appear nowhere else in the repo and are a strong hint that our suite needs an explicit "settle" helper rather than counting microtasks by hand. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- The live test is also the ONLY place in the repo that calls `vi.useRealTimers()` in its `afterEach`, so it is the only test that cleans up fake timers properly. With `isolate: false` in the vitest config, every other file leaks its fake timers to whatever runs next. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- The live test queries with `within(document.body).getByRole("listbox")` because the content is portalled outside the testing-library container. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- The skipped suite installs the same `global.structuredClone = (val) => JSON.parse(JSON.stringify(val))` polyfill as the search file, with the same "kind of ^^'" comment. (kobalte: packages/core/src/combobox/combobox.test.tsx: "renders correctly")
- `onValueChange` assertions here use `.toStrictEqual(DATA_SOURCE[2])` (deep equality) where select uses `.toBe(...)` (identity). That difference is almost certainly because the `structuredClone` polyfill breaks object identity in the combobox's filtering path, which is worth knowing: a filtering collection may not preserve option identity. (kobalte: packages/core/src/combobox/combobox.test.tsx: "selection > can select items on press")
- `onOpenChange` receives TWO arguments, `(isOpen, reason)`, with reasons `"manual"` and `"focus"` observed. Nothing tests the other reasons the implementation likely emits (input change, item selection), and select's `onOpenChange` takes only one argument, so the two components disagree. (kobalte: packages/core/src/combobox/combobox.test.tsx: "closing > does not close in controlled open state")
- The `multi-select` tests read the display value from a `data-testid="value"` element rather than the input, because in multi-select mode the input is a filter field and cannot also display the selection. (kobalte: packages/core/src/combobox/combobox.test.tsx: "multi-select > supports selecting multiple options")
- Ported from react-spectrum `@react-spectrum/picker/test/Picker.test.js`. Absent from even this large spec: filtering itself (except in the one live test), `defaultFilter` variants (`startsWith`, `equals`), `triggerMode` (`focus`, `manual`, `input`), the async/loading collection state, `allowsCustomValue`, `Combobox.Arrow`, `aria-activedescendant` scroll-into-view of the active option, Home/End and Page keys, and any RTL behavior. (kobalte: packages/core/src/combobox/combobox.test.tsx: "renders correctly")

## listbox

### Roles and attributes

- Given `Listbox.Root` with three options and `selectionMode="single"`, when rendered, then the root exposes `role="listbox"` and there are exactly three `role="option"` children. (kobalte: packages/core/src/listbox/listbox.test.tsx: "renders properly")
- Given three unselected, enabled options, when inspected, then EVERY option carries a `tabindex`, `aria-selected="false"` and `aria-disabled="false"`. Both aria states are rendered explicitly as `"false"` rather than omitted, which differs from how kobalte handles `aria-disabled` on `RadioGroup.Root`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "renders properly")
- Given `selectionMode="multiple"`, when rendered, then the listbox carries `aria-multiselectable="true"`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports multi selection > supports selecting multiple options")
- Given options mapped with `optionValue="id"`, when rendered, then each option carries `data-key` set to that id (`"1"`, `"2"`, `"3"`), so `data-key` is the option's identity in the DOM. (kobalte: packages/core/src/listbox/listbox.test.tsx: "option mapping > supports string based option mapping for object options")
- Given an option whose mapped `disabled` is true, when rendered, then it carries `data-disabled` and its siblings do not. (kobalte: packages/core/src/listbox/listbox.test.tsx: "option mapping > supports string based option mapping for object options")
- Given the selected option in single-select mode, when inspected, then it has `aria-selected="true"` AND `tabindex="0"`, so selection and the roving tab stop coincide. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports defaultValue (uncontrolled)")
- Given an option whose mapped `disabled` is true, when inspected, then it carries `aria-disabled="true"`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports disabled options")
- Given `Listbox.Root aria-label="Test"`, when rendered, then the listbox carries that `aria-label`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports aria-label")

### Keyboard

- Given a focused listbox with the first option active, when ArrowDown is pressed on the LISTBOX, then focus moves to the second option; ArrowUp returns it to the first. Arrow keys are handled on the listbox container, not on the option. (kobalte: packages/core/src/listbox/listbox.test.tsx: "allows user to change option focus via up/down arrow keys")
- Given `shouldFocusWrap` and the FIRST option focused, when ArrowUp is pressed, then focus wraps to the LAST option; ArrowDown from the last wraps back to the first. (kobalte: packages/core/src/listbox/listbox.test.tsx: "wraps focus from first to last/last to first option if up/down arrow is pressed if shouldFocusWrap is true")
- Given a controlled single-select listbox, when Enter is pressed on a different option, then `onChange` fires once with a Set containing that option's key, while the DOM selection does not move. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports value (controlled)")
- Given an uncontrolled single-select listbox, when Space is pressed on the third option, then it becomes `aria-selected="true"` and `onChange` fires once with a Set containing `"3"`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports using space key to change option selection")
- Given a listbox whose SECOND option is disabled and the first is focused, when ArrowDown is pressed, then focus lands on the THIRD option, so keyboard navigation skips disabled options. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports disabled options")
- Given a focused listbox, when the letter `T` is typed, then focus jumps to the option whose text starts with T ("Two"); typing `O` then jumps to "One". So typeahead matches on the first letter and each keystroke starts a fresh search after the timeout. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports type to select")
- Given a focused listbox, when `O` is typed and the typeahead timeout elapses, then focus is on "One"; typing `O` again keeps focus on "One" rather than advancing, so the search buffer resets rather than cycling matches. (kobalte: packages/core/src/listbox/listbox.test.tsx: "resets the search text after a timeout")

### Pointer

- Given an uncontrolled single-select listbox, when `pointerdown` then `pointerup` are fired on the third option, then it becomes `aria-selected="true"` and `onChange` fires once with a Set containing `"3"`. Selection commits on POINTERUP for a listbox, unlike toggle-group which commits on pointerdown. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports using pointer up to change option selection")
- Given a disabled option, when `pointerdown` then `pointerup` are fired on it, then `onChange` is never called. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports disabled options")
- Given `selectionMode="multiple"`, when option 1 then option 3 are each pointer-selected, then BOTH are `aria-selected="true"` and `onChange` has fired twice, with the first call's Set containing `"1"` and the second's containing `"3"`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports multi selection > supports selecting multiple options")
- Given `selectionMode="multiple"` with `defaultValue` of `{"1","2"}`, when the third option is pointer-selected, then it becomes selected and `onChange` fires once with a Set containing all three keys, so multi-select ADDS to the existing set. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports multi selection > supports multiple defaultValue (uncontrolled)")
- Given `selectionMode="multiple"` with a fixed `value` of `{"1","2"}`, when the third option is pointer-selected, then it stays `aria-selected="false"` and `onChange` fires once with a Set containing `"3"`. Note the controlled multi-select change payload contains ONLY the newly clicked key, not the merged set, which contradicts the uncontrolled behavior above. That inconsistency is worth deciding deliberately in our own API. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports multi selection > supports multiple value (controlled)")
- Given `selectionMode="multiple"` with `defaultValue` of `{"1","2"}`, when the FIRST (already selected) option is pointer-clicked, then it becomes `aria-selected="false"` and `onChange` fires once with a Set containing only `"2"`, so clicking a selected option in multi-select deselects it. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports multi selection > supports deselection")
- Given `selectionMode="multiple"` with two selected options and a third disabled option, when the disabled option is pointer-clicked, then `onChange` is not called and the existing two stay selected. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports multi selection > supports disabled options")
- Given `selectionMode="single"` with `disallowEmptySelection={false}` and `defaultValue` of `{"2"}`, when the selected option is pointer-clicked, then it becomes `aria-selected="false"` and `onChange` fires once with an EMPTY Set, so single-select can be cleared when empty selection is allowed. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports empty selection when disallowEmptySelection is false")

### Focus management

- Given a listbox with nothing selected, when `focusin` fires on the listbox, then DOM focus moves to the FIRST option, so focusing the container delegates focus to an option. (kobalte: packages/core/src/listbox/listbox.test.tsx: "allows user to change option focus via up/down arrow keys")
- Given `defaultValue` of `{"2"}`, when `focusin` fires on the listbox, then focus lands on the SELECTED option (the second), not the first. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports defaultValue (uncontrolled)")
- Given a controlled listbox with `value` of `{"2"}`, when `focusin` fires, then focus lands on the second option and it has `tabindex="0"`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports value (controlled)")
- Given a listbox whose second option is disabled, when `focusin` fires, then focus lands on the first (enabled) option. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports disabled options")

### State and controlled/uncontrolled

- Given `defaultValue` as a `Set(["2"])`, when rendered, then the matching option is `aria-selected="true"`. Selection values are JS `Set`s, and `onChange` receives a `Set` too (assertions use `.has(key)` and `.size`). (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports defaultValue (uncontrolled)")
- Given a fixed `value` of `Set(["2"])`, when Enter selects a different option, then the DOM selection does not change, so a controlled listbox does not drift. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports value (controlled)")

### Animation and presence

- Given a `Listbox.ItemIndicator` with no `forceMount` and nothing selected, when rendered, then no indicator is in the DOM. (kobalte: packages/core/src/listbox/listbox.test.tsx: "item indicator > should not display item indicator by default")
- Given `value={["2"]}` and a `Listbox.ItemIndicator`, when rendered, then the indicator for the selected item IS in the DOM. Note the value here is a plain ARRAY rather than a `Set`, so the component accepts both. (kobalte: packages/core/src/listbox/listbox.test.tsx: "item indicator > should display item indicator when 'selected'")
- Given `Listbox.ItemIndicator forceMount` with nothing selected, when rendered, then EVERY option's indicator is in the DOM. (kobalte: packages/core/src/listbox/listbox.test.tsx: "item indicator > should display item indicator when 'forceMount'")

### Accessibility tooling

- Given options declared via an `options` array with `optionValue`, `optionTextValue`, `optionDisabled` and `optionGroupChildren` given as STRING property names, when rendered, then the three nested items are flattened into three `role="option"` elements with the right text, `data-key` and `data-disabled`. (kobalte: packages/core/src/listbox/listbox.test.tsx: "option mapping > supports string based option mapping for object options")
- Given the same mapping props given as FUNCTIONS instead of strings, when rendered, then the result is identical, so both forms are supported. (kobalte: packages/core/src/listbox/listbox.test.tsx: "option mapping > supports function based option mapping for object options")
- Given a flat array of STRINGS as `options` with identity mapping functions, when rendered, then each option's `data-key` is the string itself and `optionDisabled` can select one by value. (kobalte: packages/core/src/listbox/listbox.test.tsx: "option mapping > supports function based option mapping for string options")
- Given a `Listbox.Item` with an explicit `aria-label="Item"`, when rendered, then the option has that `aria-label` and has NEITHER `aria-labelledby` NOR `aria-describedby`, so an explicit label suppresses the derived associations entirely. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports aria-label on options")
- Given a `Listbox.Item` containing a `Listbox.ItemLabel` and a `Listbox.ItemDescription`, when rendered, then the option's `aria-labelledby` points at the label and its `aria-describedby` points at the description. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports complex options with aria-labelledby and aria-describedby")

### Notes and edge cases

- `beforeEach` both installs fake timers AND stubs `window.requestAnimationFrame` with `vi.spyOn(...).mockImplementation(cb => { cb(0); return 0; })`, making rAF synchronous. `afterEach` restores it. The listbox's focus and scroll-into-view logic runs in a rAF, and under fake timers rAF would otherwise never fire. This synchronous-rAF stub is the single most important infrastructure trick in the repo for collection components and our suite will need the equivalent. (kobalte: packages/core/src/listbox/listbox.test.tsx: "renders properly")
- Typeahead tests need THREE things in sequence: `fireEvent.keyDown`, then `vi.runAllTimers()` to fire the typeahead debounce, then `await Promise.resolve()` to let Solid apply the focus change. Omitting any one of them fails. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports type to select")
- Focus is entered by `fireEvent.focusIn(listbox)` rather than `.focus()` or `user.tab()`, which is why these tests are NOT `skipIf(GITHUB_ACTIONS)` while the equivalents in tabs and accordion are. Dispatching `focusin` directly is the reliable way to test focus delegation in jsdom, and it is the technique our suite should copy. (kobalte: packages/core/src/listbox/listbox.test.tsx: "allows user to change option focus via up/down arrow keys")
- Every pointer selection needs FOUR steps: `pointerdown`, flush, `pointerup`, flush. Two separate `await Promise.resolve()` calls, one per event. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports using pointer up to change option selection")
- `createPointerEvent` is imported but `installPointerEvent()` is NOT called in this file, so the plain-Event shim suffices for the listbox's press logic. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports using pointer up to change option selection")
- Two tests call `vi.runAllTimers()` immediately after `render` with no event at all ("supports aria-label on options" and "supports complex options with aria-labelledby and aria-describedby"), because option registration into the collection is itself deferred. So even a pure attribute assertion on a collection item may need a timer flush. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports aria-label on options")
- The `Listbox.Root` API here is render-prop driven (`options`, `renderItem`, `renderSection`) rather than compound-children driven, which is a notably different collection model from the JSX-children approach in accordion and tabs. Two collection models in one library. (kobalte: packages/core/src/listbox/listbox.test.tsx: "renders properly")
- `afterEach` calls `window.requestAnimationFrame.mockRestore()` with a `// @ts-ignore`, and `vi.clearAllTimers()`, but never `vi.useRealTimers()`. Since this repo runs vitest with `isolate: false`, leaked fake timers across files are a real risk. (kobalte: packages/core/src/listbox/listbox.test.tsx: "renders properly")
- Ported from react-spectrum `@react-spectrum/listbox/test/Listbox.test.js`. Dropped: virtualized-list scrolling and `scrollIntoView` assertions, Home/End and PageUp/PageDown navigation, Shift+Arrow and Ctrl+A range and select-all behavior, `selectionBehavior="replace"` versus `"toggle"`, section `role="group"` and `aria-labelledby` on section headings (sections are rendered in the mapping tests but never asserted on), drag-and-drop, and all `onAction` behavior. Home/End plus range selection is a substantial gap for a listbox. (kobalte: packages/core/src/listbox/listbox.test.tsx: "allows user to change option focus via up/down arrow keys")
- There are no skipped or todo tests in this file, and notably the ItemIndicator tests never attempt a negative presence assertion after deselection, sidestepping the `solid-presence` problem rather than hitting it. (kobalte: packages/core/src/listbox/listbox.test.tsx: "item indicator > should display item indicator when 'selected'")

## search

### Roles and attributes

- Given a fully assembled `Search.Root` with `Label`, `Control`, `Input`, `Portal`, `Content` and `Listbox`, when rendered, then the root exposes `role="group"` and is an `HTMLDivElement`. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- Given a `Search.Input` with a `placeholder` prop on the ROOT, when rendered, then the element found by `getByRole("combobox")` is the same element found by `getByPlaceholderText`, so the root's placeholder lands on the input. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- Given a closed search, when the input is inspected, then it carries `aria-autocomplete="list"` and has NEITHER `aria-controls` NOR `aria-activedescendant`, so those two are added only while the listbox is open. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- Given a search with no `disabled` prop, when rendered, then the input is not disabled. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- Given a `Search.Label`, when rendered, then it is visible. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")

### Focus management

- Given a `Search.HiddenSelect`, when inspected, then it contains a hidden `role="textbox"` with `tabIndex="0"`, an inline style of exactly `font-size: 16px;`, and a parent carrying `aria-hidden="true"`. The 16px font size is the iOS threshold below which Safari zooms on focus, so the hidden focus-proxy must not trigger that zoom. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden input to marshall focus to the Search input")
- Given the hidden proxy input, when it receives focus, then `document.activeElement` becomes the real combobox input AND the proxy's `tabIndex` flips to `"-1"` so a second Tab moves past it rather than bouncing back. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden input to marshall focus to the Search input")
- Given focus has been marshalled to the real input, when the input blurs, then the proxy's `tabIndex` returns to `"0"`, re-arming the trap for the next Tab. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden input to marshall focus to the Search input")

### Forms

- Given `Search.HiddenSelect autocomplete="address-level1"`, when rendered, then the hidden native select carries `tabIndex="-1"` and that `autocomplete` value, so browser autofill can target it while it stays out of the tab order. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given three data options, when the hidden select is inspected, then it holds FOUR `role="option"` children: one leading empty option plus one per data item, each carrying the item's label. The extra blank option is what lets the field represent "nothing selected" to the form. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given the hidden select, when a `change` event sets its value to `"FR"`, then `onChange` fires once with the FULL option object (deep-equal to the data source entry, not just the key) and the visible input's value becomes `"France"`. So browser autofill on the hidden select drives the visible field. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Given `Search.Root disabled` with a `HiddenSelect`, when rendered, then the hidden control is disabled too, so a disabled search cannot be autofilled. (kobalte: packages/core/src/search/search.test.tsx: "disabled > disables the hidden select when disabled is true")
- Given a `Search.Root name="test"` with no value inside a `<form>`, when the form is submitted, then the `FormData` entry for `test` is the EMPTY STRING rather than absent, so the field always contributes a key. (kobalte: packages/core/src/search/search.test.tsx: "form > Should submit empty option by default")
- Given `Search.Root name="test" defaultValue={DATA_SOURCE[0]}`, when the form is submitted, then the `FormData` entry for `test` is `"1"`, the option's `optionValue` key, not its label or the whole object. (kobalte: packages/core/src/search/search.test.tsx: "form > Should submit default option")

### Accessibility tooling

- Given a `Search.Description`, when rendered, then the description has an `id` and the input's `aria-describedby` points at it. (kobalte: packages/core/src/search/search.test.tsx: "help text > supports description")

### Notes and edge cases

- The file's own debouncer utility is unit-tested directly: `DebouncerTimeout()` with `setDebounceMillisecond(1000)` does not call the callback immediately; a second `debounce` at 500ms still does not fire it; advancing another 1000ms fires it exactly once; advancing 500ms more fires nothing; advancing a further 1000ms fires it a second time. So the debouncer is trailing-edge and each new call restarts the window. (kobalte: packages/core/src/search/search.test.tsx: "debounce")
- There is a stray comment `// Skipped: jsdom stub for pointerEvent issue with vitest` directly above `describe("Search", ...)`, but the describe is NOT actually skipped. The comment is a leftover from when it was, and it explains why the suite contains no open-the-listbox, keyboard-navigation or item-selection tests at all: those were removed rather than skipped. The entire interactive surface of the search component (typing to filter, arrow keys through results, Enter to pick, Escape to close, debounced query firing) is untested. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- The file installs a `structuredClone` polyfill at describe-body level with `global.structuredClone = (val) => JSON.parse(JSON.stringify(val))` and the comment "structuredClone polyfill, kind of ^^'". jsdom in this vitest version lacks `structuredClone` and the component uses it, so any environment running our suite needs it. A JSON round-trip is not a faithful polyfill (it loses Dates, Maps, Sets and undefined), which is a latent source of false passes. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- Hidden elements are queried with the `{ hidden: true }` option (`getAllByRole("listbox", { hidden: true })`, `getByRole("textbox", { hidden: true })`), which is required because their ancestor has `aria-hidden="true"` and testing-library excludes them by default. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden select element for form autocomplete")
- Form submission is driven by `fireEvent.submit(form)` plus one `await Promise.resolve()`, with the handler reading `new FormData(e.currentTarget)`. That sidesteps the `requestSubmit` gap that forced the text-field skip. (kobalte: packages/core/src/search/search.test.tsx: "form > Should submit empty option by default")
- `installPointerEvent()` and `vi.useFakeTimers()` are both set up, but no test in the file fires a pointer event and only the debouncer test advances timers. (kobalte: packages/core/src/search/search.test.tsx: "debounce")
- The attribution header points at react-spectrum `@react-spectrum/picker/test/Picker.test.js`, the same source as select and combobox, but almost nothing from it survives here: this file is really about the hidden-select autofill and form plumbing. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- `onValueChange` is a shared module-level spy reset by `vi.clearAllMocks()`. (kobalte: packages/core/src/search/search.test.tsx: "autofill > should have a hidden select element for form autocomplete")

## text-field

### Roles and attributes

- Given a `TextField.Input`, when rendered, then it exposes `role="textbox"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "can have a default value")
- Given `validationState="invalid"`, when rendered, then the input carries `aria-invalid="true"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "sets 'aria-invalid' on input when 'validationState=invalid'")
- Given a plain `TextField.Root`, when rendered, then the input has none of `required`, `disabled` or `readonly`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "input should not have 'required', 'disabled' or 'readonly' attributes by default")
- Given `required`, when rendered, then the input carries both native `required` and `aria-required="true"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "sets 'required' and 'aria-required' on input when 'isRequired' is true")
- Given `disabled`, when rendered, then the input carries both native `disabled` and `aria-disabled="true"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "sets 'disabled' and 'aria-disabled' on input when 'isDisabled' is true")
- Given `readOnly`, when rendered, then the input carries both native `readonly` and `aria-readonly="true"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "sets 'readonly' and 'aria-readonly' on input when 'isReadOnly' is true")
- Given a plain `TextField.Root`, when rendered, then neither the root nor the input has any of `data-valid`, `data-invalid`, `data-required`, `data-disabled`, `data-readonly`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should not have form control 'data-*' attributes by default")
- Given `validationState="valid"`, when rendered, then `data-valid` is on both the root and the input. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'data-valid' attribute when valid")
- Given `validationState="invalid"`, when rendered, then `data-invalid` is on both the root and the input. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'data-invalid' attribute when invalid")
- Given `required`, when rendered, then `data-required` is on both the root and the input. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'data-required' attribute when required")
- Given `disabled`, when rendered, then `data-disabled` is on both the root and the input. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'data-disabled' attribute when disabled")
- Given `readOnly`, when rendered, then `data-readonly` is on both the root and the input. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'data-readonly' attribute when readonly")
- Given a `TextField.TextArea` with `submitOnEnter`, when rendered, then it carries `aria-multiline="false"`, telling assistive tech that Enter submits rather than inserting a newline. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'aria-multiline' set to false on textarea when 'submitOnEnter' is true")
- Given a `TextField.TextArea` without `submitOnEnter`, when rendered, then `aria-multiline` is absent entirely rather than set to `"true"`, because a textarea is natively multiline. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should not have 'aria-multiline' on textarea when 'submitOnEnter' is false")

### Keyboard

- Given a `TextField.TextArea` with `submitOnEnter` inside a `<form>`, when the user types Shift+Enter, then the form is NOT submitted, so Shift+Enter stays a newline. (kobalte: packages/core/src/text-field/text-field.test.tsx: "form is not submitted when 'submitOnEnter' is true and the user presses shift + enter at the same time")
- Given a `TextField.TextArea` WITHOUT `submitOnEnter` inside a `<form>`, when the user presses Enter, then the form is not submitted. (kobalte: packages/core/src/text-field/text-field.test.tsx: "form is not submitted when 'submitOnEnter' is not set and user presses the enter key")

### State and controlled/uncontrolled

- Given `defaultValue="cat"`, when rendered, then the input shows `"cat"` and `onChange` has not been called. (kobalte: packages/core/src/text-field/text-field.test.tsx: "can have a default value")
- Given `defaultValue="cat"`, when the user types `"s"`, then the input shows `"cats"` and `onChange` receives `"cats"` (the whole new value, not the keystroke). (kobalte: packages/core/src/text-field/text-field.test.tsx: "can have a default value")
- Given a fixed `value="cat"` prop, when the user types `"s"`, then `onChange` receives `"cats"` but the input's value snaps back to `"cat"`, so a controlled text field never drifts from its prop. (kobalte: packages/core/src/text-field/text-field.test.tsx: "value can be controlled")

### Forms

- Given `TextField.Root name="favorite-pet"`, when rendered, then the input carries `name="favorite-pet"`. Unlike number-field there is no separate hidden input; the visible input IS the form field. (kobalte: packages/core/src/text-field/text-field.test.tsx: "name can be controlled")

### Accessibility tooling

- Given a `TextField.Label`, when rendered, then the input gets `aria-labelledby` pointing at it, the label is an `HTMLLabelElement`, and its `for` points at the input's id. (kobalte: packages/core/src/text-field/text-field.test.tsx: "supports visible label")
- Given only `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is exactly `"foo"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "supports 'aria-labelledby'")
- Given a visible label and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId>"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should combine 'aria-labelledby' if visible label is also provided")
- Given only `aria-label="My Favorite Pet"`, when rendered, then it is passed through. (kobalte: packages/core/src/text-field/text-field.test.tsx: "supports 'aria-label'")
- Given a visible label, `aria-label="bar"` and `aria-labelledby="foo"`, when rendered, then `aria-labelledby` is `"foo <labelId> <inputId>"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should combine 'aria-labelledby' if visible label and 'aria-label' is also provided")
- Given a `TextField.Description`, when rendered, then the input gets `aria-describedby` pointing at its distinct id. (kobalte: packages/core/src/text-field/text-field.test.tsx: "supports visible description")
- Given only `aria-describedby="foo"`, when rendered, then it is passed through unchanged. (kobalte: packages/core/src/text-field/text-field.test.tsx: "supports 'aria-describedby'")
- Given a description and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> foo"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should combine 'aria-describedby' if visible description")
- Given `validationState="invalid"` and a `TextField.ErrorMessage`, when rendered, then the input is `aria-describedby` the error message's distinct id. (kobalte: packages/core/src/text-field/text-field.test.tsx: "supports visible error message when invalid")
- Given an error message but no invalid state, when rendered, then `aria-describedby` is absent. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should not be described by error message when not invalid")
- Given `validationState="invalid"`, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<errorMessageId> foo"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should combine 'aria-describedby' if visible error message when invalid")
- Given `validationState="invalid"`, a description, an error message and `aria-describedby="foo"`, when rendered, then `aria-describedby` is `"<descriptionId> <errorMessageId> foo"`. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should combine 'aria-describedby' if visible description and error message when invalid")

### Notes and edge cases

- One test is `it.skip` with an explicit reason comment: `// Skipped: requestSubmit is not implemented` on "form is submitted when 'submitOnEnter' is true and user presses the enter key". jsdom does not implement `HTMLFormElement.requestSubmit`, which is the API the component uses, so the POSITIVE case of Enter-to-submit is untested while both negative cases pass. Our suite either needs a `requestSubmit` polyfill in the environment or a different submit strategy. (kobalte: packages/core/src/text-field/text-field.test.tsx: "form is submitted when 'submitOnEnter' is true and user presses the enter key")
- All typing tests use `await userEvent.type(...)` with no fake timers and no explicit `Promise.resolve()`; awaiting user-event is sufficient to settle Solid's updates. (kobalte: packages/core/src/text-field/text-field.test.tsx: "can have a default value")
- user-event's keyboard DSL is used for modifier combinations: `"{Shift>}enter{/Shift}"` holds Shift across the Enter and `"{enter}"` presses it alone. (kobalte: packages/core/src/text-field/text-field.test.tsx: "form is not submitted when 'submitOnEnter' is true and the user presses shift + enter at the same time")
- `installPointerEvent()` is installed but there is not a single pointer test in the file. (kobalte: packages/core/src/text-field/text-field.test.tsx: "can have a default value")
- No upstream attribution header; kobalte-original. There is no test for `TextField.TextArea` `autoResize`, no test for `maxLength`, no test for placeholder, no test for the input's `type` variants, no focus-management test, and no test that a disabled or readonly field rejects typing (only that the attributes are set). (kobalte: packages/core/src/text-field/text-field.test.tsx: "sets 'disabled' and 'aria-disabled' on input when 'isDisabled' is true")
- The `data-*` sweeps here check exactly two elements (root and input) with an explicit array rather than the regex `getAllByTestId` trick used in checkbox, switch and radio-group. Three different idioms for the same assertion across four files. (kobalte: packages/core/src/text-field/text-field.test.tsx: "should have 'data-valid' attribute when valid")

## progress

### Roles and attributes

- Given a `Progress.Root` with `Label`, `ValueLabel`, `Track` and `Fill` and no value props, when rendered, then the root is `role="progressbar"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="0"` and `aria-valuetext="0%"`, the value label's text is `"0%"`, and `aria-labelledby` resolves to an element containing the label text. (kobalte: packages/core/src/progress/progress.test.tsx: "handles defaults")
- Given `value={30}`, when rendered, then `aria-valuenow` is `"30"` and `aria-valuetext` is `"30%"` with min and max still 0 and 100. (kobalte: packages/core/src/progress/progress.test.tsx: "should update all fields by value")
- Given `value={-1}` with `minValue={0}`, when rendered, then `aria-valuenow` is clamped to `"0"` and `aria-valuetext` to `"0%"`. (kobalte: packages/core/src/progress/progress.test.tsx: "should clamps values to 'minValue'")
- Given `value={200}` with `maxValue={100}`, when rendered, then `aria-valuenow` is clamped to `"100"` and `aria-valuetext` to `"100%"`. (kobalte: packages/core/src/progress/progress.test.tsx: "should clamps values to 'maxValue'")
- Given `value={0}` with `minValue={-5}` and `maxValue={5}`, when rendered, then `aria-valuenow` is `"0"` but `aria-valuetext` is `"50%"`, so the percentage is computed across the min-to-max RANGE rather than from zero. (kobalte: packages/core/src/progress/progress.test.tsx: "supports negative values")
- Given `indeterminate`, when rendered, then `aria-valuemin` and `aria-valuemax` are still present but `aria-valuenow` and `aria-valuetext` are ABSENT, and the value label is an empty element. (kobalte: packages/core/src/progress/progress.test.tsx: "supports indeterminate state")
- Given `value={30}` with min 0 and max 100, when rendered, then `data-progress="loading"` is present on the root, label, value label, track AND fill. (kobalte: packages/core/src/progress/progress.test.tsx: "data-attributes > should have 'data-progress=loading' attribute when the progress is not complete")
- Given `value={100}` with max 100, when rendered, then `data-progress="complete"` is present on all five parts, so the loading/complete distinction is a value-derived string rather than a boolean. (kobalte: packages/core/src/progress/progress.test.tsx: "data-attributes > should have 'data-progress=complete' attribute when the progress is complete")
- Given no `indeterminate` prop, when rendered, then `data-indeterminate` is absent from all five parts. (kobalte: packages/core/src/progress/progress.test.tsx: "data-attributes > should not have 'data-indeterminate' attribute by default")
- Given `indeterminate`, when rendered, then `data-indeterminate` is present on all five parts. (kobalte: packages/core/src/progress/progress.test.tsx: "data-attributes > should have 'data-indeterminate' attribute when indeterminate")

### Accessibility tooling

- Given `getValueLabel={({ value, max }) => `${value} of ${max} completed`}` with `value={3} maxValue={10}`, when rendered, then BOTH `aria-valuetext` and the visible `Progress.ValueLabel` text are `"3 of 10 completed"`, so one formatter drives both channels and they cannot drift. (kobalte: packages/core/src/progress/progress.test.tsx: "supports custom value label")

### Notes and edge cases

- Every progress test is fully synchronous with no flush, no fake timers and no pointer-event setup, because progress is a pure derived-attribute component with no interaction. This is the cheapest kind of conformance test and there are ten of them, versus zero running tests for select. (kobalte: packages/core/src/progress/progress.test.tsx: "handles defaults")
- The `data-attributes` block uses the `getAllByTestId(/^progress/)` regex sweep to assert one attribute across all five parts at once. (kobalte: packages/core/src/progress/progress.test.tsx: "data-attributes > should have 'data-progress=loading' attribute when the progress is not complete")
- Nothing tests the `--kb-progress-fill-width` CSS custom property that kobalte's `Progress.Fill` sets, so the only part that actually renders the progress visually has no assertion on it. Nothing tests a value CHANGE either (every test renders a static value), so the reactive path is unverified. No skipped or todo tests. (kobalte: packages/core/src/progress/progress.test.tsx: "should update all fields by value")
- Ported from react-spectrum `@react-aria/progress/test/useProgressBar.test.js` plus `@react-spectrum/progress/test/ProgressBar.test.js`. Dropped: the locale-aware percentage formatting tests (React Aria formats via `NumberFormat` and tests a non-English locale), and the "warns when no label is provided" development assertion. (kobalte: packages/core/src/progress/progress.test.tsx: "handles defaults")

## meter

### Roles and attributes

- Given a `Meter.Root` with `Label`, `ValueLabel`, `Track` and `Fill` and no value props, when rendered, then it is `role="meter"` with `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow="0"` and `aria-valuetext="0%"`, the value label reads `"0%"`, and `aria-labelledby` resolves to the label. (kobalte: packages/core/src/meter/meter.test.tsx: "handles defaults")
- Given `value={30}`, when rendered, then `aria-valuenow` is `"30"` and `aria-valuetext` is `"30%"`. (kobalte: packages/core/src/meter/meter.test.tsx: "should update all fields by value")
- Given `value={-1}` with `minValue={0}`, when rendered, then the value is clamped to `"0"` / `"0%"`. (kobalte: packages/core/src/meter/meter.test.tsx: "should clamps values to 'minValue'")
- Given `value={200}` with `maxValue={100}`, when rendered, then the value is clamped to `"100"` / `"100%"`. (kobalte: packages/core/src/meter/meter.test.tsx: "should clamps values to 'maxValue'")
- Given `value={0}` with `minValue={-5}` and `maxValue={5}`, when rendered, then `aria-valuenow` is `"0"` and `aria-valuetext` is `"50%"`. (kobalte: packages/core/src/meter/meter.test.tsx: "supports negative values")

### Accessibility tooling

- Given `getValueLabel` and `value={3} maxValue={10}`, when rendered, then both `aria-valuetext` and the visible value label read `"3 of 10 completed"`. (kobalte: packages/core/src/meter/meter.test.tsx: "supports custom value label")

### Notes and edge cases

- The meter file is the progress file with `role="meter"` substituted and the indeterminate and `data-*` tests removed. A meter has no indeterminate state (it reports a measurement, not a task), which is the one genuine semantic difference, but kobalte also drops the `data-progress` equivalent entirely so a meter exposes no data attributes under test, and its `--kb-meter-fill-width` custom property is never asserted either. (kobalte: packages/core/src/meter/meter.test.tsx: "handles defaults")
- Six tests, all synchronous, no flush, no timers. (kobalte: packages/core/src/meter/meter.test.tsx: "handles defaults")
- Ported from react-spectrum `@react-aria/meter/src/useMeter.ts` plus `@react-spectrum/meter/test/Meter.test.js`. Note the first link points at a SOURCE file rather than a test file, so part of this was derived from implementation rather than ported from tests. Dropped: React Spectrum's `variant` (positive/warning/critical) tests and its locale formatting tests. (kobalte: packages/core/src/meter/meter.test.tsx: "handles defaults")

## pagination

### Roles and attributes

- Given `Pagination.Root count={7}` with an `itemComponent` and an `ellipsisComponent` on page 1, when rendered, then pages 1, 2 and 7 are visible with exactly ONE ellipsis between them, so the window is first-page plus siblings plus ellipsis plus last-page. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Given `count={10}` with an empty `ellipsisComponent`, when rendered on page 1, then pages 1, 2 and 10 are visible, so the first and last pages are always rendered. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correct number of pages")
- Given `count={10} defaultPage={4} siblingCount={2}`, when rendered, then pages 1 through 6 AND page 10 are all visible, so `siblingCount` widens the window symmetrically around the current page. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correct number of siblings")
- Given `count={10} defaultPage={4} showFirst={false} showLast={false}`, when rendered, then pages 3, 4 and 5 are visible while pages 1 and 10 are NOT in the document at all, so the first/last anchors are opt-out. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when hiding first/last")
- Given `count={10} fixedItems page={3}`, when rendered, then pages 1 through 5 and page 10 are visible, so `fixedItems` pads the window to keep the control's width constant. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correct number of siblings with fixedItems=true")
- Given `count={10} fixedItems="no-ellipsis" page={3}`, when rendered, then pages 1 through 4 and page 10 are visible, one fewer page than `fixedItems` alone, so the `"no-ellipsis"` variant counts the ellipsis slot differently. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correct number of siblings with fixedItems=no-ellipsis")

### Pointer

- Given `count={7}` on page 1, when `Pagination.Next` is clicked, then page 3 joins the visible set (1, 2, 3, ellipsis, 7). (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Given the same control advanced to page 3, when Next is clicked, then pages 1 through 4 plus one ellipsis plus 7 are visible. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Given the control advanced to page 4, when Next is clicked, then the visible set becomes 1, ellipsis, 3, 4, 5, ellipsis, 7 with TWO ellipses, so a second ellipsis appears once the window detaches from both ends. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Given the control advanced to page 5, when Next is clicked, then the set becomes 1, ellipsis, 4, 5, 6, 7 and drops back to one ellipsis as the window reaches the right end. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Given the control advanced to page 6, when Next is clicked, then the set becomes 1, ellipsis, 5, 6, 7. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Given the control advanced to page 7 (the last), when Next is clicked, then the set becomes 1, ellipsis, 6, 7 and does not advance past the end. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")

### State and controlled/uncontrolled

- Given `defaultPage={4}` with an `onPageChange` handler, when rendered, then `onPageChange` has NOT been called. (kobalte: packages/core/src/pagination/pagination.test.tsx: "supports default page")
- Given `defaultPage={4}`, when Next is clicked, then `onPageChange` fires once with `5`. (kobalte: packages/core/src/pagination/pagination.test.tsx: "supports default page")
- Given a fixed `page={4}` (controlled) with `onPageChange`, when rendered, then the handler has not been called; when Next is clicked, it fires once with `5`. (kobalte: packages/core/src/pagination/pagination.test.tsx: "supports controlled state")

### Notes and edge cases

- Every `fireEvent.click(next)` in this file is followed IMMEDIATELY by assertions with NO `await Promise.resolve()`, and the tests pass. The page window is a derived computation read during render rather than an attribute patched onto an existing element, so Solid re-renders the `<Pagination.Items />` list synchronously within the click. That is a genuinely useful distinction: STRUCTURAL changes (elements appearing and disappearing) are observable without a flush, while ATTRIBUTE changes on existing elements are not. It explains the inconsistency seen in number-field too. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- The controlled test is misleading: `page={4}` is a static prop, so clicking Next fires `onPageChange(5)` but nothing verifies the rendered window STAYED at page 4. Compare with the equivalent tests in checkbox and select, which do assert the DOM did not move. The controlled contract for pagination is therefore untested. (kobalte: packages/core/src/pagination/pagination.test.tsx: "supports controlled state")
- Nothing tests `role="navigation"` or an `aria-label` on the root, `aria-current="page"` on the active item, `data-current`, `Pagination.Previous`, disabling Previous on page 1 or Next on the last page, `Pagination.First`/`Pagination.Last`, or keyboard navigation. All that is asserted is which page numbers are visible. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correct number of pages")
- No upstream attribution; kobalte-original. No skipped tests, no timers, no pointer-event setup. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")

## breadcrumbs

### Roles and attributes

- Given a bare `Breadcrumbs.Root`, when rendered, then it is `role="navigation"` with `aria-label="Breadcrumbs"`, so the landmark and its default name come for free. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "should have default 'aria-label'")
- Given a `Breadcrumbs.Root` with two `Breadcrumbs.Separator`s and no `separator` prop, when rendered, then each separator renders the text `"/"`. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "should have default separator")
- Given `Breadcrumbs.Root separator=">"`, when rendered, then both separators render `">"`, so the separator is configured once on the root rather than per separator. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "supports custom string separator")
- Given `Breadcrumbs.Root separator={<span>jsx separator</span>}`, when rendered, then both separators render that element, so the separator accepts arbitrary JSX and is instantiated once per `Separator` site. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "supports custom JSX.Element separator")
- Given a `Breadcrumbs.Link current`, when rendered, then it carries `aria-current="page"`. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "Link > should have 'aria-current=page' attribute when is current link")
- Given a `Breadcrumbs.Link current`, when rendered, then it carries `data-current`. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "Link > should have 'data-current' attribute when is current link")
- Given a `Breadcrumbs.Link current`, when rendered, then it ALSO carries `aria-disabled="true"` and `data-disabled`, so the current crumb is automatically non-actionable without the author setting `disabled`. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "Link > should be disabled when is current link")

### Accessibility tooling

- Given `Breadcrumbs.Separator` elements, when rendered, then every one carries `aria-hidden="true"`, keeping the punctuation out of the accessibility tree. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "separator should be 'aria-hidden'")

### Notes and edge cases

- The `<ol>` and `<li>` list structure is supplied by the TEST, not by the component. `Breadcrumbs.Root` renders only the `nav` and the author is responsible for the list, so nothing in the library guarantees the list semantics that the breadcrumb pattern calls for. Worth deciding whether our version owns that. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "should have default separator")
- All eight tests are synchronous with no setup. Nothing tests overriding the default `aria-label`, nothing tests the localization of `"Breadcrumbs"` through `I18nProvider` (despite kobalte having one), and nothing tests that a non-current link remains actionable. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "should have default 'aria-label'")
- Ported from react-spectrum `@react-aria/breadcrumbs/test/useBreadcrumbs.test.js` plus `useBreadcrumbItem.test.js`. Dropped: React Aria's Enter-key and click activation tests for breadcrumb items, its heading-variant tests (the last crumb as an `h1`), and its localized-label tests. (kobalte: packages/core/src/breadcrumbs/breadcrumbs.test.tsx: "should have default 'aria-label'")

## link

### Roles and attributes

- Given a `Link.Root` rendering a native anchor, when rendered, then no redundant `role="link"` is added. (kobalte: packages/core/src/link/link.test.tsx: "should not have attribute 'role=link' when it's a native link")
- Given `Link.Root as="div"`, when rendered, then `role="link"` is added. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'role=link' when it's not a native link")
- Given an enabled `Link.Root`, when rendered, then `data-disabled` is absent. (kobalte: packages/core/src/link/link.test.tsx: "should not have attribute 'data-disabled' by default")
- Given a native anchor with `href` and `disabled`, when rendered, then an explicit `role="link"` IS added, because the element stops being a natively-actionable link once its `href` is stripped. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'role=link' when disabled")
- Given a `Link.Root href="..." disabled`, when rendered, then the `href` attribute is REMOVED entirely, which is how a disabled link becomes unclickable and unfollowable. (kobalte: packages/core/src/link/link.test.tsx: "should not have attribute 'href' when disabled")
- Given a `disabled` `Link.Root`, when rendered, then `aria-disabled="true"` is set. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'aria-disabled=true' when disabled")
- Given a `disabled` `Link.Root`, when rendered, then `data-disabled` is present. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'data-disabled' when disabled")

### Focus management

- Given `Link.Root as="div"` and not disabled, when rendered, then `tabindex="0"` is added. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'tabindex=0' when it's not a native link and is not disabled")
- Given a native anchor with an `href`, when rendered, then no `tabindex="0"` is added. (kobalte: packages/core/src/link/link.test.tsx: "should not have attribute 'tabindex=0' when it's a native link ")
- Given `Link.Root as="div" disabled`, when rendered, then `tabindex="0"` is NOT added, so a disabled link leaves the tab order. (kobalte: packages/core/src/link/link.test.tsx: "should not have attribute 'tabindex=0' when it's disabled")

### Notes and edge cases

- The link file mirrors the button file almost exactly, and together they establish kobalte's polymorphic-actionable contract: derive `role`, `tabindex` and the disabled representation from the RESOLVED tag name and the presence of `href`. The pair should be one shared conformance battery in our suite, parameterised by tag. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'role=link' when it's not a native link")
- `installPointerEvent()` is called but no test fires a pointer event, and nothing tests that a disabled link's click handler does not run. Only attributes are checked. (kobalte: packages/core/src/link/link.test.tsx: "should have attribute 'data-disabled' when disabled")
- No upstream attribution header; kobalte-original. No skipped tests. (kobalte: packages/core/src/link/link.test.tsx: "should not have attribute 'role=link' when it's a native link")

## image

### State and controlled/uncontrolled

- Given an `Image.Root` with an `Image.Fallback` and an `Image.Img` whose load resolves after 300ms, when first rendered, then the FALLBACK text is in the document. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the fallback initially")
- Given the same setup, when first rendered, then NO `role="img"` element exists yet, so the image element is not mounted until it has loaded. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should not render the image initially")
- Given the same setup, when the image finishes loading, then a `role="img"` element appears in the document. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the image after it has loaded")
- Given `Image.Img alt="Fake Image"`, when the image has loaded, then it is findable by that alt text, so `alt` survives onto the real element. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should have alt text on the image")
- Given `Image.Root fallbackDelay={300}` with an `Image.Fallback` and NO image, when first rendered, then the fallback is NOT in the document, so `fallbackDelay` suppresses a flash of fallback content for images that load fast. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and delayed render > should not render a fallback immediately")
- Given `fallbackDelay={300}`, when the delay elapses, then the fallback appears. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and delayed render > should render a fallback after the delay")

### Notes and edge cases

- THE WHOLE IMAGE SUITE IS SKIPPED ON CI: `describe.skipIf(process.env.GITHUB_ACTIONS)("Image", ...)`. Unlike the other `skipIf` cases this one has nothing to do with focus; it is timing, since the tests rely on real timers elapsing inside `findBy*`. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the fallback initially")
- `window.Image` is REPLACED in `beforeAll` with a `MockImage` class whose constructor calls `this.onload()` after a 300ms `setTimeout`, and restored in `afterAll`. jsdom never actually loads images, so the only way to test load state is to stub the global constructor. Note the component must construct `new Image()` itself rather than relying on the DOM element's load event, otherwise this mock would not work. Our suite needs the same stub, plus an error-path variant. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the image after it has loaded")
- The async tests use `await findByRole("img")` and `await findByText(...)` rather than fake timers plus a manual flush. `findBy*` polls with real timers, which is why they are CI-skipped for flakiness. Using fake timers plus `vi.advanceTimersByTime(300)` plus a microtask flush would be the deterministic alternative, and is what our suite should do. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and delayed render > should render a fallback after the delay")
- No test covers the ERROR path: an image that fails to load and must fall back permanently. Nothing tests `data-*` attributes or the loading-status state machine that radix's Avatar exposes. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the image after it has loaded")
- Ported from radix-ui `packages/react/avatar/src/Avatar.test.tsx`. Dropped: radix's error-image describe block (a broken `src` keeping the fallback visible) and its accessibility snapshot assertions. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the fallback initially")

## separator

### Roles and attributes

- Given a bare `Separator.Root`, when rendered, then the element is an `HTMLHRElement`. (kobalte: packages/core/src/separator/separator.test.tsx: "should render an 'hr' by default")
- Given a bare `Separator.Root`, when rendered, then it has NO `aria-orientation` attribute, because horizontal is the implicit default for `separator`. (kobalte: packages/core/src/separator/separator.test.tsx: "should not have implicit 'aria-orientation' by default")
- Given a bare `Separator.Root` (an `hr`), when rendered, then no explicit `role="separator"` is added, because `hr` already has that implicit role. (kobalte: packages/core/src/separator/separator.test.tsx: "should not have implicit 'role=separator' by default")
- Given `orientation="horizontal"`, when rendered, then `aria-orientation` is still absent, so the default value is never written out redundantly. (kobalte: packages/core/src/separator/separator.test.tsx: "should not have implicit 'aria-orientation' when 'orientation=horizontal'")
- Given `orientation="vertical"`, when rendered, then `aria-orientation="vertical"` IS set, since it differs from the implicit default. (kobalte: packages/core/src/separator/separator.test.tsx: "should have 'aria-orientation' set to vertical when 'orientation=vertical'")
- Given `Separator.Root as="span"`, when rendered, then the element is an `HTMLSpanElement` AND carries an explicit `role="separator"`. (kobalte: packages/core/src/separator/separator.test.tsx: "should have 'role=separator' when rendered element is not 'hr'")
- Given `orientation="horizontal"`, when rendered, then `data-orientation="horizontal"` IS present, even though `aria-orientation` is not. So the styling hook is always written while the ARIA attribute is written only when it carries information. That split is a rule worth adopting wholesale. (kobalte: packages/core/src/separator/separator.test.tsx: "should have 'data-orientation=horizontal' when 'orientation=horizontal'")
- Given `orientation="vertical"`, when rendered, then `data-orientation="vertical"` is present. (kobalte: packages/core/src/separator/separator.test.tsx: "should have 'data-orientation=vertical' when 'orientation=vertical'")

### Notes and edge cases

- All eight tests are synchronous with no setup at all, and `getByRole("separator")` finds the element in every case including the `span` variant, which confirms the role is resolving. (kobalte: packages/core/src/separator/separator.test.tsx: "should render an 'hr' by default")
- Nothing tests a DECORATIVE separator (`role="presentation"` or `aria-hidden`), which ARIA requires for separators that carry no structural meaning. (kobalte: packages/core/src/separator/separator.test.tsx: "should not have implicit 'role=separator' by default")

## calendar

### Roles and attributes

- Given a `Calendar.Root`, when it renders, then it emits no DOM element of its own and carries no attributes, because it returns a `createMemo` holding only the public and internal context providers wrapped around the resolved children. (corvu-src: packages/calendar/src/Root.tsx)
- Given a `Calendar.Table` with no `as` override, when it renders, then the default element is `table` and it always carries `role="grid"` plus the bare marker attribute `data-corvu-calendar-table` (documented as "Present on every calendar table element"). (corvu-src: packages/calendar/src/Table.tsx)
- Given a `Calendar.Table` with `index` omitted, when it renders, then `aria-labelledby` resolves to the registered label id for index `0`, and is `undefined` while no `Calendar.Label` for that index has registered. (corvu-src: packages/calendar/src/Table.tsx)
- Given a `Calendar.Table` in `mode="multiple"` or `mode="range"`, when it renders, then `aria-multiselectable="true"` is set; in `mode="single"` the attribute is `undefined` and therefore absent. (corvu-src: packages/calendar/src/Table.tsx)
- Given a `Calendar.HeadCell` with no `as` override, when it renders, then the default element is `th`, it always carries `scope="col"` and the bare marker `data-corvu-calendar-headcell` (documented as "Present on every calendar headcell element"), and an optional `abbr` prop is forwarded verbatim. (corvu-src: packages/calendar/src/HeadCell.tsx)
- Given a `Calendar.Cell` with no `as` override, when it renders, then the default element is `td`, it carries `role="presentation"` and the bare marker `data-corvu-calendar-cell` (documented as "Present on every calendar cell element"). (corvu-src: packages/calendar/src/Cell.tsx)
- Given a `Calendar.CellTrigger` with no `as` override, when it renders, then the default element is `button` with `role="gridcell"` and the bare marker `data-corvu-calendar-celltrigger` (documented as "Present on every calendar celltrigger element"). (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a cell trigger whose day is selected, when it renders, then `aria-selected="true"` and `data-selected` (empty string) are both set. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a cell trigger whose day is neither selected nor disabled, when it renders, then `aria-selected="false"` is set and `data-selected` is absent. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a cell trigger whose day is disabled and not selected, when it renders, then `aria-selected` is `undefined` and therefore omitted entirely rather than set to "false". (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a cell trigger whose day is disabled, when it renders, then `aria-disabled="true"`, `data-disabled` (documented as "Present on disabled calendar cell triggers") and the native `disabled` attribute are all applied. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given the consumer passes `disabled={true}` explicitly on a cell trigger, when it renders, then the native `disabled` attribute is set even though `aria-disabled` and `data-disabled` stay driven purely by the context `isDisabled` computation, so the three can disagree. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a cell trigger for the current date, when the client effect has run, then `data-today` is present, documented as "Present on today's calendar cell trigger. Only rendered on the client to avoid hydration mismatches". (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `mode="range"` with a `from` value, when a cell trigger's day equals `from`, then `data-range-start` is present, documented as "Present on the start of a day range. (Only present in range mode)". (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `mode="range"` with a `to` value, when a cell trigger's day equals `to`, then `data-range-end` is present, documented as "Present on the end of a day range. (Only present in range mode)". (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `mode="range"` with both `from` and `to` set, when a cell trigger's day is on or after `from` and on or before `to`, then `data-in-range` is present, documented as "Present on calendar cell trigger elements that are within a day range. (Including start and end, only present in range mode)". (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `mode="range"` with only `from` set and `to` still null, when cell triggers render, then `data-range-start` is present on the `from` day but `data-in-range` is absent everywhere because `isSameDayOrBefore` returns false against a null `to`. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a `Calendar.Nav`, when it renders, then it goes through `DynamicButton`, whose default element is `button`, and it carries the bare marker `data-corvu-calendar-nav` (documented as "Present on every calendar nav element"). (corvu-src: packages/calendar/src/Nav.tsx)
- Given a `Calendar.Nav` rendered as a native button, when it renders, then `type="button"` is set and `role` is left `undefined`; rendered as any non-button element it gets `role="button"` and no `type`. (corvu-src: packages/utils/src/dynamic/DynamicButton.tsx)
- Given a `Calendar.Nav` rendered as `input`, when its `type` is one of button, color, file, image, reset or submit, then `isButton` treats it as a button so `type` is preserved and `role="button"` is not added. (corvu-src: packages/utils/src/assertions.ts)
- Given a `Calendar.Label` with no `as` override, when it renders, then the default element is `h2` carrying `aria-live="polite"`, the bare marker `data-corvu-calendar-label` (documented as "Present on every calendar label element"), and an `id` equal to the label id registered for `index ?? 0`. (corvu-src: packages/calendar/src/Label.tsx)
- Given any calendar part, when it renders, then no CSS custom property is written by the calendar package at all; the only contract is the `data-*` and ARIA attributes listed above. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given every boolean data attribute in the calendar, when the condition is true, then `dataIf` yields the empty string so the attribute is present with an empty value, and when false it yields `undefined` so the attribute is omitted rather than set to "false". (corvu-src: packages/utils/src/assertions.ts)

### Keyboard

- Given `textDirection="ltr"` and focus on a cell trigger, when ArrowLeft is pressed, then the event is default-prevented and the focused day moves back one day. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `textDirection="ltr"` and focus on a cell trigger, when ArrowRight is pressed, then the event is default-prevented and the focused day moves forward one day. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `textDirection="rtl"`, when ArrowLeft is pressed, then the focused day moves forward one day and ArrowRight moves it back one day, mirroring the ltr mapping. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given focus on a cell trigger, when ArrowUp is pressed, then the focused day moves back 7 days and the event is default-prevented. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given focus on a cell trigger, when ArrowDown is pressed, then the focused day moves forward 7 days and the event is default-prevented. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `textDirection="ltr"` and `startOfWeek`, when Home is pressed, then the focused day jumps back by `(day.getDay() - startOfWeek + 7) % 7` days, landing on the first day of that displayed week. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `textDirection="ltr"` and `startOfWeek`, when End is pressed, then the focused day jumps forward by `(startOfWeek + 6 - day.getDay() + 7) % 7` days, landing on the last day of that displayed week. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `textDirection="rtl"`, when Home is pressed, then it behaves like ltr End (jump to end of week) and End behaves like ltr Home. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given Home or End, when the computed target day is disabled, then no retry scan happens (retry is passed as false) so the key is a no-op rather than skipping to a nearby available day. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given focus on a cell trigger, when PageUp is pressed without Shift, then the focused day moves back one month; with Shift it moves back one year. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given focus on a cell trigger, when PageDown is pressed without Shift, then the focused day moves forward one month; with Shift it moves forward one year. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a month change via PageUp/PageDown that would land on a day number the target month does not have, when the target is computed, then the day is clamped to the last day of the target month (January 31 plus one month becomes February 28 or 29). (corvu-src: packages/calendar/src/utils.ts)
- Given arrow, PageUp or PageDown navigation where the first candidate day is disabled, when the key is handled, then the same delta is applied repeatedly until an enabled day is found, giving up after 366 attempts and returning null so the key becomes a no-op. (corvu-src: packages/calendar/src/utils.ts)
- Given a cell trigger, when Enter or Space is pressed, then no key handler branch matches and selection happens only through the native button click that the browser synthesises, so the `click` path and not `keydown` drives selection. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a consumer `onKeyDown` on a cell trigger that calls `preventDefault`, when any key is pressed, then corvu's entire navigation branch is skipped because `callEventHandler` reports the event as default-prevented. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a key that computes a non-null target day, when it is handled, then `setIsFocusing(true)` and `setFocusedDay(target)` are applied together inside a `batch`, so the focus-moving effect sees both updates at once. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a `Calendar.Nav`, when a key is pressed on it, then corvu adds no key handling; navigation relies entirely on the native button activation producing a click. (corvu-src: packages/calendar/src/Nav.tsx)

### Pointer

- Given a cell trigger, when it is clicked and the consumer `onClick` did not call `preventDefault`, then `onDaySelect(day)` runs, which first moves the focused day to that day and then applies the mode-specific selection change. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a consumer `onClick` on a cell trigger that calls `preventDefault`, when it is clicked, then no selection change occurs at all. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a `Calendar.Nav` with `action`, when it is clicked and the consumer `onClick` did not prevent default, then `navigate(action)` runs. (corvu-src: packages/calendar/src/Nav.tsx)
- Given a disabled cell trigger, when it is clicked, then the native `disabled` attribute suppresses the click entirely so no selection or focus change can be observed. (corvu-src: packages/calendar/src/CellTrigger.tsx)

### Focus management

- Given a calendar grid, when it renders, then exactly one cell trigger has `tabindex="0"` (the one whose day equals `focusedDay`) and every other cell trigger has `tabindex="-1"`, implementing a single roving tab stop across the whole grid including across multiple displayed months. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `focusedDay` changes while `isFocusing` is true, when the matching cell trigger's effect runs, then that trigger's element is focused via `ref().focus()` and `isFocusing` is reset to false so the same focus move is not repeated. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `focusedDay` changes while `isFocusing` is false (for example set programmatically through the context setter), when effects run, then no DOM focus call happens and only the roving `tabindex` moves. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a cell trigger whose day is disabled, when `focusedDay` equals that day and `isFocusing` is true, then the focus effect bails out early so focus is never moved onto a disabled trigger. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given the cell trigger matching `focusedDay` and not disabled, when it mounts, then it publishes its element through `setFocusedDayRef`, exposed on the context and children callback as `focusedDayRef`, and nulls it on cleanup. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given the same day is rendered twice (for example an outside day visible in two adjacent months), when both triggers run the `focusedDayRef` effect, then both write the ref and the last one to mount wins, and unmounting either sets the shared ref to null. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given `setFocusedDay` is called with a day for which the `disabled` prop returns true, when the setter runs, then it returns immediately without changing the focused day or the month. (corvu-src: packages/calendar/src/Root.tsx)
- Given `setFocusedDay` is called with a day outside the currently displayed month window, when the setter runs, then the month is shifted by `sign(delta) * max(numberOfMonths, abs(delta))` months so the newly focused day becomes visible, batched with the focused-day update. (corvu-src: packages/calendar/src/Root.tsx)
- Given `setFocusedDay` moves focus across months, when the month shifts, then the disabled check uses the raw `disabled` prop and not `isDisabled`, so `disableOutsideDays` never blocks keyboard focus movement into an adjacent month. (corvu-src: packages/calendar/src/Root.tsx)
- Given `setMonth` (or any `navigate` action) is called and the current `focusedDay` falls outside the new window, when the setter runs, then the focused day is moved to the same day-of-month in the new month and then nudged by `findAvailableDayInMonth` to the nearest non-disabled day within that month. (corvu-src: packages/calendar/src/Root.tsx)
- Given `findAvailableDayInMonth` cannot find any enabled day in the month, when the scan exhausts `max(date - 1, lastDay - date)` shifts, then it falls back to the original start date even though that date is disabled. (corvu-src: packages/calendar/src/utils.ts)

### State and controlled/uncontrolled

- Given `mode` is required with no default, when Root renders, then `mode` selects among `single`, `multiple` and `range`, and `mergeProps` supplies the matching `initialValue` default of `null`, `[]` or `{ from: null, to: null }`. (corvu-src: packages/calendar/src/Root.tsx)
- Given no `initialMonth`, when Root renders, then `initialMonth` defaults to `props.initialFocusedDay ?? new Date()`. (corvu-src: packages/calendar/src/Root.tsx)
- Given no `initialFocusedDay`, when Root renders, then it defaults to `findAvailableDayInMonth(props.initialMonth ?? new Date(), props.disabled ?? (() => true))`, meaning the fallback predicate when `disabled` is absent treats every day as disabled and the scan returns the start date unchanged. (corvu-src: packages/calendar/src/Root.tsx)
- Given no overrides, when Root renders, then `mergeProps` supplies `startOfWeek: 1` (Monday), `required: false`, `disabled: () => false`, `numberOfMonths: 1`, `disableOutsideDays: true`, `fixedWeeks: false`, `textDirection: 'ltr'`, `labelIds: []`, `min: null`, `max: null` and `excludeDisabled: false`. (corvu-src: packages/calendar/src/Root.tsx)
- Given `value`/`onValueChange`, `month`/`onMonthChange` and `focusedDay`/`onFocusedDayChange`, when any of the controlled props is not `undefined`, then that piece of state is treated as controlled and the internal signal is never written, while the change callback still fires. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given a controllable signal setter, when the computed next value is `Object.is`-equal to the current value, then neither the internal signal nor the change callback is invoked. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given a controllable signal setter, when it runs, then the whole computation is wrapped in `untrack`, so reading the current value inside a setter callback does not create a dependency. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given `mode="single"` and a day already selected, when that same day is clicked and `required` is false, then the value becomes `null`; with `required: true` it stays selected. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="single"` and a different day selected, when a new day is clicked, then the value is replaced with the new day. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="multiple"` and an unselected day, when it is clicked, then it is appended to the array only while `value.length !== max`; with `max` reached the click is a no-op. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="multiple"` and a selected day, when it is clicked, then it is filtered out only while `value.length !== min` and not while `value.length === 1 && required`, so hitting `min` locks the current selection in place. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="multiple"` with `max` set and a value array that already exceeds `max`, when a day is clicked, then the strict `!==` comparison lets the array keep growing, so `max` only blocks growth at exactly that length. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="range"` with `from` null, when a day is clicked, then the value becomes `{ from: day, to: null }`. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="range"` with `from` set and `to` null, when a day earlier than `from` is clicked, then the two are swapped so `from` is always the earlier bound. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="range"` with `excludeDisabled: true` and `from` set, when completing a range that spans a disabled day, then the range is reset to `{ from: <first disabled day found>, to: null }` rather than to the clicked day, because the scan loop shadows the clicked-day variable. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="range"` with `excludeDisabled: false`, when completing a range that spans disabled days, then the range is accepted as-is and `data-in-range` marks the disabled days too. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="range"` with a complete range, when the `from` day is clicked again and `required` is false, then the range clears to `{ from: null, to: null }`; with `required: true` or any other day clicked it restarts as `{ from: day, to: null }`. (corvu-src: packages/calendar/src/Root.tsx)
- Given `mode="range"`, when `isSelected` is evaluated, then a day counts as selected if it equals `from` or lies between `from` and `to` inclusive, so with only `from` set exactly one day reports `aria-selected="true"`. (corvu-src: packages/calendar/src/Root.tsx)
- Given `disableOutsideDays: true` (the default), when `isDisabled(day, month)` runs, then any day whose `getMonth()` differs from the reference month is reported disabled before the user `disabled` callback is even consulted. (corvu-src: packages/calendar/src/Root.tsx)
- Given `numberOfMonths: n`, when `months()` is read, then it returns `n` entries where entry `i` is `{ month: month + i, weeks: weeks(i) }`, and `month` always refers to the first displayed month. (corvu-src: packages/calendar/src/Root.tsx)
- Given `startOfWeek` and a month, when `weeks(offset)` builds the grid, then the leading day count is `(firstDayOfMonth.getDay() - startOfWeek + 7) % 7`, every week has exactly 7 entries, and trailing entries spill into the following month. (corvu-src: packages/calendar/src/Root.tsx)
- Given `fixedWeeks: true`, when `weeks()` builds the grid, then exactly 6 week rows are produced regardless of the month; with `fixedWeeks: false` the row count is `ceil((lastDayOfMonth + prefixedDays) / 7)`, so it varies between 4 and 6. (corvu-src: packages/calendar/src/Root.tsx)
- Given `startOfWeek`, when `weekdays()` is read, then it returns seven `Date` objects in January 1970 (`new Date(1970, 0, ((i + startOfWeek) % 7) + 4)`) whose weekdays run in display order, intended for the consumer to format into column headers. (corvu-src: packages/calendar/src/Root.tsx)
- Given `navigate`, when it is called with `prev-month`, `next-month`, `prev-year` or `next-year`, then the month moves by -1 month, +1 month, -1 year or +1 year respectively, all routed through `setMonth` so the focused day is realigned. (corvu-src: packages/calendar/src/Root.tsx)
- Given `navigate`, when it is called with a function, then that function receives the current month and its return value is passed to `setMonth`, allowing arbitrary jumps. (corvu-src: packages/calendar/src/Root.tsx)
- Given `Calendar.Root` children as a function, when it renders, then the callback receives `mode`, `value`, `setValue`, `month`, `setMonth`, `focusedDay`, `setFocusedDay`, `startOfWeek`, `required`, `numberOfMonths`, `disableOutsideDays`, `fixedWeeks`, `textDirection`, `weekdays`, `months`, `weeks`, `navigate`, `focusedDayRef`, `labelIds`, plus `min`/`max` in multiple mode and `excludeDisabled` in range mode. (corvu-src: packages/calendar/src/Root.tsx)
- Given a `contextId` on Root, when descendants call `useCalendarContext(contextId)`, then they read a keyed context named `calendar-<contextId>` (internals use `calendar-internal-<contextId>`), which is how nested calendars are addressed. (corvu-src: packages/calendar/src/context.ts)
- Given any calendar part rendered outside a Root, when it calls the context hook, then it throws `[corvu]: Calendar context not found. Make sure to wrap Calendar components in <Calendar.Root>`, or the id-bearing variant when a `contextId` was supplied. (corvu-src: packages/calendar/src/context.ts)

### Forms

- Given a calendar inside a `form`, when it renders, then no hidden input or form value is produced at all; the selected date only exists in the signal, so form integration is entirely the consumer's job. (corvu-src: packages/calendar/src/Root.tsx)
- Given a `Calendar.CellTrigger` rendered as its default `button` inside a `form`, when it is clicked, then no `type` attribute is set (it goes through `Dynamic`, not `DynamicButton`), so the button defaults to `type="submit"` and clicking a day submits the form. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a `Calendar.Nav` inside a `form`, when it renders as a native button, then `DynamicButton` sets `type="button"` so navigation clicks do not submit the form, in contrast to `CellTrigger`. (corvu-src: packages/utils/src/dynamic/DynamicButton.tsx)

### RTL and i18n

- Given `textDirection` is a Root prop defaulting to `'ltr'`, when it is set to `'rtl'`, then the horizontal arrow keys and the Home/End pair swap meaning, and nothing else in the component changes. (corvu-src: packages/calendar/src/Root.tsx)
- Given a document with `dir="rtl"`, when the calendar renders, then corvu does not read the DOM direction or computed style at all, so `textDirection` must be passed explicitly or keyboard navigation stays ltr. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given any locale, when the calendar renders, then it performs zero `Intl` formatting: month labels and weekday headers are the consumer's text, and corvu only supplies raw `Date` objects through `weekdays()` and `months()`. (corvu-src: packages/calendar/src/Root.tsx)
- Given `startOfWeek` in the range 0-6 with 0 meaning Sunday, when it is set, then it drives both the grid layout offset and the Home/End week boundaries, so week-start localisation is a single numeric prop. (corvu-src: packages/calendar/src/Root.tsx)

### SSR and hydration

- Given server rendering, when a cell trigger is emitted, then `data-today` is absent because `isToday` starts as `false` and is only computed inside a `createEffect`, a deliberate choice documented in the JSDoc to avoid hydration mismatches. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given server rendering, when `Calendar.Label` and `Calendar.Table` are emitted, then the label `id` and the table `aria-labelledby` are both `undefined`, because registration happens in a `createEffect` that does not run on the server. (corvu-src: packages/calendar/src/Label.tsx)
- Given a `labelIds` array is passed on Root, when labels register, then the provided ids are used instead of `createUniqueId()`, which is the escape hatch for stable SSR ids. (corvu-src: packages/calendar/src/Root.tsx)

### Accessibility tooling

- Given the full grid markup, when an accessibility checker inspects it, then the semantic stack is a `table role="grid"` containing native `tr` rows (corvu never sets `role="row"`), `td role="presentation"` cells, and a `button role="gridcell"` inside each cell, so the gridcell role sits on the button rather than on the table cell. (corvu-src: packages/calendar/src/Cell.tsx)
- Given `Calendar.Label` renders an `h2` with `aria-live="polite"`, when the month changes, then the label text change is announced, and the same element is referenced by the table's `aria-labelledby`. (corvu-src: packages/calendar/src/Label.tsx)
- Given multiple months, when each `Calendar.Table index={i}` is paired with a `Calendar.Label index={i}`, then each grid gets its own label id and its own live region, and an unmatched index leaves `aria-labelledby` undefined. (corvu-src: packages/calendar/src/Table.tsx)
- Given a `Calendar.Nav`, when it renders, then corvu sets no `aria-label`; accessible naming of previous/next buttons is left entirely to the consumer. (corvu-src: packages/calendar/src/Nav.tsx)

### Notes and edge cases

- Given a test that passes its own `Date` object as `initialMonth`, when Root evaluates the `initialFocusedDay` default, then `findAvailableDayInMonth` mutates that `Date` in place with repeated `setDate` calls, so the caller's object is silently changed and reusing it across assertions gives wrong results. (corvu-src: packages/calendar/src/utils.ts)
- Given `isDisabled` compares only `day.getMonth() !== month.getMonth()`, when a grid spills into the same month number of a different year (December 2024 grid showing January 2025 is fine, but a 12-month `numberOfMonths` window is not), then the year is never compared, so `disableOutsideDays` can misclassify. (corvu-src: packages/calendar/src/Root.tsx)
- Given `disabled: () => true` for a large span, when an arrow key is pressed, then `modifyFocusedDay` recurses up to 366 times per keystroke before returning null, so a conformance test with a fully disabled month does 366 predicate calls per key and observes no movement. (corvu-src: packages/calendar/src/utils.ts)
- Given `setFocusedDay` is typed as `Setter<Date>` but returns `undefined` when the target day is disabled, when a consumer relies on the setter's return value, then the Solid `Setter` contract is violated and the value silently differs from the stored state. (corvu-src: packages/calendar/src/Root.tsx)
- Given jsdom, when asserting `data-today`, then the assertion fails unless the test awaits the effect queue, because the attribute only appears after `createEffect` flushes; asserting it immediately after render returns `null`. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given jsdom and fake timers, when asserting `data-today`, then the system clock must be pinned before mount because `new Date()` is read once inside the effect and never revisited, so a calendar mounted before midnight keeps marking yesterday. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a non-UTC test time zone, when asserting on dates, then all internal `Date` construction uses local-time `new Date(y, m, d)` so relative comparisons stay correct, but any assertion on `toISOString()` shifts by the offset and day-boundary tests around DST transitions can produce a 23- or 25-hour day whose `setDate` arithmetic lands on an unexpected date. (corvu-src: packages/calendar/src/utils.ts)
- Given jsdom, when asserting that keyboard navigation moved DOM focus, then `document.activeElement` only updates after the `createEffect` chain runs and only if the element is attached to a rendered document, so a shallow or detached render makes the focus assertion fail while the `tabindex` assertion still passes. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given a locale-dependent header assertion, when `Intl.DateTimeFormat` is used by the consumer on the `weekdays()` dates, then the output depends on the Node ICU build and the ambient locale, so conformance tests should assert on the returned `Date` weekday numbers rather than formatted strings. (corvu-src: packages/calendar/src/Root.tsx)
- Given `createKeyedContext` stores every keyed context in a module-level `Map` that is never cleared, when two tests use the same `contextId`, then they share the same `Context` object across test cases, and a stale keyed context that was created but never provided resolves to `undefined` and throws the id-bearing error. (corvu-src: packages/utils/src/create/keyedContext.ts)
- Given `createOnce` caches the memo in closure state with a `called` boolean, when children are resolved, then the children expression is evaluated exactly once per Root instance and never re-runs, so a test that mutates the children prop reactively sees no update. (corvu-src: packages/utils/src/create/once.ts)
- Given `registerMemo` rebuilds its whole array of registers whenever `numberOfMonths` or `labelIds` changes, when that happens, then `createUniqueId()` is called again for unprovided ids, so label ids are not stable across a `numberOfMonths` change and `aria-labelledby` churns. (corvu-src: packages/calendar/src/Root.tsx)
- Given Solid 2 porting, when `Calendar.Root` returns `memoizedCalendarRoot as unknown as JSX.Element`, then it relies on Solid 1's tolerance for a `createMemo` accessor used directly as JSX, and the same cast appears in `Dynamic`; a Solid 2 port needs an explicit component boundary instead. (corvu-src: packages/calendar/src/Root.tsx)
- Given Solid 2 porting, when children are resolved inside `untrack(() => resolveChildren())` under two nested providers, then the provider tree is deliberately built once outside tracking, and Solid 2's different ownership/disposal rules for `untrack` around JSX need re-verification. (corvu-src: packages/calendar/src/Root.tsx)
- Given Solid 2 porting, when parts call `createMemo(() => useInternalCalendarContext(contextId))`, then `useContext` is being invoked inside a memo rather than at component setup, which is a pattern Solid 2 may treat differently regarding owner and reactivity. (corvu-src: packages/calendar/src/Table.tsx)
- Given Solid 2 porting, when `createControllableSignal` is used, then it is a hand-rolled controlled/uncontrolled bridge with `untrack` in the setter and no `createWritableMemo`, so the port can keep the same observable contract without depending on any Solid internals. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given a design decision worth copying, when the focus model is examined, then the explicit `isFocusing` latch cleanly separates "state moved" from "DOM focus should follow", which avoids stealing focus on programmatic value changes and is a pattern worth replicating. (corvu-src: packages/calendar/src/Root.tsx)
- Given a design decision worth avoiding, when the range `excludeDisabled` branch is examined, then the inner loop variable shadows the clicked-day parameter so the reset anchor is the first disabled day found rather than the clicked day, which is almost certainly unintended and should not be copied. (corvu-src: packages/calendar/src/Root.tsx)
- Given a design decision worth avoiding, when `CellTrigger` renders a `button` without `type`, then it defaults to submit inside forms while `Nav` correctly sets `type="button"`; a port should route both through the button-normalising wrapper. (corvu-src: packages/calendar/src/CellTrigger.tsx)
- Given no min-date or max-date prop exists, when date bounds are needed, then the only mechanism is the `disabled: (day) => boolean` callback, and the `min`/`max` props are selection-count bounds for `mode="multiple"` only. (corvu-src: packages/calendar/src/Root.tsx)

## resizable

### Roles and attributes

- Given a `Resizable.Root` with no `as` override, when it renders, then the default element is `div` carrying `data-corvu-resizable-root` (documented as "Present on every resizable root element") and `data-orientation` set to `horizontal` or `vertical` (documented as "The orientation of the resizable"). (corvu-src: packages/resizable/src/Root.tsx)
- Given a `Resizable.Root`, when it renders, then it applies inline `display: flex` plus `flex-direction: row` for horizontal or `column` for vertical, merged through `combineStyle` so a consumer `style` prop (string or object) wins on conflicting keys. (corvu-src: packages/resizable/src/Root.tsx)
- Given a `Resizable.Panel` with no `as` override, when it renders, then the default element is `div` carrying `data-corvu-resizable-panel` (documented as "Present on every resizable panel"), `data-orientation` from the root context, and an `id` equal to `panelId`. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a collapsible panel at its collapsed size, when it renders, then `data-collapsed` is present (documented as "Present if the panel is currently collapsed") and `data-expanded` is absent. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a panel with `collapsible: true` that is not collapsed, when it renders, then `data-expanded` is present, documented as "Present if the panel is currently expanded. Only present on panels that are collapsible", so a non-collapsible panel never gets either attribute. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a panel, when it renders, then its inline style sets `flex-basis` to `size * 100 + '%'`, merged through `combineStyle` with the consumer style; this percentage is the only size channel and no CSS custom property is written. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a `Resizable.Handle` with no `as` override, when it renders, then the default element is `button` carrying `role="separator"`, `data-corvu-resizable-handle` (documented as "Present on every resizable handle"), and `data-orientation` from the root context. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when it is hovered, focused, hovered as an intersection, or dragging, then `data-active` is present, documented as "Present when the handle is active". (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when a pointer drag is in progress on it, then `data-dragging` is present, documented as "Present when the handle is being dragged". (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when it renders, then `aria-orientation` is set to the resizable's own orientation, so a horizontal resizable whose divider is a vertical bar reports `aria-orientation="horizontal"`. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle with panels registered, when `ariaInformation` resolves, then `aria-controls` is the `id` of the last panel preceding the handle only; the following panel is never referenced. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when `ariaInformation` resolves, then `aria-valuemin` is the sum of the resolved `minSize` of all preceding panels, `aria-valuemax` is `1` minus the sum of the resolved `minSize` of all following panels, and `aria-valuenow` is the sum of the current sizes of all preceding panels, each rounded to 6 decimal places by `fixToPrecision`. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle whose `ref` is not yet set, when it renders, then `ariaInformation` returns `undefined` so `aria-controls`, `aria-valuemin`, `aria-valuemax` and `aria-valuenow` are all omitted from the markup. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when it renders, then its inline style sets `position: relative`, `touch-action: none`, `flex-shrink: 0`, and `cursor: inherit` only while `handleCursorStyle` is true (otherwise `cursor` is left undefined), all merged with the consumer style. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle that has detected an intersecting handle at its start edge, when it renders, then it emits an extra absolutely positioned `div` marked with the bare attribute `data-corvu-resizable-handle-start-intersection` before its children. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle that has detected an intersecting handle at its end edge, when it renders, then it emits an extra absolutely positioned `div` marked with the bare attribute `data-corvu-resizable-handle-end-intersection` after its children. (corvu-src: packages/resizable/src/Handle.tsx)
- Given the whole resizable package, when it renders, then it writes no CSS custom property at all: the size contract is the `flex-basis` percentage plus the `data-*` and ARIA attributes above. (corvu-src: packages/resizable/src/Panel.tsx)

### Keyboard

- Given a focused handle in a horizontal resizable, when ArrowLeft is pressed without Shift, then the event is default-prevented and panels resize by `-keyboardDelta` (default `0.1`, i.e. 10 percent of the root). (corvu-src: packages/resizable/src/Root.tsx)
- Given a focused handle in a horizontal resizable, when ArrowRight is pressed without Shift, then the event is default-prevented and panels resize by `+keyboardDelta`. (corvu-src: packages/resizable/src/Root.tsx)
- Given a focused handle in a vertical resizable, when ArrowUp or ArrowDown is pressed, then they map to `-keyboardDelta` and `+keyboardDelta` respectively, and the horizontal arrows do nothing. (corvu-src: packages/resizable/src/Root.tsx)
- Given a focused handle, when Shift is held with the active-axis decrease arrow, or when Home is pressed in any orientation, then the delta is `-1` (a full-root shrink) rather than `keyboardDelta`. (corvu-src: packages/resizable/src/Root.tsx)
- Given a focused handle, when Shift is held with the active-axis increase arrow, or when End is pressed in any orientation, then the delta is `+1`. (corvu-src: packages/resizable/src/Root.tsx)
- Given `keyboardDelta` given as a px string such as `'20px'`, when an arrow key is pressed, then the delta is resolved against the current root size, so the same keystroke produces a different percentage at different container widths. (corvu-src: packages/resizable/src/lib/utils.ts)
- Given a focused handle, when Enter is pressed, then the last preceding panel is collapsed or expanded if it is collapsible, otherwise the first following panel is, otherwise the key is ignored; the toggle is applied with the `following` strategy. (corvu-src: packages/resizable/src/Root.tsx)
- Given a focused handle, when Enter is pressed, then `preventDefault` is never called on that branch, so on a native `button` handle inside a form the default submit behaviour still fires. (corvu-src: packages/resizable/src/Root.tsx)
- Given keyboard resizing, when the delta is applied, then `handleCursorStyle` is forced to `false` for that call so no global cursor override is installed by keyboard interaction. (corvu-src: packages/resizable/src/Root.tsx)
- Given keyboard resizing, when the delta is applied, then the initial sizes are re-read fresh from the panels for every keystroke rather than reusing the cached drag baseline, so repeated keypresses compound. (corvu-src: packages/resizable/src/Root.tsx)
- Given a handle with `altKey: true` (the default), when an arrow key is pressed with Alt held, then alt resize mode is used for that keystroke; with `altKey: 'only'` alt mode is always used, and with `altKey: false` it is never used. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle that is currently being dragged, when a key is pressed, then the key handler returns early so keyboard and pointer resizing cannot interleave. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when Tab is released on it, then `keyup` sets the focused state to true, which is how a keyboard-reached handle becomes `data-active` even if `focus` fired while hovered. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a consumer `onKeyDown` on the handle that calls `preventDefault`, when any key is pressed, then corvu's resize handling is skipped entirely. (corvu-src: packages/resizable/src/Handle.tsx)

### Pointer

- Given a handle, when `pointerdown` fires and neither the consumer `onPointerDown` nor `onHandleDragStart` prevented default, then `setPointerCapture(event.pointerId)` is called on the event target and a drag begins. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a `pointerdown` whose target carries `data-corvu-resizable-handle-start-intersection` or `data-corvu-resizable-handle-end-intersection`, when the drag starts, then the drag target is that intersection and the intersecting handle is also put into the dragging state, so both axes resize at once. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a drag start, when it is registered, then `window` listeners for `pointermove`, `touchmove`, `pointerup`, `touchend` and `contextmenu` are added, and all five are removed on drag end, so a right-click during a drag ends it. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a drag in progress, when `pointermove` fires, then the delta is `clientX - dragStartX` for a horizontal handle and `clientY - dragStartY` for a vertical one, converted to a percentage by dividing by the current root size. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a drag in progress on a touch device, when `touchmove` fires with at least one touch, then the first touch's `clientX`/`clientY` drive the same delta computation; a `touchmove` with no touches is ignored. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given multiple dragging handles (an intersection drag), when a move event fires, then every dragging handle receives a delta measured along its own orientation from the same shared drag origin. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a drag in progress, when the Alt key state changes mid-drag, then the drag origin is reset to the current pointer position and the cached initial sizes are re-read, so the mode switch does not produce a jump. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given several handles dragging with conflicting `altKey` settings, when a move event fires, then any dragging handle with `altKey: 'only'` forces alt mode on and any dragging handle with `altKey: false` then forces it back off, so `false` wins because it is evaluated second. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a consumer `onHandleDrag` callback, when each drag step is about to apply, then a cancelable `CustomEvent('drag')` is dispatched to that callback and calling `preventDefault` on it skips that one resize step. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a consumer `onHandleDragStart`, when `pointerdown` fires, then calling `preventDefault` on the `PointerEvent` cancels the drag before pointer capture logic decides the target. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a drag ends, when `pointerup`, `touchend` or `contextmenu` fires, then `onHandleDragEnd` is called with that event, the dragging flag clears, the cached drag baseline is discarded and global resize constraints are reset. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given `handleCursorStyle: true` (the default), when a handle is hovered, then a single `<style>` element is appended to `document.head` containing `*{cursor: <value>!important;}` with `col-resize` for a horizontal resizable, `row-resize` for vertical, and `move` when an intersection is hovered. (corvu-src: packages/resizable/src/lib/cursor.ts)
- Given `handleCursorStyle: true` and a drag that hits a constraint, when the distributable percentage differs from the desired one, then the injected cursor becomes a directional one from the constraint bitmask: `e-resize`, `w-resize`, `ew-resize`, `s-resize`, `n-resize`, `ns-resize`, `se-resize`, `ne-resize`, `sw-resize` or `nw-resize`. (corvu-src: packages/resizable/src/lib/cursor.ts)
- Given the cursor style becomes null, when the style is updated, then the injected `<style>` element is removed from the document head entirely rather than emptied. (corvu-src: packages/resizable/src/lib/cursor.ts)
- Given `handleCursorStyle: false`, when handles are hovered or dragged, then no global style element is created and the handle's own inline `cursor: inherit` is also omitted. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle that is hovered while a different handle is dragging, when the hover state changes, then active-state updates and cursor changes are suppressed until drag end, at which point every handle re-evaluates its active state. (corvu-src: packages/resizable/src/lib/handleManager.ts)

### Focus management

- Given a handle, when it receives focus while not hovered, then both focused and active become true so `data-active` appears; when it receives focus while already hovered the handler returns early. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a focused handle, when it blurs, then focused becomes false and active is cleared only if the handle is not also hovered. (corvu-src: packages/resizable/src/Handle.tsx)
- Given the default `button` element, when handles render, then each is naturally in the tab order and corvu sets no explicit `tabindex`; a `disabled` handle is removed from the tab order by the native attribute. (corvu-src: packages/resizable/src/Handle.tsx)
- Given `disabled: true` on a handle, when the registration effect runs, then it bails out before `registerHandle`, so the handle is never in the global handle list, detects no intersections, and receives no drag callbacks. (corvu-src: packages/resizable/src/Handle.tsx)

### State and controlled/uncontrolled

- Given `Resizable.Root` with no overrides, when it renders, then `mergeProps` supplies `orientation: 'horizontal'`, `initialSizes: []`, `keyboardDelta: 0.1` and `handleCursorStyle: true`. (corvu-src: packages/resizable/src/Root.tsx)
- Given `sizes` and `onSizesChange`, when `sizes` is not `undefined`, then the size array is controlled and the internal signal is never written while `onSizesChange` still fires on every attempted change. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given `onSizesChange` is provided, when sizes change, then the callback fires twice per change: once from the controllable signal's own change hook and once from a separate `createEffect` that also calls it, and that effect additionally fires on mount with the initial array. (corvu-src: packages/resizable/src/Root.tsx)
- Given `Resizable.Panel` with no overrides, when it renders, then `mergeProps` supplies `initialSize: null`, `minSize: 0`, `maxSize: 1`, `collapsible: false`, `collapsedSize: 0`, `collapseThreshold: 0.05` and `panelId: createUniqueId()`. (corvu-src: packages/resizable/src/Panel.tsx)
- Given `Resizable.Handle` with no overrides, when it renders, then `mergeProps` supplies `startIntersection: true`, `endIntersection: true` and `altKey: true`. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a panel registering, when it has its own `initialSize`, then that wins; otherwise the root's `initialSizes[panelIndex]` is used if present and the slot's id matches; otherwise the panel starts at `0.5`. (corvu-src: packages/resizable/src/Root.tsx)
- Given existing panels whose sizes already total exactly `1`, when a new panel registers into a new slot, then `panelSize / panelCount` is subtracted from every existing panel so the total returns to 1, a redistribution explicitly marked in source as not recognising min and max sizes. (corvu-src: packages/resizable/src/Root.tsx)
- Given a panel unregisters, when its size is spliced out, then the remaining shortfall `total - 1` is spread evenly across the survivors, again without honouring min or max sizes. (corvu-src: packages/resizable/src/Root.tsx)
- Given any resize pass completes, when the rounded sizes do not sum to exactly `1`, then `(total - 1) / count` is subtracted from every panel and the result is rounded to 6 decimals again, so normalisation is a uniform correction that can push a panel below its `minSize`. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given panels are registered, when their order in the size array is determined, then it comes from `compareDocumentPosition` against already-registered panels and is tracked in a plain mutable `sizesToIds` array keyed by panel id. (corvu-src: packages/resizable/src/Root.tsx)
- Given a panel's `onResize`, when the panel registers, then a `createEffect` calls it immediately with the initial size and again on every size change, so `onResize` fires once on mount before any interaction. (corvu-src: packages/resizable/src/Root.tsx)
- Given a collapsible panel, when its size becomes exactly equal to the resolved `collapsedSize`, then the `collapsed` memo flips to true and `onCollapse(size)` fires; when it leaves that size `onExpand(size)` fires, both only after the panel instance exists. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a panel with `collapsible: false`, when its size reaches `collapsedSize`, then `collapsed` stays false and neither `onCollapse` nor `onExpand` ever fires. (corvu-src: packages/resizable/src/Panel.tsx)
- Given the root `resize(panelIndex, size, strategy)` API, when called, then the target size is clamped to `[minSize, maxSize]`, the delta is computed against the panel's current size, and the default strategy is `'both'` with `collapsible` forced to false so this path cannot collapse a panel. (corvu-src: packages/resizable/src/Root.tsx)
- Given the root `collapse(panelIndex, strategy)` API, when called on a panel that is not `collapsible` or is already at `collapsedSize`, then it is a no-op; otherwise it resizes by `collapsedSize - currentSize` with `collapsible: true`. (corvu-src: packages/resizable/src/Root.tsx)
- Given the root `expand(panelIndex, strategy)` API, when called on a panel that is not `collapsible` or is not currently at `collapsedSize`, then it is a no-op; otherwise it resizes by `minSize - currentSize`. (corvu-src: packages/resizable/src/Root.tsx)
- Given a resize strategy, when the target panel is the first panel, then the strategy is forced to `'following'`; when it is the last panel it is forced to `'preceding'`, overriding whatever the caller passed. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given strategy `'both'`, when a panel is resized, then half the delta is applied in each direction as two mirrored resize actions, so neighbours on both sides absorb the change. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given strategy `'preceding'`, when the resize is applied, then the delta sign is inverted before distribution so a positive size request still grows the target panel. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given a resize, when percentage is distributed, then panels adjacent to the handle are consumed first (preceding panels last-to-first, following panels first-to-last), each clamped at its `minSize` when shrinking and `maxSize` when growing, and already-collapsed collapsible panels are skipped entirely. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given a collapsible panel adjacent to the handle, when the remaining undistributable percentage reaches the collapse threshold, then that panel snaps to `collapsedSize`; the effective threshold is `min(collapseThreshold, minSize - collapsedSize)`. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given a collapsed panel adjacent to the handle, when the drag pushes outward by at least the threshold, then the panel snaps back to `minSize`, and if the overdrag reaches `minSize - collapsedSize` it continues past `minSize` up to `maxSize` in the same gesture. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given only the panel adjacent to the handle is collapse-eligible, when a further-away collapsible panel would need to collapse to satisfy the drag, then it does not collapse; collapsing is strictly a neighbour-of-handle behaviour. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given a drag, when the achievable delta is computed, then a dry-run pass (`getDistributablePercentage`) finds the largest magnitude actually distributable across all resize actions before any state is written, and a collapse on one side mirrors the other side's distributed value. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given alt resize mode with more than two panels, when a drag delta arrives, then the panel adjacent to the handle is resized symmetrically on both sides: the doubled delta is clamped to that panel's min and max, halved, and applied as two mirrored actions with `collapsible: false`. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given alt resize mode with two or fewer panels, when a drag delta arrives, then alt mode is skipped entirely and the normal across-the-handle resize runs. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given alt resize mode on the first handle of the layout, when the delta is applied, then the panel index is shifted forward by one and the delta is negated so the gesture direction stays intuitive. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given a `Size` value, when it is resolved, then a `number` is used as a fraction of the root verbatim and a string must end in `px`, resolved as `parseFloat(size) / rootSize` rounded to 6 decimals; anything else throws `[corvu] Sizes must be a number or a string ending with 'px'. Got <value>`. (corvu-src: packages/resizable/src/lib/utils.ts)
- Given every size computation, when values are stored, then they pass through `fixToPrecision`, which is `parseFloat(value.toFixed(6))`, so all size and ARIA value assertions must expect at most 6 decimal places. (corvu-src: packages/resizable/src/lib/utils.ts)
- Given `Resizable.Root` children as a function, when it renders, then the callback receives `orientation`, `sizes`, `setSizes`, `keyboardDelta`, `handleCursorStyle`, `resize`, `collapse` and `expand`. (corvu-src: packages/resizable/src/Root.tsx)
- Given `Resizable.Panel` children as a function, when it renders, then the callback receives `size`, `minSize`, `maxSize`, `collapsible`, `collapsedSize`, `collapseThreshold`, `collapsed`, `resize`, `collapse`, `expand` and `panelId`. (corvu-src: packages/resizable/src/Panel.tsx)
- Given `resize`, `collapse` or `expand` is called on a panel before its registration effect has run, when it is invoked, then it logs `[corvu] Cannot resize panel before it is mounted. Make sure to call `resize` after mount.` (or the collapse/expand wording) and returns without changing anything. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a `contextId` on Root, when descendants resolve context, then keyed contexts named `resizable-<id>`, `resizable-internal-<id>` and `resizable-panel-<id>` are used, and missing ones throw `[corvu]: Resizable context with id "<id>" not found...` or the panel-specific `usePanelContext` variant. (corvu-src: packages/resizable/src/context.ts)
- Given a resizable part rendered outside a Root, when it resolves context, then it throws `[corvu]: Resizable context not found. Make sure to wrap Resizable components in <Resizable.Root>`, and `usePanelContext` outside a Panel throws `[corvu]: Resizable panel context not found. Make sure to call usePanelContext under <Resizable.Panel>`. (corvu-src: packages/resizable/src/panelContext.ts)
- Given panel sizes are percentages summing to 1, when persistence is wanted, then corvu ships no storage layer: `sizes` plus `onSizesChange` (and `initialSizes` on Root) are the entire persistence contract, so saving and restoring is the consumer's job. (corvu-src: packages/resizable/src/Root.tsx)

### Forms

- Given a `Resizable.Handle` inside a `form`, when it renders as its default `button`, then no `type` attribute is set because it uses `Dynamic` rather than `DynamicButton`, so the button defaults to `type="submit"` and pressing Enter on it both toggles the collapse and submits the form. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a resizable inside a form, when it renders, then no hidden input or form value is produced; panel sizes are never submitted. (corvu-src: packages/resizable/src/Root.tsx)

### Positioning

- Given a handle that has a detected start intersection, when it renders the marker div, then that div is `position: absolute` at `top: 0; left: 0` with `aspect-ratio: 1 / 1`, `z-index: 1`, and is translated fully off the handle with `translate3d(0, -100%, 0)` for a horizontal resizable or `translate3d(-100%, 0, 0)` for a vertical one. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle that has a detected end intersection, when it renders the marker div, then it sits at `bottom: 0; right: 0` and is translated with `translate3d(0, 100%, 0)` horizontally or `translate3d(100%, 0, 0)` vertically. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a horizontal resizable, when an intersection div renders, then it takes `width: 100%` and leaves height to the aspect ratio; a vertical resizable takes `height: 100%` and leaves width to the aspect ratio. (corvu-src: packages/resizable/src/Handle.tsx)
- Given handles from different resizable instances, when they are registered, then intersections are detected globally by comparing `getBoundingClientRect` of every pair of handles with differing orientation, requiring overlap on the cross axis and edge equality within a 1 pixel tolerance. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a handle with `startIntersection: false` or `endIntersection: false`, when an intersection is detected on that edge, then the setter is a no-op so the marker div is never rendered and that corner cannot be dragged diagonally. (corvu-src: packages/resizable/src/Handle.tsx)

### Animation and presence

- Given a panel, when its size changes, then the only animatable property corvu writes is `flex-basis` as a percentage, so any transition must be declared by the consumer on that property. (corvu-src: packages/resizable/src/Panel.tsx)
- Given a handle, when it is dragged on a touch device, then the inline `touch-action: none` is what suppresses native scrolling during the gesture. (corvu-src: packages/resizable/src/Handle.tsx)

### RTL and i18n

- Given a right-to-left document, when a horizontal handle is dragged, then the delta is always computed as `clientX - dragStartX` with no direction awareness, so dragging right always grows the document-order-preceding panel regardless of writing direction. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a right-to-left document, when ArrowLeft or ArrowRight is pressed on a handle, then the mapping is fixed (left decreases, right increases) with no `textDirection` prop equivalent to the calendar's, so RTL keyboard resizing is inverted. (corvu-src: packages/resizable/src/Root.tsx)
- Given `flex-direction: row` on the root, when the document direction is rtl, then the browser reverses the visual panel order while corvu's document-order-based preceding/following logic does not, so `aria-controls` and the size array stay in document order. (corvu-src: packages/resizable/src/Root.tsx)

### SSR and hydration

- Given server rendering, when a panel is emitted before registration, then its size falls back to its `initialSize` if that is a `number` and to `1` otherwise, so a panel without a numeric `initialSize` renders at `flex-basis: 100%` on the server. (corvu-src: packages/resizable/src/Panel.tsx)
- Given server rendering, when `initialSize` is given as a px string, then it cannot be resolved because the root size is unknown, which is why the prop is documented as "If the panel is rendered on the server, this should be a percentage to avoid layout shifts". (corvu-src: packages/resizable/src/Panel.tsx)
- Given server rendering, when a handle is emitted, then `aria-controls`, `aria-valuemin`, `aria-valuemax` and `aria-valuenow` are all absent because they depend on the handle's `ref` and on registered panels. (corvu-src: packages/resizable/src/Handle.tsx)
- Given server rendering, when the root size is read, then `createSize` returns its initial `0` because the sizing effect and `ResizeObserver` only run on the client, so any px size resolved during SSR divides by zero. (corvu-src: packages/utils/src/create/size.ts)
- Given server rendering, when panels register, then registration happens in a `createEffect` so the entire size array is empty in the SSR output and only materialises after client hydration. (corvu-src: packages/resizable/src/Panel.tsx)

### Accessibility tooling

- Given a handle, when an accessibility checker inspects it, then it reads as a focusable `role="separator"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-orientation`, matching the ARIA window splitter pattern. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a handle, when it renders, then corvu sets no `aria-label` or `aria-labelledby`, so naming the separator is left to the consumer and an unnamed splitter will be flagged by automated checks. (corvu-src: packages/resizable/src/Handle.tsx)
- Given `aria-controls` points only at the preceding panel's `id`, when a checker validates the reference, then it resolves because `Resizable.Panel` always renders an `id` (defaulting to `createUniqueId()`), but the following panel is unreferenced. (corvu-src: packages/resizable/src/Panel.tsx)
- Given `aria-valuenow` is the cumulative fraction of preceding panels, when a screen reader announces it, then the value is a 0-to-1 fraction rounded to 6 decimals rather than a percentage integer, and there is no `aria-valuetext`. (corvu-src: packages/resizable/src/Handle.tsx)

### Notes and edge cases

- Given jsdom, when `createSize` measures the root, then `offsetWidth` and `offsetHeight` are always `0`, so `rootSize()` stays `0` and any px `Size` resolves to `parseFloat(px) / 0` which is `Infinity`; an assertion on `aria-valuemax` for a panel with `minSize="100px"` receives `-Infinity` instead of a number. (corvu-src: packages/utils/src/create/size.ts)
- Given jsdom, when `createSize` runs, then `ResizeObserver` does not exist and the effect throws on construction, so every resizable test needs a `ResizeObserver` stub installed before mount. (corvu-src: packages/utils/src/create/size.ts)
- Given jsdom, when a handle registers, then `getBoundingClientRect` returns all zeros so `top === bottom === left === right === 0` and `equalsWithTolerance(0, 0)` is true for every pair of differently oriented handles, meaning a nested layout spuriously renders both `data-corvu-resizable-handle-start-intersection` and `data-corvu-resizable-handle-end-intersection` divs; asserting their absence in a simple two-axis layout will fail. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given jsdom, when `pointerdown` is simulated, then `Element.prototype.setPointerCapture` is not implemented and `PointerEvent` is not constructible by default, so `onPointerDown` throws unless both are polyfilled. (corvu-src: packages/resizable/src/Handle.tsx)
- Given jsdom, when the touch drag path is exercised, then `TouchEvent` and `Touch` are not constructible, so `touchmove` with a populated `touches` list cannot be dispatched without shims. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given jsdom, when a drag is simulated, then move events must be dispatched on `window` (not the handle) with real `clientX`/`clientY`, and the root size must be stubbed non-zero or every delta divides by zero and produces `Infinity` or `NaN` sizes. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a test that asserts real layout, when panel `flex-basis` percentages are checked against rendered pixel widths, then jsdom performs no layout so the computed widths stay `0` and only the inline style string is assertable. (corvu-src: packages/resizable/src/Panel.tsx)
- Given module-level mutable state in `handleManager`, when tests run in sequence, then the `handles` array, `dragStartPos`, `globalHovered` and `altKeyCache` are all module globals that persist across test cases and are only cleared by a completed drag end, so an aborted drag leaves `dragStartPos` non-null and the next test's move events resize immediately. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given module-level mutable state in `cursor.ts`, when tests run in sequence, then `globalCursorStyle`, `cursorStyleElement`, `globalResizeConstraints` and `cachedCursorStyle` persist, and the injected `<style>` element stays in `document.head` across tests unless a drag end or a null hover runs, so any assertion counting head styles leaks. (corvu-src: packages/resizable/src/lib/cursor.ts)
- Given a handle that was never registered because it was `disabled`, when it unmounts, then `unregisterHandle` computes `indexOf(handle) === -1` and calls `splice(-1, 1)`, removing the last legitimately registered handle from the global list instead; this is a real bug a conformance suite should encode as a negative test. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given `sizesToIds` is a plain array mutated outside reactivity, when panels are reordered or spliced, then the per-panel size memo reads `sizesToIds.indexOf(id)` non-reactively, so reordering does not invalidate the memo and stale indices can be read. (corvu-src: packages/resizable/src/Root.tsx)
- Given the root drag baseline is stored in the closure variables `initialSizes` and `altKeyCache`, when two handles in the same root are dragged in quick succession without a drag end, then they share the same baseline and the second drag computes from the first drag's snapshot. (corvu-src: packages/resizable/src/Root.tsx)
- Given `getDistributablePercentage` is called with `collapsible: true` hard-coded for the `'both'` strategy even when the caller asked for `collapsible: false`, when a panel is resized programmatically, then the dry-run pass can allow a collapse that the subsequent `resize` call also permits, so the documented "resize cannot collapse" expectation does not strictly hold. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given `resize()` renormalises by subtracting `(total - 1) / count` from every panel, when one panel is pinned at its `minSize`, then the correction still subtracts from it (the source carries a `TODO: Recognize min and max sizes`), so a panel can end below its declared minimum. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given Solid 2 porting, when `Resizable.Root` and `Resizable.Panel` return `createMemo(...) as unknown as JSX.Element`, then both rely on a memo accessor being usable directly as JSX and on `untrack(() => resolveChildren())` inside nested providers, the same pattern as the calendar. (corvu-src: packages/resizable/src/Root.tsx)
- Given Solid 2 porting, when the panel `collapsed` memo fires `onCollapse`/`onExpand` from inside `createMemo` using the previous-value argument, then side effects live in a memo body, which depends on Solid 1 memo eagerness; under lazier evaluation the callbacks could be skipped or reordered. (corvu-src: packages/resizable/src/Panel.tsx)
- Given Solid 2 porting, when `panelId: createUniqueId()` is placed in the `mergeProps` defaults object, then the id is generated on every Panel setup even when the consumer supplied `panelId`, and its stability depends on Solid's per-render-root id counter. (corvu-src: packages/resizable/src/Panel.tsx)
- Given Solid 2 porting, when `registerPanel` is called inside `untrack` from an effect and `unregisterPanel` from `onCleanup`, then panel lifecycle ordering depends on Solid's effect and cleanup scheduling; the registration also mutates a signal (`setSizes`) from inside an effect. (corvu-src: packages/resizable/src/Panel.tsx)
- Given Solid 2 porting, when `Handle` builds its global handle object inside a `createEffect` that closes over accessors and assigns to the module-scoped `globalHandleCallbacks` let, then re-running that effect replaces the callbacks and an in-flight drag would lose its callback target. (corvu-src: packages/resizable/src/Handle.tsx)
- Given a design decision worth copying, when the resize algorithm is examined, then separating a pure dry-run pass that computes the achievable delta from the pass that actually writes sizes makes clamping, collapsing and cursor feedback all derive from one number, which is a clean model to replicate. (corvu-src: packages/resizable/src/lib/resize.ts)
- Given a design decision worth avoiding, when handle registration and cursor styling are examined, then both are global module singletons (a shared `handles` array and a document-level `*{cursor}` style injection), which couples independent resizable instances and is untestable in isolation; a port should scope both per root. (corvu-src: packages/resizable/src/lib/handleManager.ts)
- Given a design decision worth verifying, when `aria-orientation` is set equal to the resizable's own orientation, then a horizontal resizable (panels side by side, divider drawn vertically) reports `aria-orientation="horizontal"`, which is the opposite of reading the attribute as the orientation of the separator line. (corvu-src: packages/resizable/src/Handle.tsx)

## presence

Kobalte's only presence-adjacent test file is `get-transition-styles.test.ts`.
The corvu bullets below are read from `solid-presence`, the package kobalte
depends on and whose timing its own tests could not pin down.

### Animation and presence

- Given a transition with in { opacity: 1, "background-color": "red" }, out { opacity: 0, "background-color": "blue" } and common { color: "green" }, when getTransitionStyles runs with phase "afterEnter", duration 625 and easing "ease", then the result is exactly opacity 1, "background-color" "red", color "green", "transition-property" "opacity, background-color", "transition-duration" "625ms" and "transition-timing-function" "ease", with no other keys. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given the same transition object, when getTransitionStyles runs with phase "afterExit", duration 625 and easing "ease", then the result is exactly opacity 0, "background-color" "blue", color "green", "transition-property" "opacity, background-color", "transition-duration" "625ms" and "transition-timing-function" "ease". (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given in and out declare the same two property names, when "transition-property" is built, then it is the deduplicated union of the in and out keys joined with ", ", in insertion order, giving "opacity, background-color". (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given common declares color and neither in nor out does, when the styles are composed, then color "green" is present in both phases and is absent from "transition-property", so a common style is applied without being transitioned. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given duration 625 as a number, when the styles are composed, then "transition-duration" is the string "625ms", so the unit is appended by the primitive. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given `createPresence({ show, element })`, when read, then `present()` is true while the state is either `"present"` OR `"hiding"`, and `state()` exposes the three-valued `"present" | "hiding" | "hidden"` machine. Callers keep the element mounted for both present and hiding. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `show` flips to true, when the effect runs, then the state goes straight to `"present"` with no intermediate step, so entering is immediate. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `show` flips to false and the element's computed `animationName` is `"none"`, when the effect runs, then the state goes straight to `"hidden"` and the element unmounts immediately. This is the escape hatch a test needs: with no CSS animation declared, exit is synchronous. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `show` flips to false and the element's computed `display` is `"none"`, when the effect runs, then the state goes straight to `"hidden"` regardless of any animation, because a hidden element never animates. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `show` flips to false, an animation name is present, and that name DIFFERS from the animation name recorded at the last `animationstart`, when the effect runs, then the state becomes `"hiding"` and the element stays mounted. Comparing the previous and current animation names is how corvu detects that a NEW exit animation has actually started rather than the entry animation still being named. (corvu-src: packages/solid-presence/src/presence.ts)
- Given `show` flips to false with an animation name that is UNCHANGED from the last `animationstart`, when the effect runs, then the state goes to `"hidden"` immediately, because no new animation is starting. (corvu-src: packages/solid-presence/src/presence.ts)
- Given the state is `"hiding"`, when an `animationend` fires whose `target` is the tracked element AND whose `animationName` is contained in the element's current computed `animationName`, then the state becomes `"hidden"`. The `includes` check rather than equality handles a computed value listing several comma-separated animations. (corvu-src: packages/solid-presence/src/presence.ts)
- Given the state is `"hiding"`, when an `animationcancel` fires, then it is handled identically to `animationend`, so an interrupted exit still unmounts rather than leaking a permanently-mounted element. (corvu-src: packages/solid-presence/src/presence.ts)
- Given an `animationend` whose `target` is a DESCENDANT rather than the tracked element, when it fires, then it is ignored. (corvu-src: packages/solid-presence/src/presence.ts)
- Given an `animationstart` on the tracked element, when it fires, then the current computed `animationName` is recorded in a plain (non-reactive) variable for later comparison. (corvu-src: packages/solid-presence/src/presence.ts)
- Given an `onStateChange` callback, when provided, then it fires on every state transition with the new state. (corvu-src: packages/solid-presence/src/presence.ts)

### Notes and edge cases

- Given getTransitionStyles is a pure function with no reactivity, when the single test runs, then it still wraps its body in createRoot((dispose) => { ... dispose(); }) and returns it from it, which is ceremony inherited from the surrounding test style. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given both assertions use toStrictEqual against an object spread from the input, when they run, then key order is not asserted but an extra or missing key fails, and no DOM, render, await, fake timer or mocked API is involved. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given the file has no it.skip, describe.skip, it.todo, skipIf or commented-out test, when the implementation is read instead, then its phase map carries a commented-out value, beforeExit mapping to "in" with the original //"out" left inline, so beforeExit deliberately keeps the entered styles and no test pins that decision. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given six transition phases exist, when the tests are surveyed, then only "afterEnter" and "afterExit" are passed, leaving "beforeEnter", "enter", "beforeExit" and "exit" and their in-or-out mapping uncovered. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given a transition may omit common, may declare different property sets in in and out so the union actually differs, or may pass an undefined easing, when the tests are surveyed, then none of those cases is covered. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given only the pure style calculator has a test file, when createTransition itself is surveyed, then mount and unmount timing, the element remaining present during exit, and any data attribute or style applied while transitioning are all uncovered. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- Given the file is ported from mantine src/mantine-core/src/Transition/get-transition-styles/get-transition-styles.test.ts at commit e88b62a, when the port is compared, then the mantine cases for built-in named transitions were dropped and only the custom-transition case survives. (kobalte: packages/core/src/primitives/create-transition/get-transition-styles.test.ts: "getTransitionStyles > supports custom transitions")
- The whole design hinges on CSS ANIMATIONS (`animationstart`, `animationend`, `animationcancel`, `animationName`), not on transitions. Corvu's drawer separately uses `transitionDuration` and `transitionend`. So corvu has TWO independent exit-timing mechanisms and a component must pick one. Our suite needs to decide on one and test it, or test both explicitly. (corvu-src: packages/solid-presence/src/presence.ts)
- In jsdom, `getComputedStyle(el).animationName` returns `""`, not `"none"`. The check is `currentAnimationName === 'none'`, so the fast path does NOT fire in jsdom and the code falls through to comparing `prevAnimationName` (initialised to `"none"`) against `""`. Those differ, so with `prevShow === true` the state becomes `"hiding"` and the element STAYS MOUNTED waiting for an `animationend` that jsdom will never dispatch. That is, precisely and mechanically, why every negative presence assertion in kobalte's accordion, collapsible, checkbox and toast tests is commented out with `// TODO: fix solid-presence vitest`. The bug is a falsy-versus-`"none"` mismatch against jsdom's computed-style stub. A conformance suite can fix it by treating an empty animation name as "none", or by dispatching a synthetic `animationend`, or by stubbing `getComputedStyle`. This single finding explains the largest blind spot in the entire kobalte suite and is the highest-value thing to get right in ours. (corvu-src: packages/solid-presence/src/presence.ts)
- The dependency is not incidental, it is structural. Kobalte imports corvu's `solid-presence` in FOURTEEN source files: `checkbox-indicator`, `radio-group-item-indicator`, `collapsible-content`, `tabs-content`, `dialog-root`, `popover-root`, `select-base`, `combobox-base`, `menu`, `navigation-menu-root`, `tooltip-root`, `hover-card-root` and `toast-root`. It imports corvu's `solid-prevent-scroll` in five (`dialog-content`, `popover-content`, `select-content`, `combobox-content`, `menu-content`). So every commented-out presence assertion in kobalte's suite traces to one corvu primitive, and fixing that primitive's jsdom behavior unblocks assertions across a dozen components at once. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- `collapsible-content.tsx` temporarily sets the element's inline `style.transitionDuration = "0s"` and `style.animationName = "none"` so it can measure the content at full size, then clears both to let the real animation run, publishing the measurements as `--kb-collapsible-content-height` and `--kb-collapsible-content-width`. So the very inline `animationName` that `solid-presence` reads is written and cleared by the component itself mid-transition. The timing is therefore genuinely subtle rather than only a jsdom artifact, which is probably why the author commented the assertions out instead of patching them. (kobalte: packages/core/src/collapsible/collapsible.test.tsx: "should toggle between open/close the content when clicking the trigger")
- `createEffect` is used with a PREVIOUS-VALUE parameter (`createEffect((prevShow) => { ... return show }, access(props.show))`) and the body is wrapped in `untrack`, so only `props.show` is a dependency and the previous value is threaded through the effect's return. Solid 2 needs the same previous-value effect signature for this pattern to port. (corvu-src: packages/solid-presence/src/presence.ts)
- The recorded `animationName` is a plain `let`, deliberately outside reactivity, so an `animationstart` does not schedule an update. (corvu-src: packages/solid-presence/src/presence.ts)
- `createPersistent(component)` is a companion primitive that caches a component's rendered output and its owner (`{ ...getOwner() }` shallow-copied, then `runWithOwner`) so an element removed from the DOM keeps its state for re-insertion. It memoizes on first call only. Copying an owner object like that is deep Solid-internals territory and is exactly the kind of thing likely to break under Solid 2, so it deserves a dedicated conformance test: mount, unmount, remount, and assert internal state survived. (corvu-src: packages/solid-persistent/src/persistent.ts)

## transition-size

### State and controlled/uncontrolled

- Given `createSize({ element, dimension })`, when it is called, then it returns an `Accessor<number>` starting at `0` and both `element` and `dimension` may be plain values or accessors resolved through `access`. (corvu-src: packages/utils/src/create/size.ts)
- Given `createSize` with `dimension: 'width'`, when the element resolves, then the size is read from `offsetWidth`; with `'height'` it is read from `offsetHeight`, so the value is an integer CSS pixel count including padding and border. (corvu-src: packages/utils/src/create/size.ts)
- Given `createSize`, when the element accessor resolves to non-null, then the size is synced once immediately and then on every `ResizeObserver` callback, and the observer is disconnected on cleanup. (corvu-src: packages/utils/src/create/size.ts)
- Given `createSize`, when the `dimension` accessor changes, then the effect re-runs (because `syncSize` reads it inside the effect body), re-syncing the size and recreating the observer. (corvu-src: packages/utils/src/create/size.ts)
- Given `createTransitionSize` with no overrides, when it is called, then `mergeProps` supplies `enabled: true` and `dimension: 'both'`, and it returns `{ transitioning, transitionSize }` where `transitionSize` is `null` when idle. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given `dimension: 'width'` or `'height'`, when a transition starts, then `transitionSize` is a single `number`; with `dimension: 'both'` it is a `[width, height]` tuple. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given `enabled` resolves to `false`, when the effect runs, then no observer is created and no `transitionend` listener is attached, so the utility is fully inert and `transitioning` stays false. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)

### Animation and presence

- Given the first `ResizeObserver` callback after setup, when it fires, then it only records the baseline `startSize` and never starts a transition, so the initial layout never animates. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given `dimension: 'both'`, when a resize changes only the width or only the height, then no transition starts, because the guard requires both `startSize[0] !== currentSize[0]` and `startSize[1] !== currentSize[1]`. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given a qualifying size change, when it is detected, then `transitionSize` is set to the old size and `transitioning` to true in a single `batch`, so the consumer can pin the element at its pre-resize size in the same render. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given a transition has started, when two animation frames have passed (`afterPaint` is a nested `requestAnimationFrame`), then `transitionSize` is updated to the new size so the browser interpolates between the two pinned values. (corvu-src: packages/utils/src/dom/lib.ts)
- Given the element's computed `transitionDuration` parses to `0` after the paint deferral, when that is detected, then `reset` runs immediately so `transitioning` returns to false and `transitionSize` to null without waiting for a `transitionend` that would never arrive. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given a transition in progress, when `transitionend` fires on the element, then `reset` clears `transitioning` and `transitionSize` and re-reads the baseline `startSize` from the element's current offsets. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given a transition in progress, when further `ResizeObserver` callbacks arrive, then they are ignored because the callback returns early while `transitioning()` is true, so a resize mid-transition is not chained into a second transition. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given the effect is cleaned up mid-transition, when cleanup runs, then the observer disconnects, the `transitionend` listener is removed, and `reset` is called so the returned accessors settle to false and null. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)

### SSR and hydration

- Given server rendering, when either utility is used, then nothing runs: both do all their work inside `createEffect`, so `createSize` reports `0` and `createTransitionSize` reports `transitioning: false` and `transitionSize: null` in SSR output. (corvu-src: packages/utils/src/create/size.ts)

### Notes and edge cases

- Given jsdom, when either utility is used, then `ResizeObserver` is undefined and the constructor call throws inside the effect, so every test needs a stub whose `observe` can be triggered manually with a fabricated `ResizeObserverEntry` carrying a `target`. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given jsdom, when a size change is simulated, then `offsetWidth` and `offsetHeight` are always `0`, so `startSize` and `currentSize` are both `[0, 0]`, the change guard never trips, and an assertion that `transitioning` became true fails unless the offset getters are redefined on the element. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given jsdom, when the `afterPaint` branch runs, then `getComputedStyle(target).transitionDuration` returns the empty string, `parseFloat('')` is `NaN`, and `NaN === 0` is false, so the auto-reset never fires and `transitioning` stays true forever until a `transitionend` event is dispatched by hand; asserting a return to `transitioning === false` for an element with no transition will hang or fail. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given `afterPaint` is a nested double `requestAnimationFrame`, when a test advances timers, then two frames must be flushed before `transitionSize` reaches the new value; a single `await Promise.resolve()` or one fake frame observes only the old pinned size. (corvu-src: packages/utils/src/dom/lib.ts)
- Given `startSize` is a closure-level `let` and not a signal, when it is updated, then no reactivity is triggered and its value is invisible to tests except indirectly through whether the next resize starts a transition, which makes the "first callback is a no-op" behaviour hard to assert directly. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given the `ResizeObserver` callback destructures only the first entry with a non-null assertion, when the observer batches multiple entries or delivers an empty array, then only the first entry is honoured and an empty batch throws. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given `createSize`'s observer callback reads `access(props.dimension)` outside any tracking scope, when the dimension accessor is a signal, then the callback path itself creates no dependency and relies on the outer effect having already re-run, which is a subtlety to preserve when porting. (corvu-src: packages/utils/src/create/size.ts)
- Given Solid 2 porting, when both utilities are examined, then they use only `createSignal`, `createEffect`, `onCleanup`, `batch` and `mergeProps` with no stores, `runWithOwner`, keyed contexts or memo-as-JSX, so they are the most portable pieces of the three slugs. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given a design decision worth copying, when the two-phase pin-then-release approach is examined, then measuring the old size, pinning it, then releasing to the new size after a paint is a general recipe for transitioning intrinsically sized elements and does not depend on any framework specifics. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)
- Given a design decision worth avoiding, when the `dimension: 'both'` guard is examined, then requiring both axes to change with `&&` silently skips single-axis resizes, which is almost certainly meant to be `||` and should be fixed rather than replicated. (corvu-src: packages/solid-transition-size/src/transitionSize.ts)

## focus-trap

### Focus management

- Given `createFocusTrap({ element, enabled })` with `enabled` true and an element, when the effect runs, then `document.activeElement` is saved as the element to restore to, the focusable set is computed, and initial focus is applied. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given a container, when the focusable set is computed, then it matches `a[href]`, `button`, `input`, `textarea`, `select`, `details` and anything with a `[tabindex]`, in each case excluding `[tabindex="-1"]`. Note it does NOT exclude `disabled` controls or `hidden` elements, so a disabled button inside the trap counts as focusable. That is a real divergence from the tabbable semantics kobalte's `tabbable.ts` implements. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given the matched elements, when they are ordered, then they are sorted by ASCENDING `tabIndex` with DOM order as the tiebreaker, so positive `tabindex` values are honoured rather than ignored. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given the trap activates, when initial focus is applied after the next paint, then the target is `initialFocusElement` if given, else the first focusable element, else the CONTAINER itself. So a trap around content with nothing focusable focuses the container. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given an `onInitialFocus` callback, when initial focus is about to be applied, then a cancelable `CustomEvent` named `focusTrap.initialFocus` is dispatched on the container with `bubbles: false`, the callback runs, and if it calls `preventDefault` then NO element is focused. The listener is added and removed around the single dispatch. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given focus is on the LAST focusable element, when Tab is pressed without Shift, then the default is prevented and focus moves to the FIRST focusable element. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given focus is on the FIRST focusable element, when Shift+Tab is pressed, then the default is prevented and focus moves to the LAST focusable element. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given the focusable set is EMPTY (length zero, distinct from null), when Tab is pressed anywhere in the document, then the default is prevented outright, so focus cannot escape a trap with nothing to focus. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `observeChanges` (default true), when the DOM inside the container changes, then a `MutationObserver` watching `subtree`, `childList`, `attributes` with `attributeFilter: ['tabindex']` reloads the focusable set after the next paint. So adding a button to an open dialog updates the trap, and changing only a `tabindex` also does, while other attribute changes do not. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given a mutation fires and `document.activeElement` is either `null` or `document.body`, when the trap reloads, then initial focus is re-applied, recovering from a focused element having been removed. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given the trap is cleaned up and `restoreFocus` (default true), when cleanup runs after the next paint, then focus moves to `finalFocusElement` if given, else to the element that was focused before the trap activated; if neither exists, nothing is focused. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given an `onFinalFocus` callback, when focus is about to be restored, then a cancelable `CustomEvent` named `focusTrap.finalFocus` is dispatched on the container and `preventDefault` suppresses the restore. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given `restoreFocus` is false, when cleanup runs, then focus is left wherever it is. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- Given cleanup runs, when it does, then the observer is disconnected and the focusable set is reset to `null`, which is distinct from an empty array and disables the Tab-blocking effect. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)

### Notes and edge cases

- Both initial focus and focus restore are wrapped in `afterPaint`, so neither is observable in the same tick as the state change. A conformance test must advance past a paint (a `requestAnimationFrame` flush, or fake timers) before asserting `document.activeElement`. This is the corvu equivalent of kobalte's `// run restore focus rAF` plus `vi.runAllTimers()`. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- The Tab wrap is implemented by attaching `keydown` listeners to the FIRST and LAST focusable elements individually, re-attached reactively whenever those memos change, rather than by one container-level listener. So a test must fire `keydown` on the boundary element itself, not on the container. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- The trap does NOT prevent focus escaping via a pointer click outside; that is `solid-dismissible`'s job. Focus containment here is Tab-only. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)
- `MutationObserver` exists in jsdom, so the observe-changes path is testable, but its callbacks are async microtasks AND wrapped in `afterPaint`, so a test needs two levels of flushing. (corvu-src: packages/solid-focus-trap/src/focusTrap.ts)

## interact-outside

### Pointer

- Given a div layer ref and a sibling div outside it, when a pointerdown event fires on the outside element, then onPointerDownOutside fires exactly once and onInteractOutside fires exactly once. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given a pointerdown outside the layer, when the handlers run, then onFocusOutside is never called, so pointer and focus paths are independent. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given a div layer ref, when a pointerdown event fires on the layer element itself, then none of onFocusOutside, onPointerDownOutside or onInteractOutside is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should NOT trigger when clicking inside")
- Given an svg element as the layer ref and an HTML div outside it, when a pointerdown event fires on the outside div, then onPointerDownOutside and onInteractOutside each fire once. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given an svg layer ref, when a pointerdown event fires on the svg itself, then no handler is called, so containment works for SVG refs and not only HTMLElement refs. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with HTML outside > Pointer Events > should NOT trigger when clicking inside")
- Given a div layer ref and an svg element outside it, when a pointerdown event fires on the outside svg, then onPointerDownOutside and onInteractOutside each fire once and onFocusOutside does not. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with SVG outside > Pointer Events > should trigger when clicking outside")
- Given a div layer ref with an svg outside, when a pointerdown event fires on the layer div, then no handler is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with SVG outside > Pointer Events > should NOT trigger when clicking inside")
- Given an svg layer ref and an svg outside it, when a pointerdown event fires on the outside svg, then onPointerDownOutside and onInteractOutside each fire once. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with SVG outside > Pointer Events > should trigger when clicking outside")
- Given an svg layer ref and an svg outside it, when a pointerdown event fires on the layer svg, then no handler is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with SVG outside > Pointer Events > should NOT trigger when clicking inside")
- Given a layer div whose subtree lives inside an open shadow root, when a bubbling composed pointerdown fires on a span child of the layer, then onPointerDownOutside and onInteractOutside are not called, because the handler resolves the origin from composedPath()[0] instead of the retargeted event.target which would have been the shadow host. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Shadow DOM > should NOT trigger when clicking the layer's own content inside a shadow root")
- Given a sibling div in the same shadow root as the layer, when a bubbling composed pointerdown fires on that sibling, then onPointerDownOutside and onInteractOutside each fire exactly once, so shadow-aware containment still treats same-root siblings as outside. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Shadow DOM > should still trigger when clicking a sibling inside the same shadow root")

### Focus management

- Given a div layer ref and a focusable sibling div outside it, when a focusin event fires on the outside element, then onFocusOutside fires exactly once and onInteractOutside fires exactly once. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Focus Events > should trigger when focusing outside")
- Given a focusin outside the layer, when the handlers run, then onPointerDownOutside is never called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Focus Events > should trigger when focusing outside")
- Given a div layer ref, when a focusin event fires on the layer element itself, then none of onFocusOutside, onPointerDownOutside or onInteractOutside is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Focus Events > should NOT trigger when focusing inside")
- Given an svg layer ref with tabIndex 0 and an HTML div outside, when a focusin fires on the outside div, then onFocusOutside and onInteractOutside each fire once and onPointerDownOutside does not. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with HTML outside > Focus Events > should trigger when focusing outside")
- Given an svg layer ref, when a focusin fires on the svg itself, then no handler is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with HTML outside > Focus Events > should NOT trigger when focusing inside")
- Given a div layer ref and a focusable svg outside it, when a focusin fires on the outside svg, then onFocusOutside and onInteractOutside each fire once and onPointerDownOutside does not. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with SVG outside > Focus Events > should trigger when focusing outside")
- Given a div layer ref with a focusable svg outside, when a focusin fires on the layer div, then no handler is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with SVG outside > Focus Events > should NOT trigger when focusing inside")
- Given an svg layer ref and a focusable svg outside it, when a focusin fires on the outside svg, then onFocusOutside and onInteractOutside each fire once. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with SVG outside > Focus Events > should trigger when focusing outside")
- Given an svg layer ref and a focusable svg outside it, when a focusin fires on the layer svg, then no handler is called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > SVG ref with SVG outside > Focus Events > should NOT trigger when focusing inside")
- Given a layer whose content lives inside an open shadow root, when a composed focusin fires on a span child of the layer, then onFocusOutside and onInteractOutside are not called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Shadow DOM > should NOT trigger when focus moves to the layer's own content inside a shadow root")

### Dismissal and layering

- Given createInteractOutside is created with isDisabled true, when a focusin fires on the outside element, then none of onFocusOutside, onPointerDownOutside or onInteractOutside is called, so the effect registers no listeners at all. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Configuration > should respect isDisabled prop")
- Given a shouldExcludeElement callback that returns true for the outside element, when a focusin fires on it, then the callback is invoked with that exact element and onInteractOutside is not called. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Configuration > should not trigger when shouldExcludeElement returns true")
- Given a shouldExcludeElement callback that always returns false, when a focusin fires on the outside element, then the callback is invoked with that element and onInteractOutside fires exactly once. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Configuration > should trigger when shouldExcludeElement returns false")

### Notes and edge cases

- Given the implementation defers registering the document pointerdown listener behind setTimeout with a 0 delay, when the test sets up, then vi.useFakeTimers() in beforeEach and vi.runAllTimers() right after render are required to flush it, vi.useRealTimers() runs in afterEach, and focusin needs no timer because it is registered synchronously. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given jsdom has no PointerEvent, when installPointerEvent() from @kobalte/tests runs at the top of the describe, then a beforeAll stubs the global PointerEvent with a FakePointerEvent subclass of MouseEvent exposing pointerType, pointerId, pageX, pageY, width and height, and an afterAll sets global.PointerEvent to undefined. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given createPointerEvent from @kobalte/tests dispatches the pointer events, when it builds one, then it constructs a plain Event with bubbles and cancelable defaulting to true and composed defaulting to false and Object.assigns ctrlKey, metaKey, shiftKey, altKey, button, width and height onto it, so the dispatched "pointerdown" is not a real PointerEvent and carries no pointerType unless one is passed. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given composed defaults to false in createPointerEvent, when the shadow DOM tests dispatch, then they must pass bubbles: true and composed: true explicitly or the event never leaves the shadow root to reach the document listener. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Shadow DOM > should NOT trigger when clicking the layer's own content inside a shadow root")
- Given the shadow DOM case cannot be expressed in JSX, when its setup runs, then it builds the host with document.createElement and attachShadow({ mode: "open" }), calls createInteractOutside inside createRoot((disposer) => ... return disposer), and registers onTestFinished to call dispose() and host.remove(). (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Shadow DOM > should still trigger when clicking a sibling inside the same shadow root")
- Given four element-shape combinations must be covered, when the suite is built, then describe.each iterates a testConfigurations array with a "$name" title template while a shared setupTest helper renders through @solidjs/testing-library render, captures the layer via a ref callback into a plain local read back as () => ref, and returns vi.fn() spies, with no React act() and no await between fireEvent and the expectations. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Focus Events > should trigger when focusing outside")
- Given two pointer tests are declared async, when their bodies are read, then they contain no await, so the async marker is vestigial. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo, skipIf or commented-out test, only design notes such as the shadow DOM explanation that "the layer dismissed itself on pointerdown, the content unmounted, and pointerup never landed on anything". (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Shadow DOM > should NOT trigger when clicking the layer's own content inside a shadow root")
- Given the handlers receive a cancelable CustomEvent whose detail carries originalEvent and isContextMenu, with isContextMenu true for button 2 and for a ctrl key with button 0, when the tests are surveyed, then nothing asserts the event shape and nothing calls preventDefault to check the composed follow-on handler is suppressed. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given a touch pointerdown defers to a one-shot click listener and continuously removes the previous one, when the tests are surveyed, then no test sets pointerType "touch", so that whole path and the triggerTouch helper in packages/tests/src/events.ts are uncovered here. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > HTML ref with HTML outside > Pointer Events > should trigger when clicking outside")
- Given isEventOutside returns false for a target inside an element matching the top layer attribute and for a target detached from the owner document, when the tests are surveyed, then neither guard is covered. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Configuration > should not trigger when shouldExcludeElement returns true")
- Given onCleanup removes the pointerdown, focusin and click listeners and clears the pending registration timeout while an isServer check keeps the effect inert during SSR, when the tests are surveyed, then none of that is asserted. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Configuration > should respect isDisabled prop")
- Given isDisabled is only ever passed as a static true, when the tests are surveyed, then nothing flips it reactively to check listeners are added and removed as the accessor changes. (kobalte: packages/core/src/primitives/create-interact-outside/create-interact-outside.test.tsx: "createInteractOutside > Configuration > should respect isDisabled prop")

## dismissable

Covers kobalte's `DismissableLayer` test file and corvu's `solid-dismissible`
package. They are independent implementations of the same idea.

### Dismissal and layering

- Given a `DismissableLayer` and its trigger both rendered INSIDE a shadow root, with the trigger listed in `excludedElements`, when a composed bubbling `pointerdown` is fired on the trigger, then `onDismiss` is NOT called. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with an excluded trigger inside a shadow root")
- Given a `DismissableLayer` inside a shadow root, when a composed bubbling `pointerdown` is fired on the layer's OWN content, then `onDismiss` is not called. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with the layer's own content inside a shadow root")
- Given a `DismissableLayer` inside a shadow root, when a composed bubbling `pointerdown` is fired on a sibling button that is neither excluded nor inside the layer, then `onDismiss` IS called exactly once. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should still dismiss when interacting outside the layer inside a shadow root")
- Given `createDismissible({ element, onDismiss })`, when it runs, then it composes four independent primitives: escape-key, outside-focus, outside-pointer and no-outside-pointer-events, and `onDismiss` receives a REASON of `"escapeKey"`, `"outsidePointer"` or `"outsideFocus"`. A single discriminated reason argument is a better API than a bare callback and is worth copying. (corvu-src: packages/solid-dismissible/src/create/dismissible.ts)
- Given defaults, when nothing is configured, then `dismissOnEscapeKeyDown`, `dismissOnOutsideFocus`, `dismissOnOutsidePointer` and `noOutsidePointerEvents` are all true and `outsidePointerStrategy` is `"pointerup"`. (corvu-src: packages/solid-dismissible/src/create/dismissible.ts)
- Given an `onEscapeKeyDown` callback, when Escape is pressed, then the callback runs first and `onDismiss("escapeKey")` fires ONLY if the callback did not call `preventDefault`. The same veto pattern applies to `onOutsideFocus` and `onOutsidePointer`. (corvu-src: packages/solid-dismissible/src/create/dismissible.ts)
- Given an outside pointer event, when it is a RIGHT click (`button === 2`) or a ctrl+left click (`button === 0 && ctrlKey`), then `onDismiss` is NOT called, so opening a context menu outside a popover does not dismiss it. The ctrl+left case is the macOS right-click equivalent. (corvu-src: packages/solid-dismissible/src/create/dismissible.ts)
- Given `createOutsidePointer` with the default `"pointerup"` strategy, when a `pointerup` occurs whose target is not contained by the element and not contained by any entry of `ignore`, then the callback fires. Switching `strategy` to `"pointerdown"` changes which event is listened to, and the listener is re-attached when the strategy changes. (corvu-src: packages/solid-dismissible/src/create/outsidePointer.ts)
- Given an `ignore` array containing `null` entries, when a pointer event is evaluated, then `null` entries are skipped rather than throwing, so refs that are not yet assigned are safe. (corvu-src: packages/solid-dismissible/src/create/outsidePointer.ts)
- Given `createOutsideFocus`, when a `focusin` occurs whose target is not contained by the element, then a cancelable `CustomEvent` named `dismissible.outsideFocus` is dispatched ON the element and the callback receives it, so `preventDefault` can veto the dismissal. (corvu-src: packages/solid-dismissible/src/create/outsideFocus.ts)
- Given `ignorePointerEvents` is on, when a `pointerdown` happens anywhere, then a flag is set and the NEXT `focusin` is swallowed and the flag cleared. This stops one click from dismissing twice, once via pointer and once via the focus change it causes. `createDismissible` turns this on whenever either `noOutsidePointerEvents` OR `dismissOnOutsidePointer` is enabled. (corvu-src: packages/solid-dismissible/src/create/outsideFocus.ts)
- Given `createNoPointerEvents` is enabled, when it runs, then `pointer-events: none` is applied to `document.body` through the refcounted `createStyle` helper under the key `"no-pointer-events"`. (corvu-src: packages/solid-dismissible/src/create/noPointerEvents.ts)
- Given the `Dismissible` COMPONENT, when the outermost instance mounts, then it creates a `DismissibleContext` holding an ordered array of layer ids; a nested instance finds that context and only registers a layer. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given several nested `Dismissible` layers, when any dismissal trigger fires, then escape-key, outside-focus and outside-pointer dismissal are each gated on `isLastLayer()`, meaning the layer's id is the LAST entry in the shared array. So only the topmost layer dismisses, and Escape closes one layer at a time. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given a `Dismissible` layer whose `enabled` becomes false, when the effect runs, then it removes itself from both the context's layer array and a module-level `activeDismissibles` signal, so the layer beneath becomes the last layer and takes over dismissal. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given a `Dismissible` layer unmounts, when cleanup runs, then it removes itself from both registries, so an unmount and a disable are equivalent. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given `Dismissible` children as a function, when rendered, then they receive `{ isLastLayer }` so a layer can style or behave differently when it is not on top. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- Given `createStyle({ key, element, style, properties, cleanup })`, when several callers use the SAME key, then an `activeCount` is incremented and the original inline styles are captured only once; the styles are reverted only when the LAST caller cleans up, at which point the captured originals are restored, any custom properties are removed, the `style` attribute is deleted entirely if nothing is left, and the optional `cleanup` callback runs. This refcounting is what makes nested dialogs not fight over `document.body`. (corvu-src: packages/utils/src/create/style.ts)

### Notes and edge cases

- This whole file exists to pin one bug, kobalte issue #445, and the test's own doc comment explains the mechanism precisely: `createInteractOutside` listens on the DOCUMENT, so inside a shadow root `event.target` is RETARGETED to the shadow host. The host matches neither `excludedElements` nor the layer, so both the trigger and the layer's own content read as "outside", and the layer dismissed itself on pointerdown. The user-visible symptoms were a `Select` trigger closing and instantly reopening its dropdown, and clicking a menu item dismissing the layer before the item could activate. Any outside-interaction primitive we build must resolve targets through `event.composedPath()` rather than `event.target`, and our conformance suite needs this exact shadow-root case. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with an excluded trigger inside a shadow root")
- This is the ONLY test file in the repo that imports `render` from `solid-js/web` rather than from `@solidjs/testing-library`, because it needs to render into a custom container (the `shadowRoot`) and testing-library's `render` always mounts into a generated div in `document.body`. It manages teardown itself: it keeps the returned `dispose` and calls it plus `host.remove()` inside `onTestFinished`. If our suite needs shadow-DOM or portal-target coverage, this is the pattern. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with an excluded trigger inside a shadow root")
- `vi.runAllTimers()` is called immediately after mounting with the comment that "`createInteractOutside` defers registering its pointerdown listener by a tick". The outside-interaction listener is deliberately registered LATE so the very click that opened the layer cannot immediately dismiss it. A conformance suite has to advance timers after opening any layer before firing an outside click, or the test will pass for the wrong reason. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should still dismiss when interacting outside the layer inside a shadow root")
- The pointer events must be constructed with `{ bubbles: true, composed: true }`; `composed` is what lets an event cross the shadow boundary, and `createPointerEvent` passes `bubbles`, `cancelable` and `composed` through the `Event` constructor precisely because they are read-only afterwards. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with an excluded trigger inside a shadow root")
- `excludedElements` takes an array of ACCESSORS (`[() => trigger]`), not elements, which is the Solid-idiomatic way to pass a ref that is not yet assigned at call time. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with an excluded trigger inside a shadow root")
- Nothing else about `DismissableLayer` is tested: not Escape-key dismissal, not focus-outside dismissal, not nested-layer ordering (only the top layer should dismiss), not `disableOutsidePointerEvents` and the `pointer-events: none` it applies to the body, and not the non-shadow-DOM happy path. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should still dismiss when interacting outside the layer inside a shadow root")
- Every listener is on `document`, so a conformance test dispatches its outside events on `document` or on a sibling element, never on the layer. Unlike kobalte's `createInteractOutside` there is NO deferred registration here, so the very pointer event that opens a layer could dismiss it immediately if it reaches the document after the effect has run. Corvu mitigates this by defaulting `outsidePointerStrategy` to `"pointerup"`, so a `pointerdown` that opens something is never the event that closes it. That is a genuinely cleverer fix than kobalte's `setTimeout`, and it is worth adopting along with a conformance test for it. (corvu-src: packages/solid-dismissible/src/create/outsidePointer.ts)
- `activeDismissibles` is a MODULE-LEVEL signal shared across the whole app, so a test must ensure layers are unmounted between cases or the array leaks. (corvu-src: packages/solid-dismissible/src/Dismissible.tsx)
- `createStyle`'s `activeStyles` is a module-level `Map`, which is also cross-test global state. (corvu-src: packages/utils/src/create/style.ts)

## escape-key

### Keyboard

- Given `createEscapeKeyDown`, when enabled, then a `keydown` listener is attached to the DOCUMENT and fires the callback only for `event.key === "Escape"`. (corvu-src: packages/solid-dismissible/src/create/escapeKeyDown.ts)
- Given `createEscapeKeyDown` is composed into `createDismissible`, when Escape is pressed, then the layer's own `onEscapeKeyDown` runs first and dismissal proceeds only if it did not call `preventDefault`, and only when this layer is the topmost one. (corvu-src: packages/solid-dismissible/src/create/dismissible.ts)

### Notes and edge cases

- Kobalte has a `create-escape-key-down` primitive with NO test file, so Escape handling is untested on the kobalte side except incidentally through the skipped `select` and `combobox` suites. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by pressing the Escape key")
- The listener is on `document`, not on the element, so a conformance test dispatches `keydown` on `document` and does not need the layer focused. Corvu checks only `event.key`, never `event.code` or the legacy `keyCode`. (corvu-src: packages/solid-dismissible/src/create/escapeKeyDown.ts)

## hide-outside

### Roles and attributes

- Given a checkbox, a button and a second checkbox rendered as siblings, when ariaHideOutside is called with the button as the only target and the deferred frame flushes, then both checkboxes carry aria-hidden="true". (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the same tree, when the call is active, then the target button has no aria-hidden attribute at all rather than aria-hidden="false". (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the call is active, when the returned revert function runs and the frame flushes, then aria-hidden is removed outright from both checkboxes and the button still has no aria-hidden. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the same tree, when ariaHideOutside is called with both checkboxes as targets, then neither checkbox has aria-hidden="true" and the button has an aria-hidden attribute. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except multiple elements")
- Given both checkboxes are the targets, when revert runs and the frame flushes, then aria-hidden is absent from both checkboxes and from the button. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except multiple elements")
- Given the first checkbox is wrapped in a plain div, when ariaHideOutside targets the button, then aria-hidden="true" lands on the wrapping div and the tree walk does not descend to put its own aria-hidden on the checkbox inside. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not traverse into an already hidden container")
- Given the second checkbox is an unwrapped sibling, when ariaHideOutside targets the button, then that checkbox receives its own aria-hidden="true". (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not traverse into an already hidden container")
- Given the wrapper div and the sibling checkbox are hidden, when revert runs and the frame flushes, then aria-hidden is removed from the wrapper div and from the sibling checkbox. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not traverse into an already hidden container")
- Given one checkbox is authored in markup with aria-hidden="true", when ariaHideOutside targets the button, then that checkbox keeps its authored aria-hidden="true" and is not refcounted by the call. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not overwrite an existing aria-hidden prop")
- Given one checkbox was already aria-hidden="true" in markup, when revert runs and the frame flushes, then the checkbox the call itself hid loses aria-hidden while the authored aria-hidden="true" is left in place, so the role query still matches exactly one checkbox. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not overwrite an existing aria-hidden prop")
- Given ariaHideOutside is active on two buttons and a signal later inserts two checkboxes as siblings outside them, when the insertion happens, then the MutationObserver hides the newly added checkboxes so neither is in the accessibility tree. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added outside while active")
- Given nodes were hidden by the MutationObserver, when the revert button calls the revert function and the frame flushes, then both inserted checkboxes are visible again. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added outside while active")
- Given a div[data-testid="test"] sibling of the target button, when ariaHideOutside targets the button, then the div has an aria-hidden attribute. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added to an already hidden container")
- Given the container div is already hidden and a click inserts one checkbox inside it plus one checkbox outside it, when the MutationObserver has run, then the checkbox inside the hidden container gets NO aria-hidden of its own because the ancestor attribute is recursive, the checkbox outside gets aria-hidden="true", and the container keeps its aria-hidden. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added to an already hidden container")
- Given both new checkboxes are hidden by container or attribute, when revert runs and the frame flushes, then getAllByRole returns 2 checkboxes. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added to an already hidden container")
- Given a div[data-testid="test"] is the target and it contains a button, when ariaHideOutside runs, then the checkboxes outside the target are hidden while the button inside the target and the target itself stay queryable. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added inside a target element")
- Given the target div is active and a click inserts a radio inside it, when the mutation observer tick has passed, then the radio inside the target is NOT hidden, the button inside the target stays visible, and the outside checkboxes remain hidden. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added inside a target element")
- Given the target div contains a button and a radio, when revert runs and the frame flushes, then the checkboxes, the radio, the button and the target div are all queryable. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added inside a target element")
- Given a role="grid" with two role="row" children each holding a role="gridcell", when ariaHideOutside targets the second row, then aria-hidden="true" is applied to the first row AND separately to the gridcell inside it, breaking the usual "do not descend into a hidden node" rule because role="row" is excepted for WebKit bug 222623. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [row]")
- Given the second row is the target, when the call is active, then neither the second row nor its gridcell has aria-hidden="true". (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [row]")
- Given the first row and its cell are hidden, when revert runs and the frame flushes, then aria-hidden="true" is gone from both rows and both gridcells. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [row]")

### Dismissal and layering

- Given a tree of two checkboxes, two radios and a button, when ariaHideOutside is first called with the button plus both radios as targets, then only the checkboxes leave the accessibility tree. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times")
- Given a first call keeps the radios visible, when a second nested ariaHideOutside call targets only the button, then the radios are hidden as well while the checkboxes stay hidden. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times")
- Given two nested calls are active, when the second call is reverted, then the radios become visible again but the checkboxes remain hidden because the first call still holds a reference count on them. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times")
- Given only the first call remains, when it is reverted, then checkboxes, radios and the button are all back in the accessibility tree. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times")
- Given two nested calls are active, when the OUTER call is reverted first, then both the checkboxes and the radios stay hidden because the inner call still holds their reference counts. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times and restored out of order")
- Given the outer call has already been reverted, when the inner call is reverted, then every element is back in the accessibility tree. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times and restored out of order")
- Given a checkbox hidden by a first call, when that call is reverted and a second ariaHideOutside for the same target is started synchronously in the same tick before the deferred frame runs, then the checkbox still has aria-hidden="true" after the flush, so ownership hands off with no window where the element becomes visible. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > keeps elements hidden during an immediate ownership handoff")
- Given the second call owns the hidden checkbox after a handoff, when the second call is reverted and the frame flushes, then aria-hidden is removed. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > keeps elements hidden during an immediate ownership handoff")

### Accessibility tooling

- Given the button is the only target, when the call is active, then getAllByRole("checkbox") throws because no checkbox is in the accessibility tree while getByRole("button") resolves. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the call was reverted, when the role queries run again, then neither getAllByRole("checkbox") nor getByRole("button") throws. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given both checkboxes are the targets, when the call is active, then queryAllByRole("checkbox") is non-null and queryByRole("button") is null. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except multiple elements")
- Given a checkbox hidden only through its wrapping container, when getAllByRole("checkbox") runs, then it throws, so hiding a container is enough to remove descendants from the accessibility tree. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not traverse into an already hidden container")
- Given a pre-existing aria-hidden="true" checkbox, when getAllByRole("checkbox") runs before the call, then exactly one checkbox is returned, and the same query returns one again after revert. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should not overwrite an existing aria-hidden prop")
- Given the toggle button inserts checkboxes while the call is active, when waitFor retries getAllByRole("checkbox"), then it keeps throwing while getAllByRole("button") resolves. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added outside while active")
- Given checkboxes inserted into and beside an already hidden container, when they must be inspected for attributes, then they are only reachable via getAllByRole("checkbox", { hidden: true }). (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added to an already hidden container")
- Given the target div initially has no radio, when queryByRole("radio") runs before the click, then it is null, and getByRole("radio") resolves after the radio is inserted inside the target. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added inside a target element")

### Notes and edge cases

- Given aria-hidden is applied and removed behind setTimeout plus requestAnimationFrame in the implementation to dodge Chromium's "Blocked aria-hidden on an element because its descendant retained focus" warning, when a test asserts the attribute, then it must first await the file's local flush helper, which is setTimeout followed by requestAnimationFrame, or every aria-hidden assertion fails. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the flush helper depends on a live requestAnimationFrame, when the file is set up, then it installs no fake timers and runs entirely on real timers. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given each test needs a mounted tree, when it renders, then it uses render from @solidjs/testing-library with a thunk component rather than solid-js/web render, and no React-style act() wrapper exists because Solid scheduling plus the explicit flush stand in for it. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given a signal inserts nodes while a call is active, when the test asserts they were hidden, then it needs two distinct waits, an await Promise.resolve() right after fireEvent.click so the Solid update renders the nodes and a waitFor around the getAllByRole("checkbox") assertion because MutationObserver callbacks arrive on a microtask and hiding is deferred another frame. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added outside while active")
- Given a radio is inserted inside the target element, when that test waits for the observer, then it uses two back-to-back await Promise.resolve() calls, the second commented as the mutation observer tick, instead of waitFor. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added inside a target element")
- Given the primitive is imperative, when a test drives it from JSX, then targets are captured through Solid ref callbacks into plain local variables, ariaHideOutside is called inside onMount, and the revert function is held in a closure variable that a second button invokes on click. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added outside while active")
- Given jsdom supplies TreeWalker, MutationObserver and requestAnimationFrame, when the tests run, then no DOM API is mocked in this file. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo or skipIf and no commented-out test, only explanatory comments such as "MutationObserver is async, hiding is deferred a frame" and the citation "for https://bugs.webkit.org/show_bug.cgi?id=222623". (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [row]")
- Given the refcount WeakMap and the observer stack are module-level singletons and packages/core/vite.config.ts sets isolate: false, when a test leaks a revert, then state bleeds into later test files and nothing asserts the stack is empty after a revert. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times and restored out of order")
- Given a nested call disconnects the previous MutationObserver and reverting re-observes with the previous one, when the tests are surveyed, then no test covers that handoff directly. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > work when called multiple times")
- Given ariaHideOutside accepts a root argument defaulting to document.body, when the tests are surveyed, then none passes a root, so scoped hiding is unverified. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the walk and the observer both exempt elements matching the live announcer attribute and the top layer attribute, including added nodes whose dataset.liveAnnouncer or dataset.reactAriaTopLayer is "true", when the tests are surveyed, then no test covers either exemption. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the observer's removedNodes branch deletes nodes from the visible and hidden sets, when the tests are surveyed, then nothing removes a node while a call is active, so that branch never runs. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should handle when a new element is added outside while active")
- Given createHideOutside wraps the imperative function in a createEffect with an isDisabled prop and onCleanup, when the tests are surveyed, then only ariaHideOutside is exercised and the reactive wrapper is untested. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the file is ported from react-spectrum packages/@react-aria/overlays/test/ariaHideOutside.test.js at commit 810579b, when the port is compared, then React render plus act() pairs became @solidjs/testing-library render plus the setTimeout and requestAnimationFrame flush, and React state toggles became createSignal plus fireEvent.click. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > should hide everything except the provided element [button]")
- Given the upstream suite has no equivalent case, when "keeps elements hidden during an immediate ownership handoff" is traced, then it is a kobalte addition that exists only because kobalte defers the attribute writes a frame, and a suite applying aria-hidden synchronously would not need it. (kobalte: packages/core/src/primitives/create-hide-outside/aria-hide-outside.test.tsx: "ariaHideOutside > keeps elements hidden during an immediate ownership handoff")

## prevent-scroll

### Dismissal and layering

- Given `createPreventScroll({ element, enabled })`, when enabled, then the instance pushes its unique id onto a module-level stack and only the LAST id on the stack is "active", so nested scroll locks do not fight and unmounting the top one hands control back to the one below. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `hideScrollbar` (default true), when enabled, then `overflow: hidden` is applied to `document.documentElement` through the refcounted `createStyle` under the key `"prevent-scroll"`. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `preventScrollbarShift` (default true) and a measured scrollbar width of `window.innerWidth - documentElement.clientWidth` greater than zero, when enabled, then `padding-right` becomes `calc(<existing computed padding-right> + <scrollbarWidth>px)` and a `--scrollbar-width` custom property is set on the document element. Preserving the existing padding through `calc` rather than overwriting it is the detail most implementations get wrong. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `preventScrollbarShiftMode: 'margin'`, when enabled, then `margin-right` is adjusted by the same `calc` instead of `padding-right`. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a measured scrollbar width of zero (an overlay scrollbar, or a mobile browser), when enabled, then neither padding nor margin is touched and no `--scrollbar-width` property is set. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `restoreScrollPosition` (default true) and a non-zero scrollbar width, when the lock is cleaned up, then `window.scrollTo(offsetLeft, offsetTop)` restores the `window.scrollX`/`scrollY` captured at lock time, undoing any scroll jump. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given `preventScrollbarShift` is false, when enabled, then only `overflow: hidden` is applied with no padding compensation and no scroll restore. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given the instance is the ACTIVE (topmost) lock, when enabled, then `wheel`, `touchstart` and `touchmove` listeners are attached to `document` with `{ passive: false }` so they can call `preventDefault`. A non-topmost instance attaches none. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a `wheel` event, when the dominant axis is picked by comparing `|deltaX|` to `|deltaY|` and the target is INSIDE the allowed `element`, then the event is prevented only if scrolling would NOT result on that axis; if the target is outside the element (or no element is given) the event is ALWAYS prevented. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a `wheel` or `touchmove` event that is not `cancelable`, when it would be prevented, then `preventDefault` is skipped, avoiding a console warning. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a `touchstart`, when it fires, then the starting coordinates are recorded and the cached axis and delta are reset to null, so each gesture picks its own axis fresh. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a `touchmove` with exactly TWO touches, when it fires, then it is prevented unless `allowPinchZoom` is true (default false). So pinch-zoom is blocked by default while a scroll lock is active. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a `touchmove` and no axis cached yet, when it fires, then the axis and its delta are computed once from the touchstart coordinates and CACHED for the rest of the gesture, so a gesture that starts vertical stays vertical even if it curves. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given a `touchmove` whose target is an `<input type="range">`, when it fires, then it is never prevented, so a slider stays draggable inside a locked surface. Note the wheel handler has no such exemption. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Given the scroll-would-happen check, when the delta is positive, then it returns false if the remaining scroll is 1 pixel or less; when negative, it returns false if the current scroll offset is less than 1. The asymmetry carries the comment that Firefox reports an available scroll of 1 when there is none. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)

### Notes and edge cases

- Attribution: the file's header credits `react-remove-scroll` by Anton Korzunov. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Kobalte depends on `solid-prevent-scroll` as a package dependency and has NO test for it, and corvu has no tests either, so this primitive is entirely unverified in both libraries despite being load-bearing for every dialog, drawer and popover. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- Testing this in jsdom is hard for concrete reasons: `window.innerWidth - documentElement.clientWidth` is 0 so the scrollbar-shift path never runs, `TouchEvent` and `event.touches` need constructing by hand, `wheel` events need explicit `cancelable: true`, and `scrollHeight`/`scrollTop` are always 0 so `wouldScroll` always returns false. Every one of those needs a stub before a single assertion means anything. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)
- The module-level `preventScrollStack` signal is global across tests. (corvu-src: packages/solid-prevent-scroll/src/preventScroll.ts)

## selectable

### Keyboard

- Given `createList`'s `mergeProps` defaults, when it sets up, then `initialActive` is `null`, `orientation` is `'vertical'`, `loop` is `true`, `textDirection` is `'ltr'`, `handleTab` is `true`, `vimMode` is `false`, and `vimKeys` is `{ up: 'k', down: 'j', right: 'l', left: 'h' }`. (corvu-src: packages/solid-list/src/list.ts)
- Given a keydown, when the key is matched, then `event.key` is lowercased first, so matching is case-insensitive and `ArrowDown` is compared as `arrowdown`. (corvu-src: packages/solid-list/src/list.ts)
- Given `orientation` is `'vertical'`, when the next and previous key sets are computed, then they are `arrowdown` and `arrowup` and the `textDirection` is ignored. (corvu-src: packages/solid-list/src/list.ts)
- Given `orientation` is `'horizontal'` and `textDirection` is `'ltr'`, when the key sets are computed, then next is `arrowright` and previous is `arrowleft`. (corvu-src: packages/solid-list/src/list.ts)
- Given `vimMode` is `true`, when the key sets are computed, then the matching vim key from `vimKeys` is added alongside the arrow key for that direction, so `j` behaves like `ArrowDown` in a vertical list. (corvu-src: packages/solid-list/src/list.ts)
- Given the next key is pressed with no active item, when it is handled, then the first item becomes active; the previous key with no active item makes the last item active. (corvu-src: packages/solid-list/src/list.ts)
- Given the last item is active and `loop` is `true`, when the next key is pressed, then the first item becomes active; with `loop` `false` the active item does not change but the event is still prevented. (corvu-src: packages/solid-list/src/list.ts)
- Given `home` is pressed, when it is handled, then the event is prevented and the first item becomes active; `end` selects the last item. (corvu-src: packages/solid-list/src/list.ts)
- Given `handleTab` is `true` and an item is active, when `Tab` is pressed and the active item is not the last, then the event is prevented and the next item becomes active; `Shift+Tab` moves to the previous item unless the active item is the first. (corvu-src: packages/solid-list/src/list.ts)
- Given `handleTab` is `true` and the active item is at the relevant boundary, when `Tab` or `Shift+Tab` is pressed, then the event is not prevented so focus leaves the list naturally. (corvu-src: packages/solid-list/src/list.ts)
- Given the items array is empty, when any key is pressed, then the handler returns before matching anything and no `preventDefault` is called. (corvu-src: packages/solid-list/src/list.ts)
- Given any recognised navigation key is matched, when it is handled, then `preventDefault` is always called before the active item changes. (corvu-src: packages/solid-list/src/list.ts)
- Given `createMultiList`'s `mergeProps` defaults, when it sets up, then `initialCursor` is `null`, `initialActive` is `[]`, `initialSelected` is `[]`, and the `orientation`, `loop`, `textDirection`, `handleTab`, `vimMode`, and `vimKeys` defaults match `createList`. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given a multi list with no cursor, when `Shift` plus the next key is pressed, then the first item becomes the cursor and the only active item, and `selected` is set to exactly that item. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given a multi list with no cursor, when `Shift` plus the previous key is pressed, then the last item becomes the cursor and the only active item, and `selected` is set to exactly that item. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given exactly one active item and no established direction, when `Shift` plus a direction key is pressed, then the cursor item's own selection is toggled and the internal direction is recorded, so the first shift press selects the current row rather than moving. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given a shift-extension already in progress, when the next item is not yet active, then the cursor moves to it, it is appended to `active`, and its selection is toggled on. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given a shift-extension already in progress, when the item the cursor moves to is already active, then the old cursor is removed from `active` and its selection is toggled off, which shrinks the range instead of growing it. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given `Shift` is held, when the cursor is at the far end of the list, then no wrap occurs regardless of `loop`, because looping is only reachable on the non-shift branch. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given `home` or `end` is pressed in a multi list, when it is handled, then `setCursorActive` collapses `active` to that single item and resets the direction, while `selected` is left exactly as it was. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given `handleTab` is `true` in a multi list, when `Tab` or `Shift+Tab` moves within bounds, then `setCursorActive` is used, so tabbing collapses a multi-item active range down to one item. (corvu-src: packages/solid-list/src/multi-list.ts)

### State and controlled/uncontrolled

- Given `createList` returns `{ active, setActive, onKeyDown }`, when a consumer wires it up, then it is the consumer's job to attach `onKeyDown` and to react to `active`; the primitive touches no DOM at all. (corvu-src: packages/solid-list/src/list.ts)
- Given `createList` builds its state with `createControllableSignal` but never passes a `value` accessor, when a consumer wants controlled behaviour, then there is no way to supply it and the only external write path is the returned `setActive`. (corvu-src: packages/solid-list/src/list.ts)
- Given `onActiveChange` is supplied, when the active item changes to the same value, then the `Object.is` guard inside the controllable signal suppresses the callback. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given `setActive` is called with a value, when that value is itself a function, then the controllable signal treats it as an updater, which is why the list always calls `setActive(() => item)` with an extra arrow. (corvu-src: packages/solid-list/src/list.ts)
- Given `createMultiList` returns `{ cursor, setCursor, active, setActive, setCursorActive, selected, setSelected, toggleSelected, onKeyDown }`, when a consumer uses it, then cursor (focus), active (range anchor set), and selected (committed selection) are three separate pieces of state. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given `toggleSelected`, when it is called with an item already in `selected`, then the item is removed; otherwise it is appended, so selection order is interaction order. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given items are matched by identity, when `indexOf` locates the cursor or active item, then reference equality is used, so recreating item objects between renders breaks navigation. (corvu-src: packages/solid-list/src/multi-list.ts)

### RTL and i18n

- Given `orientation` is `'horizontal'` and `textDirection` is `'rtl'`, when the key sets are computed, then next is `arrowleft` and previous is `arrowright`. (corvu-src: packages/solid-list/src/list.ts)
- Given `textDirection` is a prop, when the list navigates, then it never reads `dir` from the DOM or `getComputedStyle(...).direction`, so an RTL page must pass the prop explicitly. (corvu-src: packages/solid-list/src/list.ts)
- Given `vimKeys` defaults to Latin `hjkl`, when a non-Latin keyboard layout is used with `vimMode`, then the produced `event.key` will not match and only the arrow keys work. (corvu-src: packages/solid-list/src/list.ts)

### Notes and edge cases

- Given these two primitives, when they are tested, then nothing in them touches the DOM, layout, observers, or timers, so both are fully testable in jsdom by constructing `KeyboardEvent`s and asserting on the returned accessors. (corvu-src: packages/solid-list/src/list.ts)
- Given `event.preventDefault` is the only DOM interaction, when a test asserts it, then a plain `new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true })` suffices and `defaultPrevented` is observable without a rendered component. (corvu-src: packages/solid-list/src/list.ts)
- Given `direction` in `createMultiList`, when a shift-extension is in progress, then the flag is a plain closure variable outside the reactive system, so a test cannot read or seed it and shift sequences must be replayed key by key from a known start. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given both primitives are plain functions with no module-level state, when many lists are created in one test file, then nothing leaks between them; the only shared state is whatever the consumer passes in. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given `createControllableSignal` is used with only `initialValue` and `onChange`, when Solid 2 changes setter or `untrack` semantics, then these primitives inherit that risk since every state write goes through the same helper. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given Solid 2 portability, when these primitives run, then they use only `mergeProps`, `createSignal`, and `untrack`, with no `createMemo` returned as JSX, no owner copying, and no keyed contexts, which makes them the most portable code in the repo. (corvu-src: packages/solid-list/src/list.ts)
- Given a design decision worth copying, when keyboard navigation is factored out, then the list primitive is index- and identity-agnostic (`items` can be any `T[]`, and the accordion passes an array of integers), which lets the same primitive drive triggers, options, and cells. (corvu-src: packages/solid-list/src/list.ts)
- Given a design decision worth copying, when multi-selection is modelled, then cursor, active, and selected are separate signals rather than one selection array, which is what makes shrink-the-range shift behaviour expressible. (corvu-src: packages/solid-list/src/multi-list.ts)
- Given a design decision worth examining, when `handleTab` is `true` by default, then the list hijacks `Tab` inside its bounds, which conflicts with the ARIA pattern of a single tab stop plus arrow keys; the accordion explicitly opts out with `handleTab: false`. (corvu-src: packages/solid-list/src/list.ts)

## polymorphic

### Roles and attributes

- Given Polymorphic rendered with as="div" and a data-testid, when the element is queried, then it is an instance of HTMLDivElement, so a string as prop becomes that intrinsic tag. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given Polymorphic rendered with as set to a custom component that spreads its props onto a button carrying id="custom", when the element is queried, then it is an instance of HTMLButtonElement. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' custom component prop")
- Given the custom component owns an id="custom" attribute, when Polymorphic renders it and passes data-testid through, then the rendered element still has id="custom", so the component's own attributes survive the forwarded props. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' custom component prop")

### Notes and edge cases

- Given both tests need a mounted element, when they run, then they use @solidjs/testing-library render with a thunk and assert synchronously with no await, no createRoot and no manual dispose. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given the vite config sets globals: true, when the file imports are read, then expect is still imported explicitly from vitest, so the import is redundant. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given the custom component is typed as (props: any) and spreads props after its own id and type, when the id assertion passes, then the test cannot distinguish prop merging from prop overriding. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' custom component prop")
- Given the file needs no timing or pointer control, when its setup is read, then it uses no installPointerEvent, fake timers, waitFor, MutationObserver, mocked DOM API or React act() equivalent. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo, skipIf or commented-out test or assertion. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given Polymorphic throws when as is missing, with the message "[kobalte]: Polymorphic is missing the required `as` prop.", when the tests are surveyed, then that error is untested. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given the two tests only check the rendered element constructor and one id, when ref forwarding, class and style merging, event handler composition between wrapper and as component, and children preservation are surveyed, then none of them is tested. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' custom component prop")
- Given the implementation delegates to Dynamic from solid-js/web, when the tests are surveyed, then none changes the as prop reactively from one tag to another. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' string prop")
- Given the file is ported from radix-ui packages/react/slot/src/Slot.test.tsx at commit b14ac1f, when the port is compared, then it is reduced to two smoke tests because Solid Dynamic replaces React Slot cloning, and the radix cases for slottable children, merged onClick handlers defined on both slot and child, ref composition and children-count errors were all dropped, which fits kobalte exposing an as prop rather than asChild. (kobalte: packages/core/src/polymorphic/polymorphic.test.tsx: "Polymorphic > should render the 'as' custom component prop")

## floating

### Roles and attributes

- Given `FloatingArrow` with no `as` prop, when it renders, then the element is a `div` with inline `position: absolute`, `left` and `top` from `arrowX` / `arrowY` when non-null, the side opposite the placement set to `0px`, a per-direction `transform`, a per-direction `transform-origin`, and `pointer-events: none`. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)
- Given `FloatingArrow` has no children, when it renders, then `width` and `height` are both set to the `size` value in pixels (default 16) and a built-in 14 by 8 `viewBox` SVG path with `fill="currentColor"` is rendered. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)
- Given `FloatingArrow` has children, when it renders, then `width` and `height` are left undefined, the default SVG is not rendered, and the children are used instead. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)
- Given the arrow direction resolves to `top`, when the transform is applied, then it is `rotate(180deg)` with `transform-origin: center 0px`; `bottom` uses `translate3d(0, 100%, 0)` with no origin; `left` uses `translate3d(0, 50%, 0) rotate(90deg) translate3d(-50%, 0, 0)` with origin `0px 0px`; `right` uses `translate3d(0, 50%, 0) rotate(-90deg) translate3d(50%, 0, 0)` with origin `100% 0px`. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)
- Given the arrow reads the placement, when it derives its direction, then it takes only the side part of the placement and maps it through `PositionToDirection`, so an aligned placement such as `bottom-start` still resolves to `top`. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)

### Positioning

- Given `createFloating`'s `mergeProps` defaults, when it sets up, then `enabled` is `true`, `placement` is `'bottom'`, `strategy` is `'absolute'`, and `options` is `null`. (corvu-src: packages/utils/src/create/floating.ts)
- Given the initial floating state, when nothing has been computed yet, then `placement` is the requested placement, `x` and `y` are `0`, and `width`, `height`, `maxWidth`, `maxHeight`, `arrowX`, and `arrowY` are all `null`. (corvu-src: packages/utils/src/create/floating.ts)
- Given `enabled` is `false`, or either the reference or the floating element is `null`, when the positioning effect runs, then it returns immediately and no `autoUpdate` subscription is created. (corvu-src: packages/utils/src/create/floating.ts)
- Given the middleware array is built, when options are present, then the order is `offset`, `shift`, `arrow`, `flip`, `size`, then `flip` again for `fallbackStrategy: 'bestFit'`, then `autoPlacement`, `hide`, and `inline`. (corvu-src: packages/utils/src/create/floating.ts)
- Given `flip` is enabled with `fallbackStrategy: 'initialPlacement'`, when middleware is assembled, then `flip` is not pushed before `size` and, because `bestFit` is also not matched, it is never pushed at all. (corvu-src: packages/utils/src/create/floating.ts)
- Given `flip` is enabled with `fallbackStrategy: 'bestFit'`, when middleware is assembled, then `flip` runs after `size` rather than before it. (corvu-src: packages/utils/src/create/floating.ts)
- Given `autoPlacement` is requested while `flip` is also enabled, when middleware is assembled, then `autoPlacement` is skipped entirely and flipping wins. (corvu-src: packages/utils/src/create/floating.ts)
- Given `options.size.matchSize` is `true`, when the size middleware applies, then the floating `width` is set from the reference width for `top` and `bottom` placements, and the floating `height` is set from the reference height for `left` and `right` placements. (corvu-src: packages/utils/src/create/floating.ts)
- Given `options.size.fitViewPort` is `true`, when the size middleware applies, then `maxHeight` is set to the available height for `top` and `bottom` placements and `maxWidth` to the available width for `left` and `right` placements. (corvu-src: packages/utils/src/create/floating.ts)
- Given an arrow element is registered, when middleware is assembled, then the `arrow` middleware is added with `padding` taken from `options.arrow`, and the resulting `middlewareData.arrow.x` / `.y` land in the state as `arrowX` / `arrowY`. (corvu-src: packages/utils/src/create/floating.ts)
- Given no arrow middleware data is produced, when the state is updated, then `arrowX` and `arrowY` are set to `null` rather than left at their previous values. (corvu-src: packages/utils/src/create/floating.ts)
- Given `computePosition` resolves with a result identical to the current state, when the update runs, then `floatingStatesMatch` short-circuits the write so no downstream reactive update happens. (corvu-src: packages/utils/src/create/floating.ts)
- Given the positioning effect is torn down, when cleanup runs, then the `autoUpdate` unsubscribe function returned by `@floating-ui/dom` is called through `onCleanup`. (corvu-src: packages/utils/src/create/floating.ts)
- Given `getFloatingStyle`, when it produces a style object, then it sets `position` to the strategy, `top` and `left` in pixels from the computed `y` and `x`, `width`, `height`, `max-width`, and `max-height` only when the corresponding state field is non-null, and the custom property `--corvu-floating-transform-origin`. (corvu-src: packages/utils/src/floating/lib.ts)
- Given a side, when `PositionToDirection` maps it, then `top` maps to `bottom`, `bottom` to `top`, `left` to `right`, and `right` to `left`, giving the edge nearest the reference. (corvu-src: packages/utils/src/floating/lib.ts)

### Animation and presence

- Given a floating element animates a scale, when `--corvu-floating-transform-origin` is consumed in CSS, then the origin is meant to sit on the edge closest to the reference so the element appears to grow out of the trigger. (corvu-src: packages/utils/src/floating/lib.ts)

### Notes and edge cases

- Given the `switch` in `getFloatingStyle`, when the placement is `top` or `bottom`, then the `top` / `bottom` case has no `break` and falls through into the `left` / `right` case, so the origin is rebuilt in the wrong order: `bottom` yields `"top center"` instead of `"center top"` and `top` yields `"bottom center"` instead of `"center bottom"`. (corvu-src: packages/utils/src/floating/lib.ts)
- Given an aligned placement such as `bottom-start` or `right-end`, when `getFloatingStyle` computes the origin, then no `switch` case matches at all and `transformOrigin` stays `undefined`, so `--corvu-floating-transform-origin` is written as `undefined` and the CSS variable is effectively unset for every aligned placement. (corvu-src: packages/utils/src/floating/lib.ts)
- Given jsdom, when `autoUpdate` is called, then `@floating-ui/dom` constructs a `ResizeObserver` for the reference and floating elements, which jsdom does not implement, so any test that renders an open popover or tooltip throws unless `ResizeObserver` is polyfilled. (corvu-src: packages/utils/src/create/floating.ts)
- Given jsdom, when `computePosition` runs, then every `getBoundingClientRect` is all zeros and `clientWidth` / `clientHeight` on the viewport are fixed, so `x` and `y` resolve to `0`, `flip` never changes placement, `shift` never shifts, and `size`'s `availableWidth` / `availableHeight` are meaningless; assertions such as "placement flips to top when there is no room below" or "max-height matches the available space" cannot be written. (corvu-src: packages/utils/src/create/floating.ts)
- Given `computePosition` returns a promise, when a test asserts on `data-placement` or the inline `top` / `left`, then it must flush at least one microtask after the render because the state write happens in the `.then` handler, and `autoUpdate` may invoke the callback again on its own schedule. (corvu-src: packages/utils/src/create/floating.ts)
- Given jsdom, when the arrow's inline `left` and `top` are asserted, then `middlewareData.arrow` is computed from zero-sized rects so both are `0`, and the arrow's own size is only observable as the inline `width` / `height` strings, never as layout. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)
- Given the floating state is a single signal holding an object, when any field changes, then the whole object is replaced, so every consumer of `floatingState()` re-runs even when only `arrowX` moved. (corvu-src: packages/utils/src/create/floating.ts)
- Given `floatingStatesMatch` treats `undefined` fields in the candidate as "unchanged", when a partial update omits a field, then the comparison passes for that field and a genuine reset to `undefined` cannot be expressed. (corvu-src: packages/utils/src/create/floating.ts)
- Given Solid 2 portability, when `getFloatingStyle` is used, then it returns a `createMemo` that the caller immediately invokes and spreads into a style object, so the memo is created inside whatever computation the component is currently in. (corvu-src: packages/utils/src/floating/lib.ts)
- Given Solid 2 portability, when `FloatingArrow` receives `floatingState`, then it takes the already-read state object as a plain prop rather than an accessor, relying on Solid 1's prop getters to keep it reactive through `mergeProps` and `splitProps`. (corvu-src: packages/utils/src/components/FloatingArrow.tsx)
- Given a design decision worth copying, when positioning state is exposed, then it is a single plain object of primitives (`placement`, `x`, `y`, sizes, arrow offsets) rather than a style string, so a consumer can build its own style or read the placement for animation. (corvu-src: packages/utils/src/create/floating.ts)
- Given a design decision worth avoiding, when `matchSize` and `fitViewPort` write back, then the `size` middleware's `apply` callback sets a Solid signal during `computePosition`, so layout computation and reactive state updates are interleaved inside a third-party middleware. (corvu-src: packages/utils/src/create/floating.ts)

## form-control

### Roles and attributes

- Given a form control with no id prop wrapping a label, a description and an error message, when it renders, then the label id matches the pattern ending in "-label", the description id ends in "-description" and the error message id ends in "-error-message", all derived from a generated form-control-<uid> base. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given a form control with id "foo", when it renders, then the label id is exactly "foo-label", the description id is exactly "foo-description" and the error message id is exactly "foo-error-message". (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate ids based on form control id")
- Given explicit id props on the label, the description and the error message, when the control renders with its own id "custom-form-control-id", then each part keeps its own id verbatim as "custom-label-id", "custom-description-id" and "custom-error-message-id" and the generated suffixes are not applied. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > supports custom ids")
- Given a form control with no validation, required, disabled or readOnly props, when the label and description render, then neither element has data-valid, data-invalid, data-required, data-disabled or data-readonly. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should not have 'data-*' attributes by default")
- Given validationState "valid", when the label and description render, then both carry data-valid. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should have 'data-valid' attribute when form control is valid")
- Given validationState "invalid", when the label and description render, then both carry data-invalid. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should have 'data-invalid' attribute when form control is invalid")
- Given the required prop, when the label and description render, then both carry data-required. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should have 'data-required' attribute when form control is required")
- Given the disabled prop, when the label and description render, then both carry data-disabled. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should have 'data-disabled' attribute when form control is disabled")
- Given the readOnly prop, when the label and description render, then both carry data-readonly, spelled without a hyphen between "read" and "only". (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should have 'data-readonly' attribute when form control is readonly")

### Forms

- Given validationState "invalid" and no other state props, when the error message renders, then it carries data-invalid and carries none of data-required, data-disabled or data-readonly. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should add 'data-invalid' attribute on error message when form control is invalid")
- Given validationState "invalid" plus required, when the error message renders, then it carries data-required. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should add 'data-required' attribute on error message when form control is invalid")
- Given validationState "invalid" plus disabled, when the error message renders, then it carries data-disabled. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should add 'data-disabled' attribute on error message when form control is invalid")
- Given validationState "invalid" plus readOnly, when the error message renders, then it carries data-readonly. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should add 'data-readonly' attribute on error message when form control is invalid")

### Notes and edge cases

- Given FormControlErrorMessage wraps its output in a Show gated on forceMount or validationState being "invalid", when an error message test renders, then it must pass validationState "invalid" or getByText("ErrorMessage") throws, so that gating is an implicit precondition rather than an asserted behaviour. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should add 'data-invalid' attribute on error message when form control is invalid")
- Given the primitive needs a context, when each test renders, then it uses @solidjs/testing-library render with a local FormControl wrapper that calls createFormControl and pushes the returned context through FormControlContext.Provider, and no createRoot or manual dispose appears in this file. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given id registration happens in a createRenderEffect and a createEffect during render, when the assertions run, then they run synchronously right after render with no await Promise.resolve() and no React act() equivalent. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given the file needs no timing or pointer control, when its setup is read, then it installs no installPointerEvent, no fake timers, no waitFor and no mocked DOM API. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should not have 'data-*' attributes by default")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo, skipIf or commented-out test or assertion. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given getAriaLabelledBy joins the field's own aria-labelledby, then the registered label id, then the field's own id but only when an aria-labelledby exists from either source and the field also has an aria-label, filtering falsy entries, space-joining the rest and returning undefined when empty, when the tests are surveyed, then none of that merge rule is asserted. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given getAriaDescribedBy joins the description id, then the error message id, then any user-supplied aria-describedby in that fixed order, using aria-describedby for the error message rather than aria-errormessage because VoiceOver and NVDA do not support the latter, and returning undefined when empty, when the tests are surveyed, then that merge rule is untested. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given createFormControlField generates a field id with the "field" suffix, registers it with cleanup and exposes ariaLabel, ariaLabelledBy and ariaDescribedBy accessors, when the tests are surveyed, then it is never exercised. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > supports custom ids")
- Given FormControlLabel sets for to the registered field id only when createTagName resolves the rendered tag to "label" and leaves it undefined otherwise, when the tests are surveyed, then the for attribute is never asserted and no test renders the label polymorphically as another element. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")
- Given the context name accessor falls back from the name prop to the form control id, registerErrorMessage cleans up when validationState stops being "invalid", and the error message accepts forceMount, when the tests are surveyed, then all three are uncovered. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should add 'data-invalid' attribute on error message when form control is invalid")
- Given the implementation sets each data attribute to the empty string, when the tests assert them, then they only check presence, never the value, and never re-check after a prop changes reactively. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > data-attributes > should have 'data-valid' attribute when form control is valid")
- Given the file is ported from react-spectrum packages/@react-aria/label/test/useLabel.test.js and useField.test.js at commit 810579b, when the port is compared, then only the id-generation half survived, since upstream assertions on the returned labelProps and fieldProps, htmlFor wiring, the aria-labelledby and aria-describedby strings and the element-type fallbacks for non-label wrappers were all dropped, while the data-* suite has no upstream counterpart because it tests kobalte's own styling contract. (kobalte: packages/core/src/form-control/create-form-control.test.tsx: "createFormControl > ids > should generate default ids")

## controllable-signal

### State and controlled/uncontrolled

- Given an uncontrolled signal created with a defaultValue accessor returning "defaultValue" and an onChange spy, when nothing has happened yet, then the value reads "defaultValue" and onChange has not been called, so mounting never fires onChange. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given the uncontrolled signal, when setValue("newValue") is called, then the value becomes "newValue" and onChange was last called with "newValue". (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given the uncontrolled signal already holds "newValue", when setValue("newValue") is called again, then the value stays "newValue" and onChange is not called, because the setter compares with Object.is and skips equal values. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given the uncontrolled signal with defaultValue "defaultValue", when setValue is called with an updater function, then the updater receives "defaultValue" as the previous value, the value becomes its return "newValue" and onChange was last called with "newValue". (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue with callback behavior (uncontrolled mode)")
- Given the uncontrolled signal now holds "newValue", when setValue is called with an updater that receives "newValue" and returns "newValue", then the value is unchanged and onChange is not called. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue with callback behavior (uncontrolled mode)")
- Given a controlled signal created with a value accessor returning "controlledValue" and an onChange spy, when nothing has happened yet, then the value reads "controlledValue" and onChange has not been called. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (controlled mode)")
- Given the controlled signal, when setValue("newValue") is called, then the value still reads "controlledValue" because the internal signal is bypassed while controlled, yet onChange was last called with "newValue". (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (controlled mode)")
- Given the controlled signal, when setValue is called with the value it already reports, "controlledValue", then onChange is not called, so the equality check runs against the controlled value rather than an internal one. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (controlled mode)")
- Given the controlled signal, when setValue is called with an updater function, then the updater receives the controlled "controlledValue" as previous value, the reported value stays "controlledValue" and onChange was last called with the updater's return "newValue". (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue with callback behavior (controlled mode)")
- Given the controlled signal, when setValue is called with an updater that returns the same "controlledValue", then the value is unchanged and onChange is not called. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue with callback behavior (controlled mode)")
- Given a component reading a controlled signal whose value prop is a parent signal initialised to "controlledValue", when it first renders, then the component shows "controlledValue" and onChange has not been called. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should update value after props.value change (controlled mode)")
- Given the parent signal drives the value prop, when a button click sets the parent signal to "updated", then the component's text content becomes "updated" and onChange is still not called, so an external value change never echoes back through onChange. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should update value after props.value change (controlled mode)")
- Given a signal created with only an onChange spy and no value or defaultValue, when it is first read, then the value is undefined and onChange has not been called. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should only trigger onChange once when using NaN")
- Given that signal, when setValue(NaN) is called, then the value is NaN and onChange has been called exactly once with NaN. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should only trigger onChange once when using NaN")
- Given the value is already NaN, when setValue(NaN) is called again, then the value stays NaN and onChange has still been called exactly once, because Object.is treats NaN as equal to NaN unlike a strict equality check. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should only trigger onChange once when using NaN")
- Given `createControllableSignal({ value, initialValue, onChange })`, when read, then it returns a standard Solid `[get, set]` pair so callers cannot tell whether it is controlled. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the `value` accessor returns `undefined`, when read, then the signal is UNCONTROLLED and falls back to its internal signal seeded from `initialValue`. `undefined` (not `null`, not absence of the prop) is the sentinel, so a controlled signal can legitimately hold `null` but never `undefined`. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the `value` accessor returns a defined value, when read, then that value is returned and the internal signal is ignored. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the setter is called with a FUNCTION, when it runs, then the function is applied to the CURRENT resolved value (controlled or uncontrolled, whichever is active) to compute the next value, so the updater form works in both modes. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the setter is called with a value that is `Object.is`-equal to the current one, when it runs, then NEITHER the internal signal is written NOR is `onChange` fired. A no-op set is completely silent, which matters because it is the difference between one and two change events per interaction. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the signal is UNCONTROLLED and the setter is called with a new value, when it runs, then the internal signal is written AND `onChange` fires with the new value. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the signal is CONTROLLED and the setter is called with a new value, when it runs, then the internal signal is NOT written and only `onChange` fires, so the owner of the prop decides whether the value actually moves. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the setter is called, when it runs, then the whole body executes inside `untrack`, so reading the current value to compute the next one does not create a dependency on the calling reactive scope. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- Given the setter is called, when it returns, then it returns the new value, matching Solid's `Setter` contract. (corvu-src: packages/utils/src/create/controllableSignal.ts)

### Notes and edge cases

- Given each test needs a reactive owner without a DOM, when it runs, then its body is an async callback passed to createRoot and returned directly from it, with dispose() as the last statement inside. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given the createRoot callback is async, when the awaits inside it run, then they execute after createRoot has already returned, so the trailing dispose() is not synchronous with root creation and a suite copying this shape inherits that subtlety. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (controlled mode)")
- Given the value accessor is a createMemo while the setter calls onChange synchronously inside untrack, when a test asserts after setValue, then it awaits Promise.resolve() first, and that flush guards the memo read rather than the spy. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given each test re-checks that a repeated set does not fire onChange, when it prepares that check, then it calls onChangeSpy.mockClear() with the comment "clear it, so we can check more easily that it's not called in the next expect" rather than asserting a call count. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given a controlled prop must change during a test, when the setup is built, then TestComponentWrapper holds createSignal(props.value) and passes the accessor itself as value={state} into TestComponent, which spreads the whole props object into createControllableSignal, and the change is driven by fireEvent.click followed by await Promise.resolve() before the toHaveTextContent assertion. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should update value after props.value change (controlled mode)")
- Given only the props.value test needs a DOM, when it runs, then it nests @solidjs/testing-library render inside createRoot so a manual root and a testing-library root are alive at once, while the other five tests touch no DOM. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should update value after props.value change (controlled mode)")
- Given the file is read for testing machinery, when its imports and helpers are checked, then two test components are typed as (props: any), the NaN test uses Number.NaN rather than a bare literal, and there is no installPointerEvent, fake timers, waitFor, MutationObserver or React act(). (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should only trigger onChange once when using NaN")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo, skipIf or commented-out test, only explanatory comments such as "won't invoke onChange for the same value twice in a row". (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (uncontrolled mode)")
- Given isControlled is a createMemo over whether the value accessor returns undefined, so a value prop that becomes undefined silently hands control back to the internal signal with whatever stale value it holds, when the tests are surveyed, then none switches between controlled and uncontrolled at runtime. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue behavior (controlled mode)")
- Given a controlled signal could start with value returning undefined, be given both defaultValue and value, or have onChange feed back into the controlling signal so the value really moves, when the tests are surveyed, then none of those combinations is covered. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should update value after props.value change (controlled mode)")
- Given the module also exports createControllableBooleanSignal with a false fallback, createControllableArraySignal with an empty array fallback and createControllableSetSignal with a new Set() fallback, when the tests are surveyed, then all three are untested and nothing checks that the array and set fallbacks return a fresh instance per read. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should only trigger onChange once when using NaN")
- Given the setter accessWith overload makes a function value ambiguous with an updater callback, when the tests are surveyed, then no test stores a function as the value. (kobalte: packages/core/src/primitives/create-controllable-signal/create-controllable-signal.test.tsx: "createControllableSignal > should handle setValue with callback behavior (uncontrolled mode)")
- Corvu's version is about 50 lines and has three overloads distinguishing the presence of `initialValue` for typing. Kobalte's `create-controllable-signal` is a separate implementation with its own test file; compare the two when designing ours. (corvu-src: packages/utils/src/create/controllableSignal.ts)
- The `Object.is` equality gate is the piece most likely to be got wrong. Every kobalte controlled-component test asserts `onChange` was called EXACTLY once for one interaction, and that only holds if a no-op set is silent. Make it an explicit conformance test. (corvu-src: packages/utils/src/create/controllableSignal.ts)

## disclosure-state

### State and controlled/uncontrolled

- Given createDisclosureState with defaultOpen true and no open prop, when isOpen is read, then it is true, so the uncontrolled default is respected. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be default 'open' (uncontrolled)")
- Given createDisclosureState with open true and an onOpenChange spy, when isOpen is read, then it is true. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be controlled")
- Given a controlled state with open true, when toggle() is called, then isOpen stays true because the controlling prop does not change, while onOpenChange is called exactly once with false. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be controlled")
- Given an uncontrolled state with defaultOpen false, when setIsOpen(true) is called, then isOpen becomes true, and when setIsOpen(false) is called after that, it becomes false again. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should set 'isOpen' state with the value from 'setIsOpen'")
- Given an uncontrolled state with defaultOpen false, when open() is called, then isOpen becomes true. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should set 'isOpen' state to true when calling 'open'")
- Given an uncontrolled state with defaultOpen true, when close() is called, then isOpen becomes false. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should set 'isOpen' state to false when calling 'close'")
- Given an uncontrolled state with defaultOpen false, when toggle() is called twice, then isOpen goes true and then false, so toggle reads the current value each time. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should toggle 'isOpen' state when calling 'toggle'")

### Notes and edge cases

- Given each test needs a reactive owner, when it runs, then it wraps its body in createRoot((dispose) => { ... dispose(); }) with a synchronous callback and discards the return value rather than returning it from it, unlike the controllable-signal file. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be default 'open' (uncontrolled)")
- Given the state is read outside any effect, when open, close, toggle or setIsOpen is called, then the assertion runs synchronously with no await Promise.resolve() flush anywhere in the file. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should toggle 'isOpen' state when calling 'toggle'")
- Given the file is a .ts with no JSX, when it runs, then it uses no @solidjs/testing-library render and touches no DOM, so there is no act() analogue, no installPointerEvent, no fake timers, no waitFor and no mocked DOM API. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be controlled")
- Given open is passed as a plain boolean rather than an accessor, when createDisclosureState unwraps it with access(), then the MaybeAccessor path is exercised, but no test drives the controlled prop from a signal so a controlled open value never changes mid-test. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be controlled")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo, skipIf or commented-out test or assertion. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > can be default 'open' (uncontrolled)")
- Given only the controlled test asserts onOpenChange, when the uncontrolled open, close, setIsOpen and toggle tests run, then they check the value and never the callback. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should set 'isOpen' state to true when calling 'open'")
- Given defaultOpen is coerced with a double negation so isOpen reads false when neither open nor defaultOpen is given, when the tests are surveyed, then that fallback is untested, as is calling open() while already open or close() while already closed to confirm onOpenChange is skipped. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should set 'isOpen' state to false when calling 'close'")
- Given setIsOpen accepts an updater function per its type, when the tests are surveyed, then none passes one. (kobalte: packages/core/src/primitives/create-disclosure-state/create-disclosure-state.test.ts: "createDisclosureState > should set 'isOpen' state with the value from 'setIsOpen'")

## tag-name

### Roles and attributes

- Given createTagName called with a ref accessor that resolves to a rendered div and a fallback accessor returning "button", when an effect reads the accessor after render, then it returns "div", the lowercased tagName of the real element, so the fallback loses to the DOM. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use 'tagName' from ref")
- Given createTagName with a ref accessor that stays undefined because the rendered div never receives the ref, and a fallback accessor returning "button", when an effect reads the accessor after render, then it returns "button". (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use type as 'tagName' when ref is undefined")

### Notes and edge cases

- Given the value is produced by a createEffect inside the component, when a test asserts it, then it renders through @solidjs/testing-library render with a thunk, reads a module-scope variable the effect wrote, and asserts synchronously with no await, which works only because Solid flushes the effect during the render call. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use 'tagName' from ref")
- Given the ref is a plain mutable local declared with let and passed as ref={ref}, when it is read back through the accessor () => ref, then it is not a signal, so the initial createSignal value inside createTagName comes from the fallback and only its createEffect picks up the element. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use 'tagName' from ref")
- Given the file needs no owner or timing control, when its setup is read, then it uses no createRoot, no manual dispose, no await Promise.resolve(), no installPointerEvent, no fake timers, no waitFor, no MutationObserver, no mocked DOM API and no React act() equivalent. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use type as 'tagName' when ref is undefined")
- Given the file is scanned for skipped work, when every test declaration is checked, then there is no it.skip, describe.skip, it.todo, skipIf or commented-out test or assertion. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use 'tagName' from ref")
- Given the fallback is filtered through a string check so a Component fallback yields undefined rather than a tag name, when the tests are surveyed, then none passes a component fallback or omits the fallback entirely. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use type as 'tagName' when ref is undefined")
- Given the primitive returns a signal so the tag name can change, when the tests are surveyed, then nothing asserts it updates reactively once the ref resolves or points at a different element. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use 'tagName' from ref")
- Given the file is adapted from ariakit packages/ariakit-react-utils/src/**tests**/hooks-test.tsx at commit 8a13899, when the port is compared, then React renderHook became a component plus a createEffect that captures the value into an outer variable. (kobalte: packages/core/src/primitives/create-tag-name/create-tag-name.test.tsx: "createTagName > should use 'tagName' from ref")

## i18n

### RTL and i18n

- Given an I18nProvider with no locale prop wrapping a component that reads useLocale, when it renders, then locale reads "en-US" and direction reads "ltr". (kobalte: packages/core/src/i18n/i18n.test.tsx: "I18nProvider > should use default locale when no one is provided")
- Given an I18nProvider with locale="ar-AR", when it renders, then locale reads "ar-AR" and direction reads "rtl", so the direction is derived from the locale rather than passed in. (kobalte: packages/core/src/i18n/i18n.test.tsx: "I18nProvider > should use provided locale")
- Given createDefaultLocale called with no provider, when locale and direction are read, then they are "en-US" and "ltr". (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should use en-US locale by default")
- Given window.addEventListener and window.removeEventListener are spied on, when createDefaultLocale mounts, then it registers a "languagechange" listener, and when the owner cleans up, it removes that same listener. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should add and remove languagechange listener correctly")

### Notes and edge cases

- Given the provider tests need a DOM, when they run, then they use @solidjs/testing-library render with a thunk and assert with toHaveTextContent on spans carrying data-testid="locale" and data-testid="direction", synchronously and with no await. (kobalte: packages/core/src/i18n/i18n.test.tsx: "I18nProvider > should use default locale when no one is provided")
- Given createDefaultLocale can run outside a component, when its two tests run, then they use createRoot((dispose) => { ... dispose(); }) with no DOM at all. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should use en-US locale by default")
- Given the listener test puts its expectation inside onMount and the removeEventListener expectation inside an onCleanup registered within that onMount, when dispose() runs synchronously before the root effects flush, then neither assertion is ever evaluated and the test passes vacuously, so a real suite must assert after a genuine mount or use render plus an explicit unmount. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should add and remove languagechange listener correctly")
- Given the same test sets up its spies, when those two statements are read, then vi.spyOn(window, "addEventListener").mock; and vi.spyOn(window, "removeEventListener").mock; are dangling property accesses that do nothing, and the spies are never restored. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should add and remove languagechange listener correctly")
- Given only window.addEventListener and window.removeEventListener are replaced with vi.spyOn, when the rest of the environment is checked, then navigator.language is left as jsdom provides it, which is why the default locale test depends on the environment reporting "en-US" and on Intl.DateTimeFormat.supportedLocalesOf accepting it, and setupMatchMediaMock from packages/tests/src/mocks.ts is not used here. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should use en-US locale by default")
- Given a module-level listener Set attaches the "languagechange" handler only when it is empty and detaches only when it empties again, when earlier tests in the same file have already called createDefaultLocale and vite runs with isolate: false, then the spy assertions would be order-dependent even if they ran. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should add and remove languagechange listener correctly")
- Given the file has no it.skip, describe.skip, it.todo, skipIf or commented-out test, when the listener test is read, then its unreachable assertions amount to a silently skipped test. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should add and remove languagechange listener correctly")
- Given updateLocale refreshes the module-level current locale and fans out to every listener, when the tests are surveyed, then nothing dispatches a "languagechange" event, so the locale updating on a browser language change is uncovered. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should add and remove languagechange listener correctly")
- Given isRTL uses Intl.Locale maximize against an RTL script set and falls back to a language-prefix check against an RTL language set when Intl.Locale is unavailable, when the tests are surveyed, then direction is only sampled at "ar-AR", neither branch is isolated, and no locale whose script rather than language decides direction is tested. (kobalte: packages/core/src/i18n/i18n.test.tsx: "I18nProvider > should use provided locale")
- Given getDefaultLocale resets the locale to "en-US" when Intl.DateTimeFormat.supportedLocalesOf throws, when the tests are surveyed, then that fallback has no test. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should use en-US locale by default")
- Given createDefaultLocale returns a hardcoded "en-US" and "ltr" while isServer is true and only switches to the client locale after hydration, when the tests are surveyed, then nothing renders on the server or checks that the direction flips after hydration. (kobalte: packages/core/src/i18n/i18n.test.tsx: "createDefaultLocale > should use en-US locale by default")
- Given useLocale falls back to createDefaultLocale when no I18nProvider is above it and a nested I18nProvider should override an outer one, when the tests are surveyed, then neither case is tested. (kobalte: packages/core/src/i18n/i18n.test.tsx: "I18nProvider > should use provided locale")

## color-utils

### Notes and edge cases

- Given each of six RGB input spellings (`"rgb(50 100 200)"`, `"rgb(50 100 200 / 0.2)"`, `"rgb(50 100 200 / 20%)"`, `"rgba(50, 100, 200, 0.2)"`, `"rgb(50, 100, 200)"`, `"rgb(50,100,200)"`), when `parseColor` runs, then `getColorSpace()` is `"rgb"` and `getColorChannels()` is exactly `["red", "green", "blue"]`. Space-separated, comma-separated, no-space, `rgba()` and both alpha spellings all parse. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct parse string %s to color")
- Given each of those six inputs, when `toString()` runs with no format, then the output normalises to `"rgb(50, 100, 200)"` for the opaque ones and `"rgb(50, 100, 200 / 0.2)"` for all three alpha spellings, so `20%` and `0.2` converge and `rgba(...)` round-trips as `rgb(... / ...)`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct result toString")
- Given `parseColor("rgb(0 0 0)")`, when `toString("hex")` runs, then the result is `"#000000"`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct result toString from rgb to hex")
- Given `parseColor("rgb(0 0 0 / 0.5)")`, when `toString("hexa")` runs, then the result is `"#00000080"`, so alpha `0.5` becomes the byte `80`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct result toString from rgb to hexa")
- Given `parseColor("rgb(50 100 200)")`, when `toFormat("hsl").toString("hsl")` runs, then the result is `"hsl(220 60% 49.02%)"`, so lightness is rounded to two decimals. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct result toString from rgb to hsl")
- Given `parseColor("rgb(50 100 200 / 0.5)")`, when `toFormat("hsla").toString("hsla")` runs, then the result is `"hsla(220 60% 49.02% / 0.5)"`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct result toString from rgb to hsla")
- Given each of the six inputs, when converted to hex, then an OPAQUE colour gives `"#3264C8"` (uppercase) while an ALPHA colour converted with `toString("hexa")` gives `"#3264C833"`, so `0.2` alpha becomes `33`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correctly parses and converts to various formats")
- Given an alpha RGB colour, when converted with `toFormat("hsl").toString("hsl")`, then the alpha is PRESERVED in the output as `"hsl(220 60% 49.02% / 0.2)"` even though the target format is `hsl` rather than `hsla`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correctly parses and converts to various formats")
- Given any of the six inputs, when converted with `toFormat("hsb").toString("hsb")`, then the result is `"hsb(220 75% 78.43%)"`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correctly parses and converts to various formats")
- Given an alpha RGB colour, when converted with `toFormat("hsba").toString("hsba")`, then the result is `"hsba(220 75% 78.43% 0.2)"`, with the alpha SPACE-separated rather than slash-separated, unlike `hsla`. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correctly parses and converts to various formats")
- Given the strings `"invalid"` and `"#zzzzzz"`, when `parseColor` runs, then it throws an error whose message is exactly `` `Invalid color value: ${color}` ``. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > throws an error for invalid color strings")
- Given `parseColor("rgb(50 100 200 / 0)")` (fully transparent), when converted with `toFormat("hsba").toString("hsba")`, then the result is `"hsba(220 75% 78.43% 0)"`, so a zero alpha is emitted rather than dropped as falsy. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > handles edge cases for alpha values")
- This is a pure unit test file with no rendering, no Solid involvement and no DOM. It is also the only place `it.each` is used in the repo, driving three tests from one table of six colour spellings. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct result toString")
- The `describe` nesting is `parseColor > RGBColor`, and there is NO `HSLColor`, `HSBColor` or `HexColor` describe block, so only RGB INPUT is tested even though every output format is exercised. Parsing an `hsl(...)` or `hsb(...)` string is completely untested. That matters because kobalte ships `color-area`, `color-wheel`, `color-slider`, `color-swatch` and `color-channel-field`, none of which has any test file. The entire colour component family rests on this one partially-tested parser. (kobalte: packages/core/src/colors/utils.test.ts: "parseColor > RGBColor > correct parse string %s to color")

## solid-test-infra

### Notes and edge cases

- Runner and environment: one vitest project at `packages/core`, configured in `packages/core/vite.config.ts` with `vite-plugin-solid`, `environment: "jsdom"`, `globals: true`, `setupFiles: ["../../node_modules/@testing-library/jest-dom/vitest"]`, and `isolate: false`. Resolution uses `conditions: ["development", "browser"]`, `dedupe: ["solid-js"]` and `ssr.noExternal: true`. (kobalte: packages/core/vite.config.ts)
- `conditions: ["development", "browser"]` and `dedupe: ["solid-js"]` are both mandatory, not stylistic. Without the `solid` export condition resolving to JSX-compiled source, components load a pre-compiled build that will not reconcile with the test's own runtime; without dedupe, two copies of `solid-js` mean two independent reactive graphs and every signal silently stops updating the DOM. This is the single most common way a Solid test setup fails, and it fails confusingly. (kobalte: packages/core/vite.config.ts)
- `isolate: false` means all 43 test files share one module registry and one global environment. Combined with `globals: true` (no imports of `describe`/`it`/`expect`) that keeps startup fast, but it makes every module-level singleton in the library a cross-file hazard: the `toaster` queue, `create-hide-outside`'s refcount map and observer stack, and the `i18n` listener set all persist. `toast.test.tsx` is the only file that defends itself, with `toaster.clear()` in `beforeEach`. (kobalte: packages/core/vite.config.ts)
- Fake timers are never cleaned up properly. Files that call `vi.useFakeTimers()` in `beforeEach` (toggle-group, tabs, listbox, toast, search, select, combobox) call `vi.clearAllTimers()` in `afterEach` but not `vi.useRealTimers()`. Exactly one test block does it right: the live `describe("Combobox filter then click")`. With `isolate: false` that is a real leak, and any suite we build should assert timer hygiene in a global `afterEach`. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- `@solidjs/testing-library` usage: `render` always takes a THUNK, `render(() => <Component />)`, not an element. That is the pervasive difference from React Testing Library and it is what lets Solid own the component's lifetime. `fireEvent`, `within`, `waitFor` and the `getBy`/`queryBy`/`findBy`/`getAllBy` query families behave as in RTL. (kobalte: packages/core/src/button/button.test.tsx: "should have attribute 'type=button' by default")
- HOW REACTIVITY IS FLUSHED, the central question for our suite. There is no `act()`. Solid's event handlers run synchronously but the resulting DOM writes land on the microtask queue, so the universal idiom is `fireEvent.x(...)` followed by a single `await Promise.resolve()`. It appears several hundred times across the repo. (kobalte: packages/core/src/toggle-button/toggle-button.test.tsx: "can be controlled")
- One flush is not always enough. `fireEvent.input` on a filtering combobox needs TWO consecutive `await Promise.resolve()` calls plus `vi.runAllTimers()` before the filtered options are queryable, because the filter runs through a derived computation before the collection rebuilds. Counting microtasks by hand does not scale; our suite wants one explicit `settle()` helper. (kobalte: packages/core/src/combobox/combobox.test.tsx: "Combobox filter then click > selects the clicked option after filtering with a mouse")
- STRUCTURAL changes need no flush; ATTRIBUTE changes do. Every `fireEvent.click` in `pagination.test.tsx` is followed immediately by assertions with no flush and passes, because the page window is a derived list whose elements are created and destroyed during the click. Meanwhile `toggle-button` needs a flush to observe `aria-pressed` moving on an element that already exists. `number-field` shows both in one file: `trigger.click()` then assert value works, but `keyDown` plus `keyUp` needs a flush. Relying on this distinction is how tests end up passing for the wrong reason, so flush unconditionally. (kobalte: packages/core/src/pagination/pagination.test.tsx: "renders correctly when changing page")
- Spy assertions need no flush at all; DOM assertions do. `spin-button.test.tsx` fires bare `keyDown` events and asserts the callback spy synchronously with no `await` anywhere, while `number-field.test.tsx` testing the same keys through rendered output needs keyDown plus keyUp plus a flush. (kobalte: packages/core/src/spin-button/spin-button.test.tsx: "should trigger onIncrement on arrow up")
- Each pointer event needs its OWN flush. A listbox selection is `pointerdown`, flush, `pointerup`, flush, which is four statements for one click. (kobalte: packages/core/src/listbox/listbox.test.tsx: "supports single selection > supports using pointer up to change option selection")
- Primitives with no component tree are tested with `createRoot((dispose) => { ...; dispose(); })` and manual disposal, and need no flush because the assertions read signal getters rather than DOM. `create-toggle-state`, `create-disclosure-state` and `create-controllable-signal` all use this. (kobalte: packages/core/src/primitives/create-toggle-state/create-toggle-state.test.ts: "can be default selected (uncontrolled)")
- `dismissable-layer.test.tsx` is the one file that imports `render` from `solid-js/web` instead of the testing library, because it must mount into a shadow root rather than testing-library's generated container. It keeps the returned `dispose` and calls it plus `host.remove()` in `onTestFinished`. That is the pattern for any portal-target or shadow-DOM coverage. (kobalte: packages/core/src/dismissable-layer/dismissable-layer.test.tsx: "Shadow DOM > should not dismiss when interacting with an excluded trigger inside a shadow root")
- `requestAnimationFrame` is handled TWO incompatible ways. `listbox.test.tsx` stubs it synchronous in `beforeEach` (`vi.spyOn(window, "requestAnimationFrame").mockImplementation(cb => { cb(0); return 0 })`, restored in `afterEach`); `select.test.tsx` and `combobox.test.tsx` instead rely on `vi.runAllTimers()` firing rAF under fake timers, marked by a `// run restore focus rAF` comment that appears about twenty times. Pick ONE and make it global, because focus restore, scroll-into-view and corvu's `afterPaint` all sit behind rAF. (kobalte: packages/core/src/listbox/listbox.test.tsx: "renders properly")
- `@testing-library/user-event` is used three ways in the same repo: `await userEvent.click(...)` directly with real timers (accordion), `userEvent.setup({ delay: null })` with fake timers (tabs, toggle-group), and `await userEvent.type(...)` with no timers at all (text-field, number-field). The `delay: null` is mandatory under fake timers, and `tabs.test.tsx` carries a link to testing-library issue 833 explaining that user-event otherwise deadlocks. (kobalte: packages/core/src/tabs/tabs.test.tsx: "renders properly")
- Shared helpers live in a private `@kobalte/tests` workspace package (`packages/tests`), built with tsup and declared as a build dependency of the test task in `turbo.json`. Its `package.json` still declares `vitest: "^1.3.1"` as a peer while the root installs `4.1.10`, so that range is stale. (kobalte: packages/tests/package.json)
- `installPointerEvent()` stubs a global `PointerEvent` class extending `MouseEvent` with getters for `pointerType`, `pointerId`, `pageX`, `pageY`, `width` and `height`, in `beforeAll`, and sets `global.PointerEvent = undefined` in `afterAll`. jsdom has no `PointerEvent`. It is needed only where library code does `instanceof PointerEvent` or reads constructor-only fields: `select` needs it, `tabs` and `listbox` do not. Several files install it and never fire a pointer event. (kobalte: packages/tests/src/utils.ts)
- `createPointerEvent(type, opts)` builds a PLAIN `Event` and `Object.assign`s the properties onto it, defaulting `bubbles` and `cancelable` to true and `composed` to false. `bubbles`, `cancelable` and `composed` must go through the constructor because they are read-only afterwards, which is exactly what the shadow-DOM tests depend on. It also defaults `ctrlKey`, `metaKey`, `shiftKey`, `altKey` to false, `button` to 0 and `width`/`height` to 1. (kobalte: packages/tests/src/utils.ts)
- `triggerTouch(element, opts)` dispatches a touch `pointerdown` then a touch `pointerup` with `pointerId: 1`, awaiting `Promise.resolve()` between and after them. The helper bakes the flush in, which is a good pattern for our own event helpers. Like `setupMatchMediaMock`, it is exported and never called by any test in the repo, so `@kobalte/tests` is two-thirds dead code: only `installPointerEvent` and `createPointerEvent` are actually used. (kobalte: packages/tests/src/events.ts)
- `setupMatchMediaMock()` defines `window.matchMedia` as a `vi.fn()` returning `{ matches: false, media, onchange: null, addListener, removeListener, addEventListener, removeEventListener, dispatchEvent }`, all spies. jsdom has no `matchMedia`. It is exported from `@kobalte/tests` but NOT called by any test file in the repo, so it is dead code kept for whichever component needs it (reduced-motion and color-scheme queries). (kobalte: packages/tests/src/mocks.ts)
- `structuredClone` is polyfilled ad hoc, not centrally: both `search.test.tsx` and `combobox.test.tsx` assign `global.structuredClone = (val) => JSON.parse(JSON.stringify(val))` inside the describe body, each with the comment "structuredClone polyfill, kind of ^^'". A JSON round-trip loses Dates, Maps, Sets and `undefined`, and it is why combobox asserts `toStrictEqual` where select asserts `toBe`. This belongs in a setup file. (kobalte: packages/core/src/search/search.test.tsx: "renders correctly")
- `window.Image` is replaced wholesale in `image.test.tsx` with a `MockImage` class whose constructor fires `onload` after a `setTimeout`, restored in `afterAll`. jsdom never loads images. (kobalte: packages/core/src/image/image.test.tsx: "with fallback and a working image > should render the image after it has loaded")
- Custom matchers: none. The only extension is `@testing-library/jest-dom` via `setupFiles`, giving `toBeInTheDocument`, `toBeVisible`, `toHaveAttribute`, `toHaveTextContent`, `toHaveValue`, `toHaveStyle`, `toBeDisabled`, `toBeEmptyDOMElement` and `toHaveFocus`. A conformance suite would benefit from purpose-built matchers (something like `toHaveDataState`, `toBeLabelledBy`, `toBeDescribedBy`) since those three patterns account for a large share of the assertions here. (kobalte: packages/core/vite.config.ts)
- `toBeVisible()` versus `queryBy(...)` being null is used inconsistently for the same question. `select.test.tsx` keeps a reference and asserts `expect(listbox).not.toBeVisible()`, which sidesteps the presence-unmount problem; accordion and toast try `queryBy` and have those assertions commented out. Decide once which the contract is. (kobalte: packages/core/src/select/select.test.tsx: "closing > can be closed by clicking on the button")
- Skipping is pervasive and worth counting, because it is the real coverage picture. Fully skipped: `describe.skip("Select")` (4168 lines), `describe.skip("Combobox")` (3579 lines, minus one live regression test appended after it), all three `menubar` tests, one `tabs` test (`// TODO test create-presence`), three `accordion` keyboard tests (`// TODO: use solid-list`), one `text-field` test (`// Skipped: requestSubmit is not implemented`), and one `toast` test (`// don't know how to test implicit promise rejection`). That is 11 hard skips. Another 13 are CI-only skips via `skipIf(process.env.GITHUB_ACTIONS)`: the entire `Accordion` describe, the entire `Image` describe, three `toggle-group` tests, five `tabs` tests and three `toast` tests. So of 564 `it` blocks, the two largest files alone account for about 50 that never run. (kobalte: packages/core/src/select/select.test.tsx: "renders correctly")
- Every `skipIf(GITHUB_ACTIONS)` case is one of two things: a test that uses `user.tab()` for real focus movement, or a test that interleaves fake timers with microtask flushes. So kobalte's Tab-order behavior and its timer-driven behavior are both effectively unverified in CI. If our conformance suite must pass in CI, validating jsdom focus movement and settling on a deterministic timer strategy are the two prerequisites. (kobalte: packages/core/src/tabs/tabs.test.tsx: "should focus the selected tab when tabbing in for the first time")
- `fireEvent.focusIn(element)` is the technique that DOES work reliably in jsdom, and it is why `listbox.test.tsx` tests focus delegation without being CI-skipped while `tabs` and `accordion` are. Prefer dispatching focus events directly over driving Tab. (kobalte: packages/core/src/listbox/listbox.test.tsx: "allows user to change option focus via up/down arrow keys")
- Commented-out assertions are the other half of the picture, and they cluster on ONE cause. Thirteen assertions carry `// TODO: fix solid-presence vitest` (five in accordion, two in collapsible, six in toast) and one in checkbox carries `// TODO: fix vitest delays`. Every one of them is the NEGATIVE assertion after a close: that content is gone. So the libraries prove things do not disappear when they should not, and never prove they disappear when they should. (kobalte: packages/core/src/toast/toast.test.tsx: "should close after duration")
- The root cause is mechanical and fixable. `solid-presence` decides an exit is instant only when the element's computed `animationName` is exactly the string `"none"`, but jsdom's `getComputedStyle` returns `""` for it. The comparison fails, the primitive concludes an exit animation is running, and it waits forever for an `animationend` jsdom will never dispatch. Fix it by treating an empty animation name as none, stubbing `getComputedStyle`, or dispatching a synthetic `animationend`, and the largest blind spot in both libraries closes. (corvu-src: packages/solid-presence/src/presence.ts)
- Corvu's drawer has the same shape of problem through a different property: it reads `parseFloat(getComputedStyle(content).transitionDuration)` and short-circuits when it is `0`. jsdom gives `""`, `parseFloat("")` is `NaN`, and `NaN === 0` is false, so a drawer never finishes opening or closing under test. Make the duration check `NaN`-safe. (corvu-src: packages/drawer/src/Root.tsx)
- A working Solid test harness for this kind of library therefore needs, at minimum: the `solid` export condition plus deduped `solid-js`; one `settle()` helper rather than counted microtasks; a synchronous `requestAnimationFrame`; deterministic fake timers with real-timer restoration; a `PointerEvent` shim; `matchMedia`, `structuredClone`, `ResizeObserver` and `Image` stubs; `getComputedStyle` returning usable `animationName` and `transitionDuration`; non-zero `getBoundingClientRect` and scroll metrics for anything that measures; and per-test reset of the libraries' module-level singletons. Nine of those ten are things kobalte does partially, in different files, in different ways. (kobalte: packages/core/vite.config.ts)
- WHAT CHANGED FOR SOLID 2: nothing, because there is no Solid 2 work to compare against. Kobalte has no v2 branch (only the unrelated `v2/chip` and `v2/tags-inputs` component branches) and pins `solid-js` `^1.9.8`; corvu pins `^1.8`. So every pattern above is Solid 1 and our suite is porting, not following. The patterns most likely to need rework are: `createWritableMemo` from `@solid-primitives/memo` (corvu's drawer uses it for `translate` and `transitionState`), `createPersistent` shallow-copying an `Owner` object and calling `runWithOwner` on the copy, returning a `createMemo` cast to `JSX.Element` as a component body (corvu's drawer root and `Dismissible` both do this), `untrack` wrapped around provider trees to create context objects exactly once, and `createEffect` with a previous-value argument as `solid-presence` uses it. Each deserves a dedicated conformance test, because each is reaching past the public API. (corvu-src: packages/drawer/src/Root.tsx)
