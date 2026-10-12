import { describe, expect, test, vi } from 'vitest'
import type { AnyPart } from '../part'
import { pagination } from './pagination'
function click(part: AnyPart, prevented = false) {
  const event = {
    defaultPrevented: prevented,
    preventDefault() {
      this.defaultPrevented = true
    },
  }
  part.on.click?.(event as never)
  return event
}
describe('pagination', () => {
  test('produces ordered end and sibling windows with stable ellipses', () => {
    expect(pagination({ count: 10 }).state.pages).toEqual([1, 2, 'end-ellipsis', 10])
    expect(pagination({ count: 10, page: 5 }).state.pages).toEqual([
      1,
      'start-ellipsis',
      4,
      5,
      6,
      'end-ellipsis',
      10,
    ])
    expect(pagination({ count: 7, page: 4 }).state.pages).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  test('huge counts and hostile window inputs stay bounded', () => {
    const state = pagination({
      count: Number.MAX_SAFE_INTEGER,
      page: 2000,
      boundaryCount: 1e9,
      siblingCount: 1e9,
    }).state
    expect(state.pages.length).toBeLessThanOrEqual(403)
    expect(state.pages.at(-1)).toBe(Number.MAX_SAFE_INTEGER)
    expect(pagination({ count: NaN, page: Infinity }).state).toMatchObject({
      count: 1,
      page: 1,
      pages: [1],
    })
    expect(pagination({ count: 4.9, page: 9 }).state.page).toBe(4)
  })
  test('construction and repeated or invalid selection are silent', () => {
    const change = vi.fn()
    const result = pagination({ count: 5, page: 3, onPageChange: change })
    expect(change).not.toHaveBeenCalled()
    click(result.parts.item(3))
    click(result.parts.item(0))
    click(result.parts.item(2.5))
    click(result.parts.item(4), true)
    expect(change).not.toHaveBeenCalled()
    click(result.parts.next())
    expect(change).toHaveBeenCalledExactlyOnceWith(4)
    expect(result.state.page).toBe(3)
  })
  test('edges and root disabling block clicks while preserving link semantics', () => {
    const change = vi.fn()
    const result = pagination({ count: 3, disabled: true, onPageChange: change })
    const part = result.parts.next({ host: 'link' })
    expect(part.attrs.role).toBeUndefined()
    expect(part.attrs['aria-disabled']).toBe('true')
    expect(click(part).defaultPrevented).toBe(true)
    expect(change).not.toHaveBeenCalled()
    expect(pagination({ count: 3 }).parts.previous().attrs).toMatchObject({
      disabled: true,
      type: 'button',
    })
    expect(pagination({ count: 3, page: 3 }).parts.last().attrs).toMatchObject({ disabled: true })
  })
  test('current page has aria-current, no pressed state or roving tabindex', () => {
    const attrs = pagination({ count: 3, page: 2 }).parts.item(2).attrs
    expect(attrs['aria-current']).toBe('page')
    expect(attrs['aria-pressed']).toBeUndefined()
    expect(attrs.tabindex).toBeUndefined()
  })
})

test('only the current page Item is marked current', () => {
  const first = pagination({ count: 5, page: 1 })
  expect(first.parts.item(1).attrs).toMatchObject({
    'data-state': 'current',
    'aria-current': 'page',
  })
  expect(first.parts.first().attrs['data-state']).toBe('idle')
  expect(first.parts.previous().attrs['data-state']).toBe('idle')
  const last = pagination({ count: 5, page: 5 })
  expect(last.parts.next().attrs['data-state']).toBe('idle')
  expect(last.parts.last().attrs['data-state']).toBe('idle')
  expect(last.parts.item(5).attrs['data-state']).toBe('current')
})
