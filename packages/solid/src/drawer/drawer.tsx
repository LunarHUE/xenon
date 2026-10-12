import { setRef } from '../internal/host'
import { drawer } from '@xenon-ui/core/drawer'
import type { JSX, ValidComponent } from '@solidjs/web'
import {
  createDialogRoot,
  createDialogHandle,
  dialogParts,
  DialogClose,
  useDialog,
} from '../internal/dialog'
import type { ButtonProps } from '../button/button'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { registerDrawerHandle } from '@xenon-ui/dom'
import type { DrawerProps } from '../internal/dialog'
/**
 * Accessible close button that also attaches outward-swipe dismissal to the drawer content.
 *
 * @remarks
 * Defaults to a button labeled "Close drawer"; author props can replace that label.
 * Click behavior follows DialogClose, including author cancellation and Button
 * disabled handling. Once both refs exist, {@link registerDrawerHandle} owns pointer
 * capture, touch-action, swipe hooks, offset writes, and post-drag click suppression.
 * The root's dragThreshold follows {@link DrawerProps}; its explicit %, px, or rem
 * distance is interpreted by the DOM controller. CSS owns the visual translation.
 *
 * Host/content replacement disposes the prior gesture controller. Reopening or an
 * exited phase resets swipe offset; owner cleanup removes gesture listeners and
 * restores owned styles. A dismissal proposal that leaves controlled open true
 * resets the offset in a microtask, unless the controller has since changed.
 * Custom hosts must forward props and ref; the public ref receives the handle.
 * @throws If rendered outside the shared Dialog/AlertDialog/Drawer context.
 */
export function DrawerHandle<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('Drawer.Handle')
  const [element, setElement] = createSignal<HTMLElement>()
  let controller: ReturnType<typeof registerDrawerHandle> | undefined
  let attached: HTMLElement | undefined
  let attachedContent: HTMLElement | undefined
  let wasOpen = false
  /** Synchronizes gesture registration with current refs, side, threshold, and presence state. */
  createEffect(
    () => ({
      el: element(),
      content: context.content(),
      side: context.own.side ?? 'bottom',
      dragThreshold: context.own.dragThreshold,
      open: context.result().state.open,
      status: context.result().state.status,
    }),
    ({ el, content, side, dragThreshold, open, status }) => {
      if (!el || !content) return
      const options = {
        side,
        dragThreshold,
        onDismiss: () => {
          context.change(false)
          // Controlled roots may refuse the request without producing an update.
          const current = controller
          queueMicrotask(() => {
            if (controller === current && context.result().state.open) current?.reset()
          })
        },
      }
      if (el !== attached || content !== attachedContent) {
        controller?.dispose()
        attached = el
        attachedContent = content
        controller = registerDrawerHandle(el, content, options)
      } else controller?.update(options)
      if ((open && !wasOpen) || status === 'exited') controller?.reset()
      wasOpen = open
    }
  )
  onCleanup(() => {
    controller?.dispose()
    controller = undefined
  })
  return (
    <DialogClose
      aria-label="Close drawer"
      {...props}
      ref={(el: HTMLElement) => {
        setElement(el)
        setRef(() => (props as { ref?: unknown }).ref, el)
      }}
    />
  )
}
/** Instantiates the shared dialog adapter with physical-side styling hooks. */
function DrawerRoot<T extends ValidComponent = 'div', Payload = unknown>(
  props: DrawerProps<T, Payload>
): JSX.Element {
  return createDialogRoot(props, { kind: 'drawer', compute: drawer })
}
/**
 * Dialog-based drawer root with shared dialog parts and a swipe-capable Handle.
 *
 * @remarks
 * Side defaults to bottom; layout and transitions are supplied by the caller.
 * Modality defaults to true but may be disabled, and shared dialog options govern
 * controlled open state, focus, dismissal, and presence. Parts require this family's
 * context. Viewport owns native presentation; Content supplies the rectangle and
 * transform for handle gestures. Standalone Content remains a native dialog.
 */
export const Drawer = Object.assign(DrawerRoot, {
  /** Alias of Drawer with the same root options and context. */
  Root: DrawerRoot,
  ...dialogParts,
  /** Create a typed handle for detached triggers and imperative opening. */
  createHandle: createDialogHandle,
  /** Close button with drag dismissal and a default accessible label. */
  Handle: DrawerHandle,
})
export type { DrawerProps } from '../internal/dialog'
export type { DrawerDragThreshold } from '@xenon-ui/dom'

export type { DialogViewportProps, DialogPortalProps, DialogContentProps } from '../internal/dialog'

export type { DrawerRenderState } from '../internal/dialog'
/** Typed imperative handle, distinct from the Drawer.Handle drag button. */
export type DrawerHandle<Payload = unknown> = import('../internal/dialog').DrawerHandle<Payload>
