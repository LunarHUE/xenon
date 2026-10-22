import { afterEach, expect, test } from 'bun:test'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const verifier = fileURLToPath(new URL('./verify-package.mjs', import.meta.url))
const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})
function verify(exports: unknown, files: Record<string, string> = {}, omit: string[] = []) {
  const directory = mkdtempSync(join(tmpdir(), 'xenon-package-fixture-'))
  directories.push(directory)
  const root = join(directory, 'package')
  mkdirSync(root)
  const contents = {
    'package.json': JSON.stringify({
      name: 'xenon-verifier-fixture',
      version: '1.0.0',
      type: 'module',
      exports,
    }),
    'README.md': 'Fixture package',
    LICENSE: 'Fixture license',
    ...files,
  }
  for (const [file, content] of Object.entries(contents)) {
    if (omit.includes(file)) continue
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), content)
  }
  const tarball = join(directory, 'fixture.tgz')
  const packed = spawnSync('tar', ['-czf', tarball, '-C', directory, 'package'], {
    encoding: 'utf8',
  })
  expect(packed.status).toBe(0)
  return spawnSync('node', [verifier, tarball], { encoding: 'utf8', timeout: 15_000 })
}

test('missing input reports usage with the dedicated exit status', () => {
  const result = spawnSync('node', [verifier], { encoding: 'utf8' })
  expect(result.status).toBe(2)
  expect(result.stderr).toContain('usage: node scripts/verify-package.mjs')
})

test('a complete package resolves a string root export without evaluating shipped code', () => {
  const result = verify('./index.js', { 'index.js': 'throw new Error("must never execute")' })
  expect(result.status).toBe(0)
  expect(result.stdout).toContain('4 files, exports and imports resolve')
})

for (const file of ['README.md', 'LICENSE']) {
  test(`a tarball missing ${file} is rejected`, () => {
    const result = verify('./index.js', { 'index.js': '' }, [file])
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`missing ${file}`)
  })
}

test('nested export conditions and array targets are all checked', () => {
  const result = verify(
    {
      '.': {
        types: './index.d.ts',
        import: { browser: './browser.js', default: ['./index.js', './fallback.js'] },
      },
    },
    { 'index.d.ts': '', 'index.js': '' }
  )
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('2 problem(s)')
  expect(result.stderr).toContain('import.browser -> ./browser.js is missing')
  expect(result.stderr).toContain('import.default -> ./fallback.js is missing')
})

test('an export with no concrete targets is rejected', () => {
  const result = verify({ '.': [] })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('has no targets')
})

test('wildcard conditions must export the same module names', () => {
  const result = verify(
    { './*': { types: './types/*.d.ts', default: './runtime/*.js' } },
    { 'types/button.d.ts': '', 'types/menu.d.ts': '', 'runtime/button.js': '' }
  )
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('default -> ./runtime/*.js has no "menu"')
})

test('matching wildcard conditions accept multiple modules', () => {
  const result = verify(
    { './*': { types: './types/*.d.ts', default: './runtime/*.js' } },
    {
      'types/button.d.ts': '',
      'types/menu.d.ts': '',
      'runtime/button.js': '',
      'runtime/menu.js': '',
    }
  )
  expect(result.status).toBe(0)
})

test('an empty wildcard match is rejected', () => {
  const result = verify({ './*': './runtime/*.js' })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('matches nothing')
})

test('relative imports resolve files, extensionless modules, directories, and declaration counterparts', () => {
  const result = verify(
    { '.': { types: './index.d.ts', default: './index.js' } },
    {
      'index.js': `export { a } from './nested/a'; import './nested/side.js'; import('./nested/directory')`,
      'nested/a.js': 'export const a = 1',
      'nested/side.js': '',
      'nested/directory/index.js': '',
      'index.d.ts': `export * from './nested/a.js'; export * from './nested/types'; export * from './nested/declarations'`,
      'nested/a.d.ts': '',
      'nested/types.d.ts': '',
      'nested/declarations/index.d.ts': '',
    }
  )
  expect(result.status).toBe(0)
})

