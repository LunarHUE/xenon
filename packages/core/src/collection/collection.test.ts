import { describe, expect, expectTypeOf, test } from 'vitest'

import { collection } from './collection'

const abc = ['a', 'b', 'c', 'd']
const isB = (item: string) => item === 'b'

describe('collection', () => {
  test('the default query drops disabled items and keeps the full list beside it', () => {
    const items = collection({ items: abc, disabled: isB })
    expect(items.items).toEqual(abc)
    expect(items.navigable).toEqual(['a', 'c', 'd'])
    expect(items.indexOf('b')).toBe(1)
    expect(items.indexOf('z')).toBe(-1)
  })

  test('the ends walk inward past a disabled item', () => {
    const ends = collection({ items: abc, disabled: (i) => i === 'a' || i === 'd' })
    expect(ends.first()).toBe('b')
    expect(ends.last()).toBe('c')
    const dead = collection({ items: abc, disabled: () => true })
    expect(dead.first()).toBeUndefined()
    expect(dead.last()).toBeUndefined()
  })

  test('a step keeps going in the same direction until it lands on an enabled item', () => {
    const items = collection({ items: abc, disabled: isB })
    expect(items.next('a')).toBe('c')
    expect(items.previous('c')).toBe('a')
  })

  test('a step clamps at the boundary and loops only when asked', () => {
    const items = collection({ items: abc })
    expect(items.next('d')).toBeUndefined()
    expect(items.previous('a')).toBeUndefined()
    expect(items.next('d', { loop: true })).toBe('a')
    expect(items.previous('a', { loop: true })).toBe('d')
  })

  test('no starting point means the first item forward and the last one backward', () => {
    const items = collection({ items: abc, disabled: isB })
    expect(items.next(undefined)).toBe('a')
    expect(items.previous(undefined)).toBe('d')
  })

  test('a value outside the collection has no next and no previous', () => {
    const items = collection({ items: abc })
    expect(items.next('z')).toBeUndefined()
    expect(items.previous('z', { loop: true })).toBeUndefined()
  })

  test('an empty collection answers everything with nothing', () => {
    const empty = collection<string>({ items: [] })
    expect(empty.navigable).toEqual([])
    expect(empty.first()).toBeUndefined()
    expect(empty.next(undefined, { loop: true })).toBeUndefined()
    expect(empty.range('a', 'b')).toEqual([])
  })

  test('a range runs in collection order whichever end comes first', () => {
    const items = collection({ items: abc, disabled: isB })
    expect(items.range('a', 'c')).toEqual(['a', 'c'])
    expect(items.range('c', 'a')).toEqual(['a', 'c'])
    expect(items.range('c', 'c')).toEqual(['c'])
    expect(items.range('a', 'z')).toEqual([])
  })

  test('the collection is generic over the item type', () => {
    const one = { id: 1 }
    const two = { id: 2 }
    const items = collection({ items: [one, two] })
    expectTypeOf(items.first()).toEqualTypeOf<{ id: number } | undefined>()
    expect(items.next(one)).toBe(two)
  })
})
