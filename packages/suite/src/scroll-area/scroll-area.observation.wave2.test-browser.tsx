import { observeScrollArea, readScrollArea, setScrollAreaOffset } from '@xenon-ui/dom/scroll-area'
import { expect, onTestFinished, test, vi } from 'vitest'

/** Native overflow geometry with borders and a separately sized content box. */
function setup(direction: 'ltr' | 'rtl' = 'ltr') {
  const ancestor = document.createElement('div'),
    viewport = document.createElement('div'),
    content = document.createElement('div')
  ancestor.dir = direction
  viewport.style.cssText =
    'width:200px;height:120px;overflow:scroll;border:7px solid;scroll-behavior:auto'
  content.style.cssText = 'width:800px;height:600px'
  viewport.append(content)
  ancestor.append(viewport)
  document.body.append(ancestor)
  const change = vi.fn()
  const observer = observeScrollArea(viewport, content, change)
  onTestFinished(() => {
    observer.destroy()
    ancestor.remove()
  })
  return { ancestor, viewport, content, change, observer }
}

for (const direction of ['ltr', 'rtl'] as const)
  test(`${direction} native physical offsets round trip at both edges and preserve the other axis`, () => {
    const s = setup(direction)
    const max = s.viewport.scrollWidth - s.viewport.clientWidth
    setScrollAreaOffset(s.viewport, 'vertical', 70)
    for (const requested of [-100, 0, 83, max, max + 100]) {
      setScrollAreaOffset(s.viewport, 'horizontal', requested)
      expect(readScrollArea(s.viewport).left).toBe(Math.max(0, Math.min(max, requested)))
      expect(readScrollArea(s.viewport).top).toBe(70)
    }
    const nativeLeft = s.viewport.scrollLeft
    setScrollAreaOffset(s.viewport, 'vertical', 100000)
    expect(readScrollArea(s.viewport).top).toBe(s.viewport.scrollHeight - s.viewport.clientHeight)
    expect(s.viewport.scrollLeft).toBe(nativeLeft)
    expect(readScrollArea(s.viewport).width).toBe(s.viewport.clientWidth)
    expect(s.viewport.getBoundingClientRect().width).toBeGreaterThan(s.viewport.clientWidth)
  })

test('native content resizing and ancestor direction changes publish new physical metrics', async () => {
  const s = setup()
  s.content.style.width = '1000px'
  await expect.poll(() => s.change.mock.lastCall?.[0].scrollWidth).toBe(1000)
  s.ancestor.dir = 'rtl'
  await expect
    .poll(() => s.change.mock.lastCall?.[0].left)
    .toBe(s.viewport.scrollWidth - s.viewport.clientWidth)
  expect(readScrollArea(s.viewport).left).toBe(s.viewport.scrollWidth - s.viewport.clientWidth)
})

test('unchanged explicit, scroll, resize and captured load measurements are deduplicated', async () => {
  const s = setup()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  s.change.mockClear()
  s.observer.measure()
  s.viewport.dispatchEvent(new Event('scroll'))
  window.dispatchEvent(new Event('resize'))
  s.content.dispatchEvent(new Event('load'))
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  expect(s.change).not.toHaveBeenCalled()
})

test('destroy cancels queued geometry work and detaches native resize, load, scroll and direction delivery', async () => {
  const s = setup()
  s.content.dispatchEvent(new Event('load'))
  s.observer.destroy()
  s.observer.destroy()
  s.change.mockClear()
  s.content.style.height = '1200px'
  s.ancestor.dir = 'rtl'
  s.viewport.style.height = '90px'
  s.viewport.scrollTop = 100
  s.viewport.dispatchEvent(new Event('scroll'))
  s.content.dispatchEvent(new Event('load'))
  window.dispatchEvent(new Event('resize'))
  s.observer.measure()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  expect(s.change).not.toHaveBeenCalled()
})

test('separate observers on one viewport survive disposal independently', async () => {
  const s = setup(),
    second = vi.fn()
  const observer = observeScrollArea(s.viewport, undefined, second)
  onTestFinished(observer.destroy)
  s.observer.destroy()
  s.change.mockClear()
  s.content.style.height = '1000px'
  await expect.poll(() => second.mock.lastCall?.[0].scrollHeight).toBe(1000)
  expect(s.change).not.toHaveBeenCalled()
  observer.destroy()
  second.mockClear()
  s.content.style.height = '1500px'
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  expect(second).not.toHaveBeenCalled()
})
