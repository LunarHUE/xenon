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
- Browser baseline is running.
- Existing changes to `flake.nix` and `flake.lock` are outside this work.

## Verified slices

Pending the first agent handoffs.
