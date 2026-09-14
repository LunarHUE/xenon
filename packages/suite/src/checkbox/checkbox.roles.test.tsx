import { Checkbox, Field } from '@tenon/solid'
import { fieldContract, descriptionLifecycle } from '../field/contract'
import type { CheckboxProps } from '../harness'
import { screen } from '@testing-library/dom'
import axe from 'axe-core'
import { describe, expect, onTestFinished } from 'vitest'

import { expectNoViolations } from '../a11y'
import { mount } from '../harness/solid'
import { spec } from '../spec'

const ariaRules = [
  'aria-allowed-attr',
  'aria-conditional-attr',
  'aria-deprecated-role',
  'aria-prohibited-attr',
  'aria-required-attr',
  'aria-roles',
  'aria-valid-attr',
  'aria-valid-attr-value',
]

function host(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing mounted')
  return el
}

function input(container: HTMLElement): HTMLInputElement {
  const el = host(container)
  if (!(el instanceof HTMLInputElement)) throw new Error('not an input host')
  return el
}

function hidden(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[type="checkbox"]')
  if (!(el instanceof HTMLInputElement)) throw new Error('no hidden input')
  return el
}

function addNode(html: string): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', html)
  const el = document.body.lastElementChild
  if (!(el instanceof HTMLElement)) throw new Error('nothing added')
  onTestFinished(() => el.remove())
  return el
}

