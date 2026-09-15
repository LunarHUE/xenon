import { Field } from '@xenon/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mountField(props: { disabled?: boolean; readonly?: boolean }) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <Field {...props}>
        <Field.Control
          aria-label={props.disabled ? 'Disabled' : 'Readonly'}
          defaultValue="initial"
        />
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

test('disabled.26', async () => {
  const disabled = mountField({ disabled: true })
  const readonly = mountField({ readonly: true })
  const disabledControl = disabled.getByRole('textbox') as HTMLInputElement
  const readonlyControl = readonly.getByRole('textbox') as HTMLInputElement
  const disabledInput = vi.fn()
  const readonlyInput = vi.fn()
  disabledControl.addEventListener('input', disabledInput)
  readonlyControl.addEventListener('input', readonlyInput)

  await userEvent.type(disabledControl, 'typed')
  await userEvent.type(readonlyControl, 'typed')

  expect(disabledControl).toHaveValue('initial')
  expect(readonlyControl).toHaveValue('initial')
  expect(disabledInput).not.toHaveBeenCalled()
  expect(readonlyInput).not.toHaveBeenCalled()
})

test('disabled.27', async () => {
  const button = document.createElement('input')
  button.type = 'text'
  button.value = 'Disable me'
  document.body.append(button)
  cleanups.push(() => button.remove())

  button.focus()
  expect(button).toHaveFocus()
  button.disabled = true
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  // Chromium immediately moves focus to the body. Firefox and WebKit retain the
  // disabled input as activeElement, despite excluding it from future focus attempts.
  const chromium = navigator.userAgent.includes('Chrome/')
  expect(document.activeElement).toBe(chromium ? document.body : button)
})
