# composite

The keyboard navigation engine that menu, listbox, tabs, toolbar, radio group,
toggle group, grid and tree all build on. One file, five sections: the focus
engine itself (`composite`), the item registry it walks (`collection`), the
selection model layered on top (`selection`), the text search that jumps around
it (`typeahead`), and document-level shortcuts (`hotkeys`).

Nothing here is a component. Every bullet is a behavior a composing component
must exhibit, so the suite tests these through the smallest component that
exercises them (usually toolbar or toggle group) rather than against a
primitive with no DOM.

Tag convention: `apg`, `html` and `axe` are specification and linter sources,
not libraries, so a bullet carrying only those is normative rather than a
candidate. `(candidate)` marks a bullet backed by exactly one library.

## composite

### Roles and attributes

- [ ] `composite.roles.1` Given a composite widget, then it occupies exactly one stop in the page tab sequence and arrow keys move focus among its items. [apg, radix, base-ui, react-aria, reka, melt, bits, ariakit, zag]
- [ ] `composite.roles.2` Given `aria-activedescendant` is used, then the referenced element MUST satisfy one of three DOM relationships: it is a DOM descendant of the focused referencing element, or the referencing element's `aria-owns` includes its id, or the referencing element has role `combobox`, `textbox` or `searchbox` with `aria-controls` pointing at a container that supports `aria-activedescendant` and either contains the element or owns it. [apg]
- [ ] `composite.roles.3` Given a composite using `aria-activedescendant`, then DOM focus remains on the container while `aria-activedescendant` names the active item, and the container's own role is what assistive technology reports as focused. [apg, ariakit]
- [ ] `composite.roles.4` Given a composite using `aria-activedescendant` with no active item, then the container carries no `aria-activedescendant` at all and no item is marked active; the first arrow key sets both. [ariakit] (candidate)
- [ ] `composite.roles.5` Given the active item, then it carries a stable active marker for styling (`data-active-item`), and a focus-visible marker only when the move came from the keyboard. [ariakit] (candidate)
- [ ] `composite.roles.6` Given a composite with an orientation, then the orientation is NOT mirrored onto a role that already implies it: neither a `role="menu"` popup nor a generic composite root emits `aria-orientation`. [base-ui] (candidate)
- [ ] `composite.roles.7` Given grid rows that carry `aria-posinset`, when cells render, then each cell derives its own `aria-posinset` from the row-level value and shares the row's `aria-setsize`. [ariakit] (candidate)
- [ ] `composite.roles.8` Given an item disabled only accessibly, then it carries `aria-disabled="true"` with no native `disabled` attribute and reports itself as not truly disabled; a truly disabled item carries the native `disabled` attribute. [ariakit, base-ui]
- [ ] `composite.roles.9` Divergence: the item holding the roving tab stop carries `tabindex="0"` and every other item `tabindex="-1"`. [apg, radix, base-ui, react-aria, reka, zag, melt] (decision needed)
- [ ] `composite.roles.10` Divergence: the item holding the roving tab stop has its `tabindex` attribute REMOVED entirely rather than set to `0`, which is only equivalent for hosts that are natively tabbable. The APG tabs examples call `removeAttribute('tabindex')` on the selected tab. [apg] (decision needed)

### Keyboard

- [ ] `composite.keyboard.1` Given a composite using roving tabindex, then moving focus sets `tabindex="-1"` on the element that had `tabindex="0"`, sets `tabindex="0"` on the new target, and then calls `focus()` on it, in that order. [apg]
- [ ] `composite.keyboard.2` Given a vertical composite, then ArrowDown moves to the next item and ArrowUp to the previous; given a horizontal one, ArrowRight and ArrowLeft do, subject to direction. [apg, base-ui, react-aria, reka, melt, bits, ariakit, corvu, zag]
- [ ] `composite.keyboard.3` Given a composite whose orientation is one axis, when a key from the other axis is pressed, then nothing moves and the default is NOT prevented, so an embedded control can still use it. Only keys along the active axis have their default prevented; an orientation of "both" prevents both pairs. [base-ui, react-aria, ariakit, reka]
- [ ] `composite.keyboard.4` Given Home is pressed anywhere in a composite, then focus and the roving tab stop move to the first item; End moves both to the last. In a nested structure this crosses group boundaries to the very first or last item of the whole composite. [apg, base-ui, melt, ariakit, corvu, zag]
- [ ] `composite.keyboard.5` Given PageDown and PageUp in a list, then focus moves a page at a time, using the scroll container's own viewport height rather than the window's; in an iframe that is the frame's viewport, not the outer page's. [react-aria, ariakit]
- [ ] `composite.keyboard.6` Given a composite with no active item, when the forward key is pressed, then the first item becomes active; when the backward key is pressed, then the last item becomes active. [corvu, reka, base-ui]
- [ ] `composite.keyboard.7` Given a closed popup composite and an arrow key on its trigger, then the popup opens and focus lands on the first item for the forward key or the last item for the backward key; a prop turns the open-on-arrow behavior off. [base-ui] (candidate)
- [ ] `composite.keyboard.8` Given any recognised navigation key, then `preventDefault()` is called before the active item changes, even when the move turns out to be a no-op at a boundary. [corvu, ariakit]
- [ ] `composite.keyboard.9` Given an arrow key pressed with any modifier held, then arrow navigation is suppressed by default; a list of allowed modifiers can be configured, and only those then navigate. [base-ui] (candidate)
- [ ] `composite.keyboard.10` Given a modified navigation key such as Alt+ArrowDown, when it moves the active item, then the new item is marked focus-visible even if the previous interaction was a pointer click; when the same key moves nothing at a boundary, the current item still becomes focus-visible from its own keydown. A modified NON-navigation key such as Ctrl+C leaves the modality at pointer. [ariakit] (candidate)
- [ ] `composite.keyboard.11` Given a composite whose items are grid cells, then the forward and backward keys move within the row and the vertical keys move within the column, landing in the same column of the target row. [base-ui, ariakit, zag]
- [ ] `composite.keyboard.12` Given grid navigation, then the cross-axis keys are claimed and their default prevented even when they fall outside the configured orientation. [base-ui] (candidate)
- [ ] `composite.keyboard.13` Given a grid whose target row is shorter than the current column index, then the column clamps to the last cell of that row rather than landing nowhere; if that clamped candidate is disabled or hidden, the search falls back towards the start of the row. [base-ui, zag]
- [ ] `composite.keyboard.14` Given a grid with looping and an orientation of both, then horizontal looping stays inside the current row and vertical looping stays inside the current column; a row holding a single item loops to itself. [base-ui] (candidate)
- [ ] `composite.keyboard.15` Given a grid over a virtualized list where only some rows are rendered, then vertical wrapping resolves against the full item count, not the rendered window: the backward key from the first row wraps to the same column of the last row of the whole list. [base-ui] (candidate)
- [ ] `composite.keyboard.16` Given a grid with uneven rows and focus-shifting enabled, then a vertical move lands on the nearest cell in the target row instead of preserving the column exactly. Without focus shifting the column is preserved. [ariakit] (candidate)
- [ ] `composite.keyboard.17` Given a grid whose every candidate cell in the target column is disabled, then the search falls back to the last item for a forward move and the first item for a backward move. [zag] (candidate)
- [ ] `composite.keyboard.18` Given a composite item rendered as a text input, when a navigation key is pressed with the caret away from the matching text boundary, or with a non-collapsed or Shift-extended selection, then the caret moves and focus stays in the input; only a press at the boundary moves focus out. [base-ui, ariakit]
- [ ] `composite.keyboard.19` Given a keydown whose native target resolves to a text input while the framework's synthetic target is the composite item, then native text navigation wins and focus does not move. [base-ui] (candidate)
- [ ] `composite.keyboard.20` Given a composite item that opens a nested composite (a submenu), then the forward key opens it and moves focus inside, Escape closes it and returns focus to the parent item, and the backward key also closes it when the nesting is horizontal. Nested composites may each have their own orientation. [base-ui, ariakit]
- [ ] `composite.keyboard.21` Given a composite item that registers with an outer composite store while also being wrapped in a nested provider, then the outer composite's arrow keys still reach it. [ariakit] (candidate)
- [ ] `composite.keyboard.22` Given a composite with Tab handling turned on and an active item that is not at the relevant boundary, when Tab is pressed, then the default is prevented and the next item becomes active; at the boundary the default is allowed so focus leaves the composite. This conflicts with the single-tab-stop ARIA convention and needs an explicit opt-out. [corvu] (candidate)
- [ ] `composite.keyboard.23` Given a vim-mode composite, then the configured vim keys (`h`, `j`, `k`, `l` by default) are added alongside the arrow key for each direction; the defaults are Latin, so a non-Latin layout only gets the arrows. [corvu] (candidate)
- [ ] `composite.keyboard.24` Given a keydown, then the key is lowercased before matching, so key matching is case-insensitive. [corvu] (candidate)
- [ ] `composite.keyboard.25` Given an empty item list, when any key is pressed, then the handler returns before matching and calls no `preventDefault`. [corvu] (candidate)
- [ ] `composite.keyboard.26` Divergence: arrow navigation loops by default, so the forward key at the last item moves to the first; a prop turns looping off. [base-ui, bits] (decision needed)
- [ ] `composite.keyboard.27` Divergence: arrow navigation clamps by default, so the forward key at the last item leaves focus where it is; a prop turns looping on. [react-aria, reka, melt, ariakit, zag, corvu] (decision needed)
- [ ] `composite.keyboard.28` Given a loop hook, when navigation would wrap, then the hook is called with the key, the previous index, the computed next index and the item registry, and its return value wins: returning the previous index pins focus, returning any other index redirects the wrap. With looping disabled the hook is never called. [base-ui] (candidate)

