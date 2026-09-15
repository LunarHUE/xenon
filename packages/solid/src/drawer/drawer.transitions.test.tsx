import { cleanup, render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Drawer } from './drawer'

const nativeDialogMethods = {
  showModal: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal'),
  show: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'show'),
  close: Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close'),
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  for (const [name, descriptor] of Object.entries(nativeDialogMethods)) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, name, descriptor)
    else delete (HTMLDialogElement.prototype as unknown as Record<string, unknown>)[name]
  }
})
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function () {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'show', {
    configurable: true,
    value: function () {
      this.open = true
    },
  })
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function () {
      this.open = false
      this.dispatchEvent(new Event('close'))
    },
  })
})

describe('Drawer transitions', () => {
  test('controlled synthetic mouse swipe refusal resets movement and keeps the drawer open', async () => {
    const [open, setOpen] = createSignal(true)
    const change = vi.fn()
    const view = render(() => (
      <Drawer open={open()} onOpenChange={change} dragThreshold="25%">
        <Drawer.Viewport>
          <Drawer.Content aria-label="Sheet">
            <Drawer.Handle />
          </Drawer.Content>
        </Drawer.Viewport>
      </Drawer>
    ))
    const handle = view.getByRole('button', { name: 'Close drawer' })
    const surface = handle.parentElement!
    surface.getBoundingClientRect = () => ({ height: 200, width: 300 }) as DOMRect
    const pointer = {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      isPrimary: true,
      pointerType: 'mouse' as const,
    }
    handle.dispatchEvent(
      new PointerEvent('pointerdown', { ...pointer, button: 0, buttons: 1, clientY: 0 })
    )
    handle.dispatchEvent(
      new PointerEvent('pointermove', { ...pointer, button: 0, buttons: 1, clientY: 100 })
    )
    expect(surface.style.getPropertyValue('--drawer-swipe-offset')).toBe('100px')
    handle.dispatchEvent(
      new PointerEvent('pointerup', { ...pointer, button: 0, buttons: 0, clientY: 100 })
    )
    flush()
    expect(change).toHaveBeenCalledExactlyOnceWith(false)
    await Promise.resolve()
    expect(view.getByRole('dialog')).toBeInTheDocument()
    expect(surface.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
    setOpen(false)
    flush()
  })

  test('a handle close button still honors author cancellation', () => {
    const change = vi.fn()
    const view = render(() => (
      <Drawer defaultOpen onOpenChange={change}>
        <Drawer.Content aria-label="Sheet">
          <Drawer.Handle onClick={(event) => event.preventDefault()} />
        </Drawer.Content>
      </Drawer>
    ))
    view.getByRole('button', { name: 'Close drawer' }).click()
    flush()
    expect(change).not.toHaveBeenCalled()
    expect(view.getByRole('dialog')).toBeInTheDocument()
  })
})
