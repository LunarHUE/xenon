import { button } from '../button'
import type { ButtonHost } from '../button'
import type { AnyPart, PartProps } from '../part'

/** One visible page or a stable marker for omitted pages. */
export type PaginationRangeItem = number | 'start-ellipsis' | 'end-ellipsis'
/** Inputs to a pure page-navigation snapshot. */
export interface PaginationOptions {
  /** Number of pages, not items. Finite integers clamp to 1..MAX_SAFE_INTEGER; invalid values use 1. */
  count: number
  /** One-based current page, default 1; fractions truncate and values clamp. */
  page?: number
  /** Pages on either side of the current page, default 1; capped at 100. */
  siblingCount?: number
  /** Pages retained at each end, default 1; capped at 100. */
  boundaryCount?: number
  /** Blocks all page requests without changing the current page. */
  disabled?: boolean
  /** Called only for a valid, different page requested by activation. */
  onPageChange?: (page: number) => void
}
/** Normalized pagination state. */
export interface PaginationState {
  /** One-based current page. */
  page: number
  /** Normalized total page count. */
  count: number
  /** Ordered page numbers and stable ellipsis markers, at most 403 entries. */
  pages: PaginationRangeItem[]
  /** Whether root-level disabling blocks every control. */
  disabled: boolean
}
/** Per-control native semantics and optional disabling. */
export interface PaginationControlOptions {
  /** Native button by default; linked anchors retain link semantics. */
  host?: ButtonHost
  /** Blocks this particular control. */
  disabled?: boolean
}
/** Snapshot and bindings for page navigation. */
export interface PaginationResult {
  /** Normalized selection and render range. */
  state: PaginationState
  /** Accessible bindings for the navigation anatomy. */
  parts: {
    /** Navigation landmark, named Pagination by default. */
    root: PartProps<'nav'>
    /** Decorative omitted-page marker. */
    ellipsis: PartProps<'span'>
    /** Page control; out-of-range or noninteger targets are disabled. */
    item: (page: number, options?: PaginationControlOptions) => AnyPart
    /** Previous page, disabled at the first page. */
    previous: (options?: PaginationControlOptions) => AnyPart
    /** Next page, disabled at the last page. */
    next: (options?: PaginationControlOptions) => AnyPart
    /** First page, disabled when already current. */
    first: (options?: PaginationControlOptions) => AnyPart
    /** Last page, disabled when already current. */
    last: (options?: PaginationControlOptions) => AnyPart
  }
}
/** Normalize finite integer inputs within a closed range. */
function integer(value: number | undefined, fallback: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value!))) : fallback
}
/**
 * Compute page controls without allocating the full page count. Visibility is
 * bounded by two end windows and a current-page window. Single-page gaps expand
 * to a page; larger gaps become ellipses. Construction never invokes callbacks.
 */
export function pagination(options: PaginationOptions): PaginationResult {
  const count = integer(options.count, 1, 1, Number.MAX_SAFE_INTEGER)
  const page = integer(options.page, 1, 1, count)
  const sibling = integer(options.siblingCount, 1, 0, 100)
  const boundary = integer(options.boundaryCount, 1, 0, 100)
  const disabled = options.disabled ?? false
  const visible = new Set<number>()
  const add = (start: number, end: number) => {
    for (let value = start; value <= end; value++) visible.add(value)
  }
  add(1, Math.min(count, boundary))
  add(Math.max(1, page - sibling), Math.min(count, page + sibling))
  add(Math.max(1, count - boundary + 1), count)
  const numbers = [...visible].sort((a, b) => a - b)
  const pages: PaginationRangeItem[] = []
  let previous = 0
  for (const value of numbers) {
    if (previous > 0 && value - previous === 2) pages.push(previous + 1)
    else if (previous > 0 && value - previous > 2)
      pages.push(value <= page ? 'start-ellipsis' : 'end-ellipsis')
    pages.push(value)
    previous = value
  }
  const item = (
    target: number,
    control: PaginationControlOptions = {},
    label = `Page ${target}`,
    edge = false
  ): AnyPart => {
    const blocked =
      disabled ||
      !!control.disabled ||
      !Number.isInteger(target) ||
      target < 1 ||
      target > count ||
      (edge && target === page)
    const base = button({ host: control.host ?? 'button', disabled: blocked }).parts.root
    return {
      attrs: {
        ...base.attrs,
        'aria-label': label,
        'aria-current': !edge && target === page ? 'page' : undefined,
        'data-state': target === page ? 'current' : 'idle',
      },
      on: {
        ...base.on,
        click(event: MouseEvent) {
          if (blocked) {
            event.preventDefault()
            return
          }
          if (!event.defaultPrevented && target !== page) options.onPageChange?.(target)
        },
      },
    }
  }
  return {
    state: { count, page, pages, disabled },
    parts: {
      root: {
        attrs: {
          role: 'navigation',
          'aria-label': 'Pagination',
          'data-state': disabled ? 'disabled' : 'enabled',
        },
        on: {},
      },
      ellipsis: { attrs: { 'aria-hidden': 'true' }, on: {} },
      item,
      previous: (control) => item(page - 1, control, 'Previous page', true),
      next: (control) => item(page + 1, control, 'Next page', true),
      first: (control) => item(1, control, 'First page', true),
      last: (control) => item(count, control, 'Last page', true),
    },
  }
}
