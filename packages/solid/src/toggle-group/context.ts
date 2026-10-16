import type { AnyPart } from '@xenon-ui/core'
import type { ToggleHost } from '@xenon-ui/core'
import { createContext, useContext } from 'solid-js'

/** Registered item identity, host semantics, and DOM target used by the enclosing group. */
export interface ToggleGroupEntry {
  /** Rendered host, assigned by the item ref before registration when available. */
  el: HTMLElement | null
  /** Current unique selection key; read when constructing navigation and item parts. */
  value: () => string
  /** Current local disabled flag, separate from group disabled state. */
  disabled: () => boolean
  /** Current core host semantics inferred from the item as prop. */
  host: () => ToggleHost
}

/** Registration and reactive part access provided to group items. */
export interface ToggleGroupContextValue {
  /** Adds an item in DOM order and returns idempotent removal. Call once per mounted item and clean up on disposal. */
  register: (entry: ToggleGroupEntry) => () => void
  /** Computes current toggle/navigation attributes and handlers for the entry value. */
  part: (entry: ToggleGroupEntry) => AnyPart
  /** Current group-level disabled state; items OR this with their local flag. */
  disabled: () => boolean
}

/** Nearest group context, or null when no group provides it. */
export const ToggleGroupContext = /* @__PURE__ */ createContext<ToggleGroupContextValue | null>(
  null
)

/**
 * Reads the enclosing group for an item within its Solid owner.
 * @param name - Component name included in the missing-provider error.
 * @throws If no ToggleGroup context is available.
 */
export function useToggleGroup(name: string): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext)
  if (!context) throw new Error(`${name} must be rendered inside a <ToggleGroup>`)
  return context
}
