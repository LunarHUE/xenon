/**
 * Build the package in the current directory into dist/ as a publishable tree.
 *
 * The workspace keeps package.json exports pointed at src so apps and tests
 * resolve TypeScript directly. Publishing needs compiled output, so this script
 * emits it and writes a second package.json into dist/ that maps the same
 * subpaths onto the emitted files. Publish from dist/, never from the package
 * root.
 *
 * Runtime code ships as one bundle per package so a dev server that serves the
 * package file by file (Vite with the Solid plugin does this for anything with
 * a `solid` export condition and for everything such a package imports) loads
 * it in a handful of requests instead of one per source module. Subpath entries
 * are one-line re-exports from that bundle, so `@xenon-ui/core/dialog` costs a
 * tiny file plus the shared bundle and never its own module graph.
 *
 * Packages without JSX (core, dom):
 *   dist/index.js             everything, bundled; only third-party deps external
 *   dist/foo/index.js         export { ... } from '../index.js'
 *   dist/foo/index.d.ts       declarations (tsc)
 *
 * Packages with JSX (solid):
 *   dist/src/index.jsx        everything, bundled with JSX preserved, for bundlers
 *                             that resolve the "solid" condition and compile with
 *                             their own Solid plugin. @xenon-ui/core and
 *                             @xenon-ui/dom are imported from their package
 *                             roots so a consumer sees two bare specifiers.
 *   dist/src/foo/index.js     export { ... } from '../index.jsx'
 *   dist/src/foo/index.d.ts   declarations (tsc)
 *   dist/foo/index.js         compiled with the Solid plugin, module per module,
 *                             for everything else
 * The solid and default trees are separate module graphs and never import each other.
 */
import { createRequire } from 'node:module'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { rolldown, type Plugin } from 'rolldown'
import type TS from 'typescript'

const pkgDir = process.cwd()
const root = resolve(import.meta.dirname, '..')
const dist = join(pkgDir, 'dist')
const manifest = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'))
// Each package pins its own TypeScript; the bundler must agree with the checker.
const ts: typeof TS = createRequire(join(pkgDir, 'package.json'))('typescript')

