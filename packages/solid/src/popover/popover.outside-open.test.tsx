import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Menu } from '../menu'
import { Popover } from './popover'

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
    new DOMRect(0, 0, 100, 30),
  ] as unknown as DOMRectList)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

/** A full primary press as a browser dispatches it, then the layer's deferred dismissal turn. */
async function press(target: HTMLElement) {
  const init = { bubbles: true, composed: true, cancelable: true, pointerId: 1, isPrimary: true }
  target.dispatchEvent(new PointerEvent('pointerdown', { ...init, button: 0, buttons: 1 }))
  flush()
  target.dispatchEvent(new PointerEvent('pointerup', { ...init, button: 0, buttons: 0 }))
  target.click()
  flush()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  flush()
}

test('opening a Menu closes an unrelated open Popover, and the reverse', async () => {
  const view = render(() => (
    <>
      <Popover>
        <Popover.Trigger>Details</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content>Popover body</Popover.Content>
        </Popover.Positioner>
      </Popover>
      <Menu>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item>Rename</Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
    </>
  ))
  const popover = view.getByRole('button', { name: 'Details' })
  const menu = view.getByRole('button', { name: 'Actions' })
  await press(popover)
  expect(popover).toHaveAttribute('aria-expanded', 'true')
  await press(menu)
  expect(menu).toHaveAttribute('aria-expanded', 'true')
  expect(popover).toHaveAttribute('aria-expanded', 'false')
  await press(popover)
  expect(popover).toHaveAttribute('aria-expanded', 'true')
  expect(menu).toHaveAttribute('aria-expanded', 'false')
})
