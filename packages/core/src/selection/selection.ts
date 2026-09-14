/** Single replacement, multiple membership, or disabled selection that preserves the input. */
export type SelectionMode = 'single' | 'multiple' | 'none'

/** Operation payload: a scalar or undefined in single mode, an array in multiple mode, or the original input in none mode. */
export type SelectionValue<T> = T | readonly T[] | undefined

/** Selection input from which each operation computes its next value. */
export interface SelectionOptions<T> {
  /**
   * Selection behavior and operation payload shape.
   * @defaultValue 'single'
   */
  mode?: SelectionMode
  /**
   * Current selection. Arrays are retained in multiple mode and reduced to their
   * first entry for the `values` view in other modes. Undefined means empty.
   */
  value?: T | readonly T[]
  /**
   * Allow toggle and clear to return an empty selection. False preserves the current
   * values when an operation would empty them; it does not fill an initially empty selection.
   * @defaultValue true
   */
  allowEmpty?: boolean
}

/** Queries and next-value operations that never update their own selection state. */
export interface SelectionResult<T> {
  /** Resolved selection behavior. */
  mode: SelectionMode
  /** Normalized input values. A multiple-mode input array is retained by reference. */
  values: readonly T[]
  /** Membership using `Array.includes`, with object identity; always false in none mode. */
  isSelected(item: T): boolean
  /**
   * Add or replace an unselected item; remove strictly equal entries for a selected item.
   * Respects `allowEmpty` on removal and returns the original input in none mode.
   */
  toggle(item: T): SelectionValue<T>
  /**
   * Replace the single value or append a missing multiple value. Existing multiple
   * membership preserves the array; none mode returns the original input.
   */
  select(item: T): SelectionValue<T>
  /** Return an empty payload if allowed, otherwise the current payload. None mode returns the original input. */
  clear(): SelectionValue<T>
}

/** Normalizes the input view, preserving an array reference only in multiple mode. */
function toValues<T>(value: T | readonly T[] | undefined, mode: SelectionMode): readonly T[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) return [value as T]
  const list = value as readonly T[]
  return mode === 'multiple' ? list : list.slice(0, 1)
}

/**
 * Computes selection changes from the supplied value without mutating it or storing changes.
 * Feed returned payloads into a new call to use the updated selection.
 *
 * @remarks
 * This is a snapshot of the options, but multiple-mode arrays are shared rather
 * than copied or frozen. Keep them unchanged while using the result. Array-valued
 * items cannot be distinguished from a list supplied as `value`.
 * Membership uses `Array.includes`, while removal uses strict equality, so NaN
 * reports selected but cannot be toggled off. Initial duplicate values are preserved.
 */
export function selection<T>(options: SelectionOptions<T> = {}): SelectionResult<T> {
  const mode = options.mode ?? 'single'
  const allowEmpty = options.allowEmpty ?? true
  const given = options.value
  const values = toValues(given, mode)

  /** Converts normalized values to the mode's return shape without copying arrays. */
  const payload = (next: readonly T[]): SelectionValue<T> => (mode === 'multiple' ? next : next[0])

  /** Rejects an empty proposal when required, without assigning either proposal to local state. */
  const commit = (next: readonly T[]): SelectionValue<T> =>
    !allowEmpty && next.length === 0 ? payload(values) : payload(next)

  const isSelected = (item: T) => mode !== 'none' && values.includes(item)

  return {
    mode,
    values,
    isSelected,
    toggle(item) {
      if (mode === 'none') return given
      if (!isSelected(item)) return payload(mode === 'multiple' ? [...values, item] : [item])
      return commit(values.filter((other) => other !== item))
    },
    select(item) {
      if (mode === 'none') return given
      if (mode === 'single') return payload([item])
      return payload(isSelected(item) ? values : [...values, item])
    },
    clear() {
      if (mode === 'none') return given
      return commit([])
    },
  }
}
