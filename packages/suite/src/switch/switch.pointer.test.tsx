import type { SwitchProps } from '../harness'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

const hosts: SwitchProps[] = [
  { 'aria-label': 'Lights' },
  { as: 'button', children: 'Lights' },
  { as: 'div', children: 'Lights' },
]

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

function labelFor(id: string, text: string): HTMLLabelElement {
  const label = document.createElement('label')
  label.htmlFor = id
  label.textContent = text
  document.body.appendChild(label)
  extras.add(label)
  return label
}

function wrappingLabel(container: HTMLElement): HTMLLabelElement {
  const label = document.createElement('label')
  document.body.appendChild(label)
  label.appendChild(container)
  extras.add(label)
  return label
}

describe('switch pointer', () => {
  spec('switch.pointer.1', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, onCheckedChange })
      const el = host(m.container)

      await user.click(el)
      await m.settle()
      expect(el).toBeChecked()

      await user.click(el)
      await m.settle()
      expect(el).not.toBeChecked()
      expect(onCheckedChange.mock.calls).toEqual([[true], [false]])
      m.unmount()
    }
  })

  spec('switch.pointer.2', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { 'aria-label': 'Lights' })
    const el = host(m.container)
    if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')

    const clicks: MouseEvent[] = []
    el.addEventListener('click', (event) => clicks.push(event))

    await user.click(el)
    await m.settle()
    expect(el.checked).toBe(true)
    expect(clicks).toHaveLength(1)
    expect(clicks[0]?.defaultPrevented).toBe(false)
  })

  spec('switch.pointer.3', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('switch', { id: 'switch-pointer-3', onCheckedChange })
    const el = host(m.container)
    const label = labelFor('switch-pointer-3', 'Lights')

    await user.click(label)
    await m.settle()
    expect(el).toBeChecked()
    expect(el).toHaveFocus()

    await user.click(label)
    await m.settle()
    expect(el).not.toBeChecked()
    expect(el).toHaveFocus()
    expect(onCheckedChange.mock.calls).toEqual([[true], [false]])
  })

  spec('switch.pointer.4', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('switch', { id: 'switch-pointer-4', disabled: true, onCheckedChange })
    const el = host(m.container)
    const label = labelFor('switch-pointer-4', 'Lights')

    await user.click(el)
    await user.click(label)
    await m.settle()
    expect(el).not.toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()

    const custom = mount('switch', {
      as: 'div',
      children: 'Lights',
      disabled: true,
      onCheckedChange,
    })
    await user.click(host(custom.container))
    await custom.settle()
    expect(host(custom.container)).not.toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  spec('switch.pointer.5', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, readonly: true, onCheckedChange })
      const el = host(m.container)
      const label = wrappingLabel(m.container)

      await user.click(el)
      await m.settle()
      expect(el).not.toBeChecked()

      await user.click(label)
      await m.settle()
      expect(el).not.toBeChecked()
      expect(onCheckedChange).not.toHaveBeenCalled()
      m.unmount()
    }

    const defaulted = mount('switch', {
      'aria-label': 'Lights',
      defaultChecked: true,
      readonly: true,
    })
    await user.click(host(defaulted.container))
    await defaulted.settle()
    expect(host(defaulted.container)).toBeChecked()
  })

  spec('switch.pointer.6', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onCheckedChange = vi.fn()
    for (const base of hosts) {
      const m = mount('switch', { ...base, onClick, onCheckedChange })
      const el = host(m.container)

      await user.click(el)
      await m.settle()
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onCheckedChange).toHaveBeenCalledWith(true)
      expect(el).toBeChecked()

      onClick.mockClear()
      onCheckedChange.mockClear()
      m.unmount()
    }
  })

  spec.todo('switch.pointer.7')

  spec('switch.pointer.8', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const text = document.createElement('span')
    text.id = 'switch-pointer-8'
    text.textContent = 'Lights'
    document.body.appendChild(text)
    extras.add(text)

    const m = mount('switch', {
      as: 'div',
      'aria-labelledby': 'switch-pointer-8',
      onCheckedChange,
    })
    const el = host(m.container)
    expect(el).toHaveAccessibleName('Lights')

    await user.click(text)
    await m.settle()
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(el).not.toBeChecked()
  })

  spec('switch.pointer.9', async () => {
    const user = userEvent.setup()
    for (const as of ['button', 'div'] as const) {
      const ancestor = vi.fn()
      const m = mount('switch', { as, children: 'Lights', name: 'lights' })
      const wrapper = document.createElement('div')
      document.body.appendChild(wrapper)
      wrapper.appendChild(m.container)
      wrapper.addEventListener('click', ancestor)
      extras.add(wrapper)
      const el = host(m.container)

      await user.click(el)
      await m.settle()
      expect(ancestor).toHaveBeenCalledTimes(1)
      expect(el).toBeChecked()
      expect(hidden(m.container).checked).toBe(true)

      m.setProps({ onClick: (event: MouseEvent) => event.stopPropagation() })
      await user.click(el)
      await m.settle()
      expect(ancestor).toHaveBeenCalledTimes(1)
      expect(el).not.toBeChecked()
      m.unmount()
    }
  })

  spec.skip(
    'switch.pointer.10',
    'a programmatic checked change dispatches no synthetic change event on the hidden input',
    () => {
      const ancestor = vi.fn()
      const change = vi.fn()
      const m = mount('switch', {
        as: 'button',
        children: 'Lights',
        name: 'lights',
        checked: false,
      })
      const form = document.createElement('form')
      document.body.appendChild(form)
      form.appendChild(m.container)
      form.addEventListener('click', ancestor)
      form.addEventListener('change', (event) => {
        const target = event.target
        change(target instanceof HTMLInputElement ? target.checked : null)
      })
      extras.add(form)

      m.setProps({ checked: true })
      expect(ancestor).not.toHaveBeenCalled()
      expect(change).toHaveBeenCalledWith(true)
    }
  )

  spec.skip(
    'switch.pointer.11',
    'the hidden input mirrors state one way; it drives nothing when clicked',
    async () => {
      const user = userEvent.setup()
      const onCheckedChange = vi.fn()
      const m = mount('switch', {
        as: 'button',
        children: 'Lights',
        name: 'lights',
        onCheckedChange,
      })

      await user.click(hidden(m.container))
      await m.settle()
      expect(onCheckedChange).toHaveBeenCalledWith(true)
      expect(host(m.container)).toBeChecked()
    }
  )

  spec('switch.pointer.12', async () => {
    const onCheckedChange = vi.fn()
    const m = mount('switch', { as: 'button', children: 'Lights', name: 'lights', onCheckedChange })
    const input = hidden(m.container)

    const event = new MouseEvent('click', { bubbles: true, cancelable: true })
    event.preventDefault()
    input.dispatchEvent(event)
    await m.settle()

    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(host(m.container)).not.toBeChecked()
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  spec.todo('switch.pointer.13')
})
