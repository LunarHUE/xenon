import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { Editable, Field } from '@xenon/solid'
import { createSignal, flush } from 'solid-js'
import { fireEvent } from '@testing-library/dom'
import { afterEach, expect, test } from 'vitest'

import { expectNoViolations } from '../a11y'

let dispose: (() => void) | undefined
let host: HTMLDivElement | undefined

afterEach(() => {
  dispose?.()
  host?.remove()
  dispose = undefined
  host = undefined
  flush()
})

function mount(children: () => JSX.Element) {
  host = document.createElement('div')
  document.body.append(host)
  dispose = render(children, host)
  flush()
  return host
}

test('editable.a11y.1 basic editable passes the configured axe rules', async () => {
  const root = mount(() => (
    <Editable defaultValue="Title">
      <Editable.Label>Title</Editable.Label>
      <Editable.Preview />
      <Editable.Input />
      <Editable.EditTrigger>Edit</Editable.EditTrigger>
      <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
      <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
    </Editable>
  ))

  await expectNoViolations(root)
})

test('editable.forms.1 field state reaches the hidden textbox and errors are conditional', () => {
  const [invalid, setInvalid] = createSignal(false)
  const [disabled, setDisabled] = createSignal(false)
  const [readonly, setReadonly] = createSignal(false)
  const root = mount(() => (
    <Field required disabled={disabled()} readonly={readonly()} invalid={invalid()}>
      <Field.Label>Title</Field.Label>
      <Field.Description>Use a short title.</Field.Description>
      <Field.Error>Title is invalid.</Field.Error>
      <Editable defaultValue="Locked">
        <Editable.Preview />
        <Editable.Input />
      </Editable>
    </Field>
  ))
  const input = root.querySelector('input')!
  expect(input).toHaveAttribute('hidden')
  expect(input).toBeRequired()
  expect(input).not.toBeDisabled()
  expect(input).not.toHaveAttribute('readonly')
  expect(root).toHaveTextContent('Use a short title.')
  expect(root).not.toHaveTextContent('Title is invalid.')

  setDisabled(true)
  flush()
  expect(input).toBeDisabled()
  setReadonly(true)
  flush()
  expect(input).toHaveAttribute('readonly')
  setInvalid(true)
  flush()
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(root).toHaveTextContent('Title is invalid.')
  const describedIds = input.getAttribute('aria-describedby')!.split(' ')
  expect(describedIds).toHaveLength(2)
  expect(describedIds.map((id) => root.querySelector(`#${id}`)?.textContent)).toEqual([
    'Use a short title.',
    'Title is invalid.',
  ])

  setInvalid(false)
  flush()
  expect(input).not.toHaveAttribute('aria-invalid')
  expect(root).not.toHaveTextContent('Title is invalid.')
  expect(input.getAttribute('aria-describedby')).toBe(describedIds[0])
})

test('editable.roles.2 preview exposes shipped state flags, placeholder text and tabindex transitions', () => {
  const [disabled, setDisabled] = createSignal(false)
  const [readonly, setReadonly] = createSignal(false)
  const [required, setRequired] = createSignal(false)
  const [invalid, setInvalid] = createSignal(false)
  const root = mount(() => (
    <Editable
      value=""
      placeholder="Add a title"
      disabled={disabled()}
      readonly={readonly()}
      required={required()}
      invalid={invalid()}
    >
      <Editable.Preview />
      <Editable.Input />
    </Editable>
  ))
  const preview = root.querySelector('[role="button"]')!
  expect(preview).toHaveAttribute('data-state', 'preview')
  expect(preview).not.toHaveAttribute('data-disabled')
  expect(preview).not.toHaveAttribute('data-readonly')
  expect(preview).not.toHaveAttribute('data-required')
  expect(preview).not.toHaveAttribute('data-invalid')
  expect(preview).not.toHaveAttribute('aria-disabled')
  expect(preview).toHaveAttribute('tabindex', '0')
  expect(preview).toHaveTextContent('Add a title')

  setDisabled(true)
  flush()
  expect(preview).toHaveAttribute('data-disabled', '')
  expect(preview).toHaveAttribute('aria-disabled', 'true')
  expect(preview).toHaveAttribute('tabindex', '-1')
  setDisabled(false)
  setReadonly(true)
  flush()
  expect(preview).not.toHaveAttribute('data-disabled')
  expect(preview).toHaveAttribute('data-readonly', '')
  expect(preview).toHaveAttribute('aria-disabled', 'true')
  expect(preview).toHaveAttribute('tabindex', '0')
  setRequired(true)
  setInvalid(true)
  flush()
  expect(preview).toHaveAttribute('data-required', '')
  expect(preview).toHaveAttribute('data-invalid', '')
  setReadonly(false)
  setRequired(false)
  setInvalid(false)
  flush()
  expect(preview).not.toHaveAttribute('data-readonly')
  expect(preview).not.toHaveAttribute('data-required')
  expect(preview).not.toHaveAttribute('data-invalid')
  expect(preview).not.toHaveAttribute('aria-disabled')
})

