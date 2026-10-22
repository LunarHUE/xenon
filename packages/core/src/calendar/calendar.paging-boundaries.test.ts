import { expect, test, vi } from 'vitest'
import { calendar } from './calendar'
import { isoAdapter as adapter } from '../date/iso-adapter.fixture'

for (const [focusedValue, key, shiftKey, expected] of [
  ['2024-01-31', 'PageDown', false, '2024-02-29'],
  ['2023-01-31', 'PageDown', false, '2023-02-28'],
  ['2024-03-31', 'PageUp', false, '2024-02-29'],
  ['2024-02-29', 'PageDown', true, '2025-02-28'],
  ['2024-02-29', 'PageUp', true, '2023-02-28'],
  ['2024-12-31', 'ArrowRight', false, '2025-01-01'],
  ['2024-01-01', 'ArrowLeft', false, '2023-12-31'],
] as const) {
  test(`${focusedValue} ${shiftKey ? 'Shift+' : ''}${key} requests ${expected} without changing selection`, () => {
    const focused = vi.fn()
    const visible = vi.fn()
    const change = vi.fn()
    const result = calendar({
      adapter,
      today: focusedValue,
      focusedValue,
      visibleMonth: focusedValue,
      value: focusedValue,
      onFocusedValueChange: focused,
      onVisibleMonthChange: visible,
      onValueChange: change,
    })
    const cell = result.state.months
      .flatMap((month) => month.weeks.flat())
      .find((cell) => cell.value === focusedValue && !cell.outsideMonth)!
    const preventDefault = vi.fn()
    result.parts.day(cell).on.keydown?.({ key, shiftKey, preventDefault } as never)
    expect(focused.mock.calls).toEqual([[expected]])
    expect(visible.mock.calls).toEqual([[`${expected.slice(0, 7)}-01`]])
    expect(preventDefault).toHaveBeenCalledOnce()
    expect(change).not.toHaveBeenCalled()
    expect(result.state.value).toBe(focusedValue)
  })
}
