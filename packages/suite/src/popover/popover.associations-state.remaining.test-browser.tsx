// Association lifecycles and native disabled interaction exercise the public popup adapters.
import { Dialog, Popover } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { Show, createSignal, flush } from 'solid-js'
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

test('dialog.roles.16: late title and description registrations replace IDs and remove stale associations', async () => {
  const [shown, setShown] = createSignal(false)
  const [titleId, setTitleId] = createSignal('late-dialog-title')
  const [descriptionId, setDescriptionId] = createSignal('late-dialog-description')
  const view = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content>
        <Dialog.Title id="persistent-dialog-title">Editor</Dialog.Title>
        <Show when={shown()}>
          <Dialog.Title id={titleId()}>Extra details</Dialog.Title>
          <Dialog.Description id={descriptionId()}>Editing help</Dialog.Description>
        </Show>
        <Dialog.Close>Close editor</Dialog.Close>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  const content = view.getByRole('dialog')
  expect(content).toHaveAttribute('aria-labelledby', 'persistent-dialog-title')
  expect(content).not.toHaveAttribute('aria-describedby')
  setShown(true)
  await settle()
  expect(content).toHaveAttribute('aria-labelledby', 'persistent-dialog-title late-dialog-title')
  expect(content).toHaveAttribute('aria-describedby', 'late-dialog-description')
  setTitleId('updated-dialog-title')
  setDescriptionId('updated-dialog-description')
  await settle()
  expect(content).toHaveAttribute('aria-labelledby', 'persistent-dialog-title updated-dialog-title')
  expect(content).toHaveAttribute('aria-describedby', 'updated-dialog-description')
  expect(document.getElementById('late-dialog-title')).toBeNull()
  expect(document.getElementById('late-dialog-description')).toBeNull()
  setShown(false)
  await settle()
  expect(content).toHaveAttribute('aria-labelledby', 'persistent-dialog-title')
  expect(content).not.toHaveAttribute('aria-describedby')
  expect(document.getElementById('updated-dialog-title')).toBeNull()
  expect(document.getElementById('updated-dialog-description')).toBeNull()
})

