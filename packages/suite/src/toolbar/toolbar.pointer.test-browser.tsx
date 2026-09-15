import { Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { userEvent } from 'vitest/browser'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

describe('toolbar pointer in a browser', () => {
  spec('toolbar.pointer.4', async () => {
    const user = userEvent
    const onMouseMove = vi.fn()
    const onClick = vi.fn()
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button disabled onMouseMove={onMouseMove} onClick={onClick}>
            Paste
          </Toolbar.Button>
          <Toolbar.Button>Copy</Toolbar.Button>
        </>
      ),
    })
    const paste = within(root(m.container)).getByRole('button', { name: 'Paste' })
    expect(paste).toHaveAttribute('aria-disabled', 'true')
    expect(paste).toHaveAttribute('data-disabled', '')
    expect(paste).not.toHaveAttribute('disabled')

    await user.hover(paste)
    await m.settle()
    expect(onMouseMove).toHaveBeenCalled()

    await user.click(paste, { force: true })
    await m.settle()
    expect(onClick).not.toHaveBeenCalled()
  })
})
