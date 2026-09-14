import { Toolbar } from '@kit/solid'
import { screen, within } from '@testing-library/dom'
import { describe, expect, onTestFinished } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function addNode(html: string): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', html)
  const el = document.body.lastElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing added')
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

describe('toolbar roles and attributes', () => {
  spec('toolbar.roles.1', () => {
    const m = mount('toolbar', { 'aria-label': 'Format', children: format })
    const el = root(m.container)
    expect(el).toHaveAttribute('role', 'toolbar')
    expect(screen.getByRole('toolbar')).toBe(el)
    expect(within(el).getAllByRole('button')).toHaveLength(3)
  })

  spec('toolbar.roles.2', async () => {
    const labelled = mount('toolbar', { 'aria-label': 'Text formatting', children: format })
    expect(screen.getByRole('toolbar')).toHaveAccessibleName('Text formatting')
    await expectNoViolations(labelled.container)
    labelled.unmount()

    addNode('<h2 id="toolbar-roles-2">Text formatting</h2>')
    const referenced = mount('toolbar', {
      'aria-labelledby': 'toolbar-roles-2',
      children: format,
    })
    expect(screen.getByRole('toolbar')).toHaveAccessibleName('Text formatting')
    referenced.unmount()

    const nameless = mount('toolbar', { children: format })
    expect(root(nameless.container)).toHaveAccessibleName('')
  })

  spec('toolbar.roles.3', () => {
    const horizontal = mount('toolbar', { 'aria-label': 'Format', children: format })
    const flat = root(horizontal.container)
    expect(flat).not.toHaveAttribute('aria-orientation')
    expect(flat).toHaveAttribute('data-orientation', 'horizontal')
    horizontal.unmount()

    const vertical = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: format,
    })
    const tall = root(vertical.container)
    expect(tall).toHaveAttribute('aria-orientation', 'vertical')
    expect(tall).toHaveAttribute('data-orientation', 'vertical')
  })

  spec('toolbar.roles.4', () => {
    const grouped = mount('toolbar', { 'aria-label': 'Format', children: format })
    expect(within(root(grouped.container)).getAllByRole('button').length).toBeGreaterThanOrEqual(3)
    grouped.unmount()

    const pair = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    expect(root(pair.container)).toHaveAttribute('role', 'toolbar')
    expect(within(root(pair.container)).getAllByRole('button')).toHaveLength(2)
  })

  spec('toolbar.roles.5', async () => {
    const bare = mount('toolbar', { 'aria-label': 'Format', children: format })
    expect(root(bare.container)).not.toHaveAttribute('aria-controls')
    bare.unmount()

    addNode('<textarea id="toolbar-roles-5" aria-label="Document"></textarea>')
    const m = mount('toolbar', {
      'aria-label': 'Format',
      'aria-controls': 'toolbar-roles-5',
      children: format,
    })
    expect(root(m.container)).toHaveAttribute('aria-controls', 'toolbar-roles-5')
    await expectNoViolations(document.body, ['aria-allowed-attr', 'aria-valid-attr-value'])
  })

  spec('toolbar.roles.6', async () => {
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>
            <span aria-hidden="true">B</span>Bold
          </Toolbar.Button>
          <Toolbar.Button>
            <span role="presentation">I</span>Italic
          </Toolbar.Button>
        </>
      ),
    })

    const hidden = m.container.querySelector('[aria-hidden="true"]')
    if (!(hidden instanceof HTMLElement)) throw new Error('no hidden glyph')
    expect(screen.getByRole('button', { name: 'Bold' })).toContainElement(hidden)
    expect(hidden).not.toHaveAttribute('tabindex')

    const presentational = m.container.querySelector('[role="presentation"]')
    if (!(presentational instanceof HTMLElement)) throw new Error('no presentational glyph')
    expect(presentational).not.toHaveAttribute('tabindex')
    expect(presentational.querySelectorAll('a[href], button, input, [tabindex]')).toHaveLength(0)
    const global = [...presentational.attributes].filter((a) => a.name.startsWith('aria-'))
    expect(global).toEqual([])

    await expectNoViolations(m.container, ['aria-hidden-focus', 'presentation-role-conflict'])
  })

  spec('toolbar.roles.7', async () => {
    const m = mount('toolbar', {
      'aria-label': 'Format',
      'aria-expanded': 'false',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Group aria-label="Align">
            <Toolbar.Button>Left</Toolbar.Button>
            <Toolbar.Button>Right</Toolbar.Button>
          </Toolbar.Group>
          <Toolbar.Link href="#toolbar-roles-7">Help</Toolbar.Link>
        </>
      ),
    })
    const el = root(m.container)
    expect(el).toHaveAttribute('role', 'toolbar')
    expect(el).toHaveAttribute('aria-expanded', 'false')
    expect(within(el).getAllByRole('button')).toHaveLength(3)
    expect(within(el).getByRole('link')).toBeInTheDocument()
    expect(within(el).getByRole('group')).toBeInTheDocument()
    await expectNoViolations(m.container, [
      'aria-allowed-attr',
      'aria-required-attr',
      'aria-required-children',
      'aria-required-parent',
      'aria-roles',
    ])
  })

  spec('toolbar.roles.8', () => {
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    const el = within(root(m.container)).getByRole('separator')
    expect(el.tagName).toBe('HR')
    expect(el).not.toHaveAttribute('role')
    m.unmount()

    const divided = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator as="div" />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    expect(within(root(divided.container)).getByRole('separator')).toHaveAttribute(
      'role',
      'separator'
    )
  })

  spec('toolbar.roles.9', () => {
    const horizontal = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    expect(within(root(horizontal.container)).getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    )
    horizontal.unmount()

    const vertical = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    const el = within(root(vertical.container)).getByRole('separator')
    expect(el).toHaveAttribute('data-orientation', 'horizontal')
    expect(el).not.toHaveAttribute('aria-orientation')
  })

  spec('toolbar.roles.10', () => {
    const m = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator orientation="horizontal" />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    const el = within(root(m.container)).getByRole('separator')
    expect(el).toHaveAttribute('data-orientation', 'horizontal')
    expect(el).not.toHaveAttribute('aria-orientation')
    m.unmount()

    const upright = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator orientation="vertical" />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    expect(within(root(upright.container)).getByRole('separator')).toHaveAttribute(
      'aria-orientation',
      'vertical'
    )
  })

  spec('toolbar.roles.13', () => {
    const horizontal = mount('toolbar', {
      'aria-label': 'Format',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Link href="#toolbar-roles-13">Help</Toolbar.Link>
        </>
      ),
    })
    const scope = within(root(horizontal.container))
    for (const el of [...scope.getAllByRole('button'), ...scope.getAllByRole('link')]) {
      expect(el).toHaveAttribute('data-orientation', 'horizontal')
    }
    horizontal.unmount()

    const vertical = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: format,
    })
    for (const el of within(root(vertical.container)).getAllByRole('button')) {
      expect(el).toHaveAttribute('data-orientation', 'vertical')
    }
  })

  spec('toolbar.roles.19', () => {
    const m = mount('toolbar', {
      'aria-label': 'Format',
      orientation: 'vertical',
      children: () => (
        <>
          <Toolbar.Button>Bold</Toolbar.Button>
          <Toolbar.Separator />
          <Toolbar.Button>Italic</Toolbar.Button>
        </>
      ),
    })
    const el = within(root(m.container)).getByRole('separator')
    expect(el).not.toHaveAttribute('aria-orientation')
  })
})
