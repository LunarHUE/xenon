import type { DrawerDragThreshold } from '@xenon-ui/solid/drawer'
import { Drawer } from '@xenon-ui/solid/drawer'
import { render } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'

function fixture(controlled = false) {
  const [open, setOpen] = createSignal(true)
  const [dragThreshold, setDragThreshold] = createSignal<DrawerDragThreshold>()
  const changed = vi.fn()
  const style = document.createElement('style')
  style.textContent = `
    .release-drawer { width: 200px; height: 400px; padding: 0; border: 0; transform: translateY(var(--drawer-swipe-offset, 0px)); }
    .release-drawer[data-ending-style] { animation: release-exit 1s linear both; }
    @keyframes release-exit { from { transform: translateY(var(--drawer-swipe-offset, 0px)); } to { transform: translateY(100%); } }
  `
  document.head.append(style)
  const container = document.createElement('div')
  document.body.append(container)
  const unmount = render(
    () => (
      <Drawer
        dragThreshold={dragThreshold()}
        open={open()}
        forceMount
        onOpenChange={(next) => {
          changed(next)
          if (!controlled) setOpen(next)
        }}
      >
        <Drawer.Content class="release-drawer" aria-label="Swipe drawer">
          <Drawer.Handle />
        </Drawer.Content>
      </Drawer>
    ),
    container
  )
  flush()
  onTestFinished(() => {
    unmount()
    container.remove()
    style.remove()
  })
  const content = container.querySelector('dialog')!
  const handle = content.querySelector('button')!
  vi.spyOn(handle, 'setPointerCapture').mockImplementation(() => {})
  const pointer = (type: string, y: number) =>
    handle.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        isPrimary: true,
        button: 0,
        clientY: y,
        bubbles: true,
        cancelable: true,
      })
    )
  return { content, handle, pointer, setOpen, changed, setDragThreshold, container }
}

test('root dragThreshold updates the handle without leaking onto the DOM', async () => {
  const m = fixture()
  m.setDragThreshold('150px')
  flush()
  expect(m.container.firstElementChild).not.toHaveAttribute('dragthreshold')
  m.pointer('pointerdown', 0)
  m.pointer('pointerup', 120)
  flush()
  expect(m.changed).not.toHaveBeenCalled()
  expect(m.content.open).toBe(true)
  m.setDragThreshold('25%')
  flush()
  m.pointer('pointerdown', 0)
  m.pointer('pointerup', 100)
  flush()
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(false)
  await expect.poll(() => m.content.hasAttribute('data-ending-style')).toBe(true)
  const animation = m.content.getAnimations()[0]!
  animation.pause()
  animation.currentTime = 0
  expect(new DOMMatrix(getComputedStyle(m.content).transform).m42).toBe(100)
})

test('drawer exit starts at the release position and clears it after exit and reopen', async () => {
  const m = fixture()
  m.pointer('pointerdown', 0)
  m.pointer('pointermove', 120)
  expect(new DOMMatrix(getComputedStyle(m.content).transform).m42).toBe(120)
  m.pointer('pointerup', 120)
  flush()
  await expect.poll(() => m.content.hasAttribute('data-ending-style')).toBe(true)
  const animation = m.content.getAnimations()[0]!
  animation.pause()
  animation.currentTime = 0
  expect(new DOMMatrix(getComputedStyle(m.content).transform).m42).toBe(120)
  expect(m.content.hasAttribute('data-swiping')).toBe(false)
  animation.finish()
  await expect.poll(() => m.content.hasAttribute('hidden')).toBe(true)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  m.setOpen(true)
  flush()
  expect(new DOMMatrix(getComputedStyle(m.content).transform).m42).toBe(0)
})

test('refused closure and canceled or short gestures return the drawer to rest', async () => {
  const m = fixture(true)
  m.pointer('pointerdown', 0)
  m.pointer('pointerup', 120)
  await expect.poll(() => m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(m.changed).toHaveBeenCalledExactlyOnceWith(false)
  expect(m.content.open).toBe(true)
  m.pointer('pointerdown', 0)
  m.pointer('pointerup', 30)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  m.pointer('pointerdown', 0)
  m.pointer('pointermove', 120)
  m.pointer('pointercancel', 120)
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(m.changed).toHaveBeenCalledOnce()
})

test('reopening during exit discards the old drag position', async () => {
  const m = fixture()
  m.pointer('pointerdown', 0)
  m.pointer('pointerup', 120)
  flush()
  await expect.poll(() => m.content.hasAttribute('data-ending-style')).toBe(true)
  m.content.getAnimations()[0]!.pause()
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('120px')
  m.setOpen(true)
  flush()
  expect(m.content.style.getPropertyValue('--drawer-swipe-offset')).toBe('')
  expect(m.content.hasAttribute('data-ending-style')).toBe(false)
  expect(new DOMMatrix(getComputedStyle(m.content).transform).m42).toBe(0)
})
