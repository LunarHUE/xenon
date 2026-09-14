import { expect, test } from 'vitest'
import { hoverCard } from './hover-card'

test('links retain native behavior and closed cards have no dangling association', () => {
  const result = hoverCard({ ids: { trigger: 'link', content: 'preview' } })
  expect(result.state.present).toBe(false)
  expect(result.parts.trigger.attrs.id).toBe('link')
  expect(result.parts.trigger.attrs['aria-expanded']).toBe('false')
  expect(result.parts.trigger.attrs['aria-controls']).toBeUndefined()
  expect(result.parts.trigger.attrs.role).toBeUndefined()
  expect(result.parts.trigger.on).toEqual({})
})

test('only the current trigger advertises the open nonmodal preview', () => {
  const active = hoverCard({ open: true, ids: { content: 'preview' } })
  expect(active.parts.trigger.attrs['aria-controls']).toBe('preview')
  expect(active.parts.trigger.attrs['data-current']).toBe('')
  expect(active.parts.content.attrs['aria-modal']).toBeUndefined()
  expect(active.parts.content.attrs.tabindex).toBe('-1')
  const inactive = hoverCard({ open: true, current: false })
  expect(inactive.parts.trigger.attrs['aria-expanded']).toBe('false')
  expect(inactive.parts.trigger.attrs['data-current']).toBeUndefined()
})

test('exit retains inert content and force mounting hides a settled closed preview', () => {
  const exiting = hoverCard({ status: 'exiting' })
  expect(exiting.state.present).toBe(true)
  expect(exiting.parts.content.attrs.inert).toBe(true)
  const forced = hoverCard({ forceMount: true })
  expect(forced.state.present).toBe(true)
  expect(forced.parts.content.attrs.hidden).toBe(true)
})
