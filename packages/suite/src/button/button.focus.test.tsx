import type { ButtonProps } from '../harness'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('button focus management', () => {
  spec('button.focus.1', () => {
    for (const as of ['div', 'span'] as const) {
      const m = mount('button', { as, children: 'Go' })
      expect(screen.getByRole('button')).toHaveAttribute('tabindex', '0')
      m.unmount()
    }
  })

  spec('button.focus.2', () => {
    mount('button', { as: 'a', href: '#focus-2', children: 'Go' } as ButtonProps)
    expect(screen.getByRole('link')).not.toHaveAttribute('tabindex')
  })

  spec('button.focus.3', () => {
    const custom = mount('button', { as: 'div', children: 'Go', tabindex: -1 })
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1')
    custom.unmount()

    mount('button', { children: 'Go', tabindex: -1 })
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1')
  })

  spec.todo('button.focus.4')

  spec.todo('button.focus.5')

  spec('button.focus.6', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const m = mount('button', { children: 'Apply', onClick })
    const el = screen.getByRole('button')
    await user.click(el)
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(el).toHaveFocus()
  })

  spec.todo('button.focus.7')

  spec.todo('button.focus.8')

  spec('button.focus.9', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'before' })
    mount('button', { children: 'roved', as: 'div', tabindex: -1 })
    mount('button', { children: 'after' })
    const roved = screen.getByRole('button', { name: 'roved' })

    roved.focus()
    expect(roved).toHaveFocus()

    await user.click(roved)
    expect(roved).toHaveFocus()

    screen.getByRole('button', { name: 'before' }).focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  spec('button.focus.10', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'first' })
    mount('button', { children: 'second', as: 'div' })
    mount('button', { children: 'third' })

    await user.tab()
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'second' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'third' })).toHaveFocus()
  })

  spec('button.focus.11', async () => {
    mount('button', { children: 'native' })
    mount('button', { children: 'custom', as: 'div' })
    mount('button', { children: 'off', disabled: true })
    mount('button', { children: 'custom off', as: 'div', disabled: true })

    for (const el of screen.getAllByRole('button')) {
      const tabindex = el.getAttribute('tabindex')
      if (tabindex !== null) expect(Number(tabindex)).toBeLessThanOrEqual(0)
    }

    const results = await axe.run(document.body, {
      runOnly: { type: 'rule', values: ['tabindex'] },
    })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })

  spec('button.focus.12', () => {
    const native = mount('button', { children: 'native' })
    const button = screen.getByRole('button', { name: 'native' })
    expect(button).not.toHaveAttribute('tabindex')
    expect(button.tabIndex).toBe(0)
    native.unmount()

    mount('button', { children: 'custom', as: 'div' })
    const custom = screen.getByRole('button', { name: 'custom' })
    expect(custom.tabIndex).toBe(0)
    custom.removeAttribute('tabindex')
    expect(custom.tabIndex).toBe(-1)
  })

  spec('button.focus.13', () => {
    mount('button', { children: 'on' })
    mount('button', { children: 'off', disabled: true })
    mount('button', { children: 'custom', as: 'div' })

    const on = screen.getByRole('button', { name: 'on' })
    on.focus()
    expect(on).toHaveFocus()

    const off = screen.getByRole('button', { name: 'off' })
    off.focus()
    expect(off).not.toHaveFocus()

    const custom = screen.getByRole('button', { name: 'custom' })
    custom.removeAttribute('tabindex')
    custom.focus()
    expect(custom).not.toHaveFocus()
  })

  spec('button.focus.14', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'before' })
    mount('button', { children: 'target', as: 'div', tabindex: -1 })
    mount('button', { children: 'after' })
    const target = screen.getByRole('button', { name: 'target' })

    target.focus()
    expect(target).toHaveFocus()

    target.blur()
    await user.click(target)
    expect(target).toHaveFocus()

    screen.getByRole('button', { name: 'before' }).focus()
    await user.tab()
    expect(target).not.toHaveFocus()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  spec.todo('button.focus.15')

  spec('button.focus.16', () => {
    mount('button', { children: 'one' })
    mount('button', { children: 'two' })
    const one = screen.getByRole('button', { name: 'one' })
    const two = screen.getByRole('button', { name: 'two' })
    const events: string[] = []

    one.addEventListener('focus', () => events.push('focus one'))
    one.addEventListener('blur', (event) => {
      const related = event.relatedTarget
      events.push(`blur one -> ${related instanceof Element ? related.textContent : 'null'}`)
    })
    two.addEventListener('focus', () => events.push('focus two'))

    one.focus()
    one.focus()
    two.focus()

    expect(events).toEqual(['focus one', 'blur one -> two', 'focus two'])
  })

  spec.todo('button.focus.17')

  spec('button.focus.18', () => {
    mount('button', { children: 'one' })
    mount('button', { children: 'two' })
    const one = screen.getByRole('button', { name: 'one' })
    const two = screen.getByRole('button', { name: 'two' })

    one.focus()
    one.blur()
    expect(two).not.toHaveFocus()
    expect([one, document.body]).toContain(document.activeElement)
  })

  spec('button.focus.19', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'first' })
    mount('button', { children: 'skipped', as: 'div', tabindex: -1 })
    mount('button', { children: 'last' })

    await user.tab()
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
  })

  spec.todo('button.focus.20')

  spec.todo('button.focus.21')

  spec('button.focus.22', async () => {
    const m = mount('button', { children: 'Go', autofocus: true })
    await m.settle()
    expect(screen.getByRole('button')).toHaveFocus()
  })

  spec('button.focus.23', () => {
    let node: HTMLButtonElement | undefined
    mount('button', { children: 'Go', ref: (el: HTMLElement) => (node = el as HTMLButtonElement) })
    const el = screen.getByRole('button')
    expect(node).toBe(el)
    node?.focus()
    expect(el).toHaveFocus()
  })

  spec('button.focus.24', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'before' })
    mount('button', { children: 'off', disabled: true })
    const off = screen.getByRole('button', { name: 'off' })

    off.focus()
    expect(off).not.toHaveFocus()

    await user.click(off)
    expect(off).not.toHaveFocus()

    screen.getByRole('button', { name: 'before' }).focus()
    await user.tab()
    expect(off).not.toHaveFocus()
  })

  spec('button.focus.25', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'before' })
    mount('button', { children: 'off', disabled: true })
    mount('button', { children: 'after' })

    screen.getByRole('button', { name: 'before' }).focus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'after' })).toHaveFocus()
  })

  spec.skip('button.focus.26', 'divergence settled toward button.focus.27', () => {
    mount('button', { as: 'div', children: 'Go', disabled: true })
    expect(screen.getByRole('button')).toHaveAttribute('tabindex', '-1')
  })

  spec('button.focus.27', () => {
    const m = mount('button', { as: 'div', children: 'Go' })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('tabindex', '0')
    m.setProps({ disabled: true })
    expect(el).not.toHaveAttribute('tabindex')
  })

  spec('button.focus.28', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const m = mount('button', {
      children: 'Go',
      disabled: true,
      focusableWhenDisabled: true,
      onClick,
    } as ButtonProps)
    const el = screen.getByRole('button')

    expect(el).not.toHaveAttribute('disabled')
    expect(el).toHaveAttribute('data-disabled', '')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).toHaveAttribute('tabindex', '0')

    await user.tab()
    expect(el).toHaveFocus()

    await user.click(el)
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    await m.settle()
    expect(onClick).not.toHaveBeenCalled()
  })

  spec('button.focus.29', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn(() => {
      m.setProps({ disabled: true })
    })
    const m = mount('button', {
      children: 'Go',
      focusableWhenDisabled: true,
      onClick,
    } as ButtonProps)
    const el = screen.getByRole('button')

    await user.click(el)
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(el).toHaveFocus()
    expect(el).toHaveAttribute('aria-disabled', 'true')

    await user.click(el)
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(el).toHaveFocus()
  })

  spec.todo('button.focus.30')

  spec.skip('button.focus.31', 'no runtime focusable flag; ariakit candidate not adopted', () => {
    const m = mount('button', { as: 'div', children: 'Go', focusable: true } as ButtonProps)
    const el = screen.getByRole('button')
    el.focus()
    expect(el).toHaveAttribute('tabindex', '0')

    m.setProps({ focusable: false } as Partial<ButtonProps>)
    expect(el).not.toHaveAttribute('tabindex')
    expect(el).not.toHaveAttribute('data-focus-visible')

    m.setProps({ focusable: true } as Partial<ButtonProps>)
    expect(el).toHaveAttribute('tabindex', '0')
  })
})
