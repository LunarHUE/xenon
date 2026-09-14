# toolbar

One tab stop for a set of controls, with arrow keys moving focus between them.
The navigation engine is `composite.md`; the item contracts are `button.md`,
`toggle.md` and `toggle-group.md`. What is specified here is the toolbar's own
role and label, its separators, the single shared roving ring across nested
groups, and the rules for items that are not plain buttons.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## toolbar

### Roles and attributes

- [x] `toolbar.roles.1` Given the container grouping a set of controls, then it has `role="toolbar"`. [apg, radix, base-ui, react-aria]
- [x] `toolbar.roles.2` Given a toolbar with a visible label, then it has `aria-labelledby` referencing that label; otherwise `aria-label` supplies the name. The axe role table marks `toolbar` as requiring an accessible name, but ships no `toolbar-name` rule, so the suite MUST assert the name itself. [apg, axe, react-aria]
- [x] `toolbar.roles.3` Given a toolbar whose controls are arranged vertically, then it has `aria-orientation="vertical"`; horizontal is the default. [apg, radix, ariakit, react-aria]
- [x] `toolbar.roles.4` Given a toolbar, then it SHOULD be used as a grouping element only when the group contains three or more controls. [apg]
- [x] `toolbar.roles.5` Given a toolbar that controls another element, then it MAY carry `aria-controls` referencing it; the APG toolbar points at the text area it formats. [apg]
- [x] `toolbar.roles.6` Given icon glyphs inside toolbar buttons, then they carry `aria-hidden="true"`; if they instead carry `role="presentation"`, then they MUST NOT also be focusable or carry a global ARIA attribute. [apg, axe]
- [x] `toolbar.roles.7` Given `role="toolbar"` in the axe role table, then it is a structure-type role whose role-specific allowed attributes are `aria-orientation`, `aria-activedescendant` and `aria-expanded`, its superclass is `group`, and it has no required owned elements or required context, so any mix of controls is structurally legal. [axe]
- [x] `toolbar.roles.8` Given a separator between toolbar items, then it exposes `role="separator"`, whether it is an `hr` element or a dedicated part. [radix, base-ui, react-aria, ariakit]
- [x] `toolbar.roles.9` Given a separator inside a toolbar, then its orientation is the perpendicular of the toolbar's: a horizontal toolbar holds vertical separators. [radix, base-ui, react-aria, ariakit]
- [x] `toolbar.roles.10` Given a separator with an explicit `orientation` prop, when rendered, then the explicit value wins over the derived perpendicular one. [base-ui, ariakit]
- [ ] `toolbar.roles.11` Given a toolbar item slot, then it accepts something other than a button: a link, a text input, a group of items, a toggle, a toggle group, a menu trigger, a select trigger, a dialog trigger, a popover trigger, a switch or a number-field input, each keeping its own role and ARIA state while taking part in the toolbar's roving ring. [base-ui, radix, react-aria, melt, bits, ariakit]
- [ ] `toolbar.roles.12` Given a toolbar item rendered as a trigger for an overlay, then it keeps the trigger's own `aria-haspopup`: `menu` for a menu, `listbox` for a select, `dialog` for a popover. [base-ui] (candidate)
- [x] `toolbar.roles.13` Given a toolbar item, then it carries the toolbar's `data-orientation`, contributed by the roving-focus wrapper rather than by the item itself. [radix] (candidate)
- [ ] `toolbar.roles.14` Given a toolbar, then its parts carry stable library-scoped part attributes (`data-toolbar-root`, `data-toolbar-group`, `data-toolbar-group-item`, `data-toolbar-link`, `data-toolbar-button`). [bits] (candidate)
- [ ] `toolbar.roles.15` Given a toolbar with a nested radio group, then the group has `role="radiogroup"` with a label and each radio has `role="radio"` with `aria-checked`; `radio` has no required context in axe, so `aria-required-parent` does not enforce the wrapper and the suite MUST assert it. [apg, axe]
- [ ] `toolbar.roles.16` Given a menu button nested in a toolbar, then it has `aria-label`, `aria-haspopup="true"`, `aria-controls` pointing at the menu, and `aria-expanded` reflecting the menu's state. [apg]
- [ ] `toolbar.roles.17` Given a spinbutton nested in a toolbar, then it has `aria-label`, `aria-valuenow`, `aria-valuetext`, `aria-valuemin` and `aria-valuemax`, and its visible text matches `aria-valuetext`. [apg]
- [x] `toolbar.roles.18` Divergence: a separator's perpendicular orientation is always emitted explicitly, so a vertical toolbar's separators carry `aria-orientation="horizontal"` even though that is the role's default. [base-ui] (decision needed)
- [ ] `toolbar.roles.19` Divergence: a separator's `aria-orientation` is emitted only when it differs from the role default, so a vertical toolbar's separators carry no `aria-orientation` at all. [react-aria] (decision needed)

