# Architecture

Decision record. Update it when a decision changes, not when code changes.

## Goal

A headless component library for Solid 2 whose behavior lives in plain
TypeScript, so a React or Vue adapter later is a thin binding job and not a
rewrite. Solid is the only adapter for now and gets the idiomatic API.

## Layers

- `@xenon/core`. One function per component, from options to a `PartProps` per
  part. Pure: it may use DOM types but never DOM globals, enforced by eslint
  `no-restricted-globals` and by running its tests in Node. Everything that
  needs a live document (focus trap, dismiss, positioning, presence) goes in a
  future `@xenon/dom` package, also framework-free.
- `@xenon/solid`. Components that call core inside `createMemo` and spread the
  result. Nothing from core shows up in the public API. Ark UI lets Zag's
  `connect` and `normalizeProps` leak into user code, and we treat that as the
  mistake to avoid.

## Controller shape

A controller returns `{ state, parts }`. `state` is the snapshot adapters
expose and CSS reads through data attributes. `parts` is one `PartProps` per
anatomy part. Options are input and never inherit from `PartProps`; an
option that mirrors an attribute takes its type from the generated
vocabulary. A controller never sees the DOM element; the adapter tells it the
host kind (`button`, `input`, `link`, `generic` for the button) and reads
`state.interactive` to decide whether user handlers run.

## The contract

`PartProps` is `{ attrs, on }`. Attribute names use the HTML spelling
(`class`, `for`, `tabindex`); `undefined` means "do not set". Listeners are
keyed by DOM event name and receive the native event. Adapters translate;
core never learns a framework's spelling.

Adapters merge user props over core props. Attributes: the user's win.
Handlers: the user's runs first and `preventDefault()` skips the core one.

## Decisions taken while making the button pass its spec

- An `a` host with `href` is a link: no button role, no tab stop, Enter is
  native and Space does nothing (`button.notes.1` is normative). Disabled or
  pending drops the `href`, as React Aria does.
- Native hosts delegate activation to the browser. Core never prevents
  default on Enter or Space for them, so `button.forms.32` stays skipped.
- Non-native hosts synthesize a real `click` on Enter keydown and Space
  keyup, carrying modifier state, ignoring OS key repeat.
- `pending` and `focusableWhenDisabled` are part of the API. Both keep the
  element focusable with `aria-disabled` and stop user handlers from running.
- Not adopted: a runtime `focusable` flag, `input[type=checkbox]` as a host.

## Decisions taken for checkbox and switch

- The component is the control. The default host is a native
  `input[type=checkbox]`, because the browser then supplies form
  participation, label association, `fieldset` disabling, reset, constraint
  validation and `:indeterminate` for free. `as="button"` and any other
  element get `role="checkbox"` (or `role="switch"`), `aria-checked` and a
  hidden sibling input that exists only when `name` is set. There are no
  indicator, control, label or thumb parts this round; visuals are CSS on the
  element or a sibling, driven by `data-state`.
- Space toggles on every host. Enter never toggles a checkbox or a switch.
  Native checkboxes do not implicitly submit forms on Enter. The Solid
  adapter explicitly requests submission for an interactive native Switch,
  using its owning form and first associated submitter when present. This
  retains native validation and submission cancellation without changing
  checkedness. Checkbox keeps its native Enter behavior. The APG lists Enter
  toggling as optional for switch; we take the option not to.
- `indeterminate` is a controlled, sticky flag independent of `checked`. It
  wins for `aria-checked="mixed"` and `data-state`. Activation proposes
  `!checked` through `onCheckedChange` and does not clear it; the adapter
  rewrites the `indeterminate` property after every activation because the
  browser clears it on click.
- `disabled` is the native attribute on `input` and `button` hosts and
  `aria-disabled` without a tab stop on generic hosts. `readonly` keeps the
  control focusable, sets `aria-readonly` and blocks activation.
- Unchecked contributes nothing to a form, as native HTML does. Not adopted:
  `uncheckedValue`, an always-rendered hidden input, `aria-disabled`-only
  disabling.
- Core is pure: uncontrolled state (`defaultChecked`) lives in the adapter,
  and core always receives the current `checked`.

## Decisions taken for the composite engine and toolbar