### Pointer

- [ ] `composite.pointer.1` Given a composite that manages focus with roving `tabindex` or `aria-activedescendant`, when one of its items is clicked or tapped, then the same `tabindex` or `aria-activedescendant` update is applied as for keyboard navigation, otherwise pointer and keyboard state diverge. [apg, react-aria, base-ui]
- [ ] `composite.pointer.2` Given a composite with hover-to-highlight enabled, when a `mousemove` with non-zero movement lands on an item, then that item becomes the active item and the navigate callback reports its index; a `pointerleave` moves focus back to the container. With hover-to-highlight off, neither happens. [base-ui] (candidate)
- [ ] `composite.pointer.3` Given a pending item focus queued in an animation frame, when the pointer leaves before that frame runs, then the queued focus is cancelled, the item is deactivated and the navigate callback is called with null. [base-ui] (candidate) (browser-only)
- [ ] `composite.pointer.4` Given an item taller than its scroll-clipped container, when `pointerleave` fires at a point inside the item's own rect but outside the clipping container, then the active item is still cleared. [base-ui] (candidate)
- [ ] `composite.pointer.5` Given a stationary `mousemove` with zero movement deltas, as WebKit emits when the list scrolls beneath a motionless pointer, then the active item does not change and keyboard modality is preserved; a following real `mousemove` with non-zero deltas does move it. A stationary `pointermove` bubbling through the popup likewise preserves keyboard modality, and a `pointerleave` whose `relatedTarget` is the popup does not clear the highlight. [base-ui, zag] (safari-only)
- [ ] `composite.pointer.6` Given a virtual-focus composite, when an item is hovered, then the event order is `mouseenter` on the container (targeting the item), `mouseenter` on the item, then the container and item focus pair; afterwards both container and item carry focus-visible and the item carries the active marker. When a key then moves the active item, the order is keydown on the item, keydown on the container, blur on the old item and container, focus on the new item and container, then the keyup pair. [ariakit] (candidate)
- [ ] `composite.pointer.7` Given a virtual-focus composite, when an item is clicked, then the container loses focus-visible and the clicked item gains the active marker without focus-visible, and only blur and focus pairs fire. [ariakit] (candidate)

### Focus management

- [ ] `composite.focus.1` Given the tab-stop conventions, then there are three families: menubar and toolbar put the tab stop on the FIRST item; radio group, tabs, listbox and tree put it on the SELECTED item; grid and treegrid RESTORE the last-focused item. A component must declare which family it belongs to. [apg]
- [ ] `composite.focus.2` Given a composite that loses focus and wants a specific item focused next time, then that item's `tabindex` is set to `0` and the previous holder's to `-1` before the composite loses focus. [apg]
- [ ] `composite.focus.3` Given a roving-tabindex composite, then the user agent scrolls the newly focused element into view automatically; given an `aria-activedescendant` composite, then the implementation MUST draw its own visual focus indicator on the active item AND scroll it into view itself, because the user agent will not. [apg, ariakit]
- [ ] `composite.focus.4` Given an item reached by keyboard that lies below the fold, then the composite scrolls it into view, including when the scroller is the document itself rather than a wrapper. [ariakit, base-ui]
- [ ] `composite.focus.5` Given a selected item and a composite that opens as a popup, then the selected item is scrolled into view when the popup opens. [base-ui] (candidate)
- [ ] `composite.focus.6` Given a scroll container and an item with a scroll margin, when the item is scrolled into view in an RTL horizontal composite, then the left scroll margin is used for the left-overflow check. [base-ui] (candidate)
- [ ] `composite.focus.7` Given a composite whose default entry item is disabled, then the initial roving tab stop moves to the first item that can hold it; when every item is disabled, the first item keeps the tab stop so the composite is still reachable. [base-ui] (candidate)
- [ ] `composite.focus.8` Given the item holding the highlight is unmounted, then the tab stop falls back into range: to the declared active item if there is one, otherwise to the first item that can hold it, skipping hidden and `aria-disabled` items; if no item can legitimately hold it, the first item takes it anyway. [base-ui] (candidate)
- [ ] `composite.focus.9` Given an item earlier than the highlighted one is unmounted, then the highlighted item keeps the tab stop and the next arrow key continues from there. [base-ui] (candidate)
- [ ] `composite.focus.10` Given the active item is removed from the DOM, when the composite is re-entered, then focus lands on a surviving item and arrow navigation continues from there. [ariakit, base-ui]
- [ ] `composite.focus.11` Given a virtual-focus composite whose container is not focusable, when arrow keys move the active item, then focus is not redirected to the container, each item is marked focus-visible in turn, and a single development warning says the container must be focusable. [ariakit] (candidate)
- [ ] `composite.focus.12` Given a pending focus move whose target item has not mounted yet, when it mounts after focus has already left the composite, then it is NOT focused and focus stays where the user put it; when it mounts with focus still inside, it is focused. [ariakit] (candidate)
- [ ] `composite.focus.13` Given two rapid unresolved focus moves, when the items mount, then only the latest requested item takes focus. [ariakit] (candidate)
- [ ] `composite.focus.14` Given a pending focus move, then it is never redirected between kinds: a move that targeted an item does not become a move to the container, a move that targeted the container does not become a move to an item, and neither happens before the composite's first mount. [ariakit] (candidate)
- [ ] `composite.focus.15` Given a pending focus move whose active id has since changed and changed back, when the composite reappears, then the stale move is not replayed. [ariakit] (candidate)
- [ ] `composite.focus.16` Given a composite that is unmounted and remounted, or whose composite behavior is handed off and taken back, then a move recorded before is not replayed: focus stays on whatever the user is using and the page does not scroll. A move recorded WHILE behavior was handed off is carried out when it comes back, because nothing could carry it out meanwhile. [ariakit] (candidate)
- [ ] `composite.focus.17` Given a pending focus request that is abandoned (a different target is chosen, or the container takes the request over by being focused), then the request is spent: it is not carried out later. [ariakit] (candidate)
- [ ] `composite.focus.18` Given a panel containing a composite that is dismissed in a later task, by the handler that focused it, or synchronously, then a newly registering item moves focus nowhere on its own; when the panel is reopened and focused, the active item IS presented again. [ariakit] (candidate)
- [ ] `composite.focus.19` Given a presentation parked while a popup is positioning, when the popup closes (or starts an exit transition, or its item leaves and is re-added under the same id), then the presentation is abandoned and the document scroll offset does not move. [ariakit] (candidate) (browser-only)
- [ ] `composite.focus.20` Given a composite inside an iframe, then the keyboard event forwarded to the item and the blur event delivered to the previous item are both constructed by the frame's own window, not the parent's. [ariakit] (candidate) (browser-only)
- [ ] `composite.focus.21` Given two highlight-selection composites that each hold a selection and a control between them, when Tab moves forward into the second, then focus lands on its FIRST selected item; when Shift+Tab moves backward into the first, focus lands on its LAST selected item; neither fires a selection change. [react-aria] (candidate)
- [ ] `composite.focus.22` Given an autofocus setting of first or last with select-on-focus, then the corresponding item is focused and selected; given an existing default selection, autofocusing does not change it. [react-aria] (candidate)