### Keyboard

- [x] `toolbar.keyboard.1` Given a toolbar, then focus management is implemented so the keyboard tab sequence contains exactly one stop for the whole toolbar and arrow keys move focus among its controls. [apg, radix, base-ui, react-aria, melt, bits, ariakit]
- [x] `toolbar.keyboard.2` Given Tab moving focus into a toolbar for the first time, then focus is set on the first control that is not disabled. [apg, react-aria, melt, ariakit]
- [x] `toolbar.keyboard.3` Given focus in a horizontal toolbar, when the forward key (ArrowRight in LTR) is pressed, then focus moves to the next control; the backward key moves to the previous one. [apg, base-ui, react-aria, melt, bits, ariakit]
- [x] `toolbar.keyboard.4` Given a vertically arranged toolbar, then ArrowDown behaves as the forward key and ArrowUp as the backward key. [apg, base-ui, react-aria, melt, ariakit]
- [x] `toolbar.keyboard.5` Given a horizontal toolbar, when ArrowUp or ArrowDown is pressed on a control that does not itself consume them, then focus does not move; given a vertical toolbar, ArrowLeft and ArrowRight are equally inert. The cross-axis pair is reserved for embedded controls that need it. [apg, react-aria, ariakit]
- [x] `toolbar.keyboard.6` Given focus anywhere in the toolbar, when Home is pressed, then focus and the roving `tabindex="0"` both move to the very first control in the whole toolbar, crossing group boundaries; End does the same for the last control. The APG marks Home and End optional, but its own example implements them. [apg, base-ui, melt, ariakit]
- [x] `toolbar.keyboard.7` Given a toolbar containing several groups separated by separators, when the forward key is pressed at the last item of a group, then focus crosses the separator into the first item of the next group; the backward key crosses back. [react-aria, base-ui, bits, melt]
- [x] `toolbar.keyboard.8` Given focus on the element before the toolbar, when Tab is pressed, then focus enters the toolbar at whichever control currently holds `tabindex="0"`; when Tab is pressed from inside, then focus leaves the whole toolbar and lands on the next control after it. [apg, react-aria, melt, ariakit]
- [x] `toolbar.keyboard.9` Given focus on a toolbar control, when a non-navigation key such as Enter is pressed, then focus does not move away from that control. [react-aria] (candidate)
- [ ] `toolbar.keyboard.10` Given a toolbar item rendered as a text input with a collapsed caret away from the text edge, a non-collapsed selection, or a Shift-extended selection, when the forward or backward arrow key is pressed, then the caret moves and focus stays in the input; only a press with the caret already at the matching text boundary moves focus out to the neighbouring item. [base-ui, ariakit]
- [ ] `toolbar.keyboard.11` Given a toolbar item rendered as a text input, when arrow navigation moves focus into it, then its text is selected in full (`selectionStart` 0, `selectionEnd` at the end). [base-ui] (candidate) (browser-only)
- [ ] `toolbar.keyboard.12` Given a toolbar item rendered as a number-field input, when it has focus, then ArrowUp and ArrowDown change the number-field value rather than moving toolbar focus. [base-ui] (candidate)
- [x] `toolbar.keyboard.13` Given a toolbar item rendered as a non-native button, when Space or Enter is pressed, then a real click is dispatched: the capture handler, the render element's `onClick`, the component's `onClick` and an ancestor `onClick` each fire exactly once. [base-ui] (candidate)
- [ ] `toolbar.keyboard.14` Given a toolbar item that is a link, when Space is pressed while the link itself has focus, then it activates; when Space is typed into a focusable descendant portaled out of the link's DOM subtree, then the link does NOT activate. [radix] (candidate)
- [ ] `toolbar.keyboard.15` Given a toolbar item that opens an overlay (menu, select, dialog, alert dialog or popover), when Enter opens it, then focus moves into the overlay, arrow keys operate the overlay's own items, and Escape closes it and returns focus to the toolbar item. [base-ui, ariakit]
- [ ] `toolbar.keyboard.16` Given an overlay opened from a toolbar item and focus inside it, when an arrow key is pressed, then the keydown does not escape to the toolbar composite and the overlay stays open. [base-ui] (candidate)
- [ ] `toolbar.keyboard.17` Given a text field in a toolbar during IME composition, when Enter is pressed with `isComposing` set, then focus stays in the field; the same holds for Safari's composing Enter, which reports `keyCode` 229 rather than `isComposing`. [ariakit] (candidate)
- [ ] `toolbar.keyboard.18` Given a toolbar container whose inner input is collapsed, when Tab reaches it, then the container itself takes focus and the input does not; typing a character opens it and moves focus into the input, Escape returns focus to the container, and Enter opens then closes it. [ariakit] (candidate) (browser-only)
- [ ] `toolbar.keyboard.19` Given an empty toolbar container field, when Backspace or Delete is pressed while the container holds focus, then focus moves into the input and the next typed character lands there; given a filled field, the first Backspace clears it and keeps focus on the container while a second moves focus into the input. [ariakit] (candidate) (browser-only)
- [ ] `toolbar.keyboard.20` Given a toggle button in a toolbar, when Enter or Space is pressed, then `aria-pressed` flips and the corresponding action is applied to the controlled element. [apg, base-ui, melt, bits]
- [ ] `toolbar.keyboard.21` Given an unchecked radio in a toolbar, when Enter or Space is pressed, then it becomes `aria-checked="true"` and the previously checked radio in the group becomes `"false"`; an already-checked radio stays checked with no toggle-off. [apg, melt]
- [ ] `toolbar.keyboard.22` Given focus on a radio inside a toolbar, when ArrowDown or ArrowUp is pressed, then focus moves within that radio group only, wrapping at its ends and never leaving the group. [apg]
- [ ] `toolbar.keyboard.23` Given a toolbar menu button, when Enter, Space, ArrowUp or ArrowDown is pressed, then the menu opens and focus lands on the currently checked item, which is the first item only when no other choice has been made. [apg]
- [ ] `toolbar.keyboard.24` Given an open toolbar menu, then ArrowDown from the last item wraps to the first and ArrowUp from the first wraps to the last; Escape closes it and returns focus to the menu button; Tab closes it, returns focus to the button and lets the default Tab proceed; ArrowLeft and ArrowRight do nothing but still suppress the default. [apg]
- [ ] `toolbar.keyboard.25` Given focus on a toolbar spinbutton, then ArrowDown decreases `aria-valuenow` by 1, ArrowUp increases it by 1, PageDown decreases by 5, PageUp increases by 5, and Home and End jump to the minimum and maximum. [apg]
- [ ] `toolbar.keyboard.26` Given a toolbar with hover labels, when Escape is pressed anywhere in the document, then every open hover label is hidden. [apg]
- [x] `toolbar.keyboard.27` Given an application where quick access to a toolbar matters, such as reaching an editor's toolbar from its text area, then a documented shortcut key for moving focus to the toolbar is recommended. [apg]
- [ ] `toolbar.keyboard.28` Given a toolbar, then controls whose operation needs the arrow-key pair used for toolbar navigation SHOULD be avoided; if unavoidable, at most one SHOULD be included and it SHOULD be the last element, such as a text box at the end of a horizontal toolbar. [apg]
- [x] `toolbar.keyboard.29` Divergence: arrow navigation wraps by default, so the forward key at the last control moves to the first; a prop turns wrapping off. The APG permits this and its own example does it. [apg, base-ui, melt, bits, ariakit] (decision needed)
- [ ] `toolbar.keyboard.30` Divergence: arrow navigation does not wrap, so the forward key at the last control and the backward key at the first both leave focus where it is. [react-aria] (decision needed)

