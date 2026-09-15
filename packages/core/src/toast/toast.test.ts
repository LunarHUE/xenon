import { describe, expect, it } from 'vitest'
import { toast, toastDuration, toastLimit, visibleToastIds } from './toast'

describe('toast', () => {
  it('separates focusable notification semantics from live announcements', () => {
    const result = toast({
      id: 'one',
      titleId: 'title',
      descriptionId: 'description',
      type: 'error',
      priority: 'high',
    })
    expect(result.parts.root.attrs).toMatchObject({
      role: 'group',
      tabindex: -1,
      'aria-labelledby': 'title',
      'aria-describedby': 'description',
      'data-type': 'error',
      'data-priority': 'high',
    })
    expect(result.parts.root.attrs['aria-live']).toBeUndefined()
  })
  it('makes limited and exiting records inaccessible without sharing their lifecycle', () => {
    expect(toast({ id: 'one', limited: true }).parts.root.attrs).toMatchObject({
      inert: true,
      hidden: true,
      'data-state': 'open',
    })
    expect(toast({ id: 'one', open: false }).parts.root.attrs).toMatchObject({
      inert: true,
      hidden: undefined,
      'data-state': 'closed',
    })
  })
  it('admits newest records and normalizes nonfinite defaults', () => {
    expect([...visibleToastIds([{ id: 'old' }, { id: 'new' }], 1)]).toEqual(['new'])
    expect(toastLimit(NaN)).toBe(3)
    expect(toastLimit(0)).toBe(1)
    expect(toastDuration(Infinity)).toBe(Infinity)
    expect(toastDuration(0)).toBe(0)
    expect(toastDuration(NaN)).toBe(5000)
  })
})
