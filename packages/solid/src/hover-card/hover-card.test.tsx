import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { HoverCard } from './hover-card'

function pointer(element: Element, type: string, pointerType = 'mouse') {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  element.dispatchEvent(event)
  flush()
}
function advance(time: number) {
  vi.advanceTimersByTime(time)
  flush()
}
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

test('default anchor retains href and opens after 600ms, with cancelable hover intent', () => {
  vi.useFakeTimers()
  const change = vi.fn()
  const m = render(() => (
    <HoverCard onOpenChange={change}>
      <HoverCard.Trigger href="#destination">Preview</HoverCard.Trigger>
      <HoverCard.Trigger onPointerEnter={(event) => event.preventDefault()}>Veto</HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content aria-label="Preview details" />
      </HoverCard.Positioner>
    </HoverCard>
  ))
  const trigger = m.getByText('Preview')
  expect(trigger.tagName).toBe('A')
  expect(trigger).toHaveAttribute('href', '#destination')
  pointer(m.getByText('Veto'), 'pointerenter')
  advance(700)
  expect(change).not.toHaveBeenCalled()
  pointer(trigger, 'pointerenter')
  advance(599)
  expect(m.queryByRole('dialog')).toBeNull()
  advance(1)
  expect(m.getByRole('dialog', { hidden: true })).toBeTruthy()
  expect(trigger).toHaveAttribute('aria-controls', m.getByRole('dialog', { hidden: true }).id)
  expect(trigger).toHaveAttribute('data-current', '')
  expect(change.mock.calls).toEqual([[true]])
})

test('a short hover cancels opening and touch does not open', () => {
  vi.useFakeTimers()
  const change = vi.fn()
  const m = render(() => (
    <HoverCard onOpenChange={change}>
      <HoverCard.Trigger>Preview</HoverCard.Trigger>
    </HoverCard>
  ))
  const trigger = m.getByText('Preview')
  pointer(trigger, 'pointerenter')
  advance(200)
  pointer(trigger, 'pointerleave')
  advance(1000)
  pointer(trigger, 'pointerenter', 'touch')
  advance(1000)
  expect(change).not.toHaveBeenCalled()
})

test('keyboard focus is delayed and blur before the deadline cancels it', () => {
  vi.useFakeTimers()
  const m = render(() => (
    <HoverCard openDelay={100}>
      <HoverCard.Trigger href="#target">Preview</HoverCard.Trigger>
      <HoverCard.Positioner>
        <HoverCard.Content aria-label="Preview details" />
      </HoverCard.Positioner>
      <button>Outside</button>
    </HoverCard>
  ))
  const trigger = m.getByText('Preview')
  trigger.focus()
  flush()
  advance(99)
  expect(m.queryByRole('dialog')).toBeNull()
  m.getByText('Outside').focus()
  flush()
  advance(200)
  expect(m.queryByRole('dialog')).toBeNull()
  trigger.focus()
  flush()
  advance(100)
  expect(m.getByRole('dialog', { hidden: true })).toBeTruthy()
  expect(trigger).toHaveFocus()
})

test('detached typed triggers switch payload immediately while the card remains open', () => {
  vi.useFakeTimers()
  const handle = HoverCard.createHandle<{ name: string }>()
  const m = render(() => (
    <>
      <HoverCard.Trigger handle={handle} payload={{ name: 'Ada' }}>
        Ada
      </HoverCard.Trigger>
      <HoverCard.Trigger handle={handle} payload={{ name: 'Grace' }}>
        Grace
      </HoverCard.Trigger>
      <HoverCard handle={handle}>
        {(state) => (
          <HoverCard.Positioner>
            <HoverCard.Content aria-label="Person">
              <HoverCard.Viewport>{state.payload?.name} details</HoverCard.Viewport>
            </HoverCard.Content>
          </HoverCard.Positioner>
        )}
      </HoverCard>
    </>
  ))
  pointer(m.getByText('Ada'), 'pointerenter')
  advance(600)
  const content = m.getByRole('dialog', { hidden: true })
  expect(content).toHaveTextContent('Ada details')
  pointer(m.getByText('Grace'), 'pointerenter')
  expect(m.getByRole('dialog', { hidden: true })).toBe(content)
  expect(content).toHaveTextContent('Grace details')
  expect(m.getByText('Ada')).toHaveAttribute('aria-expanded', 'false')
  expect(m.getByText('Grace')).toHaveAttribute('aria-expanded', 'true')
})

test('controlled visibility is authoritative and disabling cancels pending intent', () => {
  vi.useFakeTimers()
  const [disabled, setDisabled] = createSignal(false)
  const change = vi.fn()
  const m = render(() => (
    <HoverCard disabled={disabled()} open={false} onOpenChange={change}>
      <HoverCard.Trigger>Preview</HoverCard.Trigger>
    </HoverCard>
  ))
  pointer(m.getByText('Preview'), 'pointerenter')
  advance(100)
  setDisabled(true)
  flush()
  advance(600)
  expect(change).not.toHaveBeenCalled()
  setDisabled(false)
  flush()
  pointer(m.getByText('Preview'), 'pointerenter')
  advance(600)
  expect(change).toHaveBeenCalledWith(true)
  expect(m.getByText('Preview')).toHaveAttribute('aria-expanded', 'false')
})
