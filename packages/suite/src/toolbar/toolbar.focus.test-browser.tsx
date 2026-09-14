import { Toolbar } from '@kit/solid'
import { within } from '@testing-library/dom'
import { userEvent } from 'vitest/browser'
import { describe, expect, onTestFinished } from 'vitest'

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

describe('toolbar focus management in a browser', () => {
  spec('toolbar.focus.7', async () => {
    const user = userEvent
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
    const scope = within(root(m.container))
    const cut = scope.getByRole('button', { name: 'Cut' })
    const copy = scope.getByRole('button', { name: 'Copy' })
    const paste = scope.getByRole('button', { name: 'Paste' })

    expect(cut).toBeDisabled()
    expect(cut).not.toHaveAttribute('aria-disabled')
    expect(stops(m.container)).toEqual([copy])

    anchorBefore().focus()
    await user.tab()
    expect(document.activeElement).toBe(copy)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(paste)
  })

  spec('toolbar.focus.8', async () => {
    const user = userEvent
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button focusableWhenDisabled={false}>Cut</Toolbar.Button>
          <Toolbar.Button focusableWhenDisabled={false}>Copy</Toolbar.Button>
          <Toolbar.Button>Paste</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const cut = scope.getByRole('button', { name: 'Cut' })
    const copy = scope.getByRole('button', { name: 'Copy' })

    expect(cut).not.toBeDisabled()
    expect(stops(m.container)).toEqual([cut])

    anchorBefore().focus()
    await user.tab()
    expect(document.activeElement).toBe(cut)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(copy)
    expect(stops(m.container)).toEqual([copy])
  })

  spec('toolbar.focus.9', async () => {
    const user = userEvent
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button>Select all</Toolbar.Button>
          <Toolbar.Button as="input" value="Copy" disabled />
        </>
      ),
    })
    const copy = within(root(m.container)).getByRole('button', { name: 'Copy' })
    const after = anchorAfter()

    copy.focus()
    await m.settle()
    expect(document.activeElement).toBe(copy)
    expect(copy).toHaveAttribute('aria-disabled', 'true')

    await user.tab()
    expect(document.activeElement).toBe(after)

    await user.tab({ shift: true })
    expect(document.activeElement).toBe(copy)
  })
})
