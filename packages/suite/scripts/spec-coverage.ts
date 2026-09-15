import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readSpec } from './spec-ids'
import { readCases } from './test-cases'
import type { TestCase } from './test-cases'

export const ROOT = resolve(fileURLToPath(new URL('../../../', import.meta.url)))
export const statuses = [
  'covered',
  'partial',
  'missing',
  'deferred',
  'inapplicable',
  'needs-decision',
] as const
export type Disposition = (typeof statuses)[number]
export interface Evidence {
  file: string
  title: string
}
export interface Audit {
  ids: string[]
  status: Disposition
  reason: string
  sources: string[]
  tests?: Evidence[]
}

export function validateAudits(
  records: unknown,
  known: Set<string>,
  cases: TestCase[],
  root = ROOT
): Audit[] {
  if (!Array.isArray(records)) throw new Error('Audit must be an array')
  const seen = new Set<string>()
  const pathExists = (file: unknown): file is string => {
    if (typeof file !== 'string' || !file) return false
    const path = resolve(root, file)
    return path.startsWith(root + sep) && existsSync(path) && statSync(path).isFile()
  }
  for (const raw of records) {
    const row = raw as Audit
    if (
      !row ||
      !Array.isArray(row.ids) ||
      !row.ids.length ||
      !row.ids.every((id) => typeof id === 'string')
    )
      throw new Error('Audit requires nonempty string IDs')
    const label = row.ids.join(', ')
    if (!statuses.includes(row.status)) throw new Error(`${label}: invalid disposition`)
    if (typeof row.reason !== 'string' || !row.reason.trim())
      throw new Error(`${label}: reason required`)
    if (!Array.isArray(row.sources) || !row.sources.length || !row.sources.every(pathExists))
      throw new Error(`${label}: every source must be an existing repository file`)
    for (const id of row.ids) {
      if (!known.has(id)) throw new Error(`Unknown audited ID: ${id}`)
      if (seen.has(id)) throw new Error(`Duplicate audit: ${id}`)
      seen.add(id)
    }
    if (row.tests !== undefined && !Array.isArray(row.tests))
      throw new Error(`${label}: tests must be an array`)
    if (['covered', 'partial'].includes(row.status) && !row.tests?.length)
      throw new Error(`${label}: covered/partial requires test evidence`)
    for (const evidence of row.tests ?? []) {
      if (!pathExists(evidence.file) || typeof evidence.title !== 'string')
        throw new Error(`${label}: invalid test reference`)
      const matches = cases.filter(
        (test) => test.file === evidence.file && test.title === evidence.title
      )
      if (!matches.length)
        throw new Error(
          `${label}: no test titled ${JSON.stringify(evidence.title)} in ${evidence.file}`
        )
      if (!matches.some((test) => !test.inactive && !test.conditional))
        throw new Error(`${label}: evidence is inactive or conditional: ${evidence.title}`)
    }
  }
  return records as Audit[]
}

/** Combine explicit registrations with reviewed mappings, keeping their claims separate. */
export function coverage() {
  const spec = readSpec()
  const cases = [
    'packages/core/src',
    'packages/dom/src',
    'packages/solid/src',
    'packages/suite/src',
    'packages/suite/e2e',
  ]
    .flatMap((directory) => readCases(resolve(ROOT, directory)))
    .map((test) => ({ ...test, file: relative(ROOT, test.file) }))
  const links = new Map<string, TestCase[]>()
  for (const test of cases) {
    for (const id of test.ids) {
      if (!spec.has(id)) throw new Error(`Unknown test ID ${id} in ${test.file}:${test.line}`)
      if (!test.inactive && !test.conditional) links.set(id, [...(links.get(id) ?? []), test])
    }
  }
  const directory = resolve(ROOT, 'packages/suite/coverage')
  const records = existsSync(directory)
    ? readdirSync(directory)
        .filter((name) => name.endsWith('.json'))
        .sort()
        .flatMap((name) => {
          const rows: unknown = JSON.parse(readFileSync(resolve(directory, name), 'utf8'))
          if (!Array.isArray(rows)) throw new Error(`${name}: expected audit array`)
          return rows
        })
    : []
  const audits = validateAudits(records, new Set(spec.keys()), cases)
  const byId = new Map(audits.flatMap((audit) => audit.ids.map((id) => [id, audit] as const)))
  const rows = [...spec.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((bullet) => {
      const audit = byId.get(bullet.id)
      const direct = links.get(bullet.id) ?? []
      return {
        ...bullet,
        component: bullet.id.split('.')[0]!,
        status: audit?.status ?? (direct.length ? 'linked' : 'unreviewed'),
        reason:
          audit?.reason ??
          (direct.length
            ? 'Explicit ID registration exists; full requirement-to-assertion review remains outstanding.'
            : 'No reviewed mapping or scope disposition yet. This is not evidence that the behavior is untested or unshipped.'),
        sources: audit?.sources ?? [],
        tests: (audit?.tests ?? []).map((evidence) => {
          const test = cases.find(
            (test) =>
              test.file === evidence.file &&
              test.title === evidence.title &&
              !test.inactive &&
              !test.conditional
          )!
          return { ...evidence, line: test.line }
        }),
        registrations: direct.map(({ file, title, line }) => ({ file, title, line })),
      }
    })
  return { rows, cases }
}
