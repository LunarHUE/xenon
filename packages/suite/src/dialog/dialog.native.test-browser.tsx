import { AlertDialog, Dialog } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

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
  return { container, ...within(container) }
}
async function settle() {
  flush()
  await Promise.resolve()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await Promise.resolve()
  flush()
}
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  flush()
})

test('vetoing Escape on a stacked alert dialog keeps both native layers open and unwinds one layer per acceptance', async () => {
  const [vetoed, setVetoed] = createSignal(true)
  const escape = vi.fn()
  const m = mount(() => (
    <Dialog>
      <Dialog.Trigger>Open settings</Dialog.Trigger>
      <Dialog.Content aria-label="Settings">
        <Dialog.Close>Close settings</Dialog.Close>
        <AlertDialog
          onEscapeKeyDown={(event) => {
            escape(event)
            if (vetoed()) event.preventDefault()
          }}
        >
          <AlertDialog.Trigger>Delete account</AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Title>Delete account?</AlertDialog.Title>
            <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
            <AlertDialog.Cancel>Cancel deletion</AlertDialog.Cancel>
          </AlertDialog.Content>
        </AlertDialog>
      </Dialog.Content>
    </Dialog>
  ))
  const opener = m.getByRole('button', { name: 'Open settings' })
  await userEvent.click(opener)
  await settle()
  const outer = m.getByRole('dialog', { name: 'Settings' }) as HTMLDialogElement
  expect(outer.matches(':modal')).toBe(true)
  await userEvent.click(m.getByRole('button', { name: 'Delete account' }))
  await settle()
  const inner = m.getByRole('alertdialog') as HTMLDialogElement
  const cancel = m.getByRole('button', { name: 'Cancel deletion' })
  expect(inner.matches(':modal')).toBe(true)
  expect(cancel).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(escape).toHaveBeenCalledTimes(1)
  expect(m.getByRole('alertdialog')).toBe(inner)
  expect(inner.matches(':modal')).toBe(true)
  expect(outer.open).toBe(true)
  expect(outer.matches(':modal')).toBe(true)
  expect(cancel).toHaveFocus()
  setVetoed(false)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('alertdialog')).toBeNull()
  expect(outer.open).toBe(true)
  expect(outer.matches(':modal')).toBe(true)
  expect(m.getByRole('button', { name: 'Delete account' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})

test('an Escape veto on the lower dialog does not preempt the topmost layer dismissal', async () => {
  const outerEscape = vi.fn((event: KeyboardEvent) => event.preventDefault())
  const m = mount(() => (
    <Dialog onEscapeKeyDown={outerEscape}>
      <Dialog.Trigger>Open settings</Dialog.Trigger>
      <Dialog.Content aria-label="Settings">
        <Dialog.Close>Close settings</Dialog.Close>
        <Dialog>
          <Dialog.Trigger>Edit profile</Dialog.Trigger>
          <Dialog.Content aria-label="Profile editor">
            <Dialog.Close>Close profile</Dialog.Close>
          </Dialog.Content>
        </Dialog>
      </Dialog.Content>
    </Dialog>
  ))
  const opener = m.getByRole('button', { name: 'Open settings' })
  await userEvent.click(opener)
  await settle()
  const outer = m.getByRole('dialog', { name: 'Settings' }) as HTMLDialogElement
  const innerTrigger = m.getByRole('button', { name: 'Edit profile' })
  await userEvent.click(innerTrigger)
  await settle()
  const inner = m.getByRole('dialog', { name: 'Profile editor' }) as HTMLDialogElement
  expect(inner.matches(':modal')).toBe(true)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(outerEscape).not.toHaveBeenCalled()
  expect(m.queryByRole('dialog', { name: 'Profile editor' })).toBeNull()
  expect(outer.open).toBe(true)
  expect(outer.matches(':modal')).toBe(true)
  expect(innerTrigger).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(outerEscape).toHaveBeenCalledTimes(1)
  expect(outer.open).toBe(true)
  await userEvent.click(m.getByRole('button', { name: 'Close settings' }))
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})

test('focus restoration falls back to a surviving trigger after the opening trigger unmounts', async () => {
  const [removed, setRemoved] = createSignal(false)
  const m = mount(() => (
    <Dialog>
      <Show when={!removed()}>
        <Dialog.Trigger>Primary opener</Dialog.Trigger>
      </Show>
      <Dialog.Trigger>Secondary opener</Dialog.Trigger>
      <Dialog.Content aria-label="Shared editor">
        <Dialog.Close>Close editor</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Primary opener' }))
  await settle()
  expect(m.getByRole('dialog', { name: 'Shared editor' })).toHaveAttribute('open')
  setRemoved(true)
  await settle()
  expect(m.queryByRole('button', { name: 'Primary opener' })).toBeNull()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(m.getByRole('button', { name: 'Secondary opener' })).toHaveFocus()
})

test('an ineligible finalFocus target falls back to the opening trigger', async () => {
  const unusable = document.createElement('button')
  unusable.textContent = 'Preferred return'
  unusable.disabled = true
  document.body.append(unusable)
  cleanups.push(() => unusable.remove())
  const m = mount(() => (
    <Dialog finalFocus={unusable}>
      <Dialog.Trigger>Open editor</Dialog.Trigger>
      <Dialog.Content aria-label="Editor">
        <Dialog.Close>Close editor</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  const opener = m.getByRole('button', { name: 'Open editor' })
  await userEvent.click(opener)
  await settle()
  expect(m.getByRole('dialog', { name: 'Editor' })).toHaveAttribute('open')
  await userEvent.click(m.getByRole('button', { name: 'Close editor' }))
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(unusable.isConnected).toBe(true)
  expect(opener).toHaveFocus()
})

test('portal descendants stay inside the native modal host while an explicit body mount is inert', async () => {
  const clicked = vi.fn()
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Portal editor">
        <Dialog.Portal>
          <button type="button" onClick={clicked}>
            Portaled action
          </button>
        </Dialog.Portal>
        <Dialog.Portal container={document.body}>
          <button type="button" id="body-portaled">
            Body portaled action
          </button>
        </Dialog.Portal>
        <Dialog.Close>Close portal editor</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  const host = m.getByRole('dialog', { name: 'Portal editor' }) as HTMLDialogElement
  expect(host.matches(':modal')).toBe(true)
  const inside = m.getByRole('button', { name: 'Portaled action' })
  expect(host.contains(inside)).toBe(true)
  expect(inside.closest('[inert]')).toBeNull()
  inside.focus()
  expect(inside).toHaveFocus()
  await userEvent.click(inside)
  expect(clicked).toHaveBeenCalledTimes(1)
  const outside = document.getElementById('body-portaled') as HTMLButtonElement
  expect(document.body.contains(outside)).toBe(true)
  expect(outside.closest('[inert]')).not.toBeNull()
  outside.focus()
  expect(outside).not.toHaveFocus()
})

test('a method=dialog form in a nested dialog closes only its own layer', async () => {
  const m = mount(() => (
    <Dialog>
      <Dialog.Trigger>Open settings</Dialog.Trigger>
      <Dialog.Content aria-label="Settings">
        <Dialog.Close>Close settings</Dialog.Close>
        <Dialog>
          <Dialog.Trigger>Edit profile</Dialog.Trigger>
          <Dialog.Content aria-label="Profile editor">
            <form method="dialog">
              <button type="submit" value="saved">
                Save profile
              </button>
            </form>
          </Dialog.Content>
        </Dialog>
      </Dialog.Content>
    </Dialog>
  ))
  const opener = m.getByRole('button', { name: 'Open settings' })
  await userEvent.click(opener)
  await settle()
  const outer = m.getByRole('dialog', { name: 'Settings' }) as HTMLDialogElement
  const innerTrigger = m.getByRole('button', { name: 'Edit profile' })
  await userEvent.click(innerTrigger)
  await settle()
  const inner = m.getByRole('dialog', { name: 'Profile editor' }) as HTMLDialogElement
  expect(inner.matches(':modal')).toBe(true)
  await userEvent.click(m.getByRole('button', { name: 'Save profile' }))
  await settle()
  expect(m.queryByRole('dialog', { name: 'Profile editor' })).toBeNull()
  expect(outer.open).toBe(true)
  expect(outer.matches(':modal')).toBe(true)
  expect(innerTrigger).toHaveFocus()
})

test('a method=dialog form inside a portal descendant still closes its dialog', async () => {
  const m = mount(() => (
    <Dialog>
      <Dialog.Trigger>Open profile</Dialog.Trigger>
      <Dialog.Content aria-label="Profile editor">
        <Dialog.Portal>
          <form method="dialog">
            <button type="submit" value="saved">
              Save from portal
            </button>
          </form>
        </Dialog.Portal>
      </Dialog.Content>
    </Dialog>
  ))
  const opener = m.getByRole('button', { name: 'Open profile' })
  await userEvent.click(opener)
  await settle()
  const host = m.getByRole('dialog', { name: 'Profile editor' }) as HTMLDialogElement
  expect(host.matches(':modal')).toBe(true)
  const save = m.getByRole('button', { name: 'Save from portal' })
  expect(host.contains(save)).toBe(true)
  await userEvent.click(save)
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})
