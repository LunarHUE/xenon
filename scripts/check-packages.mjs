/**
 * Check the built packages the way a consumer installs them. For core, dom and
 * solid, in dependency order:
 *
 * 1. Pack dist/ and run verify-package.mjs on the tarball.
 * 2. Fail on files that belong to no module in src/. A turbo cache hit restores
 *    a build over dist/ without deleting stale files, which is how solid 0.2.2
 *    shipped Command and VirtualList modules its exports never named.
 * 3. Install the tarball into a scratch project with only its declared
 *    dependencies, using this run's tarballs for @xenon-ui ones.
 * 4. Resolve and import every subpath that src/<module>/index provides, under
 *    the default condition and, for solid, the solid condition, and check that
 *    the root index re-exports each module.
 * 5. Resolve every @xenon-ui/<pkg>/<subpath> import in the installed package
 *    through the dependency's exports, including declaration files.
 * 6. Fail if this version is already on npm with different files and no
 *    pending changeset will bump it. dom gained a virtualizer while still at
 *    the published 0.2.0, so solid's ^0.2.0 range could install a dom without
 *    it.
 *
 * Run after a clean build: `bun run check:packages`. Needs network for npm.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { pendingReleases, publishedScope } from './changeset.ts'

const root = resolve(import.meta.dirname, '..')
const order = ['core', 'dom', 'solid']
const rootManifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const catalog = rootManifest.workspaces?.catalog ?? {}
const scratch = mkdtempSync(join(tmpdir(), 'xenon-check-'))
const tarballs = {}
let failures = 0

/** Packages the pending changesets will bump at the next release. */
function willRelease() {
  const dir = join(root, '.changeset')
  const changesets = readdirSync(dir)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .map((file) => readFileSync(join(dir, file), 'utf8'))
  const dependencies = Object.fromEntries(
    order.map((name) => {
      const manifest = JSON.parse(
        readFileSync(join(root, 'packages', name, 'package.json'), 'utf8')
      )
      const needs = Object.keys(manifest.dependencies ?? {})
      return [manifest.name, needs.filter((dependency) => dependency.startsWith(publishedScope))]
    })
  )
  return pendingReleases(changesets, dependencies)
}
const releasing = willRelease()

const fail = (pkg, message) => {
  failures++
  console.error(`  FAIL ${pkg}: ${message}`)
}
const walk = (dir, base = dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path, base) : [relative(base, path).split('\\').join('/')]
  })