### State

- [ ] `composite.state.1` Given a controlled highlighted index with a change callback, then `tabindex="0"` and DOM focus track the controlled value as arrow keys move it; an uncontrolled composite moves both with no controlled props. [base-ui] (candidate)
- [ ] `composite.state.2` Given an item that declares itself the initially active one through an explicit index, then that index becomes the initial highlighted index and the change callback reports it on mount. [base-ui] (candidate)
- [ ] `composite.state.3` Given a composite whose page number becomes `NaN` while the user clears a numeric field, then nothing crashes, the current page's items stay rendered, and typing a new number renders that page. [ariakit] (candidate)
- [ ] `composite.state.4` Given a composite state primitive, then the consumer owns the DOM: the primitive returns the active value, a setter and a keydown handler and touches no element itself. [corvu] (candidate)

### RTL and i18n

- [ ] `composite.rtl.1` Given a horizontal composite under RTL, then ArrowLeft moves forward and ArrowRight moves backward; vertical keys are direction-independent. [base-ui, react-aria, reka, corvu, ariakit]
- [ ] `composite.rtl.2` Given an RTL composite with no active item, when the RTL forward key (ArrowLeft) is pressed on the container, then the first item in reading order takes focus; when the RTL backward key is pressed first instead, then the last item does. [ariakit] (candidate)
- [ ] `composite.rtl.3` Given an RTL grid, then the horizontal keys are mirrored while row wrapping still follows reading order, and Home and End still reach the first and last items of the whole grid. [base-ui] (candidate) (browser-only)
- [ ] `composite.rtl.4` Given an RTL grid and a cell that spans several columns, when navigating out of it, then the move leaves from the forward edge of the spanning cell. [base-ui] (candidate) (browser-only)
- [ ] `composite.rtl.5` Divergence: direction is read from the DOM (`dir` on an ancestor, or a direction provider), so an RTL page works without extra wiring. [base-ui, react-aria, reka] (decision needed)
- [ ] `composite.rtl.6` Divergence: direction is a prop only, never read from `dir` or computed style, so an RTL page must pass it explicitly. [corvu] (decision needed)

### SSR and hydration

- [ ] `composite.ssr.1` Given composite items rendered on the server, before hydration and with JavaScript disabled, when Tab is pressed repeatedly, then every item is reachable in document order, including items belonging to virtual-focus composites whose container is not published yet. [ariakit] (candidate) (browser-only)
- [ ] `composite.ssr.2` Given several composites on a hydrated page, when Tab is pressed, then each contributes exactly one tab stop: a roving composite's stop is its active item, and a virtual-focus composite's stop is the container because its items are never tab stops. [ariakit] (candidate)
- [ ] `composite.ssr.3` Given a composite item list rendered to string and then hydrated, then each item reports index `-1` before hydration and its real index afterwards, with the element registry populated in order and no hydration mismatch. [base-ui] (candidate)

### Accessibility tooling

- [ ] `composite.a11y.1` Given a composite using roving tabindex, then no item has a positive `tabindex`: only `0` and `-1` are ever emitted (serious). [axe]
- [ ] `composite.a11y.2` Given an id referenced by `aria-activedescendant`, then that id MUST be unique in the document (critical). [axe]

### Notes and edge cases

- [ ] `composite.notes.1` Given a composite state primitive, then it is index- and identity-agnostic: the item list may be any array (an accordion can pass plain integers), which lets one primitive drive triggers, options and cells. [corvu] (candidate)
- [ ] `composite.notes.2` Given items matched by identity, then reference equality is used to locate the active item, so recreating item objects between renders breaks navigation. [corvu] (candidate)
- [ ] `composite.notes.3` Given a virtualized composite renderer measured by a `ResizeObserver`, then scrolling the whole list, re-rendering items to new nodes under the same ids, and unmounting the list all leave zero observed-but-detached nodes. [ariakit] (candidate) (browser-only)
- [ ] `composite.notes.4` Given a virtualized renderer whose active descendant lies outside the rendered window, then the active item's ancestor item is rendered alongside it so both appear in index order. [ariakit] (candidate) (browser-only)
- [ ] `composite.notes.5` Given a cross-oriented group inside a renderer, then its extent along the parent axis is read from the rendered element or from the largest child extent, never by summing the children's cross-axis sizes. [ariakit] (candidate) (browser-only)
- [ ] `composite.notes.6` Given two composite items sharing one DOM node through nesting, then registration ownership stays with the outer item (it comes from ref attachment order), the outer metadata survives an update to the inner item alone, and arrow navigation still walks the items in order. [base-ui] (candidate)
- [ ] `composite.notes.7` Given a composite primitive with no module-level state, then many instances in one test file do not leak into each other; the only shared state is what the consumer passes in. [corvu] (candidate)

## collection

### Roles and attributes

- [ ] `collection.roles.1` Given items with falsy keys (`0` or the empty string), then they are kept in the collection and rendered like any other item: a falsy key is not treated as missing. [react-aria] (candidate)
- [ ] `collection.roles.2` Given an item with an author-supplied `id` prop, then it does not override the collection's generated element id. [react-aria] (candidate)

### Keyboard

- [ ] `collection.keyboard.1` Given a next-value or previous-value query that lands on a disabled item, then the walk keeps stepping in the same direction until it reaches an enabled item, so a disabled item is never returned. [zag, reka, base-ui]
- [ ] `collection.keyboard.2` Given a value that is not in the collection, when the next or previous value is requested, then the result is empty, because the starting index resolves to -1. [zag, reka]
- [ ] `collection.keyboard.3` Given a step greater than 1, then the index may run past either end and resolve to nothing; with clamping on, it pins to the last index or 0 so the boundary value is returned instead. [zag] (candidate)
- [ ] `collection.keyboard.4` Given the first or last value is requested and the item at that end is disabled, then the getter walks inward past it. [zag] (candidate)
- [ ] `collection.keyboard.5` Given a tree collection, then forward navigation descends into an expanded branch's children rather than skipping to the next sibling, and backward navigation enters expanded nested branches but not collapsed ones; a skip predicate decides which subtrees are invisible. [zag] (candidate)
- [ ] `collection.keyboard.6` Given tree sibling navigation, then it moves within one parent, steps over consecutive disabled siblings, returns branch siblings without descending into them, and does not loop at the first or last position. [zag] (candidate)
- [ ] `collection.keyboard.7` Given the first or last node of a tree is requested, then it is the first or last non-root node in document order, which for the last node means the deepest last descendant, not the last top-level child. [zag] (candidate)

### State

