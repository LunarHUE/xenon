# How Radix Primitives and Base UI write component docs

Source material for the Xenon docs style guide. Everything here comes from the MDX source, not rendered pages.

Clones (shallow, taken 2026-09-27):

- Radix: `/tmp/docs-src/radix-website`, docs under `data/primitives/docs/{overview,guides,components,utilities}/*.mdx`
- Base UI: `/tmp/docs-src/base-ui`, docs under `docs/src/app/(docs)/react/{overview,handbook,components,utils}/**/page.mdx`. API tables live in generated `types.md` files next to each page. Their text comes from JSDoc in `packages/react/src/**`.
- MUI's shared Vale rules: `/tmp/docs-src/mui-public/packages/code-infra/vale/styles/MUI/*.yml` (sparse clone)

Short paths below are relative to those roots. `R:` means Radix and `B:` means Base UI.

## 0. The short version

These are two different philosophies.

**Radix** writes every component page from one template. It opens with a description, a demo, a feature list, anatomy, and a hand-written API table per part (props, then data attributes, then CSS variables). Then come short examples and an Accessibility section with a WAI-ARIA link and a keyboard table. Prose is minimal and very repetitive on purpose: the same sentence patterns appear on every page.

**Base UI** drops the feature list, the keyboard table and the WAI-ARIA link. It puts "Usage guidelines" (do/don't bullets) at the top and moves API reference to the bottom. That reference is generated from JSDoc. Examples get far more prose, and much of it explains *why*. There is a Vale linter with "no we", "no will" and "no Latin abbreviations" rules.

For a Solid 2 headless library, the most useful hybrid is probably Base UI's structure and JSDoc-driven reference, Radix's keyboard table and WAI-ARIA link, and Base UI's "Renders a `<x>` element." sentence on every part.

---

## 1. Page structure

### Radix component page

Every component page in `R:data/primitives/docs/components/` follows this order. The MDX components are named in parentheses.

1. `# Name`
2. `<Description>` one-liner (also duplicated in frontmatter `metaDescription`)
3. `<HeroContainer><XDemo /></HeroContainer>` + `<HeroCodeBlock folder="X" />` (live demo, code tab)
4. `<Highlights features={[...]}/>`, a bullet list of 3 to 11 feature fragments
5. `## Anatomy`, always introduced by the same sentence: "Import all parts and piece them together."
6. `## API Reference` → `### PartName` per part, each with a one-line description, `<PropsTable>`, `<DataAttributesTable>` (if any) and `<CssVariablesTable>` (if any)
7. `## Examples` → `### Task-shaped title` (optional; nearly every page has it)
8. `## Accessibility`: one line "Adheres to the [X WAI-ARIA design pattern](...)", then `### Keyboard Interactions` with `<KeyboardTable>`
9. `## Custom APIs` (optional; Dialog, Popover, Select, Slider). "Create your own API by abstracting the primitive parts into your own component." then `#### Usage` and `#### Implementation`
10. `## Caveats` (rare; only Slider in my sample)

Frontmatter carries the pattern URL, which the site renders as a badge/link:

```yaml
# R:data/primitives/docs/components/dialog.mdx
metaTitle: Dialog
metaDescription: A window overlaid on either the primary window or another dialog window, rendering the content underneath inert.
name: dialog
aria: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal
```

Heading inventory from the sample (`grep '^##'`):

```
accordion: Anatomy, API Reference, Examples, Accessibility
checkbox:  Anatomy, API Reference, Examples, Accessibility
popover:   Anatomy, API Reference, Examples, Accessibility, Custom APIs
select:    Anatomy, API Reference, Examples, Accessibility (Keyboard Interactions, Labelling), Custom APIs
slider:    Anatomy, API Reference, Examples, Accessibility, Custom APIs, Caveats
tabs:      Anatomy, API Reference, Examples, Accessibility
```

Always present: description, hero demo, highlights, Anatomy, API Reference, Accessibility with keyboard table (on interactive components). Optional: Examples, Custom APIs, Caveats, extra accessibility subsections such as "Labelling".

### Base UI component page

Order in `B:components/*/page.mdx`:

1. `# Name`
2. `<Subtitle>` one-liner + `<Meta name="description">` (a separate, SEO-padded version; see section 9)
3. `<DemoXHero />` (live demo with CSS Modules / Tailwind variants)
4. `## Usage guidelines`: bold-label bullets (optional, on 17 of 37 pages)
5. `## Anatomy`, always "Import the component and assemble its parts:"
6. Optional concept sections placed *before* Examples when they change how the component behaves: Select `## Positioning`, Tooltip `## Alternatives to tooltips`, Combobox `## Item values`, Toast `## General usage`, `## Global manager`, `## Stacking and animations`
7. `## Examples` → `### Task title`
8. `## API reference` → `### Part` → generated `<TypesX.Part />`
9. Extra API sections for non-component exports: `## createHandle`, `## useFilter`, `## Additional types`

Full inventory (`B:components/*/page.mdx`, `grep '^## '`):

```
accordion:  Anatomy|Examples|API reference
button:     Usage guidelines|Anatomy|Examples|API reference
checkbox:   Usage guidelines|Anatomy|Examples|API reference
dialog:     Usage guidelines|Anatomy|Examples|API reference|createHandle
popover:    Anatomy|Examples|API reference|createHandle
select:     Usage guidelines|Anatomy|Positioning|Examples|API reference
slider:     Usage guidelines|Anatomy|Examples|API reference
tabs:       Anatomy|Examples|API reference
tooltip:    Usage guidelines|Anatomy|Alternatives to tooltips|Examples|API reference|createHandle
field, fieldset, meter, progress, separator, toggle, menubar: Anatomy|API reference   (no examples at all)
```

Always present: subtitle, hero demo, Anatomy, API reference. Everything else is optional.

What Base UI has **no** section for: features/highlights, installation (it lives once, in Quick start), accessibility, keyboard interactions. `grep -rn 'w3.org' components/*/page.mdx` finds one hit across all 37 component pages, and that one is an accname link inside Button's loading-state example. No component page links its APG pattern.

### Takeaways

- Radix answers "what keys do what?" on every page. Base UI answers "how should I use this correctly?" (usage guidelines, labeling examples). Xenon can do both.
- Base UI's API-at-the-bottom order suits readers who arrive to learn. Radix's API-in-the-middle suits readers who arrive to look something up; its examples sit below a 300-line reference and are easy to miss.
- Base UI's labeling examples ("Labeling a checkbox", "Labeling a select", "Labeling a slider") do the job an accessibility section would do, but inside examples.

---

## 2. The one-line description

### Radix: noun-phrase definitions, dictionary style

Most are fragments beginning "A/An [noun]" (a definition of the UI *pattern*, not the library's component). A second group uses a third-person verb with an implied subject: "Displays…", "Renders…", "Augments…". Median length is about 12 words. They end with a period.

Verbatim (`R:components/*.mdx`, `metaDescription` / `<Description>`):

1. Accordion: "A vertically stacked set of interactive headings that each reveal an associated section of content."
2. Alert Dialog: "A modal dialog that interrupts the user with important content and expects a response."
3. Checkbox: "A control that allows the user to toggle between checked and not checked."
4. Dialog: "A window overlaid on either the primary window or another dialog window, rendering the content underneath inert."
5. Popover: "Displays rich content in a portal, triggered by a button."
6. Select: "Displays a list of options for the user to pick from—triggered by a button."
7. Slider: "An input where the user selects a value from within a given range."
8. Tabs: "A set of layered sections of content—known as tab panels—that are displayed one at a time."
9. Toggle: "A two-state button that can be either on or off."
10. Tooltip: "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it."
11. Radio Group: "A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time."
12. Scroll Area: "Augments native scroll functionality for custom, cross-browser styling."
13. Separator: "Visually or semantically separates content."
14. Hover Card: "For sighted users to preview content available behind a link."
15. Toast: "A succinct message that is displayed temporarily."
16. Form: "Collect information from your users using validation rules." (imperative; the odd one out)

Several are lifted nearly word for word from the WAI-ARIA APG pattern definitions. The APG's own accordion text is "A vertically stacked set of interactive headings that each contain a title, content snippet, or thumbnail representing a section of content." Tabs, Radio Group and Tooltip also track the APG. That is why they read as definitions of the pattern.

Inconsistencies: Checkbox and Switch share the exact same sentence ("A control that allows the user to toggle between checked and not checked."). Newer pages drop the final period: One-time password field "A group of single-character text inputs to handle one-time password verification". Menubar has no `metaDescription`.

### Base UI: shorter, more concrete

Median about 9 words. Always a fragment. Mostly "A/An [noun] [that/for/with]…", with a few "Provides…"/"Generates…"/"Displays…". They describe the thing on screen or what it is for, rather than the formal pattern.

Verbatim (`<Subtitle>` in `B:components/*/page.mdx`):

1. Accordion: "A set of collapsible panels with headings."
2. Dialog: "A popup that opens on top of the entire page."
3. Alert Dialog: "A dialog that requires a user response to proceed."
4. Popover: "An accessible popup anchored to a button."
5. Tabs: "A component for toggling between related panels on the same page."
6. Select: "A common form component for choosing a predefined value in a dropdown menu."
7. Collapsible: "A collapsible panel controlled by a button."
8. Drawer: "A panel that slides in from the edge of the screen."
9. Switch: "A control that indicates whether a setting is on or off."
10. Menu: "A list of actions in a dropdown, enhanced with keyboard navigation."
11. Context Menu: "A menu that appears at the pointer on right click or long press."
12. Tooltip: "A popup that appears when an element is hovered or focused, showing a hint for sighted users."
13. Preview Card: "A link that shows a destination preview without interrupting keyboard or screen reader navigation."
14. Button: "A button component that can be rendered as another tag or focusable when disabled."
15. Scroll Area: "A native scroll container with custom scrollbars."
16. Progress: "Displays the status of a task that takes a long time."
17. Radio Group: "Provides shared state to a series of radio buttons."
18. Toast: "Generates toast notifications."
19. Number Field: "A numeric input element with increment and decrement buttons, and a scrub area."

Weak ones (see section 9): Checkbox "An easily stylable checkbox component.", Slider "An easily stylable range input.", Avatar "An easily stylable avatar component." These say nothing about behavior and could describe any unstyled library.

### Pattern worth copying

A fragment that starts "A/An [concrete noun]" and adds one distinguishing fact (what triggers it, where it sits, what it constrains). Base UI's Collapsible ("A collapsible panel controlled by a button.") and Drawer ("A panel that slides in from the edge of the screen.") show the right length and shape. Avoid "component" as the head noun and "easily stylable" as the distinguishing fact.

---

## 3. Anatomy

Both show anatomy as a JSX tree of empty, self-closing parts, nested exactly as they must be rendered. There is no diagram and no prose per node.

Radix (`R:components/dialog.mdx`), intro sentence then a complete importable module:

```jsx
import { Dialog } from "radix-ui";

export default () => (
	<Dialog.Root>
		<Dialog.Trigger />
		<Dialog.Portal>
			<Dialog.Overlay />
			<Dialog.Content>
				<Dialog.Title />
				<Dialog.Description />
				<Dialog.Close />
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
);
```

Base UI (`B:components/select/page.mdx`) has a titled code block (`title="Anatomy"`), just the tree (the import is stripped when rendered), and a blank line separating trigger and popup halves:

```jsx
<Select.Root>
  <Select.Label />
  <Select.Trigger>
    <Select.Value />
    <Select.Icon />
  </Select.Trigger>

  <Select.Portal>
    <Select.Backdrop />
    <Select.Positioner>
      <Select.Popup>
        ...
```

Details:

- Intro sentences never vary. Radix: "Import all parts and piece them together." Base UI: "Import the component and assemble its parts:" (colon, then code).
- Optional parts are included in the tree without marking them optional. Base UI's Popover tree includes `Backdrop`, `Arrow` and `Viewport`, and the fact that `Viewport` is optional is only stated later, under the API reference: "The `Viewport` is optional — reach for it only when a single popup is opened by multiple triggers…" (`B:components/popover/page.mdx`). Radix marks optionality in the part description instead: "An optional arrow element…", "An optional accessible description…".
- Base UI Button, a single-part component, still gets an Anatomy block: "Import the component:" then `<Button />;`.
- The anatomy tree is the de facto source of truth for part names and nesting. Both libraries keep it in sync with the API section order.

---

## 4. API reference

### Part descriptions

**Radix**: one sentence, sometimes followed by a usage note. Starts with "Contains…", "The button that…", "A/An…", "When used, …". Nothing states the rendered element.

- Dialog Root: "Contains all the parts of a dialog."
- Dialog Trigger: "The button that opens the dialog."
- Dialog Portal: "When used, portals your overlay and content parts into the `body`."
- Dialog Overlay: "A layer that covers the inert portion of the view when the dialog is open."
- Dialog Content: "Contains content to be rendered in the open dialog."
- Dialog Title: "An accessible title to be announced when the dialog is opened."
- Tabs List: "Contains the triggers that are aligned along the edge of the active content."
- Tabs Trigger: "The button that activates its associated content."
- Popover Content: "The component that pops out when the popover is open."
- Popover Arrow: "An optional arrow element to render alongside the popover. This can be used to help visually link the anchor with the `Popover.Content`. Must be rendered inside `Popover.Content`."
- Checkbox Root: "Contains all the parts of a checkbox. An `input` will also render when used within a `form` to ensure events propagate correctly."

**Base UI**: always two lines. Line 1 says what it is or does. Line 2 says what DOM it renders. This comes straight from the component's JSDoc (`B:packages/react/src/dialog/trigger/DialogTrigger.tsx`):

```ts
/**
 * A button that opens the dialog.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Dialog](https://base-ui.com/react/components/dialog)
 */
```

Examples from generated `types.md`:

- Dialog Root: "Groups all parts of the dialog. / Doesn't render its own HTML element."
- Accordion Header: "A heading that labels the corresponding panel. / Renders an `<h3>` element."
- Checkbox Root: "Represents the checkbox itself. / Renders a `<span>` element and a hidden `<input>` beside."
- Slider Thumb: "The draggable part of the slider at the tip of the indicator. / Renders a `<div>` element and a nested `<input type="range">`."
- Slider Value: "Displays the current value of the slider as text. / Renders an `<output>` element."
- Popover Positioner: "Positions the popover against the trigger. / Renders a `<div>` element."
- Popover Portal: "A portal element that moves the popup to a different part of the DOM. / By default, the portal element is appended to `<body>`. / Renders a `<div>` element."
- Select ScrollUpArrow: "An element that scrolls the select popup up when hovered. Does not render when using touch input. / Renders a `<div>` element."
- Tabs Indicator: "A visual indicator that can be styled to match the position of the currently active tab. / Renders a `<span>` element."
- Select GroupLabel: "An accessible label that is automatically associated with its parent group."

The "Renders a `<x>` element." line matters a lot for a headless library. Readers need it to write selectors and to know whether a `render`/`asChild` swap is safe. Radix never states it.

### Table shape

Radix uses three hand-written MDX components per part: `<PropsTable data={[{name, type, typeSimple, default, required, description}]}/>`, `<DataAttributesTable data={[{attribute, values}]}/>`, `<CssVariablesTable data={[{cssVariable, description}]}/>`.

Base UI generates markdown tables per part, with bold captions:

```
**Trigger Props:**
| Prop | Type | Default | Description |
**Trigger Data Attributes:**
| Attribute | Type | Description |
**Popup CSS Variables:**
| Variable | Type | Description |
```

Base UI also lists `Part.Props`, `Part.State` (as a TS type with doc comments per field) and change-event reason unions, e.g.:

```ts
type DialogTriggerState = {
  /** Whether the trigger is currently disabled. */
  disabled: boolean;
  /** Whether the dialog is currently open and was opened by this trigger. */
  open: boolean;
};
```

Defaults are a table column in both (`default: "true"` in Radix; `` `false` `` in Base UI, `-` when none). Neither restates the default in prose, except Radix's `position` prop on Select: "`item-aligned` is the default and…".

### Prop description wording

**Radix** conventions, by prop kind:

| Kind | Opening | Example |
| --- | --- | --- |
| Uncontrolled default | "The [state] of the [x] when it is initially rendered. Use when you do not need to control…" | `defaultOpen`: "The open state of the dialog when it is initially rendered. Use when you do not need to control its open state." |
| Controlled value | "The controlled [state] of the [x]. Must be used in conjunction with `onXChange`." | `open`: "The controlled open state of the dialog. Must be used in conjunction with <Code>onOpenChange</Code>." |
| Callback | "Event handler called when…" | `onOpenChange`: "Event handler called when the open state of the dialog changes." |
| Boolean flag | "When `true`, …" | `disabled`: "When <Code>true</Code>, prevents the user from interacting with the checkbox." |
| Enum/config | "The [noun] of…" | `orientation`: "The orientation of the component." |
| Dismissable-layer callbacks | "Event handler called when… It can be prevented by calling `event.preventDefault`." | `onEscapeKeyDown`: "Event handler called when the escape key is down. It can be prevented by calling <Code>event.preventDefault</Code>." |

Fifteen more verbatim Radix prop descriptions:

1. `asChild` (every part, identical): "Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details."
2. Dialog `modal`: "The modality of the dialog. When set to `true`, interaction with outside elements will be disabled and only dialog content will be visible to screen readers."
3. Dialog Portal `forceMount`: "Used to force mounting when more control is needed. Useful when controlling animation with React animation libraries. If used on this part, it will be inherited by `Dialog.Overlay` and `Dialog.Content`."
4. Portal `container`: "Specify a container element to portal the content into."
5. Content `onOpenAutoFocus`: "Event handler called when focus moves into the component after opening. It can be prevented by calling `event.preventDefault`."
6. Content `onInteractOutside`: "Event handler called when an interaction (pointer or focus event) happens outside the bounds of the component. It can be prevented by calling `event.preventDefault`."
7. Tabs `defaultValue`: "The value of the tab that should be active when initially rendered. Use when you do not need to control the state of the tabs."
8. Tabs `dir`: "The reading direction of the tabs. If omitted, inherits globally from `DirectionProvider` or assumes LTR (left-to-right) reading mode."
9. Tabs `activationMode`: "When `automatic`, tabs are activated when receiving focus. When `manual`, tabs are activated when clicked."
10. Tabs List `loop`: "When `true`, keyboard navigation will loop from last tab to first, and vice versa."
11. Tabs Trigger `value`: "A unique value that associates the trigger with a content."
12. Checkbox `required`: "When `true`, indicates that the user must check the checkbox before the owning form can be submitted."
13. Checkbox `name`: "The name of the checkbox. Submitted with its owning form as part of a name/value pair."
14. Popover `side`: "The preferred side of the anchor to render against when open. Will be reversed when collisions occur and `avoidCollisions` is enabled."
15. Popover `sideOffset`: "The distance in pixels from the anchor."
16. Popover `sticky`: "The sticky behavior on the align axis. `"partial"` will keep the content in the boundary as long as the trigger is at least partially in the boundary whilst `"always"` will keep the content in the boundary regardless."
17. Popover `hideWhenDetached`: "Whether to hide the content when the trigger becomes fully occluded."
18. Accordion `type`: "Determines whether one or multiple items can be opened at the same time."
19. Accordion `collapsible`: "When `type` is `"single"`, allows closing content when clicking trigger for an open item."
20. Slider `onValueCommit`: "Event handler called when the value changes at the end of an interaction. Useful when you only need to capture a final value e.g. to update a backend service."
21. Slider `inverted`: "Whether the slider is visually inverted."

**Base UI** conventions (from JSDoc):

| Kind | Opening | Example |
| --- | --- | --- |
| Boolean | "Whether…" (almost always) | `openOnHover`: "Whether the popover should also open when the trigger is hovered." |
| Uncontrolled default | "Whether the [x] is initially [state]. To render a controlled [x], use the `y` prop instead." | Checkbox `defaultChecked`: "Whether the checkbox is initially ticked. To render a controlled checkbox, use the `checked` prop instead." |
| Controlled | "Whether the [x] is currently [state]." / "The controlled value of…. To render an uncontrolled [x], use the `defaultValue` prop instead." | Accordion `value`: "The controlled value of the item(s) that should be expanded. To render an uncontrolled accordion, use the `defaultValue` prop instead." |
| Callback | "Event handler called when…" (same as Radix) | "Event handler called when the dialog is opened or closed." |
| Enum | "Determines…" or a noun phrase, then a bullet per value | `modal`: "Determines if the dialog enters a modal state when open." |
| Timing | "How long to wait before…. Specified in milliseconds. Requires the `x` prop." | Popover `delay` |
| Forms | "Identifies…" | `name`: "Identifies the field when a form is submitted." |

The controlled/uncontrolled pair always points at its twin. That cross-reference is the most reusable thing in either library.

Fifteen more verbatim Base UI prop descriptions (`B:components/*/types.md`):

1. Checkbox `disabled`: "Whether the component should ignore user interaction."
2. Checkbox `indeterminate`: "Whether the checkbox is in a mixed state: neither ticked, nor unticked."
3. Checkbox `readOnly`: "Whether the user should be unable to tick or untick the checkbox."
4. Checkbox `required`: "Whether the user must tick the checkbox before submitting a form."
5. Checkbox `uncheckedValue`: "The value submitted with the form when the checkbox is unchecked. By default, unchecked checkboxes do not submit any value, matching native checkbox behavior."
6. Checkbox `form`: "Identifies the form that owns the hidden input. Useful when the checkbox is rendered outside the form."
7. Checkbox `inputRef`: "A ref to access the hidden `<input>` element."
8. Accordion `multiple`: "Whether multiple items can be open at the same time."
9. Accordion Panel `keepMounted`: "Whether to keep the element in the DOM while the panel is closed. This prop is ignored when `hiddenUntilFound` is used."
10. Accordion `hiddenUntilFound`: "Allows the browser's built-in page search to find and expand the panel contents. Overrides the `keepMounted` prop and uses `hidden="until-found"` to hide the element without removing it from the DOM."
11. Dialog `disablePointerDismissal`: "Whether to prevent the dialog from closing on outside presses. For non-modal dialogs, this also prevents the dialog from closing when focus moves outside of it."
12. Dialog `onOpenChangeComplete`: "Event handler called after any animations complete when the dialog is opened or closed."
13. Trigger `nativeButton`: "Whether the component renders a native `<button>` element when replacing it via the `render` prop. Set to `false` if the rendered element is not a button (for example, `<div>`)."
14. `render` (every part): "Allows you to replace the component's HTML element with a different tag, or compose it with another component. Accepts a `ReactElement` or a function that returns the element to render."
15. `className` (every part): "CSS class applied to the element, or a function that returns a class based on the component's state."
16. Popover `arrowPadding`: "Minimum distance to maintain between the arrow and the edges of the popup. Use it to prevent the arrow element from hanging out of the rounded corners of a popup."
17. Popover `collisionPadding`: "Additional space to maintain from the edge of the collision boundary."
18. Popover `closeDelay`: "How long to wait before closing the popover that was opened on hover. Specified in milliseconds. Requires the `openOnHover` prop."
19. Slider `step`: "The granularity with which the slider can step through values. (A "discrete" slider.) The `min` prop serves as the origin for the valid values. We recommend (max - min) to be evenly divisible by the step."
20. Slider `largeStep`: "The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down."
21. Slider `max`: "The maximum allowed value of the slider. Should not be equal to min."
22. Tabs `activateOnFocus`: "Whether to automatically change the active tab on arrow key focus. Otherwise, tabs will be activated using Enter or Space key press."
23. Tabs `defaultValue`: "The default value. Use when the component is not controlled. When the value is `null`, no Tab will be active."

Enumerated values get a bullet per value in JSDoc (`B:packages/react/src/dialog/root/DialogRoot.tsx`):

```ts
/**
 * Determines if the dialog enters a modal state when open.
 * - `true`: user interaction is limited to just the dialog: focus is trapped, document page scroll is locked, and pointer interactions on outside elements are disabled.
 * - `false`: user interaction with the rest of the document is allowed.
 * - `'trap-focus'`: focus is trapped inside the dialog, but document page scroll is not locked and pointer interactions outside of it remain enabled.
 *
 * When `modal` is `true` or `'trap-focus'`, render `<Dialog.Close>` inside `<Dialog.Popup>` so
 * touch screen readers can escape the popup.
 */
```

Tense and mood across both: present tense, third person, no "you" in the first clause. Radix uses "will" freely ("will be reversed", "will loop"). Base UI's Vale config flags "will" (`Google.Will = YES` in `B:.vale.ini`), so its JSDoc says "is ignored", "stays", "prevents". Some Base UI descriptions still slip ("will be generated automatically", "will be activated").

### Data attributes

**Radix** lists attribute + values, with no description column. Enumerated values are shown as chips; boolean presence is written as a sentence in the values slot:

```jsx
{ attribute: "[data-state]", values: ["checked", "unchecked", "indeterminate"] },
{ attribute: "[data-disabled]", values: "Present when disabled" },
```

One overloaded `data-state` per part carries open/closed, active/inactive, checked/unchecked.

**Base UI** uses one boolean attribute per state and a description in every row, always "Present when [the x] is [state]." or "Indicates [the x]." for valued ones:

- "Present when the checkbox is checked." / "Present when the checkbox is not checked."
- "Present when the checkbox is in an invalid state (when wrapped in Field.Root)."
- "Present when the panel begins animating in." / "Present when the panel is animating out." (`data-starting-style` / `data-ending-style`)
- "Present while the user is dragging." (Slider `data-dragging`)
- "Present when the corresponding dialog is open." (Trigger `data-popup-open`)
- "Indicates the index of the accordion item." (`data-index`)
- "Indicates the orientation of the accordion." (`data-orientation`)
- "Indicates that the viewport is currently transitioning between old and new content."

The source is one JSDoc comment per exported constant (`B:packages/react/src/dialog/popup/DialogPopupDataAttributes.ts`): `/** Present when the dialog is nested within another dialog. */ export const nested = 'data-nested';`

The "(when wrapped in Field.Root)" suffix, which tells you a dependency the attribute has, is a good touch.

### CSS variables

**Radix** gives a noun phrase, no period, no type column:

- `--radix-popover-content-transform-origin`: "The `transform-origin` computed from the content and arrow positions/offsets"
- `--radix-popover-content-available-width`: "The remaining width between the trigger and the boundary edge"
- `--radix-popover-trigger-width`: "The width of the trigger"

**Base UI** gives a noun phrase with a period and a type column (`number`/`string`), plus a usage note when there's a trap:

- `--available-height`: "The available height between the trigger and the edge of the viewport."
- `--anchor-width`: "The anchor's width."
- `--transform-origin`: "The coordinates that this element is anchored to. Used for animations and transitions."
- `--positioner-width`: "The width of the popover's positioner. It is important to set `width` to this value when using CSS to animate size changes."
- `--active-tab-left`: "Indicates the distance on the left side from the parent's container if the tab is active."
- `--accordion-panel-height`: "The accordion panel's height."
- `--nested-dialogs` (JSDoc): "Indicates how many dialogs are nested within." with `@type {number}`

---

## 5. Examples

### Titles

Both use task- or outcome-shaped `###` titles. Radix titles are often noun phrases describing the result; Base UI titles mix those with gerunds.

Radix (`R:components/*.mdx`): "Expanded by default", "Allow collapsing all items", "Multiple items open at the same time", "Rotated icon when open", "Horizontal orientation", "Animating content size", "Indeterminate", "Decoupling the hidden input", "Close after asynchronous form submission", "Scrollable overlay", "Custom portal container", "Constrain the content size", "Origin-aware animations", "Collision-aware animations", "With custom anchor", "Change the positioning mode", "With disabled items", "With a placeholder", "With grouped items", "Controlling the value displayed in the trigger", "Vertical orientation", "Create a range", "Define step size", "Prevent thumb overlap".

Base UI (`B:components/*/page.mdx`): "State", "Open from a menu", "Nested dialogs", "Close confirmation", "Custom focus management", "Outside scroll dialog", "Inside scroll dialog", "Placing elements outside the popup", "Detached triggers", "Multiple triggers", "Controlled mode with multiple triggers", "Opening on hover", "Labeling a checkbox", "Rendering as a native button", "Form integration", "Formatting the value", "Placeholder values", "Multiple selection", "Object values", "Grouped", "Custom keyboard shortcuts", "Range slider", "Animated panels", "Links", "Hidden until found", "Loading states", "Rendering links as buttons".

### Introductions and prose volume

**Radix**: one sentence, almost always "Use the `x` prop to [outcome]." or "You can [outcome] by using the `x` prop." Then a minimal snippet with the relevant line highlighted (`line=` and `__prop__` markers). There is no prose after the code.

- "Use the `defaultValue` prop to define the open item by default."
- "Use the `collapsible` prop to allow all items to close."
- "Set the `type` prop to `multiple` to enable opening multiple items at once."
- "You can create vertical tabs by using the `orientation` prop."
- "Use the controlled props to programmatically close the Dialog after an async operation has completed."
- "Move the content inside the overlay to render a dialog with overflow."
- "Customise the element that your dialog portals into." (British spelling; Base UI's Vale would reject it)

Snippets are elided with `…` and show only what changed:

```jsx
<Accordion.Root type="single" __defaultValue__="item-2">
	<Accordion.Item value="item-1">…</Accordion.Item>
	<Accordion.Item value="item-2">…</Accordion.Item>
</Accordion.Root>
```

**Base UI**: one to five sentences before the demo or snippet, and often more after it. Prose explains the mechanism and the trap, not only the prop name. Code blocks get titles that name the variant (`title="Uncontrolled dialog"`, `title="Controlled dialog"`, `title="Sibling label pattern with a native button"`). Highlights use `// @highlight` and `@highlight-text "prop"` comments.

- "In order to open a dialog using a menu, control the dialog state and open it imperatively using the `onClick` handler on the menu item." (Dialog, Open from a menu)
- "`<Select.Label>` renders a `<div>`, so clicking it focuses the select trigger without opening the popup." (post-code note)
- "With placeholders, users cannot clear selected values using the select itself. If the select value should be clearable from the popup (instead of an external "reset" button), use a `null` item rendered in the list itself:"
- "By default, `<Checkbox.Root>` renders a `<span>` element to support enclosing labels. Prefer rendering the checkbox as a native button when using sibling labels (`htmlFor`/`id`)."
- "To try it, press <kbd>Ctrl</kbd>+<kbd>F</kbd> (<kbd>Cmd</kbd>+<kbd>F</kbd> on macOS) and search for "restocking"—the browser opens the closed panel containing the match." (Accordion, Hidden until found; tells the reader how to exercise the demo)

Some Base UI examples are almost reference material in prose. The Select "Custom keyboard shortcuts" intro packs six facts into one paragraph: "`<Select.Root>` accepts an `actionsRef` whose `highlightItem()` action moves the highlight to the `'next'`, `'previous'`, `'first'` or `'last'` item, or clears it with `'none'`. … Select does not loop focus, so `'next'` on the last item and `'previous'` on the first one leave the highlight where it is. The action does nothing while the popup is closed."

### Controlled vs uncontrolled

**Radix** covers it in the intro ("Uncontrolled: Where applicable, components are uncontrolled by default but can also be controlled, alternatively.") and in the Highlights bullet "Can be controlled or uncontrolled." It uses controlled state only in examples that need it (Dialog "Close after asynchronous form submission", Checkbox "Indeterminate": "You can set the checkbox to `indeterminate` by taking control of its state.").

**Base UI** gives it a dedicated first example on Dialog, titled just "State", with two titled blocks:

> "By default, Dialog is an uncontrolled component that manages its own state."
> [Uncontrolled dialog]
> "Use `open` and `onOpenChange` props if you need to access or control the state of the dialog. For example, you can control the dialog state in order to open it imperatively from another place in your app."
> [Controlled dialog]
> "It's also common to use `onOpenChange` if your app needs to do something when the dialog is closed or opened. This is recommended over `React.useEffect` when reacting to state changes."

The general explanation lives once in `B:handbook/customization/page.mdx` "Controlling components with state": "Components are uncontrolled by default, meaning that they manage their own state internally." … "A component can be made controlled by passing external state to a prop, such as `open` or `value`, and the state's setter to its corresponding change handler, such as `onOpenChange` or `onValueChange`."

### Custom APIs (Radix only)

A Radix-specific section showing how to wrap parts into your own higher-level component, as `#### Usage` then `#### Implementation`. "Create your own API by abstracting the primitive parts into your own component." / "This example abstracts all of the `Slider` parts so it can be used as a self closing element." This is valuable for a headless library because it's what users actually build. Base UI has no equivalent on component pages; its closest is Select's "Typed wrapper component".

---

## 6. Accessibility and keyboard

### Radix

Each interactive page has:

```mdx
## Accessibility

Adheres to the [Tabs WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs).

### Keyboard Interactions

<KeyboardTable data={[{ keys: ["Tab"], description: ... }, ...]} />
```

Variants of the adherence line:

- "Adheres to the [tri-state Checkbox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox)."
- "Adheres to the [ListBox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox)." followed by "See the W3C [Select-Only Combobox](...) example for more information."
- "Adheres to the [Slider WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb)."

The table has two columns, Key and Description. Keys are arrays (`["Shift + Tab"]`, `["ArrowDown"]`, `["PageUp"]`). Each key gets its own row even when descriptions repeat (ArrowDown and ArrowRight rows in Tabs are identical).

Key description wording is a third-person present verb phrase with no subject, ending in a period:

- Space (Dialog): "Opens/closes the dialog."
- Tab: "Moves focus to the next focusable element."
- Shift + Tab: "Moves focus to the previous focusable element."
- Esc: "Closes the dialog and moves focus to `Dialog.Trigger`."
- Tabs Tab: "When focus moves onto the tabs, focuses the active trigger. When a trigger is focused, moves focus to the active content."
- Tabs ArrowDown: "Moves focus to the next trigger depending on `orientation` and activates its associated content."
- Home: "Moves focus to the first trigger and activates its associated content."
- Checkbox Space: "Checks/unchecks the checkbox."
- Slider ArrowUp: "Increases the value by the `step` amount."
- Slider PageUp: "Increases the value by a larger `step`."
- Slider Home: "Sets the value to its minimum."
- Select Space, context-dependent with `<br />`: "When focus is on `Select.Trigger`, opens the select and focuses the selected item. / When focus is on an item, selects the focused item."

The "When focus is on X, … / When focus is on Y, …" pattern is the clearest way to handle keys that do different things per part.

Extra subsection where labeling isn't obvious: Select `### Labelling`: "Use our [Label](label) component in order to offer a visual and accessible label for the select."

The overview page (`R:overview/accessibility.mdx`) explains WAI-ARIA, accessible labels, keyboard navigation and focus management in 4 short sections. It ends on a concrete example: "For example, in [`AlertDialog`](../components/alert-dialog), when the modal is opened, focus is programmatically moved to a `Cancel` button element to anticipate a response to the prompt."

### Base UI

There are no per-component keyboard tables and no APG links on component pages. Accessibility shows up in three places:

1. **Usage guidelines** bullets on form controls, with identical wording each time: "**Form controls must have an accessible name**: Prefer `<Slider.Label>`, or provide an `aria-label` on each `<Slider.Thumb>` when no visible label is rendered. See [Labeling a slider](#labeling-a-slider) and the [forms guide](/react/handbook/forms)."
2. **Labeling examples** on every form control ("Labeling a checkbox", "Labeling a select", "Labeling a slider").
3. **Judgment sections** where the pattern itself is the hazard. Tooltip's `## Alternatives to tooltips` is the standout (`B:components/tooltip/page.mdx`):

> "Tooltips should be supplementary popups that provide non-essential clarity in high-density UIs. A user should not miss critical information if they never see a tooltip."
>
> "To know when to reach for a popover instead of a tooltip, consider the **purpose** of the trigger element: If the trigger's purpose is to open the popup itself, it's a popover. If the trigger's purpose is unrelated to opening the popup, it's a tooltip."

The overview (`B:overview/accessibility/page.mdx`) is explicit about what the developer owns, which Radix's isn't:

> "While Base UI components manage focus, it's the developer's responsibility to visually indicate focus. This is typically handled by styling the `:focus` or `:focus-visible` CSS pseudo-classes."

It also covers color contrast ("consider adhering to [APCA]") and uses `<kbd>` inline: "Many components provide support for arrow keys, alphanumeric keys, <kbd>Home</kbd>, <kbd>End</kbd>, <kbd>Enter</kbd>, and <kbd>Esc</kbd>."

### Takeaway

Radix's per-page keyboard table and APG link are what a screen-reader-aware developer checks first. Base UI's "what you still have to do" guidance is what prevents real bugs. Xenon should do both: keyboard table + APG link, plus a short "You provide" list (accessible name, focus ring, etc.).

---

## 7. Guides

### Styling

**Radix** (`R:guides/styling.mdx`, ~130 lines, mostly code). It opens with the `<Description>` line and jumps straight to an H3: "Functional styles: You are in control of all aspects of styling, including functional styles. For example—by default—a [Dialog Overlay](../components/dialog) won't cover the entire viewport. You're responsible for adding those styles, plus any presentation styles."

That first paragraph is the most useful sentence in either styling guide for a headless library. It tells the reader that even layout-critical CSS is theirs.

Structure: Styling overview (Functional styles / Classes / Data attributes) → Styling with CSS (a part / a state) → Styling with CSS-in-JS → Extending a primitive → Summary. The Summary adds nothing new: "Radix Primitives were designed to encapsulate accessibility concerns and other complex functionalities, while ensuring you retain complete control over styling."

**Base UI** (`B:handbook/styling/page.mdx`, ~170 lines). Opens with two sentences: "Base UI components are unstyled, don't bundle CSS, and are compatible with Tailwind, CSS Modules, CSS-in-JS, or any other styling solution you prefer. You retain total control of your styling layer."

Structure: Style hooks (CSS classes / Data attributes / CSS variables / Style prop) → Tailwind CSS → CSS Modules → CSS-in-JS. Each hook is explained as one sentence stating what it accepts, a snippet, then a sentence on the function form:

> "Components that render an HTML element accept a `className` prop to style the element with CSS classes."
> "The prop can also be passed a function that takes the component's state as an argument."

It points back to the reference instead of duplicating it: "Check out each component's API reference for a complete list of available data attributes and CSS variables."

### Composition

**Radix** (`R:guides/composition.mdx`, ~130 lines). The first paragraph is a definition of the mechanism:

> "All Radix primitive parts that render a DOM element accept an `asChild` prop. When `asChild` is set to `true`, Radix will not render a default DOM element, instead cloning the part's child and passing it the props and behavior required to make it functional."

Then it gives a when-to-use sentence, one concrete case, a warning blockquote, and requirements phrased as imperative H3s:

- "In the majority of cases you shouldn't need to modify the element type as Radix has been designed to provide the most appropriate defaults. However, there are cases where it is helpful to do so."
- "A good example is with `Tooltip.Trigger`. By default this part is rendered as a `button`, though you may want to add a tooltip to a link (`a` tag) as well."
- `### Your component must spread props`: "When Radix clones your component, it will pass its own props and event handlers to make it functional and accessible. If your component doesn't support those props, it will break."
- `### Your component must forward ref`: "Radix will sometimes need to attach a `ref` to your component (for example to measure its size). If your component doesn't accept a `ref`, then it will break."
- Warning: "> If you do decide to change the underlying element type, it is your responsibility to ensure it remains accessible and functional. In the case of `Tooltip.Trigger` for example, it must be a focusable element that can respond to pointer and keyboard events. If you were to switch it to a `div`, it would no longer be accessible."

Before/after code pairs (`// before` / `// after`) make each requirement concrete.

**Base UI** (`B:handbook/composition/page.mdx`, ~90 lines) has no intro paragraph at all. The first H2 opens with a one-line instruction: "Use the `render` prop to compose a Base UI part with your own React components." Requirements are a single sentence: "The custom component must forward the `ref`, and spread all the received props on its underlying DOM node." It closes on the function form: "Using a function gives you complete control over spreading props and also allows you to render different content based on the component's state."

Both then show the same nested Tooltip + Dialog + custom button example. This is the canonical "why composition matters" demo in both libraries.

### Animation

**Radix** (`R:guides/animation.mdx`, ~100 lines) opens by naming the caveat: "Adding animation to Radix Primitives should feel similar to any other component, but there are some caveats noted here in regards to exiting animations with JS animation libraries." Then: "The simplest way to animate Primitives is with CSS." and one explanatory clause: "The latter is possible because the Radix Primitives will suspend unmount while your animation plays out."

**Base UI** (`B:handbook/animation/page.mdx`, ~300 lines) is the best-written guide in either repo. Moves worth copying:

- It states a recommendation with the reason attached: "Transitions are recommended over CSS animations, because a transition can be smoothly cancelled midway. For example, if the user closes a popup before it finishes opening, with CSS transitions it will smoothly animate to its closed state without any abrupt changes."
- It defines attributes as a list of "`[attr]` corresponds to…": "`[data-starting-style]` corresponds to the initial style to transition from."
- It explains the lifecycle before the API: "When a popup closes, `open` becomes `false` right away, but the popup stays rendered in a closing phase until its closing animation finishes."
- It frames the decision as two questions:
  > "- **Where does the popup go when closed?** Removed from the DOM with `<AnimatePresence>`, or kept in the DOM with `keepMounted`.
  > - **Who ends the closing phase?** Base UI, when it can detect the animation, or you, with manual unmounting."
- It opens escape hatches with "Use this when…": "Use this when Base UI can't detect your closing animation, for example when it doesn't animate `opacity`, or when the popup should stay in its closing phase until something other than an animation completes."

### Customization (Base UI only)

`B:handbook/customization/page.mdx` documents the change-event `eventDetails` object with a bullet per field in "`field` [verb]s…" form: "`cancel` stops the component from changing its internal state." / "`allowPropagation` allows the DOM event to propagate in cases where Base UI stops the propagation." It labels escape hatches as such: "This should be used as an escape hatch in cases where there isn't a prop yet to customize the behavior."

### How guides open

| Guide | Radix opener | Base UI opener |
| --- | --- | --- |
| Styling | Description line, then "You are in control of all aspects of styling, including functional styles." | "Base UI components are unstyled, don't bundle CSS, and are compatible with…" |
| Composition | "All Radix primitive parts that render a DOM element accept an `asChild` prop." | (none) "Use the `render` prop to compose a Base UI part with your own React components." |
| Animation | "Adding animation to Radix Primitives should feel similar to any other component, but there are some caveats…" | "Base UI components can be animated using CSS transitions, CSS animations, or JavaScript animation libraries." |

None open with motivation or "Why". All open with a statement of what the library does or accepts. Subtitles on Base UI guides are formulaic: "A guide to styling Base UI components with your preferred styling engine.", "A guide to composing…", "A guide to animating Base UI components."

---

## 8. Voice

### Person

Word counts across components, guides and overview (Base UI excludes release notes):

| Marker | Radix | Base UI |
| --- | --- | --- |
| "we" | 54 | 5 |
| "our" | 171 | 7 |
| "you" | 242 | 141 |
| "will" | 152 | 8 |
| "easily" | 1 | 11 |
| "high-quality" | 2 | 36 |

Radix's "our" count is inflated by boilerplate: every `asChild` row says "Read our Composition guide for more details." Its prose uses "we" for recommendations and admissions: "We recommend always doing this so that you are not concerned with implementation details (ie. which props/events to accept). We find this is good practice for "leaf" components in general." / "Because of a limitation we faced during implementation…"

Base UI avoids first person by rule. `B:.vale.ini`:

```ini
Google.FirstPerson = YES # Avoid first-person
Google.We = YES # Avoid first-person plural
Google.Will = YES # Avoid future tense
Google.OxfordComma = YES # Prefer Oxford comma
```

So Base UI writes around the library as subject ("Base UI detects animations on the popup element.") or the imperative ("Use…", "Prefer…"). The remaining "we" hits are in demo copy or the About page.

### Explicit rules (Base UI + MUI Vale styles)

From `mui-public/packages/code-infra/vale/styles/MUI/`:

- `GoogleLatin.yml`: replace "e.g." with "for example" and "i.e." with "that is". (Radix uses both: "e.g. to update a backend service", "ie. which props/events".)
- `NoBritish.yml`: US spelling ("behavior", not "behaviour"; Radix has "Customise", "Labelling", "whilst").
- `CorrectReferenceAllCases.yml`: canonical casing for "API", "TypeScript", "JavaScript", "CSS Modules", "npm", "GitHub", "subcomponent", "use case".
- `MuiBrandName.yml`: non-breaking space inside "Base UI" so the brand name never wraps.
- `B:CONTRIBUTING.md` on the linter: "The style rules are shared with other repositories in the organization, so they sometimes misfire on legitimate wording. When that happens, point it out in the pull request instead of contorting the text to satisfy the rule."
- `B:AGENTS.md` error-message rule, also useful for docs prose: "Every error message must: 1. **Say what happened** … 2. **Say why it's a problem** … 3. **Point toward how to solve it**".
- `B:AGENTS.md` on demos: "Do not add custom styling beyond the critical layout styles necessary for new demos."

Radix has no writing guideline file; `R:.github/CONTRIBUTING.md` covers only the PR process.

### Sentence length and rhythm

- Radix: short, declarative, repetitive. Prop and key descriptions are mostly 6 to 15 words. Guides average around 20 words per sentence.
- Base UI: longer in examples (20 to 35 words is common) and one sentence per source line (semantic line breaks). This makes diffs readable and pushes writers toward one idea per sentence. Example (`B:overview/about/page.mdx`):

```
Base UI components are unstyled, don't bundle CSS, and don't prescribe a styling solution.
You retain complete control over your application's CSS layer.
```

### Hedging and certainty

Both state behavior flatly. Hedges appear only where behavior genuinely varies:

- Radix: "Radix will *sometimes* need to attach a `ref`", "In the majority of cases you shouldn't need to…", "you will rarely modify the underlying DOM element".
- Base UI: "Because some browser and screen reader combinations do not reliably announce changes to a focused button's descendant text…" (a specific hedge naming the actual uncertainty). "Most IDEs show the possible string values after typing `reason === '`."

### Marketing words

Radix intro uses a few: "high-quality, accessible design systems", "the best possible developer experience", "as smoothly as possible". Component pages are almost free of them.

Base UI component pages are clean in the body but not in `<Meta>`: every description is "A high-quality, unstyled React X component that…" (36 hits). The About page has "delightful developer experience". Quick start has "shadcn/ui is a great place to start".

### Caveats, warnings, callouts

Both use callouts sparingly.

- Radix: 9 blockquotes across 30 component pages, mostly the same unstable-API notice: "> **Important:** These parts are unstable and prefixed with `unstable_`, so their API may change in a future release." Plus the Form note: "> Note: At the moment, it is not possible to compose `Form` with Radix's other form primitives such as `Checkbox`, `Select`, etc. We are working on a solution for this." A dedicated `## Caveats` section exists for Slider: "Mouse events are not fired", with the reason, a link to the source line, and the alternative ("We recommend using pointer events instead…").
- Base UI: no callout component. Caveats go inline, in "Usage guidelines" bullets, or as "Note that…" sentences: "Note that there is no separate `onTriggerIdChange` prop. Instead, the `onOpenChange` callback receives an additional argument, `eventDetails`, which contains the trigger element that initiated the state change." Constraints go into the prop description itself: "Should not be equal to min." / "Requires the `openOnHover` prop." / "This prop is ignored when `hiddenUntilFound` is used."

Base UI's "Usage guidelines" bullets are the closest thing to a warning box. They are bold-label bullets in "**Imperative rule**: explanation. See [link]." form:

- "**Submit buttons**: Unlike the native button element, `type="submit"` must be specified on Button for it to act as a submit button."
- "**Prefer Combobox for large lists**: Select is not filterable, aside from basic keyboard typeahead functionality… Prefer [Combobox] instead of Select when the number of items is sufficiently large to warrant filtering."
- "**Dialog doesn't support gestures:** Use [Drawer](/react/components/drawer) when you need gesture support or snap points."

The best ones pair "don't use this for X" with the component to use instead.

---

## 9. Anti-patterns worth avoiding

1. **Boilerplate repeated on every row.** Radix's `asChild` description ("Change the default rendered element for the one passed as a child, merging their props and behavior. Read our Composition guide for more details.") appears on every part of every component. So does `forceMount` ("Used to force mounting when more control is needed. Useful when controlling animation with React animation libraries."). Base UI repeats `className`/`style`/`render` descriptions on every part too. Better: list shared props once per page or collapse them into a "Common props" link.

2. **Descriptions that restate the prop name.** Radix `orientation`: "The orientation of the component." Base UI Tabs `defaultValue`: "The default value. Use when the component is not controlled." Base UI Slider `orientation`: "The component orientation." `inverted`: "Whether the slider is visually inverted." These tell the reader nothing the type column doesn't. Say what changes: the axis of arrow keys, the value of `data-orientation`, which end is min.

3. **Vague "when more control is needed".** Radix `forceMount` never says what the prop does (keeps the element mounted while hidden), only when you might want it.

4. **Generic one-liners.** Base UI "An easily stylable checkbox component." / "An easily stylable range input." / "An easily stylable avatar component." Every headless component is stylable; that's the premise of the library. Radix gives Checkbox and Switch the identical sentence.

5. **SEO boilerplate leaking into meta.** Base UI's `<Meta description>` is "A high-quality, unstyled React X component that…" on 36 pages. "High-quality" is a claim with no content.

6. **Features lists of fragments that aren't features.** Radix Highlights like "Full keyboard navigation.", "Can be controlled or uncontrolled." and "Focus is fully managed." repeat on nearly every page. When every component has the same three bullets, they stop carrying information. The specific ones work: "Scrollbar sits on top of the scrollable content, taking up no space." / "Resets visibility to hidden after form submission to prevent accidental storage."

7. **Pattern definitions instead of component descriptions.** Radix one-liners copied from the APG ("A vertically stacked set of interactive headings…") describe the abstract pattern, not what the library gives you.

8. **Empty summaries.** Radix styling guide `## Summary` repeats the intro.

9. **Keyboard rows duplicated per key.** Radix Tabs has four near-identical rows for the arrow keys. Grouping ("ArrowDown / ArrowRight") would halve the table.

10. **Long single paragraphs that mix reference and tutorial.** Base UI's "Custom keyboard shortcuts" and the repeated "Detached triggers" block (copied almost verbatim across Dialog, Popover, Tooltip, Menu) are hard to scan. The same four paragraphs about handles appear on four pages instead of once in a shared guide.

11. **Optional parts shown without being marked optional.** Base UI Popover's anatomy includes `Viewport` and `Backdrop`. You learn `Viewport` is optional only at the bottom of the API reference.

12. **Missing "renders what" information.** Radix never says what element a part renders. A headless-library reader needs it for selectors, semantics and composition.

13. **Inconsistent punctuation and spelling across pages.** Radix mixes "Labelling"/"Customise"/"whilst" with US spelling, and newer highlight bullets drop periods. Heading case differs by library: Radix uses title case for "API Reference" and "Keyboard Interactions", Base UI uses sentence case "API reference".

14. **Hedged "e.g." chains and parentheticals in prop descriptions.** Radix `onValueCommit`: "Useful when you only need to capture a final value e.g. to update a backend service." Base UI Vale would flag this.

15. **Em dashes used as parenthesis delimiters.** Radix: "Radix Primitives are unstyled—and compatible with any styling solution—giving you complete control over styling." / "For example—by default—a Dialog Overlay won't cover…". Base UI also has "— before one mounts, or after it unmounts —". Both read as asides that should be their own sentence.

---

## 10. Patterns to lift for Xenon

- **Page order**: one-liner → hero demo → usage guidelines (optional) → anatomy → examples → accessibility (APG link + keyboard table + "you provide") → API reference.
- **One-liner**: "A/An [concrete noun] [one distinguishing fact]." 6 to 12 words, no "component", no "easily".
- **Part description**: "[What it is/does]. Renders a `<x>` element." or "Doesn't render its own element."
- **Prop descriptions**: booleans start "Whether…". Callbacks start "Called when…" (or keep "Event handler called when…"). Controlled/uncontrolled pairs point at each other ("To control it, use `open` instead."). Enums get a bullet per value. Constraints go in the description ("Requires `openOnHover`.", "Ignored when `hiddenUntilFound` is set.").
- **Data attributes**: one boolean attribute per state. The description is "Present when [the x] is [state]." or "Indicates [the x]."; add "(inside Field)" style dependencies.
- **CSS variables**: include a type column and a noun phrase; add a usage note when there's a trap (Base UI `--positioner-width`).
- **Examples**: task title, one to three sentences of why/how, titled code block with highlighted lines, then an optional note on the non-obvious consequence. Give controlled vs uncontrolled one example, titled "State".
- **Keyboard table**: key | behavior, verb-first present tense, "When focus is on X, …" for context-dependent keys.
- **Voice**: second person or imperative, present tense, no "we", no "will", no Latin abbreviations, one sentence per source line.
- **Warnings**: inline, specific, with the alternative ("Use Drawer when you need gestures."). No callout boxes except for unstable APIs.
