import { describe, expect, test, vi } from 'vitest'
import type { AnyPart } from '../part'
import { pagination } from './pagination'

function activate(part: AnyPart, prevented = false) {
  const event = {
    defaultPrevented: prevented,
    preventDefault() {
      this.defaultPrevented = true
    },
  }
  part.on.click?.(event as never)
  return event
}

describe('pagination range contracts', () => {
  test.each([
    { page: 1, siblingCount: 0, boundaryCount: 0, pages: [1] },
    { page: 5, siblingCount: 0, boundaryCount: 0, pages: [5] },
    { page: 10, siblingCount: 0, boundaryCount: 0, pages: [10] },
    { page: 5, siblingCount: 1, boundaryCount: 0, pages: [4, 5, 6] },
    {
      page: 5,
      siblingCount: 0,
      boundaryCount: 1,
      pages: [1, 'start-ellipsis', 5, 'end-ellipsis', 10],
    },
    { page: 3, siblingCount: 0, boundaryCount: 1, pages: [1, 2, 3, 'end-ellipsis', 10] },
    { page: 8, siblingCount: 0, boundaryCount: 1, pages: [1, 'start-ellipsis', 8, 9, 10] },
    { page: 1, siblingCount: 1, boundaryCount: 2, pages: [1, 2, 'end-ellipsis', 9, 10] },
    { page: 10, siblingCount: 1, boundaryCount: 2, pages: [1, 2, 'start-ellipsis', 9, 10] },
    { page: 5, siblingCount: 2, boundaryCount: 2, pages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  ])(
    'renders only the requested windows for $page/$siblingCount/$boundaryCount',
    ({ pages, ...options }) => {
      expect(pagination({ count: 10, ...options }).state.pages).toEqual(pages)
    }
  )

  test.each([
    { count: -10, page: -20, expectedCount: 1, expectedPage: 1 },
    { count: 0, page: 10, expectedCount: 1, expectedPage: 1 },
    { count: 4.9, page: 2.9, expectedCount: 4, expectedPage: 2 },
    { count: 4, page: -0.5, expectedCount: 4, expectedPage: 1 },
    { count: Infinity, page: 10, expectedCount: 1, expectedPage: 1 },
    { count: 4, page: NaN, expectedCount: 4, expectedPage: 1 },
    { count: 4, page: -Infinity, expectedCount: 4, expectedPage: 1 },
    { count: 4, page: Infinity, expectedCount: 4, expectedPage: 1 },
  ])(
    'normalizes count=$count and page=$page before creating controls',
    ({ count, page, expectedCount, expectedPage }) => {
      const change = vi.fn()
      const result = pagination({ count, page, onPageChange: change })
      expect(result.state.count).toBe(expectedCount)
      expect(result.state.page).toBe(expectedPage)
      expect(result.parts.item(expectedPage).attrs['aria-current']).toBe('page')
      activate(result.parts.item(expectedPage))
      expect(change).not.toHaveBeenCalled()
    }
  )

  test.each(['first', 'previous', 'next', 'last'] as const)(
    '%s requests the destination without changing the snapshot',
    (control) => {
      const change = vi.fn()
      const result = pagination({ count: 9, page: 5, onPageChange: change })
      const destinations = { first: 1, previous: 4, next: 6, last: 9 }
      expect(activate(result.parts[control]()).defaultPrevented).toBe(false)
      expect(change).toHaveBeenCalledExactlyOnceWith(destinations[control])
      expect(result.state.page).toBe(5)
      expect(result.parts.item(5).attrs['aria-current']).toBe('page')
    }
  )

  test.each(['button', 'link', 'generic'] as const)(
    'local disabling blocks only the authored %s control',
    (host) => {
      const change = vi.fn()
      const result = pagination({ count: 5, page: 3, onPageChange: change })
      expect(activate(result.parts.next({ host, disabled: true })).defaultPrevented).toBe(true)
      expect(change).not.toHaveBeenCalled()
      expect(activate(result.parts.previous({ host })).defaultPrevented).toBe(false)
      expect(change).toHaveBeenCalledExactlyOnceWith(2)
    }
  )

  test.each([NaN, Infinity, -Infinity, 0, -1, 2.5, 6])(
    'invalid target %s cancels activation without proposing a page',
    (target) => {
      const change = vi.fn()
      const result = pagination({ count: 5, page: 3, onPageChange: change })
      expect(activate(result.parts.item(target)).defaultPrevented).toBe(true)
      expect(change).not.toHaveBeenCalled()
    }
  )

  test('root disabling dominates an explicit enabled override on every control', () => {
    const change = vi.fn()
    const result = pagination({ count: 5, page: 3, disabled: true, onPageChange: change })
    const enabled = { disabled: false, host: 'link' as const }
    for (const part of [
      result.parts.item(2, enabled),
      ...(['first', 'previous', 'next', 'last'] as const).map((key) => result.parts[key](enabled)),
    ]) {
      expect(part.attrs['aria-disabled']).toBe('true')
      expect(activate(part).defaultPrevented).toBe(true)
    }
    expect(change).not.toHaveBeenCalled()
    expect(result.state.page).toBe(3)
  })
})
