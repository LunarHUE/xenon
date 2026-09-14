# TSDoc progress

Approved plan: [tsdoc.md](./tsdoc.md). Run baseline: `707e71f`; the pre-existing example change in that commit is outside this documentation pass. All batches below received coordinator diff review, comment-only AST/directive checks, and package typecheck before commit.

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

## DOM D1 complete

Independent review and package lint passed. All five lifecycle modules reviewed. Follow-up focus-manager member documentation closes the peer-review coverage gap.

| Commit | Batch | Files |
| --- | --- | --- |
| `47be2d9` | document layer dismissal and ownership | `packages/dom/src/layer/layer.ts` |
| `23df829` | document focus scope lifecycle and restoration | `packages/dom/src/focus-scope/focus-scope.ts` |
| `ef7d7ba` | document modal isolation and scroll ownership | `packages/dom/src/modal/modal.ts` |
| `c2cd950` | document drawer gestures and exit waits | `packages/dom/src/drawer/drawer.ts`, `packages/dom/src/wait-for-exit/wait-for-exit.ts` |
| `468d71e` | document shared focus manager contracts | `packages/dom/src/focus-scope/focus-scope.ts` |

## DOM D2 and package closeout complete

Independent review and package lint passed. All nine implementation files reviewed; 146 tests pass, all exported symbols have docs, six TSDoc links resolve, and nine barrels are plain re-exports. Deferred callback snapshot wording was corrected after peer review.

| Commit | Batch | Files |
| --- | --- | --- |
| `b873dbf` | document native dialog session lifecycle | `packages/dom/src/dialog/dialog.ts` |
| `e1ca302` | document positioning options and state | `packages/dom/src/positioning/types.ts` |
| `363bf1b` | document positioning measurements and subscriptions | `packages/dom/src/positioning/positioning.ts` |
| `aa8f30e` | clarify deferred dialog pointer callbacks | `packages/dom/src/dialog/dialog.ts` |
| `7358e26` | document floating layer hosting and focus contracts | `packages/dom/src/floating-layer/floating-layer.ts` |
| `53fda76` | clarify floating pointer callback snapshots | `packages/dom/src/floating-layer/floating-layer.ts` |

## Solid S1 complete

Independent review and package lint passed. Shared props, event merging, controlled checked state and presence reviewed. Peer wording fixes distinguish caller tracking and handler dispatch from helper construction.

| Commit | Batch | Files |
| --- | --- | --- |
| `6ab353c` | document prop merging and native helpers | `packages/solid/src/spread.ts`, `packages/solid/src/internal/gate.ts`, `packages/solid/src/internal/native.ts` |
| `e4295a1` | document button props and checked control state | `packages/solid/src/button/button.tsx`, `packages/solid/src/internal/checked.tsx` |
| `a5393d6` | document presence timing and disclosure activation | `packages/solid/src/internal/presence.tsx`, `packages/solid/src/internal/disclosure-trigger.ts` |
| `e74d797` | clarify prop merge tracking context | `packages/solid/src/spread.ts` |

## Solid S2 complete

Independent review and package lint passed. Nine files reviewed. Field public and aliased Error/control hovers resolve documentation. Peer review corrected host classification and registry-order wording.

| Commit | Batch | Files |
| --- | --- | --- |
| `b840294` | document field context and SSR association ownership | `packages/solid/src/field/context.ts`, `packages/solid/src/field/server-associations.ts` |
| `97b6408` | document checkbox switch and toggle components | `packages/solid/src/checkbox/checkbox.tsx`, `packages/solid/src/switch/switch.tsx`, `packages/solid/src/toggle/toggle.tsx` |
| `c49f12a` | document field root and compound parts | `packages/solid/src/field/field.tsx`, `packages/solid/src/field/parts.tsx` |
| `b9ab313` | document progress and separator presentation | `packages/solid/src/progress/progress.tsx`, `packages/solid/src/separator/separator.tsx` |
| `73a6da0` | clarify field ID getter contract | `packages/solid/src/field/field.tsx` |

## Solid S3 complete

Independent review and package lint passed. Peer reviewed toolbar, toggle group and radio group contracts; clarified radio equality and native-host author overrides before commit. Navigation group documentation is complete.

