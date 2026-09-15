# Coverage completion

## Scope and workflow

Finish the 1,038 partial and 484 missing requirements recorded in
`coverage-backlog.json` for built components. The original IDs remain in this
backlog so changing a disposition cannot silently count as test completion.

GPT-5.6 Luna writes small test slices. The coordinator reviews assertions and
runs tests. GPT-6 Astra at low reasoning verifies failures against the intended contract;
GPT-6 Astra at medium reasoning fixes confirmed implementation bugs. The
coordinator reruns relevant checks and commits each verified slice.

Do not weaken assertions or skip tests to clear the audit. Record evidence for
any unbuilt capability or unresolved contract, and keep it visible in the final
accounting. Audit records live in `packages/suite/coverage`.

## Baseline

- Test checkpoint: `815499a`.
- Versioned audit baseline: `04ae026`.
- Audit: 1,101 covered, 1,038 partial, 484 missing.
- Suite jsdom: 759 tests passed.
- Core: 335 tests passed. DOM: 226 tests passed. Solid: 392 tests passed.
- Audit tooling: 6 tests passed; spec validation passed.
- Type checking and lint passed across the workspace.
- Chromium browser baseline: 1,329 tests passed across 176 files.
- Chromium end-to-end baseline: 56 tests passed.
- Existing changes to `flake.nix` and `flake.lock` are outside this work.

## Verified slices

### Pagination, visually-hidden, Toggle and ToggleGroup

- Added ten tests; closed nine requirement gaps with existing evidence retained.
- Independent component runs: 60 jsdom tests and 98 Chromium browser tests passed.
- ESLint and audit validation passed. Sol corrected an abbreviated requirement ID
  in a test title; no production change was needed.
- `visually-hidden.focus.2` remains partial because the alternate contract clears
  all author styles, while this component preserves them.
- `toggle-group.roles.3` remains partial because its alternate radiogroup/toolbar
  modes are not implemented. The shipped group behavior is tested.

### Controlled state and RTL

- Added ten tests; closed four requirement gaps, retaining partial status for
  the shared controlled-value rules that still need other component families.
- Independent runs: ten jsdom and ten Chromium browser tests passed.
- Verified mixed-state retries, silent controlled-to-uncontrolled handoff,
  controlled mount silence, and both vertical arrow directions under RTL.
- ESLint and audit validation passed.

### Calendar and RangeCalendar

- Added eleven browser tests and closed all eleven partial calendar requirements.
- Independent Chromium run: 52 tests passed across six calendar files.
- Assertions add constrained accessibility scans, initial focus clamping,
  non-submit paging controls, unavailable activation rejection, range bounds,
  canceled draft preservation, draft keyboard navigation and preview markers.
- ESLint and audit validation passed.
- Running audit: 1,125 covered, 1,015 partial, 483 missing.

### Progress bound values and accessible names

- Added four tests, closing the bound display-text requirement.
- Added title and author-label naming assertions and an explicitly enabled
  target-size axe scan; these do not claim unsupported generated Label parts
  or the complete shared accessibility rule inventory.
- Combined independent Progress/Menubar run: 31 jsdom and 32 Chromium tests passed.
- Remaining Progress alternatives require unbuilt Indicator, Value, Label,
  circular, or asChild/render APIs. Root-only supported behavior keeps its
  existing evidence; these alternatives remain visible as partials.
- Audit validation passed.

### Menubar null and undefined ownership

- Added two assertions of the shared sentinel contract using Menubar, which
  supports null as a controlled closed value. Together with existing array
  ownership tests, these close both remaining null-versus-undefined gaps.
- Verified null overrides an open default, user proposals retain controlled
  presentation, and undefined restores the internal default without echo.
- Independent combined Progress/Menubar runs and audit validation passed.

### Field labels and focus

- Added eight suite tests and four focused Solid regressions; closed six gaps.
- Sol verified two genuine bugs. Astra added label part metadata and mount-time
  autofocus using the established settled-focus convention.
- Independent checks passed: 44 suite jsdom, 60 Chromium Field, and 16 Solid
  Field tests; Solid/suite typechecks, changed-test lint and audit validation.
- The corrected readonly share-URL fixture also passed in jsdom and Chromium.
- Input and textarea label activation now cover independently disabled controls
  and disabled ancestry. Their unbuilt passive-label alternatives remain partial.

### Selection persistence and boundary navigation

- Added four tests, closing focus-leave persistence and automatic Home/End
  selection gaps. Meta+A array selection and selected-row activation also gain
  evidence; their unbuilt all-sentinel and separate row-action alternatives
  remain partial.
- Independent combined Meter/Selection/Avatar run: 27 jsdom and 37 Chromium
  tests passed. Audit validation passed.
- Milestone after the Field fix: all 808 suite jsdom and 396 Solid tests passed.

### Meter bounds, naming and author composition

- Added thirteen tests, closing thirteen requirement gaps.
- Verified finite bounds, null/nonfinite normalization, explicit label naming,
  author overrides, custom component forwarding, reactive display text and
  pointer inertness. Shared ARIA rules are explicitly selected for axe.
- Independent Meter checks: 13 jsdom and 14 Chromium tests passed. Audit
  validation passed. Indicator-width alternatives remain partial. A fixed
  authored rounded string is not counted as proof of a generated formatter.

### Avatar loading and fallback lifecycle

