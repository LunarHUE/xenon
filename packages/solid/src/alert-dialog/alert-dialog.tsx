import { setRef } from '../internal/host'
import { alertDialog } from '@xenon-ui/core/alert-dialog'
import type { JSX, ValidComponent } from '@solidjs/web'
import {
  createDialogRoot,
  createDialogHandle,
  dialogParts,
  DialogClose,
  useDialog,
} from '../internal/dialog'
import type { ButtonProps } from '../button/button'
import type { AlertDialogProps, DialogProps } from '../internal/dialog'
/**
 * Close button that also registers itself as the alert's default initial-focus target.
 *
 * @remarks
 * Explicit root initialFocus, including false, takes precedence. Otherwise the most
 * recently forwarded Cancel ref is offered when a native content session begins;
 * the focus controller rejects disconnected or unusable targets. Registration has
 * no separate cleanup, and changing the target does not refocus an existing session.
 * Author click handlers run before closing and may preventDefault to veto it.
 * Ref receives the visible button; custom hosts must forward the supplied ref.
 * @throws If rendered outside the shared Dialog/AlertDialog/Drawer context.
 */
export function AlertDialogCancel<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('AlertDialog.Cancel')
  return (
    <DialogClose
      {...props}
      ref={(el: HTMLElement) => {
        context.setCancel(el)
        setRef((props as { ref?: unknown }).ref, el)
      }}
    />
  )
}
/** Uses alertdialog semantics with forced modality and no outside-pointer dismissal. */
function AlertDialogRoot<T extends ValidComponent = 'div', Payload = unknown>(
  props: AlertDialogProps<T, Payload>
): JSX.Element {
  return createDialogRoot(props as DialogProps<T, Payload>, { kind: 'alert', compute: alertDialog })
}
/**
 * Alert dialog root with shared dialog parts, a default-focus Cancel, and an Action close button.
 *
 * @remarks
 * Content is modal and ignores outside-pointer dismissal. Escape still dismisses
 * unless closeOnEscape is false. Provide an accessible name and description;
 * missing associations produce development warnings. Open state and presence
 * follow the shared dialog adapter, and all parts require its context.
 */
export const AlertDialog = Object.assign(AlertDialogRoot, {
  /** Alias of AlertDialog with the same root options and context. */
  Root: AlertDialogRoot,
  ...dialogParts,
  /** Create a typed handle for detached triggers and imperative opening. */
  createHandle: createDialogHandle,
  /** Close button offered as initial focus when the root supplies no explicit target. */
  Cancel: AlertDialogCancel,
  /** Alias of DialogClose. Author click runs before closure and can cancel it; asynchronous actions are not awaited. */
  Action: DialogClose,
})
export type { AlertDialogProps } from '../internal/dialog'

export type { DialogViewportProps, DialogPortalProps, DialogContentProps } from '../internal/dialog'

export type { AlertDialogHandle, AlertDialogRenderState } from '../internal/dialog'
