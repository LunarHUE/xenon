import { Menu, Toolbar } from '@xenon-ui/solid'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('toolbar.keyboard.13', async () => {
  const capture = vi.fn()
  const rendered = vi.fn()
  const own = vi.fn()
  const parent = vi.fn()
  const Layered = (props: JSX.HTMLAttributes<HTMLDivElement>) => {
    const inherited = props.onClick
    return (
      <div
        {...props}
        onClick={(event) => {
          rendered(event)
          if (typeof inherited === 'function') inherited(event)
        }}
      />
    )
  }
  const m = mount('toolbar', {
    'aria-label': 'Actions',
    onClick: parent,
    children: () => (
      <Toolbar.Button
        as={Layered}
        ref={(node) => node.addEventListener('click', capture, true)}
        onClick={own}
      >
        Run
      </Toolbar.Button>
    ),
  })
  const button = within(m.container).getByRole('button')
  button.focus()
  fireEvent.keyDown(button, { key: 'Enter' })
  await m.settle()
  expect(capture).toHaveBeenCalledTimes(1)
  expect(rendered).toHaveBeenCalledTimes(1)
  expect(own).toHaveBeenCalledTimes(1)
  expect(parent).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(button, { key: ' ' })
  fireEvent.keyUp(button, { key: ' ' })
  await m.settle()
  expect(capture).toHaveBeenCalledTimes(2)
  expect(rendered).toHaveBeenCalledTimes(2)
  expect(own).toHaveBeenCalledTimes(2)
  expect(parent).toHaveBeenCalledTimes(2)
})

spec('toolbar.notes.5', () => {
  const refs = Array.from({ length: 5 }, () => vi.fn())
  const clicks = Array.from({ length: 5 }, () => vi.fn())
  const m = mount('toolbar', {
    ref: refs[0],
    onClick: clicks[0],
    class: 'forwarded',
    style: { color: 'red' },
    children: () => (
      <>
        <Toolbar.Button
          ref={refs[1]}
          onClick={clicks[1]}
          class="forwarded"
          style={{ color: 'red' }}
        >
          A
        </Toolbar.Button>
        <Toolbar.Link
          ref={refs[2]}
          onClick={clicks[2]}
          href="#x"
          class="forwarded"
          style={{ color: 'red' }}
        >
          Link
        </Toolbar.Link>
        <Toolbar.Group ref={refs[3]} onClick={clicks[3]} class="forwarded" style={{ color: 'red' }}>
          Group
        </Toolbar.Group>
        <Toolbar.Separator
          ref={refs[4]}
          onClick={clicks[4]}
          class="forwarded"
          style={{ color: 'red' }}
        />
      </>
    ),
  })
  const root = within(m.container).getByRole('toolbar')
  const button = within(m.container).getByRole('button')
  const link = within(m.container).getByRole('link')
  const group = within(m.container).getByRole('group')
  const separator = within(m.container).getByRole('separator')
  const parts = [root, button, link, group, separator]
  for (const part of parts) {
    fireEvent.click(part)
    expect(part).toHaveClass('forwarded')
    expect(part).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  }
  refs.forEach((ref, index) => expect(ref).toHaveBeenCalledWith(parts[index]))
  expect(clicks.every((fn) => fn.mock.calls.length > 0)).toBe(true)
})

spec('toolbar.roles.16', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Actions',
    children: () => (
      <>
        <Toolbar.Button>Before</Toolbar.Button>
        <Menu>
          <Menu.Trigger as={Toolbar.Button} aria-label="More actions">
            More
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item>One</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu>
      </>
    ),
  })
  const before = within(m.container).getByRole('button', { name: 'Before' })
  const trigger = within(m.container).getByRole('button', { name: 'More actions' })
  expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  before.focus()
  fireEvent.keyDown(before, { key: 'ArrowRight' })
  await m.settle()
  expect(trigger).toHaveFocus()
  fireEvent.click(trigger)
  await m.settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const menu = within(document.body).getByRole('menu')
  expect(trigger).toHaveAttribute('aria-controls', menu.id)
  expect(menu).toBeVisible()
})
