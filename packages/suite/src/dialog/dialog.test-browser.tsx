import { AlertDialog, Dialog, Drawer } from '@xenon-ui/solid'
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
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup()
  flush()
})

test('public Dialog associates author IDs, opens natively, and returns focus to its trigger', async () => {
  const m = mount(() => (
    <Dialog>
      <Dialog.Trigger>Open editor</Dialog.Trigger>
      <Dialog.Content id="editor-content">
        <Dialog.Title id="editor-title">Editor</Dialog.Title>
        <Dialog.Description id="editor-description">Change the document.</Dialog.Description>
        <Dialog.Close>Save and close</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  const trigger = m.getByRole('button', { name: 'Open editor' })
  expect(trigger).toHaveAttribute('aria-controls', 'editor-content')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(m.queryByRole('dialog')).toBeNull()
  await userEvent.click(trigger)
  await settle()
  const content = m.getByRole('dialog', { name: 'Editor' })
  expect(content.matches(':modal')).toBe(true)
  expect(content).toHaveAttribute('aria-labelledby', 'editor-title')
  expect(content).toHaveAttribute('aria-describedby', 'editor-description')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(m.getByRole('button', { name: 'Save and close' }))
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveFocus()
})

test('conditional title and description registrations update rendered associations', async () => {
  const [shown, setShown] = createSignal(true)
  const [id, setId] = createSignal('first-title')
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content>
        <Dialog.Title id={id()}>Editor</Dialog.Title>
        <Show when={shown()}>
          <Dialog.Description id="optional-description">Optional help</Dialog.Description>
          <Dialog.Title id="extra-title">Details</Dialog.Title>
        </Show>
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  const content = m.getByRole('dialog')
  expect(content).toHaveAttribute('aria-labelledby', 'first-title extra-title')
  expect(content).toHaveAttribute('aria-describedby', 'optional-description')
  setShown(false)
  setId('updated-title')
  await settle()
  expect(content).toHaveAttribute('aria-labelledby', 'updated-title')
  expect(content).not.toHaveAttribute('aria-describedby')
  expect(m.getByText('Editor')).toHaveAttribute('id', 'updated-title')
})

test('author accessible labels override title associations', async () => {
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Explicit name" aria-describedby="author-description">
        <Dialog.Title>Generated title</Dialog.Title>
        <p id="author-description">Author description</p>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  const content = m.getByRole('dialog', { name: 'Explicit name' })
  expect(content).not.toHaveAttribute('aria-labelledby')
  expect(content).toHaveAttribute('aria-describedby', 'author-description')
})

test('controlled triggers request changes and disabled or cancelled triggers do not activate', async () => {
  const [open, setOpen] = createSignal(false)
  const change = vi.fn()
  const m = mount(() => (
    <Dialog open={open()} onOpenChange={change}>
      <Dialog.Trigger>Open</Dialog.Trigger>
      <Dialog.Trigger disabled>Disabled native</Dialog.Trigger>
      <Dialog.Trigger as="div" disabled>
        Disabled custom
      </Dialog.Trigger>
      <Dialog.Trigger onClick={(event) => event.preventDefault()}>Prevented</Dialog.Trigger>
      <Dialog.Content aria-label="Controlled editor">
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  const native = m.getByRole('button', { name: 'Disabled native' })
  expect(native).toBeDisabled()
  native.click()
  await userEvent.click(m.getByRole('button', { name: 'Disabled custom' }), { force: true })
  await userEvent.click(m.getByRole('button', { name: 'Prevented' }))
  await settle()
  expect(change).not.toHaveBeenCalled()
  const trigger = m.getByRole('button', { name: 'Open' })
  trigger.focus()
  await userEvent.keyboard('{Enter}')
  await settle()
  expect(change.mock.calls).toEqual([[true]])
  expect(m.queryByRole('dialog')).toBeNull()
  setOpen(true)
  await settle()
  expect(m.getByRole('dialog')).toHaveAttribute('open')
  await userEvent.click(m.getByRole('button', { name: 'Close' }))
  await settle()
  expect(change.mock.calls).toEqual([[true], [false]])
  expect(m.getByRole('dialog')).toHaveAttribute('open')
  setOpen(false)
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
})

test('AlertDialog initially focuses Cancel, ignores outside presses, and allows Escape dismissal', async () => {
  const m = mount(() => (
    <AlertDialog>
      <AlertDialog.Trigger>Delete document</AlertDialog.Trigger>
      <AlertDialog.Content style={{ width: '240px', height: '180px' }}>
        <AlertDialog.Title>Confirm deletion</AlertDialog.Title>
        <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
        <AlertDialog.Action>Delete</AlertDialog.Action>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      </AlertDialog.Content>
    </AlertDialog>
  ))
  const trigger = m.getByRole('button', { name: 'Delete document' })
  await userEvent.click(trigger)
  await settle()
  const content = m.getByRole('alertdialog')
  expect(content).toHaveAttribute('aria-modal', 'true')
  expect(m.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  await userEvent.click(content, { position: { x: -10, y: -10 }, force: true })
  await settle()
  expect(content).toHaveAttribute('open')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('alertdialog')).toBeNull()
  expect(trigger).toHaveFocus()
})

test('AlertDialog Action honors cancellation and Cancel and Action both dismiss', async () => {
  const [prevent, setPrevent] = createSignal(true)
  const m = mount(() => (
    <AlertDialog>
      <AlertDialog.Trigger>Confirm</AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete item?</AlertDialog.Title>
        <AlertDialog.Description>The item will be removed.</AlertDialog.Description>
        <AlertDialog.Action
          onClick={(event) => {
            if (prevent()) event.preventDefault()
          }}
        >
          Delete
        </AlertDialog.Action>
        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      </AlertDialog.Content>
    </AlertDialog>
  ))
  await userEvent.click(m.getByRole('button', { name: 'Confirm' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Delete' }))
  await settle()
  expect(m.getByRole('alertdialog')).toHaveAttribute('open')
  await userEvent.click(m.getByRole('button', { name: 'Cancel' }))
  await settle()
  expect(m.queryByRole('alertdialog')).toBeNull()
  setPrevent(false)
  await userEvent.click(m.getByRole('button', { name: 'Confirm' }))
  await settle()
  await userEvent.click(m.getByRole('button', { name: 'Delete' }))
  await settle()
  expect(m.queryByRole('alertdialog')).toBeNull()
})

test.each(['{Enter}', ' ', 'click'])('Drawer Handle dismisses through %s', async (activation) => {
  const m = mount(() => (
    <Drawer defaultOpen side="left">
      <Drawer.Content aria-label="Navigation">
        <Drawer.Handle />
      </Drawer.Content>
    </Drawer>
  ))
  await settle()
  expect(m.getByRole('dialog')).toHaveAttribute('data-side', 'left')
  const handle = m.getByRole('button', { name: 'Close drawer' })
  handle.focus()
  if (activation === 'click') await userEvent.click(handle)
  else await userEvent.keyboard(activation)
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
})

test('forceMount retains hidden closed content while releasing native modality and scroll locks', async () => {
  const originalOverflow = document.documentElement.style.overflow
  const m = mount(() => (
    <Dialog forceMount>
      <Dialog.Trigger>Open persistent editor</Dialog.Trigger>
      <Dialog.Content aria-label="Persistent editor">
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  const content = m.container.querySelector('dialog')!
  expect(content).toHaveAttribute('hidden')
  expect(content.open).toBe(false)
  const trigger = m.getByRole('button', { name: 'Open persistent editor' })
  await userEvent.click(trigger)
  await settle()
  expect(content.matches(':modal')).toBe(true)
  expect(content).not.toHaveAttribute('hidden')
  expect(content).not.toHaveAttribute('inert')
  expect(document.documentElement.style.overflowX).toBe('hidden')
  await userEvent.click(m.getByRole('button', { name: 'Close' }))
  await settle()
  expect(m.container.querySelector('dialog')).toBe(content)
  expect(content).toHaveAttribute('hidden')
  expect(content.open).toBe(false)
  expect(content.matches(':modal')).toBe(false)
  expect(document.documentElement.style.overflow).toBe(originalOverflow)
  expect(trigger).toHaveFocus()
  await userEvent.click(trigger)
  await settle()
  expect(m.getByRole('dialog')).toBe(content)
  expect(content.matches(':modal')).toBe(true)
})

test('real exit animations retain modality and scroll locks, and rapid reopening cancels stale completion', async () => {
  const [open, setOpen] = createSignal(true)
  const originalOverflow = document.documentElement.style.overflow
  const m = mount(() => (
    <Dialog open={open()} onOpenChange={setOpen}>
      <Dialog.Content aria-label="Animated editor">
        <Dialog.Close>Close</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  const content = m.getByRole('dialog') as HTMLDialogElement
  const animate = () => {
    const animation = content.animate([{ opacity: 1 }, { opacity: 0.5 }], { duration: 60_000 })
    cleanups.push(() => animation.cancel())
    return animation
  }
  const firstExit = animate()
  setOpen(false)
  await settle()
  expect(content).toHaveAttribute('data-ending-style')
  expect(content).toHaveAttribute('inert')
  expect(content.open).toBe(true)
  expect(content.matches(':modal')).toBe(true)
  expect(document.documentElement.style.overflowX).toBe('hidden')
  setOpen(true)
  await settle()
  firstExit.finish()
  await firstExit.finished
  await settle()
  expect(m.getByRole('dialog')).toBe(content)
  expect(content).not.toHaveAttribute('data-ending-style')
  expect(content).not.toHaveAttribute('inert')
  expect(content.matches(':modal')).toBe(true)
  const finalExit = animate()
  setOpen(false)
  await settle()
  expect(content.open).toBe(true)
  expect(document.documentElement.style.overflowX).toBe('hidden')
  finalExit.finish()
  await finalExit.finished
  await settle()
  expect(m.container.querySelector('dialog')).toBeNull()
  expect(content.open).toBe(false)
  expect(document.documentElement.style.overflow).toBe(originalOverflow)
})

test('nested AlertDialog restores its parent trigger before the outer Dialog restores its opener', async () => {
  const m = mount(() => (
    <Dialog>
      <Dialog.Trigger>Open editor</Dialog.Trigger>
      <Dialog.Content aria-label="Editor">
        <Dialog.Close>Close editor</Dialog.Close>
        <AlertDialog>
          <AlertDialog.Trigger>Delete item</AlertDialog.Trigger>
          <AlertDialog.Content>
            <AlertDialog.Title>Delete item?</AlertDialog.Title>
            <AlertDialog.Description>The item will be removed.</AlertDialog.Description>
            <AlertDialog.Action>Delete</AlertDialog.Action>
            <AlertDialog.Cancel>Cancel deletion</AlertDialog.Cancel>
          </AlertDialog.Content>
        </AlertDialog>
      </Dialog.Content>
    </Dialog>
  ))
  const opener = m.getByRole('button', { name: 'Open editor' })
  await userEvent.click(opener)
  await settle()
  const parent = m.getByRole('dialog')
  const childTrigger = m.getByRole('button', { name: 'Delete item' })
  await userEvent.click(childTrigger)
  await settle()
  expect(m.getByRole('button', { name: 'Cancel deletion' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('alertdialog')).toBeNull()
  expect(parent.matches(':modal')).toBe(true)
  expect(childTrigger).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(opener).toHaveFocus()
})
