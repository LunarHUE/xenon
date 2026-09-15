import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Field } from './field'
import { Checkbox } from '../checkbox'

function settle(): Promise<void> {
  flush()
  return Promise.resolve()
}

describe('<Field />', () => {
  test('autofocus runs once after mounting while the attribute remains reactive', async () => {
    const [autofocus, setAutofocus] = createSignal(true)
    let focuses = 0
    const { container } = render(() => (
      <Field>
        <Field.Control autofocus={autofocus()} onFocus={() => focuses++} />
      </Field>
    ))
    const control = container.querySelector('input')!
    await settle()
    expect(control).toHaveFocus()
    expect(focuses).toBe(1)

    control.blur()
    setAutofocus(false)
    await settle()
    expect(control).not.toHaveAttribute('autofocus')
    setAutofocus(true)
    await settle()
    expect(control).toHaveAttribute('autofocus')
    expect(control).not.toHaveFocus()
    expect(focuses).toBe(1)
  })

  test.each(['field', 'control', 'fieldset'])('autofocus respects disabled %s', async (source) => {
    let focuses = 0
    const { container } = render(() => (
      <fieldset disabled={source === 'fieldset'}>
        <Field disabled={source === 'field'}>
          <Field.Control autofocus disabled={source === 'control'} onFocus={() => focuses++} />
        </Field>
      </fieldset>
    ))
    await settle()
    expect(container.querySelector('input')).not.toHaveFocus()
    expect(focuses).toBe(0)
  })

  test('wires the label, the control and one generated id base', () => {
    const { container, getByText } = render(() => (
      <Field>
        <Field.Label>Email</Field.Label>
        <Field.Control />
      </Field>
    ))
    const root = container.firstElementChild as HTMLElement
    const label = getByText('Email') as HTMLLabelElement
    const control = container.querySelector('input') as HTMLInputElement

    expect(root).toHaveAttribute('role', 'group')
    expect(control.id).toBe(label.htmlFor)
    expect(label.id).toBe(control.id.replace('-control', '-label'))
    expect(control).not.toHaveAttribute('aria-labelledby')
    expect(control).not.toHaveAttribute('aria-describedby')
  })

  test('an author id is the base every part derives from', () => {
    const { container } = render(() => (
      <Field id="email">
        <Field.Label>Email</Field.Label>
        <Field.Description>Work address</Field.Description>
        <Field.Control />
      </Field>
    ))
    expect(container.querySelector('label')?.id).toBe('email-label')
    expect(container.querySelector('p')?.id).toBe('email-description')
    expect(container.querySelector('input')?.id).toBe('email-control')
  })

  test('describes the control with the description, then the error while invalid', async () => {
    const [invalid, setInvalid] = createSignal(false)
    const { container } = render(() => (
      <Field id="email" invalid={invalid()}>
        <Field.Description>Work address</Field.Description>
        <Field.Error>Required</Field.Error>
        <Field.Control aria-describedby="mine" />
      </Field>
    ))
    const control = container.querySelector('input') as HTMLInputElement
    await settle()
    expect(control).toHaveAttribute('aria-describedby', 'mine email-description')
    expect(control).not.toHaveAttribute('aria-invalid')
    expect(container.querySelector('[role="alert"]')).toBe(null)

    setInvalid(true)
    await settle()
    expect(control).toHaveAttribute('aria-describedby', 'mine email-description email-error')
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(container.querySelector('[role="alert"]')?.id).toBe('email-error')
    expect(control).not.toHaveAttribute('aria-errormessage')
  })

  test('an unrendered description is never referenced', async () => {
    const { container } = render(() => (
      <Field id="email">
        <Field.Control />
      </Field>
    ))
    await settle()
    expect(container.querySelector('input')).not.toHaveAttribute('aria-describedby')
  })

  test('every part mirrors the four state flags', async () => {
    const { container } = render(() => (
      <Field disabled required readonly invalid>
        <Field.Label>Email</Field.Label>
        <Field.Description>Work address</Field.Description>
        <Field.Error>Required</Field.Error>
        <Field.Control />
      </Field>
    ))
    await settle()
    for (const el of container.querySelectorAll('div, label, p, input')) {
      expect(el).toHaveAttribute('data-disabled', '')
      expect(el).toHaveAttribute('data-required', '')
      expect(el).toHaveAttribute('data-readonly', '')
      expect(el).toHaveAttribute('data-invalid', '')
    }
    const control = container.querySelector('input') as HTMLInputElement
    expect(control.disabled).toBe(true)
    expect(control.required).toBe(true)
    expect(control.readOnly).toBe(true)
  })

  test('a non-native control is named by the label and focused by clicking it', () => {
    const { container, getByText } = render(() => (
      <Field id="pick">
        <Field.Label>Pick</Field.Label>
        <Field.Control as="div" tabindex={0} />
      </Field>
    ))
    const control = container.querySelector('div[tabindex]') as HTMLElement
    expect(control).toHaveAttribute('aria-labelledby', 'pick-label')

    fireEvent.click(getByText('Pick'))
    expect(control).toHaveFocus()
  })

  test('a disabled field keeps a label click from focusing the control', () => {
    const { container, getByText } = render(() => (
      <Field id="pick" disabled>
        <Field.Label>Pick</Field.Label>
        <Field.Control as="div" tabindex={0} />
      </Field>
    ))
    fireEvent.click(getByText('Pick'))
    expect(container.querySelector('div[tabindex]')).not.toHaveFocus()
    expect(container.querySelector('div[tabindex]')).toHaveAttribute('aria-disabled', 'true')
  })

  test('as="fieldset" drops the group role and disables natively', () => {
    const { container } = render(() => (
      <Field as="fieldset" disabled>
        <Field.Control />
      </Field>
    ))
    const root = container.firstElementChild as HTMLFieldSetElement
    expect(root.tagName).toBe('FIELDSET')
    expect(root).not.toHaveAttribute('role')
    expect(root.disabled).toBe(true)
  })
})

