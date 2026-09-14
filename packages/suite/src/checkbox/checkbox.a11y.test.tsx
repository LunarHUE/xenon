import type { CheckboxProps } from '../harness'
import { describe, expect } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function backingInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

describe('checkbox a11y', () => {
  spec('checkbox.a11y.1', async () => {
    const configs: CheckboxProps[] = [
      { 'aria-label': 'Agree' },
      { 'aria-label': 'Agree', disabled: true },
      { 'aria-label': 'Agree', defaultChecked: true },
      { 'aria-label': 'Agree', checked: true },
      { 'aria-label': 'Agree', indeterminate: true },
      { as: 'button', 'aria-label': 'Agree', checked: true },
      { as: 'div', 'aria-label': 'Agree', indeterminate: true },
    ]

    for (const props of configs) {
      const m = mount('checkbox', props)
      expect(host(m.container)).toHaveAccessibleName('Agree')
      await expectNoViolations(m.container)
      m.unmount()
    }
  })

  spec('checkbox.a11y.2', async () => {
    const m = mount('checkbox', { as: 'button', name: 'agree', 'aria-label': 'Agree' })
    const backing = backingInput(m.container)

    expect(backing).toHaveAttribute('aria-hidden', 'true')
    expect(backing).toHaveAttribute('tabindex', '-1')
    expect(backing).not.toHaveAttribute('hidden')
    expect(host(m.container).querySelector('input')).toBe(null)

    await expectNoViolations(m.container, ['label', 'nested-interactive'])
  })
})
