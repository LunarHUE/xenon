# TSDoc progress

Approved plan: [tsdoc.md](./tsdoc.md). All batches below received coordinator diff review, comment-only AST/directive checks, and package typecheck before commit.

## Core C1 complete

Independent review found no factual defects. Package lint and representative consumer-property documentation checks passed.

| Commit | Batch | Files |
| --- | --- | --- |
| `013e58f` | document part and activation contracts | `packages/core/src/part.ts`, `packages/core/src/internal/activate.ts` |
| `9f33408` | document field associations and propagation | `packages/core/src/field/field.ts` |
| `afe002d` | document button and checked host behavior | `packages/core/src/button/button.ts`, `packages/core/src/internal/checked.ts` |
| `c2d42c4` | document presence phases and mounting intent | `packages/core/src/presence/presence.ts` |
| `23d398c` | document collection queries and selection payloads | `packages/core/src/collection/collection.ts`, `packages/core/src/selection/selection.ts` |

## Behavior observations

- Selection uses `includes` for membership and strict equality for removal, so `NaN` can report selected without toggling off. Documented existing behavior; no runtime change in this pass.

## Core C2 complete

Independent review and package lint passed. Peer review qualified disabled focus reporting and keydown-only cancellation before closeout.

| Commit | Batch | Files |
| --- | --- | --- |
| `408bcfc` | document checkbox switch and toggle APIs | `packages/core/src/checkbox/checkbox.ts`, `packages/core/src/switch/switch.ts`, `packages/core/src/toggle/toggle.ts` |
| `e967e7c` | document composite and toggle group navigation | `packages/core/src/composite/composite.ts`, `packages/core/src/toggle-group/toggle-group.ts` |
| `a530917` | document tabs selection and panel contracts | `packages/core/src/tabs/tabs.ts` |
| `7e0512c` | clarify mixed state ownership and repeated activation | `packages/core/src/checkbox/checkbox.ts`, `packages/core/src/button/button.ts` |
| `f217e6f` | document radio host and form contracts | `packages/core/src/radio-group/radio-group.ts` |
| `dc11685` | document accordion disclosure and navigation contracts | `packages/core/src/accordion/accordion.ts` |
| `ceb7df3` | qualify toggle group keydown cancellation | `packages/core/src/toggle-group/toggle-group.ts` |

## Core C3 complete

Independent review and package lint passed. Overlay docs distinguish pure core attributes from DOM hosting, focus and dismissal responsibilities.

| Commit | Batch | Files |
| --- | --- | --- |
| `f1c13a7` | document dialog alert dialog and drawer contracts | `packages/core/src/dialog/dialog.ts`, `packages/core/src/alert-dialog/alert-dialog.ts`, `packages/core/src/drawer/drawer.ts` |
| `107dd58` | document collapsible separator and progress behavior | `packages/core/src/collapsible/collapsible.ts`, `packages/core/src/separator/separator.ts`, `packages/core/src/progress/progress.ts` |
| `6543b0e` | document popover and menu contracts | `packages/core/src/popover/popover.ts`, `packages/core/src/menu/menu.ts` |

## Core C4 and package closeout complete

Independent review and package lint passed. All 26 targeted files reviewed. 186 tests pass; 32 TSDoc links resolve, 63 inherited property hovers and 34 public call signatures expose documentation. All 22 barrels are plain re-exports; generated attributes remain unchanged.

| Commit | Batch | Files |
| --- | --- | --- |
| `86fe984` | document attribute generator inputs and execution | `packages/core/scripts/attrs.overrides.ts`, `packages/core/scripts/gen-attrs.ts` |
