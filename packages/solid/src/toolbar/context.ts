import type { AnyPart } from '@xenon-ui/core'
import { createContext, useContext } from 'solid-js'

/** Stable identity registered for one navigable toolbar item. */
export interface ToolbarEntry {
  /** Forwarded host used for DOM ordering and focus; null before the ref arrives. */
  el: HTMLElement | null
  /** Whether navigation skips this item, independent of an aria-disabled item that remains focusable. */
  disabled: () => boolean
}

/** Shared navigation registry and inherited policy for toolbar descendants. */
export interface ToolbarContextValue {
  /** Adds an entry and sorts current entries by DOM order. Returned cleanup removes this identity and is repeatable. */
  register: (entry: ToolbarEntry) => () => void
  /** Current tab index and composite key/focus handlers; server and empty-registry output makes every enabled entry tabbable. */
  part: (entry: ToolbarEntry) => AnyPart
  /** Resolved navigation axis, also used to infer separator orientation. */
  orientation: () => 'horizontal' | 'vertical'
  /** Inherited disabled state for buttons; links do not consume this flag. */
  disabled: () => boolean
}

/** Nearest toolbar or nested group policy; null outside a toolbar. */
export const ToolbarContext = createContext<ToolbarContextValue | null>(null)

/**
 * Requires a toolbar provider in the current Solid owner.
 * @param name - Part name included in the missing-provider error.
 * @throws If no Toolbar context is available.
 */
export function useToolbar(name: string): ToolbarContextValue {
  const context = useContext(ToolbarContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Toolbar>`)
  return context
}
