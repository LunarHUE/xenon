import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test, vi } from 'vitest'
import { Meter } from './meter'

test.each(['meter', 'div'] as const)(
  '%s keeps zero, negative and fractional measurements distinct from their percentages',
  (as) => {
    const [value, setValue] = createSignal(0)
    const view = render(() => (
      <Meter as={as} min={-5} max={5} value={value()} aria-label="Temperature">
        <span>{Math.round(((value() + 5) / 10) * 100)}%</span>
      </Meter>
    ))
    const meter = view.getByRole('meter', { name: 'Temperature' })
    for (const [value, percentage, text] of [
      [0, 50, '50%'],
      [-2.25, 27.5, '28%'],
      [1.625, 66.25, '66%'],
      [5, 100, '100%'],
    ] as const) {
      setValue(value)
      flush()
      expect(view.getByRole('meter')).toBe(meter)
      expect(meter).toHaveAttribute('aria-valuenow', String(value))
      expect(meter).toHaveAttribute('aria-valuemin', '-5')
      expect(meter).toHaveAttribute('aria-valuemax', '5')
      expect(meter).toHaveAttribute('aria-valuetext', text)
      expect(meter).toHaveTextContent(text)
      expect(meter.style.getPropertyValue('--meter-percentage').trim()).not.toBe('')
      expect(Number(meter.style.getPropertyValue('--meter-percentage'))).toBeCloseTo(percentage, 10)
      expect(meter).toHaveAttribute('data-state', 'determinate')
      if (as === 'meter') expect((meter as HTMLMeterElement).value).toBe(value)
      else expect(meter).not.toHaveAttribute('value')
    }
  }
)

test.each(['meter', 'div'] as const)(
  '%s re-normalizes nonfinite values to a custom minimum and recovers',
  (as) => {
    const [value, setValue] = createSignal<number | undefined>(30)
    const format = vi.fn(({ value }: { value: number }) => `${value} GB`)
    const view = render(() => (
      <Meter as={as} min={20} max={40} value={value()} format={format} aria-label="Storage" />
    ))
    const meter = view.getByRole('meter')
    for (const invalid of [undefined, NaN, Infinity, -Infinity]) {
      setValue(invalid)
      flush()
      expect(meter).toHaveAttribute('aria-valuenow', '20')
      expect(meter).toHaveAttribute('aria-valuetext', '20 GB')
      expect(meter.style.getPropertyValue('--meter-percentage')).toBe('0')
      expect(format).toHaveBeenLastCalledWith({ value: 20, min: 20, max: 40, percentage: 0 })
      if (as === 'meter') expect((meter as HTMLMeterElement).value).toBe(20)
    }
    setValue(35)
    flush()
    expect(meter).toHaveAttribute('aria-valuenow', '35')
    expect(meter).toHaveAttribute('aria-valuetext', '35 GB')
    expect(meter.style.getPropertyValue('--meter-percentage')).toBe('75')
  }
)

test.each(['meter', 'div'] as const)(
  '%s responds to range-only updates and restores a valid range after invalid input',
  (as) => {
    const [range, setRange] = createSignal({ min: 0, max: 100 })
    const view = render(() => <Meter as={as} {...range()} value={25} aria-label="Capacity" />)
    const meter = view.getByRole('meter')
    for (const [range, min, max, now, percentage] of [
      [{ min: 20, max: 30 }, 20, 30, 25, 50],
      [{ min: 30, max: 40 }, 30, 40, 30, 0],
      [{ min: 20, max: 20 }, 0, 100, 25, 25],
      [{ min: -Number.MAX_VALUE, max: Number.MAX_VALUE }, 0, 100, 25, 25],
      [{ min: 0, max: 50 }, 0, 50, 25, 50],
    ] as const) {
      setRange(range)
      flush()
      expect(meter).toHaveAttribute('aria-valuemin', String(min))
      expect(meter).toHaveAttribute('aria-valuemax', String(max))
      expect(meter).toHaveAttribute('aria-valuenow', String(now))
      expect(meter).toHaveAttribute('aria-valuetext', `${percentage}%`)
      expect(meter.style.getPropertyValue('--meter-percentage')).toBe(String(percentage))
      if (as === 'meter') {
        expect((meter as HTMLMeterElement).min).toBe(min)
        expect((meter as HTMLMeterElement).max).toBe(max)
        expect((meter as HTMLMeterElement).value).toBe(now)
      }
    }
  }
)

test.each(['meter', 'div'] as const)(
  '%s preserves reactive author value-text overrides, including explicit undefined',
  (as) => {
    const [text, setText] = createSignal<string | undefined>('A quarter full')
    const [value, setValue] = createSignal(25)
    const view = render(() => (
      <Meter as={as} value={value()} aria-label="Tank" aria-valuetext={text()} />
    ))
    const meter = view.getByRole('meter')
    setValue(75)
    flush()
    expect(meter).toHaveAttribute('aria-valuenow', '75')
    expect(meter).toHaveAttribute('aria-valuetext', 'A quarter full')
    setText(undefined)
    flush()
    // spread documents that an explicitly authored undefined overrides the core value.
    expect(meter).not.toHaveAttribute('aria-valuetext')
    expect(meter).toHaveAttribute('aria-valuenow', '75')
    expect(meter.style.getPropertyValue('--meter-percentage')).toBe('75')
    setText('')
    flush()
    expect(meter).toHaveAttribute('aria-valuetext', '')
  }
)
