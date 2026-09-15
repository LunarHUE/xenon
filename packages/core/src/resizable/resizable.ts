import type { PartProps } from '../part'

/** Bounds for one percent-sized panel. */
export interface ResizablePanelOptions {
  /** Smallest expanded size, default 0. */
  minSize?: number
  /** Largest size, default 100. */
  maxSize?: number
  /** Allow Enter to collapse this primary panel to zero. */
  collapsible?: boolean
  /** Actual adapter-owned panel ID. */
  id?: string
  /** Visible label element ID. */
  labelledBy?: string
  /** Accessible panel name when there is no visible label. */
  label?: string
}
/** Inputs for an adjacent-pair splitter snapshot. */
export interface ResizableOptions {
  /** Ordered panel constraints. */
  panels: readonly ResizablePanelOptions[]
  /** Percentages totaling 100; invalid values use a feasible equal distribution. */
  sizes?: readonly number[]
  /** Panel flow axis, default horizontal. */
  orientation?: 'horizontal' | 'vertical'
  /** Horizontal reading direction, default ltr. */
  direction?: 'ltr' | 'rtl'
  /** Block all resizing. */
  disabled?: boolean
  /** Arrow increment in percentage points, default 1. */
  step?: number
  /** Shift-arrow increment in percentage points, default 10. */
  largeStep?: number
}
/** Pure semantics and adjacent transfer operations. */
export interface ResizableResult {
  /** Current normalized state. */
  state: {
    /** Percent sizes in panel order. */
    sizes: number[]
    /** Whether constraints admit an expanded layout totaling 100. */
    valid: boolean
    /** Whether resizing is allowed. */
    interactive: boolean
    /** Resolved panel flow axis. */
    orientation: 'horizontal' | 'vertical'
    /** Resolved reading direction. */
    direction: 'ltr' | 'rtl'
  }
  /** Attribute bundles. */
  parts: {
    /** Flex layout root flags. */
    root: PartProps<'div'>
    /** Panel identity and collapse state. */
    panel(index: number): PartProps<'div'>
    /** Focusable separator semantics naming the preceding panel. */
    handle(index: number): PartProps<'div'>
  }
  /** Expanded bounds constrained by the adjacent panel. */
  bounds(index: number): [number, number]
  /** Set a primary size, transferring only to its next neighbor. */
  resize(index: number, size: number): number[]
  /** Toggle primary collapse, restoring a previously expanded size. */
  toggle(index: number, restore?: number): number[]
  /** Resolve an axis key, or return undefined for an unrelated key. */
  key(index: number, key: string, shift?: boolean): number[] | undefined
}
/** Clamp a finite value to ordered bounds. */
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
/** Round ordinary floating point transfer noise. */
const clean = (value: number) => Number(value.toFixed(10))

