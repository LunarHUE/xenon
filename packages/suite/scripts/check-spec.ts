import { readSpec, readTests } from './spec-ids'

const spec = readSpec()
const tests = readTests(new URL('../src', import.meta.url).pathname)

const unknown = [...tests.keys()].filter((id) => !spec.has(id))
if (unknown.length) {
  console.error('tests reference ids that are not in docs/spec:\n  ' + unknown.join('\n  '))
  process.exit(1)
}

const byComponent = new Map<string, { total: number; tested: number }>()
for (const [id] of spec) {
  const component = id.split('.')[0]!
  const row = byComponent.get(component) ?? { total: 0, tested: 0 }
  row.total++
  if (tests.has(id)) row.tested++
  byComponent.set(component, row)
}
const rows = [...byComponent].filter(([, r]) => r.tested > 0).sort()
for (const [component, r] of rows) console.log(`${component.padEnd(20)} ${r.tested}/${r.total}`)
