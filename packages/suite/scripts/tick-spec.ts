/**
 * Reads a Vitest JSON report from process.argv[2] and ticks matching spec bullets in place.
 * Any passed assertion whose full name ends in a recognized ID can tick that ID, even if
 * other assertions fail. Unknown and already ticked IDs are ignored; this never unticks
 * bullets or proves that all tests for a requirement passed. Input errors propagate.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { SPEC_DIR, readSpec } from './spec-ids'

/** Report fields consumed by this script; parsed JSON is asserted, not validated. */
interface Report {
  /** Per-file test results; file-level outcomes are not inspected. */
  testResults: {
    /** Assertions examined independently for a passing status and ID suffix. */
    assertionResults: {
      /** Full test name searched for a trailing spec ID. */
      fullName: string
      /** Only the literal status "passed" contributes an ID. */
      status: string
    }[]
  }[]
}

/** Report loaded synchronously from the first script argument. */
const report = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as Report
/** Unique ID suffixes found on at least one passed assertion. */
const passed = new Set<string>()
for (const file of report.testResults)
  for (const t of file.assertionResults)
    if (t.status === 'passed') {
      const id = /([a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+)$/.exec(t.fullName)?.[1]
      if (id) passed.add(id)
    }

const spec = readSpec()
/** Unchecked spec bullets grouped by file, using one-based line numbers. */
const byFile = new Map<string, Set<number>>()
for (const id of passed) {
  const b = spec.get(id)
  if (!b || b.ticked) continue
  ;(byFile.get(b.file) ?? byFile.set(b.file, new Set()).get(b.file)!).add(b.line)
}
// Rewrite only the scheduled unchecked markers, preserving the remaining file text.
for (const [file, lines] of byFile) {
  const p = join(SPEC_DIR, file)
  const src = readFileSync(p, 'utf8').split('\n')
  for (const n of lines) src[n - 1] = src[n - 1]!.replace('- [ ]', '- [x]')
  writeFileSync(p, src.join('\n'))
  console.log(`${file}: ticked ${lines.size}`)
}
