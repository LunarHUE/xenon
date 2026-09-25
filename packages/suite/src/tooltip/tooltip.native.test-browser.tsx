import { Tooltip } from '@xenon-ui/solid/tooltip'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

/**
 * Native-browser interaction coverage for Tooltip: the measured hover corridor in
 * both directions, focus/pointer delay precedence, native disabled triggers, and
 * scroll persistence. Geometry uses real layout; nothing mocks rects or focus.
 */

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

/** Trigger above, hoverable content below, with a genuine measured gap between them. */
function Corridor() {
  return (
    <Tooltip openDelay={0} closeDelay={60} hoverable>
      <Tooltip.Trigger style={{ display: 'inline-block', margin: '80px' }}>
        Corridor
      </Tooltip.Trigger>
      <Tooltip.Positioner side="bottom" sideOffset={40} flip={false}>
        <Tooltip.Content style={{ width: '180px', height: '80px', background: 'white' }}>
          Corridor detail
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  )
}
function leaveAcrossGap(from: DOMRect, to: DOMRect, origin: EventTarget) {
  const x = from.left + from.width / 2
  origin.dispatchEvent(
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
}

test('Tooltip hover corridor retains the tip when the pointer returns from content to its trigger', async () => {
  const m = mount(() => <Corridor />)
  const trigger = m.getByRole('button')
  await userEvent.hover(trigger)
  await settle()
  const content = m.getByRole('tooltip')
  const from = trigger.getBoundingClientRect()
  const to = content.getBoundingClientRect()
  const x = from.left + from.width / 2
  leaveAcrossGap(from, to, trigger)
  await settle(60)
  expect(content).toBeVisible()
  await userEvent.hover(content)
  await settle(60)
  // Reverse leg: leaving content must measure a corridor back to the trigger.
  content.dispatchEvent(
    new PointerEvent('pointerleave', { pointerType: 'mouse', clientX: x, clientY: to.top })
  )
  document.body.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      pointerType: 'mouse',
      clientX: x,
      clientY: (from.bottom + to.top) / 2,
    })
  )
  await settle(120)
  expect(content).toBeVisible()
  // Re-entering the trigger cancels the corridor idle expiry that fires at 300ms.
  trigger.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      pointerType: 'mouse',
      clientX: x,
      clientY: from.top + from.height / 2,
    })
  )
  await settle(450)
  expect(content).toBeVisible()
  expect(trigger).toHaveAttribute('aria-describedby', content.id)
})

test('Tooltip hover corridor expires while the pointer idles inside the measured gap', async () => {
  const m = mount(() => <Corridor />)
  const trigger = m.getByRole('button')
  await userEvent.hover(trigger)
  await settle()
  const content = m.getByRole('tooltip')
  const from = trigger.getBoundingClientRect()
  const to = content.getBoundingClientRect()
  leaveAcrossGap(from, to, trigger)
  await settle(120)
  expect(m.getByRole('tooltip')).toBeVisible()
  await settle(400)
  expect(m.queryByRole('tooltip')).toBeNull()
})

test('Tooltip focus during a pending hover delay opens immediately and outlives the hover deadline', async () => {
  const m = mount(() => (
    <Tooltip openDelay={500} closeDelay={60}>
      <Tooltip.Trigger>Focus precedence</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Shown at once</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  const trigger = m.getByRole('button')
  await userEvent.hover(trigger)
  await settle(120)
  expect(m.queryByRole('tooltip')).toBeNull()
  trigger.focus()
  await settle(60)
  const content = m.getByRole('tooltip')
  expect(content).toBeVisible()
  expect(content).toHaveAttribute('data-instant')
  await settle(600)
  expect(m.getByRole('tooltip')).toBeVisible()
})

test('Tooltip hover and focus retain the tip independently so closing waits for both to end', async () => {
  const m = mount(() => (
    <>
      <Tooltip openDelay={0} closeDelay={60} hoverable={false}>
        <Tooltip.Trigger>Dual intent</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Held by both</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <button style={{ position: 'fixed', left: '360px', top: '40px' }}>Elsewhere</button>
    </>
  ))
  const trigger = m.getByRole('button', { name: 'Dual intent' })
  await userEvent.hover(trigger)
  await settle()
  expect(m.getByRole('tooltip')).toBeVisible()
  trigger.focus()
  await settle()
  expect(m.getByRole('tooltip')).toBeVisible()
  trigger.blur()
  await settle(120)
  expect(m.getByRole('tooltip')).toBeVisible()
  await userEvent.hover(m.getByRole('button', { name: 'Elsewhere' }))
  await settle(150)
  expect(m.queryByRole('tooltip')).toBeNull()
})

test('Tooltip explains an aria-disabled trigger while a natively disabled control rejects pointer entry', async () => {
  const [blocked, setBlocked] = createSignal(true)
  const m = mount(() => (
    <>
      <Tooltip openDelay={0}>
        <Tooltip.Trigger aria-disabled="true">Accessibly disabled</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Explains itself</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip openDelay={0}>
        <Tooltip.Trigger disabled={blocked()}>Natively disabled</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Never shown</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </>
  ))
  const accessible = m.getByRole('button', { name: 'Accessibly disabled' })
  const native = m.getByRole('button', { name: 'Natively disabled' })
  expect(accessible).not.toHaveAttribute('disabled')
  accessible.focus()
  await settle()
  expect(accessible).toHaveFocus()
  expect(m.getByRole('tooltip')).toHaveTextContent('Explains itself')
  expect(accessible).toHaveAttribute('aria-describedby')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('tooltip')).toBeNull()
  // The browser suppresses real hover on disabled controls, so a synthetic
  // pointer entry is dispatched to prove the trigger still rejects it.
  expect(native).toHaveAttribute('disabled')
  native.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
  await settle()
  expect(m.queryByRole('tooltip')).toBeNull()
  setBlocked(false)
  flush()
  native.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }))
  await settle()
  expect(m.getByRole('tooltip')).toHaveTextContent('Never shown')
})

test('Tooltip stays open when its own hoverable content scrolls', async () => {
  const m = mount(() => (
    <Tooltip openDelay={0} closeDelay={60}>
      <Tooltip.Trigger style={{ margin: '60px' }}>Scroll owner</Tooltip.Trigger>
      <Tooltip.Positioner side="bottom" sideOffset={10} flip={false}>
        <Tooltip.Content
          style={{ width: '180px', height: '60px', overflow: 'auto', background: 'white' }}
        >
          <div style={{ height: '240px' }}>Scrollable explanation</div>
        </Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  await userEvent.hover(m.getByRole('button'))
  await settle()
  const content = m.getByRole('tooltip')
  expect(content.scrollHeight).toBeGreaterThan(content.clientHeight)
  content.scrollTop = 40
  await settle(120)
  expect(m.getByRole('tooltip')).toBeVisible()
  expect(m.getByRole('tooltip').scrollTop).toBeGreaterThan(0)
})
