import { expect, test, vi } from 'vitest'
import { numberField } from './number-field'

for (const step of [0, -1, NaN, Infinity]) {
  test(`invalid step ${step} defaults to unit movement`, () => {
    const change = vi.fn()
    numberField({ value: 2, step, onValueChange: change }).parts.input.on.keydown?.({
      key: 'ArrowUp',
      preventDefault() {},
    } as never)
    expect(change.mock.calls).toEqual([[3]])
  })
}

for (const value of [NaN, Infinity, -Infinity]) {
  test(`nonfinite committed value ${value} normalizes to empty without mount callbacks`, () => {
    const change = vi.fn()
    const commit = vi.fn()
    const result = numberField({ value, onValueChange: change, onValueCommit: commit })
    expect(result.state.value).toBeNull()
    expect(result.state.inputValue).toBe('')
    expect(result.parts.input.attrs['aria-valuenow']).toBeUndefined()
    expect(change).not.toHaveBeenCalled()
    expect(commit).not.toHaveBeenCalled()
  })
}

test('reversed finite bounds collapse to the minimum for commit and both step directions', () => {
  const change = vi.fn()
  const result = numberField({ value: 0, inputValue: '25', min: 10, max: 5, onValueChange: change })
  expect(result.parts.input.attrs['aria-valuemin']).toBe('10')
  expect(result.parts.input.attrs['aria-valuemax']).toBe('10')
  result.commit()
  expect(change.mock.calls).toEqual([[10]])
  const atBoundary = numberField({ value: 10, min: 10, max: 5, onValueChange: change })
  expect(atBoundary.state.incrementDisabled).toBe(true)
  expect(atBoundary.state.decrementDisabled).toBe(true)
  atBoundary.parts.incrementTrigger.on.click?.({} as never)
  atBoundary.parts.decrementTrigger.on.click?.({} as never)
  expect(change.mock.calls).toEqual([[10]])
})

test('empty draft clears a populated value with change before commit, while empty-to-empty stays silent', () => {
  const calls: unknown[][] = []
  const callbacks = {
    onValueChange: (value: number | null) => calls.push(['change', value]),
    onValueCommit: (value: number | null) => calls.push(['commit', value]),
  }
  numberField({ value: 5, inputValue: ' ', ...callbacks }).commit()
  expect(calls).toEqual([
    ['change', null],
    ['commit', null],
  ])
  calls.length = 0
  numberField({ value: null, inputValue: '', ...callbacks }).commit()
  expect(calls).toEqual([])
})

for (const key of ['PageUp', 'PageDown']) {
  test(`${key} uses the custom page step and clamps to finite bounds`, () => {
    const change = vi.fn()
    const result = numberField({
      value: key === 'PageUp' ? 9 : 5,
      min: 0,
      max: 10,
      step: 0.5,
      largeStep: 8,
      onValueChange: change,
    })
    const preventDefault = vi.fn()
    result.parts.input.on.keydown?.({ key, preventDefault } as never)
    expect(change.mock.calls).toEqual([[key === 'PageUp' ? 10 : 0]])
    expect(preventDefault).toHaveBeenCalledOnce()
  })
}
