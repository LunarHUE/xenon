import type { AnyPart } from '@tenon/core'
import type { TabsOrientation } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

/** Stable registration identity for one tab and its current selection key. */
export interface TabEntry {
  /** Forwarded host used for DOM ordering and deferred focus; null before the ref runs. */
  el: HTMLElement | null
  /** Current unique string key linking this tab to its panel. */
  value: () => string
  /** Current disabled state, including root policy, used to skip navigation and activation. */
  disabled: () => boolean
}

/** Shared registries, ID overrides, and reactive core parts for Tabs descendants. */
export interface TabsContextValue {
  /** Adds an entry and sorts known hosts by DOM order; returned cleanup removes that identity and is repeatable. Server registration uses a plain array. */
  register: (entry: TabEntry) => () => void
  /** Stores an author ID for the part/value pair, replacing any prior claim. Claims persist until root disposal; there is no release operation. */
  claimId: (part: 'tab' | 'panel', value: string, id: string) => void
  /** Records whether a panel has a qualifying descendant; identical results do not publish a new map. Values persist after panel cleanup. */
  probePanel: (value: string, focusable: boolean) => void
  /** Current tablist semantics and focus-leave handler, which clears the separate navigation target. */
  listPart: () => AnyPart
  /** Current tab associations, selected/disabled hooks, and navigation/selection handlers. */
  tabPart: (value: string) => AnyPart
  /** Current panel associations and hidden state; selected panels get tabindex=0 unless their probe is true. */
  panelPart: (value: string) => AnyPart
  /** Resolved arrow-navigation axis, defaulting to horizontal. */
  orientation: () => TabsOrientation
  /** Root disabled flag, OR-combined with each tab's local disabled state. */
  disabled: () => boolean
}

/** Nearest Tabs provider, or null outside a root. */
export const TabsContext = createContext<TabsContextValue | null>(null)

/**
 * Requires a Tabs provider in the current Solid owner.
 * @param name - Part name included in the missing-provider error.
 * @throws If no Tabs context is available.
 */
export function useTabs(name: string): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Tabs>`)
  return context
}