- [ ] `collection.state.1` Given items registering themselves into a collection, then the collection reports them in DOM order even when registration order differs. [reka, base-ui, ariakit]
- [ ] `collection.state.2` Given an item marked disabled, then it is excluded from the collection's default item query and included only through the explicit include-disabled form. [reka, zag]
- [ ] `collection.state.3` Given an item that unmounts, then it is removed from the collection and the reported size drops. [reka, base-ui, ariakit]
- [ ] `collection.state.4` Given an item whose registration is turned off, then it is excluded from the collection while still mounted. [ariakit] (candidate)
- [ ] `collection.state.5` Given an item lookup by element, then a registered element resolves to its entry, a disabled element resolves to nothing under the default filtering, an unregistered element resolves to nothing, and a registered element that has been detached from the document still resolves until it unmounts. [reka] (candidate)
- [ ] `collection.state.6` Given a collection whose root element never mounted, then the item lookup returns nothing, the item list is empty and the size is 0 rather than throwing. [reka] (candidate)
- [ ] `collection.state.7` Given items whose order changes in the DOM, whether by reordering their wrappers, reordering keyed groups, or a move performed outside the framework, then the registry re-sorts and every item's reported index updates. [base-ui] (candidate)
- [ ] `collection.state.8` Given an item removed from the DOM outside the framework so its ref callback never fires, then it is excluded from the registry rather than scrambling the order, including when the same batch also moves another item. [base-ui] (candidate)
- [ ] `collection.state.9` Given an item that stops rendering an element while staying mounted, then the registry drops it and the remaining items renumber; when it renders an element again, it rejoins in order. [base-ui] (candidate)
- [ ] `collection.state.10` Given an item whose explicit index changes or is removed, then it re-registers at the new slot, its reported index follows, and the old slot is released. [base-ui] (candidate)
- [ ] `collection.state.11` Given items with explicit indexes mixed with automatic ones, then explicit slots are reserved before automatic assignment, explicit items do not consume an automatic index guess, a negative explicit index registers nothing, and the registry is ordered by index rather than DOM order. [base-ui] (candidate)
- [ ] `collection.state.12` Given an item whose index is shifted by an insertion before it, then its reported index updates without its ref detaching and reattaching. [base-ui] (candidate)
- [ ] `collection.state.13` Given the registry is published to consumers, then only snapshots aligned with the element registry are published: never an empty registry while items exist, never a snapshot whose keys disagree with the element list, and not at all when a mutation touched only unrelated nodes. [base-ui] (candidate)
- [ ] `collection.state.14` Given items that span a shadow boundary so no single ancestor contains them all, then both are registered and both are released on unmount. [base-ui] (candidate)
- [ ] `collection.state.15` Given items sharing one mutation root, then that root is observed exactly once no matter how many items it holds. [base-ui] (candidate)
- [ ] `collection.state.16` Given an item's label source, then an explicit label wins, an explicit null means "no label" and never falls back to text, a text ref resolves to that element's text, and no label at all falls back to the element's text content. A label change on a mounted item updates in place, and labels for unmounted items are dropped. [base-ui] (candidate)
- [ ] `collection.state.17` Given item metadata, then it is published alongside the assigned index, so a consumer reads both from one map. [base-ui] (candidate)
- [ ] `collection.state.18` Given a collection item rendered with no collection parent, then it renders with index `-1` (the default context no-ops) and unmounting does not throw. [base-ui] (candidate)
- [ ] `collection.state.19` Given a list collection built from items plus callbacks, then omitting a callback falls back sensibly: a string item is its own value and label, an object item reads its `value`, `label` and `disabled` properties, and the label falls back to the value. [zag] (candidate)
- [ ] `collection.state.20` Given a mutating operation on a collection (set items, insert, remove, reorder, move, update, upsert, filter), then a NEW collection is returned and the original is untouched; an operation naming a value that is not present returns the original instance unchanged. [zag] (candidate)
- [ ] `collection.state.21` Given an out-of-range index in a reorder or move, then the item is appended at the end rather than the call failing; given an insert into an empty collection, the item lands at index 0 rather than being dropped. [zag] (candidate)
- [ ] `collection.state.22` Given a grouped collection, then grouping gathers items under their key even when they are not adjacent in the source, group order is first-seen unless an explicit group order is given, disabled items stay in their group, and index lookups follow the grouped and sorted order rather than source order. [zag] (candidate)
- [ ] `collection.state.23` Given two values in a collection, then comparing them orders by index, and the inclusive range between them is returned in collection order whichever argument comes first, or empty if either value is missing. [zag] (candidate)
- [ ] `collection.state.24` Given a dynamic collection driven from data, then appending, inserting, renaming, swapping and removing items are all reflected in the rendered items, including when the items are plain strings rather than objects, when a descendant component owns them, when only the render function changed, and when an item moves between sections. [react-aria] (candidate)
- [ ] `collection.state.25` Given a collection rendered from content that produces no items, then the collection is still marked complete, with no first or last key. [react-aria] (candidate)
- [ ] `collection.state.26` Given nested collections whose item keys collide with the outer collection's keys, then every element carries a unique collection-plus-key pair. [react-aria] (candidate)
- [ ] `collection.state.27` Given rows written statically with no ids whose cells are produced by a render function, then the library throws, naming the missing row id and why it is required. [react-aria] (candidate)

### Positioning

- [ ] `collection.positioning.1` Given a scrollable root with a border, then scroll-into-view excludes the root's border width from the computed scroll port so the item is not left under the border, at both the start and the end edge. [react-aria] (candidate)
- [ ] `collection.positioning.2` Given a measured renderer and a fixed-size renderer over the same data, then their item offsets agree with the fixed-size formula (`paddingStart + itemSize * index + gap * index`) and both report the same total height. [ariakit] (candidate) (browser-only)

### Notes and edge cases

- [ ] `collection.notes.1` Given an ordered item map, then it supports insert at an index (including negative indices resolved against the current length and out-of-range indices that append), delete by key and by index, find and find-index over keys and values, filter, some and every, plus first, last, before and after. An in-place insert returns the same instance; the copying form returns a new one and leaves the original untouched. [radix] (candidate)
- [ ] `collection.notes.2` Given a collection registry rendered inside a suspense boundary that suspends and resolves repeatedly, then after each cycle the element registry, the labels and the reported indexes are all correct and no empty registry is ever published. [base-ui] (candidate)
- [ ] `collection.notes.3` Given a grid collection, then items chunk into rows of the column count with a short final row, the row list is cached after the first read, a cell index is `row * columnCount + column`, and an index past the end resolves to nothing. [zag] (candidate)
- [ ] `collection.notes.4` Given a tree collection, then a node counts as a branch if it has at least one child OR declares a children count, so a lazily loaded node is treated as a branch before its children exist. [zag] (candidate)
- [ ] `collection.notes.5` Given a tree filter, then matching nodes are kept and their ancestors are kept as scaffolding so the matches remain reachable; a node that had children keeps an empty children list, and a node that never had children gains none. [zag] (candidate)
- [ ] `collection.notes.6` Given a tree flattened and rebuilt, then the original nesting, every custom property and nested data objects all survive the round trip; flattening an empty tree yields one entry, and rebuilding from an empty list or from a list with no root throws with a named error. [zag] (candidate)

## selection

### Roles and attributes

- [ ] `selection.roles.1` Given a collection with a selection mode, then the mode is exposed on each item for styling, and an unselected item reports the unselected state explicitly rather than omitting it. [react-aria] (candidate)
- [ ] `selection.roles.2` Given highlight selection (selection replaces rather than toggles), then no selection checkboxes are rendered and the selected state lives entirely in the ARIA selected attribute. [react-aria] (candidate)
- [ ] `selection.roles.3` Given a selection, then DOM focus is functionally distinct from the selected state, and the visual focus indicator MUST be visually distinct from the selected state. [apg]
- [ ] `selection.roles.4` Given focus leaves a composite that contains a selected item, then the selected state persists. [apg]

### Keyboard

