# Progress coverage scope

Round one exports a single `Progress` root. It has no label, indicator, track,
value, view or circular parts. `value: undefined` is indeterminate; `format` is a
callback receiving clamped range details. CSS gets `--progress-percentage`.
`docs/architecture.md` records these choices. Meter is not shipped.

The conformance file tests the compatible research IDs. Its additional
round-one contract tests cover clamping, zero-width and invalid bounds,
non-finite values, formatter arguments and replacement, and CSS property cleanup.
The same file passes in jsdom and Chromium. E2E also checks an update in the
production example. These additional cases do not claim that an upstream
indicator or formatting API exists.

Every remaining progress research ID is accounted for below. These are not
passing tests and their spec checkboxes stay unchecked.

| IDs                                            | Disposition                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| roles.5                                        | Author content constraint. The root cannot prevent consumers inserting a focusable descendant; the valid example is axe-tested.                                                |
| roles.6                                        | Author naming is exercised through named roots; generated label-part association is unshipped.                                                                                 |
| roles.7, roles.13, keyboard.2, a11y.2, notes.1 | Facts about the ARIA/axe/HTML research rather than a component behavior. No tests of axe's own role database.                                                                  |
| roles.8                                        | Competes with the shipped default: omitted value is indeterminate, not zero.                                                                                                   |
| roles.14, roles.15, pointer.2                  | Unshipped anatomy, live value part and circular geometry.                                                                                                                      |
| roles.16, roles.17                             | Chosen contract uses aria-valuetext and author naming; no generated label part. The name-overwriting alternative is rejected.                                                  |
| state.1–state.4                                | Native progress platform semantics. Shipped root defaults to div; native host normalization is not an advertised alternative controller.                                       |
| state.7, state.8, state.10                     | Indicator/value parts are unshipped. Root equivalents are covered by round-one tests, including zero-width and clamped ranges.                                                 |
| state.12–state.15                              | Unshipped part propagation and competing data attributes. Root uses explicit data-state.                                                                                       |
| state.16                                       | Root rejects non-finite values as tested; the bullet also requires unshipped value and indicator parts.                                                                        |
| state.17–state.20                              | Competing formatter APIs and unshipped visible value part. Shipped format callback is tested separately.                                                                       |
| state.22–state.26                              | Unshipped indicator geometry, circular and view parts.                                                                                                                         |
| forms.1                                        | Unshipped label part.                                                                                                                                                          |
| rtl.1                                          | Unshipped locale/Intl format props. Consumer format callbacks can implement localization.                                                                                      |
| ssr.1                                          | Covered for the shipped linear root by e2e/hydration.spec.ts: server value before JavaScript, unchanged DOM and IDs, and no hydration errors. Circular parts remain unshipped. |
| a11y.3                                         | Unshipped development warning. Missing names remain the author's responsibility.                                                                                               |
| a11y.4                                         | Common enabled axe rules exercised by a11y.1. Target-size/layout rule and every individual axe rule fixture are not claimed by that test.                                      |
| notes.4, notes.5                               | Unshipped parts/context and their public ref types.                                                                                                                            |
| notes.6                                        | Unshipped slot context API.                                                                                                                                                    |
| notes.7                                        | Consumer indicator transform belongs to consumer CSS; no indicator part.                                                                                                       |
| notes.8                                        | Unchosen library-specific data-progress-root attribute.                                                                                                                        |
