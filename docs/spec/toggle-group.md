# toggle-group

A set of toggle buttons sharing one value, with roving focus across the items.
Each item's own contract is `toggle.md`; the keyboard engine is `composite.md`.
Only the group-level behavior is specified here.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## toggle-group

### Roles and attributes

- [ ] `toggle-group.roles.1` Given a toggle group, then the root is a single labelled container: an `aria-label` or `aria-labelledby` on it names the group, and the name is exposed whichever container role the group resolves to. [radix, base-ui, react-aria, kobalte, melt]
- [ ] `toggle-group.roles.2` Given a toggle group with no `orientation` prop, when rendered, then the root carries `data-orientation="horizontal"`; with `orientation="vertical"`, `data-orientation="vertical"`. [kobalte, base-ui, zag]
- [ ] `toggle-group.roles.3` Given the container role is `group`, then `aria-orientation` is NOT emitted, because it is invalid on `group`; given the role is `radiogroup` or `toolbar`, then `aria-orientation` is emitted with the group's orientation. [base-ui, react-aria]
- [ ] `toggle-group.roles.4` Given a group with a default value, when rendered, then exactly the matching item reports the pressed state and every other item reports unpressed. [kobalte, radix, base-ui, react-aria, reka, melt, bits, ark]
- [ ] `toggle-group.roles.5` Given a disabled group, when rendered, then every item is disabled: each carries `aria-disabled="true"` and `data-disabled`, and the root carries `data-disabled`. [base-ui, react-aria, bits, zag, ark]
- [ ] `toggle-group.roles.6` Given a group that is not itself disabled and one item that is, when rendered, then only that item carries `aria-disabled="true"` and `data-disabled`; its siblings carry `aria-disabled="false"` with no `data-disabled`. [base-ui, react-aria, kobalte]
- [ ] `toggle-group.roles.7` Given a group-level disabled flag and one item that explicitly opts back in, when rendered, then that item stays enabled while its non-overriding siblings stay disabled. [react-aria] (candidate)
- [ ] `toggle-group.roles.8` Given a multiple-selection group, when the mode is on, then the root carries `data-multiple`, removed again when it goes off. [base-ui] (candidate)
- [ ] `toggle-group.roles.9` Given a toggle group item, then it carries `type="button"` and `data-ownedby` naming the root's id, plus `data-focus`, `data-disabled`, `data-orientation` and `data-state` of `on`/`off`. [zag] (candidate)
- [ ] `toggle-group.roles.10` Given a toggle group, then the root and each item carry stable library-scoped part attributes (`data-toggle-group-root`, `data-toggle-group-item`). [bits] (candidate)
- [ ] `toggle-group.roles.11` Divergence: the container role follows the selection mode as `radiogroup` in single mode and `toolbar` in multiple mode, and items are `role="radio"` with `aria-checked` in single mode and `role="button"` with `aria-pressed` in multiple mode. [radix, react-aria] (decision needed)
- [ ] `toggle-group.roles.12` Divergence: the container role follows the selection mode as `radiogroup` in single mode and `group` in multiple mode, with the same per-mode item split between `role="radio"` + `aria-checked` and `aria-pressed`. [zag, melt] (decision needed)
- [ ] `toggle-group.roles.13` Divergence: the container is always `role="group"` and every item always reports `aria-pressed`, regardless of selection mode. [base-ui, kobalte] (decision needed)

### Keyboard

