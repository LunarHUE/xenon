import { isFocusable } from 'tabbable'

import { registerFocusScope, type FocusScopeHandle } from '../focus-scope'
import { registerLayer, type LayerHandle, type LayerPointerOutsideEvent } from '../layer'
import { registerModal, type ModalRegistration } from '../modal'

/** Controlled visibility and native-session lifetime, with dismissal and focus policies. */
export interface DialogControllerOptions {
  /** Logical visibility. False suppresses dismissal requests even while active remains true for exit. */
  open: boolean
  /**
   * Keep the native presentation, focus scope, and applicable modal locks alive.
   * Set false when exit finishes; this closes the native dialog and may restore focus.
   * Independent of open: active=true can show a logically closed dialog.
   */
  active: boolean
  /**
   * Use showModal, focus containment, and modal locks unless false. Defaults
   * to true. Changing modality during an active session closes and recreates it.
   */
  modal?: boolean
  /**
   * Allow Escape-layer and native cancel requests, defaulting to true. Native
   * cancel is always prevented, including when closure requests are disabled.
   */
  closeOnEscape?: boolean
  /**
   * Allow the dismissal layer to request closure after an outside pointer
   * gesture. Defaults to true; disabled while open is false.
   */
  closeOnOutside?: boolean
  /**
   * Focus-scope placement for each new session; see {@link registerFocusScope}.
   * False skips scope placement, but does not suppress focus performed by native
   * show/showModal. Updates do not reapply it until a new session begins.
   */
  initialFocus?: HTMLElement | false
  /**
   * Preferred connected, focusable same-document target when a session ends.
   * Otherwise use its captured opener, following ancestor openers when needed.
   * Read at deactivation, so updates affect an existing session.
   */
  finalFocus?: HTMLElement
  /**
   * Requests false while logically open with an active session. Does not
   * assign controlled state. Escape/cancel requests run during dispatch; outside
   * pointer requests follow {@link registerLayer} timing. Native close requests
   * run when its close event arrives. The caller updates open and active.
   */
  onOpenChange(open: boolean): void
  /**
   * Layer Escape callback, with native cancellation veto from {@link registerLayer}.
   * Not called for native cancel events or while Escape requests are disabled.
   */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /**
   * Deferred outside-pointer callback; wrapper preventDefault vetoes dismissal.
   * Eligibility and callbacks are captured at pointerup. Pending callbacks can still
   * run after a policy update; the final close request checks the latest open state.
   * See {@link LayerPointerOutsideEvent}.
   */
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
}

/** Native session and listener lifetime for one dialog element. */
export interface DialogController {
  /**
   * Replaces all options and synchronously reconciles active/native state.
   * Active sessions update dismissal settings; modality changes recreate them.
   * Initial focus is session-only, while final focus uses the latest options.
   * Does nothing after disposal.
   */
  update(options: DialogControllerOptions): void
  /**
   * Idempotently ends the session, closes the element, and removes listeners.
   * Releases focus/layer/modal registrations before conditional restoration.
   * Disposal itself requests no controlled state change.
   */
  dispose(): void
}

/** Native presentation session, retained by descendants for nested opener restoration. */
interface Session {
  /** Dialog whose composed descendants determine focus ownership. */
  element: HTMLDialogElement
  /** Deep active element captured before native showing changes focus. */
  opener: Element | null
  /** Newest session at activation; retained even after that ancestor is disposed. */
  parent?: Session
  /** Marks logically closed ancestors whose contents must not receive restored focus. */
  disposed: boolean
  /** Most recent focus ownership while native open was true, preserved across native closing. */
  hadFocus: boolean
}
/** Active native sessions in registration order, isolated by owner document. */
const sessions = new WeakMap<Document, Session[]>()

/** Reads the focused descendant through accessible open shadow roots. */
function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}
/** Tests region membership through slot assignments and shadow hosts. */
function contains(root: Element, target: Element | null): boolean {
  let node: Node | null = target
  while (node) {
    if (node === root) return true
    node = (node as Element).assignedSlot || node.parentNode || (node as ShadowRoot).host || null
  }
  return false
}

/**
 * Bridges controlled state to native dialog presentation, dismissal, and focus.
 *
 * @param element - Dialog in a live owner document; keep it in that document for the controller lifetime.
 * @param initialOptions - Applied immediately, possibly showing the dialog and moving focus.
 * @remarks
 * An active session removes a preexisting open attribute before calling show or
 * showModal, so server-rendered markup enters the native presentation correctly.
 * Missing native methods fall back to the open attribute; native method errors
 * propagate. Native cancel is prevented and routed only by the top dialog session.
 * External native close requests controlled closure, then reopens presentation
 * if the latest active state still requires it. Internal queued close events are
 * consumed without dismissing a newly reopened session.
 *
 * Ending the top session restores eligible focus after releasing modal locks.
 * Deliberate focus elsewhere suppresses restoration; disposed ancestor contents
 * are skipped through their opener chain. Other live focus scopes can redirect
 * the restoration target. The caller schedules exit completion and supplies
 * active=false; this controller does not wait for animations.
 */
