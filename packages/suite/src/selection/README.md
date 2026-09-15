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
