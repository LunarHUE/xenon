import { render } from '@solidjs/web'
import { ScrollArea } from '@xenon/solid/scroll-area'
import type { ScrollAreaType } from '@xenon/solid/scroll-area'
import { within } from '@testing-library/dom'
import { createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

/**
 * Options for the local native overflow fixture. Every pane is laid out with real
 * element dimensions, so no geometry or observer mock participates.
 */
interface PaneOptions {
  /** Custom scrollbar visibility policy; omitted keeps the component default. */
  type?: ScrollAreaType
  /** Delay before scroll-mode bars hide, in milliseconds. */
  scrollHideDelay?: number
  /** Initial content height in pixels; default 900 against a 180px viewport. */
  contentHeight?: number
  /** Author handler invoked before the track's core wheel handling. */
  onWheel?: (event: WheelEvent) => void
  /** Author handler invoked before the track's core pointer handling. */
  onPointerDown?: (event: PointerEvent) => void
}

/** Mounts one overflowing pane and its custom track between two sibling buttons. */
function mountPane(options: PaneOptions = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const [content, setContent] = createSignal(options.contentHeight ?? 900)
  const handlers = {
    ...(options.onWheel ? { onWheel: options.onWheel } : {}),
    ...(options.onPointerDown ? { onPointerDown: options.onPointerDown } : {}),
  }
  const dispose = render(
    () => (
      <>
        <button type="button">Before pane</button>
        <ScrollArea
          type={options.type}
          scrollHideDelay={options.scrollHideDelay}
          data-testid="root"
          style={{ width: '240px', height: '180px' }}
        >
          <ScrollArea.Viewport aria-label="Pane" style={{ width: '100%', height: '100%' }}>
            <ScrollArea.Content style={{ height: `${content()}px` }}>
              Pane content
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar data-testid="track" {...handlers} style={{ width: '12px' }}>
            <ScrollArea.Thumb style={{ background: 'gray' }} />
          </ScrollArea.Scrollbar>
        </ScrollArea>
        <button type="button">After pane</button>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const view = within(container)
  return {
    container,
    ...view,
    root: () => view.getByTestId('root'),
    viewport: () => view.getByRole('region', { name: 'Pane' }),
    track: () => view.getByTestId('track'),
    thumb: () => view.getByTestId('track').querySelector<HTMLElement>('[data-part="thumb"]')!,
    resizeContent: (height: number) => {
      setContent(height)
      flush()
    },
  }
}

/** Mounts an overflowing inner pane inside an overflowing outer pane, each with a custom track. */
function mountNested() {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(
    () => (
      <>
        <button type="button">Before panes</button>
        <ScrollArea data-testid="outer-root" style={{ width: '240px', height: '180px' }}>
          <ScrollArea.Viewport aria-label="Outer pane" style={{ width: '100%', height: '100%' }}>
            <ScrollArea.Content style={{ height: '900px' }}>
              <ScrollArea data-testid="inner-root" style={{ width: '200px', height: '180px' }}>
                <ScrollArea.Viewport
                  aria-label="Inner pane"
                  style={{ width: '100%', height: '100%' }}
                >
                  <ScrollArea.Content style={{ height: '900px' }}>Inner content</ScrollArea.Content>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar data-testid="inner-track" style={{ width: '12px' }}>
                  <ScrollArea.Thumb style={{ background: 'gray' }} />
                </ScrollArea.Scrollbar>
              </ScrollArea>
            </ScrollArea.Content>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar data-testid="outer-track" style={{ width: '12px' }}>
            <ScrollArea.Thumb style={{ background: 'gray' }} />
          </ScrollArea.Scrollbar>
        </ScrollArea>
        <button type="button">After panes</button>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const view = within(container)
  return {
    container,
    ...view,
    outerRoot: () => view.getByTestId('outer-root'),
    innerRoot: () => view.getByTestId('inner-root'),
    outer: () => view.getByRole('region', { name: 'Outer pane' }),
    inner: () => view.getByRole('region', { name: 'Inner pane' }),
    outerTrack: () => view.getByTestId('outer-track'),
    innerTrack: () => view.getByTestId('inner-track'),
  }
}

/** Whether a track thumb is shorter than its track, which requires measured geometry. */
function proportional(track: Element) {
  const thumb = track.querySelector('[data-part="thumb"]')?.getBoundingClientRect()
  return !!thumb && thumb.height > 0 && thumb.height < track.getBoundingClientRect().height
}

/** Waits until observed vertical overflow reaches a rendered root. */
async function settleOverflow(view: { root(): Element }) {
  await expect.poll(() => view.root().hasAttribute('data-overflow-y')).toBe(true)
}

/** Waits for proportional thumb geometry instead of a track's unmeasured thumb. */
async function settleThumb(view: { track(): Element }) {
  await expect.poll(() => proportional(view.track())).toBe(true)
}

test('nested custom regions keep wheel scrolling in the inner viewport and chain to the outer at its edge', async () => {
  const view = mountNested()
  const outer = view.outer()
  const inner = view.inner()
  const outerTrack = view.outerTrack()
  const innerTrack = view.innerTrack()
  await expect.poll(() => view.outerRoot().hasAttribute('data-overflow-y')).toBe(true)
  await expect.poll(() => view.innerRoot().hasAttribute('data-overflow-y')).toBe(true)
  await expect.poll(() => proportional(outerTrack)).toBe(true)
  await expect.poll(() => proportional(innerTrack)).toBe(true)
  const innerRange = () => inner.scrollHeight - inner.clientHeight
  expect(innerRange()).toBeGreaterThan(0)
  expect(outer.scrollHeight - outer.clientHeight).toBeGreaterThan(0)

  // A wheel inside the inner region is consumed there and never reaches the outer region.
  await userEvent.wheel(inner, { delta: { y: 100 } })
  await expect.poll(() => inner.scrollTop).toBeGreaterThan(0)
  expect(inner.scrollTop).toBeLessThanOrEqual(100)
  expect(outer.scrollTop).toBe(0)
  expect(outerTrack).toHaveAttribute('aria-valuenow', '0')

  // With the inner region at its own end, the same direction continues into the outer region.
  inner.scrollTop = innerRange()
  await expect.poll(() => inner.scrollTop).toBe(innerRange())
  await expect.poll(() => innerTrack.getAttribute('aria-valuenow')).toBe('100')
  // Start a separate gesture after Firefox's wheel transaction releases its target.
  await new Promise((resolve) => setTimeout(resolve, 1600))
  await userEvent.wheel(inner, { delta: { y: 100 }, times: 2 })
  await expect.poll(() => outer.scrollTop, { timeout: 2000 }).toBeGreaterThan(0)
  await expect.poll(() => Number(outerTrack.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
  expect(inner.scrollTop).toBe(innerRange())
})

test('two independent scroll areas keep their own viewport wiring, scrolling and custom tracks', async () => {
  const first = mountPane()
  const second = mountPane({ contentHeight: 1800 })
  const firstViewport = first.viewport()
  const secondViewport = second.viewport()
  const firstTrack = first.track()
  const secondTrack = second.track()
  await settleThumb(first)
  await settleThumb(second)
  expect(firstViewport.id).not.toBe(secondViewport.id)
  expect(firstTrack).toHaveAttribute('aria-controls', firstViewport.id)
  expect(secondTrack).toHaveAttribute('aria-controls', secondViewport.id)

  // The first custom track moves only its own viewport.
  firstTrack.focus()
  await userEvent.keyboard('{End}')
  await expect
    .poll(() => firstViewport.scrollTop)
    .toBe(firstViewport.scrollHeight - firstViewport.clientHeight)
  expect(secondViewport.scrollTop).toBe(0)
  await expect.poll(() => firstTrack.getAttribute('aria-valuenow')).toBe('100')
  expect(secondTrack).toHaveAttribute('aria-valuenow', '0')

  // Native wheel input in the second region leaves the first one alone.
  await userEvent.wheel(secondViewport, { delta: { y: 120 } })
  await expect.poll(() => secondViewport.scrollTop).toBeGreaterThan(0)
  expect(firstViewport.scrollTop).toBe(firstViewport.scrollHeight - firstViewport.clientHeight)
  await expect.poll(() => Number(secondTrack.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
})

test('a content size change during an active thumb drag drives the next movement and the end of range', async () => {
  const view = mountPane()
  const viewport = view.viewport()
  const track = view.track()
  const thumb = view.thumb()
  await settleOverflow(view)
  await settleThumb(view)
  const trackBox = track.getBoundingClientRect()
  const thumbBox = thumb.getBoundingClientRect()
  const initialThumb = thumbBox.height
  // Synthetic pointer events: no provider API holds a drag open across a re-measure.
  const pointer = (type: string, y: number) =>
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 7,
      pointerType: 'mouse',
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: thumbBox.left + 6,
      clientY: y,
    })
  thumb.dispatchEvent(pointer('pointerdown', thumbBox.top + 2))
  flush()
  expect(view.root()).toHaveAttribute('data-dragging')

  // Growing the content mid-drag must re-measure the thumb instead of reusing press-time geometry.
  view.resizeContent(1800)
  await expect.poll(() => thumb.getBoundingClientRect().height).toBeLessThan(initialThumb)

  // The held drag continues: the track end must reach the new content end.
  document.dispatchEvent(pointer('pointermove', trackBox.bottom + 20))
  flush()
  await expect.poll(() => viewport.scrollTop).toBe(viewport.scrollHeight - viewport.clientHeight)
  await expect.poll(() => track.getAttribute('aria-valuenow')).toBe('100')
  await expect
    .poll(() => thumb.getBoundingClientRect().bottom)
    .toBeLessThanOrEqual(trackBox.bottom + 1)
  expect(thumb.getBoundingClientRect().top).toBeGreaterThanOrEqual(trackBox.top - 1)

  document.dispatchEvent(pointer('pointerup', trackBox.bottom + 20))
  flush()
  expect(view.root()).not.toHaveAttribute('data-dragging')
})

test('author wheel and pointer cancellation keep the custom track and native viewport in place', async () => {
  const vetoWheel = vi.fn((event: WheelEvent) => event.preventDefault())
  const vetoPointer = vi.fn((event: PointerEvent) => event.preventDefault())
  const view = mountPane({ onWheel: vetoWheel, onPointerDown: vetoPointer })
  const viewport = view.viewport()
  const track = view.track()
  await settleOverflow(view)
  await settleThumb(view)

  // The author handler owns the wheel before core handling: no offset and no value change.
  await userEvent.wheel(track, { delta: { y: 100 } })
  expect(vetoWheel).toHaveBeenCalledOnce()
  expect(viewport.scrollTop).toBe(0)
  expect(track).toHaveAttribute('aria-valuenow', '0')

  // The same cancellation applies to a native press that would otherwise center the thumb.
  const trackBox = track.getBoundingClientRect()
  await userEvent.click(track, { position: { x: 6, y: trackBox.height - 4 } })
  expect(vetoPointer).toHaveBeenCalled()
  expect(view.root()).not.toHaveAttribute('data-dragging')
  expect(viewport.scrollTop).toBe(0)
})

test('hover policy reveals an overflowing custom track only while a real pointer is inside the root', async () => {
  const view = mountPane({ type: 'hover' })
  const track = view.track()
  await settleOverflow(view)

  // The pointer sits outside the root, so the overflowing track stays hidden.
  await userEvent.hover(view.getByRole('button', { name: 'Before pane' }))
  await expect.poll(() => track.hidden).toBe(true)
  expect(track).toHaveAttribute('data-state', 'hidden')

  // A real pointer inside the root reveals it.
  await userEvent.hover(view.viewport())
  await expect.poll(() => track.hidden).toBe(false)
  expect(track).toHaveAttribute('data-state', 'visible')

  // Leaving the root hides it again.
  await userEvent.hover(view.getByRole('button', { name: 'After pane' }))
  await expect.poll(() => track.hidden).toBe(true)
})

test('scroll policy shows the custom track while native wheel scrolling lasts and hides it after the delay', async () => {
  const view = mountPane({ type: 'scroll', scrollHideDelay: 1000 })
  const root = view.root()
  const viewport = view.viewport()
  const track = view.track()
  await settleOverflow(view)
  expect(track.hidden).toBe(true)
  expect(root).not.toHaveAttribute('data-scrolling')

  // Native wheel scrolling exposes the overflowing track and reports the scroll state.
  await userEvent.wheel(viewport, { delta: { y: 120 } })
  await expect.poll(() => viewport.scrollTop).toBeGreaterThan(0)
  await expect.poll(() => root.hasAttribute('data-scrolling')).toBe(true)
  await expect.poll(() => track.hidden).toBe(false)
  expect(track).toHaveAttribute('data-state', 'visible')

  // The policy hides the track again once the last scroll has aged out.
  await expect.poll(() => track.hidden, { timeout: 2500 }).toBe(true)
  expect(root).not.toHaveAttribute('data-scrolling')
  expect(track).toHaveAttribute('data-state', 'hidden')
})
