import { Tooltip } from '@xenon/solid/tooltip'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

/**
 * Shared jsdom/browser coverage for Tooltip state and lifecycle: provider delay and
 * skip-delay isolation, controlled visibility, description-ID replacement, and
 * teardown of pending work. Timing boundaries use explicit real delays with wide
 * margins because the shared fixture must observe the popover presence lifecycle,
 * which settles on animation frames rather than on a fake timer queue.
 */

const cleanups: (() => void)[] = []

/** Renders a fixture into a fresh body container and returns container-scoped queries. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  // Keep the physical pointer away from synthetic hover fixtures.
  container.style.margin = '100px'
  document.body.append(container)
  const dispose = render(children, container)
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  return within(container)
}

/**
 * Flushes Solid, awaits two animation frames so presence can settle an exit, then
 * waits an optional real duration before a final flush. Open assertions wait past
 * the configured delay while mid-delay assertions run far below it.
 */
async function settle(ms = 0) {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  if (ms > 0) await new Promise<void>((resolve) => setTimeout(resolve, ms))
  flush()
}

/** Synthetic non-touch pointer entry: the modality the tooltip treats as hover. */
function enter(node: HTMLElement) {
  fireEvent.pointerEnter(node, { pointerType: 'mouse' })
  flush()
}

/** Synthetic non-touch pointer exit; fixtures opt out of the corridor so this closes. */
function leave(node: HTMLElement) {
  fireEvent.pointerLeave(node, { pointerType: 'mouse' })
  flush()
}

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
})

test('Group membership scopes single-open: a provider sibling closes the hovered tooltip while a separate group stays visible (tooltip.state.3)', async () => {
  const m = mount(() => (
    <>
      <Tooltip.Provider openDelay={0} closeDelay={0} skipDelay={0} hoverable={false}>
        <Tooltip>
          <Tooltip.Trigger>Grouped first</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Grouped first tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger>Grouped second</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Grouped second tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Tooltip.Provider>
      <Tooltip openDelay={0} closeDelay={0} hoverable={false}>
        <Tooltip.Trigger>Separate</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Separate tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </>
  ))
  const first = m.getByRole('button', { name: 'Grouped first' })
  const second = m.getByRole('button', { name: 'Grouped second' })
  const separate = m.getByRole('button', { name: 'Separate' })

  enter(first)
  await settle()
  const firstTip = m.getByRole('tooltip', { hidden: true })
  expect(firstTip).toHaveTextContent('Grouped first tip')
  expect(first).toHaveAttribute('aria-describedby', firstTip.id)

  // Focusing the grouped sibling claims the shared group, which requests closure of
  // the hovered predecessor; it drops that hover intent with the claim.
  second.focus()
  await settle()
  const secondTip = m.getByRole('tooltip', { hidden: true })
  expect(secondTip).toHaveTextContent('Grouped second tip')
  expect(second).toHaveAttribute('aria-describedby', secondTip.id)
  expect(m.queryByText('Grouped first tip')).toBeNull()
  expect(first).not.toHaveAttribute('aria-describedby')

  // A root without a provider owns its own coordinator, so opening it in a second
  // group leaves the grouped tooltip visible and still described.
  enter(separate)
  await settle()
  expect(
    m
      .getAllByRole('tooltip', { hidden: true })
      .map((tip) => tip.textContent)
      .sort()
  ).toEqual(['Grouped second tip', 'Separate tip'])
  expect(second).toHaveAttribute('aria-describedby', secondTip.id)
})

