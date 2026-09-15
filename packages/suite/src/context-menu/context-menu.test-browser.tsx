import { ContextMenu } from '@xenon/solid/context-menu'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
async function settle() {
  flush()
  await new Promise((resolve) => setTimeout(resolve, 60))
  flush()
}
test('native right click anchors to client coordinates, focuses the surface, navigates, and restores the region', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <>
        <ContextMenu>
          <ContextMenu.Trigger style={{ width: '400px', height: '200px' }}>
            Files
          </ContextMenu.Trigger>
          <ContextMenu.Portal>
            <ContextMenu.Positioner flip={false} shift={false}>
              <ContextMenu.Content
                aria-label="File actions"
                style={{ background: 'white', padding: '8px' }}
              >
                <ContextMenu.Item>Copy</ContextMenu.Item>
                <ContextMenu.Item>Delete</ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Positioner>
          </ContextMenu.Portal>
        </ContextMenu>
        <button>After</button>
      </>
    ),
    host
  )
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  const query = within(document.body),
    region = query.getByText('Files')
  const box = region.getBoundingClientRect()
  await userEvent.click(region, { button: 'right', position: { x: 130, y: 75 } })
  await settle()
  const menu = query.getByRole('menu')
  expect(menu).toHaveFocus()
  const popup = menu.parentElement!.getBoundingClientRect()
  expect(Math.abs(popup.left - (box.left + 130))).toBeLessThan(2)
  expect(Math.abs(popup.top - (box.top + 75))).toBeLessThan(2)
  await userEvent.keyboard('{ArrowDown}')
  expect(query.getByRole('menuitem', { name: 'Copy' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(query.queryByRole('menu')).toBeNull()
  expect(region).toHaveFocus()
  await userEvent.keyboard('{Shift>}{F10}{/Shift}')
  await settle()
  expect(query.getByRole('menu')).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  await settle()
  expect(query.getByRole('button', { name: 'After' })).toHaveFocus()
  expect(query.queryByRole('menu')).toBeNull()
})

test('context menu reopening resets submenus without closing the root and nested Escape closes one level', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const changes: boolean[] = []
  const dispose = render(
    () => (
      <ContextMenu onOpenChange={(open) => changes.push(open)}>
        <ContextMenu.Trigger style={{ width: '400px', height: '200px' }}>
          Region
        </ContextMenu.Trigger>
        <ContextMenu.Positioner>
          <ContextMenu.Content aria-label="Root">
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>More</ContextMenu.SubTrigger>
              <ContextMenu.Portal>
                <ContextMenu.Positioner>
                  <ContextMenu.Content aria-label="Nested">
                    <ContextMenu.Item>Nested command</ContextMenu.Item>
                  </ContextMenu.Content>
                </ContextMenu.Positioner>
              </ContextMenu.Portal>
            </ContextMenu.Sub>
          </ContextMenu.Content>
        </ContextMenu.Positioner>
      </ContextMenu>
    ),
    host
  )
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  const query = within(document.body),
    region = query.getByText('Region')
  await userEvent.click(region, { button: 'right', position: { x: 40, y: 40 } })
  await settle()
  expect(query.getByRole('menuitem', { name: 'More' })).not.toHaveAttribute('data-highlighted')
  await userEvent.keyboard('{ArrowDown}{ArrowRight}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'Nested command' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'More' })).toHaveFocus()
  expect(query.queryByRole('menu', { name: 'Nested' })).toBeNull()
  await userEvent.keyboard('{ArrowRight}')
  await settle()
  await userEvent.click(region, { button: 'right', position: { x: 250, y: 120 } })
  await settle()
  expect(query.queryByRole('menu', { name: 'Nested' })).toBeNull()
  expect(query.getByRole('menu', { name: 'Root' })).toHaveFocus()
  expect(changes).toEqual([true])
})
