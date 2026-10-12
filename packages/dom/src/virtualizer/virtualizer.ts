/** Where a programmatic scroll places an item. */
export type VirtualScrollAlign = 'start' | 'center' | 'end' | 'auto'

/**
 * Layout math the controller drives. The `virtualizer()` result from
 * `@xenon-ui/core/virtualizer` satisfies it; the controller never sets its options.
 */
export interface VirtualLayout {
  /** Largest scroll offset for a viewport. */
  maxOffset(viewportSize: number): number
  /** Whether the viewport reaches the end within threshold pixels. */
  isAtEnd(offset: number, viewportSize: number, threshold?: number): boolean
  /** Offset that brings an item into view. */
  scrollOffset(
    index: number,
    align: VirtualScrollAlign,
    offset: number,
    viewportSize: number
  ): number
  /** Record an item size and report the scroll adjustment that keeps content still. */
  measure(
    index: number,
    size: number,
    offset?: number
  ): { changed: boolean; scrollAdjustment: number }
}

/** Follow mode and the layout to drive. */
export interface VirtualizerControllerOptions {
  /** Shared layout math, typically core `virtualizer()`. */
  layout: VirtualLayout
  /** Keep the list pinned to its end while the user stays there, as in a log viewer. */
  follow?: boolean
  /** Distance from the end that still counts as the end; defaults to 1. */
  followThreshold?: number
  /** Reports changes to whether the list is pinned to its end. Not called for the initial state. */
  onFollowChange?(following: boolean): void
}

/** Scroll element bindings over shared layout math. */
export interface VirtualizerController {
  /** Current scroll offset, updated synchronously by programmatic scrolls. */
  offset(): number
  /** Inner height of the scroll element. */
  viewportSize(): number
  /** Whether follow mode currently keeps the list pinned to its end. */
  following(): boolean
  /** Replace follow options. Enabling follow pins the list to its end. */
  setOptions(options: VirtualizerControllerOptions): void
  /** Call after the layout's count or sizes change; while following, the list stays at its end. */
  update(): void
  /** Scroll an item into view and update the offset before returning. Defaults to auto alignment. */
  scrollToIndex(index: number, options?: { align?: VirtualScrollAlign }): void
  /** Scroll to an offset and update it before returning. */
  scrollToOffset(offset: number): void
  /** Scroll to the end; with follow enabled, following resumes. */
  scrollToEnd(): void
  /** Measure a row carrying data-index now (when connected) and whenever it resizes. */
  measureElement(element: Element): void
  /** Stop measuring a row. Disconnected rows are also dropped on their next resize report. */
  unmeasureElement(element: Element): void
  /** Reapply the last programmatic offset if the browser clamped it before the content grew. */
  sync(): void
  /** Listen for offset, viewport, measurement and follow changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void
  /** Remove listeners and observers. */
  dispose(): void
}

/**
 * Binds a vertical scroll element to virtual list layout math.
 *
 * @remarks
 * Listens for scroll passively and observes the element's size and every
 * measured row with ResizeObserver. Programmatic scrolls write scrollTop and
 * update the offset immediately, so a target row can render before the scroll
 * event arrives. When a row that starts above the offset changes size, its
 * delta is added to scrollTop so visible content stays still. Until the user
 * scrolls, measurements re-align the last scrollToIndex target instead.
 *
 * With follow enabled the list starts pinned to its end and stays there while
 * rows are appended or grow. Scrolling up stops following; reaching the end
 * resumes it. Without following, appended rows never move scrollTop.
 *
 * Callers own the sizer element. Render it at the layout's total size and call
 * sync() after it grows, since the browser clamps scrollTop to the current content.
 */
export function createVirtualizerController(
  element: HTMLElement,
  initial: VirtualizerControllerOptions
): VirtualizerController {
  let options = initial
  const view = element.ownerDocument.defaultView
  const listeners = new Set<() => void>()
  let offset = element.scrollTop
  let size = element.clientHeight
  let following = false
  let written: number | undefined
  let target: { index: number; align: VirtualScrollAlign } | undefined
  let disposed = false

  const layout = () => options.layout
  const notify = () => {
    if (!disposed) listeners.forEach((listener) => listener())
  }
  const setFollowing = (next: boolean) => {
    if (next === following) return
    following = next
    options.onFollowChange?.(next)
  }
  const atEnd = () => layout().isAtEnd(offset, size, options.followThreshold)
  const write = (next: number) => {
    offset = Math.max(0, Math.min(layout().maxOffset(size), next))
    written = offset
    element.scrollTop = offset
  }
  const pin = () => write(layout().maxOffset(size))

  const onScroll = () => {
    const top = element.scrollTop
    const programmatic = written !== undefined && Math.abs(top - written) < 1
    if (!programmatic) {
      written = undefined
      target = undefined
    }
    const previous = offset
    offset = top
    if (options.follow) {
      if (atEnd()) setFollowing(true)
      else if (!programmatic && top < previous) setFollowing(false)
    }
    notify()
  }
  const onResize = () => {
    const next = element.clientHeight
    if (next === size) return
    size = next
    if (following) pin()
    notify()
  }
  const measure = (rows: Iterable<Element>) => {
    let changed = false
    let adjustment = 0
    for (const row of rows) {
      if (!row.isConnected) {
        unmeasure(row)
        continue
      }
      const index = Number(row.getAttribute('data-index') || Number.NaN)
      if (!Number.isInteger(index)) continue
      const result = layout().measure(index, row.getBoundingClientRect().height, offset)
      if (!result.changed) continue
      changed = true
      adjustment += result.scrollAdjustment
    }
    if (!changed) return
    if (following) pin()
    else if (target) write(layout().scrollOffset(target.index, target.align, offset, size))
    else if (adjustment) write(offset + adjustment)
    notify()
  }
  const rowObserver = view?.ResizeObserver
    ? new view.ResizeObserver((entries) => measure(entries.map((entry) => entry.target)))
    : undefined
  const viewportObserver = view?.ResizeObserver ? new view.ResizeObserver(onResize) : undefined
  const unmeasure = (row: Element) => rowObserver?.unobserve(row)

  element.addEventListener('scroll', onScroll, { passive: true })
  viewportObserver?.observe(element)
  if (options.follow) {
    following = true
    pin()
  }

  return {
    offset: () => offset,
    viewportSize: () => size,
    following: () => following,
    setOptions(next) {
      const enabled = !options.follow && !!next.follow
      options = next
      if (!next.follow) setFollowing(false)
      else if (enabled) {
        setFollowing(true)
        pin()
      }
      notify()
    },
    update() {
      if (following && offset !== layout().maxOffset(size)) {
        pin()
        notify()
      }
    },
    scrollToIndex(index, scroll) {
      target = { index, align: scroll?.align ?? 'auto' }
      write(layout().scrollOffset(index, target.align, offset, size))
      if (options.follow) setFollowing(atEnd())
      notify()
    },
    scrollToOffset(next) {
      target = undefined
      write(next)
      if (options.follow) setFollowing(atEnd())
      notify()
    },
    scrollToEnd() {
      target = undefined
      pin()
      if (options.follow) setFollowing(true)
      notify()
    },
    measureElement(row) {
      if (disposed) return
      rowObserver?.observe(row)
      if (row.isConnected) measure([row])
    },
    unmeasureElement: unmeasure,
    sync() {
      if (written !== undefined && Math.abs(element.scrollTop - written) >= 1)
        element.scrollTop = written
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispose() {
      disposed = true
      listeners.clear()
      rowObserver?.disconnect()
      viewportObserver?.disconnect()
      element.removeEventListener('scroll', onScroll)
    },
  }
}
