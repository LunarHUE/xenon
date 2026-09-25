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
function mount(props: Record<string, unknown>) {
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

test('slider.keyboard.5: Shift+ArrowUp uses the large step and clamps at the maximum', async () => {
  const changed = vi.fn()
  mount({ step: 2, largeStep: 10, max: 34, onValueChange: changed })
  await settle()
  const input = within(host!).getByRole('slider') as HTMLInputElement
  input.focus()
  await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
  await settle()
  expect(input).toHaveValue('30')
  expect(input).toHaveAttribute('aria-valuenow', '30')
  expect(changed).toHaveBeenLastCalledWith([30])
  await userEvent.keyboard('{Shift>}{ArrowUp}{/Shift}')
  await settle()
  expect(input).toHaveValue('34')
  expect(input).toHaveAttribute('aria-valuenow', '34')
  expect(changed.mock.calls.map(([value]) => value)).toEqual([[30], [34]])
  for (const expected of [24, 14, 4, 0]) {
    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}')
    await settle()
    expect(input).toHaveValue(String(expected))
    expect(input).toHaveAttribute('aria-valuenow', String(expected))
    expect(changed).toHaveBeenLastCalledWith([expected])
  }
})

test('slider.keyboard.6: bare arrows retain the ordinary step with an explicit large step', async () => {
  mount({ step: 2, largeStep: 10 })
  await settle()
  const input = within(host!).getByRole('slider') as HTMLInputElement
  input.focus()
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(input).toHaveValue('22')
})
