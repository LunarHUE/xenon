import { expect, test, vi } from 'vitest'
import { tagsInput } from './tags-input'

test('normalizes before duplicate checking and batches paste', () => {
  const changed = vi.fn()
  const source = ['a']
  const tags = tagsInput({ value: source, max: 3, onValueChange: changed })
  expect(tags.add([' a ', 'b', 'b', 'c', 'd'])).toEqual(['b', 'c'])
  expect(changed).toHaveBeenCalledExactlyOnceWith(['a', 'b', 'c'])
  expect(source).toEqual(['a'])
})
test('replacement is atomic and rejects invalid or duplicate values', () => {
  const changed = vi.fn()
  const tags = tagsInput({
    value: ['a', 'b'],
    validate: (v) => v !== 'bad',
    onValueChange: changed,
  })
  expect(tags.replace(0, 'b')).toBe(false)
  expect(tags.replace(0, 'bad')).toBe(false)
  expect(changed).not.toHaveBeenCalled()
  expect(tags.replace(0, '')).toBe(true)
  expect(changed).toHaveBeenCalledWith(['b'])
})
test('duplicate occurrences remove by index and locked state blocks mutations', () => {
  const changed = vi.fn()
  tagsInput({ value: ['a', 'a'], allowDuplicates: true, onValueChange: changed }).remove(1)
  expect(changed).toHaveBeenCalledWith(['a'])
  changed.mockClear()
  for (const flag of [{ disabled: true }, { readonly: true }]) {
    const tags = tagsInput({ ...flag, value: ['a'], onValueChange: changed })
    tags.add(['b'])
    tags.remove(0)
    tags.replace(0, 'c')
    tags.clear()
  }
  expect(changed).not.toHaveBeenCalled()
})
