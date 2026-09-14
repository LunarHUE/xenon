import type { ButtonProps } from '@kit/solid'
import { screen } from '@testing-library/dom'
import axe from 'axe-core'
import { describe, expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

describe('button roles', () => {
  spec('button.roles.1', () => {
    mount('button', { as: 'div', children: 'Go' })
    expect(screen.getByRole('button')).toHaveAttribute('role', 'button')
  })

  spec('button.roles.2', async () => {
    const content = mount('button', { children: 'Save' })
    expect(screen.getByRole('button')).toHaveAccessibleName('Save')
    await expectNoViolations(content.container, ['button-name'])
    content.unmount()

    const labelled = mount('button', { children: 'Save', 'aria-label': 'Save document' })
    expect(screen.getByRole('button')).toHaveAccessibleName('Save document')
    labelled.unmount()

    const referenced = mount('button', {
      children: [<span>Save</span>, <span id="button-roles-2">Archive</span>],
      'aria-labelledby': 'button-roles-2',
    })
    expect(screen.getByRole('button')).toHaveAccessibleName('Archive')
    referenced.unmount()

    const nameless = mount('button', {})
    const native = await axe.run(nameless.container, {
      runOnly: { type: 'rule', values: ['button-name'] },
    })
    expect(native.violations.map((v) => v.impact)).toEqual(['critical'])
    nameless.unmount()

    const custom = mount('button', { as: 'div' })
    const results = await axe.run(custom.container, {
      runOnly: { type: 'rule', values: ['aria-command-name'] },
    })
    expect(results.violations.map((v) => v.impact)).toEqual(['serious'])
  })

  spec('button.roles.3', () => {
    mount('button', {
      children: [<span>Save</span>, <span id="button-roles-3">Saves your work</span>],
      'aria-describedby': 'button-roles-3',
    })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-describedby', 'button-roles-3')
    expect(el).toHaveAccessibleDescription('Saves your work')
  })

  spec('button.roles.4', () => {
    const unavailable = mount('button', { as: 'div', children: 'Go', disabled: true })
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    unavailable.unmount()

    mount('button', { children: 'Go', 'aria-disabled': 'true' })
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
  })

  spec.todo('button.roles.5')

  spec.todo('button.roles.6')

  spec('button.roles.7', async () => {
    const m = mount('button', { as: 'div', children: 'Go' })
    const el = screen.getByRole('button')
    expect(
      el.querySelectorAll('a[href], button, input, select, textarea, [tabindex], [contenteditable]')
    ).toHaveLength(0)
    await expectNoViolations(m.container, ['nested-interactive'])
  })

  spec('button.roles.8', () => {
    mount('button', {
      children: [
        <svg aria-hidden="true">
          <title>Trash</title>
        </svg>,
        'Delete',
      ],
    })
    expect(screen.getByRole('button')).toHaveAccessibleName('Delete')
  })

  spec.todo('button.roles.9')

  spec('button.roles.10', async () => {
    const m = mount('button', {
      as: 'div',
      children: 'Go',
      'aria-pressed': 'false',
      'aria-expanded': 'false',
    })
    expect(screen.getByRole('button')).toHaveAccessibleName('Go')
    await expectNoViolations(m.container, [
      'aria-allowed-attr',
      'aria-required-attr',
      'aria-required-children',
      'aria-required-parent',
      'aria-command-name',
    ])
  })

  spec('button.roles.11', () => {
    const m = mount('button', { children: 'Go', type: 'submit' })
    const el = host(m.container)
    if (!(el instanceof HTMLButtonElement)) throw new Error('not a button host')
    expect(el.type).toBe('submit')
    m.setProps({ type: 'reset' })
    expect(el.type).toBe('reset')
    m.setProps({ type: 'button' })
    expect(el.type).toBe('button')
    el.setAttribute('type', 'sideways')
    expect(el.type).toBe('submit')
  })

  spec('button.roles.12', async () => {
    const m = mount('button', { as: 'div', children: 'Save', 'aria-label': 'Save document' })
    const el = screen.getByRole('button')
    expect(el).toHaveAccessibleName('Save document')
    expect(el.getAttribute('aria-label')).toContain(el.textContent ?? '')
    const results = await axe.run(m.container, {
      runOnly: { type: 'rule', values: ['label-content-name-mismatch'] },
      rules: { 'label-content-name-mismatch': { enabled: true } },
    })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })

  spec('button.roles.13', () => {
    mount('button', { children: 'Go' })
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  spec('button.roles.14', () => {
    for (const as of ['div', 'span', 'a'] as const) {
      const m = mount('button', { as, children: 'Go' })
      expect(host(m.container)).not.toHaveAttribute('type')
      m.unmount()
    }
  })

  spec('button.roles.15', () => {
    const native = mount('button', { children: 'Go', type: 'submit' })
    expect(host(native.container)).toHaveAttribute('type', 'submit')
    native.setProps({ type: 'reset' })
    expect(host(native.container)).toHaveAttribute('type', 'reset')
    native.unmount()

    const input = mount('button', { as: 'input', type: 'submit', value: 'Go' })
    expect(host(input.container)).toHaveAttribute('type', 'submit')
  })

  spec('button.roles.16', () => {
    mount('button', { children: 'Go', disabled: true })
    const el = screen.getByRole('button')
    expect(el).toBeDisabled()
    expect(el).not.toHaveAttribute('aria-disabled')
  })

  spec('button.roles.17', () => {
    mount('button', { children: 'Go', as: 'div', disabled: true })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toHaveAttribute('disabled')
  })

  spec('button.roles.18', () => {
    const m = mount('button', { children: 'Go' })
    expect(screen.getByRole('button')).not.toHaveAttribute('data-disabled')
    m.setProps({ disabled: true })
    expect(screen.getByRole('button')).toHaveAttribute('data-disabled', '')
  })

  spec('button.roles.19', () => {
    mount('button', { children: 'Go', 'data-testid': 'go', 'data-foo': 'bar' } as ButtonProps)
    const el = screen.getByTestId('go')
    expect(el).toHaveAttribute('data-foo', 'bar')
  })

  spec('button.roles.20', () => {
    mount('button', { children: 'Go', 'aria-disabled': 'true' })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toHaveAttribute('disabled')
    expect(el).not.toBeDisabled()
  })

  spec('button.roles.21', () => {
    const m = mount('button', {
      as: 'a',
      href: '#roles-21',
      rel: 'search',
      children: 'Go',
    } as ButtonProps)
    expect(host(m.container)).toHaveAttribute('rel', 'search')
    m.setProps({ rel: 'noopener noreferrer' } as Partial<ButtonProps>)
    expect(host(m.container)).toHaveAttribute('rel', 'noopener noreferrer')
  })

  spec('button.roles.22', () => {
    mount('button', { children: 'Go', 'aria-current': 'page', 'aria-keyshortcuts': 'Control+S' })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-current', 'page')
    expect(el).toHaveAttribute('aria-keyshortcuts', 'Control+S')
  })

  spec('button.roles.23', () => {
    mount('button', { children: 'Go', autofocus: true })
    expect(screen.getByRole('button')).toHaveAttribute('data-autofocus')
  })

  spec.todo('button.roles.24')

  spec('button.roles.25', () => {
    const m = mount('button', { as: 'textarea', placeholder: 'Write' } as ButtonProps)
    const el = host(m.container)
    expect(el.tagName).toBe('TEXTAREA')
    expect(el).toHaveAttribute('placeholder', 'Write')
  })
})
