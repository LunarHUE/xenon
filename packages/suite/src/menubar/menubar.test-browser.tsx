import { Menubar } from '@tenon/solid/menubar'
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
test('real keyboard roves top triggers, enters either edge, switches open menus, and exits with Tab', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <>
        <button>Before</button>
        <Menubar aria-label="Editor">
          <Menubar.Menu value="file">
            <Menubar.Trigger>File</Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Positioner>
                <Menubar.Content>
                  <Menubar.Item>New</Menubar.Item>
                  <Menubar.Item>Save</Menubar.Item>
                </Menubar.Content>
              </Menubar.Positioner>
            </Menubar.Portal>
          </Menubar.Menu>
          <Menubar.Menu value="disabled">
            <Menubar.Trigger disabled>Disabled</Menubar.Trigger>
          </Menubar.Menu>
          <Menubar.Menu value="edit">
            <Menubar.Trigger>Edit</Menubar.Trigger>
            <Menubar.Portal>
              <Menubar.Positioner>
                <Menubar.Content>
                  <Menubar.Item>Copy</Menubar.Item>
                  <Menubar.Item>Paste</Menubar.Item>
                </Menubar.Content>
              </Menubar.Positioner>
            </Menubar.Portal>
          </Menubar.Menu>
        </Menubar>
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
  const query = within(document.body)
  query.getByRole('button', { name: 'Before' }).focus()
  await userEvent.keyboard('{Tab}')
  expect(query.getByRole('menuitem', { name: 'File' })).toHaveFocus()
  await userEvent.keyboard('{ArrowRight}')
  expect(query.getByRole('menuitem', { name: 'Edit' })).toHaveFocus()
  expect(query.queryByRole('menu')).toBeNull()
  await userEvent.keyboard('{ArrowUp}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'Paste' })).toHaveFocus()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'New' })).toHaveFocus()
  expect(query.queryByRole('menuitem', { name: 'Paste' })).toBeNull()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'File' })).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'New' })).toHaveFocus()
  await userEvent.keyboard('{Tab}')
  await settle()
  expect(query.getByRole('button', { name: 'After' })).toHaveFocus()
  expect(query.queryByRole('menu')).toBeNull()
})

test('nested menubar Escape closes one level and RTL switches the top menu in reverse', async () => {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(
    () => (
      <Menubar dir="rtl" aria-label="Editor">
        <Menubar.Menu value="file">
          <Menubar.Trigger>File</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Sub>
                <Menubar.SubTrigger>More</Menubar.SubTrigger>
                <Menubar.Portal>
                  <Menubar.Positioner>
                    <Menubar.Content>
                      <Menubar.Item>Nested</Menubar.Item>
                    </Menubar.Content>
                  </Menubar.Positioner>
                </Menubar.Portal>
              </Menubar.Sub>
              <Menubar.Item>Save</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
        <Menubar.Menu value="edit">
          <Menubar.Trigger>Edit</Menubar.Trigger>
          <Menubar.Positioner>
            <Menubar.Content>
              <Menubar.Item>Copy</Menubar.Item>
            </Menubar.Content>
          </Menubar.Positioner>
        </Menubar.Menu>
      </Menubar>
    ),
    host
  )
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  const query = within(document.body)
  query.getByRole('menuitem', { name: 'File' }).focus()
  await userEvent.keyboard('{ArrowDown}')
  await settle()
  await userEvent.keyboard('{ArrowLeft}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'Nested' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'More' })).toHaveFocus()
  expect(query.queryByRole('menuitem', { name: 'Nested' })).toBeNull()
  await userEvent.keyboard('{ArrowDown}{ArrowLeft}')
  await settle()
  expect(query.getByRole('menuitem', { name: 'Copy' })).toHaveFocus()
  expect(query.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('aria-expanded', 'true')
})
