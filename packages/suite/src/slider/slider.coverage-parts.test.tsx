import { render } from '@solidjs/web'
import { Slider } from '@xenon/solid/slider'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'

function mount() {
  const container = document.createElement('div')
  document.body.append(container)
  const [tick, setTick] = createSignal(0)
  const refs: Record<string, Element[]> = {
    root: [],
    control: [],
    track: [],
    range: [],
    thumb0: [],
    thumb1: [],
    label: [],
    valueText: [],
  }
  const ref = (name: keyof typeof refs) => (element: Element) => refs[name]!.push(element)
  const dispose = render(
    () => (
      <Slider
        aria-label="Budget"
        data-root="root"
        data-render={tick()}
        style={{ color: 'red' }}
        ref={ref('root')}
        defaultValue={[20, 60]}
      >
        <Slider.Label
          data-label="label"
          data-render={tick()}
          style={{ 'font-weight': 'bold' }}
          ref={ref('label')}
        >
          Budget
        </Slider.Label>
        <Slider.Control
          data-control="control"
          data-render={tick()}
          style={{ width: '300px' }}
          ref={ref('control')}
        >
          <Slider.Track
            data-track="track"
            data-render={tick()}
            style={{ background: 'gray' }}
            ref={ref('track')}
          />
          <Slider.Range
            data-range="range"
            data-render={tick()}
            style={{ background: 'blue' }}
            ref={ref('range')}
          />
          <Slider.Thumb
            index={0}
            aria-label="Minimum"
            data-thumb="thumb"
            data-render={tick()}
            style={{ margin: '2px' }}
            ref={ref('thumb0')}
          />
          <Slider.Thumb
            index={1}
            aria-label="Maximum"
            data-thumb="thumb-1"
            data-render={tick()}
            style={{ margin: '2px' }}
            ref={ref('thumb1')}
          />
        </Slider.Control>
        <Slider.ValueText
          data-value-text="value-text"
          data-render={tick()}
          style={{ display: 'block' }}
          ref={ref('valueText')}
        />
      </Slider>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, refs, setTick }
}

test('slider.notes.3 forwards part props, refs, merged styles, and stable identities', () => {
  const { container, refs, setTick } = mount()
  const root = container.firstElementChild as HTMLElement
  const control = container.querySelector('[data-control]') as HTMLElement
  const track = container.querySelector('[data-track]') as HTMLElement
  const range = container.querySelector('[data-range]') as HTMLElement
  const thumb = container.querySelector('[data-thumb="thumb"]') as HTMLInputElement
  const thumb1 = container.querySelector('[data-thumb="thumb-1"]') as HTMLInputElement
  const label = container.querySelector('[data-label]') as HTMLElement
  const valueText = container.querySelector('[data-value-text]') as HTMLOutputElement

  for (const [name, elements] of Object.entries(refs)) {
    expect(elements, `${name} ref`).toHaveLength(1)
  }
  expect(root).toHaveAttribute('data-root', 'root')
  expect(control).toHaveAttribute('data-control', 'control')
  expect(track).toHaveAttribute('data-track', 'track')
  expect(range).toHaveAttribute('data-range', 'range')
  expect(thumb).toHaveAttribute('data-thumb', 'thumb')
  expect(thumb1).toHaveAttribute('data-thumb', 'thumb-1')
  expect(label).toHaveAttribute('data-label', 'label')
  expect(valueText).toHaveAttribute('data-value-text', 'value-text')
  for (const element of [root, control, track, range, thumb, thumb1, label, valueText]) {
    expect(element).toHaveAttribute('data-render', '0')
  }

  expect(root).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  expect(control).toHaveStyle({ width: '300px', position: 'relative' })
  expect(control.style.touchAction).toBe('none')
  expect(track).toHaveStyle({ backgroundColor: 'rgb(128, 128, 128)' })
  expect(range).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' })
  expect(range.style.getPropertyValue('--slider-range-start')).toBe('20%')
  expect(range.style.getPropertyValue('--slider-range-end')).toBe('60%')
  expect(thumb).toHaveStyle({ margin: '2px' })
  expect(thumb.style.getPropertyValue('--slider-thumb-position')).toBe('20%')
  expect(label.style.fontWeight).toBe('bold')
  expect(valueText).toHaveStyle({ display: 'block' })

  const before = [root, control, track, range, thumb, thumb1, label, valueText]
  setTick(1)
  flush()
  const after = [
    container.firstElementChild,
    container.querySelector('[data-control]'),
    container.querySelector('[data-track]'),
    container.querySelector('[data-range]'),
    container.querySelector('[data-thumb="thumb"]'),
    container.querySelector('[data-thumb="thumb-1"]'),
    container.querySelector('[data-label]'),
    container.querySelector('[data-value-text]'),
  ]
  expect(after).toEqual(before)
  for (const [name, elements] of Object.entries(refs)) {
    expect(elements.length, `${name} ref called`).toBeGreaterThanOrEqual(1)
    expect(
      elements.every((element) => element === elements[0]),
      `${name} ref identity`
    ).toBe(true)
    expect(elements[0]).toBe(after[Object.keys(refs).indexOf(name)])
  }
  expect(root).toHaveAttribute('data-render', '1')
  for (const element of after) expect(element).toHaveAttribute('data-render', '1')

  expect(container.querySelectorAll('input[type="hidden"]')).toHaveLength(0)
  expect('HiddenInput' in Slider).toBe(false)
})
