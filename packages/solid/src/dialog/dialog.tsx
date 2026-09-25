import { dialog } from '@xenon-ui/core/dialog'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createDialogRoot, createDialogHandle, dialogParts } from '../internal/dialog'
import type { DialogProps } from '../internal/dialog'
/** Instantiates the shared dialog adapter with ordinary dialog semantics. */
function DialogRoot<T extends ValidComponent = 'div', Payload = unknown>(
  props: DialogProps<T, Payload>
): JSX.Element {
  return createDialogRoot(props, { kind: 'dialog', compute: dialog })
}
/**
 * Controlled or uncontrolled dialog root with Portal, native Viewport, Content, and Trigger,
 * Title, Description, and Close parts from {@link dialogParts}.
 *
 * @remarks
 * Root defaults to a div. Viewport renders the native dialog for presentation,
 * focus, dismissal, and scrolling, while Content renders the inner surface.
 * Standalone Content retains its legacy native dialog behavior. Descendant parts
 * require this family's context. Use open for controlled state or defaultOpen for
 * initial uncontrolled state, and supply an accessible content name.
 */
export const Dialog = Object.assign(DialogRoot, {
  /** Alias of Dialog itself, providing the same root state and context. */
  Root: DialogRoot,
  ...dialogParts,
  /** Create a typed handle for detached triggers and imperative opening. */
  createHandle: createDialogHandle,
})
export type {
  DialogHandle,
  DialogRenderState,
  DialogProps,
  DialogContentProps,
  DialogViewportProps,
  DialogPortalProps,
  DialogTriggerProps,
  DialogCloseProps,
  DialogTitleProps,
  DialogDescriptionProps,
} from '../internal/dialog'
