import type { SwitchProps } from '../harness'
import { fireEvent, screen } from '@testing-library/dom'
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

describe('switch keyboard', () => {
  spec('switch.keyboard.1', async () => {
    const user = userEvent.setup()
    for (const as of ['button', 'div'] as const) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { as, children: 'Lights', onCheckedChange })
      const el = host(m.container)
      el.focus()

      await user.keyboard(' ')
      await m.settle()
      expect(el).toHaveAttribute('aria-checked', 'true')

      await user.keyboard(' ')
      await m.settle()
      expect(el).toHaveAttribute('aria-checked', 'false')
      expect(onCheckedChange.mock.calls).toEqual([[true], [false]])
      m.unmount()
    }

    const native = mount('switch', { 'aria-label': 'Lights' })
    const input = host(native.container)
    input.focus()
    await user.keyboard(' ')
    await native.settle()
    expect(input).toBeChecked()

    await user.keyboard(' ')
    await native.settle()
    expect(input).not.toBeChecked()
  })

  spec('switch.keyboard.2', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { 'aria-label': 'Lights' })
    const el = host(m.container)
    if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
    el.focus()

    expect(fireEvent.keyDown(el, { key: ' ' })).toBe(true)
    expect(fireEvent.keyUp(el, { key: ' ' })).toBe(true)

    await user.keyboard(' ')
    await m.settle()
    expect(el.checked).toBe(true)
  })

  spec('switch.keyboard.3', async () => {
    const user = userEvent.setup()
    mount('switch', { 'aria-label': 'first' })
    mount('switch', { as: 'button', children: 'second' })
    mount('switch', { as: 'div', children: 'third' })

    await user.tab()
    expect(screen.getByRole('switch', { name: 'first' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('switch', { name: 'second' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('switch', { name: 'third' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('switch', { name: 'third' })).not.toHaveFocus()
  })

  spec('switch.keyboard.4', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, readonly: true, onCheckedChange })
      const el = host(m.container)
      el.focus()
      expect(el).toHaveFocus()

      await user.keyboard(' ')
      await m.settle()
      expect(el).not.toBeChecked()
      expect(onCheckedChange).not.toHaveBeenCalled()
      m.unmount()
    }
  })

  spec.todo('switch.keyboard.5')

  spec.todo('switch.keyboard.6')

  spec.skip(
    'switch.keyboard.7',
    'Enter never toggles a switch; switch.keyboard.8 is adopted',
    async () => {
      const user = userEvent.setup()
      const onCheckedChange = vi.fn()
      const m = mount('switch', { as: 'button', children: 'Lights', onCheckedChange })
      const el = host(m.container)
      el.focus()

      await user.keyboard('{Enter}')
      await m.settle()
      expect(el).toHaveAttribute('aria-checked', 'true')
      expect(onCheckedChange).toHaveBeenCalledWith(true)
    }
  )

  spec('switch.keyboard.8', async () => {
    const user = userEvent.setup()
    for (const base of hosts) {
      const onCheckedChange = vi.fn()
      const m = mount('switch', { ...base, onCheckedChange })
      const el = host(m.container)
      el.focus()

      await user.keyboard('{Enter}')
      await m.settle()
      expect(onCheckedChange).not.toHaveBeenCalled()
      expect(el).not.toBeChecked()
      m.unmount()
    }
  })
})
