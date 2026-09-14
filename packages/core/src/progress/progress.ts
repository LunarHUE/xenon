import type { PartProps } from '../part'

export interface ProgressFormatDetails {
  value: number
  min: number
  max: number
  percentage: number
}

export interface ProgressOptions {
  value?: number
  min?: number
  max?: number
  format?: (details: ProgressFormatDetails) => string
}

export interface ProgressState {
  value: number | undefined
  min: number
  max: number
  percentage: number | undefined
  indeterminate: boolean
  complete: boolean
  valueText: string | undefined
}

export interface ProgressResult {
  state: ProgressState
  parts: { root: PartProps<'div'> }
}

function bound(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : value
}

function percent(details: ProgressFormatDetails): string {
  return `${Math.round(details.percentage)}%`
}

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
