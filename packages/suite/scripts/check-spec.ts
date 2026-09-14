import { readSpec, readTests } from './spec-ids'

const spec = readSpec()
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

const byComponent = new Map<string, { total: number; registered: number; runnable: number }>()
for (const [id] of spec) {
  const component = id.split('.')[0]!
  const row = byComponent.get(component) ?? { total: 0, registered: 0, runnable: 0 }
  row.total++
  if (tests.has(id)) row.registered++
  if (runnable.has(id)) row.runnable++
  byComponent.set(component, row)
}
const rows = [...byComponent].filter(([, r]) => r.registered > 0).sort()
console.log('component            runnable / spec    registered (includes TODO/skip)')
for (const [component, r] of rows)
  console.log(
    `${component.padEnd(20)} ${String(r.runnable).padStart(4)} / ${String(r.total).padEnd(4)}    ${r.registered}`
  )
console.log('Runnable is source coverage, not a passing result. See test reports and scope notes.')
