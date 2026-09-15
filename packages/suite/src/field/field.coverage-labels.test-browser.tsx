import { Field } from '@xenon/solid'
import { screen } from '@testing-library/dom'
import { expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

test('text-field.focus.1 counts programmatic and click focus, blur, and autofocus once', async () => {
  const focus = vi.fn()
  const blur = vi.fn()
  const m = mount('field', {
    children: () => <Field.Control aria-label="Account" onFocus={focus} onBlur={blur} />,
  })
  const control = screen.getByRole('textbox')
  control.focus()
  await m.settle()
  expect(focus).toHaveBeenCalledTimes(1)
  control.blur()
  await m.settle()
  expect(blur).toHaveBeenCalledTimes(1)
  await userEvent.click(control)
  await m.settle()
  expect(focus).toHaveBeenCalledTimes(2)
  control.blur()
  await m.settle()
  expect(blur).toHaveBeenCalledTimes(2)
  m.unmount()

  const autofocus = vi.fn()
  const auto = mount('field', {
    children: () => <Field.Control autofocus aria-label="Autofocus" onFocus={autofocus} />,
  })
  await auto.settle()
  expect(screen.getByRole('textbox', { name: 'Autofocus' })).toHaveFocus()
  expect(autofocus).toHaveBeenCalledTimes(1)
  auto.unmount()
})

test('text-field.pointer.2 focuses readonly text directly but not a disabled text control', async () => {
  const readonly = mount('field', {
    readonly: true,
    children: () => <Field.Control aria-label="Readonly" />,
  })
  const readonlyControl = screen.getByRole('textbox', { name: 'Readonly' })
  await userEvent.click(readonlyControl)
  expect(readonlyControl).toHaveFocus()
  readonly.unmount()

  const disabled = mount('field', {
    disabled: true,
    children: () => <Field.Control aria-label="Disabled" />,
  })
  const disabledControl = screen.getByRole('textbox', { name: 'Disabled' })
  document.body.focus()
  await userEvent.click(disabledControl, { force: true })
  expect(disabledControl).not.toHaveFocus()
  disabled.unmount()
})

async function labelFocus(
  kind: 'input' | 'textarea',
  rootProps: Record<string, unknown> = {},
  controlDisabled = false
) {
  const sentinel = document.createElement('button')
  sentinel.textContent = 'Sentinel'
  document.body.append(sentinel)
  const m = mount('field', {
    ...rootProps,
    children: () => (
      <>
        <Field.Label>Account</Field.Label>
        <Field.Control as={kind} disabled={controlDisabled} />
      </>
    ),
  })
  const control = m.container.querySelector(kind) as HTMLElement
  sentinel.focus()
  expect(sentinel).toHaveFocus()
  await userEvent.click(screen.getByText('Account'), { force: true })
  if (rootProps.disabled || controlDisabled) expect(document.activeElement).toBe(document.body)
  else expect(control).toHaveFocus()
  m.unmount()
  sentinel.remove()
}

test('input.pointer.1 activates a native label and suppresses direct disabled input focus', async () => {
  await labelFocus('input')
  await labelFocus('input', { disabled: true })
  await labelFocus('input', {}, true)
  const m = mount('field', { children: () => <Field.Control aria-label="Direct" disabled /> })
  const control = screen.getByRole('textbox', { name: 'Direct' })
  const sentinel = document.createElement('button')
  sentinel.textContent = 'Sentinel'
  document.body.append(sentinel)
  sentinel.focus()
  await userEvent.click(control, { force: true })
  expect(document.activeElement).toBe(document.body)
  expect(control).not.toHaveFocus()
  m.unmount()
  sentinel.remove()
})

test('textarea.pointer.1 activates a textarea label and suppresses disabled field variants', async () => {
  await labelFocus('textarea')
  await labelFocus('textarea', { disabled: true })
  await labelFocus('textarea', {}, true)

  const fieldset = mount('field', {
    children: () => (
      <fieldset disabled>
        <Field.Label>Account</Field.Label>
        <Field.Control as="textarea" />
      </fieldset>
    ),
  })
  const control = fieldset.container.querySelector('textarea')!
  const sentinel = document.createElement('button')
  sentinel.textContent = 'Sentinel'
  document.body.append(sentinel)
  sentinel.focus()
  await userEvent.click(screen.getByText('Account'), { force: true })
  expect(document.activeElement).toBe(document.body)
  expect(control).not.toHaveFocus()
  fieldset.unmount()
  sentinel.remove()
})
