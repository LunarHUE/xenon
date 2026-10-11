import { getLayerElements, subscribeLayers } from '../layer'
import { getTopModal, subscribeModalContent } from '../modal'

/** Focus and layer state that decides which keyboard shortcuts may fire. */
export interface ShortcutDocumentContext {
  /** Focused element, followed into open shadow roots, or null. */
  focus: Element | null
  /** Hosts of open Xenon layers (dialogs, popovers, menus, selects), oldest first. */
  layers: readonly Element[]
  /** Newest Xenon modal, else the last native modal dialog, else null. */
  modal: Element | null
}

/** Focused element, descending through open shadow roots. */
function activeElement(document: Document): Element | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement
  return active === document.body ? null : active
}

/** Native modal dialogs opened outside Xenon. Engines without `:modal` report none. */
function nativeModal(document: Document): Element | null {
  const open = document.querySelectorAll('dialog[open]')
  for (let index = open.length - 1; index >= 0; index--) {
    try {
      if (open[index]!.matches(':modal')) return open[index]!
    } catch {
      return null
    }
  }
  return null
}

/** Read the current shortcut context from a document. */
export function readShortcutContext(document: Document): ShortcutDocumentContext {
  return {
    focus: activeElement(document),
    layers: getLayerElements(document),
    modal: getTopModal(document) ?? nativeModal(document),
  }
}

/**
 * Call `onChange` whenever {@link readShortcutContext} may return something new:
 * focus moves, a Xenon layer or modal opens or closes, or a native dialog's open
 * attribute changes. Several calls can arrive for one change; batch them. Returns
 * a cleanup that removes every listener and observer.
 */
export function watchShortcutContext(document: Document, onChange: () => void): () => void {
  const notify = () => onChange()
  document.addEventListener('focusin', notify, true)
  document.addEventListener('focusout', notify, true)
  const layers = subscribeLayers(document, notify)
  let subscribed = false
  const modals = subscribeModalContent(document, () => {
    if (subscribed) notify()
  })
  subscribed = true
  const View = document.defaultView?.MutationObserver
  const observer = View ? new View(notify) : undefined
  observer?.observe(document, { subtree: true, attributes: true, attributeFilter: ['open'] })
  return () => {
    document.removeEventListener('focusin', notify, true)
    document.removeEventListener('focusout', notify, true)
    layers()
    modals()
    observer?.disconnect()
  }
}

/** Apple platforms show ⌘ and resolve Mod to Meta; everything else uses Control. */
export function detectShortcutPlatform(document: Document): 'apple' | 'other' {
  const navigator = document.defaultView?.navigator as
    (Navigator & { userAgentData?: { platform?: string } }) | undefined
  const platform = navigator?.userAgentData?.platform || navigator?.platform || ''
  return /mac|iphone|ipad|ipod/i.test(platform) ? 'apple' : 'other'
}