- Added eight tests, closing nine gaps in native prop forwarding, author ARIA,
  inverse loading states, delay timing, cached failure, stale callbacks and
  author event cancellation.
- Independent runs: 12 jsdom and 13 Chromium Avatar tests passed. Audit
  validation passed. SSR and real network policy checks are a separate slice.
- Root/fallback polymorphism is covered; the Image polymorphism alternative
  remains partial because Image has no polymorphic public prop.

### Composite axes and identities

- Added three core tests and one adapter test; closed four gaps using public
  both-axis navigation, numeric/object identity, prevention ordering, and
  complementary existing loop-on/loop-off tests.
- Independent checks passed: 24 core, 25 suite jsdom and 26 Chromium tests.
- Soft-disabled entry gains evidence; remaining fallback combinations and
  alternate default-loop contracts stay partial. Audit validation passed.

### Utility hydration and image network policy

- Added a dedicated server/client fixture and three end-to-end tests, closing
  five Avatar, Meter and textarea hydration/network gaps.
- Image responses are held until hydration finishes, then released to prove
  fallback-to-image transitions. Actual Referer headers distinguish policies.
- Independent full Chromium E2E run: all 59 tests passed. Suite typecheck,
  changed-file lint and audit validation passed.

### Collection keys and registry lifecycle

- Added two core and five adapter tests; closed shared observer count and nested
  collection ID uniqueness.
- Numeric/empty keys, data snapshot edits, grouped DOM reorder, host replacement,
  and removal/re-addition gain evidence. Private index/registry observations and
  numeric renderer clauses remain partial.
- Independent checks: 11 core tests, five suite jsdom and five Chromium tests
  passed. Suite typecheck, changed-test lint and audit validation passed.

### Checkbox form and custom-host paths

- Added nine shared tests and three browser tests; closed four gaps for nested
  disabled fieldsets, dynamic form owners, user-invalid blur, and target size.
- Custom mixed/controlled/readonly hosts and title naming gain evidence. Broad
  validation, negative accessibility cases and unbuilt Indicator clauses remain partial.
- Independent runs: nine jsdom and 12 Chromium tests passed; the three browser
  tests passed again after failure-safe form cleanup. Audit validation passed.

### Switch Enter submission

- Sol corrected a contradictory test expectation, then confirmed the remaining
  no-submission failure against the accepted Switch contract. Astra added explicit
  native Switch Enter submission without changing checkbox behavior or checkedness.
- Browser regressions cover owning forms, submitters, validation and blocked
  input. Documentation now describes this adapter behavior accurately.
- Closed Enter submission and custom host type forwarding; other original Switch
  audit rows gain evidence without claiming unbuilt parts or screen-reader proof.
- Independent checks passed: 170 suite jsdom, 199 Chromium and 50 Solid tests,
  both package typechecks, changed-file lint and audit validation.

### Switch labels and accessibility fixtures

- Added three shared negative axe tests and two browser tests. Closed label
  activation variants, duplicate referenced IDs, and measurable target sizing.
- Corrected the wrapping-label fixture during review so it actually nests the
  input without an explicit for attribute. Role-table metadata remains partial.
- Independent checks: three jsdom and five Chromium tests passed, including the
  corrected wrapping label. Audit validation passed.

### Radio naming, submission and selection state

- Added six adapter tests and one core test, closing six gaps: visible naming,
  descriptions, FormData submission, sole-radio refocus, the roving tab-stop
  invariant, and undefined versus empty-string core value.
- Native/custom ARIA output and pointer progression gain evidence. Negative
  radio ARIA fixtures and browser tab re-entry remain separate follow-ups.
- Independent checks passed: six jsdom, six Chromium and one core test. Audit
  validation passed after correcting evidence references to exact full titles.

### Collapsible interaction variants

- Added four shared and two browser tests; closed five gaps for negative axe
  impact, expanded text-only tab order, non-primary clicks, inner close triggers,
  and adjacent independent controls. Exact anatomy wording remains partial.
- Independent checks: four jsdom and six Chromium tests passed. Audit validation
  passed; animation cases are assigned as a separate browser slice.

### Accordion controlled values and disabled interactions

- Added 13 shared tests and two browser tests, closing 12 gaps. Coverage includes
  controlled array mutation, callback payload/count, disabled overrides and
  direct events, every public part's refs/handlers, and reverse collapsed Tab order.
- Review strengthened fixtures to distinguish disabled-item navigation from
  a no-op boundary and to test item-disabled behavior after re-enabling the root.
- Independent final runs: 13 jsdom and 15 Chromium tests passed. Suite typecheck
  and audit validation passed. SSR paired-ID equality remains assigned separately;
  Header/Indicator and alternate data-attribute contracts are not shipped.

### Radio autofocus inside overlays

- Sol confirmed native Dialog opening focused an unchecked radio before its
  group finished registration. Astra delays initial attachment until descendants
  settle and redirects a negative-tabindex radio to the group's tab stop, while
  preserving explicit author autofocus.
- Added nine browser cases across selected native/custom radios, Popover,
  author autofocus, outside-overlay focus, nested overflow and Tab re-entry.
- Closed four gaps; the full modal/highlighted Tab-return matrix remains partial.
- Independent checks passed: 145 Chromium, 52 suite jsdom, 56 Solid and 39 DOM
  tests, all 59 Chromium E2E tests, three package typechecks and audit validation.

### Collapsible cancellation and animation completion

