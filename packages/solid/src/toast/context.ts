import { createContext, useContext } from 'solid-js'
import type { ToastResult } from '@xenon/core/toast'
import type { Association } from '../field/server-associations'
import type { ToastManager, ToastRecord, ToastDismissReason } from './manager'

/** Stable provider-owned manager shared by all descendant notification parts. */
export interface ToastProviderContext {
  /** Manager retaining records and their timing policy. */
  manager: ToastManager<unknown>
}
/** Internal manager context; public reads go through useToastManager. */
export const ToastProviderContext = createContext<ToastProviderContext | null>(null)
/** Measured notification dimensions and its current display position. */
export interface ToastLayout {
  /** Zero-based visual position among admitted records, including exits. */
  index: number
  /** Natural border-box height before collapsed stack styling. */
  height: number
  /** Sum of preceding natural heights and gaps. */
  offset: number
  /** Natural height of the first admitted record. */
  frontHeight: number
}
/** Internal viewport services consumed by each Content instance. */
export interface ToastViewportContext {
  /** Provider manager; no independent record state lives in the viewport. */
  manager: ToastManager<unknown>
  /** Current expanded presentation state. */
  expanded(): boolean
  /** Current measurement snapshot for a record. */
  layout(id: string): ToastLayout
  /** Register a mounted Content host and return its cleanup. */
  register(id: string, element: HTMLElement): () => void
  /** Update a natural height, ignoring unchanged measurements. */
  measure(id: string, height: number): void
  /** Notify the viewport that a focused record is closing before exit inertness. */
  closing(id: string): void
  /** Add or clear this record's active swipe pause. */
  swiping(id: string, active: boolean): void
  /** Queue plain-text speech when a visible record appears or updates. */
  announce(record: ToastRecord<unknown>, text: string): void
}
/** Internal geometry, focus and announcement owner. */
export const ToastViewportContext = createContext<ToastViewportContext | null>(null)
/** Internal record and association state consumed by title, description and controls. */
export interface ToastContentContext {
  /** Current reactive record supplied to Content. */
  record(): ToastRecord<unknown>
  /** Current semantic part bundles. */
  result(): ToastResult
  /** Request dismissal through the manager after preserving focused-toast information. */
  dismiss(reason?: ToastDismissReason): void
  /** Register a title or description's live ID; undefined excludes an empty default part. */
  register(part: 'title' | 'description', read: () => string | undefined): () => void
  /** Generate stable fallback part IDs. */
  id(part: 'title' | 'description'): string
  /** Defer ID references during server serialization, otherwise read immediately. */
  association(name: Association, read: () => string | undefined): string | undefined
}
/** Internal nearest notification content context. */
export const ToastContentContext = createContext<ToastContentContext | null>(null)
/** Read required viewport services or report the missing compound ancestor. */
export function useToastViewport(name: string): ToastViewportContext {
  const context = useContext(ToastViewportContext)
  if (!context) throw new Error(`Toast.${name} must be rendered inside Toast.Viewport`)
  return context
}
/** Read the nearest Content record or report the missing compound ancestor. */
export function useToastContent(name: string): ToastContentContext {
  const context = useContext(ToastContentContext)
  if (!context) throw new Error(`Toast.${name} must be rendered inside Toast.Content`)
  return context
}
