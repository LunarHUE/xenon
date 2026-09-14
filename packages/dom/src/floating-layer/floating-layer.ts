import { isFocusable } from 'tabbable'
import { registerLayer } from '../layer'
import type { LayerHandle, LayerPointerOutsideEvent } from '../layer'
import { registerFocusScope } from '../focus-scope'
import type { FocusScopeHandle } from '../focus-scope'
import { registerModal } from '../modal'
import type { ModalRegistration } from '../modal'

/** Dismissal source: Escape, an outside pointer gesture, outside focus, or external native hiding. */
export type FloatingDismissReason = 'escape' | 'pointer-outside' | 'focus-outside' | 'native'
/** Cancelable outside-focus request, independent of the original DOM event's default state. */
export interface FloatingFocusOutsideEvent {
  /** Focusin event whose target still owns focus when the deferred request runs. */
  readonly originalEvent: FocusEvent
  /** Whether this wrapper's preventDefault method has been called. */
  readonly defaultPrevented: boolean
  /** Veto dismissal synchronously in the callback without canceling the native focus event. */
  preventDefault(): void
}
/** Current hosting, dismissal, focus, and modal policy; updates replace this complete object. */
export interface FloatingLayerOptions {
  /** Focus-scope root inside the wrapper; use an element in the wrapper's owner document. */
  content: HTMLElement
  /**
   * Logical open state, enabling dismissal requests. False does not hide an active
   * wrapper: the retained layer ignores outside pointers and consumes Escape during exit.
   */
  open: boolean
  /**
   * Whether the wrapper remains physically shown and registered, normally through
   * its exit animation. False releases the session and may restore focus.
   */
  active: boolean
  /**
   * Whether positioning has completed. The first active true value creates the
   * focus scope and performs initial placement. Later false values do not remove
   * that scope, but do suppress new outside-focus scheduling. Does not position anything.
   */
  positioned: boolean
  /** Same-document trigger, registered as a dismissal branch and used as a restoration fallback. */
  trigger?: HTMLElement
  /**
   * Active same-document dismissal parent. Otherwise infer a parent from the newest
   * floating session whose wrapper contains this wrapper. Changing this option restarts the session.
   */
  parent?: LayerHandle
  /**
   * Isolate the wrapper and lock scrolling while active; contain focus once positioned.
   * Outside-focus dismissal is disabled. Defaults to false; changing the supplied value restarts the session.
   */
  modal?: boolean
  /**
   * Initial target within content, or false to skip initial placement, following
   * {@link registerFocusScope}. Read only when a new focus scope is registered.
   */
  initialFocus?: HTMLElement | false
  /** Preferred same-document focus return target; unusable targets fall back to trigger, opener, then ancestors. */
  finalFocus?: HTMLElement
  /** Dismiss on Escape while open. Defaults to true; false still consumes Escape through the layer. */
  closeOnEscape?: boolean
  /** Allow eligible outside-pointer dismissal while open. Defaults to true. */
  closeOnOutside?: boolean
  /** Allow deferred outside-focus dismissal for positioned, nonmodal, open top layers. Defaults to true. */
  closeOnFocusOutside?: boolean
  /**
   * Permit restoration on session release when this is topmost and focus is inside
   * the wrapper, on the body, or missing. Defaults to true; outside-focus dismissal
   * also suppresses restoration. Deliberate focus elsewhere is preserved.
   */
  restoreFocus?: boolean
  /** Synchronous Escape hook forwarded to the layer; preventDefault vetoes its dismissal request. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Deferred pointer-outside hook; wrapper preventDefault vetoes dismissal. Queued callbacks retain the pointerup policy snapshot through updates. */
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
  /**
   * Runs in a zero-delay timer if outside focus is still current, the layer is still
   * topmost/open, and no update or pointer gesture invalidated the request. Prevent
   * the wrapper default to veto dismissal; no hook runs for modal layers.
   */
  onFocusOutside?: (event: FloatingFocusOutsideEvent) => void
  /**
   * Request a logical close without changing options or releasing the session.
   * Escape is synchronous; pointer/focus requests are deferred; native hiding is
   * checked in a microtask. Update open/active to accept. Native hiding is reversed
   * if the session remains active after this callback. Initialization is silent.
   */
  onDismiss: (reason: FloatingDismissReason) => void
}
/** Controller bound to one fixed wrapper and owner document. */
export interface FloatingLayer {
  /** Current dismissal handle, absent while inactive or disposed; restarts replace its identity. */
  readonly layer: LayerHandle | undefined
  /**
   * Replace options synchronously; omitted optional settings revert to defaults.
   * Changed content, modal value, or explicit parent releases and recreates an
   * active session, including focus/modal registrations. Other changes retain
   * the session; initialFocus is not reapplied to an existing focus scope.
   * No-op after disposal. Updates invalidate pending focus/native-close checks.
   */
  update(options: FloatingLayerOptions): void
  /** Controller-recorded hosting state; does not inspect layout, visibility CSS, or placement. */
  isShown(): boolean
  /**
   * Idempotently release the session, timers, and listeners, with conditional focus
   * restoration. Restore the original popover attribute and, in nonnative mode,
   * the original inline display value/priority. Descendant controllers remain owned
   * by their callers; no DOM nodes are removed.
   */
  dispose(): void
}
/** Active-session history retained through parent links after logical disposal. */
interface Session {
  /** Hosting element used for inferred ancestry and composed focus ownership. */
  wrapper: HTMLElement
  /** Deep active element captured before showing this session. */
  opener: Element | null
  /** Latest finalFocus/trigger/opener candidate, retained for descendant restoration. */
  returnFocus: Element | null | undefined
  /** Matching floating session parent, distinct from an arbitrary explicit dismissal parent. */
  parent?: Session
  /** Dismissal registration whose ordering determines whether this session is topmost. */
  layer: LayerHandle
  /** Marks an ended ancestor so descendants avoid returning focus inside its wrapper. */
  disposed: boolean
}
/** Active floating sessions in creation order per document; empty stacks are removed. */
const sessions = new WeakMap<Document, Session[]>()
/** Follow active focus through accessible open shadow roots. */
function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}
/** Test composed ancestry through slots, light-DOM parents, and shadow hosts. */
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

