import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'
import { Drawer } from './drawer'

afterEach(cleanup)

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.show = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

describe('Drawer', () => {
  test('drawer handle is an accessible dismissal button', () => {
    const { getByRole, queryByRole } = render(() => (
      <Drawer defaultOpen side="left">
        <Drawer.Content aria-label="Navigation">
          <Drawer.Handle />
        </Drawer.Content>
      </Drawer>
    ))
    expect(getByRole('dialog')).toHaveAttribute('data-side', 'left')
    getByRole('button', { name: 'Close drawer' }).click()
    flush()
    expect(queryByRole('dialog')).toBeNull()
  })
})

test('viewport drawer gestures measure and transform the inner surface', () => {
  const view = render(() => (
    <Drawer defaultOpen dragThreshold="25%">
      <Drawer.Viewport>
        <Drawer.Content aria-label="Sheet">
          <Drawer.Handle />
        </Drawer.Content>
      </Drawer.Viewport>
    </Drawer>
  ))
  const host = view.getByRole('dialog')
  const handle = view.getByRole('button', { name: 'Close drawer' })
  const surface = handle.parentElement!
  surface.getBoundingClientRect = () => ({ height: 200, width: 300 }) as DOMRect
  host.getBoundingClientRect = () => ({ height: 1000, width: 1000 }) as DOMRect
  for (const [type, clientY] of [
    ['pointerdown', 0],
    ['pointermove', 60],
  ] as const)
    handle.dispatchEvent(
      new PointerEvent(type, { bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientY })
    )
  expect(surface.style.getPropertyValue('--drawer-swipe-offset')).toBe('60px')
  expect(host.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  handle.dispatchEvent(
    new PointerEvent('pointerup', {
      bubbles: true,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientY: 60,
    })
  )
  flush()
  expect(view.queryByRole('dialog')).toBeNull()
})
