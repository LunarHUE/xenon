import type { CheckedHost, CheckedOptions, CheckedState } from '../internal/checked'
import { checkedRoot, checkedState } from '../internal/checked'
import type { PartProps } from '../part'

/** Host semantics shared with {@link CheckedHost}. */
export type CheckboxHost = CheckedHost

/** Checked-control options from {@link CheckedOptions}, with an independent mixed state. */
export interface CheckboxOptions extends CheckedOptions {
  /**
   * Mixed presentation, defaulting to false, independent of checked. Core does
   * not change this option on activation. Input adapters must set the indeterminate DOM property;
   * other hosts receive aria-checked="mixed".
   */
  indeterminate?: boolean
}

/** Resolved {@link CheckedState} plus the caller-supplied mixed presentation. */
export interface CheckboxState extends CheckedState {
  /** Whether mixed presentation is requested, defaulting to false. */
  indeterminate: boolean
}

/** State and a host-specific root part; rebuild after option changes. */
export interface CheckboxResult<R> {
  /** Resolved values used to generate this part. */
  state: CheckboxState
  /** Parts to bind to the rendered control. */
  parts: {
    /** Host attributes and event handlers for the control. */
    root: R
  }
}

/** Result union for a host selected at runtime; literal hosts return narrower part types. */
export type CheckboxAny =
  | CheckboxResult<PartProps<'input'>>
  | CheckboxResult<PartProps<'button'>>
  | CheckboxResult<PartProps<'div'>>

/**
 * Builds a native checkbox input part from a caller-owned checked snapshot.
 *
 * @remarks
 * Input changes report the browser checked value. Construction does not bind
 * the part or change state. See {@link CheckedOptions} for callback and form
 * contracts; adapters also apply the indeterminate DOM property when requested.
 */
export function checkbox(
  options?: CheckboxOptions & { host?: 'input' }
): CheckboxResult<PartProps<'input'>>
/** Builds a checkbox-role button; click proposes !checked and Space release synthesizes a click. */
export function checkbox(
  options: CheckboxOptions & { host: 'button' }
): CheckboxResult<PartProps<'button'>>
/** Adds checkbox role, ARIA state, and Space activation to a generic host; Enter does not activate. */
export function checkbox(
  options: CheckboxOptions & { host: 'generic' }
): CheckboxResult<PartProps<'div'>>
/** Builds the part for a runtime host using the defaults in {@link CheckboxOptions}. */
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
