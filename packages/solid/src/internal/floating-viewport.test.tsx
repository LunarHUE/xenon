import { render, cleanup } from '@solidjs/testing-library'
import { createSignal, flush, onCleanup } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { FloatingViewport } from './floating-viewport'

afterEach(() => {
  cleanup()
  delete (Element.prototype as { getAnimations?: unknown }).getAnimations
  vi.restoreAllMocks()
})

test('snapshots before payload writes, keeps only live Solid children, and clears on close', async () => {
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    value: () => [{ playState: 'running', finished: new Promise(() => {}) }],
  })
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  const [payload, setPayload] = createSignal('first')
  const [open, setOpen] = createSignal(true)
  const listeners = new Set<() => void>()
  let mounted = 0
  let disposed = 0
  function Child() {
    mounted++
    onCleanup(() => {
      disposed++
    })
    return <span id="live-content">{payload()}</span>
  }
  const view = render(() => (
    <FloatingViewport
      source={{
        open,
        trigger: () => undefined,
        content: () => undefined,
        beforeChange: (listener) => {
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
      }}
    >
      <Child />
    </FloatingViewport>
  ))
  flush()
  await Promise.resolve()
  for (const listener of listeners) listener()
  setPayload('second')
  flush()
  await Promise.resolve()
  expect(view.container.querySelector('[data-current]')?.textContent).toBe('second')
  expect(view.container.querySelector('[data-previous]')?.textContent).toBe('first')
  expect(view.container.querySelectorAll('#live-content')).toHaveLength(1)
  expect(mounted).toBe(1)
  expect(disposed).toBe(0)
  setOpen(false)
  flush()
  expect(view.container.querySelector('[data-previous]')).toBeNull()
  view.unmount()
  expect(listeners.size).toBe(0)
  expect(disposed).toBe(1)
})
