import { Tooltip } from '@tenon/solid/tooltip'
import { Dialog } from '@tenon/solid/dialog'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
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

test('Tooltip focus opens immediately with description semantics and leaves focus on the trigger', async () => {
  const m = mount(() => (
    <Tooltip openDelay={1000}>
      <span id="existing-description">Existing description</span>
      <Tooltip.Trigger aria-describedby="existing-description">Save</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Content id="save-tooltip">Save the document</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip>
  ))
  const trigger = m.getByRole('button', { name: 'Save' })
  expect(trigger).not.toHaveAttribute('aria-expanded')
  expect(trigger).not.toHaveAttribute('aria-haspopup')
  trigger.focus()
  await settle()
  const content = m.getByRole('tooltip')
  expect(content).toBeVisible()
  expect(content.parentElement!.matches(':popover-open')).toBe(true)
  expect(trigger).toHaveAttribute('aria-describedby', 'existing-description save-tooltip')
  expect(trigger).toHaveFocus()
  expect(content).not.toHaveAttribute('tabindex')
  expect(content).toHaveAttribute('data-instant')
  await expectNoViolations(document.body)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('tooltip')).toBeNull()
  expect(trigger).toHaveAttribute('aria-describedby', 'existing-description')
  expect(trigger).toHaveFocus()
})

test('Tooltip hover does not move outside focus and native trigger activation still runs', async () => {
  let activated = 0
  const m = mount(() => (
    <>
      <button>Outside</button>
      <Tooltip openDelay={0}>
        <Tooltip.Trigger onClick={() => activated++}>Save</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Content>Save the document</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip>
    </>
  ))
  const outside = m.getByRole('button', { name: 'Outside' })
  outside.focus()
  const trigger = m.getByRole('button', { name: 'Save' })
  await userEvent.hover(trigger)
  await settle()
  expect(m.getByRole('tooltip')).toBeVisible()
  expect(outside).toHaveFocus()
  await userEvent.click(trigger)
  await settle()
  expect(activated).toBe(1)
  expect(m.queryByRole('tooltip')).toBeNull()
})

test('Tooltip safe corridor crosses measured gap and hoverable content retains the description', async () => {
  const m = mount(() => (
    <Tooltip openDelay={0} closeDelay={40} hoverable>
      <Tooltip.Trigger style={{ margin: '80px' }}>Explain</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={40}>
          <Tooltip.Content style={{ width: '180px', height: '80px', background: 'white' }}>
            Explanation
          </Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip>
  ))
  const trigger = m.getByRole('button')
  await userEvent.hover(trigger)
  await settle()
  const content = m.getByRole('tooltip')
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
  content.dispatchEvent(
    new PointerEvent('pointerleave', { pointerType: 'mouse', clientX: to.left, clientY: to.bottom })
  )
  document.body.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: 0, clientY: 0 })
  )
  await settle(80)
  expect(m.queryByRole('tooltip')).toBeNull()
})

test('Tooltip nested in a native dialog consumes Escape first and its portal keeps modal ancestry', async () => {
  const m = mount(() => (
    <Dialog defaultOpen>
      <Dialog.Content aria-label="Preferences">
        <button>First control</button>
        <Tooltip openDelay={0}>
          <Tooltip.Trigger>Help</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner>
              <Tooltip.Content>Preference help</Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip>
      </Dialog.Content>
    </Dialog>
  ))
  await settle()
  const first = m.getByRole('button', { name: 'First control' })
  first.focus()
  await userEvent.hover(m.getByRole('button', { name: 'Help' }))
  await settle()
  expect(m.getByRole('tooltip').closest('dialog')).toBeTruthy()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('tooltip')).toBeNull()
  expect(m.getByRole('dialog', { name: 'Preferences' })).toBeVisible()
  expect(first).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog')).toBeNull()
})

