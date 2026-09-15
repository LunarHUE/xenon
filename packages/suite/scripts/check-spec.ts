/** Validate evidence and report requirement coverage; this does not execute tests. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { coverage, ROOT, statuses } from './spec-coverage'

const { rows } = coverage()
const columns = [...statuses, 'linked', 'unreviewed'] as const
function counts(items: typeof rows) {
  return Object.fromEntries(
    columns.map((status) => [status, items.filter((row) => row.status === status).length])
  )
}
const totals = counts(rows)
const linked = rows.filter((row) => row.registrations.length).length
const accepted = totals.covered! + totals.partial! + totals.missing!
const percentage = (part: number, whole: number) =>
  whole ? `${((100 * part) / whole).toFixed(1)}%` : 'n/a'
const components = [...new Set(rows.map((row) => row.component))].sort()
const summary = [
  '# Spec coverage audit',
  '',
  `Inventory: **${rows.length} requirement IDs**. Explicit active source registrations: **${linked} (${percentage(linked, rows.length)})**.`,
  '',
  `Reviewed full coverage: **${totals.covered} / ${accepted} (${percentage(totals.covered!, accepted)})** of the reviewed, accepted requirements. This is a subset, not an overall shipped-API coverage percentage.`,
  '',
  '| Status | Requirements |',
  '| --- | ---: |',
  ...columns.map((status) => `| ${status} | ${totals[status]} |`),
  '',
  'Covered means the cited assertions address the whole bullet; partial means they address only part. Missing means an accepted behavior lacks an assertion. Deferred and inapplicable require scope evidence. Needs-decision means an unresolved contract choice. Linked means an explicit ID exists but has not received assertion review. Unreviewed means no disposition has been established.',
  '',
  'These are source audits, not passing execution results. Requirements without checklist IDs are outside this inventory. Runtime-generated registrations that the static parser cannot resolve may be omitted. Neither an unchecked box nor an absent ID link proves a test is missing.',
  '',
  '| Component | Total | Covered | Partial | Missing | Deferred | Inapplicable | Needs decision | Linked | Unreviewed |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...components.map((component) => {
    const items = rows.filter((row) => row.component === component)
    const count = counts(items)
    return `| ${component} | ${items.length} | ${columns.map((status) => count[status]).join(' | ')} |`
  }),
  '',
  'Detailed requirement text, rationale, source paths, test titles, and line numbers are in coverage.json beside this report. Audited decisions live in packages/suite/coverage/*.json; regenerate after changes.',
  '',
].join('\n')
console.log(summary)
const outputIndex = process.argv.indexOf('--output')
if (outputIndex !== -1) {
  const argument = process.argv[outputIndex + 1]
  if (!argument || argument.startsWith('--')) throw new Error('--output requires a directory')
  const directory = resolve(ROOT, argument)
  mkdirSync(directory, { recursive: true })
  writeFileSync(resolve(directory, 'coverage.md'), summary)
  writeFileSync(
    resolve(directory, 'coverage.json'),
    JSON.stringify({ totals, explicitRegistrations: linked, rows }, null, 2) + '\n'
  )
}
