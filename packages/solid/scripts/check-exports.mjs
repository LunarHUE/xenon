/**
 * Build every public Solid subpath and verify Button-only imports discard selected
 * unrelated component families. Run with test:exports from this package. Builds
 * are in memory; failures reject or assert and make the script exit unsuccessfully.
 */
import assert from 'node:assert/strict'
import { log } from 'node:console'
import { readFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import solid from '@solidjs/vite-plugin'
import { build } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const id = '\0tenon-export-check'

/**
 * Compile a virtual consumer as a minified ES library using this package's resolver
 * and Solid transform, with refresh disabled. Returns emitted JavaScript chunks,
 * including export and retained-module metadata; emits no files to disk.
 * @param source - Consumer module source, typically a public-subpath re-export.
 */
async function bundle(source) {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      {
        name: 'export-check',
        resolveId: (value) =>
          value === 'tenon-export-check' || value.endsWith('/tenon-export-check') ? id : undefined,
        load: (value) => (value === id ? source : undefined),
      },
      solid({ refresh: { disabled: true } }),
    ],
    build: {
      write: false,
      minify: true,
      lib: { entry: 'tenon-export-check', formats: ['es'] },
    },
  })
  return (Array.isArray(result) ? result : [result]).flatMap((output) =>
    output.output.filter((chunk) => chunk.type === 'chunk')
  )
}

for (const subpath of Object.keys(manifest.exports).filter((key) => key !== '.')) {
  const name = `@tenon/solid/${subpath.slice(2)}`
  const chunks = await bundle(`export * from '${name}'`)
  assert(
    chunks.some((chunk) => chunk.exports.length > 0),
    `${name} has no runtime exports`
  )
}

// Check both public import styles against emitted modules, not bundle size.
for (const source of ['@tenon/solid/button', '@tenon/solid']) {
  const chunks = await bundle(`export { Button } from '${source}'`)
  const modules = chunks.flatMap((chunk) => Object.keys(chunk.modules))
  assert(
    modules.some((path) => path.includes('/solid/src/button/')),
    'Button must be retained'
  )
  const unrelated = modules.filter((path) =>
    /\/(solid|core|dom)\/src\/(checkbox|checkbox-group|listbox|select|combobox|dialog|drawer|popover|menu|positioning|tooltip|hover-card|hover-intent|context-menu|menubar|navigation-menu|toast)\//.test(
      path
    )
  )
  assert.deepEqual(unrelated, [], `${source} retains unrelated component modules`)
}
log('All public subpaths build; Button imports exclude unrelated components.')
