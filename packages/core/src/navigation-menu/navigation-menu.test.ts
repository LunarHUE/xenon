import { expect, test, vi } from 'vitest'
import { navigationMenu } from './navigation-menu'

test('navigation uses native disclosure semantics and never composite roles', () => {
  const change = vi.fn()
  const result = navigationMenu({
    value: '',
    ids: { trigger: (value) => `t-${value}`, content: (value) => `c-${value}` },
    onValueChange: change,
  })
  expect(result.state.open).toBe(true)
  expect(result.parts.root.attrs).not.toHaveProperty('role')
  expect(result.parts.list.attrs).not.toHaveProperty('aria-orientation')
  expect(result.parts.trigger('').attrs['aria-controls']).toBe('c-')
  expect(result.parts.trigger('other').attrs['aria-controls']).toBeUndefined()
  expect(result.parts.content('other').attrs.hidden).toBe(true)
  expect(result.parts.link(true).attrs['aria-current']).toBe('page')
  result.parts
    .trigger('')
    .on.click?.({ defaultPrevented: false } as PointerEvent & { currentTarget: HTMLButtonElement })
  expect(change).toHaveBeenCalledWith(null)
})
test('disabled and canceled activation are silent', () => {
  const change = vi.fn()
  const result = navigationMenu({ onValueChange: change })
  result.parts
    .trigger('x', true)
    .on.click?.({ defaultPrevented: false } as PointerEvent & { currentTarget: HTMLButtonElement })
  result.parts
    .trigger('x')
    .on.click?.({ defaultPrevented: true } as PointerEvent & { currentTarget: HTMLButtonElement })
  expect(change).not.toHaveBeenCalled()
  expect(result.state.value).toBeNull()
})
