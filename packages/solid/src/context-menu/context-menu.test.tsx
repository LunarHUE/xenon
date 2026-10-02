import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { ContextMenu } from './index'
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
function fixture(disabled = false, onContextMenu?: (event: MouseEvent) => void) {
  return render(() => (
    <ContextMenu>
      <ContextMenu.Trigger disabled={disabled} onContextMenu={onContextMenu ?? (() => {})}>
        Region
      </ContextMenu.Trigger>
      <ContextMenu.Positioner>
        <ContextMenu.Content aria-label="Actions">
          <ContextMenu.Item>Copy</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </ContextMenu>
  ))
}
test('context trigger composes author cancellation and preserves disabled native menus', () => {
  const handler = vi.fn((event: MouseEvent) => event.preventDefault())
  const view = fixture(false, handler)
  view
    .getByText('Region')
    .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
  flush()
  expect(handler).toHaveBeenCalledTimes(1)
  expect(view.queryByRole('menu')).toBeNull()
  cleanup()
  const disabled = fixture(true)
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
  disabled.getByText('Region').dispatchEvent(event)
  expect(event.defaultPrevented).toBe(false)
  expect(disabled.getByText('Region')).toHaveAttribute('data-disabled')
})
test('keyboard context gesture opens a region without disclosure attributes', () => {
  const view = fixture()
  const region = view.getByText('Region')
  region.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true })
  )
  flush()
  expect(region).toHaveAttribute('data-state', 'open')
  expect(region).not.toHaveAttribute('aria-expanded')
  expect(region).not.toHaveAttribute('aria-controls')
  expect(view.getByRole('menu', { hidden: true })).toBeInTheDocument()
})
test('touch hold opens after 500ms and movement, release, scroll, and unmount cancel pending holds', () => {
  vi.useFakeTimers()
  const view = fixture()
  const region = view.getByText('Region')
  function pointer(type: string, x = 20) {
    const event = new Event(type, { bubbles: true })
    Object.assign(event, { pointerType: 'touch', isPrimary: true, clientX: x, clientY: 30 })
    region.dispatchEvent(event)
  }
  for (const type of ['pointermove', 'pointerup', 'pointercancel', 'scroll']) {
    pointer('pointerdown')
    if (type === 'scroll') document.dispatchEvent(new Event('scroll'))
    else pointer(type, 40)
    vi.advanceTimersByTime(500)
    flush()
    expect(region).toHaveAttribute('data-state', 'closed')
  }
  pointer('pointerdown')
  vi.advanceTimersByTime(499)
  flush()
  expect(region).toHaveAttribute('data-state', 'closed')
  vi.advanceTimersByTime(1)
  flush()
  expect(region).toHaveAttribute('data-state', 'open')
  pointer('pointerup')
  region.click()
  flush()
  expect(region).toHaveAttribute('data-state', 'open')
  pointer('pointerdown')
  pointer('pointerup')
  region.click()
  flush()
  expect(region).toHaveAttribute('data-state', 'closed')
})

test('empty disabled attributes block context opening and nested refs attach', () => {
  const host = vi.fn()
  const refs = [host, [undefined, host]]
  const view = render(() => (
    <ContextMenu>
      <ContextMenu.Trigger disabled="" ref={refs}>
        Region
      </ContextMenu.Trigger>
      <ContextMenu.Positioner>
        <ContextMenu.Content aria-label="Actions">
          <ContextMenu.Item>Copy</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Positioner>
    </ContextMenu>
  ))
  const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
  view.getByText('Region').dispatchEvent(event)
  flush()
  expect(host).toHaveBeenCalledTimes(2)
  expect(view.getByText('Region')).toHaveAttribute('data-disabled')
  expect(view.queryByRole('menu')).toBeNull()
  expect(event.defaultPrevented).toBe(false)
})
