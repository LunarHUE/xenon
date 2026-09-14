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

describe('checkbox state', () => {
  spec.todo('checkbox.state.1')

  spec.todo('checkbox.state.2')

  spec.todo('checkbox.state.3')

  spec.todo('checkbox.state.4')

  spec('checkbox.state.5', async () => {
    const plain = mount('checkbox', {})
    expect(inputHost(plain.container).indeterminate).toBe(false)
    plain.unmount()

    const m = mount('checkbox', { indeterminate: true })
    const el = inputHost(m.container)
    expect(el.indeterminate).toBe(true)
    expect(el.checked).toBe(false)
    expect(el).not.toHaveAttribute('indeterminate')
    expect(el.matches(':indeterminate')).toBe(true)

    m.setProps({ checked: true })
    await m.settle()
    expect(el.indeterminate).toBe(true)
    expect(el.checked).toBe(true)

    m.setProps({ indeterminate: false })
    await m.settle()
    expect(el.indeterminate).toBe(false)
    expect(el.matches(':indeterminate')).toBe(false)
    expect(el.checked).toBe(true)
  })

  spec('checkbox.state.6', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { onCheckedChange })
    const el = screen.getByRole('checkbox')
    expect(el).not.toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()

    await user.click(el)
    await m.settle()
    expect(el).toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    await user.click(el)
    await m.settle()
    expect(el).not.toBeChecked()
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(onCheckedChange).toHaveBeenCalledTimes(2)
  })

  spec('checkbox.state.7', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { defaultChecked: true, onCheckedChange })
    const el = screen.getByRole('checkbox')
    expect(el).toBeChecked()
    expect(el).toHaveAttribute('data-state', 'checked')
    expect(el).toHaveAttribute('data-checked', '')
    expect(onCheckedChange).not.toHaveBeenCalled()

    await user.click(el)
    await m.settle()
    expect(el).not.toBeChecked()
    expect(el).toHaveAttribute('data-state', 'unchecked')
    expect(el).not.toHaveAttribute('data-checked')
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  spec('checkbox.state.8', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { checked: false, onCheckedChange })
    const el = screen.getByRole('checkbox')

    await user.click(el)
    await m.settle()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(el).not.toBeChecked()
    expect(el).toHaveAttribute('data-state', 'unchecked')

    m.setProps({ checked: true })
    await m.settle()
    await user.click(el)
    await m.settle()
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(el).toBeChecked()
    expect(el).toHaveAttribute('data-state', 'checked')
  })

  spec('checkbox.state.9', async () => {
    const m = mount('checkbox', { as: 'button', name: 'agree', checked: false })
    const el = host(m.container)
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(backingInput(m.container).checked).toBe(false)

    m.setProps({ checked: true })
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'true')
    expect(el).toHaveAttribute('data-state', 'checked')
    expect(backingInput(m.container).checked).toBe(true)

    m.setProps({ checked: false })
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(backingInput(m.container).checked).toBe(false)
  })

  spec('checkbox.state.10', async () => {
    const user = userEvent.setup()
    let bound = false
    const m = mount('checkbox', { checked: bound })
    m.setProps({
      onCheckedChange: (next: boolean) => {
        bound = next
        m.setProps({ checked: bound })
      },
    })
    const el = screen.getByRole('checkbox')

    await user.click(el)
    await m.settle()
    expect(bound).toBe(true)
    expect(el).toBeChecked()

    await user.click(el)
    await m.settle()
    expect(bound).toBe(false)
    expect(el).not.toBeChecked()
  })

  spec('checkbox.state.11', () => {
    const m = mount('checkbox', { indeterminate: true })
    const el = inputHost(m.container)
    expect(el.indeterminate).toBe(true)
    expect(el.checked).toBe(false)
    expect(el).toHaveAttribute('data-state', 'indeterminate')
    expect(el).toHaveAttribute('data-indeterminate', '')
    expect(el).not.toHaveAttribute('data-checked')
  })

  spec.todo('checkbox.state.12')

  spec('checkbox.state.13', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('checkbox', { as: 'button', checked: false, onCheckedChange })
    const el = host(m.container)

    await user.click(el)
    await m.settle()
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(el).toHaveAttribute('data-state', 'unchecked')

    m.setProps({ checked: true })
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'true')
    expect(el).toHaveAttribute('data-state', 'checked')
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
  })

  spec('checkbox.state.14', async () => {
    const user = userEvent.setup()
    const bound = { first: false, second: false }
    let linked = true
    const first = mount('checkbox', { checked: false })
    const second = mount('checkbox', { checked: false })
    const set = (key: 'first' | 'second', next: boolean) => {
      bound[key] = next
      if (linked) {
        bound.first = next
        bound.second = next
      }
      first.setProps({ checked: bound.first })
      second.setProps({ checked: bound.second })
    }
    first.setProps({ onCheckedChange: (next: boolean) => set('first', next) })
    second.setProps({ onCheckedChange: (next: boolean) => set('second', next) })

    await user.click(inputHost(first.container))
    await first.settle()
    expect(inputHost(first.container)).toBeChecked()
    expect(inputHost(second.container)).toBeChecked()

    linked = false
    await user.click(inputHost(second.container))
    await second.settle()
    expect(inputHost(second.container)).not.toBeChecked()
    expect(inputHost(first.container)).toBeChecked()
  })

  spec('checkbox.state.15', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    let checked = false
    const m = mount('checkbox', { indeterminate: true, checked })
    m.setProps({
      onCheckedChange: (next: boolean) => {
        onCheckedChange(next)
        checked = next
        m.setProps({ checked })
      },
    })
    const el = inputHost(m.container)

    await user.click(el)
    await m.settle()
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(el.checked).toBe(true)
    expect(el.indeterminate).toBe(true)
    expect(el).toHaveAttribute('data-state', 'indeterminate')

    await user.click(el)
    await m.settle()
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
    expect(el.checked).toBe(false)
    expect(el.indeterminate).toBe(true)
  })

  spec.skip(
    'checkbox.state.16',
    'indeterminate is a sticky flag, not the third value in the cycle',
    async () => {
      const user = userEvent.setup()
      const onIndeterminateChange = vi.fn()
      const m = mount('checkbox', { as: 'button', indeterminate: true, onIndeterminateChange })
      const el = host(m.container)
      expect(el).toHaveAttribute('data-state', 'indeterminate')

      await user.click(el)
      await m.settle()
      expect(onIndeterminateChange).toHaveBeenCalledWith(false)
      expect(el).toHaveAttribute('data-state', 'checked')

      await user.click(el)
      await m.settle()
      expect(el).toHaveAttribute('data-state', 'unchecked')
    }
  )
})
