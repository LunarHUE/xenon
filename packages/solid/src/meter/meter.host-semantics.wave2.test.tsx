import { render } from '@solidjs/testing-library'
import type { ComponentProps } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Meter } from './meter'

const ForwardedMeter = (props: ComponentProps<'meter'>) => <meter {...props} />

test('a forwarding meter host receives explicit semantics, ref and percentage effects', () => {
  const [value, setValue] = createSignal(25)
  let ref: HTMLMeterElement | undefined
  const view = render(() => (
    <Meter
      as={ForwardedMeter}
      value={value()}
      aria-label="Capacity"
      ref={(node) => {
        ref = node
      }}
    />
  ))
  const meter = view.getByRole('meter')
  expect(meter).toBe(ref)
  expect(meter).toHaveAttribute('role', 'meter')
  expect(meter).toHaveAttribute('aria-valuenow', '25')
  expect(meter.style.getPropertyValue('--meter-percentage')).toBe('25')
  setValue(75)
  flush()
  expect(view.getByRole('meter')).toBe(meter)
  expect(meter).toHaveAttribute('aria-valuenow', '75')
  expect(meter.style.getPropertyValue('--meter-percentage')).toBe('75')
})

test('native meter gets its accessible name from a native label while values update', () => {
  const [name, setName] = createSignal('Fuel remaining')
  const [value, setValue] = createSignal(30)
  const view = render(() => (
    <>
      <label for="fuel-meter">{name()}</label>
      <Meter id="fuel-meter" value={value()} />
    </>
  ))
  const meter = view.getByRole('meter', { name: 'Fuel remaining' })
  expect(meter).not.toHaveAttribute('aria-label')
  setName('Battery remaining')
  setValue(60)
  flush()
  expect(view.getByRole('meter', { name: 'Battery remaining' })).toBe(meter)
  expect(meter).toHaveAttribute('aria-valuenow', '60')
})

test.each(['meter', 'section'] as const)(
  '%s reacts to formatter dependencies without changing its name or host',
  (as) => {
    const [units, setUnits] = createSignal('GB')
    const view = render(() => (
      <Meter
        as={as}
        value={32}
        aria-label="Storage"
        format={({ value }) => `${value} ${units()}`}
      />
    ))
    const meter = view.getByRole('meter', { name: 'Storage' })
    expect(meter).toHaveAttribute('aria-valuetext', '32 GB')
    setUnits('gigabytes')
    flush()
    expect(view.getByRole('meter', { name: 'Storage' })).toBe(meter)
    expect(meter).toHaveAttribute('aria-valuetext', '32 gigabytes')
    expect(meter).not.toHaveAttribute('aria-live')
    expect(meter).not.toHaveAttribute('tabindex')
  }
)
