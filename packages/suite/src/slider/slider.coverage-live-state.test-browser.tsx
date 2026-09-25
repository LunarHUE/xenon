import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, For, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

import { Slider } from '@xenon-ui/solid/slider'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
  flush()
})

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function hex(value: number) {
  return value.toString(16).padStart(2, '0').toUpperCase()
}

test('slider.state.1 updates aria-valuenow, RGB, hex, and swatch synchronously for every key press', async () => {
  const [red, setRed] = createSignal(128)
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(() => {
    const rgb = () => `rgb(${red()}, 64, 32)`
    const valueHex = () => `#${hex(red())}4020`
    return (
      <div>
        <Slider
          aria-label="Red"
          min={0}
          max={255}
          value={[red()]}
          onValueChange={(next) => setRed(next[0]!)}
        >
          <Slider.Control>
            <Slider.Track />
            <Slider.Range />
            <Slider.Thumb aria-label="Red" />
          </Slider.Control>
        </Slider>
        <label>
          RGB <input data-testid="rgb" value={rgb()} readonly />
        </label>
        <label>
          Hex <input data-testid="hex" value={valueHex()} readonly />
        </label>
        <div data-testid="swatch" style={{ 'background-color': rgb() }} />
      </div>
    )
  }, host)
  await settle()

  const view = within(host)
  const thumb = view.getByRole('slider', { name: 'Red' })
  const assertColor = (value: number) => {
    expect(thumb).toHaveAttribute('aria-valuenow', String(value))
    expect(view.getByTestId('rgb')).toHaveValue(`rgb(${value}, 64, 32)`)
    expect(view.getByTestId('hex')).toHaveValue(`#${hex(value)}4020`)
    expect(view.getByTestId('swatch')).toHaveStyle(`background-color: rgb(${value}, 64, 32)`)
  }

  assertColor(128)
  thumb.focus()
  thumb.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
  )
  flush()
  assertColor(129)
  thumb.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })
  )
  flush()
  assertColor(130)
  thumb.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
  )
  flush()
  assertColor(129)
})

function pointer(target: EventTarget, type: string, pointerId: number, clientX: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
      pointerId,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX,
      clientY: 20,
    })
  )
}

function controlledRange(initial: number[]) {
  const [values, setValues] = createSignal(initial)
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <Slider aria-label="Budget" value={values()} onValueChange={setValues}>
        <Slider.Control data-testid="control" style={{ width: '300px', height: '40px' }}>
          <Slider.Track />
          <Slider.Range />
          <For each={values()}>
            {(_, index) => <Slider.Thumb index={index()} aria-label={`Thumb ${index() + 1}`} />}
          </For>
        </Slider.Control>
      </Slider>
    ),
    host
  )
  return { view: within(host), setValues }
}

test('slider.state.11 shrinking a controlled range mid-drag drops the stale thumb safely', async () => {
  const { view, setValues } = controlledRange([20, 60])
  await settle()
  const lower = view.getByRole('slider', { name: 'Thumb 1' })
  const control = view.getByTestId('control')
  const rect = control.getBoundingClientRect()
  pointer(lower, 'pointerdown', 1, rect.left + rect.width * 0.2)
  setValues([20])
  await settle()
  expect(view.getAllByRole('slider')).toHaveLength(1)
  pointer(document, 'pointermove', 1, rect.left + rect.width * 0.8)
  pointer(document, 'pointerup', 1, rect.left + rect.width * 0.8)
  await settle()
  expect(view.getByRole('slider', { name: 'Thumb 1' })).toHaveValue('80')
})

test('slider.state.11 growing a controlled slider mid-drag uses the live thumb set', async () => {
  const { view, setValues } = controlledRange([20])
  await settle()
  const first = view.getByRole('slider', { name: 'Thumb 1' })
  const control = view.getByTestId('control')
  const rect = control.getBoundingClientRect()
  pointer(first, 'pointerdown', 2, rect.left + rect.width * 0.2)
  setValues([20, 60])
  await settle()
  expect(view.getAllByRole('slider')).toHaveLength(2)
  pointer(document, 'pointermove', 2, rect.left + rect.width * 0.8)
  pointer(document, 'pointerup', 2, rect.left + rect.width * 0.8)
  await settle()
  expect(view.getByRole('slider', { name: 'Thumb 1' })).toHaveValue('60')
  expect(view.getByRole('slider', { name: 'Thumb 2' })).toHaveValue('60')
})