- The engine is a pure, generic navigator: items are any array, it never
  touches an element, and it returns `parts.item(item)` for each one. A part
  keyed by identity is the shape for every collection-like controller.
- The item holding the tab stop carries `tabindex="0"`, every other item
  `tabindex="-1"`. The engine always resolves an active item when it has
  items: the consumer's choice if navigable, else the first navigable, else
  the first item. The tab stop follows focus, so clicks and keys share it.
- Before hydration, toolbar items remain ordinary tab stops, with natively
  disabled items excluded. Once the client registry is populated, the toolbar
  narrows to one roving tab stop. The client starts with the same attributes as
  the server so hydration updates every non-active item correctly.
- Only keys on the active axis are claimed, and a claimed key has its default
  prevented before the move, even at a boundary. Arrows with a modifier held
  do nothing. Home and End are always claimed.
- The engine clamps at the ends. Toolbar turns looping on by default, as the
  APG example does, with `loop={false}` to clamp.
- Direction comes from a `dir` prop, else from the nearest `dir` ancestor.
- A natively disabled item leaves the ring. An `aria-disabled` item stays in
  it, so toolbar buttons default to `focusableWhenDisabled`. Re-entering a
  toolbar lands on the last active item.
- Button gating suppresses user keydown and keyup only for Enter and Space
  while not interactive; arrows and the rest always reach the user handler.
- Separators take the perpendicular orientation of their toolbar, and emit
  `aria-orientation` only when that works out to vertical. Round one's rule 5
  narrowed this; it originally emitted the attribute unconditionally.
- Not this round: grid, virtual focus, typeahead, selection, PageUp/Down,
  nested composites.

## Decisions taken for round one

Cross-cutting, and binding on everything built after this point.

- `data-state` is the primary styling hook and always carries an explicit
  value. Bare presence attributes stay bare: an empty string when on, absent
  when off.
- A single-selection change payload is a bare value, and `undefined` when
  nothing is selected. Multiple selection gives an array. Never an array of
  one, never an empty string or null for empty.
- Selection commits on click, never on pointer down.
- `aria-orientation` is emitted only when it differs from the role default,
  so a horizontal tablist and toolbar carry none. This departs from the
  library majority for tabs, deliberately, so the two agree.
- Native first. Where a native element already supplies form participation,
  `required`, `disabled`, implicit submission or label association, use it
  rather than rebuilding it in ARIA.
- Mounting never fires a change callback.
- `undefined` always means uncontrolled. A prop that goes from a value to
  `undefined` silently returns control to internal state.
- Ids are never generated in core. Core takes them as options and the adapter
  mints one base, deriving the rest. An author id always wins.
- The error message rides in `aria-describedby`, never `aria-errormessage`,
  because VoiceOver and NVDA do not support the latter. Author ids lead, then
  the description, then the error, and the error only while invalid.
- Measured sizes are published as part-named custom properties with no brand
  prefix, such as `--collapsible-panel-height`.
- Exiting presence-controlled content carries native `inert` until it leaves,
  so its visible exit animation does not leave interactive or accessible content.
  Reopening clears inert and cancels the stale exit wait.
- Exit timing comes from the Web Animations API. Where `getAnimations` is
  missing, as in jsdom, the element leaves immediately.

## Decisions taken for collapsible and accordion

- The Solid presence primitive keeps `status` in a writable memo derived from
  `open`, not in a signal an effect writes. A close therefore reaches
  `exiting` in the same computation that flips `open`, so `present` never
  dips false and the content element survives the exit. Effects only push the
  phase forward: a frame for `entering` to reach `entered`, `waitForExit` for
  `exiting` to reach `exited`. A reopen mid-exit cancels the wait through the
  effect's cleanup and the same element enters again.
- An accordion is not a composite widget. It takes the composite engine's
  arrow, Home and End handling but drops its roving `tabindex`, so every
  trigger stays its own tab stop, as `accordion.keyboard.5` requires.
- `role="region"` on panels is opt-out, through `region={false}`. The APG
  advises against it once an accordion has more than roughly six panels and no
  library makes it conditional, so the escape hatch has to be explicit.
