/** Captured geometry and callbacks for one resize gesture. */
export interface ResizableDragOptions {
  /** Panel flow axis captured at pointerdown. */
  orientation: 'horizontal' | 'vertical'
  /** Horizontal reading direction captured at pointerdown. */
  direction: 'ltr' | 'rtl'
  /** Receive percentage displacement from the original pointer coordinate. */
  onMove(delta: number): void
  /** Receive one release or cancellation after cleanup. */
  onEnd(canceled: boolean): void
}
/**
 * Start an already author-approved primary pointer gesture. Native pointerdown
 * focus is preserved. Returns cleanup without a commit; invalid starts do nothing.
 * Styles are restored only while they still equal the values this gesture wrote.
 */
export function startResizableDrag(
  handle: HTMLElement,
  root: HTMLElement,
  event: PointerEvent,
  options: ResizableDragOptions
): (() => void) | undefined {
  if (event.defaultPrevented || event.button !== 0 || !event.isPrimary || event.ctrlKey) return
  const vertical = options.orientation === 'vertical'
  // Flex-grow percentages describe available panel space, excluding handles and gaps.
  const panels = Array.from(root.children).filter(
    (child): child is HTMLElement =>
      child instanceof root.ownerDocument.defaultView!.HTMLElement &&
      child.hasAttribute('data-resizable-panel')
  )
  const extent = panels.reduce(
    (total, panel) =>
      total +
      (vertical ? panel.getBoundingClientRect().height : panel.getBoundingClientRect().width),
    0
  )
  if (!(extent > 0)) return
  const start = vertical ? event.clientY : event.clientX
  const doc = root.ownerDocument
  const style = doc.documentElement.style
  const previous = style.getPropertyValue('user-select')
  const priority = style.getPropertyPriority('user-select')
  style.setProperty('user-select', 'none')
  let active = true
  const cleanup = () => {
    if (!active) return
    active = false
    doc.removeEventListener('pointermove', move)
    doc.removeEventListener('pointerup', up)
    doc.removeEventListener('pointercancel', cancel)
    handle.removeEventListener('lostpointercapture', cancel)
    doc.defaultView?.removeEventListener('blur', blur)
    if (
      style.getPropertyValue('user-select') === 'none' &&
      style.getPropertyPriority('user-select') === ''
    ) {
      if (previous) style.setProperty('user-select', previous, priority)
      else style.removeProperty('user-select')
    }
    if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId)
  }
  const end = (canceled: boolean) => {
    if (!active) return
    cleanup()
    options.onEnd(canceled)
  }
  const move = (next: PointerEvent) => {
    if (next.pointerId !== event.pointerId) return
    if (next.pointerType !== 'touch' && !(next.buttons & 1)) {
      end(true)
      return
    }
    if (next.defaultPrevented) return
    next.preventDefault()
    options.onMove(
      (((vertical ? next.clientY : next.clientX) - start) / extent) *
        100 *
        (!vertical && options.direction === 'rtl' ? -1 : 1)
    )
  }
  const up = (next: PointerEvent) => {
    if (next.pointerId === event.pointerId) end(next.defaultPrevented)
  }
  const cancel = (next: PointerEvent) => {
    if (next.pointerId === event.pointerId) end(true)
  }
  const blur = () => end(true)
  doc.addEventListener('pointermove', move, { passive: false })
  doc.addEventListener('pointerup', up)
  doc.addEventListener('pointercancel', cancel)
  handle.addEventListener('lostpointercapture', cancel)
  doc.defaultView?.addEventListener('blur', blur)
  try {
    handle.setPointerCapture?.(event.pointerId)
  } catch {
    /* Detached or synthetic pointer. */
  }
  return cleanup
}
