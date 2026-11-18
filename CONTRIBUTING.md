# Contributing

Thanks for looking. This is a small project with a few firm habits, and they
are all written down here. What CI enforces is marked as such.

## Setup

You need [Bun](https://bun.sh) at the version in `package.json`'s
`packageManager` field and Node 24. With Nix, `nix develop` gives you both.

```sh
bun install
(cd packages/suite && bunx playwright install chromium)   # once, for the browser suites
```

Packages read each other from source, so you never build before you test.

## The checks

CI runs these on every pull request. Run them from the repo root before you
push.

```sh
bun run typecheck
bun run lint
bun run test
bun run check:packages
bun run --cwd packages/suite spec:check
bun run --cwd packages/suite campaign:check
```

`check:packages` builds core, dom and solid, installs each tarball into a
scratch project and imports every subpath. It needs network access to compare
with npm.

The browser suites live in `packages/suite` and run against real engines.

```sh
bun run --cwd packages/suite test:browser   # component tests, Chromium
bun run --cwd packages/suite test:e2e       # Playwright, Chromium
```

CI runs both in Chromium, Firefox and WebKit. `test:browser:all` and
`test:e2e:all` do the same locally.

## How work lands

1. **Open an issue first.** Say what is wrong or missing and what done looks
   like. For a bug, a failing test or a small reproduction is the best
   description there is. Typos and one-line fixes can skip this.
2. **One pull request per issue**, against `main`, with `Closes #<issue>` in
   the description.
3. **Small commits**, one logical change each, with a short imperative subject
   such as "Keep focus on the trigger when a menu closes", not "fixes" or
   "Updated menu.ts".
4. **Add a changeset** if your change reaches a published package. See below.

A pull request merges when "CI passed" and the changeset check are green and a
maintainer has read it.

Every pull request gets a comment from pkg.pr.new with install links for the
packages built from its latest commit. Use them to try a change in a real app
before it is released. Nothing in that step touches npm.

## Changesets

`@xenon-ui/core`, `@xenon-ui/dom` and `@xenon-ui/solid` go to npm. A pull
request that changes what one of them ships needs a changeset. That covers
anything under its `src/` except tests, plus its `package.json` and
`README.md`. CI fails without one.

```sh
bun run changeset
```

Pick the packages you changed and write one or two sentences for the people
who use the library. Say what changed for them, not what you did to the code.

- **patch**: a fix, or anything that changes no one's code.
- **minor**: a breaking change or a new feature. Until 1.0 a minor may break.

Each package has its own version. `@xenon-ui/solid` depends on the other two,
so a release of core or dom bumps solid as well. You don't list it for that.

A change that leaves the built packages byte for byte the same, such as a new
test or a `devDependencies` edit, needs no changeset. Ask a maintainer to add
the `no-changeset` label and the check passes.

The label does not cover a refactor. `check:packages` compares each build with
the version on npm and fails when they differ and no changeset is waiting, so
any change to the compiled output needs a changeset, visible to users or not.
Without that, a package could change on `main` and never be released.

## Releases

A maintainer does these by hand. CI never publishes.

1. Each merge to `main` updates a "Version Packages" pull request. It collects
   the pending changesets, bumps the versions and writes the changelogs. Merge
   it when you want a release.
2. On an up-to-date `main`, log in to npm and publish.

   ```sh
   npm login
   bun run release
   git push --tags
   ```

`bun run release` builds the three packages, packs each `dist/`, checks the
tarball and publishes it, core first. It skips versions already on npm, so it
is safe to run again after a failure. Then it tags each new version as
`<name>@<version>`.

Never run `npm publish` in a package's root. The `package.json` there points
at `src/`. The one that ships is written into `dist/` by the build.

## Tests

- Unit tests sit next to the file they test as `*.test.ts` or `*.test.tsx`.
- A bug fix comes with a test that fails without the fix.
- Behaviour a user can see in a browser belongs in `packages/suite`, tied to
  the spec IDs in `docs/spec`. [Its README](packages/suite/README.md) lists the
  commands and how to install the other engines.
