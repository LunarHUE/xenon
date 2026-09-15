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
- Independent combined Meter/Selection/Avatar run: 35 jsdom and 37 Chromium
  tests passed. Audit validation passed.
- Milestone after the Field fix: all 808 suite jsdom and 396 Solid tests passed.
