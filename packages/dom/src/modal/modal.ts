/** Document isolation policy captured when a modal registers. */
export interface ModalOptions {
  /**
   * Portal destination inside this modal, normally its focus-scope content.
   * Defaults to the modal host. Must belong to the same document and be a
   * composed descendant of the host; invalid destinations throw before registration.
   */
  content?: HTMLElement
  /** Lock root overflow and compensate body padding while any requesting modal remains. Defaults to true. */
  lockScroll?: boolean
}

/** Lifetime and portal branches for one entry in the document modal stack. */
export interface ModalRegistration {
  /**
   * Keep an additional same-document subtree interactive when this modal is newest.
   * Registrations are reference-counted; the returned cleanup is idempotent. Calls
   * after disposal or with a foreign-document element return a no-op cleanup.
   */
  registerBranch(element: Element): () => void
  /**
   * Idempotently remove this modal and reconcile the next newest entry. Restore
   * saved attributes where isolation ends and release scroll locking when no entry needs it.
   */
  dispose(): void
}

/** Alias for the modal registration returned by {@link registerModal}. */
export type ModalHandle = ModalRegistration

/** One modal and its independently reference-counted permitted branches. */
interface Entry {
  /** Modal subtree protected when this is the newest registration. */
  element: HTMLElement
  /** Stable content destination exposed to document subscribers. */
  content: HTMLElement
  /** Extra permitted subtrees, counted so independent registrations can release safely. */
  branches: Map<Element, number>
  /** Whether this entry contributes a document scroll-lock request. */
  lockScroll: boolean
}

/** Original attribute strings to restore when a subtree leaves isolation. */
interface Attributes {
  /** Original inert attribute, with null representing absence. */
  inert: string | null
  /** Original aria-hidden attribute, not the native hidden attribute. */
  hidden: string | null
}

/** Shared modal stack and owned document mutations. */
interface State {
  /** Owner document shared by all entries. */
  document: Document
  /** Registration order; only the final entry determines permitted subtrees. */
  entries: Entry[]
  /** Currently isolated roots and their values before isolation. */
  hidden: Map<Element, Attributes>
  /** Watches child/slot changes in the document and discovered open shadow roots. */
  observer: MutationObserver | undefined
  /** Saved-style restoration while at least one modal requests a scroll lock. */
  restoreScroll: (() => void) | undefined
}

/** Independent isolation stacks, weakly keyed by owner document. */
const states = new WeakMap<Document, State>()

/** A destination observer and its last synchronously delivered value. */
interface ContentSubscriber {
  /** Receives destination changes after modal isolation has reconciled. */
  callback: (content: HTMLElement | undefined) => void
  /** Last delivered destination; equal destinations do not notify again. */
  content: HTMLElement | undefined
}

/** Subscribers alone allocate no document listeners or mutation observers. */
const contentSubscribers = new WeakMap<Document, Set<ContentSubscriber>>()

/** Publish changed destinations after isolation, including an empty modal stack. */
function publishContent(document: Document): boolean {
  const subscribers = contentSubscribers.get(document)
  if (!subscribers) return false
  let published = false
  for (const subscriber of [...subscribers]) {
    if (!subscribers.has(subscriber)) continue
    const content = states.get(document)?.entries.at(-1)?.content
    if (subscriber.content === content) continue
    subscriber.content = content
    published = true
    subscriber.callback(content)
  }
  return published
}

/** Host of the newest registered modal in the document, or undefined when none is open. */
export function getTopModal(document: Document): HTMLElement | undefined {
  return states.get(document)?.entries.at(-1)?.element
}

/**
 * Subscribe to the newest registered modal's content in one document. Emits the
 * current destination synchronously, then only changes after isolation is
 * reconciled. Undefined means no modal is registered. Nested modals follow
 * registration order, independently of DOM order. The idempotent cleanup removes
 * this callback; subscriptions alone create no document listeners or observers.
 * Moving existing portal DOM into the destination preserves its framework owner.
 */
export function subscribeModalContent(
  document: Document,
  callback: (content: HTMLElement | undefined) => void
): () => void {
  let subscribers = contentSubscribers.get(document)
  if (!subscribers) {
    subscribers = new Set()
    contentSubscribers.set(document, subscribers)
  }
  const subscriber = { callback, content: states.get(document)?.entries.at(-1)?.content }
  subscribers.add(subscriber)
  try {
    callback(subscriber.content)
    const state = states.get(document)
    if (state) reconcile(state)
  } catch (error) {
    subscribers.delete(subscriber)
    if (!subscribers.size) contentSubscribers.delete(document)
    throw error
  }
  const current = subscribers
  return () => {
    current.delete(subscriber)
    if (!current.size && contentSubscribers.get(document) === current)
      contentSubscribers.delete(document)
  }
}

