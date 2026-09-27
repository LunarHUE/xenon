# How React Aria and Ariakit write component docs

Source material for the Xenon docs style guide. Everything below comes from the docs source, not the rendered sites, except Headless UI (no public docs source, so WebFetch on headlessui.com).

## Sources

| Label | Path | What it is |
|---|---|---|
| RA-new | `/tmp/docs-src/react-spectrum/packages/dev/s2-docs/pages/react-aria/*.mdx` | Current React Aria site (react-aria.adobe.com). Shallow clone of `main`. |
| RA-old | `/tmp/docs-src/rs-old/packages/react-aria-components/docs/*.mdx` | Previous RAC docs, sparse checkout of tag `react-aria-components@1.8.0`. Much longer pages with Features / Anatomy / Styling sections. Useful as a "before" picture. |
| RA-src | `/tmp/docs-src/react-spectrum/packages/react-aria-components/src/*.tsx`, `packages/@react-types/shared/src/*.d.ts`, `packages/react-aria/src/**` | JSDoc that feeds page descriptions and prop tables. |
| RA-guidelines | `/tmp/docs-src/react-spectrum/specs/api/Guidelines.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/contributing/pull-requests.md` | API naming rules. No prose style guide exists. |
| AK | `/tmp/docs-src/ariakit/components/*.md`, `guide/*/readme.md`, `examples/*/readme.md` | Ariakit component pages, guides, example write-ups. |
| AK-src | `/tmp/docs-src/ariakit/packages/ariakit-react-components/src/**`, `packages/ariakit-components/src/**` (stores), `packages/ariakit-solid-*` | JSDoc feeding the `/reference/*` pages. Note: `@ariakit/solid` 0.2.8 exists, with an `As` component for the Solid `render` prop. |
| AK-meta | `/tmp/docs-src/ariakit/contributing.md`, `guide/900-coding-guidelines/readme.md`, `app/docs/reimplementation/*.md` | Contributor docs and site-rewrite handoff notes. |
| HUI | headlessui.com/react/{dialog,tabs,checkbox} | Rendered pages only. |

Neither project has a written prose/voice guide. The closest are Ariakit's "Coding guidelines" (code style for examples) and React Spectrum's API naming guidelines. Their writing conventions have to be inferred from the pages, which is what the rest of this file does.

Some rough numbers from a script that strips code blocks and JSX (`/tmp/voice.mjs`):

| Corpus | Files | Prose words | Words/page | Median sentence | p90 sentence | you/your | we/our |
|---|---|---|---|---|---|---|---|
| RA-new component pages | 60 | 9,068 | ~150 | 13 words | 22 | 28 | 4 |
| RA-new guides (7) | 7 | 5,788 | ~830 | 16 | 24 | 82 | 8 |
| RA-old component pages | 54 | 80,261 | ~1,490 | 17 | 25 | 1,182 | 70 |
| AK component pages | 25 | 2,691 | ~110 | 17 | 34 | 31 | 6 |
| AK example readmes | 56 | 10,333 | ~185 | 21 | 45 | 53 | 123 |
| AK guides | 7 | 4,452 | ~640 | 17 | 34 | 83 | 13 |

The biggest single finding: React Aria cut its component pages by roughly 10x between the old and new site. Features lists, Anatomy prose, per-page Styling sections, "Starter kits" boilerplate and "Advanced customization" were all removed from component pages and moved into shared guides (Styling, Customization, Quality, Collections, Selection, Forms). Component pages now hold only what is specific to that component.

---

## 1. Page structure

### React Aria, current site

Every component page follows this order (Button, Checkbox, Tabs, Modal, Popover, Select, Slider, Disclosure, Tooltip, ComboBox all checked):

1. `# Name`
2. `<PageDescription>{docs.exports.X.description}</PageDescription>`. Pulled from the component's JSDoc, not written in the page.
3. Hero demo in an `<ExampleSwitcher>` with "Vanilla CSS" and "Tailwind" tabs. Each is an interactive `VisualExample` with a few live prop controls: `props={['variant', 'isPending', 'isDisabled']}` (Button.mdx), `props={['orientation', 'keyboardActivation', 'isDisabled']}` (Tabs.mdx), `props={['placement', 'offset', 'crossOffset', 'shouldFlip']}` (Popover.mdx). No heading above it.
4. Feature sections, each an `##` noun heading, each one short paragraph plus one live example. Section names are reused across components (counts across all 60 pages): `Value` 23, `Forms` 14, `Content` 14, `Selection` 7, `Custom trigger` 5, `Validation` 3, `Keyboard navigation` 3, `Events` 2, `Expanding` 2.
5. `## Examples`: `<ExampleList tag="button" pages={props.pages} />`, a card grid of full examples elsewhere on the site.
6. `## API`: anatomy diagram (SVG) + JSX part tree + one `###` prop table per part.

Sections present on every page: title, description, hero demo, `## API` (60/60). Optional: everything in between. There is no Features section, no Accessibility section (only 2 pages have `## Accessibility`: Toast and ColorSwatch), no i18n section, no keyboard table. Accessibility content moved to inline callouts and to the shared `quality.mdx` guide.

Button.mdx, the whole prose content:

> `## Events` / "Use the `onPress` prop to handle interactions via mouse, keyboard, and touch. This is similar to `onClick`, but normalized for consistency across browsers, devices, and interaction methods. Read our [blog post](blog/building-a-button-part-1) to learn more."
> `## Pending` / "Use the `isPending` prop to display a pending state. Pending buttons remain focusable, but are otherwise disabled. Pending state changes are announced to assistive technologies."
> `## Link buttons` / "The `Button` component always represents a button semantically. To create a link that visually looks like a button, use the [Link](Link) component instead."

Each page also exports metadata that is not rendered in the body: `export const tags = ['accordion', 'collapsible', 'expandable', 'details'];` (Disclosure.mdx) for search synonyms, and `relatedPages` linking to the hook (`useButton`) and testing subpages.

### React Aria, old site (for contrast)

Fixed order on nearly every page (RA-old, from the `##` headings of 54 files):

`Example | Features | Anatomy | Examples | Starter kits | Reusable wrappers | <feature sections> | Props | Styling | Advanced customization | Testing`

Every page repeated the same "Starter kits", "Styling" and "Advanced customization > Contexts / Hooks" text with only the component name swapped. That duplication is what the new site deleted.

### Ariakit

Component pages (`components/*.md`) are even shorter and follow:

