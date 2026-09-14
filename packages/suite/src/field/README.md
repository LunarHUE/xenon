# Field coverage scope

These tests exercise the shipped `Field`, `Field.Label`, `Field.Description`,
`Field.Error` and `Field.Control` APIs. Input and textarea coverage uses
`Field.Control`, the exported native text control. `contract.tsx` runs the same
flags, naming and description checks against input, textarea, checkbox and
switch. The source research bullets remain in `docs/spec/field.md`.

The architecture decisions govern these differences from the research:

- `label.roles.1`: native labelable hosts use `label[for]`; only generic hosts
  merge label ids into `aria-labelledby`. Author ids precede library ids.
  The test checks multiple generic labels, live author ids and removal.
- `field.forms.5`, `field.forms.28`, `field.forms.30`: errors are accessible
  descriptions, ordered after author references and helper descriptions. They
  never generate `aria-errormessage`. Valid errors leave the DOM.
- `text-field.roles.1`: native input type and role defaults count as semantics;
  the adapter need not redundantly write `type="text"` or `role="textbox"`.
- `field.roles.5`: author control ids are registered and removal restores the
  stable generated id. The initial root id is the base; changing that base and
  group-control replacement are not covered.
- `field.pointer.3`: the browser test covers native disabled fieldset ancestry.
  The shared contract covers root disabling; label focus covers disabled roots.
- `field.notes.6`: the reusable battery checks all four shipped control kinds;
  its dedicated regression keeps a nested label and checkbox stable during
  registry updates.

The following research requirements need APIs the round-one implementation does
not export, so no placeholder tests claim coverage:

- Field items, target selection and required-indicator parts: `field.roles.8`,
  `.9`, `.10`, `.16`, `field.focus.2`, `.3`, `field.notes.1`.
- Dirty, touched, filled and focused state: `field.roles.2`, `.14`,
  `field.state.1` through `.6`, `.9`, `field.ssr.3`, `checkbox.forms.31`, `.32`,
  `switch.focus.6`, `switch.forms.13`. The four implemented flags are tested.
- Validation, server errors and form orchestration: `field.keyboard.*`,
  `field.forms.1` through `.3`, `.6` through `.24`, `field.state.8`, and the
  `form` section. Checkbox/switch validation candidates remain outside the shipped API.
- Fieldset/legend components: the `fieldset` section beyond the native host
  role and disabling behavior tested by `field.roles.1`.
- Passive/non-native labels, label providers and warnings: `label.roles.4`,
  `.7` through `.9`, `label.pointer.2`, `.3`, `label.a11y.2`, `label.notes.1`.
- Error transitions and field-specific hydration policies: `field.animation.1`,
  `field.ssr.*`. General text-field hydration is covered by the E2E fixture below.
- Text-field value controllers and custom interaction props:
  `text-field.state.1`, `.2`, `text-field.pointer.1`, `text-field.focus.2`,
  `text-field.roles.6`, `text-field.forms.2` through `.7`, `textarea.keyboard.1`,
  `textarea.positioning.1`. `Field.Control` forwards native values and events.
- `controlled-state` describes a separate state primitive, not Field's four
  flags; those requirements are not claimed by this battery.

Other conflicting research bullets remain unclaimed: redundant native label
ARIA, reversed description ordering, nine mirrored flags, `aria-live="polite"`
versus the shipped alert role, `-error-message` versus the shipped `-error`
suffix, a missing-context-tolerant control, and disabling that clears invalid
ARIA. The architecture explicitly chooses native naming, four flags,
consumer-first descriptions and OR-ed invalid state. It does not adopt the
remaining alternative APIs or presentation details.

## Checkbox and switch integration inventory

Ten previously blocked source TODOs now run as tests:
`checkbox.roles.27`, `.29`, `.32`, `checkbox.forms.20`, `.26`,
`switch.roles.15`, `.24`, `.25`, `switch.forms.9`, `switch.notes.6`.
They cover multiple generic labels and descriptions, live description removal,
consumer-first merges, flag/name propagation, hidden-input names, native group
labelling, valid error omission, part ordering and the shared control battery.

Other field-related research candidates were inspected individually; current
classifications live in the checkbox and switch coverage inventories:

