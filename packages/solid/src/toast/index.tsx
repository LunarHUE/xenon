import { OverlayPortal } from '../internal/overlay-portal'
import { createManager } from './manager'
import { ToastProvider, useToastManager } from './provider'
import { ToastViewport } from './viewport'
import { ToastContent } from './content'
import { ToastTitle, ToastDescription, ToastAction, ToastClose } from './parts'

/** Notification manager and compound renderer. Content is the individual toast root. */
export const Toast = {
  /** Create an external manager without starting browser timers. */
  createManager,
  /** Read the nearest provider manager from a Solid owner. */
  useManager: useToastManager,
  /** Provide a manager and reactive lifetime/admission defaults without a wrapper. */
  Provider: ToastProvider,
  /** Preserve native modal ancestry while moving the renderer to its overlay destination. */
  Portal: OverlayPortal,
  /** Region, keyboard shortcut, announcements, stack geometry and pause ownership. */
  Viewport: ToastViewport,
  /** Individual record root, natural-size measurement, swipe and exit lifecycle. */
  Content: ToastContent,
  /** Associated title, defaulting to the record title. */
  Title: ToastTitle,
  /** Associated description, defaulting to the record description. */
  Description: ToastDescription,
  /** Optional record action with cancellable dismissal. */
  Action: ToastAction,
  /** Explicit dismissal button for the enclosing notification. */
  Close: ToastClose,
}
export { createManager } from './manager'
export { ToastProvider, useToastManager } from './provider'
export { ToastViewport } from './viewport'
export { ToastContent } from './content'
export { ToastTitle, ToastDescription, ToastAction, ToastClose } from './parts'
export type {
  ToastManager,
  ToastRecord,
  ToastAction as ToastActionOptions,
  ToastOptions,
  ToastPatch,
  ToastPromiseOptions,
  ToastDismissReason,
  ToastManagerOptions,
  ToastMessage,
  ToastType,
  ToastPriority,
} from './manager'
export type { ToastProviderProps } from './provider'
export type { ToastViewportProps } from './viewport'
export type { ToastContentProps } from './content'
export type {
  ToastTitleProps,
  ToastDescriptionProps,
  ToastActionProps,
  ToastCloseProps,
} from './parts'
export type { OverlayPortalProps as ToastPortalProps } from '../internal/overlay-portal'
