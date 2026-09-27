/** One navigation row. */
export interface NavLink {
  label: string
  href: string
}

/** A titled group of rows. */
export interface NavSection {
  label: string
  links: NavLink[]
}

/**
 * The sidebar row for `pathname`: the longest link that prefixes it, so every
 * tab of a component marks the component's row. Kept apart from nav.ts, which
 * reads the content collections, so the sidebar island can import it.
 */
export function currentHref(sections: NavSection[], pathname: string): string | undefined {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`
  let best: string | undefined
  for (const { href } of sections.flatMap((section) => section.links)) {
    if (path.startsWith(href) && href.length > (best?.length ?? 0)) best = href
  }
  return best
}
