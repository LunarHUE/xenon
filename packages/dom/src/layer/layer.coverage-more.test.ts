import { afterEach, expect, test, vi } from 'vitest'
import { registerLayer } from './layer'

const handles: ReturnType<typeof registerLayer>[] = []

afterEach(() => {
  for (const handle of handles.splice(0)) handle.dispose()
  document.body.replaceChildren()
  vi.useRealTimers()
})

function pointer(type: 'pointerdown' | 'pointerup', target: EventTarget, pointerId = 1) {
  const event = new PointerEvent(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
    pointerId,
    isPrimary: true,
    button: 0,
  })
  target.dispatchEvent(event)
  return event
}

function gesture(target: EventTarget, pointerId = 1) {
  pointer('pointerdown', target, pointerId)
  pointer('pointerup', target, pointerId)
  vi.runAllTimers()
}

test('interact-outside.pointer.1 notifies only for a same-document body press', () => {
  vi.useFakeTimers()
  const layer = document.createElement('div')
  const descendant = document.createElement('button')
  layer.append(descendant)
  document.body.append(layer)
  const outside = vi.fn()
  const dismiss = vi.fn()
  handles.push(
    registerLayer(layer, {
      outsidePointer: 'dismiss',
      onPointerOutside: outside,
      onDismiss: dismiss,
    })
  )

  gesture(layer)
  gesture(descendant)
  expect(outside).not.toHaveBeenCalled()
  expect(dismiss).not.toHaveBeenCalled()

  gesture(document.body)
  expect(outside).toHaveBeenCalledOnce()
  expect(dismiss).toHaveBeenCalledOnce()
})

test('interact-outside.notes.1 attaches iframe layer listeners to the iframe owner document', () => {
  vi.useFakeTimers()
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const frameDocument = iframe.contentDocument!
  const layer = frameDocument.createElement('div')
  const descendant = frameDocument.createElement('button')
  layer.append(descendant)
  frameDocument.body.append(layer)
  const outside = vi.fn()
  handles.push(
    registerLayer(layer, {
      outsidePointer: 'dismiss',
      onPointerOutside: outside,
    })
  )

  gesture(descendant)
  expect(outside).not.toHaveBeenCalled()
  gesture(document.body, 2)
  expect(outside).not.toHaveBeenCalled()
  gesture(frameDocument.body, 3)
  expect(outside).toHaveBeenCalledOnce()
})