- [ ] `toggle-group.keyboard.1` Given a horizontal group with the first item holding the roving tab stop, when the orientation's forward key (ArrowRight in LTR) is pressed, then focus and `tabindex="0"` move to the next item; the backward key walks back. [kobalte, base-ui, react-aria, reka, bits, zag, melt]
- [ ] `toggle-group.keyboard.2` Given a vertical group, when ArrowDown then ArrowUp are pressed, then focus moves forward then back along the vertical axis. [kobalte, base-ui, react-aria]
- [ ] `toggle-group.keyboard.3` Given a horizontal group, when ArrowUp or ArrowDown is pressed, then nothing moves; given a vertical group, when ArrowLeft or ArrowRight is pressed, then nothing moves. The cross-axis keys are inert. [kobalte, base-ui]
- [ ] `toggle-group.keyboard.4` Given an RTL horizontal group, when the arrow keys are pressed, then only the horizontal pair is inverted: ArrowLeft moves forward and ArrowRight back. Vertical groups are unaffected by direction. [base-ui] (candidate) (browser-only)
- [ ] `toggle-group.keyboard.5` Given a group with focus on the last item, when Home is pressed, then the first item takes the roving tab stop and focus; given focus on the first item, when End is pressed, then the last item does. [kobalte, base-ui, zag]
- [ ] `toggle-group.keyboard.6` Given a group at its last item, when the forward arrow key is pressed, then focus loops to the first item; at the first item, the backward key loops to the last. [base-ui, reka, bits, zag, ark, melt]
- [ ] `toggle-group.keyboard.7` Given a group with looping disabled, when the forward key is pressed at the last item or the backward key at the first, then focus stays where it is. [bits, ark, melt]
- [ ] `toggle-group.keyboard.8` Given a focused item inside a group, when Enter is pressed twice, then the item's pressed state goes off, on, off; Space behaves identically. [base-ui, bits, melt]
- [ ] `toggle-group.keyboard.9` Given a focused item in a single-selection group, when Space presses it and then a sibling is focused and pressed, then exactly one item in the group reports pressed. [melt, base-ui]
- [ ] `toggle-group.keyboard.10` Given a focused item in a multiple-selection group, when Space presses it and then a sibling is focused and pressed, then both report pressed. [melt, base-ui]
- [ ] `toggle-group.keyboard.11` Given a focused, pressed item, when Space is pressed again, then it unpresses; this holds in both single and multiple mode. [melt, base-ui]
- [ ] `toggle-group.keyboard.12` Given the first item focused, when Tab is pressed, then focus leaves the group entirely rather than moving to the next item: the group is one tab stop. [melt, zag]
- [ ] `toggle-group.keyboard.13` Given the key map, then ArrowLeft and ArrowUp focus the previous item, ArrowRight and ArrowDown the next, Home the first, End the last, and Shift+Tab is intercepted to hand focus out of the group. [zag] (candidate)

### Pointer

- [ ] `toggle-group.pointer.1` Given a single-selection group with nothing pressed, when an item is activated with the pointer, then it becomes pressed. [kobalte, radix, base-ui, react-aria, reka, bits, zag, ark]
- [ ] `toggle-group.pointer.2` Given a single-selection group with one item pressed, when a different item is activated, then the new item becomes pressed and the previous one unpresses: single selection replaces rather than adds. [kobalte, radix, base-ui, react-aria, reka, zag]
- [ ] `toggle-group.pointer.3` Given a single-selection group, when the already-pressed item is activated again, then it deselects and the group value becomes empty. [radix, reka, zag, melt]
- [ ] `toggle-group.pointer.4` Given a multiple-selection group, when two items are activated, then both report pressed and the value accumulates. [kobalte, radix, base-ui, react-aria, reka, bits, zag, ark, melt]
- [ ] `toggle-group.pointer.5` Given a multiple-selection group with two items pressed, when one of them is activated again, then only that value is removed and the other stays pressed. [radix, reka, bits, melt]
- [ ] `toggle-group.pointer.6` Given a disabled item, when it is clicked, then the change handler is never called and no state changes. [kobalte, base-ui]
- [ ] `toggle-group.pointer.7` Given a disabled group, when the pointer hovers an item, then no hover attribute or hover styling flag appears: disabled items suppress hover state entirely. [react-aria] (candidate)
- [ ] `toggle-group.pointer.8` Divergence: selection commits on `pointerdown`, not on `click`, so the value has already changed before the click event fires. [kobalte] (decision needed)
- [ ] `toggle-group.pointer.9` Divergence: selection commits on `click`, so a press cancelled before release changes nothing. [radix, base-ui, react-aria, reka, bits, zag] (decision needed)

