import { expect, test, vi } from 'vitest'
import { pinInput } from './pin-input'

for (const length of [0, -1, 1.5, NaN, Infinity]) {
  test(`invalid slot count ${length} falls back to six and sanitizes initialization silently`, () => {
    const change = vi.fn()
    const focus = vi.fn()
    const result = pinInput({
      length,
      value: 'a1234567',
      onValueChange: change,
      onFocusChange: focus,
    })
    expect(result.state).toEqual({ value: '123456', length: 6, complete: true, insertion: 5 })
    expect(change).not.toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalled()
  })
}

test('one-slot codes overwrite in place and retain the sole tab stop', () => {
  const change = vi.fn()
  const focus = vi.fn()
  const result = pinInput({ length: 1, value: '1', onValueChange: change, onFocusChange: focus })
  result.insert(100, '98')
  expect(change.mock.calls).toEqual([['9']])
  expect(focus.mock.calls).toEqual([[0]])
  expect(result.parts.input(0).attrs.tabindex).toBe(0)
  expect(result.state.value).toBe('1')
})

test('out-of-range insertion clamps to contiguous insertion without introducing holes', () => {
  const change = vi.fn()
  const focus = vi.fn()
  const result = pinInput({ length: 5, value: '12', onValueChange: change, onFocusChange: focus })
  result.insert(99, '7890')
  expect(change.mock.calls).toEqual([['12789']])
  expect(focus.mock.calls).toEqual([[4]])
  change.mockClear()
  focus.mockClear()
  result.insert(-99, '8')
  expect(change.mock.calls).toEqual([['82']])
  expect(focus.mock.calls).toEqual([[1]])
})

test('filtered-empty insertion changes neither code nor focus', () => {
  const change = vi.fn()
  const focus = vi.fn()
  pinInput({ value: '12', onValueChange: change, onFocusChange: focus }).insert(1, 'a-💡')
  expect(change).not.toHaveBeenCalled()
  expect(focus).not.toHaveBeenCalled()
})

for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'ArrowUp', 'ArrowDown']) {
  test(`readonly ${key} retains navigation while blocking deletion and insertion`, () => {
    const change = vi.fn()
    const focus = vi.fn()
    const result = pinInput({
      value: '123',
      length: 5,
      readonly: true,
      onValueChange: change,
      onFocusChange: focus,
    })
    const preventDefault = vi.fn()
    result.parts.input(1).on.keydown?.({ key, preventDefault } as never)
    expect(focus.mock.calls).toEqual([
      [['ArrowLeft', 'Home', 'ArrowUp'].includes(key) ? 0 : key === 'ArrowRight' ? 2 : 3],
    ])
    expect(preventDefault).toHaveBeenCalledOnce()
    result.insert(1, '8')
    result.parts.input(1).on.keydown?.({ key: 'Backspace', preventDefault: vi.fn() } as never)
    expect(change).not.toHaveBeenCalled()
  })
}

test('disabled navigation and direct focus requests are silent', () => {
  const focus = vi.fn()
  const change = vi.fn()
  const result = pinInput({
    disabled: true,
    value: '12',
    onFocusChange: focus,
    onValueChange: change,
  })
  const preventDefault = vi.fn()
  result.focus(2)
  result.insert(1, '9')
  result.parts.input(1).on.keydown?.({ key: 'ArrowLeft', preventDefault } as never)
  expect(focus).not.toHaveBeenCalled()
  expect(change).not.toHaveBeenCalled()
  expect(preventDefault).not.toHaveBeenCalled()
})

test('forward Tab from an earlier slot requests the insertion slot without canceling traversal', () => {
  const focus = vi.fn()
  const result = pinInput({ value: '123', length: 5, onFocusChange: focus })
  const preventDefault = vi.fn()
  result.parts.input(0).on.keydown?.({ key: 'Tab', preventDefault } as never)
  expect(focus.mock.calls).toEqual([[3]])
  focus.mockClear()
  result.parts.input(0).on.keydown?.({ key: 'Tab', shiftKey: true, preventDefault } as never)
  result.parts.input(3).on.keydown?.({ key: 'Tab', preventDefault } as never)
  expect(focus).not.toHaveBeenCalled()
  expect(preventDefault).not.toHaveBeenCalled()
})
