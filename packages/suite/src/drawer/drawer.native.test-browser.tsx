import { Drawer } from '@xenon/solid/drawer'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/**
 * Flushes Solid, then waits two animation frames so native top-layer presentation,
 * presence exit, and focus restoration settle before role queries.
 */
async function settle() {
  flush()
  await Promise.resolve()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

/** Renders one disposable fixture tree into a body-appended container. */
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

/**
 * Drives the drawer handle with a synthetic pointer stream and stubs pointer
 * capture, which a synthetic stream cannot acquire; this does not claim OS input.
 */
function pointerDriver(handle: HTMLElement) {
  vi.spyOn(handle, 'setPointerCapture').mockImplementation(() => {})
  return (type: string, x: number, y: number, init: PointerEventInit = {}) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        ...init,
      })
    )
}

/** Renders an open bottom drawer whose Handle is the only gesture surface. */
function openSwipeDrawer(changed = vi.fn()) {
  const m = mount(() => (
    <Drawer defaultOpen dragThreshold="150px" onOpenChange={changed}>
      <Drawer.Content
        aria-label="Swipe drawer"
        style={{ width: '200px', height: '400px', padding: '0', border: '0' }}
      >
        <Drawer.Handle />
      </Drawer.Content>
    </Drawer>
  ))
  return {
    ...m,
    changed,
    content: m.container.querySelector('dialog')!,
    handle: m.getByRole('button', { name: 'Close drawer' }),
  }
}

test('changing the drawer side relocates the dismiss axis and abandons an in-flight swipe', () => {
  const [side, setSide] = createSignal<'bottom' | 'right'>('bottom')
  const changed = vi.fn()
  const m = mount(() => (
    <Drawer side={side()} dragThreshold="150px" defaultOpen onOpenChange={changed}>
      <Drawer.Trigger>Open side drawer</Drawer.Trigger>
      <Drawer.Content
        aria-label="Side drawer"
        style={{ width: '200px', height: '400px', padding: '0', border: '0' }}
      >
        <Drawer.Handle />
      </Drawer.Content>
    </Drawer>
  ))
  const content = m.container.querySelector('dialog')!
  const handle = m.getByRole('button', { name: 'Close drawer' })
  const trigger = m.getByText('Open side drawer')
  expect(content).toHaveAttribute('data-side', 'bottom')
  expect(trigger).toHaveAttribute('data-side', 'bottom')

  const pointer = pointerDriver(handle)
  pointer('pointerdown', 0, 0)
  pointer('pointermove', 0, 120)
  expect(content.style.getPropertyValue('--drawer-swipe-offset')).toBe('120px')
  expect(content).toHaveAttribute('data-swiping')

  setSide('right')
  flush()
  expect(content).toHaveAttribute('data-side', 'right')
  expect(trigger).toHaveAttribute('data-side', 'right')
  expect(content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(content).not.toHaveAttribute('data-swiping')
  expect(handle).not.toHaveAttribute('data-swiping')

  // Vertical movement is no longer outward once the drawer dismisses to the right.
  pointer('pointerdown', 0, 0)
  pointer('pointerup', 0, 160)
  expect(changed).not.toHaveBeenCalled()
  expect(content.open).toBe(true)

  // Movement away from the panel is clamped and never dismisses.
  pointer('pointerdown', 0, 0)
  pointer('pointerup', -160, 0)
  expect(changed).not.toHaveBeenCalled()

  // Only outward movement along the new axis dismisses.
  pointer('pointerdown', 0, 0)
  pointer('pointerup', 160, 0)
  expect(changed).toHaveBeenCalledExactlyOnceWith(false)
})

test('Escape closes only the nested drawer and restores focus through both openers', async () => {
  const m = mount(() => (
    <Drawer side="bottom">
      <Drawer.Trigger>Open parent drawer</Drawer.Trigger>
      <Drawer.Content
        aria-label="Parent drawer"
        style={{ width: '280px', height: '360px', padding: '0', border: '0' }}
      >
        <Drawer side="right">
          <Drawer.Trigger>Open nested drawer</Drawer.Trigger>
          <Drawer.Content
            aria-label="Nested drawer"
            style={{ width: '220px', height: '300px', padding: '0', border: '0' }}
          >
            <Drawer.Handle />
          </Drawer.Content>
        </Drawer>
      </Drawer.Content>
    </Drawer>
  ))
  const opener = m.getByRole('button', { name: 'Open parent drawer' })
  await userEvent.click(opener)
  await settle()
  const parent = m.getByRole('dialog', { name: 'Parent drawer' })
  expect(parent.matches(':modal')).toBe(true)
  expect(parent).toHaveAttribute('data-side', 'bottom')

  const nestedTrigger = m.getByRole('button', { name: 'Open nested drawer' })
  await userEvent.click(nestedTrigger)
  await settle()
  const nested = m.getByRole('dialog', { name: 'Nested drawer' })
  expect(nested.matches(':modal')).toBe(true)
  // Each drawer layer keeps its own physical side while stacked.
  expect(nested).toHaveAttribute('data-side', 'right')
  expect(m.getByRole('dialog', { name: 'Parent drawer' }).matches(':modal')).toBe(true)

  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog', { name: 'Nested drawer' })).toBeNull()
  expect(m.getByRole('dialog', { name: 'Parent drawer' }).matches(':modal')).toBe(true)
  expect(nestedTrigger).toHaveFocus()

  await userEvent.keyboard('{Escape}')
  await settle()
  expect(m.queryByRole('dialog', { name: 'Parent drawer' })).toBeNull()
  expect(opener).toHaveFocus()
})

test('a lost pointer capture or a fresh press abandons the in-flight swipe without dismissing', () => {
  const m = openSwipeDrawer()
  const pointer = pointerDriver(m.handle)

  pointer('pointerdown', 0, 0)
  pointer('pointermove', 0, 120)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('120px')
  expect(m.content).toHaveAttribute('data-swiping')
  expect(m.handle).toHaveAttribute('data-swiping')

  // Synthetic capture loss; this does not claim a native OS pointer stream.
  m.handle.dispatchEvent(new PointerEvent('lostpointercapture', { pointerId: 1, bubbles: true }))
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(m.content).not.toHaveAttribute('data-swiping')
  expect(m.handle).not.toHaveAttribute('data-swiping')

  pointer('pointerup', 0, 120)
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.content.open).toBe(true)

  pointer('pointerdown', 0, 0)
  pointer('pointermove', 0, 120)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('120px')
  pointer('pointerdown', 0, 0)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(m.content).not.toHaveAttribute('data-swiping')
  pointer('pointerup', 0, 10)
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.content.open).toBe(true)
})

test('a secondary, Ctrl-modified, non-primary, or prevented press never starts a swipe', () => {
  const m = openSwipeDrawer()
  const pointer = pointerDriver(m.handle)

  for (const init of [{ button: 2 }, { ctrlKey: true }, { isPrimary: false }]) {
    pointer('pointerdown', 0, 0, init)
    pointer('pointermove', 0, 200, init)
    pointer('pointerup', 0, 200, init)
  }

  // An author handler can cancel the press before the gesture claims it.
  const prevent = (event: Event) => event.preventDefault()
  m.handle.addEventListener('pointerdown', prevent, { capture: true, once: true })
  pointer('pointerdown', 0, 0)
  pointer('pointermove', 0, 200)
  pointer('pointerup', 0, 200)

  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(m.content).not.toHaveAttribute('data-swiping')
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.content.open).toBe(true)

  // The same handle still dismisses once on an accepted outward drag.
  pointer('pointerdown', 0, 0)
  pointer('pointerup', 0, 200)
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(false)
})
