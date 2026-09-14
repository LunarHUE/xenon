import { describe, expect, expectTypeOf, test } from 'vitest'

import { selection } from './selection'

describe('selection', () => {
  test('single is the default and reads a bare value', () => {
    const one = selection({ value: 'a' })
    expect(one.mode).toBe('single')
    expect(one.values).toEqual(['a'])
    expect(one.isSelected('a')).toBe(true)
    expect(one.isSelected('b')).toBe(false)
  })

  test('single: select replaces and toggle clears', () => {
    const one = selection({ value: 'a' })
    expect(one.select('b')).toBe('b')
    expect(one.toggle('b')).toBe('b')
    expect(one.toggle('a')).toBeUndefined()
    expect(selection<string>({}).clear()).toBeUndefined()
  })

  test('single: an array value keeps only the first entry', () => {
    expect(selection({ value: ['a', 'b'] }).values).toEqual(['a'])
  })

  test('allowEmpty false keeps the last selected item', () => {
    const pinned = selection({ value: 'a', allowEmpty: false })
    expect(pinned.toggle('a')).toBe('a')
    expect(pinned.clear()).toBe('a')
    expect(pinned.toggle('b')).toBe('b')
  })

  test('multiple always answers with an array', () => {
    const many = selection({ mode: 'multiple', value: ['a'] })
    expect(many.toggle('b')).toEqual(['a', 'b'])
    expect(many.toggle('a')).toEqual([])
    expect(many.clear()).toEqual([])
    expect(selection({ mode: 'multiple' }).toggle('a')).toEqual(['a'])
  })

  test('multiple: select adds once and never removes', () => {
    const many = selection({ mode: 'multiple', value: ['a'] })
    expect(many.select('b')).toEqual(['a', 'b'])
    expect(many.select('a')).toEqual(['a'])
  })

  test('multiple: allowEmpty false refuses to empty the selection', () => {
    const pinned = selection({ mode: 'multiple', value: ['a'], allowEmpty: false })
    expect(pinned.toggle('a')).toEqual(['a'])
    expect(pinned.clear()).toEqual(['a'])
  })

  test('none reports nothing selected and hands every value back untouched', () => {
    const off = selection({ mode: 'none', value: 'a' })
    expect(off.values).toEqual(['a'])
    expect(off.isSelected('a')).toBe(false)
    expect(off.toggle('a')).toBe('a')
    expect(off.select('b')).toBe('a')
    expect(off.clear()).toBe('a')
  })

  test('nothing mutates the value it was given', () => {
    const value = ['a', 'b']
    const many = selection({ mode: 'multiple', value })
    many.toggle('a')
    many.select('c')
    many.clear()
    expect(value).toEqual(['a', 'b'])
  })

  test('the engine is generic over the item type', () => {
    const one = { id: 1 }
    const model = selection({ value: one })
    expectTypeOf(model.values).toEqualTypeOf<readonly { id: number }[]>()
    expect(model.isSelected(one)).toBe(true)
  })
})
