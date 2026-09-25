import { defineMdastPlugin } from 'satteri'

/**
 * Turn fenced code in MDX into `<Code>` elements so fences render through
 * CodeBlock instead of Astro's built-in shiki. The page supplies `Code` through
 * MDX `components`.
 *
 * Fence meta sets the header title and collapse behavior:
 *
 *     ```tsx title="button.tsx" collapsible open
 *
 * A fence directly inside `<Prop>` is that row's sample, so it goes in the
 * `code` slot.
 *
 * Only register this for MDX. Plain markdown can't hold JSX nodes.
 */

type Attribute = { type: 'mdxJsxAttribute'; name: string; value: string | null }

/** A `null` value is a bare boolean attribute. */
const attribute = (name: string, value: string | null = null): Attribute => ({
  type: 'mdxJsxAttribute',
  name,
  value,
})

function parseMeta(meta: string): Attribute[] {
  const attributes: Attribute[] = []
  const title = /title="([^"]*)"/.exec(meta)?.[1]
  if (title) attributes.push(attribute('title', title))
  const flags = meta.replace(/title="[^"]*"/, '').split(/\s+/)
  if (flags.includes('collapsible')) attributes.push(attribute('collapsible'))
  if (flags.includes('open')) attributes.push(attribute('defaultOpen'))
  return attributes
}

export const codeFences = defineMdastPlugin({
  name: 'xenon-code-fences',
  code(node, ctx) {
    const parent = ctx.parent(node)
    const inProp = parent.type === 'mdxJsxFlowElement' && parent.name === 'Prop'
    ctx.replaceNode(node, {
      type: 'mdxJsxFlowElement',
      name: 'Code',
      attributes: [
        attribute('code', node.value),
        attribute('lang', node.lang ?? 'text'),
        ...parseMeta(node.meta ?? ''),
        ...(inProp ? [attribute('slot', 'code')] : []),
      ],
      children: [],
    })
  },
})
