import { describe, expect, test, vi } from 'vitest'
import { rangeCalendar } from './range-calendar'
import { isoAdapter as adapter } from '../date/iso-adapter.fixture'

const today = '2024-02-28'

describe('inclusive range endpoints across civil month boundaries', () => {
  test.each([
    ['2024-02-28', '2024-03-01'],
    ['2023-02-28', '2023-03-01'],
    ['2024-12-31', '2025-01-01'],
    ['0001-01-01', '0001-01-02'],
    ['9999-12-30', '9999-12-31'],
  ])('accepts exact bounds %s through %s in both drafting directions', (start, end) => {
    for (const [anchorValue, endpoint] of [
      [start, end],
      [end, start],
    ]) {
      const change = vi.fn()
      const anchor = vi.fn()
      const preview = vi.fn()
      const result = rangeCalendar({
        adapter,
        today: start!,
        minValue: start,
        maxValue: end,
        anchorValue,
        previewValue: endpoint,
        onValueChange: change,
        onAnchorValueChange: anchor,
        onPreviewValueChange: preview,
      })
      expect(result.state.previewRange).toEqual({ start, end })
      result.select(endpoint!)
      expect(change).toHaveBeenCalledExactlyOnceWith({ start, end })
      expect(anchor).toHaveBeenCalledExactlyOnceWith(undefined)
      expect(preview).toHaveBeenCalledExactlyOnceWith(undefined)
      expect(result.state.value).toBeUndefined()
      expect(result.state.anchorValue).toBe(anchorValue)
    }
  })

  test.each(['2024-02-28', '2024-02-29', '2024-03-01'])(
    'rejects an unavailable %s anywhere in the inclusive leap-day path',
    (blocked) => {
      for (const [anchorValue, endpoint] of [
        ['2024-02-28', '2024-03-01'],
        ['2024-03-01', '2024-02-28'],
      ] as const) {
        const change = vi.fn()
        const anchor = vi.fn()
        const result = rangeCalendar({
          adapter,
          today,
          anchorValue,
          previewValue: endpoint,
          isDateUnavailable: (value) => value === blocked,
          onValueChange: change,
          onAnchorValueChange: anchor,
        })
        expect(result.state.previewRange).toBeUndefined()
        result.select(endpoint)
        expect(change).not.toHaveBeenCalled()
        expect(anchor).not.toHaveBeenCalled()
      }
    }
  )

  test.each(['2024-02-27', '2024-03-02'])(
    'ignores unavailable dates outside the completed path: %s',
    (blocked) => {
      const change = vi.fn()
      const result = rangeCalendar({
        adapter,
        today,
        anchorValue: today,
        previewValue: '2024-03-01',
        isDateUnavailable: (value) => value === blocked,
        onValueChange: change,
      })
      expect(result.state.previewRange).toEqual({ start: today, end: '2024-03-01' })
      result.select('2024-03-01')
      expect(change).toHaveBeenCalledExactlyOnceWith({ start: today, end: '2024-03-01' })
    }
  )

  test.each([{ minValue: '2024-02-29' }, { maxValue: '2024-02-29' }])(
    'rejects a draft whose anchor or endpoint falls outside tightened bounds %j',
    (bounds) => {
      const change = vi.fn()
      const anchor = vi.fn()
      const result = rangeCalendar({
        adapter,
        today,
        anchorValue: today,
        previewValue: '2024-03-01',
        ...bounds,
        onValueChange: change,
        onAnchorValueChange: anchor,
      })
      expect(result.state.previewRange).toBeUndefined()
      result.select('2024-03-01')
      expect(change).not.toHaveBeenCalled()
      expect(anchor).not.toHaveBeenCalled()
    }
  )
})

describe('range snapshot updates', () => {
  test('normalizes a reversed committed range without mutating the owner or emitting callbacks', () => {
    const value = Object.freeze({ start: '2024-03-02', end: today })
    const change = vi.fn()
    const result = rangeCalendar({ adapter, today, value, visibleMonths: 2, onValueChange: change })
    expect(result.state.value).toEqual({ start: today, end: '2024-03-02' })
    expect(value).toEqual({ start: '2024-03-02', end: today })
    const owned = result.state.months
      .flatMap((month) => month.weeks.flat())
      .filter((day) => !day.outsideMonth && day.value! >= today && day.value! <= '2024-03-02')
    expect(owned.map((day) => day.value)).toEqual([today, '2024-02-29', '2024-03-01', '2024-03-02'])
    for (const day of owned) {
      expect(result.parts.cell(day).attrs['aria-selected']).toBe('true')
      expect(result.parts.day(day).attrs['data-selection-start']).toBe(
        day.value === today ? '' : undefined
      )
      expect(result.parts.day(day).attrs['data-selection-end']).toBe(
        day.value === '2024-03-02' ? '' : undefined
      )
    }
    expect(change).not.toHaveBeenCalled()
  })

  test('finishes an identical reversed range by clearing its draft without proposing a new value', () => {
    const change = vi.fn()
    const anchor = vi.fn()
    const preview = vi.fn()
    const result = rangeCalendar({
      adapter,
      today,
      value: { start: '2024-03-01', end: today },
      anchorValue: '2024-03-01',
      onValueChange: change,
      onAnchorValueChange: anchor,
      onPreviewValueChange: preview,
    })
    result.select(today)
    expect(change).not.toHaveBeenCalled()
    expect(anchor).toHaveBeenCalledExactlyOnceWith(undefined)
    expect(preview.mock.calls).toEqual([[today], [undefined]])
  })

  test('returns to focused preview after the owner accepts pointer leave', () => {
    const preview = vi.fn()
    const options = {
      adapter,
      today,
      anchorValue: today,
      focusedValue: '2024-02-29',
      onPreviewValueChange: preview,
    }
    const hovered = rangeCalendar({ ...options, previewValue: '2024-03-02' })
    hovered.preview('2024-03-02')
    expect(preview).not.toHaveBeenCalled()
    hovered.preview(undefined)
    expect(preview).toHaveBeenCalledExactlyOnceWith(undefined)
    const accepted = rangeCalendar(options)
    expect(accepted.state.previewRange).toEqual({ start: today, end: '2024-02-29' })
    accepted.preview(undefined)
    expect(preview).toHaveBeenCalledTimes(1)
  })

  test('availability removal restores a previously rejected draft without changing committed selection', () => {
    const value = { start: '2024-02-01', end: '2024-02-02' }
    const change = vi.fn()
    const options = {
      adapter,
      today,
      value,
      anchorValue: today,
      previewValue: '2024-03-01',
      onValueChange: change,
    }
    const blocked = rangeCalendar({
      ...options,
      isDateUnavailable: (value) => value === '2024-02-29',
    })
    blocked.select('2024-03-01')
    expect(change).not.toHaveBeenCalled()
    expect(blocked.state.value).toEqual(value)
    const allowed = rangeCalendar(options)
    expect(allowed.state.previewRange).toEqual({ start: today, end: '2024-03-01' })
    allowed.select('2024-03-01')
    expect(change).toHaveBeenCalledExactlyOnceWith({ start: today, end: '2024-03-01' })
  })
})
