import type { AnyPart, PresenceStatus } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

export interface CollapsibleContextValue {
  present(): boolean
  status(): PresenceStatus
  trigger(): AnyPart
  content(): AnyPart
  contentRef(el: HTMLElement): void
  setTriggerId(id: string | undefined): void
  setContentId(id: string | undefined): void
}

export const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

export function useCollapsible(name: string): CollapsibleContextValue {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Collapsible>`)
  return context
}
