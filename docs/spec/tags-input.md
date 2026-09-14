# Tags input and tag group

Two `##` sections. `tags-input` is the text field that turns typed text into
removable tags. `tag-group` is the read-side control: a labelled collection of
tags with optional selection and removal and no text input. ariakit's `Tag`
family is a tags input, so it lands in the first section.

Bullets tagged `[apg]`, `[html]` or `[axe]` come from a standard or a linter
rather than a library, so they are normative and never carry `(candidate)`.
Neither component has an APG pattern page.

## tags-input

### Roles and attributes

- [ ] `tags-input.roles-and-attributes.1` Given a tags input, then the anatomy parts are root, label, control, input, clearTrigger, item, itemPreview, itemInput, itemText and itemDeleteTrigger. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.2` Given the root, then it carries `data-invalid`, `data-readonly`, `data-disabled`, `data-focus` and `data-empty`, and the label adds `data-required`. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.3` Given the control, then it carries `data-disabled`, `data-readonly`, `data-invalid` and `data-focus`, and becomes tabbable with `tabindex="0"` when the whole widget is read-only, so a read-only tags input is still reachable. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.4` Given the text input, then it carries `data-invalid`, `aria-invalid`, `data-readonly`, `data-empty`, `autocomplete="off"`, `autocapitalize="none"` and `enterkeyhint="done"`, and shows the placeholder only while empty. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.5` Given a tag item, then it carries `data-value` and `data-disabled`; the item preview adds `data-highlighted` and is hidden while that tag is being edited; the item text carries `data-disabled` and `data-highlighted`. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.6` Given a per-tag edit input, then it is `tabindex="-1"`, hidden unless that tag is editing, and carries a translated `aria-label` naming the tag being edited. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.7` Given a per-tag delete trigger, then it is `type="button"` with `tabindex="-1"`, `data-disabled`, `aria-disabled`, `data-highlighted` and a translated `aria-label` naming the tag, so it is reached through the tag rather than through Tab. [zag] (candidate)
- [ ] `tags-input.roles-and-attributes.8` Given a remove affordance nested inside a tag, then it is `aria-hidden="true"` with `aria-label="Press Delete or Backspace to remove"` and renders a default icon; used standalone outside a tag it is a named, focusable button with no `aria-label` added, no default icon, and no duplicate button carrying the bare tag name. [ariakit] (candidate)
- [ ] `tags-input.roles-and-attributes.9` Given a standalone remove button whose name comes from a `render` element or a root `aria-labelledby`, then that name is preserved and no `aria-label` is added. [ariakit] (candidate)
- [ ] `tags-input.roles-and-attributes.10` Given a standalone remove button with an `aria-label`, then it keeps its visible text and passes axe's `aria-hidden-focus` rule with no violations. [ariakit] (candidate) (browser-only)
- [ ] `tags-input.roles-and-attributes.11` Given an explicit `aria-label` on the tag list or on the control, then each carries that `aria-label` and no `aria-labelledby`. [ariakit] (candidate) (chromium-only)
- [ ] `tags-input.roles-and-attributes.12` Given a rendered tag, then its text element is addressable as a named part, for example `data-part="item-text"` with `data-scope="tags-input"`. [zag, ark]
- [ ] `tags-input.roles-and-attributes.13` Divergence: the tags live inside a `listbox` with each tag an `option`, the text input is a sibling of the listbox rather than a descendant (the `listbox` role accepts only options as children), the listbox has no `aria-owns`, and a `group` wrapper contains both so one label names all three. [ariakit] (decision needed)
- [ ] `tags-input.roles-and-attributes.14` Divergence: the tags and the input carry no ARIA collection roles at all; tags are plain elements identified by data parts and the input keeps the accessible name. [zag, reka] (decision needed)

### Keyboard

