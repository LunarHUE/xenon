import type { SwitchProps } from '../harness'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

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

describe('switch state', () => {
  spec('switch.state.1', async () => {
    const user = userEvent.setup()
    const first = mount('switch', { 'aria-label': 'kitchen' })
    const second = mount('switch', { 'aria-label': 'hall' })

    await user.click(host(first.container))
    await first.settle()
    expect(host(first.container)).toBeChecked()
    expect(host(second.container)).not.toBeChecked()

    await user.click(host(second.container))
    await second.settle()
    expect(host(first.container)).toBeChecked()
    expect(host(second.container)).toBeChecked()
  })

  spec('switch.state.2', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, onCheckedChange })
      const el = host(m.container)
      await m.settle()
      expect(onCheckedChange).not.toHaveBeenCalled()
      expect(el).not.toBeChecked()
      expect(el).toHaveAttribute('data-state', 'unchecked')

      await user.click(el)
      await m.settle()
      expect(el).toBeChecked()
      expect(el).toHaveAttribute('data-state', 'checked')
      expect(onCheckedChange).toHaveBeenLastCalledWith(true)

      await user.click(el)
      await m.settle()
      expect(el).not.toBeChecked()
      expect(onCheckedChange).toHaveBeenLastCalledWith(false)
      expect(onCheckedChange).toHaveBeenCalledTimes(2)
      m.unmount()
    }
  })

  spec('switch.state.3', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, defaultChecked: true, onCheckedChange })
      const el = host(m.container)
      expect(el).toBeChecked()
      expect(el).toHaveAttribute('data-state', 'checked')

      await user.click(el)
      await m.settle()
      expect(el).not.toBeChecked()
      expect(el).toHaveAttribute('data-state', 'unchecked')
      expect(onCheckedChange.mock.calls).toEqual([[false]])
      m.unmount()
    }
  })

  spec('switch.state.4', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, checked: true, onCheckedChange })
      const el = host(m.container)

      await user.click(el)
      await m.settle()
      expect(el).toBeChecked()
      expect(el).toHaveAttribute('data-state', 'checked')
      expect(onCheckedChange.mock.calls).toEqual([[false]])
      m.unmount()
    }
  })

  spec('switch.state.5', () => {
    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, children: 'Lights', name: 'lights', checked: false })
      const el = host(m.container)
      expect(el).toHaveAttribute('aria-checked', 'false')
      expect(hidden(m.container).checked).toBe(false)

      m.setProps({ checked: true })
      expect(el).toHaveAttribute('aria-checked', 'true')
      expect(hidden(m.container).checked).toBe(true)

      m.setProps({ checked: false })
      expect(el).toHaveAttribute('aria-checked', 'false')
      expect(hidden(m.container).checked).toBe(false)
      m.unmount()
    }
  })

  spec('switch.state.10', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('switch', {
      'aria-label': 'Lights',
      defaultChecked: true,
      checked: false,
      onCheckedChange,
    })
    const el = host(m.container)
    expect(el).not.toBeChecked()
    expect(screen.getByRole('switch')).toHaveAttribute('data-state', 'unchecked')

    await user.click(el)
    await m.settle()
    expect(el).not.toBeChecked()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
