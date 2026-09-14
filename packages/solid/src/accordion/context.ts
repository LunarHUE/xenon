import type { AnyPart, PresenceStatus } from '@tenon/core'
import type { CollapsibleIds } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

/** Stable item identity and live state shared by root and parts. */
export interface AccordionEntry {
  /** Selection identity captured once by Accordion.Item. Use unique values. */
  value: string
  /** Trigger host used for ordering and navigation focus; null before its ref. */
  el: HTMLElement | null
  /** Current item-local disabled flag. */
  disabled: () => boolean
  /** Current item presence phase. */
  status: () => PresenceStatus
  /** Current trigger and panel association IDs. */
  ids: () => CollapsibleIds
  /** Sets the trigger ID; undefined restores the generated fallback. */
  setTriggerId: (id: string | undefined) => void
  /** Sets the panel ID; undefined restores the generated fallback. */
  setPanelId: (id: string | undefined) => void
}

/** Root registration and part-generation contracts. */
export interface AccordionContextValue {
  /** Adds an entry in trigger DOM order and returns idempotent removal; caller owns cleanup. */
  register(entry: AccordionEntry): () => void
  /** Current item wrapper attributes, including provisional entries before registration. */
  item(entry: AccordionEntry): AnyPart
  /** Current native trigger bundle with disclosure and navigation handlers. */
  trigger(entry: AccordionEntry): AnyPart
  /** Current core panel bundle before item-specific presence overrides. */
  panel(entry: AccordionEntry): AnyPart
  /** Whether a value belongs to the current selection, independent of registration. */
  isOpen(value: string): boolean
  /** Current root disabled flag. */
  disabled(): boolean
  /** Current root mounting default; individual items can override it. */
  forceMount(): boolean
}

/** Item-local presence and associations provided to trigger and panel. */
export interface AccordionItemContextValue {
  /** Stable item registration shared with trigger and panel. */
  entry: AccordionEntry
  /** Whether the item panel should render, including exit and force mounting. */
  present(): boolean
  /** Current item presence phase used for sizing and animation hooks. */
  status(): PresenceStatus
  /** Current trigger bundle from the root engine. */
  trigger(): AnyPart
  /** Current panel bundle with item-local presence attributes taking precedence. */
  panel(): AnyPart
  /** Records the panel host used for exit-animation observation. */
  panelRef(el: HTMLElement): void
}

/** Nearest accordion root, or null outside a provider. */
export const AccordionContext = createContext<AccordionContextValue | null>(null)

/** Nearest accordion item, or null outside a provider. */
export const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

/**
 * Reads the enclosing Accordion context in the current Solid owner.
 * @param name - Part name included in the missing-provider error.
 * @throws If no Accordion context is available.
 */
export function useAccordion(name: string): AccordionContextValue {
  const context = useContext(AccordionContext)
  if (!context) throw new Error(`${name} must be rendered inside an <Accordion>`)
  return context
}

/**
 * Reads the enclosing Accordion.Item context in the current Solid owner.
 * @param name - Part name included in the missing-provider error.
 * @throws If no Accordion.Item context is available.
 */
export function useAccordionItem(name: string): AccordionItemContextValue {
  const context = useContext(AccordionItemContext)
  if (!context) throw new Error(`${name} must be rendered inside an <Accordion.Item>`)
  return context
}
