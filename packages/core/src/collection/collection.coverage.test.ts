import { describe, expect, test } from 'vitest'

import { collection } from './collection'

describe('collection coverage', () => {
  test('collection.roles.1: zero and empty-string keys remain navigable', () => {
    const items = collection({ items: [0, '', 1] })

    expect(items.items).toEqual([0, '', 1])
    expect(items.navigable).toEqual([0, '', 1])
    expect(items.first()).toBe(0)
    expect(items.next(0)).toBe('')
    expect(items.next('')).toBe(1)
    expect(items.range(1, 0)).toEqual([0, '', 1])
  })

  test('collection.state.24: recreating from changed data reflects append, rename, swap and removal', () => {
    let values = ['a', 'b', 'c']
    let current = collection({ items: values })
    expect(current.navigable).toEqual(['a', 'b', 'c'])

    values = ['a', 'renamed', 'c', 'd']
    current = collection({ items: values })
    expect(current.navigable).toEqual(['a', 'renamed', 'c', 'd'])

    values = ['d', 'c', 'renamed']
    current = collection({ items: values })
    expect(current.first()).toBe('d')
    expect(current.range('renamed', 'd')).toEqual(['d', 'c', 'renamed'])

    values = ['c', 'renamed']
    current = collection({ items: values })
    expect(current.indexOf('d')).toBe(-1)
    expect(current.previous('renamed')).toBe('c')
  })
})
