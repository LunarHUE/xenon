/**
 * The search index and its matcher. The index is built at build time by
 * pages/search-index.json.ts; the palette fetches it once and ranks it here.
 */

/** What a result is. Pages are start pages and component tabs; guides get their own label. */
export type SearchType = 'Page' | 'Guide' | 'Section' | 'Property' | 'Example'

export interface SearchResult {
  type: SearchType
  title: string
  /** Breadcrumb to the result's page, like Components / Button / API. */
  path: string[]
  href: string
  /** Description or first paragraph. Searched, not shown. */
  text: string
  /** A prop's type, shown after its name. */
  detail?: string
}

export interface SearchIndex {
  /** Framework and version the results belong to, like "Solid 0.0.0". */
  version: string
  results: SearchResult[]
}

/** Ties go to the broader result: a page before the section inside it. */
const TYPE_ORDER: Record<SearchType, number> = {
  Page: 0,
  Guide: 1,
  Property: 2,
  Section: 3,
  Example: 4,
}

/** A title word starts here: after a space or dash, or at a camelCase hump. */
const wordStart = (title: string, query: string) =>
  title
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[\s\-_/.]+/)
    .some((word) => word.startsWith(query))

/** How well one result matches a lowercase query. 0 is no match. */
function score(result: SearchResult, query: string): number {
  const title = result.title.toLowerCase()
  if (title === query) return 100
  if (title.startsWith(query)) return 80
  if (wordStart(result.title, query)) return 60
  if (title.includes(query)) return 40
  const path = result.path.join(' / ').toLowerCase()
  if (path.includes(query)) return 20
  const text = `${result.detail ?? ''} ${result.text}`.toLowerCase()
  if (text.includes(query)) return 10
  // Several words can match across fields: "button pending".
  const words = query.split(/\s+/)
  const haystack = `${title} ${path} ${text}`
  return words.length > 1 && words.every((word) => haystack.includes(word)) ? 5 : 0
}

/**
 * Results for a query, best first: exact title, title prefix, a title word
 * prefix, title substring, then path, then description. Ties keep type order
 * and then index order, which is sidebar order.
 */
export function search(results: SearchResult[], query: string, limit = 50): SearchResult[] {
  const needle = query.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!needle) return []
  return results
    .map((result, index) => ({ result, index, score: score(result, needle) }))
    .filter((match) => match.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        TYPE_ORDER[a.result.type] - TYPE_ORDER[b.result.type] ||
        a.index - b.index
    )
    .slice(0, limit)
    .map((match) => match.result)
}