- [ ] `tags-input.keyboard.1` Given text typed into the input, when Enter is pressed, then a tag is added with that text, the input is cleared, and focus stays in the input. [reka, melt, zag, ark]
- [ ] `tags-input.keyboard.2` Given several tags, when ArrowLeft and ArrowRight are pressed from the input, then the highlight walks across tags right to left and back; Home jumps to the first tag and End returns to the input. [reka, zag, ariakit]
- [ ] `tags-input.keyboard.3` Given the last tag is highlighted, when ArrowRight is pressed, then the highlight clears and focus returns to the input. [reka, zag]
- [ ] `tags-input.keyboard.4` Given the first tag is highlighted, when ArrowLeft is pressed again, then the highlight stays on the first tag and does not wrap to the last. [ariakit] (candidate)
- [ ] `tags-input.keyboard.5` Given a highlighted tag, when Backspace is pressed, then that tag is removed, a remove event fires with its value, the tag element leaves the DOM, and the new last tag becomes highlighted. [reka, zag]
- [ ] `tags-input.keyboard.6` Given a highlighted tag, when Delete is pressed, then the tag is removed and focus returns to the input; a further ArrowLeft highlights the new last tag. [zag, ark]
- [ ] `tags-input.keyboard.7` Given a highlighted tag, when Escape is pressed, then the highlight is cleared. [zag] (candidate)
- [ ] `tags-input.keyboard.8` Given a mid-list tag is highlighted, when Delete is pressed repeatedly, then each press deletes the current tag and highlights the next one, and after the last tag goes the highlight clears; Backspace walks backward with the same one-press-highlight, one-press-delete rhythm. [zag] (candidate)
- [ ] `tags-input.keyboard.9` Given a highlighted tag, when Enter is pressed, then that tag's edit input takes focus; typing a new value and pressing Enter commits it, the editor hides and focus returns to the main input. [zag, ark]
- [ ] `tags-input.keyboard.10` Given a tag's editor is open, when its content is cleared and Enter pressed, then the tag is deleted and focus returns to the main input. [zag] (candidate)
- [ ] `tags-input.keyboard.11` Given no tags remain, when Enter is pressed on the empty input, then the widget does not fall into an editing state and adding a new tag afterwards still works. [zag] (candidate)
- [ ] `tags-input.keyboard.12` Given `addOnTab: true` and a typed value, when Tab is pressed, then the value becomes a new tag. [reka] (candidate)
- [ ] `tags-input.keyboard.13` Given a focused tag, when printable characters are typed, then focus moves to the input, the characters land there, and returning with End re-selects the typed text. [ariakit] (candidate)
- [ ] `tags-input.keyboard.14` Given a focused tag, when Delete is pressed, then the tag is removed and focus moves to the NEXT tag; when Backspace is pressed, the tag is removed and focus moves to the PREVIOUS tag. [ariakit] (candidate)
- [ ] `tags-input.keyboard.15` Given a disabled tag next to a removable one, when Backspace is pressed twice, then the removable tag is removed with a remove event carrying its value, and further Backspace presses never remove the disabled tag even when it is the only one left. [reka] (candidate)
- [ ] `tags-input.keyboard.16` Given tag edits, when Ctrl+Z and Ctrl+Y are pressed, then removals and typed insertions are undone and redone step by step, the input value is restored alongside the tag list, and redo after a new change is a no-op. [ariakit] (candidate)
- [ ] `tags-input.keyboard.17` Given the input, then its key map wires ArrowDown, ArrowLeft, ArrowRight, Escape, Backspace, Delete and Enter, with Enter branching on whether a tag is highlighted, read from `aria-activedescendant` on the input. [zag] (candidate)
- [ ] `tags-input.keyboard.18` Divergence: given an empty input, when Backspace is pressed once, then the last tag is highlighted rather than deleted, and a second Backspace removes it. [zag, reka] (decision needed)
- [ ] `tags-input.keyboard.19` Divergence: given an empty input, when Backspace is pressed once, then the last tag is removed immediately and focus stays in the input. [ariakit] (decision needed)

### Pointer

