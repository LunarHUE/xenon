# How Kobalte, Corvu, Ark UI and Bits UI write component docs

Source material for the Xenon docs style guide. Everything below comes from shallow clones in `/tmp/docs-src/` taken on 2026-09-27. Quotes are verbatim, including their typos and their em dashes. Where I say "bug" I mean a factual error in the shipped docs, not a style complaint.

Path shorthands used throughout:

- `K/` = `/tmp/docs-src/kobalte/apps/docs/src/routes/docs/core/` (component pages live in `K/(1)components/`, guides in `K/(0)overview/`)
- `C/` = `/tmp/docs-src/corvu/web/src/pages/docs/` (pages); `CP/` = `/tmp/docs-src/corvu/packages/` (TSDoc that generates the API tables)
- `A/` = `/tmp/docs-src/ark/website/src/content/pages/` (pages); `AT/` = `/tmp/docs-src/ark/website/src/content/types/solid/` (generated prop JSON); `Z/` = `/tmp/docs-src/zagdocs/package/data/` (the `@zag-js/docs` npm package, which supplies Ark's keyboard, data-attribute and CSS-variable tables)
- `B/` = `/tmp/docs-src/bits-ui/docs/content/` (pages); `BA/` = `/tmp/docs-src/bits-ui/docs/src/lib/content/api-reference/` (hand-written API schemas)

Coverage gaps. Corvu has no Button, Tabs, Checkbox, Select or Slider (its primitives are Accordion, Calendar, Dialog, Disclosure, Drawer, OTP Field, Popover, Resizable, Tooltip). Ark has no Button page. Everything else on the requested list was read in full.

Writing-guideline files found:

- `/tmp/docs-src/ark/.claude/docs/documentation-patterns.md`, the only real docs style guide among the four. It is aimed at AI agents and is worth reading in full.
- `/tmp/docs-src/kobalte/CONTRIBUTING.md` has API design principles ("Accessible / Composable / Customizable") and nothing on prose.
- `/tmp/docs-src/bits-ui/CONTRIBUTING.md` says only "Improving Documentation: Help us make the documentation clearer, more comprehensive, and easier to understand."
- Corvu has no contributor or writing file.

---

## 1. Page structure

### Kobalte: fixed and identical on every page

Every component page I read follows this order exactly (`K/(1)components/button.mdx`, `dialog.mdx`, `popover.mdx`, `tabs.mdx`, `checkbox.mdx`, `select.mdx`, `slider.mdx`, `accordion.mdx`):

1. Title, then one-line description (no heading)
2. `## Import`
3. `## Features` (bullets)
4. `## Anatomy` (bold-name bullet list, then a JSX tree)
5. `## Example` (one live preview with `index.tsx` and `style.css` tabs)
6. `## Usage` (H3 per scenario). Button has no Usage section.
7. `## API Reference` (H3 per part: prop table, then render-prop table, then data-attribute table)
8. `## Rendered elements` (part to default tag)
9. `## Accessibility` with `### Keyboard Interactions`

Frontmatter badges carry version, import path, source link and the WAI-ARIA pattern link, so the page body doesn't repeat them:

```yaml
badges:
  - icon: npm
    label: "Since v0.1.0"
  - label: "@kobalte/core/button"
  - icon: aria
    label: "Button"
    url: "https://www.w3.org/WAI/ARIA/apg/patterns/button/"
```
(`K/(1)components/button.mdx`)

Import always shows three forms, the last marked deprecated:

```ts
import { Dialog } from "@kobalte/core/dialog";
// or
import { Root, Trigger, ... } from "@kobalte/core/dialog";
// or (deprecated)
import { Dialog } from "@kobalte/core";
```

"Rendered elements" is unique to Kobalte and useful for a headless library, since it answers "what tag do I style?" at a glance:

```
| `Dialog`             | none                     |
| `Dialog.Trigger`     | `button`                 |
| `Dialog.Portal`      | `Portal`                 |
| `Dialog.Title`       | `h2`                     |
```
(`K/(1)components/dialog.mdx`)

There are no CSS variable tables. CSS variables show up in prose under Usage ("Origin-aware animations", "Animating content size") or inside a prop description.

### Corvu: example first, API generated

`C/primitives/dialog.mdx`, `accordion.mdx`, `popover.mdx`:

1. `# Dialog`, then one-line description
2. `<PackageInfo>` widget, then the live example (Tailwind and CSS tabs) with **no heading**
3. `## Features` (component taking a string array)
4. `## Installation` (npm command plus "The dialog is also included in the main `corvu` package under `corvu/dialog`.")
5. `## Usage` (import block), then `### Anatomy` as an H3 under Usage, then free-form H3s (Scrolling, Nested dialogs, Persistent content, Animation)
6. `## Accessibility` (one sentence linking the APG pattern, sometimes `### Keyboard navigation`)
7. `## API reference` (`<ApiReference library={Dialog} />`, generated from TSDoc)

The SEO frontmatter is templated: `title: SolidJS Dialog`, `description: A customizable, unstyled and accessible dialog component for SolidJS`. The same sentence appears on accordion and popover with the noun swapped.

### Ark UI: documented template

The template is written down in `/tmp/docs-src/ark/.claude/docs/documentation-patterns.md`:

```markdown
<ComponentPreview id="ComponentName" />
## Anatomy
<Anatomy id="component-name" />
## Examples
<Example id="basic" />
### Feature Example
Description of what this demonstrates.
## Guides (if applicable)
## API Reference
### Props
### Context
## Accessibility (if applicable)
<KeyBindingsTable id="component-name" />
```

It comes with a checklist ("Examples start with basic", "Examples ordered simple to complex", "Guides contain non-interactive content only") and a rule for splitting Examples from Guides:

> **Examples Section** - Interactive demos with `<Example id="..." />` ... Each example has a brief description
> **Guides Section** - Non-interactive implementation guidance: CSS styling patterns and animations; Integration guides (Next.js, Remix, router setup); Advanced configuration and type safety patterns

> Move content to Guides if it contains: 1. **CSS code blocks** ... 4. **Prop explanations** - Code snippets without interactive behavior

There are no Import, Features or Rendered-elements sections. The description lives only in frontmatter (`description: A modal window that appears on top of the main content.`). Anatomy is an illustrated SVG diagram (`<Anatomy id="dialog" />`, drawn from `@zag-js/anatomy-icons`) followed by a JSX tree. Data attributes and CSS variables render inside the Props section per part, from `@zag-js/docs` (`/tmp/docs-src/ark/website/src/components/component-types.tsx` calls `<DataAttrTable>` and `<CssVarTable>`).

### Bits UI: two tiers

Simple pages (`B/components/button.md`, `tabs.md`, `popover.md`, `slider.md`) have a preview, `## Structure`, H2 feature sections, and `<APISection {schemas} />`. Button is the whole page in 29 lines.

Rewritten "long-form" pages (`dialog.md`, `select.md`, `checkbox.md`, `accordion.md`) add three prose sections before Structure:

```
## Overview
## Key Features
## Architecture      (bold-name bullet list of parts)
## Structure         (code tree)
## Reusable Components
## Managing Open State / Managing Value State
   ### Two-Way Binding
   ### Fully Controlled
...feature H2s...
<APISection />
```

Per-component keyboard tables are mostly absent. Only Rating Group, Progress and Meter have an `## Accessibility` heading (`grep -n '^## .*access' B/components/*.md`).

### Which sections are universal

| Section | Kobalte | Corvu | Ark | Bits |
|---|---|---|---|---|
| One-line description | body | body | frontmatter | frontmatter |
| Live preview at top | under "Example" | yes, unheaded | yes | yes |
| Import / install | every page | every page | no | no (in Structure code) |
| Features list | every page | every page | no | long-form pages only |
| Anatomy list with part roles | yes | no (tree only) | no (diagram + tree) | long-form only ("Architecture") |
| Anatomy tree | yes | yes | yes | yes |
| Controlled/uncontrolled example | every stateful page | once, in a guide | every stateful page | every stateful page |
| API: props | yes | generated | generated | hand schema |
| API: data attributes | yes | generated from `@data` tags | generated | yes |
| API: CSS variables | no table | no table | generated | yes |
| Rendered element per part | yes | no | no (only in `asChild` type) | no |
| Keyboard table | every page | some pages | every page (generated) | rare |

---

## 2. The one-line description

Lengths, measured over every component page. Kobalte averages 14.9 words (max 59, Alert Dialog). Ark averages 10.4 (max 17). Bits averages 10.3 (max 17). Corvu runs 6 to 40.

Grammar comes in three shapes:

1. A noun phrase naming what it is. "A window overlaid on...", "A set of layered sections..."
2. A verb phrase in third person with an implied subject. "Displays...", "Enables users to...", "Allows users to..."
3. "A component that..." or "Used to...", the weakest shape.

Opening words, counted:

- Kobalte: "A" 21, "Allows" 7, "Displays" 5, "An" 3
- Bits: "Enables" 12, "Displays" 9, "A" 8
- Ark: "A component" 13, "Used to" 3, "A control" 3

Verbatim examples, strongest first:

1. "A vertically stacked set of interactive headings that each reveal an associated section of content." (Kobalte, `accordion.mdx`)
2. "A set of layered sections of content, known as tab panels, that display one panel of content at a time." (Kobalte, `tabs.mdx`)
3. "A window overlaid on either the primary window or another dialog window. Content behind a modal dialog is inert, meaning that users cannot interact with it." (Kobalte, `dialog.mdx`)
4. "A control that allows the user to toggle between checked and not checked." (Kobalte, `checkbox.mdx`)
5. "An input where the user selects a value from within a given range." (Kobalte, `slider.mdx`)
6. "Displays a list of options for the user to pick from — triggered by a button." (Kobalte, `select.mdx`)
7. "A popover positioned relative to an anchor element." (Kobalte, `popover.mdx`; defines the word with itself)
8. "Enables users to trigger an action or event, such as submitting a form, opening a dialog, canceling an action, or performing a delete operation." (Kobalte, `button.mdx`)
9. "A two-state button that can be either on (pressed) or off (not pressed)." (Kobalte, `toggle-button.mdx`)
10. "A component that consists of multiple collapsible sections." (Corvu, `accordion.mdx`)
11. "A popup that displays an anchored interactive dialog on click. It uses the awesome Floating UI library in the background for positioning and allows you to fully customize its behavior." (Corvu, `popover.mdx`)
12. "A modal window that appears on top of the main content." (Ark, `dialog.mdx`)
13. "Organizes and navigates between sections in a view." (Ark, `tabs.mdx`)
14. "A control element that allows for a binary selection." (Ark, `checkbox.mdx`)
15. "A control element that allows for a range of selections." (Ark, `slider.mdx`)
16. "An interactive component that can be expanded or collapsed." (Ark, `collapsible.mdx`)
17. "A component that allows users to enter secure text like (passwords and api keys)" (Ark, `password-input.mdx`)
18. "A modal window for displaying content or requesting user input." (Bits, `dialog.md`)
19. "Enables users to select or deselect options with support for indeterminate states." (Bits, `checkbox.md`)
20. "Organizes content into tabbed sections." (Bits, `tabs.md`)
21. "Enables users to select a value from a continuous range." (Bits, `slider.md`)
22. "A component that can switch between a button and an anchor tag based on the `href` prop." (Bits, `button.md`; describes an implementation detail, not the job)
23. "Enables users to pick from a list of options displayed in a dropdown." (Bits, used for both `select.md` and `combobox.md`)

What works. The best lines (1, 2, 4, 5) come from the WAI-ARIA APG pattern definitions, and Kobalte borrows them nearly verbatim. They name what the thing is in the user's terms and include one distinguishing fact ("one panel of content at a time"). They never say "component", "customizable" or "accessible".

What fails:

- "A component that..." wastes three words on every page (Ark, 13 times).
- Ark's "A control element that allows for a binary selection" (checkbox) and "...allows for a range of selections" (slider) are too abstract to tell apart from a switch or a range input.
- Two different components sharing one description (Bits select and combobox).
- Implementation details in the headline (Corvu's "uses the awesome Floating UI library", Bits Button's `href` sentence).
- Missing trailing periods (Kobalte: "Displays numeric value that varies within a defined range", "Visually indicates content loading"; Ark: "A component to copy text to the clipboard").

---

## 3. Anatomy

Kobalte does both a role list and a tree. The list gives each part a role in one noun phrase, and the tree shows nesting:

> The dialog consists of:
> - **Dialog:** Contains all the parts of a dialog.
> - **Dialog.Trigger:** The button that opens the dialog.
> - **Dialog.Portal:** Portals its children into the `body` when the dialog is open.
> - **Dialog.Overlay:** The layer that covers the inert portion of the view when the dialog is open.
> - **Dialog.Title:** An accessible title to be announced when the dialog is opened.
> - **Dialog.Description:** An optional accessible description to be announced when the dialog is opened.

(`K/(1)components/dialog.mdx`)

Part descriptions mix sentence shapes. Some start with a verb ("Contains...", "Portals..."), some with a noun phrase ("The button that..."). Kobalte flags optional parts in words ("An optional accessible description"). Form-field parts repeat one template: "The label that gives the user information on the checkbox." / "The description that gives the user more information on the checkbox." / "The error message that gives the user information about how to fix a validation error on the checkbox." (`checkbox.mdx`, repeated in `slider.mdx` and `select.mdx` with the noun swapped).

Corvu shows the tree only, as `### Anatomy` under Usage, and adds a sentence when a part is optional or unusual:

> The anchor component can optionally be used to make the popover anchor itself to another element than the trigger. (`C/primitives/popover.mdx`)

> The accordion item uses the Disclosure component under the hood. It forwards the same props in the Item children callback and the disclosure context is re-exported as `Accordion.useDisclosureContext`. (`C/primitives/accordion.mdx`)

Corvu's part-level descriptions live in TSDoc and appear in the API reference: "Button that changes the open state of the dialog when clicked.", "Label element to announce the dialog to accessibility tools.", "Context wrapper for the dialog. Is required for every dialog you create.", "Component which can be used to create a faded background. Can be animated." (`CP/dialog/src/*.tsx`).

Ark uses an illustrated anatomy diagram plus a tree, with no role list. Roles don't appear anywhere on the page, since the Props tables only list props.

Bits puts a role list under "Architecture" (long-form pages only), then a tree under "Structure", introduced with "Here's an overview of how the Dialog component is structured in code:". Its role lines are weaker than Kobalte's: "**Title**: Renders the dialog's title." and "**Content**: The main container for the dialog's content." The API schemas carry one-line part descriptions too: "The element which opens the dialog on press.", "An overlay which covers the body when the dialog is open.", "A portal which renders the dialog into the body when it is open." (`BA/dialog.api.ts`).

The takeaway for Xenon is that Kobalte's pairing (role list, then tree) is the most useful and is cheap to write. A part description should say what the element is *and* when it matters ("when the dialog is open"). Ark shows that a diagram without roles leaves readers guessing what `Positioner` is for.

---

## 4. API reference

### Table shapes

**Kobalte** uses a two-column markdown table with the type on the first line of the Description cell:

```
| open          | `boolean` <br/> The controlled open state of the dialog. |
```

Then a separate "Render Prop" table and a "Data attribute" table per part. When parts share attributes, it says so in one line rather than repeating the table: "`Checkbox.Input`, `Checkbox.Control`, `Checkbox.Indicator`, `Checkbox.Label`, `Checkbox.Description` and `Checkbox.ErrorMessage` share the same data-attributes." When a part wraps another component: "`Dialog.Trigger` consists of [Button](/docs/core/components/button)." Defaults go inline in prose ("Defaults to 0") only on Slider. Most props state no default at all.

**Corvu** generates from TSDoc with a `@defaultValue` tag, and data attributes come from `@data` tags on the component JSDoc:

```ts
/**
 * Whether the dialog should close when the user presses the `Escape` key.
 * @defaultValue `true`
 */
closeOnEscapeKeyDown?: boolean
```

```ts
/** Content of the dialog. Can be animated.
 *
 * @data `data-corvu-dialog-content` - Present on every dialog content element.
 * @data `data-open` - Present when the dialog is open.
 * @data `data-closed` - Present when the dialog is closed.
 */
```
(`CP/dialog/src/Root.tsx`, `CP/dialog/src/Content.tsx`)

Corvu is the only library that writes conditional defaults: "@defaultValue `true` if `modal` is `true`, `false` otherwise" (`closeOnOutsidePointer`, `preventScroll`).

**Ark** generates from Zag types into JSON (`AT/dialog.types.json`) with `type`, `isRequired`, `description` and `defaultValue`. Data attributes and CSS variables come from `Z/data-attr.json` and `Z/css-vars.json`.

**Bits** uses hand-written TS schemas with helpers (`defineBooleanProp`, `defineSimpleDataAttr`, `defineEnumDataAttr`) and shared prop objects reused across components (`BA/shared.ts`). Each prop carries `default`, `bindable`, and a `description`. Each part has a description, `dataAttributes` and `cssVars`.

### Prop description wording, 30 real examples

State props (controlled/default/change):

1. "`boolean` <br/> The controlled open state of the dialog." (Kobalte `dialog.mdx`, `open`)
2. "`boolean` <br/> The default open state when initially rendered. Useful when you do not need to control the open state." (Kobalte `dialog.mdx`, `defaultOpen`)
3. "`(open: boolean) => void` <br/> Event handler called when the open state of the dialog changes." (Kobalte `dialog.mdx`, `onOpenChange`)
4. "`number[]` <br/> The controlled values of the slider. Must be used in conjunction with `onChange`." (Kobalte `slider.mdx`, `value`)
5. "Whether the dialog is open." (Corvu `Root.tsx`, `open`)
6. "Whether the dialog is open initially. @defaultValue `false`" (Corvu, `initialOpen`)
7. "Callback fired when the open state changes." (Corvu, `onOpenChange`)
8. "The initial open state of the dialog when rendered.\nUse when you don't need to control the open state of the dialog." (Ark `dialog.types.json`, `defaultOpen`)
9. "The controlled checked state of the checkbox" (Ark `checkbox.types.json`, `checked`)
10. "Whether or not the dialog is open." with `bindable: true`, `default: false` (Bits `dialog.api.ts`, `open`)
11. "A callback function called when the open state changes." (Bits `shared.ts`, `onOpenChangeProp`)
12. "A callback function called after the open state changes and all animations have completed." (Bits `shared.ts`, `onOpenChangeCompleteProp`)

Boolean behavior props:

13. "`boolean` <br/> Whether the dialog should be the only visible content for screen readers, when set to `true`: <br/> - interaction with outside elements will be disabled. <br/> - scroll will be locked. <br/> - focus will be locked inside the dialog content. <br/> - elements outside the dialog content will not be visible for screen readers." (Kobalte `dialog.mdx`, `modal`)
14. "Whether the dialog should restore focus to the previous active element when it closes. @defaultValue `true`" (Corvu, `restoreFocus`)
15. "Whether to restore the `<body>` scroll position with `window.scrollTo` to avoid possible layout shift after closing the dialog." (Corvu, `restoreScrollPosition`)
16. "Whether multiple accordion items can be expanded at the same time." default `false` (Ark accordion, `multiple`)
17. "Whether the active tab can be deselected when clicking on it." (Ark tabs, `deselectable`)
18. "Whether the content should use `hidden='until-found'` when closed. This allows browsers to search within collapsed content and automatically expand the accordion item when matches are found." (Bits `accordion.api.ts`)
19. "When `true`, prevents the body from scrolling when the content is open. This is useful when you want to use the content as a modal." (Bits `shared.ts`, `preventScrollProp`)
20. "`boolean` <br/> When `multiple` is `false`, allows closing content when clicking trigger for an open item." (Kobalte `accordion.mdx`, `collapsible`)

Enum and value props:

21. "The activation mode of the tabs. Can be `manual` or `automatic`\n- `manual`: Tabs are activated when clicked or press `enter` key.\n- `automatic`: Tabs are activated when receiving focus" (Ark tabs, `activationMode`)
22. "The origin of the slider range. The track is filled from the origin\nto the thumb for single values.\n- \"start\": Useful when the value represents an absolute value\n- \"center\": Useful when the value represents an offset (relative)" (Ark slider, `origin`)
23. "The minimum permitted steps between multiple thumbs.\n\n`minStepsBetweenThumbs` * `step` should reflect the gap between the thumbs.\n\n- `step: 1` and `minStepsBetweenThumbs: 10` => gap is `10`" (Ark slider)
24. "The step value of the slider. If a single number is provided, the slider will step by that number and use that number to generate the ticks (e.g. `step={1}` will generate ticks at `0, 1, 2, 3, ...`). If an array of numbers is provided, the slider will snap to those values..." (Bits `slider.api.ts`)
25. "The type of accordion. If set to `'multiple'`, the accordion will allow multiple items to be open at the same time. If set to `single`, the accordion will only allow a single item to be open." (Bits `accordion.api.ts`)
26. "`(params: GetValueLabelParams) => string` <br/> A function to get the accessible label text representing the current value in a human-readable format. If not provided, the value label will be read as a percentage of the max value." (Kobalte `slider.mdx`)

Event and escape-hatch props:

27. "`(event: KeyboardEvent) => void` <br/> Event handler called when the escape key is down. It can be prevented by calling `event.preventDefault`." (Kobalte `dialog.mdx`, Content)
28. "Callback fired when the user interacts outside the bounds of `<Dialog.Content />`. Can be prevented by calling `event.preventDefault`." (Corvu, `onOutsidePointer`)
29. "The behavior to use when an escape keydown event occurs in the floating content. `'close'` will close the content immediately. `'ignore'` will prevent the content from closing. `'defer-otherwise-close'` will defer to the parent element if it exists, otherwise it will close the content." (Bits `shared.ts`)
30. "`boolean` <br/> Used to force mounting when more control is needed. Useful when controlling animation with SolidJS animation libraries." (Kobalte, `forceMount`, pasted on 6+ parts)

### Patterns in the wording

First words by prop kind, consistent across all four:

- Controlled value: "The controlled X of the Y." (Kobalte, Ark). Corvu and Bits don't distinguish controlled from uncontrolled in the description, so "Whether the dialog is open." covers both.
- Initial value: "The default X when initially rendered." (Kobalte) or "The initial X of the Y when rendered." (Ark), always followed by the stock second sentence "Useful when you do not need to control the X." / "Use when you don't need to control the X of the Y."
- Boolean: "Whether ..." everywhere. Bits prefers "Whether or not ...".
- Callback: no library is internally consistent. Kobalte uses "Event handler called when"; Corvu "Callback fired when"; Bits mixes "A callback function called when", "A function that is called when", "A callback that is fired when" and "Callback fired when" in one file (`BA/shared.ts` lines 437, 506, 530, 304). Ark (`AT/*.json`) mixes "Function called when", "Function to call when", "Function invoked when" and "The callback invoked when".
- Tense is present, third person, with the subject dropped. None use imperative mood for props ("Set this to...").
- Preventable events always end with a fixed clause: "It can be prevented by calling `event.preventDefault`." (Kobalte) / "Can be prevented by calling `event.preventDefault`." (Corvu).

Defaults:

- Corvu and Ark show them in a column from `@defaultValue`.
- Bits has a `default` field per prop.
- Kobalte writes "Defaults to 0" in prose on only some props, with or without a period ("Defaults to false." / "Defaults to 100"). Most Kobalte props have no default stated.

Data-attribute wording:

- "Present when ..." is universal for boolean attributes: "Present when the checkbox is checked." (Kobalte); "Present when the dialog is open." (Corvu); "Present when disabled" (Zag); "Present when the thumb is active/grabbed." (Bits).
- Enum attributes: Kobalte lists each value as its own row (`data-orientation='horizontal'` / `'vertical'`). Bits uses `defineEnumDataAttr` with `options: ["open", "closed"]` and description "The state of the dialog." Zag gives the union as the description: `"data-state":"\"open\" | \"closed\""`.
- Part-identity attributes: Corvu "Present on every dialog content element."; Bits "Present on the content.", "Present on the trigger element." These carry no information beyond the name, but they tell the reader the hook exists.

CSS-variable wording:

- Bits: "The nesting depth of the dialog (0 for root dialogs, 1 for first nested, etc.)." and "The number of currently open nested dialogs within this dialog. Updates reactively as nested dialogs open and close." (`BA/dialog.api.ts`). These are good because they give the value range and the update behavior.
- Zag (Ark): "The width of the reference element", "The available height in viewport", "The transform origin for animations" (`Z/css-vars.json`, popover). They're fine but minimal.
- Kobalte puts CSS variables inside prop descriptions: "Whether the popover should have the same width as the anchor element. This will be exposed to CSS as `--kb-popper-anchor-width`."

Render props and context (the Solid-relevant part):

- Kobalte types each field as an accessor: "`Accessor<boolean>` <br/> Whether the checkbox is checked or not." And for `children`: "`JSX.Element \| (state: CheckboxState) => JSX.Element` <br/> The children of the checkbox. Can be a `JSX.Element` or a _render prop_ for having access to the internal state." (`checkbox.mdx`)
- Corvu documents a separate type per children callback: "Props that are passed to the Root component children callback." with fields like "Change the open state of the dialog." for `setOpen: Setter<boolean>` and "Whether the dialog content is present. This differes from `open` as it tracks pending animations." (`CP/dialog/src/Root.tsx`)

---

## 5. Examples and usage

### Headings

Kobalte usage H3s are short noun phrases naming the prop or scenario: "Default open", "Controlled open", "Default value", "Controlled value", "Default checked", "Controlled checked", "With custom anchor", "Origin-aware animations", "Focusable content", "Dynamic tabs", "Activation mode", "Orientation", "Disabled", "Description", "Error message", "HTML forms", "Using object as options", "Virtual scrolling", "Allow expanding multiple items", "Animating content size". Slider breaks sentence case: "Multiple Thumbs", "Modify step size", "Custom Value Label", "Controlled Value".

Ark example H3s use Title Case and are very short: "Controlled", "Root Provider", "Lazy Mount", "Initial Focus", "Non-Modal", "Inside Scroll", "Open from Menu", "Multiple Triggers", "Thumb Overlap", "Thumb Collision". The Guides H3s read more like tasks: "Close Behavior", "Conditional Rendering", "Z-Index Stacking", "Router Integration", "Available Size".

Bits uses H2 per feature ("Open on Hover", "Custom Anchor", "Scroll Lock", "Value Commit", "Auto Sort", "RTL Support", "Panel Focus") plus the fixed pair "Managing X State", then "Two-Way Binding" and "Fully Controlled".

Corvu uses a few H3s with plain names: "Scrolling", "Nested dialogs", "Persistent content", "Animation".

### How much prose surrounds code

Kobalte and Ark hold to one or two sentences, then the example. The sentence names the prop and says what it changes:

> An initial, uncontrolled open value can be provided using the `defaultOpen` prop. (Kobalte `dialog.mdx`)

> The `open` prop can be used to make the open state controlled. The `onOpenChange` event is fired when the user presses the trigger, close button or overlay, and receives the new value. (Kobalte `dialog.mdx`)

> Use `initialFocusEl` to control which element receives focus when the dialog opens. (Ark `dialog.mdx`)

> Use `finalFocusEl` to control which element receives focus when the dialog closes. Defaults to the trigger element. (Ark `dialog.mdx`)

> Use `modal={false}` to allow interaction with elements outside the dialog. Disables focus trapping and scroll prevention. (Ark `dialog.mdx`)

Ark's "Use `prop` to ..." opener is the tightest pattern in the set. It is imperative, the prop comes second, and the effect comes third.

Kobalte's Controlled sentence is good because it names the events that fire the callback ("when the user presses the trigger, close button or overlay") and says the callback "receives the new value", which explains why `onOpenChange={setOpen}` works.

When behavior is non-obvious, Kobalte explains the default first, then the change:

> By default, pressing the arrow keys while focus is on a Tab will switch selection to the adjacent Tab in that direction, updating the content displayed accordingly.
> If you would like to prevent selection change from happening automatically you can set the `activationMode` prop to `manual`. This will prevent tab selection from changing on arrow key press, requiring a subsequent <kbd>Enter</kbd> or <kbd>Space</kbd> key press to confirm tab selection. (`tabs.mdx`)

> By default, tabs are horizontally oriented. The `orientation` prop can be set to `vertical` to change this. This affects keyboard navigation. You are responsible for styling your tabs accordingly. (`tabs.mdx`)

"You are responsible for styling your tabs accordingly" is the kind of headless-specific caveat that Xenon needs everywhere a prop changes behavior but not looks.

Kobalte also invites the reader to test: "Try navigating from the tabs to each content using the keyboard." (`tabs.mdx`, Focusable content).

Bits puts the most prose around code, and a lot of it is filler (see section 9). Its good paragraphs are specific:

> When opened via hover, the popover will automatically close when the mouse leaves both the trigger and the content, unless the user has interacted with the content (clicked or focused an element inside). A "grace area" polygon allows smooth cursor movement between the trigger and content without closing. (`B/components/popover.md`)

> `Tabs.Content` defaults to `tabindex="0"`, so keyboard users can focus the panel. Keep this default when the panel has no focusable elements or its first meaningful content is not focusable, even if a button or link appears later. (`B/components/tabs.md`)

> Since there is a near endless number of possible values that a user can select, the slider does not render a hidden input element by default. You'll need to determine how you want to submit the value(s) of the slider with a form. (`B/components/slider.md`)

Bits also uses "Behavior Notes" bullets with bold lead-ins for edge cases, which works well:

> - **Keyboard**: `openOnHover` does not open on keyboard focus. Keyboard users can still press Enter or Space to open.
> - **Touch devices**: Touch events are ignored for hover functionality to prevent conflicts with tap-to-open behavior.

### Controlled vs uncontrolled

Kobalte gives every stateful page a "Default X" / "Controlled X" pair using `createSignal`:

```tsx
const [open, setOpen] = createSignal(false);
return (
	<Dialog open={open()} onOpenChange={setOpen}>
```

It highlights the relevant lines (`{4,7}`) and never explains signals, since it assumes Solid fluency.

Corvu explains the concept once, in a guide (`C/state.mdx`), not per page:

> By default, all corvu primitives manage their state internally. This means that they handle their state themselves and you don't need to pass any props/state to them.

> The easiest way to control a primitive's state is by passing your own defined state to its `Root` component. Most of the time, this consists of a getter and setter property like in this example

Ark has a fixed "Controlled" example per page with a template sentence ("Use the `checked` and `onCheckedChange` props to programatically control the checkbox's state."). Solid users see that the callback takes a details object, so the setter can't be passed directly: `onCheckedChange={(e) => setChecked(e.checked)}` (`/tmp/docs-src/ark/packages/solid/src/components/checkbox/examples/controlled.tsx`). The docs never say this in prose.

Bits builds on Svelte's `bind:`. "Two-Way Binding" is `bind:open={isOpen}`, and "Fully Controlled" uses a function binding `bind:open={getOpen, setOpen}`. The guide `B/state-management.md` gives the reason:

> When the component wants to set the value from an internal action, it will invoke the setter, where you can determine if the setter actually updates the state or not.

That sentence is the clearest statement in any of the four of what "controlled" means operationally. Xenon can adapt it for Solid's `value` + `onValueChange` pair.

---

## 6. Accessibility and keyboard sections

### Table shape

All four that have tables use two columns, **Key** and **Description** (Corvu's component calls the second one `behavior`). Kobalte wraps keys in `<kbd>` and joins chords with `<kbd>Shift</kbd> + <kbd>Tab</kbd>`. Zag groups keys that do the same thing into one row (`"keys":["Enter","Space"]`). Kobalte repeats the row instead.

### Key description wording

Descriptions are present-tense verb phrases with the subject dropped. When the effect depends on focus, the row opens with a condition clause:

- "When focus is on the trigger, opens/closes the dialog." (Kobalte `dialog.mdx`, Space)
- "Closes the dialog and moves focus to the trigger." (Kobalte `dialog.mdx`, Esc)
- "Moves focus to the next trigger in horizontal orientation and activates its associated content." (Kobalte `tabs.mdx`, ArrowRight; Zag uses the identical string)
- "In manual mode, when a trigger is focused, moves focus to its associated content." (Kobalte `tabs.mdx`, Enter)
- "Increases the value of the focused thumb by a larger `step`." (Kobalte `slider.mdx`, PageUp)
- "Sets the value of the first thumb to the minimum value." (Kobalte `slider.mdx`, Home)
- "When focus is on the trigger, opens the select and focuses the first or selected item. <br/> When focus is on an item, selects the focused item." (Kobalte `select.mdx`, Space)
- "In `Select`, selects contiguous items from the most recently selected item to the focused item." (Kobalte `select.mdx`, Shift+Space; "In `Select`" is left over from a shared listbox table)
- "Toggles the checkbox on and off." (Kobalte `checkbox.mdx`)
- "Moves focus to the next focusable element within the content. Focus is trapped within the dialog." (Zag `dialog`, Tab)
- "When focus is on trigger, selects the item whose label starts with the typed character." (Zag `select`, A-Z)
- "When the trigger of an item is focused and orientation is 'vertical' (default), moves to the next trigger." (Corvu `accordion.mdx`, ArrowDown)

The pattern worth keeping is **[condition,] verb + object [+ side effect on focus]**. Multi-context keys use a `<br/>` between contexts.

### Surrounding prose

- Kobalte has no prose at all. The heading is `## Accessibility` then `### Keyboard Interactions`, then the table. The WAI-ARIA pattern link lives in frontmatter badges and the Features list ("Follows the WAI-ARIA Dialog design pattern.").
- Ark has one sentence: "Complies with the [Dialog WAI-ARIA design pattern](...)." Accordion reads "This component complies with the...".
- Corvu has one sentence ("Adheres to the Dialog WAI-ARIA design pattern and Alert Dialog WAI-ARIA design pattern.") and sometimes one real guidance subsection, which is the best accessibility prose in the set:

> ### Ensuring items are accessible
> Based on the Accordion WAI-ARIA design pattern, every accordion item trigger should include a meaningful title text and should be wrapped in a heading element like this: [code] If you don't want to use a heading element for some reason, you can instead use the `aria-level` attribute to define the hierarchical level: [code]
(`C/primitives/accordion.mdx`)

That tells the consumer what *they* must do, which matters more in a headless library than a restatement of what the library does.

- Bits mostly skips keyboard tables. Where it has accessibility prose, it slides into marketing: "The `RatingGroup` component implements comprehensive accessibility features following WAI-ARIA best practices for rating interfaces." and "The component handles focus intelligently:" (`B/components/rating-group.md`). Its one good move is explaining a deliberate deviation from the expected pattern: "The component uses the **slider pattern** rather than a radiogroup pattern, which provides better screen reader support for rating interfaces".

---

## 7. Guides

### Openings

Guides open with one declarative sentence stating the library's position, then go straight to a heading:

- "Kobalte components are unstyled, allowing you to completely customize the look and feel. Bring your preferred styling solution (vanilla CSS, Tailwind, CSS-in-JS libraries, etc...)." (`K/(0)overview/(2)styling.mdx`)
- "Kobalte components that render a DOM element support polymorphism via the `as` prop. This allows you to change the rendered element or component while preserving behavior, accessibility, and state management." (`K/(0)overview/(4)polymorphism.mdx`)
- "corvu leaves the styling up to you." (`C/styling.mdx`, the shortest and best)
- "All primitive components that render a DOM element are dynamic, which means that you can modify the element or the component they should render as." (`C/dynamic-components.mdx`)
- "By default, all corvu primitives manage their state internally." (`C/state.mdx`)
- "Need to access a component's state? You have three options:" followed by a when-to-use table (`A/guides/component-state.mdx`)
- "We ship almost zero styles with Bits UI by design, giving you complete flexibility when styling your components." (`B/styling.md`)
- "The `child` snippet is a powerful feature that gives you complete control over the rendered elements in Bits UI components, allowing for customization while maintaining accessibility and functionality." (`B/child-snippet.md`, filler opener)
- "State management is a critical aspect of modern UI development." (`B/state-management.md`, filler opener)

Ark's component-state opener is the most useful shape. It asks the reader's question and answers it with a decision table:

```
| Approach                        | When to use it                                |
| `Component.Context`             | Quick inline access via render props          |
| `use*Context` hooks             | Build custom child components that read state |
| `useComponent` + `RootProvider` | Control the component from outside            |
```

### How a concept gets explained

Kobalte's styling guide runs: one concept per H2 ("Styling a component part", "Styling a state"), one sentence, one code block. It uses a concrete list of states on one part:

> When a component or its parts can have multiple states, we automatically attach `data-*` attributes that represents the specific state. For example, a popover's trigger can have:
> - `data-expanded` — When the popover is expanded.
> - `data-disabled` — When the popover is disabled.

Kobalte's polymorphism guide gives rules as a short bullet list plus a consequence line. It is the model for any "you must do X" contract:

> When using an `as` callback:
> - Always spread the provided props
> - Custom props are forwarded **unchanged**
> - Kobalte options are **not** passed
> - Event handlers must be defined on the **parent**
>
> Violating these rules can break behavior or accessibility.

It follows with "In this example:" bullets that map code to outcome ("`value="one"` is used by Kobalte and not passed to `MyCustomButton`"). It also documents event order in one sentence: "Custom event handlers defined on a Kobalte component are called _before_ Kobalte's internal handlers."

Corvu's dynamic-components guide starts from "you probably don't need this" before showing the feature:

> In most cases, you shouldn't need to change the DOM element that the primitive component renders. corvu has sensible defaults for all components. But there are cases where it makes sense to change them. An example would be the `Tooltip` trigger which renders as a `button` element. You may want to render a tooltip on a link (`a` tag) instead.

Kobalte, Corvu and Ark all explain the four-type split for wrapper authors, in nearly the same words:

- Kobalte: `ComponentOptions` ("Custom props consumed internally by Kobalte. Not valid HTML. Not forwarded to the DOM"), `ComponentCommonProps<T>`, `ComponentRenderProps` ("These props must not be modified. Changing them will break behavior and accessibility."), `ComponentProps<T>`
- Corvu: `CorvuProps`, `SharedElementProps<T>` ("all props that get defined by corvu on the rendered element **but** can be overridden by the user"), `ElementProps`, `Props<T>`

Both fence this off for a specific reader. Kobalte adds a callout, ":::warning This section is intended for **library authors** building on top of Kobalte. :::". Corvu writes "This allows library developers or users who want to create their own components based on corvu's primitives to have a great developer experience."

Bits' child-snippet guide has a good skeleton (When to Use It / Basic Usage / How It Works / Behind the Scenes / Common Pitfalls / Related Resources). The "Behind the Scenes" block shows the component's own implementation in ten lines, which makes the prop merge concrete. "Common Pitfalls" is a strong closing pattern:

> - **Missing props spread**: Always include `{...props}` on your custom element
> - **Direct children**: When using child, other children outside the snippet are ignored

### Length

Kobalte styling is about 200 lines, mostly code. Polymorphism is about 230. Corvu guides run 99 to 133 lines. Ark composition is 90 lines, styling 280. Bits styling is 408, child-snippet 240, state-management 68. Across all four, prose paragraphs rarely pass three sentences, and code does most of the explaining.

---

## 8. Voice

**Person.** All four address the reader as "you" and use "we" for the library ("We expose a CSS custom property `--kb-popover-content-transform-origin`" in Kobalte popover; "We ship almost zero styles" in Bits). Corvu also refers to itself by name in lowercase, as a third-person actor: "corvu is aware of nested dialogs and only dismisses the top-most dialog". Ark does the same: "Ark exposes Zag's `--layer-index` variable".

**Sentence length.** Component-page prose averages one or two sentences of 12 to 25 words per example. API descriptions are fragments without a final period in Ark and Zag, and full sentences with periods in Kobalte and Bits. Nobody is consistent about trailing periods.

**Hedging.** There is little hedging on component pages. Where it shows up, it hides a real constraint:

- "Components follow the WAI-ARIA Authoring Practices whenever possible." (Kobalte intro)
- "corvu allows you to customize almost every aspect of all primitives" (Corvu intro)
- "Most components ship completely unstyled, with the exception of those required for core functionality." (Bits intro. Good, because it names the exception.)
- "Passing multiple children may cause rendering issues." (Ark composition. Vague about which issues.)

**Marketing words.** Kobalte component pages have none. The rest have some:

- Corvu: "Accessible, customizable and ready to use in your project!", "aim to be highly customizable while providing a delightful developer experience", "It uses the awesome Floating UI library", "Give it a try! 🐦‍⬛", "Feel free to nest dialogs however you want."
- Ark: "Panda CSS is a best-in-class CSS-in-JS framework that integrates seamlessly with Ark UI", "The checkbox integrates smoothly with the `Field` component"
- Bits: "powerful feature", "comprehensive set of Dialog components", "seamless state synchronization", "robust, accessible, and flexible alternative", "handles focus intelligently", "makes your users happy", "Accessibility isn't just an afterthought - it's baked in"

**Callouts and their frequency.**

- Kobalte: 5 callouts across 46 component pages. They are short and factual: ":::info The `value` and `defaultValue` props always take a `string[]`. :::" (accordion); ":::note Notice the usage of generics on `Select` for proper TypeScript support. :::" (select).
- Ark: blockquotes on 19 of 52 component pages. They are usually one line: "> If you need to use the `asChild` property, make sure that the `label` element is the direct child of the `Checkbox.Root` component."; "> Don't forget to change the styles of the vertical slider by specifying its height". The style guide prescribes "> Note: ..." blockquotes. The styling guide uses "> **Tip:**", "> **Important:**" and "**Caution:**" inconsistently.
- Corvu: one emoji callout: "> ❗ To ensure functionality and accessibility, your component needs to spread the received props onto your element. Otherwise, corvu can't define props on the element and things will break." It's blunt and useful ("things will break").
- Bits: 22 callouts across 41 component pages, and the title often doesn't match the type. "Heads up!" appears 8 times as a tip and once as a warning. `type="warning"` shows up with titles "Note", "Note!", "Important", "Leap Years!" and "A note about mobile devices!". Dialog has three on one page.

**Caveats done well.** A good caveat states the consequence, not just the rule:

- "Violating these rules can break behavior or accessibility." (Kobalte)
- "Unmounting `Dialog.Root` when toggling open state can break focus, scroll lock, and cleanup. Keep the root mounted and control it with `open` / `onOpenChange`." (Ark `dialog.mdx`)
- "This produces values like `0`, `1`, and `2`, which can appear below headers, sidebars, or other app chrome." (Ark styling, explaining why not to use `--layer-index` alone)
- "Note that the props passed from the `Root` component include reactive getters. Make sure to access them in a reactive scope, like you would in any other Solid component." (Corvu `state.mdx`)

Ark's `// ❌ Avoid` / `// ✅ Prefer` paired code blocks in "Conditional Rendering" are the clearest way to show a trap.

---

## 9. Anti-patterns: what reads badly and what is copy-pasted

### Find-and-replace bugs (the strongest argument for generating shared text, or for not sharing it)

Every library ships at least one error caused by copying a sibling page and swapping nouns incompletely:

- Kobalte Tabs data attributes: "`data-orientation='horizontal'` | Present when the separator has horizontal orientation." (`K/(1)components/tabs.mdx`, copied from Separator)
- Kobalte Slider props: "`required` ... Whether the user must check a radio group item before the owning form can be submitted.", "`disabled` ... Whether the radio group is disabled.", "`readOnly` ... Whether the radio group items can be selected but not changed by the user." (`slider.mdx`, copied from Radio Group)
- Kobalte Slider data attribute: "data-required | Present when the user must slider an item before the owning form can be submitted." (a mechanical "select" → "slider" replace)
- Corvu Accordion keyboard: "End | When the trigger of an item is focused, moves to the first trigger." (`C/primitives/accordion.mdx`, copied from Home)
- Corvu Popover: "The initial placement of the tooltip can be configured with the `placement` property" (`C/primitives/popover.mdx`, copied from Tooltip)
- Corvu TSDoc: `dialogId` in `DialogRootChildrenProps` is described as "The `id` attribute of the dialog description element." (`CP/dialog/src/Root.tsx`)
- Bits Slider: "`disabled` ... Whether or not the switch is disabled." (`BA/slider.api.ts`)
- Bits Select Architecture: "**Root**: The main container component that manages the state and context for the combobox." and "**Arrow**: An arrow element that points to the trigger when using the `Combobox.Content` component." (`B/components/select.md`)
- Bits Progress: "It's recommended to use the `Progress` primitive to create your own custom meter component" (`B/components/progress.md`, copied from Meter)
- Bits Select and Combobox share an identical frontmatter description.
- Ark Popover prose names a prop that doesn't exist: "pass the `closeOnEsc` prop and set it to `false`". The real prop is `closeOnEscape` (`AT/popover.types.json`).

### Generated text that says nothing

Zag's data-attribute strings are machine-built from part names and leak into Ark's docs as-is (`Z/data-attr.json`):

- "data-orientation": "The orientation of the draggingindicator"
- "data-orientation": "The orientation of the markergroup"
- "data-orientation": "The orientation of the valuetext"
- "data-name": "" and "data-state": "" (empty descriptions on Slider Thumb and Marker)
- Dialog Trigger "data-value": "The value of the item" (a dialog trigger is not an item)
- Popover Positioner "--reference-height": "The height of the root"

Tautological props that restate the name (Ark, `AT/*.json`):

- `lazyMount`: "Whether to enable lazy mounting"
- `unmountOnExit`: "Whether to unmount on exit."
- `composite` (tabs): "Whether the tab is composite"
- `present`: "Whether the node is present (controlled by the user)"
- `id`: "The unique identifier of the machine." (leaks Zag's state-machine internals to users who never see a machine)
- `translations`: "Specifies the localized strings that identifies the accessibility elements and their states"

Kobalte's part-identity descriptions are circular: "**Button:** The root container for a button." and "**Select.Item:** An item of the select."

### Boilerplate repeated across pages

- Bits: "This section covers how to manage the `value` state of the component." appears 12 times verbatim, plus 7 for `open` and about 20 noun-swapped variants across 30 pages. It is a sentence that restates its own heading.
- Bits "Overview" openers follow one template, "The X component in Bits UI provides a flexible and accessible way to create X in your Svelte applications." (Dialog and Checkbox are word-for-word except the noun.) Others: "The Accordion component is a versatile UI element designed to organize content into collapsible sections, helping users focus on specific information without being overwhelmed by visual clutter."
- Bits "Key Features" bullets repeat "**Accessibility**: Built with WAI-ARIA guidelines in mind" and "**Customizable**" on every long-form page. These are properties of the library, not the component.
- Ark: "An alternative way to control the X is to use the `RootProvider` component and the `useX` hook. This way you can access the state and methods from outside the component." appears on every stateful page. The idea is fine, but one guide plus a link would do.
- Kobalte: "Used to force mounting when more control is needed. Useful when controlling animation with SolidJS animation libraries." on every `forceMount`. The positioning prop table (placement, gutter, shift, flip, slide, overlap, sameWidth, fitViewport, hideWhenDetached, detachedPadding, arrowPadding, overflowPadding) is pasted wholesale into Popover, Select, Combobox, Tooltip and more. The same goes for the 6-row dismissable-layer event table on every overlay Content.
- Corvu: SEO descriptions "A customizable, unstyled and accessible X component for SolidJS" on every page.
- "Can be controlled or uncontrolled." as a Features bullet on nearly every Kobalte page. It's true of every stateful component and says nothing about this one.

### Framework leakage on multi-framework docs

Ark's shared MDX serves React code to Solid readers:

- The composition guide's ID example imports `useId` from `'react'` (`A/guides/composition.mdx`).
- Dialog "Dynamic Imports" uses `React.lazy`, `Suspense` and `next/dynamic` (`A/components/dialog.mdx`).
- Tabs "Router Integration" uses Remix, with an `@ark-ui/<framework>/tabs` placeholder import.
- Styling says "utilize the `class` or `className` prop" to everyone.
- Slider says "set the orientation property in the machine's context to vertical", which is Zag vocabulary a Solid user never touches.
- The Solid `asChild` signature is `asChild={(props) => <button {...props()} />}`, where `props` is an **accessor**. The composition guide never says so. It explains `asChild` only in React terms ("lets you integrate custom components").
- Solid context is also an accessor (`<Dialog.Context>{(dialog) => ... dialog().open ...}`), and the docs are silent on this too.

This is the main lesson from Ark for a Solid-only library. Xenon never needs to hedge between frameworks, so it should name Solid concepts (signals, accessors, `splitProps`, reactive scope) where they matter.

### Other things that read badly

- Grammar slips that stay uncorrected because every page copies the one before: "Present when the dialog is close." (Kobalte, all overlay triggers); "shares the same data-attributes" / "share the same data-attributes" (mixed); "Kobalte handle accessibility" (intro); "provides a you with" (Corvu popover); "differes" (Corvu TSDoc); "programatically" (Ark checkbox).
- Title Case headings that clash with sentence-case siblings (Kobalte Slider's "Multiple Thumbs", "Custom Value Label" beside "Modify step size"; Ark throughout; Kobalte's own "Keyboard Interactions" and "API Reference").
- Mixed "Whether" and "Whether or not" in the same table (Bits).
- Emoji in docs prose (Corvu's "Give it a try! 🐦‍⬛", "❗"; Ark's "❌/✅", which at least carry meaning).
- Callout titles that don't match their type or content (Bits' "Heads up!" used 9 times as both tip and warning; "Leap Years!").
- Descriptions that rely on the component's own name ("A popover positioned relative to an anchor element.").
- Filler openers: "State management is a critical aspect of modern UI development." (Bits); "Proper focus management is crucial for accessibility and user experience in modal dialogs." (Bits dialog).
- Features lists that restate the API ("Supports horizontal/vertical orientation.", "Support for disabled tabs.") without saying anything the prop table doesn't.

---

## Solid-specific notes for Xenon

Collected here because they're scattered through the sections above:

- **Controlled pair.** Kobalte and Corvu callbacks receive the raw value, so `onOpenChange={setOpen}` works and the docs lean on that. Ark callbacks receive a details object (`(e) => setChecked(e.checked)`) and never explain the difference. Whatever Xenon's callback shape is, say it once in the prop description ("receives the new value") and show the setter wiring in the Controlled example.
- **Naming the initial prop.** Kobalte and Ark use `defaultOpen` / `defaultValue`, and Corvu uses `initialOpen`. Corvu's name matches Solid's `createSignal(initialValue)` wording, but `default*` is what readers coming from Radix expect.
- **Accessors in tables.** Kobalte types render-prop fields as `Accessor<boolean>` right in the table. Corvu instead warns in prose that children-callback props "include reactive getters. Make sure to access them in a reactive scope". Pick one and apply it everywhere. Stating the accessor type in the table is the more precise of the two.
- **Polymorphism wording.** Kobalte calls it "polymorphism via the `as` prop" and Corvu calls it "Dynamic Components" (also `as`). Ark uses `asChild` with a render function. Kobalte's four-rule list for `as` callbacks ("Always spread the provided props / Custom props are forwarded unchanged / Kobalte options are not passed / Event handlers must be defined on the parent") plus the event-order sentence is the clearest contract in the set.
- **Wrapper types.** Kobalte and Corvu both document a four-way type split (Options / CommonProps / RenderProps / Props versus CorvuProps / SharedElementProps / ElementProps / Props) and fence it as library-author material. If Xenon has equivalent types, give them the same fence.
- **Context.** Corvu's `Dialog.useContext()` returns accessors (`open()`), and its `contextId` "Keyed context" section is a Solid-specific answer to nested same-type primitives that nobody else documents.
- **`splitProps`.** Kobalte and Corvu both show `splitProps` in wrapper examples without explaining it, since they assume Solid fluency. Kobalte adds the reason in a callout: "When using generics, TypeScript can lose some precision; splitting local props and spreading the remaining props helps preserve usability."
