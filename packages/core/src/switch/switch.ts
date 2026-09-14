import type { CheckedHost, CheckedOptions, CheckedState } from '../internal/checked'
import { checkedRoot, checkedState } from '../internal/checked'
import type { PartProps } from '../part'

export type SwitchHost = CheckedHost

export type SwitchOptions = CheckedOptions

export type SwitchState = CheckedState

export interface SwitchResult<R> {
  state: SwitchState
  parts: { root: R }
}

export type SwitchAny =
  | SwitchResult<PartProps<'input'>>
  | SwitchResult<PartProps<'button'>>
  | SwitchResult<PartProps<'div'>>

export function toggleSwitch(
  options?: SwitchOptions & { host?: 'input' }
): SwitchResult<PartProps<'input'>>
export function toggleSwitch(
  options: SwitchOptions & { host: 'button' }
): SwitchResult<PartProps<'button'>>
export function toggleSwitch(
  options: SwitchOptions & { host: 'generic' }
): SwitchResult<PartProps<'div'>>
export function toggleSwitch(options: SwitchOptions): SwitchAny
export function toggleSwitch(options: SwitchOptions = {}): SwitchAny {
  const state = checkedState(options)
  const built = checkedRoot(options, state, { role: 'switch' })

  if (built.host === 'input') return { state, parts: { root: built.root } }
  if (built.host === 'button') return { state, parts: { root: built.root } }
  return { state, parts: { root: built.root } }
}
