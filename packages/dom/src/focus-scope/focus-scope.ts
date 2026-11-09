import { focusable, isFocusable, tabbable } from '../internal/vendor/tabbable/tabbable'

/** Focus containment, initial placement, and conditional restoration for one region. */
export interface FocusScopeOptions {
  /**
   * Active parent registered by this module in the same document. Fixed at
   * registration. Noncontained children extend their parent region; the parent
   * chain also supplies restoration fallbacks after ancestors are disposed.
   */
  parent?: FocusScopeHandle
  /**
   * Trap Tab and redirect outside focus while this is the newest containing
   * scope. Defaults to true. False still permits initial placement, mutation-loss
   * recovery and conditional restoration without trapping focus or Tab.
   */
  contain?: boolean
  /**
   * Initial target, accepted only when connected, focusable, in this document,
   * and inside the region. Otherwise preserve usable focus already inside, then
   * try autofocus, then the first tab stop or container fallback. False skips
   * initial placement without disabling later containment. Used only at registration.
   */
  initialFocus?: HTMLElement | false
  /**
   * Attempt conditional restoration on disposal, defaulting to true. False
   * skips the final/opener target but does not prevent a resumed scope from
   * recovering focus into its own region.
   */
  restoreFocus?: boolean
  /**
   * Preferred connected, focusable restoration target in this document.
   * Falls back to the element focused at registration when unusable; ancestor
   * opener fallbacks may replace targets belonging to disposed parents.
   */
  finalFocus?: HTMLElement
}

/** Registration lifetime; mutation methods become no-ops after disposal. */
export interface FocusScopeHandle {
  /**
   * Replaces mutable options, restoring defaults for omitted properties. Keeps
   * parent identity and does not rerun initial placement. Reconciles lost focus
   * synchronously; enabling containment recovers focus if this scope becomes top.
   */
  update(options: Omit<FocusScopeOptions, 'parent' | 'initialFocus'>): void
  /**
   * Adds an extra region root, such as a portal, in registration order. Duplicate
   * registrations are counted separately; the returned cleanup is idempotent.
   * Adding/removing roots may synchronously recover focus into the top scope.
   * @throws If the branch belongs to another document and the scope is active.
   */
  registerBranch(element: Element): () => void
  /**
   * Removes this scope synchronously and releases its branches and owned fallback
   * tabindex. Restores focus only when focus still belongs here or was lost to
   * the body, and no newer containing scope or focused noncontained scope blocks it.
   * Descendants remain registered. Repeated calls are harmless. The last scope
   * removes the document listeners and mutation observer.
   */
  dispose(): void
}

/** Focusable HTML or SVG element supporting preventScroll focus calls. */
type FocusTarget = HTMLElement | SVGElement
/** Internal registration state retained by handles, including disposed parent history. */
type Scope = {
  /** Primary region root; its owner document owns all listeners and restoration targets. */
  container: HTMLElement
  /** Fixed logical ancestry; disposal leaves this reference available to descendants. */
  parent?: Scope
  /** Copied at registration and replaced on update; parent identity lives in the separate parent field. */
  options: FocusScopeOptions
  /** Reference counts for extra region roots in first-registration order. */
  branches: Map<Element, number>
  /** Deep active element captured before registration performs focus placement. */
  opener: Element | null
  /** Most recently observed focus within this region, reused when still usable. */
  last: Element | null
  /** Tracks focus ownership for loss recovery; deliberate focus outside clears it except at body. */
  hadFocus: boolean
  /** Prevents further handle mutations and recursive recovery after logical closure. */
  disposed: boolean
  /** Region roots captured before disposal so descendant restoration can avoid closed parent regions. */
  closedRoots?: Element[]
  /** Whether this registration added the container tabindex and may remove it if still -1. */
  fallbackOwned: boolean
}
/** Shared listeners, observer, and registration order for one owner document. */
type Manager = {
  /** Active registrations in creation order; the last containing entry owns trapping. */
  scopes: Scope[]
  /** Rebuilds document and open-shadow observation after region membership changes. */
  refresh(): void
  /** Recovers unusable or escaped focus only if the top containing scope previously owned focus. */
  reconcile(): void
  /** Synchronously tries remembered focus, the first tab stop, then the container unless disposed or reentering. */
  recover(scope: Scope): void
  /** Disconnects observation and listeners and removes the document manager; called after its final scope is removed. */
  destroy(): void
}
/** One manager per document, removed when its final scope is disposed. */
const managers = new WeakMap<Document, Manager>()
/** Resolves only handles issued here, including disposed ancestors needed for restoration. */
const handles = new WeakMap<FocusScopeHandle, Scope>()
const checks = { getShadowRoot: true } as const

