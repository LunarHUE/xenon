/**
 * Browser-native context-menu interactions: keyboard opening geometry, repeated
 * right-click re-anchoring, descendant targets inside custom or disabled regions,
 * and nested-submenu dismissal. Popups are portaled to the document body, so role
 * queries run against the body while the fixtures stay in disposable containers.
 */
import { ContextMenu } from '@xenon-ui/solid/context-menu'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/** Layout so region centers and pointer offsets are deterministic in the top layer. */
const regionStyle: JSX.CSSProperties = {
  position: 'fixed',
  left: '80px',
  top: '70px',
  width: '360px',
  height: '220px',
}
/** Visual surface so pointer hit testing lands on the menu rather than the wrapper. */
const surface: JSX.CSSProperties = { background: 'white', padding: '8px', 'min-width': '150px' }

/** Mounts a disposable fixture and returns body-scoped queries for portaled popups. */
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
  return within(document.body)
}

/** Flushes Solid and one waiting turn so presence, positioning, and focus settle. */
async function settle() {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 60))
  flush()
}

/** Asserts the positioned popup wrapper's top-left corner lands on a client point. */
function expectAnchored(menu: HTMLElement, x: number, y: number) {
  const box = menu.parentElement!.getBoundingClientRect()
  expect(Math.abs(box.left - x)).toBeLessThan(2)
  expect(Math.abs(box.top - y)).toBeLessThan(2)
}

/** Records native contextmenu events so suppression is observable after dispatch. */
function recordContextMenus() {
  const events: { target: EventTarget | null; prevented: boolean }[] = []
  const record = (event: Event) =>
    events.push({ target: event.target, prevented: event.defaultPrevented })
  document.addEventListener('contextmenu', record)
  onTestFinished(() => document.removeEventListener('contextmenu', record))
  return events
}

