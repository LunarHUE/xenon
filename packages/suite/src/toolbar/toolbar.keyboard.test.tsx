import { Toolbar } from '@tenon/solid'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function stops(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[tabindex="0"]')]
}

function anchorBefore(): HTMLElement {
  document.body.insertAdjacentHTML('afterbegin', '<button id="before">before</button>')
  const el = document.getElementById('before')
  if (!(el instanceof HTMLElement)) throw new Error('no leading anchor')
  onTestFinished(() => el.remove())
  return el
}

function anchorAfter(): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', '<button id="after">after</button>')
  const el = document.getElementById('after')
  if (!(el instanceof HTMLElement)) throw new Error('no trailing anchor')
  onTestFinished(() => el.remove())
  return el
}

function listen(type: string, handler: EventListener, capture = false) {
  document.addEventListener(type, handler, capture)
  onTestFinished(() => document.removeEventListener(type, handler, capture))
}

function format() {
  return (
    <>
      <Toolbar.Button>Bold</Toolbar.Button>
      <Toolbar.Button>Italic</Toolbar.Button>
      <Toolbar.Button>Underline</Toolbar.Button>
    </>
  )
}

function trio(container: HTMLElement) {
  const scope = within(root(container))
  return [
    scope.getByRole('button', { name: 'Bold' }),
    scope.getByRole('button', { name: 'Italic' }),
    scope.getByRole('button', { name: 'Underline' }),
  ] as const
}

function groups() {
  return (
    <>
      <Toolbar.Group aria-label="Clipboard">
        <Toolbar.Button>Cut</Toolbar.Button>
        <Toolbar.Button>Copy</Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="Align">
        <Toolbar.Button>Left</Toolbar.Button>
        <Toolbar.Button>Right</Toolbar.Button>
      </Toolbar.Group>
    </>
  )
}

describe('toolbar keyboard', () => {
  spec('toolbar.keyboard.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold, italic, underline] = trio(m.container)

    expect(stops(m.container)).toEqual([bold])
    anchorBefore().focus()
    await user.tab()
    expect(document.activeElement).toBe(bold)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(italic)
    expect(stops(m.container)).toEqual([italic])
    expect(bold).toHaveAttribute('tabindex', '-1')
    expect(underline).toHaveAttribute('tabindex', '-1')
  })

  spec('toolbar.keyboard.2', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            Cut
          </Toolbar.Button>
          <Toolbar.Button>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const cut = scope.getByRole('button', { name: 'Cut' })
    const copy = scope.getByRole('button', { name: 'Copy' })

    expect(cut).toBeDisabled()
    expect(stops(m.container)).toEqual([copy])

    anchorBefore().focus()
    await user.tab()
    expect(document.activeElement).toBe(copy)
  })

  spec('toolbar.keyboard.3', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold, italic, underline] = trio(m.container)

    bold.focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(italic)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(underline)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(italic)
    expect(stops(m.container)).toEqual([italic])
  })

  spec('toolbar.keyboard.4', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: format,
    })
    const [bold, italic] = trio(m.container)

    bold.focus()
    await user.keyboard('{ArrowDown}')
    await m.settle()
    expect(document.activeElement).toBe(italic)

    await user.keyboard('{ArrowUp}')
    await m.settle()
    expect(document.activeElement).toBe(bold)
  })

  spec('toolbar.keyboard.5', async () => {
    const user = userEvent.setup()
    const claimed: boolean[] = []
    listen('keydown', (event) => claimed.push(event.defaultPrevented))

    const horizontal = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold] = trio(horizontal.container)
    bold.focus()
    await user.keyboard('{ArrowDown}{ArrowUp}')
    await horizontal.settle()
    expect(document.activeElement).toBe(bold)
    expect(claimed).toEqual([false, false])
    horizontal.unmount()

    claimed.length = 0
    const vertical = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: format,
    })
    const [top] = trio(vertical.container)
    top.focus()
    await user.keyboard('{ArrowRight}{ArrowLeft}')
    await vertical.settle()
    expect(document.activeElement).toBe(top)
    expect(claimed).toEqual([false, false])
  })

  spec('toolbar.keyboard.6', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Edit', children: groups })
    const scope = within(root(m.container))
    const cut = scope.getByRole('button', { name: 'Cut' })
    const left = scope.getByRole('button', { name: 'Left' })
    const right = scope.getByRole('button', { name: 'Right' })

    left.focus()
    await m.settle()
    await user.keyboard('{Home}')
    await m.settle()
    expect(document.activeElement).toBe(cut)
    expect(stops(m.container)).toEqual([cut])

    await user.keyboard('{End}')
    await m.settle()
    expect(document.activeElement).toBe(right)
    expect(stops(m.container)).toEqual([right])
  })

  spec('toolbar.keyboard.7', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Edit', children: groups })
    const scope = within(root(m.container))
    const copy = scope.getByRole('button', { name: 'Copy' })
    const left = scope.getByRole('button', { name: 'Left' })

    copy.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(left)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(copy)
  })

  spec('toolbar.keyboard.8', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold, italic] = trio(m.container)
    const before = anchorBefore()
    const after = anchorAfter()

    before.focus()
    await user.tab()
    expect(document.activeElement).toBe(bold)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(italic)

    await user.tab()
    expect(document.activeElement).toBe(after)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(italic)
  })

  spec('toolbar.keyboard.9', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button onClick={clicks}>Bold</Toolbar.Button>
          <Toolbar.Button>Italic</Toolbar.Button>
          <Toolbar.Button>Underline</Toolbar.Button>
        </>
      ),
    })
    const [bold] = trio(m.container)

    bold.focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(document.activeElement).toBe(bold)
    expect(stops(m.container)).toEqual([bold])
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  spec('toolbar.keyboard.13', async () => {
    const user = userEvent.setup()
    const capture = vi.fn()
    const ancestor = vi.fn()
    const item = vi.fn()
    listen('click', capture, true)

    const m = mount('toolbar', {
      'aria-label': 'Format',
      onClick: ancestor,
      children: () => (
        <>
          <Toolbar.Button as="div" onClick={item}>
            Bold
          </Toolbar.Button>
          <Toolbar.Button as="div">Italic</Toolbar.Button>
        </>
      ),
    })
    const bold = within(root(m.container)).getByRole('button', { name: 'Bold' })
    expect(bold.tagName).toBe('DIV')

    bold.focus()
    await user.keyboard('{Enter}')
    await m.settle()
    expect(item).toHaveBeenCalledTimes(1)
    expect(ancestor).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledTimes(1)

    await user.keyboard('[Space]')
    await m.settle()
    expect(item).toHaveBeenCalledTimes(2)
    expect(ancestor).toHaveBeenCalledTimes(2)
    expect(capture).toHaveBeenCalledTimes(2)
  })

  spec('toolbar.keyboard.27', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold] = trio(m.container)
    const before = anchorBefore()

    listen('keydown', (event) => {
      if (!(event instanceof KeyboardEvent)) return
      if (event.key !== 'F10' || !event.altKey) return
      event.preventDefault()
      stops(m.container)[0]?.focus()
    })

    before.focus()
    await user.keyboard('{Alt>}{F10}{/Alt}')
    await m.settle()
    expect(document.activeElement).toBe(bold)
  })

  spec('toolbar.keyboard.29', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold, , underline] = trio(m.container)

    underline.focus()
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(bold)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(underline)

    m.setProps({ loop: false })
    await m.settle()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(underline)
  })
})
