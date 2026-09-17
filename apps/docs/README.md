# Xenon docs

Astro 7, MDX content collections, Tailwind CSS 4, and Solid 2.0.0-rc.8.

```sh
bun install
bun run --filter @xenon/docs dev
bun run --filter @xenon/docs typecheck
bun run --filter @xenon/docs build
```

The home page is intentionally minimal. `/dev/button/`, `/dev/tabs/`, `/dev/combobox/`, `/dev/breadcrumb/`, and `/dev/codeblock/` are working
playgrounds for the documentation site's primitives, with light and dark specimens.
MDX documents can be added under `src/content/docs/`; the collection and dynamic
route remain configured for future documentation.

## UI components

`src/components/ui/button.tsx` wraps `@xenon/solid/button`. CVA defines `default`
and `outline` variants and `sm`, `default`, `lg`, `icon-sm`, `icon`, and `icon-lg`
sizes. The standard button and icon sizes are 44px tall; compact icons are 32px.
The small and large text sizes extend the Paper default using the same styling.

```tsx
import { Button } from './components/ui/button'

<Button onClick={save}>Save changes</Button>
<Button variant="outline" size="icon" aria-label="Open menu">
  <MenuIcon />
</Button>
<Button as="a" href="/" variant="outline">Documentation</Button>
```

Use the headless library's `as` prop for polymorphism. `disabled`, `pending`,
`focusableWhenDisabled`, event handlers, and refs pass through to the primitive.
`class` overrides are merged with `cn`, using clsx and tailwind-merge.

`src/styles/tokens.css` contains Paper's semantic color tokens. Set
`data-theme="dark"` or `data-theme="light"` on a container to choose a palette.
Button focus uses the pink `sidebar-primary` role from the button artboard.
Typography uses locally hosted IBM Plex Sans. Hover lifts by 2px, active resets
the shadow and position, and reduced motion removes the lift.

