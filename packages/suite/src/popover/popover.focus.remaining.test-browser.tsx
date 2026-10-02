// Native focus fallback, retained-content reopening, and autofocus require a real browser.
import { Dialog, Popover } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

test('popover.focus.5: content without a focusable child receives initial focus', async () => {
  const view = mount(() => (
    <Popover>
      <Popover.Trigger>Read details</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Read-only details">
          <p>Nothing to edit.</p>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Read details' }))
  const content = view.getByRole('dialog', { name: 'Read-only details' })
  await expect.poll(() => document.activeElement).toBe(content)
})

test.each(['removed', 'hidden'] as const)(
  'popover.focus.5: content recovers focus when its only child is %s',
  async (change) => {
    const [present, setPresent] = createSignal(true)
    const [hidden, setHidden] = createSignal(false)
    const view = mount(() => (
      <Popover>
        <Popover.Trigger>Open changing details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Changing details">
            <Show when={present()}>
              <button style={{ display: hidden() ? 'none' : undefined }}>Temporary action</button>
            </Show>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    ))
    await userEvent.click(view.getByRole('button', { name: 'Open changing details' }))
    const temporary = view.getByRole('button', { name: 'Temporary action' })
    const content = view.getByRole('dialog', { name: 'Changing details' })
    await expect.poll(() => document.activeElement).toBe(temporary)
    if (change === 'removed') setPresent(false)
    else setHidden(true)
    flush()
    await expect.poll(() => document.activeElement).toBe(content)
    expect(content).toBeVisible()
    if (change === 'removed') expect(temporary.isConnected).toBe(false)
    else expect(temporary).not.toBeVisible()
  }
)

test('popover.focus.6: disabling initial focus leaves native focus on the opener', async () => {
  const view = mount(() => (
    <Popover initialFocus={false}>
      <Popover.Trigger>Keep opener focus</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Unfocused details">
          <button>Inside action</button>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = view.getByRole('button', { name: 'Keep opener focus' })
  await userEvent.click(trigger)
  await expect
    .poll(() => view.getByRole('dialog').parentElement!.matches(':popover-open'))
    .toBe(true)
  expect(trigger).toHaveFocus()
  expect(view.getByRole('button', { name: 'Inside action' })).not.toHaveFocus()
  expect(view.getByRole('dialog')).not.toHaveFocus()
})

test('popover.focus.13: reopening retained content skips its hidden input and restores focus inside the same node', async () => {
  const view = mount(() => (
    <Popover forceMount>
      <Popover.Trigger>Open retained details</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Retained details">
          <input type="hidden" name="record" value="42" />
          <button>First visible action</button>
          <Popover.Close aria-label="Close retained details">Close retained details</Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = view.getByRole('button', { name: 'Open retained details' })
  const content = view.getByRole('dialog', { hidden: true })
  expect(content).not.toBeVisible()
  await userEvent.click(trigger)
  await expect
    .poll(() => document.activeElement)
    .toBe(view.getByRole('button', { name: 'First visible action' }))
  await userEvent.click(view.getByRole('button', { name: 'Close retained details' }))
  await expect.poll(() => content.hasAttribute('hidden')).toBe(true)
  expect(content.isConnected).toBe(true)
  expect(trigger).toHaveFocus()
  await userEvent.click(trigger)
  await expect
    .poll(() => document.activeElement)
    .toBe(view.getByRole('button', { name: 'First visible action' }))
  expect(view.getByRole('dialog')).toBe(content)
})

test('dialog.focus.14: native autofocus selects the authored child rather than an earlier control', async () => {
  const view = mount(() => (
    <Dialog>
      <Dialog.Trigger>Open autofocus editor</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Title>Autofocus editor</Dialog.Title>
        <button>Earlier action</button>
        <label>
          Document name
          <input autofocus />
        </label>
        <Dialog.Close>Close editor</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open autofocus editor' }))
  const target = view.getByRole('textbox', { name: 'Document name' })
  expect(target).toHaveAttribute('autofocus')
  await expect.poll(() => document.activeElement).toBe(target)
  expect(view.getByRole('button', { name: 'Earlier action' })).not.toHaveFocus()
})

test('dialog.focus.26: programmatic opening without a trigger restores the unrelated pre-open focus', async () => {
  const handle = Dialog.createHandle()
  const view = mount(() => (
    <>
      <button>Existing page focus</button>
      <Dialog handle={handle}>
        <Dialog.Content>
          <Dialog.Title>Programmatic editor</Dialog.Title>
          <Dialog.Close>Close programmatic editor</Dialog.Close>
        </Dialog.Content>
      </Dialog>
    </>
  ))
  const origin = view.getByRole('button', { name: 'Existing page focus' })
  origin.focus()
  expect(origin).toHaveFocus()
  handle.open()
  flush()
  await expect
    .poll(() => document.activeElement)
    .toBe(view.getByRole('button', { name: 'Close programmatic editor' }))
  await userEvent.click(view.getByRole('button', { name: 'Close programmatic editor' }))
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  expect(origin).toHaveFocus()
})
