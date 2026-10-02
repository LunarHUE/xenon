import { ContextMenu } from '@xenon-ui/solid/context-menu'
import { Dialog } from '@xenon-ui/solid/dialog'
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
  return within(document.body)
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
const regionStyle = { width: '300px', height: '180px' }

function MenuParts() {
  return (
    <>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Positioner>
        <ContextMenu.Content
          aria-label="Canvas actions"
          style={{ background: 'white', padding: '8px' }}
        >
          <ContextMenu.Item>Save</ContextMenu.Item>
          <ContextMenu.CheckboxItem defaultChecked="mixed">Guides</ContextMenu.CheckboxItem>
          <ContextMenu.RadioGroup defaultValue="small">
            <ContextMenu.GroupLabel>Size</ContextMenu.GroupLabel>
            <ContextMenu.RadioItem value="small">Small</ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="large">Large</ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </>
  )
}

test('native right-click menus pass axe with named action, checkbox and radio items context-menu.a11y.1', async () => {
  const m = mount(() => (
    <ContextMenu>
      <MenuParts />
    </ContextMenu>
  ))
  await userEvent.click(m.getByText('Canvas'), { button: 'right', position: { x: 40, y: 40 } })
  await settle()
  const menu = m.getByRole('menu', { name: 'Canvas actions' })
  expect(menu).toHaveFocus()
  expect(m.getByRole('menuitemcheckbox', { name: 'Guides' })).toHaveAttribute(
    'aria-checked',
    'mixed'
  )
  expect(m.getByRole('menuitemradio', { name: 'Small' })).toHaveAttribute('aria-checked', 'true')
  await expectNoViolations(document.body)
})

test('disabled context submenu triggers stay closed under their opening arrow context-menu.keyboard.7', async () => {
  const changes = vi.fn()
  const m = mount(() => (
    <ContextMenu>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Positioner>
        <ContextMenu.Content aria-label="Canvas actions">
          <ContextMenu.Sub onOpenChange={changes}>
            <ContextMenu.SubTrigger disabled>Export</ContextMenu.SubTrigger>
            <ContextMenu.Positioner>
              <ContextMenu.Content aria-label="Export formats">
                <ContextMenu.Item>PDF</ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Positioner>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </ContextMenu>
  ))
  await userEvent.click(m.getByText('Canvas'), { button: 'right' })
  await settle()
  await userEvent.keyboard('{ArrowDown}')
  const exportTrigger = m.getByRole('menuitem', { name: 'Export' })
  expect(exportTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-disabled', 'true')
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(exportTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(changes).not.toHaveBeenCalled()
})

test('context submenu typeahead ignores parent-only prefixes and matches local items context-menu.keyboard.8', async () => {
  const m = mount(() => (
    <ContextMenu>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Positioner>
        <ContextMenu.Content aria-label="Canvas actions">
          <ContextMenu.Item>Zulu parent</ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger>Export</ContextMenu.SubTrigger>
            <ContextMenu.Positioner>
              <ContextMenu.Content aria-label="Export formats">
                <ContextMenu.Item>Alpha child</ContextMenu.Item>
                <ContextMenu.Item>Beta child</ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Positioner>
          </ContextMenu.Sub>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </ContextMenu>
  ))
  await userEvent.click(m.getByText('Canvas'), { button: 'right' })
  await settle()
  await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowRight}')
  await settle()
  await userEvent.keyboard('{ArrowDown}z')
  expect(m.getByRole('menuitem', { name: 'Beta child' })).toHaveFocus()
  expect(m.getByRole('menuitem', { name: 'Zulu parent' })).not.toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.getByRole('menuitem', { name: 'Export' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  await userEvent.keyboard('{ArrowDown}a')
  expect(m.getByRole('menuitem', { name: 'Alpha child' })).toHaveFocus()
  expect(m.getByRole('menu', { name: 'Canvas actions' })).toBeVisible()
})

test('same-coordinate synthetic retriggers remeasure the native positioned menu without another open callback context-menu.pointer.9', async () => {
  const positioned = vi.fn()
  const changes = vi.fn()
  const m = mount(() => (
    <ContextMenu onOpenChange={changes}>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Positioner flip={false} shift={false} onPositioned={positioned}>
        <ContextMenu.Content aria-label="Canvas actions">
          <ContextMenu.Item>Save</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </ContextMenu>
  ))
  const region = m.getByText('Canvas')
  const bounds = region.getBoundingClientRect()
  const x = bounds.left + 40,
    y = bounds.top + 40
  await userEvent.click(region, { button: 'right', position: { x: 40, y: 40 } })
  await settle()
  const menu = m.getByRole('menu', { name: 'Canvas actions' })
  const count = positioned.mock.calls.length
  expect(count).toBeGreaterThan(0)
  region.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })
  )
  await settle()
  expect(positioned.mock.calls.length).toBeGreaterThan(count)
  expect(m.getByRole('menu', { name: 'Canvas actions' })).toBe(menu)
  const box = menu.parentElement!.getBoundingClientRect()
  expect(Math.abs(box.left - x)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.top - y)).toBeLessThanOrEqual(1)
  expect(changes).toHaveBeenCalledExactlyOnceWith(true)
})

test('pressing elsewhere inside a native dialog dismisses only its context menu context-menu.dismissal.8', async () => {
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Trigger>Workspace</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Workspace details</Dialog.Title>
        <button>Inside dialog outside menu</button>
        <ContextMenu>
          <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner>
              <ContextMenu.Content aria-label="Canvas actions">
                <ContextMenu.Item>Save</ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu>
      </Dialog.Content>
    </Dialog>
  ))
  await expect.poll(() => m.queryByRole('dialog', { name: 'Workspace details' })).not.toBeNull()
  const dialog = m.getByRole('dialog', { name: 'Workspace details' })
  await userEvent.click(m.getByText('Canvas'), { button: 'right', position: { x: 40, y: 40 } })
  await settle()
  expect(m.getByRole('menu')).toBeVisible()
  await userEvent.click(m.getByRole('button', { name: 'Inside dialog outside menu' }))
  await expect.poll(() => m.queryByRole('menu')).toBeNull()
  expect(m.getByRole('dialog', { name: 'Workspace details' })).toBe(dialog)
  expect(dialog).toBeVisible()
  expect(dialog.matches(':modal')).toBe(true)
  expect(m.getByRole('button', { name: 'Inside dialog outside menu' })).toHaveFocus()
})
