import { describe, expect, it, vi } from 'vitest'
import { toast, toastDuration, toastLimit, visibleToastIds } from './toast'

describe('toast admission contracts', () => {
  const records = Object.freeze([
    Object.freeze({ id: 'first' }),
    Object.freeze({ id: 'closing', open: false }),
    Object.freeze({ id: 'second', open: true }),
    Object.freeze({ id: 'third' }),
  ])
  for (const [limit, expected] of [
    [0, []],
    [-1, []],
    [0.9, []],
    [1.9, ['third']],
    [2, ['second', 'third']],
    [3, ['first', 'second', 'third']],
    [100, ['first', 'second', 'third']],
    [Infinity, ['first', 'second', 'third']],
    [NaN, ['first', 'second', 'third']],
  ] as const) {
    it(`admits newest open records for limit ${limit}`, () => {
      expect([...visibleToastIds(records, limit)]).toEqual(expected)
      expect(records.map((record) => record.id)).toEqual(['first', 'closing', 'second', 'third'])
    })
  }
  it('promotes the next waiting record as an admitted record starts closing', () => {
    expect([...visibleToastIds(records, 2)]).toEqual(['second', 'third'])
    const closingNewest = records.map((record) =>
      record.id === 'third' ? { ...record, open: false } : record
    )
    expect([...visibleToastIds(closingNewest, 2)]).toEqual(['first', 'second'])
  })
  for (const value of [undefined, NaN, -Infinity]) {
    it(`uses caller fallbacks for invalid duration and limit ${value}`, () => {
      expect(toastDuration(value, 1200)).toBe(1200)
      expect(toastLimit(value, 7)).toBe(7)
    })
  }
  it('preserves fractional durations while flooring admission limits', () => {
    expect(toastDuration(12.75)).toBe(12.75)
    expect(toastLimit(12.75)).toBe(12)
    expect(toastDuration(-12)).toBe(0)
    expect(toastLimit(-12)).toBe(0)
  })
})

describe('toast part semantics', () => {
  for (const open of [true, false]) {
    for (const limited of [true, false]) {
      it(`keeps lifecycle and admission independent for open=${open}, limited=${limited}`, () => {
        const result = toast({ id: 'notice', open, limited })
        expect(result.state).toEqual({ open, limited })
        expect(result.parts.root.attrs).toMatchObject({
          id: 'notice',
          role: 'group',
          tabindex: 0,
          'data-state': open ? 'open' : 'closed',
          'data-limited': limited ? '' : undefined,
          inert: !open || limited ? true : undefined,
          hidden: limited ? true : undefined,
        })
      })
    }
  }
  it('wires description and title only when provided and keeps actions native buttons', () => {
    const empty = toast({ id: 'empty' })
    expect(empty.parts.root.attrs['aria-labelledby']).toBeUndefined()
    expect(empty.parts.root.attrs['aria-describedby']).toBeUndefined()
    const named = toast({ id: 'named', titleId: 'heading', descriptionId: 'detail' })
    expect(named.parts.root.attrs['aria-labelledby']).toBe(named.parts.title.attrs.id)
    expect(named.parts.root.attrs['aria-describedby']).toBe(named.parts.description.attrs.id)
    expect(named.parts.action.attrs.type).toBe('button')
    expect(named.parts.close.attrs).toMatchObject({
      type: 'button',
      'aria-label': 'Dismiss notification',
    })
    expect(named.parts.action.on).toEqual({})
  })
  it('dismisses exactly once per close activation without invoking dismissal during creation', () => {
    const onDismiss = vi.fn()
    const result = toast({ id: 'one', onDismiss })
    const event = {} as Parameters<NonNullable<typeof result.parts.close.on.click>>[0]
    expect(onDismiss).not.toHaveBeenCalled()
    result.parts.close.on.click!(event)
    expect(onDismiss).toHaveBeenCalledTimes(1)
    result.parts.close.on.click!(event)
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })
})
