# Test infrastructure

What the eleven upstream suites actually run on, how they fake events, what
they share, and where they gave up. The last section is a concrete proposal for
`packages/suite`.

Read this next to `docs/spec/README.md`: the spec files say what to test, this
file says what can observe it.

## Runners and environments

Nobody uses one runner. Every library that takes browser behavior seriously
ended up with at least two environments, and the split is always the same: a
fast simulated DOM for logic and attributes, a real engine for anything
involving layout, focus order, or time.

- **Vitest + jsdom** is the default. Radix (`vitest.config.mts`, project
  `unit`, `retry: 1`), Reka (jsdom 26 with `resources: 'usable'` so `<img>` and
  stylesheets really load, which is how Avatar loading status is testable
  without stubs), Kobalte (one project at `packages/core`, `isolate: false`),
  Melt (jsdom 24, `retry: 5` globally), Base UI (jsdom with
  `pretendToBeVisual: true`). [radix, base-ui, reka, melt, kobalte]
- **Vitest + happy-dom** is Ariakit's choice, with the config comment recording
  that it is about twice as fast for the `@ariakit/test` simulation layer and
  that `shims.ts` normalizes happy-dom's divergences. Ark also runs happy-dom
  for React and Vue but jsdom for Solid. [ariakit, ark]
- **Jest + jsdom** is Headless UI (Jest 26, `@swc/jest`, `testEnvironment`
  never set so jsdom by default) and React Aria (Jest 30,
  `jest-environment-jsdom`, `testTimeout: 20000`, a custom resolver that maps
  the in-repo `source` export condition so tests run against TypeScript source).
  [headlessui, react-aria]
- **Vitest browser mode via Playwright** is the interesting tier. Base UI flips
  *the same* `*.test.tsx` files into chromium, webkit or firefox by setting
  `VITEST_ENV`; there is no parallel browser-only suite. Bits UI goes further
  and runs every component test only in real browsers (chromium and webkit,
  `retry: 3`), keeping jsdom for pure helper functions. React Aria has a third
  config, `vitest.browser.config.ts`, matching `*.browser.test.tsx` across
  chromium, firefox and webkit at 1280x720 with `NODE_ENV` forced to
  `development`. [base-ui, bits, react-aria]
- **Playwright as a separate suite** is Zag, Radix, Melt and Ariakit. Zag's is
  the most ambitious: one `e2e/` directory, `testMatch: "*.e2e.ts"`, and a
  `FRAMEWORK` environment variable that points the identical specs at five
  example apps (react/next-ts:3000, vue/nuxt-ts:3001, solid/solid-ts:3002,
  svelte/svelte-ts:3003, preact/preact-ts:3004). Context is pinned to
  `locale: "en-US"` and `timezoneId: "UTC"`. Radix's is chromium only against
  Storybook on port 9009. Melt has two e2e specs and one of them is fully
  skipped. [zag, radix, melt, ariakit]
- **Ava + Selenium** is the APG's own regression suite, headless Firefox only,
  one shared browser session for the whole run, `test.serial` by default, a
  500 ms default inter-action wait. Nothing in the normative baseline has been
  verified cross-browser by the APG itself. [apg]

Bits UI is the outlier worth arguing with. Running every component test in two
real engines costs startup time and `retry: 3`, and it buys back things the
jsdom suites simply cannot assert: submenu grace areas computed from measured
rects instead of mocked ones, trustworthy focus assertions, no `ResizeObserver`
or `scrollIntoView` stubbing anywhere in the repo. The price shows up as flake
budget, not as missing coverage.

### What a simulated DOM cannot prove

This list is assembled from the reasons upstream tests give for skipping
themselves. Every item is a `(browser-only)` tag in the spec files.

- **Layout and geometry.** `getBoundingClientRect` returns zeros. Radix's
  global setup installs a `ResizeObserver` stub whose `observe()` synchronously
  reports `{ inlineSize: 0, blockSize: 0 }`, so Collapsible and Accordion
  content measurement sees zero height. React Aria has to define
  `document.documentElement.clientWidth`/`clientHeight` as 1024x768 because
  jsdom reports 0. Reka's `--reka-collapsible-content-height` and every Popper
  custom property are asserted by no test at all, for exactly this reason.
- **Positioning and collision detection.** Base UI marks all positioning
  geometry, `alignItemWithTrigger`, scroll locking and drag/scrub gestures with
  `describe.skipIf(isJSDOM)`. Reka's `avoidCollisions`, `collisionPadding`,
  `collisionBoundary`, `sticky`, `updatePositionStrategy` and `arrowPadding`
  have no coverage.
- **`scrollIntoView`.** Stubbed as a no-op in Radix, Reka, Melt and Kobalte.
  Ariakit stubs it too. So "the active option scrolled into view" is only
  provable in a browser. Zag proves it with `isInViewport(viewport, el)`
  comparing measured boxes.
- **Real Tab order.** Headless UI does not delegate Tab to the browser at all;
  it builds its own tabbable list by querying `document.body` with a fixed
  selector list, then focuses the next entry. Every selector carries
  `:not([tabindex='-1'])` and, in tests, `:not([style*='display: none'])`,
  because jsdom lets a hidden element become `document.activeElement` and real
  browsers do not. Kobalte skips thirteen tests in CI and every one of them
  either uses `user.tab()` or interleaves fake timers with microtask flushes.
