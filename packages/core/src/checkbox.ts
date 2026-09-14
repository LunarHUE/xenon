import type { CheckedHost, CheckedOptions, CheckedState } from './checked'
import { checkedRoot, checkedState } from './checked'
import type { PartProps } from './part'

export type CheckboxHost = CheckedHost

export interface CheckboxOptions extends CheckedOptions {
  indeterminate?: boolean
}

export interface CheckboxState extends CheckedState {
  indeterminate: boolean
}

export interface CheckboxResult<R> {
  state: CheckboxState
  parts: { root: R }
}

export type CheckboxAny =
  | CheckboxResult<PartProps<'input'>>
  | CheckboxResult<PartProps<'button'>>
  | CheckboxResult<PartProps<'div'>>

export function checkbox(
  options?: CheckboxOptions & { host?: 'input' }
): CheckboxResult<PartProps<'input'>>
export function checkbox(
  options: CheckboxOptions & { host: 'button' }
): CheckboxResult<PartProps<'button'>>
export function checkbox(
  options: CheckboxOptions & { host: 'generic' }
): CheckboxResult<PartProps<'div'>>
export function checkbox(options: CheckboxOptions): CheckboxAny
export function checkbox(options: CheckboxOptions = {}): CheckboxAny {
  const base = checkedState(options)
  const indeterminate = options.indeterminate ?? false
  const state: CheckboxState = { ...base, indeterminate }
  const built = checkedRoot(options, base, { role: 'checkbox', indeterminate })

  if (built.host === 'input') return { state, parts: { root: built.root } }
  if (built.host === 'button') return { state, parts: { root: built.root } }
  return { state, parts: { root: built.root } }
}
