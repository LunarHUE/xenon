import type { Backlog } from './campaign-report'
export type Wave = {
  status: string
  scope: string
  concurrency: string
  workflow: string[]
  sharedAssignments: { id: string; lane: string }[]
  lanes: {
    id: string
    title: string
    slices: {
      id: string
      title: string
      ids: string[]
      paths: string[]
      dependencies: unknown
      risks: unknown
      verification: unknown
    }[]
    firstBatch: {
      slice: string
      path: string
      cases: { title: string; ids: string[]; assertions: string[] }[]
    }
  }[]
}
/** Validate proposals against current evidence, including explicit ownership of shared work. */
export function validateWave(wave: Wave, items: Backlog) {
  const records = new Map(items.map((i) => [i.id, i]))
  const owners = new Map<string, string>()
  const files = new Set<string>()
  const laneIds = new Set<string>()
  for (const lane of wave.lanes) {
    if (laneIds.has(lane.id)) throw new Error(`Duplicate lane: ${lane.id}`)
    laneIds.add(lane.id)
    for (const slice of lane.slices)
      for (const id of slice.ids) {
        const row = records.get(id)
        if (!row || row.status !== 'reconciled') throw new Error(`Not unfinished: ${id}`)
        if (
          row.lane !== lane.id &&
          !wave.sharedAssignments.some(
            (a) => a.id === id && a.lane === lane.id && row.lane === 'coordinator-shared'
          )
        )
          throw new Error(`Wrong lane: ${id}`)
        if (owners.has(id) && owners.get(id) !== lane.id) throw new Error(`Competing owners: ${id}`)
        owners.set(id, lane.id)
      }
    const first = lane.firstBatch
    const slice = lane.slices.find((s) => s.id === first.slice)
    if (!slice || !slice.paths.includes(first.path))
      throw new Error(`Invalid first file/slice: ${lane.id}`)
    if (files.has(first.path)) throw new Error(`Competing file ownership: ${first.path}`)
    files.add(first.path)
    if (first.cases.length < 5 || first.cases.length > 10)
      throw new Error(`Invalid batch size: ${lane.id}`)
    for (const c of first.cases) {
      if (!c.ids.length || !c.assertions.length) throw new Error(`Empty first case: ${c.title}`)
      for (const id of c.ids) {
        if (!slice.ids.includes(id)) throw new Error(`Case outside slice: ${id}`)
        if (
          !['write-tests', 'scope-supported-clauses', 'verify-existing'].includes(
            records.get(id)!.action
          )
        )
          throw new Error(`Resolve dispatch scope first: ${id}`)
      }
    }
  }
}
export function renderWave(wave: Wave, items: Backlog) {
  validateWave(wave, items)
  const lines = [
    '# Proposed first test wave',
    '',
    '<!-- Generated from test-campaign-wave-1.json by campaign:report. Do not edit. -->',
    '',
    `Status: ${wave.status}. No implementation dispatched by this plan.`,
    '',
    wave.scope,
    '',
    wave.concurrency,
    '',
    'Use GPT-6.1 Sol workers. The [generated inventory](test-campaign-summary.md) remains the complete queue; this roadmap prioritizes the first development slices.',
    '',
    'The JSON proposal contains exact IDs, assertions, dependencies, risks and verification commands. Slice sizes count unique requirements; one requirement may need several tests and engines.',
    '',
    '| Lane | First batch | Cases | Requirements |',
    '| --- | --- | ---: | ---: |',
  ]
  for (const lane of wave.lanes)
    lines.push(
      `| ${lane.title} | ${lane.firstBatch.slice} | ${lane.firstBatch.cases.length} | ${new Set(lane.firstBatch.cases.flatMap((c) => c.ids)).size} |`
    )
  for (const lane of wave.lanes) {
    lines.push(
      '',
      `## ${lane.title}`,
      '',
      '| Large slice | Requirements |',
      '| --- | ---: |',
      ...lane.slices.map((s) => `| ${s.title} | ${new Set(s.ids).size} |`),
      '',
      `First file: \`${lane.firstBatch.path}\`.`,
      '',
      ...lane.firstBatch.cases.map(
        (c, index) =>
          `${index + 1}. ${c.assertions.join(' ')} IDs: ${c.ids.map((id) => '`' + id + '`').join(', ')}.`
      )
    )
  }
  lines.push(
    '',
    '## Batch handoff and verification',
    '',
    ...wave.workflow.map((s) => `- ${s}`),
    '',
    'Larger slices must still be divided into reviewed batches before dispatch. Entries flagged for reassessment, contract resolution or unsupported scope cannot be assigned merely because they appear in a roadmap slice.',
    '',
    'Shared assignments in this proposal: ' +
      wave.sharedAssignments.map((a) => `${a.id} to ${a.lane}`).join('; ') +
      '.',
    '',
    'Edit [the proposal](test-campaign-wave-1.json), then run `bun run --cwd packages/suite campaign:report`. `campaign:check` validates IDs, first-batch scope, lane ownership and generated output freshness.',
    ''
  )
  return lines.join('\n')
}