test('popover.roles.5: absent title and description associations follow late registration, ID replacement, and removal', async () => {
  const [shown, setShown] = createSignal(false)
  const [titleId, setTitleId] = createSignal('late-popover-title')
  const [descriptionId, setDescriptionId] = createSignal('late-popover-description')
  const view = mount(() => (
    <Popover defaultOpen>
      <Popover.Trigger>Details trigger</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Show when={shown()}>
            <Popover.Title id={titleId()}>Details</Popover.Title>
            <Popover.Description id={descriptionId()}>More context</Popover.Description>
          </Show>
          <Popover.Close>Close details</Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await settle()
  const content = view.getByRole('dialog')
  expect(content).not.toHaveAttribute('aria-labelledby')
  expect(content).not.toHaveAttribute('aria-describedby')
  setShown(true)
  await settle()
  expect(content).toHaveAttribute('aria-labelledby', 'late-popover-title')
  expect(content).toHaveAttribute('aria-describedby', 'late-popover-description')
  setTitleId('updated-popover-title')
  setDescriptionId('updated-popover-description')
  await settle()
  expect(content).toHaveAttribute('aria-labelledby', 'updated-popover-title')
  expect(content).toHaveAttribute('aria-describedby', 'updated-popover-description')
  expect(document.getElementById('late-popover-title')).toBeNull()
  expect(document.getElementById('late-popover-description')).toBeNull()
  setShown(false)
  await settle()
  expect(content).not.toHaveAttribute('aria-labelledby')
  expect(content).not.toHaveAttribute('aria-describedby')
})

test('popover.roles.6: only the active trigger controls the retained popup through switches in both directions', async () => {
  const view = mount(() => (
    <Popover>
      <Popover.Trigger>First details</Popover.Trigger>
      <Popover.Trigger>Second details</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Shared details">
          <Popover.Close>Close details</Popover.Close>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const first = view.getByRole('button', { name: 'First details' })
  const second = view.getByRole('button', { name: 'Second details' })
  for (const trigger of [first, second]) {
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')
  }
  await userEvent.click(first)
  await settle()
  const content = view.getByRole('dialog', { name: 'Shared details' })
  for (const [active, inactive] of [
    [first, second],
    [second, first],
    [first, second],
  ] as const) {
    if (active !== first || inactive.getAttribute('aria-expanded') === 'true') {
      await userEvent.click(active)
      await settle()
    }
    expect(view.getByRole('dialog')).toBe(content)
    expect(active).toHaveAttribute('aria-expanded', 'true')
    expect(active).toHaveAttribute('aria-controls', content.id)
    expect(document.getElementById(active.getAttribute('aria-controls')!)).toBe(content)
    expect(inactive).toHaveAttribute('aria-expanded', 'false')
    expect(inactive).not.toHaveAttribute('aria-controls')
  }
})

test('popover.state.1: default-open content remains uncontrolled through trigger close and reopen', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <Popover defaultOpen onOpenChange={changed}>
      <Popover.Trigger>Toggle default details</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content aria-label="Default details">Details</Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  await settle()
  const trigger = view.getByRole('button', { name: 'Toggle default details' })
  expect(view.getByRole('dialog')).toBeVisible()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  await userEvent.click(trigger)
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await userEvent.click(trigger)
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(changed.mock.calls).toEqual([[false], [true]])
})

test.each([false, true])(
  'popover.state.2: controlled open=%s wins over the opposite default and only requests toggles',
  async (initial) => {
    const [open, setOpen] = createSignal(initial)
    const changed = vi.fn()
    const view = mount(() => (
      <Popover open={open()} defaultOpen={!initial} onOpenChange={changed}>
        <Popover.Trigger>Controlled details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Controlled details">Details</Popover.Content>
        </Popover.Positioner>
      </Popover>
    ))
    await settle()
    const trigger = view.getByRole('button', { name: 'Controlled details' })
    expect(trigger).toHaveAttribute('aria-expanded', String(initial))
    expect(Boolean(view.queryByRole('dialog'))).toBe(initial)
    await userEvent.click(trigger)
    await settle()
    expect(changed.mock.calls).toEqual([[!initial]])
    expect(trigger).toHaveAttribute('aria-expanded', String(initial))
    expect(Boolean(view.queryByRole('dialog'))).toBe(initial)
    setOpen(!initial)
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', String(!initial))
    expect(Boolean(view.queryByRole('dialog'))).toBe(!initial)
    await userEvent.click(trigger)
    await settle()
    expect(changed.mock.calls).toEqual([[!initial], [initial]])
    expect(trigger).toHaveAttribute('aria-expanded', String(!initial))
  }
)

test('popover.roles.12: disabled native and generic hosts expose state, skip Tab, and ignore hover and clicks', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <>
      <button>Before disabled details</button>
      <Popover onOpenChange={changed}>
        <Popover.Trigger disabled>Disabled native</Popover.Trigger>
        <Popover.Trigger as="span" disabled>
          Disabled custom
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Disabled details">Details</Popover.Content>
        </Popover.Positioner>
      </Popover>
      <button>After disabled details</button>
    </>
  ))
  const native = view.getByRole('button', { name: 'Disabled native' })
  const custom = view.getByRole('button', { name: 'Disabled custom' })
  expect(native).toHaveAttribute('disabled')
  expect(custom).toHaveAttribute('aria-disabled', 'true')
  expect(custom).not.toHaveAttribute('disabled')
  for (const trigger of [native, custom]) {
    expect(trigger).toHaveAttribute('data-disabled')
    await userEvent.hover(trigger)
    await userEvent.click(trigger, { force: true })
    await settle()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(view.queryByRole('dialog')).toBeNull()
    expect(changed).not.toHaveBeenCalled()
  }
  view.getByRole('button', { name: 'Before disabled details' }).focus()
  await userEvent.tab()
  expect(view.getByRole('button', { name: 'After disabled details' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(view.getByRole('button', { name: 'Before disabled details' })).toHaveFocus()
})
