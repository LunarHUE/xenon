import { render } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { FloatingViewport } from '../../../solid/src/internal/floating-viewport'

const cleanups: (() => void)[] = []
afterEach(() => {
  cleanups
    .splice(0)
    .reverse()
    .forEach((cleanup) => cleanup())
  flush()
})
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function fixture() {
  const listeners = new Set<() => void>()
  const [payload, setPayload] = createSignal(0)
  const [open, setOpen] = createSignal(true)
  const container = document.createElement('div')
  document.body.append(container)
  let viewport!: HTMLDivElement
  const widths = [160, 300, 220]
  const heights = [100, 180, 130]
  const dispose = render(
    () => (
      <>
        <style>{`
      .test-viewport { position:relative; width:var(--viewport-width); height:var(--viewport-height); overflow:hidden; transition:width 400ms linear,height 400ms linear; }
      .test-viewport > [data-current] { width:max-content; }
      .test-viewport > [data-current], .test-viewport > [data-previous] { opacity:1; transition:opacity 400ms linear; }
      .test-viewport > [data-current][data-starting-style], .test-viewport > [data-previous][data-ending-style] { opacity:0; }
    `}</style>
        <form id="viewport-form">
          <FloatingViewport
            class="test-viewport"
            ref={(el) => {
              viewport = el
            }}
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
            <div style={{ width: `${widths[payload()]}px`, height: `${heights[payload()]}px` }}>
              <label for="viewport-field">{['Alpha', 'Beta', 'Gamma'][payload()]}</label>
              <input id="viewport-field" name="value" value={['a', 'b', 'c'][payload()]} />
            </div>
          </FloatingViewport>
        </form>
      </>
    ),
    container
  )
  cleanups.push(() => {
    dispose()
    container.remove()
  })
  flush()
  const switchTo = (next: number) => {
    listeners.forEach((listener) => listener())
    setPayload(next)
    flush()
  }
  return { viewport, container, switchTo, setOpen, listeners, dispose }
}

test('real CSS animates dimensions and snapshots through rapid content changes', async () => {
  const { viewport, container, switchTo } = fixture()
  await frame()
  expect(viewport.getBoundingClientRect().width).toBe(160)
  switchTo(1)
  await frame()
  const previous = viewport.querySelector<HTMLElement>('[data-previous]')!
  expect(previous.textContent).toBe('Alpha')
  expect(previous.inert).toBe(true)
  expect(previous.getAttribute('aria-hidden')).toBe('true')
  expect(container.querySelectorAll('#viewport-field')).toHaveLength(1)
  expect(previous.querySelector('[id],[for],[name],[form]')).toBeNull()
  expect(new FormData(container.querySelector('form')!).getAll('value')).toEqual(['b'])
  expect(viewport.style.getPropertyValue('--viewport-width')).toBe('300px')
  expect(viewport.style.getPropertyValue('--viewport-height')).toBe('180px')
  await expect.poll(() => viewport.getBoundingClientRect().width).toBeGreaterThan(160)
  expect(viewport.getBoundingClientRect().width).toBeLessThan(300)
  expect(viewport.getAnimations().some((animation) => animation.playState === 'running')).toBe(true)
  switchTo(2)
  await frame()
  expect(viewport.querySelector('[data-previous]')?.textContent).toBe('Beta')
  expect(viewport.querySelector('[data-current]')?.textContent).toBe('Gamma')
  expect(viewport.style.getPropertyValue('--viewport-width')).toBe('220px')
  expect(viewport.style.getPropertyValue('--viewport-height')).toBe('130px')
  await expect.poll(() => viewport.querySelector('[data-previous]')).toBeNull()
  await expect.poll(() => viewport.getBoundingClientRect().width).toBe(220)
  await expect.poll(() => viewport.getBoundingClientRect().height).toBe(130)
  expect(viewport.hasAttribute('data-transitioning')).toBe(false)
})

test('close cancels a running snapshot and reopening can switch again', async () => {
  const { viewport, switchTo, setOpen, listeners, dispose } = fixture()
  await frame()
  switchTo(1)
  await frame()
  expect(viewport.querySelector('[data-previous]')).not.toBeNull()
  setOpen(false)
  flush()
  expect(viewport.querySelector('[data-previous]')).toBeNull()
  setOpen(true)
  flush()
  switchTo(2)
  await frame()
  expect(viewport.querySelector('[data-previous]')?.textContent).toBe('Beta')
  await expect.poll(() => viewport.querySelector('[data-previous]')).toBeNull()
  expect(viewport.querySelector('[data-current]')?.textContent).toBe('Gamma')
  dispose()
  expect(listeners.size).toBe(0)
})
