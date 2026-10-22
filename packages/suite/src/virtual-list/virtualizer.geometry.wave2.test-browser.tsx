import { virtualizer } from '@xenon-ui/core/virtualizer'
import { createVirtualizerController } from '@xenon-ui/dom/virtualizer'
import { expect, onTestFinished, test, vi } from 'vitest'

/** The caller owns a real sizer, including its native scrollTop clamping. */
function setup(follow = false) {
  const viewport = document.createElement('div'),
    sizer = document.createElement('div')
  viewport.style.cssText =
    'width:240px;height:100px;overflow:auto;overflow-anchor:none;border:9px solid'
  sizer.style.cssText = 'position:relative;height:1000px'
  viewport.append(sizer)
  document.body.append(viewport)
  const layout = virtualizer({ count: 50, estimateSize: () => 20 })
  const onFollowChange = vi.fn()
  const controller = createVirtualizerController(viewport, { layout, follow, onFollowChange })
  onTestFinished(() => {
    controller.dispose()
    viewport.remove()
  })
  const row = (index: number, height: number) => {
    const element = document.createElement('div')
    element.dataset.index = String(index)
    element.style.cssText = `position:absolute;top:0;height:${height}px;width:100px`
    sizer.append(element)
    controller.measureElement(element)
    return element
  }
  return { viewport, sizer, layout, controller, row, onFollowChange }
}

test('sync reapplies a requested offset after the caller grows a previously clamped native sizer', () => {
  const s = setup()
  s.sizer.style.height = '200px'
  s.controller.scrollToIndex(40, { align: 'start' })
  expect(s.controller.offset()).toBe(800)
  expect(s.viewport.scrollTop).toBe(100)
  s.sizer.style.height = `${s.layout.totalSize()}px`
  s.controller.sync()
  expect(s.viewport.scrollTop).toBe(800)
  expect(s.controller.offset()).toBe(800)
})

test('native viewport resizing uses the inner height and repins a following list', async () => {
  const s = setup(true)
  expect(s.controller.viewportSize()).toBe(s.viewport.clientHeight)
  expect(s.controller.offset()).toBe(900)
  s.viewport.style.height = '160px'
  await expect.poll(s.controller.viewportSize).toBe(160)
  expect(s.controller.offset()).toBe(840)
  expect(s.viewport.scrollTop).toBe(840)
  expect(s.controller.following()).toBe(true)
  expect(s.onFollowChange).not.toHaveBeenCalled()
})

test('native row resize delivery preserves a programmatic target alignment', async () => {
  const s = setup()
  const row = s.row(2, 20)
  s.controller.scrollToIndex(20, { align: 'center' })
  expect(s.controller.offset()).toBe(360)
  row.style.height = '65px'
  await expect.poll(() => s.layout.item(2)?.size).toBe(65)
  s.sizer.style.height = `${s.layout.totalSize()}px`
  s.controller.sync()
  expect(s.controller.offset()).toBe(405)
  expect(s.viewport.scrollTop).toBe(405)
})

test('unmeasured connected rows stop receiving native ResizeObserver changes', async () => {
  const s = setup(),
    row = s.row(3, 35)
  await expect.poll(() => s.layout.item(3)?.size).toBe(35)
  s.controller.unmeasureElement(row)
  row.style.height = '85px'
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  expect(s.layout.item(3)?.size).toBe(35)
  s.controller.measureElement(row)
  expect(s.layout.item(3)?.size).toBe(85)
})

test('native resize and scroll delivery after disposal cannot notify or alter cached viewport state', async () => {
  const s = setup(),
    listener = vi.fn(),
    row = s.row(2, 20)
  s.controller.subscribe(listener)
  s.controller.dispose()
  listener.mockClear()
  row.style.height = '90px'
  s.viewport.style.height = '180px'
  s.viewport.scrollTop = 300
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  expect(s.controller.viewportSize()).toBe(100)
  expect(s.controller.offset()).toBe(0)
  expect(s.layout.item(2)?.size).toBe(20)
  expect(listener).not.toHaveBeenCalled()
})

test('appending while follow is disabled leaves the native viewport at its existing offset', async () => {
  const s = setup()
  s.controller.scrollToOffset(200)
  await expect.poll(() => s.viewport.scrollTop).toBe(200)
  s.layout.setOptions({ count: 70, estimateSize: () => 20 })
  s.sizer.style.height = `${s.layout.totalSize()}px`
  s.controller.update()
  s.controller.sync()
  expect(s.controller.offset()).toBe(200)
  expect(s.viewport.scrollTop).toBe(200)
  expect(s.controller.following()).toBe(false)
})
