import { expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('button.roles.5', () => {
  for (const haspopup of ['menu', 'true'] as const) {
    const m = mount('button', { children: 'Menu', 'aria-haspopup': haspopup })
    expect(m.container.firstElementChild).toHaveAttribute('aria-haspopup', haspopup)
    expect(m.container.firstElementChild).toHaveAccessibleName('Menu')
  }
})
