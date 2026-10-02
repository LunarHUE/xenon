// Native trigger activation and outside dismissal require browser keyboard and pointer input.
import { Popover } from '@xenon-ui/solid/popover'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
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

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('popover.roles.4: button, link, and generic triggers announce a dialog popup', () => {
  const view = mount(() => (
    <Popover>
      <Popover.Trigger>Button trigger</Popover.Trigger>
      <Popover.Trigger as="a" href="#reference">
        Link trigger
      </Popover.Trigger>
      <Popover.Trigger as="span">Generic trigger</Popover.Trigger>
    </Popover>
  ))
  for (const name of ['Button trigger', 'Link trigger', 'Generic trigger']) {
    expect(view.getByText(name)).toHaveAttribute('aria-haspopup', 'dialog')
    expect(view.getByText(name)).toHaveAttribute('aria-expanded', 'false')
  }
})

test('popover.roles.9: native triggers default to button type, preserve explicit types, and generic hosts omit type', () => {
  const view = mount(() => (
    <Popover>
      <Popover.Trigger>Default type</Popover.Trigger>
      <Popover.Trigger type="submit">Submit type</Popover.Trigger>
      <Popover.Trigger type="reset">Reset type</Popover.Trigger>
      <Popover.Trigger as="span">Generic type</Popover.Trigger>
      <Popover.Trigger as="a" href="#reference">
        Link type
      </Popover.Trigger>
    </Popover>
  ))
  expect(view.getByRole('button', { name: 'Default type' })).toHaveAttribute('type', 'button')
  expect(view.getByRole('button', { name: 'Submit type' })).toHaveAttribute('type', 'submit')
  expect(view.getByRole('button', { name: 'Reset type' })).toHaveAttribute('type', 'reset')
  expect(view.getByRole('button', { name: 'Generic type' })).not.toHaveAttribute('type')
  expect(view.getByRole('link', { name: 'Link type' })).not.toHaveAttribute('type')
})

test.each(['{Enter}', ' '] as const)(
  'popover.keyboard.5: disabled native and generic triggers ignore %s without reporting an open request',
  async (key) => {
    const changed = vi.fn()
    const view = mount(() => (
      <Popover onOpenChange={changed}>
        <Popover.Trigger disabled focusableWhenDisabled>
          Disabled button
        </Popover.Trigger>
        <Popover.Trigger as="span" disabled focusableWhenDisabled>
          Disabled generic
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Disabled details">Details</Popover.Content>
        </Popover.Positioner>
      </Popover>
    ))
    for (const name of ['Disabled button', 'Disabled generic']) {
      const trigger = view.getByRole('button', { name })
      expect(trigger).toHaveAttribute('aria-disabled', 'true')
      trigger.focus()
      expect(trigger).toHaveFocus()
      await userEvent.keyboard(key)
      await settle()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(view.queryByRole('dialog')).toBeNull()
      expect(changed).not.toHaveBeenCalled()
    }
  }
)

test('popover.pointer.14: right-clicking a closed native trigger never opens or requests an open state', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <Popover onOpenChange={changed}>
      <Popover.Trigger onContextMenu={(event) => event.preventDefault()}>
        Right-click details
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Pointer details">Details</Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = view.getByRole('button', { name: 'Right-click details' })
  await userEvent.click(trigger, { button: 'right' })
  await settle()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(view.queryByRole('dialog')).toBeNull()
  expect(changed).not.toHaveBeenCalled()
})

test('popover.dismissal.14: Escape closure followed by reopening reconnects outside-press dismissal', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <>
      <Popover onOpenChange={changed}>
        <Popover.Trigger>Open reusable details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Reusable details">
            <button>Inside details</button>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button style={{ position: 'fixed', right: '20px', bottom: '20px' }}>Outside details</button>
    </>
  ))
  const trigger = view.getByRole('button', { name: 'Open reusable details' })
  await userEvent.click(trigger)
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  await userEvent.click(trigger)
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  const outside = view.getByRole('button', { name: 'Outside details' })
  await userEvent.click(outside)
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(outside).toHaveFocus()
  expect(changed.mock.calls).toEqual([[true], [false], [true], [false]])
})
