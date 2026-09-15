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
