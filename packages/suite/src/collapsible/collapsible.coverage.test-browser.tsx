import { Collapsible } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { userEvent } from 'vitest/browser'
import { expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('collapsible.focus.2', async () => {
  const m = mount('collapsible', {
    defaultOpen: true,
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Text only</Collapsible.Content>
        <button>After</button>
      </>
    ),
  })
  const scope = within(m.container)
  scope.getByRole('button', { name: 'Details' }).focus()
  await userEvent.tab()
  expect(scope.getByRole('button', { name: 'After' })).toHaveFocus()
})

spec('collapsible.pointer.3', async () => {
  const m = mount('collapsible', {
    children: () => (
      <>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content>Content</Collapsible.Content>
      </>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'Details' })
  await userEvent.click(trigger, { button: 'middle' })
  await userEvent.click(trigger, { button: 'right' })
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(within(m.container).queryByText('Content')).toBeNull()
})
