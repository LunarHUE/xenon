import type { AnyPart, PresenceStatus } from '@tenon/core'
import type { CollapsibleIds } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

export interface AccordionEntry {
  value: string
  el: HTMLElement | null
  disabled: () => boolean
  status: () => PresenceStatus
  ids: () => CollapsibleIds
  setTriggerId: (id: string | undefined) => void
  setPanelId: (id: string | undefined) => void
}

export interface AccordionContextValue {
  register(entry: AccordionEntry): () => void
  item(entry: AccordionEntry): AnyPart
  trigger(entry: AccordionEntry): AnyPart
  panel(entry: AccordionEntry): AnyPart
  isOpen(value: string): boolean
  disabled(): boolean
  forceMount(): boolean
}

export interface AccordionItemContextValue {
  entry: AccordionEntry
  present(): boolean
  status(): PresenceStatus
  trigger(): AnyPart
  panel(): AnyPart
  panelRef(el: HTMLElement): void
}

export const AccordionContext = createContext<AccordionContextValue | null>(null)

export const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

export function useAccordion(name: string): AccordionContextValue {
  const context = useContext(AccordionContext)
  if (!context) throw new Error(`${name} must be rendered inside an <Accordion>`)
  return context
}

export function useAccordionItem(name: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) throw new Error(`${name} must be rendered inside an <Accordion.Item>`)
  return context
}