### Focus management

- [ ] `toggle-group.focus.1` Given focus on an element before the group and nothing selected, when Tab is pressed, then the first enabled item receives focus. [melt, zag, kobalte]
- [ ] `toggle-group.focus.2` Given a group with a selected value, when the user Tabs in for the first time, then focus lands on the selected item, not the first item. [kobalte] (candidate)
- [ ] `toggle-group.focus.3` Given a group with a disabled item that would otherwise be the entry point, when the user Tabs in, then focus lands on the first enabled item instead. [kobalte] (candidate)
- [ ] `toggle-group.focus.4` Given an entirely disabled group followed by a plain button, when the user Tabs, then focus skips the whole group and lands on the button. [kobalte] (candidate)
- [ ] `toggle-group.focus.5` Given an item focused programmatically with `.focus()`, then that item's `tabindex` becomes `"0"`, so the roving tab stop follows real focus and not only arrow keys. [kobalte] (candidate)
- [ ] `toggle-group.focus.6` Given focus was moved to the second item with an arrow key, when the group is tabbed out of and back into, then focus returns to that same second item rather than the first. [zag] (candidate)
- [ ] `toggle-group.focus.7` Given the root, then it carries `tabIndex` of -1 while focus is tabbing backward out of the group and 0 otherwise, and `data-focus` while any item is focused. [zag] (candidate)
- [ ] `toggle-group.focus.8` Given a toggle group that is the first focusable element inside a dialog, when the dialog opens, then focus lands inside the group rather than skipping past it to a later control. [radix] (candidate) (browser-only)
- [ ] `toggle-group.focus.9` Given a group whose selection mode is switched at runtime between single and multiple, when it is switched back and forth with items clicked between each change, then the selection semantics switch each time, the mode attribute tracks the prop, and roving focus still works afterwards: the group must not remount on the transition. [base-ui] (candidate) (browser-only)
- [ ] `toggle-group.focus.10` Divergence: before any focus or selection, the first item carries `tabindex="-1"`, so the group holds no roving tab stop until focus or selection establishes one. [kobalte] (decision needed)
- [ ] `toggle-group.focus.11` Divergence: before any focus or selection, the first item carries `tabindex="0"`, so the group always presents exactly one tab stop. [base-ui, melt, zag] (decision needed)

### State

- [ ] `toggle-group.state.1` Given a group with a default value and a change spy, when it renders, then the spy has not been called: initialising from a default does not emit a change. [kobalte, base-ui, ark]
- [ ] `toggle-group.state.2` Given an uncontrolled group with a default value, when a different item is activated, then the change callback fires once with the new value and the pressed state moves to it. [kobalte, radix, base-ui, reka, bits, zag, ark]
- [ ] `toggle-group.state.3` Given a controlled group, when the value prop changes from outside, then the pressed state follows the prop exactly, in both single and multiple mode. [base-ui, react-aria, melt, bits]
- [ ] `toggle-group.state.4` Given a controlled group whose value prop is never updated by the consumer, when an item is activated, then the change callback fires with the value the consumer would need to apply and the DOM state does not move on its own. [base-ui, react-aria]
- [ ] `toggle-group.state.5` Given both a default value and a controlled value, when the group renders, then the controlled value wins. [melt] (candidate)
- [ ] `toggle-group.state.6` Given a change callback that cancels through the event details it receives, when an item is activated, then the callback fired but the value did not change. [base-ui] (candidate)
- [ ] `toggle-group.state.7` Given a change callback that returns a replacement value, when an item is activated, then the returned value is applied instead of the requested one, in both single and multiple mode. [melt] (candidate)
- [ ] `toggle-group.state.8` Divergence: a single-selection group's change callback receives a bare value (the item's value, or the empty string when deselected), and a multiple-selection group's receives an array. [radix, bits] (decision needed)
- [ ] `toggle-group.state.9` Divergence: the change callback always receives an array, even in single-selection mode, where the array holds at most one entry. [base-ui, react-aria, zag, ark] (decision needed)

