import { createManager, type ToastManager, type ToastOptions } from '@xenon/solid/toast'

/** Application data carried by docs notifications. */
export interface ToastData {
  /** Force a theme on the notification; otherwise it follows the page. */
  theme?: 'light' | 'dark'
}

export type DocsToastOptions = ToastOptions<ToastData>

/**
 * The one notification manager for the docs. Import it anywhere, including
 * outside components, and call `toast.success('Saved')`. Records queue until a
 * `Toaster` is mounted, which attaches the timers.
 */
export const toast: ToastManager<ToastData> =
  import.meta.hot?.data.toast ?? createManager<ToastData>({ duration: 5000, limit: 3 })

// Survive a dev-server reload of this module, so callers and the mounted
// Toaster keep sharing one manager.
if (import.meta.hot) import.meta.hot.data.toast = toast
