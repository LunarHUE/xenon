import { describe, expect, test } from 'vitest'

import { progress } from './progress'

describe('progress', () => {
  test('no value is indeterminate: the bounds stay, the current value drops out', () => {
    const { state, parts } = progress()
    expect(state).toEqual({
      value: undefined,
      min: 0,
      max: 100,
      percentage: undefined,
      indeterminate: true,
      complete: false,
      valueText: undefined,
    })
    expect(parts.root.attrs).toEqual({
      role: 'progressbar',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': undefined,
      'aria-valuetext': undefined,
      'data-state': 'indeterminate',
    })
  })

  test('a value reports itself and its share of the range', () => {
    const { state, parts } = progress({ value: 25 })
    expect(state).toMatchObject({ percentage: 25, indeterminate: false, complete: false })
    expect(parts.root.attrs).toMatchObject({
      'aria-valuenow': '25',
      'aria-valuetext': '25%',
      'data-state': 'loading',
    })
  })

  test('reaching the maximum is complete', () => {
    expect(progress({ value: 100 }).state.complete).toBe(true)
    expect(progress({ value: 100 }).parts.root.attrs['data-state']).toBe('complete')
  })

  test('values outside the range clamp to it', () => {
    expect(progress({ value: -10 }).state).toMatchObject({ value: 0, percentage: 0 })
    expect(progress({ value: 300 }).state).toMatchObject({ value: 100, percentage: 100 })
  })

  test('the percentage spans min to max, not zero to max', () => {
    const { state, parts } = progress({ value: 0, min: -5, max: 5 })
    expect(state.percentage).toBe(50)
    expect(parts.root.attrs).toMatchObject({
      'aria-valuemin': '-5',
      'aria-valuemax': '5',
      'aria-valuenow': '0',
      'aria-valuetext': '50%',
    })
  })

  test('a zero-width range is 0%, never a division artifact', () => {
    const { state } = progress({ value: 7, min: 7, max: 7 })
    expect(state).toMatchObject({ percentage: 0, valueText: '0%', complete: true })
  })

  test('a non-finite value is indeterminate, so aria-valuenow is never NaN', () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      const { state, parts } = progress({ value })
      expect(state.indeterminate).toBe(true)
      expect(parts.root.attrs['aria-valuenow']).toBeUndefined()
    }
  })

  test('format owns aria-valuetext and sees the clamped value and its percentage', () => {
    const { parts } = progress({
      value: 3,
      max: 4,
      format: (d) => `${d.value} of ${d.max} (${d.percentage}%)`,
    })
    expect(parts.root.attrs['aria-valuetext']).toBe('3 of 4 (75%)')
  })

  test('format is not called while indeterminate', () => {
    let calls = 0
    const { parts } = progress({
      format: () => {
        calls += 1
        return 'x'
      },
    })
    expect(calls).toBe(0)
    expect(parts.root.attrs['aria-valuetext']).toBeUndefined()
  })
})
