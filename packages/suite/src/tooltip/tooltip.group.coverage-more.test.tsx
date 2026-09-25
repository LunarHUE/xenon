import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { fireEvent, within } from '@testing-library/dom'
import { createSignal, flush, Show } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Tooltip } from '@xenon-ui/solid/tooltip'

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
  return within(container)
}

function enter(node: HTMLElement) {
  fireEvent.pointerEnter(node, { pointerType: 'mouse' })
  flush()
}

function leave(node: HTMLElement) {
  fireEvent.pointerLeave(node, { pointerType: 'mouse' })
  flush()
}

function tick(ms: number) {
  vi.advanceTimersByTime(ms)
  flush()
}

function openTooltips() {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="tooltip"][data-state="open"]'))
}

afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose())
  flush()
  vi.useRealTimers()
})

test('hover.pointer.14 enforces 1000ms opening, instant sibling swap, and 200ms final close', () => {
  vi.useFakeTimers()
  const view = mount(() => (
    <Tooltip.Provider openDelay={1000} closeDelay={200} skipDelay={1000} hoverable={false}>
      <Tooltip>
        <Tooltip.Trigger>First group trigger</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>First group tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger>Second group trigger</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Second group tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  const first = view.getByRole('button', { name: 'First group trigger' })
  const second = view.getByRole('button', { name: 'Second group trigger' })

  enter(first)
  tick(999)
  expect(openTooltips()).toHaveLength(0)
  tick(1)
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('First group tip')

  enter(second)
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('Second group tip')
  leave(second)
  tick(199)
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('Second group tip')
  tick(1)
  expect(openTooltips()).toHaveLength(0)
})

test('hover.pointer.15 keeps the warm window after an inactive consumer unmounts', () => {
  vi.useFakeTimers()
  const [showInactive, setShowInactive] = createSignal(true)
  const view = mount(() => (
    <Tooltip.Provider openDelay={1000} closeDelay={0} skipDelay={1000} hoverable={false}>
      <Tooltip>
        <Tooltip.Trigger>Warm owner</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Warm owner tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Show when={showInactive()}>
        <Tooltip>
          <Tooltip.Trigger>Inactive consumer</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Inactive tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Show>
      <Tooltip>
        <Tooltip.Trigger>Warm replacement</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Warm replacement tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  const owner = view.getByRole('button', { name: 'Warm owner' })
  enter(owner)
  tick(1000)
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('Warm owner tip')
  leave(owner)
  tick(1)
  setShowInactive(false)
  flush()
  enter(view.getByRole('button', { name: 'Warm replacement' }))
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('Warm replacement tip')
})

test('hover.pointer.15 keeps the warm window after the last closed consumer unmounts', () => {
  vi.useFakeTimers()
  const [showOwner, setShowOwner] = createSignal(true)
  const view = mount(() => (
    <Tooltip.Provider openDelay={1000} closeDelay={0} skipDelay={1000} hoverable={false}>
      <Show when={showOwner()}>
        <Tooltip>
          <Tooltip.Trigger>Last owner</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>Last owner tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Show>
      <Show when={!showOwner()}>
        <Tooltip>
          <Tooltip.Trigger>After unmount</Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>After unmount tip</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip>
      </Show>
    </Tooltip.Provider>
  ))
  enter(view.getByRole('button', { name: 'Last owner' }))
  tick(1000)
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('Last owner tip')
  leave(view.getByRole('button', { name: 'Last owner' }))
  tick(1)
  setShowOwner(false)
  flush()
  enter(view.getByRole('button', { name: 'After unmount' }))
  expect(openTooltips()).toHaveLength(1)
  expect(openTooltips()[0]).toHaveTextContent('After unmount tip')
})

test('hover.notes.7 leaves unrelated Tooltip DOM untouched when one group consumer changes', () => {
  vi.useFakeTimers()
  const [unrelatedProbe, setUnrelatedProbe] = createSignal(0)
  let getterCalls = 0
  const unrelatedProps = {
    get 'data-probe'() {
      getterCalls++
      return String(unrelatedProbe())
    },
  }
  const view = mount(() => (
    <Tooltip.Provider openDelay={0} closeDelay={0} skipDelay={0} hoverable={false}>
      <Tooltip>
        <Tooltip.Trigger>Reactive first</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Reactive first tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
      <Tooltip>
        <Tooltip.Trigger {...unrelatedProps}>Unrelated second</Tooltip.Trigger>
        <Tooltip.Positioner>
          <Tooltip.Content>Unrelated second tip</Tooltip.Content>
        </Tooltip.Positioner>
      </Tooltip>
    </Tooltip.Provider>
  ))
  const unrelated = view.getByRole('button', { name: 'Unrelated second' })
  const initialGetterCalls = getterCalls
  setUnrelatedProbe(1)
  flush()
  expect(getterCalls).toBeGreaterThan(initialGetterCalls)
  const getterCallsAfterOwnUpdate = getterCalls
  let unrelatedMutations = 0
  const observer = new MutationObserver(() => unrelatedMutations++)
  observer.observe(unrelated, { attributes: true, childList: true, subtree: true })
  enter(view.getByRole('button', { name: 'Reactive first' }))
  tick(1)
  return Promise.resolve().then(() => {
    observer.disconnect()
    expect(within(document.body).getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Reactive first tip'
    )
    expect(unrelatedMutations).toBe(0)
    expect(getterCalls).toBe(getterCallsAfterOwnUpdate)
    expect(unrelated).not.toHaveAttribute('aria-describedby')
  })
})
