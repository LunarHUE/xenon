import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseTests } from './test-cases'
import { readSpec } from './spec-ids'
import { validateAudits } from './spec-coverage'

const directories: string[] = []
afterEach(() =>
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }))
)
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'spec-audit-'))
  directories.push(directory)
  return directory
}

test('registration discovery excludes comments, assertion strings, and uncalled helpers', () => {
  const cases = parseTests(`
    // spec('fake.roles.1', () => {})
    const example = "test('fake.roles.2', () => {})"
    function helper() { test('fake.roles.3', () => {}) }
    const arrowHelper = () => test('fake.roles.6', () => {})
    const expressionHelper = function () { test('fake.roles.7', () => {}) }
    it("real.roles.1 and real.roles.2", () => {
      expect("spec('fake.roles.4', () => {})").toBeDefined()
      test.skip(true, 'fake.roles.5')
    })
  `)
  expect(cases.map((entry) => entry.ids)).toEqual([['real.roles.1', 'real.roles.2']])
})

test('nested skips and conditional registrations are never definite runnable evidence', () => {
  const cases = parseTests(`
    describe.skip('not run', () => { test('sample.roles.1', () => {}) })
    test.todo('sample.roles.2')
    test.skipIf(flag)('sample.roles.3', () => {})
    if (flag) test('sample.roles.4', () => {})
    test('sample.roles.5', () => {})
  `)
  expect(
    cases.filter((entry) => !entry.inactive && !entry.conditional).map((entry) => entry.title)
  ).toEqual(['sample.roles.5'])
})

test('static table loops, aliases, template literals and parameterized titles are recognized', () => {
  const cases = parseTests(`
    import { test as check } from 'vitest'
    for (const [id, key] of [['tabs.keyboard.1','Enter'],['tabs.keyboard.2','Space']] as const) {
      spec(id, () => {})
    }
    check.each([true, false])('plain parameter %s', () => {})
    check(\`tabs.state.1\`, () => {})
  `)
  expect(cases.map((entry) => entry.title)).toEqual([
    'tabs.keyboard.1',
    'tabs.keyboard.2',
    'plain parameter %s',
    'tabs.state.1',
  ])
})

test('fenced README examples cannot overwrite real requirements', () => {
  const directory = fixture()
  writeFileSync(join(directory, 'README.md'), '```md\n- [ ] `button.keyboard.3` Example\n```')
  writeFileSync(join(directory, 'button.md'), '- [x] `button.keyboard.3` Actual contract')
  expect(readSpec(directory).get('button.keyboard.3')).toMatchObject({
    file: 'button.md',
    text: 'Actual contract',
    ticked: true,
  })
  writeFileSync(join(directory, 'duplicate.md'), '- [ ] `button.keyboard.3` Conflicting contract')
  expect(() => readSpec(directory)).toThrow('Duplicate requirement ID')
})

test('audits reject stale titles, missing sources, unknown IDs, duplicates and inactive evidence', () => {
  const directory = fixture()
  writeFileSync(join(directory, 'evidence.test.ts'), '')
  writeFileSync(join(directory, 'scope.md'), '')
  mkdirSync(join(directory, 'not-a-file'))
  const known = new Set(['sample.roles.1'])
  const cases = parseTests("test('actual title', () => {})", 'evidence.test.ts')
  const record = {
    ids: ['sample.roles.1'],
    status: 'covered' as const,
    reason: 'Assertions cover the named role.',
    sources: ['scope.md'],
    tests: [{ file: 'evidence.test.ts', title: 'actual title' }],
  }
  expect(validateAudits([record], known, cases, directory)).toEqual([record])
  expect(() =>
    validateAudits(
      [{ ...record, tests: [{ file: 'evidence.test.ts', title: 'stale' }] }],
      known,
      cases,
      directory
    )
  ).toThrow('no test titled')
  expect(() =>
    validateAudits([{ ...record, sources: ['missing.md'] }], known, cases, directory)
  ).toThrow('source')
  expect(() =>
    validateAudits([{ ...record, ids: ['unknown.roles.1'] }], known, cases, directory)
  ).toThrow('Unknown')
  expect(() => validateAudits([record, record], known, cases, directory)).toThrow('Duplicate')
  expect(() =>
    validateAudits([{ ...record, sources: ['not-a-file'] }], known, cases, directory)
  ).toThrow('source')
  expect(() =>
    validateAudits([{ ...record, sources: ['../scope.md'] }], known, cases, directory)
  ).toThrow('source')
  expect(() =>
    validateAudits(
      [record],
      known,
      cases.map((entry) => ({ ...entry, inactive: true })),
      directory
    )
  ).toThrow('inactive')
  expect(() => validateAudits([{ ...record, tests: [] }], known, cases, directory)).toThrow(
    'requires test evidence'
  )
})

test('called declaration helpers retain dynamic source titles without inventing IDs', () => {
  const cases = parseTests(`
    register('tabs.keyboard.1')
    function register(id) { test(id, () => {}) }
    for (const value of [NaN, Infinity]) dynamic(value)
    function dynamic(value) { test(\`clears values for \${String(value)}\`, () => {}) }
    test(\`\${tag}.roles.1\`, () => {})
  `)
  expect(cases.map((entry) => entry.title)).toEqual([
    'tabs.keyboard.1',
    'clears values for ${String(value)}',
    '${tag}.roles.1',
  ])
  expect(cases.flatMap((entry) => entry.ids)).toEqual(['tabs.keyboard.1'])
})
