import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { flush } from 'solid-js'
import { userEvent } from 'vitest/browser'

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
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}
function mount(props: Record<string, unknown> = {}) {
  dispose?.()
  host?.remove()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <Slider defaultValue={[20]} {...props}>
        <Slider.Control>
          <Slider.Track />
          <Slider.Range />
          <Slider.Thumb aria-label="Volume" />
        </Slider.Control>
      </Slider>
    ),
    host
  )
}
function input() {
  return within(host!).getByRole('slider') as HTMLInputElement
}

test('slider.keyboard.8: increasing at max and decreasing at min do not wrap', async () => {
  mount({ defaultValue: [100] })
  await settle()
  const upper = input()
  upper.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(upper).toHaveValue('100')
  mount({ defaultValue: [0] })
  await settle()
  const lower = input()
  lower.focus()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(lower).toHaveValue('0')
})

test('slider.keyboard.11: off-grid arrows snap in each direction without skipping an aligned step', async () => {
  mount({ defaultValue: [49000], min: 1000, max: 100000, step: 5000 })
  await settle()
  const value = input()
  value.focus()
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(value).toHaveValue('51000')
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(value).toHaveValue('56000')
  mount({ defaultValue: [49000], min: 1000, max: 100000, step: 5000 })
  await settle()
  const downward = input()
  downward.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(downward).toHaveValue('46000')
  mount({ defaultValue: [5.4698], step: 1 })
  await settle()
  const fractional = input()
  fractional.focus()
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(fractional).toHaveValue('6')
})

test('slider.keyboard.12: a min-anchored step grid stops at the resolved maximum', async () => {
  const change = vi.fn()
  mount({ defaultValue: [0], min: 0, max: 100, step: 30, onValueChange: change })
  await settle()
  const value = input()
  value.focus()
  for (let index = 0; index < 4; index++) await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(value).toHaveValue('90')
  expect(change).toHaveBeenLastCalledWith([90])
})

test('slider.keyboard.13: handled keys prevent default and stop propagation while Enter remains untouched', async () => {
  mount()
  await settle()
  const value = input()
  let bubbled = 0
  host!.addEventListener('keydown', () => bubbled++)
  const handled = new KeyboardEvent('keydown', {
    key: 'ArrowRight',
    bubbles: true,
    cancelable: true,
  })
  value.dispatchEvent(handled)
  expect(handled.defaultPrevented).toBe(true)
  expect.soft(bubbled).toBe(0)
  bubbled = 0
  const unrelated = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  value.dispatchEvent(unrelated)
  expect(unrelated.defaultPrevented).toBe(false)
  expect(bubbled).toBe(1)
})

test('slider.keyboard.14: consumer key handlers run once for handled and unrelated keys and can veto stepping', async () => {
  const key = vi.fn((event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') event.preventDefault()
  })
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <Slider defaultValue={[20]}>
        <Slider.Thumb aria-label="Volume" onKeyDown={key} />
      </Slider>
    ),
    host
  )
  await settle()
  const value = input()
  value.focus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(value).toHaveValue('20')
  await userEvent.keyboard('{PageUp}')
  await settle()
  expect(value).toHaveValue('30')
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(key.mock.calls.map(([event]) => event.key)).toEqual(['ArrowRight', 'PageUp', 'Enter'])
  expect(value).toHaveValue('30')
})

test('slider.keyboard.17: repeated PageUp keydowns apply one large step each time', async () => {
  const change = vi.fn()
  mount({ defaultValue: [20], largeStep: 10, onValueChange: change })
  await settle()
  const value = input()
  value.focus()
  for (const expected of [30, 40, 50]) {
    value.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'PageUp', repeat: true, bubbles: true, cancelable: true })
    )
    await settle()
    expect(value).toHaveValue(String(expected))
  }
  expect(change.mock.calls.map(([next]) => next)).toEqual([[30], [40], [50]])
})
