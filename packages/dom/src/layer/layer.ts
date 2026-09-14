/** Cancelable dismissal request, separate from the native pointer events. */
export interface LayerPointerOutsideEvent {
  /** Pointerup that completed the outside gesture. */
  readonly originalEvent: PointerEvent
  /** Whether this wrapper's preventDefault method has been called. */
  readonly defaultPrevented: boolean
  /** Vetoes dismissal without canceling either native pointer event. Call synchronously in the callback. */
  preventDefault(): void
}

/** Dismissal policies and callbacks for one registered layer. */
export interface LayerOptions {
  /** Active parent in the same document. Establishes portal containment, not stack order; cannot be changed by update. */
  parent?: LayerHandle
  /**
   * Dismiss on Escape or consume it without callbacks. Ignore still prevents the native default.
   * @defaultValue 'dismiss'
   */
  escape?: 'dismiss' | 'ignore'
  /**
   * Runs synchronously on uncanceled Escape before dismissal, unless ignored or composing.
   * Preventing the event default or disposing this layer vetoes dismissal. The options
   * snapshot from before this callback supplies onDismiss even if the stack changes.
   */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /**
   * Classifies pointerdown and matching pointerup during capture. True means inside,
   * false means outside, and undefined uses element/branch/descendant containment.
   * Useful for native backdrops; does not change the handle's contains method.
   */
  isPointerInside?: (event: PointerEvent) => boolean | undefined
  /**
   * Allow outside gesture dismissal. Omission and ignore suppress both pointer callbacks.
   * @defaultValue 'ignore'
   */
  outsidePointer?: 'dismiss' | 'ignore'
  /**
   * Runs in a zero-delay timer after an eligible outside pointerup. Preventing the
   * wrapper default vetoes dismissal. Native pointerdown/up cancellation, a new
   * pointerdown, or layer registration/disposal can cancel the pending request.
   */
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  /**
   * Requests dismissal with Escape keydown or outside pointerup. Escape is synchronous
   * and its default is prevented first; pointers run after dispatch without canceling
   * native defaults. This callback does not dispose the layer or change the DOM.
   */
  onDismiss?: (event: KeyboardEvent | PointerEvent) => void
}

/** Active registration and its containment branches; dispose when its open session ends. */
export interface LayerHandle {
  /** Whether this is the newest active registration in its document; false after disposal. */
  isTopmost(): boolean
  /**
   * Replaces all mutable options without changing parent or stack order. Omitted
   * settings reset to defaults. Pending pointer callbacks retain the pointerup
   * snapshot, while a gesture still awaiting pointerup uses updated options.
   * Does nothing after disposal.
   */
  update(options: Omit<LayerOptions, 'parent'>): void
  /**
   * Adds a same-document element to containment, including for active ancestors.
   * Repeated registrations are reference-counted; the returned release function is
   * idempotent. After disposal, returns a no-op without validating the element.
   * @throws If an active layer receives a branch from another document.
   */
  registerBranch(element: Element): () => void
  /**
   * Checks the event's composed path against this element, branches, and active
   * descendant layers. Call during dispatch; an empty path or an initial target
   * other than a same-document element returns false. False after disposal.
   */
  contains(event: Event): boolean
  /**
   * Idempotently removes this registration and its branches, invalidating pending
   * pointer work for the document. Children remain active but lose containment
   * through this parent. The final disposal releases document listeners and timers.
   */
  dispose(): void
}

/** One registration; entries remain reachable through handles and descendant parent links after disposal. */
interface Entry {
  /** Host whose ownerDocument owns this registration and whose descendants count as inside. */
  element: HTMLElement
  /** Fixed portal ancestry; inactive links stop inherited containment. */
  parent?: Entry
  /** Replaced atomically by handle updates and captured for each dismissal dispatch. */
  options: Omit<LayerOptions, 'parent'>
  /** Reference counts for additional elements treated as inside. */
  branches: Map<Element, number>
  /** Cleared before registry removal so retained handles and ancestry reject the entry. */
  active: boolean
}

/** One document's registration stack and shared event-listener lifecycle. */
interface Registry {
  /** Active entries in registration order; the final entry receives dismissal events. */
  entries: Entry[]
  /** Advances the gesture generation and clears pending pointer gestures and their timers. */
  invalidate(): void
  /** Releases listeners, capture/composition bookkeeping, and registry lookup after invalidation of the empty stack. */
  cleanup(): void
}

/** Shared listeners and dismissal ordering are isolated per owner document. */
const registries = new WeakMap<Document, Registry>()
/** Resolves parent handles without exposing entries through the public handle. */
const handles = new WeakMap<LayerHandle, Entry>()

