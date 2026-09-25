import axe from 'axe-core'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'

import { RadioGroup } from '@xenon-ui/solid'

import { mount } from '../harness/solid'

test('radio.roles.3 naming matrix includes title and axe label taxonomy', async () => {
  const m = mount('radio-group', {
    children: () => (
      <>
        <RadioGroup.Item as="button" value="title-only" title="Title only" />
        <RadioGroup.Item as="button" value="content" title="Title name">
          Visible content
        </RadioGroup.Item>
        <span id="extra-radio-label">Referenced name</span>
        <RadioGroup.Item as="button" value="referenced" aria-labelledby="extra-radio-label" />
        <RadioGroup.Item as="button" value="label" aria-label="Explicit name" />
      </>
    ),
  })
  const scope = within(m.container)
  const titleOnly = scope.getByRole('radio', { name: 'Title only' })
  expect(titleOnly).toHaveAccessibleName('Title only')
  const titled = scope.getByRole('radio', { name: 'Visible content' })
  expect(titled).toHaveAccessibleName('Visible content')
  expect(titled).toHaveAttribute('title', 'Title name')
  expect(scope.getByRole('radio', { name: 'Referenced name' })).toHaveAccessibleName(
    'Referenced name'
  )
  expect(scope.getByRole('radio', { name: 'Explicit name' })).toHaveAccessibleName('Explicit name')
  const results = await axe.run(m.container, {
    runOnly: { type: 'rule', values: ['label', 'label-title-only', 'form-field-multiple-labels'] },
  })
  expect(results.violations).toEqual([])
  expect(results.incomplete).toEqual([])
  expect(results.passes).toEqual([])
  expect(results.inapplicable.map(({ id }) => id)).toEqual(
    expect.arrayContaining(['label', 'label-title-only', 'form-field-multiple-labels'])
  )

  const native = mount('radio-group', {
    children: () => (
      <>
        <RadioGroup.Item value="title-only" title="Native title only" />
        <RadioGroup.Item value="label" aria-label="Native label" />
      </>
    ),
  })
  const nativeTitle = within(native.container).getByRole('radio', { name: 'Native title only' })
  expect(nativeTitle).toHaveAccessibleName('Native title only')
  const nativeResults = await axe.run(native.container, {
    runOnly: { type: 'rule', values: ['label', 'label-title-only', 'form-field-multiple-labels'] },
  })
  expect(nativeResults.violations).toHaveLength(1)
  expect(nativeResults.violations[0]?.id).toBe('label-title-only')
  expect(nativeResults.violations[0]?.impact).toBe('serious')
  expect(nativeResults.violations[0]?.nodes[0]?.html).toContain('title="Native title only"')
  expect(nativeResults.incomplete).toEqual([])
  expect(nativeResults.passes.map(({ id }) => id)).toEqual(
    expect.arrayContaining(['label', 'label-title-only', 'form-field-multiple-labels'])
  )
})

test('radio.roles.4 required aria-checked and native stray aria-checked are audited', async () => {
  const nameless = document.createElement('div')
  nameless.setAttribute('role', 'radio')
  nameless.tabIndex = 0
  document.body.append(nameless)
  try {
    const missing = await axe.run(nameless, {
      runOnly: { type: 'rule', values: ['aria-required-attr'] },
    })
    expect(missing.violations).toHaveLength(1)
    expect(missing.violations[0]?.id).toBe('aria-required-attr')
    expect(missing.violations[0]?.impact).toBe('critical')
    expect(missing.violations[0]?.nodes[0]?.html).toContain('role="radio"')
  } finally {
    nameless.remove()
  }

  const native = mount('radio-group', {
    defaultValue: 'selected',
    children: () => <RadioGroup.Item value="selected" aria-label="Selected" aria-checked="false" />,
  })
  const input = within(native.container).getByRole('radio', { name: 'Selected' })
  expect(input).toBeChecked()
  // The native item must remove or correct a contradictory author aria-checked value.
  expect.soft([null, 'true']).toContain(input.getAttribute('aria-checked'))
  input.setAttribute('aria-checked', 'false')
  const stray = await axe.run(native.container, {
    runOnly: { type: 'rule', values: ['aria-conditional-attr'] },
  })
  expect(stray.violations).toHaveLength(1)
  expect(stray.violations[0]?.id).toBe('aria-conditional-attr')
  expect(stray.violations[0]?.impact).toBe('serious')
  expect(stray.violations[0]?.nodes[0]?.html).toContain('aria-checked="false"')
})
