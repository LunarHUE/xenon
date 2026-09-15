import { Field } from '@xenon/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mountField(props: { disabled?: boolean; required?: boolean }) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <Field {...props}>
        <Field.Control aria-label="Account" />
      </Field>
    ),
    host
  )
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return within(host)
}

test('disabled.14', () => {
  const query = mountField({ disabled: true, required: true })
  const control = query.getByRole('textbox') as HTMLInputElement

  expect(control).toBeDisabled()
  expect(control).toBeRequired()
  expect(control.validationMessage).toBe('')

  control.disabled = false
  expect(control.validationMessage).not.toBe('')
})

test('disabled.17', () => {
  const button = document.createElement('button')
  button.disabled = true
  const listener = vi.fn()
  button.addEventListener('click', listener)
  document.body.append(button)
  cleanups.push(() => button.remove())

  expect(button.dispatchEvent(new MouseEvent('click', { bubbles: true }))).toBe(true)
  expect(listener).toHaveBeenCalledTimes(1)
})

test('disabled.19', () => {
  const form = document.createElement('form')
  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.disabled = true
  const reset = document.createElement('button')
  reset.type = 'reset'
  reset.disabled = true
  form.append(submit, reset)
  document.body.append(form)
  cleanups.push(() => form.remove())

  const submitted = vi.fn((event: SubmitEvent) => event.preventDefault())
  const resetEvents = vi.fn()
  form.addEventListener('submit', submitted)
  form.addEventListener('reset', resetEvents)

  submit.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  reset.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  expect(submitted).not.toHaveBeenCalled()
  expect(resetEvents).not.toHaveBeenCalled()
})
