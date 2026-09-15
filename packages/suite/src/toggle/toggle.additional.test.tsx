import axe from 'axe-core'
import { expect, test } from 'vitest'

import { mount } from '../harness/solid'

test('toggle.a11y.1 runs the button rule set including label-content-name-mismatch', async () => {
  for (const as of ['button', 'div'] as const) {
    for (const disabled of [false, true]) {
      const m = mount('toggle', {
        as,
        children: 'Mute',
        disabled,
        defaultPressed: true,
        'aria-label': 'Mute',
      })
      const results = await axe.run(m.container, {
        runOnly: {
          type: 'rule',
          values: [
            'button-name',
            'aria-command-name',
            'nested-interactive',
            'focus-order-semantics',
            'label-content-name-mismatch',
          ],
        },
        rules: { 'label-content-name-mismatch': { enabled: true } },
      })
      expect(results.violations.map((violation) => violation.id)).toEqual([])
      m.unmount()
    }
  }
})

test('toggle.a11y.5 is valid inside a form for enabled and disabled controls', async () => {
  for (const disabled of [false, true]) {
    const m = mount('toggle', {
      children: 'Mute',
      name: 'mute',
      disabled,
      onClick: (event: Event) => event.preventDefault(),
    })
    const form = document.createElement('form')
    form.append(m.container)
    document.body.append(form)
    const results = await axe.run(form, {
      rules: { region: { enabled: false }, 'color-contrast': { enabled: false } },
    })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
    form.remove()
    m.unmount()
  }
})
