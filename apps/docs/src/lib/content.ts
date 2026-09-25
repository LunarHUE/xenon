import { getCollection, type CollectionEntry } from 'astro:content'

export type DocEntry = CollectionEntry<'docs'>
export type ComponentEntry = CollectionEntry<'components'>

/** Component tabs in display order. The file name picks the tab. */
export const TABS = ['overview', 'usage', 'api', 'accessibility'] as const
export type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  usage: 'Usage',
  api: 'API',
  accessibility: 'Accessibility',
}

export type ComponentGroup = NonNullable<ComponentEntry['data']['group']>

export const GROUP_LABELS: Record<ComponentGroup, string> = {
  actions: 'Actions',
  forms: 'Forms',
  structure: 'Structure',
}

/** A link to another page, for tabs and prev/next. */
export interface PageLink {
  label: string
  href: string
}

export interface ComponentTab extends PageLink {
  tab: Tab
  entry: ComponentEntry
}

/** One component with its header fields and the tabs that have a file. */
export interface ComponentDoc {
  slug: string
  title: string
  description: string
  group: ComponentGroup
  package: string
  status: 'stable' | 'draft'
  tabs: ComponentTab[]
}

export const docHref = (entry: DocEntry) => `/docs/${entry.id}/`

export const componentHref = (slug: string, tab: Tab = 'overview') =>
  tab === 'overview' ? `/docs/components/${slug}/` : `/docs/components/${slug}/${tab}/`

const byOrder = (a: DocEntry, b: DocEntry) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title)

/** Start-here pages, then guides, each in sidebar order. */
export async function getDocs(): Promise<DocEntry[]> {
  const entries = await getCollection('docs')
  const section = (name: DocEntry['data']['section']) =>
    entries.filter((entry) => entry.data.section === name).sort(byOrder)
  return [...section('start'), ...section('guides')]
}

const isTab = (name: string): name is Tab => (TABS as readonly string[]).includes(name)

const HEADER_FIELDS = ['title', 'description', 'group', 'package', 'status'] as const

/** Every component, sorted by title. Throws on a misnamed tab or a bad overview. */
export async function getComponents(): Promise<ComponentDoc[]> {
  const bySlug = new Map<string, ComponentEntry[]>()
  for (const entry of await getCollection('components')) {
    const [slug, tab] = entry.id.split('/')
    if (!isTab(tab)) {
      throw new Error(`components/${entry.id}: the file name must be one of ${TABS.join(', ')}`)
    }
    if (tab !== 'overview') {
      const stray = HEADER_FIELDS.filter((field) => entry.data[field] !== undefined)
      if (stray.length) {
        throw new Error(`components/${entry.id}: move ${stray.join(', ')} to overview.mdx`)
      }
    }
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), entry])
  }

  const components = [...bySlug].map(([slug, entries]): ComponentDoc => {
    const overview = entries.find((entry) => entry.id.endsWith('/overview'))
    const { title, description, group } = overview?.data ?? {}
    if (!overview || !title || !description || !group) {
      throw new Error(`components/${slug}/overview.mdx needs title, description and group`)
    }
    const tabs = TABS.flatMap((tab) => {
      const entry = entries.find((candidate) => candidate.id === `${slug}/${tab}`)
      return entry ? [{ tab, entry, label: TAB_LABELS[tab], href: componentHref(slug, tab) }] : []
    })
    return {
      slug,
      title,
      description,
      group,
      package: overview.data.package ?? `@xenon-ui/solid/${slug}`,
      status: overview.data.status ?? 'stable',
      tabs,
    }
  })
  return components.sort((a, b) => a.title.localeCompare(b.title))
}

/** The pages either side of `pages[index]`. */
export function pagination(
  pages: readonly PageLink[],
  index: number
): { previous?: PageLink; next?: PageLink } {
  const link = (page?: PageLink) => page && { label: page.label, href: page.href }
  return { previous: link(pages[index - 1]), next: link(pages[index + 1]) }
}