- [ ] `tags-input.pointer.1` Given a tag's close button, when it is clicked, then the tag is removed and focus returns to the input, after which ArrowLeft highlights the new last tag. [zag, ariakit]
- [ ] `tags-input.pointer.2` Given a tag, when it is double-clicked, then its edit input takes focus and a typed replacement commits on Enter. [zag, ark]
- [ ] `tags-input.pointer.3` Given a highlighted tag, when the control is clicked, then the highlight is cleared so a following Backspace does not delete a tag. [zag] (candidate)
- [ ] `tags-input.pointer.4` Given several tags, when the clear trigger is clicked, then all tags are removed and focus returns to the input. [zag, ark]
- [ ] `tags-input.pointer.5` Given a tag, when it is clicked, then it takes focus. [ariakit] (candidate)
- [ ] `tags-input.pointer.6` Given the control's padding is clicked, then the input takes focus, including when the tag list is `display: contents` and generates no box of its own. [ariakit] (candidate) (browser-only)
- [ ] `tags-input.pointer.7` Given non-focusable content inside a `display: contents` wrapper, when it is clicked, then focus moves to the input and the page stays responsive so a new tag can still be typed, rather than hanging in the closest-focusable walk. [ariakit] (candidate) (browser-only)
- [ ] `tags-input.pointer.8` Given `addOnBlur: true` and a typed value, when the input blurs, then the value becomes a new tag. [reka] (candidate)
- [ ] `tags-input.pointer.9` Given clipboard text with no delimiter, when it is pasted into the input or with a tag focused, then it lands in the input as text and no tag is created. [ariakit, zag]
- [ ] `tags-input.pointer.10` Given clipboard text containing delimiters, when it is pasted, then it splits into tags and the input clears with focus in it: `"abc def ghi"` becomes three tags, `"abc def, ghi"` becomes `["abc def","ghi"]`, `"abc def, ghi; jkl"` becomes `["abc def, ghi","jkl"]`, and a trailing newline is dropped. The same holds with a tag focused rather than the input. [ariakit] (candidate) (browser-only)
- [ ] `tags-input.pointer.11` Given `addOnPaste: true` and a delimiter, when `"Github, Jenkins"` or `"tag1,tag2,tag3"` is pasted, then one tag per delimited value is created, and this works with no existing tags. [zag, reka]
- [ ] `tags-input.pointer.12` Given `addOnPaste: false`, when text is pasted, then it lands in the input as text and only Enter turns it into a tag; this holds on a second paste after clearing. [zag] (candidate)
- [ ] `tags-input.pointer.13` Given `addOnPaste: true` with duplicates disallowed, when `"React, React"` is pasted, then the paste is deduplicated to one tag; with duplicates allowed both pasted values are kept. [zag] (candidate)

### Focus management

- [ ] `tags-input.focus-management.1` Given a highlighted tag, when a click lands outside or Tab moves focus out, then the highlight is cleared. [zag] (candidate)
- [ ] `tags-input.focus-management.2` Given a tag is added, when the DOM settles, then the input is still the active element and its value is the empty string. [reka, melt, zag]
- [ ] `tags-input.focus-management.3` Given a tags input inside a field wrapper, when the field label is clicked, then the visible text input takes focus rather than the hidden form input. [ark] (candidate)

### State

- [ ] `tags-input.state.1` Given a `defaultTags` or default value array, when rendered, then one tag element per entry exists containing its text. [reka, melt]
- [ ] `tags-input.state.2` Given two tags added in sequence, then an add event fires per tag with that tag's value in order. [reka] (candidate)
- [ ] `tags-input.state.3` Given duplicates are disallowed, when the same tag text is submitted again, then no second tag is created and the input keeps its text so the user can see the rejection; with duplicates allowed every instance is kept. [melt, zag]
- [ ] `tags-input.state.4` Given duplicates are disallowed, when a tag is edited into the text of an existing tag, then no duplicate is created and both original values survive; with duplicates allowed the edit creates a duplicate and the edited value leaves its old slot. [zag] (candidate)
- [ ] `tags-input.state.5` Given `trim: true`, when a tag is typed with trailing spaces and submitted, then the input clears and the trimmed text becomes the tag. [melt] (candidate)
- [ ] `tags-input.state.6` Given uniqueness with either `trim: true` or a custom add function that trims, when text whose trimmed form duplicates an existing tag is submitted, then the input keeps its value and no tag is added; trimming happens before the uniqueness check. [melt] (candidate)
- [ ] `tags-input.state.7` Given an `allowed` list, when a value outside it is submitted, then the input keeps its text and no tag is added; the allowed value clears the input and becomes a tag. This holds with `trim: true` and with a custom trimming add function. [melt] (candidate)

### Forms

