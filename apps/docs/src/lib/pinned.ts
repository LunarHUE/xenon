/**
 * Pinned chrome. The bars that can pin at the top of the page are the header
 * (from lg), the narrow context bar (below lg) and the page's breadcrumb trail
 * (from lg, see DocsPage.astro). Anything above the lowest one is covered, so
 * it doesn't count as on screen.
 */
const BARS = '[data-docs-header], [data-docs-context-bar], [data-docs-trail]'

/**
 * True while a sticky element sits at its `top` with its parent scrolled past
 * that line, so an element resting at its own spot at the top of the page
 * doesn't count. Elements that are display: none (the context bar from lg, the
 * trail below it) or not sticky at this width never are.
 */
export function isPinned(element: Element): boolean {
  const style = getComputedStyle(element)
  if (style.position !== 'sticky' || style.display === 'none') return false
  const top = parseFloat(style.top)
  const parent = element.parentElement?.getBoundingClientRect()
  return Math.abs(element.getBoundingClientRect().top - top) < 1 && !!parent && parent.top < top - 1
}

/** Bottom of the lowest pinned bar, in viewport pixels. */
export function pinnedLine(): number {
  let line = 0
  for (const bar of document.querySelectorAll(BARS)) {
    if (isPinned(bar)) line = Math.max(line, bar.getBoundingClientRect().bottom)
  }
  return line
}