- [ ] `selection.keyboard.1` Given a composite where selection follows focus, then moving focus with an arrow key replaces the selection with the newly focused item. [apg, react-aria]
- [ ] `selection.keyboard.2` Given activating an item triggers a network request or a page refresh, then selection MUST NOT follow focus, because the latency per arrow press makes the widget unusable for keyboard and screen reader users; the user then changes selection with Enter or Space. [apg]
- [ ] `selection.keyboard.3` Given multiple selection and Shift held with an arrow key, then the selection extends from the anchor to the newly focused item; a following Shift press in the opposite direction collapses the range rather than growing it in the new direction. [react-aria, zag, corvu]
- [ ] `selection.keyboard.4` Given multiple selection and the platform's non-contiguous modifier (Alt on macOS, Control on Windows) held with an arrow key, then focus moves and the selection does not change. [react-aria] (candidate)
- [ ] `selection.keyboard.5` Given focus moved without changing the selection, when the non-contiguous modifier is then held with Space, then the focused item is added to the selection; a plain Space instead replaces the selection with just that item. [react-aria] (candidate)
- [ ] `selection.keyboard.6` Given multiple selection, when the platform's select-all chord (Meta+A on macOS, Control+A on Windows) is pressed, then the change callback reports "all"; in single-selection mode it is never called. [react-aria] (candidate)
- [ ] `selection.keyboard.7` Given a selection is present, when Escape is pressed, then the selection is cleared; with the escape behavior set to none, the selection is kept and no change fires. [react-aria] (candidate)
- [ ] `selection.keyboard.8` Given Home and End in a selection-follows-focus composite, then each replaces the selection with the item it focuses. [react-aria] (candidate)
- [ ] `selection.keyboard.9` Given the extend-to-boundary chords (Control+Shift+Home and Control+Shift+End, Shift+PageUp and Shift+PageDown), then the selection extends from the anchor to the first, last or page boundary and ADDS to an existing selection rather than replacing it. [react-aria] (candidate)
- [ ] `selection.keyboard.10` Given a selection mode of none, when unsupported modifier combinations are pressed, then focus does not move at all. [react-aria] (candidate)
- [ ] `selection.keyboard.11` Given the focused item is already selected, when Space or Enter is pressed, then no further selection change fires and an action handler, if present, runs once. [react-aria] (candidate)
- [ ] `selection.keyboard.12` Given a multi-select cursor model with three separate pieces of state (cursor, active range and committed selection), when Shift plus a direction key is pressed with no cursor, then the boundary item becomes the cursor and the only selected item. [corvu] (candidate)
- [ ] `selection.keyboard.13` Given exactly one active item and no established direction, when Shift plus a direction key is pressed, then the cursor item's own selection is toggled and the direction is recorded, so the first Shift press selects the current row rather than moving. [corvu] (candidate)
- [ ] `selection.keyboard.14` Given a Shift extension in progress, then moving onto an item that is not yet active appends it and selects it, while moving onto an item that IS already active removes the old cursor and deselects it, so the range shrinks instead of growing. [corvu] (candidate)
- [ ] `selection.keyboard.15` Given Shift is held at either end of the list, then no wrap occurs regardless of the loop setting. [corvu] (candidate)
- [ ] `selection.keyboard.16` Given Home, End, Tab or Shift+Tab in a multi-select composite, then the active range collapses to the single cursor item and the recorded direction resets, while the committed selection is left exactly as it was. [corvu] (candidate)

### Pointer

- [ ] `selection.pointer.1` Given single selection, when a different item is activated, then it becomes selected and the previous one is deselected; activating the selected item again clears the selection. [react-aria, zag]
- [ ] `selection.pointer.2` Given highlight (replace) selection without a modifier, when an item is clicked, then the whole selection is replaced with it; clicking the already-selected item again does NOT deselect it and fires no change. [react-aria] (candidate)
- [ ] `selection.pointer.3` Given highlight selection WITH the platform modifier held (Meta on macOS, Control on Windows), then the clicked item is toggled into or out of the existing selection rather than replacing it. [react-aria] (candidate)
- [ ] `selection.pointer.4` Given a selected anchor item, when another item is Shift-clicked, then the inclusive range between them is selected; a second Shift-click keeps the ORIGINAL anchor rather than moving it to the last clicked row. [react-aria, zag]
- [ ] `selection.pointer.5` Given a range selection that spans disabled items, then those items are excluded from the resulting selection. [react-aria] (candidate)
- [ ] `selection.pointer.6` Given touch input, then selection always toggles rather than replaces, even in highlight mode; the same applies to a screen reader's virtual pointer (zero-size pointer events, or the Android TalkBack shape). [react-aria] (candidate)
- [ ] `selection.pointer.7` Given a highlight-selection collection with a row action and touch input, then a single tap performs the action and changes no selection; entering selection mode requires a long press of 800ms, after which the collection announces the selection, shows its select-all control, and later taps toggle without a further long press. Leaving the selection empty exits selection mode again. [react-aria] (candidate)
- [ ] `selection.pointer.8` Given touch input before selection mode is entered, then the collection carries a description saying "Long press to enter selection mode." [react-aria] (candidate)
- [ ] `selection.pointer.9` Given a select-on-press-up setting, then selection commits on pointer release; by default (and with the setting off) it commits on pointer press and does not fire again on release. [react-aria] (candidate)
- [ ] `selection.pointer.10` Given a selection mode of none with a row action, then a single click performs the action and fires no selection change. [react-aria] (candidate)
- [ ] `selection.pointer.11` Given a collection whose drag and drop is disabled, then selection still works, including the select-all control. [react-aria] (candidate)

### State

- [ ] `selection.state.1` Given a selection mode of multiple, then select accumulates values with no modifier because it routes through toggle; in single mode select replaces the whole selection, and toggles off only when the selection is allowed to be empty. [zag] (candidate)
- [ ] `selection.state.2` Given a selection mode of none, then every operation (is-selected, toggle, replace, set and extend) leaves the selection unchanged and is-selected reports false even for a value in the underlying set. [zag] (candidate)
- [ ] `selection.state.3` Given a selection that is not allowed to be empty, then clearing it returns the selection with its values intact. [zag] (candidate)
- [ ] `selection.state.4` Given an extend operation in single mode, then it delegates to replace with the target value so only the target ends up selected. [zag] (candidate)
- [ ] `selection.state.5` Given an extend operation, then the range is resolved in COLLECTION order regardless of the direction of the drag, and a zero-length range selects only the anchor. [zag] (candidate)
- [ ] `selection.state.6` Given set-selection in single mode with several values, then only the first value is kept. [zag] (candidate)
- [ ] `selection.state.7` Given any operation that returns a new selection, then the selection mode and the allow-empty flag carry over, so the mode survives every state transition. [zag] (candidate)
- [ ] `selection.state.8` Given the first or last selected value is requested, then it is the selected value earliest or latest in COLLECTION order, not in insertion order. [zag] (candidate)
- [ ] `selection.state.9` Given a cache of selected items alongside a collection, then the collection's live item wins over a stale cached copy, a selected item whose value has been filtered out of the collection is still resolved from the cache, and values dropped from the selection are pruned from the cache. [zag] (candidate)
- [ ] `selection.state.10` Given a select-on-focus single-selection composite, when Tab moves focus into it, then the first item is focused AND selected. [react-aria] (candidate)
- [ ] `selection.state.11` Given a highlight multiple-selection composite entered by keyboard, then the initial focus move itself fires a selection change, so a keyboard interaction reports one more change than the equivalent pointer interaction. [react-aria] (candidate)
- [ ] `selection.state.12` Given a controlled selection whose value the consumer never updates, then the change callback reports the requested selection and the rendered state does not move on its own. [react-aria] (candidate)
- [ ] `selection.state.13` Given a selection toggled to selected and then away with a screen reader or touch, then the collection announces each change, naming the item and the running count ("Baz selected. 2 items selected.", "Foo 10 not selected. 1 item selected."). [react-aria] (candidate)
- [ ] `selection.state.14` Given a selection that goes from all-selected to a single arrow press, then the selection collapses to the newly focused item and the announcement reports the new count. [react-aria] (candidate)

### Notes and edge cases

- [ ] `selection.notes.1` Given a can-select guard that checks the mode before the disabled state, then a disabled item can still be added to a selection in single, multiple and extended modes: the disabled check only bites in the "none" mode where selection is blocked anyway, which makes the guard effectively dead. Worth not copying. [zag] (candidate)
- [ ] `selection.notes.2` Given two selections compared for equality, then they are compared as arrays in iteration order, so the same values inserted in a different order compare as unequal. [zag] (candidate)
- [ ] `selection.notes.3` Given a multi-select primitive, then modelling cursor, active range and committed selection as three separate pieces of state (rather than one selection array) is what makes shrink-the-range Shift behavior expressible. [corvu] (candidate)
- [ ] `selection.notes.4` Given a Shift-extension direction flag kept outside the reactive system, then a test cannot read or seed it and Shift sequences must be replayed key by key from a known start. [corvu] (candidate)

## typeahead

### Keyboard

