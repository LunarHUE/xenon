import type { ButtonProps } from '../harness'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('button state', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  spec('button.state.1', () => {
    const native = mount('button', { children: 'Go' })
    const button = screen.getByRole('button')
    expect(button).not.toHaveAttribute('aria-pressed')
    expect(button).not.toHaveAttribute('aria-checked')
    native.unmount()

    mount('button', { children: 'Go', as: 'div' })
    const custom = screen.getByRole('button')
    expect(custom).not.toHaveAttribute('aria-pressed')
    expect(custom).not.toHaveAttribute('aria-checked')
  })

  spec('button.state.2', () => {
    const m = mount('button', { children: 'Go', disabled: true, value: 'one' })
    const el = screen.getByRole('button')
    if (!(el instanceof HTMLButtonElement)) throw new Error('not a button host')

    expect(el.disabled).toBe(true)
    el.value = 'two'
    expect(el.value).toBe('two')

    m.setProps({ value: 'three' })
    expect(el.value).toBe('three')
    expect(el.disabled).toBe(true)
  })

  spec('button.state.3', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const m = mount('button', { children: 'Save', onClick })
    const el = screen.getByRole('button')

    await user.click(el)
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)

    m.setProps({ pending: true } as Partial<ButtonProps>)
    await user.click(el)
    el.focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  spec('button.state.4', () => {
    const m = mount('button', { children: 'Save' })
    const el = screen.getByRole('button')
    expect(el).not.toHaveAttribute('aria-disabled')

    m.setProps({ pending: true } as Partial<ButtonProps>)
    expect(el).toHaveAttribute('aria-disabled', 'true')

    m.setProps({ pending: false } as Partial<ButtonProps>)
    expect(el).not.toHaveAttribute('aria-disabled')
  })

  spec('button.state.5', () => {
    vi.useFakeTimers()
    mount('button', { children: 'Save', pending: true } as ButtonProps)
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-disabled', 'true')

    vi.advanceTimersByTime(1000)
    expect(el).toHaveAttribute('aria-disabled', 'true')
  })

  spec('button.state.6', () => {
    const m = mount('button', { as: 'a', href: '#state-6', children: 'Save' } as ButtonProps)
    const el = screen.getByRole('link')
    expect(el).toHaveAttribute('href', '#state-6')

    m.setProps({ pending: true } as Partial<ButtonProps>)
    expect(el).not.toHaveAttribute('href')
  })

  spec('button.state.7', () => {
    mount('button', { children: 'Save', pending: true } as ButtonProps)
    const el = screen.getByRole('button')

    el.focus()
    expect(el).toHaveAttribute('aria-disabled', 'true')

    el.blur()
    expect(el).not.toHaveFocus()
    expect(el).toHaveAttribute('aria-disabled', 'true')
  })
})
