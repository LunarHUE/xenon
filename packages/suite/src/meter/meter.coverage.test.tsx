import { render } from '@solidjs/web'
import { Meter } from '@xenon-ui/solid/meter'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { expectNoViolations } from '../a11y'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
})

function renderMeter(props: Record<string, unknown> = {}) {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(() => <Meter aria-label="Storage" {...props} />, host)
  flush()
  return host.querySelector('[role="meter"], meter') as HTMLElement
}

function resetMeter() {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
}

test('meter.a11y.2 applies the shared ARIA and target-size axe rules', async () => {
  renderMeter({ as: 'div', value: 30 })
  await expectNoViolations(host!, [
    'aria-roles',
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'aria-prohibited-attr',
    'aria-deprecated-role',
    'tabindex',
    'duplicate-id-aria',
    'presentation-role-conflict',
    'aria-hidden-focus',
    'aria-braille-equivalent',
    'target-size',
  ])
})

test('meter.notes.3 has no indeterminate mode for absent, null, or nonfinite values', () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity]) {
    const meter = renderMeter({ value })
    expect(meter).toHaveAttribute('aria-valuenow', '0')
    expect(meter).not.toHaveAttribute('data-indeterminate')
    resetMeter()
  }
})

test('meter.notes.7 forwards arbitrary props, refs, events and children through a custom host', () => {
  const ref = vi.fn()
  const click = vi.fn()
  const CustomHost = (props: import('@solidjs/web').JSX.HTMLAttributes<HTMLElement>) => (
    <article {...props} />
  )
  const meter = renderMeter({
    as: CustomHost,
    ref,
    onClick: click,
    'data-author': 'yes',
    children: '30 percent',
  })
  expect(meter).toHaveAttribute('data-author', 'yes')
  expect(meter).toHaveTextContent('30 percent')
  expect(meter).toHaveAttribute('role', 'meter')
  expect(ref).toHaveBeenCalledWith(meter)
  meter.click()
  expect(click).toHaveBeenCalledOnce()
})

