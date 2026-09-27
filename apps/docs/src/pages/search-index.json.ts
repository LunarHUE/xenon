import type { APIRoute } from 'astro'
import { render } from 'astro:content'
import { componentHref, docHref, getComponents, getDocs } from '../lib/content'
import { DOCS_VERSION, type SearchIndex, type SearchResult } from '../lib/search'
import { pageEntries, type PageEntry } from '../lib/sections'

/** The results inside one page: its sections, props, data attributes and examples. */
function inner(entries: PageEntry[], href: string, path: string[]): SearchResult[] {
  return entries.map((entry): SearchResult => {
    const anchor = entry.id ? `${href}#${entry.id}` : href
    switch (entry.kind) {
      case 'section':
        return { type: 'Section', title: entry.title, path, href: anchor, text: entry.text }
      case 'prop':
        return {
          type: 'Property',
          title: entry.title,
          path: entry.group ? [...path, entry.group] : path,
          href: anchor,
          text: entry.text,
          detail: entry.type,
        }
      case 'attribute':
        return {
          type: 'Attribute',
          title: entry.title,
          path: entry.group ? [...path, entry.group] : path,
          href: anchor,
          text: entry.text,
        }
      case 'example':
        return {
          type: 'Example',
          title: entry.title,
          path: entry.section ? [...path, entry.section] : path,
          href: anchor,
          text: entry.text,
        }
    }
  })
}

/**
 * Everything the search palette can find, built once at build time from the
 * same compiled MDX the pages render. The section-toc plugin has already
 * collected each page's sections, props and examples; this adds the pages
 * themselves and a breadcrumb path to every result.
 */
export const GET: APIRoute = async () => {
  const results: SearchResult[] = []

  for (const entry of await getDocs()) {
    const guide = entry.data.section === 'guides'
    const path = [guide ? 'Guides' : 'Start here']
    const href = docHref(entry)
    results.push({
      type: guide ? 'Guide' : 'Page',
      title: entry.data.title,
      path,
      href,
      text: entry.data.description,
    })
    const { remarkPluginFrontmatter } = await render(entry)
    results.push(...inner(pageEntries(remarkPluginFrontmatter), href, [...path, entry.data.title]))
  }

  for (const component of await getComponents()) {
    for (const tab of component.tabs) {
      const path = ['Components', component.title]
      const overview = tab.tab === 'overview'
      results.push({
        type: 'Page',
        title: overview ? component.title : `${component.title} ${tab.label}`,
        path: overview ? ['Components'] : path,
        href: componentHref(component.slug, tab.tab),
        text: overview ? component.description : '',
      })
      const { remarkPluginFrontmatter } = await render(tab.entry)
      results.push(...inner(pageEntries(remarkPluginFrontmatter), tab.href, [...path, tab.label]))
    }
  }

  const index: SearchIndex = { version: DOCS_VERSION, results }
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json' },
  })
}
