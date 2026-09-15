import { RadioGroup } from '@xenon/solid'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'

import { mount } from '../harness/solid'

test('radio.roles.4: custom radios expose aria-checked while native radios use checkedness', () => {
  const custom = mount('radio-group', {
    'aria-label': 'Custom delivery',
    defaultValue: 'express',
    children: () => (
      <>
        <RadioGroup.Item as="button" value="standard" aria-label="Standard" />
        <RadioGroup.Item as="button" value="express" aria-label="Express" />
      </>
    ),
  })
  const customExpress = within(custom.container).getByRole('radio', { name: 'Express' })
  expect(customExpress).toHaveAttribute('aria-checked', 'true')
  custom.unmount()

  const native = mount('radio-group', {
    'aria-label': 'Native delivery',
    defaultValue: 'express',
    children: () => (
      <>
        <RadioGroup.Item value="standard" aria-label="Standard" />
        <RadioGroup.Item value="express" aria-label="Express" />
      </>
    ),
  })
  const nativeExpress = within(native.container).getByRole('radio', { name: 'Express' })
  expect(nativeExpress).toBeChecked()
  expect(nativeExpress).not.toHaveAttribute('aria-checked')
  native.unmount()
})
