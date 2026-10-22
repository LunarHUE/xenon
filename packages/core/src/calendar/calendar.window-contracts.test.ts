import { expect, test, vi } from 'vitest'
import { calendar } from './calendar'
import { isoAdapter as adapter } from '../date/iso-adapter.fixture'

const today = '2024-02-29'

test.each([
  [0, 1],
  [-5, 1],
  [1.9, 1],
  [2.9, 2],
  [12, 12],
  [100, 12],
  [NaN, 1],
  [Infinity, 1],
  [-Infinity, 1],
])(
  'visibleMonths %s resolves to %s ordered months with one owning tab stop',
  (visibleMonths, count) => {
    const change = vi.fn()
    const result = calendar({
      adapter,
      today,
      visibleMonths,
      fixedWeeks: true,
      onVisibleMonthChange: change,
    })
    expect(result.state.months).toHaveLength(count!)
    expect(result.state.visibleMonth).toBe('2024-02-01')
    expect(result.state.months.map((month) => month.month)).toEqual(
      Array.from({ length: count! }, (_, index) => adapter.addMonths('2024-02-01', index))
    )
    const cells = result.state.months.flatMap((month, index) => {
      expect(month.weeks).toHaveLength(6)
      expect(month.weeks.every((week) => week.length === 7)).toBe(true)
      expect(result.parts.grid(index).attrs['aria-label']).toBe(month.heading)
      return month.weeks.flat()
    })
    expect(new Set(cells.map((cell) => cell.key)).size).toBe(cells.length)
    expect(
      cells.filter((cell) => result.parts.day(cell).attrs.tabindex === 0).map((cell) => cell.value)
    ).toEqual([today])
    expect(change).not.toHaveBeenCalled()
  }
)

test.each([
  [24, '2024-05-01', '2024-05-10'],
  [-24, '2023-12-01', '2023-12-31'],
  [Number.MAX_SAFE_INTEGER, '2024-05-01', '2024-05-10'],
  [-Number.MAX_SAFE_INTEGER, '2023-12-01', '2023-12-31'],
])('month jump %s clamps to the inclusive interval without selecting', (delta, month, focused) => {
  const visible = vi.fn()
  const focus = vi.fn()
  const select = vi.fn()
  const result = calendar({
    adapter,
    today: '2024-01-31',
    minValue: '2023-12-15',
    maxValue: '2024-05-10',
    onVisibleMonthChange: visible,
    onFocusedValueChange: focus,
    onValueChange: select,
  })
  result.navigate(delta as number)
  expect(visible).toHaveBeenCalledExactlyOnceWith(month)
  expect(focus).toHaveBeenCalledExactlyOnceWith(focused)
  expect(select).not.toHaveBeenCalled()
  expect(result.state.visibleMonth).toBe('2024-01-01')
})

test.each([0, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'invalid or zero month jump %s emits no state requests',
  (delta) => {
    const change = vi.fn()
    const result = calendar({
      adapter,
      today,
      onVisibleMonthChange: change,
      onFocusedValueChange: change,
    })
    result.navigate(delta)
    expect(change).not.toHaveBeenCalled()
  }
)

test('a one-day leap-date interval keeps exactly its endpoint selectable and both pages closed', () => {
  const change = vi.fn()
  const result = calendar({
    adapter,
    today: '2024-02-01',
    minValue: today,
    maxValue: today,
    onValueChange: change,
  })
  expect(result.state.focusedValue).toBe(today)
  expect(result.state.canGoPrevious).toBe(false)
  expect(result.state.canGoNext).toBe(false)
  const enabled = result.state.weeks.flat().filter((cell) => !result.parts.day(cell).attrs.disabled)
  expect(enabled.map((cell) => cell.value)).toEqual([today])
  result.select('2024-02-28')
  result.select('2024-03-01')
  expect(change).not.toHaveBeenCalled()
  result.select(today)
  expect(change).toHaveBeenCalledExactlyOnceWith(today)
})
