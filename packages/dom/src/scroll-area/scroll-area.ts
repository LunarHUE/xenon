/** Physical scrollbar axis. Horizontal offsets increase from the left even in RTL. */
export type ScrollAreaAxis = 'horizontal' | 'vertical'

/** Native viewport dimensions and clamped physical scroll positions in CSS pixels. */
export interface ScrollAreaMetrics {
  /** Inner viewport width. */
  width: number
  /** Inner viewport height. */
  height: number
  /** Complete scrollable width. */
  scrollWidth: number
  /** Complete scrollable height. */
  scrollHeight: number
  /** Distance from the physical left edge, normalized for RTL. */
  left: number
  /** Distance from the top edge. */
  top: number
}

/** Measured geometry inputs; all distances use CSS pixels. */
export interface ScrollbarGeometryOptions {
  /** Visible extent on this axis. */
  viewportSize: number
  /** Complete content extent on this axis. */
  contentSize: number
  /** Track extent, excluding its border. Use track padding on a surrounding wrapper. */
  trackSize: number
  /** Physical viewport offset. */
  offset: number
  /** Smallest thumb, clamped to the track. Defaults to 18px. */
  minThumbSize?: number
}

/** A thumb's size, travel and physical position within its track. */
export interface ScrollbarGeometry {
  /** Whether content exceeds its viewport. */
  overflow: boolean
  /** Maximum viewport offset. */
  max: number
  /** Thumb extent in pixels. */
  size: number
  /** Maximum thumb displacement. */
  travel: number
  /** Thumb displacement from the physical track start. */
  position: number
}

const finite = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)
const clamp = (value: number, max: number) => Math.max(0, Math.min(value, max))

/** Calculate proportional thumb geometry without accessing the DOM. */
export function scrollbarGeometry(options: ScrollbarGeometryOptions): ScrollbarGeometry {
  const viewport = finite(options.viewportSize)
  const content = finite(options.contentSize)
  const track = finite(options.trackSize)
  const max = Math.max(0, content - viewport)
  const size = Math.min(
    track,
    Math.max(finite(options.minThumbSize ?? 18), content ? (track * viewport) / content : track)
  )
  const travel = Math.max(0, track - size)
  return {
    overflow: max > 0,
    max,
    size,
    travel,
    position: max ? (clamp(finite(options.offset), max) / max) * travel : 0,
  }
}

/** Read native scrolling. Modern RTL engines expose negative scrollLeft from the right edge. */
export function readScrollArea(viewport: HTMLElement): ScrollAreaMetrics {
  const width = viewport.clientWidth,
    height = viewport.clientHeight
  const max = Math.max(0, viewport.scrollWidth - width)
  const rtl = viewport.ownerDocument.defaultView?.getComputedStyle(viewport).direction === 'rtl'
  return {
    width,
    height,
    scrollWidth: viewport.scrollWidth,
    scrollHeight: viewport.scrollHeight,
    left: clamp(rtl ? max + viewport.scrollLeft : viewport.scrollLeft, max),
    top: clamp(viewport.scrollTop, Math.max(0, viewport.scrollHeight - height)),
  }
}

/** Set a physical axis offset, preserving the other axis and translating horizontal RTL. */
export function setScrollAreaOffset(
  viewport: HTMLElement,
  axis: ScrollAreaAxis,
  offset: number
): void {
  if (axis === 'vertical')
    viewport.scrollTop = clamp(offset, Math.max(0, viewport.scrollHeight - viewport.clientHeight))
  else {
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
    const rtl = viewport.ownerDocument.defaultView?.getComputedStyle(viewport).direction === 'rtl'
    viewport.scrollLeft = clamp(offset, max) - (rtl ? max : 0)
  }
}