- Sol confirmed capture-canceled clicks still toggled. Astra added the core
  defaultPrevented guard and regressions for both initial open states.
- Added one shared and five browser cases. Closed four gaps for cancellation,
  exit removal, differing real CSS transition end times, and size preservation.
- Sol corrected the CSS fixture to commit initial styles before closing. Presence
  schedules exit inspection; same-commit removal and the alternative reopen
  starting-style prohibition remain partial rather than being claimed as tested.
- Independent checks passed: nine core, 31 suite jsdom and 51 Chromium tests,
  core/suite typechecks, changed-file lint and audit validation.

### Switch cross-browser fixture verification

- A three-browser run exposed a Firefox pointer-delivery failure for an external
  label placed on a separate line. Sol and Astra investigated; an inert native
  clone failed at the same position with no captured pointer events.
- Moved the explicit label beside the Switch within its fixture, preserving the
  for/id association and real clicks. Added exact click and change callback counts.
- Independent Chromium/Firefox/WebKit run: all 48 tests passed across nine files.
  No production change was needed for this failure.

### CheckboxGroup labels, metadata and controlled membership

- Added ten shared and two browser tests, closing 12 gaps for readonly focus and
  Space, label callbacks, multiple selection, local invalid state, description
  ordering, disabled removal, naming, and controlled empty-string removal.
- Sol removed a false-positive expectation for redundant aria-disabled on native
  disabled inputs; removal checks remain on the group and every child.
- Independent combined checks with the following form slice: 17 jsdom and 20
  Chromium tests passed. Audit validation passed. The concurrent Tabs fixture
  had a lowercase tabindex type correction pending during this typecheck.

### Accordion and CheckboxGroup hydration associations

- Added a dedicated SSR fixture and three Chromium end-to-end tests, closing
  the remaining Accordion paired-ID gap and two CheckboxGroup hydration gaps.
- The fixture includes native and custom checkbox hosts. Tests compare generated
  IDs and label targets in JavaScript-disabled markup and after hydration; the
  shared client fixture also verifies that server DOM nodes were preserved.
- Independent focused E2E run: all three tests passed. Changed-file lint and
  audit validation passed.

### CheckboxGroup required and projected form values

- Added seven shared tests and one browser case, closing five gaps: multiple
  required children, empty custom-host FormData, required-child removal, live
  readonly state, and default/controlled selection.
- Disabled, external-owner, removal and remount projections gain evidence;
  logical validation-value and React Strict Mode alternatives remain partial.
- Independent final runs: seven jsdom and eight Chromium tests passed. Changed
  files passed lint and typecheck in the agent run; audit validation passed.

### Tabs composition, keyboard guards and controlled state

- Added ten shared and one browser test, closing 11 gaps for naming, automatic
  activation, modifier propagation, composition/target guards, focus continuation,
  form/RadioGroup and Dialog composition, blur count, and disabled selection.
- Sol isolated a real IME bug. Astra added an early composing-event guard to the
  shared composite handler, with six core navigation-key regressions.
- Independent checks: all 349 core tests, 101 focused suite jsdom and 124 Chromium
  tests passed. After the final defaultValue fixture correction, all ten shared
  and 11 browser cases passed again. Core/suite types, lint and audit checks passed.

### Field control replacement and shadow-root associations

- Added three shared and two browser tests, closing five gaps: individually
  disabled label activation, shadow-root description/error IDs, generic-to-native
  control replacement, unselected control removal, and imperative value retention.
- Independent runs: three jsdom and five Chromium tests passed. Agent typecheck
  and changed-file lint passed; root audit validation passed.

### Tabs naming, scrolling and nested teardown

- Added seven shared and one browser test, closing five gaps for naming
  alternatives, orphan-role axe severity, part refs/handlers, real overflow
  scrolling and nested teardown tied to outer selection.
- Sol corrected removal expectations to the adopted silent fallback behavior.
  Hidden/focusable-disabled successor combinations and direct tab/menu activation
  remain partial; research null callbacks and ID stripping are not adopted.
- Independent final runs: seven jsdom and eight Chromium tests passed. Audit
  validation passed; Sol also checked the two removal cases in all three engines.

### Button negative accessibility fixtures

- Added five shared and two browser tests, closing nested negative-tabindex
  widget and outermost aria-hidden-focus gaps. Other naming/role matrices gain
  evidence but remain partial.
- Sol corrected the presentation conflict rule and moved hidden-focus checking
  to a real browser. Independent runs: five jsdom and seven Chromium tests passed;
  Sol's three-engine run passed all 21 cases. Audit validation passed.

### Presence transition timing and nested exit focus

- Added two browser tests, closing longest paired transition timing and focus
  restoration past multiple exiting layers. Sol corrected the initial fixtures.
- Independent Presence and Accordion runs passed all four cases. The broader
  Chromium run passed these cases; its only failure was the separately tracked
  Button role-link activation bug.

### Accordion browser focus boundaries

- Sol replaced browser-boundary Tab assumptions with explicit before/after
  controls, preserving forward and reverse checks that skip collapsed content.
- Independent focused checks passed. The full Chromium run passed this test;
  its only failure was the separately fixed Button role-link behavior.

### Button native forms and generic link activation

- Added six shared and five browser tests, closing nine gaps for form ownership,
  fieldsets, native popovers/submission, generic link keys, Toolbar composition,
  target geometry, input reset types and disabled markers across four host kinds.
