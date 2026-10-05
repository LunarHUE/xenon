import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderWave, type Wave } from './campaign-wave'

const statuses = ['queued', 'reconciled', 'verified', 'excluded', 'decision'] as const
type Status = (typeof statuses)[number]
type Review = { id: string; classification?: string; category?: string; [key: string]: unknown }
type Batch = {
  id: string
  status: Status
  ids: string[]
  scopeReview?: Review[]
  acceptedClauses?: string[]
  remainingClauses?: string[]
}
export type Campaign = {
  records: {
    ids: string[]
    domain: string
    status: Status
    historicalStatus: string
    reason: string
  }[]
  batches: Batch[]
}
const lanes: Record<string, string> = {
  'menus-navigation': 'menus-navigation',
  'collections-layout': 'menus-navigation',
  'popup-selection': 'selection-forms',
  'inputs-forms': 'selection-forms',
  'overlays-positioning': 'overlays-focus',
  'shared-contracts': 'coordinator-shared',
}
const categories: Record<string, string> = {
  writable: 'write-tests',
  mixed: 'scope-supported-clauses',
  'existing-needs-execution': 'verify-existing',
  existingAssertionsNeedExecution: 'verify-existing',
  residualUnsupported: 'unsupported-residual',
  unshipped: 'unsupported-residual',
  residualExcluded: 'unsupported-residual',
  assertionConflict: 'reproduce-conflict',
  sourceAssertionConflict: 'reproduce-conflict',
  platformLimitation: 'browser-limitation',
  decision: 'resolve-contract',
  contractDecision: 'resolve-contract',
}

