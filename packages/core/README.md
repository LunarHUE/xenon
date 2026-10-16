# @xenon-ui/core

The behavior layer behind [`@xenon-ui/solid`](https://www.npmjs.com/package/@xenon-ui/solid).
Plain TypeScript, no framework and no DOM. Each component exposes a function that
takes options and returns state plus attribute and listener maps for its parts.

You only need this package directly if you are writing an adapter for another
framework. Application code should use `@xenon-ui/solid`.

```sh
bun add @xenon-ui/core
```

Subpaths mirror the components, for example `@xenon-ui/core/dialog`.

The published package is one bundled ESM file, `index.js`, and every subpath
is a one-line re-export from it. A bundler or dev server that resolves
`@xenon-ui/core/dialog` loads that small file plus the shared bundle, never a module
graph of its own. The root exports everything the subpaths do, and
`sideEffects` is `false`, so unused parts are dropped from production builds
either way.

This is a pre-release. APIs can still move before 1.0.
