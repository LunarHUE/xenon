# How primitive libraries write their docs

Three studies of docs source, read from shallow clones on 2026-09-27. They are
input for `.claude/skills/writing-docs`, which is the rulebook. This file records
what we took from each library and why, so the rules can be traced back.

| File | Libraries |
| --- | --- |
| [radix-and-base-ui.md](./radix-and-base-ui.md) | Radix Primitives, Base UI, MUI's Vale rules |
| [react-aria-and-ariakit.md](./react-aria-and-ariakit.md) | React Aria Components (old and new site), Ariakit, Headless UI |
| [kobalte-corvu-ark-bits.md](./kobalte-corvu-ark-bits.md) | Kobalte, Corvu, Ark UI with Zag, Bits UI |

Paths inside the studies point at `/tmp/docs-src/`, which is gone. Re-clone the
repo named at the top of each study to check a quote.

## What we took

**Say what each part renders.** Base UI ends every part description with
"Renders a `<button>` element." and Kobalte has a whole "Rendered elements"
table. Radix never says. Readers of a headless library need the tag to write
selectors and to know whether an `as` swap is safe.

**One-liners name a concrete thing plus one fact.** The best ones in every
library have the shape of Base UI's "A collapsible panel controlled by a
button." The worst say "component", "easily stylable" or "accessible", which
describe the library and not the widget.

**Fixed stems for each kind of prop.** React Aria is the only library that
keeps one stem per prop kind across its whole API, and its tables are the
easiest to scan. Every other library mixes three or four callback stems in a
single file. We keep the verb-first stems the Button API page already uses,
because they say what `true` does. "Whether" only names the state.

**Controlled and uncontrolled props point at each other.** Base UI does this on
every pair ("To render a controlled checkbox, use the `checked` prop instead.").
Kobalte adds which user actions fire the change callback and that it receives
the new value, which explains why `onOpenChange={setOpen}` works.

**"Use `x` to…" leads.** Ark and React Aria open example sections with this
shape. It puts the prop second and the effect third, and it fits the lead
paragraph of our `Section`.

**Keyboard table on every interactive component.** Radix, Kobalte and Headless
UI have one. React Aria dropped its tables when it slimmed its pages, and its
component pages now say nothing about keys. Rows follow Radix: verb first, with
"When focus is on X," for keys that depend on context.

**Say what the author still owes.** Base UI's accessibility overview and
Corvu's accordion heading note tell the reader what the library doesn't do.
Kobalte's "You are responsible for styling your tabs accordingly" is the model
sentence. Our Accessibility tab ends with an Author list for this.

**Shared mechanics live in guides.** React Aria cut its component pages from
about 1,500 words to 150 by moving styling, composition and controlled state
into guides. Radix, Kobalte and Bits still paste the same `asChild`,
`forceMount` and positioning text onto every part, and readers skip it.

**Name the trap and the fix.** The useful warnings name the exact thing that
breaks and what to do instead. React Aria: "Do not use `visibility: hidden` or
`display: none` as these remove the element from the accessibility tree." Ark:
"Unmounting `Dialog.Root` when toggling open state can break focus, scroll
lock, and cleanup."

## What we avoid

**Cloned pages with swapped nouns.** Every library ships this bug. Kobalte's
Slider props talk about "the radio group". Corvu's `End` key "moves to the
first trigger". Bits' Slider `disabled` says "switch". We write each page from
the component's source and specs, not from a sibling page.

**Descriptions that restate the name.** "The orientation of the component."
"Whether to enable lazy mounting." The type column already says that much.

**Features lists.** "Full keyboard navigation" and "Can be controlled or
uncontrolled" appear on nearly every Radix and Kobalte page. When every
component has the same bullets, the bullets carry no information.

**Marketing and SEO copy.** "High-quality" is on 36 Base UI meta descriptions.
Headless UI calls its dialog "jam-packed". Bits' guides open with "State
management is a critical aspect of modern UI development."

**Framework leakage.** Ark serves `React.lazy` and `className` to Solid readers
and never says that Solid's `asChild` props are an accessor. Xenon is
Solid-only, so we name signals, accessors and callback refs where they matter.

**Callouts for everything.** Bits has 22 callouts, and "Heads up!" is used both
as a tip and as a warning. Kobalte has 5 across 46 pages. Keep ours rare so
readers still read them.
