import type { AnyPart } from '@kit/core'
import type { ToggleHost } from '@kit/core'
import { createContext, useContext } from 'solid-js'

export interface ToggleGroupEntry {
  el: HTMLElement | null
  value: () => string
  disabled: () => boolean
  host: () => ToggleHost
}

export interface ToggleGroupContextValue {
  register: (entry: ToggleGroupEntry) => () => void
  part: (entry: ToggleGroupEntry) => AnyPart
  disabled: () => boolean
}

export const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null)

export function useToggleGroup(name: string): ToggleGroupContextValue {
  const context = useContext(ToggleGroupContext)
  if (!context) throw new Error(`${name} must be rendered inside a <ToggleGroup>`)
  return context
}
