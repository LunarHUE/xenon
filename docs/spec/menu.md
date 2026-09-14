# menu

Covers the menu pattern in all its shapes: a menu button plus its menu
(dropdown menu), submenus, checkbox and radio items, groups and labels, a menu
nested in a dialog, and a combobox nested in a menu. Context menus live in
`context-menu.md`, menubars in `menubar.md`, and site navigation menus in
`navigation-menu.md`.

## menu

### Roles and attributes

- [ ] `menu.roles.1` Given the element that opens a menu, then it MUST have `role="button"` (a native `button` satisfies this). [apg, base-ui, zag, bits]
- [ ] `menu.roles.2` Given a menu button, then it MUST have `aria-haspopup` set to `menu` or `true`. [apg, radix, base-ui, react-aria, zag]
- [ ] `menu.roles.3` Given a menu button, then `aria-expanded` MUST read `"true"` exactly while the menu is displayed and `"false"` while it is hidden. [apg, radix, base-ui, react-aria, zag, ark, reka, bits]
- [ ] `menu.roles.4` Given the element containing the menu items, then it MUST have `role="menu"`. [apg, radix, base-ui, react-aria, zag, ark, reka, melt, bits]
- [ ] `menu.roles.5` Given a menu button, then it MAY have `aria-controls` referring to the element with `role="menu"`; APG marks this optional. [apg, radix, react-aria, zag]
- [ ] `menu.roles.6` Given an open menu, then the trigger's `aria-controls` MUST equal the content element's `id` and `document.getElementById` on that id MUST resolve to the content; while closed the attribute MUST be absent rather than pointing at a non-existent id. [radix, react-aria, zag]
- [ ] `menu.roles.7` Given a `role="menu"` element, then it MUST have either `aria-labelledby` referring to the menuitem or button that controls its display, or a label from `aria-label`. [apg, ariakit, react-aria, zag, reka]
- [ ] `menu.roles.8` Given a menu whose disclosure element is replaced by a different element, then the stale `aria-labelledby` MUST be updated rather than left pointing at a gone id. [ariakit] (candidate)
- [ ] `menu.roles.9` Given a horizontally oriented menu, then it MUST have `aria-orientation="horizontal"`; `menu` defaults to vertical, so a vertical menu MUST NOT carry the attribute at all. [apg, base-ui]
- [ ] `menu.roles.10` Given menu items, then each MUST be a child element of the containing `menu` and MUST have one of the roles `menuitem`, `menuitemcheckbox` or `menuitemradio`. [apg, axe, radix, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `menu.roles.11` Given wrapper elements between the menu and its items (`ul`/`li` markup, layout `div`s), then the wrappers MUST carry `role="none"` and the item role MUST sit on the interactive element. [apg, headlessui]
- [ ] `menu.roles.12` Given a checked `menuitemcheckbox` or `menuitemradio`, then `aria-checked` MUST be `"true"`, and `"false"` when unchecked. [apg, axe, radix, base-ui, react-aria, zag, ark, bits]
- [ ] `menu.roles.13` Given `role="menuitemcheckbox"` or `role="menuitemradio"`, then `aria-checked` is a REQUIRED attribute and omitting it is a critical failure. [axe]
- [ ] `menu.roles.14` Given a disabled menu item, then `aria-disabled` MUST be `"true"` and the native `disabled` attribute MUST NOT be used on the trigger or item, so it stays focusable. [apg, ariakit, base-ui, react-aria, zag, ark]
- [ ] `menu.roles.15` Given groups of menu items, then they MAY be divided with `role="separator"`, and this SHOULD be used when a menu contains a set of `menuitemradio` items. [apg, radix, react-aria, zag, reka, melt, bits]
- [ ] `menu.roles.16` Given a separator, then it SHOULD have `aria-orientation` consistent with its visual orientation; menu separators are `horizontal`. [apg, radix, zag]
- [ ] `menu.roles.17` Given a group of related items, then the grouping element MUST have `role="group"`. [radix, base-ui, react-aria, zag, ark, reka, bits]
- [ ] `menu.roles.18` Given a group with a label element, then the group's `aria-labelledby` MUST equal the label's id, whether the id was generated or supplied by the author. [base-ui, react-aria, zag, bits]
- [ ] `menu.roles.19` Given a group whose label children swap (old label unmounting while a new one mounts), then `aria-labelledby` MUST end up pointing at the surviving label: the unmounting label's cleanup MUST NOT clear the newer registration. [base-ui] (candidate)
- [ ] `menu.roles.20` Given a group label element, then it MUST NOT expose a role of its own, and it is hidden from the accessibility tree with `aria-hidden="true"` by default (overridable). [base-ui, bits]
- [ ] `menu.roles.21` Given focus management inside a menu, then exactly one of two approaches MUST be used: the menu container carries `tabindex` of `-1` or `0` plus `aria-activedescendant` naming the focused item, OR each item carries `tabindex="-1"` with a roving tabindex. [apg]
- [ ] `menu.roles.22` Given the roving-tabindex approach, then exactly one item MUST have `tabindex="0"` and every other item `tabindex="-1"`, and no item MUST ever have a positive `tabindex`. [apg, axe, base-ui, react-aria]
- [ ] `menu.roles.23` Given the `aria-activedescendant` approach, then the `menu` element MUST carry `tabindex` (`-1` in the APG example, `0` in Zag) and MUST already name the first item before the menu is opened; on close `aria-activedescendant` MUST be set to the empty string rather than removed. [apg, zag]
- [ ] `menu.roles.24` Given `role="menuitemcheckbox"` or `role="menuitemradio"`, then all descendants are forced presentational, so a visual checkmark glyph MUST carry `aria-hidden="true"` and the item MUST NOT contain a focusable widget-role descendant; plain `role="menuitem"` has no such restriction. [apg, axe]
- [ ] `menu.roles.25` Given a decorative expand-indicator glyph on a parent menuitem, then it MUST carry `aria-hidden="true"`. [apg]
- [ ] `menu.roles.26` Given a parent (submenu) menuitem, then it MUST have `aria-haspopup` of `menu` or `true`, `aria-expanded="false"` while its child menu is hidden and `"true"` while it is visible. [apg, ariakit, radix, base-ui, react-aria, zag, reka]
- [ ] `menu.roles.27` Given a submenu's `menu` element, then it MUST be contained inside the same `menu` element as its parent menuitem and MUST be the sibling immediately following that parent menuitem. [apg]
- [ ] `menu.roles.28` Given a portaled submenu, then the ownership link MUST be published some other way: Base UI emits a `span[aria-owns]` with `role="group"` inside the parent menu pointing at the submenu's portal container, and the root menu's own portal ownership span carries no role at all. [base-ui] (candidate)
- [ ] `menu.roles.29` Given `aria-owns` pulling in elements that are not DOM children, then those elements read after the DOM children in reference order, and the focus-management script MUST make the visual focus order match that reading order. [apg]
- [ ] `menu.roles.30` Given a disabled submenu trigger, then it MUST carry both `aria-disabled="true"` and a disabled style hook. [base-ui, react-aria]
- [ ] `menu.roles.31` Given a virtualized menu, then each rendered item MUST carry a 1-based `aria-posinset` and an `aria-setsize` equal to the full collection size, counted globally across groups rather than restarting per group. [react-aria] (candidate)
- [ ] `menu.roles.32` Given a menu item with a description and a keyboard-shortcut child, then the item's `aria-labelledby` MUST name the label element and `aria-describedby` MUST name the description and shortcut elements in that order. [react-aria] (candidate)
- [ ] `menu.roles.33` Given the trigger's own DOM shape, then it MUST get `type="button"` when it renders a native button and MUST NOT have `type` forced when it renders something else; an explicitly supplied `type` MUST NOT be overwritten. [base-ui, headlessui, zag]
- [ ] `menu.roles.34` Given a non-native element used as the trigger, then it MUST get `role="button"`; a native `button` MUST NOT get a redundant `role`. [base-ui]
- [ ] `menu.roles.35` Given a menu whose popup is not composite (it contains a combobox or arbitrary form content), then the popup takes `role="dialog"` and the trigger's `aria-haspopup` MUST stay `dialog` rather than flipping to `menu`. [ariakit, zag]
- [ ] `menu.roles.36` Given a menu item that itself opens a dialog or sub-dialog rather than a submenu, then that item MUST carry `aria-haspopup="dialog"`. [react-aria]
- [ ] `menu.roles.37` Given items rendered as links, then each item MUST keep its `href` while carrying the menu item role, and the role MUST reflect the selection mode (`menuitem` for none, `menuitemradio` for single, `menuitemcheckbox` for multiple). [react-aria, base-ui]
- [ ] `menu.roles.38` Given an active (highlighted) item, then it MUST expose a highlight style hook; reached from the keyboard it also exposes a focus-visible hook, which is absent when it was reached by hover. [ariakit, base-ui, zag, reka, bits, melt]
- [ ] `menu.roles.39` Given a menu popup mid-positioning pass, then it MUST be marked as still-placing and the marker MUST be removed only when the pass finishes. [ariakit] (candidate)
- [ ] `menu.roles.40` Given a menu with multiple triggers, then `aria-expanded="true"` and the current-trigger marker MUST be scoped to the trigger that opened the menu and false/absent on the rest. [zag] (candidate)
- [ ] `menu.roles.41` Given a lazily mounted menu, then the trigger MUST carry no `aria-controls` until the content exists. [ark] (candidate)
- [ ] `menu.roles.42` Given `role="menuitem"`, then it MUST have an accessible name from visible text, `aria-label`, `aria-labelledby` or `title` (serious impact); `menuitemcheckbox` and `menuitemradio` MUST likewise be named with no mismatch against a wrapping `label`. [axe]
- [ ] `menu.roles.43` Given `role="menu"`, then it MUST own at least one of `group`, `menuitemradio`, `menuitem`, `menuitemcheckbox`, `menu` or `separator`; an entirely empty menu is reported as incomplete rather than a failure. [axe]
- [ ] `menu.roles.44` Given `role="menuitem"`, `role="menuitemcheckbox"` or `role="menuitemradio"`, then it MUST be contained by `menu`, `menubar` or `group` (critical impact). [axe]
- [ ] `menu.roles.45` Given `role="menu"` in the axe role table, then it is composite, its role-specific allowed attributes are `aria-activedescendant`, `aria-expanded` and `aria-orientation`, and no accessible name is required; `menuitem` allows `aria-posinset`, `aria-setsize` and `aria-expanded` and requires a name from content. [axe]
- [ ] `menu.roles.46` Given `li` wrappers marked `role="none"`, then they MUST NOT carry `aria-label` or `aria-labelledby`, because `none` prohibits both. [axe]

### Keyboard

- [ ] `menu.keyboard.1` Given focus on a menu button, when Enter or Space is pressed, then the menu MUST open and focus MUST move to the first menu item. [apg, ariakit, headlessui, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `menu.keyboard.2` Given focus on a menu button, when ArrowDown is pressed, then the menu opens with the first item focused; when ArrowUp is pressed, it opens with the last item focused. APG marks both optional; every library implements them. [apg, ariakit, headlessui, base-ui, react-aria, zag, melt, bits]
- [ ] `menu.keyboard.3` Given a disabled menu button, when Enter, Space, ArrowDown or ArrowUp is pressed, then the menu MUST NOT open. [ariakit, headlessui, base-ui, react-aria]
- [ ] `menu.keyboard.4` Given a menu with no items at all, when it opens by any key, then there MUST be no active item and nothing MUST throw. [headlessui] (candidate)
- [ ] `menu.keyboard.5` Given focus in an open menu, when ArrowDown is pressed, then focus MUST move to the next item, and ArrowUp to the previous item. [apg, ariakit, headlessui, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `menu.keyboard.6` Given focus in an open menu, when Home is pressed, then focus MUST move to the first item and End to the last, from any starting position. [apg, ariakit, headlessui, base-ui, react-aria, zag]
- [ ] `menu.keyboard.7` Given focus in an open menu, when PageUp or PageDown is pressed, then they MUST behave as Home and End do. [headlessui] (candidate)
- [ ] `menu.keyboard.8` Divergence: arrow keys wrap at the ends by default — ArrowDown on the last item goes to the first, ArrowUp on the first goes to the last. [apg, base-ui] (decision needed)
- [ ] `menu.keyboard.9` Divergence: arrow keys clamp at the ends unless a `loop` option is enabled, and with `loop` on they wrap. [ariakit, react-aria, reka, melt, bits] (decision needed)
- [ ] `menu.keyboard.10` Given a menu where only one item is not disabled, when ArrowUp or ArrowDown is pressed, then nothing MUST move. [headlessui] (candidate)
- [ ] `menu.keyboard.11` Given focus on a leaf menuitem, when Enter is pressed, then the item MUST activate and the menu MUST close, with focus returning to the menu button. [apg, ariakit, headlessui, base-ui, react-aria, zag, reka, bits]
- [ ] `menu.keyboard.12` Given focus on a leaf menuitem, when Space is pressed, then the item MAY activate and close the menu; APG marks this optional and every library implements it. [apg, ariakit, headlessui, react-aria, zag]
- [ ] `menu.keyboard.13` Given an open menu with no active item, when Enter or Space is pressed, then the menu MUST just close without activating anything. [headlessui] (candidate)
- [ ] `menu.keyboard.14` Given a keyboard activation of an item, then the synthesized click MUST be distinguishable from a pointer click (Base UI sees `detail === 0` and classifies it as an instant activation, while a drag-release click carries `detail === 1`). [base-ui] (candidate)
- [ ] `menu.keyboard.15` Given focus on a `menuitemcheckbox`, when Enter or Space is pressed, then its checked state MUST toggle, and pressing again MUST toggle it back. APG marks the state change optional. [apg, ariakit, base-ui, react-aria, zag, melt, bits]
- [ ] `menu.keyboard.16` Given focus on an unchecked `menuitemradio`, when Enter or Space is pressed, then that item MUST become checked and any other checked item in the same group MUST be unchecked. [apg, ariakit, base-ui, react-aria, zag]
- [ ] `menu.keyboard.17` Given focus in a menu, when a printable character is typed, then focus MAY move to the next item in that menu whose label begins with that character. APG marks typeahead optional; every library implements it. [apg, ariakit, headlessui, base-ui, react-aria, zag, reka, bits]
- [ ] `menu.keyboard.18` Given a typeahead search with no match after the current item, then the search MUST wrap and continue from the first item; a character with no match anywhere MUST leave focus put. [apg, react-aria, zag, reka, bits]
- [ ] `menu.keyboard.19` Given repeated presses of the same character, then the search MUST collapse to a single-character search and cycle through the items starting with it, excluding the current match. [ariakit, base-ui, zag, reka, bits]
- [ ] `menu.keyboard.20` Given a multi-character typeahead prefix, then the buffer MUST accumulate across keystrokes and match the accumulated string, keeping the current item while the buffer still matches it. [ariakit, headlessui, base-ui, react-aria, zag, reka, bits]
- [ ] `menu.keyboard.21` Given a typeahead buffer, then it MUST reset after an idle timeout (1000ms in Reka; React Aria and Base UI use their own timer) and MUST be resettable immediately on demand. [base-ui, react-aria, reka]
- [ ] `menu.keyboard.22` Given typeahead matching, then it MUST be case-insensitive in both directions and MUST match diacritics typed as themselves. [base-ui, headlessui, reka, bits]
- [ ] `menu.keyboard.23` Given a space character typed while a typeahead session is active, then the space MUST be consumed by the search rather than activating the focused item, toggling a checkbox or radio item, navigating a link item, or opening a focused submenu. [base-ui, react-aria]
- [ ] `menu.keyboard.24` Given Space pressed on a focused submenu trigger with no active typeahead session, then the submenu MUST open. [base-ui, ariakit, zag]
- [ ] `menu.keyboard.25` Given an item whose typeahead text is supplied explicitly (a `label`/`textValue`/`data-valuetext` prop), then that text MUST take precedence over the rendered text content. [base-ui, react-aria, zag, reka]
- [ ] `menu.keyboard.26` Given items whose children are not stringifiable (empty, nested elements, `undefined`, `null`), then typeahead MUST skip them. [base-ui] (candidate)
- [ ] `menu.keyboard.27` Given disabled items, then typeahead MUST skip them. [ariakit, headlessui, base-ui]
- [ ] `menu.keyboard.28` Given items hidden with CSS (`display: none`) or natively disabled, then both arrow navigation and typeahead MUST skip them and they MUST keep `tabindex="-1"`. [base-ui] (candidate)
- [ ] `menu.keyboard.29` Given a menu whose item list changes while open, then navigation MUST skip removed items and wrap correctly over the surviving ones. [base-ui] (candidate)
- [ ] `menu.keyboard.30` Given typeahead in a menu with submenus, then the search MUST be scoped to the menu that currently has focus: typing a prefix matching an item in an outer menu MUST NOT move focus there, and the same prefix typed in the active menu MUST match. [radix, ariakit, zag]
- [ ] `menu.keyboard.31` Given typeahead in the APG menu-button examples, then it is single-character only, with no multi-character buffer and no reset timer, unlike the APG listbox and combobox. [apg]
- [ ] `menu.keyboard.32` Given focus on a menuitem with a submenu, when ArrowRight is pressed (ArrowLeft in RTL), then the submenu MUST open with focus on its first item. [apg, ariakit, radix, base-ui, react-aria, zag, melt, bits]
- [ ] `menu.keyboard.33` Given focus on a menuitem with a submenu, when Enter or Space is pressed, then the submenu MUST open with focus on its first item. [apg, ariakit, radix, base-ui, zag, react-aria, bits]
- [ ] `menu.keyboard.34` Given focus inside a submenu, when ArrowLeft is pressed (ArrowRight in RTL), then that submenu MUST close and focus MUST return to its parent menuitem, leaving every ancestor menu open. [apg, ariakit, radix, base-ui, react-aria, zag, melt]
- [ ] `menu.keyboard.35` Given a submenu inside a horizontal menu, then the open key is ArrowDown and the close key ArrowUp in both LTR and RTL. [base-ui] (candidate)
- [ ] `menu.keyboard.36` Given two nested submenus open, when ArrowLeft is pressed on the deepest item, then only the deepest submenu MUST close, and each further press MUST close one more level, focusing the trigger it came from. [radix, base-ui, react-aria]
- [ ] `menu.keyboard.37` Given a submenu that was opened by hover so no item inside it has focus, when ArrowRight is pressed on the submenu trigger, then focus MUST move into the submenu's first item. [radix, react-aria, melt]
- [ ] `menu.keyboard.38` Given focus in a menu opened from a menu button rather than a menubar, when ArrowRight is pressed on an item with no submenu, then nothing MUST happen; ArrowLeft and ArrowRight do nothing in a vertical menu with no submenu. [apg, ariakit]
- [ ] `menu.keyboard.39` Given a second ArrowRight after a submenu is already open with focus inside it, then nothing MUST happen; ArrowLeft on a closed submenu trigger likewise MUST do nothing. [ariakit] (candidate)
- [ ] `menu.keyboard.40` Given focus in a menu, when Escape is pressed, then the menu containing focus MUST close and focus MUST return to the element or context it was opened from, with no item action performed. [apg, ariakit, headlessui, radix, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `menu.keyboard.41` Divergence: Escape pressed inside a submenu closes only that submenu and returns focus to its trigger, leaving ancestor menus open. [apg, base-ui, react-aria] (decision needed)
- [ ] `menu.keyboard.42` Divergence: Escape pressed inside a submenu closes the entire stack and returns focus to the root menu button. [radix, ariakit] (decision needed)
- [ ] `menu.keyboard.43` Given an opt-in `closeParentOnEsc`, then Escape in a submenu MUST close the parent menus too. [base-ui] (candidate)
- [ ] `menu.keyboard.44` Given a menu that opens, then authors MUST ensure focus moves to an item inside it, because Tab and Shift+Tab do not move focus into a menu; a `menu` is a composite widget so Tab MUST NOT move focus among its items. [apg]
- [ ] `menu.keyboard.45` Divergence: Tab or Shift+Tab from inside an open menu closes the menu (and every submenu) and lets focus proceed to the next/previous tabbable element outside it; the handler MUST NOT `preventDefault` Tab. [apg, ariakit, headlessui, base-ui, bits] (decision needed)
- [ ] `menu.keyboard.46` Divergence: Tab from inside an open menu is trapped — the menu stays open and focus does not move. [react-aria, reka] (decision needed)
- [ ] `menu.keyboard.47` Given a modal menu, when Tab is pressed, then the keydown MUST be `defaultPrevented`; in a non-modal menu it MUST NOT be, so Tab can move focus out. Holds for submenus too. [reka] (candidate)
- [ ] `menu.keyboard.48` Given an open menu, when Shift+Tab is pressed, then focus MUST move to the menu button. Ariakit leaves the menu open on the way back (Tab from there re-enters the menu); Base UI and bits close it. [ariakit, base-ui, bits]
- [ ] `menu.keyboard.49` Given a nested submenu with focus inside it, when Shift+Tab is pressed, then the submenu MUST close and focus MUST return to the submenu trigger. [base-ui] (candidate)
- [ ] `menu.keyboard.50` Given a text field, link or button rendered inside a menu, when ArrowLeft or ArrowRight is pressed with the caret inside the text, then the caret MUST move by one character and neither the menu nor the submenu MUST close; ArrowDown and ArrowUp MUST leave focus in the field in a vertical menubar. [ariakit] (candidate)
- [ ] `menu.keyboard.51` Given a focusable descendant portaled out of a menu item, when Space or Enter is typed into it, then the menu MUST NOT `preventDefault` the keydown, so typing into it still works; Space and Enter on the item element itself MUST still select it exactly once. [radix] (candidate)
- [ ] `menu.keyboard.52` Given a keyboard repeat keydown (`repeat: true`) on a trigger with Enter held, then it MUST be ignored: the menu stays open and no option becomes selected. [react-aria] (candidate)
- [ ] `menu.keyboard.53` Given a long-press trigger variant, then Alt+ArrowDown and Alt+ArrowUp MUST open the menu (ArrowDown focusing the first item, ArrowUp the last) while plain Enter and Space MUST NOT, and the trigger MUST be described by help text naming the long press and the Alt+ArrowDown shortcut. [react-aria] (candidate)
- [ ] `menu.keyboard.54` Given a menu of links, then Enter activation relies on the native anchor behavior of the focused `a` element; the APG example does not `preventDefault` Space, which is a known rough edge rather than a rule to copy. [apg]
- [ ] `menu.keyboard.55` Given link items, when Enter or Space activates one, then the action callback MUST fire once, no selection change MUST be reported, and the click MUST reach the document so navigation is not prevented. [react-aria, base-ui]
- [ ] `menu.keyboard.56` Given a link item reached by typeahead, when Space is pressed while the typeahead session is still active, then navigation MUST NOT happen. [base-ui] (candidate)
- [ ] `menu.keyboard.57` Given a menu whose `autoFocusOnShow` is disabled, when it opens by click or key, then focus MUST stay on the button; a second ArrowDown then moves focus onto the first item and a second ArrowUp onto the last. [ariakit] (candidate)
- [ ] `menu.keyboard.58` Given an open menu with a filter or combobox input, when ArrowDown is pressed, then the first item MUST be highlighted and the input's `aria-activedescendant` MUST name it; ArrowUp MUST highlight the last item. [reka, ariakit]
- [ ] `menu.keyboard.59` Given a filter input holding text, when Escape is pressed, then the filter value MUST be cleared before the menu itself closes. [reka] (candidate)
- [ ] `menu.keyboard.60` Given a headless control that synthesizes activation, then the HTML spec defines no Enter or Space key binding for buttons: key activation is a user-agent convention for native elements that the library MUST implement itself. [html]

### Pointer

- [ ] `menu.pointer.1` Given a closed menu button, when it is clicked, then the menu MUST open; clicking it again while open MUST close it and return focus to the button. [apg, ariakit, headlessui, base-ui, react-aria, zag, ark, reka, melt, bits]
- [ ] `menu.pointer.2` Given a closed menu button, when it is right-clicked, then the menu MUST NOT open. [headlessui] (candidate)
- [ ] `menu.pointer.3` Given a disabled menu button, when it is clicked, then the menu MUST NOT open. [headlessui, base-ui, react-aria]
- [ ] `menu.pointer.4` Given an open menu, when the pointer moves over a menu item, then that item MUST become the active item immediately with no hover delay. The roving-tabindex approach calls `focus()`; the `aria-activedescendant` approach updates the attribute without moving DOM focus. [apg, ariakit, headlessui, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `menu.pointer.5` Given hover highlighting turned off, then a `mousemove` over an item MUST NOT focus or highlight it, and `mouseenter` on a submenu trigger MUST NOT highlight it either. [base-ui] (candidate)
- [ ] `menu.pointer.6` Given an open menu, when a disabled item is hovered, then it MUST NOT become the active item; Ariakit additionally clears the current active item. [ariakit, headlessui, react-aria]
- [ ] `menu.pointer.7` Given an open menu, when the pointer leaves an item, then the item MUST become inactive; leaving a disabled item MUST be a no-op. Zag clears the highlight entirely when the pointer leaves the menu. [headlessui, zag]
- [ ] `menu.pointer.8` Given an open menu, when a menu item is clicked, then its action MUST run exactly once, the menu MUST close, and focus MUST return to the menu button. [apg, ariakit, headlessui, base-ui, react-aria, zag, ark, reka, bits]
- [ ] `menu.pointer.9` Given a disabled item, when it is clicked, then nothing MUST happen: no action, no selection change, no close. [headlessui, base-ui, react-aria, ark]
- [ ] `menu.pointer.10` Given a press that starts on the trigger (mousedown) and is released over an item after the impatient-click threshold, then that item MUST activate exactly once and the menu MUST close; the synthesized drag-release click MUST NOT be mistaken for a keyboard activation. [base-ui, react-aria]
- [ ] `menu.pointer.11` Given a press that starts on the trigger and is released outside the menu, then the menu MUST close without activating anything. [base-ui] (candidate)
- [ ] `menu.pointer.12` Given an open menu, when the pointer presses down outside the widget, then the menu MUST close and focus MUST return to the button; the APG example listens for `mousedown` on `window` in the capture phase. Ariakit and Base UI do not restore focus to the button on an outside click. [apg, ariakit, headlessui, base-ui, react-aria, zag, melt, bits]
- [ ] `menu.pointer.13` Given a closed menu, when a click lands outside it, then nothing MUST happen. [headlessui] (candidate)
- [ ] `menu.pointer.14` Given an open menu, when a click lands on another menu's button, then the current menu MUST close; whether the new menu opens on the same click diverges (headlessui opens it, React Aria needs a second click). [headlessui, react-aria, bits]
- [ ] `menu.pointer.15` Given a submenu trigger, when it is hovered, then the submenu MUST open after the configured delay, and the trigger MUST keep focus or highlight rather than focus moving into the submenu; no item inside the submenu MUST be preselected. [radix, ariakit, base-ui, react-aria, zag, melt, bits, reka]
- [ ] `menu.pointer.16` Given a submenu opened by hover, when the pointer moves from the trigger toward the submenu — including diagonally across the sibling item directly below the trigger — then the submenu MUST stay open, because the grace area (safe triangle/polygon) between the trigger and the submenu is honored. [radix, base-ui, zag, bits, reka]
- [ ] `menu.pointer.17` Given a submenu opened by hover, when the pointer leaves the trigger away from the submenu, then the submenu MUST close. At a collision edge, where the submenu opens on the opposite side, the safe directions invert accordingly. [radix, base-ui, zag, bits]
- [ ] `menu.pointer.18` Given a grace polygon entered by a trigger `pointerleave`, when a `pointermove` lands inside the hull, then the in-transit state MUST hold and no exit MUST fire; when it lands outside, the exit callback MUST fire exactly once and the state MUST reset. [reka] (candidate)
- [ ] `menu.pointer.19` Given a grace polygon in transit, when the pointer enters the submenu container itself, then the grace area MUST be torn down without firing the exit callback, so the entered-target branch wins over the geometry check. [reka] (candidate)
- [ ] `menu.pointer.20` Given a grace polygon entered by a `pointerleave`, when 300ms pass without any pointer movement, then the in-transit state MUST auto-reset; it MUST also reset on unmount. [reka] (candidate)
- [ ] `menu.pointer.21` Given an open submenu, when the pointer moves to any item back in the parent menu — a plain item, a disabled item, another submenu trigger, or a disabled submenu trigger — then the open submenu MUST close and the hovered item MUST become the active item. [radix, ariakit, base-ui, react-aria, zag]
- [ ] `menu.pointer.22` Given an open submenu, when the pointer moves into the submenu and then back onto its own trigger, then both the parent menu and the submenu MUST stay open and focus MUST NOT change. [radix, react-aria, zag, reka]
- [ ] `menu.pointer.23` Given two levels of submenus open, when the pointer moves back to the first-level trigger, then the deeper submenu MUST close while the first submenu stays open; moving to an item in the root menu MUST close every submenu. [radix, base-ui, react-aria]
- [ ] `menu.pointer.24` Given a menu with two adjacent submenu triggers, when the second is hovered while the first submenu is open, then only one submenu MUST be open at a time: the first closes and the second opens. [ariakit, base-ui, react-aria]
- [ ] `menu.pointer.25` Given a submenu trigger, when it is clicked, then the submenu MUST open and the root menu MUST stay open; Ariakit additionally keeps the submenu open on a second click rather than toggling it closed. [ariakit, radix, base-ui, zag, ark, bits]
- [ ] `menu.pointer.26` Given a disabled submenu trigger, when it is hovered or clicked, then the submenu MUST NOT open and the trigger MUST keep `aria-expanded="false"`. [base-ui, react-aria]
- [ ] `menu.pointer.27` Given a hover-opened trigger with a close delay, when the pointer leaves, then the close MUST be scheduled for that delay and MUST NOT be restarted by repeated `mousemove` over the same sibling item; hover or focus returning MUST cancel it. [apg, base-ui]
- [ ] `menu.pointer.28` Given a submenu whose hover-open is pending, when only a bubbling `mouseout` fires with a `relatedTarget` outside the trigger (Chrome can drop `mouseleave` during a fast sweep), then the pending open MUST be cancelled; a `mouseout` whose `relatedTarget` is still inside the trigger MUST NOT cancel it. [base-ui] (candidate)
- [ ] `menu.pointer.29` Given a submenu with a plain hover delay, then it MUST open after that delay even if the pointer never comes to rest. [base-ui] (candidate)
- [ ] `menu.pointer.30` Given a menu opened by hover, then a click on the trigger before the patient-click threshold MUST NOT close it and MUST make the menu stick open past a subsequent hover-out; a click after the threshold MUST close it and MUST NOT stick. [base-ui] (candidate)
- [ ] `menu.pointer.31` Given a menu opened by hover, then it MUST become modal (gaining a pointer-blocking backdrop) after a click on its trigger, while a purely hover-opened menu MUST have no backdrop. [base-ui] (candidate)
- [ ] `menu.pointer.32` Given a menu opened by hover whose trigger is a block element, when `mouseup` lands outside the trigger element in the DOM but inside its bounds, then the menu MUST stay open. [base-ui] (candidate)
- [ ] `menu.pointer.33` Given a menu that was opened programmatically or externally rather than by trigger hover, when the popup is entered and left with the pointer, then the menu MUST stay open; a menu opened by its own trigger hover MUST close on hover-out. [base-ui] (candidate)
- [ ] `menu.pointer.34` Given hovering to move the active item, then `focus()` MUST be called with `{ preventScroll: true }` on the item and the content element, so page `scroll-padding` does not scroll the document. [bits] (candidate)
- [ ] `menu.pointer.35` Given a partially visible item or submenu trigger inside a scrolled menu, when its visible sliver is hovered, then it MUST be focused without changing the menu's `scrollTop` or the window scroll. [ariakit] (candidate)
- [ ] `menu.pointer.36` Given a menu button at the bottom edge of the viewport, when a menu item is clicked, then the page MUST scroll the button back into view; when the menu is closed by an outside click instead, the page scroll MUST be left alone. [ariakit] (candidate)
- [ ] `menu.pointer.37` Given a modal menu, when the trigger is clicked with a mouse, then the document MUST be scroll-locked; when it is opened by touch, the lock MUST be skipped unless the popup spans the viewport width. [base-ui] (candidate)
- [ ] `menu.pointer.38` Given a long-press trigger variant, then a long press past the 500ms threshold MUST open the menu while a plain tap or a shorter press MUST NOT. [react-aria] (candidate)
- [ ] `menu.pointer.39` Given activation, then it is always caused by a `click` event; when the user triggers it by keyboard or voice the default action of that interaction event MUST be to fire a `click` at the element. [html]
- [ ] `menu.pointer.40` Given `element.click()`, then it MUST return early for a disabled form control or a click already in progress on that element, and otherwise fire an untrusted `click`, so the method is reentrancy-guarded per element. [html]

### Focus management

- [ ] `menu.focus.1` Given a menu that opens, then keyboard focus MUST be placed on the first item, unless the widget deliberately opens on the last item or on the checked item. [apg, base-ui, react-aria]
- [ ] `menu.focus.2` Divergence: a menu opened by click puts DOM focus on the first item. [apg] (decision needed)
- [ ] `menu.focus.3` Divergence: a menu opened by click puts DOM focus on the menu container itself with no item active or highlighted; the first item is reached only by a subsequent ArrowDown. [ariakit, react-aria, zag, melt, bits] (decision needed)
- [ ] `menu.focus.4` Given a menu opened by keyboard, then focus MUST land on an item (first for Enter/Space/ArrowDown, last for ArrowUp), and that item MUST be the only one with `tabindex="0"`. [apg, ariakit, headlessui, base-ui, react-aria, zag, melt, bits]
- [ ] `menu.focus.5` Given a menu whose first items are disabled, when it opens, then the first non-disabled item MUST become active, jumping over as many disabled items as needed; when every item is disabled, no item MUST become active. [headlessui] (candidate)
- [ ] `menu.focus.6` Divergence: disabled menu items remain focusable but are not activatable, so arrow navigation lands on them. [apg, base-ui] (decision needed)
- [ ] `menu.focus.7` Divergence: disabled menu items are skipped entirely by arrow navigation and typeahead. [ariakit, headlessui, react-aria, melt, bits] (decision needed)
- [ ] `menu.focus.8` Given a separator in a menu, then it MUST NOT be focusable or interactive. [apg]
- [ ] `menu.focus.9` Given a menu of radio items, then opening the menu MAY place focus on the currently checked item rather than the first; React Aria focuses the selected item on open and, for multiple selection, the last item whose selection changed. [apg, react-aria]
- [ ] `menu.focus.10` Given a menu closed by selecting an item or by Escape, then focus MUST return to the trigger, and it MUST return there even when the popup is kept mounted rather than unmounted. [apg, ariakit, base-ui, react-aria, zag, reka, melt, bits]
- [ ] `menu.focus.11` Given a menu opened programmatically from some other element than the trigger, then closing it MUST return focus to that opener, not to the trigger. [base-ui] (candidate)
- [ ] `menu.focus.12` Given an explicit final-focus target, then closing the menu MUST focus it; a value of `false` MUST move focus nowhere, and a function returning `true` or `null` MUST fall back to focusing the trigger. [base-ui] (candidate)
- [ ] `menu.focus.13` Given an open/close autofocus hook that calls `preventDefault`, then the default focus move MUST be skipped and the handler's own target MUST be focusable instead. [bits] (candidate)
- [ ] `menu.focus.14` Given a menu opened from a context action such as an editor shortcut key, then Escape or Enter MAY return focus to that invoking context rather than to a menu button. [apg]
- [ ] `menu.focus.15` Given several menus on a page, then closing one MUST return focus to its own trigger and MUST NOT jump to a previously used trigger or scroll to it. [bits] (candidate)
- [ ] `menu.focus.16` Given a modal menu, then every element outside it except its own disclosure MUST be made inert so focus cannot escape, while the disclosure stays exposed so `aria-labelledby` still resolves; a persistent-elements option MUST be able to exempt further elements, which then become Shift+Tab reachable. [ariakit] (candidate)
- [ ] `menu.focus.17` Given a modal menu whose disclosure is swapped for another element while open, then the new disclosure MUST join the modal context, the old one MUST become inert, and the menu's accessible name MUST follow. [ariakit] (candidate)
- [ ] `menu.focus.18` Given a focused item whose DOM node is replaced while the popup is positioning, then the replacement MUST become the active item and take focus, with the deferred scroll landing once positioning finishes; if focus had left to the body first the replacement MUST become active without taking focus, and a refocused item's replacement MUST take focus again. [ariakit] (candidate)
- [ ] `menu.focus.19` Given a popup whose positioning pass has not finished, then focus MUST stay on the trigger and a programmatic move to an item MUST NOT scroll the document until the pass completes. This holds for a popup that mounts after its store is already open. [ariakit] (candidate)
- [ ] `menu.focus.20` Given a keepMounted non-modal menu, when focus is tabbed out and the menu is then closed, then the previously focused item MUST be reset to `tabindex="-1"` so no tabbable item is left behind. [base-ui] (candidate)
- [ ] `menu.focus.21` Given an element with a negative `tabindex`, then the user agent MUST treat it as a focusable area but SHOULD omit it from sequential focus navigation, which is the spec basis for roving tabindex; `tabindex="0"` MUST be included at its DOM position and a headless library MUST NOT emit positive values. [html]
- [ ] `menu.focus.22` Given "focusable", "Tab-reachable" and "click-focusable", then they are three separate properties and a library MUST treat them as such. [html]
- [ ] `menu.focus.23` Given `element.focus(options)`, then `preventScroll` defaults to false, so scrolling into view is the default and MUST be suppressed explicitly; `element.blur()` SHOULD run the unfocusing steps but MAY do nothing, so a library MUST NOT rely on it to move focus anywhere in particular. [html]
- [ ] `menu.focus.24` Given a shadow host whose shadow root delegates focus, then resolving its focusable area MUST return the focus delegate: the first `autofocus` descendant, else the first focusable area in tree order, recursing into further delegating hosts. [html]
- [ ] `menu.focus.25` Given the focusing steps, then they MUST return early for an inert target, no-op when the target is already focused, and otherwise fire `blur` on the old chain and `focus` on the new chain with `relatedTarget` set. [html]
- [ ] `menu.focus.26` Given a roving-focus group, then the whole group MUST be a single tab stop: Tab moves focus in once and the next Tab leaves the group entirely. [reka] (candidate)

### State

- [ ] `menu.state.1` Given `menuitemcheckbox` items, then more than one MAY be checked simultaneously and toggling one MUST NOT affect the others. [apg, zag, bits]
- [ ] `menu.state.2` Given a group of `menuitemradio` items, then exactly one MUST be checked and checking a new one MUST uncheck the previous. [apg, radix, base-ui, react-aria, zag]
- [ ] `menu.state.3` Given an uncontrolled checkbox or radio item, then its state MUST survive closing and reopening the menu, including when the popup is kept mounted. [base-ui, bits]
- [ ] `menu.state.4` Given a controlled value, then a click that the controller does not accept MUST NOT change the rendered state, and a change callback that cancels the event MUST leave the item unchecked. [ariakit, base-ui, react-aria]
- [ ] `menu.state.5` Given a controlled value where a click would not change it, then no change callback MUST fire at all. [ariakit] (candidate)
- [ ] `menu.state.6` Given an uncontrolled multi-select, then the DOM state MUST accumulate in DOM order while the change callback reports the values in click order. [ariakit] (candidate)
- [ ] `menu.state.7` Given a change callback on a checkbox item or radio group, then it MUST fire exactly once per interaction with the new value. [base-ui, bits]
- [ ] `menu.state.8` Given a value reset from outside the menu, then reopening MUST show the item unchecked with its indicator gone. [ariakit, bits]
- [ ] `menu.state.9` Given a selection mode of none, then clicking or keying items MUST NOT produce `aria-checked="true"`, MUST NOT render a selection indicator and MUST NOT call the selection-change callback; selection indicators require an explicit selection mode. [react-aria] (candidate)
- [ ] `menu.state.10` Given an action callback on the menu and one on the item, then activating the item MUST call both exactly once; a dynamic collection MUST pass the item object alongside its key. [react-aria] (candidate)
- [ ] `menu.state.11` Given selection-mode groups inside one menu, then each group MUST manage its own selection: a multiple-selection group accumulates while a single-selection group replaces. [react-aria] (candidate)
- [ ] `menu.state.12` Given a submenu trigger item whose key appears in the selected keys, then it MUST NOT be rendered as selected: it keeps `role="menuitem"` with no `aria-checked`. [react-aria] (candidate)
- [ ] `menu.state.13` Given a submenu with its own selection mode, then selecting inside the submenu MUST call the submenu's callback and MUST NOT call the parent's. [react-aria] (candidate)
- [ ] `menu.state.14` Given a submenu trigger, when it is clicked or activated with Enter, then no selection event MUST fire and the parent menu's action callback MUST NOT be called. [react-aria] (candidate)
- [ ] `menu.state.15` Given a controlled `open`, then the menu MUST be present on first render without the open-change callback firing, and toggling the trigger MUST call the callback exactly once while leaving `open` under the caller's control. [react-aria, base-ui, ark]
- [ ] `menu.state.16` Given an uncontrolled `defaultOpen`, then the menu MUST render open and the first trigger click MUST close it, calling the open-change callback once. [react-aria, base-ui, ark]
- [ ] `menu.state.17` Given an open-change callback that cancels the event while uncontrolled, then the menu MUST never render. [base-ui] (candidate)
- [ ] `menu.state.18` Given a controlled close that is vetoed, then the popup MUST keep its open state and style hooks. [base-ui] (candidate)
- [ ] `menu.state.19` Given a close-change callback that prevents unmount, then the popup MUST stay mounted with the trigger marked closed, and a later normal close MUST unmount it; an imperative `unmount` action MUST also unmount it. [base-ui] (candidate)
- [ ] `menu.state.20` Given a close event, then the reason MUST be reported distinctly: item press, escape key, outside press, cancelled open, trigger hover, and a sibling submenu opening are each their own reason. [base-ui] (candidate)
- [ ] `menu.state.21` Given a `close` function exposed on the menu and item render props, then calling it MUST close the menu. [headlessui] (candidate)
- [ ] `menu.state.22` Given multiple triggers bound to one menu, then opening from any trigger MUST show the same menu, the payload for the active trigger MUST render, the popup and positioner DOM nodes MUST be reused when switching triggers, and an initial trigger id MUST be honorable. [base-ui] (candidate)
- [ ] `menu.state.23` Given an imperative handle, then `open(triggerId)` and `close()` MUST work while a root is mounted, MUST be ignored with a warning when no root is attached, and MUST throw for an unregistered trigger id. [base-ui] (candidate)
- [ ] `menu.state.24` Given one handle attached to more than one mounted root, then a warning MUST be emitted; a handoff where an incoming root opens while the trigger is still registered to the outgoing root MUST resolve without error. [base-ui] (candidate)
- [ ] `menu.state.25` Given sixty independent menus on one page, then clicking one MUST open only that one; hydrating many menus MUST NOT log a React maximum-update-depth error. [ariakit] (candidate)
- [ ] `menu.state.26` Given a filter input, then typing MUST update the bound filter text and MUST narrow the rendered items to those matching it. [reka] (candidate)

### Dismissal and layering

- [ ] `menu.dismissal.1` Given a menu closed by Enter, Space, Escape or Tab, then the close MUST be immediate and forced, bypassing any hover or focus guards that would otherwise defer it. [apg]
- [ ] `menu.dismissal.2` Given a menu whose close is requested while the pointer is over it or its button, or while it still contains focus, then the close MAY be deferred. [apg] (candidate)
- [ ] `menu.dismissal.3` Given an open menu with open submenus, when an item in any menu is activated, then every menu in the stack MUST close at once. [apg, ariakit, radix, base-ui, react-aria, zag, bits]
- [ ] `menu.dismissal.4` Given an open menu with open submenus, when a click lands outside the whole tree, then every level MUST unmount. [radix, base-ui, react-aria, zag, bits]
- [ ] `menu.dismissal.5` Given an open menu, when the window loses focus (a `blur` on `window`), then the menu and any open submenus MUST close and the trigger MUST return to `aria-expanded="false"`. [radix] (candidate)
- [ ] `menu.dismissal.6` Given an item marked not to close on select, then activating it MUST leave the menu open; the option MUST be settable per item, per group, or for the whole menu. [radix, base-ui, react-aria, zag, bits]
- [ ] `menu.dismissal.7` Divergence: a checkbox or radio item click leaves the menu open by default and closing is opt-in. [apg, base-ui, melt] (decision needed)
- [ ] `menu.dismissal.8` Divergence: a checkbox or radio item click closes the menu by default. [bits] (decision needed)
- [ ] `menu.dismissal.9` Given an escape-behavior option set to ignore, then Escape MUST leave the menu open and arrow navigation MUST keep working. [bits, melt]
- [ ] `menu.dismissal.10` Given an outside-interaction behavior option set to ignore, or an outside-press handler that calls `preventDefault`, then an outside click MUST leave the menu open. [bits, melt]
- [ ] `menu.dismissal.11` Given an outside press whose later mouse events are swallowed by another overlay, then the menu MUST still close on the initial press. [radix] (candidate)
- [ ] `menu.dismissal.12` Given a menu open inside a dialog, when a click lands inside the dialog but outside the menu, then only the menu MUST dismiss and the dialog MUST stay open. [radix] (candidate)
- [ ] `menu.dismissal.13` Given a menu open inside a modal dialog, when Escape is pressed with focus on the menu's disclosure, then only the menu MUST close and the dialog MUST stay open. [ariakit] (candidate)
- [ ] `menu.dismissal.14` Given a menu item that opens a modal dialog, then the dialog MUST take focus and the parent menu MUST leave the accessibility tree; whether the parent menu is still visually present depends on its close-on-click setting. Closing the dialog MUST reveal the menu (and submenu) again unless close-on-click removed them. [ariakit] (candidate)
- [ ] `menu.dismissal.15` Given a menu item that opens a nested dialog or alert dialog, then Shift+Tab inside the dialog MUST leave both popups mounted, focus MUST stay inside the dialog when the pointer leaves the triggering item, and a pending focus move into the dialog MUST NOT be cancelled by the pointer leaving. [base-ui] (candidate)
- [ ] `menu.dismissal.16` Given a menu inside a dialog, when the menu is toggled closed by its own button, then focus MUST return to the menu button and the dialog MUST stay open. [ariakit] (candidate)
- [ ] `menu.dismissal.17` Given a modal menu, then it MUST render an internal backdrop with `role="presentation"` immediately before the positioner; a non-modal menu MUST render none. A backdrop for a hover-opened menu MUST carry `pointer-events: none` so hover still reaches elements underneath, while a click-opened menu's backdrop MUST block pointer events. [base-ui] (candidate)
- [ ] `menu.dismissal.18` Given a modal menu, then the menu MUST expose only its own items: a fallback dismiss button MUST sit outside the menu element rather than inside it. React Aria renders two screen-reader-only "Dismiss" buttons, and activating one MUST close the menu. [ariakit, react-aria]
- [ ] `menu.dismissal.19` Given a sibling submenu opening, then the previously open submenu MUST close with a sibling-open reason and the root MUST NOT close; the same holds when a controlled parent closes. [base-ui] (candidate)
- [ ] `menu.dismissal.20` Given a submenu opened by hover whose item is clicked while a delayed close is pending, then each menu's close callback MUST fire exactly once and no close MUST carry a stale hover reason. [base-ui] (candidate)
- [ ] `menu.dismissal.21` Given nested submenus, then a menu popover's topmost-popover-ancestor MUST be computed over both DOM nesting and `popovertarget` invoker relationships, so a submenu popover triggered from inside a parent popover counts as its descendant and is not closed when the parent opens. [html]
- [ ] `menu.dismissal.22` Given a menu implemented with the `popover` attribute, then `popover="auto"` is the correct state: opening one auto popover closes the others, and it has light dismiss and responds to close requests; light dismiss MUST close popovers down to, but not including, the nearest open ancestor popover of the clicked element. [html]
- [ ] `menu.dismissal.23` Given a menu button with `popovertarget`, then the invoker MUST be a button, MUST NOT be disabled and MUST NOT be a submit button with a form owner, or the target resolves to null; the popover's implicit anchor MUST be set to that invoker. [html]
- [ ] `menu.dismissal.24` Given a modal dialog opened while a menu popover is open, then `show()` and `showModal()` MUST hide popovers up to the topmost popover ancestor before focusing the dialog. [html]
- [ ] `menu.dismissal.25` Given a menu opened in a popup browser window, then Escape, an outside click and an item click MUST each close it, with focus returning to the trigger in that window on item click. [ariakit] (candidate)
- [ ] `menu.dismissal.26` Given a tooltip on the menu button, then opening the menu MUST remove the tooltip, re-entering the button without leaving MUST NOT bring it back, closing with Escape MUST show it again, and a modal menu MUST keep it hidden even after the pointer leaves and returns. [ariakit] (candidate)
- [ ] `menu.dismissal.27` Given a tooltip with an open delay, when the menu button is clicked before the tooltip appears, then the tooltip MUST never appear for that hover, only after the pointer leaves and re-enters. [ariakit] (candidate)

### Positioning

- [ ] `menu.positioning.1` Given a menu button as anchor, then the menu MUST be positioned against it, and the portal wrapper MUST be placed so the menu reads next to its trigger. [ariakit, base-ui, zag, ark]
- [ ] `menu.positioning.2` Given no portal option, then the content MUST be portaled to `document.body`; a portal target MUST be honored, and a disabled portal MUST leave the content in its original container. [bits] (candidate)
- [ ] `menu.positioning.3` Given a custom portal container, then the menu MUST render inside it, including when the menu renders as a tray on a narrow screen. [react-aria] (candidate)
- [ ] `menu.positioning.4` Given an explicit placement, then the open menu MUST report it through a placement data attribute. [ark, zag]
- [ ] `menu.positioning.5` Given an anchor supplied as a ref, an element, a function returning an element, or a virtual element with `getBoundingClientRect`, then the positioner MUST be placed at that rect; a non-memoized function MUST NOT break rendering, and clearing the anchor MUST fall back to the trigger rect. [base-ui] (candidate)
- [ ] `menu.positioning.6` Given side and align offsets supplied as numbers or as functions, then the resolved transform MUST reflect them, and the function MUST be able to read the latest resolved side and align after collision flipping, including logical values. [base-ui] (candidate)
- [ ] `menu.positioning.7` Given a menu with a viewport wrapper, then positioning MUST switch from `transform` to `top`/`left`; without the wrapper a non-empty `transform` MUST be used. [base-ui] (candidate)
- [ ] `menu.positioning.8` Given a menu with multiple triggers, then switching triggers MUST reposition the popup to the new trigger, realigning to within a pixel of its edge. [base-ui, zag]
- [ ] `menu.positioning.9` Given a submenu in a vertical menu or menubar, then it MUST be placed beside its parent item and MUST follow its parent menu rather than the root; an explicit placement MUST win, including in RTL. [ariakit] (candidate)
- [ ] `menu.positioning.10` Given a slide-navigation menu, then opening a submenu MUST advance the wrapper scroll by exactly one pane width per level and a back item MUST scroll it back one pane. [ariakit] (candidate)
- [ ] `menu.positioning.11` Given a menu rendered as a tray on a narrow screen, then every level MUST stay inside the same tray element, with every menu wrapper except the newest marked `aria-hidden="true"`. [react-aria] (candidate)
- [ ] `menu.positioning.12` Given an arrow element, then it MUST be visible once the menu is open. [melt] (candidate)
- [ ] `menu.positioning.13` Given an inline `style` prop on the content, then it MUST be applied to the content element. [bits] (candidate)

### Animation and presence

- [ ] `menu.animation.1` Given a `static`/`forceMount`/`forceVisible` option, then the content MUST stay rendered while the menu is closed, and the unmount strategy MUST be swappable. [headlessui, bits, melt]
- [ ] `menu.animation.2` Given a keepMounted portal, then the closed menu element MUST exist but be inaccessible, become visible and accessible on open, and return to present-but-inaccessible on close; without keepMounted it MUST NOT exist at all while closed. [base-ui, bits]
- [ ] `menu.animation.3` Given a lazily mounted menu, then the positioner MUST be absent until the first open and MUST stay mounted after closing, unless unmount-on-exit is also set. [ark] (candidate)
- [ ] `menu.animation.4` Given a menu with an exit animation, then the popup MUST stay mounted with its ending-style hook until the animation finishes, and the open-change-complete callback MUST be called last with `false`; with no exit animation it MUST unmount immediately. [ariakit, base-ui]
- [ ] `menu.animation.5` Given a menu with an enter animation, then the open-change-complete callback MUST first report `true` only after the enter animation finishes; merely mounting a closed menu MUST NOT call it. [base-ui] (candidate)
- [ ] `menu.animation.6` Given a menu with a leave animation, then focus MUST return to the trigger while the menu is still present and the menu MUST unmount only after the animation ends. [ariakit] (candidate)
- [ ] `menu.animation.7` Given a submenu that is open when its parent opens, then the submenu MUST play its enter transition, whether the submenu's open state is default or controlled; a menu (or submenu) already open on the very first render MUST NOT play one. [base-ui] (candidate)
- [ ] `menu.animation.8` Given a parent popup kept mounted, then a `defaultOpen` submenu inside it MUST NOT play its enter transition — a documented limitation pinned as current behavior. [base-ui] (candidate)
- [ ] `menu.animation.9` Given a parent menu opened instantly by keyboard, then an initially open submenu MUST still play its enter phase and MUST inherit the instant marker during it, and that inherited marker MUST NOT outlive the initial reveal: a later programmatic open, an interrupted entry, or a late-rendered portal MUST all produce no instant marker. [base-ui] (candidate)
- [ ] `menu.animation.10` Given a checkbox or radio item indicator with an exit animation, then it MUST stay mounted with its ending-style hook until the animation finishes and then unmount; with no exit animation it MUST unmount straight away. [base-ui] (candidate)
- [ ] `menu.animation.11` Given a viewport that morphs between payloads, then a previous container MUST appear carrying `inert` with the outgoing content and the measured popup size as custom properties, the current container MUST hold the incoming content, and the previous container MUST be removed once the transition ends; rapid trigger changes MUST settle on the last payload. [base-ui] (candidate)
- [ ] `menu.animation.12` Given a viewport morph, then the direction of the move between triggers MUST be published as tokens with a 5px tolerance, so a move within tolerance on an axis publishes no token for it. [base-ui] (candidate)

### RTL and i18n

- [ ] `menu.rtl.1` Given a right-to-left menu, then the submenu open and close keys MUST swap: ArrowLeft opens the submenu and ArrowRight closes it. [apg, radix, base-ui, react-aria]
- [ ] `menu.rtl.2` Given a right-to-left menu with three levels open and focus on a submenu trigger, when ArrowRight is pressed, then only the deepest submenu MUST close and focus MUST stay on the trigger. [react-aria] (candidate)
- [ ] `menu.rtl.3` Given a right-to-left menu, then the pointer grace area MUST mirror: leaving the trigger left-to-right closes the submenu and right-to-left keeps it open, with the directions inverted again at a collision edge. [radix] (candidate)
- [ ] `menu.rtl.4` Given a right-to-left menu item that opens a sub-dialog, then ArrowLeft MUST open it. [react-aria] (candidate)
- [ ] `menu.rtl.5` Given a menu filter input during an IME composition, then the filter MUST NOT update until `compositionend`, and arrow keys dispatched with `isComposing: true` MUST NOT move the highlight because they are IME candidate navigation. [reka] (candidate)
- [ ] `menu.rtl.6` Given an Android soft keyboard, then a plain-text autocorrect composition MUST update the filter live while a CJK composition MUST wait for `compositionend`; off Android a plain-text preedit MUST NOT update it live. [reka] (candidate)

### SSR and hydration

- [ ] `menu.ssr.1` Given a menu and a menu trigger, when server rendered and hydrated, then they MUST render with no errors and no hydration mismatch. [react-aria] (candidate)

### Accessibility tooling

- [ ] `menu.a11y.1` Given an open menu with items, separators, checkbox items, a radio group and an arrow, when axe runs over the document, then there MUST be no violations. Also asserted for a closed menu and for a context menu. [axe, zag, ark, reka, melt]
- [ ] `menu.a11y.2` Given a menu with neither `aria-label` nor `aria-labelledby`, then a development warning MUST be emitted. [react-aria] (candidate)
- [ ] `menu.a11y.3` Given `aria-controls` on a menu button that also carries `aria-haspopup`, then an unresolvable reference MUST be reported as incomplete rather than a failure, so lazily rendered menus surface as needing review. [axe]
- [ ] `menu.a11y.4` Given a scrollable menu, then it MUST contain a focusable element or be focusable itself (serious impact). [axe]
- [ ] `menu.a11y.5` Given any element with a `role`, then the role MUST be valid, non-abstract and not deprecated, every ARIA attribute on it MUST be allowed for that role and host element, and all required attributes MUST be present. [axe]
- [ ] `menu.a11y.6` Given any `aria-*` attribute, then its name and value MUST be valid; an unresolved id reference is reported as incomplete and an empty value as ignored-while-empty. [axe]
- [ ] `menu.a11y.7` Given an id referenced by `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-owns` or `aria-activedescendant`, then that id MUST be unique in the document (critical impact). [axe]
- [ ] `menu.a11y.8` Given an element with `aria-hidden="true"`, then neither it nor any descendant MUST be focusable; only the outermost such element is tested. [axe]
- [ ] `menu.a11y.9` Given `role="presentation"` or `role="none"`, then the element MUST NOT also be focusable or carry a global ARIA attribute. [axe]
- [ ] `menu.a11y.10` Given `aria-brailleroledescription` or `aria-braillelabel`, then a non-braille equivalent MUST exist (serious impact). [axe]
- [ ] `menu.a11y.11` Given a clickable menu item, then its touch target SHOULD be at least 24 by 24 CSS pixels or leave sufficient space from its neighbors; the axe rule ships disabled and MUST be enabled explicitly. [axe]
- [ ] `menu.a11y.12` Given VoiceOver, then a submenu trigger MUST drop `aria-expanded` entirely when the submenu is opened by ArrowRight or Enter (so VoiceOver does not talk over the item announcement) while keeping `aria-haspopup="menu"`; opened by pointer, where focus stays on the trigger, it MUST keep `aria-expanded="true"`. [base-ui] (candidate)
- [ ] `menu.a11y.13` Given TalkBack on Android, then a virtual press on a submenu trigger (a 1x1 zero-pressure `pointerdown` plus `mousedown` and `click` with `detail: 0`) MUST open the submenu and the trailing click MUST NOT toggle it closed, while an ordinary pressed-mouse sequence MUST NOT be treated as a virtual press. (browser-only) [base-ui] (candidate)

### Notes and edge cases

- [ ] `menu.notes.1` Given a menu item that launches a dialog, then appending an ellipsis to its label is the conventional signal. [apg]
- [ ] `menu.notes.2` Given the choice between opening a menu from a menu button and from a menubar, then except where explicitly noted, menus opened from a menu button behave identically to menus opened from a menubar. [apg]
- [ ] `menu.notes.3` Given a menu with a combobox inside (a dialog-flavored menu), when the trigger is activated, then the popup MUST NOT take focus itself, the combobox MUST take focus, and no option MUST be active; opening by Enter, Space or ArrowDown makes the first option active and ArrowUp the last. [ariakit] (candidate)
- [ ] `menu.notes.4` Given a combobox inside a menu, then typing MUST filter the options progressively with the active option following the best match, Backspace MUST walk the query back, Escape MUST close the popup, and reopening MUST reset the query to empty. [ariakit] (candidate)
- [ ] `menu.notes.5` Given a combobox inside a menu, then DOM focus MUST stay on the input while ArrowDown/ArrowUp move the active option, the active option MUST carry a focus-visible hook only when reached by keyboard, and typeahead MUST resume arrow walking from the matched option. [ariakit] (candidate)
- [ ] `menu.notes.6` Given a combobox inside a menu with autoselect, then typing MUST make the first matching option active. [ariakit] (candidate)
- [ ] `menu.notes.7` Given a submenu containing a combobox, then its trigger MUST expose `aria-haspopup="dialog"`, clicking it MUST NOT close the parent menu, ArrowRight MUST move into the submenu's combobox with its first option active, ArrowLeft MUST close it restoring `aria-expanded="false"`, and Escape from inside MUST close the whole stack. [ariakit] (candidate)
- [ ] `menu.notes.8` Given an open search submenu, then Tab MUST move focus to the submenu's combobox without activating an option and Shift+Tab MUST return to the parent option with the submenu still open. [ariakit] (candidate)
- [ ] `menu.notes.9` Given a menu containing dialogs, then Tab MUST cycle through the menu's own items including the fallback dismiss button, and opening and closing nested dialogs repeatedly MUST focus the dialog each time and return focus to the opening button each time. [ariakit] (candidate)
- [ ] `menu.notes.10` Given a parent whose menu item opens a dialog with a form, then submitting an empty form MUST show a validation message that clears once a character is typed, and submitting a valid value MUST close the dialog, return to the menu with the new item focused, and update the trigger's label. [ariakit] (candidate)
- [ ] `menu.notes.11` Given a long scrolling menu, then a typeahead or End-key jump MUST keep the keyboard highlight and scroll the matched item into view even though the pointer has not moved and now sits over a different item; a later pointer move MUST hand control of the highlight back to hover. [zag] (candidate)
- [ ] `menu.notes.12` Given content that is kept mounted while closed and re-parented into a portal on open, then the menu MUST stay open through the re-parenting, items MUST remain selectable, and Escape MUST still close it. [zag] (candidate)
- [ ] `menu.notes.13` Given a menu rendered inside a tray on a narrow screen, then hover MUST NOT open or close submenus — only a touch press opens one — and a back button labelled for the parent trigger MUST close one level, landing focus on the revealed parent list. [react-aria] (candidate)
- [ ] `menu.notes.14` Given a menu with an incremental loader, then the loading item MUST render only while loading, the sentinel MUST stay in the document either way, and the load-more callback MUST fire on intersection regardless of loading state. [react-aria] (candidate)
- [ ] `menu.notes.15` Given menu parts rendered without their required ancestor, then each MUST throw a clear error naming the missing ancestor (`Menu.Root`, `Menu.Portal`, `Menu.Positioner`, `Menu.RadioGroup`, `Menu.CheckboxItem`, `Menu.RadioItem`, `Menu.Group`/`Menu.RadioGroup`, `Menu.SubmenuRoot`), and a trigger with neither a root nor a handle MUST throw too. [base-ui, headlessui]
- [ ] `menu.notes.16` Given a `modal` prop on a nested menu, then a development warning MUST say it is not supported and will be ignored, and no warning MUST be emitted in production. [base-ui] (candidate)
- [ ] `menu.notes.17` Given a submenu trigger rendered with a natively disabled element, then a development warning MUST direct the author to the `disabled` prop instead, emitted exactly once and never in production. [base-ui] (candidate)
- [ ] `menu.notes.18` Given every menu part, then it MUST forward unconsumed props and refs to the element it renders, merge class names, support a render/`asChild` escape hatch that preserves the part's role and state attributes, and compose the author's event handlers with its own rather than replacing them. [radix, base-ui, headlessui]
- [ ] `menu.notes.19` Given a re-rendered trigger or submenu trigger, then its composed ref callback identity MUST stay stable so the ref is not detached and reattached on every render. [radix] (candidate)
- [ ] `menu.notes.20` Given arrow navigation moving the highlight, then only the two items whose state changed MUST re-render; the other items MUST NOT. (browser-only) [base-ui] (candidate)
- [ ] `menu.notes.21` Given a submenu trigger whose id prop changes, then the registration MUST follow the new id without leaking the old one and without growing the collection. [base-ui] (candidate)
- [ ] `menu.notes.22` Given explicit ids for the trigger, menu, sub trigger and submenu, then the rendered elements MUST carry exactly those ids. [melt] (candidate)
- [ ] `menu.notes.23` Given jsdom without `PointerEvent`, then submenu hover tests must synthesize a `MouseEvent` named `pointermove` with a `pointerType` property; grace-area geometry must be supplied by stubbing `getBoundingClientRect`, since jsdom returns all zeros. [reka] (candidate)
- [ ] `menu.notes.24` Given hover-grace assertions, then the pointer coordinates should be derived from the measured trigger and content rects (which side the submenu actually landed on) rather than hard-coded, so the test holds under collision flipping. [bits] (candidate)

## Sources

- `docs/research/apg-and-axe.md` — `## menu` (aria-practices menu-button and menubar patterns, APG regression tests, WHATWG HTML focus/activation/popover sections, axe rules) → tags `apg`, `axe`, `html`.
- `docs/research/ariakit-and-headlessui.md` — `## menu` → tags `ariakit`, `headlessui`.
- `docs/research/radix-and-base-ui.md` — `## menu`, `## roving-focus` → tags `radix`, `base-ui`.
- `docs/research/react-aria-b.md` — `## menu`, `## typeahead` → tag `react-aria`.
- `docs/research/reka-melt-bits.md` — `## menu`, `## dropdown-menu`, `## typeahead`, `## grace-area`, `## roving-focus` → tags `reka`, `melt`, `bits`.
- `docs/research/zag-and-ark.md` — `## menu` → tags `zag`, `ark`.

## Deferred

- Framework-adapter plumbing (Vue template `as` prop arities, Svelte snippet props, Solid/Vue parity skips, `describeConformance`/`popupConformanceTests` suites, render-prop and `className`-as-function shapes) is adapter surface, not menu behavior. Kept out of the suite; the harness covers the equivalent for `@kit/solid`.
- Base UI's detached-trigger and `Menu.createHandle` architecture (`menu.state.22`–`menu.state.24`) is recorded but out of scope until the core controller grows a multi-trigger concept.
- Base UI's `Menu.Viewport` morphing containers (`menu.animation.11`, `menu.animation.12`) and Ariakit's slide-navigation menu (`menu.positioning.10`) are library-specific presentation shells; deferred until we decide whether the controller owns a viewport.
- Ariakit's positioning-pass (`data-placing`) focus deferral (`menu.roles.39`, `menu.focus.18`, `menu.focus.19`) depends on a custom `updatePosition` hook we do not yet have.
- React Aria's tray/long-press mobile presentation (`menu.notes.13`, `menu.keyboard.53`, `menu.pointer.38`, `menu.positioning.11`) and virtualization (`menu.roles.31`, `menu.notes.14`) are separate components in our inventory.
- Unresolved: whether a click-opened menu focuses the first item (`menu.focus.2` vs `menu.focus.3`), whether Escape in a submenu closes one level or all (`menu.keyboard.41` vs `menu.keyboard.42`), whether Tab closes the menu or is trapped (`menu.keyboard.45` vs `menu.keyboard.46`), whether arrows wrap by default (`menu.keyboard.8` vs `menu.keyboard.9`), whether disabled items are focusable (`menu.focus.6` vs `menu.focus.7`), and whether checkbox/radio items close the menu (`menu.dismissal.7` vs `menu.dismissal.8`).
