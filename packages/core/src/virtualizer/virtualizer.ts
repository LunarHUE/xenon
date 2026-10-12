/** Stable item identity used to key measurements and rendered rows. */
export type VirtualKey = string | number

/** Where scrollToIndex places an item; auto scrolls the least distance and skips visible items. */
export type VirtualAlign = 'start' | 'center' | 'end' | 'auto'

/** Item count, sizing and layout inputs. All distances use CSS pixels along the scroll axis. */
export interface VirtualizerOptions {
  /** Number of items. */
  count: number
  /** Fixed size for every item. Measurements are ignored when set. */
  size?: number
  /** Size used until an item is measured; defaults to 40. */
  estimateSize?: (index: number) => number
  /** Identity for an index; defaults to the index. Measurements follow keys across reorders. */
  getKey?: (index: number) => VirtualKey
  /** Extra items rendered on each side of the visible range; defaults to 4. */
  overscan?: number
  /** Space before the first item. */
  paddingStart?: number
  /** Space after the last item. */
  paddingEnd?: number
  /** Space between adjacent items. */
  gap?: number
  /** Marks group headings that stay pinned while their section is in view. */
  sticky?: (index: number) => boolean
}

/** One positioned item. `end` excludes the trailing gap. */
export interface VirtualItem {
  /** Position in the full list. */
  index: number
  /** Identity from getKey. */
  key: VirtualKey
  /** Offset of the item's leading edge from the content start. */
  start: number
  /** Measured, fixed or estimated size. */
  size: number
  /** start + size. */
  end: number
  /** Whether the sticky predicate selected this item. */
  sticky: boolean
  /** The heading of the section at the top of the viewport; adapters pin it. */
  pinned: boolean
}

/** Inclusive index bounds. Every field is -1 for an empty list. */
export interface VirtualRange {
  /** First rendered index, including overscan. */
  startIndex: number
  /** Last rendered index, including overscan. */
  endIndex: number
  /** First index intersecting the viewport. */
  visibleStartIndex: number
  /** Last index intersecting the viewport. */
  visibleEndIndex: number
}

/** Result of recording one item size. */
export interface VirtualMeasurement {
  /** Whether the stored size changed. */
  changed: boolean
  /** Add this to the scroll offset so visible content stays in place. Non-zero only for items starting above the offset. */
  scrollAdjustment: number
}

/** Layout queries over the current options and measurement cache. */
export interface VirtualizerResult {
  /** Replace the options. Measurements stay keyed; offsets recompute lazily. Passing the same object again is free. */
  setOptions(options: VirtualizerOptions): void
  /** Current item count. */
  count(): number
  /** Content size, including padding. */
  totalSize(): number
  /** Position of one item, or undefined outside the list. */
  item(index: number): VirtualItem | undefined
  /** Item containing an offset, clamped to the list; -1 when empty. */
  indexAt(offset: number): number
  /** Visible and overscanned bounds for a viewport. */
  range(offset: number, viewportSize: number): VirtualRange
  /** Items to render in index order. The pinned heading is included even when it sits above the overscan. */
  items(offset: number, viewportSize: number): VirtualItem[]
  /**
   * Scroll offset that brings an item into view, clamped to the scrollable range.
   * Start and auto alignment leave room for the pinned heading that would cover the item.
   */
  scrollOffset(index: number, align: VirtualAlign, offset: number, viewportSize: number): number
  /** Largest scroll offset for a viewport. */
  maxOffset(viewportSize: number): number
  /** Whether the viewport reaches the end, within threshold pixels (default 1). */
  isAtEnd(offset: number, viewportSize: number, threshold?: number): boolean
  /** Record an item's size under its key. The offset decides whether the change needs a scroll adjustment. */
  measure(index: number, size: number, offset?: number): VirtualMeasurement
  /** Forget every recorded size. */
  clearMeasurements(): void
}

const finite = (value: number | undefined, fallback = 0) =>
  value !== undefined && Number.isFinite(value) ? Math.max(0, value) : fallback

/** Largest index in [0, length) whose value passes; -1 when none does. Values must be ascending. */
function lastWhere(
  length: number,
  at: (index: number) => number,
  pass: (value: number) => boolean
) {
  let low = 0,
    high = length - 1,
    found = -1
  while (low <= high) {
    const middle = (low + high) >> 1
    if (pass(at(middle))) {
      found = middle
      low = middle + 1
    } else high = middle - 1
  }
  return found
}

/**
 * Creates virtual list layout math with a size cache keyed by item key.
 *
 * @remarks
 * Fixed sizes use constant-time arithmetic. Estimated and measured sizes keep
 * prefix offsets that rebuild lazily from the first changed index, so the first
 * query after setOptions walks every item once. Sticky indices are collected on
 * first use after setOptions. Recreating nothing on scroll is the caller's job:
 * the returned items are fresh objects on every call.
 */
