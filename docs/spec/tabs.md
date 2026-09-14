# tabs

## tabs

### Roles and attributes

- [ ] `tabs.roles.1` Given the container for a set of tabs, then it has `role="tablist"`. [apg, radix, base-ui, zag, ark, kobalte, reka, melt, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.roles.2` Given each tab, then it has `role="tab"` and is contained within the `tablist` element. [apg, axe, radix, base-ui, zag, ark, kobalte, reka, melt, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.roles.3` Given each content panel, then it has `role="tabpanel"`. [apg, radix, base-ui, zag, ark, kobalte, reka, bits, react-aria]
- [ ] `tabs.roles.4` Given a tablist with a visible label, then the `tablist` has `aria-labelledby` referencing it; otherwise `aria-label` supplies the name. [apg, base-ui, zag, react-aria]
- [ ] `tabs.roles.5` Given each tab, then it has `aria-controls` referencing the id of its `tabpanel`. [apg, base-ui, zag, ark, kobalte, reka, bits, react-aria]
- [ ] `tabs.roles.6` Given each `tabpanel`, then it has `aria-labelledby` referencing the id of its `tab`. [apg, base-ui, zag, ark, kobalte, bits, react-aria]
- [ ] `tabs.roles.7` Given a tabs widget, then exactly one tab has `aria-selected="true"` and every other tab has `aria-selected="false"`. [apg, base-ui, zag, ark, kobalte, react-aria, ariakit]
- [ ] `tabs.roles.8` Given a tab with an associated popup menu, then it has `aria-haspopup` set to `menu` or `true`. [apg]
- [ ] `tabs.roles.9` Given a vertically oriented tablist, then it has `aria-orientation="vertical"`; `horizontal` is the role's default. [apg, base-ui, zag, kobalte, react-aria]
- [ ] `tabs.roles.10` Given a `role="tab"` element, then all of its descendants are forced presentational by the user agent, so a heading or image inside a tab label is not exposed. [apg]
- [ ] `tabs.roles.11` Given `ul`/`li` markup reused as a tablist, then each intervening `li` carries `role="presentation"` so the tablist-to-tab parent relationship survives, and it is neither focusable nor carrying a global ARIA attribute. [apg, axe]
- [ ] `tabs.roles.12` Given the APG examples, then `role="tablist"` sits on a `div` and each `role="tab"` sits on a native `button`, proving the pattern is tag-agnostic. [apg]
- [ ] `tabs.roles.13` Given a tab rendered as a button, then `type="button"` is set by default, is not overwritten when the author already supplied a `type`, and is not added when the resolved element is not a button. [headlessui, zag]
- [ ] `tabs.roles.14` Given tabs and panels declared in different DOM orders, then each panel's `aria-labelledby` is the id of the tab with the matching `value` and each tab's `aria-controls` is the id of the panel with the matching `value`, not the one at the same index. [base-ui, react-aria]
- [ ] `tabs.roles.15` Given a tabs widget with no `value` or `defaultValue`, then the first tab is still wired to the first panel by `aria-controls`/`aria-labelledby`. [base-ui]
- [ ] `tabs.roles.16` Divergence: given a tab whose panel is not mounted, then the tab has no `aria-controls` at all, and `aria-controls` appears on the newly selected tab as its panel mounts. [base-ui, zag, reka] (decision needed)
- [ ] `tabs.roles.17` Divergence: given every tab, then both `tabindex` and `aria-selected` are always present and every tab carries `aria-controls`, whether or not its panel is currently rendered. [apg, kobalte, bits] (decision needed)
- [ ] `tabs.roles.18` Divergence: given a horizontal tablist, then `aria-orientation="horizontal"` is written explicitly. [zag, kobalte, react-aria] (decision needed)
- [ ] `tabs.roles.19` Divergence: given a horizontal tablist, then no `aria-orientation` attribute is emitted at all, since `horizontal` is the role default. [base-ui] (decision needed)
- [ ] `tabs.roles.20` Given a disabled tab, then it carries `aria-disabled="true"`, plus `data-disabled` and the native `disabled` attribute when the element is a button. [zag, ark, react-aria, base-ui]
- [ ] `tabs.roles.21` Given the whole tabs widget is disabled, then every tab reports as disabled. [react-aria, kobalte]
- [ ] `tabs.roles.22` Given a tab rendered as a link (`nativeButton={false}`, a router `Link`, or an `as`/`render` anchor), then the element is an `a` with the supplied `href` and still carries `role="tab"` and moves `aria-selected` on activation. [base-ui, react-aria]
- [ ] `tabs.roles.23` Given the selected tab, then the root and each part expose the current orientation as `data-orientation` and selection as `data-state="active"` / `data-selected`. [radix, base-ui, zag, ark]
- [ ] `tabs.roles.24` Given a tab trigger, then it exposes its own value as `data-value` and its owning list as `data-ownedby`. [zag, ark]
- [ ] `tabs.roles.25` Given each part, then it carries a stable per-part data attribute for styling and for test selectors: `data-scope="tabs"` plus `data-part="root|list|trigger|content|indicator"`. [zag, ark]
- [ ] `tabs.roles.26` Given each part, then it carries `data-tabs-root`, `data-tabs-list`, `data-tabs-trigger` and `data-tabs-content` respectively. [bits] (candidate)
- [ ] `tabs.roles.27` Given a panel, then it exposes its index as `data-index`. [base-ui] (candidate)
- [ ] `tabs.roles.28` Given a tab with an explicit `aria-label`, `aria-labelledby`, `aria-describedby` or `aria-details`, then the attribute lands verbatim on the tab element. [react-aria]
- [ ] `tabs.roles.29` Given a tab panel with an explicit `aria-label`, then it carries that `aria-label` and no generated `aria-labelledby`; without one it keeps the generated `aria-labelledby` pointing at its tab. [ariakit] (candidate)
- [ ] `tabs.roles.30` Given two tabs widgets on one page, then their generated tab and panel ids do not collide. [react-aria, reka]
- [ ] `tabs.roles.31` Given the whole tabs widget is disabled or the root is focused, then the root and list expose `data-focus` while the widget holds focus. [zag, ark] (candidate)
- [ ] `tabs.roles.32` Given tabs whose values are not strings, then values of any type work as identities: numbers, strings, plain objects, functions, `Symbol`s and `RegExp`s each pair their own tab and panel. [base-ui, reka]

### Keyboard

- [ ] `tabs.keyboard.1` Given focus moves into the tab list with Tab, then focus lands on the active tab, not on the first tab. [apg, kobalte, react-aria, headlessui]
- [ ] `tabs.keyboard.2` Given focus is inside the tab list, when Tab is pressed, then focus leaves the tablist for the next element in the page tab sequence, so the whole tab list occupies exactly one stop in that sequence. [apg, base-ui, bits]
- [ ] `tabs.keyboard.3` Given focus on a tab in a horizontal tab list, when Right Arrow is pressed, then focus moves to the next tab, wrapping from the last tab to the first. [apg, radix, base-ui, zag, ark, kobalte, reka, melt, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.keyboard.4` Given focus on a tab in a horizontal tab list, when Left Arrow is pressed, then focus moves to the previous tab, wrapping from the first tab to the last. [apg, radix, base-ui, zag, ark, kobalte, reka, melt, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.keyboard.5` Given a tablist with `aria-orientation="vertical"`, then Down Arrow behaves as Right Arrow and Up Arrow behaves as Left Arrow. [apg, base-ui, zag, ark, kobalte, bits, react-aria, headlessui]
- [ ] `tabs.keyboard.6` Given a horizontal tablist, then it does not listen for Up Arrow or Down Arrow, so those keys keep their normal page-scrolling behavior while focus is inside the tab list. [apg, zag, kobalte, headlessui]
- [ ] `tabs.keyboard.7` Given a vertical tablist, then Left Arrow and Right Arrow are ignored. [zag, kobalte, headlessui]
- [ ] `tabs.keyboard.8` Divergence: given a vertical tablist, when Left Arrow or Right Arrow is pressed, then selection still moves as if the list were horizontal. [react-aria] (decision needed)
- [ ] `tabs.keyboard.9` Given focus on a tab, when Home is pressed, then focus moves to the first tab; APG marks this Optional. [apg, base-ui, zag, ark, kobalte, react-aria, headlessui]
- [ ] `tabs.keyboard.10` Given focus on a tab, when End is pressed, then focus moves to the last tab; APG marks this Optional. [apg, base-ui, zag, ark, kobalte, react-aria, headlessui]
- [ ] `tabs.keyboard.11` Given focus on a tab, when Page Up or Page Down is pressed, then focus goes to the first or last focusable tab respectively, the same as Home and End. [headlessui] (candidate)
- [ ] `tabs.keyboard.12` Given automatic activation, when Right Arrow, Left Arrow, Home or End moves focus, then the newly focused tab becomes `aria-selected="true"` and its panel is displayed in the same step. [apg, base-ui, zag, ark, kobalte, reka, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.keyboard.13` Given manual activation, when an arrow key, Home or End moves focus, then only focus moves: the newly focused tab's panel stays hidden, `aria-selected` does not change, and no change event fires for the whole navigation sequence. [apg, radix, base-ui, zag, ark, kobalte, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.keyboard.14` Given manual activation and a focused unselected tab, when Enter is pressed, then that tab becomes `aria-selected="true"`, its panel is displayed, and the change event fires exactly once. [apg, base-ui, zag, ark, kobalte, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.keyboard.15` Given manual activation and a focused unselected tab, when Space is pressed, then that tab becomes `aria-selected="true"` and its panel is displayed. [apg, base-ui, kobalte, react-aria, ariakit, headlessui]
- [ ] `tabs.keyboard.16` Given loop is disabled (`loop`/`loopFocus`/`loopFocus={false}`), when the next-item key is pressed on the last tab or the previous-item key on the first, then focus stays put and does not wrap. [base-ui, zag, ark, bits]
- [ ] `tabs.keyboard.17` Given a handled navigation key, then the handler calls `preventDefault()`, so the list's own `onKeyDown` sees `defaultPrevented === true`; keys the orientation does not map are left alone with `defaultPrevented === false`. [base-ui, zag, react-aria]
- [ ] `tabs.keyboard.18` Given any of Shift, Control, Alt or Meta is held, when a navigation key is pressed, then focus does not move and no selection change fires, although the list's `onKeyDown` still receives the event. [base-ui]
- [ ] `tabs.keyboard.19` Given a composition (IME) keydown, or a keydown whose target is outside the list, then the list key handler returns without navigating. [zag] (candidate)
- [ ] `tabs.keyboard.20` Given a tab with a nested focusable or editable descendant (an `input` inside the trigger, or one portaled out of it), when Space or Enter is typed into that descendant, then the tab is not activated; pressing the same keys on the trigger itself does activate it. [radix]
- [ ] `tabs.keyboard.21` Given a tab list inside a form that also contains a radio group, when Right Arrow is pressed on a tab, then focus moves to the next tab rather than into the radio items. [ariakit] (candidate)
- [ ] `tabs.keyboard.22` Given a panel containing a dialog, when Right Arrow is pressed on the tab list, then navigation still works. [headlessui] (candidate)
- [ ] `tabs.keyboard.23` [apg] Given a tab with an associated popup menu, when Shift + F10 is pressed, then that menu opens.
- [ ] `tabs.keyboard.24` [apg] Given a deletable tab, when Delete is pressed, then the tab and its panel may be closed, focus moves to the tab that followed the deleted tab, or to the preceding tab when the deleted tab was last; when the application allows every tab to be deleted, focus moves to another element that provides a logical work flow. The delete function should also be reachable from a context menu.
- [ ] `tabs.keyboard.25` [apg] Given a tabs widget whose panels display without noticeable latency, then automatic activation should be the default; given activating a tab triggers a network request or page refresh, then selection must not follow focus, because the per-arrow-press latency makes the widget unusable with a keyboard or screen reader.
- [ ] `tabs.keyboard.26` Given Ctrl+Page Up and Ctrl+Page Down, then the APG examples do not implement them. [apg]

### Pointer

- [ ] `tabs.pointer.1` Given a tab, when it is clicked, then it becomes selected, its panel is displayed, every other tab becomes `aria-selected="false"`, and the panel's `aria-controls`/`aria-labelledby` pair resolves to the clicked tab. [apg, radix, base-ui, zag, ark, kobalte, reka, bits, react-aria, ariakit, headlessui]
- [ ] `tabs.pointer.2` Given manual activation, then click still selects the tab, because manual activation only decouples selection from arrow-key focus movement, not from explicit activation. [apg, radix, base-ui, kobalte, bits, react-aria]
- [ ] `tabs.pointer.3` Given a clicked tab, then the roving `tabindex` moves to it exactly as for a keyboard move, so a later Tab into the tablist lands on the clicked tab. [apg, base-ui, react-aria]
- [ ] `tabs.pointer.4` Given a disabled tab, when it is clicked, then no change event fires, the previously selected panel stays visible, and the disabled tab does not take focus. [zag, ark, base-ui, kobalte, react-aria, headlessui]
- [ ] `tabs.pointer.5` Given a click with a non-primary button (`button: 2`), a modifier-held or middle click that would open a new tab, or an already-`defaultPrevented` event, then no selection happens. [base-ui, zag]
- [ ] `tabs.pointer.6` Given a held secondary-button press that focuses a tab under `activateOnFocus`, then no change event fires and `aria-selected` does not move; the suppression is released on `pointerup` or `pointercancel`, after which focus-driven activation works again. [base-ui] (candidate)
- [ ] `tabs.pointer.7` Divergence: given the already-selected tab is clicked, then the change event fires again with the same value (re-selecting the current tab is not deduplicated). [kobalte, react-aria] (decision needed)
- [ ] `tabs.pointer.8` Divergence: given the already-selected tab is clicked, then no change event fires. [base-ui] (decision needed)
- [ ] `tabs.pointer.9` Divergence: given manual activation, when `mousedown` with `button: 0` lands on a tab without the click completing, then the tab is already activated. [radix, base-ui] (decision needed)
- [ ] `tabs.pointer.10` Divergence: given link-backed tabs, when `mousedown` is followed by `mouseleave`/`mouseenter` without a completed click, then no navigation happens; navigation only fires on the full `mouseup` + `click` sequence. [react-aria] (decision needed)
- [ ] `tabs.pointer.11` Given Safari, when a tab trigger is clicked, then the implementation calls `focus()` on the trigger explicitly, because Safari does not move focus to buttons on mouse down. [zag] (safari-only)
- [ ] `tabs.pointer.12` Given a hovered tab, then `data-hovered` and the hover callbacks toggle; given every tab is disabled, hovering produces no hover state and no hover callbacks. [react-aria]
- [ ] `tabs.pointer.13` Given a tab pressed and released with the mouse, then `data-pressed` is set on press and cleared on release. [react-aria] (candidate)

### Focus management

- [ ] `tabs.focus.1` Given roving tabindex, then exactly one tab is Tab-reachable at a time and the rest carry `tabindex="-1"`; `tabindex="-1"` keeps an element programmatically and click focusable while removing it from the sequential focus order. [apg, html, base-ui, zag, ark, kobalte, bits, react-aria, ariakit]
- [ ] `tabs.focus.2` Divergence: given roving tabindex, then the selected tab has NO `tabindex` attribute at all rather than `tabindex="0"`; the APG examples call `removeAttribute('tabindex')`. [apg, ariakit] (decision needed)
- [ ] `tabs.focus.3` Divergence: given roving tabindex, then the selected tab carries an explicit `tabindex="0"` and every tab always has a `tabindex` attribute. [base-ui, zag, ark, kobalte, bits, react-aria] (decision needed)
- [ ] `tabs.focus.4` Given a tabpanel whose content has no focusable element, then the panel itself gets `tabindex="0"` so it enters the page tab sequence, and Tab from the selected tab lands on the panel; given the panel begins with a focusable element, then the panel has no `tabindex` and Tab lands on that element. [apg, kobalte, bits, react-aria, ariakit]
- [ ] `tabs.focus.5` Given a panel whose tabbable content changes when the selection changes (or when an `unmountOnHide` panel first mounts), then the panel gains `tabindex="0"` as it loses tabbable content and drops it again as it gains some. [ariakit, react-aria]
- [ ] `tabs.focus.6` Divergence: given a panel, then whether it is Tab-reachable is decided by probing the whole panel for focusable descendants. [apg, kobalte, react-aria, ariakit] (decision needed)
- [ ] `tabs.focus.7` Divergence: given a panel, then whether it is Tab-reachable is decided by whether its FIRST content is focusable, so a panel starting with text but containing a button later still takes focus itself; an author-supplied `tabindex={-1}` on the panel opts out and sends Tab into the panel's button instead. [bits] (decision needed)
- [ ] `tabs.focus.8` Divergence: given a panel, then it gets `tabIndex=0` unconditionally in composite mode and `tabIndex=-1` otherwise, with no probing. [zag, ark] (decision needed)
- [ ] `tabs.focus.9` Given focus on the first focusable element inside the active panel, when Shift+Tab is pressed, then focus returns to the selected tab. [bits]
- [ ] `tabs.focus.10` Given the whole tabs widget is disabled, when the user Tabs in, then focus skips the tablist entirely and lands on the tabpanel, which stays reachable. [kobalte, react-aria]
- [ ] `tabs.focus.11` Given the selected tab is changed programmatically, then the roving `tabindex` moves from the old selected tab (`-1`) to the new one (`0`). [base-ui, react-aria]
- [ ] `tabs.focus.12` Given focus is inside the tablist when the value changes externally, then the tab stop stays on the focused tab even though `aria-selected` moved, and the next arrow key continues from the focused tab; given focus is outside the tablist, the tab stop follows the newly selected tab. [base-ui] (candidate)
- [ ] `tabs.focus.13` Given a disabled tab is selected programmatically, then it becomes `aria-selected="true"` but keeps `tabindex="-1"`: a disabled tab never becomes the roving tab stop. [base-ui] (candidate)
- [ ] `tabs.focus.14` Given the selected tab is removed from the list, then the tab stop moves to a surviving tab (falling back to a focusable-when-disabled tab, skipping a `hidden` successor, and tracking that successor through further removals) so Tab into the list still works; when focus is inside the list, the tab stop stays on the focused tab. [base-ui] (candidate)
- [ ] `tabs.focus.15` Given a tab focused without activation, as a screen reader moves its reading cursor, then the previously selected tab stays selected and its panel stays visible. [ariakit, base-ui]
- [ ] `tabs.focus.16` Given a controlled selection changed from inside the tab list, then focus follows the newly selected tab and arrow keys continue from there; given the change came from a button outside the tab list, from inside a panel, or landed on a disabled tab, then focus does not move. [ariakit, base-ui]
- [ ] `tabs.focus.17` Given a focused `input` inside the active panel, when another tab is clicked, then the input's `onBlur` fires exactly once and the new panel becomes visible. [radix] (candidate)
- [ ] `tabs.focus.18` Given a tab trigger, when it receives focus, then the implementation records it as the focused value, and when focus leaves for an element whose role is not `tab`, the focused value is cleared. [zag, ark] (candidate)
- [ ] `tabs.focus.19` Given the imperative `focus()` method, then it focuses the trigger for the currently selected value and does nothing when no value is selected. [zag] (candidate)
- [ ] `tabs.focus.20` Given tabs rendered inside a popover or dialog, when the overlay opens, then the first tab receives focus and arrow keys move between tabs normally. [base-ui]
- [ ] `tabs.focus.21` Given a form control literally named `activeElement` in the same document, then focus still follows the selected tab. [ariakit] (candidate) (browser-only)
- [ ] `tabs.focus.22` Divergence: given arrow navigation reaches a disabled tab, then focus lands on the disabled tab without selecting it, and the next press continues past it; a natively `disabled` button is skipped in a single keypress instead. [base-ui, ariakit] (decision needed)
- [ ] `tabs.focus.23` Divergence: given arrow navigation reaches a disabled tab, then it is skipped outright and selection moves to the next enabled tab in one press. [kobalte, react-aria, headlessui] (decision needed)

### State

- [ ] `tabs.state.1` Given no value and no default, then the first enabled tab is selected automatically and its panel is shown. [base-ui, kobalte, reka, bits, react-aria, headlessui]
- [ ] `tabs.state.2` Given no value and no default where leading tabs are disabled, then the first enabled tab is selected. [base-ui, react-aria, headlessui]
- [ ] `tabs.state.3` Given an explicit default or controlled value pointing at a disabled tab, then that tab is still selected: an explicit value overrides the skip-disabled heuristic. [base-ui]
- [ ] `tabs.state.4` Given the implicit default selects the first tab, then the change callback fires once with that value and a reason marking it automatic rather than user-initiated; given an explicit default (including an explicit `null` meaning "nothing selected"), then no change callback fires on mount. [base-ui, kobalte]
- [ ] `tabs.state.5` Given an out-of-bounds default or controlled index, then the nearest valid tab is selected; one pointing at a disabled tab moves to the next available tab, wrapping when needed; a controlled index that overflows or underflows wraps around; and a controlled value takes precedence over the default. [headlessui]
- [ ] `tabs.state.6` Given the default is changed after mount, then the selection does not move and a development-mode warning is logged. [base-ui, headlessui]
- [ ] `tabs.state.7` Given no tabs at render time, when tabs appear later, then the first tab is selected even if the default index pointed elsewhere. [headlessui, react-aria]
- [ ] `tabs.state.8` Given the selected tab becomes disabled in uncontrolled mode, then selection moves to the next tab and the change callback fires once with a `disabled` reason; the `hidden` attribute moves between the kept-mounted panels accordingly. [base-ui]
- [ ] `tabs.state.9` Given the selected tab becomes disabled in controlled mode, then no change callback fires and the tab stays `aria-selected="true"`. [base-ui] (candidate)
- [ ] `tabs.state.10` Given the selected tab is removed, or the default points at a tab that never appears, then the change callback fires once with the new first tab and a `missing` reason, or with `null` when no tabs remain; replacing a populated tab list with an empty one also yields `null` and strips the panel's `aria-labelledby`. [base-ui, react-aria]
- [ ] `tabs.state.11` Given a controlled widget whose change handler does not update the value, then the selection does not move. [base-ui, headlessui]
- [ ] `tabs.state.12` Given a controlled widget whose change handler cancels the event, then a user-initiated change is refused while an automatic (initial or disabled-fallback) change still commits, and the canceled click does not poison the stored previous value used for direction. [base-ui] (candidate)
- [ ] `tabs.state.13` Given a widget that switches between controlled and uncontrolled, then both modes change the active tab correctly. [headlessui]
- [ ] `tabs.state.14` Given tabs added or removed while a controlled value is held, then the controlled value is honored across the change and navigation keeps working. [base-ui, react-aria, headlessui]
- [ ] `tabs.state.15` Given a change, then the change callback fires exactly once with the new value. [base-ui, zag, ark, kobalte, react-aria, headlessui]
- [ ] `tabs.state.16` Divergence: given every tab is disabled and no value, then the first tab is still marked `aria-selected="true"`, the change callback fires with its value, and focus lands on the tabpanel. [kobalte, react-aria] (decision needed)
- [ ] `tabs.state.17` Divergence: given every tab is disabled and no value, then no tab is selected, every panel stays `hidden`, and the change callback fires once with `null`; a tab becoming enabled later does not re-emit. [base-ui] (decision needed)
- [ ] `tabs.state.18` Given `deselectable`, when the already selected tab is clicked again, then its panel is hidden, and clicking a third time selects it again. [zag] (candidate)
- [ ] `tabs.state.19` Given two panels declaring the same value, then the last panel to register owns the value and the earlier one unmounting does not clear the tab's `aria-controls`; a duplicate-value configuration with a disabled first tab settles after one change event instead of re-emitting. [base-ui] (candidate)
- [ ] `tabs.state.20` Given nested tabs, then each root keeps its own selection and its own `aria-controls`/`aria-labelledby` wiring, moving the inner selection does not disturb the outer one, and switching the outer tab unmounts the nested root with its panel. [base-ui, ariakit, react-aria]
- [ ] `tabs.state.21` Given per-panel form controls, then values typed into one panel's input are not shared with another panel's input. [react-aria]
- [ ] `tabs.state.22` Given the imperative api, then it exposes the current value and focused value plus `setValue`, `clearValue`, `selectNext`, `selectPrev`, `focus`, `syncTabIndex` and `setIndicatorRect`. [zag] (candidate)
- [ ] `tabs.state.23` [apg] Given a deletable tabs widget, then deleting the last remaining tab is refused; given a reorderable tabs widget, then a move past the first or last position is refused and a move relocates the tab and its panel together.
- [ ] `tabs.state.24` Given tabs that do not fit horizontally, then the tablist collapses into a picker button that reflects the current selection and its panel's `aria-labelledby`, and expands back into a tablist when the tabs fit again; a disabled tab's option in that picker cannot be selected. [react-aria] (candidate) (browser-only)

### Positioning

- [ ] `tabs.positioning.1` Given an active-tab indicator, then it is hidden whenever no tab is active, the selected value matches no tab, or the measured rect is null or all-zero. [base-ui, zag, kobalte]
- [ ] `tabs.positioning.2` Divergence: given an indicator, then it publishes the active tab's geometry as `--active-tab-left`, `--active-tab-right`, `--active-tab-top`, `--active-tab-bottom`, `--active-tab-width` and `--active-tab-height`, measured relative to the tab list. [base-ui] (decision needed)
- [ ] `tabs.positioning.3` Divergence: given an indicator, then it publishes `--left`, `--top`, `--width` and `--height` plus a `--transition-property` list, with `position: absolute` and the orientation-appropriate axis bound to the variable. [zag, ark] (decision needed)
- [ ] `tabs.positioning.4` Divergence: given an indicator, then it writes an inline `transform`, `width` and `height` computed from the selected trigger's offsets, uses `transition: none` on its first measurement so it does not animate in from zero, and stays `visibility: hidden` until measured. [kobalte] (decision needed)
- [ ] `tabs.positioning.5` Given the active tab changes, the tab list is resized, a different tab is resized, a tab is inserted, or a tab's rendered element type changes, then the indicator re-measures and its geometry variables are recomputed. [base-ui, zag] (browser-only)
- [ ] `tabs.positioning.6` Given an inactive tab's label grows enough to reflow the tab list, then the indicator re-measures and stays aligned with the still-selected tab within 2px. [zag] (candidate) (browser-only)
- [ ] `tabs.positioning.7` Given the tab list is scrolled, has a border or padding, or sits inside a scrolling container between the list and the tabs, then the indicator geometry accounts for the scroll offset and the border inset. [base-ui] (candidate) (browser-only)
- [ ] `tabs.positioning.8` Given an ancestor with a 2D rotation, a 3D rotation, a size-preserving flip, or the `rotate`/`scale` longhands, then the indicator's on-screen rect still coincides with the active tab's on all four edges within 1px. [base-ui] (candidate) (browser-only)
- [ ] `tabs.positioning.9` Given the active tab carries its own `transform: translate(...)`, the `translate` longhand, or a percentage translation, then the indicator follows the translated tab within 1px. [base-ui] (candidate) (browser-only)
- [ ] `tabs.positioning.10` Given the tabs tree is inside `transform: scale(0)` so bounding rects collapse to zero, then the indicator falls back to untransformed `offsetLeft`/`offsetTop` instead of producing `NaN`, and stays visible. [base-ui] (candidate) (browser-only)
- [ ] `tabs.positioning.11` Given two indicators in the same tab list, then both recompute when a tab resizes. [base-ui] (candidate) (browser-only)
- [ ] `tabs.positioning.12` Given a tab strip that overflows, when a hidden tab is reached, then the strip scrolls to it. [ariakit] (candidate) (browser-only)
- [ ] `tabs.positioning.13` Given the root, then it exposes the direction of the last activation as `data-activation-direction` (`none`, `left`, `right`, `up`, `down`) on both the root and the newly selected tab, resets to `none` when the selection is cleared, and stays `none` for an automatic disabled fallback. [base-ui] (candidate) (browser-only)

### Animation and presence

- [ ] `tabs.animation.1` Given `lazyMount`, then the panel is absent from the DOM until its tab is first selected; adding `unmountOnExit` removes it again when another tab is selected. [zag, ark]
- [ ] `tabs.animation.2` Given a force-mount option (`keepMounted`, `shouldForceMount`), then every panel stays in the DOM and the inactive ones carry `hidden` (or `inert`), with the attribute moving to the previously active panel when the selection changes. [base-ui, zag, react-aria]
- [ ] `tabs.animation.3` Given a panel with an enter transition bound to `[data-starting-style]`, when its tab is selected, then the panel mounts, runs the enter transition to completion and remains in the DOM. [base-ui] (candidate) (browser-only)
- [ ] `tabs.animation.4` Given a panel with an exit animation bound to `[data-ending-style]`, when another tab is selected, then the panel stays mounted carrying `data-ending-style` and is only removed after the animation finishes. [base-ui] (candidate) (browser-only)
- [ ] `tabs.animation.5` Given the indicator's CSS transition finishes, then a transition-end event is recorded once and `transitionend` bubbled from descendants is ignored. [zag] (candidate)
- [ ] `tabs.animation.6` Given indicator animation is enabled, then the indicator gets `willChange`, `transitionProperty` and `transitionDuration` (defaulting to 150ms) from its custom properties; when disabled it gets `willChange: auto`, `transitionProperty: none` and `transitionDuration: 0ms`. [zag] (candidate)
- [ ] `tabs.animation.7` Given a panels container whose computed `transition` mentions `block-size` or `inline-size`, then switching tabs sets `--tab-panel-height` or `--tab-panel-width` on the container so the height or width can be transitioned. [react-aria] (candidate)
- [ ] `tabs.animation.8` Given animated sliding panels, when a tab is clicked, then the outgoing and incoming panels are both visible with opposite `translate` signs and fractional `opacity`; interrupting mid-transition with an arrow key adds a third visible panel and the final panel settles at `translate: 0px` and `opacity: 1` with the others hidden. [ariakit] (candidate) (browser-only)

### RTL and i18n

- [ ] `tabs.rtl.1` Given a horizontal tab list under `dir="rtl"`, then Left Arrow and Right Arrow swap meaning, so moving forward through the tabs sends Left Arrow and moving backward sends Right Arrow. [base-ui, zag, react-aria]
- [ ] `tabs.rtl.2` Given a vertical tab list under `dir="rtl"`, then Down Arrow and Up Arrow keep their meaning and no mirroring is applied. [react-aria]
- [ ] `tabs.rtl.3` Given every tabs part, then the resolved direction is propagated to each element as `dir`. [zag, ark] (candidate)
- [ ] `tabs.rtl.4` Given an indicator under RTL, then its offset is computed from the right edge of the tab list. [kobalte] (candidate)
- [ ] `tabs.rtl.5` Given the tab list, then its `aria-label` comes from the translations object, the only translated string in the component. [zag] (candidate)
- [ ] `tabs.rtl.6` Given a tab strip under RTL, then pointer and keyboard selection move through the tabs in right-to-left visual order. [ariakit, react-aria]

### SSR and hydration

- [ ] `tabs.ssr.1` Given server rendering, then the selected tab and its panel are emitted in the markup: the first tab by default, or the tab matching the supplied default or controlled value. [headlessui, react-aria]
- [ ] `tabs.ssr.2` Given server markup hydrated on the client, then the tab and panel ids are unchanged from the server values and hydration logs no attribute-mismatch warning, even when the server and client id prefixes differ. [reka, react-aria]
- [ ] `tabs.ssr.3` Given the trigger and panel ids, then both derive from one shared base id per tabs instance. [reka] (candidate)
- [ ] `tabs.ssr.4` Given server rendering before hydration, then triggers carry `data-ssr` and the indicator is `hidden` because no rect has been measured. [zag] (candidate)
- [ ] `tabs.ssr.5` Given an indicator asked to render before hydration, then the server markup contains an inline `script` whose body is the real positioning script, carrying the CSP nonce when a nonce provider is present; the element survives hydration (only its body is stubbed) and is removed once hydration completes. [base-ui] (candidate)
- [ ] `tabs.ssr.6` Given a streamed segment that is still `display: none`, then the pre-hydration script reveals the indicator and sets its width once the segment becomes visible and the active tab is fully measurable; it does not resurrect the indicator when the captured tab is no longer active, and it disconnects once hydration has taken ownership. [base-ui] (candidate) (browser-only)
- [ ] `tabs.ssr.7` Given route-backed tabs, then the URL and visible panel stay in sync through link clicks, tab clicks and browser back/forward, and manual activation leaves the URL unchanged until Enter or Space commits. [ariakit] (candidate) (browser-only)

### Accessibility tooling

- [ ] `tabs.a11y.1` Given `role="tab"`, then it must have an accessible name from visible text, `aria-label`, `aria-labelledby` or `title`; WCAG 4.1.2 A. [axe, apg]
- [ ] `tabs.a11y.2` Given `role="tablist"`, then it must own at least one `role="tab"` child; a completely empty tablist is reported as incomplete rather than a hard failure because `tablist` is in axe's `reviewEmpty` list. [axe]
- [ ] `tabs.a11y.3` Given `role="tab"`, then it must be contained by a `role="tablist"`; a missing required parent is a critical-impact failure. [axe]
- [ ] `tabs.a11y.4` Given a `role="tablist"` whose children include roles other than `tab`, then `aria-required-children` fails with "Element has children which are not allowed", and `aria-busy="true"` excuses only missing children, never disallowed ones. [axe]
- [ ] `tabs.a11y.5` Given `role="tab"`, then it must not contain a focusable widget-role descendant, because `tab` has `childrenPresentational: true`; a per-tab close button must be a sibling of the tab, not a child. [axe, apg]
- [ ] `tabs.a11y.6` Given `role="tab"`, then its role-specific allowed attributes are `aria-posinset`, `aria-selected`, `aria-setsize` and `aria-expanded`; `role="tablist"` allows `aria-level`, `aria-multiselectable`, `aria-orientation`, `aria-activedescendant` and `aria-expanded`; `role="tabpanel"` allows only `aria-expanded`. [axe]
- [ ] `tabs.a11y.7` Given a `tabpanel` with `tabindex="0"`, then `focus-order-semantics` is satisfied through the scrollable-region branch, because `tabpanel` is a structure role listed in axe's valid-scrollable-semantics map. [axe]
- [ ] `tabs.a11y.8` Given hidden panels implemented with `aria-hidden="true"` rather than `hidden` or removal, then their focusable content must be made non-focusable or removed; serious impact. [axe]
- [ ] `tabs.a11y.9` Given a scrollable tab list or panel container, then it must contain a focusable element or be focusable itself so Safari users can scroll it from the keyboard; WCAG 2.1.1 and 2.1.3 A at serious impact. [axe]
- [ ] `tabs.a11y.10` Given any element with `tabindex`, then the value must not be greater than 0, so a roving-tabindex implementation only ever writes `0` and `-1`. [axe, html]
- [ ] `tabs.a11y.11` Given an id referenced by `aria-controls`, `aria-labelledby` or `aria-activedescendant`, then that id must be unique in the document; critical impact. [axe]
- [ ] `tabs.a11y.12` Given a rendered tabs widget with triggers, panels and an indicator, then an axe run over the root reports no violations. [axe, zag, ark, reka, melt]

### Notes and edge cases

- [ ] `tabs.notes.1` [apg] Given a tabs widget, then only one panel is displayed at a time and the tab list sits along one edge of the displayed panel, most commonly the top. "Tabs" or "tabbed interface" names the whole set, "tab list" the set of tab elements inside the `tablist`, "tab" the activatable label, and "tabpanel" the associated content container.
- [ ] `tabs.notes.2` Given per-tab action buttons, then they live outside the `tab` element, and while focus is inside a tab wrapper the actions join the roving group and leave it again on `focusout`. [apg, axe]
- [ ] `tabs.notes.3` Given any part, then props the component does not consume land on the rendered element, the ref resolves to it, and an author `onClick` still fires. [radix, base-ui, react-aria, bits]
- [ ] `tabs.notes.4` Given a polymorphic escape hatch (`asChild`, `render`, `as`, a render function, or a fragment child), then the part renders the supplied element while keeping its role, state attributes and wiring. [radix, base-ui, react-aria, headlessui]
- [ ] `tabs.notes.5` Given render props, then the current selection is exposed on the root, the list and the panels container, and per-item selected state on each tab and panel. [base-ui, react-aria, headlessui]
- [ ] `tabs.notes.6` Given a part rendered without its required ancestor, then it throws a descriptive error naming the missing context. [base-ui, headlessui]
- [ ] `tabs.notes.7` Given panels declared through fragments, renderer functions or `.map`, in positions that do not match the tab list's own fragment placement, then the tab/panel wiring is still correct. [react-aria]
- [ ] `tabs.notes.8` Given a `null` child or no children at all, then the root renders without throwing. [base-ui]
- [ ] `tabs.notes.9` Given panels swapped by key, unmounted and remounted under React Strict Mode's double-invoked effects, then `aria-controls` follows the live registration exactly and no stale panel registration leaks. [base-ui] (candidate)
- [ ] `tabs.notes.10` Given a panel whose scroll container is the panel, a child of it or its parent, then scrolling a panel, selecting another tab and returning restores the scroll position exactly, and the reset variants return to `[0, 0]`. [ariakit] (candidate) (browser-only)
- [ ] `tabs.notes.11` Given a menu, select, combobox, dialog or tooltip rendered inside the tabs tree, then it opens and closes normally without changing the tab count or interfering with tab navigation. [react-aria, ariakit]
- [ ] `tabs.notes.12` Given a panel whose child suspends, with the Suspense boundary outside the root, then the fallback renders, the resolved content replaces it, and the change callback fired exactly once. [base-ui] (candidate)
- [ ] `tabs.notes.13` Given 100 tabs and one resized tab, then the indicator re-renders fewer than 5 extra times while still recomputing the correct geometry. [base-ui] (candidate) (browser-only)
- [ ] `tabs.notes.14` Given a component that recreates its merged host ref on every render, then the roving order settles instead of thrashing. [base-ui] (candidate)
- [ ] `tabs.notes.15` Given tabs rendered under React's `Activity` in hidden mode, then no tabs are in the DOM, and they appear when the Activity becomes visible. [react-aria] (candidate)

## Sources

- `docs/research/apg-and-axe.md` `## tabs` — WAI-ARIA Authoring Practices tabs pattern, its automatic and manual example test files, axe-core rules and role tables, and WHATWG HTML §6.6 focus.
- `docs/research/ariakit-and-headlessui.md` `## tabs` — Ariakit sandbox Playwright and happy-dom suites, Headless UI React and Vue tabs unit and SSR suites.
- `docs/research/kobalte-and-corvu.md` `## tabs` — Kobalte `packages/core/src/tabs/tabs.test.tsx`.
- `docs/research/radix-and-base-ui.md` `## tabs` — Radix `packages/react/tabs`, Base UI `packages/react/src/tabs/{root,list,tab,panel,indicator}`.
- `docs/research/react-aria-a.md` `## tabs` — React Spectrum v3 Tabs, React Aria Components Tabs, its browser and SSR suites, and the Spectrum 2 regression test.
- `docs/research/reka-melt-bits.md` `## tabs` — Reka `Tabs.test.ts`, Melt `Tabs.spec.ts`, Bits `tabs.browser.test.ts`.
- `docs/research/zag-and-ark.md` `## tabs` — Zag `packages/machines/tabs`, its e2e suite and model, Ark React/Solid/Vue tabs tests.

## Deferred

- The generic axe rules that apply to every component (`aria-roles`, `aria-allowed-attr`, `aria-required-attr`, `aria-valid-attr`, `aria-valid-attr-value`, `aria-prohibited-attr`, `aria-deprecated-role`, `aria-braille-equivalent`, `presentation-role-conflict`, `target-size`) are recorded once for the whole suite rather than per component. `target-size` ships disabled in axe and has to be enabled explicitly.
- The WHATWG HTML focus model (focusable area, focus navigation scopes, the focusing steps, `focus({preventScroll})`, `blur()` being advisory, shadow-root `delegatesFocus`) underpins roving tabindex everywhere and belongs in a shared focus-management spec, not here.
- Deletable and reorderable tabs (APG Delete key, the actions example's refusal rules) are specified above but no library in the research implements them, so there is no cross-library evidence for the details.
- Collapse-to-picker behavior when tabs do not fit is React Aria's alone and needs layout measurement that jsdom cannot supply.
- The research for React Spectrum's "tabpanel should have tabIndex=0 only when there are no focusable elements" is transcribed twice with opposite polarity; `tabs.focus.4` follows the reading that matches every other library and the test's own name.
- Kobalte's conditional panel `tabindex` test is `it.skip`ped with the note `// TODO test create-presence`, and five of its disabled-tab tests are skipped on CI, so Kobalte's evidence for `tabs.focus.4`, `tabs.pointer.4` and `tabs.state.16` is unverified in CI. See `presence.md`.
- Zag's "automatic: on arrow right, loop focus + selection" e2e test is marked `@flaky` and skipped, so arrow-key wrapping is unverified there.
