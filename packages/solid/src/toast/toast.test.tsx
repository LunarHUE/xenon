import { cleanup, render } from '@solidjs/testing-library'
import { For, Show, createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Dialog } from '../dialog'
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

test('provider unmount clears the pending timer until a provider reattaches (toast.notes.1)', async () => {
  vi.useFakeTimers()
  const manager = Toast.createManager()
  const dismissed = vi.fn()
  const id = manager.add({ title: 'Lifetime', duration: 100, onDismiss: dismissed })
  const [mounted, setMounted] = createSignal(true)
  render(() => (
    <Show when={mounted()}>
      <Toast.Provider manager={manager} duration={100}>
        <Notifications />
      </Toast.Provider>
    </Show>
  ))
  await settle()
  vi.advanceTimersByTime(60)
  setMounted(false)
  await settle()
  vi.advanceTimersByTime(10_000)
  const record = manager.toasts().find((toast) => toast.id === id)!
  expect(record.open).toBe(true)
  expect(dismissed).not.toHaveBeenCalled()
  setMounted(true)
  await settle()
  vi.advanceTimersByTime(39)
  expect(record.open).toBe(true)
  vi.advanceTimersByTime(1)
  expect(record.open).toBe(false)
  expect(dismissed).toHaveBeenCalledExactlyOnceWith('timeout')
})

test('a provider without limit or duration props keeps an external manager configuration', async () => {
  const manager = Toast.createManager({ limit: 1, duration: 0 })
  const first = manager.add({ title: 'First' })
  const second = manager.add({ title: 'Second' })
  const m = render(() => (
    <Toast.Provider manager={manager}>
      <Notifications />
    </Toast.Provider>
  ))
  await settle()
  expect(m.getByTestId(first)).toHaveAttribute('hidden')
  expect(m.getByTestId(second)).not.toHaveAttribute('hidden')
  expect(manager.toasts().find((record) => record.id === second)?.duration).toBe(0)
})

test('nested viewport refs attach and explicit undefined removes its default name', () => {
  const manager = Toast.createManager()
  const host = vi.fn()
  const refs = [host, [undefined, host]]
  const view = render(() => (
    <Toast.Provider manager={manager}>
      <Toast.Viewport aria-label={undefined} ref={refs} />
    </Toast.Provider>
  ))
  expect(host).toHaveBeenCalledWith(view.getByRole('region', { hidden: true }))
  expect(view.getByRole('region', { hidden: true })).not.toHaveAttribute('aria-label')
})

test('Portal tolerates modal destination changes published during disposal', async () => {
  // Disposing a Dialog unregisters its modal from the dialog host's cleanup, and the
  // modal registry publishes the next destination synchronously from there. A For
  // disposes removed rows inside its own computation, so the portal's destination
  // signals are then written from an owned scope.
  HTMLDialogElement.prototype.showModal ??= function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
  const manager = Toast.createManager()
  const [peeks, setPeeks] = createSignal(['first'])
  const [probe, setProbe] = createSignal(0)
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0}>
      <Toast.Portal>
        <Notifications />
      </Toast.Portal>
      <output>{probe()}</output>
      <For each={peeks()}>
        {(peek) => (
          <Dialog open>
            <Dialog.Content>
              <Dialog.Title>{peek}</Dialog.Title>
            </Dialog.Content>
          </Dialog>
        )}
      </For>
    </Toast.Provider>
  ))
  await settle()
  const portal = () => document.querySelector('[data-toast-portal]')
  expect(m.getByRole('dialog').contains(portal())).toBe(true)
  expect(() => {
    setPeeks([])
    flush()
  }).not.toThrow()
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(portal()?.parentElement).toBe(document.body)
  // Reactivity keeps running after the disposal, and a second dialog can open.
  setProbe(1)
  flush()
  expect(m.container.querySelector('output')).toHaveTextContent('1')
  setPeeks(['second'])
  await settle()
  expect(m.getByRole('dialog').contains(portal())).toBe(true)
})

test('Viewport disposes cleanly while expanded by hover', async () => {
  // The viewport controller reports the collapse synchronously from its dispose, which
  // runs in the viewport's cleanup. A For disposes removed rows inside its own
  // computation, so that report lands in an owned scope.
  const manager = Toast.createManager()
  manager.add({ title: 'Saved' })
  const [rows, setRows] = createSignal(['only'])
  const m = render(() => (
    <Toast.Provider manager={manager} duration={0}>
      <For each={rows()}>{() => <Notifications />}</For>
    </Toast.Provider>
  ))
  await settle()
  const region = m.getByRole('region', { name: 'Updates' })
  region.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
  await settle()
  expect(region).toHaveAttribute('data-expanded')
  expect(() => {
    setRows([])
    flush()
  }).not.toThrow()
  await settle()
  expect(m.queryByRole('region')).toBeNull()
  setRows(['again'])
  await settle()
  expect(m.getByRole('region', { name: 'Updates' })).not.toHaveAttribute('data-expanded')
})
