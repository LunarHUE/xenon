import { cleanup, render } from '@solidjs/testing-library'
import { For, flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Toast } from './index'

beforeEach(() => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.useRealTimers()
})
function Notifications() {
  const manager = Toast.useManager()
  return (
    <Toast.Viewport aria-label="Updates">
      <For each={manager.toasts()}>
        {(record) => (
          <Toast.Content toast={record} data-testid={record.id}>
            <Toast.Title />
            <Toast.Description />
            <Toast.Action />
            <Toast.Close>Close</Toast.Close>
          </Toast.Content>
        )}
      </For>
    </Toast.Viewport>
  )
}
async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

test('record updates preserve content DOM and title/description associations', async () => {
  const manager = Toast.createManager()
  const id = manager.add({ title: 'Saved', description: 'The notebook is safe.' })
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  await settle()
  const root = m.getByRole('group', { name: 'Saved' })
  expect(root).toHaveAttribute('aria-describedby')
  expect(root).toHaveAttribute('tabindex', '0')
  expect(m.getByRole('region', { name: 'Updates' })).toHaveAttribute('tabindex', '-1')
  expect(m.queryByRole('button', { name: '' })).toBeNull()
  manager.update(id, { title: 'Updated', description: undefined })
  await settle()
  expect(m.getByRole('group', { name: 'Updated' })).toBe(root)
  expect(root).not.toHaveAttribute('aria-describedby')
})

test('limited records are hidden and inert until promotion; close reports its reason once', async () => {
  const manager = Toast.createManager()
  const dismissed = vi.fn()
  const first = manager.add({ title: 'First' })
  manager.add({ title: 'Second', onDismiss: dismissed })
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0} limit={1}>
      <Notifications />
    </Toast.Provider>
  ))
  await settle()
  expect(m.getByTestId(first)).toHaveAttribute('hidden')
  expect(m.getByTestId(first)).toHaveAttribute('inert')
  m.getByRole('button', { name: 'Dismiss notification' }).click()
  await settle()
  expect(dismissed.mock.calls).toEqual([['close']])
  expect(m.getByRole('group', { name: 'First' })).not.toHaveAttribute('hidden')
})

test('batched announcements retain every admitted message, separate priority and clear dismissal text', async () => {
  vi.useFakeTimers()
  const manager = Toast.createManager()
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  const first = manager.add({ title: 'First low' })
  manager.add({ title: 'Second low' })
  manager.add({ title: 'High priority', priority: 'high' })
  await settle()
  vi.advanceTimersByTime(0)
  flush()
  expect(m.getByRole('status')).toHaveTextContent('First low')
  expect(m.getByRole('status')).toHaveTextContent('Second low')
  expect(m.getByRole('alert')).toHaveTextContent('High priority')
  manager.dismiss(first)
  await settle()
  expect(m.getByRole('status')).not.toHaveTextContent('First low')
  vi.advanceTimersByTime(1000)
  flush()
  expect(m.getByRole('status')).toBeEmptyDOMElement()
  expect(m.getByRole('alert')).toBeEmptyDOMElement()
})

test('Action can remain open and author cancellation runs before the record action', async () => {
  const manager = Toast.createManager()
  const action = vi.fn()
  manager.add({ title: 'Choice', action: { label: 'Run', onClick: action } })
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0}>
      <Toast.Viewport>
        <For each={manager.toasts()}>
          {(record) => (
            <Toast.Content toast={record}>
              <Toast.Title />
              <Toast.Action closeOnAction={false} />
              <Toast.Action onClick={(event) => event.preventDefault()}>Veto</Toast.Action>
            </Toast.Content>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Provider>
  ))
  await settle()
  m.getByRole('button', { name: 'Veto' }).click()
  await settle()
  expect(action).not.toHaveBeenCalled()
  m.getByRole('button', { name: 'Run' }).click()
  await settle()
  expect(action).toHaveBeenCalledOnce()
  expect(m.getByRole('group', { name: 'Choice' })).toBeVisible()
})

test('focused dismissal transfers to the newly promoted record before restoring outside focus', async () => {
  const manager = Toast.createManager()
  manager.add({ title: 'Waiting' })
  manager.add({ title: 'Newest' })
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0} limit={1}>
      <button>Outside</button>
      <Notifications />
    </Toast.Provider>
  ))
  await settle()
  const outside = m.getByRole('button', { name: 'Outside' })
  outside.focus()
  m.getByRole('group', { name: 'Newest' }).focus()
  m.getByRole('button', { name: 'Dismiss notification' }).click()
  await settle()
  expect(m.getByRole('group', { name: 'Waiting' })).toHaveFocus()
  m.getByRole('button', { name: 'Dismiss notification' }).click()
  await settle()
  expect(outside).toHaveFocus()
})
