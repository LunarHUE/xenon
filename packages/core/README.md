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

This is a pre-release. APIs can still move before 1.0.