- [ ] `tags-input.forms.1` Given a hidden form input, then it is `type="text"` and `hidden`, carrying the joined tag list for submission. [zag] (candidate)
- [ ] `tags-input.forms.2` Given a form containing a tags input, when tags are added, removed or cleared after mount and Submit is clicked, then the submitted value reflects exactly the current tag list. [zag] (candidate)
- [ ] `tags-input.forms.3` Given a tags input inside a field wrapper, then `required`, `disabled` and `readOnly` reach the hidden input, helper text renders, and error text appears only when the field is invalid. [ark] (candidate)

### RTL and i18n

- [ ] `tags-input.rtl-and-i18n.1` Given a delimiter and an IME composition in progress, when the composed text contains the delimiter, then no tag is created and the input keeps the raw characters; once composition ends the deferred value is processed and the tag is created. [reka, ariakit]

### Accessibility tooling

- [ ] `tags-input.accessibility-tooling.1` Given a default tags input, when axe runs, then there are no violations. [reka, melt]
- [ ] `tags-input.accessibility-tooling.2` Given the ark tags-input axe case, then it is skipped, so ark has no passing automated a11y check for this component and its tags cannot be cited as axe evidence. [ark] (candidate)

### Notes and edge cases

- [ ] `tags-input.notes-and-edge-cases.1` Given a single-character `delimiter` such as `,`, when `tag1,` is typed, then the delimiter alone creates the tag `tag1`; given a regex delimiter such as `/[ ,;]+/`, each match creates a tag, so `tag1,`, `tag2 `, `tag3;` yields three tags and `"tag1, tag2;tag3 tag4"` pasted yields four. [reka] (candidate)
- [ ] `tags-input.notes-and-edge-cases.2` Given a string delimiter containing regex metacharacters, then it splits literally: `.` splits `"one.two."` into two tags, `+` does not throw even though it is not a valid regex on its own, and `|` does not hang even though it matches the empty string. [ariakit] (candidate)
- [ ] `tags-input.notes-and-edge-cases.3` Given object values with a `displayValue` formatter, then each tag renders the formatted string, for example `Person: Durward Reynolds`. [reka] (candidate)
- [ ] `tags-input.notes-and-edge-cases.4` Given a `convertValue` function turning typed text into an object, when a tag is submitted, then the bound array holds the converted object; given object values with `displayValue` but no `convertValue`, the error handler is called exactly once with "You must provide a `convertValue` function when using objects as values." [reka] (candidate)
- [ ] `tags-input.notes-and-edge-cases.5` Given a tag field combined with a combobox, when a suggestion is accepted with Enter, then it becomes a tag and the combobox value resets to empty, the suggestion list resets, and the added tag's option carries `data-active-item` and `aria-selected="true"` after arrow navigation; removing a tag from the list leaves the typed value intact. [ariakit] (candidate)
- [ ] `tags-input.notes-and-edge-cases.6` Given a tag combobox with inline autocomplete, when a query is typed, then the input holds the completed value with the completion selected; after selecting and deselecting a tag, retyping the same query leaves no text selected, the option keeps `data-active-item`, `aria-selected` follows the tag's presence, and arrowing through other options updates the input value without re-selecting text. [ariakit] (candidate)
- [ ] `tags-input.notes-and-edge-cases.7` Given a conformance harness for tags input, then it needs per-tag locators keyed by value (tag, close button, editor), a clipboard-backed paste helper, an add helper that asserts the input cleared and kept focus, an edit helper that asserts focus returned to the main input, a `deleteLastTag` that presses Backspace twice, and highlight assertions on `data-highlighted`. Paste tests need real `clipboard-read` and `clipboard-write` permissions. [zag] (candidate)
- [ ] `tags-input.notes-and-edge-cases.8` Given the reka suite, then it stubs `window.getComputedStyle` to return an empty object, so the component's own style reads are disabled in its default and disabled-tag tests; a port of those tests MUST not depend on measured geometry. [reka] (candidate)

## tag-group

### Roles and attributes

