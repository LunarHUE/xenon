import { Checkbox, Field, Switch } from '@tenon/solid'
import type { JSX } from '@solidjs/web'
import { screen } from '@testing-library/dom'
import { Show, createSignal, omit } from 'solid-js'
import { expect } from 'vitest'

import { mount } from '../harness/solid'

/** Native text controls and checked controls supported by the shared Field assertions. */
export type ControlKind = 'input' | 'textarea' | 'checkbox' | 'switch'

/**
 * Selects the Field-compatible control used by shared contract fixtures.
 * Checkbox and switch use their standalone adapters; input and textarea use
 * Field.Control. All props except kind are forwarded to the selected adapter.
 */
export function Control(props: {
  /** Adapter/host variant to render within the fixture's Field. */
  kind: ControlKind
  /** Unchecked fixture props forwarded to the selected control. */
  [key: string]: unknown
}): JSX.Element {
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

/**
 * Asserts shared Field naming, state inheritance, and description/error updates.
 *
 * @remarks
 * Mounts a fixture in document.body and queries through global screen. Run with
 * the Solid client transform, a DOM with requestAnimationFrame, and Vitest DOM
 * matchers installed. Keep unrelated Account labels and matching fixture text out
 * of the document. Await completion before the caller's harness cleanup; this
 * helper leaves the mount registered, including when an assertion throws.
 * @param kind - Control variant whose inherited state and associations are checked.
 * @returns Resolves after reactive updates and assertions; rejects on assertion failure.
 */
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

/**
 * Asserts that a conditional Field.Description adds and removes its control reference.
 *
 * @remarks
 * Uses the same DOM, client-transform, matcher, global-screen isolation, and caller
 * cleanup requirements as {@link fieldContract}. The initially absent description
 * is mounted and removed through a signal, awaiting harness settlement after each
 * change. The fixture remains mounted for harness cleanup after this promise.
 * @param kind - Control variant whose aria-describedby follows description presence.
 * @returns Resolves after the lifecycle assertions; rejects on assertion failure.
 */
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
