import { describe, expect, test } from 'vitest'

import { field } from './field'

const ids = { control: 'f-control', label: 'f-label', description: 'f-desc', error: 'f-error' }

describe('field', () => {
  test('a plain field carries no state hooks and names nothing', () => {
    const { state, parts } = field()
    expect(state).toEqual({
      disabled: false,
      required: false,
      readonly: false,
      invalid: false,
      name: undefined,
    })
    expect(parts.root.attrs).toEqual({
      role: 'group',
      'data-disabled': undefined,
      'data-required': undefined,
      'data-readonly': undefined,
      'data-invalid': undefined,
    })
    expect(parts.control.attrs['aria-describedby']).toBeUndefined()
    expect(parts.control.attrs['aria-labelledby']).toBeUndefined()
    expect(parts.control.attrs['aria-invalid']).toBeUndefined()
  })

  test('every part mirrors the four state flags', () => {
    const { parts } = field({ disabled: true, required: true, readonly: true, invalid: true })
    const flags = {
      'data-disabled': '',
      'data-required': '',
      'data-readonly': '',
      'data-invalid': '',
    }
    for (const part of [parts.root, parts.label, parts.description, parts.error, parts.control]) {
      expect(part.attrs).toMatchObject(flags)
    }
    expect(parts.control.attrs['aria-invalid']).toBe('true')
  })

  test('the label points at the control and the error is an alert', () => {
    const { parts } = field({ ids })
    expect(parts.label.attrs).toMatchObject({ id: ids.label, for: ids.control })
    expect(parts.description.attrs.id).toBe(ids.description)
    expect(parts.error.attrs).toMatchObject({ id: ids.error, role: 'alert' })
    expect(parts.control.attrs.id).toBe(ids.control)
  })

  test('a real label[for] names the control, so aria-labelledby stays off', () => {
    expect(field({ ids }).parts.control.attrs['aria-labelledby']).toBeUndefined()
    expect(field({ ids, labelledBy: 'mine' }).parts.control.attrs['aria-labelledby']).toBe(
      `mine ${ids.label}`
    )
    const orphan = field({ ids: { label: ids.label } }).parts.control.attrs
    expect(orphan['aria-labelledby']).toBe(ids.label)
  })

  test('aria-describedby is author, description, error, and the error only while invalid', () => {
    const described = { ids, hasDescription: true, hasError: true }
    expect(field(described).parts.control.attrs['aria-describedby']).toBe(ids.description)
    expect(field({ ...described, invalid: true }).parts.control.attrs['aria-describedby']).toBe(
      `${ids.description} ${ids.error}`
    )
    const authored = field({ ...described, invalid: true, describedBy: 'mine' })
    expect(authored.parts.control.attrs['aria-describedby']).toBe(
      `mine ${ids.description} ${ids.error}`
    )
    expect(authored.parts.control.attrs['aria-errormessage']).toBeUndefined()
  })

  test('unrendered parts and empty ids are never referenced', () => {
    expect(field({ ids, invalid: true }).parts.control.attrs['aria-describedby']).toBeUndefined()
    const empty = field({ ids: { ...ids, description: '' }, hasDescription: true, describedBy: '' })
    expect(empty.parts.control.attrs['aria-describedby']).toBeUndefined()
  })

  test('name reaches the state and the control bundle', () => {
    const { state, parts } = field({ name: 'email' })
    expect(state.name).toBe('email')
    expect(parts.control.attrs.name).toBe('email')
  })
})