/** Restore exact attribute text or remove an originally absent attribute. */
function restoreAttribute(element: Element, name: string, value: string | null) {
  if (value === null) element.removeAttribute(name)
  else element.setAttribute(name, value)
}

/** Restore both saved attributes and relinquish ownership of this subtree. */
function restoreHidden(state: State, element: Element, attributes: Attributes) {
  restoreAttribute(element, 'inert', attributes.inert)
  restoreAttribute(element, 'aria-hidden', attributes.hidden)
  state.hidden.delete(element)
}

/** Light children, open shadow children, and flattened assigned elements for isolation traversal. */
function children(element: Element): Element[] {
  const result = [...element.children]
  if (element.shadowRoot) result.push(...element.shadowRoot.children)
  if (element.localName === 'slot' && 'assignedElements' in element) {
    result.push(...(element as HTMLSlotElement).assignedElements({ flatten: true }))
  }
  return result
}

/** Collect paths through light DOM, assigned slots, and shadow hosts without revisiting nodes. */
function ancestors(element: Element, result: Set<Element>) {
  if (result.has(element)) return
  result.add(element)
  if (element.assignedSlot) ancestors(element.assignedSlot, result)
  if (element.parentElement) ancestors(element.parentElement, result)
  const root = element.getRootNode()
  if ('host' in root) ancestors((root as ShadowRoot).host, result)
}

/** Save inline values/priorities, apply the shared lock, and return exact style restoration. */
function lockScroll(document: Document): () => void {
  const view = document.defaultView
  const root = document.documentElement
  const body = document.body
  const gap = view && root.clientWidth > 0 ? Math.max(0, view.innerWidth - root.clientWidth) : 0
  const saved: { style: CSSStyleDeclaration; name: string; value: string; priority: string }[] = []
  const written = new Set<HTMLElement>()
  const write = (element: HTMLElement, name: string, value: string) => {
    const { style } = element
    written.add(element)
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
  // Body overflow would create a new scrolling ancestor for sticky descendants,
  // moving headers offscreen while the viewport itself stays at the same offset.
  write(root, 'overflow-x', 'hidden')
  write(root, 'overflow-y', 'hidden')
  return () => {
    for (const { style, name, value, priority } of saved) {
      if (value) style.setProperty(name, value, priority)
      else style.removeProperty(name)
    }
    // Wait until every owned property is restored so author declarations survive.
    for (const element of written) {
      if (element.style.length === 0) element.removeAttribute('style')
    }
  }
}

/** Recompute outside roots for the newest entry, refresh observation, and reconcile all scroll requests. */
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
  // Subscribers can move an isolated portal into the new destination. Restore
  // its saved inert/aria-hidden attributes before registration returns instead
  // of leaving the relocated subtree inert until observer delivery.
  if (publishContent(document)) reconcile(state)
}

/**
 * Isolates the newest modal in its owner document, including registered portals.
 * Open shadow roots and slots are supported. Closed shadow roots are opaque.
 * Attach shadow roots before registering, or before inserting their hosts.
 * Scroll locking owns root overflow and body padding-right until released;
 * callers should avoid writing those properties while a lock is active.
 *
 * @remarks
 * Registration reconciles synchronously. Outside subtrees receive inert and
 * aria-hidden; their original attribute strings are restored when no longer
 * excluded. Focus containment, focus restoration, dismissal, and visual layering
 * are separate responsibilities. Detached content does not isolate the whole
 * document, but its scroll-lock request still applies. Branch membership changes
 * reconcile synchronously; observed DOM changes reconcile on observer delivery.
 * Dispose the registration when it is no longer modal. Options are captured once.
 */
export function registerModal(element: HTMLElement, options: ModalOptions = {}): ModalRegistration {
  const document = element.ownerDocument
  const content = options.content ?? element
  const path = new Set<Element>()
  ancestors(content, path)
  if (content.ownerDocument !== document || !path.has(element))
    throw new Error('Modal content must be a same-document descendant of its host')
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
  const entry: Entry = {
    element,
    content,
    branches: new Map(),
    lockScroll: options.lockScroll !== false,
  }
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
