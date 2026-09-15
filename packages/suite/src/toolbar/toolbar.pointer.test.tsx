import { Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

describe('toolbar pointer', () => {
  spec('toolbar.pointer.1', async () => {
    const user = userEvent.setup()
    const clicks = vi.fn()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Button onClick={clicks}>Italic</Toolbar.Button>
          <Toolbar.Button>Underline</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const bold = scope.getByRole('button', { name: 'Bold' })
    const italic = scope.getByRole('button', { name: 'Italic' })

    expect(bold).toHaveAttribute('tabindex', '0')

    await user.click(italic)
    await m.settle()
    expect(document.activeElement).toBe(italic)
    expect(italic).toHaveAttribute('tabindex', '0')
    expect(bold).toHaveAttribute('tabindex', '-1')
    expect(clicks).toHaveBeenCalledTimes(1)
  })

  spec('toolbar.pointer.2', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Link href="#toolbar-pointer-2">Help</Toolbar.Link>
        </>
      ),
    })
    const link = within(root(m.container)).getByRole('link', { name: 'Help' })
    expect(link).toHaveAttribute('href', '#toolbar-pointer-2')

    const seen: boolean[] = []
    link.addEventListener('click', (event) => seen.push(event.defaultPrevented))

    await user.click(link)
    await m.settle()
    expect(seen).toEqual([false])
    expect(document.activeElement).toBe(link)
    expect(link).toHaveAttribute('tabindex', '0')
  })
})