### Pointer

- [x] `toolbar.pointer.1` Given a toolbar control, when it is clicked, then focus is set on it and its action is performed, so the roving `tabindex` stays consistent with the pointer state. [apg, react-aria]
- [x] `toolbar.pointer.2` Given a toolbar control that is a link, when it is clicked, then the native anchor behavior proceeds with no scripted action of its own. [apg, bits]
- [ ] `toolbar.pointer.3` Given a toolbar item inside both a toolbar and a toggle group, when it is clicked, then the author's `onClick` fires exactly once and is not double-invoked by the two composing layers. [radix] (candidate)
- [ ] `toolbar.pointer.4` Given a disabled toolbar button that stays focusable, when it is hovered then clicked, then hover handlers fire while activation handlers do not. [base-ui] (candidate) (browser-only)
- [ ] `toolbar.pointer.5` Given a disabled toolbar input, when it is clicked, then focus does not move to it; once it is enabled, a click focuses it. [base-ui] (candidate)
- [ ] `toolbar.pointer.6` Given a disabled toolbar input of type checkbox, when it is clicked, then it stays unchecked, so the disabled state suppresses the click's default action; once enabled, a click checks it. [base-ui] (candidate)
- [ ] `toolbar.pointer.7` Given a toolbar spinbutton's increase or decrease button, when it is clicked, then the value changes by one step. [apg]
- [ ] `toolbar.pointer.8` Given a toolbar hover label, then it appears immediately on `mouseover` and on `focus`, hides immediately on `blur`, and hides 800ms after `mouseleave` unless hover is regained in the meantime. [apg]

