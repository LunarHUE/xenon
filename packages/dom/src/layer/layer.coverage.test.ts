import { afterEach, expect, test, vi } from 'vitest'
import { registerLayer } from './layer'

const handles = [] as ReturnType<typeof registerLayer>[]

afterEach(() => {
  for (const handle of handles.splice(0)) handle.dispose()
  document.body.replaceChildren()
})

function contains(layer: Element, target: Element) {
  const dismissed = vi.fn()
  // Runtime containment accepts SVG; the public signature still requires HTMLElement.
  const handle = registerLayer(layer as unknown as HTMLElement, {
    outsidePointer: 'dismiss',
    onDismiss: dismissed,
  })
  handles.push(handle)
  let result = false
  target.addEventListener(
    'probe',
    (event) => {
      result = handle.contains(event)
    },
    { once: true }
  )
  target.dispatchEvent(new Event('probe', { bubbles: true, composed: true }))
  return { result, dismissed }
}

function pointer(type: 'pointerdown' | 'pointerup', target: Element, pointerId = 1) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      pointerId,
      isPrimary: true,
      button: 0,
      clientX: 1,
      clientY: 1,
    })
  )
}

test.each([
  ['HTML layer contains HTML target', 'div', 'button'],
  ['HTML layer contains SVG target', 'div', 'svg'],
  ['SVG layer contains HTML target', 'svg', 'button'],
  ['SVG layer contains SVG target', 'svg', 'circle'],
] as const)('interact-outside.pointer.7 %s', async (_label, layerTag, targetTag) => {
  const svg = 'http://www.w3.org/2000/svg'
  const create = (tag: 'div' | 'button' | 'svg' | 'circle') =>
    tag === 'svg' || tag === 'circle'
      ? document.createElementNS(svg, tag)
      : document.createElement(tag)
  const layer = create(layerTag)
  const target = create(targetTag)
  layer.append(target)
  document.body.append(layer)
  expect(layer instanceof SVGElement).toBe(layerTag === 'svg')
  expect(target instanceof SVGElement).toBe(targetTag === 'svg' || targetTag === 'circle')
  const insideResult = contains(layer, target)
  expect(insideResult.result).toBe(true)
  pointer('pointerdown', target)
  pointer('pointerup', target)
  expect(insideResult.dismissed).not.toHaveBeenCalled()

  const outside = create(targetTag)
  document.body.append(outside)
  pointer('pointerdown', outside, 2)
  pointer('pointerup', outside, 2)
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  expect(insideResult.dismissed).toHaveBeenCalledOnce()
})