/** Reads same-document element targets only when the composed path begins at such an element. */
function eventTargets(event: Event, document: Document): Element[] | undefined {
  const path = event.composedPath()
  const target = path[0] as Partial<Element> | undefined
  if (target?.nodeType !== 1 || target.ownerDocument !== document) return
  return path.filter((target): target is Element => {
    const node = target as Partial<Element>
    return node.nodeType === 1 && node.ownerDocument === document
  })
}

/**
 * Uses physical hit testing when capture or text selection retargets pointerup.
 * Descends available shadow roots and follows slots/hosts to reconstruct containment.
 * Returns undefined if a retargeted endpoint cannot be hit-tested.
 */
function pointerUpTargets(
  event: PointerEvent,
  document: Document,
  captured: boolean
): Element[] | undefined {
  const targets = eventTargets(event, document)
  if (!targets) return
  const target = targets[0]
  let hit = document.elementFromPoint?.(event.clientX, event.clientY)
  // Native text selection can also retarget pointerup without reporting capture.
  // Keep the composed path when it agrees with the physical endpoint.
  if (!captured && !target?.hasPointerCapture?.(event.pointerId) && (!hit || targets.includes(hit)))
    return targets
  if (!hit) return
  while (hit.shadowRoot?.elementFromPoint) {
    const inner = hit.shadowRoot.elementFromPoint(event.clientX, event.clientY)
    if (!inner || inner === hit) break
    hit = inner
  }
  const path: Element[] = []
  let node: Element | null = hit
  while (node) {
    path.push(node)
    const root = node.getRootNode() as ShadowRoot
    node = node.assignedSlot ?? node.parentElement ?? root.host ?? null
  }
  return path
}

/** Includes portal descendants only through an uninterrupted chain of active parent entries. */
function contains(registry: Registry, entry: Entry, targets: Element[]): boolean {
  return registry.entries.some((candidate) => {
    let ancestor: Entry | undefined = candidate
    while (ancestor && ancestor !== entry) {
      if (!ancestor.active) return false
      ancestor = ancestor.parent
    }
    if (!ancestor) return false
    return targets.some(
      (target) =>
        candidate.element.contains(target) ||
        [...candidate.branches.keys()].some((branch) => branch.contains(target))
    )
  })
}

/** Accepts primary left-button gestures, excluding Control-click. Other modifiers are allowed. */
function primaryPointer(event: PointerEvent): boolean {
  return event.isPrimary && event.button === 0 && !event.ctrlKey
}

/**
 * Installs one bubble-phase Escape listener and capture-phase pointer/composition
 * listeners for a document. The caller stores the result and cleans it up when empty.
 */
function createRegistry(document: Document): Registry {
  const capturedPointers = new Set<number>()
  const gotpointercapture = (event: PointerEvent) => capturedPointers.add(event.pointerId)
  const lostpointercapture = (event: PointerEvent) => capturedPointers.delete(event.pointerId)
  /** Invalidates gestures across new pointerdowns and stack registration/disposal. */
  let generation = 0
  const pointerTimers = new Set<ReturnType<typeof setTimeout>>()
  /** At most one outside-started gesture can complete, with the same pointer ID and generation. */
  let pending: { entry: Entry; event: PointerEvent; generation: number } | undefined
  const pointerdown = (event: PointerEvent) => {
    registry.invalidate()
    if (!primaryPointer(event)) return
    const entry = registry.entries.at(-1)
    const targets = eventTargets(event, document)
    if (
      !entry ||
      !targets ||
      (entry.options.isPointerInside?.(event) ?? contains(registry, entry, targets))
    )
      return
    pending = { entry, event, generation }
  }
  const pointercancel = (event: PointerEvent) => {
    capturedPointers.delete(event.pointerId)
    if (pending?.event.pointerId === event.pointerId) pending = undefined
  }
  /** Checks both outside endpoints, then defers cancellation checks until native dispatch finishes. */
  const pointerup = (event: PointerEvent) => {
    const captured = capturedPointers.delete(event.pointerId)
    if (!pending || pending.event.pointerId !== event.pointerId) return
    const gesture = pending
    pending = undefined
    const { entry } = gesture
    const current = () =>
      entry.active && generation === gesture.generation && registry.entries.at(-1) === entry
    if (!current() || !primaryPointer(event)) return
    const targets = pointerUpTargets(event, document, captured)
    if (!targets || (entry.options.isPointerInside?.(event) ?? contains(registry, entry, targets)))
      return
    const options = entry.options
    if (options.outsidePointer !== 'dismiss') return
    // Wait for target and bubble handlers to cancel either native event.
    const timer = setTimeout(() => {
      pointerTimers.delete(timer)
      if (!current() || gesture.event.defaultPrevented || event.defaultPrevented) return
      let prevented = false
      const outsideEvent: LayerPointerOutsideEvent = {
        originalEvent: event,
        get defaultPrevented() {
          return prevented
        },
        preventDefault() {
          prevented = true
        },
      }
      options.onPointerOutside?.(outsideEvent)
      if (!current() || prevented || gesture.event.defaultPrevented || event.defaultPrevented)
        return
      options.onDismiss?.(event)
    }, 0)
    pointerTimers.add(timer)
  }
  let composing = false
  let compositionTimer: ReturnType<typeof setTimeout> | undefined
  const start = () => {
    clearTimeout(compositionTimer)
    composing = true
  }
  /** Keeps Escape suppressed through the timer turn following compositionend. */
  const end = () => {
    clearTimeout(compositionTimer)
    compositionTimer = setTimeout(() => {
      composing = false
    }, 0)
  }
  /** Uses the initial top entry's options; callback disposal vetoes dismissal, but registering a successor does not. */
  const keydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing || composing) return
    const entry = registry.entries.at(-1)
    if (!entry) return
    const options = entry.options
    if (options.escape === 'ignore') {
      event.preventDefault()
      return
    }
    options.onEscapeKeyDown?.(event)
    if (event.defaultPrevented || !entry.active) return
    event.preventDefault()
    options.onDismiss?.(event)
  }
  const registry: Registry = {
    entries: [],
    invalidate() {
      generation++
      pending = undefined
      for (const timer of pointerTimers) clearTimeout(timer)
      pointerTimers.clear()
    },
    cleanup() {
      capturedPointers.clear()
      clearTimeout(compositionTimer)
      document.removeEventListener('compositionstart', start, true)
      document.removeEventListener('compositionend', end, true)
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('pointerdown', pointerdown, true)
      document.removeEventListener('pointerup', pointerup, true)
      document.removeEventListener('pointercancel', pointercancel, true)
      document.removeEventListener('gotpointercapture', gotpointercapture, true)
      document.removeEventListener('lostpointercapture', lostpointercapture, true)
      registries.delete(document)
    },
  }
  document.addEventListener('compositionstart', start, true)
  document.addEventListener('compositionend', end, true)
  document.addEventListener('keydown', keydown)
  document.addEventListener('pointerdown', pointerdown, true)
  document.addEventListener('pointerup', pointerup, true)
  document.addEventListener('pointercancel', pointercancel, true)
  document.addEventListener('gotpointercapture', gotpointercapture, true)
  document.addEventListener('lostpointercapture', lostpointercapture, true)
  return registry
}

