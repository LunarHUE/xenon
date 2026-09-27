import { componentHref, docHref, getComponents, getDocs } from './content'
import type { NavSection } from './nav-links'

export { currentHref, type NavLink, type NavSection } from './nav-links'

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
  ]
  return sections.filter((section) => section.links.length > 0)
}