- A part-level `id` on a trigger, content or panel is registered back to its
  root, so `aria-controls` and `aria-labelledby` follow the author's id rather
  than pointing at a generated one the element no longer carries.
- The collapsible trigger does not gate the author's own handlers the way
  button and checkbox do. A disabled native button dispatches no click, and
  the trigger has no key handler to suppress.
- The content size custom properties are written by the adapter on every
  status change: pixel values while entering or exiting, `auto` once entered,
  and nothing at all while exited. Transitioning to `auto` needs
  `interpolate-size: allow-keywords` in the consumer's CSS; without it the
  height jumps rather than animating, which the example app hit first.

## Decisions taken for the field family

- The root owns the engine call and publishes a context; the parts build
  their own attributes from the four flags it exposes. Only the root spreads
  a core part, because the label, description and error need ids the root
  cannot know until they register.
- `Field.Label` is always a real `label` element and takes no `as`. Native
  first: `label[for]` names and focuses every labelable control, which is
  every host we ship except the generic one. A label that is not a `label`
  would have to tell the control to name itself through `aria-labelledby`,
  and the context has no channel for that.
- A control decides its own naming. Labelable hosts (`button`, `input`,
  `meter`, `output`, `progress`, `select`, `textarea`) rely on the label's
  `for`; anything else adds `aria-labelledby` pointing at the label id. The
  author's own value always leads the merge.
- Clicking a label focuses a non-labelable control, because the browser only
  does it for a real `label[for]` pointing at a real form control. A disabled
  field skips it and focus stays where it was.
- `registerDescription` and `registerError` take the id the part actually
  rendered, so an author id on a description still reaches the control's
  `aria-describedby`. Several descriptions list every id; the error id joins
  only while invalid.
- A field-aware control merges the field's values with its own: the control's
  prop wins, except `disabled`, `required`, `readonly` and `invalid`, which
  are OR-ed, so a disabled field disables its control and a control can never
  escape it. Outside a field the control behaves exactly as before.
- `as="fieldset"` drops `role="group"` and carries the native `disabled`
  attribute instead.
- Part registration keeps live author-id accessors, so changing a control or
  label id updates the association without removing and re-appending that
  part in the registry. Labels and descriptions register their DOM elements
  to preserve document order even when conditional siblings settle later.
- Field parts render children separately from attribute spreads. In
  particular a checkbox nested in a label must not be recreated when its own
  registration updates the label's `for` attribute.
- Server rendering registers parts synchronously and reads the current plain
  registry, because server effects do not run and server memos do not update.
  The same memo and effect calls are still allocated on server and client;
  skipping either changes Solid's hydration keys. `Field.Label` defers its view
  so a later sibling control's author ID is registered before `for` is emitted.
  `Field.Control` returns a
  lazy memo whose view is untracked so direct sibling descriptions register
  before its attributes are serialized, including descriptions written after
  the control. The memo keeps the client input node stable as flags change.
- Native wrappers serialize their children before later siblings register.
  Field therefore finalizes native `for`, `aria-labelledby` and
  `aria-describedby` attributes at its own server boundary. Temporary random
  markers are replaced with escaped references after one subtree evaluation;
  absent references are removed. Markers are scoped to the Field and never
  become element IDs or reach the browser. Solid's SSR template segments and
  pending functions are preserved rather than reparsing the output or rendering
  user children twice. This adapter depends on the installed Solid SSR node
  representation and is covered by string, stream and hydration regressions.
- Custom `as` components receive real association prop values, not markers,
  because they may inspect or merge them. Their forward references, and metadata
  introduced after an asynchronous boundary has already streamed, still require
  explicit author IDs. This finalization applies to synchronously rendered
  native hosts; it is not a general deferred-attribute API for Solid.

## Decisions taken for the toggle family

- Toggle has no link host. `aria-pressed` on `role="link"` is a critical axe
  failure, so `as="a"` resolves to the generic host and gets `role="button"`.
  It is the one place toggle does not inherit the whole button host set, and
  because that silently hides an anchor's navigation, a toggle that renders a
  linked anchor warns in development.
- `data-state` carries `on` or `off` and a bare `data-pressed` rides with it
  while pressed. The two library camps are not exclusive and the pair matches
  what checkbox already emits.
