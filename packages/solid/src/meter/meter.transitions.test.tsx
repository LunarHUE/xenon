import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'

import type { MeterFormatDetails } from '@xenon/core/meter'
import { Meter } from './meter'
import type { MeterProps } from './meter'

test('meter normalizes a changing range and value together', () => {
  const [min, setMin] = createSignal(10)
  const [max, setMax] = createSignal(20)
  const [value, setValue] = createSignal(15)
  const view = render(() => (
    <Meter as="div" min={min()} max={max()} value={value()} aria-label="Storage" />
  ))
  const meter = view.getByRole('meter')

  expect(meter).toHaveAttribute('aria-valuenow', '15')
  expect(meter).toHaveAttribute('aria-valuetext', '50%')
  setMin(20)
  setMax(10)
  setValue(100)
  flush()
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '100')
  expect(meter).toHaveAttribute('aria-valuenow', '100')
  expect(meter.style.getPropertyValue('--meter-percentage')).toBe('100')
})

test('meter formatter replacement and value updates affect only their own instance', () => {
  const firstFormat = ({ percentage }: MeterFormatDetails) => `${percentage} percent`
  const [format, setFormat] = createSignal<MeterProps['format']>(() => firstFormat)
  const [first, setFirst] = createSignal(25)
  const [second, setSecond] = createSignal(75)
  const view = render(() => (
    <>
      <Meter as="div" value={first()} format={format()} aria-label="First" />
      <Meter as="div" value={second()} aria-label="Second" />
    </>
  ))
  const firstMeter = view.getByRole('meter', { name: 'First' })
  const secondMeter = view.getByRole('meter', { name: 'Second' })

  expect(firstMeter).toHaveAttribute('aria-valuetext', '25 percent')
  expect(secondMeter).toHaveAttribute('aria-valuetext', '75%')
  setFirst(50)
  flush()
  expect(firstMeter).toHaveAttribute('aria-valuetext', '50 percent')
  expect(secondMeter).toHaveAttribute('aria-valuetext', '75%')
  setFormat(
    () =>
      ({ value }) =>
        `${value} units`
  )
  flush()
  expect(firstMeter).toHaveAttribute('aria-valuetext', '50 units')
  expect(secondMeter).toHaveAttribute('aria-valuetext', '75%')
  setSecond(10)
  flush()
  expect(firstMeter).toHaveAttribute('aria-valuenow', '50')
  expect(secondMeter).toHaveAttribute('aria-valuenow', '10')
})
