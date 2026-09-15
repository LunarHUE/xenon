import { Meter } from '@xenon/solid/meter'
import { within } from '@testing-library/dom'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'

test('meter.pointer.1 remains unchanged when it receives pointer input', async () => {
  const m = mount('field', {
    children: () => <Meter value={30} aria-label="Storage" />,
  })
  const meter = within(m.container).getByRole('meter')
  const before = meter.outerHTML
  await userEvent.click(meter)
  await m.settle()
  expect(meter.outerHTML).toBe(before)
  expect(meter).not.toHaveFocus()
  m.unmount()
})
