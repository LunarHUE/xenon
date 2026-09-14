import userEvent from '@testing-library/user-event'
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
    const user = userEvent.setup()
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
    await user.keyboard('{Enter}')
    await m.settle()

    expect(submits).toBe(1)
    expect(submitter).toBe(button)
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(el).not.toBeChecked()
  })

  spec.todo('checkbox.forms.33')

  spec.skip(
    'checkbox.forms.34',
    'our button host is type="button", so Enter on it never submits',
    async () => {
      const user = userEvent.setup()
      const readonly = mount('checkbox', { name: 'agree', readonly: true })
      const form = formWith(readonly.container)
      const button = mount('checkbox', { as: 'button', name: 'terms' })
      form.appendChild(button.container)
      submitButton(form)

      let submits = 0
      form.addEventListener('submit', (event) => {
        event.preventDefault()
        submits++
      })

      inputHost(readonly.container).focus()
      await user.keyboard('{Enter}')
      await readonly.settle()
      expect(submits).toBe(1)

      host(button.container).focus()
      await user.keyboard('{Enter}')
      await button.settle()
      expect(submits).toBe(2)
    }
  )
})
