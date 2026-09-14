import type { ButtonProps } from '../harness'
import type { ComponentProps } from '@solidjs/web'
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

describe('button notes', () => {
  spec('button.notes.1', () => {
    const m = mount('button', { as: 'a', href: '/elsewhere', children: 'Go' } as ButtonProps)
    const el = host(m.container)
    expect(el).not.toHaveAttribute('role', 'button')
    expect(screen.getByRole('link', { name: 'Go' })).toBe(el)
  })

  spec('button.notes.2', () => {
    const m = mount('button', { as: 'a', children: 'Go' })
    const el = host(m.container)
    expect(el).toHaveAttribute('role', 'button')
    expect(screen.getByRole('button', { name: 'Go' })).toBe(el)
  })

  spec('button.notes.3', () => {
    const m = mount('button', { children: 'Save as…' })
    expect(host(m.container)).toHaveAccessibleName('Save as…')
  })

  spec('button.notes.4', () => {
    const native = mount('button', { children: 'Go' })
    const nativeEl = host(native.container)
    expect(nativeEl.tagName).toBe('BUTTON')
    expect(nativeEl).toHaveAttribute('type', 'button')
    expect(nativeEl).not.toHaveAttribute('role')
    expect(nativeEl).not.toHaveAttribute('tabindex')
    native.unmount()

    const input = mount('button', { as: 'input', type: 'button', value: 'Go' })
    const inputEl = host(input.container)
    expect(inputEl.tagName).toBe('INPUT')
    expect(inputEl).toHaveAttribute('type', 'button')
    expect(inputEl).not.toHaveAttribute('role')
    expect(inputEl).not.toHaveAttribute('tabindex')
    input.unmount()

    const div = mount('button', { as: 'div', children: 'Go' })
    const divEl = host(div.container)
    expect(divEl).toHaveAttribute('role', 'button')
    expect(divEl).toHaveAttribute('tabindex', '0')
    expect(divEl).not.toHaveAttribute('type')
    div.unmount()

    const link = mount('button', { as: 'a', href: '/elsewhere', children: 'Go' } as ButtonProps)
    const linkEl = host(link.container)
    expect(linkEl).not.toHaveAttribute('role')
    expect(linkEl).not.toHaveAttribute('tabindex')
    link.unmount()

    const anchor = mount('button', { as: 'a', children: 'Go' })
    const anchorEl = host(anchor.container)
    expect(anchorEl).toHaveAttribute('role', 'button')
    expect(anchorEl).toHaveAttribute('tabindex', '0')
  })

  spec('button.notes.5', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Host = (props: ComponentProps<'button'>) => <button {...props} />
    const m = mount('button', { as: Host, children: 'Go' })
    const el = host(m.container)
    expect(el.tagName).toBe('BUTTON')

    const messages = error.mock.calls.map((call) => String(call[0])).join('\n')
    error.mockRestore()
    expect(messages).toMatch(/button/i)
    expect(messages).toMatch(/\bas\b/)
  })

  spec('button.notes.6', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const Ignoring = () => <span>Go</span>
    let captured: HTMLElement | undefined
    const m = mount('button', {
      as: Ignoring,
      children: 'Go',
      ref: (el: HTMLElement) => {
        captured = el
      },
    })
    expect(host(m.container).tagName).toBe('SPAN')
    expect(captured).toBeUndefined()

    const messages = error.mock.calls.map((call) => String(call[0])).join('\n')
    error.mockRestore()
    expect(messages).toMatch(/ref/i)
  })

  spec.todo('button.notes.8')

  spec('button.notes.9', async () => {
    const user = userEvent.setup()
    expect(typeof PointerEvent).toBe('function')

    const m = mount('button', { children: 'Go' })
    const el = host(m.container)
    const seen: { type: string; pointerType: string; pointerId: number }[] = []
    el.addEventListener('pointerdown', (event) => {
      seen.push({
        type: event.type,
        pointerType: event.pointerType,
        pointerId: event.pointerId,
      })
    })

    await user.pointer({ target: el, keys: '[MouseLeft]' })
    await m.settle()
    expect(seen).toEqual([{ type: 'pointerdown', pointerType: 'mouse', pointerId: 1 }])
  })
})
