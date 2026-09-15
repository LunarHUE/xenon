import { describe, expect, test, vi } from 'vitest'
import { pinInput } from './pin-input'

describe('pinInput', () => {
  test('normalizes a scalar code and exposes indexed OTP slots', () => {
    const result = pinInput({ value: '0a1234567' })
    expect(result.state).toEqual({ value: '012345', length: 6, complete: true, insertion: 5 })
    expect(result.parts.input(0).attrs.autocomplete).toBe('one-time-code')
    expect(result.parts.input(1).attrs.autocomplete).toBe('off')
    expect(result.parts.input(5).attrs['aria-label']).toBe('Pin code 6 of 6')
  })
  test('paste overwrites from focus and filters invalid characters', () => {
    const change = vi.fn()
    const focus = vi.fn()
    pinInput({ value: '1234', length: 4, onValueChange: change, onFocusChange: focus }).insert(
      1,
      'a9-8-7-6'
    )
    expect(change).toHaveBeenCalledExactlyOnceWith('1987')
    expect(focus).toHaveBeenCalledExactlyOnceWith(3)
  })
  test('same-character input advances without emitting and readonly blocks edits', () => {
    const change = vi.fn()
    const focus = vi.fn()
    pinInput({ value: '12', onValueChange: change, onFocusChange: focus }).insert(0, '1')
    expect(change).not.toHaveBeenCalled()
    expect(focus).toHaveBeenCalledWith(1)
    pinInput({ readonly: true, onValueChange: change }).insert(0, '2')
    expect(change).not.toHaveBeenCalled()
  })
  test('deletion splices without holes and navigation stays at insertion', () => {
    const change = vi.fn()
    const focus = vi.fn()
    const result = pinInput({ value: '123', onValueChange: change, onFocusChange: focus })
    const event = { key: 'Delete', preventDefault: vi.fn() } as unknown as KeyboardEvent & {
      currentTarget: HTMLInputElement
    }
    result.parts.input(1).on.keydown?.(event)
    expect(change).toHaveBeenCalledWith('13')
    result.focus(5)
    expect(focus).toHaveBeenLastCalledWith(3)
  })
  test('Delete at an empty insertion slot preserves value and focus', () => {
    const change = vi.fn()
    const focus = vi.fn()
    const result = pinInput({ value: '12', length: 4, onValueChange: change, onFocusChange: focus })
    result.parts.input(2).on.keydown?.({ key: 'Delete', preventDefault() {} } as never)
    expect(change).not.toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalled()
  })
})

test('legacy composition and author-canceled keyboard events never delete a code', () => {
  const change = vi.fn()
  const handler = pinInput({ value: '12', onValueChange: change }).parts.input(0).on.keydown!
  handler({ key: 'Delete', keyCode: 229 } as never)
  handler({ key: 'Delete', defaultPrevented: true } as never)
  expect(change).not.toHaveBeenCalled()
})

test('alphabetic and alphanumeric modes filter codes and expose masking semantics', () => {
  const alphabetic = pinInput({ type: 'alphabetic', value: 'a1-B!', length: 4 })
  expect(alphabetic.state.value).toBe('aB')
  expect(alphabetic.parts.input(0).attrs.inputmode).toBe('text')
  const masked = pinInput({ type: 'alphanumeric', mask: true, value: 'a9', length: 2 })
  expect(masked.state.value).toBe('a9')
  expect(masked.parts.input(0).attrs.type).toBe('password')
})

test('modifier Backspace clears the whole code and returns focus to the first slot', () => {
  const change = vi.fn()
  const focus = vi.fn()
  const result = pinInput({ value: '1234', length: 4, onValueChange: change, onFocusChange: focus })
  result.parts.input(2).on.keydown?.({
    key: 'Backspace',
    ctrlKey: true,
    preventDefault() {},
  } as never)
  expect(change).toHaveBeenCalledExactlyOnceWith('')
  expect(focus).toHaveBeenCalledExactlyOnceWith(0)
})