### Focus management

- [x] `toolbar.focus.1` Given a toolbar containing embedded composites such as a radio group, a toggle group, a menu button and a spinbutton, then the whole toolbar still shares ONE roving tabindex ring: exactly one item across every group has `tabindex="0"` at any moment and all others `tabindex="-1"`. Each nested composite does not own its own tab stop. [apg, radix, base-ui, react-aria, bits, melt]
- [x] `toolbar.focus.2` Given a toolbar control is clicked, then focus is set on it so the roving `tabindex` stays aligned with the pointer state. [apg, react-aria]
- [x] `toolbar.focus.3` Given a toolbar whose items are all disabled, when it mounts, then the `role="toolbar"` element carries `tabindex="-1"` so the whole toolbar drops out of the tab order; with at least one enabled item it carries `tabindex="0"`. [reka] (candidate)
- [x] `toolbar.focus.4` Given a toolbar whose configured active item is disabled and skipped, when Tab enters it, then focus lands on the next enabled item, and tabbing out then back returns to that same item. [ariakit] (candidate)
- [x] `toolbar.focus.5` Given a toolbar whose active item is removed from the DOM, when Shift+Tab re-enters the toolbar, then focus lands on a surviving item and arrow navigation continues from there. [ariakit] (candidate)
- [x] `toolbar.focus.6` Given a toolbar item that is disabled but focusable, when arrow keys traverse the toolbar, then it takes focus while reporting `data-disabled` and `aria-disabled="true"` and carrying no native `disabled` attribute; its action handler no-ops. The APG names an editor toolbar's Copy, Cut and Paste as exactly this case. [apg, base-ui]
- [ ] `toolbar.focus.7` Given a toolbar item explicitly opted out of staying focusable while disabled, then it carries the native `disabled` attribute and arrow navigation skips it; if it would have been the first item, the initial roving tab stop moves to the first item that can take focus. [base-ui] (candidate) (browser-only)
- [ ] `toolbar.focus.8` Given an enabled item that carries the focusable-when-disabled opt-out, then it still navigates normally: the opt-out only matters while the item is disabled. [base-ui] (candidate) (browser-only)
- [ ] `toolbar.focus.9` Given a disabled but focusable toolbar input holding focus, when Tab is pressed, then focus leaves the toolbar to the next element after it rather than being trapped, and Shift+Tab returns to the disabled input. [base-ui] (candidate) (browser-only)
- [ ] `toolbar.focus.10` Given a toggle group item inside a toolbar that becomes disabled at runtime, when arrow navigation reaches it, then it is skipped and never takes `tabindex="0"`. [base-ui] (candidate) (browser-only)
- [x] `toolbar.focus.11` Given a disabled toolbar control the user can infer from its neighbors (an Up button next to an enabled Down button), then it SHOULD instead use the native `disabled` attribute and leave the focus order. [apg]
- [x] `toolbar.focus.12` Given a toolbar whose embedded composites include disabled elements, then the recommended mitigation for keeping them in the focus path is to add keyboard shortcuts. [apg]
- [x] `toolbar.focus.13` Divergence: after focus has left the toolbar, re-entering it by Tab or Shift+Tab restores focus to the last-focused item, and a plain `blur` event does not reset that memory. The APG permits this. [apg, react-aria, ariakit] (decision needed)
- [ ] `toolbar.focus.14` Divergence: re-entering the toolbar always lands on the first enabled item, so the roving position resets whenever focus leaves. [melt] (decision needed)

