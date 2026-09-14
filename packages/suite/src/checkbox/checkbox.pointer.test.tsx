import { screen } from '@testing-library/dom'
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

describe('checkbox pointer', () => {
  spec('checkbox.pointer.1', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    const m = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      defaultChecked: false,
      onCheckedChange: (next: boolean) => {
        seen.push(next)
      },
    })
    const el = screen.getByRole('checkbox')

    await user.click(el)
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'true')

    el.focus()
    await user.keyboard('[Space]')
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'false')

    await user.click(el)
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'true')
    expect(seen).toEqual([true, false, true])
  })

  spec('checkbox.pointer.2', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const during: [boolean, boolean][] = []
    const m = mount('checkbox', {
      'aria-label': 'Agree',
      defaultChecked: false,
      indeterminate: true,
      readonly: true,
      onCheckedChange: changes,
    })
    const box = input(m.container)
    await m.settle()
    expect(box.indeterminate).toBe(true)
    box.addEventListener('click', () => during.push([box.checked, box.indeterminate]))

    await user.click(box)
    await m.settle()
    expect(during).toEqual([[true, false]])
    expect(box.checked).toBe(false)
    expect(box.indeterminate).toBe(true)
    expect(changes).not.toHaveBeenCalled()
  })

  spec('checkbox.pointer.3', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const m = mount('checkbox', {
      id: 'checkbox-pointer-3',
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const label = addNode('<label for="checkbox-pointer-3">Agree</label>')
    const box = screen.getByRole('checkbox', { name: 'Agree' })

    await user.click(label)
    await m.settle()
    expect(box).toBeChecked()
    expect(changes).toHaveBeenCalledWith(true)

    await user.click(label)
    await m.settle()
    expect(box).not.toBeChecked()
    expect(changes).toHaveBeenLastCalledWith(false)
  })

  spec('checkbox.pointer.4', async () => {
    const user = userEvent.setup()
    const ancestor = vi.fn()
    const m = mount('checkbox', {
      as: 'button',
      children: 'Agree',
      name: 'agree',
      defaultChecked: false,
    })
    m.container.addEventListener('click', ancestor)
    await user.click(screen.getByRole('checkbox'))
    await m.settle()
    expect(ancestor).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(hidden(m.container).checked).toBe(true)
    m.unmount()

    const blocked = vi.fn()
    const changes = vi.fn()
    const native = mount('checkbox', {
      'aria-label': 'Agree',
      defaultChecked: false,
      onCheckedChange: changes,
    })
    native.container.addEventListener('click', blocked)
    const box = input(native.container)
    box.addEventListener('click', (event) => event.stopPropagation())

    await user.click(box)
    await native.settle()
    expect(blocked).not.toHaveBeenCalled()
    expect(box).toBeChecked()
    expect(changes).toHaveBeenCalledWith(true)
  })

  spec('checkbox.pointer.5', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const m = mount('checkbox', {
      id: 'checkbox-pointer-5',
      disabled: true,
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const label = addNode('<label for="checkbox-pointer-5">Agree</label>')
    const box = input(m.container)

    await user.click(box)
    await m.settle()
    expect(box).not.toBeChecked()

    await user.click(label)
    await m.settle()
    expect(box).not.toBeChecked()
    expect(changes).not.toHaveBeenCalled()
    m.unmount()

    const generic = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      disabled: true,
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const el = screen.getByRole('checkbox')
    await user.click(el)
    await generic.settle()
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(changes).not.toHaveBeenCalled()
  })

  spec('checkbox.pointer.6', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const m = mount('checkbox', {
      id: 'checkbox-pointer-6',
      readonly: true,
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const label = addNode('<label for="checkbox-pointer-6">Agree</label>')
    const box = input(m.container)

    await user.click(box)
    await m.settle()
    expect(box).not.toBeChecked()

    await user.click(label)
    await m.settle()
    expect(box).not.toBeChecked()
    expect(changes).not.toHaveBeenCalled()
    m.unmount()

    const generic = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      readonly: true,
      defaultChecked: false,
      onCheckedChange: changes,
    })
    const el = screen.getByRole('checkbox')
    await user.click(el)
    await generic.settle()
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(changes).not.toHaveBeenCalled()
  })

  spec('checkbox.pointer.7', async () => {
    const user = userEvent.setup()
    const seen: boolean[] = []
    const m = mount('checkbox', {
      defaultChecked: false,
      onCheckedChange: (next: boolean) => {
        seen.push(next)
      },
    })
    const wrapper = addNode('<label>Agree</label>')
    wrapper.append(m.container)
    const box = input(m.container)

    await user.click(box)
    await m.settle()
    expect(box).toBeChecked()

    await user.click(box)
    await m.settle()
    expect(box).not.toBeChecked()
    expect(seen).toEqual([true, false])
  })

  spec('checkbox.pointer.8', async () => {
    const ancestor = vi.fn()
    const changes = vi.fn()
    const m = mount('checkbox', {
      as: 'button',
      children: 'Agree',
      name: 'agree',
      checked: false,
      onCheckedChange: changes,
    })
    m.container.addEventListener('click', ancestor)

    m.setProps({ checked: true })
    await m.settle()
    expect(ancestor).not.toHaveBeenCalled()
    expect(changes).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(hidden(m.container).checked).toBe(true)
  })

  spec.todo('checkbox.pointer.9')

  spec.skip(
    'checkbox.pointer.10',
    'the hidden input mirrors state but is not wired for direct clicks',
    async () => {
      const user = userEvent.setup()
      const m = mount('checkbox', {
        as: 'div',
        children: 'Agree',
        name: 'agree',
        defaultChecked: false,
      })
      await user.click(hidden(m.container))
      await m.settle()
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    }
  )

  spec('checkbox.pointer.11', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    const m = mount('checkbox', {
      'aria-label': 'Agree',
      defaultChecked: false,
      onCheckedChange: changes,
      onClick: (event: MouseEvent) => event.preventDefault(),
    })
    const box = input(m.container)

    await user.click(box)
    await m.settle()
    expect(box).not.toBeChecked()
    expect(changes).not.toHaveBeenCalled()
  })

  spec('checkbox.pointer.12', async () => {
    const user = userEvent.setup()
    const changes = vi.fn()
    let shift: boolean | undefined
    const m = mount('checkbox', {
      'aria-label': 'Agree',
      defaultChecked: false,
      onCheckedChange: changes,
      onClick: (event: MouseEvent) => {
        shift = event.shiftKey
      },
    })
    const box = input(m.container)

    await user.keyboard('{Shift>}')
    await user.click(box)
    await user.keyboard('{/Shift}')
    await m.settle()

    expect(changes).toHaveBeenCalledTimes(1)
    expect(changes).toHaveBeenCalledWith(true)
    expect(shift).toBe(true)
    expect(box).toBeChecked()
  })
})
