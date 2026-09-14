import type { AnyPart } from '@tenon/core'
import type { RadioItemHost, RadioValue } from '@tenon/core'
import { createContext, useContext } from 'solid-js'

export interface RadioGroupEntry {
  el: HTMLElement | null
  input: HTMLInputElement | null
  value: () => RadioValue
  disabled: () => boolean
}

export interface RadioItemRequest {
  host: RadioItemHost
  describedBy?: string
}

export interface RadioGroupContextValue {
  register: (entry: RadioGroupEntry) => () => void
  part: (value: RadioValue, request: RadioItemRequest) => AnyPart
  selected: () => RadioValue | undefined
  fallback: () => RadioValue | undefined
  name: () => string | undefined
  form: () => string | undefined
  required: () => boolean
  disabled: () => boolean
  interactive: () => boolean
  resync: () => void
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export function useRadioGroup(name: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext)
  if (!context) throw new Error(`${name} must be rendered inside a <RadioGroup>`)
  return context
}