/** Project recorded evidence; never infer passing tests or full coverage from a review. */
export function buildBacklog(campaign: Campaign) {
  const entries = new Map<
    string,
    {
      id: string
      domain: string
      lane: string
      historicalStatus: string
      status: Status
      reason: string
      latestBatch?: string
      latestReviewBatch?: string
      review?: Review
      acceptedClauses: string[]
      remainingClauses: string[]
    }
  >()
  const validateStatus = (status: Status) => {
    if (!statuses.includes(status)) throw new Error(`Unknown status: ${status}`)
  }
  for (const record of campaign.records) {
    validateStatus(record.status)
    if (!lanes[record.domain]) throw new Error(`Unknown domain: ${record.domain}`)
    for (const id of record.ids) {
      if (entries.has(id)) throw new Error(`Duplicate requirement: ${id}`)
      entries.set(id, {
        id,
        domain: record.domain,
        lane: lanes[record.domain]!,
        historicalStatus: record.historicalStatus,
        status: record.status,
        reason: record.reason,
        acceptedClauses: [],
        remainingClauses: [],
      })
    }
  }
  const batchIds = new Set<string>()
  for (const batch of campaign.batches) {
    validateStatus(batch.status)
    if (batchIds.has(batch.id)) throw new Error(`Duplicate batch: ${batch.id}`)
    batchIds.add(batch.id)
    if (new Set(batch.ids).size !== batch.ids.length) throw new Error(`Repeated ID in ${batch.id}`)
    for (const id of batch.ids) {
      const entry = entries.get(id)
      if (!entry) throw new Error(`Unknown requirement: ${id}`)
      entry.status = batch.status
      entry.latestBatch = batch.id
      // Clauses are batch-scoped. Preserve them verbatim rather than assigning prose by heuristics.
      entry.acceptedClauses = batch.acceptedClauses ?? []
      entry.remainingClauses = batch.remainingClauses ?? []
    }
    const reviewed = new Set<string>()
    for (const review of batch.scopeReview ?? []) {
      if (!batch.ids.includes(review.id) || reviewed.has(review.id)) {
        throw new Error(`Invalid review membership: ${review.id} in ${batch.id}`)
      }
      reviewed.add(review.id)
      const classification = review.classification ?? review.category
      if (classification && !categories[classification])
        throw new Error(`Unknown classification: ${classification}`)
      const entry = entries.get(review.id)!
      entry.latestReviewBatch = batch.id
      entry.review = review
    }
  }
  return [...entries.values()]
    .sort((a, b) => a.id.localeCompare(b.id, 'en'))
    .map((entry) => {
      const classification = entry.review?.classification ?? entry.review?.category
      let action: string
      if (entry.status !== 'reconciled')
        action = entry.status === 'queued' ? 'needs-review' : entry.status
      else if (entry.latestBatch !== entry.latestReviewBatch) action = 'reassess-remaining'
      else action = classification ? categories[classification]! : 'needs-triage'
      return {
        ...entry,
        action,
        classification: classification ?? null,
        // Full source review remains in the ledger, addressed by batch and requirement ID.
        review: undefined,
        nextAssertion:
          entry.review?.remainingAcceptedAssertions ??
          entry.review?.remainingAcceptedAssertionsAndLimits ??
          entry.review?.remainingShippedAssertions ??
          entry.review?.remainingOrNext ??
          entry.review?.currentEvidenceAndRemaining ??
          entry.review?.rationale ??
          null,
        scopeLimit:
          entry.review?.scopeLimitOrAlternative ??
          entry.review?.scopeLimitOrConflict ??
          entry.review?.unshippedOrAlternativeResidual ??
          null,
      }
    })
}
export type Backlog = ReturnType<typeof buildBacklog>
function count(values: string[]) {
  return Object.fromEntries(
    [...new Set(values)].sort().map((value) => [value, values.filter((v) => v === value).length])
  )
}
export function renderSummary(items: Backlog, hash: string) {
  const lines = [
    '# Test campaign summary',
    '',
    '<!-- Generated by bun run campaign:report in packages/suite. Do not edit. -->',
    '',
    `Source SHA-256: \`${hash}\`.`,
    '',
    'Source: [reviewed campaign records](test-campaign.json). Detailed generated queue: [test-campaign-backlog.json](test-campaign-backlog.json).',
    '',
    'Counts are requirement IDs, not test cases or line coverage. This report projects recorded review and execution claims; it does not run tests or independently certify those claims.',
    '',
    '## Recorded status',
    '',
    '| Status | Requirements |',
    '| --- | ---: |',
    ...Object.entries(count(items.map((i) => i.status))).map(([s, n]) => `| ${s} | ${n} |`),
    '',
    '## Remaining work',
    '',
    'Mixed clauses require a supported assertion list before dispatch. Unsupported residuals are retained, not marked complete. A later partial batch invalidates the old dispatch category: reassess its remaining clauses before assigning more tests. Records without a classification stay in triage.',
    '',
    '| Next action | Requirements |',
    '| --- | ---: |',
    ...Object.entries(
      count(
        items.filter((i) => i.status === 'reconciled' || i.status === 'queued').map((i) => i.action)
      )
    ).map(([s, n]) => `| ${s} | ${n} |`),
    '',
    '## Lane ownership',
    '',
    'Shared contracts belong to the coordinator until one lane is assigned each concrete batch. Each requirement appears in exactly one lane; shared source fixes are serialized.',
    '',
    '| Lane | Write tests | Scope mixed clauses | Verify existing | Other unfinished |',
    '| --- | ---: | ---: | ---: | ---: |',
  ]
  for (const lane of [...new Set(Object.values(lanes))]) {
    const unfinished = items.filter(
      (i) => i.lane === lane && ['reconciled', 'queued', 'decision'].includes(i.status)
    )
    const n = (action: string) => unfinished.filter((i) => i.action === action).length
    lines.push(
      `| ${lane} | ${n('write-tests')} | ${n('scope-supported-clauses')} | ${n('verify-existing')} | ${unfinished.filter((i) => !['write-tests', 'scope-supported-clauses', 'verify-existing'].includes(i.action)).length} |`
    )
  }
  lines.push(
    '',
    '## Refresh and review',
    '',
    '- Run `bun run --cwd packages/suite campaign:report` after recording reviewed evidence.',
    '- Run `bun run --cwd packages/suite campaign:check` to detect stale outputs.',
    '- Source reviews and execution evidence remain authored records. Totals and dispatch categories are derived, with no automatic promotion to verified.',
    '- Read the latest batch remaining clauses as well as the scope review before dispatching.',
    ''
  )
  return lines.join('\n')
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, '../../..')
  const source = readFileSync(resolve(root, 'docs/plans/test-campaign.json'), 'utf8')
  const hash = createHash('sha256').update(source).digest('hex')
  const items = buildBacklog(JSON.parse(source) as Campaign)
  const wave = JSON.parse(
    readFileSync(resolve(root, 'docs/plans/test-campaign-wave-1.json'), 'utf8')
  ) as Wave
  const outputs = {
    'test-campaign-backlog.json':
      JSON.stringify(
        {
          schemaVersion: 1,
          source: 'test-campaign.json',
          sourceSha256: hash,
          clauseScope:
            'acceptedClauses and remainingClauses belong to latestBatch; nextAssertion belongs to latestReviewBatch and may be older.',
          totals: count(items.map((i) => i.status)),
          batchClauses: Object.fromEntries(
            items
              .filter((i) => i.latestBatch)
              .map((i) => [
                i.latestBatch!,
                {
                  acceptedClauses: i.acceptedClauses,
                  remainingClauses: i.remainingClauses,
                },
              ])
          ),
          items: items.map((i) => ({
            id: i.id,
            domain: i.domain,
            lane: i.lane,
            status: i.status,
            historicalStatus: i.historicalStatus,
            action: i.action,
            classification: i.classification,
            latestBatch: i.latestBatch,
            latestReviewBatch: i.latestReviewBatch,
            nextAssertion: i.nextAssertion,
            scopeLimit: i.scopeLimit,
          })),
        },
        null,
        2
      ) + '\n',
    'test-campaign-summary.md': renderSummary(items, hash),
    'test-campaign-wave-1.md': renderWave(wave, items),
  }
  if (process.argv.slice(2).some((arg) => arg !== '--check'))
    throw new Error('Usage: campaign-report.ts [--check]')
  for (const [name, content] of Object.entries(outputs)) {
    const path = resolve(root, 'docs/plans', name)
    if (process.argv.includes('--check')) {
      let current = ''
      try {
        current = readFileSync(path, 'utf8')
      } catch {
        /* Missing output is stale. */
      }
      if (current !== content) throw new Error(`${name} is stale; run campaign:report`)
    } else writeFileSync(path, content)
  }
  console.log(
    `${process.argv.includes('--check') ? 'Checked' : 'Generated'} ${items.length} requirement records`
  )
}
