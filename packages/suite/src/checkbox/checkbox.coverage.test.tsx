import { afterEach, expect, test } from 'vitest'
import userEvent from '@testing-library/user-event'
import { mount } from '../harness/solid'

const extras: HTMLElement[] = []

function host(container: HTMLElement) {
  return container.firstElementChild as HTMLElement
}

function input(container: HTMLElement) {
  return host(container) as HTMLInputElement
}

function mirror(container: HTMLElement) {
  return container.querySelector('input[aria-hidden="true"]') as HTMLInputElement
}

afterEach(() => {
  extras.splice(0).forEach((element) => element.remove())
})

test('checkbox.forms.6: disabled nested fieldsets propagate through every descendant fieldset', () => {
  const form = document.createElement('form')
  const outer = document.createElement('fieldset')
  const middle = document.createElement('fieldset')
  const inner = document.createElement('fieldset')
  outer.disabled = true
  form.append(outer)
  outer.append(middle)
  middle.append(inner)
  document.body.append(form)
  extras.push(form)
  const m = mount('checkbox', { name: 'nested', defaultChecked: true })
  inner.append(m.container)
  expect(input(m.container).matches(':disabled')).toBe(true)
  expect(new FormData(form).get('nested')).toBeNull()
})

test('checkbox.forms.8: form association follows matching form IDs appearing and disappearing', () => {
  const m = mount('checkbox', { name: 'agree', form: 'late-owner' })
  const control = input(m.container)
  expect(control.form).toBeNull()
  const form = document.createElement('form')
  form.id = 'late-owner'
  document.body.append(form)
  extras.push(form)
  expect(control.form).toBe(form)
  form.remove()
  expect(control.form).toBeNull()
})

test('checkbox.roles.3: title supplies a checkbox accessible name when no label is provided', () => {
  const m = mount('checkbox', { as: 'div', title: 'Accept terms' })
  expect(host(m.container)).toHaveAccessibleName('Accept terms')
})

test('checkbox.roles.8: title names a native checkbox when no label or aria name exists', () => {
  const m = mount('checkbox', { title: 'Accept terms' })
  expect(input(m.container)).toHaveAccessibleName('Accept terms')
})

test('checkbox.roles.10: native and custom checkbox variants pass the default axe scan', async () => {
  const native = mount('checkbox', { 'aria-label': 'Native terms' })
  const custom = mount('checkbox', { as: 'div', children: 'Custom terms' })
  const axe = await import('axe-core')
  expect((await axe.default.run(native.container)).violations).toHaveLength(0)
  expect((await axe.default.run(custom.container)).violations).toHaveLength(0)
})

test('checkbox.forms.23: custom checkbox mirrors toggle checkedness while mixed state stays on the exposed host', async () => {
  const user = userEvent.setup()
  const m = mount('checkbox', {
    as: 'button',
    name: 'agree',
    indeterminate: true,
    children: 'Agree',
  })
  const hidden = mirror(m.container)
  expect(host(m.container)).toHaveAttribute('aria-checked', 'mixed')
  await user.click(host(m.container))
  await m.settle()
  expect(hidden).toBeChecked()
  expect(host(m.container)).toHaveAttribute('aria-checked', 'mixed')
})

test('checkbox.keyboard.4: readonly generic checkbox stays unchecked on Space with an unchecked mirror', async () => {
  const user = userEvent.setup()
  const m = mount('checkbox', { as: 'div', name: 'agree', readonly: true, children: 'Agree' })
  const control = host(m.container)
  await user.click(control)
  await user.keyboard(' ')
  await m.settle()
  expect(control).toHaveAttribute('aria-checked', 'false')
  expect(mirror(m.container)).not.toBeChecked()
})

test('checkbox.state.5: checked generic checkbox keeps a separate mixed state', () => {
  const m = mount('checkbox', {
    as: 'div',
    name: 'agree',
    checked: true,
    indeterminate: true,
    children: 'Agree',
  })
  expect(host(m.container)).toHaveAttribute('aria-checked', 'mixed')
  expect(mirror(m.container)).toBeChecked()
})

test('checkbox.state.13: a generic controlled checkbox follows the controlled prop after a rejected callback', async () => {
  const user = userEvent.setup()
  const m = mount('checkbox', { as: 'div', checked: false, children: 'Agree' })
  m.setProps({ onCheckedChange: () => undefined })
  await user.click(host(m.container))
  await m.settle()
  expect(host(m.container)).toHaveAttribute('aria-checked', 'false')
  m.setProps({ checked: true })
  await m.settle()
  expect(host(m.container)).toHaveAttribute('aria-checked', 'true')
})