- A toggle group's container is always `role="group"` and its items always
  report `aria-pressed`, in both modes. A container whose role changes when a
  prop changes is surprising, and radio semantics belong to radio group.
- Group items stay focusable while disabled, carrying `aria-disabled`, so a
  disabled item keeps its place in the arrow ring. There is no per-item
  native-disabled opt-out.

## Decisions taken for tabs

- A tab always carries `tabindex`, `aria-selected` and `aria-controls`,
  whether or not its panel is mounted, which is why panel ids come from the
  root rather than from a panel registering itself.
- A panel stays mounted and carries the native `hidden` attribute while its
  tab is not selected, so form state inside a panel survives. Unmounting on
  hide is a later option.
- Panel tab-reachability is decided by probing the whole panel for a
  focusable descendant, watched by a mutation observer so a panel that gains
  or loses content re-probes. Core only ever sees the resulting boolean.
- The tab stop starts on the selected tab and stays with the focused tab once
  focus is inside the list, handing back to the selection when focus leaves.
- A disabled tab takes the native `disabled` attribute and is skipped
  outright by arrow navigation, rather than being focusable and unselectable.

## Decisions taken for radio group

- The host decision belongs to the item, not the group, because everything
  that differs between native and non-native is per item.
- On the native host the browser owns arrow keys, wrapping, disabled skipping
  and focus, so the engine binds none of them and every input shares one
  `name`. Non-native hosts get the full composite engine, `role="radio"` and
  a hidden input each when the group is named.
- A group with no `name` still gets a generated one, because without it the
  browser does not treat the inputs as a group and native arrow selection
  stops working. The cost is that an unnamed native group does contribute an
  entry on submit.
- Arrow navigation starts from the radio that received the key, not from the
  selected value. The two come apart under readonly and under a fixed
  controlled value.
- After any change the adapter rewrites `checked` on every registered input,
  because checking one unchecks its siblings in the DOM.

## Decisions taken for progress and separator

- A non-finite value is indeterminate rather than reaching the DOM, since a
  non-numeric `aria-valuenow` is a critical axe failure.
- While indeterminate, `aria-valuenow` and `aria-valuetext` are both omitted
  and the format hook is not called. There is nothing to format.
- The percentage reaches CSS as `--progress-percentage`, written by the
  adapter. Writing it through the `style` attribute from core would lose to a
  user `style` prop, because user attributes win.
- A separator is a native `hr` by default and only spells `role="separator"`
  when `as` resolves to something else. `decorative` drops the role and the
  orientation attribute together.

## Three Solid traps every compound adapter hits

All three produce an infinite loop or a thrown context error, and all three
have now bitten more than one component. `packages/solid/src/toolbar` is the
reference shape.

- A root's `children` must not ride in the attribute spread. The spread
  recomputes, which re-creates the whole subtree, which re-registers every
  item, which writes the registry signal, which recomputes the spread. Pull
  children out with `omit` and render them as their own expression.
- A context provider inside `Dynamic` needs a `createMemo` around it, and the
  memo has to produce the provider, not the children. Without it `Dynamic`'s
  own spread re-creates the provider; with the memo around the wrong thing,
  items resolve their context outside the provider and throw.
- Registering from `onSettled` with a setter's updater form re-triggers the
  same `onSettled`. Keep a plain array beside the signal, sort that, and pass
  the new array to the setter. Registry signals also use `ownedWrite: true`: keyed
  item cleanup can run inside the parent computation and must still unregister
  the removed item. Trigger refs should capture the element first and publish
  it from `onSettled`; publishing during the ref callback can restart an ancestor
  computation and replace already hydrated content.

## `@xenon/dom`

Framework-free browser logic that a React or Vue adapter would reuse, and the
only package besides the adapters allowed to touch the DOM. It owns presence
animation timing, the layering stack, focus scopes, modal locks, native dialog
synchronization, drawer handle gestures, and anchored positioning.

Positioning uses `@floating-ui/dom` behind xenon's own options and state types.
It stays in the DOM package; core has no duplicate browser geometry controller.
The Solid utility has a separate `@xenon/solid/positioning` entry point. Animated
content sits inside the measured positioner so scale/slide transforms do not
change its layout box. See [positioning](positioning.md) for the library
comparison, defaults, and lifecycle contract.

