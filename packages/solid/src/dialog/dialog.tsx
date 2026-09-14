import { dialog } from '@tenon/core/dialog'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createDialogRoot, dialogParts } from '../internal/dialog'
import type { DialogProps } from '../internal/dialog'
function DialogRoot<T extends ValidComponent = 'div'>(props: DialogProps<T>): JSX.Element {
  return createDialogRoot(props, { kind: 'dialog', compute: dialog })
}
export const Dialog = Object.assign(DialogRoot, { Root: DialogRoot, ...dialogParts })
export type {
  DialogProps,
  DialogContentProps,
  DialogTriggerProps,
  DialogCloseProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from '../internal/dialog'
