import { expect, test } from 'vitest'
import { breadcrumbs } from './breadcrumbs'
test('names a navigation landmark and keeps native list and link semantics', () => {
  const { parts } = breadcrumbs()
  expect(parts.root.attrs).toEqual({ role: 'navigation', 'aria-label': 'Breadcrumbs' })
  expect(parts.list.attrs).toEqual({})
  expect(parts.item.attrs).toEqual({})
  expect(parts.link().attrs.role).toBeUndefined()
  expect(parts.link().attrs.tabindex).toBeUndefined()
  expect(parts.link().attrs['aria-current']).toBeUndefined()
  expect(breadcrumbs({ label: 'Location' }).state.label).toBe('Location')
})
test('marks current links or text explicitly and hides separators', () => {
  const { parts } = breadcrumbs()
  expect(parts.link(true).attrs['aria-current']).toBe('page')
  expect(parts.current.attrs['aria-current']).toBe('page')
  expect(parts.current.attrs.role).toBeUndefined()
  expect(parts.separator.attrs).toEqual({ 'aria-hidden': 'true' })
  expect(parts.link(true).on).toEqual({})
})
