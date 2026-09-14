import { expect, test } from 'vitest'
import { resolveTooltipBehavior, tooltip, tooltipOpenDelay } from './tooltip'
test('local zero and false override inherited policies without resetting other fields', () => {
  const parent = resolveTooltipBehavior({ openDelay: 900, closeDelay: 200, skipDelay: 500 })
  expect(resolveTooltipBehavior({ openDelay: 0, hoverable: false }, parent)).toEqual({
    ...parent,
    openDelay: 0,
    hoverable: false,
  })
  expect(resolveTooltipBehavior({ openDelay: undefined }, parent).openDelay).toBe(900)
  expect(resolveTooltipBehavior({ openDelay: -1, closeDelay: Infinity })).toMatchObject({
    openDelay: 0,
    closeDelay: 100,
  })
})
test('warming uses explicit timestamps and local zero skip disables a closed group warm window', () => {
  const behavior = resolveTooltipBehavior()
  expect(tooltipOpenDelay({ behavior, now: 500, closedAt: 300, active: false })).toBe(0)
  expect(tooltipOpenDelay({ behavior, now: 600, closedAt: 300, active: false })).toBe(600)
  expect(
    tooltipOpenDelay({
      behavior: { ...behavior, skipDelay: 0 },
      now: 301,
      closedAt: 300,
      active: false,
    })
  ).toBe(600)
  expect(tooltipOpenDelay({ behavior, now: 1000, active: true })).toBe(0)
})
test('tooltips describe without inventing trigger roles, expansion, or focusability', () => {
  const result = tooltip({ contentId: 'tip', open: true })
  expect(result.parts.trigger.attrs).toMatchObject({
    'aria-describedby': 'tip',
    'data-state': 'open',
  })
  expect(result.parts.trigger.attrs['aria-expanded']).toBeUndefined()
  expect(result.parts.content.attrs.role).toBe('tooltip')
  expect(result.parts.content.attrs.tabindex).toBeUndefined()
  expect(
    tooltip({ contentId: 'tip', disabled: true, open: true }).parts.trigger.attrs[
      'aria-describedby'
    ]
  ).toBeUndefined()
})