### State

- [x] `toolbar.state.1` Given a toolbar control whose function is currently unavailable, then it exposes `aria-disabled="true"`; the APG toolbar starts Copy, Cut and Paste disabled because nothing is selected and the clipboard is empty. [apg, base-ui]
- [x] `toolbar.state.2` Given a toolbar whose state depends on selection or clipboard contents, then the `aria-disabled` values are recomputed on every relevant change: selecting text enables Copy and Cut, copying enables Paste, cutting disables Copy and Cut again. [apg]
- [ ] `toolbar.state.3` Given radios in a toolbar, or `menuitemradio` items in its menu, then exactly one has `aria-checked="true"` at any time. [apg, melt]
- [ ] `toolbar.state.4` Given a toolbar spinbutton, then every value change updates `aria-valuenow`, `aria-valuetext` and the visible text together, and applies the new setting to the controlled element in the same step. [apg]
- [x] `toolbar.state.5` Given a disabled toolbar root, when rendered, then every button and textbox inside it reports `aria-disabled="true"` and `data-disabled`, and a group inside it carries `data-disabled`. [base-ui, bits]
- [x] `toolbar.state.6` Given a disabled toolbar or a disabled group inside one, then links are the exception: a link carries neither `data-disabled` nor `aria-disabled`. [base-ui] (candidate)
- [ ] `toolbar.state.7` Given a disabled toolbar item that is a trigger for an overlay (menu, select, dialog, alert dialog or popover) or a switch, when it has focus and Enter, Space, ArrowUp or ArrowDown are pressed, or it is clicked, then no open change, value change or press change fires and no overlay appears. [base-ui] (candidate)
- [ ] `toolbar.state.8` Given a disabled toggle group nested in a toolbar, when Tab and the forward arrow key traverse the toolbar, then focus jumps straight from the item before it to the item after it and no toggle ever takes `tabindex="0"`. [base-ui] (candidate)
- [ ] `toolbar.state.9` Given a toolbar containing a toggle group and an action group, when an item in the action group is activated, then the action callback fires with that item's key and the selection callback does not; when an item in the selection group is activated, then only the selection callback fires. [react-aria] (candidate)
- [ ] `toolbar.state.10` Given toolbar toggle groups with default values, when rendered, then a multiple group has exactly its listed items on and a single group has exactly one. [melt, bits, reka]
- [ ] `toolbar.state.11` Given a toolbar toggle group whose change callback returns a replacement value, when a different item is activated, then the returned value is applied instead of the requested one. [melt] (candidate)
- [ ] `toolbar.state.12` Given a toolbar toggle group bound two ways, when the bound value is changed from outside, then `data-state` flips and `aria-pressed` or `aria-checked` follows, with no user interaction. [melt, bits]

### Forms

- [x] `toolbar.forms.1` Given toolbar items that participate in a form, then the whole form-association, constraint-validation and disabled contract recorded in `button.forms.1` through `button.forms.31` applies to each item unchanged. In particular, `aria-disabled="true"` alone suppresses nothing: a toolbar item that stays focusable while disabled MUST block its own activation in script. [html]

