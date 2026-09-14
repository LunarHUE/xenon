import { userEvent } from 'vitest/browser'
import { afterEach, describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function inputHost(container: HTMLElement): HTMLInputElement {
  const el = host(container)
  if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
  return el
}

function formWith(...containers: HTMLElement[]): HTMLFormElement {
  const form = document.createElement('form')
  document.body.appendChild(form)
  extras.add(form)
  for (const container of containers) form.appendChild(container)
  return form
}

function submitButton(form: HTMLFormElement, text = 'Save'): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'submit'
  button.textContent = text
  form.appendChild(button)
  return button
}

describe('checkbox forms in a browser', () => {
  spec('checkbox.forms.21', async () => {
    const m = mount('checkbox', { name: 'agree' })
    const form = formWith(m.container)
    const button = submitButton(form)
    const clicks = vi.fn()
    button.addEventListener('click', clicks)

    let submits = 0
    let submitter: Element | null = null
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      submits++
      submitter = event.submitter
    })

    const el = inputHost(m.container)
    el.focus()
    await userEvent.keyboard('{Enter}')
    await m.settle()

    expect(submits).toBe(1)
    expect(submitter).toBe(button)
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(el).not.toBeChecked()
  })

  spec('checkbox.forms.9', () => {
    const m = mount('checkbox', { name: 'agree', required: true })
    formWith(m.container)
    const el = inputHost(m.container)
    expect(el.willValidate).toBe(true)

    const invalid = vi.fn()
    el.addEventListener('invalid', (event) => invalid(event.cancelable))
    expect(el.checkValidity()).toBe(false)
    expect(invalid).toHaveBeenCalledWith(true)
    expect(el.reportValidity()).toBe(false)

    el.setCustomValidity('Pick one\r\nfirst')
    expect(el.validity.customError).toBe(true)
    expect(el.validationMessage).toBe('Pick one\nfirst')
    el.setCustomValidity('')

    const flags = [
      'valueMissing',
      'typeMismatch',
      'patternMismatch',
      'tooLong',
      'tooShort',
      'rangeUnderflow',
      'rangeOverflow',
      'stepMismatch',
      'badInput',
      'customError',
      'valid',
    ]
    for (const flag of flags) expect(flag in el.validity).toBe(true)
  })

  spec('checkbox.forms.10', async () => {
    const m = mount('checkbox', { name: 'agree', required: true })
    const form = formWith(m.container)
    const submitter = submitButton(form)
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)

    await userEvent.click(submitter)
    await m.settle()
    expect(submit).not.toHaveBeenCalled()

    form.noValidate = true
    await userEvent.click(submitter)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    form.noValidate = false
    submitter.formNoValidate = true
    await userEvent.click(submitter)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(2)
  })

  spec('checkbox.forms.11', async () => {
    const m = mount('checkbox', { name: 'agree', required: true, defaultChecked: true })
    formWith(m.container)
    const el = inputHost(m.container)
    expect(el.matches(':invalid')).toBe(false)
    expect(el.matches(':user-invalid')).toBe(false)

    await userEvent.click(el)
    await m.settle()
    expect(el.matches(':invalid')).toBe(true)
    expect(el.matches(':user-invalid')).toBe(true)
  })

  spec('checkbox.forms.33', async () => {
    for (const mode of [
      'control',
      'ancestor',
      'missing',
      'disabled',
      'disabled-with-fallback',
    ] as const) {
      const m = mount('checkbox', {
        name: 'agree',
        ...(mode === 'control'
          ? { onKeyDown: (event: KeyboardEvent) => event.preventDefault() }
          : {}),
      })
      const form = formWith(m.container)
      const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
      form.addEventListener('submit', submit)
      const defaults: boolean[] = []
      if (mode === 'ancestor')
        form.addEventListener('keydown', (event) => {
          defaults.push(event.defaultPrevented)
          event.preventDefault()
        })
      if (mode !== 'missing') {
        const first = submitButton(form)
        first.disabled = mode === 'disabled' || mode === 'disabled-with-fallback'
        if (mode === 'disabled-with-fallback') submitButton(form, 'Later submitter')
      }
      inputHost(m.container).focus()
      await userEvent.keyboard('{Enter}')
      await m.settle()
      if (mode === 'disabled-with-fallback') {
        expect(submit).toHaveBeenCalledTimes(1)
        expect(submit.mock.calls[0]?.[0].submitter).toBe(form.querySelector('button:last-of-type'))
      } else expect(submit, mode).not.toHaveBeenCalled()
      expect(inputHost(m.container)).not.toBeChecked()
      if (mode === 'ancestor') expect(defaults).toEqual([false])
      m.unmount()
      form.remove()
    }
  })
})
