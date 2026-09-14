# Separator coverage scope

Round one's default is native `hr`; a generic host gets `role="separator"`.
Horizontal omits aria-orientation; decorative gets role=none and no orientation.
These decisions are recorded in `docs/architecture.md`.

The conformance file covers every compatible shipped behavior, including dynamic
orientation/decorative updates, ref/props/events and axe for both hosts in both
orientations. It passes in jsdom and Chromium. Full-page E2E checks the production
example's semantic and decorative separators.

Remaining research IDs stay unchecked:

| IDs                | Disposition                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| separator.roles.5  | Superseded by the chosen implicit horizontal orientation in roles.4.                                                                                                                                                                                 |
| separator.roles.8  | Superseded by the native default in roles.7.                                                                                                                                                                                                         |
| separator.roles.11 | Unchosen library-specific marker attribute.                                                                                                                                                                                                          |
| separator.ssr.1    | Covered by e2e/hydration.spec.ts: the server emits a native separator, hydration preserves its DOM node and reports no runtime errors.                                                                                                               |
| separator.a11y.2   | Direct experiment resolves the question: the pinned axe version passes non-focusable separators without aria-valuenow. roles.2 verifies nonfocusability; a11y.1 runs axe on both hosts/orientations. The research's proposed failure does not apply. |
| separator.notes.2  | Unshipped slot context API.                                                                                                                                                                                                                          |
