import { createContext, useContext } from 'solid-js'
import type { FieldContextValue } from '../field/context'

/** Internal group membership and Field association contract. */
export interface CheckboxGroupContextValue {
  /** Group Field associations; individual Fields can override item naming. */
  field: FieldContextValue
  /** Current group values. */
  current(): readonly string[]
  /** Values restored by native form reset. */
  fallback(): readonly string[]
  /** Shared native form owner. */
  form(): string | undefined
  /** Propose one item's next membership. */
  change(value: string, checked: boolean): void
  /** Silently restore uncontrolled group state. */
  reset(): void
}
/** Optional nearest group. */
export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null)
/** Read group ownership without requiring a provider. */
export const useCheckboxGroup = () => useContext(CheckboxGroupContext)
