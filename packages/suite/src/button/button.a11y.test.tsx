import type { ButtonProps } from '../harness'
import { describe, expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

describe('button a11y', () => {
  spec('button.a11y.1', async () => {
    const m = mount('button', { as: 'input', type: 'button', value: 'Go' })
    const el = host(m.container)
    if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
    expect(el.type).toBe('button')
    expect(el.value).toBe('Go')
    await expectNoViolations(m.container, ['input-button-name'])
  })

  spec('button.a11y.2', async () => {
    const text = mount('button', { as: 'div', children: 'Go' })
    expect(host(text.container)).toHaveAccessibleName('Go')
    await expectNoViolations(text.container, ['aria-command-name'])
    text.unmount()

    const labelled = mount('button', { as: 'div', 'aria-label': 'Go' })
    expect(host(labelled.container)).toHaveAccessibleName('Go')
    await expectNoViolations(labelled.container, ['aria-command-name'])
  })

  spec('button.a11y.3', async () => {
    const m = mount('button', { as: 'div', children: 'Go' })
    const el = host(m.container)
    expect(el).toHaveAttribute('tabindex', '0')
    expect(el).toHaveAttribute('role', 'button')
    await expectNoViolations(m.container, ['focus-order-semantics'])
  })

  spec('button.a11y.4', async () => {
    for (const as of ['div', 'span'] as const) {
      const m = mount('button', { as, children: 'Go' })
      await expectNoViolations(m.container, ['aria-allowed-role'])
      m.unmount()
    }

    const link = mount('button', { as: 'a', href: '#a11y-4', children: 'Go' } as ButtonProps)
    await expectNoViolations(link.container, ['aria-allowed-role'])
  })

  spec('button.a11y.5', async () => {
    const native = mount('button', { children: 'Go' })
    await expectNoViolations(native.container, ['aria-roles'])
    native.unmount()

    const custom = mount('button', { as: 'div', children: 'Go' })
    expect(host(custom.container)).toHaveAttribute('role', 'button')
    await expectNoViolations(custom.container, ['aria-roles'])
  })

  spec('button.a11y.6', async () => {
    const m = mount('button', {
      as: 'div',
      children: 'Go',
      disabled: true,
      'aria-pressed': 'false',
      'aria-expanded': 'false',
    })
    await expectNoViolations(m.container, ['aria-allowed-attr', 'aria-required-attr'])
  })

  spec('button.a11y.7', async () => {
    const m = mount('button', {
      children: [<span id="button-a11y-7">Saves your work</span>, 'Save'],
      'aria-describedby': 'button-a11y-7',
      'aria-pressed': 'false',
    })
    const el = host(m.container)
    expect(el).toHaveAccessibleDescription('Saves your work')
    await expectNoViolations(m.container, ['aria-valid-attr', 'aria-valid-attr-value'])
  })

  spec('button.a11y.8', async () => {
    const m = mount('button', { children: 'Go', 'aria-label': 'Go now' })
    const el = host(m.container)
    expect(el).not.toHaveAttribute('role', 'presentation')
    expect(el).not.toHaveAttribute('role', 'none')
    await expectNoViolations(m.container, ['aria-prohibited-attr'])
  })

  spec('button.a11y.9', async () => {
    mount('button', {
      children: [<span id="button-a11y-9">Saves your work</span>, 'Save'],
      'aria-describedby': 'button-a11y-9',
    })
    expect(document.querySelectorAll('#button-a11y-9')).toHaveLength(1)
    await expectNoViolations(document.body, ['duplicate-id-aria'])
  })

  spec('button.a11y.10', async () => {
    const m = mount('button', { as: 'div', children: 'Go' })
    const el = host(m.container)
    expect(el.getAttribute('role')).toBe('button')
    await expectNoViolations(m.container, ['presentation-role-conflict'])
  })

  spec('button.a11y.11', async () => {
    const m = mount('button', {
      children: [
        <svg aria-hidden="true">
          <title>Trash</title>
        </svg>,
        'Delete',
      ],
    })
    const hidden = m.container.querySelector('[aria-hidden="true"]')
    expect(hidden).not.toBeNull()
    expect(
      hidden?.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')
    ).toHaveLength(0)
    await expectNoViolations(m.container, ['aria-hidden-focus'])
  })

  spec('button.a11y.12', async () => {
    const m = mount('button', {
      children: 'Go',
      'aria-label': 'Go now',
      'aria-braillelabel': 'Go',
      'aria-roledescription': 'action',
      'aria-brailleroledescription': 'act',
    })
    const el = host(m.container)
    expect(el).toHaveAccessibleName('Go now')
    expect(el).toHaveAttribute('aria-roledescription', 'action')
    await expectNoViolations(m.container, ['aria-braille-equivalent'])
  })
})