- Sol confirmed the generic role=link Space failure. Astra passed the reactive
  author role into core behavior so links activate on Enter only, with core tests
  for disabled and pending links. Warning detail and auxclick evidence remain
  partial; a redundant entry-list test was removed because it did not prove order.
- Independent Button runs passed 120 jsdom and 145 Chromium cases. After fixture
  cleanup and the expanded host matrix, the slice passed six jsdom and eleven
  Chromium cases. Audit validation passed. Astra also passed core/Solid tests,
  three-engine native keyboard tests, types and lint.

### Typeahead group boundaries, origins and isolated buffers

- Added four shared and three browser tests, closing six gaps for cross-group
  matching, spaces during search, explicit textValue, Select trigger/popup
  routing, Combobox caret keys and per-instance buffers. Nested input typing
  gains evidence; the dialog-opened-from-composite alternative remains partial.
- Sol corrected the empty-buffer Space expectation and strengthened group and
  buffer-isolation fixtures. No production bug was found.
- Independent runs passed four jsdom and seven Chromium cases; Sol passed all
  21 cases across three engines. Audit validation passed.

### Coverage checkpoint after Typeahead

- Regenerated audit: 1,269 covered, 914 partial and 440 missing, compared with
  the initial 1,101 covered, 1,038 partial and 484 missing. This closes 168
  original gaps; the original backlog remains preserved.
- Full Chromium end-to-end run passed all 62 cases, including the added
  Accordion/CheckboxGroup SSR and hydration fixtures.

### Portal content and nested destinations

- Added three browser tests, closing content-inside-layer, separate nested
  portal containers and Tooltip clicks in single/sibling portal arrangements.
- Tests assert physical destinations and open state. Tooltip uses uncontrolled
  layers and real pointer-enabled clicks with no dismissal callbacks.
- Independent Portal run passed five cases including the next Select slice;
  this commit contains the three completed cases. Audit validation passed;
  Luna's lint and typecheck passed.

### Toolbar handler layers, part forwarding and Menu composition

- Added three shared and one browser test, closing four gaps: separate render
  and component click handlers, forwarding on all five exported parts, a Menu
  trigger that participates in Toolbar navigation, and native link navigation.
- Sol replaced the invalid capture prop and removed a redundant focus test.
- Independent combined runs passed these four cases in jsdom/Chromium as
  applicable; the separate nested-composite focus case remains under review.
  Audit validation passed.

### Field label removal after hydration

- Added an SSR fixture and end-to-end test, closing field.ssr.2. Server markup
  begins with a label reference; hydration preserves DOM/IDs; removing the label
  through the UI removes aria-labelledby entirely without errors.
- Independent Chromium end-to-end test and suite typecheck passed. Audit
  validation passed; Luna's changed-file lint passed.

### Portal Select dismissal and retained modal focus

- Added two browser tests. Escape closes a portalled Select and restores focus
  within its modal Popover, with forward/reverse Tab containment, closing one gap.
- Outside-click dismissal gains concrete Select/Popover evidence. Its nonmodal
  outside-focus behavior leaves the research containment clause partial.
- Independent Portal/Toolbar overlay run passed all three cases. Suite typecheck
  and audit validation passed.

### Toolbar shared navigation for composed controls

- Sol confirmed multiple tab stops on composed RadioGroup, ToggleGroup and Menu
  controls. Astra added private host recognition so generated tab indices and
  toolbar-axis navigation defer to Toolbar.Button while selection stays intact.
- Added shared and Solid regressions for boundary traversal, radio/toggle
  selection, disabled groups, cancellation, author overrides, vertical and RTL
  navigation. Spinbutton integration remains partial: NumberField.Input has no
  public composition path. Axe role metadata gains evidence; superclass remains
  unasserted.
- Independent validation passed 53 Solid, 280 suite jsdom and 418 Chromium tests,
  plus both package typechecks and audit validation. The development compilation
  assertions passed but one invocation hung during shutdown; Sol could not
  reproduce it in eight clean runs and found no code defect.

### Toolbar overlay keyboard matrix

- Added five browser cases across Menu, Select, Dialog, AlertDialog and Popover,
  closing keyboard.15. Each composed trigger opens on Enter, delegates navigation
  to its overlay and regains focus after Escape closes that overlay.
- Independent final Chromium run passed all five cases. Audit validation passed;
  earlier broader Toolbar validation also passed the overlay files.

### Recursive Portal hierarchy

- Added a browser matrix spanning Dialog, Menu, Select and Popover, closing
  portal.dismissal.5. It checks depth-first opening, immediate-child visibility,
  hidden unopened descendants and four-level Escape/outside-press unwinding.
- Both portal modes and forceMount modes run with actual visibility/state
  assertions. Independent Chromium matrix passed; audit validation passed.

### Shared Field assertions for NumberField and Select

- Refactored common naming, state inheritance and description/error assertions
  into one helper used by the original four adapters and two new adapter cases.
  Explicit description IDs resolve to actual nodes and survive reactive clearing.
- Restored the original invalid-state association assertions during review.
  Other compatible adapters still need this battery, so field.notes.6 stays partial.
- Independent runs passed 111 jsdom and 129 Chromium cases across every existing
  caller. Final focused assertions and audit validation passed. The broad Chromium
  run's ten failures all came from the earlier in-progress helper and are covered
  by the successful 129-case rerun; its other 1,557 cases passed.

