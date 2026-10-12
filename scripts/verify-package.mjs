/**
 * Verify a package before it is published: every exports target resolves under
 * every condition, every relative import in a shipped module resolves, and
 * README.md, LICENSE and package.json ship.
 *
 *   node scripts/verify-package.mjs packages/solid/dist   # packs it first
 *   node scripts/verify-package.mjs xenon-ui-solid-0.2.2.tgz
 *
 * A directory is packed with `npm pack` into a temporary tarball, so the check
 * sees exactly the bytes npm would upload, not whatever happens to be on disk.
 * 0.2.1 of @xenon-ui/solid shipped 192 of its 433 files because dist/ was being
 * deleted by a second build while npm packed it; this would have rejected it.
 *
 * Exits 1 with one line per problem. Plain Node, so it also runs as the
 * prepublishOnly script of each built package.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix, relative, resolve } from 'node:path'
import process from 'node:process'

const input = process.argv[2]
if (!input) {
  console.error('usage: node scripts/verify-package.mjs <package dir | tarball>')
  process.exit(2)
}

const scratch = mkdtempSync(join(tmpdir(), 'xenon-verify-'))
try {
  let tarball = resolve(input)
  if (statSync(tarball).isDirectory()) {
    const out = execFileSync('npm', ['pack', '--json', '--pack-destination', scratch], {
      cwd: tarball,
      encoding: 'utf8',
      // Running as prepublishOnly must not re-enter npm's lifecycle, and a
      // `publish --dry-run` parent must not stop this pack from writing its tarball.
      env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_dry_run: 'false' },
    })
    tarball = join(scratch, JSON.parse(out)[0].filename)
  }
  execFileSync('tar', ['-xzf', tarball, '-C', scratch])
  const root = join(scratch, 'package')
  const problems = verify(root)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const count = walk(root).length
  if (problems.length) {
    console.error(
      `${manifest.name}@${manifest.version}: ${problems.length} problem(s) in ${count} files`
    )
    for (const problem of problems) console.error(`  ${problem}`)
    process.exitCode = 1
  } else
    console.log(`${manifest.name}@${manifest.version}: ${count} files, exports and imports resolve`)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

/** Every file under a directory, as package-relative POSIX paths. */
function walk(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path, base) : [relative(base, path).split('\\').join('/')]
  })
}

/** Flatten an exports value to [condition path, target] pairs. */
function targets(value, path = []) {
  if (typeof value === 'string') return [[path.join('.') || 'default', value]]
  if (Array.isArray(value)) return value.flatMap((item) => targets(item, path))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => targets(item, [...path, key]))
  return []
}

/** List problems with an extracted package rooted at `root`. */
function verify(root) {
  const problems = []
  const files = new Set(walk(root))
  for (const required of ['package.json', 'README.md', 'LICENSE'])
    if (!files.has(required)) problems.push(`missing ${required}`)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const exportsField = manifest.exports ?? {}
  const entries = typeof exportsField === 'string' ? { '.': exportsField } : exportsField
  for (const [subpath, value] of Object.entries(entries)) {
    const pairs = targets(value)
    if (!pairs.length) problems.push(`exports["${subpath}"] has no targets`)
    // Wildcards must match the same names under every condition.
    const stems = new Map()
    for (const [condition, target] of pairs) {
      const path = posix.normalize(target.replace(/^\.\//, ''))
      if (!path.includes('*')) {
        if (!files.has(path))
          problems.push(`exports["${subpath}"] ${condition} -> ${target} is missing`)
        continue
      }
      const [before, after] = path.split('*')
      const matched = [...files]
        .filter((file) => file.startsWith(before) && file.endsWith(after))
        .map((file) => file.slice(before.length, file.length - after.length))
      if (!matched.length)
        problems.push(`exports["${subpath}"] ${condition} -> ${target} matches nothing`)
      stems.set(`${condition} -> ${target}`, new Set(matched))
    }
    const all = new Set([...stems.values()].flatMap((set) => [...set]))
    for (const [label, set] of stems)
      for (const stem of all)
        if (!set.has(stem)) problems.push(`exports["${subpath}"] ${label} has no "${stem}"`)
  }
  // A partial tree can keep every entry while losing modules they import.
  const specifier = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g
  for (const file of files) {
    if (!/\.(m?js|jsx|d\.ts)$/.test(file)) continue
    const source = readFileSync(join(root, file), 'utf8')
    for (const [, spec] of source.matchAll(specifier)) {
      const target = posix.normalize(posix.join(posix.dirname(file), spec))
      const candidates = file.endsWith('.d.ts')
        ? [
            target,
            target.replace(/\.(m?js|jsx)$/, '.d.ts'),
            `${target}.d.ts`,
            `${target}/index.d.ts`,
          ]
        : [target, `${target}.js`, `${target}/index.js`]
      if (!candidates.some((candidate) => files.has(candidate)))
        problems.push(`${file} imports ${spec}, which is missing`)
    }
  }
  return problems
}
