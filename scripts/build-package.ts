/**
 * Build the package in the current directory into dist/ as a publishable tree.
 *
 * The workspace keeps package.json exports pointed at src so apps and tests
 * resolve TypeScript directly. Publishing needs compiled output, so this script
 * emits it and writes a second package.json into dist/ that maps the same
 * subpaths onto the emitted files. Publish from dist/, never from the package
 * root.
 *
 * Emitted layout per subpath entry src/foo/index.tsx in a package with JSX:
 *   dist/src/foo/index.d.ts   declarations (tsc)
 *   dist/src/foo/index.jsx    JSX preserved, for bundlers that resolve the "solid"
 *                             export condition and compile with their own Solid plugin
 *   dist/foo/index.js         compiled with the Solid plugin, for everything else
 * The two trees are separate module graphs and never import each other.
 * Packages without JSX get .d.ts and .js from tsc directly under dist/.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'

const pkgDir = process.cwd()
const root = resolve(import.meta.dirname, '..')
const dist = join(pkgDir, 'dist')
const manifest = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'))

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

/**
 * Add file extensions to relative specifiers in emitted files. tsc copies the
 * extensionless specifiers from source as-is; Node and strict resolvers need
 * the real file name. Declarations get .js, which TypeScript maps back to .d.ts.
 */
async function fixExtensions(dir: string) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) {
      await fixExtensions(file)
      continue
    }
    const declaration = entry.name.endsWith('.d.ts')
    if (!declaration && !/\.jsx?$/.test(entry.name)) continue
    const source = await readFile(file, 'utf8')
    const rewritten = source.replace(
      /((?:from|import)\s*\(?\s*)(['"])(\.{1,2}(?:\/[^'"]*)?)\2/g,
      (match, prefix, quote, specifier) => {
        const target = resolve(dir, specifier)
        const candidates = declaration
          ? [`${target}.d.ts`, `${target}/index.d.ts`]
          : [`${target}.jsx`, `${target}.js`, `${target}/index.jsx`, `${target}/index.js`]
        const hit = candidates.find((candidate) => existsSync(candidate))
        if (!hit) throw new Error(`${relative(dist, file)}: cannot resolve ${specifier}`)
        const ext = declaration ? '.js' : hit.endsWith('.jsx') ? '.jsx' : '.js'
        const suffix = hit.startsWith(`${target}/index.`) ? '/index' : ''
        return `${prefix}${quote}${specifier}${suffix}${ext}${quote}`
      }
    )
    if (rewritten !== source) await writeFile(file, rewritten)
  }
}

/**
 * Map a src entry like ./src/button/index.tsx to its dist counterparts. The
 * compiled default follows the Vite entry name, `<subpath>/index`, so a file
 * entry such as ./src/spread.ts compiles to ./spread/index.js, not ./spread.js.
 */
function distEntry(subpath: string, srcPath: string, hasJsx: boolean) {
  const compiled = srcPath.replace(/^\.\/src\//, './').replace(/\.tsx?$/, '')
  const source = srcPath.replace(/\.tsx?$/, '')
  const jsx = srcPath.endsWith('.tsx')
  if (!hasJsx) return { types: `${compiled}.d.ts`, default: `${compiled}.js` }
  return {
    types: `${source}.d.ts`,
    solid: jsx ? `${source}.jsx` : `${source}.js`,
    default: subpath === '.' ? './index.js' : `${subpath}/index.js`,
  }
}

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

run(join(pkgDir, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.build.json'])
await fixExtensions(dist)

const exportEntries = Object.entries(manifest.exports as Record<string, { default: string }>)
const hasJsx = exportEntries.some(([, target]) => target.default.endsWith('.tsx'))

if (hasJsx) {
  const { build } = await import('vite')
  const { default: solid } = await import('@solidjs/vite-plugin')
  const entry: Record<string, string> = {}
  for (const [subpath, target] of exportEntries) {
    entry[subpath === '.' ? 'index' : `${subpath.slice(2)}/index`] = join(pkgDir, target.default)
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
      target: 'esnext',
      lib: { entry, formats: ['es'] },
      rolldownOptions: {
        external: (id: string) =>
          !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
        output: {
          preserveModules: true,
          preserveModulesRoot: join(pkgDir, 'src'),
          entryFileNames: '[name].js',
        },
      },
    },
  })
}

const exportsOut: Record<string, unknown> = {}
for (const [subpath, target] of exportEntries) {
  exportsOut[subpath] = distEntry(subpath, target.default, hasJsx)
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
