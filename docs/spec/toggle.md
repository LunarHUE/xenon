# toggle

A two-state toggle button: `role="button"` plus `aria-pressed`. Everything in
`button.md` applies to it unchanged; only the state contract is added here.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## toggle

### Roles and attributes

- [ ] `toggle.roles.1` Given a two-state toggle button, then it has `role="button"` plus an `aria-pressed` state. [apg, radix, base-ui, kobalte, react-aria, zag, bits]
- [ ] `toggle.roles.2` Given a toggle button that is on, then `aria-pressed` is `"true"`; when off, `"false"`. [apg, radix, base-ui, kobalte, react-aria, zag, bits]
- [ ] `toggle.roles.3` Given a toggle button, then `aria-pressed` is present in the initial markup with an explicit value before any interaction, not added on first activation. [apg, radix, base-ui, kobalte, react-aria]
- [ ] `toggle.roles.4` Given a toggle button whose pressed state changes, then `aria-pressed` is updated on the same element that carries `role="button"`, not on a wrapper. [apg]
- [ ] `toggle.roles.5` Given a toggle button, then its label MUST NOT change when its state changes: a mute button stays labelled "Mute" whether pressed or not (APG marks this Important). [apg]
- [ ] `toggle.roles.6` Given a design whose label does change between two words such as "Mute" and "Unmute", then `aria-pressed` MUST NOT be used at all and the control is an ordinary command button. [apg]
- [ ] `toggle.roles.7` Given a toggle button, then it MAY support a third partially-pressed state (`aria-pressed="mixed"`), which is the characteristic that distinguishes it from `switch`. [apg]
- [ ] `toggle.roles.8` Given a toggle button, then all descendants are forced presentational by the user agent, because `button` is in the children-presentational role list. [apg]
- [ ] `toggle.roles.9` Given a disabled toggle, when rendered, then the host carries the native `disabled` attribute plus `data-disabled`, and `aria-pressed` still reports its current value. [radix, base-ui, reka, bits, zag]
- [ ] `toggle.roles.10` Given a toggle root, then it carries `type="button"` so it does not submit an enclosing form. [zag, kobalte]
- [ ] `toggle.roles.11` Divergence: pressed state is exposed for styling as `data-state="on"` / `data-state="off"`, always present with one of the two values. [radix, reka, bits, zag] (decision needed)
- [ ] `toggle.roles.12` Divergence: pressed state is exposed for styling as a bare `data-pressed` attribute, present when on and absent when off. [kobalte, react-aria, zag] (decision needed)
- [ ] `toggle.roles.13` Given a toggle with an indicator part, then the indicator repeats the root's `data-state`, `data-pressed` and `data-disabled`. [zag] (candidate)
- [ ] `toggle.roles.14` Given a toggle root, then it carries a stable library-scoped data attribute naming the part (`data-toggle-root`), so tests can select it without a role query. [bits] (candidate)
- [ ] `toggle.roles.15` Given arbitrary DOM props such as `data-foo="bar"`, when passed to the toggle, then they land unchanged on the rendered host. [radix, react-aria]
- [ ] `toggle.roles.16` Given a toggle rendered with a `slot` name inside a context provider whose `slots` map names that slot, when rendered, then the host carries the `slot` attribute and merges in that slot's props (for example `aria-label`). [react-aria] (candidate)

### Keyboard

- [ ] `toggle.keyboard.1` Given focus is on a toggle button reading `aria-pressed="false"`, when Space is pressed once then again, then `aria-pressed` reads `"true"` then `"false"`. [apg, bits]
- [ ] `toggle.keyboard.2` Given focus is on a toggle button reading `aria-pressed="false"`, when Enter is pressed once then again, then `aria-pressed` reads `"true"` then `"false"`. [apg, bits]
- [ ] `toggle.keyboard.3` Given a toggle whose state attribute is `data-state`, when Enter or Space flips it, then `data-state` and `aria-pressed` change together in the same update. [bits] (candidate)

### Pointer

