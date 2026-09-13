# Conformance spec

One file per component. Each file is the merged, deduplicated list of testable
behaviors gathered from `docs/research/`, with every bullet tagged by which
libraries test it. The spec is the source of truth for `packages/suite`; the
research files are evidence and are not edited after they land.

## Format

```
## <component>
### <subsection>
- Given <setup>, when <action>, then <result>. [apg, react-aria, radix, base-ui, zag, ariakit, headlessui, kobalte, corvu, reka, melt, bits]
```

Subsections, in this order: Roles and attributes; Keyboard; Pointer; Focus
management; State; Forms; Dismissal and layering; Positioning; Animation and
presence; RTL and i18n; SSR and hydration; Accessibility tooling; Notes and
edge cases.

A bullet tagged `[apg]` is normative. A bullet tagged by one library only is a
candidate and says so with `(candidate)`. Browser quirks keep the browser
name in the bullet.

## Where tests live

- `packages/core` and `packages/solid` keep unit tests next to the code. They
  cover the controller contract and the adapter's wiring, not behavior.
- `packages/suite` is the conformance suite. It imports finished components
  from `@kit/solid`, mounts them through a small harness, and runs one test
  per spec bullet. A component is done when its spec file has no unchecked
  bullet. The harness is the only adapter-specific code in the suite, so a
  second adapter runs the same suite by supplying its own harness.
