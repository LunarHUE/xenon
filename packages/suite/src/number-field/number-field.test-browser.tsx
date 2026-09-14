import { render } from '@solidjs/web'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { NumberField } from '@tenon/solid/number-field'
let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined
afterEach(() => {
  dispose?.()
  host?.remove()
})
test('native numeric form validation, localized submission, stepping and reset', async () => {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <form onSubmit={(event) => event.preventDefault()}>
        <NumberField locale="de-DE" name="amount" required min={0} max={10}>
          <NumberField.Label>Amount</NumberField.Label>
          <NumberField.Input />
          <NumberField.IncrementTrigger>+</NumberField.IncrementTrigger>
        </NumberField>
      </form>
    ),
    host
  )
  flush()
  const input = host.querySelector('input[role="spinbutton"]') as HTMLInputElement
  const form = host.querySelector('form')!
  expect(input.checkValidity()).toBe(false)
  await userEvent.fill(input, '20')
  flush()
  expect(input.checkValidity()).toBe(false)
  await userEvent.fill(input, '2,5')
  await userEvent.keyboard('{Enter}')
  flush()
  expect(new FormData(form).get('amount')).toBe('2.5')
  expect(input.checkValidity()).toBe(true)
  await userEvent.click(host.querySelector('button')!)
  flush()
  expect(input.value).toBe('3')
  form.reset()
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(input.value).toBe('')
  expect(input.checkValidity()).toBe(false)
})

test('native reset activation retains untouched default and controlled values', async () => {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(
    () => (
      <form>
        <NumberField defaultValue={2}>
          <NumberField.Input aria-label="Default" />
        </NumberField>
        <NumberField value={3}>
          <NumberField.Input aria-label="Controlled" />
        </NumberField>
        <button type="reset">Reset</button>
      </form>
    ),
    host
  )
  flush()
  await userEvent.click(host.querySelector('button')!)
  await new Promise((resolve) => setTimeout(resolve, 0))
  flush()
  expect(
    [...host.querySelectorAll<HTMLInputElement>('[role="spinbutton"]')].map((input) => input.value)
  ).toEqual(['2', '3'])
})
