import { expect, test, vi } from 'vitest'
import { tagsInput } from './tags-input'

for (const max of [0, 1, 2]) {
  test(`capacity ${max} accepts one atomic ordered batch and leaves source arrays unchanged`, () => {
    const change = vi.fn()
    const original = Object.freeze(['existing'])
    const additions = Object.freeze([' ', ' first ', 'first', 'second'])
    const result = tagsInput({ value: original, max, onValueChange: change })
    expect(result.add(additions)).toEqual(max === 2 ? ['first'] : [])
    expect(change.mock.calls).toEqual(max === 2 ? [[['existing', 'first']]] : [])
    expect(original).toEqual(['existing'])
    expect(additions).toEqual([' ', ' first ', 'first', 'second'])
  })
}

test('validation sees normalized values and rejection does not consume capacity', () => {
  const validate = vi.fn((value: string) => value !== 'reject')
  const change = vi.fn()
  const result = tagsInput({ max: 2, validate, onValueChange: change })
  expect(result.add([' reject ', ' accept ', 'accept', ' next '])).toEqual(['accept', 'next'])
  expect(validate.mock.calls).toEqual([['reject'], ['accept'], ['next']])
  expect(change.mock.calls).toEqual([[['accept', 'next']]])
})

test('trim false preserves whitespace identity for duplicates and validation', () => {
  const change = vi.fn()
  const validate = vi.fn(() => true)
  const result = tagsInput({ value: ['a'], trim: false, validate, onValueChange: change })
  expect(result.add([' a ', ' ', '', 'a'])).toEqual([' a ', ' '])
  expect(validate.mock.calls).toEqual([[' a '], [' ']])
  expect(change.mock.calls).toEqual([[['a', ' a ', ' ']]])
})

test('replacement at capacity may change a tag and a normalized no-op stays silent', () => {
  const source = Object.freeze(['first', 'second'])
  const change = vi.fn()
  const result = tagsInput({ value: source, max: 2, onValueChange: change })
  expect(result.replace(0, ' first ')).toBe(true)
  expect(change).not.toHaveBeenCalled()
  expect(result.replace(0, ' third ')).toBe(true)
  expect(change.mock.calls).toEqual([[['third', 'second']]])
  expect(source).toEqual(['first', 'second'])
})

for (const index of [-1, 2, 20]) {
  test(`out-of-range mutation ${index} is rejected without invoking validation`, () => {
    const change = vi.fn()
    const validate = vi.fn(() => true)
    const result = tagsInput({ value: ['a', 'b'], validate, onValueChange: change })
    expect(result.remove(index)).toBe(false)
    expect(result.replace(index, 'c')).toBe(false)
    expect(change).not.toHaveBeenCalled()
    expect(validate).not.toHaveBeenCalled()
  })
}

test('empty clear is silent while populated clear produces a new empty collection', () => {
  const change = vi.fn()
  tagsInput({ onValueChange: change }).clear()
  expect(change).not.toHaveBeenCalled()
  tagsInput({ value: Object.freeze(['a']), onValueChange: change }).clear()
  expect(change.mock.calls).toEqual([[[]]])
})
