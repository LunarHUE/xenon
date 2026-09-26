import { defineMdastPlugin } from 'satteri'
import { sectionId, type PageEntry, type PageSection } from './sections'

type Element = {
  type: string
  name?: string | null
  attributes?: { type: string; name?: string; value?: unknown }[]
  children?: readonly unknown[]
  value?: unknown
}

type Frontmatter = { sections: PageSection[]; entries: PageEntry[] }

/** A string-literal attribute, or undefined for a missing or expression value. */
const literal = (node: Element, name: string) => {
  const value = node.attributes?.find(
    (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === name
  )?.value
  return typeof value === 'string' ? value : undefined
}

/** A `<Props>` group's title, which defaults to "Props" like the component. */
const groupTitle = (node: Element) => literal(node, 'title') ?? 'Props'

/** Plain text of a node: text and inline code values, with markup dropped. */
const plain = (node: Element): string =>
  typeof node.value === 'string'
    ? node.value
    : (node.children ?? []).map((child) => plain(child as Element)).join('')

/** The element's first paragraph on one line, for search results. */
const lead = (node: Element) => {
  const paragraph = node.children?.find((child) => (child as Element).type === 'paragraph') as
    Element | undefined
  return paragraph ? plain(paragraph).replace(/\s+/g, ' ').trim() : ''
}

/**
 * Collect each `<Section title>`, `<Props>` group and `<Prop name>` in an MDX
 * page for the "On this page" list.
 *
 * Sections are JSX, not markdown headings, so Astro's `headings` never sees
 * them. The list goes on the module's frontmatter as `sections`, which
 * `render()` hands back as `remarkPluginFrontmatter`. It's built at compile
 * time, so the list is in the server HTML.
 *
 * A page with one props group lists its props too. With several (one per part
 * of a compound component) the list keeps to the groups, and each prop's
 * anchor is prefixed with its group's so two parts can both have `as`. The
 * prefixed id is written onto the `<Prop>` here, so the link and the heading
 * can't disagree.
 *
 * The same walk fills `entries` for the search index: each Section with its
 * first paragraph, each Prop with its type, part and description, and each
 * `<Example>` with the Section it sits in. Examples have no anchor of their
 * own, so they link to that Section.
 *
 * Titles, names and ids must be string literals. An expression can't be read
 * here, so that entry is left out of the list with a warning.
 */
export const sectionToc = defineMdastPlugin({
  name: 'xenon-section-toc',
  before(_root, ctx) {
    const astro = ctx.data.astro as { frontmatter: Record<string, unknown> } | undefined
    if (astro) {
      astro.frontmatter.sections = []
      astro.frontmatter.entries = []
    }
  },
  mdxJsxFlowElement(node, ctx) {
    if (!['Section', 'Props', 'Prop', 'Example'].includes(node.name ?? '')) return
    const astro = ctx.data.astro as { frontmatter: Frontmatter } | undefined
    if (!astro) return
    const { sections, entries } = astro.frontmatter

    if (node.name === 'Example') {
      const name = literal(node, 'name')
      if (!name) return
      let section: Element | undefined = ctx.parent(node) as Element
      while (section && !(section.type === 'mdxJsxFlowElement' && section.name === 'Section')) {
        section = ctx.parent(section as never) as Element | undefined
      }
      const title = section && literal(section, 'title')
      entries.push({
        kind: 'example',
        id: title && (literal(section!, 'id') ?? sectionId(title)),
        title: `${name.split('/').at(-1)}.tsx`,
        section: title,
        text: literal(node, 'caption') ?? '',
      })
      return
    }

    if (node.name === 'Prop') {
      const name = literal(node, 'name')
      if (!name) {
        ctx.report({
          message: 'Prop name is not a string literal; left out of the TOC',
          node,
          severity: 'warning',
        })
        return
      }
      const parent = ctx.parent(node) as Element
      const group =
        parent.type === 'mdxJsxFlowElement' && parent.name === 'Props'
          ? groupTitle(parent)
          : undefined
      let id = literal(node, 'id')
      if (!id) {
        id = group && group !== 'Props' ? `${sectionId(group)}-${sectionId(name)}` : sectionId(name)
        ctx.replaceNode(node, {
          ...node,
          attributes: [...node.attributes, { type: 'mdxJsxAttribute', name: 'id', value: id }],
        })
      }
      sections.push({ id, title: name, kind: 'prop' })
      entries.push({
        kind: 'prop',
        id,
        title: name,
        type: literal(node, 'type') ?? '',
        group: group === 'Props' ? undefined : group,
        text: lead(node),
      })
      return
    }

    const title = node.name === 'Props' ? groupTitle(node) : literal(node, 'title')
    if (!title) {
      ctx.report({
        message: 'Section title is not a string literal; left out of the TOC',
        node,
        severity: 'warning',
      })
      return
    }
    const id = literal(node, 'id') ?? sectionId(title)
    sections.push(node.name === 'Props' ? { id, title, kind: 'props' } : { id, title })
    if (node.name === 'Section') entries.push({ kind: 'section', id, title, text: lead(node) })
  },
  after(_root, ctx) {
    const astro = ctx.data.astro as { frontmatter: Frontmatter } | undefined
    if (!astro) return
    const groups = astro.frontmatter.sections.filter((section) => section.kind === 'props').length
    if (groups > 1) {
      astro.frontmatter.sections = astro.frontmatter.sections.filter(
        (section) => section.kind !== 'prop'
      )
    }
  },
})
