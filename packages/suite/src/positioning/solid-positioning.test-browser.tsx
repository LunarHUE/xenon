import { createPositioner } from '@tenon/solid/positioning'
import type { Positioner } from '@tenon/solid/positioning'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { createSignal, flush, untrack } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

const cleanups: (() => void)[] = []
function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const stop = render(children, container)
  let active = true
  const dispose = () => {
    if (!active) return
    active = false
    stop()
    container.remove()
  }
  cleanups.push(dispose)
  flush()
  return { container, dispose }
}

afterEach(() => {
  for (const dispose of cleanups.splice(0).reverse()) dispose()
  flush()
})

async function positioned(api: Positioner) {
  await expect.poll(() => api.state().positioned).toBe(true)
  flush()
}

function near(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1)
}

test('initial visibility gives way to measured geometry without changing a nested content transform', async () => {
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [floating, setFloating] = createSignal<HTMLElement>()
  const [arrow, setArrow] = createSignal<HTMLElement>()
  let api!: Positioner
  let initial!: ReturnType<Positioner['positionerProps']>
  const onPositioned = vi.fn()
  const m = mount(() => {
    api = createPositioner({
      anchor,
      floating,
      arrow,
      options: () => ({
        side: 'bottom',
        align: 'start',
        sideOffset: 12,
        flip: false,
        shift: false,
        onPositioned,
      }),
    })
    initial = api.positionerProps()
    return (
      <>
        <button
          ref={setAnchor}
          style={{
            position: 'fixed',
            left: '200px',
            top: '150px',
            width: '100px',
            height: '40px',
            padding: '0',
            border: '0',
          }}
        >
          Anchor
        </button>
        <div ref={setFloating} {...api.positionerProps()}>
          <div
            data-content=""
            style={{
              width: '120px',
              height: '80px',
              transform: 'scale(.9)',
              'transform-origin': 'var(--positioner-transform-origin)',
            }}
          >
            Content
            <span ref={setArrow} {...api.arrowProps()} style={{ width: '8px', height: '8px' }} />
          </div>
        </div>
      </>
    )
  })
  expect(initial.style).toEqual({ visibility: 'hidden', 'pointer-events': 'none' })
  await positioned(api)
  const el = untrack(floating)!
  near(el.getBoundingClientRect().left, 200)
  near(el.getBoundingClientRect().top, 202)
  expect(el.style.visibility).toBe('visible')
  expect(el.getAttribute('data-side')).toBe('bottom')
  expect(el.getAttribute('data-align')).toBe('start')
  expect(el.style.getPropertyValue('--positioner-anchor-width')).toBe('100px')
  expect(untrack(arrow)!.getAttribute('aria-hidden')).toBe('true')
  expect(untrack(arrow)!.style.position).toBe('absolute')
  const content = m.container.querySelector<HTMLElement>('[data-content]')!
  expect(content.style.transform).toBe('scale(0.9)')
  const count = onPositioned.mock.calls.length
  await api.reposition()
  await api.reposition()
  flush()
  expect(onPositioned).toHaveBeenCalledTimes(count)
  expect(content.style.transform).toBe('scale(0.9)')
  expect(el.style.left).toBe('200px')
})

test('changing options and anchor refs updates in place, disabling clears state and unmount cancels work', async () => {
  const [anchor, setAnchor] = createSignal<HTMLElement>()
  const [floating, setFloating] = createSignal<HTMLElement>()
  const [enabled, setEnabled] = createSignal(true)
  const [offset, setOffset] = createSignal(4)
  const [align, setAlign] = createSignal<'start' | 'end'>('start')
  let replacement!: HTMLButtonElement
  let api!: Positioner
  const onPositioned = vi.fn()
  const onError = vi.fn()
  const m = mount(() => {
    api = createPositioner({
      anchor,
      floating,
      enabled,
      options: () => ({
        align: align(),
        sideOffset: offset(),
        flip: false,
        shift: false,
        onPositioned,
        onError,
      }),
    })
    return (
      <>
        <button
          ref={setAnchor}
          style={{ position: 'fixed', left: '200px', top: '100px', width: '100px', height: '40px' }}
        >
          First
        </button>
        <button
          ref={(node) => {
            replacement = node
          }}
          style={{ position: 'fixed', left: '400px', top: '180px', width: '100px', height: '40px' }}
        >
          Second
        </button>
        <div ref={setFloating} {...api.positionerProps()}>
          <div style={{ width: '120px', height: '80px' }}>Content</div>
        </div>
      </>
    )
  })
  await positioned(api)
  const el = untrack(floating)!
  near(api.state().y!, 144)
  setOffset(20)
  setAlign('end')
  flush()
  await expect.poll(() => api.state().y).toBe(160)
  expect(untrack(floating)).toBe(el)
  expect(el.getAttribute('data-align')).toBe('end')
  near(el.getBoundingClientRect().left, 180)
  setAnchor(replacement)
  flush()
  await expect.poll(() => api.state().y).toBe(240)
  near(el.getBoundingClientRect().left, 380)
  setEnabled(false)
  flush()
  expect(api.state().positioned).toBe(false)
  expect(api.state().x).toBeNull()
  expect(el.style.visibility).toBe('hidden')
  const disabledCount = onPositioned.mock.calls.length
  window.dispatchEvent(new Event('resize'))
  await api.reposition()
  expect(onPositioned).toHaveBeenCalledTimes(disabledCount)
  setEnabled(true)
  flush()
  await positioned(api)
  const pending = api.reposition()
  m.dispose()
  const disposedCount = onPositioned.mock.calls.length
  await pending
  await api.reposition()
  expect(onPositioned).toHaveBeenCalledTimes(disposedCount)
  expect(el.isConnected).toBe(false)
  expect(onError).not.toHaveBeenCalled()
})
