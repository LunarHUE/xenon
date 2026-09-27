---
name: writing-docs
description: How to write Xenon's docs site pages in apps/docs, including component pages (Overview, Usage, API, Accessibility), guides, example demos and page descriptions. Covers where facts come from, the page template for each tab, fixed sentence stems for props, parts, data attributes and keys, and the voice rules that keep the copy from reading as generated. Use whenever you write or edit an .mdx file under apps/docs/src/content, add a demo under apps/docs/src/examples, or turn TSDoc and specs into user-facing docs.
---

# Writing Xenon docs

Xenon is a headless component library for Solid 2. A reader arrives with one
question, such as "which element do I style?", "what happens on Escape?" or
"how do I control this?", and wants the answer in one sentence plus code. Write
for that reader.

These rules come from studying how Radix, Base UI, React Aria, Ariakit, Kobalte,
Corvu, Ark and Bits UI write their docs, and from the Button pages that already
ship. `docs/research/docs-writing/README.md` explains why each rule exists.
Read `references/patterns.md` before writing any prop, part, data attribute or
keyboard row. `references/mdx.md` covers the MDX components and the demo files.

## 1. Get the facts first

Never write a behavior you haven't confirmed in code. Every library we studied
ships wrong docs because someone copied a sibling page and swapped the nouns.
Kobalte's Slider page talks about "the radio group". Corvu's End key "moves to
the first trigger". Write each page from these sources, in this order:

1. `packages/solid/src/<component>/*.tsx`: props, defaults, parts, the default
   element each part renders, and the TSDoc.
2. `packages/core/src/<component>/*.ts`: the ARIA and `data-*` attributes each
   part gets, and when.
3. `docs/spec/<component>.md`: keyboard, focus and roles. Only `[x]` items are
   implemented. `[ ]` items are not, so leave them out of the docs.
4. The tests next to the source, when the spec and the code disagree. The tests
   win.
5. `docs/spec/styling-contract.md` for attribute naming across components.

The TSDoc is written for maintainers. "Controlled logical visibility when
defined; undefined uses internal state" is accurate but useless to a reader.
Translate it into what the reader does: "The open state. Pair it with
`onOpenChange` to control the popover." Don't paste TSDoc into pages.

When something is unclear, run the demo and check it. If you still can't
confirm a behavior, leave it out and tell the user what you couldn't confirm.

## 2. The component page

A component lives in `apps/docs/src/content/components/<slug>/`. There is one
file per tab, and a tab only appears if its file exists. Each tab answers one
kind of question.

### overview.mdx: what is it, and is it the right one?

Frontmatter carries `title`, `description` and `group` (`actions`, `forms`,
`structure`). Add `status: draft` while the API can still move.

The `description` is the line under the H1, and the directory and search reuse
it. Write a fragment: "A" or "An", a concrete noun, then the one fact that sets
this component apart from its neighbors. Aim for 6 to 14 words and end with a
period.

- Good: "A panel that opens from a trigger and stays anchored to it."
- Good: "A set of layered panels where only one is visible at a time."
- Bad: "An accessible, customizable popover component." Every Xenon component
  is accessible and unstyled, so neither word tells the reader anything.
- Bad: "A popover positioned relative to an anchor." It defines the word with
  itself.

Test: if the line could describe a sibling component (Tooltip, HoverCard or
Dialog for a Popover), add the fact that tells them apart.

Sections, in this order:

1. **Example.** One lead sentence saying when to reach for the component and
   which element it renders, then the hero `<Example>`. The demo should be the
   most common real use, not a feature tour.
2. **Anatomy.** An `<Anatomy>` with the full part tree as code. For a compound
   component, follow it with a `<Definitions>` list that gives each part's job
   in a few words. Mark optional parts as optional in both places.
3. **Behavior** or **When to use**. A `<Definitions>` list that separates this
   component from its neighbors and links to them. Button separates Button,
   Toggle and Link this way. Skip the section if there is no real confusion.

No Features list. "Full keyboard navigation" is true of every component, so it
tells the reader nothing about this one.

### usage.mdx: how do I do a specific thing?

One `<Section>` per task or prop. Title a section with the prop name when it is
about one prop (`pending`, `type`). Otherwise use a short sentence-case task,
like "Controlled state" or "Close after submit".

The first paragraph of a Section is its lead and renders large. Everything
after it renders small and muted. So:

- The lead is one or two sentences: "Use `x` to [outcome]." or "[Component]
  does [default]. Set `x` to [change]." It must make sense on its own.
- Later paragraphs are notes: a consequence, a trap, or what the reader still
  has to do.
- Put the demo in the `example` slot so it sits beside the text.

Start with the default behavior when the reader needs it to understand the
change, like "Button defaults to `type="button"`."

Stateful components get a **Controlled state** section. Show it once with
`createSignal`, and say which user actions call the change handler and that
the handler receives the new value:

> Pass `open` and `onOpenChange` to control the popover. `onOpenChange` runs
> when the trigger, Escape or an outside click asks to open or close, and
> receives the new state, so a signal setter works as is.

End with a **Tailwind** section, as Button's usage page does. It names the
state attributes the component sets and uses the styled demo.

### api.mdx: exact contract, for lookup

One `<Props>` group per part, in anatomy order. A single-part component has one
group titled Props.

- The first paragraph inside a part's `<Props>` says what the part is, then
  what it renders: "The button that opens the popover. Renders a `<button>`."
  If it renders no element of its own, say "Renders no element." This is the
  most important line for a headless reader, and most libraries leave it out.