### Forms

- [ ] `toggle-group.forms.1` Given a toggle group whose items participate in a form, then the whole form-association and disabled contract recorded in `button.forms.1` through `button.forms.31` applies to each item unchanged. [html]

### Accessibility tooling

- [ ] `toggle-group.a11y.1` Given a single-selection or multiple-selection toggle group, with nothing selected and with one item selected, when the container is run through axe, then there are no violations. [radix, reka, melt, zag, ark]

### Notes and edge cases

- [ ] `toggle-group.notes.1` Given items with no `value` of their own inside a group that has a value, when it renders, then the library logs exactly one development error telling the author to give each item an explicit `value` matching the group's value type. [base-ui] (candidate)
- [ ] `toggle-group.notes.2` Given items that omit `value` entirely in a group that also has none, when each is activated in turn, then pressed state still moves between them correctly in single mode and accumulates per item in multiple mode. [base-ui] (candidate)
- [ ] `toggle-group.notes.3` Given unconsumed props such as `ref`, `className`, inline `style` and `onClick` on the root or on an item, when rendered, then they land on the rendered element, the ref resolves to it, and the author's `onClick` is composed with the library's own handler rather than replacing it. [radix, react-aria]
- [ ] `toggle-group.notes.4` Given a reactive framework whose attribute writes land on the microtask queue, then every key or pointer event must be followed by one flush before asserting `tabindex` or the pressed state. [kobalte] (candidate)
- [ ] `toggle-group.notes.5` Given a jsdom harness, then Tab-order tests are the fragile ones: the source library skips its own three `user.tab()` tests on CI, so the suite must not lean on simulated Tab in jsdom without verifying it in browser mode first. [kobalte] (candidate)
- [ ] `toggle-group.notes.6` Given a jsdom harness driving pointer selection, then a real `PointerEvent` class must be installed and the events dispatched as `pointerdown` rather than through a click helper, because the press logic keys off pointer events. [kobalte] (candidate)
- [ ] `toggle-group.notes.7` Given single and multiple modes have different value shapes, then a library may expose them as two components rather than one component with a mode prop; either way the value shape must be stated per mode. [bits] (candidate)

## Sources

- `kobalte-and-corvu.md`: `## toggle-group` (`ToggleGroup.Root`, `ToggleGroup.Item`). Corvu ships no toggle group.
- `radix-and-base-ui.md`: `## toggle-group` (Radix `ToggleGroup` including its Playwright dialog-focus e2e, and Base UI `ToggleGroup`).
- `react-aria-a.md`: `## toggle-group` (react-aria-components `ToggleButtonGroup`, Spectrum 2 `ToggleButtonGroup`, `ActionButtonGroup` and `ButtonGroup`).
- `reka-melt-bits.md`: `## toggle-group` (Reka `ToggleGroup`, Melt toggle group, Bits `ToggleGroup.Root`).
- `zag-and-ark.md`: `## toggle-group` (the toggle-group machine's connect layer, its Playwright e2e, and Ark's React, Solid and Vue tests).

The APG has no toggle-group pattern, so the only normative bullet here is the
shared HTML forms pointer; the container-role question in
`toggle-group.roles.11` to `.13` therefore has no spec answer to defer to.

## Deferred

- Container-flex reflow (`ButtonGroup` stacking from row to column when its container shrinks below the intrinsic button width): layout, not behavior, and the source test is itself skipped. A headless library has nothing to assert here.
- Default class names and class-merging: a headless library emits no classes.
- Typeahead inside a toggle group: no library tests it, and the group's items are not text-first, so it is out of scope for a first implementation.
- Runtime selection-mode switching (`toggle-group.focus.9`): worth keeping honest eventually, but it needs browser mode and it only matters for a library that models mode as a prop rather than as two components.
- `data-ownedby` and other part-linking attributes (`toggle-group.roles.9`): a library-wide convention decision, not a toggle-group behavior.
