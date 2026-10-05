import { expect, test } from 'bun:test'
import { buildBacklog, renderSummary, type Campaign } from './campaign-report'

function fixture(): Campaign {
  return {
    records: [
      {
        ids: ['menu.a', 'menu.b'],
        domain: 'menus-navigation',
        status: 'queued',
        historicalStatus: 'partial',
        reason: 'Historical gap',
      },
    ],
    batches: [
      {
        id: 'review',
        status: 'reconciled',
        ids: ['menu.a', 'menu.b'],
        scopeReview: [
          { id: 'menu.a', classification: 'writable', remainingAcceptedAssertions: 'Test focus' },
          { id: 'menu.b', category: 'existing-needs-execution' },
        ],
      },
    ],
  }
}

test('per-ID batches override grouped status and preserve immutable historical status', () => {
  const data = fixture()
  data.batches.push({ id: 'executed', status: 'verified', ids: ['menu.a'] })
  const items = buildBacklog(data)
  expect(items.map((i) => [i.id, i.status, i.action])).toEqual([
    ['menu.a', 'verified', 'verified'],
    ['menu.b', 'reconciled', 'verify-existing'],
  ])
  expect(items[0]!.historicalStatus).toBe('partial')
  expect(data.records[0]!.status).toBe('queued')
})

test('later partial evidence prevents dispatch from an older writable review', () => {
  const data = fixture()
  data.batches.push({
    id: 'partial',
    status: 'reconciled',
    ids: ['menu.a'],
    acceptedClauses: ['Focus tested'],
    remainingClauses: ['An alternative API is not shipped'],
  })
  const row = buildBacklog(data)[0]!
  expect(row.action).toBe('reassess-remaining')
  expect(row.latestReviewBatch).toBe('review')
  expect(row.latestBatch).toBe('partial')
  expect(row.remainingClauses).toEqual(['An alternative API is not shipped'])
  expect(row.nextAssertion).toBe('Test focus')
})

test('absent classification stays in triage and mixed scope never becomes verified', () => {
  const data = fixture()
  data.batches[0]!.scopeReview = [{ id: 'menu.a' }, { id: 'menu.b', classification: 'mixed' }]
  const items = buildBacklog(data)
  expect(items.map((i) => i.action)).toEqual(['needs-triage', 'scope-supported-clauses'])
  expect(renderSummary(items, 'hash')).toContain('| reconciled | 2 |')
  expect(renderSummary(items, 'hash')).not.toContain('| verified |')
})

test('unknown IDs, duplicate histories, invalid membership and unknown categories fail closed', () => {
  const unknown = fixture()
  unknown.batches[0]!.ids.push('ghost')
  expect(() => buildBacklog(unknown)).toThrow('Unknown requirement')
  const duplicate = fixture()
  duplicate.records.push(duplicate.records[0]!)
  expect(() => buildBacklog(duplicate)).toThrow('Duplicate requirement')
  const batch = fixture()
  batch.batches.push(batch.batches[0]!)
  expect(() => buildBacklog(batch)).toThrow('Duplicate batch')
  const review = fixture()
  review.batches[0]!.scopeReview!.push({ id: 'ghost', classification: 'writable' })
  expect(() => buildBacklog(review)).toThrow('Invalid review membership')
  const category = fixture()
  category.batches[0]!.scopeReview![0]!.classification = 'probably-finished'
  expect(() => buildBacklog(category)).toThrow('Unknown classification')
})

test('a reviewed wave becomes undispatchable after a partial or verified batch supersedes its scope', async () => {
  const { validateWave } = await import('./campaign-wave')
  const wave = {
    status: 'proposal',
    scope: '',
    concurrency: '',
    workflow: [],
    sharedAssignments: [],
    lanes: [
      {
        id: 'menus-navigation',
        title: 'Menus',
        slices: [
          {
            id: 'first',
            title: 'First',
            ids: ['menu.a'],
            paths: ['new.test.tsx'],
            dependencies: [],
            risks: [],
            verification: [],
          },
        ],
        firstBatch: {
          slice: 'first',
          path: 'new.test.tsx',
          cases: Array.from({ length: 5 }, (_, i) => ({
            title: `Case ${i}`,
            ids: ['menu.a'],
            assertions: ['Focus stays owned'],
          })),
        },
      },
    ],
  }
  const data = fixture()
  expect(() => validateWave(wave, buildBacklog(data))).not.toThrow()
  data.batches.push({
    id: 'later-partial',
    status: 'reconciled',
    ids: ['menu.a'],
    remainingClauses: ['Unshipped alternative'],
  })
  expect(() => validateWave(wave, buildBacklog(data))).toThrow('Resolve dispatch scope first')
  data.batches.push({ id: 'later-pass', status: 'verified', ids: ['menu.a'] })
  expect(() => validateWave(wave, buildBacklog(data))).toThrow('Not unfinished')
})
