import { Portal, isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { subscribeModalContent } from '@xenon/dom/modal'
import { OverlayPortalMountContext } from '../internal/overlay-portal'

/** Destination policy for the notification renderer. */
export interface ToastPortalProps {
  /** Explicit mount destination. It takes precedence over modal routing; ensure it is inside an active modal when needed. */
  container?: Element
  /** Renderer children, mounted once after client settlement and retained during modal changes. */
  children?: JSX.Element
}
/**
 * Mounts notifications in a stable DOM host and moves that host into the current
 * modal content when needed. Existing Content instances, refs, gestures and timers
 * survive these moves. Without a modal, the nearest inherited overlay destination
 * or document body owns the host. An explicit container opts out of modal routing.
 *
 * Server output is empty. The first destination selects the owner document for
 * the lifetime of this portal. Destination changes within that document move the
 * existing host; changing documents requires remounting the Portal. Native popover
 * descendants are hidden before moving and shown again afterward, keeping their
 * top-layer hosting synchronized without recreating Solid children.
 */
export function ToastPortal(props: ToastPortalProps): JSX.Element {
  const inherited = useContext(OverlayPortalMountContext)
  const [host, setHost] = createSignal<HTMLDivElement>()
  const [modal, setModal] = createSignal<HTMLElement>()
  let unsubscribe: (() => void) | undefined
  let disposed = false
  const move = (element: HTMLElement, destination: Element) => {
    if (element.parentElement === destination || element.contains(destination)) return
    const shown = Array.from(element.querySelectorAll<HTMLElement>('[popover]')).filter(
      (node) =>
        typeof node.showPopover === 'function' &&
        (node.matches(':popover-open') ||
          (node.hasAttribute('data-toast-viewport') && node.dataset.state === 'open'))
    )
    shown.forEach((node) => {
      if (node.matches(':popover-open')) node.hidePopover()
    })
    destination.append(element)
    shown.forEach((node) => {
      if (node.isConnected) node.showPopover()
    })
  }
  onSettled(() =>
    untrack(() => {
      if (disposed) return
      const initial = props.container ?? inherited?.() ?? document.body
      const documentOwner = initial.ownerDocument
      const element = documentOwner.createElement('div')
      element.setAttribute('data-toast-portal', '')
      element.style.display = 'contents'
      // The immediate subscription callback supplies the active modal before mounting.
      let currentModal: HTMLElement | undefined
      unsubscribe = subscribeModalContent(documentOwner, (value) => {
        currentModal = value
        setModal(value)
      })
      move(element, props.container ?? currentModal ?? inherited?.() ?? documentOwner.body)
      setHost(element)
    })
  )
  createEffect(
    () => ({ host: host(), container: props.container, modal: modal(), inherited: inherited?.() }),
    (state) => {
      if (!state.host) return
      const target =
        state.container ?? state.modal ?? state.inherited ?? state.host.ownerDocument.body
      if (target.ownerDocument === state.host.ownerDocument) move(state.host, target)
    }
  )
  onCleanup(() => {
    disposed = true
    unsubscribe?.()
    if (!isServer) untrack(host)?.remove()
  })
  const children = createMemo(() => props.children)
  return <Show when={host()}>{(mount) => <Portal mount={mount()}>{children()}</Portal>}</Show>
}