- One `<Prop>` per prop, using the stems in `references/patterns.md`. Give each
  prop a code sample only when the sample shows something the sentence can't.
- Put the default in the `default` attribute and nowhere else. If the default
  depends on another prop, write it out: `default="true when modal"`.
- After the props, add an `<Attributes>` table for the part, inside its
  `<Props>` group. Use one `<Attribute>` per attribute, and give each value of
  an enum attribute its own row with `value`.
- Shared props like `as`, `ref` and `class` pass-through belong in the
  Composition guide. Document them on a part only when the part does something
  unusual with them, for example a non-default `as`, or a ref the part reads.
  Say it once in the `note` of the first group: "Native props are forwarded".

### accessibility.mdx: what the library does, and what you still owe

1. **Semantics.** Link the WAI-ARIA APG pattern the component follows, then say
   which roles and ARIA attributes Xenon sets and where the accessible name
   comes from. Show the labeling code when a name is required.
2. **Keyboard.** A `Key | Behavior` table for every key the component handles,
   including Tab and Shift + Tab. Write the rows with the stems in
   `references/patterns.md`, and group keys that do the same thing in one row.
3. **Focus.** Where focus goes on open, close, disable and remove. Use a table
   when state changes focusability, as Button does.
4. **Author.** A `<Definitions mono>` list of what the reader still has to do.
   This usually means a visible focus style, an accessible name, and any
   styling the behavior assumes, like a vertical layout for vertical tabs. Each
   item is an instruction.

## 3. Guides

Guides (`apps/docs/src/content/docs/`) cover anything that applies to more
than one component: composition with `as` and `ref`, styling with data
attributes, controlled state, animation and presence, and forms. When a
component page needs one of these, give the component-specific fact in one
sentence and link to the guide's anchor. Don't repeat the mechanism.

- Open with what the library does, stated plainly. No motivation, no "In this
  guide".
- One idea per Section, each with a small code sample. Build each Section on
  the one before.
- State the reader's obligations as a short list, then the consequence of
  breaking them. For example, "Spread `props` onto the element. Pass `ref`
  through. Otherwise Button can't attach its handlers."
- Show a wrong and right pair when the mistake is common, as two titled code
  blocks with one sentence each on why.

## 4. Voice

Read `references/patterns.md` for the before-and-after examples. The short
version:

- Address the reader as "you", or use the imperative. Use the component's name
  as the subject for behavior: "Popover moves focus to the content."
- Present tense. Write "closes" and "is ignored", not "will close".
- No "we". The docs describe the library. They don't narrate a team.
- One idea per sentence, and most sentences under 20 words. If a reader has to
  backtrack, split the sentence.
- Name the mechanism. Write "sets `aria-disabled` and keeps the tab stop", not
  "handles disabled state accessibly".
- State behavior flatly. Hedge only when behavior really varies, and then say
  what it depends on.
- No em dashes, and avoid parentheses. Use a period or a comma.
- Colons only before a list or a code block.
- Sentence case for headings and titles. Code-formatted prop names stay as
  written.
- Write "for example", not "e.g.". Write "that is", not "i.e.". Use US
  spelling.
- Bold is rare. `<Definitions>` terms are already bold.
- Use `<Callout>` only for a trap that silently breaks behavior or
  accessibility, at most once per page. A callout names the trap and the fix.

Banned words: simply, just, easily, easy, seamless, powerful, robust, flexible,
intuitive, comprehensive, crucial, leverage, utilize, ensure (write what
happens instead), out of the box, under the hood, fully accessible, "Whether
or not".

## 5. Solid specifics

Xenon is Solid-only, so write for Solid readers directly.

- Controlled examples use `createSignal`: `open={open()}` and
  `onOpenChange={setOpen}`. Check the callback signature first. Say so if it
  passes something other than the raw value.
- Refs are callbacks: `ref={(el) => (button = el)}`.
- Render callbacks, like Popover's `children` function, receive getters. Say to
  read them inside JSX or an effect.
- Components render once. If a prop is read only at mount, as `defaultOpen`
  is, say that later changes are ignored.
- Imports use subpaths: `import { Popover } from '@xenon-ui/solid/popover'`.

## 6. Demos

Every `<Example>` and `<Anatomy>` points at a file in
`apps/docs/src/examples/<slug>/`. The page shows the file's own source, so the
demo is the code sample. `references/mdx.md` has the conventions. In short:

- Name the file after what it shows (`pending.tsx`, `controlled.tsx`), and
  make the default export a real, small UI. Use real labels like "Save
  changes", never "Click me" or "Item 1".
- Every styled demo has an `.unstyled.tsx` twin with the same behavior and no
  classes.
- Styled demos use Tailwind only, with a visible `focus-visible` style.

## 7. Before you finish

- Run `bun run build` in `apps/docs`. A missing demo or bad MDX fails here.
- Don't run Prettier on MDX. It puts multi-line JSX in code fences on one line,
  and it can put a `;` before a sample that follows a statement.
- Look at every tab you touched in the browser, in light and dark mode.
- Grep your pages for the banned words, `—`, `will `, `we ` and `e.g.`.
- Grep for the names of sibling components. If the Slider page says "switch",
  a copied sentence came along.
- Check each `default`, rendered element, data attribute and key row against
  the source one more time.
- Commit each page or tab as its own `docs(site): ...` commit.
