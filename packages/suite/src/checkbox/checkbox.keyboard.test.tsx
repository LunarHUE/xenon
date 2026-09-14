import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function input(container: HTMLElement): HTMLInputElement {
  const el = host(container)
  if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
  return el
}

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[type="checkbox"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

describe('checkbox keyboard', () => {
  spec('checkbox.keyboard.1', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []

    for (const as of ['button', 'div'] as const) {
      const m = mount('checkbox', {
        as,
        children: 'Agree',
        defaultChecked: false,
        onCheckedChange: (next: boolean) => {
          seen.push(next)
        },
      })
      const el = screen.getByRole('checkbox')
      el.focus()
      await user.keyboard('[Space]')
      await m.settle()
      expect(el).toHaveAttribute('aria-checked', 'true')
      await user.keyboard('[Space]')
      await m.settle()
      expect(el).toHaveAttribute('aria-checked', 'false')
      m.unmount()
    }
    expect(seen).toEqual([true, false, true, false])

    const native = mount('checkbox', { 'aria-label': 'Agree', defaultChecked: false })
    const box = input(native.container)
    box.focus()
    await user.keyboard('[Space]')
    await native.settle()
    expect(box).toBeChecked()
    await user.keyboard('[Space]')
    await native.settle()
    expect(box).not.toBeChecked()
  })

  spec('checkbox.keyboard.2', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const m = mount('checkbox', {
      'aria-label': 'Agree',
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const el = input(m.container)

    el.focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(el).not.toBeChecked()
    expect(changes).not.toHaveBeenCalled()

    await user.keyboard('[Space]')
    await m.settle()
    expect(el).toBeChecked()
    expect(changes).toHaveBeenCalledTimes(1)
  })

  spec('checkbox.keyboard.3', async () => {
    const user = userEvent.setup()
    mount('checkbox', { 'aria-label': 'one' })
    mount('checkbox', { as: 'button', children: 'two' })
    mount('checkbox', { as: 'div', children: 'three' })
    const one = screen.getByRole('checkbox', { name: 'one' })
    const two = screen.getByRole('checkbox', { name: 'two' })
    const three = screen.getByRole('checkbox', { name: 'three' })

    await user.tab()
    expect(one).toHaveFocus()
    await user.tab()
    expect(two).toHaveFocus()
    await user.tab()
    expect(three).toHaveFocus()
    await user.tab({ shift: true })
    expect(two).toHaveFocus()
  })

  spec('checkbox.keyboard.4', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const m = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      name: 'agree',
      readonly: true,
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const el = screen.getByRole('checkbox')
    el.focus()
    await user.keyboard('[Space]')
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(el).toHaveAttribute('data-state', 'unchecked')
    expect(hidden(m.container).checked).toBe(false)
    expect(changes).not.toHaveBeenCalled()
    m.unmount()

    const native = mount('checkbox', {
      'aria-label': 'Agree',
      readonly: true,
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const box = input(native.container)
    box.focus()
    await user.keyboard('[Space]')
    await native.settle()
    expect(box).not.toBeChecked()
    expect(changes).not.toHaveBeenCalled()
  })

  spec('checkbox.keyboard.7', async () => {
    const user = userEvent.setup()
    for (const as of ['button', 'div'] as const) {
      const changes = vi.fn()
      const m = mount('checkbox', {
        as,
        children: 'Agree',
        defaultChecked: false,
        onCheckedChange: changes,
      })
      const el = screen.getByRole('checkbox')
      el.focus()
      await user.keyboard('{Enter}')
      await m.settle()
      expect(el).toHaveAttribute('aria-checked', 'false')
      expect(changes).not.toHaveBeenCalled()
      m.unmount()
    }
  })
})
