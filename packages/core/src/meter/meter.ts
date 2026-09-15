import type { PartProps } from '../part'

/** Normalized finite measurement passed to the formatter. */
export interface MeterFormatDetails {
  /** Clamped measurement. */
  value: number
  /** Inclusive lower bound. */
  min: number
  /** Inclusive upper bound, strictly greater than min. */
  max: number
  /** Unrounded percentage of the range. */
  percentage: number
}
/** Inputs for a bounded, read-only measurement. */
export interface MeterOptions {
  /** Measurement; omitted or nonfinite values use the normalized minimum. */
  value?: number
  /** Finite lower bound, default 0. Invalid bound pairs reset to 0..100. */
  min?: number
  /** Finite upper bound, default 100. Invalid bound pairs reset to 0..100. */
  max?: number
  /** Native meter semantics by default; generic hosts receive an explicit role. */
  host?: 'meter' | 'generic'
  /** Accessible value text formatter, defaulting to rounded percentage. */
  format?: (details: MeterFormatDetails) => string
}
/** Resolved measurement and its accessible text. */
export interface MeterState extends MeterFormatDetails {
  /** Formatter output. */
  valueText: string
}
/** Measurement snapshot and host binding. */
export interface MeterResult {
  /** Normalized bounded measurement. */
  state: MeterState
  /** Host attributes; no input handlers or live announcements. */
  parts: {
    /** Native values and ARIA measurement semantics. */
    root: PartProps<'meter'>
  }
}
/**
 * Compute a finite measurement. Invalid bound pairs reset to 0..100, including
 * a nonfinite span. Recompute when inputs change and supply an accessible name.
 * Meters have no indeterminate or progress-completion state.
 */
export function meter(options: MeterOptions = {}): MeterResult {
  let min = Number.isFinite(options.min) ? options.min! : 0
  let max = Number.isFinite(options.max) ? options.max! : 100
  if (min >= max || !Number.isFinite(max - min)) {
    min = 0
    max = 100
  }
  const value = Number.isFinite(options.value) ? Math.min(max, Math.max(min, options.value!)) : min
  const percentage = ((value - min) / (max - min)) * 100
  const valueText =
    options.format?.({ value, min, max, percentage }) ?? `${Math.round(percentage)}%`
  const native = options.host !== 'generic'
  return {
    state: { value, min, max, percentage, valueText },
    parts: {
      root: {
        attrs: {
          role: native ? undefined : 'meter',
          min: native ? String(min) : undefined,
          max: native ? String(max) : undefined,
          value: native ? String(value) : undefined,
          'aria-valuemin': String(min),
          'aria-valuemax': String(max),
          'aria-valuenow': String(value),
          'aria-valuetext': valueText,
          'data-state': 'determinate',
        },
        on: {},
      },
    },
  }
}
