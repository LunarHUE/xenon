import type { AnyPart } from '@xenon-ui/core'
import type { RadioItemHost, RadioValue } from '@xenon-ui/core'
import { createContext, useContext } from 'solid-js'

/** Mounted item registration used for navigation and native checked-state repair. */
export interface RadioGroupEntry {
  /** Visible focus target; null until its ref runs. */
  el: HTMLElement | null
  /** Native radio or custom host's form mirror, when present. */
  input: HTMLInputElement | null
  /** Current item identity, preserving its string or number type. */
  value: () => RadioValue
  /** Current disabled flag for this item alone. */
  disabled: () => boolean
}

/** Host and item description supplied to the core part factory. */
export interface RadioItemRequest {
  /** Semantic host category chosen from the item's literal as prop. */
  host: RadioItemHost
  /** Item description IDs, placed before the group's IDs. */
  describedBy?: string
}

/** Reactive group services consumed by descendant radio items. */
export interface RadioGroupContextValue {
  /** Adds an entry, sorts available elements by DOM order, and returns its unregister callback. */
  register: (entry: RadioGroupEntry) => () => void
  /** Builds current attributes and handlers for the requested item and host. */
  part: (value: RadioValue, request: RadioItemRequest) => AnyPart
  /** Current resolved selection; undefined means no selected value. */
  selected: () => RadioValue | undefined
  /** Current defaultValue, falling back to controlled value, for native defaultChecked. */
  fallback: () => RadioValue | undefined
  /** Author-supplied name only; omits the generated native grouping name. */
  name: () => string | undefined
  /** Current explicit form ID, or undefined for normal form ancestry. */
  form: () => string | undefined
  /** Resolved group required flag. */
  required: () => boolean
  /** Resolved group disabled flag, excluding individual item flags. */
  disabled: () => boolean
  /** True when the group is neither disabled nor readonly. */
  interactive: () => boolean
  /** Schedules all registered native radios and mirrors to match selection on settlement. */
  resync: () => void
}

/** Nullable provider shared by the group root and its items. */
export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

/** Reads the nearest group, throwing an error naming the consumer when absent. */
export function useRadioGroup(name: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext)
  if (!context) throw new Error(`${name} must be rendered inside a <RadioGroup>`)
  return context
}
