# menubar

A visually persistent row (or column) of menu triggers, one of which may be open
at a time. The popup each trigger opens is a menu, so everything inside it —
item roles, vertical arrow navigation, typeahead, submenus, checkbox and radio
items, groups and labels — is the contract in `menu.md`. This file records the
menubar itself: the container role, roving focus across triggers, the horizontal
arrow keys that switch the open menu, and the handoff between levels.

## menubar

### Roles and attributes

- [ ] `menubar.roles.1` Given a visually persistent menu, then its container MUST have `role="menubar"`. [apg, axe, ariakit, radix, base-ui]
- [ ] `menubar.roles.2` Given a menubar with a visible label, then it MUST have `aria-labelledby` referring to that label; otherwise `aria-label` MUST supply the name. [apg]
- [ ] `menubar.roles.3` Given a vertically oriented menubar, then it MUST have `aria-orientation="vertical"`; `menubar` defaults to horizontal. [apg, ariakit, base-ui]
- [ ] `menubar.roles.4` Given a menubar that allows either orientation, then it MUST have no `aria-orientation` at all. [ariakit] (candidate)
- [ ] `menubar.roles.5` Given a container rendered as a non-composite wrapper, then it MUST have neither a `role` nor an `aria-orientation` and MUST NOT be matched by a `menubar` role query. [ariakit] (candidate)
- [ ] `menubar.roles.6` Given each menubar trigger, then it MUST have `role="menuitem"` and `aria-haspopup="menu"`. [apg, radix, base-ui]
- [ ] `menubar.roles.7` Given a menubar trigger whose menu is open, then `aria-expanded` MUST read `"true"`, and `"false"` once the menu closes. [apg, ariakit, radix, base-ui]
- [ ] `menubar.roles.8` Given an open menubar menu, then the trigger's `aria-controls` MUST equal the content's non-empty `id` and resolve to it; while closed the attribute MUST be absent rather than pointing at a non-existent id. [radix]
- [ ] `menubar.roles.9` Given a menubar using roving tabindex, then exactly one trigger MUST have `tabindex="0"` — the first by default — and every other item in the whole widget MUST have `tabindex="-1"`; no item MUST have a positive `tabindex`. [apg, axe, kobalte, base-ui]
- [ ] `menubar.roles.10` Given `ul`/`li` markup for a menubar, then every direct `li` child of the menubar and of every menu MUST carry `role="none"`, except separators; the item role sits on the interactive element (`a` for navigation menubars, `span`/`li` in the editor example). [apg]
- [ ] `menubar.roles.11` Given groups of `menuitemradio` items inside a menubar menu, then each group MUST be wrapped in `role="group"` carrying `aria-label`, with `role="separator"` elements between groups. [apg]
- [ ] `menubar.roles.12` Given every submenu `menu` in a menubar, then it MUST carry `tabindex="-1"` and `aria-label`. [apg]
- [ ] `menubar.roles.13` Given menu items in a menubar that are not disabled, then the APG editor example writes `aria-disabled="false"` explicitly rather than omitting it. [apg] (candidate)
- [ ] `menubar.roles.14` Given a menubar whose menus are portaled inside the menubar element, then the ownership link MUST be published as a `span[aria-owns]` with `role="group"` naming the portal container's id, so the portal is an allowed `menubar` child; when the portal renders outside the menubar the span MUST carry no role, so no stray accessible group is added. [base-ui] (candidate)
- [ ] `menubar.roles.15` Given an open menubar menu, then the menubar element MUST expose a has-open-submenu style hook while any of its menus is open. [base-ui] (candidate)
- [ ] `menubar.roles.16` Given a fresh menubar, then no trigger MUST carry the highlighted style hook until focus or hover reaches one. [kobalte] (candidate)
- [ ] `menubar.roles.17` Given `role="menubar"`, then it MUST own at least one of `group`, `menuitemradio`, `menuitem`, `menuitemcheckbox`, `menu` or `separator` (critical impact); children outside that set fail with "Element has children which are not allowed", and an entirely empty menubar is reported as incomplete. [axe]
- [ ] `menubar.roles.18` Given `role="menubar"` in the axe role table, then it is composite, its superclass is `menu`, and its role-specific allowed attributes are `aria-activedescendant`, `aria-expanded` and `aria-orientation`. [axe]
- [ ] `menubar.roles.19` Given `role="separator"` in the axe role table, then `aria-valuenow` is listed as required, which is meant for a focusable separator; a non-focusable menu separator omitting it is still flagged at critical impact, so the suite MUST decide deliberately whether to set it. [axe]
- [ ] `menubar.roles.20` Given `role="group"` in a menubar, then in the axe role table it is a structure role whose role-specific allowed attributes are `aria-activedescendant` and `aria-expanded`, with no required owned elements and no required name. [axe]
- [ ] `menubar.roles.21` Given every menu item role in a menubar, then the naming, required-parent, required-attribute and nested-interactive rules recorded for `menu` apply identically. [axe]

