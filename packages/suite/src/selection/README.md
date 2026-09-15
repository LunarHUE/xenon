# Selection browser coverage

`selection.test-browser.tsx` mounts the dedicated
`fixtures/selection.tsx` fixture through Solid's client renderer. Run it with:

```sh
xenon_BROWSERS=chromium,webkit bun run test:browser src/selection/selection.test-browser.tsx
```

The tests use Playwright keyboard and pointer input to check:

- Select trigger focus, disabled-option skipping, native required submission, payload and reset.
- Combobox typing and filtering, click and keyboard acceptance, Escape cancellation, input focus and reset.
- Listbox DOM focus movement, disabled-option skipping, independent multiple selections and deselection.
- CheckboxGroup native required validation after any item is checked, repeated form values and reset.
- Popup dismissal and ordinary Tab advancement, plus disabled native control focus and form exclusion.
- Axe scans before opening, with each popup open, and with controls disabled. The suite excludes color contrast and landmark-region coverage.

These client browser tests do not establish SSR, hydration, native OS input-method composition, or shipping Safari behavior. WebKit is the tested engine target.

## Focused regression suites

The sibling `listbox/`, `select/`, and `combobox/` directories add focused
coverage without changing this shared fixture:

- Listbox: native roving/virtual Tab order, external focus retention, typeahead
  boundaries, disabled collections, and removed range anchors.
- Select: native activation, clamped navigation, cancellation, typeahead,
  controlled selection, and native form reset.
- Combobox: search/selection independence, filtering, canceled selection,
  native caret editing, Space insertion, and Enter submission precedence.

Run the browser batch with:

```sh
xenon_BROWSERS=chromium,webkit bun run test:browser src/listbox src/select src/combobox src/selection
```

The reviewed batch adds 47 selection tests. Its jsdom subset passes all 18
tests. The browser run, including this directory's eight existing scenarios in
each engine, reports 108 passes and two failures out of 110 executions.
Both failures are `select.forms.14`: a native reset-button activation restores
the displayed uncontrolled default but leaves the hidden select's submitted
value empty. This regression is retained in Chromium and WebKit, not skipped
or counted as passing. Implementation repair is outside this test-only batch.
