import { describe, expect, it, vi } from 'vitest'
import { rangeCalendar } from './range-calendar'
import { isoAdapter as adapter } from '../date/iso-adapter.fixture'
const today = '2024-02-15'
describe('range calendar', () => {
  it('does not discard a draft when Escape belongs to an active composition', () => {
    const anchor = vi.fn()
    const result = rangeCalendar({
      adapter,
      today,
      anchorValue: today,
      onAnchorValueChange: anchor,
    })
    const event = {
      key: 'Escape',
      isComposing: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as KeyboardEvent & { currentTarget: HTMLDivElement }
    result.parts.root.on.keydown?.(event)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(anchor).not.toHaveBeenCalled()
  })

  it('keeps first activation in draft and commits sorted complete ranges on second activation', () => {
    const selected = vi.fn(),
      anchor = vi.fn(),
      preview = vi.fn()
    const first = rangeCalendar({
      adapter,
      today,
      onValueChange: selected,
      onAnchorValueChange: anchor,
      onPreviewValueChange: preview,
    })
    expect(anchor).not.toHaveBeenCalled()
    first.select('2024-02-20')
    expect(selected).not.toHaveBeenCalled()
    expect(anchor).toHaveBeenCalledExactlyOnceWith('2024-02-20')
    const second = rangeCalendar({
      adapter,
      today,
      anchorValue: '2024-02-20',
      onValueChange: selected,
      onAnchorValueChange: anchor,
      onPreviewValueChange: preview,
    })
    second.select('2024-02-10')
    expect(selected).toHaveBeenCalledExactlyOnceWith({ start: '2024-02-10', end: '2024-02-20' })
    expect(anchor).toHaveBeenLastCalledWith(undefined)
    expect(preview).toHaveBeenLastCalledWith(undefined)
  })
  it('does not commit ranges crossing unavailable days and preserves the draft', () => {
    const selected = vi.fn(),
      anchor = vi.fn()
    const result = rangeCalendar({
      adapter,
      today,
      anchorValue: '2024-02-10',
      previewValue: '2024-02-20',
      isDateUnavailable: (value) => value === today,
      onValueChange: selected,
      onAnchorValueChange: anchor,
    })
    expect(result.state.previewRange).toBeUndefined()
    result.select('2024-02-20')
    expect(selected).not.toHaveBeenCalled()
    expect(anchor).not.toHaveBeenCalled()
  })
  it('previews focus and hover without changing the committed range', () => {
    const selected = vi.fn(),
      preview = vi.fn()
    const result = rangeCalendar({
      adapter,
      today,
      anchorValue: '2024-02-10',
      previewValue: '2024-02-14',
      onValueChange: selected,
      onPreviewValueChange: preview,
    })
    expect(result.state.previewRange).toEqual({ start: '2024-02-10', end: '2024-02-14' })
    const cell = result.state.weeks.flat().find((day) => day.value === '2024-02-12')!
    expect(result.parts.day(cell).attrs['data-highlighted']).toBe('')
    expect(result.parts.cell(cell).attrs['aria-selected']).toBe('false')
    result.preview('2024-02-18')
    expect(preview).toHaveBeenLastCalledWith('2024-02-18')
    result.focus('2024-02-19')
    expect(preview).toHaveBeenLastCalledWith('2024-02-19')
    expect(selected).not.toHaveBeenCalled()
  })
  it('Escape consumes only an active draft and leaves committed selection unchanged', () => {
    const selected = vi.fn(),
      anchor = vi.fn(),
      preview = vi.fn()
    const value = { start: '2024-02-01', end: '2024-02-05' }
    for (const drafting of [false, true]) {
      const result = rangeCalendar({
        adapter,
        today,
        value,
        anchorValue: drafting ? today : undefined,
        onValueChange: selected,
        onAnchorValueChange: anchor,
        onPreviewValueChange: preview,
      })
      const event = {
        key: 'Escape',
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as KeyboardEvent & { currentTarget: HTMLDivElement }
      result.parts.root.on.keydown?.(event)
      expect(event.preventDefault).toHaveBeenCalledTimes(drafting ? 1 : 0)
      expect(result.state.value).toEqual(value)
    }
    expect(anchor).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(preview).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(selected).not.toHaveBeenCalled()
  })
  it('supports same-day ranges and complete selection cell semantics', () => {
    const selected = vi.fn()
    rangeCalendar({ adapter, today, anchorValue: today, onValueChange: selected }).select(today)
    expect(selected).toHaveBeenCalledExactlyOnceWith({ start: today, end: today })
    const result = rangeCalendar({ adapter, today, value: { start: today, end: today } })
    const cell = result.state.weeks.flat().find((day) => day.value === today)!
    expect(result.parts.cell(cell).attrs['aria-selected']).toBe('true')
    expect(result.parts.day(cell).attrs).toMatchObject({
      'data-selection-start': '',
      'data-selection-end': '',
    })
    expect(result.parts.grid().attrs['aria-multiselectable']).toBe('true')
  })
  it('blocks readonly/disabled selection and supports cross-month generic ranges', () => {
    const selected = vi.fn(),
      anchor = vi.fn()
    for (const flags of [{ readOnly: true }, { disabled: true }])
      rangeCalendar({
        adapter,
        today,
        anchorValue: '2024-02-28',
        onValueChange: selected,
        onAnchorValueChange: anchor,
        ...flags,
      }).select('2024-03-02')
    expect(selected).not.toHaveBeenCalled()
    expect(anchor).not.toHaveBeenCalled()
    const result = rangeCalendar({
      adapter,
      today,
      visibleMonths: 2,
      anchorValue: '2024-02-28',
      previewValue: '2024-03-02',
      onValueChange: selected,
    })
    expect(result.state.previewRange).toEqual({ start: '2024-02-28', end: '2024-03-02' })
    result.select('2024-03-02')
    expect(selected).toHaveBeenCalledExactlyOnceWith({ start: '2024-02-28', end: '2024-03-02' })
  })
})

describe('range calendar flags', () => {
  const cell = (result: ReturnType<typeof rangeCalendar<string>>, value: string, outside = false) =>
    result.state.weeks.flat().find((day) => day.value === value && day.outsideMonth === outside)!
  it('marks a draft anchor as the range start while its preview is invalid', () => {
    const result = rangeCalendar({
      adapter,
      today,
      anchorValue: '2024-02-20',
      previewValue: '2024-02-10',
      isDateUnavailable: (value) => value === today,
    })
    expect(result.parts.day(cell(result, '2024-02-20')).attrs).toMatchObject({
      'data-selected': '',
      'data-selection-start': '',
    })
    expect(result.parts.day(cell(result, '2024-02-20')).attrs['data-selection-end']).toBeUndefined()
    expect(result.parts.day(cell(result, '2024-02-12')).attrs['data-highlighted']).toBeUndefined()
  })
  it('leaves overflow days from neighbouring months unflagged', () => {
    const result = rangeCalendar({
      adapter,
      today,
      value: { start: '2024-02-26', end: '2024-03-02' },
    })
    expect(result.parts.day(cell(result, '2024-02-26')).attrs['data-selected']).toBe('')
    const overflow = result.parts.day(cell(result, '2024-03-01', true)).attrs
    expect(overflow['data-selected']).toBeUndefined()
    expect(overflow['data-selection-end']).toBeUndefined()
    expect(overflow['data-outside-month']).toBe('')
  })
  it('names paging by the number of visible months', () => {
    const single = rangeCalendar({ adapter, today })
    expect(single.parts.previousTrigger.attrs['aria-label']).toBe('Previous month')
    const double = rangeCalendar({ adapter, today, visibleMonths: 2 })
    expect(double.parts.previousTrigger.attrs['aria-label']).toBe('Previous 2 months')
    expect(double.parts.nextTrigger.attrs['aria-label']).toBe('Next 2 months')
  })
})