### Typeahead in a Dialog opened from Menu

- Added a real Menu-item-to-Dialog flow, closing the remaining typeahead input
  isolation gap. Typing updates the focused Dialog input and leaves Menu closed
  without another selection callback.
- Independent final Chromium case and audit validation passed.

### Disabled native controls and browser focus differences

- Added three shared and two browser tests, closing four gaps: validation
  messages, scripted native click delivery, disabled submit/reset actions, and
  input-event suppression for disabled/readonly Field controls.
- Sol verified self-disabling native focus differs by engine: Chromium moves to
  body; Firefox/WebKit retain the disabled input. The test records both outcomes;
  the audit's universal-blur clause remains partial and requires no library fix.
- Independent jsdom cases passed, and the final three-engine run passed all
  15 cases. Audit validation passed; Luna's typecheck/lint passed.

### Zero-delay hover, safe-polygon geometry and SVG containment

- Added one HoverIntent test, four layer cases and four HoverCard placement
  cases, closing three gaps. Tests check synchronous zero-delay transitions,
  namespace-created SVG/HTML inside/outside targets, and measured 100px surfaces
  separated by a 20px gap with exactly-once opposite-side closure.
- SVG runtime behavior passes; the test documents that the public registration
  type still requires HTMLElement. Hover coordinates use facing edges so the
  sampled point actually lies in the gap.
- Independent DOM tests passed all five cases; Chromium passed all four HoverCard
  cases. Final SVG assertion cleanup and audit validation passed.

### Native disabled event and cancellation matrix

- Added two shared and four browser tests, closing five gaps: aria-disabled
  platform behavior, pointer/mouse event families, engine-specific auxclick,
  checkbox/radio activation rollback, and blocked implicit form submission.
- Cancellation restores checkbox mixed state and the prior radio selection,
  preserves unrelated listener mutations, and emits no committed input/change.
- Independent initial jsdom run passed; final Chromium/Firefox/WebKit run passed
  all 18 cases. Audit validation passed; Luna's lint/typecheck passed.

### Hover suppression expiry and document-scoped outside interaction

- Added three DOM tests, closing post-touch suppression expiry, exact inside/
  outside callback delivery, and iframe owner-document isolation gaps.
- The expiry test proves mouse entry is accepted at 600ms. Pointer pairs inside
  a layer remain silent; an iframe body press notifies once while top-document
  presses leave its layer untouched.
- Independent DOM run passed all three cases; audit validation passed. Luna's
  DOM typecheck and lint passed.

### Shared Field assertions for Combobox and TagsInput

- Added two adapter cases using the existing shared battery. Combobox exposes
  required state through ARIA; TagsInput retains distinct outer/inner error IDs
  and clears both while preserving the help reference.
- Independent runs passed 113 jsdom and 131 Chromium tests across every battery
  caller. Audit validation passed; Luna's types/lint passed. The all-adapter
  requirement remains partial while other compatible components are added.

### Tooltip group delays, unmounts and unrelated reactive work

- Added four shared tests, closing three gaps: exact open/close boundaries,
  instant sibling swaps, warm-window survival across both unmount scenarios, and
  unrelated trigger reactive work with a positive-control getter update.
- Sol corrected browser queries to distinguish open tooltips from closed, inert
  nodes retained during exit. Timing boundaries remain unchanged.
- Independent final runs passed all four cases in jsdom and Chromium. Audit
  validation passed; changed-file lint and typecheck passed in the agent run.

### Shared Field assertions for PinInput and Editable

- Added two adapter cases. PinInput checks its first slot's associations and its
  native form mirror's required/disabled/name state; Editable checks its input.
- Kept strict single-control label assertions for the earlier adapters while
  allowing PinInput's multiple named inputs. Shared state/description assertions
  run before and after clearing Field flags.
- Independent runs passed 115 jsdom and 133 Chromium cases. Audit validation
  passed; Luna's types/lint passed. Slider and CheckboxGroup remain for this battery.

### NumberField keyboard edge cases

- Closed six gaps with seven browser cases: unbounded Home/End, both negative-range seed directions, repeated keydowns, unsynced controlled drafts, IME key code 229, and default Page-key increments.
- Independent Chromium run passed all seven cases. Suite typechecking passed.

### Complete shared Field adapter battery

- Added Slider and CheckboxGroup to the common battery, completing all twelve shipped outer-Field adapters and closing field.notes.6. The labeled CheckboxGroup must contain the exact item under test.
- State clearing includes readonly and all public flags; Combobox checks its native/ARIA attributes separately.
- Independent final runs passed 117 jsdom and 135 Chromium tests across all helper callers; typechecking passed.

### NumberField accessibility, focus and canonical form values

- Closed six gaps: scoped axe scan, readonly Tab focus, outer Field label click, native whole-value Tab selection, and named hidden canonical values beside localized number/currency displays.
- Review removed manual post-focus selection and added direct hidden-input form-owner assertions. Independent final Chromium run passed all six tests; Luna lint/types passed.

### Failure verifier update

- Per user instruction, subsequent failure verification uses GPT-6 Astra at low reasoning (requested as light), replacing GPT-5.6 Sol. Confirmed implementation fixes continue to use Astra at medium reasoning. Earlier entries retain the models that actually performed those checks.

### NumberField numeric ARIA and steppers