test('An isolated nested provider keeps its own warm window instead of inheriting the outer group delay state', async () => {
  const m = mount(() => (
    <Tooltip.Provider openDelay={400} closeDelay={0} skipDelay={5000} hoverable={false}>
      <Tooltip>
        <Tooltip.Trigger>Outer</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Outer tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip.Provider isolated>
        <Tooltip>
          <Tooltip.Trigger>Inner first</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Inner first tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger>Inner second</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Inner second tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Tooltip.Provider>
    </Tooltip.Provider>
  ))
  const outer = m.getByRole('button', { name: 'Outer' })
  const innerFirst = m.getByRole('button', { name: 'Inner first' })
  const innerSecond = m.getByRole('button', { name: 'Inner second' })

  // The inherited 400ms provider delay is honored, not skipped.
  enter(outer)
  await settle()
  expect(m.queryByText('Outer tip')).toBeNull()
  await settle(480)
  expect(m.getByText('Outer tip')).toBeInTheDocument()

  // Closing it starts the provider group's warm window.
  leave(outer)
  await settle()
  expect(m.queryByText('Outer tip')).toBeNull()

  // The isolated provider starts a fresh coordinator, so the warm outer group cannot
  // skip the inner delay; only the isolated group's own delay decides.
  enter(innerFirst)
  await settle()
  expect(m.queryByText('Inner first tip')).toBeNull()
  await settle(480)
  expect(m.getByText('Inner first tip')).toBeInTheDocument()

  // That coordinator still warms within itself: the isolated sibling opens with no wait.
  leave(innerFirst)
  await settle()
  expect(m.queryByText('Inner first tip')).toBeNull()
  enter(innerSecond)
  await settle()
  const tip = m.getByRole('tooltip', { hidden: true })
  expect(tip).toHaveTextContent('Inner second tip')
  expect(innerSecond).toHaveAttribute('aria-describedby', tip.id)
})