test('keyboard context gestures open at the region center and restore the region on Escape', async () => {
  const query = mount(() => (
    <ContextMenu>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner flip={false} shift={false}>
          <ContextMenu.Content aria-label="Canvas actions" style={surface}>
            <ContextMenu.Item>Duplicate</ContextMenu.Item>
            <ContextMenu.Item>Delete</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu>
  ))
  const keys: { key: string; prevented: boolean }[] = []
  const record = (event: KeyboardEvent) =>
    keys.push({ key: event.key, prevented: event.defaultPrevented })
  document.addEventListener('keydown', record)
  onTestFinished(() => document.removeEventListener('keydown', record))

  const region = query.getByText('Canvas')
  const box = region.getBoundingClientRect()
  region.focus()

  // The dedicated context-menu key is claimed by the region rather than the browser.
  await userEvent.keyboard('{ContextMenu}')
  await settle()
  expect(keys.some((event) => event.key === 'ContextMenu' && event.prevented)).toBe(true)
  expect(region).toHaveAttribute('data-state', 'open')
  expect(query.getByRole('menu', { name: 'Canvas actions' })).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  expect(query.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus()

  await userEvent.keyboard('{Escape}')
  await settle()
  expect(query.queryByRole('menu')).toBeNull()
  expect(region).toHaveFocus()

  // Keyboard placement anchors to the region center, not to the last pointer point.
  await userEvent.keyboard('{Shift>}{F10}{/Shift}')
  await settle()
  const menu = query.getByRole('menu', { name: 'Canvas actions' })
  expect(menu).toHaveFocus()
  expectAnchored(menu, box.left + box.width / 2, box.top + box.height / 2)
})

test('context-menu.pointer.8: a second right click keeps the menu open and re-anchors it to the new point', async () => {
  const changes = vi.fn()
  const query = mount(() => (
    <ContextMenu onOpenChange={changes}>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner flip={false} shift={false}>
          <ContextMenu.Content aria-label="Canvas actions" style={surface}>
            <ContextMenu.Item>Duplicate</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu>
  ))
  const region = query.getByText('Canvas')
  const box = region.getBoundingClientRect()

  await userEvent.click(region, { button: 'right', position: { x: 30, y: 25 } })
  await settle()
  const menu = query.getByRole('menu', { name: 'Canvas actions' })
  expectAnchored(menu, box.left + 30, box.top + 25)

  await userEvent.click(region, { button: 'right', position: { x: 320, y: 190 } })
  await settle()
  // The same surface stays mounted and focused, and its geometry follows the new pointer.
  expect(query.getByRole('menu', { name: 'Canvas actions' })).toBe(menu)
  expect(menu).toHaveFocus()
  expect(region).toHaveAttribute('data-state', 'open')
  expectAnchored(menu, box.left + 320, box.top + 190)
  expect(changes).toHaveBeenCalledTimes(1)
})

test('right-click on a descendant of a custom region host opens at the descendant point', async () => {
  const handler = vi.fn()
  const query = mount(() => (
    <ContextMenu>
      <ContextMenu.Trigger
        as="section"
        aria-label="Workspace"
        onContextMenu={handler}
        style={regionStyle}
      >
        <span style={{ display: 'inline-block', width: '140px', height: '48px' }}>Inner label</span>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner flip={false} shift={false}>
          <ContextMenu.Content aria-label="Workspace actions" style={surface}>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu>
  ))
  const events = recordContextMenus()
  const host = query.getByRole('region', { name: 'Workspace' })
  const inner = query.getByText('Inner label')
  const box = inner.getBoundingClientRect()

  await userEvent.click(inner, { button: 'right', position: { x: 40, y: 20 } })
  await settle()

  // The descendant produced the gesture, the author handler composed once, and the native menu was suppressed.
  expect(handler).toHaveBeenCalledTimes(1)
  expect(events).toHaveLength(1)
  expect(events[0]!.target).toBe(inner)
  expect(events[0]!.prevented).toBe(true)
  // Only the region carries the open hook; the descendant target stays untouched.
  expect(host).toHaveAttribute('data-state', 'open')
  expect(inner).not.toHaveAttribute('data-state')
  const menu = query.getByRole('menu', { name: 'Workspace actions' })
  expect(menu).toHaveFocus()
  expectAnchored(menu, box.left + 40, box.top + 20)
})

test('a disabled region leaves a descendant right click to the native menu', async () => {
  const handler = vi.fn()
  const changes = vi.fn()
  const query = mount(() => (
    <ContextMenu onOpenChange={changes}>
      <ContextMenu.Trigger
        as="section"
        aria-label="Blocked"
        disabled
        onContextMenu={handler}
        style={regionStyle}
      >
        <span style={{ display: 'inline-block', width: '140px', height: '48px' }}>
          Blocked label
        </span>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner>
          <ContextMenu.Content aria-label="Blocked actions" style={surface}>
            <ContextMenu.Item>Rename</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu>
  ))
  const events = recordContextMenus()
  const host = query.getByRole('region', { name: 'Blocked' })
  const inner = query.getByText('Blocked label')

  await userEvent.click(inner, { button: 'right', position: { x: 40, y: 20 } })
  await settle()

  // The author handler still runs, but the region neither claims the gesture nor blocks the browser.
  expect(handler).toHaveBeenCalledTimes(1)
  expect(events).toHaveLength(1)
  expect(events[0]!.target).toBe(inner)
  expect(events[0]!.prevented).toBe(false)
  expect(query.queryByRole('menu')).toBeNull()
  expect(changes).not.toHaveBeenCalled()
  expect(host).toHaveAttribute('data-disabled')
  expect(host).toHaveAttribute('data-state', 'closed')
})

test('context-menu.keyboard.6: ArrowLeft from the deepest nested submenu closes only that level', async () => {
  const query = mount(() => (
    <ContextMenu>
      <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Positioner flip={false} shift={false}>
          <ContextMenu.Content aria-label="Canvas actions" style={surface}>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>Export</ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner>
                  <ContextMenu.Content aria-label="Export formats" style={surface}>
                    <ContextMenu.Item>PNG</ContextMenu.Item>
                    <ContextMenu.Sub>
                      <ContextMenu.SubTrigger>Compression</ContextMenu.SubTrigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Positioner>
                          <ContextMenu.Content aria-label="Compression levels" style={surface}>
                            <ContextMenu.Item>Maximum</ContextMenu.Item>
                          </ContextMenu.Content>
                        </ContextMenu.Positioner>
                      </ContextMenu.Portal>
                    </ContextMenu.Sub>
                  </ContextMenu.Content>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
            <ContextMenu.Item>Duplicate</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu>
  ))
  const region = query.getByText('Canvas')
  await userEvent.click(region, { button: 'right', position: { x: 40, y: 30 } })
  await settle()

  const exportTrigger = query.getByRole('menuitem', { name: 'Export' })
  await userEvent.keyboard('{ArrowDown}')
  expect(exportTrigger).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'PNG' })).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  const compression = query.getByRole('menuitem', { name: 'Compression' })
  expect(compression).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'Maximum' })).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'true')
  expect(compression).toHaveAttribute('aria-expanded', 'true')

  // The back key unwinds one level at a time, leaving the trigger and root items in place.
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(query.queryByRole('menu', { name: 'Compression levels' })).toBeNull()
  expect(query.getByRole('menu', { name: 'Export formats' })).toBeVisible()
  expect(query.getByRole('menu', { name: 'Canvas actions' })).toBeVisible()
  expect(compression).toHaveFocus()
  expect(compression).toHaveAttribute('aria-expanded', 'false')
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'true')

  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(query.queryByRole('menu', { name: 'Export formats' })).toBeNull()
  expect(query.getByRole('menu', { name: 'Canvas actions' })).toBeVisible()
  expect(exportTrigger).toHaveFocus()
  expect(exportTrigger).toHaveAttribute('aria-expanded', 'false')
})