- [ ] `typeahead.keyboard.1` Given a composite and printable characters typed in rapid succession, then the accumulated search string moves focus to the first item whose text starts with it, matching across group and section boundaries. [react-aria, base-ui, reka, bits, zag, ariakit]
- [ ] `typeahead.keyboard.2` Given matching, then it is case-insensitive in both directions and does not depend on locale-sensitive lowercasing (an `i` still matches "Istanbul" under the Turkish locale). [base-ui, reka, bits, zag]
- [ ] `typeahead.keyboard.3` Given the same character typed repeatedly, then the search collapses to that single character and each press advances to the next item starting with it, cycling around the end of the list. [react-aria, base-ui, reka, bits, zag]
- [ ] `typeahead.keyboard.4` Given a single-character search, then the currently matched item is excluded from the candidates so the press advances; given a multi-character search, the current item stays in the candidate set, so a search that matches only the current item moves nothing. [reka, bits, zag]
- [ ] `typeahead.keyboard.5` Given a search, then it starts from the current item and wraps past the end of the collection; when nothing past the current item matches, it wraps around to an earlier one. [react-aria, base-ui, reka, bits, zag]
- [ ] `typeahead.keyboard.6` Given no item matches the search, then nothing moves. [reka, bits, zag]
- [ ] `typeahead.keyboard.7` Given a space character typed while a search is in progress, then it is treated as part of the search string rather than as an activation key, so "foo bar" matches an item whose text contains a space; a doubled space matches nothing. [react-aria, bits]
- [ ] `typeahead.keyboard.8` Given a search is in progress in a single-selection collection, when Space is pressed, then no selection is made; once the search buffer has timed out, the same Space selects the focused item. [react-aria] (candidate)
- [ ] `typeahead.keyboard.9` Given an item with an explicit text value that differs from its rendered text, then the explicit text value is what typeahead matches. [react-aria, reka]
- [ ] `typeahead.keyboard.10` Given items hidden with `display: none` or `visibility: hidden`, then they are excluded from matching, and a hidden entry starting with two of the same letter does not disable rapid single-letter cycling. [base-ui] (candidate)
- [ ] `typeahead.keyboard.11` Given a typeahead over a list whose entry itself begins with two of the same letter, then rapid single-letter cycling is abandoned and the second press is treated as part of a two-character search. [base-ui] (candidate)
- [ ] `typeahead.keyboard.12` Given key events originating inside the composite's container OR inside its popup, then both drive typeahead. [base-ui] (candidate)
- [ ] `typeahead.keyboard.13` Given a typeable reference (a combobox input), then Home and End are left to the input's text caret rather than jumping the list. [base-ui] (candidate)
- [ ] `typeahead.keyboard.14` Given the composite contains a text input, or a dialog opened from it contains one, then typing into that input does not move composite focus: the input receives the characters. [react-aria] (candidate)
- [ ] `typeahead.keyboard.15` Given a collection whose rows have several row-header columns, then typeahead matches text in ANY row-header column and excludes non-row-header columns; matching moves focus cell by cell when a cell is focused and row by row when a row is focused. [react-aria] (candidate)
- [ ] `typeahead.keyboard.16` Given a closed trigger for a collection, when characters are typed on the trigger, then the selection itself changes without opening the popup. [react-aria] (candidate)
- [ ] `typeahead.keyboard.17` Given two composites on one page, then the typeahead buffer is per-instance: a buffer built in the first composite does not carry into a single character typed in the second. [ariakit] (candidate)
- [ ] `typeahead.keyboard.18` Given a typeahead helper with a callback supplied, then the callback receives the key, the buffer still accumulates, and no element is focused: the consumer decides what to do. [reka] (candidate)
- [ ] `typeahead.keyboard.19` Given an explicit reset call, then the buffer is emptied immediately without waiting for the timer. [reka] (candidate)
- [ ] `typeahead.keyboard.20` Given a typing-activity callback, then it fires with true on the first character and with false when the buffer resets. [base-ui] (candidate)
- [ ] `typeahead.keyboard.21` Divergence: the search buffer resets 350ms after the last keystroke. [zag] (decision needed)
- [ ] `typeahead.keyboard.22` Divergence: the search buffer resets 500ms after the last keystroke. [ariakit] (decision needed)
- [ ] `typeahead.keyboard.23` Divergence: the search buffer resets 750ms after the last keystroke. [base-ui] (decision needed)
- [ ] `typeahead.keyboard.24` Divergence: the search buffer resets 1000ms after the last keystroke. [reka] (decision needed)

### Notes and edge cases

- [ ] `typeahead.notes.1` Given the text a typeahead reads from an element, then it is the element's text content with emojis, hidden elements, `aria-hidden` elements and `role="img"` elements stripped out; the element's own `aria-label` takes precedence over its content, and `aria-labelledby` is resolved by reading each referenced element's `aria-label` or contents. [headlessui] (candidate)
- [ ] `typeahead.notes.2` Given a search that arms a reset timer, then any previously armed timer is cleared first, so the window is measured from the last keystroke rather than the first. [zag, reka]

## hotkeys

### Keyboard

- [ ] `hotkeys.keyboard.1` Given a hotkey string, then `+` separates modifiers from the key and `>` separates sequence steps, and parsing yields the keys, the physical codes, the four modifier flags and whether it is a sequence. [zag] (candidate)
- [ ] `hotkeys.keyboard.2` Given the platform alias `mod`, then it resolves to Meta on macOS and Control everywhere else; the accepted modifier spellings are ctrl/control, alt/option, shift, and meta/cmd/command/win/windows. [zag, ark, react-aria]
- [ ] `hotkeys.keyboard.3` Given a hotkey whose key is itself `+` (as in "mod++"), then the trailing empty segment is treated as the start of the key, so the key is the literal `+` with code `Equal`, not an empty key. [zag] (candidate)
- [ ] `hotkeys.keyboard.4` Given a hotkey string that is a single bare modifier name, then it parses as that modifier with no key, case-insensitively, and a bare `mod` still resolves per platform. [zag] (candidate)
- [ ] `hotkeys.keyboard.5` Given two spellings of the same chord, then normalizing both produces one identical canonical string, and the canonical modifier order is fixed as Control, Alt, Shift, Meta followed by the keys. Sequence separators normalize to a single space on each side of `>`. [zag, react-aria]
- [ ] `hotkeys.keyboard.6` Given key normalization, then a lowercase single letter is uppercased, digits and symbols pass through, and the alias groups collapse: enter/return to Enter, esc/escape to Escape, space/spacebar to the single space character, up/arrowup to ArrowUp (and the other three arrows likewise), pageup/pgup to PageUp, pagedown/pgdn to PageDown, del/delete to Delete, ins/insert to Insert, and f1 through f19 to their uppercase form. [zag, react-aria]
- [ ] `hotkeys.keyboard.7` Given F20 or higher, then it is returned byte for byte unchanged, so the normalization range deliberately stops at F19. [zag] (candidate)
- [ ] `hotkeys.keyboard.8` Given normalization, then it is idempotent: an already canonical key comes back unchanged, and a mixed-case multi-character word keeps its casing because the browser is assumed to report it correctly. [zag] (candidate)
- [ ] `hotkeys.keyboard.9` Given a letter or digit hotkey, then modifiers must match EXACTLY: an unlisted extra Shift breaks the chord, and a plain-key binding does not fire while an unrelated modifier is held. [zag, react-aria]
- [ ] `hotkeys.keyboard.10` Given a letter hotkey and a layout where the physical key produces a different character, then it matches through the physical code, so letter bindings are layout independent. [zag] (candidate)
- [ ] `hotkeys.keyboard.11` Given a symbol hotkey, then it matches on the PRODUCED character regardless of which physical key produced it and regardless of an extra Shift the layout needed, while a declared Ctrl, Meta or Alt is still required. [zag] (candidate)
- [ ] `hotkeys.keyboard.12` Given the symbol-versus-strict classification, then a single ASCII letter or digit and any single Unicode letter or number take the strict path, any single punctuation character (including the space) takes the lenient symbol path, and any key name of length other than 1 is a named key. [zag] (candidate)
- [ ] `hotkeys.keyboard.13` Given a dead key event (key "Dead", produced by accent and compose keys), then no hotkey matches, the key is not added to the pressed set, and dispatch returns immediately. [zag] (candidate)
- [ ] `hotkeys.keyboard.14` Given a sequence hotkey, then the steps must arrive in order within the sequence window; a wrong second key resets the sequence state and fires nothing. [zag, ark]
- [ ] `hotkeys.keyboard.15` Given a configured sequence window, then steps landing inside it complete the sequence and a step arriving after it does not, because the sequence state has already been reset. [ark] (candidate)
- [ ] `hotkeys.keyboard.16` Given a chord and a longer chord sharing its prefix (Control+S and Control+Shift+S), then each fires only for its own exact modifier set; a bare key and its modified version are likewise distinct. [zag] (candidate)
- [ ] `hotkeys.keyboard.17` Given several commands matching one event, then matches are sorted by priority descending then registration order ascending and only the highest-priority tier executes, where priority is 1000 for a sequence, 100 per modifier, 10 per key and 100 for a target. [zag] (candidate)
- [ ] `hotkeys.keyboard.18` Given a command whose event type is keyup, then the action runs on release, and it runs before the key is removed from the pressed set so it still sees the key as held. [zag, ark]
- [ ] `hotkeys.keyboard.19` Given a command that requires a reset, then the command id is remembered when it fires and further keydowns are ignored until a keyup clears it, so the action runs once per physical press rather than on every auto-repeat. [zag] (candidate)
- [ ] `hotkeys.keyboard.20` Given a hotkey recorder, then a lone modifier keydown and a "Dead" key are ignored while it waits for a real key; every keydown and keyup it sees is default-prevented and the keydown also has propagation stopped, so recording swallows the keystroke. [zag] (candidate)
- [ ] `hotkeys.keyboard.21` Given a recorder that captures a chord, then recording stops when the sequence window closes and the record callback fires once with the captured value; stopping with nothing pressed keeps the previous value and does not fire again. [zag, ark]
- [ ] `hotkeys.keyboard.22` Given a recorder holding a previous value, then Escape (or an explicit cancel) reverts to it and fires the cancel callback, while Backspace clears the value to empty, fires the clear callback, and also wipes the saved previous value so a later cancel cannot resurrect it. [zag, ark]

