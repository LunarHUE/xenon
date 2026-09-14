import { registerLayer } from '@tenon/dom'
import type { LayerHandle, LayerOptions } from '@tenon/dom'
import type {} from '@vitest/browser-playwright'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

function target(label: string) {
  const element = document.createElement('input')
  element.setAttribute('aria-label', label)
  element.style.cssText = 'display:block;width:150px;height:30px;margin:20px'
  document.body.append(element)
  onTestFinished(() => element.remove())
  return element
}

function layer(element: HTMLElement, options: LayerOptions) {
  const handle = registerLayer(element, options)
  onTestFinished(() => handle.dispose())
  return handle
}

// Wait beyond the dispatch task without guessing a wall-clock duration.
async function settled() {
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
}

test('outside primary clicks dismiss only the top layer and preserve native focus and click', async () => {
  const inside = target('Parent')
  const portal = target('Child portal')
  const outside = target('Outside')
  const lowerDismiss = vi.fn()
  const lower = layer(inside, { outsidePointer: 'dismiss', onDismiss: lowerDismiss })
  const upperDismiss = vi.fn(() => upper.dispose())
  const upper = layer(portal, { parent: lower, outsidePointer: 'dismiss', onDismiss: upperDismiss })
  const click = vi.fn()
  outside.addEventListener('click', click)
  await userEvent.click(outside)
  await expect.poll(() => upperDismiss.mock.calls.length).toBe(1)
  expect(lowerDismiss).not.toHaveBeenCalled()
  expect(outside).toHaveFocus()
  expect(click).toHaveBeenCalledOnce()
  await userEvent.click(outside)
  await expect.poll(() => lowerDismiss.mock.calls.length).toBe(1)
})

test('inside presses, portal branches, and drags crossing the boundary do not dismiss', async () => {
  const inside = target('Inside')
  const branch = target('Branch')
  const outside = target('Outside')
  const dismiss = vi.fn()
  const handle = layer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
  const release = handle.registerBranch(branch)
  await userEvent.click(inside)
  await userEvent.click(branch)
  await userEvent.dragAndDrop(inside, outside)
  await userEvent.dragAndDrop(outside, inside)
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  release()
  await userEvent.click(branch)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})

test('outside callback cancellation preserves native input focus and click', async () => {
  const inside = target('Inside')
  const outside = target('Outside')
  const dismiss = vi.fn()
  const callback = vi.fn((event: { preventDefault(): void }) => event.preventDefault())
  layer(inside, { outsidePointer: 'dismiss', onPointerOutside: callback, onDismiss: dismiss })
  const click = vi.fn()
  outside.addEventListener('click', click)
  await userEvent.click(outside)
  await expect.poll(() => callback.mock.calls.length).toBe(1)
  expect(dismiss).not.toHaveBeenCalled()
  expect(outside).toHaveFocus()
  expect(click).toHaveBeenCalledOnce()
})

test('native target cancellation vetoes dismissal, while stopped bubbling does not hide it', async () => {
  const inside = target('Inside')
  const outside = target('Outside')
  const dismiss = vi.fn()
  layer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
  outside.addEventListener('pointerdown', (event) => event.preventDefault(), { once: true })
  await userEvent.click(outside)
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  outside.addEventListener('pointerup', (event) => event.preventDefault(), { once: true })
  await userEvent.click(outside)
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  outside.addEventListener('pointerdown', (event) => event.stopPropagation(), { once: true })
  outside.addEventListener('pointerup', (event) => event.stopPropagation(), { once: true })
  await userEvent.click(outside)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})

test('opening a layer during pointerdown does not dismiss it on the opening release', async () => {
  const inside = target('Inside')
  const opener = target('Opener')
  const dismiss = vi.fn()
  let handle: LayerHandle | undefined
  onTestFinished(() => handle?.dispose())
  opener.addEventListener(
    'pointerdown',
    () => {
      handle = registerLayer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
    },
    { once: true }
  )
  await userEvent.click(opener)
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  await userEvent.click(opener)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})

test('middle and secondary clicks leave outside dismissal alone', async () => {
  const inside = target('Inside')
  const outside = target('Outside')
  const dismiss = vi.fn()
  layer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
  await userEvent.click(outside, { button: 'middle' })
  await userEvent.click(outside, { button: 'right' })
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  await userEvent.click(outside)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})

test('pointer capture uses the physical release position across the layer boundary', async () => {
  const inside = target('Inside')
  const outside = target('Capturing outside')
  const host = document.createElement('div')
  document.body.append(host)
  onTestFinished(() => host.remove())
  host.attachShadow({ mode: 'open' }).append(inside)
  outside.addEventListener('pointerdown', (event) => outside.setPointerCapture(event.pointerId))
  const dismiss = vi.fn()
  layer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
  await userEvent.dragAndDrop(outside, inside)
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  await userEvent.click(outside)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})

test('captured releases into slotted branch content count as inside', async () => {
  const inside = target('Inside')
  const outside = target('Capturing outside')
  const slotted = target('Slotted branch')
  const host = document.createElement('div')
  document.body.append(host)
  onTestFinished(() => host.remove())
  const shadow = host.attachShadow({ mode: 'open' })
  const branch = document.createElement('div')
  branch.append(document.createElement('slot'))
  shadow.append(branch)
  host.append(slotted)
  outside.addEventListener('pointerdown', (event) => outside.setPointerCapture(event.pointerId))
  const dismiss = vi.fn()
  const handle = layer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
  handle.registerBranch(branch)
  await userEvent.dragAndDrop(outside, slotted)
  await settled()
  expect(dismiss).not.toHaveBeenCalled()
  await userEvent.click(outside)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})

test('outside capture inside a closed shadow root still checks the physical endpoint', async () => {
  const inside = target('Inside')
  const host = document.createElement('div')
  host.style.cssText = 'display:block;width:200px;height:80px'
  document.body.append(host)
  onTestFinished(() => host.remove())
  const outside = document.createElement('input')
  outside.style.cssText = 'width:150px;height:30px;margin:20px'
  host.attachShadow({ mode: 'closed' }).append(outside)
  const captured = vi.fn((event: PointerEvent) => outside.setPointerCapture(event.pointerId))
  outside.addEventListener('pointerdown', captured)
  const dismiss = vi.fn()
  layer(inside, { outsidePointer: 'dismiss', onDismiss: dismiss })
  await userEvent.dragAndDrop(host, inside)
  await settled()
  expect(captured).toHaveBeenCalledOnce()
  expect(dismiss).not.toHaveBeenCalled()
  await userEvent.click(host)
  await expect.poll(() => dismiss.mock.calls.length).toBe(1)
})
