import type { SwitchProps } from '../harness'
import { afterEach, describe } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

const hosts: SwitchProps[] = [
  { 'aria-label': 'Lights' },
  { as: 'button', children: 'Lights' },
  { as: 'div', children: 'Lights' },
]

function createForm(): HTMLFormElement {
  const form = document.createElement('form')
  document.body.appendChild(form)
  extras.add(form)
  return form
}

describe('switch accessibility tooling', () => {
  spec('switch.a11y.1', async () => {
    for (const base of hosts) {
      const standalone = mount('switch', base)
      await expectNoViolations(standalone.container)
      standalone.unmount()

      const inForm = mount('switch', { ...base, name: 'lights', required: true })
      const form = createForm()
      form.appendChild(inForm.container)
      await expectNoViolations(form)
      inForm.unmount()
    }
  })

  spec('switch.a11y.2', async () => {
    for (const base of hosts) {
      const m = mount('switch', { ...base, name: 'lights' })
      const form = createForm()
      form.appendChild(m.container)
      await expectNoViolations(form, ['label', 'nested-interactive'])
      m.unmount()
    }
  })
})
