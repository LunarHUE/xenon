import { Field } from '@xenon/solid'
import { screen } from '@testing-library/dom'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { mount } from '../harness/solid'

test('label.notes.2 updates reactive author props while its generated id stays stable', async () => {
  const [className, setClassName] = createSignal('first')
  const m = mount('field', {
    children: () => (
      <>
        <Field.Label class={className()}>Account</Field.Label>
        <Field.Control />
      </>
    ),
  })
  await m.settle()
  const label = screen.getByText('Account')
  const id = label.id
  expect(label).toHaveClass('first')
  setClassName('second')
  await m.settle()
  expect(label).toHaveClass('second')
  expect(label).not.toHaveClass('first')
  expect(label.id).toBe(id)
})

test('label.roles.5 exposes the label part and mirrors every Field state flag', async () => {
  const m = mount('field', {
    disabled: true,
    invalid: true,
    readonly: true,
    required: true,
    children: () => <Field.Label>Account</Field.Label>,
  })
  await m.settle()
  const label = screen.getByText('Account')
  expect(label).toHaveAttribute('data-part', 'label')
  for (const flag of ['disabled', 'invalid', 'readonly', 'required'])
    expect(label).toHaveAttribute(`data-${flag}`, '')
  m.unmount()
})

test('input.roles.4 keeps the Field root enabled when only a native child is disabled', async () => {
  for (const kind of ['button', 'submit', 'select'] as const) {
    const m = mount('field', {
      children: () =>
        kind === 'button' ? (
          <Field.Control as="button" disabled>
            Action
          </Field.Control>
        ) : kind === 'submit' ? (
          <Field.Control as="input" type="submit" disabled />
        ) : (
          <Field.Control as="select" disabled>
            <option>Account</option>
          </Field.Control>
        ),
    })
    await m.settle()
    expect(m.container.querySelector('[role="group"]')).not.toHaveAttribute('data-disabled')
    expect(m.container.querySelector('[role="group"]')).not.toBeDisabled()
    m.unmount()
  }
})

test('input.roles.5 preserves readonly on a share URL while excluding its key hint from the name', async () => {
  const m = mount('field', {
    readonly: true,
    children: () => (
      <>
        <Field.Label>
          Share URL <span aria-hidden="true">⌘K</span>
        </Field.Label>
        <Field.Control value="https://example.test/share" />
      </>
    ),
  })
  await m.settle()
  const input = screen.getByRole('textbox', { name: 'Share URL' })
  expect(input).toHaveProperty('readOnly', true)
  expect(input).toHaveAccessibleName('Share URL')
  expect(input).not.toHaveAccessibleName('Share URL ⌘K')
  m.unmount()
})