| IDs                                                                                                               | Why they do not describe the shipped contract                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkbox.roles.19`, `switch.roles.18`                                                                            | Require indicator/thumb parts and interaction/validation flags that are not exported.                                                             |
| `checkbox.roles.20`, `switch.roles.22`                                                                            | Require checkbox/switch anatomy IDs. Field owns the shipped label/control IDs.                                                                    |
| `checkbox.roles.21`, `switch.roles.19`                                                                            | Require redundant `aria-labelledby` on native controls. Architecture selects native `label[for]`.                                                 |
| `checkbox.roles.26`, `switch.roles.23`                                                                            | Require appending the control's own ID to incorporate `aria-label`. Architecture specifies author-first naming without that extra self-reference. |
| `checkbox.roles.28`, `.31`, `switch.roles.29`                                                                     | Specify library-first descriptions, the opposite of the recorded consumer-first decision.                                                         |
| `checkbox.roles.30`, `switch.roles.26`                                                                            | Require deriving ARIA references by querying external native labels. Native labels already supply the accessible name.                            |
| `switch.roles.30`                                                                                                 | Exposed control merge is covered; the full bullet additionally requires a description on the aria-hidden backing input, which is not emitted.     |
| `checkbox.focus.9`, `checkbox.forms.18`, `.19`, `.27`, `.28`, `.29`, `.30`, `switch.forms.8`, `.10`, `.11`, `.12` | Require form validation, error scheduling, server-error clearing or validation focus APIs. Field only consumes explicit invalid state.            |
| `checkbox.forms.31`, `.32`, `switch.focus.6`, `switch.forms.13`                                                   | Require touched, dirty, filled, focus or validated-state tracking.                                                                                |
| `switch.state.7`                                                                                                  | Requires cancellation via change-event details and dirty/filled flags. The shipped change payload is a boolean.                                   |
| `switch.pointer.7`                                                                                                | Requires an unshipped passive label prop.                                                                                                         |
| `checkbox.ssr.1`                                                                                                  | Requires an explicit control ID to be ignored server-side and restored at hydration, contrary to author attribute precedence.                     |

Animation parts, React form actions, custom-element internals and other
unshipped contracts are documented in the checkbox and switch inventories,
rather than retained as executable TODO registrations.

## Server rendering and hydration

`e2e/hydration.spec.ts` serves the actual component tree through Solid's
`renderToString` and `generateHydrationScript`, then calls `hydrate` on the same
DOM. It checks every server element survives, IDs remain identical and unique,
no runtime errors are logged, and each interactive component works afterwards.
A separate browser context with JavaScript disabled checks the original server
markup, including field descriptions before and after controls, invalid errors,
checked inputs, selected tabs and panels, accordion links, toggle state, radio
selection, progress values and the native separator. Closed collapsibles are
checked in both unmounted and force-mounted hidden modes. Tabs without a value
select the first enabled tab even when the first rendered tab is disabled.

This directly exercises `text-field.ssr.1`, `progress.ssr.1`,
`radio-group.ssr.1`, `accordion.ssr.1` and `.5`, `collapsible.ssr.2`,
and the supplied-default and first-enabled-default branches of `tabs.ssr.1`. The identity check also covers stable tab IDs, but does not
claim the deliberately different server/client prefix case in `tabs.ssr.2`.
Collapsible open, closed and force-mounted closed content keep the same initial
semantics through hydration. The native-hidden retained case is the architecture
alternative to the explicit display-none mode in `collapsible.ssr.3`, not a claim
of that exact research API. Both closed variants open through real clicks
afterwards. The tests also change the initially implicit tab selection.

The SSR fixes preserve reactive allocation counts across environments. On the
server, Field uses synchronous registration and a fresh core calculation;
`Field.Control` delays element construction through an untracked lazy memo until
direct sibling metadata has registered. No user children are rendered twice.

Known SSR limitation: a control inside a native wrapper before a description
outside that wrapper is serialized too early to discover the later description.
The exact desired accessible-description assertion is retained as an expected
failure in `hydration.spec.ts`; it is not claimed as passing conformance.
An explicit `aria-describedby` on that control, paired with an author ID on the
description, works before JavaScript and has a passing assertion in the fixture.
Hydration adds automatic references for the nested case. Fixing its server
markup requires registration across native wrapper serialization boundaries.
