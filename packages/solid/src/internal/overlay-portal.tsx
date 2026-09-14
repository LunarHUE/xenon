import { Portal, isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { For, createContext, useContext } from 'solid-js'

/** Nearest native modal host. Descendant portals wait for this host to attach. */
export const OverlayPortalMountContext = createContext<(() => Element | undefined) | null>(null)

/** DOM destination for an overlay's positioned or modal contents. */
export interface OverlayPortalProps {
  /**
   * Explicit mount element. By default, mounts within the nearest overlay modal
   * host, or the document body outside one. Keep nonmodal descendants inside
   * their native modal host so the browser does not mark them inert.
   */
  container?: Element
  /** Overlay contents. Their Solid context and ownership remain with the caller. */
  children?: JSX.Element
}

/**
 * Moves overlay contents while preserving logical ownership and native modal
 * ancestry. It adds no wrapper. Changing the mount element recreates the portal
 * subtree. Like Solid's Portal, server output is empty and hydration renders the
 * contents fresh on the client. Portal only the popup, not its form-owning Root.
 */
export function OverlayPortal(props: OverlayPortalProps): JSX.Element {
  const inherited = useContext(OverlayPortalMountContext)
  const mounts = () => {
    if (isServer) return []
    const target = props.container ?? (inherited ? inherited() : document.body)
    return target ? [target] : []
  }
  return <For each={mounts()}>{(mount) => <Portal mount={mount}>{props.children}</Portal>}</For>
}
