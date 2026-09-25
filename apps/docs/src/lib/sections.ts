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
