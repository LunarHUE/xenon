import { render } from '@solidjs/web'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { flush } from 'solid-js'

import { NumberField } from '@xenon-ui/solid/number-field'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
})

async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('number-field.forms.6 ignores hidden autofill mutations for disabled and readonly fields', async () => {
  const disabledChange = vi.fn()
  const readonlyChange = vi.fn()
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <form>
        <NumberField disabled defaultValue={2} name="disabled" onValueChange={disabledChange}>
          <NumberField.Input aria-label="Disabled amount" />
        </NumberField>
        <NumberField readonly defaultValue={3} name="readonly" onValueChange={readonlyChange}>
          <NumberField.Input aria-label="Readonly amount" />
          <NumberField.IncrementTrigger />
        </NumberField>
      </form>
    ),
    host
  )
  await settle()

  const visible = [...host.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')]
  const disabledHidden = host.querySelector<HTMLInputElement>(
    'input[type="hidden"][name="disabled"]'
  )!
  const readonlyHidden = host.querySelector<HTMLInputElement>(
    'input[type="hidden"][name="readonly"]'
  )!
  disabledHidden.value = '9'
  disabledHidden.dispatchEvent(new InputEvent('input', { bubbles: true }))
  disabledHidden.dispatchEvent(new InputEvent('change', { bubbles: true }))
  readonlyHidden.value = '8'
  readonlyHidden.dispatchEvent(new InputEvent('input', { bubbles: true }))
  readonlyHidden.dispatchEvent(new InputEvent('change', { bubbles: true }))
  await settle()

  expect(visible.map((input) => input.value)).toEqual(['2', '3'])
  expect(disabledChange).not.toHaveBeenCalled()
  expect(readonlyChange).not.toHaveBeenCalled()
  await userEvent.click(host.querySelector('button')!, { force: true })
  await settle()
  expect(visible[1]).toHaveValue('3')
  expect(readonlyChange).not.toHaveBeenCalled()
})
