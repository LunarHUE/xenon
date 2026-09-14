import type { CheckedHost, CheckedOptions, CheckedState } from '../internal/checked'
import { checkedRoot, checkedState } from '../internal/checked'
import type { PartProps } from '../part'

/** Host semantics shared with {@link CheckedHost}. */
export type SwitchHost = CheckedHost

/** Options and change-callback contract from {@link CheckedOptions}; switches have no mixed state. */
export type SwitchOptions = CheckedOptions

/** Normalized checked-control snapshot described by {@link CheckedState}. */
export type SwitchState = CheckedState

/** State and a host-specific root part; rebuild after option changes. */
export interface SwitchResult<R> {
  /** Resolved values used to generate this part. */
  state: SwitchState
  /** Parts to bind to the rendered control. */
  parts: {
    /** Host attributes and event handlers for the control. */
    root: R
  }
}

/** Result union for a host selected at runtime; literal hosts return narrower part types. */
export type SwitchAny =
  | SwitchResult<PartProps<'input'>>
  | SwitchResult<PartProps<'button'>>
  | SwitchResult<PartProps<'div'>>

/**
 * Builds a native checkbox input part carrying the switch role.
 *
 * @remarks
 * Input changes report the browser checked value. Construction does not bind
 * the part or change state. See {@link CheckedOptions} for callback and form
 * contracts. Rebuild the part after the caller updates checked state.
 */
export function toggleSwitch(
  options?: SwitchOptions & { host?: 'input' }
): SwitchResult<PartProps<'input'>>
/** Builds a switch-role button; click proposes !checked and Space release synthesizes a click. */
export function toggleSwitch(
  options: SwitchOptions & { host: 'button' }
): SwitchResult<PartProps<'button'>>
/** Adds switch role, ARIA state, and Space activation to a generic host; Enter does not activate. */
export function toggleSwitch(
  options: SwitchOptions & { host: 'generic' }
): SwitchResult<PartProps<'div'>>
/** Builds the part for a runtime host using the defaults in {@link SwitchOptions}. */
export function toggleSwitch(options: SwitchOptions): SwitchAny
export function toggleSwitch(options: SwitchOptions = {}): SwitchAny {
  const state = checkedState(options)
  const built = checkedRoot(options, state, { role: 'switch' })

  if (built.host === 'input') return { state, parts: { root: built.root } }
  if (built.host === 'button') return { state, parts: { root: built.root } }
  return { state, parts: { root: built.root } }
}