1. `# Name`
2. `<div data-description>` one or two sentences, ending with "This component is based on the [WAI-ARIA X Pattern](...)".
3. `<div data-tags>`
4. Playground: `<a href="../examples/button/index.react.tsx" data-playground>Example</a>`
5. `## Examples` card grid (optional; Button and Popover have none)
6. `## API`: part tree only, no prop tables (those live on separate `/reference/<part>` pages generated from JSDoc).
7. Component-specific sections, optional, often only styling notes (`## Styling` > `### Styling the checked state`) or a behavior note (`## Activating on <kbd>Enter</kbd> and <kbd>Space</kbd>` on Button).
8. Occasionally a decision section: `## Should I use Menu or Select?` (menu.md).
9. `## Related components` card grid.

Tab.md in full after the header is: description, playground, Examples cards, API tree, Related components. No prose at all.

Example pages (`examples/*/readme.md`) have: title, description, playground, `## Components` cards, then 1–4 `##` sections that explain the interesting code, then `## Related examples`. This is where Ariakit's teaching happens, not on component pages.

### Headless UI

Fixed order (dialog, tabs, checkbox): `Installation | Basic example | Styling (Using data attributes / Using render props) | Examples (task subsections) | Keyboard interaction | Component API | Styled examples`. It is the only one of the three with a keyboard table on every page.

### Takeaway for Xenon

All three converge on: title, one-line description, live demo first, API near the bottom, examples in between. RA-new's move is the one to copy: anything true of every component (styling mechanics, render/composition, labeling rules) goes in a guide, and the component page links there. RA-new and Ariakit both lack a per-component keyboard table; Headless UI has one and it is the most scannable accessibility info of the three.

---

## 2. The one-line description

React Aria has two descriptions per component, with two different grammars.

**JSDoc (shown as `PageDescription`)**: a full sentence, "A/An [noun] [verb]s ...". From RA-src:

1. "A button allows a user to perform an action, with mouse, touch, and keyboard interactions." (Button.tsx)
2. "A checkbox allows a user to select an item, with support for validation and help text." (Checkbox.tsx, `CheckboxField`)
3. "A dialog is an overlay shown above other content in an application." (Dialog.tsx)
4. "A DialogTrigger opens a dialog when a trigger element is pressed." (Dialog.tsx)
5. "A modal is an overlay element which blocks interaction with elements outside it." (Modal.tsx)
6. "A popover is an overlay element positioned relative to a trigger." (Popover.tsx)
7. "A select displays a collapsible list of options and allows a user to select one of them." (Select.tsx)
8. "A slider allows a user to select one or more values within a range." (Slider.tsx)
9. "A slider thumb represents an individual value that the user can adjust within a slider track." (Slider.tsx)
10. "A disclosure is a collapsible section of content. It is composed of a a header with a heading and trigger button, and a panel that contains the content." (Disclosure.tsx, note the "a a" typo shipping in the page header)
11. "A DisclosureGroup is a grouping of related disclosures, sometimes called an accordion. It supports both single and multiple expanded items." (Disclosure.tsx)
12. "A separator is a visual divider between two groups of content, e.g. groups of menu items or sections of a page." (Separator.tsx)
13. "A radio group allows a user to select a single item from a list of mutually exclusive options." (RadioGroup.tsx)
14. "A checkbox button is the clickable area of a checkbox, including the indicator and label." (Checkbox.tsx)
15. "Displays the selected range." (Slider.tsx, `SliderFill`, the one outlier, a verb-first fragment)

Pattern: 10–20 words, subject is the lowercase component noun, verb is one of "allows a user to", "displays", "is", "represents". Sub-parts use "A [Part] represents an individual X in a Y" (`"A ListBoxItem represents an individual option in a ListBox."`).

**Page `description` export (SEO/meta and cards)**: the same sentence with the subject stripped, so it becomes a verb-first fragment:

- "Allows a user to perform an action, with mouse, touch, and keyboard interactions." (Button.mdx)
- "Organizes content into multiple sections and allows users to navigate between them." (Tabs.mdx)
- "An overlay element which blocks interaction with elements outside it." (Modal.mdx)
- "Displays a collapsible list of options and allows a user to select one of them." (Select.mdx)
- "Displays a description of an element on hover or focus." (Tooltip.mdx)
- "A grouping of related disclosures, sometimes called an accordion." (DisclosureGroup.mdx)

Guides use "How to ..." fragments: "How to style React Aria components." (styling.mdx), "How to build custom component patterns." (customization.mdx), "Install and build your first component" (getting-started.mdx, no period).

**Ariakit**: imperative verb-first, written from the end user's action, ending with the WAI-ARIA pattern link. Often two sentences, 25–40 words:

1. "Trigger an action or event, such as submitting a Form, opening a Dialog, canceling an action, or performing a delete operation in React. This component is based on the WAI-ARIA Button Pattern." (button.md)
2. "Open a new window that can be either `modal` or non-modal and optionally rendered in a React `portal`." (dialog.md)
3. "Show a popup dialog positioned relative to an anchor element." (popover.md)
4. "Display one panel of content at a time with a tabbed interface." (tab.md)
5. "Select one or more options in a list or toggle a single option using a native or custom checkbox in React." (checkbox.md)
6. "Select a value from a list of options presented in a dropdown menu, similar to the native HTML select element." (select.md)
7. "Click a button to either `show` (expand, open) or `hide` (collapse, close) a content element in React." (disclosure.md)
8. "Access a set of commands within a dropdown menu." (menu.md)
9. "Fill in a React input field with autocomplete & autosuggest functionalities. Choose from a list of suggested values with full keyboard support." (combobox.md)
10. "Hide an element visually but keep it available for screen readers and other assistive technologies." (visually-hidden.md)
11. "Distinguish sections of content or groups of items. This abstract component is based on the WAI-ARIA Separator Role." (app/src/examples/separator/_component/description.mdx)

Ariakit's JSDoc uses a third grammar, "Renders ...": 139 of 320 component-level JSDoc blocks start with "Renders", 18 with "Provides" (stores/providers), 159 with "Returns" (hooks). Example: "Renders an accessible button element. If the underlying element is not a native button, this component will pass additional attributes to make sure it's accessible." (button.tsx).

Example pages use a gerund fragment: "Animating a modal Dialog and its `backdrop` element using CSS." (dialog-animated), "Preventing users from accidentally closing a `modal` Dialog component with unsaved changes by displaying a nested confirmation dialog." (dialog-hide-warning), "Using React Router to create Tab links and tab panels controlled by the browser history, while maintaining keyboard navigation." (tab-react-router).

**Headless UI**: marketing sentence about the library, not the widget: "A fully-managed, renderless dialog component jam-packed with accessibility and keyboard features, perfect for building completely custom dialogs and alerts." / "Easily create accessible, fully customizable tab interfaces, with robust focus management and keyboard navigation support." / "Checkboxes provide the same functionality as native HTML checkboxes, without any of the styling, giving you a clean slate to design them however you'd like."

