import { flush } from 'solid-js'
import { expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { expectNoViolations } from '../a11y'
import { spec } from '../spec'
import { mountScrollArea } from './fixture'

/** Read actual thumb geometry after observer and rendering work reaches the browser. */
async function measured(view: ReturnType<typeof mountScrollArea>, axis = 'vertical') {
  const track = view.getByTestId(axis)
  await expect
    .poll(
      () =>
        track.querySelector<HTMLElement>('[data-part="thumb"]')?.getBoundingClientRect()[
          axis === 'vertical' ? 'height' : 'width'
        ] ?? 0
    )
    .toBeGreaterThan(0)
  return { track, thumb: track.querySelector<HTMLElement>('[data-part="thumb"]')! }
}

spec('scroll-area.alpha.1', async () => {
  const view = mountScrollArea({ vertical: false })
  const viewport = view.viewport()
  await expect.poll(() => viewport.tabIndex).toBe(0)
  expect(view.queryByRole('scrollbar')).toBeNull()
  expect(viewport.style.scrollbarWidth).not.toBe('none')
  await userEvent.click(view.getByRole('button', { name: 'Before scroll area' }))
  await userEvent.tab()
  expect(viewport).toHaveFocus()
  await userEvent.keyboard('{ArrowDown}')
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
  viewport.scrollTop = 0
  await expect.poll(() => viewport.scrollTop).toBe(0)
  await userEvent.wheel(viewport, { delta: { y: 120 } })
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(20)
  await expectNoViolations(view.container)
})

spec('scroll-area.alpha.2', async () => {
  const view = mountScrollArea()
  const viewport = view.viewport()
  const { track, thumb } = await measured(view)
  await expect.poll(() => viewport.style.scrollbarWidth).toBe('none')
  const initial = thumb.getBoundingClientRect()
  await userEvent.dragAndDrop(thumb, track)
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(100)
  expect(thumb.getBoundingClientRect().top).toBeGreaterThan(initial.top)
  expect(track).toHaveFocus()
  expect(document.documentElement.style.userSelect).toBe('')
  expect(view.getByTestId('root')).not.toHaveAttribute('data-dragging')
  const box = track.getBoundingClientRect()
  await userEvent.click(track, { position: { x: box.width / 2, y: box.height - 3 } })
  await expect
    .poll(() => viewport.scrollTop)
    .toBeGreaterThanOrEqual(viewport.scrollHeight - viewport.clientHeight - 1)
  expect(track).toHaveAttribute('aria-valuenow', '100')
})

spec('scroll-area.alpha.3', async () => {
  const view = mountScrollArea()
  const viewport = view.viewport()
  const { track } = await measured(view)
  track.focus()
  await userEvent.keyboard('{ArrowDown}')
  expect(viewport.scrollTop).toBe(40)
  await userEvent.keyboard('{PageDown}')
  expect(viewport.scrollTop).toBe(220)
  await userEvent.keyboard('{End}')
  expect(viewport.scrollTop).toBe(viewport.scrollHeight - viewport.clientHeight)
  expect(track).toHaveAttribute('aria-valuenow', '100')
  await userEvent.keyboard('{Home}')
  expect(viewport.scrollTop).toBe(0)
  await userEvent.wheel(track, { delta: { y: 80 } })
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
  expect(track).toHaveAttribute('aria-controls', viewport.id)
  view.renameViewport('reader-pane')
  expect(track).toHaveAttribute('aria-controls', 'reader-pane')
  expect(track).not.toHaveAttribute('aria-orientation')
  await expectNoViolations(view.container)
})

spec('scroll-area.alpha.4', async () => {
  const view = mountScrollArea({
    dir: 'rtl',
    horizontal: true,
    vertical: false,
    contentWidth: 960,
    contentHeight: 120,
  })
  const viewport = view.viewport()
  const { track, thumb } = await measured(view, 'horizontal')
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('100')
  expect(track).toHaveAttribute('aria-orientation', 'horizontal')
  // Native RTL starts at the physical right edge; the thumb must stay inside its track.
  await expect
    .poll(() => Math.abs(thumb.getBoundingClientRect().right - track.getBoundingClientRect().right))
    .toBeLessThan(2)
  track.focus()
  await userEvent.keyboard('{Home}')
  await expect.poll(() => viewport.scrollLeft).toBeLessThan(-700)
  expect(track).toHaveAttribute('aria-valuenow', '0')
  await expect
    .poll(() => Math.abs(thumb.getBoundingClientRect().left - track.getBoundingClientRect().left))
    .toBeLessThan(2)
  await userEvent.keyboard('{ArrowRight}')
  expect(viewport.scrollLeft).toBe(-680)
  await userEvent.keyboard('{End}')
  expect(viewport.scrollLeft).toBe(0)
  expect(track).toHaveAttribute('aria-valuenow', '100')
  // Direction changes do not produce native scroll or resize events.
  view.getByTestId('root').dir = 'ltr'
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('0')
  await expect
    .poll(() => Math.abs(thumb.getBoundingClientRect().left - track.getBoundingClientRect().left))
    .toBeLessThan(2)
  view.getByTestId('root').dir = 'rtl'
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('100')
  await expect
    .poll(() => Math.abs(thumb.getBoundingClientRect().right - track.getBoundingClientRect().right))
    .toBeLessThan(2)
  view.getByTestId('root').dir = 'ltr'
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('0')
})

// alpha.4 above covers the same steps with native keys. Here both keys land in
// one task, so no native scroll event is delivered before the direction
// changes, which is the ordering that left the thumb stale in #62.
test('keyboard offsets set before any scroll event still publish a later direction change', async () => {
  const view = mountScrollArea({
    dir: 'rtl',
    horizontal: true,
    vertical: false,
    contentWidth: 960,
    contentHeight: 120,
  })
  const viewport = view.viewport()
  const { track, thumb } = await measured(view, 'horizontal')
  track.focus()
  await userEvent.keyboard('{Home}')
  await expect.poll(() => viewport.scrollLeft).toBeLessThan(-700)
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('0')
  for (const key of ['ArrowRight', 'End']) {
    track.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    flush()
  }
  expect(viewport.scrollLeft).toBe(0)
  expect(track).toHaveAttribute('aria-valuenow', '100')
  view.getByTestId('root').dir = 'ltr'
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('0')
  await expect
    .poll(() => Math.abs(thumb.getBoundingClientRect().left - track.getBoundingClientRect().left))
    .toBeLessThan(2)
})

spec('scroll-area.alpha.5', async () => {
  const view = mountScrollArea({ horizontal: true, contentWidth: 960 })
  const viewport = view.viewport()
  const { track, thumb } = await measured(view)
  const horizontal = await measured(view, 'horizontal')
  await expect.poll(() => view.getByTestId('corner').hidden).toBe(false)
  expect(view.getByTestId('corner').getBoundingClientRect().width).toBe(12)
  expect(view.getByTestId('corner').getBoundingClientRect().height).toBe(12)
  expect(horizontal.track.getBoundingClientRect().width).toBe(228)
  const initialHeight = thumb.getBoundingClientRect().height
  view.resizeContent(960, 1800)
  await expect.poll(() => thumb.getBoundingClientRect().height).toBeLessThan(initialHeight)
  const smallHeight = thumb.getBoundingClientRect().height
  view.resizeViewport(240, 360)
  await expect.poll(() => thumb.getBoundingClientRect().height).toBeGreaterThan(smallHeight)
  expect(view.viewport()).toBe(viewport)
  expect(view.getByTestId('vertical')).toBe(track)
  const outerHeight = track.offsetHeight
  const beforeBorder = thumb.getBoundingClientRect().height
  track.style.boxSizing = 'border-box'
  track.style.borderBlock = '4px solid transparent'
  await expect.poll(() => thumb.getBoundingClientRect().height).toBeLessThan(beforeBorder)
  expect(track.offsetHeight).toBe(outerHeight)
  view.resizeContent(120, 120)
  await expect.poll(() => track.hidden).toBe(true)
  await expect.poll(() => horizontal.track.hidden).toBe(true)
  await expect.poll(() => viewport.hasAttribute('tabindex')).toBe(false)
  expect(view.getByTestId('corner')).toHaveAttribute('hidden')
})

spec('scroll-area.alpha.6', async () => {
  const view = mountScrollArea({ horizontal: false, contentWidth: 960 })
  const viewport = view.viewport()
  await measured(view)
  // The unrepresented horizontal axis must retain the native scrollbar option.
  await expect.poll(() => view.getByTestId('root').hasAttribute('data-overflow-x')).toBe(true)
  expect(viewport.style.scrollbarWidth).not.toBe('none')
  await userEvent.wheel(viewport, { delta: { x: 160 } })
  await expect.poll(() => viewport.scrollLeft).toBeGreaterThan(0)
})

spec('scroll-area.alpha.7', async () => {
  const view = mountScrollArea()
  const viewport = view.viewport()
  const { track, thumb } = await measured(view)
  viewport.style.scrollSnapType = 'y proximity'
  viewport.style.scrollBehavior = 'smooth'
  const originalSnap = viewport.style.scrollSnapType
  const originalSelection = document.documentElement.style.userSelect
  const thumbBox = thumb.getBoundingClientRect()
  const pointer = (type: string, id = 17, y = thumbBox.top + 4) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: id,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: thumbBox.left + 4,
      clientY: y,
    })
  // Synthetic cancellation and disposal regression; this does not claim native touch input.
  thumb.dispatchEvent(pointer('pointerdown'))
  flush()
  expect(view.getByTestId('root')).toHaveAttribute('data-dragging')
  expect(document.documentElement.style.userSelect).toBe('none')
  expect(viewport.style.scrollSnapType).toBe('none')
  const before = viewport.scrollTop
  document.dispatchEvent(pointer('pointermove', 18, thumbBox.top + 90))
  expect(viewport.scrollTop).toBe(before)
  document.dispatchEvent(pointer('pointermove', 17, thumbBox.top + 90))
  expect(viewport.scrollTop).toBeGreaterThan(before)
  document.dispatchEvent(pointer('pointercancel'))
  flush()
  expect(view.getByTestId('root')).not.toHaveAttribute('data-dragging')
  expect(document.documentElement.style.userSelect).toBe(originalSelection)
  expect(viewport.style.scrollSnapType).toBe(originalSnap)
  expect(viewport.style.scrollBehavior).toBe('smooth')
  thumb.dispatchEvent(pointer('pointerdown'))
  expect(document.documentElement.style.userSelect).toBe('none')
  view.remove()
  expect(document.documentElement.style.userSelect).toBe(originalSelection)
  expect(viewport.style.scrollSnapType).toBe(originalSnap)
  const removedOffset = viewport.scrollTop
  document.dispatchEvent(pointer('pointermove', 17, thumbBox.top + 150))
  document.dispatchEvent(pointer('pointerup'))
  expect(viewport.scrollTop).toBe(removedOffset)
  expect(track.isConnected).toBe(false)
})

spec('scroll-area.alpha.8', async () => {
  const view = mountScrollArea()
  const viewport = view.viewport()
  const { track } = await measured(view)
  viewport.style.scrollBehavior = 'smooth'
  // Synthetic dispatch checks cancellation synchronously, before smooth scrolling settles.
  const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 })
  track.dispatchEvent(wheel)
  expect(wheel.defaultPrevented).toBe(true)
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
  await expect.poll(() => viewport.scrollTop).toBe(100)
  // A real provider wheel must also be consumed and move the native viewport.
  let nativeWheel: { trusted: boolean; prevented: boolean } | undefined
  const record = (event: WheelEvent) => {
    if (event.target instanceof Node && track.contains(event.target)) {
      nativeWheel = { trusted: event.isTrusted, prevented: event.defaultPrevented }
    }
  }
  window.addEventListener('wheel', record)
  try {
    await userEvent.wheel(track, { delta: { y: 100 } })
    await expect.poll(() => nativeWheel).toEqual({ trusted: true, prevented: true })
    await expect.poll(() => viewport.scrollTop).toBeGreaterThan(100)
  } finally {
    window.removeEventListener('wheel', record)
  }
})
