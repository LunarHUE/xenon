import { cleanup, render } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Menu } from './index'

afterEach(cleanup)

test('detached menu triggers share one open popup and replace its payload', () => {
  const handle = Menu.createHandle<{ text: string }>()
  const change = vi.fn()
  const view = render(() => (
    <>
      <Menu.Trigger handle={handle} id="first" payload={{ text: 'First action' }}>
        First
      </Menu.Trigger>
      <Menu.Trigger handle={handle} id="second" payload={{ text: 'Second action' }}>
        Second
      </Menu.Trigger>
      <Menu handle={handle} onOpenChange={change}>
        {(state) => (
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Viewport>
                <Menu.Item>{state.payload?.text}</Menu.Item>
              </Menu.Viewport>
            </Menu.Content>
          </Menu.Positioner>
        )}
      </Menu>
    </>
  ))
  flush()
  const first = view.getByRole('button', { name: 'First' })
  const second = view.getByRole('button', { name: 'Second' })
  first.click()
  flush()
  const popup = view.container.querySelector('[role="menu"]')!
  expect(handle.isOpen).toBe(true)
  expect(popup.textContent).toContain('First action')
  expect(first).toHaveAttribute('aria-expanded', 'true')
  second.click()
  flush()
  expect(view.container.querySelector('[role="menu"]')).toBe(popup)
  expect(popup.querySelector('[data-current]')!.textContent).toBe('Second action')
  expect(first).toHaveAttribute('aria-expanded', 'false')
  expect(second).toHaveAttribute('aria-expanded', 'true')
  expect(change).toHaveBeenCalledExactlyOnceWith(true)
  second.click()
  flush()
  expect(handle.isOpen).toBe(false)
})

test('handle requests respect controlled state and select registered trigger IDs', () => {
  const handle = Menu.createHandle<string>()
  const change = vi.fn()
  const view = render(() => (
    <>
      <Menu.Trigger handle={handle} id="menu-source" payload="Source">
        Source
      </Menu.Trigger>
      <Menu handle={handle} open={false} onOpenChange={change}>
        {(state) => <span data-testid="payload">{state.payload}</span>}
      </Menu>
    </>
  ))
  flush()
  handle.open('missing')
  flush()
  expect(change).not.toHaveBeenCalled()
  handle.open('menu-source')
  flush()
  expect(change).toHaveBeenCalledExactlyOnceWith(true)
  expect(handle.isOpen).toBe(false)
  handle.openWithPayload('Imperative')
  flush()
  expect(view.getByTestId('payload')).toHaveTextContent('Imperative')
  expect(handle.isOpen).toBe(false)
})

test('detached triggers survive root replacement without replaying commands', () => {
  const handle = Menu.createHandle()
  const [mounted, setMounted] = createSignal(false)
  const view = render(() => (
    <>
      <Menu.Trigger handle={handle}>Open</Menu.Trigger>
      <Show when={mounted()}>
        <Menu handle={handle}>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item>Action</Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu>
      </Show>
    </>
  ))
  const button = view.getByRole('button')
  button.click()
  handle.open()
  flush()
  expect(handle.isOpen).toBe(false)
  setMounted(true)
  flush()
  expect(handle.isOpen).toBe(false)
  button.click()
  flush()
  expect(handle.isOpen).toBe(true)
  setMounted(false)
  flush()
  expect(handle.isOpen).toBe(false)
  handle.open()
  setMounted(true)
  flush()
  expect(handle.isOpen).toBe(false)
  button.click()
  flush()
  expect(handle.isOpen).toBe(true)
})

test('disabled and author-canceled triggers do not open through pointer or keyboard', () => {
  const handle = Menu.createHandle()
  const view = render(() => (
    <>
      <Menu.Trigger handle={handle} id="disabled" disabled>
        Disabled
      </Menu.Trigger>
      <Menu.Trigger handle={handle} onClick={(event) => event.preventDefault()}>
        Canceled
      </Menu.Trigger>
      <Menu handle={handle} />
    </>
  ))
  flush()
  handle.open('disabled')
  view
    .getByRole('button', { name: 'Disabled' })
    .dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    )
  view.getByRole('button', { name: 'Canceled' }).click()
  flush()
  expect(handle.isOpen).toBe(false)
})