### Takeaway

The best descriptions say what the user of the finished UI does with it (Ariakit's "Display one panel of content at a time", RA's "allows a user to select one or more values within a range"). Ariakit's "in React" suffix is SEO stuffing and reads oddly ("toggle a single option using a native or custom checkbox in React"). Headless UI's are adjective piles. One grammar for all three contexts (JSDoc, page header, card) would avoid RA's split; RA's JSDoc sentence form is the one that works in all three.

---

## 3. Anatomy

**RA-new**: under `## API`, an SVG diagram followed by a JSX tree whose names link to the prop table anchors:

```tsx links={{DialogTrigger: '#dialogtrigger', Button: 'Button', ModalOverlay: '#modaloverlay', Modal: '#modal', Dialog: '#dialog'}}
<DialogTrigger>
  <Button />
  <ModalOverlay>
    <Modal>
      <Dialog>
        <Heading slot="title" />
        <Text slot="description" />
        <Button slot="close" />
      </Dialog>
    </Modal>
  </ModalOverlay>
</DialogTrigger>
```
(Modal.mdx)

The tree shows slots (`slot="title"`, `slot="description"`) inline, which documents composition without prose. Parts that come from other pages link to those pages (`Button: 'Button'`, `SelectionIndicator: 'selection#animated-selectionindicator'` in Tabs.mdx). Toast gives its SVG an accessible name: `<Anatomy role="img" aria-label="Toast anatomy diagram, showing the toast's title and close button within the toast region." />`.

**RA-old** had a prose `## Anatomy` that described parts *and* carried the labeling rule:

> "A select consists of a label, a button which displays a selected value, and a listbox, displayed in a popover. Users can click, touch, or use the keyboard on the button to open the listbox popover. ... If a select does not have a visible label, an `aria-label` or `aria-labelledby` prop must be passed instead to identify it to assistive technology." (RA-old Select.mdx)

> "Sliders consist of a track element showing the range of available values, one or more thumbs showing the current values, an optional <output> element displaying the current values textually, and a label." (RA-old Slider.mdx)

**Ariakit**: the `## API` section *is* the anatomy, a JSX tree including store hooks:

```jsx
useSelectStore()
useSelectContext()

<SelectProvider>
  <SelectLabel />
  <Select>
    <SelectValue />
    <SelectArrow />
  </Select>
  <SelectPopover>
    ...
```
(select.md). No diagram, no prose. Every part is listed, even rare ones, so the Combobox tree is 30 lines.

**Headless UI**: no anatomy section. The "Basic example" opens with a sentence naming the parts: "Tabs are built using the `TabGroup`, `TabList`, `Tab`, `TabPanels`, and `TabPanel` components."

### Takeaway

A linked JSX tree is enough, and all three independently land on it. Show slots and optional parts in the tree. The old RA prose Anatomy was the only place per-component labeling rules lived; when RA dropped it, those rules went to a generic guide and component pages lost them. If Xenon uses trees only, the labeling requirement needs another home on the page.

---

## 4. API reference

### React Aria prop descriptions

Generated from JSDoc. First-two-word counts across 2,277 RA prop comments (`/tmp/firstword.mjs`): "Whether the" 527, "Props for" 226 (hook return values), "Handler that" 120, "The CSS" 116, "A function" 38, "The current" 30, "Whether to" 26.

Conventions:
- Booleans: "Whether the/to ...". Never "If true, ...".
- Events: "Handler that is called when ...".
- Controlled/uncontrolled pairs are tagged with a parenthetical: "(controlled)" / "(uncontrolled)".
- Defaults go in `@default`, rendered in a table column, never repeated in prose.
- State/render props carry `@selector [data-x]`, so one comment documents the render prop value and the CSS selector together.
- The description is a noun phrase or "Whether" clause, then optional extra sentences for caveats.

Verbatim (RA-src):

1. `isPending`: "Whether the button is in a pending state. This disables press and hover events while retaining focusability, and announces the pending state to screen readers." (Button.tsx)
2. `isDismissable`: "Whether to close the modal when the user interacts outside it. @default false" (useModalOverlay.ts)
3. `isKeyboardDismissDisabled`: "Whether pressing the escape key to close the modal should be disabled. @default false"
4. `shouldFlip`: "Whether the element should flip its orientation (e.g. top to bottom or left to right) when there is insufficient room for it to render completely. @default true" (useOverlayPosition.ts)
5. `crossOffset`: "The additional offset applied along the cross axis between the element and its anchor element. @default 0"
6. `keyboardActivation`: "Whether tabs are activated automatically on focus or manually. @default 'automatic'" (useTabList.ts)
7. `shouldForceMount`: "Whether to mount the tab panel in the DOM even when it is not currently selected. Inactive tab panels are inert and cannot be interacted with. They must be styled appropriately so this is clear to the user visually. @default false" (Tabs.tsx)
8. `selectedKey`: "The currently selected key in the collection (controlled)." (selection.d.ts)
9. `defaultSelectedKey`: "The initial selected key in the collection (uncontrolled)."
10. `onSelectionChange`: "Handler that is called when the selection changes."
11. `onPress`: "Handler that is called when the press is released over the target." (events.d.ts)
12. `onChangeEnd`: "Fired when the slider stops moving, due to being let go." (useSliderState.ts, off-pattern)
13. `step`: "The amount that the input value changes with each increment or decrement "tick"." (inputs.d.ts)
14. `minValue`: "The smallest value allowed for the input."
15. `triggerRef`: "The ref for the element which the popover positions itself with respect to. When used within a trigger component such as DialogTrigger, MenuTrigger, Select, etc., this is set automatically. It is only required when used standalone." (Popover.tsx)
16. `isNonModal`: "Whether the popover is non-modal, i.e. elements outside the popover may be interacted with by assistive technologies. Most popovers should not use this option as it may negatively impact the screen reader experience. Only use with components such as combobox, which are designed to handle this situation carefully." (usePopover.ts)
17. `preventFocusOnPress`: "Whether to prevent focus from moving to the button when pressing it. Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control." (useButton.ts)
18. `excludeFromTabOrder`: "Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available." (dom.d.ts)
19. `validate`: "A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead." (inputs.d.ts)
20. `className`: "The CSS [className](...) for the element. A function may be provided to compute the class based on component state. @default 'react-aria-Button'" (Button.tsx, repeated verbatim on every component)
21. `slot`: "A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent." (utils.tsx)
22. `render`: "Overrides the default DOM element with a custom render function. This allows rendering existing components with built-in styles and behaviors such as router links, animation libraries, and pre-styled components. Requirements: - You must render the expected element type (e.g. if `<button>` is expected, you cannot render an `<a>`). - Only a single root DOM element can be rendered (no fragments). - You must pass through props and ref to the underlying DOM element, merging with your own prop as appropriate." (utils.tsx)

