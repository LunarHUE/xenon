import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { Menubar } from './index'
afterEach(cleanup)
function press(element: HTMLElement, key: string) {
  element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  flush()
}
test('menubar has one enabled tab stop, wraps and skips disabled triggers without opening on focus', () => {
  const view = render(() => (
    <Menubar aria-label="Editor">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
      </Menubar.Menu>
      <Menubar.Menu value="blocked">
        <Menubar.Trigger disabled>Blocked</Menubar.Trigger>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
      </Menubar.Menu>
    </Menubar>
  ))
  const file = view.getByRole('menuitem', { name: 'File' }),
    edit = view.getByRole('menuitem', { name: 'Edit' })
  expect(view.getByRole('menubar')).toHaveAccessibleName('Editor')
  expect(file).toHaveAttribute('tabindex', '0')
  file.focus()
  flush()
  expect(file).toHaveAttribute('aria-expanded', 'false')
  press(file, 'ArrowLeft')
  expect(edit).toHaveFocus()
  expect(file).toHaveAttribute('tabindex', '-1')
  expect(edit).toHaveAttribute('tabindex', '0')
  press(edit, 'ArrowRight')
  expect(file).toHaveFocus()
})
test('click toggles one top-level menu and hover is inert on a closed bar', () => {
  const view = render(() => (
    <Menubar>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Positioner>
          <Menubar.Content>
            <Menubar.Item>New</Menubar.Item>
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
  ))
  const file = view.getByRole('menuitem', { name: 'File' }),
    edit = view.getByRole('menuitem', { name: 'Edit' })
  file.dispatchEvent(new Event('pointerenter'))
  flush()
  expect(view.queryByRole('menu')).toBeNull()
  file.click()
  flush()
  expect(file).toHaveAttribute('aria-expanded', 'true')
  edit.click()
  flush()
  expect(file).toHaveAttribute('aria-expanded', 'false')
  expect(edit).toHaveAttribute('aria-expanded', 'true')
  edit.click()
  flush()
  expect(view.queryByRole('menu')).toBeNull()
})
