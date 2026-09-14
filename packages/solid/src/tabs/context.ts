import type { AnyPart } from '@tenon/core'
import type { TabsOrientation } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

export interface TabEntry {
  el: HTMLElement | null
  value: () => string
  disabled: () => boolean
}

export interface TabsContextValue {
  register: (entry: TabEntry) => () => void
  claimId: (part: 'tab' | 'panel', value: string, id: string) => void
  probePanel: (value: string, focusable: boolean) => void
  listPart: () => AnyPart
  tabPart: (value: string) => AnyPart
  panelPart: (value: string) => AnyPart
  orientation: () => TabsOrientation
  disabled: () => boolean
}

export const TabsContext = createContext<TabsContextValue | null>(null)

export function useTabs(name: string): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) throw new Error(`${name} must be rendered inside a <Tabs>`)
  return context
}