const npm = (args, cwd) =>
  execFileSync('npm', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_dry_run: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

/** Module directories in a package's src/, which become its subpaths. */
function sourceModules(name) {
  const src = join(root, 'packages', name, 'src')
  return readdirSync(src, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

/** Subpaths a consumer can import: one per public module, plus file entries listed in exports. */
function subpaths(name, manifest) {
  const modules = sourceModules(name).filter((dir) => dir !== 'internal')
  const listed = Object.keys(manifest.exports).filter(
    (key) => key !== '.' && key !== './package.json' && !key.includes('*')
  )
  return [...new Set(['.', ...modules.map((dir) => `./${dir}`), ...listed])]
}

/** Resolve specifiers from a directory with Node's own resolver; returns failures. */
function resolveFrom(dir, specifiers, conditions = [], load = false) {
  const script = join(dir, '.xenon-check.mjs')
  writeFileSync(
    script,
    `import { existsSync } from 'node:fs'
const bad = []
for (const specifier of ${JSON.stringify(specifiers)}) {
  try {
    const url = import.meta.resolve(specifier)
    if (!existsSync(new URL(url))) bad.push(specifier + ' resolves to a missing file')
    else if (${load}) await import(specifier)
  } catch (error) {
    bad.push(specifier + ': ' + error.message.split('\\n')[0])
  }
}
console.log(JSON.stringify(bad))
`
  )
  const result = spawnSync(process.execPath, [...conditions, script], {
    cwd: dir,
    encoding: 'utf8',
  })
  rmSync(script)
  if (result.status !== 0)
    return [`node exited ${result.status}: ${result.stderr.trim().split('\n').at(-1)}`]
  return JSON.parse(result.stdout.trim().split('\n').at(-1))
}

/** The types target for a subpath of an installed package, following a single wildcard. */
function typesTarget(manifest, subpath) {
  for (const [key, value] of Object.entries(manifest.exports)) {
    const types = typeof value === 'object' ? value.types : undefined
    if (!types) continue
    if (key === subpath) return types
    if (key.includes('*')) {
      const [before, after] = key.split('*')
      if (subpath.startsWith(before) && subpath.endsWith(after))
        return types.replace('*', subpath.slice(before.length, subpath.length - after.length))
    }
  }
  return undefined
}

try {
  for (const name of order) {
    const dist = join(root, 'packages', name, 'dist')
    const manifest = JSON.parse(readFileSync(join(dist, 'package.json'), 'utf8'))
    const id = `${manifest.name}@${manifest.version}`
    console.log(`${id}`)

    // 1. Pack and verify the exact tarball.
    const out = join(scratch, 'tarballs')
    mkdirSync(out, { recursive: true })
    const packed = JSON.parse(npm(['pack', '--json', '--pack-destination', out], dist))[0]
    const tarball = join(out, packed.filename)
    tarballs[manifest.name] = tarball
    const verify = spawnSync(
      process.execPath,
      [join(root, 'scripts/verify-package.mjs'), tarball],
      {
        encoding: 'utf8',
      }
    )
    if (verify.status !== 0) fail(id, verify.stderr.trim())
    const files = packed.files.map((file) => file.path)

    // 2. Every directory must come from a module in src/.
    const modules = new Set(sourceModules(name))
    // A file entry such as ./spread (src/spread.ts) compiles to spread/index.js.
    const known = new Set([
      ...modules,
      ...Object.keys(manifest.exports)
        .map((key) => key.slice(2))
        .filter((key) => key && !key.includes('*')),
    ])
    const stray = new Set()
    for (const file of files) {
      const parts = file.split('/')
      const dir = parts[0] === 'src' ? parts[1] : parts[0]
      if (parts.length > (parts[0] === 'src' ? 2 : 1) && !known.has(dir))
        stray.add(parts[0] === 'src' ? `src/${dir}` : dir)
    }
    for (const dir of stray)
      fail(id, `${dir}/ has no module in src/; dist/ holds stale build output`)

    // 3. Install into a scratch project with only this package and its declared deps.
    const project = join(scratch, name)
    mkdirSync(project, { recursive: true })
    const peers = Object.fromEntries(
      Object.keys(manifest.peerDependencies ?? {}).map((peer) => [
        peer,
        catalog[peer] ?? manifest.peerDependencies[peer],
      ])
    )
    const overrides = Object.fromEntries(
      Object.keys(manifest.dependencies ?? {})
        .filter((dep) => tarballs[dep])
        .map((dep) => [dep, `file:${tarballs[dep]}`])
    )
    for (const dep of Object.keys(manifest.dependencies ?? {}))
      if (dep.startsWith('@xenon-ui/') && !tarballs[dep])
        fail(id, `${dep} is not packed before ${name}`)
    writeFileSync(
      join(project, 'package.json'),
      JSON.stringify(
        {
          name: `check-${name}`,
          private: true,
          type: 'module',
          dependencies: { [manifest.name]: `file:${tarball}`, ...peers },
          overrides,
        },
        null,
        2
      )
    )
    npm(['install', '--no-audit', '--no-fund', '--no-package-lock'], project)
    const installed = join(project, 'node_modules', manifest.name)

    // 4. Every source module is exported, re-exported from the root index, and loads.
    const specifiers = subpaths(name, manifest).map((key) =>
      key === '.' ? manifest.name : `${manifest.name}${key.slice(1)}`
    )
    for (const problem of resolveFrom(project, specifiers, [], name !== 'solid'))
      fail(id, `default condition: ${problem}`)
    if (name === 'solid')
      for (const problem of resolveFrom(project, specifiers, ['--conditions=solid']))
        fail(id, `solid condition: ${problem}`)
    const rootIndex = readFileSync(
      join(
        root,
        'packages',
        name,
        'src',
        existsSync(join(root, 'packages', name, 'src/index.ts')) ? 'index.ts' : 'index.tsx'
      ),
      'utf8'
    )
    for (const dir of modules)
      if (dir !== 'internal' && !new RegExp(`from '\\./${dir}['/]`).test(rootIndex))
        fail(id, `src/index does not re-export ./${dir}`)

    // 5. Cross-package subpath imports in the shipped files resolve through exports.
    const crossImports = new Map()
    for (const file of walk(installed)) {
      if (!/\.(m?js|jsx|d\.ts)$/.test(file)) continue
      const source = readFileSync(join(installed, file), 'utf8')
      for (const [, specifier] of source.matchAll(
        /['"](@xenon-ui\/[a-z-]+(?:\/[a-z0-9-]+)?)['"]/g
      )) {
        if (specifier.startsWith(`${manifest.name}`)) continue
        if (!crossImports.has(specifier)) crossImports.set(specifier, file)
      }
    }
    const runtime = [...crossImports.keys()]
    for (const problem of resolveFrom(installed, runtime))
      fail(id, `import from built output, default condition: ${problem}`)
    if (name === 'solid')
      for (const problem of resolveFrom(installed, runtime, ['--conditions=solid']))
        fail(id, `import from built output, solid condition: ${problem}`)
    for (const [specifier, file] of crossImports) {
      const [, scope, pkg, ...rest] = specifier.match(/^(@xenon-ui)\/([a-z-]+)(.*)$/) ?? []
      const depDir = join(project, 'node_modules', scope, pkg)
      if (!existsSync(join(depDir, 'package.json'))) {
        fail(id, `${file} imports ${specifier}, but ${scope}/${pkg} is not installed`)
        continue
      }
      const dep = JSON.parse(readFileSync(join(depDir, 'package.json'), 'utf8'))
      const target = typesTarget(dep, rest[0] ? `.${rest[0]}` : '.')
      if (!target || !existsSync(join(depDir, target)))
        fail(id, `types for ${specifier} (from ${file}) do not resolve`)
    }

    // 6. A version already on npm must be this exact set of files.
    const view = spawnSync('npm', ['view', id, 'dist.tarball'], { encoding: 'utf8' })
    const published = view.status === 0 ? view.stdout.trim() : ''
    if (published) {
      const remote = join(scratch, 'remote', name)
      mkdirSync(remote, { recursive: true })
      npm(['pack', id, '--pack-destination', remote], scratch)
      const local = join(scratch, 'local', name)
      mkdirSync(local, { recursive: true })
      execFileSync('tar', ['-xzf', tarball, '-C', local])
      execFileSync('tar', ['-xzf', join(remote, readdirSync(remote)[0]), '-C', remote])
      const digest = (dir) =>
        new Map(
          walk(join(dir, 'package')).map((file) => [
            file,
            createHash('sha256')
              .update(readFileSync(join(dir, 'package', file)))
              .digest('hex'),
          ])
        )
      const mine = digest(local)
      const theirs = digest(remote)
      const differ = [...new Set([...mine.keys(), ...theirs.keys()])].filter(
        (file) => mine.get(file) !== theirs.get(file)
      )
      if (!differ.length) console.log('  matches the published version')
      else if (releasing.has(manifest.name))
        console.log('  differs from the published version; a pending changeset bumps it')
      else
        fail(
          id,
          `is already on npm with different files (${differ.length}, e.g. ${differ.slice(0, 3).join(', ')}); add a changeset with \`bun run changeset\``
        )
    } else console.log('  not published yet')
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
if (failures) {
  console.error(`${failures} packaging problem(s)`)
  process.exit(1)
}
console.log('packages: ok')