test('missing modules are reported even when every exported entry exists', () => {
  const result = verify('./index.js', {
    'index.js': `export * from './missing.js'; import('./lazy.js')`,
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('2 problem(s)')
  expect(result.stderr).toContain('index.js imports ./missing.js, which is missing')
  expect(result.stderr).toContain('index.js imports ./lazy.js, which is missing')
})

test('relative imports cannot resolve to files outside the tarball', () => {
  const result = verify('./index.js', { 'index.js': `import '../outside.js'` })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('imports ../outside.js, which is missing')
})

test('commented examples do not create dependencies for a valid shipped module', () => {
  const result = verify('./index.js', {
    'index.js': `// import './example.js'\n/* export * from './documented.js' */\nexport const value = 1`,
  })
  expect(result.status).toBe(0)
})

// Fixture sources are listed line by line in plain strings so the backticks,
// `${` and backslashes reach the verifier exactly as written here.
test('import text inside strings, templates and regex literals is not a dependency', () => {
  const result = verify('./index.js', {
    'index.js': [
      'const help = "import \'./quoted.js\'"',
      "const doc = `export * from './templated.js' ${{ a: \"import('./nested.js')\" }.a} $ {`",
      "const pattern = /from '.\\/regex.js'|[\"'`]/g",
      'const slash = \'//\' + "/*"',
      'export const value = [help, doc, pattern, slash]',
    ].join('\n'),
  })
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
})

test('real imports after comments, strings, templates and regex literals are still checked', () => {
  const result = verify('./index.js', {
    'index.js': [
      "/* import './block.js' */ const quote = \"'\" // import './line.js'",
      'const ratio = 4 / 2 / 1',
      "const pattern = /'/",
      "const text = `${quote}'${`'`}`",
      'if (pattern.test(text)) { /\\//.test(text) }',
      "import { a } from './first.js'",
      'export { b } from "./second.js"',
      "import './third.js'",
      "const lazy = () => import('./fourth.js')",
      "export * as all from './fifth.js'",
    ].join('\n'),
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('5 problem(s)')
  for (const name of ['first', 'second', 'third', 'fourth', 'fifth'])
    expect(result.stderr).toContain(`index.js imports ./${name}.js, which is missing`)
})

test('member calls named import and local export lists are not module imports', () => {
  const result = verify('./index.js', {
    'index.js': [
      'const loader = { import: (path) => path }',
      "loader.import('./member.js')",
      "const from = './local.js'",
      'export { from }',
      '"./after-export.js"',
    ].join('\n'),
  })
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
})

test('declaration files check type imports and import types but not commented examples', () => {
  const result = verify(
    { '.': { types: './index.d.ts', default: './index.js' } },
    {
      'index.js': '',
      'index.d.ts': [
        "/** @example import { x } from './documented' */",
        "import type { A } from './types/a.js'",
        "export type B = import('./types/b').B",
        "export type { C } from './types/c'",
      ].join('\n'),
      'types/a.d.ts': '',
      'types/b.d.ts': '',
    }
  )
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('1 problem(s)')
  expect(result.stderr).toContain('index.d.ts imports ./types/c, which is missing')
})

test('imports after regex literals in template expressions are still checked', () => {
  const result = verify('./index.js', {
    'index.js': [
      "const t = `${/}/.test('x') && import('./first.js')}`",
      "const u = `${{ a: /`/ }.a}${'}'}`",
      "import './second.js'",
    ].join('\n'),
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('2 problem(s)')
  expect(result.stderr).toContain('index.js imports ./first.js, which is missing')
  expect(result.stderr).toContain('index.js imports ./second.js, which is missing')
})

test('JSX text and tags neither hide nor invent imports', () => {
  const result = verify('./index.jsx', {
    'index.jsx': [
      'const view = <span></span>; import "./first.js"',
      "const page = <><p class=\"a/b\" title=\"it's\">Don't // import './text.js' {/* import './comment.js' */}</p><br/></>",
      "const lazy = <div onClick={() => import('./second.js')} {...{ a: '}' }}>{`${<i>/</i>}`}</div>",
      "export * from './third.js'",
    ].join('\n'),
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('3 problem(s)')
  for (const name of ['first', 'second', 'third'])
    expect(result.stderr).toContain(`index.jsx imports ./${name}.js, which is missing`)
})

test('quoted names in import and export clauses do not end the clause', () => {
  const result = verify('./index.js', {
    'index.js': [
      'import { "}" as value } from "./first.js"',
      "export { value as '}' } from './second.js'",
    ].join('\n'),
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('2 problem(s)')
  for (const name of ['first', 'second'])
    expect(result.stderr).toContain(`index.js imports ./${name}.js, which is missing`)
})

test('imports after ambiguous slashes and adjacent JSX expressions are still checked', () => {
  const result = verify('./index.jsx', {
    'index.jsx': [
      'const f = function () {} / 2; import "./first.js"',
      'if (f) /x/.test("y"); import "./second.js"',
      'const view = <div>{f}{/}/.test("x") && import("./third.js")}</div>',
    ].join('\n'),
  })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('3 problem(s)')
  for (const name of ['first', 'second', 'third'])
    expect(result.stderr).toContain(`index.jsx imports ./${name}.js, which is missing`)
})

test('constant template imports and declaration require imports are checked', () => {
  const result = verify(
    { '.': { types: './index.d.ts', default: './index.js' } },
    {
      'index.js': "import(`./first.js`); import(`./${'computed'}.js`)",
      'index.d.ts': "import x = require('./second')\nexport = x",
    }
  )
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('2 problem(s)')
  expect(result.stderr).toContain('index.js imports ./first.js, which is missing')
  expect(result.stderr).toContain('index.d.ts imports ./second, which is missing')
})

test('a shipped module that does not parse is rejected', () => {
  const result = verify('./index.js', { 'index.js': "const = 1; import './hidden.js'" })
  expect(result.status).toBe(1)
  expect(result.stderr).toContain('index.js does not parse')
})
