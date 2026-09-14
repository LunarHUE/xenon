/**
 * Dismiss distance with an explicit %, px, or rem suffix. Runtime parsing accepts
 * nonnegative decimal strings without whitespace; malformed values use the default.
 * The template-literal type alone does not enforce those parsing restrictions.
 */
export type DrawerDragThreshold = `${number}%` | `${number}px` | `${number}rem`

/**
 * Resolve against the gesture's captured axis extent and the content document's
 * current root font size. Invalid syntax or nonfinite/negative results use
 * max(40px, 25% of extent); explicit valid values have no 40px minimum.
 */
function resolveThreshold(value: unknown, extent: number, content: HTMLElement): number {
  const fallback = Math.max(40, extent * 0.25)
  if (typeof value !== 'string') return fallback
  const match = /^(\d+(?:\.\d+)?|\.\d+)(%|px|rem)$/.exec(value)
  if (!match) return fallback
  const amount = Number(match[1])
  const unit = match[2]
  const root = content.ownerDocument.documentElement
  const distance =
    unit === '%'
      ? (amount / 100) * extent
      : unit === 'rem'
        ? amount *
          Number.parseFloat(
            content.ownerDocument.defaultView?.getComputedStyle(root).fontSize ?? ''
          )
        : amount
  return Number.isFinite(distance) && distance >= 0 ? distance : fallback
}

/** Physical drag direction, release threshold, and dismissal request. */
export interface DrawerHandleOptions {
  /** Outward dismissal direction; top/bottom measure height and left/right measure width. */
  side: 'top' | 'right' | 'bottom' | 'left'
  /**
   * Percent of axis size measured at pointerdown, CSS pixels, or root-font-relative
   * distance resolved at release. Even zero requires positive outward movement
   * and more than 5px movement on at least one axis. No velocity or duration threshold is used.
   * @defaultValue 25% of the drag-axis extent, with a 40px minimum
   */
  dragThreshold?: DrawerDragThreshold
  /**
   * Called synchronously once after an uncanceled release reaches the threshold
   * with a positive drag-axis extent. Capture and swiping flags are cleared first, but
   * the release offset remains available for exit CSS. This request does not hide
   * the drawer; initialization, reset, cancellation, and disposal do not invoke it.
   */
  onDismiss: () => void
}

/**
 * Register outward swipe dismissal on a dedicated handle without listening on content.
 *
 * @remarks
 * Sets handle touch-action to none and captures an accepted primary pointer when
 * pointer capture is available. Only primary-button, non-Ctrl, unprevented starts
 * on a handle without native or ARIA disabled state are accepted. Starting any
 * pointerdown first resets the previous gesture. The drawer side and dimensions
 * are captured at start; threshold and callback are read from current options at release.
 *
 * Movement beyond 5px on either axis sets data-swiping on both elements and writes
 * a nonnegative outward pixel distance to --drawer-swipe-offset on content. CSS owns
 * the visual transform. Moved events prevent default; an already-prevented release
 * suppresses dismissal. Pointer cancellation and lost capture reset the gesture.
 * A moved gesture suppresses the next nonzero-detail click in the capture phase,
 * including propagation to later listeners; detail-zero activation is preserved.
 *
 * @param handle - Dedicated gesture element whose touch-action is temporarily owned.
 * @param content - Drawer whose rectangle, CSS offset, and owner-document root font are used.
 * @returns Operations for resetting, replacing options, and releasing listeners/styles.
 */
