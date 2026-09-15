import type { ButtonProps } from '../harness'
import axe from 'axe-core'
import { expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

async function violations(container: HTMLElement, rule: string) {
  const result = await axe.run(container, { runOnly: { type: 'rule', values: [rule] } })
  return result.violations.filter((item) => item.id === rule)
}

spec('button.a11y.3', async () => {
  const m = mount('button', {
    as: 'div',
    role: 'button',
    tabIndex: 0,
    children: 'Continue',
  } as ButtonProps)
  expect(m.container.firstElementChild).toHaveAttribute('role', 'button')
  expect(m.container.firstElementChild).toHaveAttribute('tabindex', '0')
})

spec('button.a11y.11', async () => {
  const invalid = mount('button', {
    id: 'outer-hidden',
    as: 'div',
    'aria-hidden': 'true',
    children: (
      <div id="inner-hidden" aria-hidden="true">
        <button>Nested</button>
      </div>
    ),
  } as ButtonProps)
  const failures = await violations(invalid.container, 'aria-hidden-focus')
  expect(failures[0]?.impact).toBe('serious')
  expect(failures[0]?.nodes).toHaveLength(1)
  expect(failures[0]?.nodes[0]?.target).toEqual(['#outer-hidden'])
})
