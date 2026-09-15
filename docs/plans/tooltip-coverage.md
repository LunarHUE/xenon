# Tooltip coverage

Tooltip resolves behavior through an optional Provider and local overrides. It
reuses Popover's presence, native hosting, portal, positioning, handle, and
viewport internals. Its trigger and content semantics remain tooltip-specific.

## Decisions

- Local defined props override the nearest inherited value. Zero and false are
  meaningful overrides. Defaults are 600ms open, 100ms close, 300ms skip delay,
  hoverable content, close on trigger press, and close on Escape.
- Nested providers share a delay group unless `isolated` is true at mount. Roots
  without a provider each own a group. No group exists at module scope.
- Opening a group member requests closure of its predecessor. Controlled roots
  may reject that request. The group is a timing coordinator, not visibility
  ownership. Handle-based trigger switching instead reuses one root and popup.
- Focus opens immediately and stays on the trigger. Hover and focus independently
  retain intent. Touch and its synthesized focus/mouse events do not open tips.
  Native disabled controls cannot trigger; aria-disabled controls can explain
  themselves. Root disabled suppresses visibility without disabling native actions.
  Re-enabling restores the root's underlying controlled or uncontrolled state.
- Pending open and close timers reconcile changed delays against elapsed time
  from the original intent. A fresh opening intent starts a fresh timer.
- Hoverable content allows a measured convex travel corridor. Idle travel expires
  after 300ms, then the close delay applies. Non-hoverable content and its native
  positioning wrapper both allow pointer input through to the page.
- Trigger descriptions preserve author IDs first. Generated descriptions identify
  only the active open tooltip. Triggers gain no expanded/haspopup state or role.
  Content has role=tooltip, takes no focus, and performs no focus restoration.
  Authors still supply the trigger's accessible name independently of its tooltip.
- Escape acts through the shared layer stack. Document or trigger-ancestor scroll
  dismisses; scrolling inside content does not. Outside focus and pointer input do
  not independently dismiss, though leaving trigger/content intent can close it.
- Hosting uses the established manual-popover layer controller. The alternative
  native hint-popover stack is not adopted. Portals are explicit and preserve
  native modal ancestry. Consumer CSS owns animations; data-instant is a hook,
  not an instruction that automatically disables animation.

## Executable evidence

- Core tests cover inherited defaults, explicit zero/false, clock boundaries,
  description semantics, disabled display, and force-mounted presence.
- DOM hover-intent tests cover delayed cancellation, touch suppression, disposal,
  independent focus/pointer retention, bounded travel, and live delay changes.
- Solid tests cover provider inheritance and warm-window expiry, nested defaults,
  controlled requests, exact author/content IDs, detached payload switching,
  disabled pending work, native action preservation, live inherited delays, and
  cancellation of press dismissal.
- Chromium and WebKit tests cover focus and hover without focus theft, native
  activation, real gap geometry, modal portal ancestry and Escape ordering,
  shared popup identity/reanchoring, isolated/inherited provider policies,
  initially-open positioning, ancestor-scroll dismissal, click-through of a
  non-hoverable positioned surface, and axe checks.
- The floating family SSR/hydration fixture checks retained closed markup and
  stable IDs, then native focus opening, description association, and Escape.
  It also checks for browser errors and hydration warnings.

Source specs contain mutually exclusive vendor alternatives. Their checkboxes
are not broadly marked complete by these focused implementation tests.

## Remaining candidates and dedicated checks

Cursor tracking, fullscreen portal migration, automatic removal of another
root's exiting animation, external presence flags, completion callbacks,
per-trigger disable overrides, and native hint-stack behavior are not provided.
Nested hoverable tooltip corridors, shadow roots, suspended hydration,
portal hydration, reactive anchor replacement, and every exit-animation
interruption need dedicated fixtures before claiming those contracts.

The shared positioning/layer/viewport suites cover their underlying geometry,
collision, restoration, and lifecycle behavior. That evidence does not turn every
Tooltip positioning or animation spec row into a direct Tooltip test.
