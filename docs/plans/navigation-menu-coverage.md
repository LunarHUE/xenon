# Navigation menu coverage

NavigationMenu is site navigation built from nav, ul, li, button and a elements.
It shares the DOM floating-layer, positioning, portal and viewport controllers.
It imports neither Menu nor Popover. There are no menu, menubar, menuitem or
dialog roles and no roving tabindex or typeahead.

## Selected behavior

Root uses `value: string | null`; null closes and undefined uses uncontrolled
state. Empty strings are valid identities. Initialization and equal requests are
silent. `defaultValue` is read once. Root defaults to an overridable "Main
navigation" label. Item supplies the trigger value. Content may inherit Item or
receive a value when panels are grouped in a shared Viewport. Panels remain
mounted and use hidden when inactive, including during server rendering.

Click and native Enter/Space toggle a disclosure without moving focus. ArrowDown
opens horizontal navigation and focuses the first panel tab stop after positioning.
Vertical navigation uses ArrowRight, or ArrowLeft for RTL. This selects the
keyboard.4 alternative; keyboard.3 applies only to click/Enter/Space. Lists retain
all native tab stops; arrows and Home/End offer shortcuts through buttons and
native links. Panel arrows and Home/End do not wrap. Tab enters a portaled panel,
Shift+Tab from its first stop returns to the trigger, and Tab from its final stop
moves to the next native stop after the trigger and closes. Escape from content
returns focus to the active trigger; deliberate outside focus remains untouched.

Mouse hover opens after openDelay, default 200ms. An already open navigation
switches immediately. Leaving a trigger or panel starts closeDelay, default 150ms;
entering content cancels it. Touch does not start hover timers. openOnHover=false
retains click and keyboard opening. Native link navigation is preserved; uncanceled
clicks close, and onClick/onSelect preventDefault veto closure. Positioner anchors
to the selected trigger and uses fixed native manual-popover hosting. Shared
Viewport supplies measured dimension variables and inert outgoing snapshots.

## Verification

- Pure core tests cover native semantics, null/empty selection, ID associations,
  current-page links, and disabled/canceled requests.
- Solid tests cover uncontrolled switching, controlled null, custom IDs, hidden
  retained panels, current-page links, cancellation and hover timing/touch gating.
- Server tests assert one retained panel, closed hidden state, custom trigger and
  content ID resolution, and native href preservation.
- Chromium and WebKit cover native top-layer hosting, keyboard opening, forward
  and backward portaled Tab, Escape return, list navigation including links,
  outside-focus dismissal, vertical RTL opening, mouse hover traversal and
  immediate switching, link selection, and axe checks.

## Deferred candidates and limits

Inline nested navigation controllers and nested activation inheritance, proxy
aria-owns associations, hidden trigger proxies, indicators/icons, pointer traversal
locks, patient-click thresholds, unmounted closed panels, exit-presence callbacks,
and the larger positioning.3–13 auto-sizing interruption contract remain deferred.
The existing viewport controller supplies dimension and movement hooks rather
than implementing the entire Base UI animation contract. Consumer CSS owns motion.

Custom as hosts must preserve the default host's native semantics, keyboard behavior
and ref forwarding. The adapter samples inherited dir after mount. Live changes to
ancestor dir and custom ID props after mount are not supported; explicit root dir
is reactive. DOM focus testing intentionally runs in browsers rather than relying
on jsdom layout. Portal hydration, shadow-root tab traversal, positive tabindex
ordering, nested native layers and disabled-fieldset traversal need dedicated
coverage before claiming those contracts.