Render-prop / data-attribute state, one comment covering both (Button.tsx `ButtonRenderProps`):

```ts
/**
 * Whether the button is keyboard focused.
 *
 * @selector [data-focus-visible]
 */
isFocusVisible: boolean;
```
Others: "Whether the button is currently hovered with a mouse. @selector [data-hovered]", "The orientation of the tabs. @selector [data-orientation="horizontal | vertical"]", "The placement of the popover relative to the trigger. @selector [data-placement="left | right | top | bottom"]" (Popover.tsx).

CSS variables are documented in the page, not JSDoc, as a prop on `PropTable`:
> `'--trigger-width': 'The width of the popover trigger element.'`, `'--trigger-anchor-point': 'The position of the trigger relative to the popover. Use with `transform-origin` when applying scale transitions.'` (Popover.mdx)
> `'--tab-panel-height': 'The height of the active tab panel in pixels. Useful for animations. Set when height, block-size, or all is used in the CSS transition.'` (Tabs.mdx)

Pattern for CSS variables: "The [measurement] of [thing]." then "Useful for X." or "Use with Y when Z."

### Ariakit prop descriptions

First-two-word counts across 520 AK prop comments: "Object returned" 123 (the `store` prop, same text on every part), "Whether the" 36, "Sets the" 36, "Determines if" 27, "Determines whether" 20, "A callback" 12, "Defaults to" 4. So Ariakit mixes "Whether", "Determines if/whether", "Controls" and "If set to `true`" freely.

Ariakit comments are long, include caveats as `**Note**:` paragraphs, and end with a "Live examples:" list of links to example pages that use the prop. Defaults are in `@default`. Some include `@example` code.

Verbatim (AK-src):

1. `open` (Dialog): "Controls the open state of the dialog. This is similar to the `open` attribute on native dialog elements."
2. `modal` (Dialog): "Determines whether the dialog is modal. Modal dialogs have distinct states and behaviors: - The `portal` and `preventBodyScroll` props are set to `true`. They can still be manually set to `false`. - When using the `Heading` or `DialogHeading` components within the dialog, their level will be reset so they start with `h1`. - A visually hidden dismiss button will be rendered next to the dialog if the `DialogDismiss` component hasn't been used. This allows screen reader users to close the dialog. - When the dialog is open, element tree outside it will be inert. @default true"
3. `hideOnEscape`: "Determines if the dialog will hide when the user presses the Escape key. This prop can be either a boolean or a function that accepts an event as an argument and returns a boolean. ... @default true"
4. `initialFocus`: "Specifies the element that will receive focus when the dialog is first opened. ... If left unset, the dialog will attempt to determine the initial focus element in the following order: 1. A Focusable element with an `autoFocus` prop. 2. The first tabbable element inside the dialog. 3. The first focusable element inside the dialog. 4. The dialog element itself."
5. `disabled` (Focusable): "Determines if the element is disabled. This sets the `aria-disabled` attribute accordingly, enabling support for all elements, including those that don't support the native `disabled` attribute. ... @default false"
6. `accessibleWhenDisabled`: "Indicates whether the element should be focusable even when it is `disabled`. This is important when discoverability is a concern. For example: > A toolbar in an editor contains a set of special smart paste functions that are disabled when the clipboard is empty ... Learn more on Focusability of disabled controls."
7. `clickOnEnter`: "If set to `true`, pressing the enter key while this element is focused will trigger a click on the element, regardless of whether it's a native button or not. If this prop is set to `false`, pressing enter will not initiate a click. @default true" (command.tsx)
8. `gutter`: "The distance, in pixels, between the popover and the anchor element. @default 0"
9. `shift`: "The skidding, in pixels, of the popover along the anchor element. Can be set to negative values to make the popover shift to the opposite side. @default 0"
10. `sameWidth`: "Whether the popover should have the same width as the anchor element. This will be exposed to CSS as `--popover-anchor-width`. @default false"
11. `flip`: "Controls the behavior of the popover when it overflows the viewport: - If a `boolean`, specifies whether the popover should flip to the opposite side when it overflows. - If a `string`, indicates the preferred fallback placements when it overflows. The placements must be spaced-delimited, e.g. "top left". @default true"
12. `unmountOnHide`: "When set to `true`, the content element will be unmounted and removed from the DOM when it's hidden. @default false"
13. `setOpen` (store): "A callback that gets called when the `open` state changes. @example const [open, setOpen] = useState(false); const disclosure = useDisclosureStore({ open, setOpen });"
14. `selectedId` (tab store): "The id of the tab whose panel is currently visible. If it's `undefined`, it will be automatically set to the first enabled tab."
15. `selectOnMove`: "Determines if the tab should be selected when it receives focus. If set to `false`, the tab will only be selected upon clicking, not when using arrow keys to shift focus. @default true"
16. `tabId`: "The `id` of the tab controlling this panel. This connection is used to assign the `aria-labelledby` attribute to the tab panel and to determine if the tab panel should be visible. This link is automatically established by matching the order of `Tab` and `TabPanel` elements in the DOM."
17. `orientation` (composite store): "Defines the orientation of the composite widget. If the composite has a single row or column (one-dimensional), the `orientation` value determines which arrow keys can be used to move focus: - `both`: all arrow keys work. - `horizontal`: only left and right arrow keys work. - `vertical`: only up and down arrow keys work. It doesn't have any effect on two-dimensional composites. @default "both""
18. `animated`: "Determines whether the content should animate when it is shown or hidden. - If `true`, the `animating` state will be `true` when the content is shown or hidden and it will wait for a CSS animation/transition to end before becoming `false`. - If it's set to a number, ... wait for the number of milliseconds to pass before becoming `false`."
19. `store`: "Object returned by the `useDialogStore` hook. If not provided, the closest `DialogProvider` component's context will be used. Otherwise, an internal store will be created."
20. `onFocusVisible`: "Custom event handler invoked when the element gains focus through keyboard interaction or a key press occurs while the element is in focus. This is the programmatic equivalent of the `data-focus-visible` attribute."

Ariakit documents data attributes in one place, the Styling guide, as `### [data-x]` headings with a sentence and a CSS snippet, not per component. Its site-rewrite notes add a rule for reference rendering: "A default such as `"false"` or `"0"` must remain visible." and "Required and optional props have separate sections." (app/docs/reimplementation/reference-and-code.md).

