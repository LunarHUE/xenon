export interface CollectionOptions<T> {
  items: readonly T[]
  disabled?: (item: T) => boolean
}

export interface CollectionStep {
  loop?: boolean
}

export interface CollectionResult<T> {
  items: readonly T[]
  navigable: readonly T[]
  indexOf(item: T): number
  first(): T | undefined
  last(): T | undefined
  next(from: T | undefined, opts?: CollectionStep): T | undefined
  previous(from: T | undefined, opts?: CollectionStep): T | undefined
  range(from: T, to: T): readonly T[]
}

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
