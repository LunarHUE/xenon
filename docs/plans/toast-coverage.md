# Toast coverage audit

This maps the source synthesis in [toast spec](../spec/toast.md) to the tests
written for the [approved implementation](toast.md). The synthesis combines
incompatible library decisions and is not itself an accepted conformance list.
`Covered` means the named assertions exercise that behavior. `Partial` means the
listed test checks only part of the source case. `Deferred` means no matching
assertion was found. These are coverage claims, not a record of a successful test
run; final verification and counts belong in the implementation plan.

The audit reads test source, including the adapter tests under development. It
does not treat a matching implementation branch as proof. Browser test files run
in the configured Chromium and WebKit projects. DOM helper tests use synthetic
events and do not establish native pointer capture or touch behavior by themselves.

## Test references

References below use a file abbreviation and an exact, distinctive test-title
prefix. The complete test title is in the linked file.

| Key | File |
| --- | --- |
| C | [Core semantics](../../packages/core/src/toast/toast.test.ts) |
| M | [Solid imperative manager](../../packages/solid/src/toast/manager.test.ts) |
| D | [DOM viewport and swipe controllers](../../packages/dom/src/toast/toast.test.ts) |
| S | [Solid compound parts](../../packages/solid/src/toast/toast.test.tsx) |
| B | [Native browser component tests](../../packages/suite/src/toast/toast.test-browser.tsx) |
| E | [Example and hydration browser tests](../../packages/suite/e2e/toast.spec.ts) |

