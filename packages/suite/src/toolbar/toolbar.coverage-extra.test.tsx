import { Menu, RadioGroup, ToggleGroup, Toolbar } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import axe from 'axe-core'
import { expect } from 'vitest'
import { mount } from '../harness/solid'
import { spec } from '../spec'

spec('toolbar.focus.1', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Mixed',
    children: () => (
      <>
        <Toolbar.Button>Plain</Toolbar.Button>
        <RadioGroup aria-label="Choice" orientation="horizontal" defaultValue="a">
          <RadioGroup.Item as={Toolbar.Button} value="a" aria-label="A" />
          <RadioGroup.Item as={Toolbar.Button} value="b" aria-label="B" />
        </RadioGroup>
        <ToggleGroup aria-label="Style">
          <ToggleGroup.Item as={Toolbar.Button} value="bold">
            Bold
          </ToggleGroup.Item>
        </ToggleGroup>
        <Menu>
          <Menu.Trigger as={Toolbar.Button}>More</Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item>One</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu>
      </>
    ),
  })
  await m.settle()
  const controls = within(m.container)
  const plain = controls.getByRole('button', { name: 'Plain' })
  const a = controls.getByRole('radio', { name: 'A' })
  const b = controls.getByRole('radio', { name: 'B' })
  const bold = controls.getByRole('button', { name: 'Bold' })
  const more = controls.getByRole('button', { name: 'More' })
  expect(a).toHaveAttribute('type', 'button')
  expect(within(m.container).getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed')
  expect(m.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  plain.focus()
  for (const [from, to] of [
    [plain, a],
    [a, b],
    [b, bold],
    [bold, more],
  ] as const) {
    fireEvent.keyDown(from, { key: 'ArrowRight' })
    await m.settle()
    expect(to).toHaveFocus()
    expect(to).toHaveAttribute('tabindex', '0')
    expect(m.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  }
  expect(a).toHaveAttribute('aria-checked', 'true')
  expect(b).toHaveAttribute('aria-checked', 'false')
  expect(bold).toHaveAttribute('aria-pressed', 'false')
  fireEvent.keyDown(more, { key: 'Home' })
  await m.settle()
  expect(plain).toHaveFocus()
  b.focus()
  fireEvent.keyDown(b, { key: ' ' })
  fireEvent.keyUp(b, { key: ' ' })
  await m.settle()
  expect(b).toHaveAttribute('aria-checked', 'true')
  expect(a).toHaveAttribute('aria-checked', 'false')
  fireEvent.click(bold)
  await m.settle()
  expect(bold).toHaveAttribute('aria-pressed', 'true')
  more.focus()
  await m.settle()
  fireEvent.keyDown(more, { key: 'ArrowDown' })
  await m.settle()
  expect(more).toHaveAttribute('aria-haspopup', 'menu')
  expect(more).toHaveAttribute('aria-expanded', 'true')
  expect(controls.getByRole('menuitem', { name: 'One' })).toBeVisible()
})

spec('toolbar.roles.7', async () => {
  const m = mount('toolbar', {
    'aria-label': 'Metadata',
    children: () => <Toolbar.Button>Run</Toolbar.Button>,
  })
  const toolbar = m.container.firstElementChild as HTMLElement
  expect(toolbar).toHaveAttribute('role', 'toolbar')
  const aria = axe.commons.aria as typeof axe.commons.aria & {
    allowedAttr(role: string): string[]
    requiredAttr(role: string): string[]
    requiredContext(role: string): string[] | null
    requiredOwned(role: string): string[] | null
  }
  const allowed = aria.allowedAttr('toolbar') as string[]
  expect(allowed).toEqual(
    expect.arrayContaining(['aria-orientation', 'aria-activedescendant', 'aria-expanded'])
  )
  expect(axe.commons.aria.getRoleType('toolbar')).toBe('structure')
  expect(aria.requiredAttr('toolbar')).toEqual([])
  expect(aria.requiredContext('toolbar')).toBeNull()
  expect(aria.requiredOwned('toolbar')).toBeNull()
})
