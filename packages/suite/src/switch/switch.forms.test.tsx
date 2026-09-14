import { fieldContract } from '../field/contract'
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

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
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

function entries(form: HTMLFormElement): [string, FormDataEntryValue][] {
  return Array.from(new FormData(form))
}

describe('switch forms', () => {
  spec('switch.forms.1', async () => {
    const user = userEvent.setup()
    const on = mount('switch', { 'aria-label': 'on', name: 'on', defaultChecked: true })
    const off = mount('switch', {
      'aria-label': 'off',
      name: 'off',
      disabled: true,
      defaultChecked: true,
    })
    const form = formWith(on.container, off.container)

    expect(inputHost(off.container).willValidate).toBe(false)
    expect(entries(form)).toEqual([['on', 'on']])

    await user.click(host(on.container))
    await on.settle()
    expect(entries(form)).toEqual([])

    const reset = vi.fn()
    form.addEventListener('reset', (event) => reset(event.bubbles, event.cancelable))
    const input = vi.fn()
    form.addEventListener('input', input)

    form.reset()
    expect(reset).toHaveBeenCalledWith(true, true)
    expect(input).not.toHaveBeenCalled()
    expect(inputHost(on.container).checked).toBe(true)

    form.addEventListener('reset', (event) => event.preventDefault())
    await user.click(host(on.container))
    await on.settle()
    form.reset()
    expect(inputHost(on.container).checked).toBe(false)
  })

  spec('switch.forms.2', () => {
    const plain = mount('switch', { 'aria-label': 'Lights', name: 'lights', defaultChecked: true })
    const valued = mount('switch', {
      'aria-label': 'Mode',
      name: 'mode',
      value: 'night',
      defaultChecked: true,
    })
    const form = formWith(plain.container, valued.container)
    expect(entries(form)).toEqual([
      ['lights', 'on'],
      ['mode', 'night'],
    ])

    const custom = mount('switch', {
      as: 'button',
      children: 'Lights',
      name: 'custom',
      defaultChecked: true,
    })
    const second = formWith(custom.container)
    expect(entries(second)).toEqual([['custom', 'on']])
  })

  spec('switch.forms.3', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { 'aria-label': 'Lights', name: 'lights' })
    const form = formWith(m.container)
    expect(entries(form)).toEqual([])

    await user.click(host(m.container))
    await m.settle()
    expect(entries(form)).toEqual([['lights', 'on']])

    m.setProps({ value: 'night' })
    expect(entries(form)).toEqual([['lights', 'night']])

    await user.click(host(m.container))
    await m.settle()
    expect(entries(form)).toEqual([])
  })

  spec('switch.forms.4', () => {
    const native = mount('switch', {
      'aria-label': 'Lights',
      name: 'lights',
      defaultChecked: true,
      disabled: true,
    })
    const custom = mount('switch', {
      as: 'button',
      children: 'Mode',
      name: 'mode',
      defaultChecked: true,
      disabled: true,
    })
    const form = formWith(native.container, custom.container)
    expect(entries(form)).toEqual([])
    expect(hidden(custom.container).disabled).toBe(true)
  })

  spec('switch.forms.5', async () => {
    const user = userEvent.setup()
    const owner = createForm('switch-forms-5')
    const m = mount('switch', { 'aria-label': 'Lights', name: 'lights', form: 'switch-forms-5' })
    const enclosing = formWith(m.container)
    const el = inputHost(m.container)

    expect(el.form).toBe(owner)
    await user.click(el)
    await m.settle()
    expect(entries(owner)).toEqual([['lights', 'on']])
    expect(entries(enclosing)).toEqual([])

    owner.reset()
    expect(el.checked).toBe(false)
  })

  spec('switch.forms.6', () => {
    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, children: 'Lights', name: 'lights', value: 'night' })
      const el = host(m.container)
      const input = hidden(m.container)

      expect(el.contains(input)).toBe(false)
      expect(el.nextElementSibling).toBe(input)
      expect(m.container.querySelector('button input')).toBe(null)
      expect(el).not.toHaveAttribute('name')
      expect(el).not.toHaveAttribute('value')
      expect(input).toHaveAttribute('name', 'lights')
      expect(input).toHaveAttribute('value', 'night')
      m.unmount()
    }
  })

  spec('switch.forms.7', async () => {
    const user = userEvent.setup()
    const uncontrolled = mount('switch', {
      'aria-label': 'Lights',
      name: 'lights',
      defaultChecked: true,
    })
    const form = formWith(uncontrolled.container)
    const el = inputHost(uncontrolled.container)

    await user.click(el)
    await uncontrolled.settle()
    expect(el.checked).toBe(false)

    form.reset()
    await uncontrolled.settle()
    expect(el.checked).toBe(true)
    uncontrolled.unmount()

    const controlled = mount('switch', { 'aria-label': 'Mode', name: 'mode', checked: true })
    const second = formWith(controlled.container)
    const fixed = inputHost(controlled.container)

    await user.click(fixed)
    await controlled.settle()
    expect(fixed.checked).toBe(true)

    second.reset()
    await controlled.settle()
    expect(fixed.checked).toBe(true)
  })

  spec('switch.forms.9', () => fieldContract('switch'))

  spec('switch.forms.17', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { 'aria-label': 'Lights', name: 'lights', value: 'night' })
    const form = formWith(m.container)
    expect(entries(form)).toEqual([])

    await user.click(host(m.container))
    await user.click(host(m.container))
    await m.settle()
    expect(entries(form)).toEqual([])

    const custom = mount('switch', { as: 'div', children: 'Mode', name: 'mode' })
    const second = formWith(custom.container)
    expect(entries(second)).toEqual([])
    expect(hidden(custom.container).checked).toBe(false)
  })

  spec('switch.forms.18', () => {
    for (const as of ['button', 'div'] as const) {
      const anonymous = mount('switch', { as, children: 'Lights' })
      expect(anonymous.container.querySelector('input')).toBe(null)

      const named = mount('switch', { as, children: 'Lights', name: 'lights' })
      expect(hidden(named.container)).toBeInstanceOf(HTMLInputElement)

      anonymous.unmount()
      named.unmount()
    }
  })
})