- [ ] `tag-group.roles-and-attributes.1` Given a tag group with items, then the container is `role="grid"`, each tag is a `row`, and there is exactly one `gridcell` per row. [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.2` Given a tag row, then it has `tabindex="0"` before the roving tabindex settles, and the group's `aria-label` or `aria-labelledby` lands on the grid element while an item's own `aria-label` lands on its gridcell. [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.3` Given a tag group with a label and description plus error-message slots, then the grid's `aria-labelledby` points at the label and its `aria-describedby` resolves to the description followed by the error text. [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.4` Given an action affordance such as `actionLabel="Clear"` with an action handler, then the action wrapper is `role="group"` with `aria-label="Actions"` and an `aria-labelledby` of "<tagGroupId> <actionGroupId>". [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.5` Given a removal handler on the group, then each row carries `data-allows-removing="true"`, the matching render prop is true, and the remove button gets `aria-label="Remove"` automatically. [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.6` Given `selectionMode="multiple"` with disabled keys, then the disabled row carries `aria-disabled="true"` and the disabled render-prop class. [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.7` Given a tag list with no items and an empty-state renderer, then the list carries `data-empty="true"`, shows the empty content, and its role changes from `grid` to `group`. [react-aria] (candidate)
- [ ] `tag-group.roles-and-attributes.8` Given data attributes on the group and on each item, then the grid and each row carry their own values, and unconsumed props such as an icon or an unsafe class name never leak into the DOM. [react-aria] (candidate)

### Keyboard

- [ ] `tag-group.keyboard.1` Given a horizontal tag group in an LTR locale with focus on the first tag, when ArrowRight is pressed, then focus moves to the next tag; ArrowLeft moves back and wraps from the first to the last. ArrowDown and ArrowUp move forward and backward the same way. [react-aria] (candidate)
- [ ] `tag-group.keyboard.2` Given a horizontal tag group in an RTL locale such as `ar-AE`, when ArrowLeft is pressed, then focus moves FORWARD and ArrowRight moves back, mirroring the LTR mapping; ArrowUp and ArrowDown are NOT mirrored, so ArrowUp from the first tag still wraps to the last. [react-aria] (candidate)
- [ ] `tag-group.keyboard.3` Given four tags that all render with `tabindex="0"`, when Tab focuses the first, then that tag keeps `tabindex="0"` and the rest become `-1` (roving tabindex), and ArrowRight, ArrowLeft, End, Home, PageDown and PageUp each move focus to the expected tag. [react-aria] (candidate)
- [ ] `tag-group.keyboard.4` Given a removal handler and focus on a tag, when Delete or Backspace is pressed, then the handler fires once with a set containing that tag's key; Space does NOT remove. [react-aria] (candidate)
- [ ] `tag-group.keyboard.5` Given a disabled tag in the middle of the list, when ArrowRight is pressed from the tag before it, then focus skips the disabled tag. [react-aria] (candidate)
- [ ] `tag-group.keyboard.6` Given every tag disabled with a removal handler, when Backspace is pressed on a focused tag, then the handler never fires, and Shift+Tab from a later button lands focus on the grid itself. [react-aria] (candidate)
- [ ] `tag-group.keyboard.7` Given remove buttons inside the tags, when Tab is pressed from a tag, then focus goes to that row's remove button, Space or Delete there removes the tag, and Shift+Tab returns focus to the tag. [react-aria] (candidate)
- [ ] `tag-group.keyboard.8` Given multiple selection, when Space is pressed on the focused tag, then the selection change fires; ArrowRight then Space adds the next tag to the selection. [react-aria] (candidate)
- [ ] `tag-group.keyboard.9` Given a multiple-selection group with a selected set, when Backspace is pressed, then the removal handler receives the WHOLE selected set rather than only the focused tag. [react-aria] (candidate)
- [ ] `tag-group.keyboard.10` Given a list bound to mutable data whose removal handler deletes the key, when the remove key is held for three keydown events, then all three tags are removed in list order because focus shifts to the next tag after each repeat. [react-aria] (candidate)
- [ ] `tag-group.keyboard.11` Given an action handler with `selectionMode="none"`, when a tag is activated by click or Enter, then the action fires once per activation; an action set on the individual tag fires at item level. [react-aria] (candidate)
- [ ] `tag-group.keyboard.12` Given a custom action button in the group, when it is reached by Tab and Enter is pressed, then the action fires once with no arguments. [react-aria] (candidate)

### Pointer

- [ ] `tag-group.pointer.1` Given a tag with a remove button, when the row itself is clicked, then the removal handler does not fire; when the remove button is clicked, it fires once with only that tag's key, even while other tags are selected. [react-aria] (candidate)
- [ ] `tag-group.pointer.2` Given a disabled tag, then its remove button carries `aria-label="Remove"` plus the native `disabled` attribute and clicking it never fires the removal handler. [react-aria] (candidate)
- [ ] `tag-group.pointer.3` Given `selectionMode="multiple"`, when a row is clicked twice, then `aria-selected` and the selected class turn on and then off. [react-aria] (candidate)
- [ ] `tag-group.pointer.4` Given `selectionMode="single"` with no `shouldSelectOnPressUp` or with it false, then selection fires on press down and not again on release; with `shouldSelectOnPressUp: true` it fires only on release. [react-aria] (candidate)
- [ ] `tag-group.pointer.5` Given an interactive tag (selection enabled, an action, or an href), when it is hovered and unhovered, then `data-hovered` and the hover class toggle, hover-start and hover-end fire once each and hover-change fires twice; a tag with none of those is not interactive and produces no hover state or callbacks. [react-aria] (candidate)
- [ ] `tag-group.pointer.6` Given a selectable tag, when the primary button goes down and up, then `data-pressed="true"` appears and clears; a non-interactive tag shows no pressed state. [react-aria] (candidate)
- [ ] `tag-group.pointer.7` Given press callbacks on a tag activated by mouse or by keyboard, then press-start, press-end, press and click each fire once for either input type. [react-aria] (candidate)
- [ ] `tag-group.pointer.8` Given an action handler with `selectionBehavior="replace"` in single or multiple selection mode, when a tag is double-clicked the action fires, a single click selects instead without firing the action, and Enter fires the action without changing the selection. [react-aria] (candidate)

### Focus management

- [ ] `tag-group.focus-management.1` Given buttons around the group, when Tab enters it, then the first tag is focused and one more Tab leaves the whole group; Shift+Tab from the following button enters the group on its LAST tag. [react-aria] (candidate)
- [ ] `tag-group.focus-management.2` Given focus moved within the group and then out, when Shift+Tab returns, then focus lands on the tag that was focused before, so the group remembers its last focused item. [react-aria] (candidate)
- [ ] `tag-group.focus-management.3` Given the focused tag is removed by Delete or Backspace, then the removal handler fires with that id and focus lands on the next tag, after which arrow navigation still works. [react-aria] (candidate)
- [ ] `tag-group.focus-management.4` Given the last remaining tag is removed, then after the removal settles there are no rows left and focus moves to the grid container. [react-aria] (candidate)
- [ ] `tag-group.focus-management.5` Given the focused tag is removed and its neighbors are disabled, then focus falls back to the grid rather than repeatedly trying to focus a disabled neighbor. [react-aria] (candidate)
- [ ] `tag-group.focus-management.6` Given items inserted at the head of the list, when the first tag is removed repeatedly, then items are removed newest first with list order preserved, and after the last removal focus moves to the group element. [react-aria] (candidate)
- [ ] `tag-group.focus-management.7` Given focus and blur callbacks on a tag, when Tab focuses it and an arrow key moves on, then it gains `data-focus-visible="true"` and the focus class, loses them on move, and focus, blur and focus-change fire as focus passes through. [react-aria] (candidate)
- [ ] `tag-group.focus-management.8` Given an empty group whose empty state contains a link, when Tab is pressed, then focus lands on that link. [react-aria] (candidate)
- [ ] `tag-group.focus-management.9` Given a group with a show-all button and a custom action, when Tab is pressed repeatedly, then focus goes tag, show-all, action; Enter on the action fires it once; Shift+Tab walks back through the show-all button to the tag; and a mouse press on a tag does not fire the action. [react-aria] (candidate)

### State

- [ ] `tag-group.state.1` Given a removal handler on the group and a tag rendered from the group's context, when Delete fires on the row, then the handler is called once, so the group supplies removal context to its tags rather than each tag owning it. [react-aria] (candidate)
- [ ] `tag-group.state.2` Given refs and custom render functions on the group, list and tag, then each ref resolves to an element and each level renders the custom element. [react-aria] (candidate)

### Dismissal and layering

- [ ] `tag-group.dismissal-and-layering.1` Given a tag wrapped in a tooltip trigger, when the tag is hovered and the delay elapses, then a tooltip with the trigger's content appears. [react-aria] (candidate)

### Positioning

- [ ] `tag-group.positioning.1` Given `maxRows={2}` with seven tags in a box that fits three, then only three gridcells show and a button reads "Show all (7)"; clicking it expands to all seven with the label "Show less", and clicking again collapses back to three. [react-aria] (candidate) (browser-only)
- [ ] `tag-group.positioning.2` Given `maxRows={2}` with two tags that fit, then both show and no show-all button renders. [react-aria] (candidate) (browser-only)

### SSR and hydration

- [ ] `tag-group.ssr-and-hydration.1` Given a tag group with static items, when server-rendered and hydrated, then no errors occur. [react-aria] (candidate)
- [ ] `tag-group.ssr-and-hydration.2` Given a strict-mode group whose list conditionally includes a fourth tag, when server-rendered, then the HTML contains the three visible rows in order with the grid role; after hydration the same three rows remain and adding the fourth inserts it in its correct position rather than appending. [react-aria] (candidate)

### Notes and edge cases

- [ ] `tag-group.notes-and-edge-cases.1` Given an empty tag group, then the localized empty text (for example "None") is shown once the tabbable-child observer settles. [react-aria] (candidate)
- [ ] `tag-group.notes-and-edge-cases.2` Given items with hrefs, then rows are not anchor elements but carry `data-href`, and clicking a row produces a native click whose target is a real anchor with the expected href. [react-aria] (candidate)
- [ ] `tag-group.notes-and-edge-cases.3` Given tags with hrefs under `selectionMode` none, single or multiple, when a link tag is activated by mouse or Enter, then the native click fires and the selection does not change; activating a non-link tag selects it instead where selection is enabled. [react-aria] (candidate)
- [ ] `tag-group.notes-and-edge-cases.4` Given a router provider with a `useHref` that prefixes a base path, when a tag with an href and router options is activated, then `data-href` is the prefixed path and navigation is called with the original href plus those options. [react-aria] (candidate)

## Sources

- `docs/research/reka-melt-bits.md`, section `tags-input` (reka `TagsInput.test.ts`, melt `TagsInput.spec.ts`; bits ships no tags input).
- `docs/research/zag-and-ark.md`, sections `tags-input` and `e2e/models/tags-input.model.ts` (zag anatomy, connect and Playwright e2e, ark React, Solid and Vue tests).
- `docs/research/ariakit-and-headlessui.md`, section `tag` (ariakit `Tag`, `TagList`, `TagInput`, `TagRemove` sandbox suites including the 6294, 6311, 6330 and 6333 regression sandboxes; headlessui ships no tag component).
- `docs/research/react-aria-b.md`, section `tag-group` (`useTagGroup`, Spectrum v3 TagGroup, react-aria-components TagGroup, TagList and Tag).
- No APG pattern, axe rule or HTML element corresponds to either component. The only normative material nearby is the `listbox` and `grid` role guidance, which lives in the listbox and table spec files.

## Deferred

- Tag collection semantics. `tags-input.roles-and-attributes.13` and `.14` are the deepest split in this group: ariakit models tags as `option` elements in a `listbox` sibling to the input, react-aria models them as rows in a `grid`, zag and reka use no collection role at all. Each choice drags in different keyboard expectations, so this decision comes before the keyboard bullets can be finalized.
- Whether `tag-group` is a separate component or a rendering mode of `tags-input` with the input removed. Only react-aria ships it standalone, so the whole section is single-source. Merging would let the roving-tabindex and removal-focus bullets be shared.
- Selection. Only react-aria's tag group supports selecting tags; the tags inputs treat a "highlighted" tag as transient keyboard state, not selection. No cross-library contract to write yet.
- Undo and redo (`tags-input.keyboard.16`). ariakit is alone in keeping an edit history. It is a real feature with real tests, but nothing to reconcile it against.
- `maxRows` overflow with a show-all toggle (`tag-group.positioning.1` and `.2`). It needs measured layout, so it belongs in a browser-mode suite and possibly not in the conformance suite at all.
- Tag combobox integration (`tags-input.notes-and-edge-cases.5` and `.6`). This is the intersection of two components; it should be specified once the combobox spec settles, and its bullets may move there.
