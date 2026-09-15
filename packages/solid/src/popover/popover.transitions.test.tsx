import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { Popover } from './popover'

afterEach(cleanup)

describe('Popover transitions', () => {
  test('Escape callback can veto dismissal while later Escape still retries', () => {
    const change = vi.fn()
    let veto = true
    const view = render(() => (
      <Popover
        defaultOpen
        onOpenChange={change}
        onEscapeKeyDown={(event) => veto && event.preventDefault()}
      >
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details" />
        </Popover.Positioner>
      </Popover>
    ))
    const press = () =>
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
      )
    press()
    flush()
    expect(view.container.querySelector('[role="dialog"]')).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()
    veto = false
    press()
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(false)
    expect(view.container.querySelector('[role="dialog"]')).toBeNull()
  })

  test('outside cancellation preserves the popover until a later outside press', async () => {
    let veto = true
    const change = vi.fn()
    const view = render(() => (
      <Popover
        defaultOpen
        modal={false}
        onOpenChange={change}
        onPointerOutside={(event) => veto && event.preventDefault()}
      >
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content aria-label="Details" />
        </Popover.Positioner>
      </Popover>
    ))
    const outside = () => {
      document.body.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          composed: true,
          cancelable: true,
          pointerId: 1,
          isPrimary: true,
          button: 0,
        })
      )
      document.body.dispatchEvent(
        new PointerEvent('pointerup', {
          bubbles: true,
          composed: true,
          cancelable: true,
          pointerId: 1,
          isPrimary: true,
          button: 0,
        })
      )
    }
    outside()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(view.getByRole('dialog')).toBeInTheDocument()
    expect(change).not.toHaveBeenCalled()
    veto = false
    outside()
    await new Promise((resolve) => setTimeout(resolve, 0))
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(false)
    expect(view.queryByRole('dialog')).toBeNull()
  })
})
