import { Toolbar } from '@xenon/solid'
import { within } from '@testing-library/dom'
import axe from 'axe-core'
import { describe, expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

const ariaRules = [
  'aria-allowed-attr',
  'aria-conditional-attr',
  'aria-deprecated-role',
  'aria-hidden-focus',
  'aria-prohibited-attr',
  'aria-required-attr',
  'aria-roles',
  'aria-valid-attr',
  'aria-valid-attr-value',
  'aria-braille-equivalent',
  'duplicate-id-aria',
]

function root(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function full() {
  return (
    <>
      <Toolbar.Button>Cut</Toolbar.Button>
      <Toolbar.Button disabled>Copy</Toolbar.Button>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="Align">
        <Toolbar.Button as="div" aria-pressed="true">
          Left
        </Toolbar.Button>
        <Toolbar.Button as="div" aria-pressed="false">
          Right
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Link href="#toolbar-a11y">Help</Toolbar.Link>
    </>
  )
}

describe('toolbar accessibility tooling', () => {
  spec('toolbar.a11y.1', async () => {
    const m = mount('toolbar', { 'aria-label': 'Edit', children: full })
    for (const el of m.container.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
    }
    await expectNoViolations(m.container, ['tabindex'])
  })

  spec('toolbar.a11y.2', async () => {
    const m = mount('toolbar', { 'aria-label': 'Edit', children: full })
    await expectNoViolations(m.container, [
      'button-name',
      'aria-command-name',
      'aria-allowed-attr',
      'nested-interactive',
    ])
    m.unmount()

    const nameless = mount('toolbar', {
      'aria-label': 'Edit',
      children: () => (
        <>
          <Toolbar.Button />
          <Toolbar.Button as="div" />
        </>
      ),
    })
    const named = await axe.run(nameless.container, {
      runOnly: { type: 'rule', values: ['button-name', 'aria-command-name'] },
    })
    const impacts = Object.fromEntries(named.violations.map((v) => [v.id, v.impact]))
    expect(impacts).toEqual({ 'button-name': 'critical', 'aria-command-name': 'serious' })
  })

  spec('toolbar.a11y.6', async () => {
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
    expect(copy).toHaveAttribute('aria-disabled', 'true')
    expect(copy).not.toHaveAttribute('disabled')

    copy.focus()
    expect(document.activeElement).toBe(copy)

    await expectNoViolations(m.container)
  })

  spec('toolbar.a11y.7', async () => {
    const m = mount('toolbar', { 'aria-label': 'Edit', children: full })
    const results = await axe.run(m.container, {
      runOnly: { type: 'rule', values: ['target-size'] },
      rules: { 'target-size': { enabled: true } },
    })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })

  spec('toolbar.a11y.8', async () => {
    const m = mount('toolbar', {
      'aria-label': 'Edit',
      'aria-orientation': 'horizontal',
      children: full,
    })
    await expectNoViolations(m.container, ariaRules)
  })

  spec('toolbar.a11y.9', async () => {
    const m = mount('toolbar', { 'aria-label': 'Edit', children: full })
    await expectNoViolations(m.container)
  })
})
