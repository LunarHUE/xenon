import { within } from '@testing-library/dom'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

function host(container: HTMLElement) {
  return container.firstElementChild as HTMLElement
}

test('switch.keyboard.8 submits once on Enter with and without a submitter', async () => {
  for (const withSubmitter of [false, true]) {
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const change = vi.fn()
    const m = mount('switch', {
      'aria-label': 'Lights',
      onKeyDown: undefined,
      onCheckedChange: change,
    })
    const form = document.createElement('form')
    form.addEventListener('submit', submit)
    form.append(m.container)
    if (withSubmitter) {
      const button = document.createElement('button')
      button.type = 'submit'
      button.textContent = 'Save'
      form.append(button)
    }
    document.body.append(form)
    const input = host(m.container)
    input.focus()
    await userEvent.keyboard('{Enter}')
    await m.settle()
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit.mock.calls[0]![0].submitter).toBe(form.querySelector('button'))
    expect(change).not.toHaveBeenCalled()
    expect(input).not.toBeChecked()
    form.remove()
    m.unmount()
  }
})

function submissionFixture(props: Record<string, unknown> = {}) {
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  const change = vi.fn()
  const m = mount('switch', { 'aria-label': 'Lights', onCheckedChange: change, ...props })
  const form = document.createElement('form')
  form.addEventListener('submit', submit)
  form.append(m.container)
  document.body.append(form)
  onTestFinished(() => {
    m.unmount()
    form.remove()
  })
  return { ...m, form, submit, change, input: host(m.container) as HTMLInputElement }
}

test('native Switch Enter uses its external owning form and first submitter', async () => {
  const m = submissionFixture({ form: 'external-switch-form' })
  const external = document.createElement('form')
  external.id = 'external-switch-form'
  const button = document.createElement('button')
  button.setAttribute('form', external.id)
  button.name = 'action'
  button.value = 'save'
  const second = document.createElement('input')
  second.type = 'submit'
  external.append(second)
  document.body.append(button, external)
  onTestFinished(() => {
    button.remove()
    external.remove()
  })
  const submit = vi.fn((event: SubmitEvent) => event.preventDefault())
  external.addEventListener('submit', submit)
  m.input.focus()
  await userEvent.keyboard('{Enter}')
  expect(m.submit).not.toHaveBeenCalled()
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0]![0].submitter).toBe(button)
  expect(new FormData(external, button).get('action')).toBe('save')
  expect(m.change).not.toHaveBeenCalled()
})

test('native Switch Enter preserves validation and submitter formnovalidate', async () => {
  const m = submissionFixture({ required: true })
  const invalid = vi.fn()
  m.input.addEventListener('invalid', invalid)
  m.input.focus()
  await userEvent.keyboard('{Enter}')
  expect(invalid).toHaveBeenCalledTimes(1)
  expect(m.submit).not.toHaveBeenCalled()

  const submitter = document.createElement('input')
  submitter.type = 'submit'
  submitter.formNoValidate = true
  m.form.append(submitter)
  await userEvent.keyboard('{Enter}')
  expect(m.submit).toHaveBeenCalledTimes(1)
  expect(m.submit.mock.calls[0]![0].submitter).toBe(submitter)
  expect(m.input).not.toBeChecked()
  expect(m.change).not.toHaveBeenCalled()
})

test.each(['disabled', 'readonly', 'fieldset', 'canceled', 'submitter'])(
  'native Switch Enter does not submit when blocked by %s',
  async (reason) => {
    const keydown = vi.fn((event: KeyboardEvent) => {
      if (reason === 'canceled') event.preventDefault()
    })
    const m = submissionFixture({
      disabled: reason === 'disabled',
      readonly: reason === 'readonly',
      onKeyDown: keydown,
    })
    if (reason === 'fieldset') {
      const fieldset = document.createElement('fieldset')
      fieldset.disabled = true
      fieldset.append(m.container)
      m.form.append(fieldset)
    }
    if (reason === 'submitter') {
      const button = document.createElement('button')
      button.disabled = true
      m.form.append(button, document.createElement('button'))
    }
    // Dispatch also exercises the disabled guard, since native disabled inputs
    // cannot receive focus for a real keyboard press.
    m.input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    )
    await m.settle()
    expect(m.submit).not.toHaveBeenCalled()
    expect(m.input).not.toBeChecked()
    expect(m.change).not.toHaveBeenCalled()
    if (reason === 'readonly' || reason === 'disabled') expect(keydown).not.toHaveBeenCalled()
  }
)

test('switch.pointer.2 native input click relies on native checkedness without an onclick property', async () => {
  const m = mount('switch', { 'aria-label': 'Lights' })
  const input = host(m.container) as HTMLInputElement
  expect(input.onclick).toBeNull()
  await userEvent.click(input)
  await m.settle()
  expect(input.checked).toBe(true)
  expect(input.onclick).toBeNull()
  m.unmount()
})

test('switch.pointer.3 explicit labels toggle and retain focus on the native switch', async () => {
  const m = mount('switch', { id: 'coverage-switch-label', 'aria-label': 'Lights' })
  const input = host(m.container)
  const label = document.createElement('label')
  label.htmlFor = 'coverage-switch-label'
  label.textContent = 'Lights'
  document.body.append(label)
  await userEvent.click(label)
  await m.settle()
  expect(input).toBeChecked()
  expect(input).toHaveFocus()
  await userEvent.click(label)
  await m.settle()
  expect(input).not.toBeChecked()
  expect(input).toHaveFocus()
  label.remove()
  m.unmount()
})

test('switch.focus.2 hidden form mirrors stay out of the tab sequence while visible roots receive focus', async () => {
  const before = document.createElement('button')
  before.textContent = 'Before'
  document.body.append(before)
  const m = mount('switch', { as: 'button', children: 'Lights', name: 'lights' })
  const root = within(m.container).getByRole('switch')
  const mirror = m.container.querySelector('input[aria-hidden="true"]')!
  expect(mirror).toHaveAttribute('tabindex', '-1')
  before.focus()
  await userEvent.tab()
  expect(root).toHaveFocus()
  expect(mirror).not.toHaveFocus()
  before.remove()
  m.unmount()
})
