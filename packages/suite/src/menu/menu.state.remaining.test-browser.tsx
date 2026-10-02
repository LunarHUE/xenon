import { Menu } from '@xenon-ui/solid/menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(container)
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('checkbox menu items can both be checked and toggling one leaves the other unchanged menu.state.1', async () => {
  const guides = vi.fn(),
    grid = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>View</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem onCheckedChange={guides}>Guides</Menu.CheckboxItem>
          <Menu.CheckboxItem onCheckedChange={grid}>Grid</Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button', { name: 'View' }))
  await settle()
  const first = m.getByRole('menuitemcheckbox', { name: 'Guides' })
  const second = m.getByRole('menuitemcheckbox', { name: 'Grid' })
  await userEvent.click(first)
  await userEvent.click(second)
  expect(first).toHaveAttribute('aria-checked', 'true')
  expect(second).toHaveAttribute('aria-checked', 'true')
  await userEvent.click(first)
  expect(first).toHaveAttribute('aria-checked', 'false')
  expect(second).toHaveAttribute('aria-checked', 'true')
  expect(guides.mock.calls).toEqual([[true], [false]])
  expect(grid).toHaveBeenCalledExactlyOnceWith(true)
})

test.each([false, true])(
  'uncontrolled checkbox and radio values survive close and reopen with forceMount=%s menu.state.3',
  async (forceMount) => {
    const checked = vi.fn(),
      value = vi.fn()
    const m = mount(() => (
      <Menu forceMount={forceMount}>
        <Menu.Trigger>View</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.CheckboxItem onCheckedChange={checked}>Guides</Menu.CheckboxItem>
            <Menu.RadioGroup defaultValue="compact" onValueChange={value}>
              <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
              <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    const trigger = m.getByRole('button', { name: 'View' })
    await userEvent.click(trigger)
    await settle()
    await userEvent.click(m.getByRole('menuitemcheckbox', { name: 'Guides' }))
    await userEvent.click(m.getByRole('menuitemradio', { name: 'Comfortable' }))
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(m.queryByRole('menu')).toBeNull()
    await userEvent.click(trigger)
    await settle()
    expect(m.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(m.getByRole('menuitemradio', { name: 'Compact' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
    expect(m.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(checked).toHaveBeenCalledExactlyOnceWith(true)
    expect(value).toHaveBeenCalledExactlyOnceWith('comfortable')
  }
)

test('external controlled checkbox reset is reflected on reopening and removes its indicator menu.state.8', async () => {
  const [checked, setChecked] = createSignal(true)
  const changes = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>View</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem checked={checked()} onCheckedChange={changes}>
            Guides<Menu.ItemIndicator data-testid="indicator">Selected</Menu.ItemIndicator>
          </Menu.CheckboxItem>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'View' })
  await userEvent.click(trigger)
  await settle()
  expect(m.getByTestId('indicator')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await settle()
  setChecked(false)
  flush()
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  expect(m.queryByTestId('indicator')).toBeNull()
  expect(changes).not.toHaveBeenCalled()
})

test('default-open mounting is silent and the first trigger click closes exactly once menu.state.16', async () => {
  const changes = vi.fn()
  const m = mount(() => (
    <Menu defaultOpen onOpenChange={changes}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item>Save</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await settle()
  expect(m.getByRole('menu')).toBeVisible()
  expect(changes).not.toHaveBeenCalled()
  await userEvent.click(m.getByRole('button', { name: 'Actions' }))
  await settle()
  expect(m.queryByRole('menu')).toBeNull()
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
})

test('rejected controlled closure preserves the open popup and state hooks menu.state.18', async () => {
  const changes = vi.fn()
  const m = mount(() => (
    <Menu open onOpenChange={changes}>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item>Save</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await settle()
  const trigger = m.getByRole('button', { name: 'Actions' })
  const menu = m.getByRole('menu')
  await userEvent.click(trigger)
  await settle()
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(m.getByRole('menu')).toBe(menu)
  expect(menu).toBeVisible()
  expect(menu).toHaveAttribute('data-state', 'open')
  expect(trigger).toHaveAttribute('data-state', 'open')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
})

test('empty menus open safely from each supported key with surface focus and no active item menu.keyboard.4', async () => {
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Empty actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content aria-label="Empty actions" />
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'Empty actions' })
  for (const key of ['{ArrowDown}', '{ArrowUp}', '{Enter}', ' ']) {
    trigger.focus()
    await userEvent.keyboard(key)
    await settle()
    expect(m.getByRole('menu')).toHaveFocus()
    expect(m.queryAllByRole('menuitem')).toHaveLength(0)
    expect(m.getByRole('menu').querySelector('[data-highlighted]')).toBeNull()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(m.queryByRole('menu')).toBeNull()
    expect(trigger).toHaveFocus()
  }
})

test('closed menus ignore trigger right clicks and outside primary clicks without callbacks menu.pointer.2 menu.pointer.13', async () => {
  const changes = vi.fn(),
    outside = vi.fn()
  const m = mount(() => (
    <>
      <Menu onOpenChange={changes}>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Save</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <button onClick={outside}>Outside</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Actions' })
  await userEvent.click(trigger, { button: 'right' })
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('menu')).toBeNull()
  await userEvent.click(m.getByRole('button', { name: 'Outside' }))
  await settle()
  expect(m.getByRole('button', { name: 'Outside' })).toHaveFocus()
  expect(outside).toHaveBeenCalledTimes(1)
  expect(changes).not.toHaveBeenCalled()
  expect(m.queryByRole('menu')).toBeNull()
})
