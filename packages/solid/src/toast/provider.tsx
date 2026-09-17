import type { JSX } from '@solidjs/web'
import { createEffect, createMemo, onCleanup, onSettled, untrack, useContext } from 'solid-js'
import { createManager } from './manager'
import type { ToastManager, ToastManagerOptions } from './manager'
import { ToastProviderContext } from './context'

/**
 * Notification lifetime and admission defaults inherited by one renderer. An
 * undefined field leaves the manager's current value alone, so an external manager
 * created with its own options keeps them unless a prop overrides them.
 */
export interface ToastProviderProps<T = unknown> extends Pick<
  ToastManagerOptions,
  'duration' | 'limit'
> {
  /** Optional externally created manager, captured once. Omission creates a provider-local manager. */
  manager?: ToastManager<T>
  /** Notification controls and renderers receiving this manager. */
  children?: JSX.Element
}
/**
 * Supplies a manager without adding a DOM wrapper. Timing starts after client
 * settlement and pauses when the last provider using that manager unmounts.
 * Manager identity is captured once; duration and limit remain reactive.
 */
export function ToastProvider<T = unknown>(props: ToastProviderProps<T>): JSX.Element {
  const manager = untrack(() => props.manager ?? createManager<T>())
  untrack(() => manager.configure({ duration: props.duration, limit: props.limit }))
  createEffect(
    () => ({ duration: props.duration, limit: props.limit }),
    (options) => untrack(() => manager.configure(options))
  )
  let detach: (() => void) | undefined
  onSettled(() => {
    detach = untrack(() => manager.attach())
  })
  onCleanup(() => detach?.())
  const children = createMemo(() => (
    <ToastProviderContext value={{ manager: manager as unknown as ToastManager<unknown> }}>
      {props.children}
    </ToastProviderContext>
  ))
  return <>{children()}</>
}
/** Read the nearest provider's stable reactive manager. Match T to the provider's record data type. */
export function useToastManager<T = unknown>(): ToastManager<T> {
  const context = useContext(ToastProviderContext)
  if (!context) throw new Error('Toast.useManager must be called inside Toast.Provider')
  return context.manager as unknown as ToastManager<T>
}