### Focus management

- [ ] `hotkeys.focus.1` Given a key held when the window loses focus, then the pressed-key and pressed-code sets are emptied so the key does not stay stuck; a `contextmenu` event does the same, because opening a native context menu swallows the matching keyup. [zag] (candidate)
- [ ] `hotkeys.focus.2` Given a command scoped to a target element, then the command is skipped unless the event originates within that target, containment is decided from `composedPath()` so it works across a shadow boundary, and a target given as a function is re-resolved on every event (resolving to nothing skips the command). [zag] (candidate)

### State

- [ ] `hotkeys.state.1` Given store-level default options, then a command with no options of its own inherits them, a command's own options win over them, and a command registered before initialisation is re-resolved once the defaults arrive, so registration order relative to initialisation does not matter. [zag] (candidate)
- [ ] `hotkeys.state.2` Given the default command options, then prevent-default is true, stop-propagation false, form-tag handling off, content-editable handling off and capture true. [zag] (candidate)
- [ ] `hotkeys.state.3` Given a command registered as disabled, then the hotkey does nothing until it is enabled, after which it fires once. [zag] (candidate)
- [ ] `hotkeys.state.4` Given a pressed-state query, then it is layout independent through the physical code path, it applies the same modifier strictness as chord matching, it reports a held modifier on its own, and it always answers false for a sequence, because "all keys held at once" does not apply. [zag] (candidate)
- [ ] `hotkeys.state.5` Given a store with no commands registered but at least one subscriber, then key-state tracking still works: the store attaches a capture listener for subscriber-only use, and re-attaches when a later bubble-phase command needs one. [zag] (candidate)
- [ ] `hotkeys.state.6` Given the store is destroyed, then every listener detaches, the store reports itself not listening, and the pressed set stays empty for later events; subscribers are cleared first so nothing can restart listening. [zag] (candidate)
- [ ] `hotkeys.state.7` Given a global command and a target-scoped command on the same hotkey, then an event inside the target runs only the scoped action and an event outside runs only the global one, because a target adds 100 to the priority and only the top tier executes. Registering the same hotkey on different targets logs no conflict warning; a second GLOBAL registration warns exactly once. [zag] (candidate)
- [ ] `hotkeys.state.8` Given the conflict behavior, then "allow" keeps both registrations, "replace" drops the earlier one, the default warns and keeps both, and "error" throws on the second registration. [zag, ark]
- [ ] `hotkeys.state.9` Given active scopes, then a command scoped to an inactive scope does not fire while an unscoped command does, because an unscoped command defaults to the wildcard scope. Any scope mutation clears all in-progress sequence state. [zag, ark]
- [ ] `hotkeys.state.10` Given a command unmounted or unregistered, then its hotkey no longer fires. [ark] (candidate)
- [ ] `hotkeys.state.11` Given an action that closes over changing state, then the latest action runs without the command being re-registered, because the store resolves the current command on every event. [ark] (candidate)
- [ ] `hotkeys.state.12` Given a command whose fields are unchanged across a render, then it is not re-registered; a change to one command's field advances only that command's registration order; and two spellings of the same hotkey count as unchanged because the reconciler compares the canonical form. [ark] (candidate)
- [ ] `hotkeys.state.13` Given a registration list, then it exposes each command's id, the hotkey string AS WRITTEN (not normalized), its label and its category, and it updates when a command unregisters. [ark] (candidate)
- [ ] `hotkeys.state.14` Given a command whose enabled flag toggles, then the same single registration stays on the store rather than being unregistered and re-registered. [ark] (candidate)
- [ ] `hotkeys.state.15` Given two components registering without naming a store, then both land on one lazily created module-level default store, and one unmounting does not stop the other's hotkey. [ark] (candidate)
- [ ] `hotkeys.state.16` Given a command id another component already registered on the same store, then a development warning explains that the earlier command silently stops firing and suggests a unique id, an omitted id, or a separate store; commands with no id are keyed per instance so two components never collide. [ark] (candidate)
- [ ] `hotkeys.state.17` Given a subscriber whose selected value is unchanged by an event, then its callback does not run; given a subscriber or command action that throws, then the error is caught and logged rather than breaking dispatch for other commands. [zag] (candidate)
- [ ] `hotkeys.state.18` Given a store created with no target, when it is initialised without one, then it throws, naming the target as required. [zag] (candidate)
- [ ] `hotkeys.state.19` Given commands registered before initialisation whose hotkey contains a platform alias, then only those commands are re-parsed and re-prioritised once the real platform is known, so a store built during module evaluation still resolves the alias correctly. [zag] (candidate)

### Forms

- [ ] `hotkeys.forms.1` Given focus is inside a form field, then a single-key hotkey does not fire and the character reaches the field; a chord carrying Ctrl, Meta or Alt DOES fire, because registration auto-enables form tags for any such hotkey unless the author set the option explicitly. A Shift-only chord does not get that auto-enable, since only Ctrl, Meta and Alt count. [zag, ark]
- [ ] `hotkeys.forms.2` Given the form-tag option set to true, then all of input, textarea and select are allowed; given an array, only the listed tag names are; given false or absent, all three are skipped. [zag] (candidate)
- [ ] `hotkeys.forms.3` Given an event target that reports itself content-editable, then the command is skipped regardless of tag name unless the content-editable option is true. [zag] (candidate)
- [ ] `hotkeys.forms.4` Given an event target that cannot be resolved to an HTML element, then the hotkey is allowed rather than blocked. [zag] (candidate)

### RTL and i18n

