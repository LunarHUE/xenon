import { createManager, type ToastManager } from '@xenon-ui/solid/toast'

/**
 * The one notification manager for the docs. Import it anywhere, including
 * outside components, and call `toast.success('Saved')`. Records queue until a
 * `Toaster` is mounted, which attaches the timers.
 */
export const toast: ToastManager = createManager({ duration: 5000, limit: 5 })
