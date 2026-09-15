import { expect, test } from 'vitest'
import { tooltip } from './tooltip'

test('closed tooltip keeps its author content ID without describing the trigger', () => {
  const result = tooltip({ contentId: 'author-tip', open: false, forceMount: true })

  expect(result.state.open).toBe(false)
  expect(result.state.present).toBe(true)
  expect(result.parts.content.attrs.id).toBe('author-tip')
  expect(result.parts.trigger.attrs['aria-describedby']).toBeUndefined()
  expect(result.parts.content.attrs.hidden).toBe(true)
})

test('instant flags only appear on an open enabled tooltip', () => {
  const open = tooltip({ contentId: 'tip', open: true, instant: true })
  const closed = tooltip({ contentId: 'tip', open: false, instant: true })

  expect(open.parts.root.attrs['data-instant']).toBe('')
  expect(open.parts.content.attrs['data-instant']).toBe('')
  expect(closed.parts.root.attrs['data-instant']).toBeUndefined()
  expect(closed.parts.content.attrs['data-instant']).toBeUndefined()
  const disabled = tooltip({ contentId: 'tip', open: true, disabled: true, instant: true })
  expect(disabled.parts.root.attrs['data-instant']).toBeUndefined()
  expect(disabled.parts.content.attrs['data-instant']).toBeUndefined()
})
