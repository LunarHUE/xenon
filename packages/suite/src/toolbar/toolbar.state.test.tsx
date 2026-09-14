import { Toolbar } from '@tenon/solid'
import { within } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { describe, expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

describe('toolbar state', () => {
  spec('toolbar.state.1', () => {
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button disabled>Copy</Toolbar.Button>
          <Toolbar.Button disabled>Cut</Toolbar.Button>
          <Toolbar.Button disabled>Paste</Toolbar.Button>
          <Toolbar.Button>Select all</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    for (const name of ['Copy', 'Cut', 'Paste']) {
      const el = scope.getByRole('button', { name })
      expect(el).toHaveAttribute('aria-disabled', 'true')
      expect(el).toHaveAttribute('data-disabled', '')
    }
    expect(scope.getByRole('button', { name: 'Select all' })).not.toHaveAttribute('aria-disabled')
  })

  spec('toolbar.state.2', async () => {
    const [selection, setSelection] = createSignal(false)
    const [clipboard, setClipboard] = createSignal(false)
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button disabled={!selection()}>Copy</Toolbar.Button>
          <Toolbar.Button disabled={!selection()}>Cut</Toolbar.Button>
          <Toolbar.Button disabled={!clipboard()}>Paste</Toolbar.Button>
        </>
      ),
    })
    const scope = within(root(m.container))
    const copy = scope.getByRole('button', { name: 'Copy' })
    const cut = scope.getByRole('button', { name: 'Cut' })
    const paste = scope.getByRole('button', { name: 'Paste' })

    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(cut).toHaveAttribute('aria-disabled', 'true')
    expect(paste).toHaveAttribute('aria-disabled', 'true')

    setSelection(true)
    await m.settle()
    expect(copy).not.toHaveAttribute('aria-disabled')
    expect(cut).not.toHaveAttribute('aria-disabled')
    expect(paste).toHaveAttribute('aria-disabled', 'true')

    setClipboard(true)
    await m.settle()
    expect(paste).not.toHaveAttribute('aria-disabled')

    setSelection(false)
    await m.settle()
    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(cut).toHaveAttribute('aria-disabled', 'true')
    expect(paste).not.toHaveAttribute('aria-disabled')
  })

  spec('toolbar.state.5', async () => {
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      disabled: true,
      children: () => (
        <>
          <Toolbar.Button>Cut</Toolbar.Button>
          <Toolbar.Group aria-label="Align">
            <Toolbar.Button>Left</Toolbar.Button>
          </Toolbar.Group>
        </>
      ),
    })
    const el = root(m.container)
    const scope = within(el)
    for (const name of ['Cut', 'Left']) {
      const button = scope.getByRole('button', { name })
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveAttribute('data-disabled', '')
    }
    expect(scope.getByRole('group')).toHaveAttribute('data-disabled', '')

    m.setProps({ disabled: false })
    await m.settle()
    expect(scope.getByRole('button', { name: 'Cut' })).not.toHaveAttribute('aria-disabled')
    expect(scope.getByRole('group')).not.toHaveAttribute('data-disabled')
  })

  spec('toolbar.state.6', () => {
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      disabled: true,
      children: () => (
        <>
          <Toolbar.Button>Cut</Toolbar.Button>
          <Toolbar.Link href="#toolbar-state-6">Help</Toolbar.Link>
          <Toolbar.Group aria-label="More" disabled>
            <Toolbar.Link href="#toolbar-state-6-group">Docs</Toolbar.Link>
          </Toolbar.Group>
        </>
      ),
    })
    const scope = within(root(m.container))
    for (const name of ['Help', 'Docs']) {
      const link = scope.getByRole('link', { name })
      expect(link).not.toHaveAttribute('data-disabled')
      expect(link).not.toHaveAttribute('aria-disabled')
    }
    expect(scope.getByRole('button', { name: 'Cut' })).toHaveAttribute('aria-disabled', 'true')
  })
})
