import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { Slider } from '@xenon-ui/solid/slider'

const rail: JSX.CSSProperties = { width: '300px', height: '100px', background: '#eee' }

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

function pointerAt(
  target: EventTarget,
  type: string,
  pointerId: number,
  rect: DOMRect,
  fraction: number
) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
      isPrimary: true,
      pointerId,
      button: 0,
      buttons: type === 'pointerup' ? 0 : 1,
      clientX: rect.left + rect.width * fraction,
      clientY: rect.top + rect.height / 2,
    })
  )
}

function range(values: number[], props: Record<string, unknown> = {}) {
  return (
    <Slider defaultValue={values} aria-label="Budget" {...props}>
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Lower" />
        {values.length > 1 && <Slider.Thumb index={1} aria-label="Upper" />}
      </Slider.Control>
    </Slider>
  )
}

test('slider.pointer.1 stacked thumbs choose the lower index before and higher index after', async () => {
  const before = mount(() => range([50, 50], { onValueCommit: vi.fn() }))
  await settle()
  const beforeControl = before.getByTestId('control')
  const beforeRect = beforeControl.getBoundingClientRect()
  pointerAt(beforeControl, 'pointerdown', 1, beforeRect, 0.4)
  pointerAt(document, 'pointerup', 1, beforeRect, 0.4)
  await settle()
  expect((before.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('40')
  expect((before.getByRole('slider', { name: 'Upper' }) as HTMLInputElement).value).toBe('50')
  expect(before.getByRole('slider', { name: 'Lower' })).toHaveFocus()

  const after = mount(() => range([50, 50]))
  await settle()
  const afterControl = after.getByTestId('control')
  const afterRect = afterControl.getBoundingClientRect()
  pointerAt(afterControl, 'pointerdown', 2, afterRect, 0.6)
  pointerAt(document, 'pointerup', 2, afterRect, 0.6)
  await settle()
  expect((after.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('50')
  expect((after.getByRole('slider', { name: 'Upper' }) as HTMLInputElement).value).toBe('60')
  expect(after.getByRole('slider', { name: 'Upper' })).toHaveFocus()
})

test('slider.pointer.3 emits a change for every distinct drag coordinate and commits the final value once', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => range([20], { onValueChange: change, onValueCommit: commit }))
  await settle()
  const control = view.getByTestId('control')
  const rect = control.getBoundingClientRect()
  pointerAt(control, 'pointerdown', 1, rect, 0.2)
  await settle()
  expect(commit).not.toHaveBeenCalled()
  pointerAt(document, 'pointermove', 1, rect, 0.4)
  await settle()
  expect((view.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('40')
  expect(change.mock.calls.map(([value]) => value)).toEqual([[40]])
  expect(commit).not.toHaveBeenCalled()
  pointerAt(document, 'pointermove', 1, rect, 0.6)
  await settle()
  expect((view.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('60')
  expect(change.mock.calls.map(([value]) => value)).toEqual([[40], [60]])
  expect(commit).not.toHaveBeenCalled()
  pointerAt(document, 'pointermove', 1, rect, 1.2)
  await settle()
  expect((view.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('100')
  expect(change.mock.calls.map(([value]) => value)).toEqual([[40], [60], [100]])
  expect(commit).not.toHaveBeenCalled()
  pointerAt(document, 'pointerup', 1, rect, 1.2)
  await settle()
  expect(commit).toHaveBeenCalledExactlyOnceWith([100])
})

test('slider.pointer.5 does not commit a second time when a completed drag later blurs', async () => {
  const commit = vi.fn()
  const view = mount(() => (
    <>
      {range([20], { onValueCommit: commit })}
      <button type="button">Outside</button>
    </>
  ))
  await settle()
  const control = view.getByTestId('control')
  const rect = control.getBoundingClientRect()
  pointerAt(control, 'pointerdown', 1, rect, 0.2)
  pointerAt(document, 'pointermove', 1, rect, 0.5)
  pointerAt(document, 'pointerup', 1, rect, 0.5)
  await settle()
  expect(commit).toHaveBeenCalledExactlyOnceWith([50])
  const outside = view.getByRole('button', { name: 'Outside' })
  expect(view.getByRole('slider', { name: 'Lower' })).toHaveFocus()
  outside.focus()
  await settle()
  expect(outside).toHaveFocus()
  expect(commit).toHaveBeenCalledTimes(1)
  pointerAt(control, 'pointerdown', 2, rect, 0.5)
  pointerAt(document, 'pointerup', 2, rect, 0.5)
  await settle()
  expect(commit).toHaveBeenCalledTimes(1)
})

test('slider.pointer.15 maps a press on a non-thumb descendant of the control', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Slider defaultValue={[20]} onValueChange={change} aria-label="Budget">
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track>
          <span data-testid="track-label">Track label</span>
        </Slider.Track>
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
    </Slider>
  ))
  await settle()
  const control = view.getByTestId('control')
  const label = view.getByTestId('track-label')
  const rect = control.getBoundingClientRect()
  pointerAt(label, 'pointerdown', 1, rect, 0.8)
  pointerAt(document, 'pointerup', 1, rect, 0.8)
  await settle()
  expect((view.getByRole('slider', { name: 'Amount' }) as HTMLInputElement).value).toBe('80')
  expect(change).toHaveBeenCalledExactlyOnceWith([80])
})

test('slider.pointer.1 real hit-tested stacked presses choose lower before and upper after', async () => {
  const before = mount(() => range([50, 50]))
  await settle()
  const beforeControl = before.getByTestId('control')
  await userEvent.click(beforeControl, { position: { x: 120, y: 50 } })
  await settle()
  expect((before.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('40')
  expect((before.getByRole('slider', { name: 'Upper' }) as HTMLInputElement).value).toBe('50')
  expect(before.getByRole('slider', { name: 'Lower' })).toHaveFocus()

  const after = mount(() => range([50, 50]))
  await settle()
  await userEvent.click(after.getByTestId('control'), { position: { x: 180, y: 50 } })
  await settle()
  expect((after.getByRole('slider', { name: 'Lower' }) as HTMLInputElement).value).toBe('50')
  expect((after.getByRole('slider', { name: 'Upper' }) as HTMLInputElement).value).toBe('60')
  expect(after.getByRole('slider', { name: 'Upper' })).toHaveFocus()
})

test('slider.pointer.15 real descendant hit testing moves the value and focuses the thumb', async () => {
  const change = vi.fn()
  const view = mount(() => (
    <Slider defaultValue={[20]} onValueChange={change} aria-label="Budget">
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track>
          <span
            data-testid="track-label"
            style={{
              position: 'absolute',
              left: '240px',
              top: '35px',
              width: '30px',
              height: '30px',
            }}
          >
            Track label
          </span>
        </Slider.Track>
        <Slider.Range />
        <Slider.Thumb aria-label="Amount" />
      </Slider.Control>
    </Slider>
  ))
  await settle()
  await userEvent.click(view.getByTestId('track-label'))
  await settle()
  const thumb = view.getByRole('slider', { name: 'Amount' }) as HTMLInputElement
  expect(thumb).toHaveValue('85')
  expect(thumb).toHaveFocus()
  expect(change).toHaveBeenCalledExactlyOnceWith([85])
})

test('slider.pointer.3 real drag emits changes and commits once before later blur', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => (
    <Slider defaultValue={[20, 70]} onValueChange={change} onValueCommit={commit}>
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb index={0} aria-label="Lower" />
        <Slider.Thumb index={1} aria-label="Upper" />
      </Slider.Control>
      <button type="button">Outside</button>
    </Slider>
  ))
  await settle()
  const lower = view.getByRole('slider', { name: 'Lower' }) as HTMLInputElement
  await userEvent.dragAndDrop(lower, view.getByTestId('control'))
  await settle()
  expect(change.mock.calls.length).toBeGreaterThan(0)
  expect(lower).not.toHaveAttribute('data-dragging')
  expect(commit).toHaveBeenCalledTimes(1)
  await userEvent.click(view.getByRole('button', { name: 'Outside' }))
  await settle()
  expect(commit).toHaveBeenCalledTimes(1)
})

test('slider.state.7 exposes data-dragging only on the active thumb and clears both on release', async () => {
  const view = mount(() => range([20, 70]))
  await settle()
  const control = view.getByTestId('control')
  const thumb = view.getByRole('slider', { name: 'Lower' })
  const upper = view.getByRole('slider', { name: 'Upper' })
  const rect = control.getBoundingClientRect()
  pointerAt(control, 'pointerdown', 1, rect, 0.2)
  await settle()
  expect(thumb).toHaveAttribute('data-dragging', '')
  expect.soft(upper).not.toHaveAttribute('data-dragging')
  pointerAt(document, 'pointermove', 1, rect, 0.4)
  await settle()
  expect(thumb).toHaveAttribute('data-dragging', '')
  expect.soft(upper).not.toHaveAttribute('data-dragging')
  pointerAt(document, 'pointerup', 1, rect, 0.4)
  await settle()
  expect(thumb).not.toHaveAttribute('data-dragging')
  expect(upper).not.toHaveAttribute('data-dragging')
})