/** Follows active elements through accessible open shadow roots. */
function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}

/** Walks slots, light-DOM parents, and shadow hosts to test composed ancestry. */
function composedContains(root: Element, target: Element): boolean {
  let node: Node | null = target
  while (node) {
    if (node === root) return true
    node = (node as Element).assignedSlot || node.parentNode || (node as ShadowRoot).host || null
  }
  return false
}

/** Lists container, branches, then recursively included noncontained children in registration order. */
function roots(scope: Scope, scopes: Scope[]): Element[] {
  const result: Element[] = [scope.container, ...scope.branches.keys()]
  for (const child of scopes) {
    if (child.parent === scope && child.options.contain === false) {
      result.push(...roots(child, scopes))
    }
  }
  return result
}

/** Tests the current region, or its saved roots after logical disposal. */
function contains(scope: Scope, target: Element | null, scopes: Scope[]): boolean {
  return (
    !!target &&
    (scope.closedRoots ?? roots(scope, scopes)).some((root) => composedContains(root, target))
  )
}

/** Accepts only connected, focusable elements owned by the specified document. */
function usable(element: Element | null | undefined, document: Document): element is FocusTarget {
  return (
    !!element &&
    element.ownerDocument === document &&
    element.isConnected &&
    isFocusable(element, checks)
  )
}

/**
 * Concatenates each root's tab order, removes duplicate elements, and keeps one
 * stop per named radio group sharing a form and tree. Root order is not globally DOM-sorted.
 */
function candidates(scope: Scope, scopes: Scope[]): FocusTarget[] {
  const nodes = [
    ...new Set(
      roots(scope, scopes).flatMap((root) => tabbable(root, { ...checks, includeContainer: true }))
    ),
  ]
  // Tabbable resolves checked radios; collapse unchecked groups across portal roots too.
  return nodes.filter((node, index) => {
    if (node.localName !== 'input') return true
    const radio = node as HTMLInputElement
    if (radio.type !== 'radio' || !radio.name) return true
    return !nodes.slice(0, index).some((other) => {
      if (other.localName !== 'input') return false
      const previous = other as HTMLInputElement
      return (
        previous.type === 'radio' &&
        previous.name === radio.name &&
        previous.form === radio.form &&
        previous.getRootNode() === radio.getRootNode()
      )
    })
  })
}

/** Requests focus without scrolling; focus events can synchronously reenter scope logic. */
function focus(element: FocusTarget): void {
  element.focus({ preventScroll: true })
}

/** Focuses the container, temporarily adding tabindex=-1 only when absent on a non-dialog host. */
function fallback(scope: Scope): void {
  // Native dialogs are focusable without a tabindex, which HTML forbids on dialog.
  if (scope.container.localName === 'dialog') {
    scope.container.focus({ preventScroll: true })
    return
  }
  if (!scope.container.hasAttribute('tabindex')) {
    scope.container.setAttribute('tabindex', '-1')
    scope.fallbackOwned = true
  }
  if (usable(scope.container, scope.container.ownerDocument)) focus(scope.container)
}