export function virtualizer(initial: VirtualizerOptions): VirtualizerResult {
  let options = initial
  let count = 0
  let fixed: number | undefined
  let gap = 0
  let paddingStart = 0
  let paddingEnd = 0
  let starts = new Float64Array(0)
  let sizes = new Float64Array(0)
  let valid = 0
  let stickies: number[] | undefined
  const measured = new Map<VirtualKey, number>()

  const keyOf = (index: number) => options.getKey?.(index) ?? index
  const apply = (next: VirtualizerOptions) => {
    options = next
    count = Math.floor(finite(next.count))
    fixed = next.size === undefined ? undefined : finite(next.size)
    gap = finite(next.gap)
    paddingStart = finite(next.paddingStart)
    paddingEnd = finite(next.paddingEnd)
    if (fixed === undefined && starts.length < count) {
      starts = new Float64Array(Math.max(count, starts.length * 2))
      sizes = new Float64Array(starts.length)
    }
    valid = 0
    stickies = undefined
  }
  apply(initial)

  /** Fill prefix offsets through index. */
  const ensure = (index: number) => {
    for (let at = valid; at <= index; at++) {
      const size = measured.get(keyOf(at)) ?? finite(options.estimateSize?.(at), 40)
      sizes[at] = size
      starts[at] = at === 0 ? paddingStart : starts[at - 1]! + sizes[at - 1]! + gap
    }
    if (index >= valid) valid = index + 1
  }
  const startOf = (index: number) => {
    if (fixed !== undefined) return paddingStart + index * (fixed + gap)
    ensure(index)
    return starts[index]!
  }
  const sizeOf = (index: number) => {
    if (fixed !== undefined) return fixed
    ensure(index)
    return sizes[index]!
  }
  const isSticky = (index: number) => !!options.sticky?.(index)
  const stickyList = () => {
    if (!stickies) {
      stickies = []
      if (options.sticky)
        for (let index = 0; index < count; index++) if (isSticky(index)) stickies.push(index)
    }
    return stickies
  }
  /** Last sticky index at or before index. */
  const headingFor = (index: number) => {
    const list = stickyList()
    const found = lastWhere(
      list.length,
      (at) => list[at]!,
      (value) => value <= index
    )
    return found < 0 ? undefined : list[found]
  }
  const make = (index: number, pinned = false): VirtualItem => {
    const start = startOf(index),
      size = sizeOf(index)
    return {
      index,
      key: keyOf(index),
      start,
      size,
      end: start + size,
      sticky: isSticky(index),
      pinned,
    }
  }
  const totalSize = () =>
    count ? startOf(count - 1) + sizeOf(count - 1) + paddingEnd : paddingStart + paddingEnd
  const maxOffset = (viewportSize: number) => Math.max(0, totalSize() - finite(viewportSize))
  /** Last index whose start passes, scanning prefix offsets or fixed arithmetic. */
  const lastStart = (pass: (start: number) => boolean) => {
    if (!count) return -1
    if (fixed === undefined) ensure(count - 1)
    return lastWhere(count, startOf, pass)
  }
  const indexAt = (offset: number) =>
    count
      ? Math.max(
          0,
          lastStart((start) => start <= offset)
        )
      : -1
  const range = (offset: number, viewportSize: number): VirtualRange => {
    if (!count) return { startIndex: -1, endIndex: -1, visibleStartIndex: -1, visibleEndIndex: -1 }
    const overscan = Math.floor(finite(options.overscan, 4))
    const first = indexAt(offset)
    const last =
      viewportSize > 0
        ? Math.max(
            first,
            lastStart((start) => start < offset + viewportSize)
          )
        : first
    return {
      startIndex: Math.max(0, first - overscan),
      endIndex: Math.min(count - 1, last + overscan),
      visibleStartIndex: first,
      visibleEndIndex: last,
    }
  }

  return {
    setOptions(next) {
      if (next !== options) apply(next)
    },
    count: () => count,
    totalSize,
    item: (index) =>
      Number.isInteger(index) && index >= 0 && index < count ? make(index) : undefined,
    indexAt,
    range,
    items(offset, viewportSize) {
      const bounds = range(offset, viewportSize)
      if (bounds.startIndex < 0) return []
      const heading = options.sticky ? headingFor(bounds.visibleStartIndex) : undefined
      const out: VirtualItem[] = []
      if (heading !== undefined && heading < bounds.startIndex) out.push(make(heading, true))
      for (let index = bounds.startIndex; index <= bounds.endIndex; index++)
        out.push(make(index, index === heading))
      return out
    },
    scrollOffset(index, align, offset, viewportSize) {
      if (!count) return 0
      const target = Math.max(0, Math.min(count - 1, Math.floor(index)))
      const viewport = finite(viewportSize)
      const max = maxOffset(viewport)
      const item = make(target)
      const heading = options.sticky && !item.sticky ? headingFor(target) : undefined
      const inset = heading === undefined ? 0 : sizeOf(heading)
      const toStart = target === 0 ? 0 : item.start - inset
      const toEnd = target === count - 1 ? max : item.end - viewport
      let next: number
      if (align === 'start') next = toStart
      else if (align === 'end') next = toEnd
      else if (align === 'center') next = item.start + item.size / 2 - viewport / 2
      else if (toStart >= offset && item.end <= offset + viewport) next = offset
      else if (toStart < offset || item.size + inset > viewport) next = toStart
      else next = toEnd
      return Math.max(0, Math.min(max, next))
    },
    maxOffset,
    isAtEnd: (offset, viewportSize, threshold = 1) =>
      offset >= maxOffset(viewportSize) - finite(threshold),
    measure(index, size, offset = 0) {
      if (fixed !== undefined || !Number.isInteger(index) || index < 0 || index >= count)
        return { changed: false, scrollAdjustment: 0 }
      const next = finite(size)
      const previous = sizeOf(index)
      measured.set(keyOf(index), next)
      if (previous === next) return { changed: false, scrollAdjustment: 0 }
      const start = startOf(index)
      sizes[index] = next
      valid = Math.min(valid, index + 1)
      return { changed: true, scrollAdjustment: start < offset ? next - previous : 0 }
    },
    clearMeasurements() {
      measured.clear()
      valid = 0
    },
  }
}
