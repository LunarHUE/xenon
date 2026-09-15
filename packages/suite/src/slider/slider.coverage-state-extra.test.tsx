import { Slider } from '@xenon/solid/slider'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush, For } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return { container, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

function rangeParts(values: number[], props: Record<string, unknown> = {}) {
  return (
    <Slider aria-label="Budget" defaultValue={values} {...props}>
      <Slider.Control data-testid="control">
        <Slider.Track />
        <Slider.Range />
        <For each={values}>
          {(_, index) => <Slider.Thumb index={index()} aria-label={`Thumb ${index() + 1}`} />}
        </For>
      </Slider.Control>
      <Slider.ValueText />
    </Slider>
  )
}

test('slider.forms.4 submits a clamped value rather than an out-of-range raw value', () => {
  const view = mount(() => (
    <form>
      <Slider name="amount" min={0} max={100} value={[150]}>
        <Slider.Control>
          <Slider.Track />
          <Slider.Range />
          <Slider.Thumb aria-label="Amount" />
        </Slider.Control>
      </Slider>
      <Slider name="low" min={0} max={100} value={[-20]}>
        <Slider.Control>
          <Slider.Track />
          <Slider.Range />
          <Slider.Thumb aria-label="Low" />
        </Slider.Control>
      </Slider>
    </form>
  ))
  const form = view.container.querySelector('form')!
  const thumb = view.getByRole('slider', { name: 'Amount' })
  expect(thumb).toHaveValue('100')
  expect(new FormData(form).get('amount')).toBe('100')
  expect(view.getByRole('slider', { name: 'Low' })).toHaveValue('0')
  expect(new FormData(form).get('low')).toBe('0')
})

test('slider.state.3 external controlled writes reposition and clamp the thumb', async () => {
  const [value, setValue] = createSignal([20])
  const view = mount(() => (
    <form>
      <Slider aria-label="Budget" value={value()}>
        <Slider.Control>
          <Slider.Track />
          <Slider.Range data-testid="selected-range" />
          <Slider.Thumb aria-label="Thumb 1" />
        </Slider.Control>
      </Slider>
      <button type="reset">Reset</button>
    </form>
  ))
  const thumb = view.getByRole('slider', { name: 'Thumb 1' })
  const selectedRange = view.getByTestId('selected-range')
  expect(thumb).toHaveStyle({ '--slider-thumb-position': '20%' })
  expect(selectedRange).toHaveStyle({ '--slider-range-start': '0%', '--slider-range-end': '20%' })
  setValue([70])
  await settle()
  expect(thumb).toHaveValue('70')
  expect(thumb).toHaveStyle({ '--slider-thumb-position': '70%' })
  expect(selectedRange).toHaveStyle({ '--slider-range-start': '0%', '--slider-range-end': '70%' })
  view.getByRole('button', { name: 'Reset' }).click()
  await settle()
  expect(thumb).toHaveValue('70')
  expect(thumb).toHaveStyle({ '--slider-thumb-position': '70%' })
  expect(selectedRange).toHaveStyle({ '--slider-range-start': '0%', '--slider-range-end': '70%' })
  setValue([150])
  await settle()
  expect(thumb).toHaveValue('100')
  expect(thumb).toHaveStyle({ '--slider-thumb-position': '100%' })
  expect(selectedRange).toHaveStyle({ '--slider-range-start': '0%', '--slider-range-end': '100%' })
})

test('slider.state.8 reactive neighboring thumbs update each other bounds, including zero', async () => {
  const [value, setValue] = createSignal([0, 50])
  const view = mount(() => (
    <Slider aria-label="Budget" min={-100} value={value()}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Thumb 1" />
        <Slider.Thumb index={1} aria-label="Thumb 2" />
      </Slider.Control>
    </Slider>
  ))
  const lower = view.getByRole('slider', { name: 'Thumb 1' })
  const upper = view.getByRole('slider', { name: 'Thumb 2' })
  expect(lower).toHaveAttribute('aria-valuemax', '50')
  expect(upper).toHaveAttribute('aria-valuemin', '0')
  setValue([20, 70])
  await settle()
  expect(lower).toHaveAttribute('aria-valuemax', '70')
  expect(upper).toHaveAttribute('aria-valuemin', '20')

  const zeroNeighbor = mount(() => rangeParts([-50, 0, 50], { min: -100 }))
  const first = zeroNeighbor.getByRole('slider', { name: 'Thumb 1' })
  const middle = zeroNeighbor.getByRole('slider', { name: 'Thumb 2' })
  const last = zeroNeighbor.getByRole('slider', { name: 'Thumb 3' })
  expect(middle).toHaveAttribute('aria-valuemin', '-50')
  expect(middle).toHaveAttribute('aria-valuemax', '50')
  expect(last).toHaveAttribute('aria-valuemin', '0')
  expect(first).toHaveAttribute('aria-valuemax', '0')
})

test('slider.roles.12 joins four values in the output and references every thumb', () => {
  const view = mount(() => rangeParts([40, 60, 80, 95]))
  const output = view.getByRole('status')
  const thumbs = view.getAllByRole('slider')
  expect(output.tagName).toBe('OUTPUT')
  expect(output).toHaveTextContent('40 – 60 – 80 – 95')
  expect(output).toHaveAttribute('aria-live', 'off')
  expect(new Set(thumbs.map((thumb) => thumb.id)).size).toBe(4)
  expect(thumbs.every((thumb) => thumb.id.length > 0)).toBe(true)
  expect(output.getAttribute('for')?.split(' ')).toEqual(thumbs.map((thumb) => thumb.id))

  const pair = mount(() => rangeParts([40, 65]))
  expect(pair.getByRole('status')).toHaveTextContent('40 – 65')
})

test('slider.focus.9 exposes the inner slider input through the thumb ref', () => {
  let exposed: HTMLInputElement | undefined
  const view = mount(() => (
    <Slider defaultValue={[25]}>
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb ref={(input) => (exposed = input)} aria-label="Amount" />
      </Slider.Control>
    </Slider>
  ))
  const thumb = view.getByRole('slider', { name: 'Amount' })
  expect(exposed).toBe(thumb)
  expect(exposed).not.toBeUndefined()
  exposed!.focus()
  expect(document.activeElement).toBe(thumb)
})
