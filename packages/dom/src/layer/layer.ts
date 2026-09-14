export interface LayerPointerOutsideEvent {
  readonly originalEvent: PointerEvent
  readonly defaultPrevented: boolean
  preventDefault(): void
}

export interface LayerOptions {
  parent?: LayerHandle
  escape?: 'dismiss' | 'ignore'
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Override pointer containment for native backdrops; undefined uses DOM containment. */
  isPointerInside?: (event: PointerEvent) => boolean | undefined
  outsidePointer?: 'dismiss' | 'ignore'
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  onDismiss?: (event: KeyboardEvent | PointerEvent) => void
}

export interface LayerHandle {
  isTopmost(): boolean
  update(options: Omit<LayerOptions, 'parent'>): void
  registerBranch(element: Element): () => void
  contains(event: Event): boolean
  dispose(): void
}

interface Entry {
  element: HTMLElement
  parent?: Entry
  options: Omit<LayerOptions, 'parent'>
  branches: Map<Element, number>
  active: boolean
}

interface Registry {
  entries: Entry[]
  invalidate(): void
  cleanup(): void
}

const registries = new WeakMap<Document, Registry>()
const handles = new WeakMap<LayerHandle, Entry>()

function eventTargets(event: Event, document: Document): Element[] | undefined {
  const path = event.composedPath()
  const target = path[0] as Partial<Element> | undefined
  if (target?.nodeType !== 1 || target.ownerDocument !== document) return
  return path.filter((target): target is Element => {
    const node = target as Partial<Element>
    return node.nodeType === 1 && node.ownerDocument === document
  })
}

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

function primaryPointer(event: PointerEvent): boolean {
  return event.isPrimary && event.button === 0 && !event.ctrlKey
}

function createRegistry(document: Document): Registry {
  const capturedPointers = new Set<number>()
  const gotpointercapture = (event: PointerEvent) => capturedPointers.add(event.pointerId)
  const lostpointercapture = (event: PointerEvent) => capturedPointers.delete(event.pointerId)
  let generation = 0
  const pointerTimers = new Set<ReturnType<typeof setTimeout>>()
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
  const end = () => {
    clearTimeout(compositionTimer)
    compositionTimer = setTimeout(() => {
      composing = false
    }, 0)
  }
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

/** Register an active layer. Dispose it when the open session ends. */
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
