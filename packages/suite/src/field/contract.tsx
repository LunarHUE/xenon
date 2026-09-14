import { Checkbox, Field, Switch } from '@kit/solid'
import type { JSX } from '@solidjs/web'
import { screen } from '@testing-library/dom'
import { Show, createSignal, omit } from 'solid-js'
import { expect } from 'vitest'

import { mount } from '../harness/solid'

export type ControlKind = 'input' | 'textarea' | 'checkbox' | 'switch'

export function Control(props: { kind: ControlKind; [key: string]: unknown }): JSX.Element {
  const rest = omit(props, 'kind')
  return (
    <>
      {props.kind === 'checkbox' ? (
        <Checkbox {...rest} />
      ) : props.kind === 'switch' ? (
        <Switch {...rest} />
      ) : (
        <Field.Control as={props.kind} {...rest} />
      )}
    </>
  )
}

export async function fieldContract(kind: ControlKind) {
  const m = mount('field', {
    id: 'account',
    name: 'account',
    disabled: true,
    required: true,
    readonly: true,
    invalid: true,
    children: () => (
      <>
        <Field.Label>Account</Field.Label>
        <Field.Description id="help">Helpful text</Field.Description>
        <Field.Error id="error">Fix this</Field.Error>
        <Control
          kind={kind}
          disabled={false}
          required={false}
          readonly={false}
          invalid={false}
          aria-describedby="author"
        />
      </>
    ),
  })
  await m.settle()
  const control = screen.getByLabelText('Account')
  expect(control).toHaveAttribute('name', 'account')
  expect(control).toBeDisabled()
  expect(control).toBeRequired()
  expect(control).toHaveAttribute('aria-invalid', 'true')
  expect(control).toHaveAttribute('aria-describedby', 'author help error')
  expect(control).not.toHaveAttribute('aria-errormessage')
  expect(control).not.toHaveAttribute('aria-labelledby')
  for (const part of m.container.querySelectorAll('label, p, input, textarea, [role="group"]')) {
    for (const flag of ['disabled', 'required', 'readonly', 'invalid'])
      expect(part).toHaveAttribute(`data-${flag}`, '')
  }
  m.setProps({ disabled: false, required: false, readonly: false, invalid: false })
  await m.settle()
  expect(control).not.toBeDisabled()
  expect(control).not.toBeRequired()
  expect(control).not.toHaveAttribute('aria-invalid')
  expect(control).toHaveAttribute('aria-describedby', 'author help')
  expect(screen.queryByText('Fix this')).toBeNull()
  expect(screen.getByText('Helpful text')).toBeVisible()
  for (const flag of ['disabled', 'required', 'readonly', 'invalid'])
    expect(control).not.toHaveAttribute(`data-${flag}`)
}

export async function descriptionLifecycle(kind: ControlKind) {
  const [show, setShow] = createSignal(false)
  const m = mount('field', {
    children: () => (
      <>
        <Field.Label>Account</Field.Label>
        <Show when={show()}>
          <Field.Description>Helpful text</Field.Description>
        </Show>
        <Control kind={kind} />
      </>
    ),
  })
  await m.settle()
  const control = screen.getByLabelText('Account')
  expect(control).not.toHaveAttribute('aria-describedby')
  setShow(true)
  await m.settle()
  expect(control).toHaveAttribute('aria-describedby', screen.getByText('Helpful text').id)
  setShow(false)
  await m.settle()
  expect(control).not.toHaveAttribute('aria-describedby')
}
