export interface LayerOptions {
  parent?: LayerHandle
  escape?: 'dismiss' | 'ignore'
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onDismiss?: (event: KeyboardEvent) => void
}

export interface LayerHandle {
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
  cleanup(): void
}

const registries = new WeakMap<Document, Registry>()
const handles = new WeakMap<LayerHandle, Entry>()

function createRegistry(document: Document): Registry {
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
    cleanup() {
      clearTimeout(compositionTimer)
      document.removeEventListener('compositionstart', start, true)
      document.removeEventListener('compositionend', end, true)
      document.removeEventListener('keydown', keydown)
      registries.delete(document)
    },
  }
  document.addEventListener('compositionstart', start, true)
  document.addEventListener('compositionend', end, true)
  document.addEventListener('keydown', keydown)
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
  registry.entries.push(entry)
  const handle: LayerHandle = {
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
      const path = event.composedPath()
      const target = path[0] as Partial<Element> | undefined
      if (target?.nodeType !== 1 || target.ownerDocument !== document) return false
      const targets = path.filter((target): target is Element => {
        const node = target as Partial<Element>
        return node.nodeType === 1 && node.ownerDocument === document
      })
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
    },
    dispose() {
      if (!entry.active) return
      entry.active = false
      entry.branches.clear()
      registry.entries.splice(registry.entries.indexOf(entry), 1)
      if (registry.entries.length === 0) registry.cleanup()
    },
  }
  handles.set(handle, entry)
  return handle
}
