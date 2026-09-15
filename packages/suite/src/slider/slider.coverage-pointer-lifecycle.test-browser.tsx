import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { Slider } from '@xenon/solid/slider'

const rail: JSX.CSSProperties = { width: '300px', height: '60px' }
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

function mount(children: () => JSX.Element) {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(children, host)
  flush()
  return within(host)
}

function pointer(
  target: EventTarget,
  type: string,
  pointerId: number,
  fraction: number,
  rect: DOMRect,
  pointerType = 'mouse',
  isPrimary = true
) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType,
      isPrimary,
      pointerId,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: rect.left + rect.width * fraction,
      clientY: rect.top + rect.height / 2,
    })
  )
}

test('slider.pointer.7 disabled presses, drags, and releases are inert and blur a focused thumb', async () => {
  const [disabled, setDisabled] = createSignal(false)
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => (
    <Slider
      aria-label="Budget"
      defaultValue={[20]}
      disabled={disabled()}
      onValueChange={change}
      onValueCommit={commit}
    >
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
      <div
        data-testid="outside"
        style={{ position: 'absolute', left: '400px', top: '100px', width: '40px', height: '40px' }}
      />
    </Slider>
  ))
  await settle()
  const control = view.getByTestId('control')
  const thumb = view.getByRole('slider', { name: 'Amount' }) as HTMLInputElement
  const rect = control.getBoundingClientRect()
  thumb.focus()
  expect(thumb).toHaveFocus()
  setDisabled(true)
  await settle()
  expect(thumb).toBeDisabled()
  expect(thumb).not.toHaveFocus()

  pointer(thumb, 'pointerdown', 1, 0.2, rect)
  pointer(document, 'pointermove', 1, 0.8, rect)
  pointer(document, 'pointerup', 1, 0.8, rect)
  pointer(control, 'pointerdown', 2, 0.8, rect)
  pointer(document, 'pointermove', 2, 0.2, rect)
  pointer(document, 'pointerup', 2, 0.2, rect)
  await settle()
  expect(thumb).toHaveValue('20')
  expect(thumb).not.toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()

  await userEvent.click(control, { position: { x: 240, y: 30 } })
  await settle()
  expect(thumb).toHaveValue('20')
  expect(thumb).not.toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  await userEvent.dragAndDrop(control, view.getByTestId('outside'))
  await settle()
  expect(thumb).toHaveValue('20')
  expect(thumb).not.toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})

test('slider.pointer.20 clamps collision without swapping identity and preserves tab order', async () => {
  const view = mount(() => (
    <>
      <button type="button">Before</button>
      <Slider aria-label="Budget" defaultValue={[40, 70]}>
        <Slider.Control data-testid="control" style={rail}>
          <Slider.Track />
          <Slider.Range />
          <Slider.Thumb index={0} aria-label="Lower" />
          <Slider.Thumb index={1} aria-label="Upper" />
        </Slider.Control>
      </Slider>
      <button type="button">After</button>
    </>
  ))
  await settle()
  const control = view.getByTestId('control')
  const rect = control.getBoundingClientRect()
  const lower = view.getByRole('slider', { name: 'Lower' })
  const upper = view.getByRole('slider', { name: 'Upper' })
  pointer(upper, 'pointerdown', 1, 0.7, rect)
  pointer(document, 'pointermove', 1, 0.1, rect)
  pointer(document, 'pointerup', 1, 0.1, rect)
  await settle()
  expect(lower).toHaveValue('40')
  expect(upper).toHaveValue('40')
  expect(view.getAllByRole('slider')).toEqual([lower, upper])
  const before = view.getByRole('button', { name: 'Before' })
  const after = view.getByRole('button', { name: 'After' })
  before.focus()
  await userEvent.tab()
  expect(lower).toHaveFocus()
  await userEvent.tab()
  expect(upper).toHaveFocus()
  await userEvent.tab()
  expect(after).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(upper).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(lower).toHaveFocus()
})

test('slider.pointer.10 ignores a second touch while the owning touch continues', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => (
    <Slider aria-label="Budget" defaultValue={[20]} onValueChange={change} onValueCommit={commit}>
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
    </Slider>
  ))
  await settle()
  const control = view.getByTestId('control')
  const thumb = view.getByRole('slider', { name: 'Amount' })
  const rect = control.getBoundingClientRect()
  pointer(thumb, 'pointerdown', 1, 0.2, rect, 'touch', true)
  pointer(control, 'pointerdown', 2, 0.8, rect, 'touch', false)
  await settle()
  expect(thumb).toHaveValue('20')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointermove', 2, 0.9, rect, 'touch', false)
  await settle()
  expect(thumb).toHaveValue('20')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointerup', 2, 0.9, rect, 'touch', false)
  await settle()
  expect(thumb).toHaveValue('20')
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointermove', 1, 0.4, rect, 'touch', true)
  await settle()
  expect(thumb).toHaveValue('40')
  expect(change).toHaveBeenCalledExactlyOnceWith([40])
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointermove', 2, 0.1, rect, 'touch', false)
  await settle()
  expect(thumb).toHaveValue('40')
  expect(change).toHaveBeenCalledExactlyOnceWith([40])
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointermove', 1, 0.6, rect, 'touch', true)
  await settle()
  expect(thumb).toHaveValue('60')
  expect(change.mock.calls.map(([value]) => value)).toEqual([[40], [60]])
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointerup', 2, 0.1, rect, 'touch', false)
  await settle()
  expect(thumb).toHaveValue('60')
  expect(commit).not.toHaveBeenCalled()
  pointer(document, 'pointerup', 1, 0.6, rect, 'touch', true)
  await settle()
  expect(thumb).toHaveValue('60')
  expect(change.mock.calls.map(([value]) => value)).toEqual([[40], [60]])
  expect(commit).toHaveBeenCalledExactlyOnceWith([60])
})
