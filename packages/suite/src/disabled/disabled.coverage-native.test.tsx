import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []

afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

test('disabled.4 aria-disabled alone preserves native focus, click, and validation', () => {
  const button = document.createElement('button')
  button.type = 'button'
  button.setAttribute('aria-disabled', 'true')
  const clicked = vi.fn()
  button.addEventListener('click', clicked)
  const input = document.createElement('input')
  input.required = true
  input.setAttribute('aria-disabled', 'true')
  document.body.append(button, input)
  cleanups.push(() => {
    button.remove()
    input.remove()
  })

  button.focus()
  button.click()

  expect(button).toHaveFocus()
  expect(clicked).toHaveBeenCalledTimes(1)
  expect(input.checkValidity()).toBe(false)
  expect(input.validationMessage).not.toBe('')
})

test('disabled.18 scripted checkbox and radio activation records native commit events', () => {
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.disabled = true
  checkbox.indeterminate = true
  const radio = document.createElement('input')
  radio.type = 'radio'
  radio.name = 'choice'
  radio.disabled = true
  const events: string[] = []
  for (const control of [checkbox, radio]) {
    control.addEventListener('input', () => events.push(`${control.type}:input`))
    control.addEventListener('change', () => events.push(`${control.type}:change`))
  }
  document.body.append(checkbox, radio)
  cleanups.push(() => {
    checkbox.remove()
    radio.remove()
  })

  checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  radio.dispatchEvent(new MouseEvent('click', { bubbles: true }))

  expect(checkbox.checked).toBe(true)
  expect(checkbox.indeterminate).toBe(false)
  expect(radio.checked).toBe(true)
  expect(events).toEqual(['checkbox:input', 'checkbox:change', 'radio:input', 'radio:change'])

  checkbox.checked = true
  checkbox.indeterminate = true
  const other = document.createElement('input')
  other.type = 'checkbox'
  document.body.append(other)
  cleanups.push(() => other.remove())
  checkbox.addEventListener(
    'click',
    (event) => {
      other.checked = true
      event.preventDefault()
    },
    { once: true }
  )
  const beforeCancel = events.length
  checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  expect(checkbox.checked).toBe(true)
  expect(checkbox.indeterminate).toBe(true)
  expect(other.checked).toBe(true)
  expect(events).toHaveLength(beforeCancel)

  checkbox.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  expect(checkbox.checked).toBe(false)
  expect(events.slice(-2)).toEqual(['checkbox:input', 'checkbox:change'])

  const selectedRadio = document.createElement('input')
  selectedRadio.type = 'radio'
  selectedRadio.name = 'selected'
  selectedRadio.disabled = true
  selectedRadio.checked = true
  const selectedEvents = vi.fn()
  selectedRadio.addEventListener('input', selectedEvents)
  selectedRadio.addEventListener('change', selectedEvents)
  document.body.append(selectedRadio)
  cleanups.push(() => selectedRadio.remove())
  selectedRadio.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(selectedRadio.checked).toBe(true)
  expect(selectedEvents).not.toHaveBeenCalled()
})
