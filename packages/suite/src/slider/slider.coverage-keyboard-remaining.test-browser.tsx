import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Slider } from '@xenon-ui/solid/slider'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { flush } from 'solid-js'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
  flush()
})

function mount(children: () => JSX.Element) {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(children, host)
  flush()
  return host
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('slider.keyboard.4 PageUp and PageDown use the large step and clamp at bounds', async () => {
  const change = vi.fn()
  const root = mount(() => (
    <Slider defaultValue={[20]} step={2} largeStep={5} max={28} onValueChange={change}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
    </Slider>
  ))
  const input = within(root).getByRole('slider', { name: 'Amount' })
  input.focus()
  await userEvent.keyboard('{PageUp}')
  await settle()
  expect(input).toHaveValue('25')
  await userEvent.keyboard('{PageUp}')
  await settle()
  expect(input).toHaveValue('28')
  for (const expected of [23, 18, 13, 8, 3, 0]) {
    await userEvent.keyboard('{PageDown}')
    await settle()
    expect(input).toHaveValue(String(expected))
  }
  expect(change.mock.calls.map(([value]) => value)).toEqual([
    [25],
    [28],
    [23],
    [18],
    [13],
    [8],
    [3],
    [0],
  ])
})

test('slider.keyboard.7 Meta Control and Alt arrows each retain one ordinary step', async () => {
  const change = vi.fn()
  const root = mount(() => (
    <Slider defaultValue={[20]} step={2} largeStep={10} onValueChange={change}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
    </Slider>
  ))
  const input = within(root).getByRole('slider', { name: 'Amount' })
  input.focus()
  for (const [modifier, expected] of [
    ['Meta', '22'],
    ['Control', '24'],
    ['Alt', '26'],
  ] as const) {
    await userEvent.keyboard(`{${modifier}>}{ArrowRight}{/${modifier}}`)
    await settle()
    expect(input).toHaveValue(expected)
  }
  expect(change.mock.calls.map(([value]) => value)).toEqual([[22], [24], [26]])
})

test('slider.keyboard.15 Home and End on range thumbs stop at neighboring values', async () => {
  const root = mount(() => (
    <Slider defaultValue={[40, 70]}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Lower" />
        <Slider.Thumb index={1} aria-label="Upper" />
      </Slider.Control>
    </Slider>
  ))
  const lower = within(root).getByRole('slider', { name: 'Lower' })
  const upper = within(root).getByRole('slider', { name: 'Upper' })
  lower.focus()
  await userEvent.keyboard('{End}')
  await settle()
  expect(lower).toHaveValue('70')
  expect(upper).toHaveValue('70')
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(lower).toHaveValue('69')
  expect(upper).toHaveValue('70')
  upper.focus()
  await userEvent.keyboard('{Home}')
  await settle()
  expect(upper).toHaveValue('69')
  expect(lower).toHaveValue('69')
})

test('slider.keyboard.16 repeated gap-closing keypress is a no-op without a second callback', async () => {
  const change = vi.fn()
  const root = mount(() => (
    <Slider defaultValue={[20, 26]} step={2} minStepsBetweenThumbs={2} onValueChange={change}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Lower" />
        <Slider.Thumb index={1} aria-label="Upper" />
      </Slider.Control>
    </Slider>
  ))
  const lower = within(root).getByRole('slider', { name: 'Lower' })
  lower.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(lower).toHaveValue('22')
  expect(change).toHaveBeenCalledExactlyOnceWith([22, 26])
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(lower).toHaveValue('22')
  expect(change).toHaveBeenCalledTimes(1)
})

test('slider.keyboard.18 an extra thumb emits no change or commit and never commits NaN', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const root = mount(() => (
    <Slider defaultValue={[20]} onValueChange={change} onValueCommit={commit}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Real" />
        <Slider.Thumb index={1} aria-label="Extra" />
      </Slider.Control>
    </Slider>
  ))
  const extra = within(root).getByRole('slider', { name: 'Extra' })
  extra.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(extra).toHaveValue('0')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})
