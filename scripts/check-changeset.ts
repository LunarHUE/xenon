/**
 * Fails when a pull request changes what a published package ships and adds
 * no changeset. Run with bun from the repo root:
 *
 *   bun scripts/check-changeset.ts origin/main
 *
 * The argument is the base the pull request merges into. CI skips this check
 * when the pull request has the no-changeset label.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { checkChangeset, publishedScope, type Package } from './changeset.ts'

const root = resolve(import.meta.dirname, '..')

const base = process.argv[2]
if (base === undefined) throw new Error('Pass the base ref, such as origin/main.')

/** Files changed since the merge base with `base`, limited by `git diff` filter flags. */
const diff = (...flags: string[]): string[] =>
  execFileSync('git', ['diff', '--name-only', ...flags, `${base}...HEAD`], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\n')
    .filter((line) => line !== '')

const packages: Package[] = readdirSync(join(root, 'packages'))
  .filter((entry) => existsSync(join(root, 'packages', entry, 'package.json')))
  .map((entry) => {
    const manifest = JSON.parse(
      readFileSync(join(root, 'packages', entry, 'package.json'), 'utf8')
    ) as { name: string }
    return {
      name: manifest.name,
      dir: `packages/${entry}`,
      published: manifest.name.startsWith(publishedScope),
    }
  })

const verdict = checkChangeset(diff(), diff('--diff-filter=A'), packages)
for (const reason of verdict.reasons) console.log(reason)
process.exit(verdict.ok ? 0 : 1)