- [ ] `toggle.pointer.1` Given a toggle button, when it is clicked, then `aria-pressed` flips exactly as it does on Enter or Space. [apg, radix, base-ui, kobalte, react-aria, reka, bits]
- [ ] `toggle.pointer.2` Given a toggle that is on, when it is clicked again, then it returns to off. [radix, base-ui, reka, react-aria]
- [ ] `toggle.pointer.3` Given a disabled toggle, when it is clicked, then the state does not change and no change callback fires. [radix, base-ui, reka]
- [ ] `toggle.pointer.4` Given a toggle whose pressed state is reflected in a pressed-styling attribute, when the pointer presses down, then `data-pressed="true"` appears, and on release it is removed while the activation, click and capture handlers have each fired exactly once. [react-aria] (candidate)
- [ ] `toggle.pointer.5` Given a toggle exposing a hover flag, when the pointer hovers it, then `data-hovered="true"` appears and is removed again on unhover. [react-aria] (candidate)

### Focus management

- [ ] `toggle.focus.1` Given a toggle button, then focus remains on it after activation, because toggling neither dismisses nor changes context. [apg]
- [ ] `toggle.focus.2` Given a toggle button, then its accessible name does not change on activation, so a screen reader user re-reading the focused element hears the same name with a changed pressed state. [apg]
- [ ] `toggle.focus.3` Given a toggle exposing a focus-visible flag, when it is focused by Tab, then it becomes `document.activeElement` and gains `data-focus-visible="true"`, removed again when Tab moves on. [react-aria] (candidate)

### State

- [ ] `toggle.state.1` Given a toggle button, when it is activated twice, then `aria-pressed` returns to its original value: the toggle is idempotent over two activations. [apg, base-ui, reka, react-aria]
- [ ] `toggle.state.2` Given an uncontrolled toggle with a default-pressed prop, when it renders, then it starts pressed with no external state involved. [radix, base-ui, kobalte, react-aria]
- [ ] `toggle.state.3` Given an uncontrolled toggle with no pressed props, when it renders, then it starts off. [radix, base-ui, kobalte, react-aria, reka, bits]
- [ ] `toggle.state.4` Given a controlled toggle whose pressed prop is fixed, when it is clicked, then the DOM state never diverges from the prop: `aria-pressed` and the state attribute stay as the parent set them. [radix, base-ui, kobalte, react-aria]
- [ ] `toggle.state.5` Given a controlled toggle that is pressed, when it is clicked, then the change callback fires exactly once with the requested next value `false`, not the current value. [radix, base-ui, kobalte, react-aria, bits]
- [ ] `toggle.state.6` Given a controlled toggle whose pressed prop is driven from outside (an external control flipping it), when the outside value changes twice, then `aria-pressed` follows it from `"false"` to `"true"` and back. [base-ui, bits]
- [ ] `toggle.state.7` Given an uncontrolled toggle with a change callback, when it is clicked, then the callback is called exactly once with the new value. [base-ui, kobalte, react-aria, bits]
- [ ] `toggle.state.8` Given a change callback that cancels through the event details it receives, when the toggle is clicked, then the pressed state does not change. [base-ui] (candidate)
- [ ] `toggle.state.9` Given a grouped toggle whose own change callback cancels, when it is clicked, then it stays unpressed AND the group's value callback is never called, so the veto reaches the group. [base-ui] (candidate)
- [ ] `toggle.state.10` Given a read-only toggle state, when the pressed value is assigned directly rather than through a user event, then it does not change, so read-only blocks programmatic assignment too. [kobalte] (candidate)
- [ ] `toggle.state.11` Given a toggle whose children are a render function reading the pressed flag, when it is clicked, then the rendered children re-render for the new state. [react-aria, base-ui]

### Forms

- [ ] `toggle.forms.1` Given a toggle that participates in a form, then the whole form-association, constraint-validation and disabled contract recorded in `button.forms.1` through `button.forms.31` applies unchanged; a `div`-based toggle is not form-associated and not labelable. [html]
- [ ] `toggle.forms.2` Given a toggle with a `name` inside a form, when rendered, then a hidden `input[type="checkbox"]` carries the value for submission. [reka] (candidate)
- [ ] `toggle.forms.3` Given that hidden input, then it is NOT nested inside the interactive control, so a `button input` selector matches nothing. [reka] (candidate)