test('A controlled tooltip renders only the author value and reports interaction requests it refuses (tooltip.state.6)', async () => {
  const [open, setOpen] = createSignal(false)
  const changed = vi.fn()
  const m = mount(() => (
    <Tooltip open={open()} onOpenChange={changed} openDelay={0} closeDelay={0}>
      <Tooltip.Trigger>Controlled</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Controlled tip</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  const trigger = m.getByRole('button', { name: 'Controlled' })
  expect(m.queryByText('Controlled tip')).toBeNull()
  expect(trigger).not.toHaveAttribute('aria-describedby')

  // The author value alone renders it, with no interaction and no callback.
  setOpen(true)
  await settle()
  const tip = m.getByRole('tooltip', { hidden: true })
  expect(trigger).toHaveAttribute('aria-describedby', tip.id)
  expect(changed).not.toHaveBeenCalled()

  // Focus asks to open an already-visible tooltip, so the equal request changes nothing.
  trigger.focus()
  await settle()
  expect(m.getByRole('tooltip', { hidden: true })).toBe(tip)
  expect(changed).not.toHaveBeenCalled()

  // Blur asks to close; the request is reported but the controlled value still decides.
  trigger.blur()
  await settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(false)
  await settle()
  expect(m.getByRole('tooltip', { hidden: true })).toBe(tip)
  expect(trigger).toHaveAttribute('aria-describedby', tip.id)

  // Clearing the author value is the only thing that removes the rendered tooltip.
  setOpen(false)
  await settle()
  expect(m.queryByText('Controlled tip')).toBeNull()
  expect(trigger).not.toHaveAttribute('aria-describedby')
  expect(changed).toHaveBeenCalledExactlyOnceWith(false)
})

test('A controlled tooltip refuses a group closure request so both tooltips stay visible (tooltip.state.12)', async () => {
  const [alwaysOn, setAlwaysOn] = createSignal(false)
  const changed = vi.fn()
  const m = mount(() => (
    <Tooltip.Provider openDelay={0} closeDelay={0} hoverable={false}>
      <Tooltip open={alwaysOn()} onOpenChange={changed}>
        <Tooltip.Trigger>Always on</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Always on tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>Requests</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Requests tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  const first = m.getByRole('button', { name: 'Always on' })
  const requests = m.getByRole('button', { name: 'Requests' })

  // The author value alone renders the controlled root, with no interaction and no
  // callback, and it holds the group from then on.
  setAlwaysOn(true)
  await settle()
  const controlledTip = m.getByRole('tooltip', { hidden: true })
  expect(controlledTip).toHaveTextContent('Always on tip')
  expect(first).toHaveAttribute('aria-describedby', controlledTip.id)
  expect(changed).not.toHaveBeenCalled()

  // Opening the group sibling requests closure of its predecessor, which is reported
  // and refused, so two tooltips are visible at once.
  enter(requests)
  await settle()
  expect(changed).toHaveBeenCalledExactlyOnceWith(false)
  expect(first).toHaveAttribute('aria-describedby', controlledTip.id)
  expect(requests).toHaveAttribute('aria-describedby')
  expect(
    m
      .getAllByRole('tooltip', { hidden: true })
      .map((tip) => tip.textContent)
      .sort()
  ).toEqual(['Always on tip', 'Requests tip'])

  // The requesting root still closes normally, leaving only the controlled tooltip.
  leave(requests)
  await settle()
  expect(m.getAllByRole('tooltip', { hidden: true })).toHaveLength(1)
  expect(m.getByText('Always on tip')).toBeInTheDocument()
  expect(requests).not.toHaveAttribute('aria-describedby')
})

test('Removing the active trigger of a shared tooltip closes it and no sibling takes over the open state (tooltip.state.10)', async () => {
  const handle = Tooltip.createHandle<string>()
  const [firstMounted, setFirstMounted] = createSignal(true)
  const m = mount(() => (
    <>
      <Show when={firstMounted()}>
        <Tooltip.Trigger handle={handle} payload="First payload">
          First
        </Tooltip.Trigger>
      </Show>
      <Tooltip.Trigger handle={handle} payload="Second payload">
        Second
      </Tooltip.Trigger>
      <Tooltip handle={handle} openDelay={0} closeDelay={0} hoverable={false}>
        {(state) => (
          <Tooltip.Positioner>
            <Tooltip.Content>{state.payload}</Tooltip.Content>
          </Tooltip.Positioner>
        )}
      </Tooltip>
    </>
  ))
  const first = m.getByRole('button', { name: 'First' })
  const second = m.getByRole('button', { name: 'Second' })

  enter(first)
  await settle()
  const tip = m.getByRole('tooltip', { hidden: true })
  expect(tip).toHaveTextContent('First payload')
  expect(first).toHaveAttribute('aria-describedby', tip.id)
  expect(second).not.toHaveAttribute('aria-describedby')

  // Unmounting the active trigger closes the shared tooltip instead of migrating the
  // open state to the remaining trigger.
  setFirstMounted(false)
  await settle()
  expect(m.queryByRole('tooltip', { hidden: true })).toBeNull()
  expect(second).not.toHaveAttribute('aria-describedby')

  // The shared root still serves the remaining trigger with its own payload.
  enter(second)
  await settle()
  const nextTip = m.getByRole('tooltip', { hidden: true })
  expect(nextTip).toHaveTextContent('Second payload')
  expect(second).toHaveAttribute('aria-describedby', nextTip.id)
  expect(m.getAllByRole('tooltip', { hidden: true })).toHaveLength(1)
})

test('Teardown during an open delay discards the pending open for the trigger and for the whole tooltip', async () => {
  const [triggerMounted, setTriggerMounted] = createSignal(true)
  const [rootMounted, setRootMounted] = createSignal(true)
  const changed = vi.fn()
  const m = mount(() => (
    <Show when={rootMounted()}>
      <Tooltip
        openDelay={400}
        closeDelay={0}
        skipDelay={0}
        hoverable={false}
        onOpenChange={changed}
      >
        <Show when={triggerMounted()}>
          <Tooltip.Trigger>Pending</Tooltip.Trigger>
        </Show>
        <Tooltip.Positioner>
          <Tooltip.Content>Pending tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Show>
  ))

  // Removing the hovered trigger inside the delay ends the hover intent without a
  // pointer-out, so the pending tooltip never opens and nothing is reported.
  enter(m.getByRole('button', { name: 'Pending' }))
  await settle()
  expect(m.queryByText('Pending tip')).toBeNull()
  setTriggerMounted(false)
  await settle()
  await settle(480)
  expect(m.queryByRole('button', { name: 'Pending' })).toBeNull()
  expect(m.queryByText('Pending tip')).toBeNull()
  expect(changed).not.toHaveBeenCalled()

  // A remounted trigger measures the whole delay again instead of inheriting the
  // discarded request, and reports the opening it actually performs.
  setTriggerMounted(true)
  await settle()
  enter(m.getByRole('button', { name: 'Pending' }))
  await settle()
  expect(m.queryByText('Pending tip')).toBeNull()
  await settle(480)
  expect(m.getByText('Pending tip')).toBeInTheDocument()
  expect(changed).toHaveBeenCalledExactlyOnceWith(true)

  // Unmounting the whole root during a fresh delay discards that pending open too,
  // adding neither a rendered tooltip nor a late change report.
  leave(m.getByRole('button', { name: 'Pending' }))
  await settle()
  expect(m.queryByText('Pending tip')).toBeNull()
  expect(changed.mock.calls).toEqual([[true], [false]])
  enter(m.getByRole('button', { name: 'Pending' }))
  await settle()
  setRootMounted(false)
  await settle(480)
  expect(m.queryByText('Pending tip')).toBeNull()
  expect(changed.mock.calls).toEqual([[true], [false]])
})

test('Replacing the tooltip content ID while open re-points the trigger description to the live element', async () => {
  const [contentId, setContentId] = createSignal<string | undefined>('first-tip')
  const m = mount(() => (
    <Tooltip openDelay={0} closeDelay={0}>
      <span id="author-hint">Author hint</span>
      <Tooltip.Trigger aria-describedby="author-hint">Explain</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content id={contentId()}>Explain tip</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  const trigger = m.getByRole('button', { name: 'Explain' })

  trigger.focus()
  await settle()
  const tip = m.getByRole('tooltip', { hidden: true })
  expect(tip.id).toBe('first-tip')
  expect(trigger.getAttribute('aria-describedby')).toBe('author-hint first-tip')
  expect(document.getElementById('first-tip')).toBe(tip)

  // The association follows the replaced ID and keeps the host element, so no stale
  // reference to the previous ID remains described or resolvable.
  setContentId('second-tip')
  await settle()
  expect(m.getByRole('tooltip', { hidden: true })).toBe(tip)
  expect(tip.id).toBe('second-tip')
  expect(trigger.getAttribute('aria-describedby')).toBe('author-hint second-tip')
  expect(document.getElementById('second-tip')).toBe(tip)
  expect(document.getElementById('first-tip')).toBeNull()

  // Dropping the author ID falls back to the generated description, still resolvable.
  setContentId(undefined)
  await settle()
  expect(tip.id).not.toBe('second-tip')
  expect(trigger.getAttribute('aria-describedby')).toBe(`author-hint ${tip.id}`)
  expect(document.getElementById(tip.id)).toBe(tip)
})

test('Disabling a root gates visibility without rewriting authored state, and re-enabling restores it until the next leave', async () => {
  const [disabled, setDisabled] = createSignal(false)
  const changed = vi.fn()
  const m = mount(() => (
    <Tooltip
      disabled={disabled()}
      onOpenChange={changed}
      openDelay={0}
      closeDelay={0}
      hoverable={false}
    >
      <Tooltip.Trigger>Gate</Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>Gate tip</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip>
  ))
  const trigger = m.getByRole('button', { name: 'Gate' })

  enter(trigger)
  await settle()
  const tip = m.getByRole('tooltip', { hidden: true })
  expect(trigger).toHaveAttribute('aria-describedby', tip.id)
  expect(changed.mock.calls).toEqual([[true]])

  // The display gate hides the tooltip and drops the description without reporting a
  // visibility change of its own.
  setDisabled(true)
  await settle()
  expect(m.queryByText('Gate tip')).toBeNull()
  expect(trigger).not.toHaveAttribute('aria-describedby')
  expect(changed.mock.calls).toEqual([[true]])

  // Re-enabling restores the visibility the trigger already asked for.
  setDisabled(false)
  await settle()
  const restored = m.getByRole('tooltip', { hidden: true })
  expect(restored).toHaveTextContent('Gate tip')
  expect(trigger).toHaveAttribute('aria-describedby', restored.id)
  expect(changed.mock.calls).toEqual([[true]])

  // The restored tooltip is an ordinary open state that closes on the next exit.
  leave(trigger)
  await settle()
  expect(m.queryByText('Gate tip')).toBeNull()
  expect(trigger).not.toHaveAttribute('aria-describedby')
  expect(changed.mock.calls).toEqual([[true], [false]])
})
