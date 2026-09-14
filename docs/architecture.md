# Architecture

Decision record. Update it when a decision changes, not when code changes.

## Goal

A headless component library for Solid 2 whose behavior lives in plain
TypeScript, so a React or Vue adapter later is a thin binding job and not a
rewrite. Solid is the only adapter for now and gets the idiomatic API.

## Layers

- `@kit/core`. One function per component, from options to a `PartProps` per
  part. Pure: it may use DOM types but never DOM globals, enforced by eslint
  `no-restricted-globals` and by running its tests in Node. Everything that
  needs a live document (focus trap, dismiss, positioning, presence) goes in a
  future `@kit/dom` package, also framework-free.
- `@kit/solid`. Components that call core inside `createMemo` and spread the
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
  On the native host Enter is the form's implicit submission, and adding a
  toggle there would make one key do both. The APG lists Enter as optional
  for switch; we take the option not to.
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
  and nothing at all while exited.

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
  the new array to the setter.

## `@kit/dom`

Framework-free browser logic that a React or Vue adapter would reuse, and the
only package besides the adapters allowed to touch the DOM. It exists now
because presence needs to wait on a real animation. Positioning and the
layering stack will land here too.

## Toolchain

bun workspaces with a catalog, turbo for task running, TypeScript 7 for
`tsc` with the 6.x API kept for typescript-eslint, eslint 10, prettier,
vitest. Solid 2 release candidate, pinned exact with `@solidjs/signals`
overridden to the same version because the rc range floats.

## Later

- `@kit/dom` when the first floating component (popover) lands.
- A conformance suite written once against the DOM, run per adapter through a
  small mount harness. Spec source: WAI-ARIA Authoring Practices keyboard and
  role tables, then the React Aria, Radix, Zag and Ariakit suites.
- Docs app. Solid, for dogfooding.
