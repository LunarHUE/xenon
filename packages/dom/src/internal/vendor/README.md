# Vendored dependencies

Source copied from upstream so `@xenon-ui/dom` has no runtime npm
dependencies. Each directory holds one upstream package, its LICENSE and a
PROVENANCE.md that names the upstream commit and every change made to it.

| Directory           | Upstream                                       | Version |
| ------------------- | ---------------------------------------------- | ------- |
| `floating-ui-utils` | `@floating-ui/utils` (floating-ui/floating-ui) | 0.2.12  |
| `floating-ui-core`  | `@floating-ui/core` (floating-ui/floating-ui)  | 1.8.0   |
| `floating-ui-dom`   | `@floating-ui/dom` (floating-ui/floating-ui)   | 1.8.0   |
| `tabbable`          | `tabbable` (focus-trap/tabbable)               | 6.5.0   |

The code lives under `src/internal/` because the build turns every other
directory in `src/` into a public subpath. Only `src/positioning` imports the
Floating UI copies, and only `src/focus-scope`, `src/floating-layer` and
`src/dialog` import tabbable.

Treat these files as upstream code, not as Xenon's own. Fix a bug here only
when the same fix exists upstream, or record it in PROVENANCE.md. To update,
copy the new upstream sources over these, apply the changes PROVENANCE.md
lists again, and run the ported tests next to them.

`eslint.config.js` relaxes two rules for the Floating UI directories:
`no-explicit-any` (upstream's platform types use `any`) and
`no-unused-expressions`, which still runs but allows `a && b()` calls.
