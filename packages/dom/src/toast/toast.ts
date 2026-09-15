/** Physical direction in which a toast can be dismissed. */
export type ToastSwipeDirection = 'up' | 'down' | 'left' | 'right'

/** Gesture settings. Updating directions cancels a gesture already in progress. */
export interface ToastSwipeOptions {
  /** Allowed directions. An empty array disables swiping. @defaultValue ['right'] */
  directions?: readonly ToastSwipeDirection[]
  /** Distance in CSS pixels. Invalid values fall back to 40. @defaultValue 40 */
  threshold?: number
  /**
   * Recent outward velocity in pixels per millisecond. Requires at least 12px
   * travel and a sample within 100ms of release. Infinity disables flick dismissal.
   * @defaultValue 0.5
   */
  velocityThreshold?: number
  /** Called once after release; swipe variables and direction remain for exit CSS. */
  onDismiss: (direction: ToastSwipeDirection) => void
  /** Reports movement beyond the 5px slop, then release or cancellation. */
  onSwipingChange?: (swiping: boolean) => void
}

const ignored =
  'button,a[href],input,textarea,select,option,[contenteditable]:not([contenteditable="false"]),[data-swipe-ignore]'
const finiteThreshold = (value: number | undefined, fallback: number) =>
  value !== undefined && Number.isFinite(value) && value >= 0 ? value : fallback

/**
 * Capture one primary pointer and expose axis-locked movement through
 * --toast-swipe-movement-x/y and data-swipe-direction. CSS owns transforms.
 * Native controls and data-swipe-ignore descendants do not start gestures.
 * Disallowed directions have logarithmic resistance. Reversing 40px from the
 * furthest outward point cancels that direction's dismissal baseline.
 * The owning document handles releases outside the toast. Canceled gestures
 * clear movement; successful release preserves its position until reset/dispose.
 */
