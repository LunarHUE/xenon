import { Menu, Toolbar } from '@xenon-ui/solid'
import { within } from '@testing-library/dom'
import { expect } from 'vitest'
import { userEvent } from 'vitest/browser'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('toolbar.keyboard.15', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Overlay',
    children: () => (
      <Menu>
        <Menu.Trigger as={Toolbar.Button}>More</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>One</Menu.Item>
            <Menu.Item>Two</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ),
  })
  const trigger = within(m.container).getByRole('button', { name: 'More' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await m.settle()
  const one = within(document.body).getByRole('menuitem', { name: 'One' })
  const two = within(document.body).getByRole('menuitem', { name: 'Two' })
  expect(one).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await m.settle()
  expect(two).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await m.settle()
  expect(trigger).toHaveFocus()
})
