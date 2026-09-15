import { expect, test } from 'vitest'
import { hoverCard } from './hover-card'

test('an open non-current trigger stays collapsed and unassociated', () => {
  const result = hoverCard({ open: true, current: false, ids: { content: 'preview' } })

  expect(result.state.open).toBe(true)
  expect(result.state.current).toBe(false)
  expect(result.parts.trigger.attrs['aria-expanded']).toBe('false')
  expect(result.parts.trigger.attrs['aria-controls']).toBeUndefined()
  expect(result.parts.trigger.attrs['data-current']).toBeUndefined()
})

test('explicit exit status preserves mounted content while settled closure removes it', () => {
  const exiting = hoverCard({ open: false, status: 'exiting' })
  const closed = hoverCard({ open: false, status: 'exited' })

  expect(exiting.state.present).toBe(true)
  expect(exiting.parts.content.attrs.inert).toBe(true)
  expect(closed.state.present).toBe(false)
  expect(closed.parts.content.attrs.inert).toBeUndefined()
})
