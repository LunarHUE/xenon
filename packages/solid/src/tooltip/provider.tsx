import { resolveTooltipBehavior } from '@tenon/core/tooltip'
import type { TooltipBehavior, TooltipBehaviorOptions } from '@tenon/core/tooltip'
import type { JSX } from '@solidjs/web'
import { createContext, untrack, useContext } from 'solid-js'

/** Shared timing coordinator. It does not hold reactive state or rerender inactive siblings. */
export interface TooltipGroup {
  /** Whether a tooltip currently owns the group's warm window. */
  active(): boolean
  /** Most recent actual close time, in milliseconds. */
  closedAt(): number | undefined
  /** Claim the group and request closure of its previous member. Controlled members may refuse. */
  claim(id: object, close: () => void): void
  /** Release only the current owner's claim and start the closed warm window. */
  release(id: object): void
}
/** Creates an isolated coordinator; callers decide provider lifetime and supply no module-global state. */
export function createTooltipGroup(): TooltipGroup {
  let current: { id: object; close: () => void } | undefined
  let closedAt: number | undefined
  return {
    active: () => current !== undefined,
    closedAt: () => closedAt,
    claim(id, close) {
      if (current?.id === id) return
      const previous = current
      current = { id, close }
      previous?.close()
    },
    release(id) {
      if (current?.id !== id) return
      current = undefined
      closedAt = Date.now()
    },
  }
}
/** Shared defaults and timing identity inherited by descendant roots. */
export interface TooltipProviderContextValue {
  /** Resolved nearest defaults. */
  behavior(): TooltipBehavior
  /** Shared warm-window coordinator. */
  group: TooltipGroup
}
const ProviderContext = createContext<TooltipProviderContextValue | null>(null)
/** Reads an optional tooltip provider without requiring one. */
export function useTooltipProvider(): TooltipProviderContextValue | null {
  return useContext(ProviderContext)
}
/** Inherited behavioral settings. This provider adds no DOM or visual styles. */
export interface TooltipProviderProps extends TooltipBehaviorOptions {
  /** Start a separate delay group; captured at mount. Nested providers otherwise keep their parent's group. */
  isolated?: boolean
  /** Descendants receiving defaults and coordination. */
  children?: JSX.Element
}
/** Supplies per-property defaults. Nested providers inherit unspecified values; local Tooltip props win. */
export function TooltipProvider(props: TooltipProviderProps): JSX.Element {
  const parent = useTooltipProvider()
  const group = untrack(() => props.isolated)
    ? createTooltipGroup()
    : (parent?.group ?? createTooltipGroup())
  const context: TooltipProviderContextValue = {
    behavior: () => resolveTooltipBehavior(props, parent?.behavior()),
    group,
  }
  return <ProviderContext value={context}>{props.children}</ProviderContext>
}