test('editable.roles.3 input exposes native state, disabled state, placeholder and clearing transitions', () => {
  const [disabled, setDisabled] = createSignal(false)
  const [readonly, setReadonly] = createSignal(false)
  const [required, setRequired] = createSignal(false)
  const [invalid, setInvalid] = createSignal(false)
  const root = mount(() => (
    <Editable
      defaultEditing
      placeholder="Edit title"
      disabled={disabled()}
      readonly={readonly()}
      required={required()}
      invalid={invalid()}
    >
      <Editable.Label>Title</Editable.Label>
      <Editable.Input />
    </Editable>
  ))
  const input = root.querySelector('input')!
  expect(input).not.toHaveAttribute('hidden')
  expect(input).toHaveAttribute('data-state', 'editing')
  expect(input).toHaveAttribute('placeholder', 'Edit title')
  expect(input).not.toHaveAttribute('data-disabled')
  expect(input).not.toHaveAttribute('data-readonly')
  expect(input).not.toHaveAttribute('data-required')
  expect(input).not.toHaveAttribute('data-invalid')
  expect(input).not.toHaveAttribute('disabled')
  expect(input).not.toHaveAttribute('readonly')
  expect(input).not.toHaveAttribute('required')
  expect(input).not.toHaveAttribute('aria-invalid')

  setDisabled(true)
  setReadonly(true)
  setRequired(true)
  setInvalid(true)
  flush()
  expect(input).toHaveAttribute('data-disabled', '')
  expect(input).toHaveAttribute('data-readonly', '')
  expect(input).toHaveAttribute('data-required', '')
  expect(input).toHaveAttribute('data-invalid', '')
  expect(input).toBeDisabled()
  expect(input).toHaveAttribute('readonly')
  expect(input).toHaveAttribute('required')
  expect(input).toHaveAttribute('aria-invalid', 'true')

  setDisabled(false)
  setReadonly(false)
  setRequired(false)
  setInvalid(false)
  flush()
  for (const attribute of ['data-disabled', 'data-readonly', 'data-required', 'data-invalid'])
    expect(input).not.toHaveAttribute(attribute)
  expect(input).not.toHaveAttribute('disabled')
  expect(input).not.toHaveAttribute('readonly')
  expect(input).not.toHaveAttribute('required')
  expect(input).not.toHaveAttribute('aria-invalid')
})

test('editable.roles.6 action triggers are buttons with stable labels and visibility in both states', () => {
  const root = mount(() => (
    <Editable defaultValue="Value">
      <Editable.Preview />
      <Editable.Input />
      <Editable.EditTrigger>Edit</Editable.EditTrigger>
      <Editable.SubmitTrigger>Save</Editable.SubmitTrigger>
      <Editable.CancelTrigger>Cancel</Editable.CancelTrigger>
    </Editable>
  ))
  const button = (label: string) => root.querySelector(`button[aria-label="${label}"]`)!
  expect(button('Edit')).toHaveAttribute('type', 'button')
  expect(button('Save')).toHaveAttribute('type', 'button')
  expect(button('Cancel')).toHaveAttribute('type', 'button')
  expect(button('Edit')).not.toHaveAttribute('hidden')
  expect(button('Save')).toHaveAttribute('hidden')
  expect(button('Cancel')).toHaveAttribute('hidden')

  fireEvent.click(button('Edit'))
  flush()
  expect(button('Edit')).toHaveAttribute('hidden')
  expect(button('Save')).not.toHaveAttribute('hidden')
  expect(button('Cancel')).not.toHaveAttribute('hidden')
  expect(button('Save')).toHaveAttribute('type', 'button')
  expect(button('Cancel')).toHaveAttribute('type', 'button')

  fireEvent.click(button('Cancel'))
  flush()
  expect(button('Edit')).not.toHaveAttribute('hidden')
  expect(button('Save')).toHaveAttribute('hidden')
  expect(button('Cancel')).toHaveAttribute('hidden')
})
