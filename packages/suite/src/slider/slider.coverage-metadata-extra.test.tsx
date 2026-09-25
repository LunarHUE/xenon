import { Slider } from '@xenon-ui/solid/slider'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import axe from 'axe-core'
import { createRoot, flush, For } from 'solid-js'
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
  await Promise.resolve()
  flush()
}

function sliderFixture(values: number[]) {
  return (
    <Slider aria-label="Budget" defaultValue={values}>
      <Slider.Label>Budget</Slider.Label>
      <Slider.Control>
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

test('slider.a11y.1 axe has no violations for both single-thumb and range sliders', async () => {
  const single = mount(() => sliderFixture([50]))
  const singleResults = await axe.run(single.container)
  expect(singleResults.violations).toEqual([])
  const range = mount(() => sliderFixture([20, 60]))
  const rangeResults = await axe.run(range.container)
  expect(rangeResults.violations).toEqual([])
})

test('slider.roles.5 vertical orientation markers match on root control value and thumb', () => {
  const view = mount(() => (
    <Slider aria-label="Vertical" orientation="vertical" defaultValue={[40]}>
      <Slider.Label>Vertical</Slider.Label>
      <Slider.Control data-testid="control">
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Value" />
      </Slider.Control>
      <Slider.ValueText data-testid="value" />
    </Slider>
  ))
  expect(view.container.firstElementChild).toHaveAttribute('data-orientation', 'vertical')
  expect(view.getByTestId('control')).toHaveAttribute('data-orientation', 'vertical')
  expect(view.getByTestId('value')).toHaveAttribute('data-orientation', 'vertical')
  expect(view.getByRole('slider', { name: 'Value' })).toHaveAttribute(
    'aria-orientation',
    'vertical'
  )
})

test.each<[string, () => JSX.Element]>([
  ['Control', () => <Slider.Control />],
  ['Track', () => <Slider.Track />],
  ['Range', () => <Slider.Range />],
  ['Thumb', () => <Slider.Thumb />],
  ['Label', () => <Slider.Label>Orphan</Slider.Label>],
  ['ValueText', () => <Slider.ValueText />],
])('slider.notes.5 orphan %s throws a named Slider context error', (_name, part) => {
  expect(() =>
    createRoot((dispose) => {
      try {
        return part()
      } finally {
        dispose()
      }
    })
  ).toThrow(/Slider/)
})

test('slider.state.12 exposes percentage position and localized formatted output', async () => {
  const view = mount(() => (
    <Slider
      aria-label="Price"
      min={0}
      max={100}
      defaultValue={[50]}
      format={(value) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
      }
    >
      <Slider.Control>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Price" />
      </Slider.Control>
      <Slider.ValueText />
    </Slider>
  ))
  await settle()
  const thumb = view.getByRole('slider', { name: 'Price' })
  expect(thumb).toHaveStyle('--slider-thumb-position: 50%')
  expect(view.getByRole('status')).toHaveTextContent('$50.00')
})
