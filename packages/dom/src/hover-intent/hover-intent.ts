/** Why a hover surface requested opening. */
export type HoverOpenReason = 'hover' | 'focus'
/** Live browser hover policy. Getters avoid capturing obsolete controlled state or delays. */
export interface HoverIntentOptions {
  /** Most recently active trigger. */
  trigger(): HTMLElement | undefined
  /** Other registered trigger regions sharing the same surface and focus intent. */
  triggers?(): readonly HTMLElement[]
  /** Current content, absent before mounting. */
  content(): HTMLElement | undefined
  /** Current logical visibility. */
  open(): boolean
  /** Root interaction gate. */
  disabled(): boolean
  /** Hover delay, including any shared warm-window resolution. */
  openDelay(): number
  /** Closing delay after all intent leaves. */
  closeDelay(): number
  /** Whether pointer content and the travel corridor retain hover intent. */
  hoverable(): boolean
  /** Focus opening delay. Defaults to zero. */
  focusDelay?(): number
  /** Whether trigger presses dismiss and cancel pending opens. Defaults to true. */
  closeOnPress?(): boolean
  /** Request opening for the specific trigger that initiated the surviving intent. */
  onOpen(trigger: HTMLElement, reason: HoverOpenReason): void
  /** Request closing, without mutating controlled state. */
  onClose(): void
}
/** Listener methods are explicitly composed by the adapter so author cancellation runs first. */
export interface HoverIntent {
  /** Begin non-touch trigger hover. */
  triggerEnter(event: PointerEvent): void
  /** Cancel pending hover or retain a measured travel corridor to content. */
  triggerLeave(event: PointerEvent): void
  /** Retain an open surface while its content is hovered. */
  contentEnter(event: PointerEvent): void
  /** Begin travel back to the trigger or schedule close. */
  contentLeave(event: PointerEvent): void
  /** Open from trigger focus, or retain intent for focus already inside content. */
  focusIn(event: FocusEvent): void
  /** Release focus intent only after focus leaves both trigger and content. */
  focusOut(event: FocusEvent): void
  /** Track pointer modality and optionally dismiss on trigger press. */
  press(event: PointerEvent): void
  /** Cancel pending work, release intent, and request close. Fresh entry can open again. */
  dismiss(): void
  /** Cancel pending work and intent without requesting a state change. */
  cancel(): void
  /** Reconcile live policy. Pending delays use elapsed time from their original intent; disabled cancels work. */
  refresh(): void
  /** Idempotently release timers and temporary document listeners. */
  dispose(): void
}
/**
 * Coordinate delayed hover/focus and a bounded convex corridor without taking focus
 * or preventing native gestures. Delay and modality deadlines use the monotonic
 * performance clock so wall-clock adjustments cannot extend or shorten intent.
 */