/**
 * Combine manual native popover hosting with dismissal, focus, and optional modality.
 *
 * @remarks
 * Immediately sets popover=manual, installs listeners, and applies initial options.
 * Active sessions show before positioning completes; the caller owns measurement,
 * visibility during placement, content roles, and exit timing. Native support is
 * detected once from showPopover. Without it, showing/hiding uses inline display
 * block/none. Native API failures are not caught.
 *
 * Focus and restoration use the wrapper's document. Content must lie inside the
 * wrapper in that document; keep the wrapper there for the registration's lifetime.
 * Modal isolation covers the wrapper, while the focus scope covers content. Trigger
 * registration extends dismissal containment, not focus-scope or modal branches.
 * This controller owns focus restoration rather than delegating it to the scope.
 *
 * @param wrapper - Connected hosting element, normally the positioned wrapper around content.
 * @param initial - Full initial policy; open, active, and positioned have distinct responsibilities.
 * @returns A controller whose construction has already applied initial options.
 * @throws If native hosting or delegated layer/focus/modal registration fails.
 */
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
  /** Gate requests on logical openness and remember whether closure should restore focus. */
  const request = (reason: FloatingDismissReason) => {
    if (disposed || !session || !options.open) return
    restore = reason !== 'focus-outside'
    options.onDismiss(reason)
  }
  /** Preserve stack ownership during exit while disabling new dismissal gestures; queued pointer callbacks retain their snapshot. */
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
  /** Show once and suppress feedback from native events caused by this controller. */
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
  /** Hide a controller-shown wrapper; native hiding may itself restore browser focus. */
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
  /**
   * Release ownership before hiding, preserving deliberate outside focus. If this
   * topmost wrapper owned focus, walk retained ancestor return targets to avoid
   * restoring into hidden/disposed parents. The scope's own restoration is disabled.
   */
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
  /** Capture opener and logical ancestry, register/show the wrapper, then apply modal isolation. */
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
  /** Defer outside-focus dismissal until focus settles, ignoring pointer-driven focus changes. */
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
  /** Suppress focus-outside requests for the duration of any document pointer gesture. */
  const pointerdown = () => {
    pointerDown = true
    clearTimeout(releasePointerTimer)
    clearTimeout(focusTimer)
  }
  /** Keep suppression through pointerup/cancel dispatch, then clear it in a zero-delay timer. */
  const pointerup = () => {
    clearTimeout(releasePointerTimer)
    releasePointerTimer = setTimeout(() => {
      pointerDown = false
    }, 0)
  }
  /** Reconcile external native hiding after dispatch without letting stale work close a newer session. */
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
