import type { CheckboxProps } from '../harness'
import { fireEvent } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished, vi } from 'vitest'

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

function addNode(html: string): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', html)
  const el = document.body.lastElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing added')
  onTestFinished(() => el.remove())
  return el
}

describe('checkbox focus management', () => {
  spec('checkbox.focus.1', async () => {
    const user = userEvent.setup()
    const hosts: CheckboxProps[] = [
      { 'aria-label': 'off' },
      { as: 'button', children: 'off' },
      { as: 'div', children: 'off' },
    ]

    for (const props of hosts) {
      const before = mount('checkbox', { 'aria-label': 'before' })
      const m = mount('checkbox', { ...props, disabled: true })
      const after = mount('checkbox', { 'aria-label': 'after' })
      const off = host(m.container)

      off.focus()
      expect(off).not.toHaveFocus()

      await user.click(off)
      expect(off).not.toHaveFocus()

      host(before.container).focus()
      await user.tab()
      expect(off).not.toHaveFocus()
      expect(host(after.container)).toHaveFocus()

      before.unmount()
      m.unmount()
      after.unmount()
    }
  })

  spec('checkbox.focus.2', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { as: 'button', children: 'Agree', name: 'agree' })
    const control = host(m.container)
    const box = hidden(m.container)

    expect(box).toHaveAttribute('tabindex', '-1')
    expect(box.tabIndex).toBe(-1)

    await user.tab()
    expect(control).toHaveFocus()
    await user.tab()
    expect(box).not.toHaveFocus()
  })

  spec('checkbox.focus.3', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { id: 'checkbox-focus-3' })
    const label = addNode('<label for="checkbox-focus-3">Agree</label>')
    const box = input(m.container)

    expect(document.activeElement).toBe(document.body)
    await user.click(label)
    await m.settle()
    expect(box).toHaveFocus()
    m.unmount()

    const off = mount('checkbox', { id: 'checkbox-focus-3-off', disabled: true })
    const offLabel = addNode('<label for="checkbox-focus-3-off">Agree</label>')
    expect(document.activeElement).toBe(document.body)

    await user.click(offLabel)
    await off.settle()
    expect(document.activeElement).toBe(document.body)
    expect(input(off.container)).not.toHaveFocus()
  })

  spec('checkbox.focus.4', async () => {
    const user = userEvent.setup()
    const m = mount('checkbox', { 'aria-label': 'Agree', readonly: true })
    const box = input(m.container)

    await user.tab()
    expect(box).toHaveFocus()

    await user.click(box)
    await m.settle()
    expect(box).toHaveFocus()
    m.unmount()

    const generic = mount('checkbox', { as: 'div', children: 'Agree', readonly: true })
    const el = host(generic.container)
    expect(el).toHaveAttribute('tabindex', '0')
    await user.tab()
    expect(el).toHaveFocus()
  })

  spec('checkbox.focus.5', async () => {
    const changes = vi.fn()
    const blurs = vi.fn()
    const m = mount('checkbox', {
      id: 'checkbox-focus-5',
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const label = addNode('<label for="checkbox-focus-5">Agree</label>')
    const box = input(m.container)
    box.addEventListener('blur', blurs)
    box.focus()

    for (let i = 0; i < 3; i++) {
      fireEvent.click(label)
      await m.settle()
    }

    expect(blurs).not.toHaveBeenCalled()
    expect(box).toHaveFocus()
    expect(changes).toHaveBeenCalledTimes(3)
    expect(box).toBeChecked()
  })

  spec('checkbox.focus.7', async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    const changes = vi.fn()
    const m = mount('checkbox', {
      id: 'checkbox-focus-7',
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const label = addNode('<label for="checkbox-focus-7">Agree</label>')
    const box = input(m.container)
    box.addEventListener('focus', () => seen.push('focus'))
    box.addEventListener('blur', () => seen.push('blur'))

    await user.click(label)
    await m.settle()

    fireEvent.click(label)
    await m.settle()

    expect(seen).toEqual(['focus'])
    expect(box).toHaveFocus()
    expect(changes).toHaveBeenCalledTimes(2)
    expect(box).not.toBeChecked()
  })
})
