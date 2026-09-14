# TSDoc pass

Status: complete. See [tsdoc-progress.md](./tsdoc-progress.md) for reviewed batches,
commit hashes, exclusions, and final checks.

The working tree was committed before this plan. The latest behavior change is
`2bcb35a`, which makes Drawer thresholds explicit `%`, `px`, or `rem` strings.

## Scope

Document the code that exists, including public types and their members, exported
functions and components, returned controllers, and internal contracts that a
maintainer needs to use safely. Check existing comments as well as missing ones.

The initial inventory contains 90 implementation/support files: 26 in core,
9 in DOM, 46 in Solid, and 9 in suite. These counts include package scripts and
Solid's executable menu/index.tsx. They exclude generated attributes, plain
re-export barrels, individual test cases, and fixture-only code.

Audit those exclusions at package closeout. A barrel that defines a compound
component is implementation. Reusable helpers inside test or fixture files still
need documentation when their contract is not evident from their signature.
Review shared ESLint/TypeScript configuration, runner setup, and fixtures in a
final tooling pass; explain consequential choices without narrating every setting.
Keep the disposable example app outside the TSDoc sweep.

The date adapter currently exists only in docs/plans/date-adapters.md. Do not
write API documentation for that proposed implementation.

## Three levels of work

1. Package: core, then DOM, Solid, and suite/tooling. Close a package before
   starting the next one.
2. Module group: normally 6–10 related implementation files. Finish and review
   the whole group before opening the next. Dependencies and file size take
   precedence over equal file counts.
3. Commit batch: 1–3 related files, ordinarily no more than roughly 200 added
   comment lines. A large controller gets a batch of its own. When necessary,
   split that file sequentially into types/options, public operations, and
   internal lifecycle contracts. Never assign the same file to two workers.

These are review limits, not comment quotas. A correct existing comment may need
no change. Record inspected files even when they do not produce a commit.

## Package and group order

Paths below are relative to each package. A family name means its implementation
files under src, including context and part modules where present.

| Package | Group | Owned modules |
| --- | --- | --- |
| core | C1: foundational contracts | part.ts, internal/activate, internal/checked, button, field, presence, collection, selection |
| core | C2: controls and composites | composite, checkbox, switch, toggle, toggle-group, radio-group, tabs, accordion |
| core | C3: disclosures and overlays | collapsible, separator, progress, dialog, alert-dialog, drawer, popover, menu |
| core | C4: generation | scripts/attrs.overrides.ts, scripts/gen-attrs.ts; audit generated types and exports |
| DOM | D1: lifecycle and interaction | wait-for-exit, drawer, layer, modal, focus-scope |
| DOM | D2: overlay controllers | dialog, positioning/types.ts, positioning/positioning.ts, floating-layer |
| Solid | S1: shared adapter behavior | spread.ts, internal/native, gate, checked, disclosure-trigger, presence; button |
| Solid | S2: fields and individual controls | field's four implementation files, checkbox, switch, toggle, separator, progress |
| Solid | S3: selection groups | toolbar's three files, toggle-group's two files, radio-group's three files |
| Solid | S4: disclosures | tabs' four files, accordion's three files, collapsible's two files |
| Solid | S5: overlays | internal/dialog, dialog, alert-dialog, drawer, positioning/positioning, popover |
| Solid | S6: menu and exports | menu root, context, trigger, content, items, executable index; scripts/check-exports.mjs; public export audit |
| suite | T1: reusable contracts | src/harness.ts, src/harness/solid.tsx, src/spec.ts, src/a11y.ts, src/field/contract.tsx |
| suite | T2: scripts | scripts/spec-ids.ts, check-spec.ts, tick-spec.ts, serve-ssr.ts |
| tooling | T3: final audit | shared configs, runner setup, SSR fixtures, reusable test helpers and remaining source files |

For example, C1 can run three disjoint batches: part/activate, checked/button,
and field. After their review and commits, document presence and
collection/selection. Only then move to C2. The coordinator expands each group
into an exact file checklist before dispatch so no file is omitted or duplicated.

## Worker and commit protocol

Use up to three workers alongside one coordinator. Each worker receives a fresh,
self-contained brief with exact owned paths, the relevant implementation/tests,
the documentation rules, and its current small batch. A worker reads dependencies
freely but edits only assigned files.

Workers return a reviewed batch and stop editing those files until the coordinator
accepts it. The coordinator checks claims against implementation and tests, runs
the batch checks, stages only those files, and commits. Only the coordinator uses
the Git index. Then the worker gets its next batch within the current group.

Commit examples:

- `docs(core): document button host and activation contracts`
- `docs(dom): document drawer threshold and gesture lifecycle`
- `docs(solid): document field association and error props`

Keep documentation commits separate from bug fixes, refactors, formatting sweeps,
and API changes. If documentation exposes a behavior/spec conflict, record the
exact conflict and resolve it separately; do not document the desired behavior as
though it already exists.

Maintain a package/group/batch ledger with exact files, inspected symbols, review
status, checks, and commit hash. Update it at group boundaries. Avoid unnecessary
per-file bookkeeping commits. Preserve individual documentation commits without
squashing so each batch can be reverted independently.

## What a useful comment says

- State what the API does and the caller's obligations.
- Explain actual defaults, units, valid values, and fallback behavior on the
  relevant option members. Use `@defaultValue` where it adds useful information.
- Specify callback payloads, timing, cancellation, and whether initialization
  invokes callbacks.
- Describe controlled/uncontrolled behavior, ID ownership, prop precedence,
  host semantics, and context requirements where applicable.
- For DOM controllers, cover registration, update, reset/dispose, cleanup,
  focus/scroll effects, measurement timing, and document ownership.
- For Solid, cover compound parts, refs, required nesting, SSR/hydration behavior,
  and the boundary between inherited native props and library-owned behavior.
- Use `@param`, `@returns`, `@remarks`, `@throws`, and `@example` when they convey
  information beyond a name or type. Use `{@link ...}` for shared contracts.
- Keep examples small and consistent with public subpath imports. Validate each
  distinct example against current types using existing tooling or temporary
  typecheck fixtures. Do not add a publishing system as part of this pass.

Avoid comments such as "The disabled flag" or prose restating every line. Internal
helpers need their assumptions and side effects documented, not a transcript of
their bodies. Documentation should attach to declarations visible in editor
hovers, including overloads, option members, compound exports, and aliased props.
Check representative hover/type resolution cases before scaling the pattern.

## Review and validation

For every small batch, review the complete diff, check claims against code and
existing tests, run formatting on touched source files, and confirm a
comment-only change with a TypeScript scanner/token comparison. Handle comments
that affect tooling, such as purity annotations or suppression directives, as
semantic changes rather than ordinary prose. Run the package typecheck before
committing the batch.

At each group boundary, use a worker who did not author the comments to review
cross-file consistency and missing public members. Run package lint and resolve
review findings before the next group. At package closeout, audit every exported
declaration and applicable internal contract against the ledger.

For the final pass, run workspace typecheck, lint, the existing unit/jsdom tests,
and Solid's export/build check. Browser reruns are needed if executable behavior
changes, a documentation claim requires browser evidence absent from existing
tests, or another unresolved concern warrants them. Do not create tests that only
assert comment text.

Completion means all inventoried files are reviewed, public contracts are
documented at their declarations, exclusions are explicit, examples are valid,
checks pass, and the tree is clean. A high comment count alone is not completion.
