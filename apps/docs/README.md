# Xenon docs

Astro 7, MDX content collections, Tailwind CSS 4, and Solid 2.0.0-rc.8.

```sh
bun install
bun run --filter @xenon/docs dev
bun run --filter @xenon/docs typecheck
bun run --filter @xenon/docs build
```

The home page is intentionally minimal. `/dev/button/` is a working
playground for the documentation site's primitives, with light and dark specimens.
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