### Headless UI prop descriptions

Tables with Prop / Default / Description. Terse, one clause:
- "Whether the Dialog is open or not."
- "Called when the Dialog is dismissed (via outside click of the DialogPanel or by pressing the Esc key)."
- "The element or component the dialog panel should render as." (default `div`)
- "When true, the orientation of the `TabList` will be `vertical`, otherwise horizontal."
- "Whether the element should be unmounted or hidden based on the open/closed state." (default `true`)
- Data attribute and render prop share a row: "`data-selected` (Data Attribute) / `selected` (Render Prop) ... Whether or not the tab is selected."

### Takeaway

RA's JSDoc is the most consistent: one opener per prop kind ("Whether", "Handler that is called when", "The ..."), "(controlled)/(uncontrolled)" suffix, `@default` never in prose, `@selector` binding state to CSS. Ariakit's is the most informative per prop (it explains interactions between props and gives fallback order), at the cost of consistency. Headless UI's "Whether or not" is filler. A Xenon rule could be RA's openers with Ariakit's willingness to explain consequences in a second sentence.

---

## 5. Examples

### Titles

- RA-new: section headings are nouns naming a capability: `Events`, `Pending`, `Link buttons`, `Selection`, `Forms`, `Content`, `Value`, `Custom trigger`, `Custom anchor`, `Sheet`, `Controlled`, `Multi-thumb`, `Value scale`, `Input value`, `Fully controlled`, `Item actions`.
- Ariakit example pages: noun phrase titles ("Animated Dialog", "Warning on Dialog hide", "Tab with React Router", "Checkbox as button", "Submenu with Combobox") with a gerund description ("Animating ...", "Preventing ...", "Using ..."). Section headings inside are gerunds or noun phrases: "Preventing Dialog from closing", "Auto focus", "Re-triggering auto focus", "Controlling the Tab state", "Rendering a single TabPanel", "Reading the state".
- Headless UI: task phrases: "Showing/hiding the dialog", "Adding a backdrop", "Managing initial focus", "Adding a label", "Using as uncontrolled", "Rendering as different element".

### Intros

RA-new intros are one to three sentences, and the first sentence almost always starts "Use the `x` prop to ...":

> "Use the `isSelected` or `defaultSelected` prop to set the selection state, and `onChange` to handle selection changes. The `isIndeterminate` prop overrides the selection state regardless of user interaction." (Checkbox.mdx)
> "Use the `name` and `value` props to submit the checkbox to the server. Set the `isRequired` prop to validate the user selects the checkbox, or implement custom client or server-side validation. See the [Forms](forms) guide to learn more." (Checkbox.mdx)
> "Use the `defaultSelectedKey` or `selectedKey` prop to set the selected tab. The selected key corresponds to the `id` prop of a `<Tab>`. Tabs can be disabled with the `isDisabled` prop." (Tabs.mdx)
> "Use the `isOpen` prop to show a modal programmatically or mount in a different part of the JSX tree (e.g. outside a menu)." (Modal.mdx)
> "To position a popover relative to a different element than its trigger, use the `triggerRef` and `isOpen` props instead of `<DialogTrigger>`. `onOpenChange` will be called when the user closes the popover." (Popover.mdx)
> "By default, slider values are percentages between 0 and 100. Use the `minValue`, `maxValue`, and `step` props to set the allowed values. Steps are calculated starting from the minimum. For example, if `minValue={2}`, and `step={3}`, the valid step values would be 2, 5, 8, 11, etc." (Slider.mdx)

After the code there is usually no prose. The changed lines are marked in code with `///- begin highlight -///` so the reader's eye goes to the relevant prop.

Ariakit example pages use "we" and walk through the code in order, with each snippet showing only the relevant lines:

> "By passing the `open` and `onClose` props to the `Dialog` component, we can control exactly when the dialog is open and closed. When there are unsaved changes, instead of setting our `open` state within the `onClose` callback, we just open the nested warning dialog and prevent the default close behavior:" (dialog-hide-warning)
> "In this example, we're reading the `value` state from the checkbox store to render the button's text. This is done by using the selector form of the `useStoreState` hook:" (checkbox-as-button)

They also record failed approaches, which none of the others do:

> "We initially experimented with this example using a completely different accessibility tree. The popup was designated as a `grid` instead of a `dialog`. ... However, we encountered several problems that ultimately made the experience quite confusing:" then "We attempted the `grid` approach because we assumed that the `combobox` role wouldn't recognize `tab` as a valid `aria-activedescendant` target. However, it turns out that all major screen readers support this." (examples/combobox-tabs)

Each Ariakit example section ends by pointing to the guide that covers the concept in general: "You can learn more about controlled state on the [Component providers](/guide/component-providers#controlled-state) guide." (tab-react-router), "Learn more about reading the state on the [Component stores](...) guide." (checkbox-as-button).

### Controlled vs uncontrolled

- RA-new names both props in one sentence and shows the controlled version: "Use the `value` or `defaultValue` prop to set the slider's value. The `onChange` event is called as the user drags, and `onChangeEnd` is called when the thumb is released." The demo always renders the current value below the component (`<p>Selected tab: {tab}</p>`) so the reader can see the state change.
- RA-old split them into `### Default value` / `### Controlled value`: "Checkboxes are not selected by default. The `defaultSelected` prop can be used to set the default state." / "The `isSelected` prop can be used to make the selected state controlled. The `onChange` event is fired when the user presses the checkbox, and receives the new value." The new site merged these into one sentence and one example. Good cut.
- RA-new also documents the tricky case explicitly: "Both `inputValue` and `value` can be controlled simultaneously. However, each interaction will only trigger either `onInputChange` or `onChange`, not both. When controlling both props, you must update both values accordingly." (ComboBox.mdx, `### Fully controlled`)
- Ariakit explains the controlled/uncontrolled convention once, in the guide, with naming rules: "Conventionally, when dealing with dynamic state, the initial value passed to the store has its property name prefixed with the word `default`." / "You can take full control of the state by passing the exact property, without prefixes, ... In this case, the state will be considered controlled and the component will not update the state internally. It will only call the state setter." (guide/400-component-providers). Component pages do not repeat it.

### Takeaway

"Use the `x` prop to [outcome]." then an example with the relevant lines highlighted and visible state output is a compact, repeatable template. Ariakit's "explain the interesting lines of this example" pattern is the right one for longer recipes. Name controlled/uncontrolled once in a guide, then use one sentence per component.

---

## 6. Accessibility

### Labeling requirements