/** Observe geometry, scrolling, content mutations, image loads and inherited direction attributes. */
export function observeScrollArea(
  viewport: HTMLElement,
  content: HTMLElement | undefined,
  onChange: (metrics: ScrollAreaMetrics) => void
): {
  /** Remeasure immediately; unchanged snapshots do not notify. */
  measure(): void
  /** Disconnect every observer/listener and cancel queued work. */
  destroy(): void
} {
  const view = viewport.ownerDocument.defaultView
  let previous: ScrollAreaMetrics | undefined
  let frame: number | undefined
  let destroyed = false
  const measure = () => {
    if (destroyed) return
    const next = readScrollArea(viewport)
    if (
      !previous ||
      Object.keys(next).some(
        (key) => next[key as keyof ScrollAreaMetrics] !== previous![key as keyof ScrollAreaMetrics]
      )
    ) {
      previous = next
      onChange(next)
    }
  }
  const schedule = () => {
    if (destroyed || frame !== undefined) return
    if (!view?.requestAnimationFrame) return measure()
    frame = view.requestAnimationFrame(() => {
      frame = undefined
      measure()
    })
  }
  const resize = view?.ResizeObserver ? new view.ResizeObserver(schedule) : undefined
  resize?.observe(viewport)
  if (content) resize?.observe(content)
  const mutation = view?.MutationObserver ? new view.MutationObserver(schedule) : undefined
  mutation?.observe(content ?? viewport, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
  })
  // Direction can change without resizing or emitting a native scroll event.
  const direction = view?.MutationObserver ? new view.MutationObserver(schedule) : undefined
  for (let ancestor: HTMLElement | null = viewport; ancestor; ancestor = ancestor.parentElement) {
    direction?.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'class', 'style'] })
  }
  viewport.addEventListener('scroll', measure, { passive: true })
  viewport.addEventListener('load', schedule, true)
  view?.addEventListener('resize', schedule)
  measure()
  return {
    measure,
    destroy() {
      destroyed = true
      if (frame !== undefined) view?.cancelAnimationFrame(frame)
      resize?.disconnect()
      mutation?.disconnect()
      direction?.disconnect()
      viewport.removeEventListener('scroll', measure)
      viewport.removeEventListener('load', schedule, true)
      view?.removeEventListener('resize', schedule)
    },
  }
}

/** Live bindings used by a custom scrollbar's event handlers. */
export interface ScrollbarInteractionOptions {
  /** Controlled native scrolling element. */
  viewport: HTMLElement
  /** Track and pointer-capture host. */
  track: HTMLElement
  /** Current thumb element; may be absent before mounting. */
  thumb(): HTMLElement | undefined
  /** Physical axis controlled by this track. */
  orientation: ScrollAreaAxis
  /** Current thumb extent in CSS pixels. */
  thumbSize(): number
  /** Called after a handled scroll request so bindings can refresh geometry immediately. */
  onScroll(): void
  /** Reports accepted drag start/end, never construction. */
  onDraggingChange?(dragging: boolean): void
}

/** Shared lease prevents overlapping scrollbar drags from restoring a live drag's styles. */
interface StyleLease {
  /** Inline value before the first owner. */
  before: string
  /** Original inline priority. */
  priority: string
  /** Temporary value shared by the owners. */
  value: string
  /** Number of active owners. */
  count: number
}
const styleLeases = new WeakMap<HTMLElement, Map<string, StyleLease>>()

/** Restore a temporary inline style after its final owner releases it. */
function temporaryStyle(element: HTMLElement, name: string, value: string): () => void {
  let properties = styleLeases.get(element)
  if (!properties) styleLeases.set(element, (properties = new Map()))
  let lease = properties.get(name)
  if (
    !lease ||
    lease.value !== value ||
    element.style.getPropertyValue(name) !== value ||
    element.style.getPropertyPriority(name) !== ''
  ) {
    lease = {
      before: element.style.getPropertyValue(name),
      priority: element.style.getPropertyPriority(name),
      value,
      count: 0,
    }
    properties.set(name, lease)
    element.style.setProperty(name, value)
  }
  lease.count++
  const current = lease
  let released = false
  return () => {
    if (released) return
    released = true
    current.count--
    if (current.count || properties.get(name) !== current) return
    properties.delete(name)
    if (
      element.style.getPropertyValue(name) !== value ||
      element.style.getPropertyPriority(name) !== ''
    )
      return
    if (current.before) element.style.setProperty(name, current.before, current.priority)
    else element.style.removeProperty(name)
  }
}

/**
 * Native viewport controls for custom tracks. Invoke handlers after author event
 * cancellation checks. A track click centers the thumb under the pointer; a thumb
 * drag preserves its grab point. Only the accepted primary pointer can continue
 * the drag. Cancellation, lost capture, missed release and disposal restore styles.
 */