test('meter.roles.2 and meter.state.1 clamp now within finite normalized bounds', () => {
  const meter = renderMeter({ min: 20, max: 40, value: -10 })
  expect(meter).toHaveAttribute('aria-valuemin', '20')
  expect(meter).toHaveAttribute('aria-valuemax', '40')
  expect(meter).toHaveAttribute('aria-valuenow', '20')
  expect(Number(meter.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(
    Number(meter.getAttribute('aria-valuemin'))
  )
  expect(Number(meter.getAttribute('aria-valuenow'))).toBeLessThanOrEqual(
    Number(meter.getAttribute('aria-valuemax'))
  )
})

test('meter.roles.3, meter.roles.4 and meter.state.6 emit normalized explicit bounds', () => {
  const meter = renderMeter({ min: 14, max: 7, value: 10 })
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '100')
  expect(meter).toHaveAttribute('aria-valuenow', '10')
  resetMeter()
  const custom = renderMeter({ min: 7, max: 14, value: 10 })
  expect(custom).toHaveAttribute('aria-valuemin', '7')
  expect(custom).toHaveAttribute('aria-valuemax', '14')
  expect(custom).toHaveAttribute('aria-valuenow', '10')
})

test('meter.roles.6 and meter.roles.12 preserve visible naming and author ARIA values', () => {
  host = document.createElement('div')
  document.body.append(host)
  const label = document.createElement('span')
  label.id = 'storage-label'
  label.textContent = 'Storage'
  host.append(label)
  dispose = render(
    () => <Meter as="div" value={30} aria-labelledby="storage-label" aria-valuetext="30 GB used" />,
    host
  )
  flush()
  const meter = host.querySelector('[role="meter"]')!
  expect(meter).toHaveAccessibleName('Storage')
  expect(meter).toHaveAttribute('aria-labelledby', 'storage-label')
  expect(meter).toHaveAttribute('aria-valuetext', '30 GB used')
})

test('meter.roles.9 and meter.roles.10 update now and formatted percentage reactively', () => {
  host = document.createElement('div')
  document.body.append(host)
  const [value, setValue] = createSignal(30)
  dispose = render(
    () => (
      <Meter value={value()} aria-label="Storage">
        {value()}%
      </Meter>
    ),
    host
  )
  flush()
  const meter = host.querySelector('meter')!
  expect(meter).toHaveAttribute('aria-valuenow', '30')
  expect(meter).toHaveAttribute('aria-valuetext', '30%')
  expect(meter).toHaveTextContent('30%')
  expect(meter.style.getPropertyValue('--meter-percentage')).toBe('30')
  setValue(77)
  flush()
  expect(meter).toHaveAttribute('aria-valuenow', '77')
  expect(meter).toHaveAttribute('aria-valuetext', '77%')
  expect(meter).toHaveTextContent('77%')
  expect(meter.style.getPropertyValue('--meter-percentage')).toBe('77')
})

test('meter.roles.11 and meter.state.8 keep custom range formatting consistent on rerender', () => {
  host = document.createElement('div')
  document.body.append(host)
  const [range, setRange] = createSignal({ min: 20, max: 40, value: 30 })
  dispose = render(
    () => (
      <Meter {...range()} aria-label="Temperature">
        {Math.round(((range().value - range().min) / (range().max - range().min)) * 100)}%
      </Meter>
    ),
    host
  )
  flush()
  const meter = host.querySelector('meter')!
  expect(meter).toHaveAttribute('aria-valuemin', '20')
  expect(meter).toHaveAttribute('aria-valuemax', '40')
  expect(meter).toHaveAttribute('aria-valuenow', '30')
  expect(meter).toHaveAttribute('aria-valuetext', '50%')
  expect(meter).toHaveTextContent('50%')
  setRange({ min: 0, max: 10, value: 2 })
  flush()
  expect(meter).toHaveAttribute('aria-valuemin', '0')
  expect(meter).toHaveAttribute('aria-valuemax', '10')
  expect(meter).toHaveAttribute('aria-valuenow', '2')
  expect(meter).toHaveAttribute('aria-valuetext', '20%')
  expect(meter).toHaveTextContent('20%')
})

test('meter.state.12 rounds aria-valuetext and bound display text identically', () => {
  const meter = renderMeter({ value: 33.333, children: '33%' })
  expect(meter).toHaveAttribute('aria-valuetext', '33%')
  expect(meter).toHaveTextContent('33%')
})

test('meter.state.17 updates bound display text with a parent value', () => {
  host = document.createElement('div')
  document.body.append(host)
  const [value, setValue] = createSignal(20)
  dispose = render(
    () => (
      <Meter value={value()} aria-label="Storage">
        {value()}%
      </Meter>
    ),
    host
  )
  flush()
  const meter = host.querySelector('meter')!
  expect(meter).toHaveTextContent('20%')
  setValue(80)
  flush()
  expect(meter).toHaveAttribute('aria-valuenow', '80')
  expect(meter).toHaveTextContent('80%')
})

test('meter.state.10 formats NaN as zero percent without indeterminate state', () => {
  const meter = renderMeter({ value: Number.NaN })
  expect(meter).toHaveAttribute('aria-valuenow', '0')
  expect(meter).toHaveAttribute('aria-valuetext', '0%')
  expect(meter).not.toHaveAttribute('data-indeterminate')
})

test('meter.state.7 clamps below and above range to endpoint percentages', () => {
  const low = renderMeter({ value: -1 })
  expect(low).toHaveAttribute('aria-valuenow', '0')
  expect(low).toHaveAttribute('aria-valuetext', '0%')
  resetMeter()
  const high = renderMeter({ value: 101 })
  expect(high).toHaveAttribute('aria-valuenow', '100')
  expect(high).toHaveAttribute('aria-valuetext', '100%')
})