export function createHoverIntent(options: HoverIntentOptions): HoverIntent {
  let disposed = false,
    hovered = false,
    focused = false
  let openTimer: ReturnType<typeof setTimeout> | undefined,
    closeTimer: ReturnType<typeof setTimeout> | undefined,
    transitTimer: ReturnType<typeof setTimeout> | undefined
  let pendingOpen: { trigger: HTMLElement; reason: HoverOpenReason; started: number } | undefined
  let closeStarted: number | undefined
  let cleanupTransit: (() => void) | undefined
  let lastPress = -Infinity,
    lastTouch = -Infinity
  const delay = (value: number) => (Number.isFinite(value) ? Math.max(0, value) : 0)
  const now = () => performance.now()
  const contains = (element: HTMLElement | undefined, target: EventTarget | null) => {
    if (!element || !target) return false
    let node = target as Node | null
    while (node) {
      if (node === element) return true
      node = (node as Element).assignedSlot || node.parentNode || (node as ShadowRoot).host || null
    }
    return false
  }
  const inside = (target: EventTarget | null) =>
    contains(options.trigger(), target) ||
    !!options.triggers?.().some((trigger) => contains(trigger, target)) ||
    contains(options.content(), target)
  const clearTransit = () => {
    clearTimeout(transitTimer)
    transitTimer = undefined
    cleanupTransit?.()
    cleanupTransit = undefined
  }
  const clearOpen = () => {
    clearTimeout(openTimer)
    openTimer = undefined
    pendingOpen = undefined
  }
  const clearClose = () => {
    clearTimeout(closeTimer)
    closeTimer = undefined
    closeStarted = undefined
  }
  const cancel = () => {
    clearOpen()
    clearClose()
    clearTransit()
    hovered = false
    focused = false
  }
  const close = () => {
    clearOpen()
    clearClose()
    if (!disposed && !hovered && !focused && options.open()) options.onClose()
  }
  const armClose = () => {
    clearTimeout(closeTimer)
    const ms = Math.max(0, delay(options.closeDelay()) - (now() - closeStarted!))
    if (ms === 0) close()
    else closeTimer = setTimeout(close, ms)
  }
  const scheduleClose = () => {
    reconcileOpening()
    clearClose()
    if (hovered || focused) return
    clearOpen()
    closeStarted = now()
    armClose()
  }
  const armOpen = () => {
    clearTimeout(openTimer)
    const pending = pendingOpen
    if (!pending) return
    const { trigger, reason, started } = pending
    const execute = () => {
      clearOpen()
      if (
        !disposed &&
        !options.disabled() &&
        trigger.isConnected &&
        !trigger.hasAttribute('disabled') &&
        (reason === 'hover' ? hovered : focused)
      )
        options.onOpen(trigger, reason)
    }
    const duration = options.open()
      ? 0
      : delay(reason === 'focus' ? (options.focusDelay?.() ?? 0) : options.openDelay())
    const ms = Math.max(0, duration - (now() - started))
    if (ms === 0) execute()
    else openTimer = setTimeout(execute, ms)
  }
  const reconcileOpening = () => {
    if (!pendingOpen) return
    if (pendingOpen.reason === 'hover' ? hovered : focused) return
    if (!hovered && !focused) {
      clearOpen()
      return
    }
    pendingOpen.reason = focused ? 'focus' : 'hover'
    armOpen()
  }
  const requestOpen = (trigger: HTMLElement, reason: HoverOpenReason) => {
    clearClose()
    clearOpen()
    clearTransit()
    if (disposed || options.disabled() || trigger.hasAttribute('disabled')) return
    pendingOpen = { trigger, reason, started: now() }
    armOpen()
  }
  const ignored = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      lastTouch = now()
      return true
    }
    return now() - lastTouch < 600
  }
  const travel = (event: PointerEvent, target: HTMLElement | undefined) => {
    clearTransit()
    if (!options.open() || !options.hoverable() || !target) {
      scheduleClose()
      return
    }
    if (contains(target, event.relatedTarget)) {
      hovered = true
      clearClose()
      return
    }
    const rect = target.getBoundingClientRect()
    const polygon = hull([
      [event.clientX - 2, event.clientY - 2],
      [event.clientX + 2, event.clientY + 2],
      [rect.left - 2, rect.top - 2],
      [rect.right + 2, rect.top - 2],
      [rect.right + 2, rect.bottom + 2],
      [rect.left - 2, rect.bottom + 2],
    ])
    const document = target.ownerDocument
    const move = (next: PointerEvent) => {
      if (ignored(next)) return
      if (inside(next.composedPath()[0] ?? next.target)) {
        hovered = true
        clearClose()
        clearTransit()
        return
      }
      if (!inPolygon(polygon, [next.clientX, next.clientY])) {
        clearTransit()
        hovered = false
        scheduleClose()
      }
    }
    document.addEventListener('pointermove', move)
    cleanupTransit = () => document.removeEventListener('pointermove', move)
    transitTimer = setTimeout(() => {
      clearTransit()
      hovered = false
      scheduleClose()
    }, 300)
  }
  return {
    triggerEnter(event) {
      if (disposed || event.defaultPrevented || ignored(event) || options.disabled()) return
      hovered = true
      requestOpen(event.currentTarget as HTMLElement, 'hover')
    },
    triggerLeave(event) {
      if (disposed || ignored(event)) return
      hovered = false
      reconcileOpening()
      travel(event, options.content())
    },
    contentEnter(event) {
      if (disposed || ignored(event) || !options.hoverable()) return
      hovered = true
      clearClose()
      clearTransit()
    },
    contentLeave(event) {
      if (disposed || ignored(event) || !options.hoverable()) return
      hovered = false
      travel(event, options.trigger())
    },
    focusIn(event) {
      if (
        disposed ||
        event.defaultPrevented ||
        options.disabled() ||
        now() - lastPress < 50 ||
        now() - lastTouch < 600
      )
        return
      focused = true
      clearClose()
      clearTransit()
      if (!contains(options.content(), event.target))
        requestOpen(event.currentTarget as HTMLElement, 'focus')
    },
    focusOut(event) {
      if (disposed) return
      if (inside(event.relatedTarget)) return
      focused = false
      scheduleClose()
    },
    press(event) {
      lastPress = now()
      if (event.pointerType === 'touch') lastTouch = now()
      if (options.closeOnPress?.() !== false) {
        cancel()
        if (!disposed && options.open()) options.onClose()
      }
    },
    dismiss() {
      cancel()
      if (!disposed && options.open()) options.onClose()
    },
    cancel,
    refresh() {
      if (disposed) return
      if (options.disabled()) {
        cancel()
        if (options.open()) options.onClose()
        return
      }
      if (pendingOpen) armOpen()
      if (closeStarted !== undefined) armClose()
      if (!options.hoverable() && cleanupTransit) {
        clearTransit()
        hovered = false
        scheduleClose()
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      cancel()
    },
  }
}
/** Coordinate pair used only by the measured travel corridor. */
type Point = [number, number]
function cross(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}
function hull(points: Point[]): Point[] {
  const sorted = points.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const lower: Point[] = [],
    upper: Point[] = []
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2)!, lower.at(-1)!, point) <= 0) lower.pop()
    lower.push(point)
  }
  for (const point of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2)!, upper.at(-1)!, point) <= 0) upper.pop()
    upper.push(point)
  }
  lower.pop()
  upper.pop()
  return [...lower, ...upper]
}
function inPolygon(polygon: Point[], point: Point): boolean {
  return (
    polygon.length >= 3 &&
    polygon.every((a, i) => cross(a, polygon[(i + 1) % polygon.length]!, point) >= -0.001)
  )
}
