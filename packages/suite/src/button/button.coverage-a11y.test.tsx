import type { ButtonProps } from '../harness'
import axe from 'axe-core'
import { expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

async function violations(container: HTMLElement, rule: string) {
  const result = await axe.run(container, { runOnly: { type: 'rule', values: [rule] } })
  return result.violations.filter((item) => item.id === rule)
}

spec('button.a11y.1', async () => {
  const named = mount('button', {
    as: 'input',
    type: 'submit',
    'aria-label': 'Send',
  } as ButtonProps)
  expect(await violations(named.container, 'input-button-name')).toHaveLength(0)
  const empty = mount('button', { as: 'input', type: 'reset', value: '' } as ButtonProps)
  const failures = await violations(empty.container, 'input-button-name')
  expect(failures[0]?.impact).toBe('critical')
})

spec('button.a11y.2', async () => {
  const named = mount('button', { as: 'span', role: 'button', title: 'Continue' } as ButtonProps)
  expect(named.container.firstElementChild).toHaveAccessibleName('Continue')
  expect(await violations(named.container, 'aria-command-name')).toHaveLength(0)
  const empty = mount('button', { as: 'div', role: 'button' } as ButtonProps)
  expect((await violations(empty.container, 'aria-command-name'))[0]?.impact).toBe('serious')
})

spec('button.a11y.10', async () => {
  const invalid = mount('button', {
    as: 'div',
    children: (
      <button role="presentation" tabindex="0">
        Presentational child
      </button>
    ),
  } as ButtonProps)
  expect((await violations(invalid.container, 'presentation-role-conflict'))[0]?.impact).toBe(
    'minor'
  )
})

spec('button.roles.7', async () => {
  const invalid = mount('button', {
    as: 'div',
    children: <input tabindex={-1} aria-label="Nested" />,
  } as ButtonProps)
  expect((await violations(invalid.container, 'nested-interactive'))[0]?.impact).toBe('serious')
})

spec('button.roles.10', async () => {
  const m = mount('button', { as: 'div', children: <h2>Heading child</h2> } as ButtonProps)
  expect(m.container.firstElementChild).toHaveAccessibleName('Heading child')
  expect(await violations(m.container, 'aria-allowed-attr')).toHaveLength(0)
})
