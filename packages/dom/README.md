# @xenon-ui/dom

Framework-free DOM interactions used by [`@xenon-ui/solid`](https://www.npmjs.com/package/@xenon-ui/solid):
focus scopes, layer stacking, floating positioning, modal behavior, toasts,
resizable panels and scroll areas.

You only need this package directly if you are writing an adapter for another
framework. Application code should use `@xenon-ui/solid`.

```sh
bun add @xenon-ui/dom
```

Subpaths mirror the modules, for example `@xenon-ui/dom/focus-scope`.

The published package is one bundled ESM file, `index.js`, and every subpath
is a one-line re-export from it. A bundler or dev server that resolves
`@xenon-ui/dom/focus-scope` loads that small file plus the shared bundle, never a module
graph of its own. The root exports everything the subpaths do, and
`sideEffects` is `false`, so unused parts are dropped from production builds
either way.

This is a pre-release. APIs can still move before 1.0.
