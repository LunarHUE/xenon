/**
 * Reports source registration coverage for docs/spec against suite src and e2e.
 * Runs immediately when loaded. Unknown scanned IDs print an error and exit 1;
 * missing registrations, inactive tests, and unchecked bullets do not fail this
 * script. No tests execute and no files are written. Coverage is based on the
 * regex scanner's limits, not proof that a requirement passes.
 *
 * @packageDocumentation
 */
import { readSpec, readTests } from './spec-ids'

const spec = readSpec()
/**
 * Combines source-path lists from this package's src and e2e trees. Direct todo/skip
 * matches are included by default; false excludes only those scanner-recognized forms.
 * Repeated occurrences and matches across both trees are preserved in each ID list.
 */
function collect(includeInactive = true) {
  const out = new Map<string, string[]>()
  for (const directory of ['../src', '../e2e']) {
    for (const [id, files] of readTests(
      new URL(directory, import.meta.url).pathname,
      includeInactive
    )) {
      out.set(id, [...(out.get(id) ?? []), ...files])
    }
  }
  return out
}
const tests = collect()
const runnable = collect(false)

const unknown = [...tests.keys()].filter((id) => !spec.has(id))
if (unknown.length) {
  console.error('tests reference ids that are not in docs/spec:\n  ' + unknown.join('\n  '))
  process.exit(1)
}

/** Counts unique parsed IDs by first name segment; path occurrences do not inflate counts. */
const byComponent = new Map<
  string,
  {
    /** Unique requirement IDs parsed for this component. */
    total: number
    /** IDs with at least one source match, including direct todo/skip calls. */
    registered: number
    /** IDs with at least one source match remaining after direct todo/skip filtering. */
    runnable: number
  }
>()
for (const [id] of spec) {
  const component = id.split('.')[0]!
  const row = byComponent.get(component) ?? { total: 0, registered: 0, runnable: 0 }
  row.total++
  if (tests.has(id)) row.registered++
  if (runnable.has(id)) row.runnable++
  byComponent.set(component, row)
}
/** Prints only components with at least one scanned registration, sorted by the default array comparator. */
const rows = [...byComponent].filter(([, r]) => r.registered > 0).sort()
console.log('component            runnable / spec    registered (includes TODO/skip)')
for (const [component, r] of rows)
  console.log(
    `${component.padEnd(20)} ${String(r.runnable).padStart(4)} / ${String(r.total).padEnd(4)}    ${r.registered}`
  )
console.log('Runnable is source coverage, not a passing result. See test reports and scope notes.')
