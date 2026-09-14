import { Menu, Popover } from '@tenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 40))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})

test('Menu opens at either edge, navigates disabled items and typeahead, and selects with Enter', async () => {
  const selected = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Actions</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item>Archive</Menu.Item>
          <Menu.Item disabled>Blocked</Menu.Item>
          <Menu.Item onSelect={selected}>Copy</Menu.Item>
          <Menu.Item>Delete</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'Actions' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(m.getByRole('menu').parentElement!.matches(':popover-open')).toBe(true)
  await userEvent.keyboard('{ArrowDown}')
  expect(m.getByRole('menuitem', { name: 'Blocked' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  expect(m.getByRole('menu')).toBeVisible()
  expect(selected).not.toHaveBeenCalled()
  await userEvent.keyboard('{ArrowDown}')
  expect(m.getByRole('menuitem', { name: 'Copy' })).toHaveFocus()
  await userEvent.keyboard('{End}')
  expect(m.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
  await userEvent.keyboard('{Home}')
  expect(m.getByRole('menuitem', { name: 'Archive' })).toHaveFocus()
  await userEvent.keyboard('c')
  expect(m.getByRole('menuitem', { name: 'Copy' })).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(selected).toHaveBeenCalledTimes(1)
  expect(m.queryByRole('menu')).toBeNull()
  expect(trigger).toHaveFocus()
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()
})

test('Menu checkbox and radio selection update checked state while cancellation prevents commitment', async () => {
  const checkbox = vi.fn()
  const radio = vi.fn()
  const canceled = vi.fn((event: Event) => event.preventDefault())
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>View options</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.CheckboxItem defaultChecked="mixed" onCheckedChange={checkbox}>
            Show guides<Menu.ItemIndicator data-testid="check-indicator">✓</Menu.ItemIndicator>
          </Menu.CheckboxItem>
          <Menu.CheckboxItem onSelect={canceled} onCheckedChange={checkbox}>
            Canceled check
          </Menu.CheckboxItem>
          <Menu.RadioGroup defaultValue="compact" onValueChange={radio}>
            <Menu.GroupLabel>Density</Menu.GroupLabel>
            <Menu.RadioItem value="compact">Compact</Menu.RadioItem>
            <Menu.RadioItem value="comfortable">Comfortable</Menu.RadioItem>
          </Menu.RadioGroup>
          <Menu.Separator />
          <Menu.Group>
            <Menu.GroupLabel>Workspace</Menu.GroupLabel>
            <Menu.Item>Reset layout</Menu.Item>
          </Menu.Group>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button', { name: 'View options' }))
  await settle()
  const check = m.getByRole('menuitemcheckbox', { name: 'Show guides' })
  expect(check).toHaveAttribute('aria-checked', 'mixed')
  await userEvent.click(check)
  await settle()
  expect(check).toHaveAttribute('aria-checked', 'true')
  expect(checkbox).toHaveBeenCalledExactlyOnceWith(true)
  expect(m.getByTestId('check-indicator')).toBeVisible()
  await userEvent.click(m.getByRole('menuitemcheckbox', { name: 'Canceled check' }))
  await settle()
  expect(canceled).toHaveBeenCalledTimes(1)
  expect(checkbox).toHaveBeenCalledTimes(1)
  expect(m.getByRole('menuitemcheckbox', { name: 'Canceled check' })).toHaveAttribute(
    'aria-checked',
    'false'
  )
  await userEvent.click(m.getByRole('menuitemradio', { name: 'Comfortable' }))
  await settle()
  expect(radio).toHaveBeenCalledExactlyOnceWith('comfortable')
  expect(m.getByRole('menuitemradio', { name: 'Compact' })).toHaveAttribute('aria-checked', 'false')
  expect(m.getByRole('menuitemradio', { name: 'Comfortable' })).toHaveAttribute(
    'aria-checked',
    'true'
  )
  expect(m.getByRole('group', { name: 'Density' })).toBeVisible()
  expect(m.getByRole('group', { name: 'Workspace' })).toBeVisible()
  expect(m.getByRole('separator')).toBeVisible()
  await expectNoViolations(m.container)
})

test('canceling item selection keeps the menu open and Space activates once', async () => {
  const select = vi.fn((event: Event) => event.preventDefault())
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Commands</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item onSelect={select}>Keep editing</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(m.getByRole('button'))
  await settle()
  await userEvent.keyboard(' ')
  await settle()
  expect(select).toHaveBeenCalledTimes(1)
  expect(m.getByRole('menuitem')).toHaveFocus()
  expect(m.getByRole('menu')).toBeVisible()
})

test.each(['ltr', 'rtl'] as const)(
  'submenu directional keys follow %s and Escape closes one menu',
  async (dir) => {
    const m = mount(() => (
      <Menu dir={dir}>
        <Menu.Trigger>File</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Sub>
              <Menu.SubTrigger>Export</Menu.SubTrigger>
              <Menu.Positioner>
                <Menu.Content aria-label="Export formats">
                  <Menu.Item>PDF</Menu.Item>
                  <Menu.Item>CSV</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Sub>
            <Menu.Item>Print</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    ))
    const trigger = m.getByRole('button', { name: 'File' })
    trigger.focus()
    await userEvent.keyboard('{ArrowDown}')
    await settle()
    const submenuTrigger = m.getByRole('menuitem', { name: 'Export' })
    expect(submenuTrigger).toHaveFocus()
    const forward = dir === 'rtl' ? '{ArrowLeft}' : '{ArrowRight}'
    const back = dir === 'rtl' ? '{ArrowRight}' : '{ArrowLeft}'
    await userEvent.keyboard(forward)
    await settle()
    expect(m.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
    expect(submenuTrigger).toHaveAttribute('aria-expanded', 'true')
    await expectNoViolations(m.container)
    await userEvent.keyboard(back)
    await settle()
    expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
    expect(submenuTrigger).toHaveFocus()
    await userEvent.keyboard(forward)
    await settle()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
    expect(submenuTrigger).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    await settle()
    expect(m.queryByRole('menu')).toBeNull()
    expect(trigger).toHaveFocus()
  }
)

test.each([false, true])('Tab leaves the menu in document order with shift=%s', async (shift) => {
  const m = mount(() => (
    <>
      <button>Before menu</button>
      <Menu>
        <Menu.Trigger>Tab menu</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Action</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <button>After menu</button>
    </>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Tab menu' }))
  await settle()
  await userEvent.keyboard(shift ? '{Shift>}{Tab}{/Shift}' : '{Tab}')
  await settle()
  expect(m.queryByRole('menu')).toBeNull()
  expect(m.getByRole('button', { name: shift ? 'Before menu' : 'After menu' })).toHaveFocus()
})

test('Menu anchors to its trigger and outside dismissal preserves the target focus', async () => {
  const m = mount(() => (
    <>
      <Menu>
        <Menu.Trigger
          style={{ position: 'fixed', left: '180px', top: '150px', width: '100px', height: '30px' }}
        >
          Positioned menu
        </Menu.Trigger>
        <Menu.Positioner side="bottom" align="start" sideOffset={7} flip={false} shift={false}>
          <Menu.Content style={{ width: '130px' }}>
            <Menu.Item>Positioned item</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <button>Outside menu</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Positioned menu' })
  await userEvent.click(trigger)
  await settle()
  const rect = m.getByRole('menu').getBoundingClientRect()
  const anchor = trigger.getBoundingClientRect()
  expect(Math.abs(rect.left - anchor.left)).toBeLessThan(1)
  expect(Math.abs(rect.top - anchor.bottom - 7)).toBeLessThan(1)
  await userEvent.click(m.getByRole('button', { name: 'Outside menu' }))
  await settle()
  expect(m.queryByRole('menu')).toBeNull()
  expect(m.getByRole('button', { name: 'Outside menu' })).toHaveFocus()
})

test('Menu inside Popover handles Escape before its parent Popover', async () => {
  const m = mount(() => (
    <Popover>
      <Popover.Trigger>Open editor</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Editor">
          <Menu>
            <Menu.Trigger>Edit actions</Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item>Copy text</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Open editor' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Edit actions' }))
  await settle()
  expect(m.getByRole('menuitem')).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('menu')).toBeNull()
  expect(m.getByRole('dialog', { name: 'Editor' })).toBeVisible()
  expect(m.getByRole('button', { name: 'Edit actions' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(m.getByRole('button', { name: 'Open editor' })).toHaveFocus()
})

test('selecting a submenu item closes the menu chain and restores the root trigger', async () => {
  const selected = vi.fn()
  const m = mount(() => (
    <Menu>
      <Menu.Trigger>Export document</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Sub>
            <Menu.SubTrigger>Choose format</Menu.SubTrigger>
            <Menu.Positioner>
              <Menu.Content>
                <Menu.Item onSelect={selected}>PDF document</Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Sub>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  const trigger = m.getByRole('button', { name: 'Export document' })
  trigger.focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(selected).toHaveBeenCalledTimes(1)
  expect(m.queryByRole('menu')).toBeNull()
  expect(trigger).toHaveFocus()
})
