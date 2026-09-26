/**
 * Page sections, shared by `<Section>` and the "On this page" list so a heading
 * id and the link pointing at it come from the same function.
 */

/** One `<Section>`, `<Props>` group or `<Prop>` on a page, in document order. */
export interface PageSection {
  id: string
  title: string
  /** Set for API entries. Sections leave it out. */
  kind?: 'props' | 'prop'
}

/**
 * One searchable thing inside a page, collected alongside the TOC. The search
 * index adds the page's own title and path around these.
 */
export type PageEntry =
  | { kind: 'section'; id: string; title: string; text: string }
  | { kind: 'prop'; id: string; title: string; type: string; group?: string; text: string }
  | { kind: 'example'; id?: string; title: string; section?: string; text: string }

/** The anchor for a section title: lowercase, runs of anything else become one dash. */
export const sectionId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * The sections the `sectionToc` plugin collected, read from the
 * `remarkPluginFrontmatter` that `render()` returns.
 */
export const pageSections = (frontmatter: Record<string, unknown>): PageSection[] =>
  Array.isArray(frontmatter.sections) ? (frontmatter.sections as PageSection[]) : []

/** The search entries the `sectionToc` plugin collected, from the same frontmatter. */
export const pageEntries = (frontmatter: Record<string, unknown>): PageEntry[] =>
  Array.isArray(frontmatter.entries) ? (frontmatter.entries as PageEntry[]) : []