### Keyboard

- [ ] `menubar.keyboard.1` Given Tab moving focus into a menubar for the first time, then focus MUST land on the first menuitem; a menubar that has previously contained focus MAY restore the item that last had focus, otherwise the first item that is not disabled. [apg, base-ui]
- [ ] `menubar.keyboard.2` Given focus landing on a menubar trigger, then its menu MUST NOT open: focus highlights without expanding. [apg, kobalte, base-ui, radix]
- [ ] `menubar.keyboard.3` Given focus on a menubar item, when Tab or Shift+Tab is pressed, then focus MUST move out of the menubar, every menu and submenu MUST close, and the handler MUST NOT `preventDefault` Tab so the default behavior proceeds. [apg, bits]
- [ ] `menubar.keyboard.4` Given focus in a horizontal menubar with all menus closed, when ArrowRight is pressed, then focus MUST move to the next trigger, and ArrowLeft to the previous one, carrying the roving `tabindex="0"` with it. [apg, ariakit, radix, base-ui, kobalte, bits]
- [ ] `menubar.keyboard.5` Divergence: horizontal arrow keys wrap at the ends of the menubar by default — ArrowRight on the last trigger goes to the first and ArrowLeft on the first goes to the last. [apg, kobalte, bits] (decision needed)
- [ ] `menubar.keyboard.6` Divergence: horizontal arrow keys clamp at the ends unless a loop option is turned on, and with it on they wrap, including while a menu is open. [radix, base-ui] (decision needed)
- [ ] `menubar.keyboard.7` Given focus anywhere in the menubar, when Home is pressed, then focus MUST move to the first trigger and End to the last; the APG examples map PageUp to Home and PageDown to End. [apg, base-ui]
- [ ] `menubar.keyboard.8` Given focus on a menubar trigger, when Enter or Space is pressed, then its menu MUST open with focus on its first item; pressing the key again on that trigger MUST close it and return focus to the trigger. [apg, ariakit, base-ui]
- [ ] `menubar.keyboard.9` Given focus on a menubar trigger in a horizontal menubar, when ArrowDown is pressed, then its menu MUST open with focus on its first item; ArrowUp MAY open it with focus on its last item (APG marks ArrowUp optional but its own tests require it). [apg, kobalte, bits]
- [ ] `menubar.keyboard.10` Given a vertical menubar, then the roles swap: ArrowDown and ArrowUp move between triggers while ArrowRight opens a menu and ArrowLeft closes it, returning focus to the trigger. [apg, ariakit]
- [ ] `menubar.keyboard.11` Given a menubar with one menu already open, when ArrowRight or ArrowLeft is pressed — from the menu container, from a plain item, or from a text field at its caret edge — then the adjacent trigger MUST take focus, the previous menu MUST close, and the newly focused trigger's popup MUST open (a `menu` or a `dialog` depending on the item). [apg, ariakit, radix, base-ui, kobalte, bits]
- [ ] `menubar.keyboard.12` Divergence: the newly opened menubar menu SHOULD be opened without moving focus into it (APG's recommendation; it MAY instead focus its first item). [apg] (decision needed)
- [ ] `menubar.keyboard.13` Divergence: the newly opened menubar menu takes focus, so the switch lands inside the new menu. [radix, base-ui, kobalte, ariakit] (decision needed)
- [ ] `menubar.keyboard.14` Given a menubar menu with open submenus, when the horizontal switch key is pressed, then every open submenu MUST close along with its parent menu before the next menubar menu opens, and each level's close callback MUST report `false`. [apg, base-ui, radix]
- [ ] `menubar.keyboard.15` Given focus on a submenu trigger inside a menubar menu, when ArrowRight, Enter or Space is pressed, then that submenu MUST open with its first item focused; ArrowLeft MUST close it and return focus to the submenu trigger. [apg, radix, base-ui, kobalte, ariakit]
- [ ] `menubar.keyboard.16` Given a submenu trigger inside a menubar menu, when it is merely focused, then the submenu MUST stay closed. [radix]
- [ ] `menubar.keyboard.17` Given a submenu opened with the pointer, when ArrowRight is pressed on its trigger, then focus MUST move to the submenu's first item. [radix]
- [ ] `menubar.keyboard.18` Given two nested submenus open in a menubar menu, when ArrowLeft is pressed on an item in the deepest one, then only that level MUST close, leaving its trigger and the root items in place; walking out again with ArrowLeft MUST return to the first menubar menu. [apg, radix]
- [ ] `menubar.keyboard.19` Given focus inside a menubar menu, then ArrowDown and ArrowUp MUST move within that menu only, wrapping from last to first without crossing into another menu, and Home and End MUST move to that menu's first and last item. [apg, ariakit, base-ui, kobalte]
- [ ] `menubar.keyboard.20` Given focus on a top-level menubar item, when a printable character is typed, then focus MUST move to the next top-level item whose label starts with that character, searching cyclically and staying put when nothing matches; the search MUST be scoped to top-level items only and MUST NOT move focus into a submenu. [apg]
- [ ] `menubar.keyboard.21` Given focus inside an open menubar menu or submenu, then typeahead MUST be scoped to that menu: a prefix matching an item in a parent menu MUST NOT move focus there, while the same prefix typed in the active menu MUST match. [apg, radix]
- [ ] `menubar.keyboard.22` Given typeahead started on a menubar trigger whose menu is open, then after Shift+Tab returns focus to the trigger the search MUST keep targeting items inside the open menu. [ariakit] (candidate)
- [ ] `menubar.keyboard.23` Given an open menubar menu, when Shift+Tab moves focus back to its trigger, then the menu MUST stay open and Enter or Space from there MUST close it. [ariakit] (candidate)
- [ ] `menubar.keyboard.24` Given a reopened submenu, when Shift+Tab is pressed, then focus MUST return to the parent menu with the submenu trigger as the active item while both menus stay visible, and a following ArrowDown MUST close the submenu and move to the next parent item. [ariakit] (candidate)
- [ ] `menubar.keyboard.25` Given a leaf menuitem in a menubar menu, when Enter is pressed, then its action MUST be performed, the menu MUST close and focus MUST return to the associated menubar trigger. [apg, bits, reka]
- [ ] `menubar.keyboard.26` Given a `menuitemradio` or `menuitemcheckbox` in a menubar menu, when Space is pressed, then its state MUST change, the menu MUST stay open and focus MUST stay on that item; Enter on the same item MUST close the menu. For a plain leaf `menuitem`, Space behaves like Enter. [apg]
- [ ] `menubar.keyboard.27` Divergence: Escape inside an open menubar menu or submenu closes only the immediate level, returning focus one level up rather than all the way to the root. [apg] (decision needed)
- [ ] `menubar.keyboard.28` Divergence: Escape anywhere in the stack closes every open menu and returns focus to the menubar trigger; after it, hovering another trigger no longer opens that menu. [radix, ariakit, base-ui, bits] (decision needed)
- [ ] `menubar.keyboard.29` Given a navigation menubar in an expanded mode, then ArrowLeft and ArrowRight at the top level MUST also open the newly focused trigger's menu, so the user flips through menus with their dropdowns staying open. [apg, ariakit]
- [ ] `menubar.keyboard.30` Given a navigation menubar item that both performs an action and opens a submenu, then Enter and Space SHOULD perform the navigation while ArrowDown opens the submenu; the APG advises avoiding this design altogether. [apg]
- [ ] `menubar.keyboard.31` Given ArrowRight pressed on a leaf item inside a nested popout in a navigation menubar, then every popout MUST be closed before focus advances, not only the immediate level. [apg] (candidate)
- [ ] `menubar.keyboard.32` Given a leaf navigation menuitem activated in a navigation menubar, then all menus MUST close and DOM focus MUST move to the newly loaded content heading, made focusable with `tabindex="-1"` first. [apg] (candidate)
- [ ] `menubar.keyboard.33` Given a menubar menu opened by mouse click, then keyboard navigation MUST work from there: ArrowDown walks the items and ArrowRight switches to the next menu. [base-ui, ariakit]
- [ ] `menubar.keyboard.34` Given a headless control that synthesizes activation, then the HTML spec defines no Enter or Space key binding for buttons: key activation is a user-agent convention the library MUST implement itself. [html]

### Pointer

- [ ] `menubar.pointer.1` Given a menubar with nothing open, when the pointer moves over a trigger, then nothing MUST happen: hover-to-open MUST be gated on a menu already being open or the menubar already having focus, and the roving tab stop MUST NOT move. [apg, ariakit, radix, base-ui, kobalte]
- [ ] `menubar.pointer.2` Given a menubar with one menu already open, when the pointer moves over a different trigger, then the open menu MUST close and the hovered trigger's menu MUST open; repeating MUST keep switching. The newly opened menu's first item MUST NOT be focused. [apg, ariakit, radix, base-ui]
- [ ] `menubar.pointer.3` Given a menubar menu open with a nested submenu also open, when another trigger is hovered, then that trigger's menu MUST open and both the previous menu and its submenu MUST unmount. [base-ui, ariakit]
- [ ] `menubar.pointer.4` Given a menubar trigger, when it is clicked, then its menu MUST open; clicking the same trigger again MUST close it; clicking a different trigger MUST switch the open menu, unmounting the previous menu's content. [ariakit, radix, base-ui, kobalte, reka, bits]
- [ ] `menubar.pointer.5` Given a menubar menu opened by click, then the popup element MUST take focus with no item active; the first item is reached only by pressing ArrowDown. [ariakit, kobalte]
- [ ] `menubar.pointer.6` Given a hover-driven navigation menubar, then hovering triggers MUST open and close their menus without moving DOM focus off `body`, and hovering outside MUST close the open menu. [ariakit] (candidate)
- [ ] `menubar.pointer.7` Given a menubar menu open by click, when a synthetic `pointerout` fires at the trigger's corner, then the menu MUST stay open. [radix] (candidate)
- [ ] `menubar.pointer.8` Given a submenu trigger inside an open menubar menu, when it is hovered, then the submenu MUST open; moving into the submenu and back onto its own trigger MUST keep it open; moving to any other item in the parent menu — plain, disabled, another submenu trigger or a disabled submenu trigger — MUST close it. [apg, radix, base-ui]
- [ ] `menubar.pointer.9` Given nested submenus open in a menubar menu, when the pointer moves back to the first submenu trigger, then the deeper unassociated submenu MUST close while the first submenu stays open. [radix]
- [ ] `menubar.pointer.10` Given a menubar, then submenu open and close MUST be synchronous with no hover-intent timers; neither APG menubar example uses a timeout. [apg] (candidate)
- [ ] `menubar.pointer.11` Given a leaf menuitem in a menubar menu, when it is clicked, then its action MUST be performed and every open menu MUST close — click always closes everything, unlike Escape which may close one level. [apg, radix, reka]
- [ ] `menubar.pointer.12` Given a parent menuitem in a menubar menu, when it is clicked, then its submenu MUST toggle open or closed, and the sub trigger's select handler MUST fire. [apg, kobalte, bits]
- [ ] `menubar.pointer.13` Given a nested item marked not to close on click, then clicking it MUST leave its submenu open, whether the parent menu was opened by click or by hover. [base-ui] (candidate)
- [ ] `menubar.pointer.14` Given a menubar menu opened by focus, then a touch `click` arriving inside the 300ms cooldown started by that focus-open MUST be ignored; one after the cooldown MUST close the menu. [base-ui] (candidate)
- [ ] `menubar.pointer.15` Given a menubar where a trigger's menu was opened by click, closed by clicking the same trigger, then reopened from another trigger, then hovering a trigger MUST still open its menu — the hover path MUST NOT be left disabled by the click sequence. [base-ui] (candidate)
- [ ] `menubar.pointer.16` Given menu items that are links in a navigation menubar, then clicking one MUST navigate and the menu MUST close (Ariakit's hash-only first click leaves it open); Escape MUST close the menu and focus the trigger, and Enter from there MUST NOT reopen it. [ariakit] (candidate)
- [ ] `menubar.pointer.17` Given `element.click()`, then it MUST return early for a disabled form control or a click already in progress on that element, and otherwise fire an untrusted `click`; activation is always caused by a `click` event, and a non-pointer trigger's default action MUST be to fire one. [html]

### Focus management

- [ ] `menubar.focus.1` Given a menubar, then it MUST occupy exactly one stop in the page tab sequence, with arrow keys moving focus among its items. [apg, axe, kobalte, base-ui]
- [ ] `menubar.focus.2` Given a menubar receiving focus, then focus MUST be placed on the first item — the "first element" tab-stop convention it shares with toolbar, distinct from the "selected element" convention used by radio group, tabs, listbox and tree. [apg]
- [ ] `menubar.focus.3` Given a menubar using roving tabindex, then moving focus MUST set `tabindex="-1"` on the previous holder, set `tabindex="0"` on the new target, and only then call `focus()` on it, in that order. [apg, kobalte]
- [ ] `menubar.focus.4` Given a menubar that loses focus, then if the design calls for a specific item next time, that item's `tabindex` MUST be set to `0` and the previous holder's to `-1` before the composite loses focus. [apg] (candidate)
- [ ] `menubar.focus.5` Given focus moving to a menubar item, then every open popup that does NOT contain the target MUST be closed while the target's own ancestor chain stays open. [apg] (candidate)
- [ ] `menubar.focus.6` Given a menubar whose first trigger is disabled, then that trigger MUST carry `tabindex="-1"` and the next enabled trigger MUST carry `tabindex="0"`, so Tab still reaches the menubar. [base-ui] (candidate)
- [ ] `menubar.focus.7` Given a menubar menu closed with Escape, then focus MUST return to that menu's own trigger. [bits, ariakit, radix]
- [ ] `menubar.focus.8` Given a triggerless menubar menu with a kept-mounted portal, when an outside element is clicked, then the popup MUST lose its open state and focus MUST stay on the outside target rather than being pulled back. [base-ui] (candidate)
- [ ] `menubar.focus.9` Given a menu store shared across menubar items, then navigating away and returning MUST reopen the menu with focus on the menubar item rather than replaying a stale container-focus request. [ariakit] (candidate)

### State

- [ ] `menubar.state.1` Given a menubar, then at most one top-level menu MUST be open at a time: opening one MUST set its trigger's `aria-expanded` to `"true"` and every other trigger's to `"false"`. [apg, radix, base-ui, kobalte]
- [ ] `menubar.state.2` Given an ancestor chain of open menus, then closing other popups MUST NOT close the ancestors of the newly focused item. [apg] (candidate)
- [ ] `menubar.state.3` Given `menuitemcheckbox` items in a menubar menu group, then more than one MAY be checked at once and toggling one MUST NOT change the others; in a `menuitemradio` group exactly one MUST be `aria-checked="true"` and the rest `"false"`. [apg, radix]
- [ ] `menubar.state.4` Given each menubar menu with an open-change callback, then opening it MUST call that menu's callback once with `true` and closing it MUST call it again with `false`. [bits, base-ui]
- [ ] `menubar.state.5` Given a menu whose plain menuitems act as increment and decrement commands over a radio group, then reaching the smallest or largest option MUST set `aria-disabled="true"` on the corresponding command item. [apg] (candidate)
- [ ] `menubar.state.6` Given an orientation left unset, then `menubar` MUST default to horizontal and `menu` to vertical, and the key handler MUST branch on the computed orientation rather than on the attribute's presence. [apg]
- [ ] `menubar.state.7` Given a disabled menubar, then its triggers MUST carry `disabled`, Tab MUST NOT reach them, clicking MUST NOT open a menu, and items in an already-open menu MUST be `aria-disabled="true"` and not activatable. [base-ui] (candidate)

### Dismissal and layering

- [ ] `menubar.dismissal.1` Given an open menubar, when the pointer presses down outside the whole menubar, then every open popup MUST close; the APG examples listen for `pointerdown` on `window` in the capture phase. [apg, radix, base-ui, kobalte]
- [ ] `menubar.dismissal.2` Given an open menubar menu, when an item in any level is clicked, then every open menu MUST close. [apg, radix, reka]
- [ ] `menubar.dismissal.3` Given a menu closed by Enter, Space, Escape or Tab, then the close MUST be immediate and forced, bypassing hover and focus guards. [apg]
- [ ] `menubar.dismissal.4` Given an outside press whose later mouse events are swallowed by another overlay, then the open menubar menu MUST still close on the initial press. [radix] (candidate)
- [ ] `menubar.dismissal.5` Given a menubar menu open with a submenu, when a single outside touch press lands, then both the submenu and the menu MUST close. [base-ui] (candidate)
- [ ] `menubar.dismissal.6` Given a modal menubar, then a touch-opened menu that spans the viewport width MUST scroll-lock the document while a narrower one MUST NOT, and handing off from a wide menu to a narrow one MUST release the lock. [base-ui] (candidate)
- [ ] `menubar.dismissal.7` Given nested submenus as popovers, then the topmost-popover-ancestor algorithm MUST walk both DOM nesting and `popovertarget` invoker relationships, so a submenu popover opened from inside a parent popover counts as its descendant. [html]
- [ ] `menubar.dismissal.8` Given a menubar menu implemented with the `popover` attribute, then `popover="auto"` is the correct state: opening one auto popover closes the others, it has light dismiss and responds to close requests, and light dismiss MUST close popovers down to but not including the nearest open ancestor popover of the clicked element. [html]
- [ ] `menubar.dismissal.9` Given a menubar trigger with `popovertarget`, then the invoker MUST be a button, MUST NOT be disabled and MUST NOT be a submit button with a form owner, or the target resolves to null; the popover's implicit anchor MUST be set to that invoker. [html]
- [ ] `menubar.dismissal.10` Given a modal dialog opened while a menubar menu popover is open, then `show()` and `showModal()` MUST hide popovers up to the topmost popover ancestor before focusing the dialog. [html]
- [ ] `menubar.dismissal.11` Given a hover-driven menu whose pointer leaves, then a delayed close MUST be scheduled and MUST be cancellable if hover or focus returns; the APG toolbar font menu uses 300ms and defers a close while the pointer or focus is still inside. [apg]

### Positioning

- [ ] `menubar.positioning.1` Given a menu in a horizontal menubar, then its default side MUST be below the trigger; in a vertical menubar the default side MUST be the inline end. [base-ui] (candidate)
- [ ] `menubar.positioning.2` Given a menu in a vertical menubar, then it MUST be placed beside its menubar item, an explicit placement MUST win (including in RTL), and a submenu MUST follow its parent menu rather than the menubar. [ariakit] (candidate)
- [ ] `menubar.positioning.3` Given portaled menubar content, then every keyboard-navigation assertion MUST hold identically to the non-portaled case. [radix] (candidate)

### Animation and presence

- [ ] `menubar.animation.1` Given a menubar menu that closes because another menu opened or because of an outside click, then its content MUST be unmounted rather than hidden. [kobalte] (candidate)

### RTL and i18n

- [ ] `menubar.rtl.1` Given a right-to-left menubar, then the horizontal keys mirror: ArrowLeft is "next" and ArrowRight is "previous" for roving focus, open-menu switching, the end boundaries and any loop wrapping. [radix, ariakit]
- [ ] `menubar.rtl.2` Given a right-to-left menubar menu, then the submenu open and close keys swap: ArrowLeft opens the submenu with its first item focused and ArrowRight closes it, leaving the parent menu open. [radix, ariakit]
- [ ] `menubar.rtl.3` Given a vertical right-to-left menubar, then ArrowLeft on a trigger opens its menu and ArrowRight closes it; ArrowDown and ArrowUp from the menu container or a horizontal menu item move to the next or previous trigger, opening its menu and hiding the previous one. [ariakit] (candidate)

### Accessibility tooling

- [ ] `menubar.a11y-tooling.1` Given a menubar closed and with its first menu open, when axe runs over the container, then there MUST be no violations. [axe, reka]
- [ ] `menubar.a11y-tooling.2` Given a scrollable menubar overflow container, then it MUST contain a focusable element or be focusable itself. [axe]
- [ ] `menubar.a11y-tooling.3` Given any element with a `role` in a menubar, then the role MUST be valid, non-abstract and not deprecated, every ARIA attribute on it MUST be allowed for that role and host element, and all required attributes MUST be present; `aria-*` names and values MUST be valid, unresolved id references reported as incomplete, and referenced ids MUST be unique. [axe]
- [ ] `menubar.a11y-tooling.4` Given `role="presentation"`/`role="none"` in a menubar, then the element MUST NOT also be focusable or carry a global ARIA attribute, and MUST NOT carry `aria-label` or `aria-labelledby`. [axe]
- [ ] `menubar.a11y-tooling.5` Given an element with `aria-hidden="true"` in a menubar, then neither it nor any descendant MUST be focusable; only the outermost such element is tested. [axe]
- [ ] `menubar.a11y-tooling.6` Given `aria-brailleroledescription` or `aria-braillelabel`, then a non-braille equivalent MUST exist. [axe]
- [ ] `menubar.a11y-tooling.7` Given a clickable menubar item, then its touch target SHOULD be at least 24 by 24 CSS pixels or leave sufficient space from its neighbors; the axe rule ships disabled and MUST be enabled explicitly. [axe]

### Notes and edge cases

- [ ] `menubar.notes.1` Given a menubar, then it is typically horizontal and offers quick access to a consistent set of commands — the web equivalent of a desktop application's window menu bar. [apg]
- [ ] `menubar.notes.2` Given a navigation menubar, then three container kinds must be distinguished — the menubar itself, a depth-one popup, and a deeper popout — because the horizontal arrow behavior differs between popup and popout. [apg] (candidate)
- [ ] `menubar.notes.3` Given a menubar built by discovering its own structure, then the APG examples walk the DOM from the root, derive each menu's id from its role plus normalized `aria-label`, collect per-menu first-character tables and first/last item references, and register any item with `aria-haspopup="true"` as a popup owner. [apg] (candidate)
- [ ] `menubar.notes.4` Given a menubar of links, then the APG example wraps it in landmark structure — a `header` with `role="banner"`, a `nav` with `aria-label`, a `section` with `aria-labelledby`, a `footer` with `role="contentinfo"` — and asserts each. [apg] (candidate)
- [ ] `menubar.notes.5` Given a menubar part rendered with no menubar ancestor, then it MUST throw an error naming the missing menubar. [base-ui] (candidate)
- [ ] `menubar.notes.6` Given every menubar part, then it MUST forward unconsumed props and refs to the element it renders, merge class names and inline styles, support a render/`asChild` escape hatch that preserves the part's role and state attributes, and compose the author's handlers with its own. [radix, base-ui]
- [ ] `menubar.notes.7` Given menubar content wrapped in a portal, then test queries MUST be document-wide: a query scoped to the menubar root finds nothing. [kobalte] (candidate)
- [ ] `menubar.notes.8` Given Radix's roving focus, then it moves the tab stop inside a `setTimeout`, which is why its boundary assertions use the boundary key rather than an immediate read. [radix] (candidate)
- [ ] `menubar.notes.9` Given a jsdom menubar test, then a `PointerEvent` shim plus fake timers does make menu behavior testable; kobalte's whole menubar suite is skipped on the belief that it is not, and additionally uses the deprecated `fireEvent.keyPress`, which does not trigger `keydown` handlers. [kobalte] (candidate)

## Sources

- `docs/research/apg-and-axe.md` — `## menubar` (aria-practices menu-and-menubar pattern, the menubar-navigation and menubar-editor examples and their regression tests, the keyboard-interface practice, WHATWG HTML activation and popover sections, axe rules) → tags `apg`, `axe`, `html`.
- `docs/research/radix-and-base-ui.md` — `## menubar` → tags `radix`, `base-ui`.
- `docs/research/ariakit-and-headlessui.md` — `## menubar`, plus the menubar cases inside `## menu` → tag `ariakit`. Headless UI ships no menubar.
- `docs/research/kobalte-and-corvu.md` — `## menubar` → tag `kobalte`. Corvu ships no menubar.
- `docs/research/reka-melt-bits.md` — `## menubar` → tags `reka`, `bits`. Melt ships no menubar suite.
- Popup internals (item roles, vertical arrow keys, typeahead mechanics, submenu grace areas, checkbox and radio items, groups and labels) are specified once in `docs/spec/menu.md`.

## Deferred

- React Aria has no menubar component and Zag/Ark have no menubar section, so no `react-aria`, `zag` or `ark` tags appear here. Treat the multi-library counts accordingly.
- Kobalte's entire menubar suite is `it.skip` with a stale "jsdom has no pointer events" comment, so every `kobalte` tag in this file is an intended contract rather than an asserted one. Recorded because it is the most complete written statement of kobalte's menu semantics.
- Prop-spreading, `asChild`/`render` and `describeConformance` assertions (`menubar.notes.6`) are adapter surface covered by the harness rather than per-bullet tests.
- Base UI's detached-trigger and shared-handle menubar shapes are exercised for every behavior in its suite; the bullets here state the behavior once and leave the trigger topology to the same deferral recorded in `menu.md`.
- No source tests menubar SSR/hydration or any `Forms` concern, so those subsections are absent.
- Unresolved: whether horizontal arrows wrap at the menubar ends by default (`menubar.keyboard.5` vs `menubar.keyboard.6`), whether switching menus with an arrow key moves focus into the newly opened menu (`menubar.keyboard.12` vs `menubar.keyboard.13`), and whether Escape closes one level or the whole stack (`menubar.keyboard.27` vs `menubar.keyboard.28`).