export function createDialogController(
  element: HTMLDialogElement,
  initialOptions: DialogControllerOptions
): DialogController {
  const document = element.ownerDocument
  let options = initialOptions
  let session: Session | undefined
  let layer: LayerHandle | undefined
  let scope: FocusScopeHandle | undefined
  let modal: ModalRegistration | undefined
  let disposed = false
  /** Counts queued native close events caused by this controller, including events arriving after reopen. */
  let internalCloseEvents = 0
  /** Modality captured for the current native session; changes require replacement. */
  let sessionModal = true
  const stack = () => sessions.get(document) ?? []
  const top = () => !!session && stack().at(-1) === session
  /** Shows using the captured modality only when native open is absent. */
  const show = () => {
    if (element.open) return
    // Non-browser DOM adapters can still exercise state and engine integration.
    const method = sessionModal ? element.showModal : element.show
    if (typeof method === 'function') method.call(element)
    else element.setAttribute('open', '')
  }
  /** Closes native presentation and records the expected internal close event when a native method exists. */
  const close = () => {
    if (!element.open) return
    if (typeof element.close === 'function') {
      internalCloseEvents++
      element.close()
    } else element.removeAttribute('open')
  }
  /** Uses the latest controlled options and requests closure only during a logically open session. */
  const requestClose = () => {
    if (!disposed && options.open && session) options.onOpenChange(false)
  }
  /** Derives dismissal policy; native backdrop hits outside the dialog rectangle override containment. */
  const layerOptions = () => ({
    escape:
      options.open && options.closeOnEscape !== false ? ('dismiss' as const) : ('ignore' as const),
    outsidePointer:
      options.open && options.closeOnOutside !== false ? ('dismiss' as const) : ('ignore' as const),
    onEscapeKeyDown: options.onEscapeKeyDown,
    onPointerOutside: options.onPointerOutside,
    onDismiss: requestClose,
    isPointerInside(event: PointerEvent) {
      if (event.composedPath()[0] !== element) return undefined
      const rect = element.getBoundingClientRect()
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        return false
      return undefined
    },
  })
  /** Captures opener/ancestry before showing, then acquires modal, dismissal, and focus registrations. */
  const activate = () => {
    const entries = stack()
    session = {
      element,
      opener: activeElement(document),
      parent: entries.at(-1),
      disposed: false,
      hadFocus: false,
    }
    sessionModal = options.modal !== false
    entries.push(session)
    sessions.set(document, entries)
    // SSR may serialize open, but that attribute alone does not enter the top layer.
    element.removeAttribute('open')
    show()
    if (sessionModal) modal = registerModal(element)
    layer = registerLayer(element, layerOptions())
    scope = registerFocusScope(element, {
      contain: sessionModal,
      initialFocus: options.initialFocus,
      restoreFocus: false,
    })
  }
  /** Releases session registrations and native presentation before resolving conditional opener restoration. */
  const deactivate = () => {
    if (!session) {
      close()
      return
    }
    const ending = session
    const active = activeElement(document)
    const restore =
      top() &&
      (contains(element, active) ||
        active === document.body ||
        !active ||
        (!element.open && ending.hadFocus && active === ending.opener))
    ending.disposed = true
    // Focus restoration belongs here, after inertness is released.
    scope?.dispose()
    scope = undefined
    layer?.dispose()
    layer = undefined
    modal?.dispose()
    modal = undefined
    const entries = stack()
    entries.splice(entries.indexOf(ending), 1)
    if (!entries.length) sessions.delete(document)
    session = undefined
    close()
    if (!restore) return
    const usable = (node: Element | null | undefined): node is HTMLElement =>
      !!node &&
      node.ownerDocument === document &&
      node.isConnected &&
      isFocusable(node, { getShadowRoot: true })
    let target: Element | null | undefined = usable(options.finalFocus)
      ? options.finalFocus
      : ending.opener
    let ancestor = ending.parent
    while (ancestor) {
      if (!usable(target) || (ancestor.disposed && contains(ancestor.element, target)))
        target = ancestor.opener
      ancestor = ancestor.parent
    }
    if (usable(target)) target.focus({ preventScroll: true })
  }
  /** Always cancels native dismissal; a previously canceled event or non-top session produces no request. */
  const cancel = (event: Event) => {
    const prevented = event.defaultPrevented
    event.preventDefault()
    if (!prevented && top() && options.closeOnEscape !== false) requestClose()
  }
  /** Consumes internal events; external closure is reported and active presentation is restored if still needed. */
  const nativeClose = () => {
    if (internalCloseEvents) {
      internalCloseEvents--
      return
    }
    // A queued close from an earlier native session must not dismiss a reopened one.
    if (!session || element.open) return
    requestClose()
    if (session && options.active) show()
  }
  /** Tracks deliberate focus changes only while native open remains true. */
  const trackFocus = () => {
    // close() can restore native focus before dispatching its queued close event.
    // Preserve prior ownership during that interval, but track deliberate moves while open.
    if (session && element.open) session.hadFocus = contains(element, activeElement(document))
  }
  document.addEventListener('focusin', trackFocus, true)
  element.addEventListener('cancel', cancel)
  element.addEventListener('close', nativeClose)
  const controller: DialogController = {
    update(next) {
      if (disposed) return
      options = next
      if (options.active) {
        if (session && sessionModal !== (options.modal !== false)) deactivate()
        if (!session) activate()
        else {
          layer?.update(layerOptions())
          show()
        }
      } else deactivate()
    },
    dispose() {
      if (disposed) return
      disposed = true
      deactivate()
      document.removeEventListener('focusin', trackFocus, true)
      element.removeEventListener('cancel', cancel)
      element.removeEventListener('close', nativeClose)
    },
  }
  controller.update(initialOptions)
  return controller
}
