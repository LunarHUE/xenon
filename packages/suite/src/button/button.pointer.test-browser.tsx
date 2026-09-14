import type { ButtonProps } from '../harness'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('button pointer in a browser', () => {
  spec('button.pointer.7', async () => {
    const user = userEvent.setup()
    const onMouseMove = vi.fn()
    const onClick = vi.fn()
    const m = mount('button', {
      children: 'Go',
      as: 'div',
      disabled: true,
      onMouseMove,
      onClick,
    })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('data-disabled', '')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toHaveAttribute('disabled')

    await user.hover(el)
    await m.settle()
    expect(onMouseMove).toHaveBeenCalled()

    await user.click(el)
    await m.settle()
    expect(onClick).not.toHaveBeenCalled()
  })

  spec('button.pointer.8', async () => {
    const user = userEvent.setup()
    const url = window.location.href
    const seen: MouseEvent[] = []
    const record = (event: Event) => {
      if (event instanceof MouseEvent) seen.push(event)
    }
    document.addEventListener('auxclick', record, true)

    const enabled = mount('button', {
      as: 'a',
      href: '#pointer-8',
      children: 'open',
    } as ButtonProps)
    await user.pointer({
      keys: '[MouseMiddle]',
      target: screen.getByRole('button', { name: 'open' }),
    })
    await enabled.settle()
    expect(seen).toHaveLength(1)
    expect(window.location.href).toBe(url)
    enabled.unmount()

    const accessiblyDisabled = mount('button', {
      as: 'a',
      href: '#pointer-8',
      disabled: true,
      children: 'blocked',
    } as ButtonProps)
    await user.pointer({
      keys: '[MouseMiddle]',
      target: screen.getByRole('button', { name: 'blocked' }),
    })
    await accessiblyDisabled.settle()
    expect(window.location.href).toBe(url)
    accessiblyDisabled.unmount()

    mount('button', {
      as: 'a',
      href: '#pointer-8',
      children: 'inert',
      style: 'pointer-events: none',
    } as ButtonProps)
    const el = screen.getByRole('button', { name: 'inert' })
    const before = seen.length
    await expect(user.pointer({ keys: '[MouseMiddle]', target: el })).rejects.toThrow()
    expect(seen).toHaveLength(before)
    expect(window.location.href).toBe(url)

    document.removeEventListener('auxclick', record, true)
  })
})