RA-old put this in every Anatomy section, with near-identical wording:
> "If a visual label is not provided (e.g. an icon only button), then an `aria-label` or `aria-labelledby` prop must be passed to identify the button to assistive technology." (Button)
> "In most cases, checkboxes should have a visual label. If the checkbox does not have a visible label, an `aria-label` or `aria-labelledby` prop must be passed instead to identify the element to assistive technology." (Checkbox)
> "If a dialog does not have a visible heading element, an `aria-label` or `aria-labelledby` prop must be passed instead to identify the element to assistive technology." (Dialog)
> "If there is no visual label, an `aria-label` or `aria-labelledby` prop must be passed instead to identify the slider and thumbs to screen readers." (Slider)

RA-new consolidates it into `quality.mdx`:
> "Most components should have a visible label, which is usually provided by rendering a `<Label>` element within it. This is associated with the component automatically. When a component doesn't have a visible label, it must have an aria-label or aria-labelledby prop to provide an accessible name."

and handles per-component cases inline where they come up: "Each thumb should have an `aria-label` to describe it for assistive technologies (provided via `thumbLabels` here)." (Slider.mdx, Multi-thumb).

The runtime warning (RA-src `react-aria/src/label/useLabel.ts`): "If you do not provide a visible label, you must specify an aria-label or aria-labelledby attribute for accessibility". Menu, Grid and GridList use: "An aria-label or aria-labelledby prop is required for accessibility." Ariakit uses `invariant()` for structural errors in labels (select-label.tsx, combobox-label.tsx) but I found no missing-label warnings.

Ariakit covers labeling inside prose where a specific component needs it: "The button should also have a label alongside the value, even if it's visually hidden." (menu.md, Menu vs Select). It also describes what the library does for you: "A visually hidden dismiss button will be rendered next to the dialog if the `DialogDismiss` component hasn't been used. This allows screen reader users to close the dialog." (Dialog `modal` JSDoc).

Headless UI states the mechanism: "Wrap a `Label` and `Checkbox` with the `Field` component to automatically associate them using a generated ID." / "Use the `Description` component within a `Field` to automatically associate it with a `Checkbox` using the `aria-describedby` attribute."

### Keyboard

- RA-old Features bullets: "**Accessible** – Uses a native `<button>` element under the hood, with support for the <Keyboard>Space</Keyboard> and <Keyboard>Enter</Keyboard> keys." and "**Keyboard navigation** – Select can be opened and navigated using the arrow keys, along with page up/down, home/end, etc. Auto scrolling, and typeahead both in the listbox and on the button, are supported as well." (Select)
- RA-new: no keyboard tables. Keyboard behavior appears only when a prop changes it ("By default, Table uses arrow key navigation to move focus into cells. Set `keyboardNavigationBehavior="tab"` to have <Keyboard>Tab</Keyboard> move focus in and out of a cell." Table.mdx) or in Toast's rare Accessibility section: "Toast regions are landmark regions that can be navigated using <Keyboard>F6</Keyboard> to move forward and <Keyboard>Shift</Keyboard> + <Keyboard>F6</Keyboard> to move backward."
- Ariakit: keyboard behavior appears as a section only when it deviates from native: "By default, native button elements are clicked during the <kbd>Enter</kbd> keydown and <kbd>Space</kbd> keyup events. ... Ariakit will ensure that both <kbd>Enter</kbd> and <kbd>Space</kbd> activate the button." (button.md). Otherwise it defers to the linked WAI-ARIA pattern.
- Headless UI: a `Keyboard interaction` table on every page, Command | Description, e.g. "ArrowLeft and ArrowRight: Selects the previous/next non-disabled tab", "Enter or Space (when `manual` is set): Activates the selected tab", "Esc: Closes any open Dialogs".

### Screen reader behavior and warnings

RA-new uses `<InlineAlert variant="notice"><Heading>Accessibility</Heading>` callouts for things the developer can break. 13 of 22 callouts on component pages are titled "Accessibility". They are imperative and specific:

> "The `ProgressBar` must be in the accessibility tree as soon as the button becomes pending, even if it is not visible. To delay showing a spinner until a minimum amount of time passes, use `opacity: 0`. Do not use `visibility: hidden` or `display: none` as these remove the element from the accessibility tree." (Button.mdx)
> "Interactive elements (e.g. buttons) within menu items are not allowed. This will break keyboard and screen reader navigation. Only add textual or decorative graphics (e.g. icons or images) as children." (Menu.mdx)
> "Tooltips are not shown on touch screen interactions. Ensure that your UI is usable without tooltips, or use an alternative component such as a PreviewTrigger or a Popover to show information in an adjacent element." (Tooltip.mdx)
> "Any `<Pressable>` child must have an interactive ARIA role or use an appropriate semantic HTML element so that screen readers can announce the trigger. Trigger components must forward their `ref` and spread all props to a DOM element." (Modal.mdx, Popover.mdx)

It also explains announcements concretely: "By default, ColorSwatch includes a localized color description for screen reader users (e.g. "dark vibrant blue"). ... In this example, a screen reader will announce "Fire truck red, Background color"." (ColorSwatch.mdx)

RA-old documented automated-tool false positives: "Select may trigger a known accessibility false positive from automated accessibility testing tools. This is because we include a visually hidden select element alongside the Select ..." (RA-old Select.mdx). The new site moved that to a wiki link in quality.mdx.

### Takeaway

The strongest accessibility writing is the specific kind: which CSS property breaks the accessibility tree, what a screen reader will say, which children break navigation. RA-new has this but lost the per-component labeling line and the keyboard summary when it cut the Features/Anatomy sections. Headless UI's keyboard table is the most useful artifact of the three for a headless library, where the developer can't see the behavior in the styles. Xenon could combine: a keyboard table per component plus RA-style specific warnings, with the labeling rule stated per component in one sentence.

---

## 7. Guides

### How they open

Both libraries open each guide with a one- or two-sentence description block that states the scope, then go straight into `##` sections. No "In this guide you will learn".

- RA styling: "React Aria does not include any styles by default. Learn how to build custom designs to fit your application or design system using any styling solution."
- RA customization: "React Aria is built using a flexible and composable API. Learn how to use contexts and slots to create custom component patterns, or mix and match with the lower level Hook-based API for even more control over rendering and behavior."
- AK styling: "Ariakit provides unstyled components by default. You're free to style them using your favorite styling method."
- AK composition: "The `render` prop makes Ariakit components more versatile, allowing you to easily replace the default HTML element or enhance its features with custom components."
- AK component stores: "Access and manipulate the state of Ariakit components in a performant way through component stores."
- AK getting started: "Ariakit is an open source library that provides lower-level React components and hooks for building accessible web apps, design systems, and component libraries."

