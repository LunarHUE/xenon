import type { AnyPart, PresenceStatus } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

/** Reactive disclosure parts and lifecycle services shared with descendant parts. */
export interface CollapsibleContextValue {
  /** Whether content should render: open, exiting, or force-mounted. */
  present(): boolean
  /** Current presence phase, initially settled for the starting open state. */
  status(): PresenceStatus
  /** Current native-button disclosure attributes and click handler. */
  trigger(): AnyPart
  /** Current content ID, state hooks, and presence attributes. */
  content(): AnyPart
  /** Records the content element for exit-animation observation; no detach callback is provided. */
  contentRef(el: HTMLElement): void
  /** Sets the shared trigger ID; undefined restores the root-generated fallback. */
  setTriggerId(id: string | undefined): void
  /** Sets the shared content ID and trigger aria-controls; undefined restores the generated fallback. */
  setContentId(id: string | undefined): void
}

/** Nullable context provided by the root; parts require a matching ancestor. */
export const CollapsibleContext = createContext<CollapsibleContextValue | null>(null)

/** Reads the nearest disclosure context or throws an error naming the consumer. */
export function useCollapsible(name: string): CollapsibleContextValue {
  const context = useContext(CollapsibleContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Collapsible>`)
  return context
}
