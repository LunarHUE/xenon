import { HoverCard } from '@xenon-ui/solid/hover-card'
import { Dialog } from '@xenon-ui/solid/dialog'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'

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
  return { container, ...within(document.body) }
}
async function settle(time = 70) {
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, time))
  flush()
}
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
})

test('HoverCard preserves link navigation semantics, opens on hover without autofocus, and passes axe', async () => {
  const m = mount(() => (
    <>
      <button>Outside</button>
      <HoverCard openDelay={30}>
        <HoverCard.Trigger href="#profile">Profile</HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Positioner sideOffset={12}>
            <HoverCard.Content
              aria-label="Profile details"
              style={{ padding: '12px', background: 'white' }}
            >
              <HoverCard.Viewport>
                <a href="#full-profile">Full profile</a>
              </HoverCard.Viewport>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </HoverCard.Portal>
      </HoverCard>
    </>
  ))
  const trigger = m.getByRole('link', { name: 'Profile' })
  const outside = m.getByRole('button', { name: 'Outside' })
  outside.focus()
  await expectNoViolations(m.container)
  await userEvent.hover(trigger)
  await settle()
  const content = m.getByRole('dialog', { name: 'Profile details' })
  expect(content.parentElement!.matches(':popover-open')).toBe(true)
  expect(trigger).toHaveAttribute('href', '#profile')
  expect(trigger).toHaveAttribute('aria-controls', content.id)
  expect(outside).toHaveFocus()
  expect(content).not.toHaveAttribute('aria-modal')
  await expectNoViolations(document.body)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
  expect(outside).toHaveFocus()
})

test('HoverCard delays keyboard focus, retains focus inside, and Escape returns to its link without reopening', async () => {
  const m = mount(() => (
    <HoverCard openDelay={100} closeDelay={30}>
      <HoverCard.Trigger href="#profile">Profile</HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Positioner>
          <HoverCard.Content aria-label="Profile details">
            <button>Inside</button>
          </HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard.Portal>
    </HoverCard>
  ))
  const trigger = m.getByRole('link', { name: 'Profile' })
  trigger.focus()
  await settle(30)
  expect(m.queryByRole('dialog')).toBeNull()
  await settle(120)
  expect(trigger).toHaveFocus()
  m.getByRole('button', { name: 'Inside' }).focus()
  await settle(150)
  expect(m.getByRole('dialog')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await settle(200)
  expect(m.queryByRole('dialog')).toBeNull()
  expect(trigger).toHaveFocus()
})

test('HoverCard measures safe travel over a real gap and retains hovered content', async () => {
  const m = mount(() => (
    <HoverCard openDelay={0} closeDelay={40}>
      <HoverCard.Trigger href="#profile" style={{ display: 'inline-block', margin: '80px' }}>
        Profile
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Positioner side="bottom" sideOffset={40}>
          <HoverCard.Content
            aria-label="Profile details"
            style={{ width: '180px', height: '80px', background: 'white' }}
          >
            Details
          </HoverCard.Content>
        </HoverCard.Positioner>
      </HoverCard.Portal>
    </HoverCard>
  ))
  const trigger = m.getByRole('link')
  await userEvent.hover(trigger)
  await settle()
  const content = m.getByRole('dialog')
  const from = trigger.getBoundingClientRect()
  const to = content.getBoundingClientRect()
  const x = from.left + from.width / 2
  trigger.dispatchEvent(
    new PointerEvent('pointerleave', { pointerType: 'mouse', clientX: x, clientY: from.bottom })
  )
  document.body.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      pointerType: 'mouse',
      clientX: x,
      clientY: (from.bottom + to.top) / 2,
    })
  )
  await settle(100)
  expect(content).toBeVisible()
  await userEvent.hover(content)
  await settle(380)
  expect(content).toBeVisible()
  await userEvent.hover(trigger)
  await settle(100)
  expect(content).toBeVisible()
  trigger.dispatchEvent(
    new PointerEvent('pointerleave', { pointerType: 'mouse', clientX: x, clientY: from.bottom })
  )
  document.body.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 0, clientY: 0 })
  )
  await settle(80)
  expect(m.queryByRole('dialog')).toBeNull()
})

test('HoverCard detached payload triggers reanchor the same native content', async () => {
  const handle = HoverCard.createHandle<string>()
  const m = mount(() => (
    <>
      <HoverCard.Trigger handle={handle} payload="Ada" href="#ada" style={{ margin: '30px' }}>
        Ada
      </HoverCard.Trigger>
      <HoverCard.Trigger handle={handle} payload="Grace" href="#grace" style={{ margin: '100px' }}>
        Grace
      </HoverCard.Trigger>
      <HoverCard handle={handle} openDelay={0}>
        {(state) => (
          <HoverCard.Portal>
            <HoverCard.Positioner align="start">
              <HoverCard.Content aria-label="Person">
                <HoverCard.Viewport>{state.payload}</HoverCard.Viewport>
              </HoverCard.Content>
            </HoverCard.Positioner>
          </HoverCard.Portal>
        )}
      </HoverCard>
    </>
  ))
  await userEvent.hover(m.getByRole('link', { name: 'Ada' }))
  await settle()
  const content = m.getByRole('dialog')
  const first = content.getBoundingClientRect().x
  await userEvent.hover(m.getByRole('link', { name: 'Grace' }))
  await settle()
  expect(m.getByRole('dialog')).toBe(content)
  expect(content).toHaveTextContent('Grace')
  expect(content.getBoundingClientRect().x).toBeGreaterThan(first + 30)
})

test('HoverCard portal stays inside its native modal ancestor and is interactive', async () => {
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Parent dialog">
        <HoverCard openDelay={0}>
          <HoverCard.Trigger href="#profile">Profile</HoverCard.Trigger>
          <HoverCard.Portal>
            <HoverCard.Positioner>
              <HoverCard.Content aria-label="Profile details">
                <button>Preview action</button>
              </HoverCard.Content>
            </HoverCard.Positioner>
          </HoverCard.Portal>
        </HoverCard>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  await userEvent.hover(m.getByRole('link', { name: 'Profile' }))
  await settle()
  const content = m.getByRole('dialog', { name: 'Profile details' })
  expect(content.closest('dialog')).toBeTruthy()
  m.getByRole('button', { name: 'Preview action' }).focus()
  expect(m.getByRole('button', { name: 'Preview action' })).toHaveFocus()
})