/** Installs document focus/keyboard listeners and a shared DOM mutation observer. */
function createManager(document: Document): Manager {
  const scopes: Scope[] = []
  const redirecting = new Set<Scope>()
  /** Newest containing scope owns trapping; noncontained registrations do not pause it. */
  const top = () => scopes.findLast((scope) => scope.options.contain !== false)
  /** Restores usable remembered focus, then a tab stop, then the container, with per-scope reentry protection. */
  const recover = (scope: Scope) => {
    if (redirecting.has(scope) || scope.disposed) return
    redirecting.add(scope)
    try {
      if (usable(scope.last, document) && contains(scope, scope.last, scopes)) focus(scope.last)
      else {
        const first = candidates(scope, scopes)[0]
        if (first) focus(first)
        else fallback(scope)
      }
    } finally {
      redirecting.delete(scope)
    }
  }
  /** Records region ownership before redirecting focus that escaped the current trap. */
  const onFocus = () => {
    const active = activeElement(document)
    for (const scope of scopes) {
      if (contains(scope, active, scopes)) {
        scope.last = active
        scope.hadFocus = true
      } else if (active !== document.body) scope.hadFocus = false
    }
    const scope = top()
    if (scope && !contains(scope, active, scopes)) recover(scope)
  }
  /** Recomputes and cycles the top region on unconsumed Tab; Shift reverses its root-ordered traversal. */
  const onKey = (event: KeyboardEvent) => {
    const scope = top()
    if (
      !scope ||
      event.key !== 'Tab' ||
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return
    refresh()
    const nodes = candidates(scope, scopes)
    event.preventDefault()
    if (!nodes.length) return fallback(scope)
    const index = nodes.indexOf(activeElement(document) as FocusTarget)
    const next =
      index < 0
        ? event.shiftKey
          ? nodes.length - 1
          : 0
        : (index + (event.shiftKey ? -1 : 1) + nodes.length) % nodes.length
    focus(nodes[next]!)
  }
  /** Recovers mutation loss in the newest owning region without crossing a newer containing trap. */
  const observer = new document.defaultView!.MutationObserver(() => {
    refresh()
    const attempted = new Set<Scope>()
    while (true) {
      const trapIndex = scopes.findLastIndex((scope) => scope.options.contain !== false)
      const scope = scopes.findLast(
        (scope, index) =>
          index >= trapIndex &&
          !attempted.has(scope) &&
          scope.hadFocus &&
          scope.container.isConnected
      )
      if (!scope) return
      const active = activeElement(document)
      if (contains(scope, active, scopes) && usable(active, document)) return
      // Focus callbacks can register scopes or intentionally focus another region.
      attempted.add(scope)
      recover(scope)
      if (usable(activeElement(document), document)) return
    }
  })
  const observed = new Set<Node>()
  const observe = (node: Node) => {
    if (observed.has(node)) return
    observed.add(node)
    observer.observe(node, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        'hidden',
        'disabled',
        'inert',
        'style',
        'class',
        'tabindex',
        'open',
        'type',
        'checked',
        'name',
      ],
    })
  }
  /** Observes accessible shadow trees below roots; closed shadow contents remain inaccessible. */
  const discover = (root: Element) => {
    if (root.shadowRoot) {
      observe(root.shadowRoot)
      for (const child of root.shadowRoot.children) discover(child)
    }
    for (const child of root.children) discover(child)
  }
  /** Rebuilds observation of the document and open shadow roots around all registered regions. */
  function refresh() {
    observer.disconnect()
    observed.clear()
    observe(document)
    for (const scope of scopes) {
      for (const root of roots(scope, scopes)) {
        // A registered container may already live inside a shadow tree.
        // Document observation cannot see that tree or its shadow ancestors.
        let ancestor: Node | null = root
        while (ancestor) {
          if ((ancestor as ShadowRoot).host && (ancestor as ShadowRoot).mode === 'open')
            observe(ancestor)
          ancestor =
            (ancestor as Element).assignedSlot ||
            ancestor.parentNode ||
            (ancestor as ShadowRoot).host ||
            null
        }
        discover(root)
      }
    }
  }
  observe(document)
  document.addEventListener('focusin', onFocus, true)
  document.addEventListener('keydown', onKey)
  return {
    scopes,
    refresh,
    reconcile() {
      const scope = top()
      const active = activeElement(document)
      if (scope?.hadFocus && (!usable(active, document) || !contains(scope, active, scopes)))
        recover(scope)
    },
    recover,
    destroy() {
      observer.disconnect()
      observed.clear()
      document.removeEventListener('focusin', onFocus, true)
      document.removeEventListener('keydown', onKey)
      managers.delete(document)
    },
  }
}

/**
 * Registers a focus region independently of dismissal layers and places initial
 * focus synchronously unless disabled by initialFocus=false.
 *
 * @param container - Region host in a live document with a defaultView and MutationObserver.
 * @param options - Registration settings; omitted containment and restoration default to true.
 * @returns A handle to update policy, register portal roots, and end the scope.
 * @throws If the supplied parent is foreign, disposed, or from another document.
 * @remarks
 * Dispose when logically closed, even if exit animation keeps the DOM mounted.
 * This module handles focus only; it does not dismiss overlays or make outside
 * content inert. The newest containing scope owns Tab and outside-focus recovery.
 * Focus moves use preventScroll. DOM mutations can recover focus asynchronously
 * through the shared observer; updates and branch changes reconcile immediately.
 * Empty regions can receive a temporary tabindex=-1, removed on disposal only
 * if the registration added it and its value remains -1. Native dialog hosts
 * are focused without adding tabindex.
 */
