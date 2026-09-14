import type { ButtonProps } from '../harness'
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

describe('button keyboard', () => {
  spec('button.keyboard.1', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('button', { children: 'Go', onClick: clicks })
    screen.getByRole('button').focus()
    await user.keyboard(' ')
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  spec('button.keyboard.2', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('button', { children: 'Go', onClick: clicks })
    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  spec('button.keyboard.3', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('button', { as: 'div', children: 'Go', onClick: clicks })
    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
    await user.keyboard(' ')
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(2)
  })

  spec('button.keyboard.4', async () => {
    mount('button', { children: 'Elsewhere' })
    const m = mount('button', { children: 'Shortcut target' })
    const away = screen.getByRole('button', { name: 'Elsewhere' })
    const el = screen.getByRole('button', { name: 'Shortcut target' })
    away.focus()
    el.click()
    await m.settle()
    expect(away).toHaveFocus()
    expect(el).not.toHaveFocus()
  })

  spec('button.keyboard.5', async () => {
    const user = userEvent.setup()
    const types: string[] = []
    const m = mount('button', {
      as: 'div',
      children: 'Go',
      onClick: (event) => types.push(event.type),
    })
    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(types).toEqual(['click'])
  })

  spec('button.keyboard.6', async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    const m = mount('button', { as: 'div', children: 'Go' })
    const el = screen.getByRole('button')
    el.addEventListener('click', () => seen.push('host capture'), { capture: true })
    m.container.addEventListener('click', () => seen.push('ancestor'))
    el.focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(seen).toEqual(['host capture', 'ancestor'])
  })

  spec('button.keyboard.7', async () => {
    const user = userEvent.setup()
    let shift: boolean | undefined
    const m = mount('button', {
      as: 'div',
      children: 'Go',
      onClick: (event) => {
        shift = event.shiftKey
      },
    })
    screen.getByRole('button').focus()
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await m.settle()
    expect(shift).toBe(true)
  })

  spec('button.keyboard.8', async () => {
    const user = userEvent.setup()
    const enterClicks = vi.fn()
    const enter = mount('button', {
      as: 'div',
      children: 'Go',
      onClick: enterClicks,
      onKeyDown: (event) => event.preventDefault(),
    })
    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')
    await enter.settle()
    expect(enterClicks).not.toHaveBeenCalled()
    enter.unmount()

    const spaceClicks = vi.fn()
    const space = mount('button', {
      as: 'div',
      children: 'Go',
      onClick: spaceClicks,
      onKeyUp: (event) => event.preventDefault(),
    })
    screen.getByRole('button').focus()
    await user.keyboard(' ')
    await space.settle()
    expect(spaceClicks).not.toHaveBeenCalled()
  })

  spec('button.keyboard.9', async () => {
    const clicks = vi.fn()
    const m = mount('button', { as: 'div', children: 'Go', onClick: clicks })
    const el = screen.getByRole('button')
    el.focus()
    fireEvent.keyDown(el, { key: 'Enter', repeat: true })
    fireEvent.keyDown(el, { key: ' ', repeat: true })
    await m.settle()
    expect(clicks).not.toHaveBeenCalled()
  })

  spec.skip('button.keyboard.10', 'a[href] host is a link, see button.notes.1', async () => {
    const clicks = vi.fn()
    const m = mount('button', {
      as: 'a',
      href: '#keyboard-10',
      children: 'Go',
      onClick: clicks,
    } as ButtonProps)
    const el = host(m.container)
    el.focus()
    expect(fireEvent.keyDown(el, { key: ' ' })).toBe(false)
    fireEvent.keyUp(el, { key: ' ' })
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
    expect(window.location.hash).toBe('#keyboard-10')
  })

  spec.skip('button.keyboard.11', 'a[href] host is a link, see button.notes.1', async () => {
    const m = mount('button', { as: 'a', href: '#keyboard-11', children: 'Go' } as ButtonProps)
    const el = host(m.container)
    const click = vi.spyOn(el, 'click')
    el.focus()
    fireEvent.keyDown(el, { key: ' ' })
    fireEvent.keyUp(el, { key: ' ' })
    await m.settle()
    expect(click).toHaveBeenCalledTimes(1)
  })

  spec('button.keyboard.12', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('button', {
      as: 'a',
      href: '#keyboard-12',
      role: 'link',
      children: 'Go',
      onClick: clicks,
    } as ButtonProps)
    const el = screen.getByRole('link')
    el.focus()
    await user.keyboard(' ')
    await m.settle()
    expect(clicks).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(clicks).toHaveBeenCalled()
  })

  spec.skip('button.keyboard.13', 'input[type=checkbox] is not a supported host', async () => {
    const clicks = vi.fn()
    const m = mount('button', {
      as: 'input',
      type: 'checkbox',
      onClick: clicks,
    } as unknown as ButtonProps)
    const el = host(m.container)
    el.focus()
    fireEvent.keyDown(el, { key: 'Enter' })
    fireEvent.keyUp(el, { key: 'Enter' })
    await m.settle()
    expect(clicks).not.toHaveBeenCalled()
    expect(fireEvent.keyDown(el, { key: ' ' })).toBe(true)
    fireEvent.keyUp(el, { key: ' ' })
    await m.settle()
    expect(clicks).toHaveBeenCalled()
  })

  spec.todo('button.keyboard.14')

  spec.todo('button.keyboard.15')

  spec.todo('button.keyboard.17')

  spec('button.keyboard.18', async () => {
    const clicks = vi.fn()
    const m = mount('button', { as: 'div', children: 'Go', onClick: clicks })
    const el = screen.getByRole('button')
    el.focus()
    fireEvent.keyDown(el, { key: ' ' })
    await m.settle()
    expect(clicks).not.toHaveBeenCalled()
    fireEvent.keyUp(el, { key: ' ' })
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  spec.todo('button.keyboard.19')

  spec('button.keyboard.20', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('button', { children: 'Go', onClick: clicks })
    screen.getByRole('button').focus()
    await user.keyboard(' ')
    await m.settle()
    expect(clicks).toHaveBeenCalledTimes(1)
  })
})
