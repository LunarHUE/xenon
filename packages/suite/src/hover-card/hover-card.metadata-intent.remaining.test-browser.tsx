import { HoverCard } from '@xenon-ui/solid/hover-card'
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

function Outside() {
  return (
    <button type="button" style={{ position: 'fixed', left: '8px', top: '8px' }}>
      Outside
    </button>
  )
}

function preview(closeDelay = 0) {
  return mount(() => (
    <>
      <Outside />
      <HoverCard openDelay={0} closeDelay={closeDelay}>
        <HoverCard.Trigger
          id="intent-profile"
          href="#profile"
          style={{ display: 'inline-block', margin: '180px 80px' }}
        >
          Profile
        </HoverCard.Trigger>
        <HoverCard.Positioner side="bottom" align="start" sideOffset={12}>
          <HoverCard.Content
            id="intent-profile-card"
            aria-label="Profile details"
            style={{ padding: '12px' }}
          >
            <button type="button">Inside action</button>
          </HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard>
    </>
  ))
}

async function wait(time: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, time))
  flush()
}

test('hover-card.roles.1 hover-card.roles.2 hover-card.roles.4 hover-card.roles.8 native hover synchronizes author IDs and positioned metadata', async () => {
  const view = preview()
  const trigger = view.getByRole('link', { name: 'Profile' })
  await userEvent.hover(view.getByRole('button', { name: 'Outside' }))
  expect(trigger.id).toBe('intent-profile')
  expect(trigger).toHaveAttribute('data-state', 'closed')
  expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).not.toHaveAttribute('aria-controls')
  await userEvent.hover(trigger)
  await expect.poll(() => view.queryByRole('dialog', { name: 'Profile details' })).not.toBeNull()
  const content = view.getByRole('dialog', { name: 'Profile details' })
  expect(content.id).toBe('intent-profile-card')
  expect(trigger).toHaveAttribute('data-state', 'open')
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-controls', content.id)
  expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toBe(content)
  expect(content).toHaveAttribute('data-state', 'open')
  await expect.poll(() => content.getAttribute('data-side')).toBe('bottom')
  expect(content).toHaveAttribute('data-placement', 'bottom-start')
  await userEvent.hover(view.getByRole('button', { name: 'Outside' }))
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('data-state', 'closed')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(trigger).not.toHaveAttribute('aria-controls')
})

function shared(openDelay: number) {
  const handle = HoverCard.createHandle<string>()
  return mount(() => (
    <>
      <Outside />
      <HoverCard.Trigger
        handle={handle}
        payload="Ada"
        href="#ada"
        style={{ display: 'inline-block', margin: '100px 40px' }}
      >
        Ada
      </HoverCard.Trigger>
      <HoverCard.Trigger
        handle={handle}
        payload="Grace"
        href="#grace"
        style={{ display: 'inline-block', margin: '100px 40px' }}
      >
        Grace
      </HoverCard.Trigger>
      <HoverCard handle={handle} openDelay={openDelay} closeDelay={0}>
        {(state) => (
          <HoverCard.Positioner>
            <HoverCard.Content aria-label="Person details">
              <p>{state.payload}</p>
              <button type="button">Inside person</button>
            </HoverCard.Content>
          </HoverCard.Positioner>
        )}
      </HoverCard>
    </>
  ))
}

test('hover-card.roles.7 and hover-card.focus.2 native Tab switches shared focus payload and current marker without remounting', async () => {
  const view = shared(200)
  const first = view.getByRole('link', { name: 'Ada' })
  const second = view.getByRole('link', { name: 'Grace' })
  await userEvent.hover(view.getByRole('button', { name: 'Outside' }))
  first.focus()
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  const content = view.getByRole('dialog')
  expect(content).toHaveTextContent('Ada')
  expect(first).toHaveAttribute('data-current')
  expect(second).not.toHaveAttribute('data-current')
  await userEvent.tab()
  expect(second).toHaveFocus()
  expect(view.getByRole('dialog')).toBe(content)
  expect(content).toHaveTextContent('Grace')
  expect(first).not.toHaveAttribute('data-current')
  expect(second).toHaveAttribute('data-current')
  await userEvent.hover(first)
  expect(first).toHaveAttribute('data-current')
  expect(second).not.toHaveAttribute('data-current')
  await userEvent.hover(second)
  expect(first).not.toHaveAttribute('data-current')
  expect(second).toHaveAttribute('data-current')
  expect(view.getByRole('dialog')).toBe(content)
})

test('hover-card.focus.10 pointer intent retains an open preview after trigger focus then blur', async () => {
  const view = preview()
  const trigger = view.getByRole('link', { name: 'Profile' })
  const outside = view.getByRole('button', { name: 'Outside' })
  await userEvent.hover(trigger)
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  const content = view.getByRole('dialog')
  trigger.focus()
  expect(trigger).toHaveFocus()
  outside.focus()
  flush()
  expect(outside).toHaveFocus()
  expect(view.getByRole('dialog')).toBe(content)
  expect(trigger).toHaveAttribute('data-state', 'open')
  await userEvent.hover(outside)
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
})

test('hover-card.focus.11 Escape suppresses restored focus reopening but a different shared trigger reopens', async () => {
  const view = shared(0)
  const first = view.getByRole('link', { name: 'Ada' })
  const second = view.getByRole('link', { name: 'Grace' })
  await userEvent.hover(view.getByRole('button', { name: 'Outside' }))
  first.focus()
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  view.getByRole('button', { name: 'Inside person' }).focus()
  await userEvent.keyboard('{Escape}')
  await expect.poll(() => view.queryByRole('dialog')).toBeNull()
  expect(first).toHaveFocus()
  expect(first).toHaveAttribute('data-state', 'closed')
  second.focus()
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  expect(view.getByRole('dialog')).toHaveTextContent('Grace')
  expect(second).toHaveAttribute('data-current')
  expect(first).not.toHaveAttribute('data-current')
})

test('hover-card.pointer.18 synthetic touch pointerup leaves the trigger closed after 100ms', async () => {
  const view = preview()
  const trigger = view.getByRole('link', { name: 'Profile' })
  await userEvent.hover(view.getByRole('button', { name: 'Outside' }))
  trigger.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }))
  await wait(100)
  expect(view.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('data-state', 'closed')
})

test('hover-card.pointer.22 native hover on a disabled button trigger never opens its card', async () => {
  const changed = vi.fn()
  const view = mount(() => (
    <>
      <Outside />
      <HoverCard openDelay={0} closeDelay={0} onOpenChange={changed}>
        <HoverCard.Trigger as="button" type="button" disabled style={{ margin: '180px 80px' }}>
          Disabled preview
        </HoverCard.Trigger>
        <HoverCard.Positioner>
          <HoverCard.Content aria-label="Disabled details">No preview</HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard>
    </>
  ))
  const trigger = view.getByRole('button', { name: 'Disabled preview' })
  expect(trigger).toBeDisabled()
  await userEvent.hover(trigger)
  await wait(100)
  expect(view.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveAttribute('data-state', 'closed')
  expect(changed).not.toHaveBeenCalled()
})

test('hover-card.pointer.3 resting the native pointer on an inner control retains the preview past its close delay', async () => {
  const view = preview(120)
  await userEvent.hover(view.getByRole('link', { name: 'Profile' }))
  await expect.poll(() => view.queryByRole('dialog')).not.toBeNull()
  const content = view.getByRole('dialog')
  await userEvent.hover(view.getByRole('button', { name: 'Inside action' }))
  await wait(200)
  expect(view.getByRole('dialog')).toBe(content)
  expect(content).toBeVisible()
})
