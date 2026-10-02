import { HoverCard } from '@xenon-ui/solid/hover-card'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush, untrack } from 'solid-js'
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
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
function Outside() {
  return <button style={{ position: 'fixed', left: '8px', top: '8px' }}>Outside</button>
}
function Parts(props: { name: string }) {
  return (
    <>
      <HoverCard.Trigger href="#profile" style={{ display: 'inline-block', margin: '180px 80px' }}>
        {props.name}
      </HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content aria-label={props.name + ' details'} style={{ padding: '12px' }}>
          <button>Inside {props.name}</button>
        </HoverCard.Content>
      </HoverCard.Positioner>
    </>
  )
}

test('default-open cards mount silently and remain uncontrolled when the pointer leaves hover-card.state.1', async () => {
  const changes = vi.fn()
  const m = mount(() => (
    <>
      <Outside />
      <HoverCard defaultOpen openDelay={0} closeDelay={0} onOpenChange={changes}>
        <Parts name="Profile" />
      </HoverCard>
    </>
  ))
  await expect.poll(() => m.queryByRole('dialog', { name: 'Profile details' })).not.toBeNull()
  expect(changes).not.toHaveBeenCalled()
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await userEvent.hover(m.getByRole('button', { name: 'Outside' }))
  await expect.poll(() => m.queryByRole('dialog')).toBeNull()
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
})

test('controlled visibility wins over opposing defaults without mount callbacks hover-card.state.2 hover-card.state.5', async () => {
  const closedChanges = vi.fn()
  const openChanges = vi.fn()
  const m = mount(() => (
    <>
      <HoverCard open={false} defaultOpen onOpenChange={closedChanges}>
        <Parts name="Closed" />
      </HoverCard>
      <HoverCard open defaultOpen={false} onOpenChange={openChanges}>
        <Parts name="Open" />
      </HoverCard>
    </>
  ))
  await expect.poll(() => m.queryByRole('dialog', { name: 'Open details' })).not.toBeNull()
  expect(m.queryByRole('dialog', { name: 'Closed details' })).toBeNull()
  expect(m.getByRole('link', { name: 'Closed' })).toHaveAttribute('aria-expanded', 'false')
  expect(m.getByRole('link', { name: 'Open' })).toHaveAttribute('aria-expanded', 'true')
  expect(closedChanges).not.toHaveBeenCalled()
  expect(openChanges).not.toHaveBeenCalled()
})

test('two-way controlled Escape updates the binding, unmounts and permits external reopening hover-card.state.8', async () => {
  const [open, setOpen] = createSignal(true)
  const changes = vi.fn((next: boolean) => setOpen(next))
  const m = mount(() => (
    <HoverCard open={open()} onOpenChange={changes}>
      <Parts name="Profile" />
    </HoverCard>
  ))
  await expect.poll(() => m.queryByRole('dialog')).not.toBeNull()
  const original = m.getByRole('dialog')
  m.getByRole('button', { name: 'Inside Profile' }).focus()
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => m.queryByRole('dialog')).toBeNull()
  expect(untrack(open)).toBe(false)
  expect(original.isConnected).toBe(false)
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
  expect(m.getByRole('link', { name: 'Profile' })).toHaveFocus()
  setOpen(true)
  flush()
  await expect.poll(() => m.queryByRole('dialog')).not.toBeNull()
  expect(m.getByRole('dialog')).not.toBe(original)
  expect(untrack(open)).toBe(true)
  expect(changes).toHaveBeenCalledTimes(1)
})

test('force-mounted content survives pointer closure and reopens on a fresh native hover hover-card.state.9 hover-card.animation.3', async () => {
  const changes = vi.fn()
  const m = mount(() => (
    <>
      <Outside />
      <HoverCard forceMount openDelay={0} closeDelay={0} onOpenChange={changes}>
        <Parts name="Profile" />
      </HoverCard>
    </>
  ))
  const content = m.getByRole('dialog', { hidden: true })
  expect(content.isConnected).toBe(true)
  expect(content).not.toBeVisible()
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await expect.poll(() => m.queryByRole('dialog')).not.toBeNull()
  expect(m.getByRole('dialog')).toBe(content)
  await userEvent.hover(m.getByRole('button', { name: 'Outside' }))
  await expect.poll(() => m.queryByRole('dialog')).toBeNull()
  expect(content.isConnected).toBe(true)
  expect(content).not.toBeVisible()
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await expect.poll(() => m.queryByRole('dialog')).not.toBeNull()
  expect(m.getByRole('dialog')).toBe(content)
  expect(changes.mock.calls).toEqual([[true], [false], [true]])
})

test('dismissal policies retain the card until outside dismissal is reenabled hover-card.dismissal.3 hover-card.dismissal.4 hover-card.dismissal.5', async () => {
  const [dismissOutside, setDismissOutside] = createSignal(false)
  const changes = vi.fn()
  const m = mount(() => (
    <>
      <Outside />
      <HoverCard
        defaultOpen
        closeDelay={10000}
        closeOnEscape={false}
        closeOnOutside={dismissOutside()}
        onOpenChange={changes}
      >
        <Parts name="Profile" />
      </HoverCard>
    </>
  ))
  await expect.poll(() => m.queryByRole('dialog')).not.toBeNull()
  const content = m.getByRole('dialog')
  await userEvent.click(m.getByRole('button', { name: 'Inside Profile' }))
  await userEvent.keyboard('{Escape}')
  expect(content).toBeVisible()
  await userEvent.click(m.getByRole('button', { name: 'Outside' }))
  expect(content).toBeVisible()
  expect(changes).not.toHaveBeenCalled()
  setDismissOutside(true)
  flush()
  await userEvent.click(m.getByRole('button', { name: 'Outside' }))
  await expect.poll(() => m.queryByRole('dialog')).toBeNull()
  expect(changes).toHaveBeenCalledExactlyOnceWith(false)
})
