/**
 * Native vertical and RTL slider navigation, multi-thumb clamping during a real
 * drag, and pointer gesture cancellation for the shipped native range-input slider.
 * @packageDocumentation
 */
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Slider } from '@xenon/solid/slider'
import type { SliderProps } from '@xenon/solid/slider'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Definite rail geometry so pointer coordinates map to known values. */
const rail: JSX.CSSProperties = { width: '300px', height: '100px', background: '#eee' }
/** Drop target parked off the rail so a real drag leaves the control. */
const outside: JSX.CSSProperties = {
  position: 'absolute',
  left: '500px',
  top: '200px',
  width: '30px',
  height: '30px',
}
/** An absolutely positioned native thumb laid over the rail. */
const thumb: JSX.CSSProperties = {
  position: 'absolute',
  left: 'calc(var(--slider-thumb-position) - 8px)',
  top: '35px',
  width: '16px',
  height: '30px',
  margin: 0,
}

/** One labeled native thumb on a measured rail, with a formatted output. */
function Single(props: SliderProps) {
  return (
    <Slider aria-label="Volume" defaultValue={[20]} {...props}>
      <Slider.Control data-testid="control" style={rail}>
        <Slider.Track />
        <Slider.Range />
        <Slider.Thumb aria-label="Volume" style={thumb} />
      </Slider.Control>
      <Slider.ValueText />
    </Slider>
  )
}

/** Two labeled native thumbs plus an off-rail drop target for drag geometry. */
function RangeRail(props: SliderProps) {
  return (
    <>
      <Slider aria-label="Budget" defaultValue={[20, 60]} {...props}>
        <Slider.Control data-testid="control" style={rail}>
          <Slider.Track />
          <Slider.Range />
          <Slider.Thumb index={0} aria-label="Minimum" style={thumb} />
          <Slider.Thumb index={1} aria-label="Maximum" style={thumb} />
        </Slider.Control>
        <Slider.ValueText />
      </Slider>
      <div data-testid="outside" style={outside}>
        Outside
      </div>
    </>
  )
}

/** Renders a fixture into the body and disposes it after the current test. */
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

/** Flushes Solid and one animation frame so native focus and layout work has settled. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

/** Delivers one native key press and settles the resulting value and callbacks. */
async function press(keys: string) {
  await userEvent.keyboard(keys)
  await settle()
}

/**
 * Dispatches one synthetic touch PointerEvent for a horizontal gesture, using the
 * supplied rail rectangle so the coordinate maps to a known value.
 * @remarks
 * Synthetic events assert the Pointer Events gesture contract only; they do not
 * stand in for a physical touch or native browser cancellation.
 */
function pointerAt(
  target: EventTarget,
  type: string,
  pointerId: number,
  rect: DOMRect,
  fraction: number
) {
  const event = new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerType: 'touch',
    isPrimary: true,
    pointerId,
    button: 0,
    buttons: 1,
    clientX: rect.left + rect.width * fraction,
    clientY: rect.top + rect.height / 2,
  })
  target.dispatchEvent(event)
}

test('vertical native keys move both arrow axes, page steps and the numeric ends', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => (
    <Single orientation="vertical" onValueChange={change} onValueCommit={commit} />
  ))
  await settle()
  const control = view.getByTestId('control')
  const input = view.getByRole('slider', { name: 'Volume' }) as HTMLInputElement
  expect(control).toHaveAttribute('data-orientation', 'vertical')
  expect(input).toHaveAttribute('aria-orientation', 'vertical')

  // Both arrow axes stay numeric on a vertical rail: Right/Up increase, Left/Down decrease.
  input.focus()
  await press('{ArrowUp}')
  expect(input.value).toBe('21')
  await press('{ArrowRight}')
  expect(input.value).toBe('22')
  await press('{ArrowDown}')
  expect(input.value).toBe('21')
  await press('{ArrowLeft}')
  expect(input.value).toBe('20')
  await press('{PageUp}')
  expect(input.value).toBe('30')
  await press('{PageDown}')
  expect(input.value).toBe('20')
  await press('{Home}')
  expect(input.value).toBe('0')
  await press('{End}')
  expect(input.value).toBe('100')

  expect(change.mock.calls.map(([value]) => value)).toEqual([
    [21],
    [22],
    [21],
    [20],
    [30],
    [20],
    [0],
    [100],
  ])
  // A handled key release commits the accepted value once per gesture.
  expect(commit).toHaveBeenCalledTimes(8)
  expect(commit).toHaveBeenLastCalledWith([100])

  // At the resolved maximum an increasing key changes nothing and commits nothing.
  await press('{ArrowUp}')
  expect(input.value).toBe('100')
  expect(change).toHaveBeenCalledTimes(8)
  expect(commit).toHaveBeenCalledTimes(8)
})