describe('<Checkbox /> inside a field', () => {
  test('takes the control id, the name and the field references', async () => {
    const { container } = render(() => (
      <Field id="terms" name="terms">
        <Field.Label>Accept</Field.Label>
        <Field.Description>The terms</Field.Description>
        <Checkbox />
      </Field>
    ))
    const el = container.querySelector('input[type="checkbox"]') as HTMLInputElement
    await settle()
    expect(el.id).toBe('terms-control')
    expect(el.name).toBe('terms')
    expect(el).toHaveAttribute('aria-describedby', 'terms-description')
    expect(el).not.toHaveAttribute('aria-labelledby')
  })

  test('state flags OR, so a disabled field disables the checkbox', async () => {
    const { container } = render(() => (
      <Field disabled required invalid>
        <Checkbox aria-label="Accept" />
      </Field>
    ))
    const el = container.querySelector('input') as HTMLInputElement
    await settle()
    expect(el.disabled).toBe(true)
    expect(el.required).toBe(true)
    expect(el).toHaveAttribute('data-disabled', '')
    expect(el).toHaveAttribute('aria-invalid', 'true')
  })

  test('the checkbox own prop wins where the rule is not an OR', async () => {
    const { container } = render(() => (
      <Field id="terms" name="terms">
        <Checkbox as="button" name="mine" value="yes" aria-label="Accept" />
      </Field>
    ))
    await settle()
    const el = container.querySelector('button') as HTMLButtonElement
    expect(el.id).toBe('terms-control')
    expect(container.querySelector('input')?.getAttribute('name')).toBe('mine')
  })

  test('a generic host is named by the label, a button host by its own for', async () => {
    const generic = render(() => (
      <Field id="a">
        <Field.Label>Accept</Field.Label>
        <Checkbox as="div" />
      </Field>
    ))
    await settle()
    expect(generic.container.querySelector('[role="checkbox"]')).toHaveAttribute(
      'aria-labelledby',
      'a-label'
    )
    generic.unmount()

    const native = render(() => (
      <Field id="b">
        <Field.Label>Accept</Field.Label>
        <Checkbox as="button" />
      </Field>
    ))
    await settle()
    expect(native.container.querySelector('button')).not.toHaveAttribute('aria-labelledby')
  })
})