- **Pointer events.** jsdom ships no `PointerEvent` (jsdom#2527, cited across
  the React Aria suite). React Aria, Kobalte and Headless UI each install their
  own `FakePointerEvent extends MouseEvent`. jsdom also lacks
  `setPointerCapture`/`releasePointerCapture`/`hasPointerCapture` (jsdom#2666),
  which Radix stubs for the slider drag tests.
- **`pointer-events: none` actually blocking a click.** Only Bits asserts it,
  with `expectNotClickableLoc(loc)`, which passes when `loc.click()` rejects.
- **CSS animations and transitions.** `getComputedStyle` returns `""` for
  `animationName` and `transitionDuration`. This is not theoretical: Kobalte
  has thirteen commented-out assertions all carrying `// TODO: fix
  solid-presence vitest`, and every one of them is the negative assertion after
  a close. See Flakiness patterns below.
- **Pseudo-element styles.** jsdom throws "Not implemented" when asked for
  `::before` styles, and axe-core asks on every audit, so Reka monkey-patches
  `window.getComputedStyle` to drop the pseudo-element argument.
- **The real accessibility tree.** Ariakit's Playwright helpers
  `createMenuAccessibilityReader(page)` and
  `createDismissAccessibilityReader(page)` read Chromium's computed names and
  child roles. No simulated DOM computes that tree.
- **Whether the document scrolled.** Ariakit's `recordScrollEvents(page)`
  records which scrollers actually moved so a test can assert the document did
  not. happy-dom has no layout, so scroll offsets cannot be modeled.
- **IME composition and clipboard.** React Aria's Playwright commands
  `setComposition`/`commitComposition` drive a real IME through a cached
  Chromium CDP session (`Input.imeSetComposition`, `Input.insertText`), plus
  `lockClipboard`/`unlockClipboard`.
- **Touch swipe.** Radix drives CDP `Input.dispatchTouchEvent` in six steps
  because Playwright's `touchscreen` only supports taps. Zag keeps three swipe
  implementations for three different quirks.
- **Image loading.** Kobalte replaces `window.Image` wholesale with a
  `MockImage` whose constructor fires `onload` after a `setTimeout`.
- **Cross-realm event identity, in happy-dom specifically.** happy-dom shares
  one set of constructors between a frame and its parent, so an event built for
  a node inside an iframe cannot be distinguished. `isHappyDOM()` even returns
  false for a same-origin iframe window, which Ariakit records as a known
  limitation. jsdom does not have this problem and Ariakit's
  `*.jsdom.test.ts` files exist partly to cover it.
- **`window.event`.** happy-dom omits it, which makes React 18 assign
  native-listener updates default rather than discrete priority. Ariakit shims
  it with `withWindowEvent`.

### Console discipline

Two suites turn warnings into failures and it changes how tests are written.
React Aria's `scripts/setupTests.js` replaces `console.error` and
`console.warn` with versions that **throw**, with a two-entry allowlist (React
18 `ReactDOM.render` deprecation, Browserslist staleness). Ariakit uses
`vitest-fail-on-console` for the same effect. The consequence is that nearly
every interaction has to be wrapped in `act`, and tests that legitimately
expect a warning have to spy first (React Aria uses
`using spyWarn = jest.spyOn(console, 'warn')` with explicit resource
management). Several Ariakit tests live only in the browser run because
`vitest-fail-on-console` turns React's own development warnings into failures.
This is worth copying. It is the cheapest way to catch a whole class of adapter
bug.

### Reactivity flushing, the Solid-specific problem

Kobalte's notes are the most useful thing in the research for us, because they
are about our framework. There is no `act()` in Solid. Event handlers run
synchronously but the resulting DOM writes land on the microtask queue, so the
idiom is `fireEvent.x(...)` then a single `await Promise.resolve()`, repeated
several hundred times across that repo. One flush is not always enough:
`fireEvent.input` on a filtering combobox needs two consecutive
`await Promise.resolve()` plus `vi.runAllTimers()` before filtered options are
queryable, because the filter runs through a derived computation before the
collection rebuilds.

Worse, the flush requirement is inconsistent in a way that makes tests pass for
the wrong reason. Structural changes need no flush (every `fireEvent.click` in
`pagination.test.tsx` asserts immediately and passes, because the page window
is a derived list whose elements are created and destroyed during the click).
Attribute changes do need one (`toggle-button` needs a flush to observe
`aria-pressed` move on an element that already exists). Spy assertions need
none; DOM assertions do. And each pointer event needs its own flush, so one
listbox selection is `pointerdown`, flush, `pointerup`, flush.

Two more Solid-specific requirements, both mandatory rather than stylistic:
`conditions: ["development", "browser"]` so the `solid` export condition
resolves to JSX-compiled source, and `dedupe: ["solid-js"]` so there is one
reactive graph. Without dedupe, two copies of `solid-js` mean every signal
silently stops updating the DOM. Kobalte's notes call this the most common way
a Solid test setup fails, and it fails confusingly.

## Event simulation

Four distinct models, and they disagree about things that matter.

### Click

**Ariakit** (`click(element, options?, tap = false)`) is the most faithful. The
ordered sequence for a primary click, with `button buttons detail` values
pinned by its own tests: `hover(element)` with `button: 0, buttons: 0`, then
`pointerdown 0 1 0`, `mousedown 0 1 1`, `focus`, a re-check that the element is
still visible (walking up to the first visible ancestor if the hover or press
hid it), a settle, then `pointerup 0 0 0`, `mouseup 0 0 1`, `click 0 0 1`.

Details worth stealing:

- `mouseDown` moves focus to the element when it is focusable and its computed
  `pointer-events` is not `none`, otherwise the closest focusable ancestor,
  otherwise it blurs the active element.
- A prevented `pointerdown` suppresses the compatibility `mousedown`, and the
  suppression is recorded **per document** so the matching `mouseUp` also
  suppresses `mouseup`. A prevented `mousedown` skips both selection clearing
  and the focus move.
- `mouseDown` clears a non-collapsed document selection before focusing, unless
  the press lands on a `button`, `select`, `a[href]`, or an `input` whose type
  is not one of the text-like types. A textbox always clears.
- `click`, `auxclick` and `contextmenu` are constructed as `PointerEvent` and
  reset every pointer member except `pointerId` and `pointerType`.
- `click` on a non-focusable element inside a `<label>` dispatches `click` on
  the label, temporarily disables the label's control so the environment does
  not auto-click it, then focuses the control and dispatches exactly one
  `click`. Only `click` is forwarded, no mousedown/mouseup.
- The `buttons` bitmask is deliberately not the same ordering as `button`:
  primary 0 maps to 1, auxiliary 1 maps to 4, secondary 2 maps to 2.
- `tap(element)` is `click` without the settle between press and release.

**Headless UI** (`click(element, button = MouseButton.Left)`) fires
`pointerdown`, `mousedown`, a focus attempt, `pointerup`, `mouseup`, `click`,
each with `{ button: 0 }`. The focus attempt walks up from the clicked element
and calls `focus()` on the first ancestor matching the tabbable selector. React
wraps the whole thing in `act`; Vue does not. There is no exported
`contextMenu`, `mouseDown`, `mouseUp`, `mouseOver` or `mouseOut` helper, and
`contextmenu` and `dblclick` are never synthesised.

**React Aria** does not have one click helper. It runs the same `it` blocks two
or three times via `describe.each` over `{Mouse Events, Pointer Events, Touch
Events}`, each with its own `prepare` function and press start/end actions,
because the two worlds genuinely assert different sequences.
`installPointerEvent()` switches the press code onto the Pointer Events branch;
without it the code falls back to mouse and touch. `pressElement()`
deliberately adds coordinates and pressure for mouse presses "so this isn't
detected as a virtual click".

**Zag** uses Playwright's real `click`, and its page objects add
`clickContextTrigger({ button })`, `rightClick(selector)`, and a
`pointer.down/up/move` trio built on `dispatchEvent` with
`pointerType: "mouse"` for the cases where a real mouse gesture is flaky.

Two divergences to settle:

- **Divergence: disabled elements.** Ariakit fires hover, `pointerdown` and
  `pointerup` on a disabled element but not `mousedown`/`mouseup` and not the
  terminal `click`. Headless UI's click on a disabled `HTMLButtonElement`
  returns immediately and fires nothing at all. Ariakit's is correct per spec.
- **Divergence: right click.** Ariakit's `rightClick` fires hover,
  `pointerdown`, `mousedown`, `focus`, `contextmenu` while the button is still
  held, `pointerup`, `mouseup`, `auxclick`, with no `click`. Headless UI fires
  `pointerdown`, `mousedown`, `pointerup`, `mouseup` with `{ button: 2 }` and
  deliberately no `click` and no `contextmenu`, and marks the pointerup/mouseup
  pair as Firefox-only behavior.

Ariakit also records that Chromium and WebKit fire `auxclick` on disabled
controls while Firefox does not, and does not suppress it.

### Hover

- **Ariakit** `hover(element)` tracks the previously hovered element as
  `document.lastHovered` and fires, on it: `pointermove`, `mousemove`,
  `pointerout`, `pointerleave` (only when the new element is not a descendant),
  `mouseout`, `mouseleave` (same condition), each with `relatedTarget` set to
  the new element or `null` when the new element has `pointer-events: none`.
  Then a settle, then on the new element: `pointerover`, `pointerenter`,
  `mouseover`, `mouseenter`, `pointermove`, `mousemove`. It skips every
  mouse-family event on a disabled element while still firing the pointer
  family.
- **Headless UI** `mouseEnter(element)` fires only `pointerover`,
  `pointerenter`, `mouseover`, and no `mousemove`. `mouseLeave` fires
  `pointerout`, `pointerleave`, `mouseout`, `mouseleave`. Vue attaches
  `screenX`/`screenY` from a shared module-level `FakePointer`; React fires
  them with no coordinates at all, so React cannot distinguish a real hover
  from a synthetic one by position. That asymmetry means the two frameworks do
  not exercise pointer-position tracking equally.
- **Base UI** `enterWithMouse(element, init)` fires `pointerenter` (with
  `pointerType: 'mouse'`), `mouseenter`, `mousemove`. `moveMouse(from, to)`
  fires the full leave/enter pair with `relatedTarget` set both ways plus a
  trailing `mousemove`.
- **Zag** uses real Playwright hovering, plus `hoverOut()` which moves the
  mouse to (0,0), and for submenus the Bits-style coordinate helpers.

The gap here is `mousemove`. Headless UI's enter never fires one, so a library
that opens a hover card on `mousemove` rather than `mouseenter` passes an
Ariakit or Base UI test and fails a Headless UI one. Fire both.

### Press

- **Ariakit** `press(key, element?, options?)` fires `keydown`, applies the
  key's default action, settles, retargets to the new `activeElement` if the
  keydown moved focus, then fires `keyup` and applies its default action. It
  focuses the target first and returns without doing anything when the target
  is neither focusable nor the body. Keydown default actions: `Tab` moves focus
  to `getNextTabbable()`, `Enter` clicks a `<button>` or a button-like input and
  otherwise attempts implicit form submission, `Home`/`End` and the arrows move
  or extend the caret, `ArrowUp`/`ArrowDown` step a number input by 1 firing
  `input` then `change`. Keyup default action: `Space` clicks a `<button>` or a
  button/checkbox/radio-like input. Every default action is skipped when the
  event's default was prevented and whenever `metaKey` is held. The synthetic
  activation click reports `pointerId: -1, pointerType: ""`, which is what
  Chromium, Firefox and WebKit all report for a keyboard-caused click.
  `press.down` and `press.up` exist separately; `press.up` deliberately has no
  focusability guard so a keyup can land on an element that disabled itself
  during the matching keydown.
- **Headless UI** `type(events, element)` replays event inits and is the only
  suite that pins the whole cancellation table, in a 22-case `it.each` shared
  byte-for-byte between React and Vue. Plain key: `keydown`, `keypress`,
  `input`, `keyup` (the `input` fires unconditionally rather than only when the
  value changes, flagged in the source as a known shortcut). `Enter`:
  `keydown`, `keypress`, `click`, `keyup`, click skipped unless the target is
  an `HTMLButtonElement`. `Space`: `keydown`, `keypress`, `keyup`, `click`,
  with the click **last**. That ordering difference is the real browser
  behavior and it is the single most useful thing in the Headless UI test
  utils. Cancellation: a cancelled `keydown` drops `keypress` and any click; a
  cancelled `keypress` drops Enter's click but not Space's; a cancelled `keyup`
  drops Space's click but not Enter's, because Enter activates before keyup.
- **React Aria** uses `user.keyboard`, with `'{ArrowUp>3/}'` for held-key
  repeats, and `triggerLongPress({element, advanceTimer, pointerOpts})` which
  fires the full compatibility cascade a real browser produces: `pointerdown`,
  then `touchstart` or `mousedown` depending on `pointerType`, advance by
  `DEFAULT_LONG_PRESS_TIME` (500 ms), `pointerup`, `touchend`, `mousedown`,
  `focus`, `mouseup`, then a `click` with `detail: 1`, honoring each event's
  `defaultPrevented` so suppressed compatibility events are skipped.
- **Zag** `pressKey(key, times = 1)` repeats a real key press;
  `pressKeyDown`/`pressKeyUp` hold and release arrows for auto-repeat tests.

Virtual clicks from screen readers are modelled by React Aria as a bare
`fireEvent.click(el)` with no preceding pointer or mouse events and
`detail: 0`, which is what VoiceOver and TalkBack produce. `usePress` has a
dedicated `describe('virtual click events')` block. Nobody else tests this
path. It belongs in our suite.

### Type

- **Ariakit** `type(text, element?, options?)` fires, per character: `keydown`,
  re-reads `activeElement` in case the keydown moved focus, computes the next
  value and caret position, fires `keypress` (with a `charCode`, 13 for `"\n"`)
  for a plain insertion or `compositionupdate` when `isComposing` is set, then
  `input` with the new value, `selectionStart`/`selectionEnd`, and an
  `inputType` of `insertText`, `insertCompositionText`, `deleteContentForward`
  or `deleteContentBackward`. Then settle, then `keyup`. It **never dispatches
  `beforeinput`**: a conformance suite that expects one will not see it from
  this layer. It skips the value change and the `input` event entirely when the
  element is `readOnly` or `keydown` was prevented, and marks the element dirty
  only when the value actually changed. `focus` and `blur` then dispatch the
  deferred `change` before focus leaves, which is how browsers sequence
  `change` for text inputs. It temporarily switches an `input[type=email]` to
  `type=text` for the duration of the call, because email inputs are not text
  fields.
- **Headless UI** `word(input)` maps each character to a `{ key }` event init
  and, before returning, fires **one** `change` event on the focused element
  with the whole string as the target value. So a typed word arrives as one
  value change plus per-character key events, which is nothing like a browser.
  React fires that change for a focused `input` or `textarea`, Vue only for an
  `input`.
- **Zag** types through the real keyboard, and adds `paste(node, value)`
  (dispatching a synthetic `ClipboardEvent` carrying a `DataTransfer`) and
  `nativeInput(node, value)` (setting the value through the native value setter
  and dispatching an `insertFromPaste` `InputEvent`).

### Tab

- **Ariakit** delegates to its own `getNextTabbable()`/`getPreviousTabbable()`.
- **Headless UI** builds the list itself from
  `[contentEditable=true], [tabindex], a[href], area[href],
  button:not([disabled]), iframe, input:not([disabled]),
  select:not([disabled]), details>summary, textarea:not([disabled])`, each
  suffixed `:not([tabindex='-1'])` and, in tests, `:not([style*='display:
  none'])`. It moves by +1 or -1 modulo the list length, calls
  `focus({ preventScroll: true })`, and if focus does not land it recurses with
  the offset shifted one further in the same direction. The observed sequence
  is `keydown` on the old element, a blur-type event on it, a focus-type event
  on the new one, then `keyup` on the **new** element. React expects
  `focusout`/`focusin`; Vue expects `blur`/`focus`. A cancelled Tab keydown
  stops focus from moving at all; a cancelled blur does not, because blur and
  focusout are not cancelable.
- **React Aria** uses `user.tab()`, which Kobalte found unreliable enough to
  skip in CI.
- **Zag** presses a real Tab. Its radio-group model's `tabToFirstRadio()`
  clicks `main` first, which is the canonical "tab into the group" gesture.

### Settling

Ariakit's two-tier approach is the cleanest thing here. `settle()` is the cheap
intra-interaction wait: two animation frames with a microtask flush between
them, no wall-clock delay. `sleep(ms?)` is the once-per-interaction wait: a
frame, a `setTimeout`, a scheduler drain outside a real browser, another frame,
defaulting to 150 ms in a real browser and 4 ms otherwise. Every helper settles
between sub-steps and calls `sleep()` once at the end. On top of that,
`flushScheduler(maxTurns = 10)` installs a `MutationObserver` over the document
and yields host macrotasks until two consecutive mutation-free turns, because
React 18 can split one commit across scheduler tasks under CI load.

Headless UI's equivalent is cruder: every pointer and keyboard helper ends by
awaiting a nested `setImmediate` chain, three deep in React and two deep in
Vue, so the React helpers give the library one extra macrotask to settle. Base
UI's is `advanceReactClock(clock, ms)`: `flushMicrotasks()`, `clock.tickAsync(ms)`,
`flushMicrotasks()` again.

## Shared assertion helpers

### Headless UI accessibility assertions

The largest hand-written helper set in the research, duplicated line-for-line
between React and Vue. Cross-cutting conventions first:

- Every helper takes the element as an optional last argument and falls back to
  a document-wide query, so every part must be findable by role or id prefix
  alone.
- Every helper short-circuits with an "element is not null" expectation, so a
  missing element reports as missing rather than as a failed attribute check.
- Every helper wraps its body in try/catch and rewrites the error stack to
  start at the call site. Two get this wrong: `assertComboboxList` rewrites
  using `assertCombobox`, and `mouseDrag` rewrites using `click`, so both
  report the wrong assertion name on failure.
- Almost every helper accepts an `attributes` bag checked with exact matches,
  which is how callers pin `data-headlessui-state`, `data-open`, `data-active`,
  `data-focus`, `data-hover`, `data-disabled`, `data-selected`,
  `data-autofocus`, `data-slot` and `aria-*`. A `null` value means the
  attribute must be absent.
- Almost every helper accepts a `textContent` string checked by **containment**.
  `assertTabs` is the exception and compares by equality.
- Several accept a `tag` string requiring the lowercased tag name to match:
  `assertMenuItem`, `assertComboboxOption`, `assertComboboxLabel`,
  `assertListboxOption`, `assertListboxLabel`, `assertSwitch`.

Every state enum is the same three-value shape: `Visible`, `InvisibleHidden`
(in the DOM but hidden, the `static`/`unmount={false}` case),
`InvisibleUnmounted` (absent). That is how the suites distinguish
unmount-on-close from hide-on-close, and it is a distinction our spec needs.

The helpers themselves:

| Helper | Checks |
| --- | --- |
| `assertVisible` | no `hidden` attribute and computed style not `display: none` |
| `assertHidden` | **both** a `hidden` attribute and computed `display: none`; hiding by one alone fails |
| `assertInert` | `aria-hidden="true"` **and** a DOM `inert` property of exactly `true` |
| `assertNotInert` | `inert` is `undefined`; deliberately does not require `aria-hidden` to be absent |
| `assertActiveElement` | the element is the active element; on failure retries against `outerHTML` strings, because a direct object comparison can crash jsdom with "Cannot assign to read only property Symbol(impl)". React resolves through the element's root node so shadow DOM works; Vue reads `document.activeElement` and does not |
| `assertContainsActiveElement` | the element contains the active element |
| `assertFocusable` / `assertNotFocusable` | matches (or fails) the library's own focusable selector in strict mode; `document.body` always counts as not focusable |
| `assertLabelValue` | resolves the accessible name in a fixed order, stopping at the first source: `aria-labelledby` (join referenced text with a space, compare for equality), `aria-label` (exact), `[for="<id>"]` element (containment), own text content (containment) |
| `assertDescriptionValue` | reads the whole `aria-describedby` as a **single** id and requires that element's text to equal the expected value, so it cannot verify a multi-id describedby |
| `assertDisabledish` | passes when either `disabled` or `aria-disabled` is present with `"true"` or the empty string. React only |
| `assertLinkedWithLabel` / `assertNotLinkedWithLabel` | the whitespace-split `aria-labelledby` id set contains (or contains none of) the given label ids; the negative form tolerates the attribute being absent. React only |
| `assertLinkedWithDescription` | same for `aria-describedby`. React only |
| `assertCheckbox` | `Checked`: `aria-checked="true"`, `role="checkbox"`, `tabindex="0"`, presence of `data-checked`. `Unchecked`: `aria-checked="false"`, role, tabindex, no `data-*` check. `Indeterminate`: `aria-checked="mixed"`, `indeterminate="true"`, role, tabindex, presence of `data-indeterminate`. React only. These are the **only** `data-*` attributes any helper requires, and both are presence-only |
| `assertSwitch` | `role="switch"`, numeric `tabindex` at least 0 (absent counts as 0), `aria-checked` per state; a `label`/`description` option routes through `assertLabelValue`/`assertDescriptionValue` |
| `assertMenuButton` | always `id` and `aria-haspopup` (presence only). `Visible`: `aria-controls` present, `aria-expanded="true"`. `InvisibleHidden`: `aria-controls` still present, `aria-expanded="false"`. `InvisibleUnmounted`: `aria-controls` absent, `aria-expanded="false"` |
| `assertMenu` | `Visible`: `assertVisible`, `aria-labelledby` present, `role="menu"`. `InvisibleHidden`: same attributes plus `assertHidden`. `InvisibleUnmounted`: element exactly null, so no hidden remnant may stay |
| `assertMenuItem` | `id`, `role="menuitem"`, and `tabindex="-1"` **only** when `aria-disabled` is not truthy |
| `assertMenuButtonLinkedWithMenu` | two-way: button `aria-controls` equals menu `id`, menu `aria-labelledby` equals button `id` |
| `assertMenuLinkedWithMenuItem` | menu `aria-activedescendant` equals the item's `id` |
| `assertNoActiveMenuItem` | no `aria-activedescendant` attribute at all, not an empty value |
| `assertCombobox` | asserts against the **input**; `Multiple` + `Visible` additionally requires `aria-multiselectable="true"` on the separate listbox |
| `assertComboboxInput` | `id` plus the same three-state `aria-controls`/`aria-expanded` pattern |
| `assertComboboxList` | asserts against the popup `[role=listbox]` |
| `assertComboboxButton` | `id`, `aria-haspopup`, same three-state pattern |
| `assertComboboxButtonLinkedWithComboboxLabel` | button `aria-labelledby` is the exact two-token string `"<label id> <button id>"`, in that order |
| `assertComboboxOption` | `id`, `role="option"`, `tabindex="-1"` only when not `aria-disabled`; `aria-selected` checked only when `selected` is passed |
| `assertNoSelectedComboboxOption` | every option carries `aria-selected="false"` **explicitly**, so the attribute must be rendered even when nothing is selected |
| `assertListbox` | `aria-labelledby`, `aria-orientation` equal to the option defaulting to `vertical`, `role="listbox"`; `Multiple` adds `aria-multiselectable="true"` in the `Visible` branch only |
| `assertListboxOption` / `assertNoSelectedListboxOption` | as the combobox pair |
| `assertActiveListboxOption` / `assertNoActiveListboxOption` | `aria-activedescendant` on the **listbox** |
| `assertActiveComboboxOption` / `assertNotActiveComboboxOption` / `assertNoActiveComboboxOption` | `aria-activedescendant` on the **input**, not the list. The three-way split matters: "not this option" and "no option" are different states |
| `assertDisclosureButton` | `id` plus the three-state pattern, and **no** `aria-haspopup` requirement |
| `assertDisclosurePanel` | visibility only, no role, no aria wiring |
| `assertPopoverButton` / `assertPopoverPanel` | as disclosure |
| `assertDialog` | role equals whatever `attributes.role` the caller passed, defaulting to `dialog`. `Visible`: `assertVisible` plus `aria-modal="true"`. `InvisibleHidden`: `assertHidden` plus the **absence** of `aria-modal="true"` |
| `assertDialogTitle` / `assertDialogDescription` | title has an `id` and the dialog's `aria-labelledby`/`aria-describedby` equals it exactly |
| `assertDialogOverlay` | visibility only. Vue only, because React renamed `Dialog.Overlay` to `DialogBackdrop` |
| `assertRadioGroupLabel` | label has an `id` and the group's `aria-labelledby` equals it exactly. There is **no** `assertRadioGroup` and no `assertRadio`: option state is asserted inline |
| `assertTabs` | the largest one: `role="tablist"`, `aria-orientation` defaulting to `horizontal` (unlike listbox, which defaults to vertical); every tab has `id`, `role="tab"`, `type="button"`; the active tab has `aria-selected="true"` and `tabindex="0"` and every other `"false"`/`"-1"`; a tab's `aria-controls` must resolve to one of the panels and that panel's `aria-labelledby` must point back; every panel has `id` and `role="tabpanel"`; the active panel has `tabindex="0"` and every other `"-1"`. It has a bug: the `panelContents` comparison is gated on `tabContents !== null`, so `panelContents` is silently ignored unless `tabContents` is also passed |
| `getByText` | walks the body with a TreeWalker, skips any element with element children, returns the first **leaf** whose text equals the query exactly |

Part getters are worth noting because they encode a contract. Disclosure parts
are found purely by generated id prefix (`headlessui-disclosure-button-`,
`headlessui-disclosure-panel-`), never by role. Radio options are found by
`headlessui-radiogroup-option-`, not by `role="radio"`. `getComboboxInput`
returns `[role=combobox]`, so the combobox role must live on the input.
`getCombobox` returns `[role=listbox]`, so the popup carries the listbox role.

### React Aria testers

`@react-aria/test-utils` is a published package, not an internal helper set,
and that changes its shape: it is a set of pattern driver classes rather than
assertion functions.

`new User({interactionType, advanceTimer})` wraps `userEvent.setup({delay: null,
pointerMap})` once. `interactionType` is `'mouse' | 'touch' | 'keyboard'`,
default mouse, overridable per call. `advanceTimer` is how testers advance time
(pass `jest.advanceTimersByTime` under fake timers, a `setTimeout` promise
otherwise). `user.createTester(patternName, opts)` builds a tester inheriting
those options.

Testers: `CheckboxGroup`, `ComboBox`, `Dialog`, `GridList`, `ListBox`, `Menu`,
`RadioGroup`, `Select`, `Table`, `Tabs`, `Tree`. There is no Autocomplete,
Slider, NumberField, DateField or TagGroup tester; those use shared
parameterized suites instead (`AriaMenu.test-util.tsx`,
`AriaAutocomplete.test-util.tsx`, `AriaTree.test-util.tsx`, and Spectrum's
`test/table/TableTests.js`), run once per renderer.

The important design point: **the testers are not element locators, their waits
encode accessibility expectations.** `DialogTester.open()` dispatches the
interaction appropriate to the interaction type, then for a popover waits for
`aria-controls` to appear on the trigger and for an element with that id to
exist; for a modal it waits for `[role=dialog], [role=alertdialog]` and then
throws unless that dialog contains the active element and the trigger is no
longer focused. `close()` presses Escape and waits for the dialog to leave the
document. So a component that opens a dialog without moving focus into it fails
inside `open()`, before any assertion runs. `MenuTester.close()` asserts focus
returned to the trigger. `SelectTester.close()` focuses the listbox, presses
Escape, asserts focus returned to the trigger.
`SelectTester.toggleOptionSelection` infers `closesOnSelect` from
`aria-multiselectable` and throws on a disabled option.
`ListBoxTester.toggleOptionSelection` adds Ctrl or Cmd automatically when
`selectionBehavior: 'replace'`. `ComboBoxTester.getFocusedOption()` resolves
`aria-activedescendant`.

This is a good pattern and a trap at once. A test that merely calls a tester
method is implicitly pinning focus behavior it never mentions, which makes the
suite's real coverage hard to read. Several React Aria tests use a tester only
to locate elements and then drive the interaction themselves, with a comment
explaining that test-utils' user-event and Vitest browser mode's user-event
differ for focus events.

Also shipped: `installMouseEvent`, `installPointerEvent`, `pointerMap`
(declaring `MouseLeft`/`MouseRight`/`MouseMiddle` and `TouchA`/`TouchB`/`TouchC`,
with `TouchA` at `height: 1, width: 1`), `triggerLongPress`, and an `act`
wrapper that prefers `React.act`, falls back to `ReactDOMTestUtils.act`, and
becomes a pass-through when `IS_REACT_ACT_ENVIRONMENT` is false so the same
testers work in the browser run.

### Base UI's describeConformance

The only generated conformance harness in the research, and deliberately small.
`describeConformance(minimalElement, () => options)` takes a minimal JSX
element and a **thunk** returning options, so the enclosing suite's
`createRenderer()` result is available at call time. Options: `render`
(required), `refInstanceof`, `testRenderPropWith` (default `'div'`; setting it
to `'button'` also flips an internal `nativeButton` flag), `button`,
`wrappingAllowed` (default true), `only`/`skip` over the four suite keys
`{ propsSpread, refForwarding, renderProp, className }`, and `after`.

Fifteen `it` blocks in four suites:

- **prop forwarding** (6). Custom props (`lang="fr"`, a random `data-foobar`)
  land on the part's element, for the default element, the function form of
  `render`, and the JSX form. Then a custom `style` survives on the component
  and on both render forms. Each waits on `flushMicrotasks()` first, so a part
  that sets props in an effect still passes.
- **ref** (1). The ref is `instanceof refInstanceof`. That is all. No cleanup,
  no stability.
- **prop: render** (7). The render prop produces the element; the part's `ref`
  resolves to it; the part's ref and a ref on the render element resolve to the
  **same** node; `className` on the part and on the render element both end up
  in `classList`; and the same again when the part's `className` is a
  `(state) => string` function, so the resolved value must merge rather than
  replace.
- **prop: className** (1). `document.querySelector('.test-class')` is non-null.

What it does not check, and what a real conformance suite has to add: roles and
ARIA wiring, `data-*` state attributes, keyboard behavior, focus, controlled
and uncontrolled parity, SSR and hydration, and form integration. All of that
is hand-written per component in Base UI.

How components opt in is the clever part and it is why a harness this small
covers over a hundred parts: the `render` option is where the part gets wrapped
in whatever context it needs.

```tsx
describeConformance(<Select.Trigger />, () => ({
  refInstanceof: window.HTMLDivElement,
  button: true,
  testRenderPropWith: 'button',
  render(node) { return render(<Select.Root open>{node}</Select.Root>); },
}));
```

### Base UI's popupConformanceTests

This one is behavioral, and it is the shared contract for every popup surface.
`createComponent(props)` returns the full tree, receiving
`{ root, trigger, popup, portal }` prop bags to spread; the harness always
injects `data-testid="trigger"` and `data-testid="popup"`. Config also takes
`triggerMouseAction` (`'click'` or `'hover'`), `expectedPopupRole`,
`expectedAriaHasPopupValue` (defaulting to the role), `alwaysMounted`
(`boolean | 'only-after-open'`), and `combobox` (which changes the attribute
the open assertion waits on).

What it asserts: `open={false}` means the popup is absent or, when
`alwaysMounted`, present but `toBeInaccessible()`; re-rendering with
`open={true}` makes it non-null; clicking the trigger opens it when
`triggerMouseAction === 'click'`; the popup has `expectedPopupRole`; the
trigger's `aria-controls` equals the popup's `id`; `aria-expanded` is `"false"`
closed and `"true"` open (the wait gate is `role="listbox"` for
`combobox: true` popups and the presence of `data-open` otherwise);
`aria-haspopup` equals `expectedAriaHasPopupValue`; a custom `id` on the popup
keeps the `aria-controls` link; and closing removes the popup when no exit
animation is defined.

One test is **disabled upstream** and is a gap worth closing: "removes the
popup when the animation finishes" calls `skip()` unconditionally with the
comment "XXX: revisit after feedback from the team". Had it run, it would
inject a `@keyframes` animation bound to `[data-ending-style]`, set
`portal.keepMounted`, close the popup, and assert the popup becomes
inaccessible while still mounted and that `onAnimationEnd` fires exactly once.

### Radix's props-spread pair

Radix has no harness. Instead, **every** primitive part carries a matched pair
of hand-written tests named "spreads props it does not consume onto the element
it renders" and "forwards props to the child element when `asChild` is set".
Between them the pair asserts `className` merging, inline `style` merging
rather than replacement (proved by picking `outlineColor: rgb(1, 2, 3)`
alongside a library-owned property such as `pointer-events: none` or
`position: absolute`), ref identity, `onClick` composition rather than
replacement, the slotted element's `tagName`, and every attribute the part owns
(`role`, `data-state`, `data-orientation`, `aria-*`).

That is a better contract than Base UI's `describeConformance` because it
covers attribute ownership and event composition, and a worse delivery
mechanism because it is duplicated per part rather than generated. Take the
assertions, generate them.

One more Radix helper worth copying:
`assertStableComposedRef(renderWithRef, { maxRenders = 25 })` renders the
component with a *stable* callback ref that forces a re-render the first time
it receives a node. If the component composes the forwarded ref with an
unstable member, React 19 detaches and re-attaches on every commit, the forced
render loops, and "Maximum update depth exceeded" is thrown. A correctly
stabilized ref settles in a couple of renders. Solid does not have this failure
mode in the same shape, but the underlying question (does the ref identity stay
put across updates) is one our adapter has to answer too.

### Other helper sets worth naming

- **APG.** `assertAriaRoles`, `assertAttributeValues`, `assertAttributeDNE`
  (absent, not `"false"`), `assertRovingTabindex` (exactly one element has
  `tabindex="0"` at each step while a key advances), `assertTabOrder`,
  `assertHasFocus` (polls), `assertAriaActivedescendant` (checks both that the
  attribute names the expected option **and** that real DOM focus is on the
  container), `assertAriaSelectedAndActivedescendant`, `assertAriaLabelledby`
  and `assertAriaDescribedby` (resolve every id in the space-separated value
  and require non-empty text), `assertAriaControls` (single id only; the mixed
  checkbox hand-rolls the multi-id version, so write that once),
  `assertAriaLabelExists`, `assertInputChecked` (the IDL property),
  `assertDotValue` (reads `element.role` or `element.ariaPressed` rather than
  the attribute, which is how ARIA 1.2 reflection is tested),
  `assertAttributeCanBeToggled`, `assertNoElements`.
- **Ariakit.** `query` / `q` builds one method per ARIA role from a hardcoded
  list of 82 roles, each accepting an accessible name as a string (exact) or a
  `RegExp`, each exposing `.lazy` (a thunk that reruns the query), `.all`,
  `.wait`, `.maybe` and `.hidden`, which compose. Name matching falls back when
  Testing Library's computed name does not match: an element with `aria-label`
  is rejected outright, `aria-labelledby` is matched against the referenced
  element's `textContent`, everything else against `placeholder` then
  `textContent`. Elements inside an `[inert]` ancestor are filtered out unless
  `hidden: true`. The Playwright entry point exports the same role names over a
  `Page`. And the `toHaveFocus` matcher is overridden globally so that an
  element counts as focused when the document's active element points at it
  through `aria-activedescendant`, which makes virtual focus assertable with
  the same matcher as DOM focus. That override is the single best idea in the
  Ariakit setup.
- **Melt.** `testKbd` wraps the library's own internal `kbd` map into
  user-event's curly-brace syntax, so tests name keys through the same constant
  the implementation uses and a rename cannot silently desync. `touch(node)`
  fires the full browser sequence `pointerdown`, `touchstart`, `pointerup`,
  `touchend`, `mousedown`, `mouseup`, `click`.
  `assertActiveFocusTrap(user, element, tabsPresses = 10)` presses Tab ten
  times and asserts the active element stays inside after each press.
- **Bits.** `tests/src/tests/browser-utils.ts` is the most reusable artifact in
  the whole research, because it spends the real-browser advantage:
  `getSubmenuPlacementSide(triggerRect, contentRect)` derives which side a
  submenu actually landed on from measured centers, so the same test works
  whichever way collision detection flipped it;
  `getPointerLeaveTowardSubmenuClientCoords`,
  `getPointerMidpointTowardSubmenuClientCoords` and
  `getPointerAwayFromSubmenuIntentClientCoords` produce the three pointer
  positions a grace-area test needs; `expectNotClickableLoc(loc)` asserts
  `loc.click()` rejects; `waitForDismissibleLayer(loc)` reads the library's
  deliberately exposed `globalThis.bitsDismissableLayers` registry, and its own
  comment notes that opening-click regression tests dispatch **before** waiting
  on it, to prove the layer does not eat the click that opened it; and
  `observeTransitionAttrs(node)` attaches a `MutationObserver` filtered to
  `data-starting-style` and `data-ending-style` and records a history, so
  animation tests assert on the **sequence** of attributes over time rather
  than a single sampled state. That last one is the only honest way to test
  enter and exit styling.
- **Zag page objects.** Every component has a model class in
  `e2e/models/<name>.model.ts` extending a shared `Model`, and specs interact
  only through it, so a spec body reads `await I.clickTrigger(); await
  I.seeDropdown()`. Methods split into imperative (`click*`, `press*`,
  `hover*`, `type*`, `focus*`, `drag*`) and assertion-shaped
  (`see*`/`dontSee*`), with the assertions living inside the model, so the
  model's public surface **is** the vocabulary of observable behavior.
  Locators come from the anatomy contract (`[data-scope=<machine>][data-part=<part>]`
  refined by `data-value`, `data-index`, `data-type`, `data-channel`,
  `data-axis`, `data-stage`, `data-view`), not from test ids; test ids appear
  only for things the anatomy does not express. The base class subscribes to
  `console` and `pageerror` on construction and exposes
  `seeInConsole`/`dontSeeInConsole`, which is how e2e tests assert
  framework-level regressions such as "Maximum update depth exceeded". Some
  models encode machine timing directly: the number-input model's
  `waitForTick(n)` computes `50ms * n + 300ms` from the spin interval and delay.

## File naming conventions

Ariakit's suffix scheme is the single most portable idea in the research, and I
want it in `packages/suite`. The test-file suffix *is* the environment
contract:

- `test.ts` runs in the fast simulated DOM, in both frameworks.
- `test-browser.ts` runs in all three engines.
- `test-chrome.ts`, `test-safari.ts`, `test-chrome-firefox.ts`,
  `test-chrome-safari.ts`, `test-mobile.ts`, `test-ios.ts`,
  `test-chrome-js-disabled.ts`, `test-public-browser.ts` cover everything
  genuinely engine- or environment-specific.

Many of those files carry a header comment explaining exactly why the behavior
cannot be observed elsewhere, which makes the file tree itself the record of
what a simulated DOM can and cannot prove. That maps directly onto our
`(browser-only)` and `(safari-only)` tags.

The stated reasons for a browser-only file: happy-dom has no layout, so scroll
offsets and geometry cannot be modeled; happy-dom stubs `scrollIntoView`;
happy-dom shares constructors between a frame and its parent, so cross-realm
event identity is unobservable; happy-dom implements no document named getter,
so a form control shadowing `document.activeElement` cannot be reproduced; a
synchronously looping keydown handler would hang the happy-dom worker rather
than fail; and `vitest-fail-on-console` turns React's development warnings into
failures. The reasons for a happy-dom-only file are the mirror image:
`press.up` synthesizes a click on any focused native button regardless of where
the keydown happened, so a test depending on real Space-activation cancellation
asserts less there; a real browser blurs an element that disables itself while
happy-dom does not; and WebKit skips native buttons when tabbing under default
macOS keyboard settings, so tests needing Tab to reach a button script the
focus move instead.

Ariakit also uses `// @vitest-environment <name>` file comments to opt a single
file into another environment, which is what its `*.jsdom.test.ts` files do.
Zag's Svelte package does the same with `// @vitest-environment node` for its
SSR test.

Base UI takes the other approach for engines and the same one for platforms:
runtime `describe.skipIf(isJSDOM)` for environment, but file suffixes for
browser and platform behavior (`*.webkit.test.tsx`, `*.gecko.test.tsx`,
`*.iOS.test.tsx`, `*.android.test.tsx`, `*.non-mac.test.tsx`,
`*.voiceOver.test.tsx`, `*.talkBack.test.tsx`, `*.react17.test.tsx`). The
suffix wins. A runtime skip hides in the output; a filename is greppable and
its absence is visible.

## Flakiness patterns

Retries are the loudest signal in the research. Melt sets `retry: 5`
**globally**, which says its timing-sensitive jsdom tests are simply unreliable.
Bits sets `retry: 3` (real browsers, understandable). Radix and Base UI set
`retry: 1`. Zag allows `retry: 2` in exactly one place, the React adapter's
unit config, and 2 retries on CI for Playwright. React Aria and Headless UI set
no retries at all, which is the right default and only achievable because they
never assert real time.

Then the skips, each with its upstream reason.

**jsdom pointer events.** jsdom has no `PointerEvent` (jsdom#2527) and no
pointer capture (jsdom#2666). The consequences: React Aria has to run every
interaction suite two or three times under `describe.each` over mouse, pointer
and touch because the branches assert genuinely different sequences; Kobalte's
`installPointerEvent` is needed only where library code does
`instanceof PointerEvent` or reads constructor-only fields (`select` needs it,
`tabs` and `listbox` do not, and several files install it and never fire a
pointer event); Headless UI has to install its own `PointerEvent` polyfill
carrying `button` and `pointerType` defaulting to `'mouse'`. Headless UI also
needs `FakePointer.bypassingTrackingChecks(cb)`, which sets
`TEST_BYPASS_TRACKED_POINTER=1` for the duration of a callback, because jsdom
does not implement pointer positions and the library's own pointer tracking
would reject the synthetic events. That is a test helper reaching into product
code to disable a guard, which is a smell worth avoiding by keeping pointer
tracking observable rather than bypassable.

**The presence animation bug.** This is the most instructive failure in the
research and it is in our framework. Kobalte has thirteen commented-out
assertions carrying `// TODO: fix solid-presence vitest` (five in accordion,
two in collapsible, six in toast) and every single one is the negative
assertion after a close: that content is gone. So both Kobalte and Corvu prove
things do not disappear when they should not, and never prove they disappear
when they should.

The cause is mechanical. `solid-presence` decides an exit is instant only when
the element's computed `animationName` is exactly the string `"none"`, and
jsdom's `getComputedStyle` returns `""`. The comparison fails, the primitive
concludes an exit animation is running, and it waits forever for an
`animationend` jsdom will never dispatch. Corvu's drawer has the same shape
through a different property: it reads
`parseFloat(getComputedStyle(content).transitionDuration)` and short-circuits
when that is `0`; jsdom gives `""`, `parseFloat("")` is `NaN`, and
`NaN === 0` is false, so a drawer never finishes opening or closing under test.

Three fixes, any of which closes the largest blind spot in both libraries: treat
an empty animation name as none, stub `getComputedStyle`, or dispatch a
synthetic `animationend`. Make the duration check `NaN`-safe while you are
there. Our presence implementation should be written so that the empty-string
case is handled in product code, not patched in the harness.

**`user.tab` focus.** Kobalte's thirteen `skipIf(process.env.GITHUB_ACTIONS)`
cases (the entire `Accordion` describe, the entire `Image` describe, three
`toggle-group` tests, five `tabs` tests, three `toast` tests) are each one of
two things: a test that uses `user.tab()` for real focus movement, or a test
that interleaves fake timers with microtask flushes. So Kobalte's Tab-order
behavior and its timer-driven behavior are both effectively unverified in CI.
The technique that does work in jsdom is `fireEvent.focusIn(element)`, which is
why `listbox.test.tsx` tests focus delegation without being skipped while
`tabs` and `accordion` are.

If our suite must be green in CI, validating jsdom focus movement and settling
on one timer strategy are the two prerequisites, and the honest alternative is
to mark Tab-order bullets `(browser-only)` and run them in Playwright.

**Other skips and their reasons.**

- Kobalte hard-skips `describe.skip("Select")` (4168 lines) and
  `describe.skip("Combobox")` (3579 lines), all three `menubar` tests, one
  `tabs` test (`// TODO test create-presence`), three `accordion` keyboard
  tests (`// TODO: use solid-list`), one `text-field` test
  (`// Skipped: requestSubmit is not implemented`), and one `toast` test
  (`// don't know how to test implicit promise rejection`). Of 564 `it` blocks,
  the two largest files alone account for about fifty that never run.
- Base UI's `popupConformanceTests` disables its animation-completion test
  unconditionally, pending team feedback.
- Melt's `e2e/dropdown.spec.ts` is entirely `test.describe.skip`, so Melt's
  real-browser coverage is one touch-event test.
- The APG comments out two menu-button `aria-activedescendant` tests as flaky
  (issue 1415) and the links-menu Enter test (issue 1937), skips a grid
  combobox Home test on macOS for a known bug (issue 3191), and marks two
  combobox grid assertions `ariaTest.failing` (issue 859, plus a placeholder
  whose body is a bare `t.fail()`). It also has documented behaviors with no
  test at all: no assertion that a dialog returns focus to its invoker, no
  Shift+Tab assertion for the alert dialog, no Delete or Ctrl+Page Up test for
  tabs, and the tooltip pattern has neither an example nor a test file.
- Zag's Vue and Svelte adapters carry visibly thinner coverage than React and
  Solid (three nested-state cases instead of seven, no replace or stable-API
  suites), and several Ark Vue component cases are skipped outright.

**Cleanup leaks.** Kobalte runs with `isolate: false`, so all 43 test files
share one module registry, which turns every module-level singleton into a
cross-file hazard: the `toaster` queue, `create-hide-outside`'s refcount map
and observer stack, and the `i18n` listener set all persist.
`toast.test.tsx` is the only file that defends itself, with `toaster.clear()`
in `beforeEach`. Files that call `vi.useFakeTimers()` call `vi.clearAllTimers()`
in `afterEach` but not `vi.useRealTimers()`; exactly one describe block gets it
right. React Aria has the discipline Kobalte lacks: its FocusScope suite
imports `focusScopeTree`, `hasSetupGlobalListeners` and `changeHandlers`
directly and asserts on them before and after interactions, and has a dedicated
test that fails in `afterAll` if any `requestAnimationFrame` leaks. Base UI
resets a process-global animation-frame scheduler in `afterEach` on both the
built and source copies of its utils package, because a frame left pending
under torn-down fake timers would fire later against stale state.

**`requestAnimationFrame`.** Handled three incompatible ways in one repo
(Kobalte): `listbox.test.tsx` stubs it synchronous in `beforeEach`;
`select.test.tsx` and `combobox.test.tsx` rely on `vi.runAllTimers()` firing it
under fake timers, marked by a `// run restore focus rAF` comment appearing
about twenty times. Base UI replaces `globalThis.requestAnimationFrame` with
`setTimeout(cb, 0)` in jsdom, which is what makes rAF-driven code advance under
fake timers. Pick one, globally.

**Timezone.** Reka pins `process.env.TZ = 'US/Eastern'` for the whole run and
Zag pins the Playwright context to `timezoneId: "UTC"`. A floating timezone
makes calendar tests flap. Pin it.

## Recommendation

### Runner and environments

One Vitest workspace, three projects, each with a filename contract.

1. **`core`** runs in environment `node`, matching `packages/core/**/*.test.ts`. No
   DOM globals at all, which the architecture already enforces through
   `no-restricted-globals`. This project exists to keep that enforcement
   honest.
2. **`suite`** runs in environment `jsdom`, matching `packages/suite/**/*.test.ts`.
   This is the default tier and where most spec bullets land.
3. **`suite-browser`** runs Vitest browser mode via
   `@vitest/browser-playwright`, matching `packages/suite/**/*.test-browser.ts` plus the engine-specific
   suffixes, running chromium, firefox and webkit headless at a fixed viewport.

Not happy-dom. Ariakit's speed argument is real, but happy-dom's divergences
(no `window.event`, shared constructors across realms, cached
`select.selectedOptions`, dropped scripted clicks on disabled controls, missing
`getModifierState`) cost Ariakit an entire `shims.ts` to paper over, and we do
not have that budget. jsdom's gaps are better documented and its failure modes
are better understood by everyone who will contribute.

Not a separate Playwright suite either. Base UI's approach of flipping the same
files into browser mode beats keeping two parallel suites, because Zag's,
Radix's and Melt's Playwright directories have all drifted from their unit
suites. The one thing we lose is Zag's ability to run the identical spec
against five framework example apps, and we replace that with the harness
interface below.

Global setup, in one file, doing all of it rather than scattering it the way
Kobalte did:

- `@testing-library/jest-dom/vitest` matchers, plus our own:
  `toHaveDataState`, `toBeLabelledBy`, `toBeDescribedBy`, and a `toHaveFocus`
  override that counts an element as focused when the active element points at
  it through `aria-activedescendant`. Those four cover most of what the
  upstream suites spell out by hand.
- `vitest-axe/matchers` with one global `configureAxe`, `region` disabled
  (component fragments have no landmark wrapper) and `color-contrast` disabled
  (no real styles). Nothing else disabled without a comment saying why.
- `console.error` and `console.warn` throw, with a named allowlist. Tests that
  expect a warning spy first.
- jsdom patches: `scrollIntoView`, `PointerEvent` and pointer capture,
  `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `structuredClone`,
  `Image`, `documentElement.clientWidth`/`clientHeight` at a fixed size,
  `getComputedStyle` returning a usable `animationName` and
  `transitionDuration` and tolerating a pseudo-element argument, and a
  non-zero `getBoundingClientRect` for anything measured.
- `requestAnimationFrame` as `setTimeout(cb, 0)`, one strategy, globally.
- `process.env.TZ` pinned to `UTC`.
- `afterEach` asserting timer hygiene (real timers restored) and no leaked
  frames, and resetting any module-level registry `@kit/dom` owns.

`isolate: true`. Kobalte's `isolate: false` bought startup time and cost
cross-file singleton bleed; our suite mounts real components with real global
listeners and cannot afford that.

### Harness interface

The harness is the only adapter-specific code in the suite, per the README, so
it has to be small enough that a second adapter is an afternoon's work and
complete enough that no spec bullet needs to reach around it. Two pieces.

**Mounting.**

```ts
interface Harness {
  mount<P>(component: Component<P>, props: P): Mounted
  // Mounted: { container: HTMLElement; setProps(next: Partial<P>): Promise<void>;
  //            unmount(): void }
  settle(): Promise<void>
}
```

`settle()` is the load-bearing method and the one thing every upstream suite got
wrong by scattering. Following Ariakit's two tiers: internally, two animation
frames with a microtask flush between them; then, once per interaction, a
scheduler drain. For Solid that means awaiting microtasks until the DOM stops
mutating, which is Ariakit's `flushScheduler` idea (a `MutationObserver` over
the container, yielding macrotasks until two consecutive mutation-free turns)
rather than Kobalte's hand-counted `await Promise.resolve()`. A React harness
supplies `act`; a Vue harness supplies `nextTick` plus a flush. No spec bullet
ever counts microtasks.

**Interaction.** One `user` object whose methods dispatch the sequences pinned
in the Event simulation section, implemented once against the DOM and shared by
every harness, because DOM events are not framework-specific. The harness only
wraps each call in its own flush. Methods: `click`, `tap`, `rightClick`,
`hover`, `hoverOut`, `press`, `pressDown`, `pressUp`, `type`, `tab`,
`shiftTab`, `focus`, `blur`, `longPress`, `virtualClick`, `paste`, `drag`.

Three rules for that layer, each earned from an upstream mistake:

1. Follow Ariakit for every sequence, including the pointer-then-mouse
   ordering, the per-document suppression of compatibility events after a
   prevented `pointerdown`, the `pointerId: -1, pointerType: ""` on a
   keyboard-caused click, and Space activating on keyup while Enter activates
   on keydown. Fire `mousemove` on hover, which Headless UI does not.
2. Never bypass product-code guards from the harness. Headless UI's
   `TEST_BYPASS_TRACKED_POINTER` is the anti-pattern.
3. Disabled controls get the pointer-family events and not the mouse-family
   ones, per spec, rather than Headless UI's "fire nothing".

**Assertions.** Not part of the harness. They read the DOM, so they are shared.
Model them on Headless UI's shape (optional element argument with a
document-wide fallback, a null short-circuit, a stack rewrite to the call site,
an `attributes` bag where `null` means absent) but generate the per-part checks
from the spec files rather than hand-writing three hundred of them. The three
state values `Visible`, `InvisibleHidden`, `InvisibleUnmounted` come across
unchanged; we need that distinction for `forceMount`.

Borrow Base UI's two generated harnesses as the entry points for cross-cutting
work: a `describeParts(...)` covering prop spreading, `class` and `style`
merging (never replacement, proved Radix-style by picking a user property
alongside a library-owned one), handler composition, ref identity and the
polymorphic escape hatch; and a `describePopup(...)` covering the
trigger/popup ARIA wiring, open and close by every route, and presence. Unlike
Base UI's, `describePopup` runs its animation-completion test rather than
skipping it, using Bits' `observeTransitionAttrs` pattern to assert the
**sequence** of `data-*` transition attributes instead of one sampled state.

### Per-engine file naming

Ariakit's suffixes, ported:

- `<component>.test.ts` runs in jsdom, the default tier.
- `<component>.test-browser.ts` runs in all three engines.
- `<component>.test-chrome.ts`, `.test-firefox.ts`, `.test-safari.ts`,
  `.test-mobile.ts`, `.test-ios.ts` each pin one engine or platform.

Every file past the first opens with a comment saying what the previous tier
cannot observe, and that comment must name the spec bullet id. A bullet tagged
`(browser-only)` in the spec must live in a `test-browser` file, and a bullet
with no such tag must not. That is mechanically checkable, and it is the
mechanism the APG's `data-test-id` scheme gets right: the harness asserts the
documented behavior exists before running the test, so prose and assertions
cannot drift. We can do the same by generating the test file skeletons from the
spec files and failing when a bullet has no test or a test has no bullet.

Reuse APG's other lesson too: assertion ids are many-to-one. The switch tests
map both Space and Enter to `key-space`; tabs map both to
`key-enter-or-space`. Our ids are per bullet, so this is already fine, but the
generator must allow several tests per bullet id.

### How a second adapter plugs in

A second adapter supplies one file exporting a `Harness`. Everything else (the
event layer, the assertions, the generated describes, the spec files) is
shared. The concrete work for, say, a React adapter:

- `mount` wraps `render` from the framework's testing library and returns the
  container plus a `setProps` that goes through the framework's own update
  path. Kobalte's note applies to whatever framework it is: `render` takes a
  thunk in Solid and an element in React, and that difference belongs in the
  harness and nowhere else.
- `settle` wraps the framework's flush. React supplies `act`; Vue supplies
  `nextTick`; Svelte supplies `tick`; Solid awaits the mutation-quiet loop.
- The adapter's build config supplies the export conditions and dedupe its
  framework needs. For Solid that is `conditions: ["development", "browser"]`
  and `dedupe: ["solid-js"]`, both mandatory.
- Framework-specific quirks get their own files outside the conformance suite,
  following Zag: React gets a `strict-mode` file (entry-effect cleanups
  composing rather than overwriting across the double mount, mutations reverted
  on close, every cleanup firing on unmount) and a `stable-apis` file; Vue gets
  scope-id forwarding through multi-root components and `v-model`; Svelte gets
  runes and attachments, and symbol-keyed props surviving a merge. None of
  those are spec bullets. They are adapter tests, and they live in the adapter
  package next to the code, per the README's split.

The parity mechanism is that the spec files are the shared artifact and the
suite is generated from them, so an adapter cannot quietly run a thinner set.
Zag and Ark both enforce parity by name-for-name duplication and both drifted
anyway (Vue and Svelte thinner than React and Solid, Ark Vue cases skipped
outright). Generation removes the option to drift.
