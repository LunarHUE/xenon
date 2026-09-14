import { alertDialog } from '@tenon/core/alert-dialog'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createDialogRoot, dialogParts, DialogClose, useDialog } from '../internal/dialog'
import type { ButtonProps } from '../button/button'
import type { AlertDialogProps, DialogProps } from '../internal/dialog'
export function AlertDialogCancel<T extends ValidComponent = 'button'>(
  props: ButtonProps<T>
): JSX.Element {
  const context = useDialog('AlertDialog.Cancel')
  return (
    <DialogClose
      {...props}
      ref={(el) => {
        context.setCancel(el)
        props.ref?.(el)
      }}
    />
  )
}
function AlertDialogRoot<T extends ValidComponent = 'div'>(
  props: AlertDialogProps<T>
): JSX.Element {
  return createDialogRoot(props as DialogProps<T>, { kind: 'alert', compute: alertDialog })
}
export const AlertDialog = Object.assign(AlertDialogRoot, {
  Root: AlertDialogRoot,
  ...dialogParts,
  Cancel: AlertDialogCancel,
  Action: DialogClose,
})
export type { AlertDialogProps } from '../internal/dialog'
