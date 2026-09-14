import { isFocusable } from 'tabbable'
import { registerLayer } from '../layer'
import type { LayerHandle, LayerPointerOutsideEvent } from '../layer'
import { registerFocusScope } from '../focus-scope'
import type { FocusScopeHandle } from '../focus-scope'
import { registerModal } from '../modal'
import type { ModalRegistration } from '../modal'

export type FloatingDismissReason = 'escape' | 'pointer-outside' | 'focus-outside' | 'native'
export interface FloatingFocusOutsideEvent {
  readonly originalEvent: FocusEvent
  readonly defaultPrevented: boolean
  preventDefault(): void
}
export interface FloatingLayerOptions {
  content: HTMLElement
  open: boolean
  active: boolean
  positioned: boolean
  trigger?: HTMLElement
  parent?: LayerHandle
  modal?: boolean
  initialFocus?: HTMLElement | false
  finalFocus?: HTMLElement
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  closeOnFocusOutside?: boolean
  restoreFocus?: boolean
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  onFocusOutside?: (event: FloatingFocusOutsideEvent) => void
  onDismiss: (reason: FloatingDismissReason) => void
}
export interface FloatingLayer {
  readonly layer: LayerHandle | undefined
  update(options: FloatingLayerOptions): void
  isShown(): boolean
  dispose(): void
}
interface Session {
  wrapper: HTMLElement
  opener: Element | null
  returnFocus: Element | null | undefined
  parent?: Session
  layer: LayerHandle
  disposed: boolean
}
const sessions = new WeakMap<Document, Session[]>()
function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}
function contains(root: Element, target: Element | null): boolean {
  let current: Node | null = target
  while (current) {
    if (current === root) return true
    current =
      (current as Element).assignedSlot ||
      current.parentNode ||
      (current as ShadowRoot).host ||
      null
  }
  return false
}