- Closed six gaps with seven shared cases: reactive numeric attributes and empty-value cleanup, absent/one-sided limits, text host, both named stepper associations and hidden glyphs, and bound/interior disabled attributes.
- Independent runs passed six jsdom cases and all seven final Chromium cases. Luna ran all seven in jsdom and passed lint/typechecking. A public malformed-draft regression fills the omission assertion missing from older core evidence.

### Radio naming and native checked semantics

- Closed both remaining Radio gaps. Naming fixtures cover all name sources and actual axe label-rule applicability/impacts.
- Astra low independently confirmed a selected native input retained conflicting author aria-checked=false. Astra medium removes this attribute for native Radio items, documenting the precedence exception and preserving other author props and custom-host computed state.
- Independent checks passed 21 Solid, 55 suite jsdom and 97 Chromium tests. Astra passed Solid types and changed-file lint.

### NumberField state inheritance and draft bounds

- Closed five gaps: group state, both uncommitted bound directions, native/ARIA/data state mirroring, outer Field helper/error lifecycle, and disabled/readonly hidden-input event suppression.
- Plain/isolated state flags now have direct assertions; roles.16 remains partial for the unbuilt positive data-valid flag.
- Independent final checks passed eight jsdom and nine Chromium cases; Luna types/lint passed. Full end-to-end checkpoint after Radio fix passed all 63 tests.

### NumberField native pointer and wheel behavior

- Closed six gaps covering normal/disabled/readonly stepper clicks, exactly-once native event sequence, middle/right dirty-draft preservation, and uncanceled pinch/unfocused wheel events.
- Astra low corrected the synthetic secondary click to native auxclick semantics; real browser sequences verify both buttons and preserve 9.00 without normalization.
- Independent final runs passed five jsdom and ten Chromium cases; changed-file lint/format passed.

### NumberField decimal-step precision and keyboard commits

- Astra low corrected missing input-to-key settling in three fixtures and confirmed a real precision failure: offset 0.1 steps could stall at 0.7 or 3.4.
- Astra medium corrects floating-point noise near integer grid positions, with a capped tolerance and regressions for long bidirectional stepping, nearby off-grid values, and large indices.
- Closed five gaps for handled keys, clearing, precision, fallback and equivalent edits. state.11 has new directional coverage but retains a research-contract divergence and an unasserted outside-bound example.
- Independent final checks passed 17 core, 26 suite jsdom and 55 Chromium tests, excluding the separately failing notes slice. Core and suite typechecks passed.

### NumberField formatter changes preserve the draft value

- Astra low confirmed real formatter-content changes left an uncommitted draft unformatted, after correcting the equivalent-object fixture. Astra medium snapshots option content and reformats using the prior parser without committing.
- Closed notes.1 and notes.20. Canceled synthetic blur now has a direct assertion, but notes.23 retains native-blur cancellation/touched limitations.
- Independent checks passed nine Solid, 29 suite jsdom and 61 Chromium cases; Solid/suite typechecks passed. The browser run includes the new caret-deletion slice.

### NumberField native caret editing

- Closed notes.9 with three browser cases covering decimal/minus deletion in both directions and adjacent-digit deletion using collapsed carets. Each preserves focus and avoids premature value callbacks.
- Included in the independent 61-case NumberField Chromium run; Luna focused browser, lint, formatting and types passed.

### NumberField validation and outside-bound stepping

- Closed forms.8 and roles.5: reported required validation clears after a real stepper click, and visible author error references accompany both invalid range directions and clear invalid state after correction.
- Added disabled/readonly canonical submission and outside-bound 13-to-10 stepping evidence. forms.2 remains partial for absent hidden readonly; state.11 retains its adopted-contract divergence.
- Independent Chromium run passed all four cases. Luna lint/types/format passed.

### NumberField controlled values and retained precision

- Closed six state gaps: zero rendering, finer-than-display increments, external updates during editing/after stepping, controlled null, and no-edit precision plus equivalent-text normalization.
- Astra low corrected an off-grid addition expectation to a 0.0001 aligned step that actually isolates retained precision. No production fix was needed.
- Independent final Chromium run passed all six cases; verifier lint/format and Luna typechecking passed.

### NumberField locale formats and fullwidth punctuation

- Closed rtl.2, rtl.4 and rtl.5 with option matrices, per-character Persian editing, and six numeral sets. Polish 1000 grouping and the research 5.2-to-52% example remain explicit divergences.
- Astra low rejected a passing known-gap assertion and confirmed fullwidth comma/period were incorrectly rejected. Astra medium adds only those two punctuation aliases before locale parsing, preserving malformed-input rejection.
- Independent checks passed 31 core, six suite jsdom and seven Chromium tests. Astra core/suite types and focused lint passed.

### NumberField naming and shared Field ordering

- Added three cases for public name sources, generated native label associations, reactive description/error references, and accurate axe native/generic naming taxonomy.
- Astra low confirmed the failing research order conflicts with the documented/tested shared Field contract. Both requirements remain partial for those alternatives; production behavior was preserved.
- Independent jsdom and Chromium runs passed all three cases. Verifier lint/format passed.

### NumberField accounting announcements and advanced locales

- Closed four locale gaps: real currency-token deletion, accounting sign editing/announcements, Arabic plural stepping, and comma-decimal step grids. Typed numeral round trips supplement rtl.14, which retains the undefined universal locale scope.
- Astra low corrected announcement timing and confirmed accounting negative ARIA lacked Unicode minus. Astra medium formats accounting announcements separately using locale minus-sign parts, preserving visible output, parsing, bidi marks and nonaccounting behavior.
- Independent checks passed 37 core, three suite jsdom and seven Chromium tests. Core types and focused lint passed in the fix agent.

