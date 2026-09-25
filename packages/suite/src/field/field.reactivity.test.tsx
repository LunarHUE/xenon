/**
 * Reactive registry state of the shipped Field parts: how dynamically mounted
 * labels, descriptions and errors re-derive the control's associations, how a
 * nested Field keeps its own state, and which form owns a reset.
 *
 * Each case mounts one fixture, awaits the registration effects, and asserts
 * observable DOM/ARIA state only. Native editing, constraint validation and
 * focus engines live in the browser-only companion suites, and this file runs
 * in both the jsdom and browser projects, so it uses no browser-only global.
 *
 * @packageDocumentation
 */
import { Field } from '@xenon-ui/solid'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { mount } from '../harness/solid'

describe('field registry state transitions', () => {
  test('a nested Field keeps its own label, description, required and invalid state', async () => {
    const m = mount('field', {
      id: 'outer',
      required: true,
      invalid: true,
      children: () => (
        <>
          <Field.Label>Outer account</Field.Label>
          <Field.Description id="outer-help">Outer help</Field.Description>
          <Field.Control id="outer-input" />
          <Field id="inner">
            <Field.Label>Inner code</Field.Label>
            <Field.Description id="inner-help">Inner help</Field.Description>
            <Field.Control id="inner-input" />
          </Field>
        </>
      ),
    })
    await m.settle()
    const outer = m.container.querySelector('#outer-input') as HTMLInputElement
    const inner = m.container.querySelector('#inner-input') as HTMLInputElement
    const outerGroup = outer.closest('[role="group"]')!
    const innerGroup = inner.closest('[role="group"]')!

    expect(m.container.querySelector('label[for="outer-input"]')).toHaveTextContent('Outer account')
    expect(m.container.querySelector('label[for="inner-input"]')).toHaveTextContent('Inner code')
    expect(outer).toHaveAccessibleName('Outer account')
    expect(outer).toBeRequired()
    expect(outer).toHaveAttribute('aria-invalid', 'true')
    expect(outer).toHaveAttribute('aria-describedby', 'outer-help')
    expect(outerGroup).toHaveAttribute('data-invalid', '')

    // The inner Field owns its descendants: neither the outer invalid nor its
    // required flag reaches the inner control, label or description.
    expect(inner).toHaveAccessibleName('Inner code')
    expect(inner).not.toBeRequired()
    expect(inner).not.toHaveAttribute('aria-invalid')
    expect(inner).not.toHaveAttribute('data-invalid')
    expect(inner).toHaveAttribute('aria-describedby', 'inner-help')
    expect(innerGroup).not.toHaveAttribute('data-invalid')
    expect(m.container.querySelector('label[for="inner-input"]')).not.toHaveAttribute(
      'data-invalid'
    )

    m.setProps({ invalid: false, required: false })
    await m.settle()
    expect(outer).not.toHaveAttribute('aria-invalid')
    expect(outer).not.toHaveAttribute('data-invalid')
    expect(outerGroup).not.toHaveAttribute('data-invalid')
    expect(outer).toHaveAttribute('aria-describedby', 'outer-help')
    expect(inner).toHaveAttribute('aria-describedby', 'inner-help')
  })

  test('dynamic error parts join and leave aria-describedby in document order', async () => {
    const [first, setFirst] = createSignal(true)
    const [second, setSecond] = createSignal(true)
    const m = mount('field', {
      id: 'account',
      invalid: true,
      children: () => (
        <>
          <Field.Control id="account-input" />
          <Show when={first()}>
            <Field.Error id="first-error">First problem</Field.Error>
          </Show>
          <Show when={second()}>
            <Field.Error id="second-error">Second problem</Field.Error>
          </Show>
        </>
      ),
    })
    await m.settle()
    const control = m.container.querySelector('#account-input') as HTMLInputElement
    expect(control).toHaveAttribute('aria-describedby', 'first-error second-error')
    expect(control).toHaveAccessibleDescription('First problem Second problem')
    expect(m.container.querySelectorAll('[role="alert"]')).toHaveLength(2)

    setFirst(false)
    await m.settle()
    expect(m.container.querySelector('#first-error')).toBeNull()
    expect(control).toHaveAttribute('aria-describedby', 'second-error')
    expect(control).toHaveAccessibleDescription('Second problem')

    setSecond(false)
    await m.settle()
    expect(control).not.toHaveAttribute('aria-describedby')

    setSecond(true)
    setFirst(true)
    await m.settle()
    expect(control).toHaveAttribute('aria-describedby', 'first-error second-error')
    expect(m.container.querySelectorAll('[role="alert"]')).toHaveLength(2)
  })

  test('an error reference returns when an invalid field becomes valid and invalid again', async () => {
    const m = mount('field', {
      id: 'account',
      invalid: true,
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Field.Control id="account-input" />
          <Field.Error id="problem">Too short</Field.Error>
        </>
      ),
    })
    await m.settle()
    const control = m.container.querySelector('#account-input') as HTMLInputElement
    const firstError = m.container.querySelector('#problem')!
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAttribute('aria-describedby', 'problem')
    expect(firstError).toHaveAttribute('role', 'alert')

    m.setProps({ invalid: false })
    await m.settle()
    expect(m.container.querySelector('#problem')).toBeNull()
    expect(control).not.toHaveAttribute('aria-invalid')
    expect(control).not.toHaveAttribute('data-invalid')
    expect(control).not.toHaveAttribute('aria-describedby')

    m.setProps({ invalid: true })
    await m.settle()
    const secondError = m.container.querySelector('#problem')!
    // The error element is replaced, the control node is not, and the same
    // author reference is re-used.
    expect(secondError).not.toBe(firstError)
    expect(secondError).toHaveTextContent('Too short')
    expect(control).toBe(m.container.querySelector('#account-input'))
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAttribute('aria-describedby', 'problem')
  })

  test('a description added while invalid keeps its reference ahead of the error', async () => {
    const [showHint, setShowHint] = createSignal(false)
    const m = mount('field', {
      id: 'account',
      invalid: true,
      children: () => (
        <>
          <Field.Control id="account-input" />
          <Field.Error id="problem">Too short</Field.Error>
          <Show when={showHint()}>
            <Field.Description id="hint">Use eight characters</Field.Description>
          </Show>
        </>
      ),
    })
    await m.settle()
    const control = m.container.querySelector('#account-input') as HTMLInputElement
    expect(control).toHaveAttribute('aria-describedby', 'problem')

    setShowHint(true)
    await m.settle()
    const hint = m.container.querySelector('#hint')!
    // The description trails the error element yet descriptions always lead errors.
    expect(m.container.querySelector('#problem')!.nextElementSibling).toBe(hint)
    expect(control).toHaveAttribute('aria-describedby', 'hint problem')
    expect(control).toHaveAccessibleDescription('Use eight characters Too short')

    setShowHint(false)
    await m.settle()
    expect(control).toHaveAttribute('aria-describedby', 'problem')
  })

  test('a control authored to an external form owner resets with that form, not its ancestor', async () => {
    const m = mount('field', {
      id: 'account',
      name: 'account',
      children: () => (
        <>
          <Field.Description id="hint">Account hint</Field.Description>
          <form id="owner" />
          <form id="ancestor">
            <Field.Control
              id="account-input"
              form="owner"
              defaultValue="initial"
              aria-label="Account"
            />
          </form>
        </>
      ),
    })
    await m.settle()
    const owner = m.container.querySelector('#owner') as HTMLFormElement
    const ancestor = m.container.querySelector('#ancestor') as HTMLFormElement
    const control = m.container.querySelector('#account-input') as HTMLInputElement
    expect(control.form).toBe(owner)
    expect(control).toHaveAttribute('name', 'account')
    expect(control).toHaveAttribute('aria-describedby', 'hint')

    control.value = 'edited'
    ancestor.reset()
    expect(control.value).toBe('edited')

    owner.reset()
    expect(control).toBe(m.container.querySelector('#account-input'))
    expect(control.value).toBe('initial')
    expect(control).toHaveAttribute('aria-describedby', 'hint')
  })

  test('an author label for overrides the rendered association while the click still focuses the control', async () => {
    const m = mount('field', {
      id: 'account',
      children: () => (
        <>
          <Field.Label for="elsewhere">Nickname</Field.Label>
          <Field.Control as="div" role="textbox" tabindex={0} id="nickname-field" />
          <span id="elsewhere" />
        </>
      ),
    })
    await m.settle()
    const label = m.container.querySelector('label') as HTMLLabelElement
    const control = m.container.querySelector('#nickname-field') as HTMLElement
    expect(label).toHaveAttribute('for', 'elsewhere')
    expect(control).toHaveAttribute('aria-labelledby', 'account-label')

    label.click()
    expect(control).toHaveFocus()
  })
})
