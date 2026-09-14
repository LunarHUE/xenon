import { isFocusable } from 'tabbable'

import { registerFocusScope, type FocusScopeHandle } from '../focus-scope'
import { registerLayer, type LayerHandle, type LayerPointerOutsideEvent } from '../layer'
import { registerModal, type ModalRegistration } from '../modal'

export interface DialogControllerOptions {
  open: boolean
  /** Keep the native dialog, focus scope and modal locks alive during exit. */
  active: boolean
  modal?: boolean
  closeOnEscape?: boolean
  closeOnOutside?: boolean
  initialFocus?: HTMLElement | false
  finalFocus?: HTMLElement
  onOpenChange(open: boolean): void
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerOutside?: (event: LayerPointerOutsideEvent) => void
}

export interface DialogController {
  update(options: DialogControllerOptions): void
  dispose(): void
}

interface Session {
  element: HTMLDialogElement
  opener: Element | null
  parent?: Session
  disposed: boolean
}
const sessions = new WeakMap<Document, Session[]>()

function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active
}
function contains(root: Element, target: Element | null): boolean {
  let node: Node | null = target
  while (node) {
    if (node === root) return true
    node = (node as Element).assignedSlot || node.parentNode || (node as ShadowRoot).host || null
  }
  return false
}

/** Bridge controlled state to the native dialog lifecycle. */
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
  let internalCloseEvents = 0
  let sessionModal = true
  const stack = () => sessions.get(document) ?? []
  const top = () => !!session && stack().at(-1) === session
  const show = () => {
    if (element.open) return
    // Non-browser DOM adapters can still exercise state and engine integration.
    const method = sessionModal ? element.showModal : element.show
    if (typeof method === 'function') method.call(element)
    else element.setAttribute('open', '')
  }
  const close = () => {
    if (!element.open) return
    if (typeof element.close === 'function') {
      internalCloseEvents++
      element.close()
    } else element.removeAttribute('open')
  }
  const requestClose = () => {
    if (!disposed && options.open && session) options.onOpenChange(false)
  }
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
  const activate = () => {
    const entries = stack()
    session = { element, opener: activeElement(document), parent: entries.at(-1), disposed: false }
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
  const deactivate = () => {
    if (!session) {
      close()
      return
    }
    const ending = session
    const active = activeElement(document)
    const restore = top() && (contains(element, active) || active === document.body || !active)
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
  const cancel = (event: Event) => {
    const prevented = event.defaultPrevented
    event.preventDefault()
    if (!prevented && top() && options.closeOnEscape !== false) requestClose()
  }
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
      element.removeEventListener('cancel', cancel)
      element.removeEventListener('close', nativeClose)
    },
  }
  controller.update(initialOptions)
  return controller
}
