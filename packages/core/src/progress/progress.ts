import type { PartProps } from '../part'

/** Normalized values passed to the determinate progress formatter. */
export interface ProgressFormatDetails {
  /** Finite input value clamped to the resolved min/max bounds. */
  value: number
  /** Finite lower bound after fallback handling. */
  min: number
  /** Finite upper bound, raised to min when necessary. */
  max: number
  /** Unrounded percentage across the range; zero for a zero-width range. */
  percentage: number
}

/** Numeric progress range and accessible value-text formatting. */
export interface ProgressOptions {
  /** Current amount, clamped to the resolved bounds. Undefined, NaN, and infinities mean indeterminate. */
  value?: number
  /** Lower bound. Omitted or nonfinite values fall back to 0. */
  min?: number
  /** Upper bound. Omitted or nonfinite values fall back to 100, then the result is raised to min if needed. */
  max?: number
  /**
   * Called synchronously once during construction for a determinate value, never
   * for an indeterminate value. Its result becomes aria-valuetext unchanged.
   * Defaults to the rounded percentage followed by %. Exceptions propagate.
   */
  format?: (details: ProgressFormatDetails) => string
}

/** Normalized numeric state and the accessible value text computed from it. */
export interface ProgressState {
  /** Clamped amount, or undefined when indeterminate. */
  value: number | undefined
  /** Finite lower bound, defaulting to 0. */
  min: number
  /** Finite upper bound at least as large as min. */
  max: number
  /** Unrounded share of the range times 100; zero for a zero-width range, undefined when indeterminate. */
  percentage: number | undefined
  /** Whether no finite value was supplied. */
  indeterminate: boolean
  /** Whether a determinate value reaches max, including a zero-width range. */
  complete: boolean
  /** Formatter output, or undefined when indeterminate. */
  valueText: string | undefined
}

/** Progress snapshot and accessible root attributes. */
export interface ProgressResult {
  /** Normalized bounds, amount, and formatter output. */
  state: ProgressState
  /** Attribute bundle to bind to the rendered indicator. */
  parts: {
    /** Progressbar role, string-valued ARIA bounds/current amount, value text, and loading/complete/indeterminate data-state; no handlers. */
    root: PartProps<'div'>
  }
}

/** Substitutes a fallback for missing or nonfinite bounds. */
function bound(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : value
}

/** Formats the computed percentage with integer rounding and a percent sign. */
function percent(details: ProgressFormatDetails): string {
  return `${Math.round(details.percentage)}%`
}

/**
 * Computes progress semantics without rendering a fill or tracking later updates.
 * Recompute when the amount or bounds change. The caller supplies an accessible
 * name for the progressbar and any visual representation of percentage.
 *
 * @remarks
 * A zero-width range reports zero percent but is complete for every finite input.
 * Indeterminate progress retains min/max ARIA attributes and omits current value
 * and value text. Percentages use ordinary JavaScript arithmetic without rounding
 * or overflow correction; only the default text formatter rounds them.
 */
export function progress(options: ProgressOptions = {}): ProgressResult {
  const min = bound(options.min, 0)
  const max = Math.max(bound(options.max, 100), min)
  const span = max - min

  const raw = options.value
  const value =
    raw === undefined || !Number.isFinite(raw) ? undefined : Math.min(Math.max(raw, min), max)

  const percentage = value === undefined ? undefined : span === 0 ? 0 : ((value - min) / span) * 100
  const indeterminate = value === undefined
  const complete = value !== undefined && value >= max

  const valueText =
    value === undefined || percentage === undefined
      ? undefined
      : (options.format ?? percent)({ value, min, max, percentage })

  const state: ProgressState = {
    value,
    min,
    max,
    percentage,
    indeterminate,
    complete,
    valueText,
  }

  const root: PartProps<'div'> = {
    attrs: {
      role: 'progressbar',
      'aria-valuemin': String(min),
      'aria-valuemax': String(max),
      'aria-valuenow': value === undefined ? undefined : String(value),
      'aria-valuetext': valueText,
      'data-state': indeterminate ? 'indeterminate' : complete ? 'complete' : 'loading',
    },
    on: {},
  }

  return { state, parts: { root } }
}
