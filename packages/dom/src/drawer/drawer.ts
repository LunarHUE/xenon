export interface DrawerHandleOptions {
  side: 'top' | 'right' | 'bottom' | 'left'
  onDismiss: () => void
}

/** A dedicated handle owns swipe gestures; scrolling content keeps native input. */
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
  const reset = () => {
    const id = drag?.id
    drag = undefined
    offset = 0
    content.removeAttribute('data-swiping')
    handle.removeAttribute('data-swiping')
    if (previousOffset)
      content.style.setProperty('--drawer-swipe-offset', previousOffset, previousPriority)
    else content.style.removeProperty('--drawer-swipe-offset')
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
    const reached = drag.extent > 0 && offset >= Math.max(40, drag.extent * 0.25)
    const dismiss = options.onDismiss
    reset()
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
    update(next: DrawerHandleOptions) {
      if (next.side !== options.side) reset()
      options = next
    },
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
