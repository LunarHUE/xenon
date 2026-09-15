import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
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

test('controlled null stays closed while empty-string identity requests and closes distinctly', () => {
  const change = vi.fn()
  const view = render(() => (
    <Menubar value={null} defaultValue="" onValueChange={change}>
      <Menubar.Menu value="">
        <Menubar.Trigger>Empty identity</Menubar.Trigger>
      </Menubar.Menu>
    </Menubar>
  ))
  const trigger = view.getByRole('menuitem')
  expect(change).not.toHaveBeenCalled()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  trigger.click()
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith('')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})
test('bound empty-string selection opens, switches by arrow, and closes with null exactly once', () => {
  const change = vi.fn()
  const view = render(() => {
    const [value, setValue] = createSignal<string | null>(null)
    return (
      <Menubar
        value={value()}
        onValueChange={(next) => {
          change(next)
          setValue(next)
        }}
      >
        <Menubar.Menu value="">
          <Menubar.Trigger>Empty identity</Menubar.Trigger>
        </Menubar.Menu>
        <Menubar.Menu value="next">
          <Menubar.Trigger>Next</Menubar.Trigger>
        </Menubar.Menu>
      </Menubar>
    )
  })
  const empty = view.getByRole('menuitem', { name: 'Empty identity' })
  const next = view.getByRole('menuitem', { name: 'Next' })
  empty.click()
  flush()
  expect(empty).toHaveAttribute('aria-expanded', 'true')
  expect(change).toHaveBeenLastCalledWith('')
  change.mockClear()
  empty.click()
  flush()
  expect(empty).toHaveAttribute('aria-expanded', 'false')
  expect(change).toHaveBeenCalledExactlyOnceWith(null)
  empty.click()
  flush()
  press(empty, 'ArrowRight')
  expect(next).toHaveAttribute('aria-expanded', 'true')
  expect(empty).toHaveAttribute('aria-expanded', 'false')
  expect(change).toHaveBeenLastCalledWith('next')
})
test('uncontrolled default empty-string identity opens without an initial callback', () => {
  const change = vi.fn()
  const view = render(() => (
    <Menubar defaultValue="" onValueChange={change}>
      <Menubar.Menu value="">
        <Menubar.Trigger>Empty identity</Menubar.Trigger>
      </Menubar.Menu>
    </Menubar>
  ))
  expect(view.getByRole('menuitem')).toHaveAttribute('aria-expanded', 'true')
  expect(change).not.toHaveBeenCalled()
})