### Accessibility tooling

- [ ] `toggle.a11y.1` Given a toggle button, then every rule that applies to a command button applies unchanged: `button-name`, `aria-command-name`, `nested-interactive`, `focus-order-semantics` and `label-content-name-mismatch`. [axe]
- [ ] `toggle.a11y.2` Given `aria-pressed` on a `role="button"` element, then it is in that role's allowed-attribute list so `aria-allowed-attr` passes; `aria-pressed` on any other role fails at critical impact. [axe]
- [ ] `toggle.a11y.3` Given `aria-pressed`, then its value MUST be one of the ARIA-valid values, so a typo such as `"pressd"` fails `aria-valid-attr-value` at critical impact. [axe]
- [ ] `toggle.a11y.4` Given `aria-roledescription` on a toggle button, then `button` is one of its supported roles, though the rule ships disabled and is tagged deprecated in this axe version. [axe]
- [ ] `toggle.a11y.5` Given a rendered toggle, whether default, disabled or inside a form, when the container is run through axe, then there are no violations. [radix, reka]

### Notes and edge cases

- [ ] `toggle.notes.1` Given a binary input, then choosing between `button` + `aria-pressed`, `checkbox` + `aria-checked` and `switch` + `aria-checked` is a semantics decision, not a behavior one: pick the role matching both the visual design and the label wording. [apg]
- [ ] `toggle.notes.2` Given unconsumed props such as `ref`, `className`, inline `style` and `onClick` on the toggle, when it renders, then they land on the host element, the ref resolves to it, and the author's `onClick` is composed with the toggle's own handler rather than replacing it. [radix, base-ui]
- [ ] `toggle.notes.3` Given a toggle rendered through a render prop inside a toggle group, when it renders, then the render function receives the composite props including `tabIndex: 0`. [base-ui] (candidate)
- [ ] `toggle.notes.4` Given the toggle's state vocabulary, then it uses `on`/`off` and `aria-pressed`, deliberately differing from the checkbox and switch primitives, which use `checked`/`unchecked` and `aria-checked`. [bits, reka]
- [ ] `toggle.notes.5` Given a reactive framework whose signal writes reach DOM attributes on the microtask queue, then a click must be followed by one microtask flush before asserting `aria-pressed` or the change callback. [kobalte] (candidate)
- [ ] `toggle.notes.6` Given a toggle state primitive, then its internal prop vocabulary (`isSelected`/`defaultIsSelected`/`onSelectedChange`/`isReadOnly`) is not part of the component contract, which spells the same concepts `pressed`/`defaultPressed`/`onChange`. [kobalte] (candidate)

## Sources

- `apg-and-axe.md`: `## toggle` (its APG, WHATWG HTML and axe-core bullets). The WHATWG forms and disabled block is identical to the one in `## button`, so it is folded into the single pointer bullet `toggle.forms.1` rather than repeated.
- `kobalte-and-corvu.md`: `## toggle` (`ToggleButton` and `createToggleState`).
- `radix-and-base-ui.md`: `## toggle` (Radix `Toggle.Root` and Base UI `Toggle`).
- `react-aria-a.md`: `## toggle` (Spectrum v3 `ToggleButton` and react-aria-components `ToggleButton`).
- `reka-melt-bits.md`: `## toggle` (Reka `Toggle`, Bits `Toggle.Root`). Melt ships no toggle section.
- `zag-and-ark.md`: `## toggle` (the standalone toggle machine's attribute contract).

## Deferred

- Default class names (`react-aria-ToggleButton`) and class-merging behavior: a headless library emits no classes, so there is nothing to conform to.
- `aria-pressed="mixed"` (`toggle.roles.7`): no library in the research implements the third state, and no component in the inventory needs it, so it stays recorded but unimplemented.
- The hidden-checkbox form bridge (`toggle.forms.2` and `.3`): only one library does this, and form participation for a toggle is better decided once checkbox and switch land, since all three want the same mechanism.
- `data-toggle-root` style part attributes (`toggle.roles.14`): a library-wide naming decision, not a toggle behavior. It belongs in a cross-cutting convention, not this file.