### RTL and i18n

- [x] `toolbar.rtl.1` Given a horizontal toolbar under an RTL locale or direction, when ArrowLeft is pressed, then focus moves to the next control and ArrowRight moves to the previous one: the horizontal pair is mirrored. [base-ui, react-aria]
- [x] `toolbar.rtl.2` Given a vertical toolbar under an RTL locale, then ArrowDown and ArrowUp keep their LTR meaning and ArrowLeft and ArrowRight stay inert: the vertical axis is not mirrored. [base-ui, react-aria]
- [ ] `toolbar.rtl.3` Given an RTL horizontal toolbar whose child group handles the cross axis itself, when ArrowUp and ArrowDown are pressed, then the child's navigation is unaffected by the mirroring. [react-aria] (candidate)
- [ ] `toolbar.rtl.4` Given a toolbar with multiple rows of controls, then the horizontal keys MAY wrap from row to row, leaving the vertical pair free for operating controls. [apg]

### SSR and hydration

- [ ] `toolbar.ssr.1` Given a toolbar rendered on the server with no active item configured (both undefined and null), before hydration and with JavaScript disabled, when Tab is pressed repeatedly, then every native item is reachable in document order, so the toolbar degrades to plain tab order rather than trapping focus. [ariakit] (candidate) (browser-only)

### Accessibility tooling

- [x] `toolbar.a11y.1` Given a toolbar using roving tabindex, then no control has a positive `tabindex` (serious). [axe]
- [x] `toolbar.a11y.2` Given toolbar buttons, then `button-name` applies at critical impact for native buttons and `aria-command-name` at serious impact for `role="button"`; toggle buttons additionally keep `aria-pressed` allowed on `role="button"` and are subject to `nested-interactive`, which forbids focusable descendants. [axe]
- [ ] `toolbar.a11y.3` Given a radio group nested in a toolbar, then `aria-toggle-field-name` applies to each radio and `aria-checked` is required on each. [axe]
- [ ] `toolbar.a11y.4` Given a menu button nested in a toolbar, then the whole menu rule set applies to its popup: `aria-required-children` on the `menu`, `aria-required-parent` on each item, and `aria-toggle-field-name` plus required `aria-checked` on each `menuitemradio`. [axe]
- [ ] `toolbar.a11y.5` Given a spinbutton nested in a toolbar, then `aria-input-field-name` applies at serious impact, and because `spinbutton` is not children-presentational its internal increase and decrease buttons do NOT trigger `nested-interactive`. [axe]
- [x] `toolbar.a11y.6` Given toolbar controls disabled with `aria-disabled="true"` so they stay focusable, then no axe rule objects, because axe's focusability model reacts only to the native `disabled` attribute, to `inert` and to hiding. A suite that wants this caught MUST assert it directly. [axe]
- [x] `toolbar.a11y.7` Given a dense icon toolbar, then the 24 by 24 CSS pixel target-size rule is the one most likely to fail, though it ships disabled and must be enabled explicitly. [axe]
- [x] `toolbar.a11y.8` Given any element with a `role` inside a toolbar, then the generic ARIA rules recorded in `button.a11y.5` through `button.a11y.12` apply unchanged (valid role, allowed and required attributes, valid attribute names and values, prohibited attributes, unique referenced ids, no focusable content under `aria-hidden`, braille equivalents). [axe]
- [x] `toolbar.a11y.9` Given a rendered toolbar, when the container is audited with axe, then there are no violations. [reka, melt]

### Notes and edge cases

