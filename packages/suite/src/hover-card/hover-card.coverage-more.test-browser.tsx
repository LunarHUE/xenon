import { HoverCard } from '@xenon/solid/hover-card'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
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
  return within(document.body)
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
    .forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  flush()
})

test.each(['top', 'bottom', 'left', 'right'] as const)(
  'hover.pointer.12 retains the 100px safe-polygon trough and closes once from the opposite side (%s)',
  async (side) => {
    const changes = vi.fn()
    const m = mount(() => (
      <HoverCard openDelay={0} closeDelay={0} onOpenChange={changes}>
        <HoverCard.Trigger
          href="#reference"
          style={{
            position: 'absolute',
            left: '150px',
            top: '150px',
            width: '100px',
            height: '100px',
          }}
        >
          Reference
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Positioner side={side} sideOffset={20}>
            <HoverCard.Content
              aria-label="Hover details"
              style={{ width: '100px', height: '100px', background: 'white' }}
            >
              Details
            </HoverCard.Content>
          </HoverCard.Positioner>
        </HoverCard.Portal>
      </HoverCard>
    ))
    const trigger = m.getByRole('link', { name: 'Reference' })
    await userEvent.hover(trigger)
    await settle()
    const content = m.getByRole('dialog', { name: 'Hover details' })
    const from = trigger.getBoundingClientRect()
    const to = content.getBoundingClientRect()
    expect(from.width).toBeCloseTo(100, 0)
    expect(from.height).toBeCloseTo(100, 0)
    expect(to.width).toBeCloseTo(100, 0)
    expect(to.height).toBeCloseTo(100, 0)
    expect(content).toHaveAttribute('data-side', side)
    const gap =
      side === 'top'
        ? from.top - to.bottom
        : side === 'bottom'
          ? to.top - from.bottom
          : side === 'left'
            ? from.left - to.right
            : to.left - from.right
    expect(gap).toBeCloseTo(20, 0)
    const edge =
      side === 'top'
        ? { x: from.left + from.width / 2, y: from.top }
        : side === 'bottom'
          ? { x: from.left + from.width / 2, y: from.bottom }
          : side === 'left'
            ? { x: from.left, y: from.top + from.height / 2 }
            : { x: from.right, y: from.top + from.height / 2 }
    const trough =
      side === 'top'
        ? { x: edge.x, y: (from.top + to.bottom) / 2 }
        : side === 'bottom'
          ? { x: edge.x, y: (from.bottom + to.top) / 2 }
          : side === 'left'
            ? { x: (from.left + to.right) / 2, y: edge.y }
            : { x: (from.right + to.left) / 2, y: edge.y }
    trigger.dispatchEvent(
      new PointerEvent('pointerleave', {
        pointerType: 'mouse',
        clientX: edge.x,
        clientY: edge.y,
        bubbles: true,
      })
    )
    document.body.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: trough.x,
        clientY: trough.y,
        bubbles: true,
      })
    )
    await settle(20)
    expect(content).toBeVisible()
    expect(changes).toHaveBeenCalledWith(true)
    const opposite =
      side === 'top'
        ? { x: from.left + from.width / 2, y: from.bottom + 100 }
        : side === 'bottom'
          ? { x: from.left + from.width / 2, y: from.top - 100 }
          : side === 'left'
            ? { x: from.right + 100, y: from.top + from.height / 2 }
            : { x: from.left - 100, y: from.top + from.height / 2 }
    document.body.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerType: 'mouse',
        clientX: opposite.x,
        clientY: opposite.y,
        bubbles: true,
      })
    )
    await settle(20)
    expect(m.queryByRole('dialog', { name: 'Hover details' })).toBeNull()
    expect(changes).toHaveBeenCalledWith(false)
    expect(changes.mock.calls.filter(([value]) => value === false)).toHaveLength(1)
  }
)
