# Docs site

Status: not started. This lists what `apps/docs` needs before we can write real
pages, based on the code as of `4931204` and the "xenon Docs" Paper file
(page "Docs v2 · Technical reference").

Most Paper boards still say "Tenon" and `@tenon/solid/...`. That was the old
name. Read it as xenon and `@xenon-ui/solid/...`.

## What exists

- UI wrappers in `src/components/ui`: Button, Tabs, Combobox, Breadcrumb,
  Collapsible, Drawer, Tooltip, Toast, Sidebar, Icon, ThemeToggle.
- Doc pieces: CodeBlock (title, copy, collapsible, footer), CopyButton,
  Example and ExamplePreview.
- Layout with a header, a sidebar that remembers its state, and theme boot.
- A `docs` MDX collection and a `/docs/[...id]` route. `src/content/docs/` has
  no content yet.

## Blockers

These break the first `.mdx` page.

### Solid islands can't take slots

`integrations/solid/server.ts` and `client.ts` throw when Astro passes slots.
So this fails in MDX:

```mdx
<Example>
  <ExamplePreview><Button>Save</Button></ExamplePreview>
</Example>
```

Plan: write the layout composites (Example, Section, Anatomy and the rest) as
`.astro` components and keep Solid islands at the leaves, one self-contained
demo component per example. Passing the default slot through as static HTML,
the way `@astrojs/solid-js` does with `<astro-slot>`, can come later if we need
it.

### Fenced code doesn't use CodeBlock

CodeBlock needs `html` from `highlight()`. That call is async, and the bridge
only renders sync components. Fences in MDX currently fall back to Astro's
built-in shiki and get none of our styling.

Plan: a `Code.astro` that awaits `highlight()` and renders the CodeBlock
island, mapped to `pre` through MDX `components`. Load example source with a
`?raw` import of the demo file so the preview and the code shown can't drift
apart.

## Content model

Each component has four pages in the design: Overview, Usage, API and
Accessibility. Each tab is a separate page with its own TOC and prev/next
links, and a tab strip under the title links the siblings. The current schema
only has `title` and `description`, and the route can't express this.

The schema needs:

- `section`: Start here, Guides, or Components. The directory page also groups
  components into Actions, Forms and Structure.
- `order` within a section.
- `component` and `tab` for component pages.
- `package` for the eyebrow above the H1 (`@xenon-ui/solid/button`).
- `status` for components still in draft ("· Draft API" in the eyebrow).

The sidebar, the components directory, the tab strip, breadcrumbs and prev/next
should all come from the collection. `lib/nav.ts` is hardcoded now, and its
links (`/installation/`) don't match the route (`/docs/installation/`).

The design's sidebar lists 14 library components: Accordion, Button, Checkbox,
Collapsible, Field, Form, Progress, Radio group, Separator, Switch, Tabs,
Toggle, Toggle group, Toolbar. Popover has boards too.

## Page frame

- Breadcrumb above every page ("Components / Button").
- Eyebrow with the package path, then H1 and description.
- Tab strip for component pages.
- Numbered section rows. Each row has a mono label in a left gutter
  (`01 / Example`), content on the right, and a rule between rows. Most pages
  are a stack of these, so build `Section` before prose styles.
- Right-hand "On this page" TOC with the active item highlighted.
- Prev/next cards at the bottom.
- Prose styles for `article.mdx`. `global.css` has no `.mdx` rules yet.

## Composites

Add each one when the first page needs it.

- **Example footer.** A bar under the preview with "Show code" on the left and
  a Tailwind On/Off toggle on the right. The toggle switches between styled
  and unstyled source, so each demo needs both versions. Nothing in
  `apps/docs` handles this yet. See the "Shell controls / Interaction states"
  board: hover lifts 2px with a 3px hard shadow over 120ms, press resets,
  reduced motion disables both.
- **Anatomy.** Live preview with dashed outlines around the parts, a code
  block titled "Anatomy", and a caption.
- **Prop row.** Name, type, default and description on the left, a titled
  code sample for that prop on the right. Popover's API page uses one row per
  part (Root, Trigger, Portal, Positioner, Content, Title, Description,
  Close) instead. `docs/plans/tsdoc.md` could feed the types and defaults.
- **Keyboard table** (Key, Behavior) and **state table** (State, In tab
  order, Activation). Plain styled tables.
- **Definition rows.** A bold term beside a short description. Used for
  Behavior, When to use, and the author checklist.
- **Callout, Kbd, package-manager install tabs.** Not drawn in Paper, but the
  Installation page will need them.

## Shell

- Header with "Search Ctrl K", a GitHub link and the theme toggle.
- Framework and version picker ("Solid 0.0.0") at the top of the sidebar.
- Mobile: a second bar with a menu button, the breadcrumb, and a component
  switcher dropdown in the last crumb. The sidebar opens as a drawer over a
  scrim.
- Focus states for tabs, nav items and the version picker are on the
  "Navigation / Keyboard focus states" board.

## Search

The "Search / Keyboard state" board shows a palette. Results are typed
(Property, Guide, Example) and show a path (Components / Button / API), and
the search is scoped to a version. Searching at the prop level means the index
has to include API data, not only page text. Combobox is the likely base.

## Pages with boards

- Button: Overview, Usage, API, Accessibility.
- Popover: Overview, Usage, API, Accessibility.
- Guides / Composition: `as` and `ref`, code samples only.
- Start here / Components: directory with a filter, a count, and grouped rows.
- Accordion anatomy pattern.

Every board has a dark variant and most have an 800px variant.

## Order

1. `Code.astro` with the `pre` mapping, `.astro` composites over Solid
   leaves, and `?raw` example sources.
2. Collection schema and routes for four-tab component pages. Generate the
   sidebar, directory and prev/next from it.
3. Page frame: Section, eyebrow, breadcrumb, tab strip, TOC, prev/next,
   prose styles.
4. Button's four pages against the boards, adding composites as each page
   needs them.
5. Shell extras: version picker, mobile bar with the component switcher,
   then search.