### How Ariakit teaches (composition guide as the model)

`guide/300-composition/readme.md`, about 350 lines, is the best teaching page in either repo. What it does:

1. **Every concept is anchored to a real example page.** "For instance, the [Textarea with inline Combobox](/examples/combobox-textarea) example uses the `render` prop to replace the default `input` element ... with a `textarea` element." Three concrete cases before any rule.
2. **Input and output side by side.** For prop merging, each bullet pairs the JSX with the resulting HTML:
   > "Props passed directly to the rendered element will override the original component props:" `<ComboboxItem id="item" render={<a id="link" />} />` → `<a id="link">...</a>`
3. **Rules are stated precisely, including edge cases.** "The `style`, `className`, `ref` and event props will be automatically merged. In all other cases, defined rendered element props, including `null`, will override the original component props. Props set to `undefined` will be ignored."
4. **Bad/better pairs** in a two-column grid with ❌/✅ comments: "// ❌ Nesting inside render" vs "// ✅ Better", under a titled note "Flat is better than nested".
5. **Escalation order.** Changing the element → custom components → explicit render function → merging in the function → requirements for custom components. Each section adds one idea.
6. **Requirements as a numbered list** with a code sample that highlights the relevant lines (`{8,9,12,15}`): "1. Spread all props onto the underlying element. 2. Forward the `ref` prop and merge it with the internal ref, if any. 3. Merge the `style` and `className` props ... 4. Chain the event props with the internal event handlers, if any."
7. **Reassurance tied to fact.** "This is a common pattern in most modern component libraries, so you shouldn't have problems with them."
8. **Ends with "Next steps"** cards to two guides.