/** Native top-layer hosting plus dismissal/focus. Positioning stays independent. */
export function createFloatingLayer(
  wrapper: HTMLElement,
  initial: FloatingLayerOptions
): FloatingLayer {
  const document = wrapper.ownerDocument
  const originalPopover = wrapper.getAttribute('popover')
  const originalDisplay = wrapper.style.getPropertyValue('display')
  const originalDisplayPriority = wrapper.style.getPropertyPriority('display')
  let options = initial
  let disposed = false
  let shown = false
  let generation = 0
  let session: Session | undefined
  let scope: FocusScopeHandle | undefined
  let modal: ModalRegistration | undefined
  let registeredTrigger: HTMLElement | undefined
  let releaseTrigger: (() => void) | undefined
  let pointerDown = false
  let releasePointerTimer: ReturnType<typeof setTimeout> | undefined
  let focusTimer: ReturnType<typeof setTimeout> | undefined
  let nativeChange = false
  let restore = true
  wrapper.setAttribute('popover', 'manual')
  const native = typeof wrapper.showPopover === 'function'
  const top = () => !!session?.layer.isTopmost()
  const request = (reason: FloatingDismissReason) => {
    if (disposed || !session || !options.open) return
    restore = reason !== 'focus-outside'
    options.onDismiss(reason)
  }
  const layerOptions = () => ({
    escape:
      options.open && options.closeOnEscape !== false ? ('dismiss' as const) : ('ignore' as const),
    outsidePointer:
      options.open && options.closeOnOutside !== false ? ('dismiss' as const) : ('ignore' as const),
    onEscapeKeyDown: options.onEscapeKeyDown,
    onPointerOutside: options.onPointerOutside,
    onDismiss(event: KeyboardEvent | PointerEvent) {
      request(event.type === 'keydown' ? 'escape' : 'pointer-outside')
    },
  })
  const show = () => {
    if (shown) return
    nativeChange = true
    try {
      if (native) wrapper.showPopover()
      else wrapper.style.setProperty('display', 'block')
      shown = true
    } finally {
      nativeChange = false
    }
  }
  const hide = () => {
    if (!shown) return
    nativeChange = true
    try {
      if (native && wrapper.matches(':popover-open')) wrapper.hidePopover()
      else if (!native) wrapper.style.setProperty('display', 'none')
      shown = false
    } finally {
      nativeChange = false
    }
  }
  const deactivate = () => {
    generation++
    clearTimeout(focusTimer)
    focusTimer = undefined
    if (!session) {
      hide()
      return
    }
    const ending = session
    const active = activeElement(document)
    const ownsFocus = top() && (contains(wrapper, active) || !active || active === document.body)
    ending.disposed = true
    scope?.dispose()
    scope = undefined
    modal?.dispose()
    modal = undefined
    releaseTrigger?.()
    releaseTrigger = undefined
    registeredTrigger = undefined
    ending.layer.dispose()
    const stack = sessions.get(document)!
    stack.splice(stack.indexOf(ending), 1)
    if (!stack.length) sessions.delete(document)
    session = undefined
    hide()
    // Native hiding can restore its opener. Preserve deliberate outside focus.
    if (!ownsFocus) {
      if (active && active !== document.body && isFocusable(active, { getShadowRoot: true }))
        (active as HTMLElement).focus({ preventScroll: true })
      return
    }
    if (!restore || options.restoreFocus === false) return
    const usable = (node: Element | null | undefined): node is HTMLElement =>
      !!node &&
      node.ownerDocument === document &&
      node.isConnected &&
      isFocusable(node, { getShadowRoot: true })
    let target: Element | null | undefined = options.finalFocus ?? options.trigger ?? ending.opener
    if (!usable(target)) target = usable(options.trigger) ? options.trigger : ending.opener
    let ancestor = ending.parent
    while (ancestor) {
      if (!usable(target) || (ancestor.disposed && contains(ancestor.wrapper, target)))
        target = usable(ancestor.returnFocus) ? ancestor.returnFocus : ancestor.opener
      ancestor = ancestor.parent
    }
    if (usable(target)) target.focus({ preventScroll: true })
  }
  const activate = () => {
    const stack = sessions.get(document) ?? []
    const parent = stack.findLast((entry) =>
      options.parent ? entry.layer === options.parent : contains(entry.wrapper, wrapper)
    )
    const opener = activeElement(document)
    const layer = registerLayer(wrapper, {
      ...layerOptions(),
      parent: options.parent ?? parent?.layer,
    })
    session = {
      wrapper,
      opener,
      returnFocus: options.finalFocus ?? options.trigger ?? opener,
      parent,
      layer,
      disposed: false,
    }
    stack.push(session)
    sessions.set(document, stack)
    restore = true
    show()
    if (options.modal) modal = registerModal(wrapper)
  }
  const focusin = (event: FocusEvent) => {
    if (
      pointerDown ||
      options.modal ||
      !options.open ||
      !options.positioned ||
      options.closeOnFocusOutside === false ||
      !top() ||
      session!.layer.contains(event)
    )
      return
    const target = event.composedPath()[0]
    const ticket = generation
    clearTimeout(focusTimer)
    focusTimer = setTimeout(() => {
      focusTimer = undefined
      if (
        disposed ||
        ticket !== generation ||
        !top() ||
        !options.open ||
        pointerDown ||
        activeElement(document) !== target
      )
        return
      let prevented = false
      options.onFocusOutside?.({
        originalEvent: event,
        get defaultPrevented() {
          return prevented
        },
        preventDefault() {
          prevented = true
        },
      })
      if (!prevented && !event.defaultPrevented) request('focus-outside')
    }, 0)
  }
  const pointerdown = () => {
    pointerDown = true
    clearTimeout(releasePointerTimer)
    clearTimeout(focusTimer)
  }
  const pointerup = () => {
    clearTimeout(releasePointerTimer)
    releasePointerTimer = setTimeout(() => {
      pointerDown = false
    }, 0)
  }
  const beforetoggle = (event: Event) => {
    if (nativeChange || disposed) return
    const next = (event as ToggleEvent).newState
    if (next === 'closed') {
      const ticket = generation
      queueMicrotask(() => {
        if (disposed || ticket !== generation || !session || wrapper.matches(':popover-open'))
          return
        shown = false
        request('native')
        if (session && options.active) show()
      })
    } else if (next === 'open' && !options.active) event.preventDefault()
  }
  document.addEventListener('focusin', focusin)
  document.addEventListener('pointerdown', pointerdown, true)
  document.addEventListener('pointerup', pointerup, true)
  document.addEventListener('pointercancel', pointerup, true)
  wrapper.addEventListener('beforetoggle', beforetoggle)
  const controller: FloatingLayer = {
    get layer() {
      return session?.layer
    },
    isShown: () => shown,
    update(next) {
      if (disposed) return
      const previous = options
      options = next
      generation++
      if (
        session &&
        (previous.content !== next.content ||
          previous.modal !== next.modal ||
          previous.parent !== next.parent)
      )
        deactivate()
      if (!options.active) {
        deactivate()
        return
      }
      if (!session) activate()
      else {
        session.layer.update(layerOptions())
        show()
      }
      if (registeredTrigger !== options.trigger) {
        releaseTrigger?.()
        registeredTrigger = options.trigger
        releaseTrigger = options.trigger
          ? session!.layer.registerBranch(options.trigger)
          : undefined
      }
      session!.returnFocus = options.finalFocus ?? options.trigger ?? session!.opener
      if (options.positioned && !scope) {
        scope = registerFocusScope(options.content, {
          contain: options.modal ?? false,
          initialFocus: options.initialFocus,
          restoreFocus: false,
        })
      } else scope?.update({ contain: options.modal ?? false, restoreFocus: false })
      if (options.open && !previous.open) restore = true
    },
    dispose() {
      if (disposed) return
      disposed = true
      deactivate()
      clearTimeout(focusTimer)
      clearTimeout(releasePointerTimer)
      document.removeEventListener('focusin', focusin)
      document.removeEventListener('pointerdown', pointerdown, true)
      document.removeEventListener('pointerup', pointerup, true)
      document.removeEventListener('pointercancel', pointerup, true)
      wrapper.removeEventListener('beforetoggle', beforetoggle)
      if (originalPopover === null) wrapper.removeAttribute('popover')
      else wrapper.setAttribute('popover', originalPopover)
      if (!native) {
        if (originalDisplay)
          wrapper.style.setProperty('display', originalDisplay, originalDisplayPriority)
        else wrapper.style.removeProperty('display')
      }
    },
  }
  controller.update(initial)
  return controller
}
