import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Slider } from '@xenon/solid/slider'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { flush } from 'solid-js'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function mount(children: () => JSX.Element, target?: HTMLElement | ShadowRoot) {
  const host = target ?? document.createElement('div')
  if (!target) document.body.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    if (!target && host instanceof HTMLElement) host.remove()
  })
  flush()
  return { host, ...within(host as HTMLElement) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

function single(props: Record<string, unknown> = {}) {
  return (
    <Slider aria-label="Amount" defaultValue={[0]} {...props}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
    </Slider>
  )
}

test('slider.keyboard.10 ordinary fractional steps remain exact', async () => {
  const first = mount(() => single({ step: 0.1 }))
  const input = first.getByRole('slider', { name: 'Amount' })
  input.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(input).toHaveValue('0.1')
  expect(input).toHaveAttribute('aria-valuenow', '0.1')

  const fromTwoTenths = mount(() => single({ defaultValue: [0.2], step: 0.1 }))
  const second = fromTwoTenths.getByRole('slider', { name: 'Amount' })
  second.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(second).toHaveValue('0.3')
  expect(second).toHaveAttribute('aria-valuenow', '0.3')

  const temperature = mount(() => single({ defaultValue: [25], step: 0.1 }))
  const degrees = temperature.getByRole('slider')
  degrees.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(degrees).toHaveValue('25.1')
  expect(degrees).toHaveAttribute('aria-valuenow', '25.1')
})

test('slider.keyboard.10 repeated 1e-7 steps keep twelve-place precision', async () => {
  const changed = vi.fn()
  const tiny = mount(() => single({ step: 1e-7, onValueChange: changed }))
  const tinyInput = tiny.getByRole('slider', { name: 'Amount' })
  tinyInput.focus()
  for (const expected of [1e-7, 2e-7]) {
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect((tinyInput as HTMLInputElement).valueAsNumber).toBe(expected)
    expect(Number(tinyInput.getAttribute('aria-valuenow'))).toBe(expected)
  }
  expect(changed.mock.calls.map(([value]) => value)).toEqual([[1e-7], [2e-7]])
})

test('slider.keyboard.10 a 1.5e-7 step reports its exact increment', async () => {
  const changed = vi.fn()
  const fractionalTiny = mount(() => single({ step: 1.5e-7, onValueChange: changed }))
  const fractionalInput = fractionalTiny.getByRole('slider', { name: 'Amount' })
  fractionalInput.focus()
  for (const expected of [1.5e-7, 3e-7, 4.5e-7]) {
    await userEvent.keyboard('{ArrowRight}')
    await settle()
    expect((fractionalInput as HTMLInputElement).valueAsNumber).toBe(expected)
    expect(Number(fractionalInput.getAttribute('aria-valuenow'))).toBe(expected)
  }
  expect(changed.mock.calls.map(([value]) => value)).toEqual([[1.5e-7], [3e-7], [4.5e-7]])
})

test('slider.keyboard.19 a bubbling keydown inside an open shadow root steps the thumb', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  cleanups.push(() => host.remove())
  const shadow = host.attachShadow({ mode: 'open' })
  const view = mount(() => single({ defaultValue: [20] }), shadow)
  const input = view.getByRole('slider', { name: 'Amount' })
  input.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(input).toHaveValue('21')
  expect(input).toHaveAttribute('aria-valuenow', '21')
})