| Commit | Batch | Files |
| --- | --- | --- |
| `d5e9bce` | document toggle group selection and navigation | `packages/solid/src/toggle-group/context.ts`, `packages/solid/src/toggle-group/toggle-group.tsx` |
| `5da7ccb` | document toolbar parts and registry contracts | `packages/solid/src/toolbar/context.ts`, `packages/solid/src/toolbar/items.tsx`, `packages/solid/src/toolbar/toolbar.tsx` |
| `46747eb` | document radio hosts and form state ownership | `packages/solid/src/radio-group/context.ts`, `packages/solid/src/radio-group/item.tsx`, `packages/solid/src/radio-group/radio-group.tsx` |

## Solid S4 complete

Independent review and package lint passed. Disclosures independently reviewed, including retained IDs, structural focus probing, presence overrides and SSR timing. Documented existing limitation: programmatic focus reporting can select a disabled tab in automatic mode; keyboard destinations and click selection remain gated. Native focusout cancellation wording was corrected. All 38 current Solid documentation links resolve.

| Commit | Batch | Files |
| --- | --- | --- |
| `4ecabb7` | document collapsible presence and part contracts | `packages/solid/src/collapsible/context.ts`, `packages/solid/src/collapsible/collapsible.tsx` |
| `5e648cb` | document tabs registry and focusable-content probe | `packages/solid/src/tabs/context.ts`, `packages/solid/src/tabs/focusable.ts` |
| `858d250` | document accordion selection and item presence | `packages/solid/src/accordion/context.ts`, `packages/solid/src/accordion/accordion.tsx`, `packages/solid/src/accordion/items.tsx` |
| `fd3e479` | clarify tabs disabled navigation contract | `packages/solid/src/tabs/context.ts` |
| `187f8a8` | document tabs parts and selection lifecycle | `packages/solid/src/tabs/tabs.tsx`, `packages/solid/src/tabs/parts.tsx` |
| `951bac6` | clarify native tabs focusout cancellation | `packages/solid/src/tabs/parts.tsx` |

## Solid S5 complete

Independent review and package lint passed. Overlay options and lifecycle batches independently reviewed against shared DOM controllers and existing tests. Checked focus publication order, controlled dismissal, retained exit sessions, drawer threshold units, trigger and arrow ownership, SSR associations and compound aliases.

| Commit | Batch | Files |
| --- | --- | --- |
| `5364b1f` | document reactive positioning ownership and props | `packages/solid/src/positioning/positioning.ts` |
| `83a64d1` | document shared dialog option and context contracts | `packages/solid/src/internal/dialog.tsx` |
| `576da6f` | document popover options and positioning contracts | `packages/solid/src/popover/popover.tsx` |
| `964859e` | document dialog family exports and drawer handles | `packages/solid/src/dialog/dialog.tsx`, `packages/solid/src/alert-dialog/alert-dialog.tsx`, `packages/solid/src/drawer/drawer.tsx` |
| `2f029ab` | document dialog rendering and controller lifecycle | `packages/solid/src/internal/dialog.tsx` |
| `5ffba57` | document popover parts and hosted overlay lifecycle | `packages/solid/src/popover/popover.tsx` |

## Solid S6 and package closeout complete

Independent review and package lint passed. Independent menu review passed. All 45 implementation files plus the export checker are covered; 19 remaining source barrels contain only re-exports. Public-member audit: 185 exports, 592 reachable members, no missing docs. All 59 documentation links resolve. Solid tests: 172 passed across 21 files. Every public subpath builds and both Button import styles exclude unrelated modules. Existing root-trigger ArrowUp/Down behavior is distinguished from disabled Button activation gating.

| Commit | Batch | Files |
| --- | --- | --- |
| `f9f307b` | document menu exports and subpath build checks | `packages/solid/src/menu/index.tsx`, `packages/solid/scripts/check-exports.mjs` |
| `85b9283` | document menu hosting and keyboard boundaries | `packages/solid/src/menu/content.tsx` |
| `a3f4781` | document menu state and registration contracts | `packages/solid/src/menu/context.ts`, `packages/solid/src/menu/root.tsx` |
| `0753d52` | document menu triggers and selection parts | `packages/solid/src/menu/trigger.tsx`, `packages/solid/src/menu/items.tsx` |
