import axe from 'axe-core'
import { within } from '@testing-library/dom'
import { Field, Switch } from '@xenon/solid'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

test('switch.pointer.3 wrapping and Field.Label activation toggle and preserve focus', async () => {
  const wrapped = mount('switch', { id: 'switch-more-wrapped', 'aria-label': 'Wrapped' })
  const label = document.createElement('label')
  label.textContent = 'Wrapped'
  document.body.append(label)
  label.append(wrapped.container)
  const input = wrapped.container.firstElementChild!
  onTestFinished(() => {
    label.remove()
    wrapped.unmount()
  })
  await userEvent.click(label)
  await wrapped.settle()
  expect(input).toBeChecked()
  expect(input).toHaveFocus()
  await userEvent.click(label)
  await wrapped.settle()
  expect(input).not.toBeChecked()
  expect(input).toHaveFocus()
  const field = mount('field', {
    children: () => (
      <>
        <Field.Label>Field switch</Field.Label>
        <Switch />
      </>
    ),
  })
  const fieldInput = within(field.container).getByRole('switch')
  await userEvent.click(within(field.container).getByText('Field switch'))
  await field.settle()
  expect(fieldInput).toBeChecked()
  expect(fieldInput).toHaveFocus()
  await userEvent.click(within(field.container).getByText('Field switch'))
  await field.settle()
  expect(fieldInput).not.toBeChecked()
  expect(fieldInput).toHaveFocus()
  field.unmount()
})

test('switch.roles.14 measures a 24px author-sized switch and passes enabled target-size axe', async () => {
  const m = mount('switch', {
    'aria-label': 'Lights',
    style: { width: '24px', height: '24px' },
  })
  const el = m.container.firstElementChild as HTMLElement
  expect(el.getBoundingClientRect().width).toBeGreaterThanOrEqual(24)
  expect(el.getBoundingClientRect().height).toBeGreaterThanOrEqual(24)
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['target-size'] },
    rules: { 'target-size': { enabled: true } },
  })
  expect(results.violations.map((violation) => violation.id)).toEqual([])
  m.unmount()
})
