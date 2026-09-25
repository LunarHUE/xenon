import { Collapsible } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('collapsible.pointer.4', async () => {
  const changed = vi.fn()
  const m = mount('collapsible', {
    onOpenChange: changed,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Details' })
  trigger.addEventListener('click', (event) => event.preventDefault(), { capture: true })
  fireEvent.click(trigger)
  await m.settle()
  expect(changed).not.toHaveBeenCalled()
  expect(within(m.container).queryByText('Content')).toBeNull()
})
