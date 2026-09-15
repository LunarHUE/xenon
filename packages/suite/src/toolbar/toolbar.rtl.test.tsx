import { Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { describe, expect, onTestFinished } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function documentDir(dir: string) {
  const previous = document.documentElement.getAttribute('dir')
  document.documentElement.setAttribute('dir', dir)
  onTestFinished(() => {
    if (previous === null) document.documentElement.removeAttribute('dir')
    else document.documentElement.setAttribute('dir', previous)
  })
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

describe('toolbar rtl and i18n', () => {
  spec('toolbar.rtl.1', async () => {
    const user = userEvent.setup()
    const m = mount('toolbar', { 'aria-label': 'Format', dir: 'rtl', children: format })
    await m.settle()
    const [bold, italic, underline] = trio(m.container)

    bold.focus()
    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(italic)

    await user.keyboard('{ArrowLeft}')
    await m.settle()
    expect(document.activeElement).toBe(underline)

    await user.keyboard('{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(italic)
  })

  spec('toolbar.rtl.2', async () => {
    const user = userEvent.setup()
    documentDir('rtl')
    const m = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: format,
    })
    await m.settle()
    const [bold, italic] = trio(m.container)

    bold.focus()
    await user.keyboard('{ArrowDown}')
    await m.settle()
    expect(document.activeElement).toBe(italic)

    await user.keyboard('{ArrowUp}')
    await m.settle()
    expect(document.activeElement).toBe(bold)

    await user.keyboard('{ArrowLeft}{ArrowRight}')
    await m.settle()
    expect(document.activeElement).toBe(bold)
  })
})
