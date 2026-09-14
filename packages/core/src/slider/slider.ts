import type { PartProps } from '../part'

/** Inputs for a fixed-order, one-or-more-thumb slider snapshot. */
export interface SliderOptions {
  /** Values in thumb order. Defaults to one thumb at min. */
  value?: readonly number[]
  /** Lower bound, default 0. */
  min?: number
  /** Upper bound, default 100. Invalid reversed bounds collapse to min. */
  max?: number
  /** Positive grid increment anchored at min, default 1. */
  step?: number
  /** Page and Shift-arrow increment, default ten steps. */
  largeStep?: number
  /** Minimum gap in steps; reduced if the range cannot fit all thumbs. */
  minStepsBetweenThumbs?: number
  /** Value axis, default horizontal. */
  orientation?: 'horizontal' | 'vertical'
  /** Horizontal reading direction, default ltr. */
  direction?: 'ltr' | 'rtl'
  /** Disable all interaction and form submission. */
  disabled?: boolean
  /** Keep focus and form submission while blocking changes. */
  readonly?: boolean
  /** Author validation state. */
  invalid?: boolean
  /** Format a thumb's accessible value only when numbers are insufficient. */
  format?: (value: number, index: number) => string
}

/** Normalized slider snapshot. */
export interface SliderState {
  /** Finite values, clamped without reordering thumbs. */
  value: number[]
  /** Finite minimum. */
  min: number
  /** Last grid-aligned maximum. */
  max: number
  /** Positive step. */
  step: number
  /** Positive page increment. */
  largeStep: number
  /** Actual minimum distance between adjacent thumbs. */
  gap: number
  /** Whether requests may change values. */
  interactive: boolean
  /** Resolved axis. */
  orientation: 'horizontal' | 'vertical'
  /** Resolved reading direction. */
  direction: 'ltr' | 'rtl'
}

/** Pure slider state, semantics, and value calculations. */
export interface SliderResult {
  /** Normalized state. */
  state: SliderState
  /** Host attribute bundles. */
  parts: {
    /** Group wrapper semantics and common state flags. */
    root: PartProps<'div'>
    /** Common styling flags for decorative and layout parts. */
    control: PartProps<'div'>
    /** Native input semantics bounded by adjacent thumbs. */
    thumb(index: number): PartProps<'input'>
  }
  /** Allowed bounds for one thumb. Missing indices return the absolute minimum. */
  bounds(index: number): [number, number]
  /** Request a grid-snapped value; returns the original values for blocked requests. */
  setValue(index: number, value: number): number[]
  /** Calculate a keyboard request; undefined means the key is not handled. */
  key(index: number, key: string, shift?: boolean): number[] | undefined
  /** Convert a normalized visual coordinate to a numeric value. */
  fromRatio(ratio: number): number
  /** Numeric value as percentage of the range. */
  percentage(value: number): number
}

function finite(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}
function clean(value: number): number {
  return Number(value.toPrecision(15))
}

/** Compute a slider without DOM access or internal mutable state. Recompute after accepted requests. */
export function slider(options: SliderOptions = {}): SliderResult {
  const min = finite(options.min, 0)
  const rawMax = Math.max(min, finite(options.max, 100))
  const step = Math.max(Number.MIN_VALUE, finite(options.step, 1) > 0 ? finite(options.step, 1) : 1)
  const max = clean(min + Math.floor((rawMax - min) / step + 1e-9) * step)
  const source = options.value?.length ? options.value : [min]
  const gap = Math.min(
    Math.max(0, finite(options.minStepsBetweenThumbs, 0)) * step,
    source.length > 1 ? (max - min) / (source.length - 1) : 0
  )
  const value: number[] = []
  for (let index = 0; index < source.length; index++) {
    const lower = index ? value[index - 1]! + gap : min
    const upper = max - (source.length - 1 - index) * gap
    value.push(clean(Math.max(lower, Math.min(upper, finite(source[index], lower)))))
  }
  const state: SliderState = {
    value,
    min,
    max,
    step,
    gap,
    largeStep:
      finite(options.largeStep, step * 10) > 0 ? finite(options.largeStep, step * 10) : step * 10,
    interactive: !options.disabled && !options.readonly,
    orientation: options.orientation ?? 'horizontal',
    direction: options.direction ?? 'ltr',
  }
  const bounds = (index: number): [number, number] =>
    index < 0 || index >= value.length
      ? [min, min]
      : [
          index ? clean(value[index - 1]! + gap) : min,
          index < value.length - 1 ? clean(value[index + 1]! - gap) : max,
        ]
  const change = (index: number, next: number, snap: boolean) => {
    if (!state.interactive || value[index] === undefined || !Number.isFinite(next)) return value
    const [low, high] = bounds(index)
    const resolved = clean(
      Math.max(low, Math.min(high, snap ? min + Math.round((next - min) / step) * step : next))
    )
    return value.map((current, i) => (i === index ? resolved : current))
  }
  const flags = {
    'data-orientation': state.orientation,
    'data-disabled': options.disabled ? '' : undefined,
    'data-readonly': options.readonly ? '' : undefined,
    'data-invalid': options.invalid ? '' : undefined,
  }
  return {
    state,
    bounds,
    parts: {
      root: { attrs: { ...flags, role: 'group', dir: state.direction }, on: {} },
      control: { attrs: flags, on: {} },
      thumb: (index) => {
        const [low, high] = bounds(index)
        return {
          attrs: {
            ...flags,
            type: 'range',
            min: String(low),
            max: String(high),
            step: 'any',
            value: String(value[index] ?? min),
            disabled: options.disabled || value[index] === undefined,
            'aria-valuemin': String(low),
            'aria-valuemax': String(high),
            'aria-valuenow': String(value[index] ?? min),
            'aria-valuetext':
              value[index] === undefined ? undefined : options.format?.(value[index]!, index),
            'aria-orientation': state.orientation,
            'aria-readonly': options.readonly ? 'true' : undefined,
            'aria-disabled': options.disabled ? 'true' : undefined,
            'aria-invalid': options.invalid ? 'true' : undefined,
            'data-index': index,
          },
          on: {},
        }
      },
    },
    setValue: (index, next) => change(index, next, true),
    key: (index, key, shift = false) => {
      const current = value[index] ?? min
      const [low, high] = bounds(index)
      if (key === 'Home') return change(index, low, false)
      if (key === 'End') return change(index, high, false)
      let direction =
        key === 'ArrowUp' || key === 'PageUp'
          ? 1
          : key === 'ArrowDown' || key === 'PageDown'
            ? -1
            : key === 'ArrowRight'
              ? state.direction === 'rtl'
                ? -1
                : 1
              : key === 'ArrowLeft'
                ? state.direction === 'rtl'
                  ? 1
                  : -1
                : 0
      if (!direction) return undefined
      if (shift || key.startsWith('Page'))
        return change(index, current + direction * state.largeStep, false)
      const position = (current - min) / step
      direction = direction > 0 ? Math.floor(position + 1e-9) + 1 : Math.ceil(position - 1e-9) - 1
      return change(index, clean(min + direction * step), false)
    },
    fromRatio: (ratio) =>
      min +
      (state.orientation === 'vertical' || state.direction === 'rtl' ? 1 - ratio : ratio) *
        (max - min),
    percentage: (current) => (max === min ? 0 : ((current - min) / (max - min)) * 100),
  }
}
