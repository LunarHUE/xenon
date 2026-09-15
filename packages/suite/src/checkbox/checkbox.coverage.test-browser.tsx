import axe from 'axe-core'
import { userEvent } from 'vitest/browser'
import { expect, onTestFinished, test } from 'vitest'
import { mount } from '../harness/solid'

test('checkbox.forms.11: changing a required checkbox then blurring marks it user-invalid', async () => {
  const m = mount('checkbox', { name: 'agree', required: true })
  const form = document.createElement('form')
  document.body.append(form)
  onTestFinished(() => form.remove())
  form.append(m.container)
  const control = m.container.firstElementChild as HTMLInputElement
  await userEvent.click(control)
  await m.settle()
  await userEvent.click(control)
  await m.settle()
  control.blur()
  expect(control.matches(':invalid')).toBe(true)
  expect(control.matches(':user-invalid')).toBe(true)
})

test('checkbox.forms.9: a changed required checkbox reports the browser validity flags after blur', async () => {
  const m = mount('checkbox', { name: 'agree', required: true })
  const form = document.createElement('form')
  document.body.append(form)
  onTestFinished(() => form.remove())
  form.append(m.container)
  const control = m.container.firstElementChild as HTMLInputElement
  await userEvent.click(control)
  await m.settle()
  await userEvent.click(control)
  await m.settle()
  control.blur()
  expect(control.checkValidity()).toBe(false)
  expect(control.validity.valueMissing).toBe(true)
  expect(control.matches(':user-invalid')).toBe(true)
})

test('checkbox.roles.14: an author-sized checkbox passes axe target-size with a measurable 24px target', async () => {
  const m = mount('checkbox', {
    as: 'div',
    children: 'Agree',
    style: { width: '24px', height: '24px' },
  })
  const control = m.container.firstElementChild as HTMLElement
  expect(control.getBoundingClientRect().width).toBeGreaterThanOrEqual(24)
  expect(control.getBoundingClientRect().height).toBeGreaterThanOrEqual(24)
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['target-size'] },
    rules: { 'target-size': { enabled: true } },
  })
  expect(results.violations).toHaveLength(0)
})
