import { describe, expect, test } from 'vitest'
import { selection } from './selection'

describe('selection snapshots and boundaries', () => {
  test.each(['single', 'multiple', 'none'] as const)(
    '%s permits an initially empty required selection',
    (mode) => {
      const model = selection<string>({ mode, allowEmpty: false })
      expect(model.values).toEqual([])
      expect(model.clear()).toEqual(mode === 'multiple' ? [] : undefined)
      expect(model.select('first')).toEqual(
        mode === 'none' ? undefined : mode === 'multiple' ? ['first'] : 'first'
      )
    }
  )

  test('operations are independent proposals until the caller supplies the next value', () => {
    const original = Object.freeze(['a', 'b'])
    const model = selection({ mode: 'multiple', value: original })
    expect(model.toggle('a')).toEqual(['b'])
    expect(model.select('c')).toEqual(['a', 'b', 'c'])
    expect(model.values).toBe(original)
    expect(model.isSelected('a')).toBe(true)
    expect(model.isSelected('c')).toBe(false)
    const next = selection({ mode: 'multiple', value: model.toggle('a') })
    expect(next.toggle('b')).toEqual([])
    expect(original).toEqual(['a', 'b'])
  })

  test('required multiple selection permits removal while another item remains', () => {
    const model = selection({ mode: 'multiple', value: ['a', 'b'], allowEmpty: false })
    expect(model.toggle('a')).toEqual(['b'])
    expect(model.clear()).toEqual(['a', 'b'])
  })

  test('object membership and removal use identity rather than equal fields', () => {
    const first = { id: 1 }
    const equal = { id: 1 }
    const model = selection({ mode: 'multiple', value: [first] })
    expect(model.isSelected(equal)).toBe(false)
    expect(model.select(equal)).toEqual([first, equal])
    expect(model.toggle(first)).toEqual([])
  })

  test('duplicate inputs are retained until toggled, then every matching entry is removed', () => {
    const model = selection({ mode: 'multiple', value: ['a', 'a', 'b'] })
    expect(model.select('a')).toEqual(['a', 'a', 'b'])
    expect(model.toggle('a')).toEqual(['b'])
    expect(
      selection({ mode: 'multiple', value: ['a', 'a'], allowEmpty: false }).toggle('a')
    ).toEqual(['a', 'a'])
  })

  test('none preserves the complete original array while exposing only its first entry', () => {
    const value = Object.freeze(['a', 'b'])
    const model = selection({ mode: 'none', value })
    expect(model.values).toEqual(['a'])
    expect(model.isSelected('a')).toBe(false)
    expect(model.toggle('c')).toBe(value)
    expect(model.select('c')).toBe(value)
    expect(model.clear()).toBe(value)
  })

  test('NaN membership follows includes and documented strict-equality removal', () => {
    const model = selection({ mode: 'multiple', value: [NaN, 0] })
    expect(model.isSelected(NaN)).toBe(true)
    expect(model.select(NaN)).toEqual([NaN, 0])
    expect(model.toggle(NaN)).toEqual([NaN, 0])
    expect(model.toggle(-0)).toEqual([NaN])
  })
})