export function createScrollbarInteraction(options: ScrollbarInteractionOptions): {
  /** Accept a primary track/thumb press and establish document-scoped drag listeners. */
  pointerDown(event: PointerEvent): void
  /** Arrow, Page, Home and End scrolling for the focused custom scrollbar. */
  keyDown(event: KeyboardEvent): void
  /** Forward wheel movement over the track; allow page chaining at an edge. */
  wheel(event: WheelEvent): void
  /** End an active drag and remove its listeners. Safe to call repeatedly. */
  destroy(): void
} {
  const { viewport, track, orientation } = options
  const doc = track.ownerDocument
  const view = doc.defaultView
  const horizontal = orientation === 'horizontal'
  let drag: { id: number; grab: number; restore: Array<() => void> } | undefined
  let destroyed = false
  const point = (event: PointerEvent) => (horizontal ? event.clientX : event.clientY)
  const offset = () => (horizontal ? readScrollArea(viewport).left : readScrollArea(viewport).top)
  const extent = () => (horizontal ? viewport.clientWidth : viewport.clientHeight)
  const maximum = () =>
    Math.max(0, (horizontal ? viewport.scrollWidth : viewport.scrollHeight) - extent())
  const scroll = (next: number) => {
    const old = offset()
    const destination = clamp(next, maximum())
    setScrollAreaOffset(viewport, orientation, destination)
    options.onScroll()
    // Smooth scrolling updates native offsets later; consume the requested move now.
    return old !== destination
  }
  const end = (event?: PointerEvent) => {
    if (!drag || (event && event.pointerId !== drag.id)) return
    const current = drag
    drag = undefined
    doc.removeEventListener('pointermove', move)
    doc.removeEventListener('pointerup', end)
    doc.removeEventListener('pointercancel', end)
    track.removeEventListener('lostpointercapture', end)
    view?.removeEventListener('blur', blur)
    try {
      if (track.hasPointerCapture?.(current.id)) track.releasePointerCapture(current.id)
    } catch {
      /* Capture may have ended with element removal. */
    }
    current.restore.reverse().forEach((restore) => restore())
    options.onDraggingChange?.(false)
  }
  const blur = () => end()
  const moveTo = (event: PointerEvent) => {
    if (!drag) return
    const box = track.getBoundingClientRect()
    const start = horizontal ? box.left + track.clientLeft : box.top + track.clientTop
    const travel = (horizontal ? track.clientWidth : track.clientHeight) - options.thumbSize()
    if (travel > 0) scroll(((point(event) - start - drag.grab) / travel) * maximum())
  }
  function move(event: PointerEvent) {
    if (!drag || event.pointerId !== drag.id) return
    if (event.pointerType !== 'touch' && (event.buttons & 1) === 0) return end(event)
    if (event.defaultPrevented) return
    event.preventDefault()
    moveTo(event)
  }
  return {
    pointerDown(event) {
      if (
        destroyed ||
        drag ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.isPrimary === false ||
        maximum() === 0
      )
        return
      const thumb = options.thumb()
      const inside =
        thumb &&
        event.target instanceof (view?.Node ?? Node) &&
        thumb.contains(event.target as Node)
      const thumbBox = thumb?.getBoundingClientRect()
      const grab =
        inside && thumbBox
          ? point(event) - (horizontal ? thumbBox.left : thumbBox.top)
          : options.thumbSize() / 2
      event.preventDefault()
      track.focus({ preventScroll: true })
      drag = {
        id: event.pointerId,
        grab,
        restore: [
          temporaryStyle(viewport, 'scroll-snap-type', 'none'),
          temporaryStyle(viewport, 'scroll-behavior', 'auto'),
          temporaryStyle(doc.documentElement, 'user-select', 'none'),
          temporaryStyle(doc.documentElement, '-webkit-user-select', 'none'),
        ],
      }
      doc.addEventListener('pointermove', move, { passive: false })
      doc.addEventListener('pointerup', end)
      doc.addEventListener('pointercancel', end)
      track.addEventListener('lostpointercapture', end)
      view?.addEventListener('blur', blur)
      try {
        track.setPointerCapture?.(event.pointerId)
      } catch {
        /* Synthetic events may not own a native pointer. */
      }
      options.onDraggingChange?.(true)
      if (!inside) moveTo(event)
    },
    keyDown(event) {
      if (
        destroyed ||
        event.defaultPrevented ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.target !== track
      )
        return
      let next: number
      switch (event.key) {
        case 'Home':
          next = 0
          break
        case 'End':
          next = maximum()
          break
        case 'PageUp':
          next = offset() - extent()
          break
        case 'PageDown':
          next = offset() + extent()
          break
        case 'ArrowLeft':
          if (!horizontal) return
          next = offset() - 40
          break
        case 'ArrowRight':
          if (!horizontal) return
          next = offset() + 40
          break
        case 'ArrowUp':
          if (horizontal) return
          next = offset() - 40
          break
        case 'ArrowDown':
          if (horizontal) return
          next = offset() + 40
          break
        default:
          return
      }
      event.preventDefault()
      scroll(next)
    },
    wheel(event) {
      if (destroyed || event.defaultPrevented || event.ctrlKey) return
      const delta = horizontal ? event.deltaX || event.deltaY : event.deltaY
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? extent() : 1
      if (scroll(offset() + delta * scale)) event.preventDefault()
    },
    destroy() {
      destroyed = true
      end()
    },
  }
}