- [ ] `hotkeys.rtl.1` Given a symbol hotkey produced on an international layout with the Shift the layout needs (German QWERTZ Shift+7 for `/`, French AZERTY Shift plus Period, Turkish Q Shift plus Comma for `;`), then it matches; the declared Ctrl is still required when the binding names it. [zag] (candidate)
- [ ] `hotkeys.rtl.2` Given a physical key that produces a different character on another layout, then the code fallback never fires without a modifier held, so a layout that simply puts another character on that key does not false-positive. [zag] (candidate)
- [ ] `hotkeys.rtl.3` Given a Windows AltGr event, which reports ctrlKey, altKey and AltGraph together, then a SYMBOL hotkey matches because AltGr is detected and Ctrl and Alt are neutralised first, while a Ctrl-declared hotkey does NOT match, so typing a composed character never triggers a Ctrl shortcut. A genuine Ctrl press with no AltGraph does match. [zag] (candidate)
- [ ] `hotkeys.rtl.4` Given a non-symbol key in an AltGraph event with ctrlKey set, then it is blocked outright, so Ctrl+I does not fire when AltGr+I produces "İ" and Ctrl+Alt+E does not fire when AltGr+E produces "€". Binding the composed character directly does work. [zag] (candidate)
- [ ] `hotkeys.rtl.5` Given macOS Option, which sets only altKey and (in Firefox) reports AltGraph for a bare Option press, then a symbol produced with Option matches, which is why the AltGraph guard additionally requires ctrlKey; an explicitly declared Alt is never waived. [zag] (candidate) (safari-only)
- [ ] `hotkeys.rtl.6` Given a symbol step inside a sequence typed with Option or Alt held that the binding does not name, then the sequence completes; a step that DOES name Alt requires it, and the AltGraph guard applies inside sequences too. [zag] (candidate)
- [ ] `hotkeys.rtl.7` Given hotkey display formatting, then macOS renders modifiers as ⌃ ⌥ ⇧ ⌘, Windows as Ctrl, Alt, Shift and Win, and Linux uses Super for Meta; the display order is Control, Alt, Shift, Meta. [zag] (candidate)
- [ ] `hotkeys.rtl.8` Given hotkey display formatting, then arrows render as ↑ ↓ ← → and Enter, Delete and Space as ↵, ⌦ and ␣ under the symbol styles, while Home, End, PageUp, PageDown and the function keys keep their word names; the text style spells arrows and special keys out in words instead. [zag] (candidate)
- [ ] `hotkeys.rtl.9` Given a sequence formatted for display, then its steps join with " then " by default, configurable to any separator; the part separator inside a chord is likewise configurable, including to the empty string. [zag] (candidate)
- [ ] `hotkeys.rtl.10` Given formatting with no platform given, then the platform is detected at runtime and formatting does not throw; leading and trailing whitespace in the hotkey string is trimmed, and the empty string formats to the empty string. [zag] (candidate)
- [ ] `hotkeys.rtl.11` Given platform detection, then a Linux desktop resolves to linux, Chrome OS resolves to linux, Android resolves to windows (never linux) with the user-agent-data hint honoured over the legacy platform string, and no navigator at all falls back to windows. [zag, ark]

### SSR and hydration

- [ ] `hotkeys.ssr.1` Given platform detection during server rendering, then it returns the windows fallback so the markup is stable, and the real platform is detected only after hydration, in an effect or on mount, so no framework touches the document during render. [ark] (candidate)

### Notes and edge cases

- [ ] `hotkeys.notes.1` Given a hotkey with several keys, then matching succeeds if ANY of the alternatives matches the event, so a multi-key chord is an OR of alternatives rather than a requirement that every key be held. [zag] (candidate)
- [ ] `hotkeys.notes.2` Given key-to-code mapping, then single uppercase letters map to `KeyX`, digits to `DigitX`, F1 through F20 and the named navigation keys to themselves, and the punctuation set to Space, Minus, Equal (for both `=` and `+`), BracketLeft, BracketRight, Semicolon, Quote, Backquote, Backslash, Comma, Period and Slash; anything else has no code and can only match on the logical key. [zag] (candidate)
- [ ] `hotkeys.notes.3` Given hotkey validation, then an empty string, an unrecognised modifier segment and an empty sequence step are errors (the last prefixed with its step number), while a modifier-only hotkey, a duplicate modifier and an unrecognised key name are warnings; the assert form throws only on errors. [zag] (candidate)
- [ ] `hotkeys.notes.4` Given the platform split as a whole, then it shows up in four distinct places: the `mod` alias resolves to Meta against Control, display uses Apple glyphs against words, macOS Option sets only altKey while Windows AltGr sets ctrlKey and altKey together, and macOS Firefox reports AltGraph for a bare Option press so the AltGraph guard additionally requires ctrlKey. [zag] (candidate)

## Sources

- `apg-and-axe.md`: the cross-cutting `content/practices/keyboard-interface/keyboard-interface-practice.html` prose quoted through `## button`, `## toolbar`, `## menubar`, `## radio-group`, `## tabs` and `## listbox` (single tab stop, the three tab-stop families, the roving-tabindex write order, `aria-activedescendant` DOM relationships and manual scrolling, selection-follows-focus, pointer and keyboard parity, focusability of disabled controls), plus the axe `tabindex` and `duplicate-id-aria` rules.
- `ariakit-and-headlessui.md`: `## composite` (navigation, grids, virtual focus event order, page scrolling, late and pending moves, presentation cancellation, iframe event realms, virtualized renderers, pre-hydration tab order) and `## collection`; the text-extraction helper bullets come from Headless UI's `get-text-value` tests.
- `radix-and-base-ui.md`: `## composite` (Base UI `CompositeRoot`, `CompositeList`, `useCompositeListItem`, the vendored `useListNavigation` including its WebKit file, `useTypeahead`, and the `composite` utility tests), `## roving-focus` (which records that Radix's own `RovingFocusGroup` has no test file, so its contract is asserted through the components that compose it) and `## collection` (Radix's `OrderedDict`).
- `react-aria-a.md` and `react-aria-b.md`: `## selection` (`useSelectableCollection`, and the ListBox, GridList, ListView and Table selection suites), `## typeahead`, `## collections` (`CollectionBuilder`, `useControlledState`, `scrollIntoView`).
- `kobalte-and-corvu.md`: `## selectable` (Corvu's `createList` and `createMultiList`).
- `reka-melt-bits.md`: `## roving-focus` (Reka `RovingFocusGroup`), `## arrow-navigation` (Reka `useArrowNavigation` plus the Melt and Bits array helpers), `## collection` (Reka `Collection`), `## typeahead` (Reka `useTypeahead`, Bits `getNextMatch`).
- `zag-and-ark.md`: `## collection` (list, grid and tree collections, `Selection`, the selected-item map) and `## hotkeys` (parser, normalizer, matcher, store, recorder, formatter, the smoke table, and Ark's React, Solid and Svelte hooks).

Kobalte contributes nothing to this file beyond Corvu's list primitives, which
sit in its `## selectable` section. The APG has no "composite" pattern of its
own, so every normative bullet here is quoted from the keyboard-interface
practice through a concrete pattern.

## Deferred

- Pure array-helper unit tests (Melt's `next`/`prev`/`forward`/`back`/`last`/`wrapArray`, Bits' `next`/`prev`/`forward`/`backward`/`wrapArray`/`isValidIndex`/`arraysAreEqual`/`chunk`, Radix's `OrderedDict` method surface, most of Zag's list, grid and tree collection API): roughly 200 bullets of internal helper contracts. They belong next to the code in `packages/core`, not in a conformance suite that mounts components. The behaviors that are observable through a component (boundary clamp versus loop, disabled skipping, tree visibility) are kept above; the helper return values are not. The one disagreement worth recording is that at a non-looping boundary some helpers return the boundary item and others return nothing, which is unobservable from outside because focus does not move either way.
- Tree collections as a whole (`collection.keyboard.5` to `.7`, `collection.notes.4` to `.6`): no component in the inventory is a tree yet. Kept because tree-view and the file-tree shapes are in the research, dropped from the first implementation.
- Grid navigation (`composite.keyboard.11` to `.17`): correct and well evidenced, but the first components to land are lists and toolbars. These stay unchecked rather than removed, since calendar and table will need every one of them.
- Virtualization (`composite.notes.3` to `.5`, `collection.positioning.2`, the virtualized grid wrapping bullets): needs a renderer with real measurement, so it cannot be asserted in the first jsdom suite.
- Ariakit's pending-and-superseded-move matrix (`composite.focus.12` to `.19`): about 12 bullets covering one library's async focus queue. The principle worth keeping is that a queued focus move must never be replayed after the user has moved focus themselves; the rest is that library's internal scheduling and would over-constrain a different implementation.
- The hotkeys display formatter (`hotkeys.rtl.7` to `.10`): presentation, not behavior. A headless library can expose it, but it is not part of the keyboard engine's contract and nothing else depends on it.
- Hotkey recorders (`hotkeys.keyboard.20` to `.22`): a settings-UI feature, not a navigation behavior. Recorded because two libraries ship one.
- Selection announcements (`selection.state.13`, `.14`): they need a live region and locale strings, which is its own component. The selection state changes they observe are covered by the surrounding bullets.
- Framework-reconciliation behavior (`hotkeys.state.11` to `.16`, `composite.notes.6`, the suspense and activity bullets): these pin how one adapter's hooks reconcile, and the suite is meant to run against any adapter. Worth revisiting per adapter, not in the shared suite.
