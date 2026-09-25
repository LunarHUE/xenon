import { Toolbar } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
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

function format() {
  return (
    <>
      <Toolbar.Button>Bold</Toolbar.Button>
      <Toolbar.Button>Italic</Toolbar.Button>
      <Toolbar.Button>Underline</Toolbar.Button>
      <Toolbar.Button>Strike</Toolbar.Button>
    </>
  )
}

describe('toolbar notes and edge cases', () => {
  spec('toolbar.notes.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const scope = within(root(m.container))
    const buttons = scope.getAllByRole('button')
    const before = anchorBefore()
    const after = anchorAfter()

    expect(buttons).toHaveLength(4)
    expect(stops(m.container)).toEqual([buttons[0]])
    for (const el of buttons.slice(1)) expect(el).toHaveAttribute('tabindex', '-1')

    before.focus()
    await user.tab()
    expect(document.activeElement).toBe(buttons[0])
    await user.tab()
    expect(document.activeElement).toBe(after)
  })

  spec('toolbar.notes.2', () => {
    const m = mount('toolbar', {
      'aria-label': 'Align',
      children: () => (
        <>
          <Toolbar.Button as="div" aria-pressed="false">
            Left
          </Toolbar.Button>
          <Toolbar.Button as="div" aria-pressed="true">
            Center
          </Toolbar.Button>
          <Toolbar.Button as="div" aria-pressed="false">
            Right
          </Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const left = scope.getByRole('button', { name: 'Left' })
    const center = scope.getByRole('button', { name: 'Center' })

    expect(center).toHaveAttribute('aria-pressed', 'true')
    expect(stops(m.container)).toEqual([left])
    expect(center).toHaveAttribute('tabindex', '-1')
  })

  spec('toolbar.notes.3', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    onTestFinished(() => host.remove())

    expect(() => render(() => <Toolbar.Button>Bold</Toolbar.Button>, host)).toThrow(/Toolbar/)
  })

  spec('toolbar.notes.5', async () => {
    const user = userEvent.setup()
    const onToolbar = vi.fn()
    const onItem = vi.fn()
    let toolbarEl: HTMLElement | undefined
    let itemEl: HTMLElement | undefined

    const m = mount('toolbar', {
      'aria-label': 'Format',
      class: 'toolbar-notes-5',
      style: { color: 'rgb(1, 2, 3)' },
      onClick: onToolbar,
      ref: (el: HTMLElement) => {
        toolbarEl = el
      },
      children: () => (
        <>
          <Toolbar.Button
            class="toolbar-notes-5-item"
            style={{ color: 'rgb(4, 5, 6)' }}
            onClick={onItem}
            ref={(el: HTMLElement) => {
              itemEl = el
            }}
          >
            Bold
          </Toolbar.Button>
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    await m.settle()

    const el = root(m.container)
    const bold = within(el).getByRole('button', { name: 'Bold' })
    expect(toolbarEl).toBe(el)
    expect(itemEl).toBe(bold)
    expect(el).toHaveClass('toolbar-notes-5')
    expect(bold).toHaveClass('toolbar-notes-5-item')
    expect(el.style.color).toBe('rgb(1, 2, 3)')
    expect(bold.style.color).toBe('rgb(4, 5, 6)')

    await user.click(bold)
    await m.settle()
    expect(onItem).toHaveBeenCalledTimes(1)
    expect(onToolbar).toHaveBeenCalledTimes(1)
  })

  spec('toolbar.notes.6', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const scope = within(root(m.container))
    const italic = scope.getByRole('button', { name: 'Italic' })
    const before = anchorBefore()
    const after = anchorAfter()

    before.focus()
    await user.tab()
    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(italic)

    await user.tab()
    expect(document.activeElement).toBe(after)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(italic)
  })
})