/**
 * Registers an active layer as the newest entry in its element's owner document.
 *
 * @remarks
 * Only the top entry receives Escape and outside-pointer dismissal requests.
 * Pointer dismissal requires primary left-button down and up outside that entry,
 * with matching pointer IDs and no Control modifier. A stack change invalidates
 * the gesture; successful callbacks use the options captured at pointerup.
 * Escape waits for bubble propagation and ignores composition until the deferred
 * composition-end reset. Registration invokes no callbacks, changes no DOM, and
 * does not move focus or lock scrolling. Keep the host in its original document
 * and dispose the handle when the open session ends.
 *
 * @throws If the supplied parent is disposed, unknown, or belongs to another document.
 * @returns A handle with a fixed parent relationship and replaceable dismissal options.
 */
export function registerLayer(element: HTMLElement, options: LayerOptions = {}): LayerHandle {
  const document = element.ownerDocument
  const parent = options.parent ? handles.get(options.parent) : undefined
  if (options.parent && (!parent?.active || parent.element.ownerDocument !== document)) {
    throw new Error('A layer parent must be active in the same document')
  }
  let registry = registries.get(document)
  if (!registry) {
    registry = createRegistry(document)
    registries.set(document, registry)
  }
  const { parent: _parent, ...initialOptions } = options
  const entry: Entry = {
    element,
    parent,
    options: initialOptions,
    branches: new Map(),
    active: true,
  }
  registry.invalidate()
  registry.entries.push(entry)
  const handle: LayerHandle = {
    isTopmost: () => entry.active && registry.entries.at(-1) === entry,
    update(next) {
      if (entry.active) entry.options = { ...next }
    },
    registerBranch(branch) {
      if (!entry.active) return () => {}
      if (branch.ownerDocument !== document) {
        throw new Error('A layer branch must belong to the same document')
      }
      entry.branches.set(branch, (entry.branches.get(branch) ?? 0) + 1)
      let released = false
      return () => {
        if (released) return
        released = true
        const count = entry.branches.get(branch) ?? 0
        if (count > 1) entry.branches.set(branch, count - 1)
        else entry.branches.delete(branch)
      }
    },
    contains(event) {
      if (!entry.active) return false
      const targets = eventTargets(event, document)
      return !!targets && contains(registry, entry, targets)
    },
    dispose() {
      if (!entry.active) return
      registry.invalidate()
      entry.active = false
      entry.branches.clear()
      registry.entries.splice(registry.entries.indexOf(entry), 1)
      if (registry.entries.length === 0) registry.cleanup()
    },
  }
  handles.set(handle, entry)
  return handle
}
