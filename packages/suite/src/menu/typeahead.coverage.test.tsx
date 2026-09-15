import { Menu } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import userEvent from '@testing-library/user-event'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

test('typeahead.keyboard.1 crosses Menu groups and sections using one prefix', async () => {
  const view = mount(() => (
    <Menu>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Group>
            <Menu.GroupLabel>One</Menu.GroupLabel>
            <Menu.Item>Alpha</Menu.Item>
            <Menu.Item>Beta</Menu.Item>
          </Menu.Group>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>Two</Menu.GroupLabel>
            <Menu.Item>Blue</Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = view.getByRole('button', { name: 'Open' })
  await userEvent.setup().click(trigger)
  const beta = view.getByRole('menuitem', { name: 'Beta' })
  beta.focus()
  beta.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true }))
  expect(view.getByRole('menuitem', { name: 'Blue' })).toHaveFocus()
})

test('typeahead.keyboard.7 extends an active search with space and doubled space matches nothing', async () => {
  const view = mount(() => (
    <Menu>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item>Foo bar</Menu.Item>
          <Menu.Item>Baz</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.setup().click(view.getByRole('button', { name: 'Open' }))
  const item = view.getByRole('menuitem', { name: 'Baz' })
  item.focus()
  const user = userEvent.setup()
  await user.keyboard('foo ')
  expect(view.getByRole('menuitem', { name: 'Foo bar' })).toHaveFocus()
  await user.keyboard(' ')
  expect(view.getByRole('menuitem', { name: 'Foo bar' })).toHaveFocus()
})

test('typeahead.keyboard.9 matches explicit Menu item textValue instead of rendered text', async () => {
  const view = mount(() => (
    <Menu>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item textValue="preferred name">Visible label</Menu.Item>
          <Menu.Item>Other</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.setup().click(view.getByRole('button', { name: 'Open' }))
  const other = view.getByRole('menuitem', { name: 'Other' })
  other.focus()
  other.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }))
  expect(view.getByRole('menuitem', { name: 'Visible label' })).toHaveFocus()
})

test('typeahead.keyboard.17 keeps buffers isolated between Menu instances', async () => {
  const view = mount(() => (
    <>
      <Menu>
        <Menu.Trigger>First</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Alpine</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <Menu>
        <Menu.Trigger>Second</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Beta</Menu.Item>
            <Menu.Item>Alpha</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    </>
  ))
  await userEvent.setup().click(view.getByRole('button', { name: 'First' }))
  const first = view.getByRole('menuitem', { name: 'Alpine' })
  first.focus()
  first.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
  first.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', bubbles: true }))
  await userEvent.setup().click(view.getByRole('button', { name: 'Second' }))
  const beta = view.getByRole('menuitem', { name: 'Beta' })
  beta.focus()
  beta.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
  expect(view.getByRole('menuitem', { name: 'Alpha' })).toHaveFocus()
})