export function registerFocusScope(
  container: HTMLElement,
  options: FocusScopeOptions = {}
): FocusScopeHandle {
  const document = container.ownerDocument
  const parent = options.parent ? handles.get(options.parent) : undefined
  if (
    options.parent &&
    (!parent || parent.disposed || parent.container.ownerDocument !== document)
  ) {
    throw new Error('Focus scope parent must be active in the same document')
  }
  let manager = managers.get(document)
  if (!manager) {
    manager = createManager(document)
    managers.set(document, manager)
  }
  const state = manager
  const scope: Scope = {
    container,
    parent,
    options: { ...options },
    branches: new Map(),
    opener: activeElement(document),
    last: null,
    hadFocus: false,
    disposed: false,
    fallbackOwned: false,
  }
  state.scopes.push(scope)
  const handle: FocusScopeHandle = {
    update(next) {
      if (scope.disposed) return
      const wasContained = scope.options.contain !== false
      scope.options = { ...next }
      state.refresh()
      state.reconcile()
      if (
        !wasContained &&
        next.contain !== false &&
        state.scopes.findLast((item) => item.options.contain !== false) === scope
      )
        state.recover(scope)
    },
    registerBranch(element) {
      if (scope.disposed) return () => {}
      if (element.ownerDocument !== document)
        throw new Error('Focus scope branches must belong to the same document')
      scope.branches.set(element, (scope.branches.get(element) ?? 0) + 1)
      state.refresh()
      state.reconcile()
      let removed = false
      return () => {
        if (removed || scope.disposed) return
        removed = true
        const count = scope.branches.get(element)!
        if (count === 1) scope.branches.delete(element)
        else scope.branches.set(element, count - 1)
        state.refresh()
        const top = state.scopes.findLast((item) => item.options.contain !== false)
        if (top?.hadFocus && !contains(top, activeElement(document), state.scopes))
          state.recover(top)
      }
    },
    dispose() {
      if (scope.disposed) return
      const active = activeElement(document)
      const canRestore = !state.scopes
        .slice(state.scopes.indexOf(scope) + 1)
        .some((newer) => newer.options.contain !== false || contains(newer, active, state.scopes))
      const shouldRestore =
        canRestore &&
        (contains(scope, active, state.scopes) ||
          ((active === document.body || !active) && scope.hadFocus))
      scope.closedRoots = roots(scope, state.scopes)
      scope.disposed = true
      state.scopes.splice(state.scopes.indexOf(scope), 1)
      if (scope.fallbackOwned && container.getAttribute('tabindex') === '-1')
        container.removeAttribute('tabindex')
      if (!state.scopes.length) state.destroy()
      else state.refresh()
      if (scope.options.restoreFocus !== false && shouldRestore) {
        let target = usable(scope.options.finalFocus, document)
          ? scope.options.finalFocus
          : scope.opener
        let ancestor = scope.parent
        while (ancestor) {
          if (
            usable(target, document) &&
            !(ancestor.disposed && contains(ancestor, target, state.scopes))
          ) {
            ancestor = ancestor.parent
            continue
          }
          target = ancestor.opener
          ancestor = ancestor.parent
        }
        if (usable(target, document)) focus(target)
      }
      const resumed = state.scopes.findLast((item) => item.options.contain !== false)
      if (shouldRestore && resumed && !contains(resumed, activeElement(document), state.scopes))
        state.recover(resumed)
      scope.branches.clear()
    },
  }
  handles.set(handle, scope)
  state.refresh()
  if (
    usable(activeElement(document), document) &&
    contains(scope, activeElement(document), state.scopes)
  ) {
    scope.last = activeElement(document)
    scope.hadFocus = true
  }
  if (options.initialFocus !== false) {
    const explicit = options.initialFocus
    if (usable(explicit, document) && contains(scope, explicit, state.scopes)) focus(explicit)
    else if (
      usable(activeElement(document), document) &&
      contains(scope, activeElement(document), state.scopes)
    ) {
      scope.last = activeElement(document)
      scope.hadFocus = true
    } else {
      const autofocus = roots(scope, state.scopes)
        .flatMap((root) => focusable(root, { ...checks, includeContainer: true }))
        .find((node) => node.hasAttribute('autofocus'))
      if (autofocus) focus(autofocus)
      else state.recover(scope)
    }
  }
  return handle
}