describe('checkbox roles and attributes', () => {
  spec('checkbox.roles.1', () => {
    for (const as of ['button', 'div'] as const) {
      const m = mount('checkbox', { as, children: 'Agree' })
      expect(host(m.container)).toHaveAttribute('role', 'checkbox')
      m.unmount()
    }

    const native = mount('checkbox', { 'aria-label': 'Agree' })
    expect(host(native.container)).not.toHaveAttribute('role')
    expect(screen.getByRole('checkbox')).toBe(host(native.container))
  })

  spec('checkbox.roles.2', () => {
    const m = mount('checkbox', { as: 'div', children: 'Agree', checked: false })
    const el = screen.getByRole('checkbox')
    expect(el).toHaveAttribute('aria-checked', 'false')
    m.setProps({ checked: true })
    expect(el).toHaveAttribute('aria-checked', 'true')
    m.setProps({ indeterminate: true })
    expect(el).toHaveAttribute('aria-checked', 'mixed')
  })

  spec('checkbox.roles.3', async () => {
    const content = mount('checkbox', { as: 'div', children: 'Agree' })
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Agree')
    await expectNoViolations(content.container, ['aria-toggle-field-name'])
    content.unmount()

    const labelled = mount('checkbox', { as: 'div', 'aria-label': 'Agree to the terms' })
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Agree to the terms')
    labelled.unmount()

    addNode('<span id="checkbox-roles-3">Agree to the terms</span>')
    const referenced = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      'aria-labelledby': 'checkbox-roles-3',
    })
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Agree to the terms')
    referenced.unmount()

    const nameless = mount('checkbox', { as: 'div' })
    const results = await axe.run(nameless.container, {
      runOnly: { type: 'rule', values: ['aria-toggle-field-name'] },
    })
    expect(results.violations.map((v) => v.impact)).toEqual(['serious'])
  })

  spec('checkbox.roles.4', async () => {
    const m = mount('checkbox', { as: 'div', children: 'Agree' })
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    await expectNoViolations(m.container, ['aria-required-attr'])

    const stray = addNode('<div role="checkbox" tabindex="0">Agree</div>')
    const results = await axe.run(stray, {
      runOnly: { type: 'rule', values: ['aria-required-attr'] },
    })
    expect(results.violations.map((v) => v.impact)).toEqual(['critical'])
  })

  spec('checkbox.roles.5', async () => {
    const m = mount('checkbox', { 'aria-label': 'Agree', checked: true })
    const el = input(m.container)
    expect(el).toBeChecked()
    expect(el).not.toHaveAttribute('aria-checked')
    await expectNoViolations(m.container, ['aria-conditional-attr'])

    el.setAttribute('aria-checked', 'false')
    const results = await axe.run(m.container, {
      runOnly: { type: 'rule', values: ['aria-conditional-attr'] },
    })
    expect(results.violations.map((v) => v.impact)).toEqual(['serious'])
  })

  spec('checkbox.roles.6', async () => {
    const m = mount('checkbox', { as: 'div', children: 'Agree' })
    const el = screen.getByRole('checkbox')
    expect(
      el.querySelectorAll('a[href], button, input, select, textarea, [tabindex], [contenteditable]')
    ).toHaveLength(0)
    await expectNoViolations(m.container, ['nested-interactive'])
  })

  spec('checkbox.roles.7', async () => {
    const m = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      readonly: true,
      required: true,
      invalid: true,
    })
    const el = screen.getByRole('checkbox')
    expect(el).toHaveAttribute('aria-readonly', 'true')
    expect(el).toHaveAttribute('aria-required', 'true')
    expect(el).toHaveAccessibleName('Agree')
    await expectNoViolations(m.container, ['aria-allowed-attr', 'aria-roles'])
  })

  spec('checkbox.roles.8', async () => {
    const m = mount('checkbox', { id: 'checkbox-roles-8' })
    addNode('<label for="checkbox-roles-8">Agree</label>')
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('Agree')
    await expectNoViolations(document.body, ['label'])
    m.unmount()

    const bare = mount('checkbox', {})
    const results = await axe.run(bare.container, { runOnly: { type: 'rule', values: ['label'] } })
    expect(results.violations.map((v) => v.impact)).toEqual(['critical'])
  })

  spec('checkbox.roles.9', () => {
    mount('checkbox', { 'aria-label': 'one' })
    mount('checkbox', { as: 'button', children: 'two' })
    mount('checkbox', { as: 'div', children: 'three' })

    for (const el of screen.getAllByRole('checkbox')) expect(el.tabIndex).toBe(0)
    expect(screen.getByRole('checkbox', { name: 'three' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('checkbox', { name: 'one' })).not.toHaveAttribute('tabindex')
  })

  spec('checkbox.roles.10', async () => {
    const generic = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      checked: true,
      required: true,
      readonly: true,
      invalid: true,
    })
    await expectNoViolations(generic.container, ariaRules)
    generic.unmount()

    const native = mount('checkbox', {
      'aria-label': 'Agree',
      checked: true,
      required: true,
      readonly: true,
      invalid: true,
    })
    await expectNoViolations(native.container, ariaRules)
  })

  spec('checkbox.roles.11', async () => {
    addNode('<span id="checkbox-roles-11">Terms</span>')
    mount('checkbox', {
      as: 'div',
      children: 'Agree',
      name: 'agree',
      'aria-labelledby': 'checkbox-roles-11',
    })
    mount('checkbox', {
      as: 'div',
      children: 'Agree',
      name: 'agree',
      'aria-labelledby': 'checkbox-roles-11',
    })

    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
    await expectNoViolations(document.body, ['duplicate-id-aria'])
  })

  spec('checkbox.roles.12', async () => {
    mount('checkbox', { 'aria-label': 'native' })
    mount('checkbox', { as: 'button', children: 'button' })
    mount('checkbox', { as: 'div', children: 'generic' })
    mount('checkbox', { as: 'div', children: 'off', disabled: true })

    for (const el of document.querySelectorAll('[tabindex]')) {
      expect(Number(el.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
    }
    await expectNoViolations(document.body, ['tabindex'])
  })

  spec('checkbox.roles.13', async () => {
    const m = mount('checkbox', { as: 'button', children: 'Agree', name: 'agree' })
    const box = hidden(m.container)
    expect(box).toHaveAttribute('aria-hidden', 'true')
    expect(box).toHaveAttribute('tabindex', '-1')
    expect(box.tabIndex).toBe(-1)
    await expectNoViolations(m.container, ['aria-hidden-focus'])
  })

  spec('checkbox.roles.14', async () => {
    const hosts: CheckboxProps[] = [{ 'aria-label': 'Agree' }, { as: 'div', children: 'Agree' }]
    for (const props of hosts) {
      const m = mount('checkbox', props)
      const results = await axe.run(m.container, {
        runOnly: { type: 'rule', values: ['target-size'] },
        rules: { 'target-size': { enabled: true } },
      })
      expect(results.violations.map((v) => v.id)).toEqual([])
      m.unmount()
    }
  })

  spec('checkbox.roles.15', () => {
    const generic = mount('checkbox', { as: 'div', children: 'Agree', required: true })
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-required', 'true')
    generic.unmount()

    const native = mount('checkbox', { 'aria-label': 'Agree', required: true })
    const el = input(native.container)
    expect(el).toBeRequired()
    expect(el).not.toHaveAttribute('aria-required')
  })

  spec('checkbox.roles.16', () => {
    const m = mount('checkbox', { as: 'div', children: 'Agree' })
    const el = screen.getByRole('checkbox')
    expect(el).not.toHaveAttribute('aria-readonly')
    m.setProps({ readonly: true })
    expect(el).toHaveAttribute('aria-readonly', 'true')
    m.setProps({ readonly: false })
    expect(el).not.toHaveAttribute('aria-readonly')
    m.unmount()

    const native = mount('checkbox', { 'aria-label': 'Agree', readonly: true })
    expect(input(native.container)).toHaveAttribute('aria-readonly', 'true')
  })

  spec('checkbox.roles.17', () => {
    addNode('<span id="checkbox-roles-17">Pick one</span>')
    const m = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      invalid: true,
      'aria-errormessage': 'checkbox-roles-17',
    })
    const el = screen.getByRole('checkbox')
    expect(el).toHaveAttribute('aria-invalid', 'true')
    expect(el).toHaveAttribute('aria-errormessage', 'checkbox-roles-17')
    m.setProps({ invalid: false })
    expect(el).not.toHaveAttribute('aria-invalid')
    expect(el).toHaveAttribute('aria-errormessage', 'checkbox-roles-17')
    m.unmount()

    const native = mount('checkbox', { 'aria-label': 'Agree', invalid: true })
    expect(input(native.container)).toHaveAttribute('aria-invalid', 'true')
  })

  spec('checkbox.roles.18', async () => {
    const generic = mount('checkbox', { as: 'div', children: 'Agree', indeterminate: true })
    const el = screen.getByRole('checkbox')
    expect(el).toHaveAttribute('aria-checked', 'mixed')
    expect(el).toHaveAttribute('data-indeterminate', '')
    expect(el).toHaveAttribute('data-state', 'indeterminate')
    generic.unmount()

    const native = mount('checkbox', { 'aria-label': 'Agree', indeterminate: true })
    await native.settle()
    const box = input(native.container)
    expect(box.indeterminate).toBe(true)
    expect(box).toHaveAttribute('data-indeterminate', '')
    expect(box).toHaveAttribute('data-state', 'indeterminate')
  })

  spec('checkbox.roles.22', () => {
    const native = mount('checkbox', { 'aria-label': 'Agree', value: 'yes' })
    const el = input(native.container)
    expect(el).toHaveAttribute('value', 'yes')
    expect(el.value).toBe('yes')
    native.unmount()

    const generic = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      name: 'agree',
      value: 'yes',
    })
    expect(hidden(generic.container)).toHaveAttribute('value', 'yes')
  })

  spec('checkbox.roles.24', () => {
    const m = mount('checkbox', {
      as: 'div',
      children: 'Agree',
      checked: true,
      indeterminate: true,
    })
    const el = screen.getByRole('checkbox')
    expect(el).toHaveAttribute('aria-checked', 'mixed')
    expect(el).toHaveAttribute('data-state', 'indeterminate')
    m.setProps({ indeterminate: false })
    expect(el).toHaveAttribute('aria-checked', 'true')
    expect(el).toHaveAttribute('data-state', 'checked')
  })

  spec('checkbox.roles.25', () => {
    const m = mount('checkbox', { as: 'div', children: 'Agree', role: 'switch' })
    const el = host(m.container)
    expect(el).toHaveAttribute('role', 'switch')
    expect(screen.getByRole('switch')).toBe(el)
    expect(screen.queryByRole('checkbox')).toBeNull()
  })

  spec('checkbox.roles.27', async () => {
    const m = mount('field', {
      children: () => (
        <>
          <Field.Label id="first-label">First</Field.Label>
          <Field.Label id="second-label">Second</Field.Label>
          <Field.Description id="first-description">One</Field.Description>
          <Field.Description id="second-description">Two</Field.Description>
          <Checkbox as="div" />
        </>
      ),
    })
    await m.settle()
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-labelledby',
      'first-label second-label'
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-describedby',
      'first-description second-description'
    )
    expect(screen.getByRole('checkbox')).toHaveAccessibleName('First Second')
  })

  spec('checkbox.roles.29', () => descriptionLifecycle('checkbox'))

  spec('checkbox.roles.32', () => fieldContract('checkbox'))

  spec('checkbox.roles.33', () => {
    const m = mount('checkbox', {
      as: 'button',
      children: 'Agree',
      name: 'agree',
      defaultChecked: true,
    })
    const el = host(m.container)
    expect(el).toHaveAttribute('role', 'checkbox')
    expect(el).toHaveAttribute('aria-checked', 'true')
    expect(hidden(m.container)).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getAllByRole('checkbox')).toEqual([el])
  })
})