test('Tooltip shared payload switches within the same native content and viewport', async () => {
  const handle = Tooltip.createHandle<{ detail: string }>()
  const m = mount(() => (
    <>
      <Tooltip.Trigger
        handle={handle}
        payload={{ detail: 'First detail' }}
        style={{ margin: '20px' }}
      >
        First
      </Tooltip.Trigger>
      <Tooltip.Trigger
        handle={handle}
        payload={{ detail: 'Second detail' }}
        style={{ margin: '120px' }}
      >
        Second
      </Tooltip.Trigger>
      <Tooltip handle={handle} openDelay={0}>
        {(state) => (
          <Tooltip.Portal>
            <Tooltip.Positioner align="start">
              <Tooltip.Content>
                <Tooltip.Viewport>{state.payload?.detail}</Tooltip.Viewport>
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip>
    </>
  ))
  await userEvent.hover(m.getByRole('button', { name: 'First' }))
  await settle()
  const content = m.getByRole('tooltip')
  const viewport = content.querySelector('[data-part="viewport"]')
  const firstX = content.getBoundingClientRect().x
  await userEvent.hover(m.getByRole('button', { name: 'Second' }))
  await settle()
  expect(m.getByRole('tooltip')).toBe(content)
  expect(content.querySelector('[data-part="viewport"]')).toBe(viewport)
  expect(content).toHaveTextContent('Second detail')
  expect(content.getBoundingClientRect().x).toBeGreaterThan(firstX + 30)
  expect(m.getByRole('button', { name: 'First' })).not.toHaveAttribute('aria-describedby')
  expect(m.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-describedby', content.id)
})

test('Tooltip nested providers inherit warm delay sharing while explicit zero and false override defaults', async () => {
  const m = mount(() => (
    <Tooltip.Provider openDelay={220} closeDelay={0} skipDelay={1000} hoverable>
      <Tooltip style={{ display: 'inline-block', margin: '30px' }}>
        <Tooltip.Trigger>First</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>First tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip.Provider closeOnPress={false}>
        <Tooltip style={{ display: 'inline-block', margin: '30px' }}>
          <Tooltip.Trigger>Second</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Second tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Tooltip.Provider>
      <Tooltip.Provider isolated openDelay={0} hoverable={false}>
        <Tooltip style={{ display: 'inline-block', margin: '30px' }}>
          <Tooltip.Trigger>Instant</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Instant tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Tooltip.Provider>
    </Tooltip.Provider>
  ))
  await userEvent.hover(m.getByRole('button', { name: 'First' }))
  await settle(60)
  expect(m.queryByRole('tooltip')).toBeNull()
  await settle(220)
  expect(m.getByRole('tooltip')).toHaveTextContent('First tip')
  await userEvent.hover(m.getByRole('button', { name: 'Second' }))
  await settle(60)
  expect(m.getByRole('tooltip')).toHaveTextContent('Second tip')
  expect(m.getByRole('tooltip')).toHaveAttribute('data-instant')
  await userEvent.click(m.getByRole('button', { name: 'Second' }))
  await settle()
  expect(m.getByRole('tooltip')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await settle()
  await userEvent.hover(m.getByRole('button', { name: 'First' }))
  await settle(60)
  expect(m.getByRole('tooltip')).toHaveTextContent('First tip')
  expect(m.getByRole('tooltip')).toHaveAttribute('data-instant')
  await userEvent.keyboard('{Escape}')
  await settle()
  await userEvent.hover(m.getByRole('button', { name: 'Instant' }))
  await settle(60)
  expect(m.getByRole('tooltip')).toHaveTextContent('Instant tip')
  expect(getComputedStyle(m.getByRole('tooltip')).pointerEvents).toBe('none')
})

test('Tooltip initially open anchors its trigger and scrolling that ancestor dismisses it', async () => {
  const m = mount(() => (
    <div data-scroll-region style={{ height: '150px', overflow: 'auto' }}>
      <Tooltip defaultOpen>
        <Tooltip.Trigger style={{ margin: '40px' }}>Initially open</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Content>Initial detail</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip>
      <div style={{ height: '600px' }} />
    </div>
  ))
  await settle()
  const content = m.getByRole('tooltip')
  expect(content).toBeVisible()
  const triggerRect = m.getByRole('button').getBoundingClientRect()
  expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(triggerRect.bottom - 1)
  const scroll = m.container.querySelector<HTMLElement>('[data-scroll-region]')!
  scroll.scrollTop = 60
  await settle(150)
  expect(m.queryByRole('tooltip')).toBeNull()
})

test('Tooltip hoverable false lets the underlying control receive a click through its visible wrapper', async () => {
  let clicks = 0
  const m = mount(() => (
    <div>
      <Tooltip openDelay={0} closeDelay={1000} hoverable={false} closeOnPress={false}>
        <Tooltip.Trigger
          style={{ position: 'fixed', left: '150px', top: '40px', width: '100px', height: '30px' }}
        >
          Explain overlay
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner side="bottom" sideOffset={10} flip={false}>
            <Tooltip.Content style={{ width: '160px', height: '70px', background: 'white' }}>
              Visible explanation
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip>
      <button
        onClick={() => clicks++}
        style={{ position: 'fixed', left: '120px', top: '80px', width: '160px', height: '70px' }}
      >
        Underlying control
      </button>
    </div>
  ))
  await userEvent.hover(m.getByRole('button', { name: 'Explain overlay' }))
  await settle()
  const content = m.getByRole('tooltip')
  expect(content).toBeVisible()
  const rect = content.getBoundingClientRect()
  const underneath = m.getByRole('button', { name: 'Underlying control' })
  expect(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)).toBe(
    underneath
  )
  await userEvent.click(underneath)
  expect(clicks).toBe(1)
})

test('Tooltip warm reopening survives a backwards wall-clock adjustment', async () => {
  const m = mount(() => (
    <Tooltip.Provider openDelay={220} closeDelay={0} skipDelay={1000}>
      <Tooltip style={{ display: 'inline-block', margin: '30px' }}>
        <Tooltip.Trigger>Clock first</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>First clock tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>Clock second</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Second clock tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  await userEvent.hover(m.getByRole('button', { name: 'Clock first' }))
  await settle(260)
  expect(m.getByRole('tooltip')).toHaveTextContent('First clock tip')
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('tooltip')).toBeNull()
  const wallClock = Date.now.bind(Date)
  const clock = vi.spyOn(Date, 'now').mockImplementation(() => wallClock() - 5000)
  try {
    await userEvent.hover(m.getByRole('button', { name: 'Clock second' }))
    await settle(60)
    expect(m.getByRole('tooltip')).toHaveTextContent('Second clock tip')
    expect(m.getByRole('tooltip')).toHaveAttribute('data-instant')
  } finally {
    clock.mockRestore()
  }
})
