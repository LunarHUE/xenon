import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { afterEach, expect, test } from 'vitest'
import { flush } from 'solid-js'
import { userEvent } from 'vitest/browser'

import { Slider } from '@xenon/solid/slider'

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

test('slider.roles.21: native Tab reaches each thumb while the control wrapper is skipped', async () => {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <>
        <button type="button">Before</button>
        <Slider aria-label="Budget" defaultValue={[20, 60]}>
          <Slider.Control data-testid="control">
            <Slider.Track />
            <Slider.Range />
            <Slider.Thumb index={0} aria-label="Minimum" />
            <Slider.Thumb index={1} aria-label="Maximum" />
          </Slider.Control>
        </Slider>
        <button type="button">After</button>
      </>
    ),
    host
  )
  await settle()
  const before = within(host).getByRole('button', { name: 'Before' })
  const lower = within(host).getByRole('slider', { name: 'Minimum' })
  const upper = within(host).getByRole('slider', { name: 'Maximum' })
  const after = within(host).getByRole('button', { name: 'After' })
  expect(within(host).getByTestId('control')).not.toHaveAttribute('tabindex')
  await userEvent.click(before)
  await userEvent.tab()
  expect(lower).toHaveFocus()
  await userEvent.tab()
  expect(upper).toHaveFocus()
  await userEvent.tab()
  expect(after).toHaveFocus()
})