- [x] `toolbar.notes.1` Given a toolbar, then the reason to use the role beyond conveying the visual grouping is reducing the number of tab stops in the keyboard interface. [apg]
- [x] `toolbar.notes.2` Given the tab-stop conventions across patterns, then toolbar belongs to the "first element" family with menubar, distinct from radio group, tabs, listbox and tree, which put the tab stop on the selected element, and from grid and treegrid, which restore the last-focused element. [apg]
- [x] `toolbar.notes.3` Given a toolbar part rendered with no toolbar root ancestor, when it mounts, then it throws a descriptive error naming the missing context and the required parent. [base-ui] (candidate)
- [ ] `toolbar.notes.4` Given an optional consumer of the toolbar context, then it reads `undefined` outside a toolbar and the toolbar's own values inside one, without throwing. [base-ui] (candidate)
- [x] `toolbar.notes.5` Given unconsumed props such as `ref`, `className`, inline `style` and `onClick` on any toolbar part, when rendered, then they land on the rendered element, the ref resolves to it, and the author's `onClick` fires. [radix, react-aria, base-ui]
- [x] `toolbar.notes.6` Given a jsdom harness, then tabbing out of a toolbar cannot be driven natively once the library has called its own focus-first or focus-last routine: both react-aria suites work around this by firing Tab key events manually and then calling `.focus()` on the target. Tab-exit tests therefore belong in browser mode. [react-aria] (candidate)
- [ ] `toolbar.notes.7` Given a toolbar item that is a composite in its own right (a combobox-select, a menu), then composing it into the toolbar must preserve both contracts: End reaches it, its own arrow keys open and drive its list, Enter selects, and the toolbar's backward key returns to the previous toolbar item afterwards. [ariakit] (candidate)
- [ ] `toolbar.notes.8` Given a toolbar item rendered as an input inside a same-origin iframe, then caret-boundary navigation behaves exactly as in the parent document. [ariakit] (candidate) (browser-only)

## Sources

- `apg-and-axe.md`: `## toolbar` (the toolbar pattern, its `toolbar_toolbar.js` test assertions, the example sources `FormatToolbar.js`, `FormatToolbarItem.js`, `FontMenuButton.js`, `FontMenuItem.js` and `SpinButton.js`, the keyboard-interface practice, the WHATWG HTML activation and forms bullets, and the axe rule and role tables).
- `ariakit-and-headlessui.md`: `## toolbar` (keyboard navigation, container focus, separator orientation, iframe caret navigation, pre-hydration tab order). Headless UI ships no toolbar.
- `radix-and-base-ui.md`: `## toolbar` (Radix `Toolbar.Root`/`Separator`/`Button`/`Link`/`ToggleGroup`/`ToggleItem`, and Base UI `Toolbar.Root`/`Button`/`Group`/`Input`/`Link`/`Separator` including its composition tests against Switch, Menu, Select, Dialog, AlertDialog, Popover, Toggle, ToggleGroup and NumberField).
- `react-aria-a.md`: `## toolbar` (react-aria-components `Toolbar` and the Spectrum v3 `Toolbar` over `ActionGroup`).
- `reka-melt-bits.md`: `## toolbar` (Reka `ToolbarRoot`, Melt toolbar with its eight fixture permutations, Bits `Toolbar`).

Zag and Ark ship no toolbar machine, so nothing here is tagged `zag` or `ark`;
Kobalte and Corvu have none either.

Melt's `## toolbar` section repeats each keyboard case across eight fixture
permutations (horizontal and vertical, links-first, buttons-first,
links-and-buttons-only). Those collapse to one bullet each: the permutations
vary the item mix, not the behavior, and the point they make is captured in
`toolbar.focus.1` and `toolbar.keyboard.7`.

## Deferred

- The APG's embedded spinbutton (`toolbar.roles.17`, `toolbar.keyboard.25`, `toolbar.pointer.7`, `toolbar.state.4`): that is the number-field component's contract, and no library tests a spinbutton inside a toolbar. Revisit when number-field lands.
- The APG's hover labels (`toolbar.pointer.8`, `toolbar.keyboard.26`): a tooltip concern with an 800ms timing of its own, and no library implements it as part of a toolbar.
- Toolbar container parts that collapse an input until typed into (`toolbar.keyboard.18`, `.19`): one library's own compound widget, not a toolbar behavior, and it needs browser mode plus real IME input.
- Multi-row toolbars (`toolbar.rtl.4`): permitted by the APG, implemented by nobody in the research, and the wrap semantics are unspecified.
- Overlay-trigger composition (`toolbar.keyboard.15`, `.16`, `toolbar.state.7`): correct to specify, but it cannot be tested until menu, select, dialog and popover exist. It stays unchecked until then rather than being dropped.
- Default class names and class-merging: a headless library emits no classes.