export function createToastSwipe(element: HTMLElement, initial: ToastSwipeOptions) {
  const doc = element.ownerDocument
  let options = initial
  let disposed = false
  let swiping = false
  let suppressClick = false
  let drag:
    | {
        id: number
        x: number
        y: number
        axis?: 'x' | 'y'
        value: number
        peak: number
        baseline: number
        sign: number
        sampleValue: number
        sampleTime: number
        velocity: number
        lastMove: number
        directions: readonly ToastSwipeDirection[]
      }
    | undefined
  const properties = ['--toast-swipe-movement-x', '--toast-swipe-movement-y', 'touch-action']
  const previous = properties.map(
    (key) =>
      [key, element.style.getPropertyValue(key), element.style.getPropertyPriority(key)] as const
  )
  const setTouchAction = () => {
    const directions = options.directions ?? ['right']
    const horizontal = directions.some((d) => d === 'left' || d === 'right')
    const vertical = directions.some((d) => d === 'up' || d === 'down')
    element.style.setProperty(
      'touch-action',
      horizontal && vertical ? 'none' : horizontal ? 'pan-y' : vertical ? 'pan-x' : 'auto'
    )
  }
  const setSwiping = (value: boolean) => {
    if (swiping === value) return
    swiping = value
    element.toggleAttribute('data-swiping', value)
    options.onSwipingChange?.(value)
  }
  const reset = (preserve = false) => {
    const id = drag?.id
    drag = undefined
    if (!preserve) {
      element.style.setProperty('--toast-swipe-movement-x', '0px')
      element.style.setProperty('--toast-swipe-movement-y', '0px')
      element.removeAttribute('data-swipe-direction')
    }
    if (id !== undefined && element.hasPointerCapture?.(id)) element.releasePointerCapture(id)
    setSwiping(false)
  }
  const down = (event: PointerEvent) => {
    if (
      disposed ||
      drag ||
      !event.isPrimary ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.defaultPrevented
    )
      return
    const target = event
      .composedPath()
      .find((node): node is Element => node instanceof (doc.defaultView?.Element ?? Element))
    if (target?.closest(ignored) && element.contains(target.closest(ignored))) return
    const directions = options.directions ?? ['right']
    if (!directions.length) return
    reset()
    suppressClick = false
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      value: 0,
      peak: 0,
      baseline: 0,
      sign: 0,
      sampleValue: 0,
      sampleTime: event.timeStamp,
      velocity: 0,
      lastMove: event.timeStamp,
      directions: [...directions],
    }
    // Detached elements and synthetic pointers may reject capture.
    try {
      element.setPointerCapture?.(event.pointerId)
    } catch {
      /* document listeners remain active */
    }
  }
  const move = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return
    const dx = event.clientX - drag.x
    const dy = event.clientY - drag.y
    if (!drag.axis) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) <= 5) return
      drag.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y'
      setSwiping(true)
      if (!drag) return
    }
    suppressClick = true
    const value = drag.axis === 'x' ? dx : dy
    const direction: ToastSwipeDirection =
      drag.axis === 'x' ? (value < 0 ? 'left' : 'right') : value < 0 ? 'up' : 'down'
    const allowed = drag.directions.includes(direction)
    const sign = Math.sign(value)
    if (sign !== drag.sign) {
      drag.sign = sign
      drag.peak = value
      drag.baseline = 0
    }
    if (Math.abs(value) > Math.abs(drag.peak)) drag.peak = value
    if (Math.abs(drag.peak) - Math.abs(value) >= 40) drag.baseline = drag.peak
    const elapsed = event.timeStamp - drag.sampleTime
    if (value !== drag.value) {
      drag.velocity = elapsed > 0 && elapsed <= 100 ? (value - drag.sampleValue) / elapsed : 0
      drag.sampleValue = value
      drag.sampleTime = event.timeStamp
      drag.lastMove = event.timeStamp
    }
    drag.value = value
    const movement = allowed ? value : sign * Math.log1p(Math.abs(value)) * 5
    element.style.setProperty('--toast-swipe-movement-x', `${drag.axis === 'x' ? movement : 0}px`)
    element.style.setProperty('--toast-swipe-movement-y', `${drag.axis === 'y' ? movement : 0}px`)
    if (allowed) element.setAttribute('data-swipe-direction', direction)
    else element.removeAttribute('data-swipe-direction')
    if (event.cancelable) event.preventDefault()
  }
  const up = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return
    const canceled = event.defaultPrevented
    move(event)
    if (!drag) return
    const direction = element.getAttribute('data-swipe-direction') as ToastSwipeDirection | null
    const distance = (drag.value - drag.baseline) * drag.sign
    const velocityThreshold =
      options.velocityThreshold === Infinity
        ? Infinity
        : finiteThreshold(options.velocityThreshold, 0.5)
    const flick =
      distance >= 12 &&
      event.timeStamp - drag.lastMove <= 100 &&
      drag.velocity * drag.sign >= velocityThreshold
    const dismiss =
      !canceled &&
      swiping &&
      direction &&
      distance > 0 &&
      (distance >= finiteThreshold(options.threshold, 40) || flick)
    const callback = options.onDismiss
    reset(Boolean(dismiss))
    if (dismiss && direction) callback(direction)
  }
  const cancel = (event: PointerEvent) => {
    if (drag?.id === event.pointerId) reset()
  }
  const touch = (event: TouchEvent) => {
    if (swiping && event.cancelable) event.preventDefault()
  }
  const click = (event: MouseEvent) => {
    if (!suppressClick || event.detail === 0) return
    suppressClick = false
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  setTouchAction()
  element.addEventListener('pointerdown', down)
  doc.addEventListener('pointermove', move)
  doc.addEventListener('pointerup', up)
  doc.addEventListener('pointercancel', cancel)
  element.addEventListener('lostpointercapture', cancel)
  element.addEventListener('touchmove', touch, { passive: false })
  element.addEventListener('click', click, true)
  return {
    /** Cancel a gesture or clear a retained dismissal position. */
    reset() {
      if (!disposed) reset()
    },
    /** Replace callbacks and thresholds; changed directions cancel the gesture. */
    update(next: ToastSwipeOptions) {
      if (disposed) return
      if ((next.directions ?? ['right']).join() !== (options.directions ?? ['right']).join())
        reset()
      options = next
      setTouchAction()
    },
    /** Remove listeners and restore the original inline gesture properties. */
    dispose() {
      if (disposed) return
      disposed = true
      reset()
      element.removeEventListener('pointerdown', down)
      doc.removeEventListener('pointermove', move)
      doc.removeEventListener('pointerup', up)
      doc.removeEventListener('pointercancel', cancel)
      element.removeEventListener('lostpointercapture', cancel)
      element.removeEventListener('touchmove', touch)
      element.removeEventListener('click', click, true)
      for (const [key, value, priority] of previous) {
        if (value) element.style.setProperty(key, value, priority)
        else element.style.removeProperty(key)
      }
    },
  }
}

