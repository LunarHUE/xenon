import { Checkbox, Field } from '@tenon/solid'
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

function backingInput(container: HTMLElement): HTMLInputElement {
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

function keys(form: HTMLFormElement): string[] {
  return Array.from(new FormData(form).keys())
}

describe('checkbox forms', () => {
  spec('checkbox.forms.1', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { name: 'agree' })
    const form = formWith(m.container)
    const seen: { type: string; bubbles: boolean }[] = []
    for (const type of ['input', 'change']) {
      form.addEventListener(type, (event) =>
        seen.push({ type: event.type, bubbles: event.bubbles })
      )
    }

    await user.click(inputHost(m.container))
    await m.settle()
    expect(seen).toEqual([
      { type: 'input', bubbles: true },
      { type: 'change', bubbles: true },
    ])
  })

  spec('checkbox.forms.2', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { name: 'agree', required: true })
    formWith(m.container)
    const el = inputHost(m.container)
    expect(el).toBeRequired()
    expect(el).not.toHaveAttribute('aria-required')
    expect(el.validity.valueMissing).toBe(true)
    expect(el.validity.valid).toBe(false)

    await user.click(el)
    await m.settle()
    expect(el.validity.valueMissing).toBe(false)
    expect(el.validity.valid).toBe(true)
  })

  spec('checkbox.forms.3', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { name: 'agree' })
    const form = formWith(m.container)
    const el = inputHost(m.container)
    const inputs: string[] = []
    el.addEventListener('input', () => inputs.push('input'))

    await user.click(el)
    await m.settle()
    expect(el).toBeChecked()
    expect(inputs).toEqual(['input'])

    let reset: Event | undefined
    form.addEventListener('reset', (event) => {
      reset = event
    })
    form.reset()
    await m.settle()
    expect(reset?.bubbles).toBe(true)
    expect(reset?.cancelable).toBe(true)
    expect(el).not.toBeChecked()
    expect(inputs).toEqual(['input'])

    await user.click(el)
    await m.settle()
    form.addEventListener('reset', (event) => event.preventDefault())
    form.reset()
    await m.settle()
    expect(el).toBeChecked()
  })

  spec('checkbox.forms.4', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { name: 'agree', defaultChecked: true })
    const form = formWith(m.container)
    const el = inputHost(m.container)
    const initial = Array.from(new FormData(form))
    expect(initial).toEqual([['agree', 'on']])

    await user.click(el)
    await m.settle()
    expect(el).not.toBeChecked()
    expect(keys(form)).toEqual([])

    form.reset()
    await m.settle()
    expect(el).toBeChecked()
    expect(Array.from(new FormData(form))).toEqual(initial)
  })

  spec('checkbox.forms.5', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', {
      name: 'agree',
      defaultChecked: true,
      disabled: true,
      onCheckedChange,
    })
    const form = formWith(m.container)
    const el = inputHost(m.container)

    expect(el.willValidate).toBe(false)
    expect(keys(form)).toEqual([])

    await user.click(el)
    await m.settle()
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(el).toBeChecked()

    el.checked = false
    expect(el.checked).toBe(false)
  })

  spec('checkbox.forms.6', () => {
    const form = createForm()
    const fieldset = document.createElement('fieldset')
    fieldset.disabled = true
    const legend = document.createElement('legend')
    const nested = document.createElement('fieldset')
    fieldset.append(legend, nested)
    form.appendChild(fieldset)

    const inside = mount('checkbox', { name: 'inside', defaultChecked: true })
    nested.appendChild(inside.container)
    const inLegend = mount('checkbox', { name: 'legend', defaultChecked: true })
    legend.appendChild(inLegend.container)

    expect(inputHost(inside.container).matches(':disabled')).toBe(true)
    expect(inputHost(inLegend.container).matches(':disabled')).toBe(false)
    expect(keys(form)).toEqual(['legend'])
  })

  spec('checkbox.forms.7', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { as: 'div', disabled: true, onCheckedChange })
    const el = host(m.container)
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toHaveAttribute('disabled')
    expect(el.matches(':disabled')).toBe(false)
    expect('willValidate' in el).toBe(false)
    expect(el).not.toHaveAttribute('tabindex')

    await user.click(el)
    await m.settle()
    expect(onCheckedChange).not.toHaveBeenCalled()

    el.focus()
    expect(el).not.toHaveFocus()
  })

  spec('checkbox.forms.8', () => {
    const m = mount('checkbox', { name: 'agree' })
    const el = inputHost(m.container)
    expect(el.form).toBe(null)

    const ancestor = formWith(m.container)
    expect(el.form).toBe(ancestor)

    const owner = createForm('checkbox-forms-8')
    m.setProps({ form: 'checkbox-forms-8' })
    expect(el.form).toBe(owner)

    m.setProps({ form: undefined })
    expect(el.form).toBe(ancestor)

    document.body.appendChild(m.container)
    expect(el.form).toBe(null)
  })

  spec('checkbox.forms.12', () => {
    const native = mount('checkbox', { name: 'native' })
    const custom = mount('checkbox', { as: 'div' })
    const form = formWith(native.container, custom.container)
    const nativeEl = inputHost(native.container)
    const customEl = host(custom.container)

    expect(Array.from(form.elements)).toContain(nativeEl)
    expect(Array.from(form.elements)).not.toContain(customEl)
    expect('form' in customEl).toBe(false)
    expect(nativeEl.form).toBe(form)
  })

  spec('checkbox.forms.14', () => {
    const plain = mount('checkbox', { name: 'agree', defaultChecked: true })
    const custom = mount('checkbox', { name: 'tier', value: 'pro', defaultChecked: true })
    const form = formWith(plain.container, custom.container)
    const data = new FormData(form)
    expect(data.get('agree')).toBe('on')
    expect(data.get('tier')).toBe('pro')
    expect(inputHost(plain.container)).not.toHaveAttribute('value')
  })

  spec('checkbox.forms.15', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { name: 'agree' })
    const form = formWith(m.container)
    const el = inputHost(m.container)
    expect(new FormData(form).get('agree')).toBe(null)
    expect(new FormData(form).getAll('agree')).toEqual([])

    await user.click(el)
    await m.settle()
    expect(new FormData(form).get('agree')).toBe('on')

    m.setProps({ value: 'yes' })
    await m.settle()
    expect(new FormData(form).get('agree')).toBe('yes')
  })

  spec('checkbox.forms.16', async () => {
    const m = mount('checkbox', { name: 'agree', defaultChecked: true, disabled: true })
    const form = formWith(m.container)
    expect(keys(form)).toEqual([])

    m.setProps({ disabled: false })
    await m.settle()
    expect(new FormData(form).get('agree')).toBe('on')
  })

  spec('checkbox.forms.17', () => {
    const owner = createForm('checkbox-forms-17')
    const m = mount('checkbox', {
      name: 'agree',
      defaultChecked: true,
      form: 'checkbox-forms-17',
    })
    const enclosing = formWith(m.container)

    expect(inputHost(m.container).form).toBe(owner)
    expect(new FormData(owner).get('agree')).toBe('on')
    expect(keys(enclosing)).toEqual([])
  })

  spec('checkbox.forms.20', () => fieldContract('checkbox'))

  spec('checkbox.forms.22', () => {
    const m = mount('checkbox', { as: 'button', name: 'agree', defaultChecked: true })
    const el = host(m.container)
    const backing = backingInput(m.container)

    expect(el.tagName).toBe('BUTTON')
    expect(m.container.querySelector('button input')).toBe(null)
    expect(el.querySelector('input')).toBe(null)
    expect(backing.previousElementSibling).toBe(el)
    expect(backing.checked).toBe(true)

    const form = formWith(m.container)
    expect(new FormData(form).get('agree')).toBe('on')
  })

  spec('checkbox.forms.23', async () => {
    const user = userEvent.setup()
    let checked = false
    const m = mount('checkbox', { name: 'agree', indeterminate: true, checked })
    m.setProps({
      onCheckedChange: (next: boolean) => {
        checked = next
        m.setProps({ checked })
      },
    })
    const el = inputHost(m.container)
    expect(el.indeterminate).toBe(true)

    await user.click(el)
    await m.settle()
    expect(el.checked).toBe(true)
    expect(el.indeterminate).toBe(true)
  })

  spec('checkbox.forms.26', async () => {
    const m = mount('field', {
      name: 'account',
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Checkbox as="button" />
        </>
      ),
    })
    await m.settle()
    expect(m.container.querySelector('[role="checkbox"]')).not.toHaveAttribute('name')
    expect(m.container.querySelector('input')).toHaveAttribute('name', 'account')
  })

  spec('checkbox.forms.38', async () => {
    const user = userEvent.setup()
    const native = mount('checkbox', { name: 'agree' })
    const custom = mount('checkbox', { as: 'button', name: 'terms' })
    const form = formWith(native.container, custom.container)
    expect(keys(form)).toEqual([])

    await user.click(host(custom.container))
    await custom.settle()
    expect(keys(form)).toEqual(['terms'])

    await user.click(inputHost(native.container))
    await native.settle()
    expect(keys(form)).toEqual(['agree', 'terms'])
  })

  spec('checkbox.forms.39', () => {
    const anonymous = mount('checkbox', { as: 'button' })
    expect(anonymous.container.querySelector('input')).toBe(null)

    const named = mount('checkbox', { as: 'button', name: 'agree' })
    expect(backingInput(named.container).name).toBe('agree')

    const native = mount('checkbox', { name: 'agree' })
    expect(native.container.querySelectorAll('input')).toHaveLength(1)
  })

  spec('checkbox.forms.42', () => {
    const native = mount('checkbox', { name: 'agree', defaultChecked: true, disabled: true })
    const el = inputHost(native.container)
    expect(el.disabled).toBe(true)
    expect(el.matches(':disabled')).toBe(true)
    expect(el).not.toHaveAttribute('aria-disabled')
    expect(el.willValidate).toBe(false)
    el.focus()
    expect(el).not.toHaveFocus()

    const custom = mount('checkbox', { as: 'button', name: 'terms', disabled: true })
    expect(host(custom.container).matches(':disabled')).toBe(true)
    expect(backingInput(custom.container).disabled).toBe(true)
  })
})
