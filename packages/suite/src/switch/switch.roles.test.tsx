import { Field, Switch } from '@xenon-ui/solid'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, describe, expect, vi } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

const extras = new Set<Element>()

afterEach(() => {
  for (const element of extras) element.remove()
  extras.clear()
})

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[aria-hidden="true"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

function labelFor(id: string, text: string): HTMLLabelElement {
  const label = document.createElement('label')
  label.htmlFor = id
  label.textContent = text
  document.body.appendChild(label)
  extras.add(label)
  return label
}

describe('switch roles and attributes', () => {
  spec('switch.roles.1', () => {
    const native = mount('switch', { 'aria-label': 'Lights' })
    expect(host(native.container)).toHaveAttribute('role', 'switch')
    expect(screen.getByRole('switch')).toBe(host(native.container))
    native.unmount()

    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, 'aria-label': 'Lights' })
      expect(host(m.container)).toHaveAttribute('role', 'switch')
      expect(screen.getByRole('switch')).toBe(host(m.container))
      m.unmount()
    }
  })

  spec('switch.roles.2', () => {
    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, 'aria-label': 'Lights', checked: true })
      const el = host(m.container)
      expect(el).toHaveAttribute('aria-checked', 'true')
      m.setProps({ checked: false })
      expect(el).toHaveAttribute('aria-checked', 'false')
      m.unmount()
    }
  })

  spec('switch.roles.3', () => {
    const m = mount('switch', { 'aria-label': 'Lights', checked: true })
    const el = host(m.container)
    if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
    expect(el.type).toBe('checkbox')
    expect(el.checked).toBe(true)
    expect(el).toBeChecked()
    expect(el).not.toHaveAttribute('aria-checked')

    m.setProps({ checked: false })
    expect(el.checked).toBe(false)
    expect(el).not.toHaveAttribute('aria-checked')
  })

  spec('switch.roles.4', async () => {
    const user = userEvent.setup()
    const m = mount('switch', { as: 'div', 'aria-label': 'Lights', indeterminate: true })
    const el = host(m.container)
    expect(el).toHaveAttribute('aria-checked', 'false')

    await user.click(el)
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'true')

    await user.click(el)
    await m.settle()
    expect(el).toHaveAttribute('aria-checked', 'false')
    expect(el).not.toHaveAttribute('data-indeterminate')
  })

  spec('switch.roles.5', async () => {
    const content = mount('switch', { as: 'button', children: 'Lights' })
    expect(host(content.container)).toHaveAccessibleName('Lights')
    await expectNoViolations(content.container, ['aria-toggle-field-name'])
    content.unmount()

    const referenced = mount('switch', {
      as: 'div',
      children: <span id="switch-roles-5">Lights</span>,
      'aria-labelledby': 'switch-roles-5',
    })
    expect(host(referenced.container)).toHaveAccessibleName('Lights')
    await expectNoViolations(referenced.container, ['aria-toggle-field-name'])
    referenced.unmount()

    const labelled = mount('switch', { 'aria-label': 'Lights' })
    expect(host(labelled.container)).toHaveAccessibleName('Lights')
    labelled.unmount()

    const titled = mount('switch', { title: 'Lights' })
    expect(host(titled.container)).toHaveAccessibleName('Lights')
  })

  spec('switch.roles.6', () => {
    const m = mount('switch', { as: 'button', children: 'Lights', checked: false })
    const el = host(m.container)
    expect(el).toHaveAccessibleName('Lights')
    m.setProps({ checked: true })
    expect(el).toHaveAccessibleName('Lights')
    m.unmount()

    const native = mount('switch', { 'aria-label': 'Lights', checked: false })
    const input = host(native.container)
    expect(input).toHaveAccessibleName('Lights')
    native.setProps({ checked: true })
    expect(input).toHaveAccessibleName('Lights')
  })

  spec('switch.roles.7', () => {
    const m = mount('switch', {
      as: 'button',
      'aria-label': 'Lights',
      children: [<span aria-hidden="true">On</span>, <span aria-hidden="true">Off</span>],
    })
    const el = host(m.container)
    expect(el).toHaveAccessibleName('Lights')
    expect(el.textContent).toBe('OnOff')
    for (const span of el.querySelectorAll('span'))
      expect(span).toHaveAttribute('aria-hidden', 'true')
  })

  spec('switch.roles.8', () => {
    const custom = mount('switch', { as: 'div', 'aria-label': 'Lights' })
    expect(host(custom.container)).toHaveAttribute('tabindex', '0')
    custom.unmount()

    const button = mount('switch', { as: 'button', children: 'Lights' })
    const el = host(button.container)
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('role', 'switch')
    expect(el).not.toHaveAttribute('tabindex')
  })

  spec('switch.roles.9', async () => {
    const custom = mount('switch', { as: 'div', 'aria-label': 'Lights' })
    const el = host(custom.container)
    expect(el).toHaveAttribute('aria-checked', 'false')
    await expectNoViolations(custom.container, ['aria-required-attr'])

    el.removeAttribute('aria-checked')
    const stripped = await axe.run(custom.container, {
      runOnly: { type: 'rule', values: ['aria-required-attr'] },
    })
    expect(stripped.violations.map((v) => v.impact)).toEqual(['critical'])
    custom.unmount()

    const native = mount('switch', { 'aria-label': 'Lights' })
    expect(host(native.container)).not.toHaveAttribute('aria-checked')
    await expectNoViolations(native.container, ['aria-required-attr'])
  })

  spec('switch.roles.10', async () => {
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
    expect(
      el.querySelectorAll('a[href], button, input, select, textarea, [tabindex], [contenteditable]')
    ).toHaveLength(0)
    await expectNoViolations(m.container, [
      'aria-allowed-attr',
      'aria-required-attr',
      'aria-required-children',
      'aria-required-parent',
      'aria-toggle-field-name',
      'nested-interactive',
    ])
  })

  spec('switch.roles.11', async () => {
    const m = mount('switch', { as: 'div', 'aria-label': 'Lights' })
    const el = host(m.container)
    expect(el).toHaveAttribute('role', 'switch')
    expect(el).toHaveAttribute('tabindex', '0')
    await expectNoViolations(m.container, ['aria-allowed-role', 'focus-order-semantics'])
  })

  spec('switch.roles.12', async () => {
    const m = mount('switch', { id: 'switch-roles-12' })
    const label = labelFor('switch-roles-12', 'Lights')
    expect(label.control).toBe(host(m.container))
    expect(host(m.container)).toHaveAccessibleName('Lights')
    await expectNoViolations(document.body, [
      'label',
      'label-title-only',
      'form-field-multiple-labels',
    ])

    labelFor('switch-roles-12', 'Lamps')
    const control = host(m.container)
    if (!(control instanceof HTMLInputElement)) throw new Error('not an input host')
    expect(control.labels).toHaveLength(2)
  })

  spec('switch.roles.13', async () => {
    mount('switch', { 'aria-label': 'Native', name: 'native' })
    mount('switch', { as: 'button', children: 'Button', name: 'button' })
    mount('switch', { as: 'div', children: 'Generic', name: 'generic', invalid: true })

    await expectNoViolations(document.body, [
      'aria-allowed-attr',
      'aria-deprecated-role',
      'aria-hidden-focus',
      'aria-prohibited-attr',
      'aria-required-attr',
      'aria-roles',
      'aria-valid-attr',
      'aria-valid-attr-value',
      'tabindex',
    ])
  })

  spec('switch.roles.14', async () => {
    const m = mount('switch', { 'aria-label': 'Lights' })
    const results = await axe.run(m.container, {
      runOnly: { type: 'rule', values: ['target-size'] },
      rules: { 'target-size': { enabled: true } },
    })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })

  spec('switch.roles.15', async () => {
    const m = mount('field', {
      as: 'fieldset',
      'aria-describedby': 'group-help',
      children: () => (
        <>
          <legend>Notifications</legend>
          <p id="group-help">Choose channels</p>
          <Switch id="email-switch" aria-label="Email" />
          <Switch id="sms-switch" aria-label="SMS" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('group', { name: 'Notifications' })).toHaveAccessibleDescription(
      'Choose channels'
    )
    expect(screen.getAllByRole('switch')).toHaveLength(2)
  })

  spec('switch.roles.16', () => {
    const custom = mount('switch', { as: 'div', 'aria-label': 'Lights' })
    const el = host(custom.container)
    expect(el).not.toHaveAttribute('aria-readonly')
    expect(el).not.toHaveAttribute('aria-required')

    custom.setProps({ readonly: true, required: true })
    expect(el).toHaveAttribute('aria-readonly', 'true')
    expect(el).toHaveAttribute('aria-required', 'true')

    custom.setProps({ readonly: false, required: false })
    expect(el).not.toHaveAttribute('aria-readonly')
    expect(el).not.toHaveAttribute('aria-required')
    custom.unmount()

    const native = mount('switch', { 'aria-label': 'Lights', readonly: true, required: true })
    const input = host(native.container)
    expect(input).toHaveAttribute('aria-readonly', 'true')
    expect(input).toBeRequired()
    expect(input).not.toHaveAttribute('readonly')
  })

  spec('switch.roles.17', () => {
    const m = mount('switch', {
      as: 'div',
      'aria-label': 'Lights',
      invalid: true,
      'aria-errormessage': 'switch-roles-17',
    })
    const el = host(m.container)
    expect(el).toHaveAttribute('aria-invalid', 'true')
    expect(el).toHaveAttribute('aria-errormessage', 'switch-roles-17')

    m.setProps({ invalid: false })
    expect(el).not.toHaveAttribute('aria-invalid')
    expect(el).toHaveAttribute('aria-errormessage', 'switch-roles-17')
  })

  spec('switch.roles.21', () => {
    const button = mount('switch', { as: 'button', children: 'Lights' })
    expect(host(button.container)).toHaveAttribute('type', 'button')
    button.unmount()

    for (const as of ['div', 'span'] as const) {
      const m = mount('switch', { as, children: 'Lights' })
      expect(host(m.container)).not.toHaveAttribute('type')
      m.unmount()
    }
  })

  spec('switch.roles.24', async () => {
    const m = mount('field', {
      children: () => (
        <>
          <Field.Error>Invalid</Field.Error>
          <Switch aria-label="Account" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('switch')).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByText('Invalid')).toBeNull()
  })

  spec('switch.roles.25', async () => {
    for (const first of [true, false]) {
      const m = mount('field', {
        children: () => (
          <>
            {first && <Field.Label>Visible name</Field.Label>}
            {first && <Field.Description>Helpful text</Field.Description>}
            <Switch as="button">Internal text</Switch>
            {!first && <Field.Label>Visible name</Field.Label>}
            {!first && <Field.Description>Helpful text</Field.Description>}
          </>
        ),
      })
      await m.settle()
      expect(screen.getByRole('switch')).toHaveAccessibleName('Visible name')
      expect(screen.getByRole('switch')).toHaveAccessibleDescription('Helpful text')
      m.unmount()
    }
  })

  spec('switch.roles.27', () => {
    const m = mount('switch', { as: 'div', 'aria-label': 'Lights', role: 'checkbox' })
    const el = host(m.container)
    expect(el).toHaveAttribute('role', 'checkbox')
    expect(screen.getByRole('checkbox')).toBe(el)
    expect(screen.queryByRole('switch')).toBe(null)
  })

  spec('switch.roles.28', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    const m = mount('switch', {
      as: 'button',
      children: 'Lights',
      id: 'switch-roles-28',
      name: 'lights',
      onCheckedChange,
    })
    const el = host(m.container)
    expect(el.tagName).toBe('BUTTON')
    expect(el).toHaveAttribute('id', 'switch-roles-28')
    expect(hidden(m.container)).not.toHaveAttribute('id')

    const label = labelFor('switch-roles-28', 'Lights')
    await user.click(label)
    await m.settle()
    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(el).toHaveAttribute('aria-checked', 'true')
  })

  spec('switch.roles.31', () => {
    for (const as of ['button', 'div'] as const) {
      const m = mount('switch', { as, children: 'Lights', name: 'lights', checked: true })
      const el = host(m.container)
      expect(el).toHaveAttribute('role', 'switch')
      expect(el).toHaveAttribute('aria-checked', 'true')

      const input = hidden(m.container)
      expect(input.type).toBe('checkbox')
      expect(input).toHaveAttribute('aria-hidden', 'true')
      expect(input).not.toHaveAttribute('role')
      expect(input.checked).toBe(true)
      m.unmount()
    }
  })

  spec('switch.roles.32', () => {
    const m = mount('switch', { 'aria-label': 'Lights', checked: true })
    const el = host(m.container)
    if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
    expect(el.type).toBe('checkbox')
    expect(el).toHaveAttribute('role', 'switch')
    expect(screen.getByRole('switch')).toBe(el)
    expect(el).toBeChecked()
    expect(m.container.children).toHaveLength(1)
    expect(el.children).toHaveLength(0)
  })
})