Dialog, AlertDialog, and Drawer have separate public modules in core and Solid.
Shared adapter internals accept each family's core controller. Drawer gesture
code is reachable only through Drawer; production bundles verify that importing
Dialog alone excludes both other families, including through the root barrel.
See [layering](layering.md) and [the dialog family](dialog-family.md) for their
lifecycle and API decisions.

Popover and Menu also have independent public modules. Their explicit Positioner
parts compose anchored geometry with native manual popover hosting, and Content
owns semantics and animation. The shared floating-layer controller waits for
positioning before initial focus and retains layer ownership through exit.
See [Popover and Menu](popover-menu.md) for API and keyboard decisions.

## Toast notifications

`Toast.createManager` creates an isolated collection; `Toast.Provider` supplies
client timing and defaults, and `Toast.useManager` accesses it locally. The
headless renderer uses Portal, Viewport, Content, Title, Description, Action and
Close. Content is the individual notification root. IDs and framework content
belong to the adapter; core derives semantic attributes and admission decisions.

Separate pause reasons preserve remaining time across hover, focus, swiping,
window blur and document visibility changes. Limited records consume no time.
Promises update their original record only while its generation is current;
explicit re-addition can reopen an exiting record without replacing its element.
Natural heights are measured without transforms. Closing records retain their
last layout and swipe offsets while survivors reflow.

A toast viewport uses native manual-popover hosting without becoming a dismissing
layer or taking initial focus. Its pointer-only layer exemption leaves native
controls and Escape ordering intact. Toast.Portal moves a stable host into the
current modal content using the modal registry's document-scoped subscription.
This preserves native modal interactivity and focus containment. Explicit portal
containers override this automatic routing and must choose an interactive mount.

See [the toast plan](plans/toast.md) for API decisions and motion sources, and
[the coverage audit](plans/toast-coverage.md) for source-test mappings and gaps.

## Date-only calendars

DateValue is an immutable Gregorian `{ year, month, day }` value for years 1
through 9999. The default dateOnlyAdapter performs civil-day arithmetic without
reading a clock or consulting a host time zone. Month and year addition clamp to
the last valid day; parsing and serialization use strict ISO calendar dates.
DateAdapter<T> keeps representation conversion, arithmetic and formatting behind
an explicit contract. A future Temporal adapter can implement that contract.

DateProvider shares locale, weekStartsOn and a date-only today snapshot. Local
root props win. Custom date representations require an adapter on the root so
TypeScript can check values and callbacks together. Core always receives today;
the Solid binding can sample local fields once when none are supplied. SSR users
provide the same today snapshot and locale on server and client.

Calendar and RangeCalendar have separate modules and share Solid grid internals.
Native tables contain day buttons with one roving tab stop across all visible
months. Focus navigation does not select. Unavailable dates remain focusable but
cannot commit, and a range cannot cross an unavailable date. RangeCalendar keeps
the first activation's draft separate from the completed, sorted range.

See [the date plan](plans/date-adapters.md) for adapter boundaries, anatomy and
the later segmented-field and picker slices.

## Toolchain

Every Solid component has an explicit public subpath, such as
`import { Button } from '@xenon/solid/button'`. Use these imports in examples
and consumer code. The root barrel remains available. Positioning and spread
also have dedicated entry points; internal files are not public exports.
`bun run --cwd packages/solid test:exports` builds every public subpath and
checks that Button-only builds exclude unrelated components with either import
style.

bun workspaces with a catalog, turbo for task running, TypeScript 7 for
`tsc` with the 6.x API kept for typescript-eslint, eslint 10, prettier,
vitest. Solid 2 release candidate, pinned exact with `@solidjs/signals`
overridden to the same version because the rc range floats.

## Later

- DateField and DateRangeField for segmented editing and incomplete input, then
  DatePicker and DateRangePicker composing fields, calendars and popovers. See
  [date adapters](plans/date-adapters.md).
- A conformance suite written once against the DOM, run per adapter through a
  small mount harness. Spec source: WAI-ARIA Authoring Practices keyboard and
  role tables, then the React Aria, Radix, Zag and Ariakit suites.
- Docs app. Solid, for dogfooding.
