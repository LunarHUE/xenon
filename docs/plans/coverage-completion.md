# Coverage completion

## Scope and workflow

Finish the 1,038 partial and 484 missing requirements recorded in
`coverage-backlog.json` for built components. The original IDs remain in this
backlog so changing a disposition cannot silently count as test completion.

GPT-5.6 Luna writes small test slices. The coordinator reviews assertions and
runs tests. GPT-5.6 Sol verifies failures against the intended contract;
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