The component stores guide does the same with state: default → setters → controlled → reading (entire state, one property, computed, on events) → writing → context. Each step one short paragraph plus a 3–6 line snippet with the new identifier highlighted (```` ```js "setValues" ````). It explains *why* in one clause where it matters: "You can read the current state directly from the store using `store.getState()`, which won't trigger a re-render on the component."

It also uses analogy to existing platform concepts: "The `store` prop on Ariakit components serves as a means to establish connections between different parts of the same widget. It functions in a similar manner to HTML attributes such as `aria-labelledby`, `aria-describedby`, `aria-controls`, and `for`." (guide/400-component-stores)

### React Aria guides

RA's customization guide is organized the same way (concept → example → rule) but with more abstract framing:
> "The React Aria Components API is designed around composition. Components are reused between patterns to build larger composite components. For example, there is no dedicated `NumberFieldIncrementButton` or `SelectPopover` component. Instead, the standalone Button and Popover components are reused within NumberField and Select."

Good concrete move there: naming the component that *doesn't* exist to explain the architecture.

Rules for the `render` prop are in a callout titled as an instruction: "Follow these rules to avoid breaking the behavior and accessibility of the component:" then "Always render the expected element type (e.g. if `<button>` is expected, do not render an `<a>`). You will see a warning in development if a mismatch is detected." (customization.mdx)

RA's styling guide compares its states to CSS the reader already knows:
> "`data-pressed` – like the `:active` pseudo class, but removed when the pointer is dragged off. `data-hovered` – like `:hover`, but not applied on touch devices, preventing sticky hover states. `data-focus-visible` – like `:focus-visible`, but not on input click or programmatic focus." (quality.mdx)

And flags gotchas with "Note that": "Note that the `data-entering` state is only applied for one frame when using CSS transitions. The transition itself should be assigned in the default state." / "Note that unlike CSS transitions, keyframe animations are not interruptible."

Getting started is a numbered tutorial: "In this tutorial, we'll build a custom Select component." with steps "Import and assemble the parts" / "Add your styles" and the key idea in one line: "Each React Aria component renders a single DOM element. Complex components like `Select` compose together multiple parts to build a complete pattern."

### Length

RA guides ~830 prose words; AK guides ~640. Both keep sections short (one or two paragraphs) and let code carry most of the content.

---

## 8. Voice

**Person.** Both use "you" for the reader. RA-new component pages barely address anyone (28 "you" in 9k words); they are imperative ("Use the `x` prop to..."). Guides use "you" freely. "We" is rare in RA (reserved for "our blog post", "we recommend") and in AK component pages, but common in AK example pages (123 in 10k words), where "we" means "the author and reader walking through this code": "we can control exactly when the dialog is open and closed".

**Sentence length.** RA-new component prose has a 13-word median, 22 at p90. Ariakit runs longer (17 median, 34 p90 in guides, 45 p90 in examples) because it packs conditions into one sentence. Example of an Ariakit sentence that runs too long: "This event fires when a close is requested through the `hide`, `setOpen`, or `toggle` functions of the dialog store, of a store that the dialog store receives through the `combobox` or `popover` options, such as the combobox store of a menu, or of a store that receives the dialog store through the `disclosure` option, such as a combobox in the dialog." (Dialog `onClose` JSDoc)

**Hedging.** Low in both. RA uses "must" (22) more than "should" (13) on component pages and saves "may" for real uncertainty. Ariakit: "should" 6, "must" 1, "may" 3 on component pages. Neither says "simply" on component pages; Ariakit examples use it 3 times.

**Marketing words.** RA-new is almost free of them ("powerful" once, in customization: "provides powerful composition capabilities"). RA-old's Features bullets were where the marketing lived: "Styleable", "Flexible", "High quality interactions", "for easy styling" (32 "easy/easily" in RA-old vs 1 in RA-new). Ariakit's descriptions carry SEO phrases ("autocomplete & autosuggest functionalities", "Raycast-style", "Notion-style"). Headless UI is the most promotional ("jam-packed", "robust", "Easily create").

**Callouts.** RA-new: 22 callouts across 60 pages, most titled "Accessibility", each 1–3 sentences. Ariakit: about 25 `<aside>` across all pages, titled with the actual point ("Flat is better than nested", "What about tree shaking?", "Need to render a native checkbox element?", "Do not use any selectors that are not listed below"). Ariakit's `danger` asides are for rules that break things; `note` for side information. A titled aside whose title is a question or the rule itself is better than a generic "Note".

**Caveats.** RA puts them in the prop JSDoc, blunt: "Caution, this can make the button inaccessible and should only be used when ..." / "Most popovers should not use this option as it may negatively impact the screen reader experience." Ariakit puts them in `**Note**:` paragraphs in JSDoc and in styling sections: "It's important to note that, to avoid doing unnecessary work, the `data-active` attribute is not applied to components that are rendered as `button` elements. Therefore, you should use both the `:active` and `[data-active]` selectors to keep your styles consistent."

**Explicitly avoided.** No doc writing guide in either repo, so "explicit" rules are thin. What exists:
- Ariakit styling guide forbids a class of selectors: "Ariakit renders elements with HTML attributes, such as `role`, that should not be used as CSS selectors as they're not part of the public API and may change in future minor and patch releases."
- Ariakit coding guidelines for doc examples: prefer `interface`, named functions in `forwardRef`, and namespace imports "When importing components from Ariakit and the import statement expands to multiple lines". Each rule shows ❌/✅ code and a reason.
- React Spectrum API guidelines (specs/api/Guidelines.md) set vocabulary the docs then follow: "Name boolean props starting with `is` when they represent a state", "Use platform agnostic event naming where possible. E.g. `onPress` instead of `onClick`", "Use present tense for event names, e.g. `onChange` not `onChanged`", "never use `left` or `right` as alignment or positioning names. Instead use `start` or `end`".
- React Spectrum PR guidance on comments: "trim verbose comments so the diff reads cleanly. When a genuinely complex section still warrants a comment, prefer a higher-level explanation of the whole section over annotating individual lines." (docs/contributing/pull-requests.md)
- The RA old→new rewrite is itself an implicit rule: no per-page Features, no repeated Styling/Customization boilerplate, no separate default/controlled sections.

---

## 9. Things that read badly (anti-patterns to avoid)

1. **Repeated boilerplate per page.** RA-old's "Starter kits" paragraph ("To help kick-start your project, we offer starter kits that include example implementations of all React Aria components with various styling solutions. All components are fully styled, including support for dark mode, high contrast mode, and all UI states...") and the Styling section ("React Aria components can be styled in many ways, including using CSS classes, inline styles, utility classes (e.g. Tailwind), CSS-in-JS (e.g. Styled Components), etc.") appeared on ~50 pages. RA deleted them. Same for Ariakit's repeated `"Object returned by the useXStore hook. If not provided, the closest XProvider component's context will be used."` (123 copies in JSDoc).

2. **Features bullets that restate the category.** "**Styleable** – Hover, press, and keyboard focus states are provided for easy styling. These states only apply when interacting with an appropriate input device, unlike CSS pseudo classes." appears nearly verbatim on Button, Checkbox, Tabs, Disclosure. The second sentence is useful once, in a guide.

3. **"X can be built with native Y, but..." openers.** RA-old Features always started this way: "Checkboxes can be built with the <input> HTML element, but this can be difficult to style. `Checkbox` helps achieve accessible checkboxes that can be styled as needed." / "There is no built in way to create popovers in HTML. `Popover` helps achieve accessible popovers that can be styled as needed." Formulaic, and "helps achieve" is vague. Some are also out of date: "The HTML <dialog> element ... is not yet widely supported across browsers" (RA-old Dialog.mdx).

4. **Marketing adjectives in the one-liner.** Headless UI: "fully-managed, renderless ... jam-packed with accessibility and keyboard features, perfect for ...". Says nothing about what the component does.

5. **SEO filler in descriptions.** Ariakit: "... performing a delete operation in React", "Fill in a React input field with autocomplete & autosuggest functionalities", "Organizing Combobox items into labelled groups ... in React." The trailing "in React" adds nothing on a React docs site.

6. **"Whether or not."** Headless UI's standard boolean opener ("Whether or not the checkbox is checked."). "Whether" is enough.

7. **Mixed openers for the same prop kind.** Ariakit uses "Whether", "Determines if", "Determines whether", "Controls", "Indicates whether", "If set to `true`", "When set to `true`" for booleans. Readers scanning a prop table lose the pattern.

8. **Overlong conditional sentences in JSDoc.** Ariakit's `onClose` (quoted in section 8) and `focusOnHover` ("Defaults to `false`, or `true` when the item is used with a `ComboboxSelect`. Regardless of the value, hover has no effect while the combobox is closed: hovering an item never activates it or moves focus, and moving the pointer off an item never clears the active item or moves focus back to the combobox."). Split into a list of cases, as Ariakit does well for `flip` and `orientation`.

9. **Pages with nothing but scaffolding.** Ariakit tab.md and popover.md are title + description + playground + API tree + related cards. No guidance on the one or two things people get wrong with tabs (panel association, manual vs automatic activation). RA-new's Disclosure page is similarly thin: two sentences under `Expanding` and two under `Content`.

10. **Losing per-component accessibility when consolidating.** RA-new moved labeling into quality.mdx and dropped keyboard summaries. The component page for Slider no longer says a label is required unless you read the multi-thumb note. Consolidate mechanics, keep the component-specific requirement.

11. **Typos in generated headers.** "It is composed of a a header" (Disclosure JSDoc, rendered as page description); "Reseting the value of a Combobox" (Ariakit ComboboxCancel example). When the JSDoc is the page header, JSDoc needs the same review as page prose.

12. **Link-only "learn more" endings.** "Read our blog post to learn more.", "See the Forms guide to learn more.", "Learn more on the Styling guide." are fine once, but Ariakit ends almost every section with one ("Learn more on the [Styling](/guide/styling) guide." appears on select, menu, combobox, disclosure). Link the specific anchor and say what's there, as Ariakit does in its better lines: "You can learn more about controlled state on the [Component providers](/guide/component-providers#controlled-state) guide."

13. **Callout titles that don't say anything.** "Note", "Important to know". Ariakit's best titles state the point ("Flat is better than nested"); RA's "Accessibility" at least signals category. "Note:" in bold at the start of a paragraph (RA-old: "**Note:** The `ProgressBar` must be in the accessibility tree...") is weaker than either.

---

## Patterns worth copying, short list

- JSDoc as the single source for descriptions and props (both libraries), with RA's openers: "Whether ..." / "Handler that is called when ..." / "The ...", plus "(controlled)"/"(uncontrolled)", `@default` only in the tag.
- One comment per state that names both the render-prop value and the selector (`@selector [data-focus-visible]`). For Xenon, a `data-*` attribute and its signal/accessor could share one line the same way.
- Component page = description, live demo, "Use the `x` prop to ..." sections, anatomy tree with slots, prop tables per part.
- Guides for everything shared: styling hooks, composition (`render`/`As`), controlled state, labeling.
- Ariakit's teaching moves: real example first, input→output pairs, ❌/✅ pairs with a reason, numbered requirements, titled asides that state the point, "we tried X, it failed because Y" notes for non-obvious accessibility decisions.
- Headless UI's per-component keyboard table.
- RA's specific accessibility callouts: name the property or pattern that breaks things and the alternative.
