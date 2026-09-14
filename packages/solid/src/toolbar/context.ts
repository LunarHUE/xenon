import type { AnyPart } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

export interface ToolbarEntry {
  el: HTMLElement | null
  disabled: () => boolean
}

export interface ToolbarContextValue {
  register: (entry: ToolbarEntry) => () => void
  part: (entry: ToolbarEntry) => AnyPart
  orientation: () => 'horizontal' | 'vertical'
  disabled: () => boolean
}

export const ToolbarContext = createContext<ToolbarContextValue | null>(null)

export function useToolbar(name: string): ToolbarContextValue {
  const context = useContext(ToolbarContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Toolbar>`)
  return context
}
