import { afterEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { validateAudits, type Audit } from './spec-coverage'
import { parseTests } from './test-cases'

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'xenon-audit-validation-'))
  directories.push(root)
  writeFileSync(join(root, 'source.md'), 'Contract')
  writeFileSync(join(root, 'evidence.test.ts'), '')
  const record: Audit = {
    ids: ['tabs.roles.1'],
    status: 'covered',
    reason: 'Role asserted',
    sources: ['source.md'],
    tests: [{ file: 'evidence.test.ts', title: 'role evidence' }],
  }
  const cases = parseTests("test('role evidence', () => {})", 'evidence.test.ts')
  const validate = (records: unknown) =>
    validateAudits(records, new Set(['tabs.roles.1', 'tabs.roles.2']), cases, root)
  return { root, record, cases, validate }
}

for (const input of [null, {}, '[]', 1]) {
  test(`audit rejects a non-array input ${JSON.stringify(input)}`, () => {
    expect(() => fixture().validate(input)).toThrow('Audit must be an array')
  })
}
for (const ids of [undefined, [], 'tabs.roles.1', [1], ['tabs.roles.1', null]]) {
  test(`audit rejects malformed IDs ${JSON.stringify(ids)}`, () => {
    const { record, validate } = fixture()
    expect(() => validate([{ ...record, ids }])).toThrow('nonempty string IDs')
  })
}
for (const reason of ['', ' \n\t', null, 1]) {
  test(`audit requires a substantive reason ${JSON.stringify(reason)}`, () => {
    const { record, validate } = fixture()
    expect(() => validate([{ ...record, reason }])).toThrow('reason required')
  })
}
for (const sources of [[], undefined, 'source.md', ['source.md', 2], ['source.md', 'missing.md']]) {
  test(`audit validates every source ${JSON.stringify(sources)}`, () => {
    const { record, validate } = fixture()
    expect(() => validate([{ ...record, sources }])).toThrow('every source')
  })
}
for (const status of ['missing', 'deferred', 'inapplicable', 'needs-decision'] as const) {
  test(`${status} records permit a reasoned disposition without test evidence`, () => {
    const { record, validate } = fixture()
    const row = { ...record, status, tests: undefined }
    expect(validate([row])).toEqual([row])
  })
}

test('partial records still require runnable test evidence', () => {
  const { record, validate } = fixture()
  expect(() => validate([{ ...record, status: 'partial', tests: [] }])).toThrow(
    'requires test evidence'
  )
})

test('unknown dispositions and non-array evidence fail validation', () => {
  const { record, validate } = fixture()
  expect(() => validate([{ ...record, status: 'linked' }])).toThrow('invalid disposition')
  expect(() => validate([{ ...record, tests: {} }])).toThrow('tests must be an array')
})

test('an ID cannot occur twice within the same grouped audit', () => {
  const { record, validate } = fixture()
  expect(() => validate([{ ...record, ids: ['tabs.roles.1', 'tabs.roles.1'] }])).toThrow(
    'Duplicate audit'
  )
})

test('evidence must match both source path and exact title', () => {
  const { root, record, validate } = fixture()
  writeFileSync(join(root, 'other.test.ts'), '')
  expect(() =>
    validate([{ ...record, tests: [{ file: 'other.test.ts', title: 'role evidence' }] }])
  ).toThrow('no test titled')
  expect(() =>
    validate([{ ...record, tests: [{ file: 'evidence.test.ts', title: 123 }] }])
  ).toThrow('invalid test reference')
})

test('a runnable match permits evidence even if an identically titled match is skipped', () => {
  const { root, record, cases } = fixture()
  const inactive = { ...cases[0]!, inactive: true }
  expect(validateAudits([record], new Set(record.ids), [inactive, ...cases], root)).toEqual([
    record,
  ])
})

test('conditional-only evidence does not substantiate covered claims', () => {
  const { root, record, cases } = fixture()
  expect(() =>
    validateAudits(
      [record],
      new Set(record.ids),
      cases.map((entry) => ({ ...entry, conditional: true })),
      root
    )
  ).toThrow('inactive or conditional')
})

test('dispositions with optional evidence validate it rather than silently discarding it', () => {
  const { record, validate } = fixture()
  expect(() =>
    validate([
      { ...record, status: 'deferred', tests: [{ file: 'evidence.test.ts', title: 'stale' }] },
    ])
  ).toThrow('no test titled')
})

test('grouped evidence can cover several known IDs without mutating the input', () => {
  const { record, validate } = fixture()
  const rows = [{ ...record, ids: ['tabs.roles.1', 'tabs.roles.2'] }]
  const before = structuredClone(rows)
  expect(validate(rows)).toEqual(before)
  expect(rows).toEqual(before)
  expect(validate([])).toEqual([])
})