### Scroll-lock holder lifecycle

- Closed four gaps with direct DOM cases: reverse release order, repeated disposal with another holder still active, reacquiring a fully released lock, and opted-out registrations preserving overflow.
- Independent DOM run passed all four cases; Luna lint/format passed.

### NumberField long values and empty commits

- Closed state.21 and state.29: exact focused 16-digit text commits through both callbacks, and clearing above a positive minimum stays empty after blur.
- Untouched/unparseable blur now directly proves callback silence; state.8 remains partial for deferred wheel/scrub endpoints.
- Independent final Chromium run passed all three cases; Luna types/lint/format passed.

### Scroll-lock restoration and separate documents

- Closed three gaps: empty inline-style cleanup, zero scrollbar compensation, and independent simultaneous document locks.
- Astra low confirmed final release left an empty style attribute. Astra medium cleans only empty attributes after restoring all properties, with root/body nested-lock and added-author-style priority regressions.
- Independent checks passed 26 DOM modal tests, 49 affected overlay Chromium tests, and DOM typechecking. NumberField checkpoint also passed all 41 jsdom and 91 Chromium tests plus suite types.

### Presence restarted animation completion

- Closed animation.17 using the same mutated/restarted WAAPI animation and the exported waitForExit callback, asserting exactly one completion after the restarted finish.
- Astra low confirmed animation.9 differs from the documented next-frame discovery lifecycle; its synchronous alternative remains partial with direct evidence of actual timing.
- Independent Chromium run passed both cases; verifier lint/format passed.

### Slider ARIA, native tab stops and large steps

- Closed six gaps for numeric ARIA/axe required-value metadata, separate group naming, control tab exclusion, Shift large steps and ordinary bare-arrow steps.
- Astra low corrected the maximum fixture to the documented grid-aligned contract, then checked nonclamped large moves and both boundary clamps.
- Independent runs passed four shared jsdom tests, five ARIA/Tab Chromium tests and two keyboard Chromium tests. Verifier/Luna lint and formatting passed.

### Slider direct keyboard handling

- Closed six keyboard gaps: both endpoint clamps, directional off-grid snapping, min-anchored traversal, propagation, consumer veto/cardinality, and repeated PageUp events.
- Astra low confirmed delegated key handling reached native ancestors too early. Astra medium binds the composed handler directly to the thumb, preserving author veto and unhandled keys, with sibling and shadow-root regressions.
- Independent full Slider checks passed 12 Solid adapter tests, nine jsdom tests, 29 Chromium tests, and Solid typechecking (including the separate pending state slice).

### Slider controlled state and native form values

- Closed five gaps for clamped FormData, controlled updates/reset and rendered positions, reactive zero-neighbor bounds, output formatting/IDs, and native input refs.
- Astra low identified the reset failure as fixture timing: the native reset action precedes the adapter's timer restoration. The corrected test waits for that task and retains strict parent-value assertions.
- Independent final runs passed all five cases in jsdom and Chromium; verifier lint and formatting passed.

### Slider modifier, page and neighbor keys

- Closed five gaps for off-grid large steps and both clamps, Meta/Control/Alt steps, directional neighbor Home/End changes, gap-blocked callback silence, and extra-thumb key silence.
- Astra low corrected the Page fixture's grid-aligned maximum and strengthened Home/End to prove actual movement in both directions. Independent final Chromium run passed all five cases.
- Replaced custom-property matcher objects with typed CSS property reads. The preceding keyboard/state slices passed all 33 cases across Chromium, Firefox and WebKit; the full end-to-end checkpoint passed 63 tests.

### Slider focus traversal and disabled parts

- Closed four gaps for forward/reverse thumb traversal, disabled Tab bypass, native focus/blur callback identity and cardinality, and disabled markers on all seven rendered parts.
- focus.1 remains partial only for the research's explicit tabindex attribute. Astra low verified the adopted native range-input contract; tests assert native tabIndex=0 and actual Tab navigation.
- Independent final Chromium run passed all five cases. Verifier lint, formatting and suite typechecking passed.

### Slider metadata and named orphan errors

- Closed four gaps for single/range axe scans, vertical orientation markers, percentage/localized output, and named errors for all six orphan parts.
- Astra low confirmed Solid's required context read bypassed Slider's existing named guard. Astra medium supplied a null context default so that guard runs, with six adapter regressions.
- Independent checks passed 18 Slider adapter tests and all nine metadata cases in both jsdom and Chromium. Chromium supplies the full axe scan; jsdom lacks canvas support. Medium's Solid typecheck and lint passed.

### Slider shadow-root keys and tiny-step precision

- Closed keyboard.19 with a real browser key press inside an open shadow root.
- Expanded keyboard.10 to every specified numeric example and repeated tiny-step callback/ARIA values, including exact 25.1 text. Astra low confirmed the failures compared equivalent decimal/scientific strings; the literal fixed-decimal notation alternative remains partial.
- Independent final Chromium run passed all four cases; verifier lint and formatting passed.

### Slider synchronous display and live thumb counts

