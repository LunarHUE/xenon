import { fireEvent, screen } from '@testing-library/dom'
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

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

describe('switch notes and edge cases', () => {
  spec('switch.notes.1', () => {
    const m = mount('switch', { 'aria-label': 'Lights' })
    const el = host(m.container)
    expect(screen.getByRole('switch', { name: 'Lights' })).toBe(el)
    expect(screen.queryByRole('checkbox')).toBe(null)
    expect(el).toHaveAttribute('role', 'switch')
  })

  spec('switch.notes.2', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { 'aria-label': 'Lights' })
    const el = inputHost(m.container)
    expect(el).not.toHaveAttribute('aria-checked')

    el.focus()
    expect(fireEvent.keyDown(el, { key: ' ' })).toBe(true)
    expect(fireEvent.keyDown(el, { key: 'Enter' })).toBe(true)

    await user.keyboard(' ')
    await m.settle()
    expect(el.checked).toBe(true)
    expect(el).not.toHaveAttribute('aria-checked')
  })

  spec('switch.notes.3', async () => {
    const onCheckedChange = vi.fn()
    let threw: unknown
    const m = mount('switch', {
      as: 'button',
      children: 'Lights',
      name: 'lights',
      onCheckedChange,
      ref: (el: HTMLElement) => {
        try {
          el.focus()
          el.blur()
          el.click()
        } catch (error) {
          threw = error
        }
      },
    })
    await m.settle()

    expect(threw).toBeUndefined()
    expect(host(m.container)).not.toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  spec.todo('switch.notes.4')

  spec('switch.notes.5', () => {
    const onCheckedChange = vi.fn()
    const m = mount('switch', { 'aria-label': 'Lights', checked: false, onCheckedChange })
    expect(host(m.container)).not.toBeChecked()
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  spec.todo('switch.notes.6')

  spec('switch.notes.7', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const controlled = mount('switch', { 'aria-label': 'Lights', checked: false, onCheckedChange })
    const el = inputHost(controlled.container)

    fireEvent.click(el)
    expect(el.checked).toBe(true)
    expect(onCheckedChange).toHaveBeenCalledWith(true)

    await controlled.settle()
    expect(el.checked).toBe(false)
    controlled.unmount()

    const blocked = vi.fn()
    const off = mount('switch', { 'aria-label': 'Off', disabled: true, onCheckedChange: blocked })
    const dispatched = vi.fn()
    const offEl = inputHost(off.container)
    offEl.addEventListener('click', dispatched)

    fireEvent.click(offEl)
    await off.settle()
    expect(dispatched).toHaveBeenCalledTimes(1)
    expect(offEl.checked).toBe(false)
    expect(blocked).not.toHaveBeenCalled()

    await user.click(offEl)
    await off.settle()
    expect(blocked).not.toHaveBeenCalled()
  })

  spec('switch.notes.8', () => {
    const m = mount('switch', {
      as: 'button',
      children: 'Lights',
      name: 'lights',
      'data-testid': 'lights',
      'data-tone': 'quiet',
    })
    const el = host(m.container)
    expect(screen.getByTestId('lights')).toBe(el)
    expect(el).toHaveAttribute('data-tone', 'quiet')
    expect(hidden(m.container)).not.toHaveAttribute('data-tone')
    expect(hidden(m.container)).not.toHaveAttribute('data-testid')
  })
})
