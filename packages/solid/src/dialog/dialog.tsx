import { dialog } from '@tenon/core/dialog'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createDialogRoot, dialogParts } from '../internal/dialog'
import type { DialogProps } from '../internal/dialog'
/** Instantiates the shared dialog adapter with ordinary dialog semantics. */
function DialogRoot<T extends ValidComponent = 'div'>(props: DialogProps<T>): JSX.Element {
  return createDialogRoot(props, { kind: 'dialog', compute: dialog })
}
/**
 * Controlled or uncontrolled dialog root with native Content and shared Trigger,
 * Title, Description, and Close parts from {@link dialogParts}.
 *
 * @remarks
 * Root defaults to a div; Content renders a dialog and owns native presentation,
 * focus, dismissal, and presence through the shared adapter. Descendant parts
 * require this family's context. Use open for controlled state or defaultOpen for
 * initial uncontrolled state, and supply an accessible content name.
 */
export const Dialog = Object.assign(DialogRoot, {
  /** Alias of Dialog itself, providing the same root state and context. */
  Root: DialogRoot,
  ...dialogParts,
})
export type {
  DialogProps,
  DialogContentProps,
  DialogTriggerProps,
  DialogCloseProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from '../internal/dialog'
