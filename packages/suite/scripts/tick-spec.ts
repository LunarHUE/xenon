import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { SPEC_DIR, readSpec } from './spec-ids'

interface Report {
  testResults: { assertionResults: { fullName: string; status: string }[] }[]
}

const report = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as Report
const passed = new Set<string>()
for (const file of report.testResults)
  for (const t of file.assertionResults)
    if (t.status === 'passed') {
      const id = /([a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+)$/.exec(t.fullName)?.[1]
      if (id) passed.add(id)
    }

const spec = readSpec()
const byFile = new Map<string, Set<number>>()
for (const id of passed) {
  const b = spec.get(id)
  if (!b || b.ticked) continue
  ;(byFile.get(b.file) ?? byFile.set(b.file, new Set()).get(b.file)!).add(b.line)
}
for (const [file, lines] of byFile) {
  const p = join(SPEC_DIR, file)
  const src = readFileSync(p, 'utf8').split('\n')
  for (const n of lines) src[n - 1] = src[n - 1]!.replace('- [ ]', '- [x]')
  writeFileSync(p, src.join('\n'))
  console.log(`${file}: ticked ${lines.size}`)
}