export function registerDrawerHandle(
  handle: HTMLElement,
  content: HTMLElement,
  initial: DrawerHandleOptions
) {
  let options = initial
  let drag:
    | { id: number; x: number; y: number; side: DrawerHandleOptions['side']; extent: number }
    | undefined
  let moved = false
  let offset = 0
  const previousOffset = content.style.getPropertyValue('--drawer-swipe-offset')
  const previousPriority = content.style.getPropertyPriority('--drawer-swipe-offset')
  const previousTouchAction = handle.style.getPropertyValue('touch-action')
  const previousTouchPriority = handle.style.getPropertyPriority('touch-action')
  handle.style.setProperty('touch-action', 'none')
  /**
   * End capture and clear swiping flags. Restore the initially captured offset
   * unless preserving the release position; click suppression state is retained.
   */
  const reset = (preserveOffset = false) => {
    const id = drag?.id
    drag = undefined
    offset = 0
    content.removeAttribute('data-swiping')
    handle.removeAttribute('data-swiping')
    if (!preserveOffset) {
      if (previousOffset)
        content.style.setProperty('--drawer-swipe-offset', previousOffset, previousPriority)
      else content.style.removeProperty('--drawer-swipe-offset')
    }
    if (id !== undefined && handle.hasPointerCapture?.(id)) handle.releasePointerCapture(id)
  }
  const down = (event: PointerEvent) => {
    reset()
    moved = false
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.defaultPrevented ||
      handle.matches(':disabled') ||
      handle.getAttribute('aria-disabled') === 'true'
    )
      return
    const rect = content.getBoundingClientRect()
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      side: options.side,
      extent: options.side === 'top' || options.side === 'bottom' ? rect.height : rect.width,
    }
    handle.setPointerCapture?.(event.pointerId)
  }
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    const distance =
      drag.side === 'left' ? -dx : drag.side === 'right' ? dx : drag.side === 'top' ? -dy : dy
    moved ||= Math.abs(dx) > 5 || Math.abs(dy) > 5
    if (!moved) return
    offset = Math.max(0, distance)
    content.style.setProperty('--drawer-swipe-offset', `${offset}px`)
    content.setAttribute('data-swiping', '')
    handle.setAttribute('data-swiping', '')
    event.preventDefault()
  }
  const up = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return
    const canceled = event.defaultPrevented
    move(event)
    const threshold = resolveThreshold(options.dragThreshold, drag.extent, content)
    const reached = drag.extent > 0 && moved && offset > 0 && offset >= threshold
    const dismiss = options.onDismiss
    // Exit keyframes need the release position after the gesture itself ends.
    reset(!canceled && reached)
    if (!canceled && reached) dismiss()
  }
  const cancel = (event: PointerEvent) => {
    if (drag?.id === event.pointerId) reset()
  }
  const click = (event: MouseEvent) => {
    if (!moved || event.detail === 0) return
    moved = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  handle.addEventListener('pointerdown', down)
  handle.addEventListener('pointermove', move)
  handle.addEventListener('pointerup', up)
  handle.addEventListener('pointercancel', cancel)
  handle.addEventListener('lostpointercapture', cancel)
  handle.addEventListener('click', click, true)
  return {
    /**
     * Cancel any gesture and restore the original offset value/priority, including
     * after dismissal. Does not remove listeners or clear pending click suppression.
     */
    reset() {
      reset()
    },
    /** Replace all options. A changed side resets the gesture; other changes apply at release. */
    update(next: DrawerHandleOptions) {
      if (next.side !== options.side) reset()
      options = next
    },
    /**
     * Reset capture/offset and remove all listeners. Restore original touch-action
     * and priority only if its current value is still none, preserving other author
     * changes. Existing data-swiping values are removed, not restored. Stop using
     * this registration after disposal; reset/update have no disposed-state guard.
     */
    dispose() {
      reset()
      handle.removeEventListener('pointerdown', down)
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', cancel)
      handle.removeEventListener('lostpointercapture', cancel)
      handle.removeEventListener('click', click, true)
      if (handle.style.getPropertyValue('touch-action') === 'none') {
        if (previousTouchAction)
          handle.style.setProperty('touch-action', previousTouchAction, previousTouchPriority)
        else handle.style.removeProperty('touch-action')
      }
    },
  }
}
