import { Toolbar } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { createSignal } from 'solid-js'
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

describe('toolbar focus management', () => {
  spec('toolbar.focus.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button>Cut</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Group aria-label="Align">
            <Toolbar.Button>Left</Toolbar.Button>
            <Toolbar.Button>Right</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Link href="#toolbar-focus-1">Help</Toolbar.Link>
        </>
      ),
    })
    const scope = within(root(m.container))
    const cut = scope.getByRole('button', { name: 'Cut' })
    const left = scope.getByRole('button', { name: 'Left' })
    const right = scope.getByRole('button', { name: 'Right' })
    const help = scope.getByRole('link', { name: 'Help' })
    const items = [cut, left, right, help]

    expect(stops(m.container)).toEqual([cut])
    for (const el of items.slice(1)) expect(el).toHaveAttribute('tabindex', '-1')

    cut.focus()
    for (const expected of [left, right, help]) {
      await user.keyboard('{ArrowRight}')
      await m.settle()
      expect(document.activeElement).toBe(expected)
      expect(stops(m.container)).toEqual([expected])
    }

    const group = scope.getByRole('group')
    expect(group).not.toHaveAttribute('tabindex')
  })

  spec('toolbar.focus.2', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const [bold, italic, underline] = trio(m.container)

    await user.click(underline)
    await m.settle()
    expect(document.activeElement).toBe(underline)
    expect(stops(m.container)).toEqual([underline])

    await user.click(italic)
    await m.settle()
    expect(document.activeElement).toBe(italic)
    expect(stops(m.container)).toEqual([italic])
    expect(bold).toHaveAttribute('tabindex', '-1')
  })

  spec('toolbar.focus.3', async () => {
    const [enabled, setEnabled] = createSignal(false)
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            Cut
          </Toolbar.Button>
          <Toolbar.Button disabled={!enabled()} focusableWhenDisabled={false}>
            Copy
          </Toolbar.Button>
        </>
      ),
    })
    const el = root(m.container)
    expect(el).toHaveAttribute('tabindex', '-1')

    setEnabled(true)
    await m.settle()
    const copy = within(el).getByRole('button', { name: 'Copy' })
    expect(el).not.toHaveAttribute('tabindex')
    expect(stops(m.container)).toEqual([copy])
  })

  spec('toolbar.focus.4', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Edit',
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
    const copy = within(root(m.container)).getByRole('button', { name: 'Copy' })
    const before = anchorBefore()
    const after = anchorAfter()

    before.focus()
    await user.tab()
    expect(document.activeElement).toBe(copy)

    await user.tab()
    expect(document.activeElement).toBe(after)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(copy)
  })

  spec('toolbar.focus.5', async () => {
    const user = userEvent.setup()
    const [present, setPresent] = createSignal(true)
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          {present() ? <Toolbar.Button>Bold</Toolbar.Button> : null}
          <Toolbar.Button>Italic</Toolbar.Button>
          <Toolbar.Button>Underline</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const italic = scope.getByRole('button', { name: 'Italic' })
    const underline = scope.getByRole('button', { name: 'Underline' })
    const after = anchorAfter()

    expect(stops(m.container)).toEqual([scope.getByRole('button', { name: 'Bold' })])

    setPresent(false)
    await m.settle()
    expect(scope.queryByRole('button', { name: 'Bold' })).toBeNull()
    expect(stops(m.container)).toEqual([italic])

    after.focus()
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(italic)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(underline)
  })

  spec('toolbar.focus.6', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button>Select all</Toolbar.Button>
          <Toolbar.Button disabled onClick={clicks}>
            Copy
          </Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const all = scope.getByRole('button', { name: 'Select all' })
    const copy = scope.getByRole('button', { name: 'Copy' })

    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(copy).toHaveAttribute('data-disabled', '')
    expect(copy).not.toHaveAttribute('disabled')

    all.focus()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(copy)
    expect(stops(m.container)).toEqual([copy])

    await user.keyboard('{Enter}')
    await m.settle()
    expect(clicks).not.toHaveBeenCalled()

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(scope.getByRole('button', { name: 'Paste' }))
  })

  spec('toolbar.focus.11', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Zoom',
      children: () => (
        <>
          <Toolbar.Button disabled focusableWhenDisabled={false}>
            Up
          </Toolbar.Button>
          <Toolbar.Button>Down</Toolbar.Button>
          <Toolbar.Button>Reset</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const up = scope.getByRole('button', { name: 'Up' })
    const down = scope.getByRole('button', { name: 'Down' })
    const reset = scope.getByRole('button', { name: 'Reset' })
    const before = anchorBefore()

    expect(up).toBeDisabled()
    expect(up).not.toHaveAttribute('aria-disabled')

    before.focus()
    await user.tab()
    expect(document.activeElement).toBe(down)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(reset)
  })

  spec('toolbar.focus.12', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button>Select all</Toolbar.Button>
          <Toolbar.Button disabled>Copy</Toolbar.Button>
        </>
      ),
    })
    const copy = within(root(m.container)).getByRole('button', { name: 'Copy' })
    const before = anchorBefore()

    const shortcut = (event: Event) => {
      if (!(event instanceof KeyboardEvent)) return
      if (event.key !== 'c' || !event.altKey) return
      event.preventDefault()
      copy.focus()
    }
    document.addEventListener('keydown', shortcut)
    onTestFinished(() => document.removeEventListener('keydown', shortcut))

    before.focus()
    await user.keyboard('{Alt>}c{/Alt}')
    await m.settle()
    expect(document.activeElement).toBe(copy)
    expect(copy).toHaveAttribute('aria-disabled', 'true')
  })

  spec('toolbar.focus.13', async () => {
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
    expect(stops(m.container)).toEqual([italic])

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(italic)

    italic.blur()
    await m.settle()
    expect(stops(m.container)).toEqual([italic])
  })
})
