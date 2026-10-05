# Proposed first test wave

<!-- Generated from test-campaign-wave-1.json by campaign:report. Do not edit. -->

Status: proposal. No implementation dispatched by this plan.

Initial roadmap, not an exhaustive assignment of the entire backlog. Unassigned requirements remain in the generated queue.

Three workers plus coordinator. Workers draft tests; coordinator owns browser execution, integration and commits.

Use GPT-6.1 Sol workers. The [generated inventory](test-campaign-summary.md) remains the complete queue; this roadmap prioritizes the first development slices.

The JSON proposal contains exact IDs, assertions, dependencies, risks and verification commands. Slice sizes count unique requirements; one requirement may need several tests and engines.

| Lane | First batch | Cases | Requirements |
| --- | --- | ---: | ---: |
| Menus and navigation | menu-foundations | 8 | 10 |
| Popup selection and forms | selection-membership | 8 | 9 |
| Overlays, focus and positioning | toast | 8 | 6 |

## Menus and navigation

| Large slice | Requirements |
| --- | ---: |
| Menu metadata, keyboard navigation, and stable ownership | 16 |
| Nested Menu, ContextMenu, and Menubar ownership and dismissal | 21 |
| Navigation lifecycle, presence geometry, and interactive collections | 11 |
| Menu family accessibility and positioning acceptance | 17 |

First file: `packages/suite/src/menu/menu.wave-foundations.test-browser.tsx`.

1. Closed controls absent; native first-open controls resolves exactly current content; close clears and reopen resolves. IDs: `menu.roles.6`, `menu.roles.41`.
2. Replace trigger host/id while open; labelledby resolves replacement, stale ID absent. IDs: `menu.roles.8`.
3. Exactly one item0, others-1, container-1, no positive tabindex or active-descendant; inspect after each native arrow. IDs: `menu.roles.21`, `menu.roles.22`.
4. haspopup menu and expanded false→true→false; matching owned child menu. IDs: `menu.roles.26`.
5. aria-disabled true plus data-disabled; native/synthetic explicitly identified forward-arrow/click attempts never open. IDs: `menu.roles.30`.
6. Native Home/End reach first/last enabled item from each position without activation callbacks. IDs: `menu.keyboard.6`.
7. Enter, Space, Down, Up leave popup absent with zero open requests on focusable disabled fixture. IDs: `menu.keyboard.3`.
8. Native Space exactly one action, closed popup, own trigger focus; no extra keyup action. IDs: `menu.keyboard.12`.

## Popup selection and forms

| Large slice | Requirements |
| --- | ---: |
| Listbox range selection and controlled state | 9 |
| Listbox navigation, focus and reference integrity | 9 |
| Combobox editing, controlled drafts and native submission | 9 |
| Select and Combobox native Field ownership and reactive gates | 10 |
| Popup presence and real hydration with form ownership | 8 |

First file: `packages/suite/src/listbox/listbox.membership-wave.test-browser.tsx`.

1. Start anchor Apple with selected Apple; extend across disabled item to Banana/Cherry. After each step assert every enabled and disabled aria-selected, active focus, exact selected callback arrays, outside options false. IDs: `listbox.keyboard.35`, `listbox.state.3`.
2. Select prior distant range, click new anchor, ShiftDown. Assert complete overwrite of inside/outside membership and callback ordering, disabled exclusion. IDs: `listbox.keyboard.36`, `listbox.state.3`.
3. Native Meta+A selects all enabled items, excludes disabled, exact array once. Repeat reports same enabled array; no optional clear/string-all claim. IDs: `listbox.keyboard.41`.
4. Native select option, Tab to known sibling. Assert outside activeElement and same selected marker/value, no new selection callback; reenter preserves membership. IDs: `listbox.state.2`.
5. Assert default marker before interaction, capture all option/root identities. Native click another option updates full membership and exact callback once on same hosts. IDs: `listbox.state.4`.
6. Hold value Apple, click Banana. Callback once Banana; Apple remains selected, Banana false; native focus may move separately. IDs: `listbox.state.5`.
7. Filter registered items via For/Show and externally replace value. New selected item marker matches owner, obsolete item removed/false, no change callback; no selectedItems API claim. IDs: `listbox.state.6`.
8. Update title/data/aria attribute without active/value changes. Same option node gets attributes, selected/highlight unchanged, callbacks silent; reactive disabled path independently remains valid. IDs: `listbox.state.16`.

## Overlays, focus and positioning

| Large slice | Requirements |
| --- | ---: |
| Toast metadata, timing, queue and gesture lifecycle | 61 |
| HoverCard and Tooltip live intent, shared triggers and positioning | 81 |
| Dialog family and Popover native focus, handles and retained lifecycle | 113 |
| Shared FocusScope scans, native Tab edges and restoration | 23 |
| Modal isolation mutations, layer sessions and nested portal ordering | 44 |

First file: `packages/suite/src/toast/toast.metadata.remaining.test-browser.tsx`.

1. Title absent then registered: all aria-labelledby IDs resolve and disappear on Title removal. IDs: `toast.roles.3`.
2. Replace Title element and reactive authored ID; Content stays same node and exact association follows replacement. IDs: `toast.roles.3`.
3. Author region label replaces default; {hotkey} interpolates default Alt+T in computed name. IDs: `toast.roles.7`.
4. Custom hotkey changes interpolation reactively; authored undefined removes default name without invented localization. IDs: `toast.roles.7`.
5. Trusted Enter on focused Close dismisses once, reports close reason and clears only its speech. IDs: `toast.keyboard.9`.
6. Empty native region between two buttons is skipped by forward and reverse Tab, before arrivals and after last close. IDs: `toast.focus.10`.
7. Trusted Close dismisses pending promise; resolution afterward cannot re-add or announce the record. IDs: `toast.state.16`.
8. Explicit Portal container receives actual region/content and DOM ownership remains correct. IDs: `toast.dismissal.4`.

## Batch handoff and verification

- Each worker owns one new test file at a time and reports 5–10 meaningful cases with requirement IDs, supported clauses, exclusions and static checks.
- Coordinator checks assertions against shipped behavior, freezes affected source, and runs the native batch in Chromium, Firefox and WebKit. No concurrent browser sessions from workers.
- Classify a failure as product defect, fixture/timing error, environment failure or contract conflict. Reproduce before assigning a fix; retain failing assertions unless the fixture or expectation is wrong.
- Assign real fixes to a focused worker. Serialize edits to shared DOM/Solid utilities. Coordinator reruns the slice and relevant sibling consumers.
- Commit each accepted test batch separately from each product fix. Refresh generated reports after reviewed evidence changes. No attribution trailers.
- Keep mixed clauses partial; unsupported APIs, explicit decisions and browser limitations are not completion credit. No new API implementation without a scope decision.

Larger slices must still be divided into reviewed batches before dispatch. Entries flagged for reassessment, contract resolution or unsupported scope cannot be assigned merely because they appear in a roadmap slice.

Shared assignments in this proposal: portal.dismissal.3 to overlays-focus; prevent-scroll.positioning.1 to overlays-focus.

Edit [the proposal](test-campaign-wave-1.json), then run `bun run --cwd packages/suite campaign:report`. `campaign:check` validates IDs, first-batch scope, lane ownership and generated output freshness.
