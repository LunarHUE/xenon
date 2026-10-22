import axe from 'axe-core'
import { expect, test } from 'vitest'

import { mount } from './solid'

// These are DOM/axe contracts. Native accessibility-tree exposure is covered in E2E.
for (const family of ['checkbox', 'switch'] as const) {
  for (const checked of [false, true]) {
    for (const disabled of [false, true]) {
      test(`${family} emitted generic-host role and required state remain valid checked=${checked} disabled=${disabled}`, async () => {
        const view = mount(family, { as: 'div', 'aria-label': 'Setting', checked, disabled })
        const control = view.container.firstElementChild!
        expect(control).toHaveAttribute('role', family)
        expect(control).toHaveAttribute('aria-checked', String(checked))
        const result = await axe.run(view.container, {
          runOnly: {
            type: 'rule',
            values: [
              'aria-roles',
              'aria-required-attr',
              'aria-allowed-attr',
              'aria-valid-attr-value',
            ],
          },
        })
        expect(result.violations).toEqual([])
        expect(result.passes.map(({ id }) => id)).toEqual(
          expect.arrayContaining(['aria-roles', 'aria-required-attr', 'aria-valid-attr-value'])
        )
      })
    }
    test(`${family} raw required-state scan identifies the actual rendered host when aria-checked is removed checked=${checked}`, async () => {
      const view = mount(family, { as: 'div', 'aria-label': 'Setting', checked })
      const control = view.container.firstElementChild!
      control.id = `wave2-${family}`
      control.removeAttribute('aria-checked')
      const result = await axe.run(view.container, { runOnly: ['aria-required-attr'] })
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toMatchObject({ id: 'aria-required-attr', impact: 'critical' })
      expect(result.violations[0]!.nodes.map(({ target }) => target)).toEqual([
        [`#wave2-${family}`],
      ])
      control.setAttribute('aria-checked', String(checked))
      expect(
        (await axe.run(view.container, { runOnly: ['aria-required-attr'] })).violations
      ).toEqual([])
    })
  }
  for (const role of ['widget', 'wave2-invalid']) {
    test(`${family} raw role scan rejects ${role} on the emitted host with exact impact`, async () => {
      const view = mount(family, { as: 'div', 'aria-label': 'Setting' })
      const control = view.container.firstElementChild!
      control.setAttribute('role', role)
      const result = await axe.run(view.container, { runOnly: ['aria-roles'] })
      expect(result.violations).toHaveLength(1)
      expect(result.violations[0]).toMatchObject({ id: 'aria-roles', impact: 'critical' })
      expect(result.violations[0]!.nodes).toHaveLength(1)
      control.setAttribute('role', family)
      expect((await axe.run(view.container, { runOnly: ['aria-roles'] })).violations).toEqual([])
    })
  }
}
