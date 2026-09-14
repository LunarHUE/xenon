import { afterEach, describe, expect, test, vi } from 'vitest'

import { registerLayer } from './layer'
import type { LayerHandle, LayerOptions } from './layer'

const layers: LayerHandle[] = []
function layer(options?: LayerOptions, element = document.createElement('div')) {
  const handle = registerLayer(element, options)
  layers.push(handle)
  return handle
}
function escape(target: EventTarget = document, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', {
    key: 'Escape',
    bubbles: true,
    cancelable: true,
    ...init,
  })
  target.dispatchEvent(event)
  return event
}
function inside(handle: LayerHandle, target: EventTarget) {
  let result = false
  target.addEventListener(
    'probe',
    (event) => {
      result = handle.contains(event)
    },
    { once: true }
  )
  target.dispatchEvent(new Event('probe', { bubbles: true, composed: true }))
  return result
}
afterEach(() => {
  for (const handle of layers.splice(0)) handle.dispose()
  document.body.replaceChildren()
  vi.useRealTimers()
})

describe('registerLayer', () => {
  test('routes one Escape to the newest registration across independent roots', () => {
    const lower = vi.fn()
    const upper = vi.fn()
    layer({ onDismiss: lower })
    const top = layer({ onDismiss: upper })
    expect(escape().defaultPrevented).toBe(true)
    expect(upper).toHaveBeenCalledTimes(1)
    expect(lower).not.toHaveBeenCalled()
    top.dispose()
    top.dispose()
    escape()
    expect(lower).toHaveBeenCalledTimes(1)
  })

  test('replacement updates preserve order and reset omitted options', () => {
    const lower = vi.fn()
    const previous = vi.fn()
    const next = vi.fn()
    const bottom = layer({ onDismiss: lower })
    const top = layer({ escape: 'ignore', onDismiss: previous })
    bottom.update({ onDismiss: lower })
    top.update({ onDismiss: next })
    escape()
    expect(next).toHaveBeenCalledTimes(1)
    expect(previous).not.toHaveBeenCalled()
    expect(lower).not.toHaveBeenCalled()
  })

  test('an ignoring top layer prevents platform action and blocks lower callbacks', () => {
    const lower = vi.fn()
    const ignored = vi.fn()
    layer({ onDismiss: lower })
    layer({ escape: 'ignore', onEscapeKeyDown: ignored, onDismiss: ignored })
    expect(escape().defaultPrevented).toBe(true)
    expect(lower).not.toHaveBeenCalled()
    expect(ignored).not.toHaveBeenCalled()
  })

  test('honors earlier cancellation, non-Escape keys, and bubble propagation', () => {
    const dismiss = vi.fn()
    layer({ onDismiss: dismiss })
    const target = document.createElement('button')
    document.body.append(target)
    target.addEventListener('keydown', (event) => event.preventDefault(), { once: true })
    escape(target)
    target.addEventListener('keydown', (event) => event.stopPropagation(), { once: true })
    escape(target)
    escape(document, { key: 'Enter' })
    expect(dismiss).not.toHaveBeenCalled()
  })

  test('the Escape callback can veto dismissal', () => {
    const dismiss = vi.fn()
    const callback = vi.fn((event: KeyboardEvent) => event.preventDefault())
    layer({ onEscapeKeyDown: callback, onDismiss: dismiss })
    escape()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(dismiss).not.toHaveBeenCalled()
  })

  test('disposal during the callback does not dismiss the old layer or its successor', () => {
    const dismiss = vi.fn()
    layer({ onDismiss: dismiss })
    const top = layer({ onEscapeKeyDown: () => top.dispose(), onDismiss: dismiss })
    expect(escape().defaultPrevented).toBe(false)
    expect(dismiss).not.toHaveBeenCalled()
    escape()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('uses the callback snapshot when a handler updates or opens a layer', () => {
    const original = vi.fn()
    const replacement = vi.fn()
    const newer = vi.fn()
    const top = layer({
      onEscapeKeyDown() {
        top.update({ onDismiss: replacement })
        layer({ onDismiss: newer })
      },
      onDismiss: original,
    })
    escape()
    expect(original).toHaveBeenCalledTimes(1)
    expect(replacement).not.toHaveBeenCalled()
    expect(newer).not.toHaveBeenCalled()
    escape()
    expect(newer).toHaveBeenCalledTimes(1)
  })

  test('suppresses composition Escape through the tick after compositionend', () => {
    vi.useFakeTimers()
    const dismiss = vi.fn()
    layer({ onDismiss: dismiss })
    escape(document, { isComposing: true })
    document.dispatchEvent(new Event('compositionstart'))
    escape()
    document.dispatchEvent(new Event('compositionend'))
    escape()
    expect(dismiss).not.toHaveBeenCalled()
    vi.runAllTimers()
    escape()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('tracks composition despite stopped bubble propagation', () => {
    vi.useFakeTimers()
    const dismiss = vi.fn()
    layer({ onDismiss: dismiss })
    const input = document.createElement('input')
    document.body.append(input)
    input.addEventListener('compositionstart', (event) => event.stopPropagation())
    input.addEventListener('compositionend', (event) => event.stopPropagation())
    input.dispatchEvent(new Event('compositionstart', { bubbles: true }))
    escape()
    input.dispatchEvent(new Event('compositionend', { bubbles: true }))
    escape()
    expect(dismiss).not.toHaveBeenCalled()
    vi.runAllTimers()
    escape()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('new composition cancels the preceding deferred clear', () => {
    vi.useFakeTimers()
    const dismiss = vi.fn()
    layer({ onDismiss: dismiss })
    document.dispatchEvent(new Event('compositionstart'))
    document.dispatchEvent(new Event('compositionend'))
    document.dispatchEvent(new Event('compositionstart'))
    vi.runAllTimers()
    escape()
    expect(dismiss).not.toHaveBeenCalled()
  })

  test('contains portalled descendants and reference-counted branches', () => {
    const root = document.createElement('div')
    const portal = document.createElement('div')
    const branch = document.createElement('button')
    document.body.append(root, portal, branch)
    const parent = layer({}, root)
    const child = layer({ parent }, portal)
    const first = child.registerBranch(branch)
    const second = child.registerBranch(branch)
    expect(inside(parent, portal)).toBe(true)
    expect(inside(parent, branch)).toBe(true)
    first()
    first()
    expect(inside(parent, branch)).toBe(true)
    second()
    expect(inside(parent, branch)).toBe(false)
    expect(inside(parent, document)).toBe(false)
    const text = document.createTextNode('inside')
    root.append(text)
    expect(inside(parent, text)).toBe(false)
    child.dispose()
    expect(inside(parent, portal)).toBe(false)
  })

  test('resolves shadow-root content through the composed event path', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const shadow = host.attachShadow({ mode: 'open' })
    const content = document.createElement('div')
    const sibling = document.createElement('button')
    shadow.append(content, sibling)
    const handle = layer({}, content)
    let result = false
    document.addEventListener(
      'probe',
      (event) => {
        result = handle.contains(event)
      },
      { once: true }
    )
    content.dispatchEvent(new Event('probe', { bubbles: true, composed: true }))
    expect(result).toBe(true)
    expect(inside(handle, sibling)).toBe(false)
  })

  test('parent disposal leaves children active and invalidates stale ancestry', () => {
    const node = document.createElement('div')
    const grandparent = layer()
    const parent = layer({ parent: grandparent })
    const dismiss = vi.fn()
    layer({ parent, onDismiss: dismiss }, node)
    parent.dispose()
    expect(inside(parent, node)).toBe(false)
    expect(inside(grandparent, node)).toBe(false)
    expect(() => layer({ parent })).toThrow('active in the same document')
    escape()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })

  test('documents have independent stacks and reject foreign relationships', () => {
    const other = document.implementation.createHTMLDocument()
    const localDismiss = vi.fn()
    const foreignDismiss = vi.fn()
    const local = layer({ onDismiss: localDismiss })
    const foreign = layer({ onDismiss: foreignDismiss }, other.createElement('div'))
    escape(other)
    expect(foreignDismiss).toHaveBeenCalledTimes(1)
    expect(localDismiss).not.toHaveBeenCalled()
    expect(() => layer({ parent: foreign })).toThrow('active in the same document')
    expect(() => local.registerBranch(other.createElement('div'))).toThrow('same document')
    expect(inside(local, other.body)).toBe(false)
  })

  test('last disposal releases listeners, timers, and composition state', () => {
    vi.useFakeTimers()
    const remove = vi.spyOn(document, 'removeEventListener')
    const handle = layer()
    document.dispatchEvent(new Event('compositionstart'))
    document.dispatchEvent(new Event('compositionend'))
    handle.dispose()
    expect(vi.getTimerCount()).toBe(0)
    expect(remove.mock.calls.map(([name]) => name)).toEqual(
      expect.arrayContaining(['keydown', 'compositionstart', 'compositionend'])
    )
    remove.mockRestore()
    const dismiss = vi.fn()
    layer({ onDismiss: dismiss })
    escape()
    expect(dismiss).toHaveBeenCalledTimes(1)
  })
})