The source suites linked in [the implementation plan](toast.md#source-suites)
include Base UI's manager, external manager, store, viewport, and root tests and
Sonner's browser interactions. Our tests translate the relevant behavior to the
Tenon API. They do not import those suites or claim their full coverage.

## Roles and attributes

| Spec ID | Status and evidence |
| --- | --- |
| `toast.roles.1` | Covered. S `record updates preserve content DOM` queries the named region; B `toast arrival leaves focus alone` focuses it. |
| `toast.roles.2` | Covered. S `record updates preserve content DOM` asserts region tabindex -1. |
| `toast.roles.3` | Partial. C `separates focusable notification semantics` checks the title association; S `record updates preserve content DOM` checks the accessible name after an update. Replacing a title element and removing the title entirely remain unverified. |
| `toast.roles.4` | Covered. C `separates focusable notification semantics` checks the description ID; S `record updates preserve content DOM` checks its removal when description becomes undefined. |
| `toast.roles.5` | Covered. S `record updates preserve content DOM` asserts tabindex 0; B `toast arrival leaves focus alone` reaches the newest root by native Tab. |
| `toast.roles.6` | Partial. S `limited records are hidden and inert` activates the default-labeled close control. Explicit type=button and localization assertions remain deferred. |
| `toast.roles.7` | Partial. S `record updates preserve content DOM` queries the author label Updates. Hotkey placeholder interpolation has no matching assertion yet. |
| `toast.roles.8` | Partial, with a deliberate lifetime difference. S `batched announcements retain every admitted message` checks message retention, dismissal cleanup, priority separation, and empty announcement content after 1000ms. Plain-text title plus description, author announcer container, and default body placement are not all asserted. The implementation retains its empty live-region hosts rather than removing the hosts after every message. |
| `toast.roles.9` | Divergence. Approved root role is group; announcements use separate live regions. C `separates focusable notification semantics` asserts group and absence of aria-live on the content root. |
| `toast.roles.10` | Divergence. Approved interactive content uses group, not alertdialog. See C `separates focusable notification semantics`. |
| `toast.roles.11` | Divergence. The viewport is not the announcement channel. Separate live regions avoid announcing interactive controls or rereading the stack. S `batched announcements retain every admitted message` checks the separate status and alert content. |
| `toast.roles.12` | Partial, with placement difference. S `batched announcements retain every admitted message` checks low/high messages in separate status/alert channels. Explicit aria-live values are not asserted there; urgency belongs to those channels, not the toast root. |
| `toast.roles.13` | Partial, with host-lifetime difference. S `batched announcements retain every admitted message` checks alert content and later emptiness. B `rapid arrivals announce each visible message` checks the alert is no longer found by accessible-role queries after all notifications close. That does not establish that the empty host was removed from the DOM. |
| `toast.roles.14` | Deferred by scope. Icons and localized variant labels are author presentation; this headless API supplies type metadata. |
| `toast.roles.15` | Divergence in anatomy. The approved implementation does not promise Zag's data-ghost elements. Native traversal across expanded gaps without collapse needs a dedicated assertion. |

## Keyboard

| Spec ID | Status and evidence |
| --- | --- |
| `toast.keyboard.1` | Covered. B `toast arrival leaves focus alone` dismisses only the focused newest toast, then its survivor. |
| `toast.keyboard.2` | Partial. B `toast arrival leaves focus alone` checks the first native Tab target. Full control order and exact reverse traversal remain deferred. |
| `toast.keyboard.3` | Deferred. No native assertion reaches both Tab boundaries and verifies return to the pre-hotkey element. |
| `toast.keyboard.4` | Divergence. Approved default is Alt+T, not F6. |
| `toast.keyboard.5` | Divergence. Approved default is Alt+T, not F8. |
| `toast.keyboard.6` | Partial. B `toast arrival leaves focus alone` verifies Alt+T focuses the viewport. D `viewport pause reasons overlap` tests focus pause and expansion separately; one native assertion joining all three effects remains deferred. |
| `toast.keyboard.7` | Divergence. Approved Escape dismissal requires focus in that notification. Global body Escape must not dismiss arbitrary notifications; a negative body-Escape assertion remains deferred. |
| `toast.keyboard.8` | Deferred. Portal-descendant Escape boundaries have no dedicated test. |
| `toast.keyboard.9` | Deferred. Native close-button Enter activation has no dedicated assertion; pointer click is covered separately. |

## Pointer

| Spec ID | Status and evidence |
| --- | --- |
| `toast.pointer.1` | Covered across tests. S `limited records are hidden and inert` clicks Close; S `batched announcements retain every admitted message` checks dismissal text cleanup; E `toast provider and viewport preserve server markup` checks Close removes content. |
| `toast.pointer.2` | Partial. D `viewport pause reasons overlap` checks hover reason delivery; M `queues before attachment, pauses independent reasons` verifies remaining-time accounting. A native hover test spanning a full lifetime is deferred. |
| `toast.pointer.3` | Covered for expansion, partial for collapse. B `measurement follows natural content growth` asserts data-expanded on both records after hover; D `viewport pause reasons overlap` checks expansion/collapse callbacks. |
| `toast.pointer.4` | Partial. D `viewport pause reasons overlap` and M `treats repeated pause reasons idempotently` verify pausing behavior. The source-specific data-paused attribute is not asserted. |
| `toast.pointer.5` | Deferred. Empty viewport hit-testing has no dedicated native assertion. |
| `toast.pointer.6` | Partial. D `dismissal retains the actual %s release offset` checks all four permitted directions; D `a recent flick dismisses` rejects tiny jitter; E `a swipe exits from the release position` verifies a native 90px swipe. Exact native 45px versus 5px/10px thresholds remain unverified. |
| `toast.pointer.7` | Covered in synthetic DOM events. D `disallowed motion has resistance` rejects a disallowed drag and permits a subsequent allowed one; D `dismissal retains the actual %s release offset` covers directions. Native multi-direction matrix deferred. |
| `toast.pointer.8` | Covered in synthetic DOM events. D `diagonal drags lock their first dominant axis`. |
| `toast.pointer.9` | Covered in synthetic DOM events. D `reversing 40px cancels an armed direction` and D `a recent flick dismisses` reject reversal dismissal. |
| `toast.pointer.10` | Covered in synthetic DOM events. D `secondary buttons and non-primary pointers do not start swipes`. |
| `toast.pointer.11` | Covered in synthetic DOM events. D `interactive %s descendants cannot start swipes` includes data-swipe-ignore. |
| `toast.pointer.12` | Deferred by scope. Anchored notifications are not in this release. |
| `toast.pointer.13` | Covered in synthetic DOM events. D `touch default prevention exists only during movement`. Native touch scrolling remains unverified. |
| `toast.pointer.14` | Partial. D `disallowed motion has resistance` checks document cancellation and a subsequent allowed swipe; D `touch default prevention exists only during movement` checks style cleanup. No single test asserts all source transition/transform fields. |
| `toast.pointer.15` | Covered at controller level. D `viewport pause reasons overlap` keeps expansion while swiping after pointer leave. Native touch integration deferred. |
| `toast.pointer.16` | Covered at controller level. D `outside touch presses clear stale hover while mouse presses preserve it`. |
| `toast.pointer.17` | Deferred. No assertion closes a middle hovered control and inspects expansion one frame later. |

## Focus management

| Spec ID | Status and evidence |
| --- | --- |
| `toast.focus.1` | Partial. D `viewport pause reasons overlap` supplies the focus pause; M `queues before attachment, pauses independent reasons` checks remaining lifetime. Native timed focus integration deferred. |
| `toast.focus.2` | Covered when focus entered the toast. B `toast arrival leaves focus alone` restores the outside trigger after the last focused toast closes. Approved behavior leaves focus untouched when it never entered the region. |
| `toast.focus.3` | Partial. B `toast arrival leaves focus alone` checks next-root focus and final external restoration. The source data-focused=true spelling is not an assertion. |
| `toast.focus.4` | Divergence. Focus pause is always enabled rather than opt-in. |
| `toast.focus.5` | Covered at controller level. D `viewport pause reasons overlap` pauses on focus without an opt-in. |
| `toast.focus.6` | Partial. C `makes limited and exiting records inaccessible` checks inert exits. Native focus selection while a real exit animation remains active is deferred. |
| `toast.focus.7` | Partial. M `queues every notification at limit zero` checks queuing; B `toast arrival leaves focus alone` checks restoration after the last dismissal. Native focus behavior with limit zero remains deferred. |
| `toast.focus.8` | Partial. B `toast arrival leaves focus alone` and E `toast provider and viewport preserve server markup` check arrival does not steal focus. Removal while focus stayed external has no direct assertion. |
| `toast.focus.9` | Deferred. Repeated hotkey activation from an inner control followed by Shift+Tab is unverified. |
| `toast.focus.10` | Deferred. Empty-region forward and reverse Tab traversal has no native test. |
| `toast.focus.11` | Partial. S `limited records are hidden and inert` and B `limit hides older records` verify promotion. Focus transfer to that promoted record under a limit of one is not asserted. |

## State

| Spec ID | Status and evidence |
| --- | --- |
| `toast.state.1` | Partial across layers. M `reports timeout and explicit dismissal reasons exactly once` asserts timeout closure. Native automatic DOM removal after timeout is not asserted directly. |
| `toast.state.2` | Partial. C `admits newest records and normalizes nonfinite defaults` asserts 5000 as the fallback. Exact default 5000ms expiry is not timed in the current tests. |
| `toast.state.3` | Covered at manager level. M `resolves queued implicit durations from the provider` distinguishes provider and explicit durations. |
| `toast.state.4` | Covered at manager level. M `resolves queued implicit durations from the provider` preserves explicit zero after other records expire. |
| `toast.state.5` | Covered across layers. S `limited records are hidden and inert` closes one record; E `notification stack handles rapid additions` activates Dismiss all and checks zero remaining elements. |
| `toast.state.6` | Covered. S `record updates preserve content DOM` and B `limit hides older records` assert DOM identity through updates. |
| `toast.state.7` | Covered with a rendering distinction. S `limited records are hidden and inert` and B `limit hides older records` check newest-visible admission. Limited content can remain in the DOM with hidden and inert rather than being absent from the DOM. |
| `toast.state.8` | Covered. M `frees the visible slot on dismissal` and S `limited records are hidden and inert` verify promotion. |
| `toast.state.9` | Partial. E `notification stack handles rapid additions` asserts the newest record first; M `restarts duplicate add lifetimes` preserves order. Middle-record removal order remains unverified. |
| `toast.state.10` | Covered across tests. M `updates a promise record in place` checks resolved value and identity; M `allows only the newest concurrent promise` checks rejection content; E `promise updates preserve the rendered notification` checks actual DOM identity. |
| `toast.state.11` | Partial. M `isolates factories and preserves timers` proves manager isolation. Two rendered providers with update routing remain unverified. |
| `toast.state.12` | Covered at manager level. M `restarts duplicate add lifetimes` uses shorter deterministic durations to test the same boundary and stable record. |
| `toast.state.13` | Partial. M `resets explicitly supplied duration and leaves loading persistent` checks resetting to the same duration. The zero-to-positive then same-duration sequence remains unverified. |
| `toast.state.14` | Partial. M `resets explicitly supplied duration and leaves loading persistent` covers loading-to-success expiry. Two updates in the same handler preserving the first scheduled timer need a dedicated assertion. |
| `toast.state.15` | Partial. M `updates a promise record in place` checks settled default duration. Loading duration=0 and explicit success/error stage duration overrides are not each asserted. |
| `toast.state.16` | Covered for manager dismissal. M `ignores stale promise settlements after dismissal` and B `dismissed promise toast does not reappear` reject resurrection. The native test uses imperative dismissal rather than Close. |
| `toast.state.17` | Partial. M `queues every notification at limit zero` increases the limit; M `resolves queued implicit durations from the provider` applies configured duration. Both directions of live limit changes and duration changes after attachment remain unverified. |
| `toast.state.18` | Partial. M `restarts duplicate add lifetimes` checks order preservation for an existing record. Duplicate addition of an actually limited record has no direct assertion. |
| `toast.state.19` | Partial. M `frees the visible slot on dismissal` and B `limit hides older records` cover newest-visible admission. Closing a limited record without changing the active one remains unverified. |
| `toast.state.20` | Deferred. No dedicated middle-record-only expiry case. |
| `toast.state.21` | Partial. D `a viewport mounted in an unfocused window pauses immediately` checks blur/focus reason delivery; manager pause tests check time accounting. Native blur plus exact remaining duration deferred. |
| `toast.state.22` | Covered across controller and manager tests. D `viewport pause reasons overlap` retains window-blur after hover/focus leave; M `queues before attachment, pauses independent reasons` verifies remaining reasons prevent expiry. |
| `toast.state.23` | Covered at manager level. M `queues before attachment, pauses independent reasons` and M `treats repeated pause reasons idempotently` verify active-time accounting without extending the lifetime. |
| `toast.state.24` | Divergence. Remaining time is clamped to zero after elapsed active time exceeds it; resume does not grant a fresh lifetime. The overdue throttled-clock case still needs a dedicated test. |
| `toast.state.25` | Partial. Manager pause/resume reasons are exercised in M `treats repeated pause reasons idempotently`; no public Pause All control or data-paused assertion is promised. |
| `toast.state.26` | Divergence in default, covered behavior. Approved actions close by default. S `Action can remain open` checks closeOnAction=false and author cancellation; B `action cancellation preserves a toast` checks prevented and successful actions. |

## Dismissal and layering

| Spec ID | Status and evidence |
| --- | --- |
| `toast.dismissal.1` | Partial with related native evidence. B `toast controls inside a modal remain interactive` keeps the parent modal open; B `a notification press does not dismiss an unrelated open popover` protects an unrelated layer. The exact outside-dialog topology in the source remains unverified. |
| `toast.dismissal.2` | Partial. B `toast controls inside a modal remain interactive` checks accessible title and close interaction. B `global notifications follow modal ancestry` checks existing nodes move into and out of a modal without replacement or arrival focus theft. Description and both priority levels are not asserted. |
| `toast.dismissal.3` | Divergence. Approved content remains interactive in the owning modal; high priority changes only the separate announcement channel. The source aria-hidden toast-root behavior is not adopted. High-priority modal announcement integration remains unverified. |
| `toast.dismissal.4` | Deferred. An author portal container has no dedicated assertion. |
| `toast.dismissal.5` | Deferred. Exactly-one rendering across multiple viewports sharing a manager and remount combinations is not verified. |

## Positioning

| Spec ID | Status and evidence |
| --- | --- |
| `toast.positioning.1` | Partial. E `notification stack handles rapid additions` verifies front order; B `measurement follows natural content growth` checks back offset. Exact front/behind attributes and index values remain unasserted. |
| `toast.positioning.2` | Partial. B `measurement follows natural content growth` checks own height and accumulated offset with a 12px gap; B `stack scale never changes the measured natural height` checks transforms do not affect measurement. Other public geometry variables and viewport offsets are not all asserted. |
| `toast.positioning.3` | Covered. B `measurement follows natural content growth` checks height increases after longer content. |
| `toast.positioning.4` | Deferred by scope. Anchored Positioner is not included. |
| `toast.positioning.5` | Deferred by scope. The approved stacked API has no Positioner fallback or side/align inheritance. |
| `toast.positioning.6` | Deferred by scope. Anchored Arrow is not included. |
| `toast.positioning.7` | Divergence in ownership. Placement and lift direction belong to consumer CSS. E `notification stack handles rapid additions` checks the bottom stack example; top placement remains unverified. |

## Animation and presence

| Spec ID | Status and evidence |
| --- | --- |
| `toast.animation.1` | Covered across native cases. B `an exiting middle toast retains its geometry` asserts the element stays connected and closed during a 240ms transition while a survivor reflows; E `a swipe exits from the release position` checks eventual removal. Exact time-boundary assertions remain narrower than the animation duration contract. |
| `toast.animation.2` | Deferred. No direct geometry/index assertion during front-record exit. |
| `toast.animation.3` | Partial. M `reopens an exiting ID in place` verifies stable record, front order, and lifetime reset. B `an exiting middle toast retains its geometry` verifies the same DOM element survives a re-add and onRemove does not fire. Starting-state policy, restored measurement, and swipe reset during re-add remain unverified. |
| `toast.animation.4` | Deferred by API contract. Supported rendering uses stable manager records with keyed For. Index-keyed element recycling has no compatibility claim or test. |

## RTL, SSR, accessibility, and edge cases

| Spec ID | Status and evidence |
| --- | --- |
| `toast.rtl.1` | Deferred by scope. Locale bundles are not supplied. Authors can override accessible labels; default hotkey placeholder behavior needs its own assertion. |
| `toast.ssr.1` | Covered. E `toast provider and viewport preserve server markup` checks server response, empty markup preservation through hydration, client addition, dismissal, and console/page errors. Server-prepopulated generated IDs are not covered. |
| `toast.a11y.1` | Partial. B `limit hides older records` runs axe after promotion with a visible toast. An empty-page scan and an open multi-toast scan are not both present. Manual screen-reader announcement testing remains outside automated evidence. |
| `toast.notes.1` | Partial. M `isolates factories and preserves timers` verifies detach stops time and reattach resumes it. Provider unmount followed by clock advancement needs a direct adapter test. |
| `toast.notes.2` | Partial. D `viewport follows its owner window` verifies iframe blur ownership and disposal. Iframe hotkey, all listener types, and empty/fill rebinding counts remain unverified. |
| `toast.notes.3` | Deferred by API contract. Manager records retain identity; rebuilt author record arrays are not a tested rendering pattern. |
| `toast.notes.4` | Deferred. Content-only unmount/remount, entrance suppression, remeasurement, and hotkey focus are not tested together. |
| `toast.notes.5` | Covered at manager level. M `calls lifecycle callbacks once`, M `keeps a same-record resurrection`, and M `reopens an exiting ID in place` check callback idempotence and deferred removal on resurrection. S `limited records are hidden and inert` checks the close reason. |
| `toast.notes.6` | Deferred. Observer delivery during exit with forced zero height has no direct assertion. |
| `toast.notes.7` | Partial. M `treats repeated pause reasons idempotently` tests reason reuse while a record remains. Adding a new timed record after all old paused records become untimed or disappear needs a dedicated test. |

## Additional approved behavior

The synthesis did not specify velocity or hidden-document behavior. D `a recent
flick dismisses but tiny jitter, stale velocity and reversals do not` verifies the
approved recent-velocity rule. D `hidden documents pause immediately and visibility
cannot clear a focus pause` verifies the independent document-hidden reason.
D `lost capture resets movement and moved gestures suppress pointer clicks only`
checks pointer capture loss without suppressing keyboard activation. D `native
controls inside a shadow root remain interactive` checks composed-path filtering.

Manager race tests additionally cover nested updater invalidation, same-ID promise
replacement, dismissal followed by ID reuse, user message callbacks that perform
newer updates, and callbacks that resurrect records during removal. These protect
the imperative API; they do not substitute for the deferred native presence cases.
