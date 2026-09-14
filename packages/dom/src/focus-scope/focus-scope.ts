import { focusable, isFocusable, tabbable } from 'tabbable'

export interface FocusScopeOptions {
  parent?: FocusScopeHandle
  contain?: boolean
  initialFocus?: HTMLElement | false
  restoreFocus?: boolean
  finalFocus?: HTMLElement
}

export interface FocusScopeHandle {
  update(options: Omit<FocusScopeOptions, 'parent' | 'initialFocus'>): void
  registerBranch(element: Element): () => void
  dispose(): void
}

type FocusTarget = HTMLElement | SVGElement
type Scope = {
  container: HTMLElement
  parent?: Scope
  options: FocusScopeOptions
  branches: Map<Element, number>
  opener: Element | null
  last: Element | null
  hadFocus: boolean
  disposed: boolean
  closedRoots?: Element[]
  fallbackOwned: boolean
}
type Manager = {
  scopes: Scope[]
  refresh(): void
  reconcile(): void
  recover(scope: Scope): void
  destroy(): void
}
const managers = new WeakMap<Document, Manager>()
const handles = new WeakMap<FocusScopeHandle, Scope>()
const checks = { getShadowRoot: true } as const

function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}

function composedContains(root: Element, target: Element): boolean {
  let node: Node | null = target
  while (node) {
    if (node === root) return true
    node = (node as Element).assignedSlot || node.parentNode || (node as ShadowRoot).host || null
  }
  return false
}

function roots(scope: Scope, scopes: Scope[]): Element[] {
  const result: Element[] = [scope.container, ...scope.branches.keys()]
  for (const child of scopes) {
    if (child.parent === scope && child.options.contain === false) {
      result.push(...roots(child, scopes))
    }
  }
  return result
}

function contains(scope: Scope, target: Element | null, scopes: Scope[]): boolean {
  return (
    !!target &&
    (scope.closedRoots ?? roots(scope, scopes)).some((root) => composedContains(root, target))
  )
}

function usable(element: Element | null | undefined, document: Document): element is FocusTarget {
  return (
    !!element &&
    element.ownerDocument === document &&
    element.isConnected &&
    isFocusable(element, checks)
  )
}

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

function focus(element: FocusTarget): void {
  element.focus({ preventScroll: true })
}

function fallback(scope: Scope): void {
  if (!scope.container.hasAttribute('tabindex')) {
    scope.container.setAttribute('tabindex', '-1')
    scope.fallbackOwned = true
  }
  if (usable(scope.container, scope.container.ownerDocument)) focus(scope.container)
}

function createManager(document: Document): Manager {
  const scopes: Scope[] = []
  const redirecting = new Set<Scope>()
  const top = () => scopes.findLast((scope) => scope.options.contain !== false)
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
  const observer = new document.defaultView!.MutationObserver(() => {
    refresh()
    const scope = top()
    if (!scope || !scope.hadFocus) return
    const active = activeElement(document)
    if (contains(scope, active, scopes) && usable(active, document)) return
    // A replacement that took focus has already updated `last` through focusin.
    recover(scope)
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
  const discover = (root: Element) => {
    if (root.shadowRoot) {
      observe(root.shadowRoot)
      for (const child of root.shadowRoot.children) discover(child)
    }
    for (const child of root.children) discover(child)
  }
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

/** Register a focus region independently of dismissal layers. Dispose when logically closed. */
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
