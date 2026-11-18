/**
 * Decides whether a pull request needs a changeset, and which packages the
 * pending changesets will release. Pure: check-changeset.ts and
 * check-packages.mjs read git and the file system, and this decides.
 *
 * check-packages.mjs imports this file under Node, which strips types but
 * compiles nothing. Keep the syntax erasable: no enums, no parameter properties.
 */

/** A workspace package as the check sees it. */
export interface Package {
  readonly name: string
  /** Its directory relative to the repo root, with forward slashes and no trailing slash. */
  readonly dir: string
  /** True for a package that goes to npm. */
  readonly published: boolean
}

/** What the check found, one line per reason. */
export interface Verdict {
  readonly ok: boolean
  readonly reasons: readonly string[]
}

/** Every package under this scope goes to npm. The `@xenon/` ones never do. */
export const publishedScope = '@xenon-ui/'

// build-package.ts reads these from a package's root. Everything else that
// ships comes from src/.
const shippedRootFiles = new Set(['package.json', 'README.md', 'tsconfig.build.json'])

// Paths under src/ that the build leaves out: tests, notes and vendored test fixtures.
const unshipped = [/\.test\.tsx?$/, /\.md$/, /(^|\/)fixtures\//]

/** True for a new changeset file. The README changesets writes is not one. */
export function isChangeset(file: string): boolean {
  return /^\.changeset\/[^/]+\.md$/.test(file) && file !== '.changeset/README.md'
}

/** The published package `file` ships in, or undefined. */
export function shippedBy(file: string, packages: readonly Package[]): Package | undefined {
  const owner = packages.find((entry) => file.startsWith(`${entry.dir}/`))
  if (owner === undefined || !owner.published) return undefined
  const inside = file.slice(owner.dir.length + 1)
  if (shippedRootFiles.has(inside)) return owner
  if (!inside.startsWith('src/')) return undefined
  return unshipped.some((pattern) => pattern.test(inside)) ? undefined : owner
}

/**
 * Checks a pull request's files. `changed` is every file it touches, `added`
 * the files it adds. It passes when no published package's shipped files
 * changed, or when it adds a changeset.
 */
export function checkChangeset(
  changed: readonly string[],
  added: readonly string[],
  packages: readonly Package[]
): Verdict {
  const touched = new Map<string, string>()
  for (const file of changed) {
    const owner = shippedBy(file, packages)
    if (owner !== undefined && !touched.has(owner.name)) touched.set(owner.name, file)
  }
  if (touched.size === 0) return { ok: true, reasons: ["No published package's source changed."] }
  const lines = [...touched].map(([name, file]) => `${name} changed (${file}).`)
  const changesets = added.filter(isChangeset)
  if (changesets.length > 0)
    return { ok: true, reasons: [...lines, `Changeset added: ${changesets.join(', ')}.`] }
  return {
    ok: false,
    reasons: [
      ...lines,
      'No changeset added. Run `bun run changeset` and commit the file, or label the pull request no-changeset.',
    ],
  }
}

/** The package names in a changeset file's front matter. */
export function changesetPackages(text: string): string[] {
  const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (frontMatter === null) return []
  const names: string[] = []
  for (const line of (frontMatter[1] ?? '').split(/\r?\n/)) {
    const entry = /^\s*["']?([^"':\s]+)["']?\s*:\s*(patch|minor|major)\s*$/.exec(line)
    if (entry?.[1] !== undefined) names.push(entry[1])
  }
  return names
}

/**
 * The packages the next "Version Packages" pull request will bump. `changesets`
 * holds the text of each pending changeset. `dependencies` maps a package to
 * the workspace packages it depends on: a package is bumped when a changeset
 * names it, and when one of its dependencies is bumped.
 */
export function pendingReleases(
  changesets: readonly string[],
  dependencies: Readonly<Record<string, readonly string[]>>
): Set<string> {
  const released = new Set(changesets.flatMap(changesetPackages))
  let grew = true
  while (grew) {
    grew = false
    for (const [name, needs] of Object.entries(dependencies)) {
      if (released.has(name) || !needs.some((dependency) => released.has(dependency))) continue
      released.add(name)
      grew = true
    }
  }
  return released
}
