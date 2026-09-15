import { describe, expect, it, vi } from 'vitest'
import { calendar } from './calendar'
import type { CalendarResult } from './calendar'
import { isoAdapter as adapter } from '../date/iso-adapter.fixture'
import { createDate, dateOnlyAdapter } from '../date'
const today = '2024-02-15'
const cells = (result: CalendarResult<string>) =>
  result.state.months.flatMap((month) => month.weeks.flat())
const day = (result: CalendarResult<string>, value: string) =>
  cells(result).find((cell) => cell.value === value && !cell.outsideMonth)!
function keyboard(
  result: CalendarResult<string>,
  value: string,
  key: string,
  extra: Partial<KeyboardEvent> = {}
) {
  const event = { key, preventDefault: vi.fn(), ...extra } as unknown as KeyboardEvent
  result.parts
    .day(day(result, value))
    .on.keydown?.(event as KeyboardEvent & { currentTarget: HTMLButtonElement })
  return event
}
describe('calendar', () => {
  it('builds leap-month weeks, localized headers and labels without mount callbacks', () => {
    const changed = vi.fn()
    const result = calendar({
      adapter,
      today,
      onValueChange: changed,
      onFocusedValueChange: changed,
      onVisibleMonthChange: changed,
    })
    expect(result.state.heading).toBe('February 2024')
    expect(result.state.weeks).toHaveLength(5)
    expect(result.state.weeks[0]![0]!.value).toBe('2024-01-28')
    expect(result.state.weekdays[0]).toMatchObject({ weekday: 0, label: 'Sunday' })
    expect(result.parts.day(day(result, today)).attrs).toMatchObject({
      tabindex: 0,
      'aria-current': 'date',
      'aria-label': 'Thursday, February 15, 2024',
      'data-date': today,
    })
    expect(result.parts.grid().attrs.role).toBe('grid')
    expect(result.parts.grid().attrs.tabindex).toBeUndefined()
    expect(changed).not.toHaveBeenCalled()
  })
  it('uses native cells for selection and never puts aria-selected on day buttons', () => {
    const result = calendar({ adapter, today, value: today })
    expect(result.parts.cell(day(result, today)).attrs['aria-selected']).toBe('true')
    expect(result.parts.day(day(result, today)).attrs['aria-selected']).toBeUndefined()
    expect(result.parts.day(day(result, today)).attrs['data-selected']).toBe('')
  })
  it('works with the immutable object adapter and the ISO string adapter', () => {
    const strings = calendar({ adapter, today, locale: 'fr-FR', weekStartsOn: 1, fixedWeeks: true })
    const objects = calendar({
      adapter: dateOnlyAdapter,
      today: createDate(2024, 2, 15),
      locale: 'fr-FR',
      weekStartsOn: 1,
      fixedWeeks: true,
    })
    expect(strings.state.heading).toBe(objects.state.heading)
    expect(strings.state.heading).toBe('février 2024')
    expect(strings.state.weeks).toHaveLength(6)
    expect(strings.state.weekdays[0]!.label).toBe('lundi')
    expect(cells(strings).map((cell) => cell.key)).toEqual(
      objects.state.weeks.flat().map((cell) => cell.key)
    )
  })
  it('renders two labeled months with one canonical tab stop despite duplicate spillovers', () => {
    const result = calendar({
      adapter,
      today,
      focusedValue: '2024-03-01',
      visibleMonth: today,
      visibleMonths: 2,
    })
    expect(result.state.months.map((month) => month.heading)).toEqual([
      'February 2024',
      'March 2024',
    ])
    expect(result.parts.grid(1).attrs['aria-label']).toBe('March 2024')
    const duplicates = cells(result).filter((cell) => cell.value === '2024-03-01')
    expect(duplicates).toHaveLength(2)
    expect(new Set(duplicates.map((cell) => cell.key)).size).toBe(2)
    expect(
      cells(result).filter((cell) => result.parts.day(cell).attrs.tabindex === 0)
    ).toHaveLength(1)
    expect(result.parts.day(duplicates.find((cell) => cell.outsideMonth)!).attrs.tabindex).toBe(-1)
  })
  it('keeps navigation within the visible window and pages by its count', () => {
    const focused = vi.fn(),
      visible = vi.fn()
    const result = calendar({
      adapter,
      today,
      visibleMonths: 2,
      focusedValue: '2024-02-29',
      onFocusedValueChange: focused,
      onVisibleMonthChange: visible,
    })
    keyboard(result, '2024-02-29', 'ArrowRight')
    expect(focused).toHaveBeenLastCalledWith('2024-03-01')
    expect(visible).not.toHaveBeenCalled()
    result.parts.nextTrigger.on.click?.({} as PointerEvent & { currentTarget: HTMLButtonElement })
    expect(visible).toHaveBeenLastCalledWith('2024-04-01')
  })
  it.each([
    ['ArrowLeft', {}, '2024-02-14'],
    ['ArrowRight', {}, '2024-02-16'],
    ['ArrowUp', {}, '2024-02-08'],
    ['ArrowDown', {}, '2024-02-22'],
    ['Home', {}, '2024-02-11'],
    ['End', {}, '2024-02-17'],
    ['PageUp', {}, '2024-01-15'],
    ['PageDown', {}, '2024-03-15'],
    ['PageUp', { shiftKey: true }, '2023-02-15'],
    ['PageDown', { shiftKey: true }, '2025-02-15'],
  ])('handles %s with modifier %o', (key, extra, expected) => {
    const focused = vi.fn()
    const result = calendar({ adapter, today, onFocusedValueChange: focused })
    expect(keyboard(result, today, key, extra).preventDefault).toHaveBeenCalledOnce()
    expect(focused).toHaveBeenCalledExactlyOnceWith(expected)
  })
  it('reverses horizontal arrows in RTL, uses Monday week boundaries, and clamps page dates', () => {
    const focused = vi.fn()
    const rtl = calendar({
      adapter,
      today,
      dir: 'rtl',
      weekStartsOn: 1,
      onFocusedValueChange: focused,
    })
    keyboard(rtl, today, 'ArrowLeft')
    expect(focused).toHaveBeenLastCalledWith('2024-02-16')
    keyboard(rtl, today, 'Home')
    expect(focused).toHaveBeenLastCalledWith('2024-02-12')
    const january = calendar({ adapter, today: '2024-01-31', onFocusedValueChange: focused })
    keyboard(january, '2024-01-31', 'PageDown')
    expect(focused).toHaveBeenLastCalledWith('2024-02-29')
  })
  it('ignores composing and modified navigation, and leaves native activation keys alone', () => {
    const focused = vi.fn()
    const result = calendar({ adapter, today, onFocusedValueChange: focused })
    for (const extra of [
      { isComposing: true },
      { altKey: true },
      { ctrlKey: true },
      { metaKey: true },
    ])
      expect(keyboard(result, today, 'ArrowRight', extra).preventDefault).not.toHaveBeenCalled()
    expect(keyboard(result, today, 'Enter').preventDefault).not.toHaveBeenCalled()
    expect(keyboard(result, today, ' ').preventDefault).not.toHaveBeenCalled()
    expect(focused).not.toHaveBeenCalled()
  })
  it('bounds focus and selection while unavailable dates retain focusability', () => {
    const selected = vi.fn(),
      focused = vi.fn()
    const result = calendar({
      adapter,
      today,
      minValue: '2024-02-10',
      maxValue: '2024-02-20',
      isDateUnavailable: (value) => value === '2024-02-16',
      onValueChange: selected,
      onFocusedValueChange: focused,
    })
    result.select('2024-02-09')
    result.select('2024-02-16')
    expect(selected).not.toHaveBeenCalled()
    keyboard(result, today, 'ArrowRight')
    expect(focused).toHaveBeenLastCalledWith('2024-02-16')
    expect(result.parts.day(day(result, '2024-02-16')).attrs).toMatchObject({
      'aria-disabled': 'true',
      disabled: undefined,
    })
    result.focus('2025-01-01')
    expect(focused).toHaveBeenLastCalledWith('2024-02-20')
    expect(result.state.canGoPrevious).toBe(false)
    expect(result.state.canGoNext).toBe(false)
  })
  it('allows readonly focus and paging but disables every interaction when disabled', () => {
    for (const disabled of [false, true]) {
      const changed = vi.fn(),
        focused = vi.fn(),
        visible = vi.fn()
      const result = calendar({
        adapter,
        today,
        readOnly: true,
        disabled,
        onValueChange: changed,
        onFocusedValueChange: focused,
        onVisibleMonthChange: visible,
      })
      result.select('2024-02-16')
      keyboard(result, today, 'ArrowRight')
      result.navigate(1)
      expect(changed).not.toHaveBeenCalled()
      expect(focused.mock.calls.length > 0).toBe(!disabled)
      expect(visible.mock.calls.length > 0).toBe(!disabled)
      expect(
        cells(result).filter((cell) => result.parts.day(cell).attrs.tabindex === 0)
      ).toHaveLength(disabled ? 0 : 1)
    }
  })
  it('pads supported-year boundaries without throwing and clamps arrows to the final day', () => {
    const focused = vi.fn()
    const first = calendar({
      adapter,
      today: '0001-01-03',
      fixedWeeks: true,
      onFocusedValueChange: focused,
    })
    expect(first.state.weeks[0]![0]!.value).toBeUndefined()
    keyboard(first, '0001-01-03', 'ArrowUp')
    expect(focused).toHaveBeenLastCalledWith('0001-01-01')
    const last = calendar({
      adapter,
      today: '9999-12-29',
      visibleMonths: 2,
      fixedWeeks: true,
      onFocusedValueChange: focused,
    })
    expect(last.state.visibleMonth).toBe('9999-11-01')
    expect(last.state.canGoNext).toBe(false)
    expect(cells(last).some((cell) => cell.value === undefined)).toBe(true)
    keyboard(last, '9999-12-29', 'End')
    expect(focused).toHaveBeenLastCalledWith('9999-12-31')
  })
  it('suppresses duplicate selection and rejects reversed date bounds', () => {
    const selected = vi.fn()
    calendar({ adapter, today, value: today, onValueChange: selected }).select(today)
    expect(selected).not.toHaveBeenCalled()
    expect(() =>
      calendar({ adapter, today, minValue: '2024-03-01', maxValue: '2024-02-01' })
    ).toThrow(RangeError)
  })
})
