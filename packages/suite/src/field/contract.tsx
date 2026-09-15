import { Checkbox, Field, NumberField, Select, Switch } from '@xenon/solid'
import { Combobox } from '@xenon/solid/combobox'
import { TagsInput } from '@xenon/solid/tags-input'
import type { JSX } from '@solidjs/web'
import { screen } from '@testing-library/dom'
import { Show, createSignal, omit } from 'solid-js'
import { expect } from 'vitest'

import { mount } from '../harness/solid'

/** Native text controls and checked controls supported by the shared Field assertions. */
export type ControlKind = 'input' | 'textarea' | 'checkbox' | 'switch'

export type FieldAdapterKind = 'number' | 'select' | 'combobox' | 'tags'

type SharedFieldStateOptions = {
  name?: string
  initialDescribedBy: string
  remainingDescribedBy: string
  clearProps: Record<string, unknown>
  resolvedDescribedBy?: string[]
  requiredAttribute?: boolean
  requiredAria?: boolean
}

/** Common state, naming, and description/error assertions shared by every adapter battery. */
async function assertSharedFieldState(
  m: Awaited<ReturnType<typeof mount>>,
  control: HTMLElement,
  options: SharedFieldStateOptions
) {
  expect(screen.getByLabelText('Account')).toBe(control)
  if (options.name) expect(control).toHaveAttribute('name', options.name)
  expect(control).toBeDisabled()
  if (options.requiredAttribute !== false) expect(control).toBeRequired()
  if (options.requiredAria) expect(control).toHaveAttribute('aria-required', 'true')
  expect(control).toHaveAttribute('aria-invalid', 'true')
  expect(control).toHaveAttribute('aria-describedby', options.initialDescribedBy)
  for (const id of options.resolvedDescribedBy ?? [])
    expect(m.container.querySelector(`[id="${id}"]`)).not.toBeNull()
  m.setProps(options.clearProps)
  await m.settle()
  expect(control).not.toBeDisabled()
  if (options.requiredAttribute !== false) expect(control).not.toBeRequired()
  if (options.requiredAria) expect(control).not.toHaveAttribute('aria-required')
  expect(control).not.toHaveAttribute('aria-invalid')
  expect(control).toHaveAttribute('aria-describedby', options.remainingDescribedBy)
}

export async function fieldAdapterContract(kind: FieldAdapterKind) {
  const m = mount('field', {
    name: 'account',
    disabled: true,
    required: true,
    invalid: true,
    children: () => (
      <>
        <Field.Label>Account</Field.Label>
        <Field.Description id="help">Helpful text</Field.Description>
        <Field.Error id="error">Fix this</Field.Error>
        {kind === 'number' ? (
          <NumberField>
            <NumberField.Input />
          </NumberField>
        ) : kind === 'select' ? (
          <Select items={[{ value: 'one', label: 'One' }]}>
            <Select.Trigger>
              <Select.Value placeholder="Choose" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Content>
                  <Select.Viewport>
                    <Select.Item value="one">One</Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Positioner>
            </Select.Portal>
          </Select>
        ) : kind === 'combobox' ? (
          <Combobox items={[{ value: 'one', label: 'One' }]}>
            <Combobox.Input />
            <Combobox.Positioner>
              <Combobox.Content>
                <Combobox.Item value="one">One</Combobox.Item>
              </Combobox.Content>
            </Combobox.Positioner>
          </Combobox>
        ) : (
          <TagsInput defaultValue={[]}>
            <Field.Error id="inner-error">Fix this</Field.Error>
            <TagsInput.Control>
              <TagsInput.Input />
            </TagsInput.Control>
          </TagsInput>
        )}
      </>
    ),
  })
  await m.settle()
  const control =
    kind === 'number'
      ? screen.getByRole('spinbutton')
      : kind === 'select'
        ? screen.getByRole('combobox')
        : kind === 'combobox'
          ? screen.getByRole('combobox')
          : screen.getByRole('textbox')
  const initialDescribedBy = kind === 'tags' ? 'help error inner-error' : 'help error'
  await assertSharedFieldState(m, control, {
    name: undefined,
    initialDescribedBy,
    remainingDescribedBy: 'help',
    clearProps: { disabled: false, required: false, invalid: false },
    resolvedDescribedBy: kind === 'tags' ? ['help', 'error', 'inner-error'] : ['help', 'error'],
    requiredAttribute: kind !== 'combobox',
    requiredAria: kind === 'combobox',
  })
  expect(m.container.querySelector('[id="help"]')).toHaveTextContent('Helpful text')
}

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
        <span id="author">Author help</span>
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
  expect(control).not.toHaveAttribute('aria-errormessage')
  expect(control).not.toHaveAttribute('aria-labelledby')
  for (const part of m.container.querySelectorAll('label, p, input, textarea, [role="group"]')) {
    for (const flag of ['disabled', 'required', 'readonly', 'invalid'])
      expect(part).toHaveAttribute(`data-${flag}`, '')
  }
  await assertSharedFieldState(m, control, {
    name: 'account',
    initialDescribedBy: 'author help error',
    remainingDescribedBy: 'author help',
    clearProps: { disabled: false, required: false, readonly: false, invalid: false },
    resolvedDescribedBy: ['author', 'help', 'error'],
  })
  expect(control).not.toHaveAttribute('aria-errormessage')
  expect(control).not.toHaveAttribute('aria-labelledby')
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
