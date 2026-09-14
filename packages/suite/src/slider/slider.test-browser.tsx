import { render } from '@solidjs/web'
import { Slider } from '@tenon/solid/slider'
import type { SliderProps } from '@tenon/solid/slider'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

function mount(props: SliderProps = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <form>
        <Slider aria-label="Budget" defaultValue={[20, 60]} {...props}>
          <Slider.Label>Budget</Slider.Label>
          <Slider.Control
            data-testid="control"
            style={{ width: '300px', height: '100px', background: '#eee' }}
          >
            <Slider.Track />
            <Slider.Range />
            <Slider.Thumb
              index={0}
              aria-label="Minimum"
              style={{
                position: 'absolute',
                left: 'calc(var(--slider-thumb-position) - 8px)',
                top: '35px',
                width: '16px',
                height: '30px',
                margin: 0,
              }}
            />
            <Slider.Thumb
              index={1}
              aria-label="Maximum"
              style={{
                position: 'absolute',
                left: 'calc(var(--slider-thumb-position) - 8px)',
                top: '35px',
                width: '16px',
                height: '30px',
                margin: 0,
              }}
            />
          </Slider.Control>
          <Slider.ValueText />
        </Slider>
        <button type="reset">Reset</button>
        <div
          data-testid="outside"
          style={{
            position: 'absolute',
            left: '500px',
            top: '200px',
            width: '30px',
            height: '30px',
          }}
        >
          Outside
        </div>
      </form>
    ),
    container
  )
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

test('real track press selects nearest thumb, moves it, focuses it, and commits once', async () => {
  const commit = vi.fn()
  const view = mount({ onValueCommit: commit })
  await settle()
  const control = view.getByTestId('control')
  await userEvent.click(control, { position: { x: 240, y: 10 } })
  await settle()
  const upper = view.getByRole('slider', { name: 'Maximum' }) as HTMLInputElement
  expect(upper.value).toBe('80')
  expect(upper).toHaveFocus()
  expect(commit).toHaveBeenCalledExactlyOnceWith([20, 80])
  expect(view.getByRole('status')).toHaveTextContent('20 – 80')
  await expectNoViolations(view.container)
})
test('real dragging outside the rail clamps a thumb and releases the gesture', async () => {
  const commit = vi.fn()
  const view = mount({ onValueCommit: commit })
  await settle()
  const upper = view.getByRole('slider', { name: 'Maximum' }) as HTMLInputElement
  await userEvent.dragAndDrop(upper, view.getByTestId('outside'))
  await settle()
  expect(upper.value).toBe('100')
  expect(commit).toHaveBeenCalledExactlyOnceWith([20, 100])
  expect(view.getByTestId('control')).not.toHaveAttribute('data-dragging')
})
test('native keyboard, fixed tab order, form entries and reset work together', async () => {
  const view = mount({ name: 'budget', minStepsBetweenThumbs: 5 })
  await settle()
  const lower = view.getByRole('slider', { name: 'Minimum' }) as HTMLInputElement
  const upper = view.getByRole('slider', { name: 'Maximum' })
  lower.focus()
  await userEvent.keyboard('{End}')
  await settle()
  expect(lower.value).toBe('55')
  await userEvent.tab()
  expect(upper).toHaveFocus()
  const form = view.container.querySelector('form')!
  expect(new FormData(form).getAll('budget')).toEqual(['55', '60'])
  await userEvent.click(view.getByRole('button', { name: 'Reset' }))
  await settle()
  expect(new FormData(form).getAll('budget')).toEqual(['20', '60'])
})
test('RTL track coordinates and vertical touch pointer identity use actual rail geometry', async () => {
  const rtl = mount({ dir: 'rtl' })
  await settle()
  await userEvent.click(rtl.getByTestId('control'), { position: { x: 30, y: 10 } })
  await settle()
  expect((rtl.getByRole('slider', { name: 'Maximum' }) as HTMLInputElement).value).toBe('90')
  const view = mount({ orientation: 'vertical' })
  await settle()
  const control = view.getByTestId('control')
  const rect = control.getBoundingClientRect()
  const send = (target: EventTarget, type: string, pointerId: number, fraction: number) =>
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerType: 'touch',
        pointerId,
        button: 0,
        clientX: rect.left + 5,
        clientY: rect.top + rect.height * fraction,
      })
    )
  send(control, 'pointerdown', 1, 0.2)
  send(document, 'pointermove', 2, 1)
  send(document, 'pointerup', 2, 1)
  send(document, 'pointermove', 1, 0.1)
  send(document, 'pointerup', 1, 0.1)
  await settle()
  expect((view.getByRole('slider', { name: 'Maximum' }) as HTMLInputElement).value).toBe('90')
  expect(control).not.toHaveAttribute('data-dragging')
})

test('disabling a focused thumb removes focus and blocks pointer changes', async () => {
  const [disabled, setDisabled] = createSignal(false)
  const change = vi.fn()
  const view = mount({
    get disabled() {
      return disabled()
    },
    onValueChange: change,
  })
  await settle()
  const lower = view.getByRole('slider', { name: 'Minimum' })
  lower.focus()
  expect(lower).toHaveFocus()
  setDisabled(true)
  await settle()
  expect(lower).toBeDisabled()
  expect(lower).not.toHaveFocus()
  await userEvent.click(view.getByTestId('control'), { position: { x: 240, y: 10 } })
  expect(change).not.toHaveBeenCalled()
})

test('pressing a thumb without movement emits no change or commit', async () => {
  const change = vi.fn()
  const commit = vi.fn()
  const view = mount({ onValueChange: change, onValueCommit: commit })
  await settle()
  const upper = view.getByRole('slider', { name: 'Maximum' })
  await userEvent.click(upper)
  await settle()
  expect(upper).toHaveFocus()
  expect(change).not.toHaveBeenCalled()
  expect(commit).not.toHaveBeenCalled()
})
