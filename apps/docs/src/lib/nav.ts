import { componentHref, docHref, getComponents, getDocs } from './content'

/** One navigation row. */
export interface NavLink {
  label: string
  href: string
}

/** A titled group of rows. */
export interface NavSection {
  label: string
  links: NavLink[]
  /** Fold the group behind a disclosure. */
  collapsible?: boolean
}

/** Component playgrounds for working on the docs UI. Not part of the content. */
const playgrounds: NavSection = {
  label: 'Playgrounds',
  collapsible: true,
  links: [
    { label: 'Button', href: '/dev/button/' },
    { label: 'Tabs', href: '/dev/tabs/' },
    { label: 'Combobox', href: '/dev/combobox/' },
    { label: 'Breadcrumb', href: '/dev/breadcrumb/' },
    { label: 'Code block', href: '/dev/codeblock/' },
    { label: 'Drawer', href: '/dev/drawer/' },
    { label: 'Tooltip', href: '/dev/tooltip/' },
    { label: 'Toast', href: '/dev/toast/' },
    { label: 'Sidebar', href: '/dev/sidebar/' },
  ],
}

/** The sidebar, built from the content collections. Sections with no pages are left out. */
export async function getNavigation(): Promise<NavSection[]> {
  const docs = await getDocs()
  const docLinks = (section: 'start' | 'guides') =>
    docs
      .filter((entry) => entry.data.section === section)
      .map((entry) => ({ label: entry.data.title, href: docHref(entry) }))
  const components = await getComponents()
  const sections: NavSection[] = [
    { label: 'Start here', links: docLinks('start') },
    { label: 'Guides', links: docLinks('guides') },
    {
      label: 'Components',
      links: components.map((component) => ({
        label: component.title,
        href: componentHref(component.slug),
      })),
    },
    playgrounds,
  ]
  return sections.filter((section) => section.links.length > 0)
}

/**
 * The sidebar row for `pathname`: the longest link that prefixes it, so every
 * tab of a component marks the component's row.
 */
export function currentHref(sections: NavSection[], pathname: string): string | undefined {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`
  let best: string | undefined
  for (const { href } of sections.flatMap((section) => section.links)) {
    if (path.startsWith(href) && href.length > (best?.length ?? 0)) best = href
  }
  return best
}
