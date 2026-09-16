/** Native coverage adapted from Base UI toast focus/stack tests and Sonner interactions. */
import { Toast } from '@xenon/solid/toast'
import { Dialog } from '@xenon/solid/dialog'
import { Popover } from '@xenon/solid/popover'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { For, flush } from 'solid-js'
import { within } from '@testing-library/dom'
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
async function settle(time = 60) {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, time))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
function Notifications() {
  const toast = Toast.useManager()
  return (
    <Toast.Portal>
      <Toast.Viewport
        aria-label="Notifications"
        data-testid="toast-viewport"
        gap={12}
        style={{
          position: 'fixed',
          inset: 'auto 20px 20px auto',
          width: '300px',
          margin: '0',
          padding: '0',
          border: '0',
          background: 'transparent',
          overflow: 'visible',
        }}
      >
        <For each={toast.toasts()}>
          {(item) => (
            <Toast.Content
              toast={item}
              data-testid={`toast-${item.id}`}
              swipeDirection={['right', 'down']}
              style={{
                background: 'white',
                padding: '12px',
                border: '1px solid black',
                'touch-action': 'none',
              }}
            >
              <Toast.Title />
              <Toast.Description />
              <Toast.Action />
              <Toast.Close aria-label={`Dismiss ${item.title}`}>Close</Toast.Close>
            </Toast.Content>
          )}
        </For>
      </Toast.Viewport>
    </Toast.Portal>
  )
}

test('toast arrival leaves focus alone, shortcut visits newest first, Escape restores focus', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <button>Outside</button>
      <Notifications />
    </Toast.Provider>
  ))
  const outside = m.getByRole('button', { name: 'Outside' })
  outside.focus()
  toast.add({ title: 'First' })
  toast.add({ title: 'Second' })
  await settle()
  expect(outside).toHaveFocus()
  await userEvent.keyboard('{Alt>}t{/Alt}')
  expect(m.getByRole('region', { name: 'Notifications' })).toHaveFocus()
  await userEvent.tab()
  expect(m.getByRole('group', { name: 'Second' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.getByRole('group', { name: 'First' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(outside).toHaveFocus()
  expect(m.queryByRole('group')).toBeNull()
})

test('action cancellation preserves a toast; successful actions dismiss once', async () => {
  const toast = Toast.createManager()
  const action = vi.fn((event: MouseEvent) => event.preventDefault())
  const dismissed = vi.fn()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  const id = toast.add({
    title: 'Undo',
    action: { label: 'Try again', onClick: action },
    onDismiss: dismissed,
  })
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Try again' }))
  expect(action).toHaveBeenCalledOnce()
  expect(m.getByRole('group', { name: 'Undo' })).toBeVisible()
  toast.update(id, { action: { label: 'Finish', onClick: () => {} } })
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Finish' }))
  await settle()
  expect(dismissed).toHaveBeenCalledOnce()
  expect(m.queryByRole('group')).toBeNull()
})

test('limit hides older records, same-ID update preserves the node, promotion remains accessible', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0} limit={1}>
      <Notifications />
    </Toast.Provider>
  ))
  const first = toast.add({ title: 'Queued first' })
  const second = toast.add({ title: 'Visible second' })
  await settle()
  expect(m.queryByRole('group', { name: 'Queued first' })).toBeNull()
  const node = m.getByRole('group', { name: 'Visible second' })
  toast.update(second, { title: 'Updated second' })
  await settle()
  expect(m.getByRole('group', { name: 'Updated second' })).toBe(node)
  toast.dismiss(second)
  await settle()
  expect(m.getByTestId(`toast-${first}`)).toBeVisible()
  await expectNoViolations(document.body)
})

test('measurement follows natural content growth and sums variable heights with the gap', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  const first = toast.add({ title: 'Short' })
  const second = toast.add({ title: 'Front', description: 'One line.' })
  await settle()
  const front = m.getByTestId(`toast-${second}`)
  const back = m.getByTestId(`toast-${first}`)
  const height = () => parseFloat(front.style.getPropertyValue('--toast-height'))
  const initial = height()
  toast.update(second, { description: 'A longer description. '.repeat(20) })
  await settle()
  expect(height()).toBeGreaterThan(initial)
  expect(parseFloat(back.style.getPropertyValue('--toast-offset-y'))).toBeCloseTo(height() + 12, 0)
  await userEvent.hover(front)
  expect(front).toHaveAttribute('data-expanded')
  expect(front).toHaveAttribute('data-paused')
  expect(back).toHaveAttribute('data-paused')
  expect(back).toHaveAttribute('data-expanded')
})

test('dismissed promise toast does not reappear after the asynchronous task succeeds', async () => {
  const toast = Toast.createManager()
  let resolve!: (value: string) => void
  const pending = new Promise<string>((done) => {
    resolve = done
  })
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  const id = toast.promise(pending, {
    loading: 'Working',
    success: (value) => value,
    error: 'Failed',
  })
  await settle()
  expect(m.getByRole('group', { name: 'Working' })).toBeVisible()
  toast.dismiss(id)
  await settle()
  resolve('Finished')
  await settle()
  expect(m.queryByRole('group')).toBeNull()
})