- Closed state.1 with ARIA, RGB, hex and swatch assertions after each direct key dispatch and synchronous Solid flush, without awaiting a later task.
- Closed state.11 by shrinking and growing the controlled thumb set during a gesture: movement passes the removed neighbor's old bound and clamps at the newly added neighbor.
- Independent Chromium run passed all three cases; Luna suite typechecking and lint passed, and root formatted the final file.

### Slider pointer behavior and active-thumb dragging flags

- Closed five gaps for stacked-thumb tie direction, per-move values/callbacks and clamping, release/blur/no-motion commit behavior, descendant hit testing, and active-thumb dragging flags.
- Astra low confirmed the shared flag incorrectly marked inactive thumbs. Astra medium tracks the active index, retaining shared root/control flags and clearing the index on release, cancellation, disabling and disposal.
- Independent checks passed 19 Slider adapter tests and all eight pointer Chromium tests. Medium's Solid typecheck and lint passed.

### Slider disabled gestures and collision tab order

- Closed pointer.7 with inert disabled thumb/rail sequences, native rail click/drag, callback silence, focus exclusion and focused-thumb disabling.
- Closed pointer.20 with collision values/identity and native forward/reverse Tab after collision. Added complete secondary synthetic-touch lifecycle assertions; pointer.10 remains partial pending browser-generated multi-touch integration.
- Independent final Chromium run passed all three cases. Luna lint passed; the concurrent parts slice had its own in-progress type errors.

### Slider cross-browser pointer fixture correction

- Astra low traced the WebKit secondary-touch failure to a trusted native mouse event sharing the fixture's synthetic owner ID. Synthetic touch IDs now differ from the browser mouse ID, preserving every ownership assertion.
- Independent full Slider checkpoint passed all 198 Chromium/Firefox/WebKit cases and 18 jsdom cases, excluding the separately pending parts test. No production change.

### Editable keyboard commits and draft restoration

- Closed four gaps for Enter's commit payload and hidden editor, unchanged Escape, both native maxlength examples with Backspace/replacement, and three full-deletion/cancel cycles.
- Independent Chromium run passed all four cases. Luna suite typechecking, lint and diff checks passed.

### Editable double-click and explicit edit triggers

- Closed four pointer gaps: EditTrigger focus, existing/placeholder double-click activation and Enter commit, replacement with Save, and Escape restoration. Single clicks are also checked against double-click-only activation.
- Independent final Chromium run passed all four cases; Luna suite typechecking and lint passed.

### Slider SSR geometry, parts and browser multi-touch

- Closed ssr.1 with server position properties and same-page before/after hydration rectangles for both thumb and selected range. Position properties also update after keyboard interaction.
- Closed pointer.10 with browser-generated Chromium multi-touch. Astra low corrected the original off-viewport coordinates; the second contact can start, move and end without taking ownership or ending the first gesture.
- All public part props, styles and ref targets now have reactive identity assertions. notes.3 remains partial for the deliberately absent hidden-input API. Astra corrected a browser shorthand-style assertion to its longhand equivalent.
- Independent checks passed three configured Chromium E2E cases, the parts test in jsdom and Chromium, and suite typechecking.

### Editable accessibility and reactive field metadata

- Closed a11y.1 and forms.1 with an axe scan and direct Field.Error valid/invalid lifecycle, required/disabled/readonly propagation and resolved description references.
- Expanded preview/input state transitions, clearing, placeholders, trigger button types and visibility. Three role requirements retain only concrete unshipped metadata/translation clauses.
- Independent full Editable runs passed 14 jsdom tests and 35 Chromium tests. Luna suite typechecking and lint passed.

### PinInput filtering and navigation

- Closed five gaps for numeric rejection/all-zero input, alphabetic acceptance and focus, Ctrl/Meta navigation, all six readonly navigation keys with edit suppression, and uncanceled disabled vertical keys.
- Independent final Chromium run passed all five cases. Luna suite typechecking and lint passed.

### PinInput editing selection and empty Delete

- Closed five gaps for filled replacement, filled-slot and repeated Backspace, empty Delete, and invalid-character selection preservation.
- Astra low confirmed two bugs. Astra medium prevents Delete on an empty slot from moving focus and restores selection after rejected input while the same slot remains focused. Core/adapter regressions failed before the fixes.
- Independent checks passed eight core tests, eight adapter tests and all 15 editing cases across Chromium, Firefox and WebKit. Medium typechecks and lint passed. A separate pointer slice still has failures under review.

### PinInput accessibility and native metadata

- Closed five gaps for default/numeric axe scans, masking with a native per-slot type override, disabled root/slots/proxy, complete-state markers and mobile text hints.
- Independent focused runs passed all five cases in jsdom and Chromium. Luna suite typechecking and lint passed.

### PinInput native mouse focus and clipboard paths

- Closed five pointer gaps for insertion focus, filled selection/replacement, consumer mousedown veto, filled paste and invalid/mixed paste. The earlier filled Backspace matrix also closes keyboard.28's remaining splice clause.
- Astra low reproduced the native failures. Astra medium handles primary mousedown after the consumer handler and selects only the active clicked slot, preserving bound-handler veto, readonly focus and disabled/nonprimary behavior.
- Corrected the existing Firefox paste fixture, whose ClipboardEvent constructor discarded its supplied DataTransfer. No clipboard production change.
- Independent full PinInput browser run passed 87 cases across three engines, excluding pending forms/role slices. All 14 adapter tests passed directly after the development compilation check succeeded but hung during shutdown; medium typechecking and lint passed.
