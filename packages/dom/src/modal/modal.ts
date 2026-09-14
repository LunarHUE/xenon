export interface ModalOptions {
  lockScroll?: boolean
}

export interface ModalRegistration {
  registerBranch(element: Element): () => void
  dispose(): void
}

export type ModalHandle = ModalRegistration

interface Entry {
  element: HTMLElement
  branches: Map<Element, number>
  lockScroll: boolean
}

interface Attributes {
  inert: string | null
  hidden: string | null
}

interface State {
  document: Document
  entries: Entry[]
  hidden: Map<Element, Attributes>
  observer: MutationObserver | undefined
  restoreScroll: (() => void) | undefined
}

const states = new WeakMap<Document, State>()

function restoreAttribute(element: Element, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

function restoreHidden(state: State, element: Element, attributes: Attributes) {
  restoreAttribute(element, 'inert', attributes.inert)
  restoreAttribute(element, 'aria-hidden', attributes.hidden)
  state.hidden.delete(element)
}

function children(element: Element): Element[] {
  const result = [...element.children]
  if (element.shadowRoot) result.push(...element.shadowRoot.children)
  if (element.localName === 'slot' && 'assignedElements' in element) {
    result.push(...(element as HTMLSlotElement).assignedElements({ flatten: true }))
  }
  return result
}

function ancestors(element: Element, result: Set<Element>) {
  if (result.has(element)) return
  result.add(element)
  if (element.assignedSlot) ancestors(element.assignedSlot, result)
  if (element.parentElement) ancestors(element.parentElement, result)
  const root = element.getRootNode()
  if ('host' in root) ancestors((root as ShadowRoot).host, result)
}

function lockScroll(document: Document): () => void {
  const view = document.defaultView
  const root = document.documentElement
  const body = document.body
  const gap = view && root.clientWidth > 0 ? Math.max(0, view.innerWidth - root.clientWidth) : 0
  const saved: { style: CSSStyleDeclaration; name: string; value: string; priority: string }[] = []
  const write = (element: HTMLElement, name: string, value: string) => {
    const { style } = element
    saved.push({
      style,
      name,
      value: style.getPropertyValue(name),
      priority: style.getPropertyPriority(name),
    })
    style.setProperty(name, value, 'important')
  }
  if (gap && body && view) {
    const padding = Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0
    write(body, 'padding-right', `${padding + gap}px`)
  }
  for (const element of body ? [root, body] : [root]) {
    write(element, 'overflow-x', 'hidden')
    write(element, 'overflow-y', 'hidden')
  }
  return () => {
    for (const { style, name, value, priority } of saved) {
      if (value) style.setProperty(name, value, priority)
      else style.removeProperty(name)
    }
  }
}

function reconcile(state: State) {
  const { document, entries } = state
  const active = entries.at(-1)
  const permitted = new Set<Element>(active ? [active.element, ...active.branches.keys()] : [])
  const paths = new Set<Element>()
  for (const element of permitted) ancestors(element, paths)
  const hidden = new Set<Element>()
  const visited = new Set<Element>()
  const visit = (element: Element) => {
    if (visited.has(element)) return
    visited.add(element)
    if (permitted.has(element)) return
    if (!paths.has(element)) {
      hidden.add(element)
      return
    }
    for (const child of children(element)) visit(child)
  }
  if (active && document.body) {
    // A detached modal must not hide the entire document while it is mounting.
    const connected = [...permitted].some(
      (element) => element.isConnected && element.ownerDocument === document
    )
    if (connected) visit(document.body)
  }
  for (const [element, attributes] of state.hidden) {
    if (!hidden.has(element)) restoreHidden(state, element, attributes)
  }
  for (const element of hidden) {
    if (!state.hidden.has(element)) {
      state.hidden.set(element, {
        inert: element.getAttribute('inert'),
        hidden: element.getAttribute('aria-hidden'),
      })
    }
    if (!element.hasAttribute('inert')) element.setAttribute('inert', '')
    if (element.getAttribute('aria-hidden') !== 'true') element.setAttribute('aria-hidden', 'true')
  }
  // Observe existing open roots as well as light DOM. Attribute filtering keeps
  // our isolation and scroll writes from feeding back into this observer.
  state.observer?.disconnect()
  const observe = (node: Document | ShadowRoot) => {
    state.observer?.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['slot', 'name'],
    })
    for (const element of node.querySelectorAll('*')) {
      if (element.shadowRoot) observe(element.shadowRoot)
    }
  }
  if (active) observe(document)
  const needsScrollLock = entries.some((entry) => entry.lockScroll)
  if (needsScrollLock && !state.restoreScroll) state.restoreScroll = lockScroll(document)
  if (!needsScrollLock && state.restoreScroll) {
    state.restoreScroll()
    state.restoreScroll = undefined
  }
}

/**
 * Isolates the newest modal in its owner document, including registered portals.
 * Open shadow roots and slots are supported. Closed shadow roots are opaque.
 * Attach shadow roots before registering, or before inserting their hosts.
 * Scroll locking owns root/body overflow and body padding-right until released;
 * callers should avoid writing those properties while a lock is active.
 */
export function registerModal(element: HTMLElement, options: ModalOptions = {}): ModalRegistration {
  const document = element.ownerDocument
  let state = states.get(document)
  if (!state) {
    state = {
      document,
      entries: [],
      hidden: new Map(),
      observer: undefined,
      restoreScroll: undefined,
    }
    const current = state
    const Observer = document.defaultView?.MutationObserver
    if (Observer) state.observer = new Observer(() => reconcile(current))
    states.set(document, state)
  }
  const current = state
  const entry: Entry = { element, branches: new Map(), lockScroll: options.lockScroll !== false }
  current.entries.push(entry)
  reconcile(current)
  let disposed = false
  return {
    registerBranch(branch) {
      if (disposed || branch.ownerDocument !== document) return () => {}
      entry.branches.set(branch, (entry.branches.get(branch) ?? 0) + 1)
      reconcile(current)
      let removed = false
      return () => {
        if (removed || disposed) return
        removed = true
        const count = entry.branches.get(branch) ?? 0
        if (count > 1) entry.branches.set(branch, count - 1)
        else entry.branches.delete(branch)
        reconcile(current)
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      current.entries.splice(current.entries.indexOf(entry), 1)
      reconcile(current)
      if (!current.entries.length) states.delete(document)
    },
  }
}
