import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { registerLayer } from './layer'
import type { LayerHandle, LayerOptions } from './layer'

const layers: LayerHandle[] = []
function element() {
  const node = document.createElement('div')
  document.body.append(node)
  return node
}
function layer(options: LayerOptions = {}, node = element()) {
  const handle = registerLayer(node, options)
  layers.push(handle)
  return handle
}
function pointer(type: string, target: EventTarget = document.body, init: PointerEventInit = {}) {
  const event = new PointerEvent(type, {
    bubbles: true,
    composed: true,
    cancelable: true,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}
function gesture(start: EventTarget = document.body, end: EventTarget = start) {
  pointer('pointerdown', start)
  const up = pointer('pointerup', end)
  vi.runAllTimers()
  return up
}
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  for (const handle of layers.splice(0)) handle.dispose()
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('outside pointer dismissal', () => {
  test('requests only the top layer after dispatch without canceling native events', () => {
    const lower = vi.fn()
    const dismiss = vi.fn()
    const outside = vi.fn()
    layer({ outsidePointer: 'dismiss', onDismiss: lower })
    layer({ outsidePointer: 'dismiss', onPointerOutside: outside, onDismiss: dismiss })
    const down = pointer('pointerdown')
    const up = pointer('pointerup')
    expect(dismiss).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(outside).toHaveBeenCalledTimes(1)
    expect(outside.mock.calls[0]![0].originalEvent).toBe(up)
    expect(dismiss).toHaveBeenCalledExactlyOnceWith(up)
    expect(lower).not.toHaveBeenCalled()
    expect(down.defaultPrevented).toBe(false)
    expect(up.defaultPrevented).toBe(false)
  })

  test.each([undefined, 'ignore'] as const)(
    'policy %s blocks callbacks and lower layers',
    (policy) => {
      const callback = vi.fn()
      layer({ outsidePointer: 'dismiss', onDismiss: callback })
      layer({ outsidePointer: policy, onPointerOutside: callback, onDismiss: callback })
      gesture()
      expect(callback).not.toHaveBeenCalled()
    }
  )

  test('wrapper cancellation does not cancel the original event', () => {
    const dismiss = vi.fn()
    layer({
      outsidePointer: 'dismiss',
      onPointerOutside(event) {
        expect(event.defaultPrevented).toBe(false)
        event.preventDefault()
        expect(event.defaultPrevented).toBe(true)
        expect(event.originalEvent.defaultPrevented).toBe(false)
      },
      onDismiss: dismiss,
    })
    expect(gesture().defaultPrevented).toBe(false)
    expect(dismiss).not.toHaveBeenCalled()
  })

  test.each(['pointerdown', 'pointerup'])('honors target cancellation of %s', (type) => {
    const callback = vi.fn()
    layer({ outsidePointer: 'dismiss', onPointerOutside: callback, onDismiss: callback })
    const target = element()
    target.addEventListener(type, (event) => event.preventDefault(), { once: true })
    gesture(target)
    expect(callback).not.toHaveBeenCalled()
  })

  test('capture tracking survives stopped bubble propagation', () => {
    const dismiss = vi.fn()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    const target = element()
    target.addEventListener('pointerdown', (event) => event.stopPropagation())
    target.addEventListener('pointerup', (event) => event.stopPropagation())
    gesture(target)
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test.each([{ button: 2 }, { button: 1 }, { ctrlKey: true }, { isPrimary: false }])(
    'rejects nonprimary gestures %j at either endpoint',
    (init) => {
      const dismiss = vi.fn()
      layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
      pointer('pointerdown', document.body, init)
      pointer('pointerup')
      pointer('pointerdown')
      pointer('pointerup', document.body, init)
      vi.runAllTimers()
      expect(dismiss).not.toHaveBeenCalled()
    }
  )

  test('requires matching pointer IDs and clears pointercancel', () => {
    const dismiss = vi.fn()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    pointer('pointerdown')
    pointer('pointerup', document.body, { pointerId: 2 })
    vi.runAllTimers()
    expect(dismiss).not.toHaveBeenCalled()
    pointer('pointercancel', document.body, { pointerId: 2 })
    pointer('pointerup')
    vi.runAllTimers()
    expect(dismiss).toHaveBeenCalledTimes(1)
    pointer('pointerdown')
    pointer('pointercancel')
    pointer('pointerup')
    vi.runAllTimers()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('a second nonprimary contact cancels the pending gesture', () => {
    const dismiss = vi.fn()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    pointer('pointerdown')
    pointer('pointerdown', document.body, { pointerId: 2, isPrimary: false })
    pointer('pointerup', document.body, { pointerId: 2, isPrimary: false })
    pointer('pointerup')
    vi.runAllTimers()
    expect(dismiss).not.toHaveBeenCalled()
  })

  test('drags starting or ending inside and non-element targets cannot dismiss', () => {
    const dismiss = vi.fn()
    const content = element()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss }, content)
    const text = document.createTextNode('outside')
    document.body.append(text)
    gesture(content, document.body)
    gesture(document.body, content)
    gesture(document)
    gesture(text)
    gesture(document.body, text)
    const hit = vi.fn(() => document.body)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hit })
    try {
      pointer('pointerdown')
      pointer('gotpointercapture')
      pointer('pointerup', document)
      vi.runAllTimers()
      expect(hit).not.toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(document, 'elementFromPoint')
    }
    expect(dismiss).not.toHaveBeenCalled()
  })

  test('branches retain independent cleanup and shadow content stays inside', () => {
    const dismiss = vi.fn()
    const shadow = element().attachShadow({ mode: 'open' })
    const content = document.createElement('div')
    shadow.append(content)
    const top = layer({ outsidePointer: 'dismiss', onDismiss: dismiss }, content)
    const branch = element()
    const first = top.registerBranch(branch)
    const second = top.registerBranch(branch)
    gesture(content)
    gesture(branch)
    first()
    first()
    gesture(branch)
    expect(dismiss).not.toHaveBeenCalled()
    second()
    gesture(branch)
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('nested layers route only to the child even when the pointer is in the parent', () => {
    const parentDismiss = vi.fn()
    const childDismiss = vi.fn()
    const content = element()
    const parent = layer({ outsidePointer: 'dismiss', onDismiss: parentDismiss }, content)
    layer({ parent, outsidePointer: 'dismiss', onDismiss: childDismiss })
    gesture(content)
    expect(childDismiss).toHaveBeenCalledTimes(1)
    expect(parentDismiss).not.toHaveBeenCalled()
  })

  test.each(['between', 'scheduled'])(
    'registration invalidates %s requests even after immediate disposal',
    (when) => {
      const dismiss = vi.fn()
      layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
      pointer('pointerdown')
      if (when === 'scheduled') pointer('pointerup')
      layer().dispose()
      if (when === 'between') pointer('pointerup')
      vi.runAllTimers()
      expect(dismiss).not.toHaveBeenCalled()
    }
  )

  test.each(['between', 'scheduled'])(
    'disposal invalidates %s requests, including non-top disposal',
    (when) => {
      const dismiss = vi.fn()
      const lower = layer()
      layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
      pointer('pointerdown')
      if (when === 'scheduled') pointer('pointerup')
      lower.dispose()
      if (when === 'between') pointer('pointerup')
      vi.runAllTimers()
      expect(dismiss).not.toHaveBeenCalled()
    }
  )

  test.each(['dispose', 'register', 'cancel'] as const)(
    'outside callback can %s to prevent dismissal',
    (action) => {
      const dismiss = vi.fn()
      const top = layer({
        outsidePointer: 'dismiss',
        onPointerOutside(event) {
          if (action === 'dispose') top.dispose()
          if (action === 'register') layer().dispose()
          if (action === 'cancel') event.originalEvent.preventDefault()
        },
        onDismiss: dismiss,
      })
      gesture()
      expect(dismiss).not.toHaveBeenCalled()
    }
  )

  test('snapshots options at pointerup and containment during capture', () => {
    const previous = vi.fn()
    const snapshot = vi.fn()
    const later = vi.fn()
    const top = layer({ onDismiss: previous })
    pointer('pointerdown')
    top.update({ outsidePointer: 'dismiss', onDismiss: snapshot })
    const target = element()
    target.addEventListener('pointerup', () => {
      top.registerBranch(target)
      top.update({ outsidePointer: 'dismiss', onDismiss: later })
    })
    pointer('pointerup', target)
    vi.runAllTimers()
    expect(snapshot).toHaveBeenCalledTimes(1)
    expect(previous).not.toHaveBeenCalled()
    expect(later).not.toHaveBeenCalled()
    top.update({ onDismiss: later })
    gesture()
    expect(later).not.toHaveBeenCalled()
  })

  test('captured releases use physical endpoints, including open shadow roots', () => {
    const dismiss = vi.fn()
    const host = element()
    const shadow = host.attachShadow({ mode: 'open' })
    const content = document.createElement('div')
    shadow.append(content)
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss }, content)
    const capture = element()
    Object.defineProperty(capture, 'hasPointerCapture', { value: () => true })
    const hit = vi.fn((): Element | null => host)
    const innerHit = vi.fn(() => content)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hit })
    Object.defineProperty(shadow, 'elementFromPoint', { configurable: true, value: innerHit })
    try {
      gesture(capture)
      expect(hit).toHaveBeenCalledWith(0, 0)
      expect(innerHit).toHaveBeenCalledWith(0, 0)
      expect(dismiss).not.toHaveBeenCalled()
      hit.mockReturnValue(null)
      gesture(capture)
      expect(dismiss).not.toHaveBeenCalled()
      hit.mockReturnValue(capture)
      gesture(capture)
      expect(dismiss).toHaveBeenCalledTimes(1)
    } finally {
      Reflect.deleteProperty(document, 'elementFromPoint')
    }
  })

  test.each(['inside', 'contact'])(
    'a new %s press cancels an already scheduled request',
    (kind) => {
      const dismiss = vi.fn()
      const content = element()
      layer({ outsidePointer: 'dismiss', onDismiss: dismiss }, content)
      pointer('pointerdown')
      pointer('pointerup')
      expect(vi.getTimerCount()).toBe(1)
      if (kind === 'inside') pointer('pointerdown', content)
      else pointer('pointerdown', document.body, { pointerId: 2, isPrimary: false })
      vi.runAllTimers()
      expect(dismiss).not.toHaveBeenCalled()
    }
  )

  test('captured endpoint containment follows assigned slots through shadow branches', () => {
    const dismiss = vi.fn()
    const top = layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    const host = element()
    const shadow = host.attachShadow({ mode: 'open' })
    const branch = document.createElement('div')
    const slot = document.createElement('slot')
    branch.append(slot)
    shadow.append(branch)
    const slotted = document.createElement('button')
    host.append(slotted)
    top.registerBranch(branch)
    const capture = element()
    Object.defineProperty(capture, 'hasPointerCapture', { value: () => true })
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => slotted,
    })
    try {
      expect(slotted.assignedSlot).toBe(slot)
      gesture(capture)
      expect(dismiss).not.toHaveBeenCalled()
    } finally {
      Reflect.deleteProperty(document, 'elementFromPoint')
    }
  })

  test('tracks capture hidden by a closed shadow root and clears it after release', () => {
    const dismiss = vi.fn()
    const content = element()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss }, content)
    const host = element()
    const shadow = host.attachShadow({ mode: 'closed' })
    const capture = document.createElement('button')
    shadow.append(capture)
    Object.defineProperty(capture, 'hasPointerCapture', { value: () => true })
    const hit = vi.fn(() => content)
    Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: hit })
    try {
      pointer('pointerdown', capture)
      pointer('gotpointercapture', capture)
      pointer('pointerup', capture)
      vi.runAllTimers()
      expect(hit).toHaveBeenCalledTimes(1)
      expect(dismiss).not.toHaveBeenCalled()
      gesture(host)
      expect(hit).toHaveBeenCalledTimes(1)
      expect(dismiss).toHaveBeenCalledTimes(1)
    } finally {
      Reflect.deleteProperty(document, 'elementFromPoint')
    }
  })

  test.each(['lostpointercapture', 'pointercancel'])('%s clears recorded capture', (type) => {
    const dismiss = vi.fn()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    pointer('pointerdown')
    pointer('gotpointercapture')
    pointer(type)
    gesture()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('last disposal clears scheduled work and removes each capture listener once', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const dismiss = vi.fn()
    const top = layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    pointer('pointerdown')
    pointer('pointerup')
    expect(vi.getTimerCount()).toBe(1)
    top.dispose()
    top.dispose()
    expect(vi.getTimerCount()).toBe(0)
    for (const type of [
      'pointerdown',
      'pointerup',
      'pointercancel',
      'gotpointercapture',
      'lostpointercapture',
    ]) {
      const calls = remove.mock.calls.filter(([name]) => name === type)
      expect(calls).toHaveLength(1)
      expect(calls[0]![2]).toBe(true)
    }
    remove.mockRestore()
    layer({ outsidePointer: 'dismiss', onDismiss: dismiss })
    gesture()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })
})
