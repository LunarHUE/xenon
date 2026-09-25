import { Field } from '@xenon-ui/solid'
import { screen } from '@testing-library/dom'
import { userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

/**
 * Asserts label-click focus for an enabled Field control and its suppression when disabled.
 * Runs real browser pointer interaction against a harness-mounted fixture using
 * global screen queries. Requires no other Account text in the document. Await
 * completion before caller-owned harness cleanup; the fixture remains registered.
 * @param kind - Native text host or generic focusable host to exercise.
 */
async function labelFocus(kind: 'input' | 'textarea' | 'div') {
  const m = mount('field', {
    children: () => (
      <>
        <Field.Label>Account</Field.Label>
        <Field.Control as={kind} tabindex={0} />
      </>
    ),
  })
  await m.settle()
  const control = m.container.querySelector(kind === 'div' ? '[tabindex]' : kind) as HTMLElement
  await userEvent.click(screen.getByText('Account'), { force: true })
  expect(control).toHaveFocus()
  control.blur()
  m.setProps({ disabled: true })
  await m.settle()
  await userEvent.click(screen.getByText('Account'), { force: true })
  expect(control).not.toHaveFocus()
}

/**
 * Asserts native Field form data, edited value reset, and disabled exclusion.
 * Uses browser input interaction and FormData with an input or textarea fixture.
 * Global screen queries require an otherwise isolated textbox. Await completion
 * before caller-owned harness cleanup; this helper leaves its fixture registered.
 * @param kind - Native text-control host whose browser form behavior is checked.
 */
async function nativeForm(kind: 'input' | 'textarea') {
  const m = mount('field', {
    name: 'account',
    children: () => (
      <form>
        <Field.Control as={kind} defaultValue="initial" aria-label="Account" />
      </form>
    ),
  })
  const form = m.container.querySelector('form')!
  const control = screen.getByRole('textbox') as HTMLInputElement
  expect(new FormData(form).get('account')).toBe('initial')
  await userEvent.fill(control, 'edited')
  expect(new FormData(form).get('account')).toBe('edited')
  form.reset()
  expect(new FormData(form).get('account')).toBe('initial')
  m.setProps({ disabled: true })
  await m.settle()
  expect(new FormData(form).has('account')).toBe(false)
}

describe('field native browser behavior', () => {
  spec('field.pointer.1', () => labelFocus('div'))
  spec('label.pointer.1', () => labelFocus('input'))
  spec('input.forms.1', () => nativeForm('input'))
  spec('textarea.forms.1', () => nativeForm('textarea'))

  spec('text-field.keyboard.1', async () => {
    mount('field', { children: () => <Field.Control aria-label="Account" /> })
    await userEvent.tab()
    expect(screen.getByRole('textbox')).toHaveFocus()
    await userEvent.keyboard('hello')
    expect(screen.getByRole('textbox')).toHaveValue('hello')
  })

  spec('text-field.pointer.2', async () => {
    const m = mount('field', {
      readonly: true,
      children: () => (
        <>
          <Field.Label>Account</Field.Label>
          <Field.Control />
        </>
      ),
    })
    const control = screen.getByRole('textbox')
    await userEvent.click(control)
    expect(control).toHaveFocus()
    control.blur()
    m.setProps({ readonly: false, disabled: true })
    await m.settle()
    await userEvent.click(screen.getByText('Account'), { force: true })
    expect(control).not.toHaveFocus()
  })

  spec('field.pointer.3', async () => {
    const m = mount('field', {
      children: () => (
        <fieldset disabled>
          <Field.Label>Account</Field.Label>
          <Field.Control />
        </fieldset>
      ),
    })
    await m.settle()
    await userEvent.click(screen.getByText('Account'), { force: true })
    expect(screen.getByRole('textbox')).not.toHaveFocus()
  })
})