Design source: [Xenon Docs / Docs component registry](https://app.paper.design/file/01M2F4KJ8ZEQT7KFB882SWQYQK/3-0),
Button and Icon button artboards.

## Tabs

`src/components/ui/tabs.tsx` wraps `@xenon/solid/tabs` with `Tabs`, `TabsList`,
`TabsTrigger`, and `TabsContent` exports. Supply an accessible name on the list
and matching trigger/content values. Use these for in-page panels; route navigation
will be a separate composition of links.

```tsx
<Tabs defaultValue="preview">
  <TabsList aria-label="Example views">
    <TabsTrigger value="preview">Preview</TabsTrigger>
    <TabsTrigger value="code">Code</TabsTrigger>
  </TabsList>
  <TabsContent value="preview">Example preview</TabsContent>
  <TabsContent value="code">Example source</TabsContent>
</Tabs>
```

Controlled selection, manual activation, vertical orientation, direction, disabled
state, refs, and polymorphic hosts pass through to the headless library. Inactive
panels remain mounted. Paper's selected state uses the `tab-active` color role,
which maps to `primary` in light mode and `sidebar-primary` in dark mode.

## Combobox

`src/components/ui/combobox.tsx` styles `@xenon/solid/combobox` with
`inputPlacement="popup"`. The closed button shows the selection; the popup focuses a search input.
Search filters options without changing the committed value. Enter or a click
selects; Escape dismisses and returns focus to the trigger.

```tsx
<Combobox items={items} defaultValue="solid">
  <ComboboxTrigger aria-label="Framework">
    <ComboboxValue placeholder="Choose a framework" />
  </ComboboxTrigger>
  <ComboboxContent aria-label="Choose framework">
    {(items) => (
      <>
        <ComboboxInput aria-label="Search frameworks" placeholder="Search frameworks…" />
        <ComboboxViewport aria-label="Frameworks">
          <For each={items}>
            {(item) => <ComboboxItem value={item.value}>{item.label}</ComboboxItem>}
          </For>
        </ComboboxViewport>
        <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
      </>
    )}
  </ComboboxContent>
</Combobox>
```

Items have a unique `value`, a searchable `label`, and optional `disabled` state.
The trigger uses CVA sizes `default` and `sm`, with intrinsic height and em padding.
Options reserve a checkmark column; keyboard highlight is independent of selection.
Wrap related items in `ComboboxGroup label="Solid 0.4.x"` for a named group.
Groups disappear when none of their options match the search.
Supply styled `ComboboxItem` children to the list. Keep the content in the themed
container so the native top-layer popup inherits its tokens.

`Content` and `Viewport` accept static children or an `(items) => JSX` callback.
The callback receives a live readonly array of filtered root items. Read it in
tracked JSX, such as `<For each={items}>`; no second collection prop is needed.
Filtering preserves the callback's sibling controls and the input's focus/caret.

The headless root owns query, selection, form participation, positioning, and focus.
`Trigger` anchors a dialog `Content`; `Input` searches the listbox inside `Viewport`.
`Value` displays the committed label, independently of the search text.
The default headless `inputPlacement="trigger"` keeps the editable input outside.
Chevron artwork stays in the styled trigger. `Arrow` is only for an optional popup
pointer, and also expects consumer-provided artwork.
Framework/version metadata remains a future composition.

## Breadcrumb

`src/components/ui/breadcrumb.tsx` wraps `@xenon/solid/breadcrumbs` with `Breadcrumb`,
`BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, and
`BreadcrumbSeparator` exports. The root is a `nav` labelled "Breadcrumbs"; pass
`aria-label` to rename it. Nothing is inferred: put a separator inside each entry
that has one, and mark the current page with `BreadcrumbPage` or `current` on a link.

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/docs/components/">Components</BreadcrumbLink>
      <BreadcrumbSeparator />
    </BreadcrumbItem>
    <BreadcrumbItem>
      <BreadcrumbPage>Button</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

The default list is the context strip from Paper: 48px tall with a bottom rule,
muted links that turn `sidebar-primary` on hover, a foreground slash separator,
and a foreground current label. Keyboard focus uses the grey `ring` outline rather
than the pink control outline. `BreadcrumbList variant="compact"` drops the rule
and height, tightens the slash to its link, and renders links in the foreground color.
The playground composes it with a menu `Button` and a `sm` `Combobox` trigger for the
component selector shown on the artboard; that selector is not part of this file.

## Icons

`src/components/icon/index.tsx` renders icon data from the framework-free `lucide`
package. `lucide-solid` is compiled against Solid 1's `solid-js/web` runtime and
`splitProps`, neither of which exists in Solid 2, so it cannot load here. The core
package exports each icon as `[tag, attrs]` tuples, and `Icon` maps them into an
`svg` with lucide's defaults except stroke width, which is 1.5 to match the artboards.
Icons are `aria-hidden` unless you pass a label. Named imports tree-shake; the code
block page ships three icons in about 5KB.

```tsx
import { Copy } from 'lucide'
import { Icon } from '../icon'

;<Icon icon={Copy} />
```

## Copy button

`src/components/copybutton/index.tsx` is an icon button over `ui/button` with a
`createCopy` helper. `createCopy(text, { resetAfter })` owns the clipboard call,
the copied or error state, and the timer that returns it to idle after two seconds.
`CopyButton text="…"` swaps its icon and accessible name between Copy, Copied,
and Retry copy, colors the error state destructive, and announces the result through
a visually hidden `role="status"` span so focus never moves.

## Code block

`src/components/codeblock/` renders highlighted source with a filename bar and actions.
Highlighting is not a Solid concern. `highlight(code, lang)` in `highlight.ts` calls
shiki at build time and returns markup with both palettes inlined as `--shiki-light`
and `--shiki-dark` variables; `global.css` picks one per `data-theme`. Call it from
Astro frontmatter and pass the result in, because the local Solid bridge only renders
synchronous islands. Keep `highlight.ts` out of client code so shiki stays server-side.

```astro
---
import { highlight } from '../components/codeblock/highlight'
const html = await highlight(source, 'tsx')
---

<Snippet code={source} html={html} client:load />
```

```tsx
<CodeBlock code={props.code} html={props.html} lang="tsx">
  <CodeBlockHeader>
    <CodeBlockTitle>button.tsx</CodeBlockTitle>
    <CodeBlockAction as="a" href="/dev/button/" aria-label="Open playground">
      <ExternalIcon />
    </CodeBlockAction>
    <CodeBlockCopy />
  </CodeBlockHeader>
  <CodeBlockContent />
  <CodeBlockFooter>Anatomy source for Button.</CodeBlockFooter>
</CodeBlock>
```

`CodeBlock` takes both the plain `code` for copying and the `html` for display, and
shares them through context. `CodeBlockHeader` and `CodeBlockFooter` are only flex
rows with the Paper bar treatment: 40px, muted background, dashed rule. The layout
comes from the children; `CodeBlockTitle` pushes whatever follows it to the end.
`CodeBlockAction` is the borderless 32px icon button every bar control uses, and
`CodeBlockCopy` is that action wired to `CopyButton` with the block's source.
`CodeBlockContent` injects the markup; shiki's `pre` is the horizontal scroll target
and takes keyboard focus with the pink outline. Tooltips on actions come later with
the Tooltip primitive.

## Temporary Solid 2 integration

The published `@astrojs/solid-js@7.0.2` requires Solid 1. The local integration in
`integrations/solid/` uses `@solidjs/vite-plugin` and `@solidjs/web` for synchronous
server rendering and browser hydration. Each island has a separate hydration ID
and disposes its reactive scope on `astro:unmount`.

The bridge supports synchronous, props-only Solid components. Compose children
inside TSX components; Astro slots and async SSR need further integration work.
Replace this bridge when the official integration supports Solid 2.

The app uses standard TypeScript 6 because the workspace's aliased package does
not expose the programmatic API required by `astro check`.