/** Read a sibling workspace package's version so workspace:* becomes a real range. */
async function workspaceVersion(name: string): Promise<string> {
  const dir = join(root, 'packages', name.replace(/^@xenon-ui\//, ''))
  const json = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'))
  return json.version
}

function run(cmd: string, args: string[]) {
  const result = spawnSync(cmd, args, { cwd: pkgDir, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function fail(message: string): never {
  console.error(`${manifest.name}: ${message}`)
  process.exit(1)
}

/**
 * Add file extensions to relative specifiers in emitted declarations. tsc
 * copies the extensionless specifiers from source as-is; strict resolvers need
 * the real file name. Declarations get .js, which TypeScript maps back to .d.ts.
 */
async function fixExtensions(dir: string) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) {
      await fixExtensions(file)
      continue
    }
    if (!entry.name.endsWith('.d.ts')) continue
    const source = await readFile(file, 'utf8')
    const rewritten = source.replace(
      /((?:from|import)\s*\(?\s*)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g,
      (match, prefix, quote, specifier) => {
        const target = resolve(dir, specifier)
        const hit = [`${target}.d.ts`, `${target}/index.d.ts`].find((candidate) =>
          existsSync(candidate)
        )
        if (!hit) throw new Error(`${relative(dist, file)}: cannot resolve ${specifier}`)
        const suffix = hit.startsWith(`${target}/index.`) ? '/index' : ''
        return `${prefix}${quote}${specifier}${suffix}.js${quote}`
      }
    )
    if (rewritten !== source) await writeFile(file, rewritten)
  }
}

type Entry = { subpath: string; src: string }

/**
 * Every subpath a consumer can import, with its source file. A wildcard entry
 * like "./*" expands to one subpath per module directory in src/, except
 * internal/, which is private.
 */
async function subpathEntries(): Promise<Entry[]> {
  const entries: Entry[] = []
  for (const [subpath, value] of Object.entries(manifest.exports as Record<string, unknown>)) {
    if (typeof value === 'string') continue
    const target = (value as { default: string }).default
    if (!subpath.includes('*')) {
      entries.push({ subpath, src: target })
      continue
    }
    for (const dir of await readdir(join(pkgDir, 'src'), { withFileTypes: true })) {
      if (!dir.isDirectory() || dir.name === 'internal') continue
      entries.push({ subpath: subpath.replace('*', dir.name), src: target.replace('*', dir.name) })
    }
  }
  return entries
}

/**
 * The runtime export names of each entry, resolved through the type checker so
 * `export *` chains and aliases land on the declaration that defines each
 * binding. Fails when a subpath exports a value the root does not, or when the
 * same name means different things in two places: either would make a one-line
 * re-export from the bundle silently wrong.
 */
function exportNames(entries: Entry[]): Map<string, string[]> {
  const configPath = join(pkgDir, 'tsconfig.build.json')
  const config = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) =>
      fail(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
  })
  if (!config) fail(`cannot read ${configPath}`)
  const program = ts.createProgram(
    entries.map((entry) => join(pkgDir, entry.src)),
    { ...config.options, noEmit: true }
  )
  const checker = program.getTypeChecker()
  const bindings = (file: string) => {
    const source = program.getSourceFile(file)
    if (!source) fail(`${relative(pkgDir, file)} is not part of the program`)
    const symbol = checker.getSymbolAtLocation(source)
    if (!symbol) fail(`${relative(pkgDir, file)} is not a module`)
    const result = new Map<string, string>()
    for (const exported of checker.getExportsOfModule(symbol)) {
      const target =
        exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
      if (!(target.flags & ts.SymbolFlags.Value)) continue
      const declaration = target.declarations?.[0]
      if (!declaration) continue
      result.set(exported.name, `${declaration.getSourceFile().fileName}:${declaration.pos}`)
    }
    return result
  }
  const rootEntry = entries.find((entry) => entry.subpath === '.')
  if (!rootEntry) fail('exports["."] is missing')
  const rootBindings = bindings(join(pkgDir, rootEntry.src))
  const names = new Map<string, string[]>()
  const problems: string[] = []
  for (const entry of entries) {
    const own = bindings(join(pkgDir, entry.src))
    for (const [name, binding] of own) {
      const viaRoot = rootBindings.get(name)
      if (!viaRoot)
        problems.push(`${entry.subpath} exports ${name}, which the package root does not`)
      else if (viaRoot !== binding)
        problems.push(`${entry.subpath} exports a different ${name} than the package root`)
    }
    names.set(entry.subpath, [...own.keys()].sort())
  }
  if (problems.length)
    fail(`cannot re-export subpaths from one bundle:\n  ${problems.join('\n  ')}`)
  return names
}

/** Anything that is not a relative or absolute path is a dependency and stays external. */
const external = (id: string) => !id.startsWith('.') && !isAbsolute(id) && !id.startsWith('\0')

/**
 * Collapse @xenon-ui/<pkg>/<subpath> to @xenon-ui/<pkg>. Those packages ship
 * everything in one bundle, and a consumer can pre-bundle two root imports
 * with two optimizeDeps.include entries instead of listing forty subpaths.
 */
const subpathOfBundledPackage = /^(@xenon-ui\/(?:core|dom))\//
const packageRoots: Plugin = {
  name: 'xenon-package-roots',
  resolveId(id) {
    const match = subpathOfBundledPackage.exec(id)
    return match ? { id: match[1]!, external: true } : null
  },
}

/** Bundle one entry into one file, with JSX left for the consumer's compiler. */
async function bundle(input: string, outDir: string, fileName: string) {
  const build = await rolldown({
    input: { [fileName.replace(/\.jsx?$/, '')]: input },
    cwd: pkgDir,
    // The external callback runs before plugins see a specifier, so leave the
    // subpaths to the plugin.
    external: (id) => external(id) && !subpathOfBundledPackage.test(id),
    plugins: [packageRoots],
    tsconfig: false,
    transform: { jsx: 'preserve' },
  })
  const { output } = await build.write({
    dir: outDir,
    format: 'esm',
    entryFileNames: fileName,
    sourcemap: true,
    minify: false,
  })
  await build.close()
  const chunks = output.filter((item) => item.type === 'chunk')
  if (chunks.length !== 1)
    fail(
      `expected one chunk for ${fileName}, got ${chunks.map((chunk) => chunk.fileName).join(', ')}`
    )
}

/** Write `export { ... } from '<bundle>'` so a subpath costs one tiny file. */
async function writeReexport(file: string, bundleFile: string, names: string[]) {
  await mkdir(dirname(file), { recursive: true })
  let specifier = relative(dirname(file), bundleFile).split('\\').join('/')
  if (!specifier.startsWith('.')) specifier = `./${specifier}`
  const body = names.length ? `export { ${names.join(', ')} } from '${specifier}'\n` : 'export {}\n'
  await writeFile(file, body)
}

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

run(join(pkgDir, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.build.json', '--emitDeclarationOnly'])
await fixExtensions(dist)

const entries = await subpathEntries()
const hasJsx = entries.some((entry) => entry.src.endsWith('.tsx'))
const names = exportNames(entries)
const rootEntry = entries.find((entry) => entry.subpath === '.')!

// Where the bundle and each subpath's re-export live, relative to dist/.
const bundleDir = hasJsx ? join(dist, 'src') : dist
const bundleName = hasJsx ? 'index.jsx' : 'index.js'
await bundle(join(pkgDir, rootEntry.src), bundleDir, bundleName)

/** Map a src entry like ./src/button/index.tsx onto its re-export file under dist/. */
function reexportFile(src: string) {
  const stem = src.replace(/\.tsx?$/, '').replace(/^\.\/src\//, './')
  return hasJsx ? `./src/${stem.slice(2)}.js` : `${stem}.js`
}

for (const entry of entries) {
  if (entry.subpath === '.') continue
  await writeReexport(
    join(dist, reexportFile(entry.src)),
    join(bundleDir, bundleName),
    names.get(entry.subpath)!
  )
}

if (hasJsx) {
  const { build } = await import('vite')
  const { default: solid } = await import('@solidjs/vite-plugin')
  const entry: Record<string, string> = {}
  for (const { subpath, src } of entries) {
    entry[subpath === '.' ? 'index' : `${subpath.slice(2)}/index`] = join(pkgDir, src)
  }
  await build({
    root: pkgDir,
    configFile: false,
    logLevel: 'warn',
    plugins: [solid({ refresh: { disabled: true } })],
    build: {
      outDir: dist,
      emptyOutDir: false,
      minify: false,
      sourcemap: true,
      target: 'esnext',
      lib: { entry, formats: ['es'] },
      rolldownOptions: {
        external,
        output: {
          preserveModules: true,
          preserveModulesRoot: join(pkgDir, 'src'),
          entryFileNames: '[name].js',
        },
      },
    },
  })
}

/** The exports entry for a subpath, types first so resolvers that stop at the first match find them. */
function distEntry(subpath: string, src: string) {
  const stem = src.replace(/\.tsx?$/, '')
  if (!hasJsx) {
    const compiled = stem.replace(/^\.\/src\//, './')
    return { types: `${compiled}.d.ts`, default: `${compiled}.js` }
  }
  return {
    types: `${stem}.d.ts`,
    solid: subpath === '.' ? `./src/${bundleName}` : reexportFile(src),
    default: subpath === '.' ? './index.js' : `${subpath}/index.js`,
  }
}

const exportsOut: Record<string, unknown> = {}
for (const [subpath, value] of Object.entries(manifest.exports as Record<string, unknown>)) {
  if (typeof value === 'string') exportsOut[subpath] = value
  else exportsOut[subpath] = distEntry(subpath, (value as { default: string }).default)
}

const dependencies: Record<string, string> = {}
for (const [name, range] of Object.entries(
  (manifest.dependencies ?? {}) as Record<string, string>
)) {
  dependencies[name] = range === 'workspace:*' ? `^${await workspaceVersion(name)}` : range
}

const published = {
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  license: manifest.license,
  repository: manifest.repository,
  homepage: manifest.homepage,
  bugs: manifest.bugs,
  keywords: manifest.keywords,
  type: 'module',
  sideEffects: manifest.sideEffects,
  exports: exportsOut,
  dependencies: Object.keys(dependencies).length ? dependencies : undefined,
  peerDependencies: manifest.peerDependencies,
  // `npm publish` from dist/ checks the packed tarball first. Publishing a
  // tarball skips lifecycle scripts, so publish-packages verifies those itself.
  scripts: { prepublishOnly: 'node ../../../scripts/verify-package.mjs .' },
  publishConfig: { access: 'public' },
}
await writeFile(join(dist, 'package.json'), JSON.stringify(published, null, 2) + '\n')

for (const file of ['README.md', 'LICENSE']) {
  const candidates = [join(pkgDir, file), join(root, file)]
  const hit = candidates.find((candidate) => existsSync(candidate))
  if (hit) await cp(hit, join(dist, file))
}

console.log(`${manifest.name}@${manifest.version} → ${relative(pkgDir, dist)}/`)