/** Compute a layout without measuring elements or retaining mutable state. */
export function resizable(options: ResizableOptions): ResizableResult {
  const panels = options.panels
  const count = panels.length
  const mins = panels.map((panel) => panel.minSize ?? 0)
  const maxs = panels.map((panel) => panel.maxSize ?? 100)
  const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0)
  const valid =
    count >= 2 &&
    mins.every(
      (min, i) =>
        Number.isFinite(min) &&
        Number.isFinite(maxs[i]) &&
        min >= 0 &&
        maxs[i]! <= 100 &&
        min <= maxs[i]!
    ) &&
    sum(mins) <= 100 &&
    sum(maxs) >= 100
  let sizes = Array.from({ length: count }, () => (count ? 100 / count : 0))
  const source = options.sizes
  if (valid) {
    if (
      source?.length === count &&
      source.every(
        (size, i) =>
          Number.isFinite(size) &&
          ((panels[i]?.collapsible && size === 0) || size >= mins[i]!) &&
          size <= maxs[i]!
      ) &&
      Math.abs(sum(source) - 100) < 1e-7
    )
      sizes = [...source]
    else {
      sizes = sizes.map((size, i) => clamp(size, mins[i]!, maxs[i]!))
      for (let i = 0; i < count; i++) {
        const remaining = 100 - sum(sizes)
        sizes[i] = clamp(sizes[i]! + remaining, mins[i]!, maxs[i]!)
      }
    }
  }
  const state = {
    sizes,
    valid,
    interactive: valid && !options.disabled,
    orientation: options.orientation ?? 'horizontal',
    direction: options.direction ?? 'ltr',
  } as const
  const exists = (index: number) => Number.isInteger(index) && index >= 0 && index + 1 < count
  const bounds = (index: number): [number, number] => {
    if (!valid || !exists(index)) return [0, 0]
    const total = sizes[index]! + sizes[index + 1]!
    return [
      Math.max(mins[index]!, total - maxs[index + 1]!),
      Math.min(maxs[index]!, total - mins[index + 1]!),
    ]
  }
  const transfer = (index: number, size: number) => {
    const next = [...sizes]
    next[index + 1] = clean(sizes[index]! + sizes[index + 1]! - size)
    next[index] = clean(size)
    return next
  }
  const resize = (index: number, size: number) => {
    if (!state.interactive || !exists(index) || !Number.isFinite(size)) return [...sizes]
    const [min, max] = bounds(index)
    if (min > max) return [...sizes]
    return transfer(index, clamp(size, min, max))
  }
  const toggle = (index: number, restore = 100 / count) => {
    if (!state.interactive || !exists(index) || !panels[index]?.collapsible) return [...sizes]
    if (sizes[index] === 0) return resize(index, Number.isFinite(restore) ? restore : mins[index]!)
    const total = sizes[index]! + sizes[index + 1]!
    return total <= maxs[index + 1]! && total >= mins[index + 1]! ? transfer(index, 0) : [...sizes]
  }
  const flags = {
    'data-orientation': state.orientation,
    'data-state': state.interactive ? 'idle' : 'disabled',
    'data-disabled': state.interactive ? undefined : '',
  } as const
  return {
    state,
    bounds,
    resize,
    toggle,
    parts: {
      root: { attrs: flags, on: {} },
      panel: (index) => ({
        attrs: {
          ...flags,
          id: panels[index]?.id,
          'aria-label': panels[index]?.label,
          'aria-labelledby': panels[index]?.labelledBy,
          'data-state': sizes[index] === 0 ? 'collapsed' : 'expanded',
        },
        on: {},
      }),
      handle: (index) => ({
        attrs: {
          ...flags,
          role: 'separator',
          tabindex: state.interactive && exists(index) ? 0 : -1,
          'aria-disabled': !state.interactive || !exists(index) ? 'true' : undefined,
          'aria-orientation': state.orientation === 'horizontal' ? 'vertical' : undefined,
          'aria-controls': panels[index]?.id,
          'aria-label': panels[index]?.label,
          'aria-labelledby': panels[index]?.labelledBy,
          'aria-valuenow': String(sizes[index] ?? 0),
          'aria-valuemin': String(
            panels[index]?.collapsible && sizes[index]! + sizes[index + 1]! <= maxs[index + 1]!
              ? 0
              : bounds(index)[0]
          ),
          'aria-valuemax': String(bounds(index)[1]),
        },
        on: {},
      }),
    },
    key: (index, key, shift) => {
      if (!state.interactive || !exists(index)) return undefined
      if (key === 'Home') return resize(index, bounds(index)[0])
      if (key === 'End') return resize(index, bounds(index)[1])
      let delta =
        state.orientation === 'horizontal'
          ? key === 'ArrowRight'
            ? 1
            : key === 'ArrowLeft'
              ? -1
              : 0
          : key === 'ArrowDown'
            ? 1
            : key === 'ArrowUp'
              ? -1
              : 0
      if (!delta) return undefined
      if (state.orientation === 'horizontal' && state.direction === 'rtl') delta *= -1
      const amount = shift ? (options.largeStep ?? 10) : (options.step ?? 1)
      return resize(
        index,
        sizes[index]! + delta * (Number.isFinite(amount) && amount > 0 ? amount : shift ? 10 : 1)
      )
    },
  }
}