test('toast controls inside a modal remain interactive and never dismiss their parent dialog', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Editor">
        <Toast.Provider manager={toast} duration={0}>
          <button onClick={() => toast.success('Saved')}>Save</button>
          <Notifications />
        </Toast.Provider>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Save' }))
  await settle()
  const notification = m.getByRole('group', { name: 'Saved' })
  expect(notification.closest('dialog')).not.toBeNull()
  await userEvent.click(m.getByRole('button', { name: 'Dismiss Saved' }))
  await settle()
  expect(m.getByRole('dialog', { name: 'Editor' })).toBeVisible()
  expect(m.queryByRole('group')).toBeNull()
})

test('a notification press does not dismiss an unrelated open popover', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Popover defaultOpen>
        <Popover.Trigger>Details</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Content aria-label="Details panel">Some details</Popover.Content>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover>
      <Notifications />
    </Toast.Provider>
  ))
  await settle()
  toast.success('Complete')
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Dismiss Complete' }))
  await settle()
  expect(m.getByRole('dialog', { name: 'Details panel' })).toBeVisible()
})

test('global notifications follow modal ancestry without replacing their nodes or stealing focus', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Dialog>
        <Dialog.Trigger>Open editor</Dialog.Trigger>
        <Dialog.Content aria-label="Global toast editor">
          <button onClick={() => toast.success('Saved in editor')}>Save inside editor</button>
          <Dialog.Close>Close editor</Dialog.Close>
        </Dialog.Content>
      </Dialog>
      <Notifications />
    </Toast.Provider>
  ))
  const id = toast.success('Existing notification')
  await settle()
  const original = m.getByTestId(`toast-${id}`)
  await userEvent.click(m.getByRole('button', { name: 'Open editor' }))
  await settle()
  expect(m.getByTestId(`toast-${id}`)).toBe(original)
  expect(original.closest('dialog')).not.toBeNull()
  expect(m.getByRole('dialog', { name: 'Global toast editor' })).toContainElement(
    document.activeElement as HTMLElement
  )
  const save = m.getByRole('button', { name: 'Save inside editor' })
  await userEvent.click(save)
  await settle()
  expect(save).toHaveFocus()
  await userEvent.click(m.getByRole('button', { name: 'Dismiss Saved in editor' }))
  await settle()
  expect(m.getByRole('dialog', { name: 'Global toast editor' })).toBeVisible()
  await userEvent.click(m.getByRole('button', { name: 'Close editor' }))
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(m.getByTestId(`toast-${id}`)).toBe(original)
  expect(original.closest('dialog')).toBeNull()
  await userEvent.click(m.getByRole('button', { name: 'Dismiss Existing notification' }))
  await settle()
  expect(m.queryByRole('group')).toBeNull()
})

test('an exiting middle toast retains its geometry while survivors reflow, and re-add keeps its node', async () => {
  const toast = Toast.createManager()
  const removed = vi.fn()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <style>
        {
          '[data-toast-content-root] { transition: opacity 240ms linear; } [data-toast-content-root][data-state="closed"] { opacity: 0; }'
        }
      </style>
      <Notifications />
    </Toast.Provider>
  ))
  const oldest = toast.add({ title: 'Oldest' })
  const middle = toast.add({ id: 'middle', title: 'Middle', onRemove: removed })
  toast.add({ title: 'Newest' })
  await settle()
  const node = m.getByTestId(`toast-${middle}`)
  const back = m.getByTestId(`toast-${oldest}`)
  const before = node.style.getPropertyValue('--toast-offset-y')
  const backBefore = parseFloat(back.style.getPropertyValue('--toast-offset-y'))
  toast.dismiss(middle)
  await settle(50)
  expect(node.isConnected).toBe(true)
  expect(node).toHaveAttribute('data-state', 'closed')
  expect(node.style.getPropertyValue('--toast-offset-y')).toBe(before)
  expect(parseFloat(back.style.getPropertyValue('--toast-offset-y'))).toBeLessThan(backBefore)
  toast.add({ id: middle, title: 'Returned' })
  await settle(280)
  expect(m.getByRole('group', { name: 'Returned' })).toBe(node)
  expect(removed).not.toHaveBeenCalled()
})

test('rapid arrivals announce each visible message and dismissals clear stale speech', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  toast.add({ title: 'First announcement' })
  toast.add({ title: 'Second announcement' })
  toast.add({ title: 'Urgent announcement', priority: 'high' })
  await settle()
  expect(m.getByRole('status')).toHaveTextContent('First announcement')
  expect(m.getByRole('status')).toHaveTextContent('Second announcement')
  expect(m.getByRole('alert')).toHaveTextContent('Urgent announcement')
  toast.dismiss()
  await settle()
  expect(m.queryByRole('status')).toBeNull()
  expect(m.queryByRole('alert')).toBeNull()
})

test('stack scale never changes the measured natural height', async () => {
  const toast = Toast.createManager()
  const m = mount(() => (
    <Toast.Provider manager={toast} duration={0}>
      <Notifications />
    </Toast.Provider>
  ))
  const id = toast.add({ title: 'Natural size', description: 'Read at any stack depth.' })
  await settle()
  const node = m.getByTestId(`toast-${id}`)
  const initial = parseFloat(node.style.getPropertyValue('--toast-height'))
  node.style.transform = 'scale(0.5)'
  toast.update(id, { description: 'Read at any stack depth.' })
  await settle()
  expect(parseFloat(node.style.getPropertyValue('--toast-height'))).toBeCloseTo(initial, 0)
})
