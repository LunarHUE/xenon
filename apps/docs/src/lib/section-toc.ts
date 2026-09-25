import { defineMdastPlugin } from 'satteri'
import { sectionId, type PageSection } from './sections'

/**
 * Collect each `<Section title>` in an MDX page for the "On this page" list.
 *
 * Sections are JSX, not markdown headings, so Astro's `headings` never sees
 * them. The list goes on the module's frontmatter as `sections`, which
 * `render()` hands back as `remarkPluginFrontmatter`. It's built at compile
 * time, so the list is in the server HTML.
 *
 * Titles and ids must be string literals. An expression can't be read here, so
 * that section is left out of the list with a warning.
 */
export const sectionToc = defineMdastPlugin({
  name: 'xenon-section-toc',
  before(_root, ctx) {
    const astro = ctx.data.astro as { frontmatter: Record<string, unknown> } | undefined
    if (astro) astro.frontmatter.sections = []
  },
  mdxJsxFlowElement(node, ctx) {
    if (node.name !== 'Section') return
    const astro = ctx.data.astro as { frontmatter: { sections: PageSection[] } } | undefined
    if (!astro) return
    const literal = (name: string) => {
      const value = node.attributes.find(
        (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === name
      )?.value
      return typeof value === 'string' ? value : undefined
    }
    const title = literal('title')
    if (!title) {
      ctx.report({
        message: 'Section title is not a string literal; left out of the TOC',
        node,
        severity: 'warning',
      })
      return
    }
    astro.frontmatter.sections.push({ id: literal('id') ?? sectionId(title), title })
  },
})
