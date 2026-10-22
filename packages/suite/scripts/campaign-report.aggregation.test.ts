import { expect, test } from 'bun:test'
import { buildBacklog, renderSummary, type Campaign } from './campaign-report'

function campaign(): Campaign {
  return {
    records: [
      {
        ids: ['tabs.roles.2', 'tabs.roles.1'],
        domain: 'collections-layout',
        status: 'queued',
        historicalStatus: 'partial',
        reason: 'Review required',
      },
    ],
    batches: [],
  }
}

for (const [domain, lane] of Object.entries({
  'menus-navigation': 'menus-navigation',
  'collections-layout': 'menus-navigation',
  'popup-selection': 'selection-forms',
  'inputs-forms': 'selection-forms',
  'overlays-positioning': 'overlays-focus',
  'shared-contracts': 'coordinator-shared',
})) {
  test(`${domain} requirements are assigned to ${lane}`, () => {
    const data = campaign()
    data.records[0]!.domain = domain
    expect(buildBacklog(data).map((row) => row.lane)).toEqual([lane, lane])
  })
}

for (const [classification, action] of Object.entries({
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
})) {
  test(`review classification ${classification} produces action ${action}`, () => {
    const data = campaign()
    data.batches.push({
      id: 'review',
      ids: ['tabs.roles.1'],
      status: 'reconciled',
      scopeReview: [{ id: 'tabs.roles.1', classification }],
    })
    expect(buildBacklog(data)[0]).toMatchObject({ action, classification, status: 'reconciled' })
  })
}

test('backlog is sorted by requirement ID and batch claims stay scoped to their members', () => {
  const data = campaign()
  data.batches.push({
    id: 'partial',
    status: 'reconciled',
    ids: ['tabs.roles.2'],
    acceptedClauses: ['Focus is covered'],
    remainingClauses: ['Keyboard remains'],
  })
  const before = structuredClone(data)
  const rows = buildBacklog(data)
  expect(rows.map((row) => row.id)).toEqual(['tabs.roles.1', 'tabs.roles.2'])
  expect(rows[0]).toMatchObject({
    status: 'queued',
    action: 'needs-review',
    acceptedClauses: [],
    remainingClauses: [],
  })
  expect(rows[1]).toMatchObject({
    latestBatch: 'partial',
    acceptedClauses: ['Focus is covered'],
    remainingClauses: ['Keyboard remains'],
  })
  expect(data).toEqual(before)
})

test('a newer batch without clauses clears prior batch claims while retaining review context', () => {
  const data = campaign()
  data.batches.push({
    id: 'review',
    status: 'reconciled',
    ids: ['tabs.roles.1'],
    acceptedClauses: ['Old accepted'],
    remainingClauses: ['Old remaining'],
    scopeReview: [
      {
        id: 'tabs.roles.1',
        classification: 'writable',
        rationale: 'Review rationale',
        scopeLimitOrConflict: 'Platform boundary',
      },
    ],
  })
  data.batches.push({ id: 'execution', status: 'verified', ids: ['tabs.roles.1'] })
  expect(buildBacklog(data)[0]).toMatchObject({
    latestBatch: 'execution',
    latestReviewBatch: 'review',
    acceptedClauses: [],
    remainingClauses: [],
    nextAssertion: 'Review rationale',
    scopeLimit: 'Platform boundary',
    action: 'verified',
  })
})

test('classification and assertion fields use explicit precedence over legacy alternatives', () => {
  const data = campaign()
  data.batches.push({
    id: 'review',
    status: 'reconciled',
    ids: ['tabs.roles.1'],
    scopeReview: [
      {
        id: 'tabs.roles.1',
        classification: 'writable',
        category: 'decision',
        remainingAcceptedAssertions: 'Current assertion',
        rationale: 'Legacy rationale',
        scopeLimitOrAlternative: 'Current limit',
        scopeLimitOrConflict: 'Legacy limit',
      },
    ],
  })
  expect(buildBacklog(data)[0]).toMatchObject({
    action: 'write-tests',
    nextAssertion: 'Current assertion',
    scopeLimit: 'Current limit',
  })
})

test('invalid domains, record statuses, batch statuses, repeated IDs and repeated reviews are rejected', () => {
  const domain = campaign()
  domain.records[0]!.domain = 'unknown'
  expect(() => buildBacklog(domain)).toThrow('Unknown domain')
  const status = campaign()
  status.records[0]!.status = 'invalid' as never
  expect(() => buildBacklog(status)).toThrow('Unknown status')
  const batchStatus = campaign()
  batchStatus.batches.push({ id: 'invalid', status: 'invalid' as never, ids: [] })
  expect(() => buildBacklog(batchStatus)).toThrow('Unknown status')
  const repeated = campaign()
  repeated.batches.push({ id: 'repeat', status: 'verified', ids: ['tabs.roles.1', 'tabs.roles.1'] })
  expect(() => buildBacklog(repeated)).toThrow('Repeated ID')
  const reviews = campaign()
  reviews.batches.push({
    id: 'repeat-review',
    status: 'reconciled',
    ids: ['tabs.roles.1'],
    scopeReview: [{ id: 'tabs.roles.1' }, { id: 'tabs.roles.1' }],
  })
  expect(() => buildBacklog(reviews)).toThrow('Invalid review membership')
})

test('summary counts IDs rather than grouped records or execution claims', () => {
  const data = campaign()
  data.records.push({
    ids: ['menu.roles.1'],
    domain: 'menus-navigation',
    status: 'decision',
    historicalStatus: 'missing',
    reason: 'Contract unresolved',
  })
  data.batches.push({
    id: 'review',
    ids: ['tabs.roles.1', 'tabs.roles.2'],
    status: 'reconciled',
    scopeReview: [
      { id: 'tabs.roles.1', classification: 'writable' },
      { id: 'tabs.roles.2', classification: 'existing-needs-execution' },
    ],
  })
  const summary = renderSummary(buildBacklog(data), 'fixture-hash')
  expect(summary).toContain('Source SHA-256: `fixture-hash`')
  expect(summary).toContain('| reconciled | 2 |')
  expect(summary).toContain('| decision | 1 |')
  expect(summary).toContain('| write-tests | 1 |')
  expect(summary).toContain('| verify-existing | 1 |')
  expect(summary).toContain('| menus-navigation | 1 | 0 | 1 | 1 |')
  expect(summary).not.toContain('| verified |')
})

test('empty campaigns render zero lane totals without inventing status or action rows', () => {
  const rows = buildBacklog({ records: [], batches: [] })
  expect(rows).toEqual([])
  const summary = renderSummary(rows, 'empty')
  expect(summary).toContain('| coordinator-shared | 0 | 0 | 0 | 0 |')
  expect(summary).not.toContain('| verified |')
  expect(summary).not.toContain('| needs-review |')
})
