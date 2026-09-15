import { Field } from '@xenon/solid/field'
import { NumberField } from '@xenon/solid/number-field'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import axe from 'axe-core'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'

const cleanups: (() => void)[] = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return container
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

test('number-field.a11y.4: labels and descriptions compose in author-first order', async () => {
  const [invalid, setInvalid] = createSignal(false)
  const container = mount(() => (
    <Field id="amount" invalid={invalid()}>
      <Field.Label id="visible-label">Amount</Field.Label>
      <Field.Label id="secondary-label">Quantity</Field.Label>
      <Field.Description id="help">Use whole units.</Field.Description>
      <Field.Error id="error">Amount is invalid.</Field.Error>
      <span id="author-label">Author label</span>
      <span id="author-help">Author help</span>
      <NumberField>
        <NumberField.Input
          aria-label="Author name"
          aria-labelledby="author-label"
          aria-describedby="author-help"
        />
      </NumberField>
    </Field>
  ))
  await settle()
  const input = within(container).getByRole('spinbutton')
  // Native labelable controls use label[for]; author ID references pass through.
  expect(input).toHaveAttribute('aria-labelledby', 'author-label')
  expect(input).toHaveAccessibleName('Author label')
  expect(container.querySelector('#visible-label')).toHaveAttribute('for', input.id)
  expect(container.querySelector('#secondary-label')).toHaveAttribute('for', input.id)
  expect(input).toHaveAttribute('aria-describedby', 'author-help help')
  expect(input).toHaveAttribute('aria-label', 'Author name')
  expect(container.querySelector('#visible-label')).toBeVisible()
  expect(container.querySelector('#secondary-label')).toBeVisible()
  setInvalid(true)
  flush()
  expect(input).toHaveAttribute('aria-describedby', 'author-help help error')
  expect(container.querySelector('#error')).toBeVisible()
  setInvalid(false)
  flush()
  expect(input).toHaveAttribute('aria-describedby', 'author-help help')
  expect(input).not.toHaveAttribute('aria-invalid')
})

test('number-field.roles.4: title, labelledby and label sources name spinbuttons while nameless fails axe', async () => {
  const titleContainer = mount(() => (
    <NumberField>
      <NumberField.Input title="Title amount" />
    </NumberField>
  ))
  await settle()
  const titleInput = within(titleContainer).getByRole('spinbutton', { name: 'Title amount' })
  expect(titleInput).toHaveAccessibleName('Title amount')

  const labelledContainer = mount(() => (
    <NumberField>
      <span id="explicit-name">Explicit amount</span>
      <NumberField.Input aria-labelledby="explicit-name" />
    </NumberField>
  ))
  await settle()
  const labelledInput = within(labelledContainer).getByRole('spinbutton', {
    name: 'Explicit amount',
  })
  expect(labelledInput).toHaveAccessibleName('Explicit amount')

  const labelledResults = await axe.run(labelledContainer, {
    runOnly: { type: 'rule', values: ['aria-input-field-name'] },
  })
  expect(labelledResults.violations).toHaveLength(0)
  expect(labelledResults.incomplete).toHaveLength(0)
  expect(labelledResults.passes).toHaveLength(0)
  expect(labelledResults.inapplicable.map(({ id }) => id)).toContain('aria-input-field-name')

  const explicitContainer = mount(() => (
    <NumberField>
      <NumberField.Input aria-label="Explicit label amount" />
    </NumberField>
  ))
  await settle()
  expect(within(explicitContainer).getByRole('spinbutton')).toHaveAccessibleName(
    'Explicit label amount'
  )

  const namelessContainer = mount(() => (
    <>
      <div role="spinbutton" aria-valuenow="1">
        Visible text only
      </div>
      <div role="spinbutton" aria-valuenow="1" title="Generic title" />
      <div role="spinbutton" aria-valuenow="1" aria-label="Generic explicit name" />
      <span id="generic-name">Generic referenced name</span>
      <div role="spinbutton" aria-valuenow="1" aria-labelledby="generic-name" />
    </>
  ))
  const namelessResults = await axe.run(namelessContainer, {
    runOnly: { type: 'rule', values: ['aria-input-field-name'] },
  })
  const violation = namelessResults.violations.find((item) => item.id === 'aria-input-field-name')
  expect(namelessResults.violations).toHaveLength(1)
  expect(violation?.nodes).toHaveLength(1)
  expect(violation?.impact).toBe('serious')
  expect(violation?.nodes[0]?.html).toContain('role="spinbutton"')
  expect(namelessResults.incomplete).toHaveLength(0)
  expect(
    namelessResults.passes.find(({ id }) => id === 'aria-input-field-name')?.nodes
  ).toHaveLength(3)
})

test('number-field.roles.4: generated labels target distinct generated input ids', () => {
  const container = mount(() => (
    <>
      <NumberField>
        <NumberField.Label>First amount</NumberField.Label>
        <NumberField.Input />
      </NumberField>
      <NumberField>
        <NumberField.Label>Second amount</NumberField.Label>
        <NumberField.Input />
      </NumberField>
    </>
  ))
  const inputs = [...container.querySelectorAll<HTMLInputElement>('input[role="spinbutton"]')]
  const labels = [...container.querySelectorAll<HTMLLabelElement>('label')]
  expect(inputs).toHaveLength(2)
  expect(labels).toHaveLength(2)
  expect(new Set(inputs.map((input) => input.id)).size).toBe(2)
  expect(labels.map((label) => label.htmlFor)).toEqual(inputs.map((input) => input.id))
  expect(labels.map((label) => label.textContent)).toEqual(['First amount', 'Second amount'])
  expect(inputs[0]).toHaveAccessibleName('First amount')
  expect(inputs[1]).toHaveAccessibleName('Second amount')
  expect(inputs.map((input) => input).map((input) => input.getAttribute('aria-label'))).toEqual([
    null,
    null,
  ])
})
