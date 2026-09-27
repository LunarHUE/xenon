import { swapFunctions, type TransitionBeforeSwapEvent } from 'astro:transitions/client'

const SHELL = '[data-docs-shell]'

/**
 * Client-side navigations swap the docs shell instead of the whole <body>.
 * Solid portals (dialogs, the drawer, tooltips, toasts) mount straight into
 * <body>, so replacing it would detach them from islands that live on. The
 * shell's own persisted parts move across as usual; the toaster and search
 * palette sit outside it and are simply left in place. Page scripts that land
 * directly in <body>, such as DocsPage's, are carried over so the router runs them.
 */
export function swapShell(event: TransitionBeforeSwapEvent): void {
  const next = event.newDocument
  const incoming = next.querySelector(SHELL)
  const current = document.querySelector(SHELL)
  if (!incoming || !current) return
  event.swap = () => {
    swapFunctions.deselectScripts(next)
    swapFunctions.swapRootAttributes(next)
    swapFunctions.swapHeadElements(next)
    const restoreFocus = swapFunctions.saveFocus()
    swapFunctions.swapBodyElement(incoming, current)
    for (const script of document.body.querySelectorAll(':scope > script')) script.remove()
    document.body.append(...next.body.querySelectorAll(':scope > script'))
    restoreFocus()
  }
}
