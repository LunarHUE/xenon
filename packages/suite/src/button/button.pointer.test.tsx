import type { ButtonProps } from '../harness'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('button pointer', () => {
  spec('button.pointer.1', async () => {
    const targets: EventTarget[] = []
    const onClick = vi.fn((event: MouseEvent) => {
      if (event.currentTarget) targets.push(event.currentTarget)
    })
    const user = userEvent.setup()
    const m = mount('button', { children: 'Go', onClick })
    const el = screen.getByRole('button')

    await user.click(el)
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(1)

    el.focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(2)

    await user.keyboard(' ')
    await m.settle()
    expect(onClick).toHaveBeenCalledTimes(3)

    expect(targets).toEqual([el, el, el])
  })

  spec.todo('button.pointer.2')

  spec('button.pointer.3', () => {
    const events: MouseEvent[] = []
    const live = mount('button', {
      children: 'Go',
      onClick: (event: MouseEvent) => {
        events.push(event)
        if (events.length === 1 && event.currentTarget instanceof HTMLElement)
          event.currentTarget.click()
      },
    })
    screen.getByRole('button', { name: 'Go' }).click()
    expect(events).toHaveLength(1)
    expect(events[0]?.isTrusted).toBe(false)
    live.unmount()

    const onClick = vi.fn()
    mount('button', { children: 'Off', disabled: true, onClick })
    screen.getByRole('button', { name: 'Off' }).click()
    expect(onClick).not.toHaveBeenCalled()
  })

  spec('button.pointer.4', async () => {
    const user = userEvent.setup()
    mount('button', { children: 'native' })
    const native = screen.getByRole('button', { name: 'native' })
    await user.click(native)
    expect(native).toHaveFocus()

    mount('button', { children: 'custom', as: 'div' })
    const custom = screen.getByRole('button', { name: 'custom' })
    await user.click(custom)
    expect(custom).toHaveFocus()
  })

  spec('button.pointer.5', async () => {
    const user = userEvent.setup()
    const onNative = vi.fn()
    const native = mount('button', { children: 'native', disabled: true, onClick: onNative })
    await user.click(screen.getByRole('button', { name: 'native' }))
    await native.settle()
    expect(onNative).not.toHaveBeenCalled()
    native.unmount()

    const onCustom = vi.fn()
    const custom = mount('button', {
      children: 'custom',
      as: 'div',
      disabled: true,
      onClick: onCustom,
    })
    await user.click(screen.getByRole('button', { name: 'custom' }))
    await custom.settle()
    expect(onCustom).not.toHaveBeenCalled()
  })

  spec('button.pointer.6', async () => {
    const m = mount('button', { children: 'Go' })
    const results = await axe.run(m.container, {
      runOnly: { type: 'rule', values: ['target-size'] },
      rules: { 'target-size': { enabled: true } },
    })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })

  spec('button.pointer.9', async () => {
    const user = userEvent.setup()
    const seen: MouseEvent[] = []
    const record = (event: Event) => {
      if (event instanceof MouseEvent) seen.push(event)
    }
    document.addEventListener('auxclick', record, true)

    const enabled = mount('button', {
      as: 'a',
      href: '#pointer-9',
      children: 'open',
      onAuxClick: (event: MouseEvent) => event.preventDefault(),
    } as ButtonProps)
    await user.pointer({
      keys: '[MouseMiddle]',
      target: screen.getByRole('link', { name: 'open' }),
    })
    await enabled.settle()
    expect(seen).toHaveLength(1)
    expect(seen[0]?.defaultPrevented).toBe(true)
    enabled.unmount()

    const off = mount('button', {
      as: 'a',
      href: '#pointer-9',
      disabled: true,
      children: 'blocked',
      onAuxClick: (event: MouseEvent) => event.preventDefault(),
    } as ButtonProps)
    await user.pointer({
      keys: '[MouseMiddle]',
      target: screen.getByText('blocked'),
    })
    await off.settle()
    expect(seen).toHaveLength(2)
    expect(seen[1]?.defaultPrevented).toBe(false)

    document.removeEventListener('auxclick', record, true)
  })
})
