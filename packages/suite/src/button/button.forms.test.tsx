import type { ButtonProps } from '@kit/solid'
import { fireEvent } from '@testing-library/dom'
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

function buttonHost(container: HTMLElement): HTMLButtonElement {
  const el = host(container)
  if (!(el instanceof HTMLButtonElement)) throw new Error('not a button host')
  return el
}

function createForm(id?: string): HTMLFormElement {
  const form = document.createElement('form')
  if (id) form.id = id
  document.body.appendChild(form)
  extras.add(form)
  return form
}

function formWith(...containers: HTMLElement[]): HTMLFormElement {
  const form = createForm()
  for (const container of containers) form.appendChild(container)
  return form
}

function createLabel(text?: string): HTMLLabelElement {
  const label = document.createElement('label')
  if (text) label.textContent = text
  document.body.appendChild(label)
  extras.add(label)
  return label
}

function textInput(form: HTMLFormElement, name: string, value = ''): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'text'
  input.name = name
  input.value = value
  form.appendChild(input)
  return input
}

describe('button forms', () => {
  spec('button.forms.1', () => {
    const native = mount('button', { children: 'Go', name: 'go' })
    const custom = mount('button', { as: 'div', children: 'Custom' })
    const form = formWith(native.container, custom.container)
    const nativeEl = buttonHost(native.container)
    const customEl = host(custom.container)
    expect(Array.from(form.elements)).toContain(nativeEl)
    expect(Array.from(form.elements)).not.toContain(customEl)
    expect('form' in customEl).toBe(false)
    expect(nativeEl.form).toBe(form)
  })

  spec('button.forms.2', () => {
    const form = createForm('button-forms-2')
    const native = mount('button', { children: 'Go', form: 'button-forms-2' })
    expect(buttonHost(native.container).form).toBe(form)

    const custom = mount('button', {
      as: 'div',
      children: 'Custom',
      form: 'button-forms-2',
    } as ButtonProps)
    expect('form' in host(custom.container)).toBe(false)
  })

  spec('button.forms.3', () => {
    const m = mount('button', { children: 'Go' })
    const el = buttonHost(m.container)
    expect(el.form).toBe(null)

    const ancestor = formWith(m.container)
    expect(el.form).toBe(ancestor)

    const owner = createForm('button-forms-3')
    m.setProps({ form: 'button-forms-3' })
    expect(el.form).toBe(owner)

    m.setProps({ form: undefined })
    expect(el.form).toBe(ancestor)

    document.body.appendChild(m.container)
    expect(el.form).toBe(null)
  })

  spec.todo('button.forms.4')

  spec.todo('button.forms.5')

  spec.todo('button.forms.6')

  spec.todo('button.forms.7')

  spec('button.forms.8', () => {
    const m = mount('button', { children: 'Go', type: 'submit' })
    formWith(m.container)
    const el = buttonHost(m.container)
    expect(el.willValidate).toBe(true)

    const invalid = vi.fn()
    el.addEventListener('invalid', (event) => invalid(event.cancelable))
    el.setCustomValidity('Pick one first')
    expect(el.checkValidity()).toBe(false)
    expect(invalid).toHaveBeenCalledWith(true)
    expect(el.reportValidity()).toBe(false)

    el.setCustomValidity('')
    expect(el.checkValidity()).toBe(true)

    el.setCustomValidity('Pick one\r\nfirst')
    expect(el.validationMessage).toBe('Pick one\nfirst')
  })

  spec('button.forms.9', () => {
    const m = mount('button', { children: 'Go' })
    const el = buttonHost(m.container)
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
    expect(el.validity.valid).toBe(true)
  })

  spec('button.forms.10', async () => {
    const user = userEvent.setup()
    const m = mount('button', { children: 'Go', type: 'submit' })
    const form = formWith(m.container)
    const required = textInput(form, 'required')
    required.required = true
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)

    form.noValidate = true
    await user.click(host(m.container))
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    form.noValidate = false
    await user.click(host(m.container))
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    m.setProps({ formnovalidate: true })
    await user.click(host(m.container))
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(2)
  })

  spec('button.forms.11', async () => {
    const user = userEvent.setup()
    const m = mount('button', { children: 'Reset', type: 'reset' })
    const form = formWith(m.container)
    const input = textInput(form, 'field')
    input.defaultValue = 'default'
    input.value = 'typed'

    const order: string[] = []
    let reset: Event | undefined
    form.addEventListener('reset', (event) => {
      order.push('reset')
      reset = event
    })
    input.addEventListener('input', () => order.push('input'))

    await user.click(host(m.container))
    await m.settle()
    expect(order).toEqual(['reset'])
    expect(reset?.cancelable).toBe(true)
    expect(reset?.bubbles).toBe(true)
    expect(input.value).toBe('default')

    input.value = 'typed again'
    form.addEventListener('reset', (event) => event.preventDefault())
    await user.click(host(m.container))
    await m.settle()
    expect(input.value).toBe('typed again')
  })

  spec.todo('button.forms.12')

  spec('button.forms.13', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const m = mount('button', { as: 'div', children: 'Go', disabled: true, onClick })
    const el = host(m.container)
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el.matches(':disabled')).toBe(false)

    await user.click(el)
    await m.settle()
    expect(onClick).not.toHaveBeenCalled()

    el.focus()
    expect(el).not.toHaveFocus()
  })

  spec('button.forms.14', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const m = mount('button', { children: 'Go', disabled: true, onClick })
    await user.click(host(m.container))
    await m.settle()
    expect(onClick).not.toHaveBeenCalled()
  })

  spec('button.forms.15', async () => {
    const user = userEvent.setup()
    const m = mount('button', {
      children: 'Go',
      type: 'submit',
      name: 'action',
      value: 'save',
      disabled: true,
    })
    const form = formWith(m.container)
    textInput(form, 'query', 'solid')
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)

    expect(buttonHost(m.container).willValidate).toBe(false)
    await user.click(host(m.container))
    await m.settle()
    expect(submit).not.toHaveBeenCalled()
    expect(Array.from(new FormData(form).keys())).toEqual(['query'])
  })

  spec('button.forms.16', () => {
    const form = createForm()
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    const legend = document.createElement('legend')
    const nested = document.createElement('fieldset')
    fieldset.append(legend, nested)
    form.appendChild(fieldset)

    const inside = mount('button', { children: 'Inside' })
    nested.appendChild(inside.container)
    const inLegend = mount('button', { children: 'Legend' })
    legend.appendChild(inLegend.container)

    expect(host(inside.container).matches(':disabled')).toBe(true)
    expect(host(inLegend.container).matches(':disabled')).toBe(false)
  })

  spec('button.forms.17', () => {
    const disabled = mount('button', { children: 'Off', disabled: true })
    expect(host(disabled.container).matches(':disabled')).toBe(true)

    const enabled = mount('button', { children: 'On' })
    expect(host(enabled.container).matches(':disabled')).toBe(false)

    const custom = mount('button', { as: 'div', children: 'Custom', disabled: true })
    const customEl = host(custom.container)
    expect(customEl).toHaveAttribute('aria-disabled', 'true')
    expect(customEl.matches(':disabled')).toBe(false)
  })

  spec('button.forms.18', async () => {
    const user = userEvent.setup()
    const m = mount('button', { children: 'Go' })
    const form = formWith(m.container)
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    form.addEventListener('submit', submit)
    const el = buttonHost(m.container)

    expect(el.type).toBe('button')
    await user.click(el)
    await m.settle()
    expect(submit).not.toHaveBeenCalled()

    el.removeAttribute('type')
    expect(el.type).toBe('submit')
    await user.click(el)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    m.setProps({ type: 'submit' })
    await user.click(el)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(2)
  })

  spec('button.forms.19', async () => {
    const user = userEvent.setup()
    const m = mount('button', { children: 'Go', type: 'submit', disabled: true })
    const form = formWith(m.container)
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const reset = vi.fn()
    form.addEventListener('submit', submit)
    form.addEventListener('reset', reset)
    const el = buttonHost(m.container)

    await user.click(el)
    await m.settle()
    expect(submit).not.toHaveBeenCalled()

    m.setProps({ disabled: false })
    await user.click(el)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    m.setProps({ type: 'reset' })
    await user.click(el)
    await m.settle()
    expect(reset).toHaveBeenCalledTimes(1)

    m.setProps({ type: 'button' })
    await user.click(el)
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)
    expect(reset).toHaveBeenCalledTimes(1)
  })

  spec.todo('button.forms.20')

  spec.todo('button.forms.21')

  spec('button.forms.22', () => {
    const popover = document.createElement('div')
    popover.id = 'button-forms-22'
    popover.setAttribute('popover', '')
    document.body.appendChild(popover)
    extras.add(popover)

    const m = mount('button', { children: 'Go', popovertarget: 'button-forms-22' })
    const el = buttonHost(m.container)
    const target = el.getAttribute('popovertarget')
    expect(target).toBe('button-forms-22')
    expect(el.getRootNode()).toBe(popover.getRootNode())
    expect(document.getElementById(target ?? '')).toHaveAttribute('popover')
    expect(el).not.toHaveAttribute('popovertargetaction')

    for (const action of ['toggle', 'show', 'hide'] as const) {
      m.setProps({ popovertargetaction: action })
      expect(el).toHaveAttribute('popovertargetaction', action)
    }
  })

  spec('button.forms.23', () => {
    const m = mount('button', { children: 'Go' })
    formWith(m.container)
    const el = buttonHost(m.container)
    expect(el.willValidate).toBe(false)

    m.setProps({ type: 'reset' })
    expect(el.willValidate).toBe(false)

    m.setProps({ type: 'submit' })
    expect(el.willValidate).toBe(true)
  })

  spec('button.forms.24', async () => {
    const user = userEvent.setup()
    const first = mount('button', { children: 'First', type: 'submit' })
    const second = mount('button', { children: 'Second', type: 'submit' })
    const form = formWith(first.container, second.container)
    const input = textInput(form, 'query')

    const clicks: string[] = []
    host(first.container).addEventListener('click', () => clicks.push('first'))
    host(second.container).addEventListener('click', () => clicks.push('second'))
    let submitter: string | null = null
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      submitter = event.submitter?.textContent ?? null
    })

    input.focus()
    await user.keyboard('{Enter}')
    await first.settle()
    expect(clicks).toEqual(['first'])
    expect(submitter).toBe('First')
  })

  spec.todo('button.forms.25')

  spec.todo('button.forms.26')

  spec('button.forms.27', async () => {
    const user = userEvent.setup()
    const m = mount('button', { children: 'Go', type: 'submit', name: 'action', value: 'save' })
    const form = formWith(m.container)
    textInput(form, 'query', 'solid')

    let seen: SubmitEvent | undefined
    let entries: [string, FormDataEntryValue][] = []
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      seen = event
      entries = Array.from(new FormData(form, event.submitter))
    })

    await user.click(host(m.container))
    await m.settle()
    expect(seen).toBeInstanceOf(SubmitEvent)
    expect(seen?.cancelable).toBe(true)
    expect(seen?.submitter).toBe(host(m.container))
    expect(seen?.defaultPrevented).toBe(true)
    expect(entries).toEqual([
      ['action', 'save'],
      ['query', 'solid'],
    ])
  })

  spec('button.forms.28', () => {
    const explicit = mount('button', { children: 'Go', id: 'button-forms-28' })
    const label = createLabel('Explicit')
    label.htmlFor = 'button-forms-28'
    expect(label.control).toBe(host(explicit.container))

    const implicitLabel = createLabel()
    const implicit = mount('button', { children: 'Go' })
    implicitLabel.appendChild(implicit.container)
    expect(implicitLabel.control).toBe(host(implicit.container))
  })

  spec('button.forms.29', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const m = mount('button', { children: 'Go', onClick })
    const label = createLabel()
    label.appendChild(m.container)

    await user.click(host(m.container))
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  spec.todo('button.forms.30')

  spec('button.forms.31', () => {
    const native = mount('button', { children: 'Go', id: 'button-forms-31-native' })
    const nativeLabel = createLabel('Native')
    nativeLabel.htmlFor = 'button-forms-31-native'
    expect(nativeLabel.control).toBe(host(native.container))

    const custom = mount('button', {
      as: 'div',
      children: [<span id="button-forms-31-name">Custom label</span>, 'Go'],
      id: 'button-forms-31-custom',
      'aria-labelledby': 'button-forms-31-name',
    })
    const customLabel = createLabel('Custom')
    customLabel.htmlFor = 'button-forms-31-custom'
    expect(customLabel.control).toBe(null)
    expect(host(custom.container)).toHaveAccessibleName('Custom label')
  })

  spec('button.forms.32', () => {
    const m = mount('button', { children: 'Go' })
    formWith(m.container)
    const el = host(m.container)
    el.focus()

    expect(fireEvent.keyDown(el, { key: 'Enter' })).toBe(false)
    expect(fireEvent.keyUp(el, { key: 'Enter' })).toBe(false)
    expect(fireEvent.keyDown(el, { key: ' ' })).toBe(false)
    expect(fireEvent.keyUp(el, { key: ' ' })).toBe(false)
  })

  spec('button.forms.33', () => {
    const m = mount('button', { children: 'Go', type: 'submit' })
    formWith(m.container)
    const el = host(m.container)
    el.focus()

    expect(fireEvent.keyDown(el, { key: 'Enter' })).toBe(true)
    expect(fireEvent.keyUp(el, { key: ' ' })).toBe(true)
  })

  spec('button.forms.34', async () => {
    const user = userEvent.setup()
    const m = mount('button', { children: 'Go', type: 'submit' })
    const form = formWith(m.container)
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const reset = vi.fn()
    form.addEventListener('submit', submit)
    form.addEventListener('reset', reset)

    host(m.container).focus()
    await user.keyboard(' ')
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)

    m.setProps({ type: 'reset' })
    host(m.container).focus()
    await user.keyboard(' ')
    await m.settle()
    expect(reset).toHaveBeenCalledTimes(1)
  })

  spec.todo('button.forms.35')

  spec.todo('button.forms.36')

  spec('button.forms.37', () => {
    const form = createForm('button-forms-37')
    const m = mount('button', {
      children: 'Go',
      type: 'submit',
      form: 'button-forms-37',
      formmethod: 'post',
    })
    const el = buttonHost(m.container)
    expect(el).toHaveAttribute('form', 'button-forms-37')
    expect(el).toHaveAttribute('formmethod', 'post')
    expect(el.form).toBe(form)
  })
})
