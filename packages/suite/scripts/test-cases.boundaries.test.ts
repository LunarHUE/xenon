import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseTests, readCases } from './test-cases'
import { readSpec, readTests } from './spec-ids'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'xenon-parser-boundaries-'))
  directories.push(directory)
  return directory
}

test('registration locations refer to the call site and preserve supplied filenames', () => {
  const cases = parseTests(
    '\n// heading\n  test("tabs.roles.1", () => {})\n',
    'nested/example.test.tsx'
  )
  expect(cases).toEqual([
    {
      file: 'nested/example.test.tsx',
      line: 3,
      title: 'tabs.roles.1',
      inactive: false,
      conditional: false,
      ids: ['tabs.roles.1'],
    },
  ])
})

test('ID extraction deduplicates exact IDs and rejects embedded or extended tokens', () => {
  const [entry] = parseTests(
    `test('tabs.roles.1 tabs.roles.1 [tabs.roles.2] tabs.3 xtabs.roles.4suffix tabs.roles.5.extra prefix_tabs.roles.6 tabs.roles.7-extended', () => {})`
  )
  expect(entry!.ids).toEqual(['tabs.roles.1', 'tabs.roles.2', 'tabs.3'])
})

for (const modifier of ['skip', 'todo', 'fixme']) {
  test(`describe.${modifier} propagates inactivity through nested groups`, () => {
    const cases = parseTests(
      `describe.${modifier}('outer', () => { describe('inner', () => { test('tabs.roles.1', () => {}) }) }); test('tabs.roles.2', () => {})`
    )
    expect(cases.map(({ inactive, conditional }) => [inactive, conditional])).toEqual([
      [true, false],
      [false, false],
    ])
  })
}
for (const modifier of ['skipIf(flag)', 'runIf(flag)', 'fails', 'failing']) {
  test(`test.${modifier} cannot establish definite execution`, () => {
    const [entry] = parseTests(`test.${modifier}('tabs.roles.1', () => {})`)
    expect(entry).toMatchObject({ title: 'tabs.roles.1', conditional: true })
  })
}

test('both conditional branches remain uncertain even with a literal condition', () => {
  expect(
    parseTests(
      `if (true) { test('tabs.roles.1', () => {}) } else { test('tabs.roles.2', () => {}) }`
    ).map((entry) => entry.conditional)
  ).toEqual([true, true])
})

test('static nested table bindings resolve helper parameters without leaking the final row', () => {
  const cases = parseTests(`
    const rows = [['tabs', ['1', '2']], ['menu', ['3']]] as const
    for (const [component, numbers] of rows) {
      for (const number of numbers) register(component, number)
    }
    function register(component, number) { test(\`\${component}.roles.\${number}\`, () => {}) }
    test(\`\${component}.roles.4\`, () => {})
  `)
  expect(cases.map((entry) => entry.title)).toEqual([
    'tabs.roles.1',
    'tabs.roles.2',
    'menu.roles.3',
    '${component}.roles.4',
  ])
  expect(cases.flatMap((entry) => entry.ids)).toEqual([
    'tabs.roles.1',
    'tabs.roles.2',
    'menu.roles.3',
  ])
})

test('recursive declaration helpers terminate and retain registrations on either side', () => {
  const cases = parseTests(
    `function register(id) { test(id, () => {}); register(id); test('tabs.roles.2', () => {}) } register('tabs.roles.1')`
  )
  expect(cases.map((entry) => entry.title)).toEqual(['tabs.roles.1', 'tabs.roles.2'])
})

test('aliased describe and it preserve skipped ancestry and ignore nested test bodies', () => {
  const cases = parseTests(
    `import { describe as group, it as check } from 'vitest'; group.skip('outer', () => { check('tabs.roles.1', () => { test('fake.roles.2', () => {}) }) })`
  )
  expect(cases).toHaveLength(1)
  expect(cases[0]).toMatchObject({ inactive: true, ids: ['tabs.roles.1'] })
})

test('recursive discovery includes test and spec TS/TSX files but excludes ordinary sources', () => {
  const directory = fixture()
  mkdirSync(join(directory, 'nested'))
  const names = [
    'a.test.ts',
    'b.test.tsx',
    'c.test-browser.ts',
    'd.test-browser.tsx',
    'e.spec.ts',
    'f.spec.tsx',
  ]
  for (const name of names)
    writeFileSync(join(directory, 'nested', name), `test('tabs.roles.1', () => {})`)
  for (const name of ['example.ts', 'example.test.js', 'example.test.ts.bak'])
    writeFileSync(join(directory, name), `test('fake.roles.1', () => {})`)
  expect(readCases(directory).map((entry) => entry.file)).toEqual(
    names.map((name) => join(directory, 'nested', name))
  )
})

test('readTests retains multiple evidence paths and filters inactive and conditional cases', () => {
  const directory = fixture()
  writeFileSync(
    join(directory, 'a.test.ts'),
    `test('tabs.roles.1', () => {}); test.skip('tabs.roles.2', () => {}); if (flag) test('tabs.roles.3', () => {})`
  )
  writeFileSync(join(directory, 'b.spec.ts'), `test('tabs.roles.1', () => {})`)
  expect([...readTests(directory).keys()]).toEqual(['tabs.roles.1', 'tabs.roles.2', 'tabs.roles.3'])
  expect([...readTests(directory, false)]).toEqual([
    ['tabs.roles.1', [join(directory, 'a.test.ts'), join(directory, 'b.spec.ts')]],
  ])
})

test('Markdown fences require matching characters and sufficient closing length', () => {
  const directory = fixture()
  writeFileSync(
    join(directory, 'a.md'),
    [
      '````md',
      '- [ ] `fake.roles.1` hidden',
      '```',
      '- [ ] `fake.roles.2` still hidden',
      '~~~~',
      '- [ ] `fake.roles.3` still hidden',
      '````',
      '- [x] `tabs.roles.1` Actual contract',
      '~~~md',
      '- [ ] `fake.roles.4` hidden',
      '~~~',
      '- [ ] `tabs.roles.2` Second contract',
    ].join('\n')
  )
  expect([...readSpec(directory).values()]).toEqual([
    { id: 'tabs.roles.1', file: 'a.md', line: 8, ticked: true, text: 'Actual contract' },
    { id: 'tabs.roles.2', file: 'a.md', line: 12, ticked: false, text: 'Second contract' },
  ])
})

test('only immediate Markdown checklists are read and an empty directory has no requirements', () => {
  const directory = fixture()
  expect(readSpec(directory).size).toBe(0)
  mkdirSync(join(directory, 'nested'))
  writeFileSync(join(directory, 'nested', 'hidden.md'), '- [ ] `fake.roles.1` Nested')
  writeFileSync(join(directory, 'ignored.txt'), '- [ ] `fake.roles.2` Text')
  writeFileSync(
    join(directory, 'actual.md'),
    '- [X] `fake.roles.3` Uppercase\n  - [ ] `fake.roles.4` Indented\n- [ ] `tabs.roles.1`  Trimmed wording  '
  )
  expect([...readSpec(directory).values()]).toEqual([
    { id: 'tabs.roles.1', file: 'actual.md', line: 3, ticked: false, text: 'Trimmed wording' },
  ])
})
