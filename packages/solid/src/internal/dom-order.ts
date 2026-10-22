/** A registry entry whose host, once known, fixes its navigation position. */
interface Hosted {
  el: HTMLElement | null
}

/** Sorts entries by document position, leaving pairs without both hosts unchanged. */
export function byDomOrder(a: Hosted, b: Hosted): number {
  if (!a.el || !b.el) return 0
  const relation = a.el.compareDocumentPosition(b.el)
  if (relation & Node.DOCUMENT_POSITION_FOLLOWING) return -1
  if (relation & Node.DOCUMENT_POSITION_PRECEDING) return 1
  return 0
}

/**
 * Re-reads document order for entries whose hosts may have moved without remounting,
 * as keyed lists do. Returns undefined when the order is unchanged.
 */
export function reordered<T extends Hosted>(entries: readonly T[]): T[] | undefined {
  const sorted = [...entries].sort(byDomOrder)
  return sorted.some((entry, index) => entry !== entries[index]) ? sorted : undefined
}
