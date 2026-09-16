# Docs scaffold

Astro 7 with its Vite build pipeline, MDX content collections, Tailwind CSS 4,
and the workspace's Solid 2.0.0-rc.8 runtime.

From the repository root:

```sh
bun install
bun run --filter @xenon/docs dev
```

Open `http://127.0.0.1:4321/` for the Astro page or `/docs/test/` for the MDX
collection entry. Both contain server-rendered Solid counters hydrated with
`client:load`. The two counters in MDX have independent state.

```sh
bun run --filter @xenon/docs typecheck
bun run --filter @xenon/docs build
bun run --filter @xenon/docs test
```

The smoke tests build and serve the production app, check HTML with JavaScript
disabled, and exercise hydration, increment/reset, state isolation, and Tailwind
styles in Chromium. Install the browser with `bunx playwright install chromium`
from this directory if needed.

## Files

- `src/content.config.ts` defines the docs collection and frontmatter schema.
- `src/content/docs/test.mdx` contains the test document and Solid islands.
- `src/pages/docs/[...id].astro` renders collection entries as static routes.
- `src/components/Counter.tsx` is shared by the Astro and MDX pages.
- `src/styles/global.css` imports Tailwind and styles Markdown elements.

## Temporary Solid 2 integration

The published `@astrojs/solid-js@7.0.2` requires Solid 1. This app uses a local
integration in `integrations/solid/` with `@solidjs/vite-plugin` and `@solidjs/web`
for synchronous server rendering and browser hydration. Each island receives a
separate hydration ID, and its reactive scope is disposed on `astro:unmount`.

The bridge is intentionally limited to synchronous, props-only Solid components.
Astro slots, async SSR, and additional JSX frameworks need further integration
work. Replace this bridge when the official integration supports Solid 2.

This app pins the standard TypeScript 6 package because the workspace's aliased
TypeScript package does not expose the programmatic API required by `astro check`.
