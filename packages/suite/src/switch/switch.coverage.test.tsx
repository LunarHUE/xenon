import axe from 'axe-core'
import { expect, test } from 'vitest'

import { mount } from '../harness/solid'

function host(container: HTMLElement) {
  return container.firstElementChild as HTMLElement
}

test('switch.focus.2 keeps the native input itself as the tab stop', () => {
  const m = mount('switch', { 'aria-label': 'Lights' })
  const input = host(m.container)
  expect(input).toBeInstanceOf(HTMLInputElement)
  expect(input).not.toHaveAttribute('tabindex', '-1')
  expect(m.container.querySelector('input[aria-hidden="true"]')).toBeNull()
  input.focus()
  expect(input).toHaveFocus()
  m.unmount()
})

test('switch.forms.1 applies native required validity to the switch form control', () => {
  const m = mount('switch', { 'aria-label': 'Lights', name: 'lights', required: true })
  const form = document.createElement('form')
  form.append(m.container)
  document.body.append(form)
  const input = host(m.container) as HTMLInputElement
  expect(input.willValidate).toBe(true)
  expect(input.validity.valueMissing).toBe(true)
  expect(form.checkValidity()).toBe(false)
  input.click()
  expect(input.checked).toBe(true)
  expect(form.checkValidity()).toBe(true)
  form.remove()
  m.unmount()
})

test('switch.roles.10 allows switch-specific ARIA attributes and rejects nested focusable widgets', async () => {
  const m = mount('switch', {
    as: 'button',
    children: 'Lights',
    readonly: true,
    required: true,
    'aria-expanded': 'false',
  })
  const el = host(m.container)
  expect(el).toHaveAccessibleName('Lights')
  expect(el).toHaveAttribute('aria-readonly', 'true')
  expect(el).toHaveAttribute('aria-required', 'true')
  expect(el).toHaveAttribute('aria-expanded', 'false')
  await expectNoSwitchViolations(m.container)
  m.unmount()
})

test('switch.roles.13 passes axe when each referenced label ID is unique', async () => {
  const first = document.createElement('span')
  first.id = 'switch-label-one'
  first.textContent = 'One'
  const second = first.cloneNode(true) as HTMLSpanElement
  second.id = 'switch-label-two'
  document.body.append(first, second)
  const firstSwitch = mount('switch', { as: 'div', 'aria-labelledby': first.id })
  const secondSwitch = mount('switch', { as: 'div', 'aria-labelledby': second.id })
  await expectNoSwitchViolations(document.body)
  first.remove()
  second.remove()
  firstSwitch.unmount()
  secondSwitch.unmount()
})

test('switch.roles.21 preserves explicit type and omits type through a custom non-button host', () => {
  const CustomHost = (props: import('@solidjs/web').JSX.HTMLAttributes<HTMLElement>) => (
    <article {...props} />
  )
  const custom = mount('switch', { as: CustomHost, children: 'Lights' })
  expect(host(custom.container).tagName).toBe('ARTICLE')
  expect(host(custom.container)).not.toHaveAttribute('type')
  custom.unmount()
  const button = mount('switch', { as: 'button', type: 'submit', children: 'Lights' })
  expect(host(button.container)).toHaveAttribute('type', 'submit')
  button.unmount()
})

async function expectNoSwitchViolations(node: Element) {
  const rules = [
    'aria-roles',
    'aria-allowed-attr',
    'aria-required-attr',
    'aria-valid-attr',
    'aria-valid-attr-value',
    'aria-prohibited-attr',
    'aria-deprecated-role',
    'tabindex',
    'duplicate-id-aria',
    'presentation-role-conflict',
    'aria-hidden-focus',
    'aria-braille-equivalent',
  ]
  const results = await axe.run(node, { runOnly: { type: 'rule', values: rules } })
  expect(results.violations.map((violation) => violation.id)).toEqual([])
}
