// popover.roles.10: default naming is covered; a localization API is not shipped.
import { Popover } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

test('popover.roles.10 (partial): undefined icon-only Close stays named through reactive labels and restores trigger focus', async () => {
  const [label, setLabel] = createSignal<string | undefined>(undefined)
  const change = vi.fn()
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <Popover onOpenChange={change}>
        <Popover.Trigger>Open details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details">
            <Popover.Close aria-label={label()}>
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" />
              </svg>
            </Popover.Close>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  const view = within(container)
  const trigger = view.getByRole('button', { name: 'Open details' })
  await userEvent.click(trigger)
  await expect.element(view.getByRole('dialog', { name: 'Details' })).toBeVisible()
  const close = view.getByRole('button', { name: 'Close popover' })
  expect(close).toHaveAttribute('aria-label', 'Close popover')
  setLabel('Dismiss details')
  flush()
  expect(view.getByRole('button', { name: 'Dismiss details' })).toBe(close)
  setLabel(undefined)
  flush()
  expect(view.getByRole('button', { name: 'Close popover' })).toBe(close)
  await userEvent.click(close)
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  await expect.element(trigger).toHaveFocus()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(change.mock.calls).toEqual([[true], [false]])
})
