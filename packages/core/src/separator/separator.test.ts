import { describe, expect, test } from 'vitest'

import { separator } from './separator'

describe('separator', () => {
  test('the hr host leans on the implicit role and writes only the styling hook', () => {
    const { state, parts } = separator()
    expect(state).toEqual({ host: 'hr', orientation: 'horizontal', decorative: false })
    expect(parts.root.attrs).toEqual({
      role: undefined,
      'aria-orientation': undefined,
      'data-orientation': 'horizontal',
    })
  })

  test('any other host spells the role out', () => {
    expect(separator({ host: 'generic' }).parts.root.attrs['role']).toBe('separator')
  })

  test('only vertical earns aria-orientation, and data-orientation is always there', () => {
    const vertical = separator({ orientation: 'vertical' }).parts.root.attrs
    expect(vertical).toMatchObject({
      'aria-orientation': 'vertical',
      'data-orientation': 'vertical',
    })
  })

  test('decorative swaps the role for none on either host', () => {
    expect(separator({ decorative: true }).parts.root.attrs['role']).toBe('none')
    expect(separator({ host: 'generic', decorative: true }).parts.root.attrs['role']).toBe('none')
  })

  test('decorative drops aria-orientation but keeps the styling hook', () => {
    const { attrs } = separator({ orientation: 'vertical', decorative: true }).parts.root
    expect(attrs['aria-orientation']).toBeUndefined()
    expect(attrs['data-orientation']).toBe('vertical')
  })
})
