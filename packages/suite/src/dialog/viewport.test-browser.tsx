import { Dialog, Popover } from '@xenon/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

test('native viewport permits a nested portaled popup and restores focus through both layers', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Dialog>
        <Dialog.Trigger>Open editor viewport</Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Viewport style={{ display: 'grid', 'place-items': 'center' }}>
            <Dialog.Content
              aria-label="Viewport editor"
              style={{ padding: '24px', background: 'white' }}
            >
              <Popover>
                <Popover.Trigger>Open nested popup</Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner>
                    <Popover.Content aria-label="Nested details">
                      <Popover.Close aria-label="Close details">Close details</Popover.Close>
                    </Popover.Content>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover>
              <Dialog.Close>Close editor viewport</Dialog.Close>
            </Dialog.Content>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const page = within(document.body)
  const trigger = page.getByRole('button', { name: 'Open editor viewport' })
  await userEvent.click(trigger)
  const host = page.getByRole('dialog', { name: 'Viewport editor' })
  expect(host.matches(':modal')).toBe(true)
  const innerTrigger = page.getByRole('button', { name: 'Open nested popup' })
  await userEvent.click(innerTrigger)
  const popup = page.getByRole('dialog', { name: 'Nested details' })
  expect(host.firstElementChild?.contains(popup)).toBe(true)
  await expect.poll(() => popup.parentElement?.matches(':popover-open')).toBe(true)
  const closeDetails = page.getByRole('button', { name: 'Close details' })
  await expect.poll(() => document.activeElement === closeDetails).toBe(true)
  await userEvent.click(closeDetails)
  await expect.poll(() => page.queryByRole('dialog', { name: 'Nested details' })).toBeNull()
  expect(innerTrigger).toHaveFocus()
  expect(host.matches(':modal')).toBe(true)
  await userEvent.click(page.getByRole('button', { name: 'Close editor viewport' }))
  await expect.poll(() => host.isConnected).toBe(false)
  expect(trigger).toHaveFocus()
})

test('shared dialog handle restores focus to the latest selected trigger', async () => {
  const handle = Dialog.createHandle<string>()
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <Dialog.Trigger id="first-viewport-opener" handle={handle} payload="First">
          First viewport opener
        </Dialog.Trigger>
        <Dialog.Trigger id="second-viewport-opener" handle={handle} payload="Second">
          Second viewport opener
        </Dialog.Trigger>
        <Dialog handle={handle}>
          {(state) => (
            <Dialog.Portal>
              <Dialog.Viewport>
                <Dialog.Content aria-label="Shared viewport">
                  <span>{state.payload}</span>
                  <Dialog.Close>Dismiss shared viewport</Dialog.Close>
                </Dialog.Content>
              </Dialog.Viewport>
            </Dialog.Portal>
          )}
        </Dialog>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const page = within(document.body)
  await userEvent.click(page.getByRole('button', { name: 'First viewport opener' }))
  const host = page.getByRole('dialog', { name: 'Shared viewport' })
  handle.open('second-viewport-opener')
  flush()
  expect(page.getByRole('dialog', { name: 'Shared viewport' })).toBe(host)
  expect(host).toHaveTextContent('Second')
  await userEvent.click(page.getByRole('button', { name: 'Dismiss shared viewport' }))
  await expect.poll(() => host.isConnected).toBe(false)
  expect(page.getByRole('button', { name: 'Second viewport opener' })).toHaveFocus()
})