test('an RTL ancestor mirrors horizontal arrows while vertical and page keys stay numeric', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => (
    <div dir="rtl">
      <Single onValueChange={change} onValueCommit={commit} />
    </div>
  ))
  await settle()
  const root = view.getByRole('group')
  const input = view.getByRole('slider', { name: 'Volume' }) as HTMLInputElement
  // No dir prop was passed, so the nearest ancestor writing direction is adopted.
  expect(root).toHaveAttribute('dir', 'rtl')
  expect(view.getByTestId('control')).toHaveAttribute('data-orientation', 'horizontal')

  // Horizontal arrows mirror: the key toward the track start decreases the value.
  input.focus()
  await press('{ArrowRight}')
  expect(input.value).toBe('19')
  await press('{ArrowLeft}')
  expect(input.value).toBe('20')
  // Vertical arrows, page steps and the ends stay numeric in RTL.
  await press('{ArrowUp}')
  expect(input.value).toBe('21')
  await press('{ArrowDown}')
  expect(input.value).toBe('20')
  await press('{PageUp}')
  expect(input.value).toBe('30')
  await press('{PageDown}')
  expect(input.value).toBe('20')
  await press('{Home}')
  expect(input.value).toBe('0')
  await press('{End}')
  expect(input.value).toBe('100')

  expect(change.mock.calls.map(([value]) => value)).toEqual([
    [19],
    [20],
    [21],
    [20],
    [30],
    [20],
    [0],
    [100],
  ])
  expect(commit).toHaveBeenCalledTimes(8)
  expect(commit).toHaveBeenLastCalledWith([100])
})

test('dragging a thumb past its neighbor clamps at the neighbor and blocks further steps', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => <RangeRail onValueChange={change} onValueCommit={commit} />)
  await settle()
  const control = view.getByTestId('control')
  const lower = view.getByRole('slider', { name: 'Minimum' }) as HTMLInputElement
  const upper = view.getByRole('slider', { name: 'Maximum' }) as HTMLInputElement

  // A real drag far past the rail stops at the neighbor instead of crossing or swapping.
  await userEvent.dragAndDrop(lower, view.getByTestId('outside'))
  await settle()
  expect(lower.value).toBe('60')
  expect(upper.value).toBe('60')
  expect(change).toHaveBeenLastCalledWith([60, 60])
  expect(commit).toHaveBeenCalledExactlyOnceWith([60, 60])
  expect(control).not.toHaveAttribute('data-dragging')
  expect(lower).toHaveFocus()
  // Thumb identity, DOM order and the tab sequence are unaffected by the value change.
  const order = view.getAllByRole('slider')
  expect(order).toHaveLength(2)
  expect(order[0]).toBe(lower)
  expect(order[1]).toBe(upper)
  expect(order.map((input) => input.getAttribute('data-index'))).toEqual(['0', '1'])

  // Equal neighbors are allowed, but the lower thumb can no longer step upward.
  const changes = change.mock.calls.length
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(lower.value).toBe('60')
  expect(change).toHaveBeenCalledTimes(changes)
  expect(commit).toHaveBeenCalledTimes(1)
})

test('a synthetic pointercancel ends the drag, commits the last value and ignores later events', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => <Single onValueChange={change} onValueCommit={commit} />)
  await settle()
  const control = view.getByTestId('control')
  const input = view.getByRole('slider', { name: 'Volume' }) as HTMLInputElement
  const rect = control.getBoundingClientRect()

  pointerAt(control, 'pointerdown', 5, rect, 0.25)
  await settle()
  expect(input.value).toBe('25')
  expect(input).toHaveFocus()
  expect(control).toHaveAttribute('data-dragging')

  // A cancel from another pointer identity neither moves nor ends the gesture.
  pointerAt(document, 'pointercancel', 6, rect, 0.25)
  await settle()
  expect(input.value).toBe('25')
  expect(control).toHaveAttribute('data-dragging')
  expect(commit).not.toHaveBeenCalled()

  pointerAt(document, 'pointermove', 5, rect, 0.4)
  await settle()
  expect(input.value).toBe('40')

  // Cancelling the owning pointer ends the gesture and commits the last requested value.
  pointerAt(document, 'pointercancel', 5, rect, 0.4)
  await settle()
  expect(commit).toHaveBeenCalledExactlyOnceWith([40])
  expect(control).not.toHaveAttribute('data-dragging')

  // The document listeners leave with the gesture, so a late move or release is inert.
  pointerAt(document, 'pointermove', 5, rect, 0.9)
  pointerAt(document, 'pointerup', 5, rect, 0.9)
  await settle()
  expect(input.value).toBe('40')
  expect(commit).toHaveBeenCalledTimes(1)
  expect(change.mock.calls.map(([value]) => value)).toEqual([[25], [40]])
})

test('a secondary-button press on the rail starts nothing and leaves the value alone', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount(() => <Single onValueChange={change} onValueCommit={commit} />)
  await settle()
  const control = view.getByTestId('control')
  const input = view.getByRole('slider', { name: 'Volume' }) as HTMLInputElement

  await userEvent.click(control, { button: 'right', position: { x: 240, y: 50 } })
  await settle()
  expect(input.value).toBe('20')
  expect(input).not.toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
  expect(control).not.toHaveAttribute('data-dragging')

  // A primary press on the same point still selects, focuses and commits the new value.
  await userEvent.click(control, { position: { x: 240, y: 50 } })
  await settle()
  expect(input.value).toBe('80')
  expect(input).toHaveFocus()
  expect(commit).toHaveBeenCalledExactlyOnceWith([80])
})
