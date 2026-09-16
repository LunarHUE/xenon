# Xenon docs

Astro 7, MDX content collections, Tailwind CSS 4, and Solid 2.0.0-rc.8.

```sh
bun install
bun run --filter @xenon/docs dev
bun run --filter @xenon/docs typecheck
bun run --filter @xenon/docs build
```

The home page is intentionally minimal.
MDX documents can be added under `src/content/docs/`; the collection and dynamic
route remain configured for future documentation.

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
