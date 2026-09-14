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

function formWith(...containers: HTMLElement[]): HTMLFormElement {
  const form = document.createElement('form')
  document.body.appendChild(form)
  extras.add(form)
  for (const container of containers) form.appendChild(container)
  return form
}

describe('checkbox notes', () => {
  spec('checkbox.notes.1', () => {
    const box = mount('checkbox', {
      as: 'button',
      indeterminate: true,
      'aria-label': 'Include docs',
    })
    const boxEl = host(box.container)
    expect(boxEl).toHaveAttribute('role', 'checkbox')
    expect(boxEl).toHaveAttribute('aria-checked', 'mixed')
    expect(boxEl).toHaveAttribute('data-state', 'indeterminate')

    const toggle = mount('switch', { as: 'button', indeterminate: true, 'aria-label': 'Lights' })
    const toggleEl = host(toggle.container)
    expect(toggleEl).toHaveAttribute('role', 'switch')
    expect(toggleEl).toHaveAttribute('aria-checked', 'false')
    expect(toggleEl).toHaveAttribute('data-state', 'unchecked')
  })

  spec('checkbox.notes.2', () => {
    const first = mount('checkbox', { name: 'ship', 'aria-label': 'Ship it' })
    const second = mount('checkbox', { name: 'tell', 'aria-label': 'Tell me' })

    for (const m of [first, second]) {
      expect(m.container.querySelector('[role="group"]')).toBe(null)
      expect(host(m.container).closest('[role="group"]')).toBe(null)
    }
  })

  spec.todo('checkbox.notes.3')

  spec.todo('checkbox.notes.4')

  spec('checkbox.notes.5', async () => {
    const refs: string[] = []
    const m = mount('checkbox', {
      as: 'button',
      name: 'agree',
      checked: false,
      'aria-label': 'Agree',
      ref: (el: HTMLElement) => {
        refs.push(el.tagName)
        el.focus()
        el.blur()
        el.click()
      },
    })

    await m.settle()
    expect(refs).toEqual(['BUTTON'])
    expect(host(m.container)).toHaveAttribute('aria-checked', 'false')
    expect(backingInput(m.container).checked).toBe(false)
  })

  spec('checkbox.notes.6', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { name: 'agree', disabled: true, onCheckedChange })
    const el = inputHost(m.container)
    const clicks = vi.fn()
    el.addEventListener('click', clicks)

    fireEvent.click(el)
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(el).not.toBeChecked()

    await user.click(el)
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  spec('checkbox.notes.7', async () => {
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { name: 'agree', checked: false, onCheckedChange })
    const el = inputHost(m.container)

    fireEvent.click(el)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(el.checked).toBe(true)

    await m.settle()
    expect(el.checked).toBe(false)
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
  })

  spec('checkbox.notes.8', () => {
    const box = mount('checkbox', {
      as: 'button',
      name: 'agree',
      value: 'yes',
      required: true,
      defaultChecked: true,
      'aria-label': 'Agree',
    })
    const toggle = mount('switch', {
      as: 'button',
      name: 'lights',
      value: 'on',
      required: true,
      defaultChecked: true,
      'aria-label': 'Lights',
    })
    const form = formWith(box.container, toggle.container)

    for (const m of [box, toggle]) {
      const backing = backingInput(m.container)
      expect(backing.type).toBe('checkbox')
      expect(backing.required).toBe(true)
      expect(backing.checked).toBe(true)
      expect(backing).toHaveAttribute('aria-hidden', 'true')
      expect(backing).toHaveAttribute('tabindex', '-1')
    }

    expect(Array.from(new FormData(form))).toEqual([
      ['agree', 'yes'],
      ['lights', 'on'],
    ])
  })

  spec.skip(
    'checkbox.notes.9',
    'the hidden input mirrors props without emitting change events',
    async () => {
      const m = mount('checkbox', { as: 'button', name: 'agree', value: 'yes' })
      const backing = backingInput(m.container)
      const changes = vi.fn()
      backing.addEventListener('change', changes)

      m.setProps({ value: 'no' })
      await m.settle()
      expect(backing.value).toBe('no')
      expect(changes).toHaveBeenCalledTimes(1)

      m.setProps({ name: 'terms', disabled: true, required: true })
      await m.settle()
      expect(backing.name).toBe('terms')
      expect(backing.disabled).toBe(true)
      expect(backing.required).toBe(true)
    }
  )
})