/** Independent reasons that keep a viewport's timers paused. */
export type ToastViewportPauseReason =
  'hover' | 'focus' | 'window-blur' | 'document-hidden' | 'swipe'
/** Connect a viewport to a timer store and its expanded presentation. */
export interface ToastViewportOptions {
  pause: (reason: ToastViewportPauseReason) => void
  resume: (reason: ToastViewportPauseReason) => void
  onExpandedChange?: (expanded: boolean) => void
}

/**
 * Pause timers independently for hover, focus, swiping, window blur and document
 * visibility. Only interaction expands the stack. The caller provides a viewport
 * box covering the measured stack and its gaps so hover remains continuous.
 * All document/window events belong to the element's owning document.
 */
export function createToastViewport(element: HTMLElement, initial: ToastViewportOptions) {
  const doc = element.ownerDocument
  const win = doc.defaultView
  let options = initial
  let disposed = false
  let expanded = false
  const reasons = new Set<ToastViewportPauseReason>()
  const set = (reason: ToastViewportPauseReason, active: boolean) => {
    if (disposed || reasons.has(reason) === active) return
    if (active) {
      reasons.add(reason)
      options.pause(reason)
    } else {
      reasons.delete(reason)
      options.resume(reason)
    }
    const next = reasons.has('hover') || reasons.has('focus') || reasons.has('swipe')
    if (next !== expanded) {
      expanded = next
      options.onExpandedChange?.(next)
    }
  }
  const enter = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') set('hover', true)
  }
  const leave = () => set('hover', false)
  const focusin = () => set('focus', true)
  const focusout = (event: FocusEvent) => {
    if (event.relatedTarget instanceof (win?.Node ?? Node) && element.contains(event.relatedTarget))
      return
    set('focus', false)
  }
  const blur = () => set('window-blur', true)
  const focus = () => set('window-blur', false)
  const visibility = () => set('document-hidden', doc.hidden)
  const outside = (event: PointerEvent) => {
    if (event.pointerType === 'touch' && !event.composedPath().includes(element))
      set('hover', false)
  }
  element.addEventListener('pointerenter', enter)
  element.addEventListener('pointerleave', leave)
  element.addEventListener('focusin', focusin)
  element.addEventListener('focusout', focusout)
  win?.addEventListener('blur', blur)
  win?.addEventListener('focus', focus)
  doc.addEventListener('visibilitychange', visibility)
  doc.addEventListener('pointerdown', outside)
  visibility()
  if (element.contains(doc.activeElement)) focusin()
  return {
    /** Keep the stack expanded and timers paused until the swipe ends. */
    setSwiping(value: boolean) {
      set('swipe', value)
    },
    /** Transfer active reasons to replacement callbacks without losing pauses. */
    update(next: ToastViewportOptions) {
      if (disposed) return
      for (const reason of reasons) options.resume(reason)
      options = next
      for (const reason of reasons) options.pause(reason)
      options.onExpandedChange?.(expanded)
    },
    /** Remove listeners and release every reason owned by this registration. */
    dispose() {
      if (disposed) return
      disposed = true
      element.removeEventListener('pointerenter', enter)
      element.removeEventListener('pointerleave', leave)
      element.removeEventListener('focusin', focusin)
      element.removeEventListener('focusout', focusout)
      win?.removeEventListener('blur', blur)
      win?.removeEventListener('focus', focus)
      doc.removeEventListener('visibilitychange', visibility)
      doc.removeEventListener('pointerdown', outside)
      for (const reason of reasons) options.resume(reason)
      reasons.clear()
      if (expanded) options.onExpandedChange?.(false)
    },
  }
}
