# Requirement audit

These records connect `docs/spec` requirement IDs to reviewed assertions or
repository scope decisions. They supplement ID-bearing test titles; they do not
change spec checkboxes or claim that a test passed.

Run from the repository root:

```sh
bun run --cwd packages/suite spec:check
bun run --cwd packages/suite spec:report
```

`spec:report` writes the summary and full requirement inventory to
`packages/suite/.vitest/spec-coverage/coverage.{md,json}`. Generated files are
ignored; the review records and reporting code are versioned.
`spec:check` also runs the parser and evidence-validator regression tests;
`test:spec` runs just those tooling tests.

## Record format

Each JSON file contains an array of records:

```json
{
  "ids": ["component.roles.1"],
  "status": "covered",
  "reason": "Explain which assertions establish the whole requirement.",
  "sources": ["docs/spec/component.md"],
  "tests": [
    { "file": "packages/suite/src/component/component.test.tsx", "title": "exact source title" }
  ]
}
```

Group IDs only when the same rationale and evidence apply to each one.

- **covered**: assertions establish the whole bullet, including its premise.
- **partial**: assertions establish part; the reason names the remaining gap.
- **missing**: the repository accepts the behavior, but no assertion was found.
- **deferred**: the capability is explicitly outside the current implementation scope.
- **inapplicable**: an adopted contract rejects the alternative, or it concerns a foreign framework/API.
- **needs-decision**: repository evidence leaves a real contract choice unresolved.

Do not use missing or needs-decision as a default for an unread requirement.
Unmapped requirements appear as **linked** when an active ID-bearing source
registration exists, otherwise **unreviewed**. A source link alone does not
establish full behavioral coverage. The report shows all components, including
those with zero mapped tests, and keeps unresolved rows in the inventory.

## Validation and limits

The validator rejects unknown or duplicate requirement IDs, missing source files,
stale test titles, and inactive/conditional test evidence. Covered and partial
records require test evidence. Reviewers must still check the assertions and
scope rationale; path/title validation cannot establish their correctness.

The parser reads test registrations using the TypeScript syntax tree, including
static table loops and called function-declaration helpers. It excludes comments,
assertion strings, uncalled declaration helpers, inherited skips, and recognized
conditional registrations. Dynamic template titles are recorded as their source
text; this is not a JavaScript interpreter, so arbitrary generated registrations
may be omitted. Evidence locators identify source registrations, not runtime
parameter instances. A test can be discovered without having been executed.

The denominator includes unique checklist IDs only. Prose-only requirements,
new APIs absent from the research specs, and platform execution coverage need
separate review. The reviewed-accepted percentage excludes partial/missing from
the numerator and excludes deferred/inapplicable/unresolved rows from the
denominator. It must not be presented as total shipped-API coverage while any
requirements remain unresolved or unreviewed.
