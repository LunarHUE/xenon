# @xenon/core

The behavior layer behind [`@xenon/solid`](https://www.npmjs.com/package/@xenon/solid).
Plain TypeScript, no framework and no DOM. Each component exposes a function that
takes options and returns state plus attribute and listener maps for its parts.

You only need this package directly if you are writing an adapter for another
framework. Application code should use `@xenon/solid`.

```sh
bun add @xenon/core
```

Subpaths mirror the components, for example `@xenon/core/dialog`.

This is a pre-release. APIs can still move before 1.0.
