import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { afterEach, expect, test, vi } from 'vitest'
import { flush } from 'solid-js'
import { userEvent } from 'vitest/browser'
import { NumberField } from '@xenon/solid/number-field'

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

test('number-field.rtl.4: Persian digits and separators typed key by key echo until commit', async () => {
  const changed = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <NumberField locale="fa-IR" name="amount" onValueChange={changed}>
        <NumberField.Input aria-label="Amount" />
      </NumberField>
    ),
    host
  )
  await settle()
  const input = within(host).getByRole('spinbutton') as HTMLInputElement
  await userEvent.click(input)
  const text = '۱٬۲۳۴٫۵'
  for (let index = 0; index < text.length; index++) {
    await userEvent.keyboard(text[index]!)
    await settle()
    expect(input).toHaveValue(text.slice(0, index + 1))
    expect(changed).not.toHaveBeenCalled()
  }
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(input).toHaveValue('۱٬۲۳۴٫۵')
  expect(changed).toHaveBeenCalledExactlyOnceWith(1234.5)
})