test('right-clicking the open surface keeps the submenu layer and leaves outside menus to the browser', async () => {
  const query = mount(() => (
    <>
      <ContextMenu>
        <ContextMenu.Trigger style={regionStyle}>Canvas</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner flip={false} shift={false}>
            <ContextMenu.Content aria-label="Canvas actions" style={surface}>
              <ContextMenu.Item>Duplicate</ContextMenu.Item>
              <ContextMenu.Sub>
                <ContextMenu.SubTrigger>Align</ContextMenu.SubTrigger>
                <ContextMenu.Portal>
                  <ContextMenu.Positioner>
                    <ContextMenu.Content aria-label="Align options" style={surface}>
                      <ContextMenu.Item>Left</ContextMenu.Item>
                    </ContextMenu.Content>
                  </ContextMenu.Positioner>
                </ContextMenu.Portal>
              </ContextMenu.Sub>
            </ContextMenu.Content>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu>
      <button style={{ position: 'fixed', right: '10px', top: '40px' }}>Outside</button>
    </>
  ))
  const region = query.getByText('Canvas')
  const outside = query.getByRole('button', { name: 'Outside' })
  await userEvent.click(region, { button: 'right', position: { x: 50, y: 40 } })
  await settle()
  const root = query.getByRole('menu', { name: 'Canvas actions' })
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('{ArrowDown}')
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'Left' })).toHaveFocus()
  expect(query.getByRole('menu', { name: 'Align options' })).toBeVisible()

  const events = recordContextMenus()
  // A right click on the surface belongs to the menu: no browser menu and no collapsed chain.
  await userEvent.click(root, { button: 'right', position: { x: 2, y: 2 } })
  await settle()
  expect(events).toHaveLength(1)
  expect(events[0]!.target).toBe(root)
  expect(events[0]!.prevented).toBe(true)
  expect(query.getByRole('menu', { name: 'Canvas actions' })).toBeVisible()
  expect(query.getByRole('menu', { name: 'Align options' })).toBeVisible()

  // Away from the menu the library must not suppress the browser's own context menu.
  await userEvent.click(outside, { button: 'right' })
  await settle()
  expect(events).toHaveLength(2)
  expect(events[1]!.target).toBe(outside)
  expect(events[1]!.prevented).toBe(false)
})
