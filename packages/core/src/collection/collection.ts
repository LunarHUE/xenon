/** Ordered items and the predicate used to exclude items from navigation. */
export interface CollectionOptions<T> {
  /** Full item order, retained by reference. Keep this array unchanged while using the result. */
  items: readonly T[]
  /** Called once per item during construction. Returning true excludes that position from navigation. */
  disabled?: (item: T) => boolean
}

/** Boundary behavior for one navigation step. */
export interface CollectionStep {
  /**
   * Wrap to the opposite enabled end after reaching a boundary.
   * @defaultValue false
   */
  loop?: boolean
}

/** Navigation queries over the item order and enabled positions captured at construction. */
export interface CollectionResult<T> {
  /** Original array, including disabled items, without a defensive copy. */
  items: readonly T[]
  /** Separate array of enabled items in their original order, computed once. */
  navigable: readonly T[]
  /** First matching position in the full array using `indexOf` equality, or -1 if absent. */
  indexOf(item: T): number
  /** First enabled item, or undefined when no position is enabled. */
  first(): T | undefined
  /** Last enabled item, or undefined when no position is enabled. */
  last(): T | undefined
  /**
   * Next enabled item after `from`, which may itself be disabled. Undefined starts at the first.
   * Returns undefined for an absent start or an unwrapped boundary.
   */
  next(from: T | undefined, opts?: CollectionStep): T | undefined
  /**
   * Previous enabled item before `from`, which may itself be disabled. Undefined starts at the last.
   * Returns undefined for an absent start or an unwrapped boundary.
   */
  previous(from: T | undefined, opts?: CollectionStep): T | undefined
  /**
   * Enabled items between the endpoints, inclusive, always in collection order.
   * Endpoints may be disabled; an absent endpoint produces an empty array.
   */
  range(from: T, to: T): readonly T[]
}

/**
 * Builds navigation queries without changing the supplied items.
 *
 * @remarks
 * Enabled positions and `navigable` are computed once, while queries read the
 * original item array. Recreate the collection after changes to item order or
 * disabled state. Objects match by reference, duplicates resolve to their first
 * position, and NaN never matches because lookup uses `Array.indexOf`.
 */
export function collection<T>(options: CollectionOptions<T>): CollectionResult<T> {
  const items = options.items
  const isDisabled = options.disabled

  const order: number[] = []
  const navigable: T[] = []
  for (let index = 0; index < items.length; index++) {
    const item = items[index] as T
    if (isDisabled?.(item)) continue
    order.push(index)
    navigable.push(item)
  }

  const head = order[0]
  const tail = order[order.length - 1]

  const indexOf = (item: T) => items.indexOf(item)
  const first = () => (head === undefined ? undefined : items[head])
  const last = () => (tail === undefined ? undefined : items[tail])

  /** Searches cached enabled positions relative to the first matching source position. */
  function step(from: T | undefined, forward: boolean, loop: boolean): T | undefined {
    if (from === undefined) return forward ? first() : last()
    const index = indexOf(from)
    if (index < 0) return undefined
    const found = forward
      ? order.find((other) => other > index)
      : order.findLast((other) => other < index)
    if (found !== undefined) return items[found]
    if (!loop) return undefined
    return forward ? first() : last()
  }

  return {
    items,
    navigable,
    indexOf,
    first,
    last,
    next: (from, opts) => step(from, true, opts?.loop ?? false),
    previous: (from, opts) => step(from, false, opts?.loop ?? false),
    range(from, to) {
      const a = indexOf(from)
      const b = indexOf(to)
      if (a < 0 || b < 0) return []
      const start = Math.min(a, b)
      const end = Math.max(a, b)
      return order
        .filter((index) => index >= start && index <= end)
        .map((index) => items[index] as T)
    },
  }
}
