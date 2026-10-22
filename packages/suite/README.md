# Component conformance and browser tests

Run commands from `packages/suite`, or use `bun run --cwd packages/suite <script>`.

| Command                                      | Coverage                                                            |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `bun run test`                               | Conformance in jsdom                                                |
| `bun run test:browser`                       | Conformance plus browser-only cases in Chromium                     |
| `xenon_BROWSERS=webkit bun run test:browser` | Same component suite in WebKit                                      |
| `bun run test:browser:all`                   | Chromium, Firefox and WebKit                                        |
| `bun run test:e2e`                           | Full-page flows against the built suite fixture app in Chromium     |
| `bunx playwright test --project webkit`      | Same E2E flows in WebKit                                            |
| `bunx playwright test --project firefox`     | Same E2E flows in Firefox                                           |
| `bun run test:e2e:all`                       | E2E in all three engines                                            |
| `bun run spec:check`                         | Spec IDs with runnable tests, separate from TODO/skip registrations |

Install the desired browser with `bunx playwright install chromium`, `firefox`,
or `webkit`. CI Linux hosts may also need `bunx playwright install --with-deps chromium`.
On Ubuntu, install WebKit's system libraries as well as its browser binary:

```sh
bunx playwright install --with-deps webkit
xenon_BROWSERS=webkit bun run test:browser
bunx playwright test --project webkit
```

The dependency installation needs root privileges. The repository's Bun dev shell
alone does not supply WebKit's GTK, GStreamer, and TLS libraries. Test runs do not
need root once those dependencies are installed.

Each Playwright release expects specific browser revisions. Neither `bun install`
nor any test script downloads browsers, so run the install command again on a fresh
machine or cache, and after a lockfile change moves the `playwright` version. If
a run stops before any test with `browserType.launch: Executable doesn't exist at
.../chromium_headless_shell-<revision>/...`, the cache lacks that revision.
Browsers go to `~/.cache/ms-playwright` unless `PLAYWRIGHT_BROWSERS_PATH` names
another directory; set it to the same value for install and test commands.

On Debian/Ubuntu, the Nix dev and CI shells use `/usr/bin/ldd` for browser
dependency checks so Playwright can find the host-installed libraries. After
updating the flake, run `direnv reload`, or exit and re-enter `nix develop`.
Browser test commands then work without a manual `PATH` prefix.

WebKit is an engine target; this does not claim testing on shipping Safari or iOS.

E2E builds the suite-owned app in `fixtures/e2e-app` with `vite.e2e.config.ts`
and launches its preview server on port 4173, plus a
Solid SSR fixture server on port 4174. Occupied ports fail the run so stale
servers cannot supply a false passing result. Startup waits for each server's
readiness output; it does not probe closed ports, which can stall under WSL
network forwarding. The SSR tests check original
markup with JavaScript disabled, DOM and ID preservation through hydration,
and subsequent interactions.
Tests use real Playwright keyboard and pointer input. Failed runs retain traces,
screenshots and an HTML report under ignored output directories. Open the report
with `bunx playwright show-report`.

The component suite keeps spec IDs on tests. `*.test.tsx` runs in both jsdom and
browsers; `*.test-browser.tsx` contains cases requiring browser behavior. Put
native keyboard default actions, layout, animation timing and focus traversal in
the browser tier. Do not substitute dispatched DOM events for native behavior.
Full-page `e2e/*.spec.ts` tests exercise several components together and need not
claim an individual research spec ID.

`spec:check` counts source registrations, not passing assertions. Research specs
also include competing library APIs and unshipped features. Component scope notes
identify those explicitly; an unchecked bullet is not automatically a test gap
in the shipped API. A client render is never proof of SSR or hydration.

The nested native Field control regression now passes before JavaScript and
through hydration. `e2e/field-associations.spec.ts` also checks nested Fields,
author ID escaping and order, absent metadata, single child evaluation, native
Checkbox/Switch integration, custom-host prop compatibility and asynchronous
stream content. Custom hosts and metadata introduced after a streamed boundary
still use explicit IDs for forward references; see `src/field/README.md`.

The older Button, Checkbox, Switch, Toolbar and Composite placeholders are
classified in each directory's `coverage.md`. Shipped behavior has runnable
assertions; unshipped dependencies, rejected alternatives, framework-specific
contracts and browser research rules have explicit dispositions. Removing a
TODO registration does not claim that research behavior was implemented.
`e2e/legacy-hydration.spec.ts` covers their applicable server behavior.

Browser assertions follow native host behavior where xenon delegates to the
platform. Validation messages, native radio traversal, and implicit submission
are compared with plain HTML controls in the same engine. Browser-owned timing
uses eventual assertions, and synthetic pointer tests do not claim native
navigation coverage. The full-page E2E suite owns that coverage.
