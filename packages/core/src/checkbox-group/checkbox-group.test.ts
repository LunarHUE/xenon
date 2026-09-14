import { describe, expect, test, vi } from 'vitest'
import { checkboxGroup } from './checkbox-group'

describe('checkboxGroup', () => {
  test('defaults to independent unchecked native checkboxes', () => {
    const result = checkboxGroup()
    expect(result.state.value).toEqual([])
    expect(result.parts.root.attrs.role).toBe('group')
    expect(result.parts.item('a').parts.root.attrs).toMatchObject({
      type: 'checkbox',
      checked: false,
    })
    expect(result.parts.item('a').parts.root.on.keydown).toBeUndefined()
  })
  test('adds, removes and suppresses duplicate proposals without mutating input', () => {
    const onValueChange = vi.fn()
    const value = ['a']
    const result = checkboxGroup({ value, onValueChange })
    result.change('b', true)
    result.change('a', false)
    result.change('a', true)
    expect(onValueChange.mock.calls).toEqual([[['a', 'b']], [[]]])
    expect(value).toEqual(['a'])
  })
  test('disabled and readonly block changes and reach all hosts', () => {
    for (const flag of ['disabled', 'readonly'] as const) {
      const onValueChange = vi.fn()
      const result = checkboxGroup({ [flag]: true, onValueChange })
      result.change('a', true)
      expect(onValueChange).not.toHaveBeenCalled()
      expect(result.parts.item('a', { host: 'button', [flag]: false }).state[flag]).toBe(true)
    }
  })
  test('required means one selected value while local required stays independent', () => {
    expect(checkboxGroup({ required: true }).parts.item('a').state.required).toBe(true)
    const result = checkboxGroup({ required: true, value: ['b'] })
    expect(result.parts.item('a').state.required).toBe(false)
    expect(result.parts.item('a', { required: true }).state.required).toBe(true)
  })
  test('empty-string values, shared name and explicit form owner are preserved', () => {
    const result = checkboxGroup({ name: 'food', form: 'order', value: [''] })
    expect(result.parts.item('').parts.root.attrs).toMatchObject({
      name: 'food',
      form: 'order',
      value: '',
      checked: true,
    })
  })
})
