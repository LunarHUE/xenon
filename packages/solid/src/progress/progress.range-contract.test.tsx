import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { Progress } from './progress'

test('range-only changes move progress through loading, complete and back without replacing its host', () => {
  const [range, setRange] = createSignal({ min: 0, max: 100 })
  const view = render(() => <Progress value={25} {...range()} aria-label="Transfer" />)
  const progress = view.getByRole('progressbar')
  for (const [range, now, percentage, state] of [
    [{ min: 20, max: 30 }, 25, 50, 'loading'],
    [{ min: 0, max: 20 }, 20, 100, 'complete'],
    [{ min: 30, max: 40 }, 30, 0, 'loading'],
    [{ min: 10, max: 10 }, 10, 0, 'complete'],
    [{ min: 0, max: 50 }, 25, 50, 'loading'],
  ] as const) {
    setRange(range)
    flush()
    expect(view.getByRole('progressbar')).toBe(progress)
    expect(progress).toHaveAttribute('aria-valuenow', String(now))
    expect(progress).toHaveAttribute('aria-valuetext', `${percentage}%`)
    expect(progress).toHaveAttribute('aria-valuemin', String(range.min))
    expect(progress).toHaveAttribute('aria-valuemax', String(range.max))
    expect(progress).toHaveAttribute('data-state', state)
    expect(progress.style.getPropertyValue('--progress-percentage')).toBe(String(percentage))
  }
})

test.each([undefined, NaN, Infinity, -Infinity])(
  'changing bounds while value=%s retains indeterminate semantics and skips formatting',
  (invalid) => {
    const [value, setValue] = createSignal<number | undefined>(25)
    const [range, setRange] = createSignal({ min: 0, max: 100 })
    const format = vi.fn(({ value }: { value: number }) => `${value} files`)
    const view = render(() => (
      <Progress value={value()} {...range()} format={format} aria-label="Upload" />
    ))
    const progress = view.getByRole('progressbar')
    setValue(invalid)
    flush()
    format.mockClear()
    setRange({ min: 10, max: 20 })
    flush()
    expect(progress).toHaveAttribute('aria-valuemin', '10')
    expect(progress).toHaveAttribute('aria-valuemax', '20')
    expect(progress).toHaveAttribute('data-state', 'indeterminate')
    expect(progress).not.toHaveAttribute('aria-valuenow')
    expect(progress).not.toHaveAttribute('aria-valuetext')
    expect(progress.style.getPropertyValue('--progress-percentage')).toBe('')
    expect(format).not.toHaveBeenCalled()
    setValue(50)
    flush()
    expect(progress).toHaveAttribute('aria-valuenow', '20')
    expect(progress).toHaveAttribute('aria-valuetext', '20 files')
    expect(progress).toHaveAttribute('data-state', 'complete')
    expect(progress.style.getPropertyValue('--progress-percentage')).toBe('100')
    expect(format).toHaveBeenCalledExactlyOnceWith({ value: 20, min: 10, max: 20, percentage: 100 })
  }
)

test('fractional percentages retain precision in CSS while accessible text rounds and upper clamp reads 100 percent', () => {
  const [value, setValue] = createSignal(1)
  const view = render(() => <Progress value={value()} max={3} aria-label="Steps" />)
  const progress = view.getByRole('progressbar')
  expect(progress).toHaveAttribute('aria-valuetext', '33%')
  expect(Number(progress.style.getPropertyValue('--progress-percentage'))).toBeCloseTo(100 / 3)
  setValue(2)
  flush()
  expect(progress).toHaveAttribute('aria-valuenow', '2')
  expect(progress).toHaveAttribute('aria-valuetext', '67%')
  expect(Number(progress.style.getPropertyValue('--progress-percentage'))).toBeCloseTo(200 / 3)
  setValue(10)
  flush()
  expect(progress).toHaveAttribute('aria-valuenow', '3')
  expect(progress).toHaveAttribute('aria-valuetext', '100%')
  expect(progress).toHaveAttribute('data-state', 'complete')
  expect(progress.style.getPropertyValue('--progress-percentage')).toBe('100')
})
