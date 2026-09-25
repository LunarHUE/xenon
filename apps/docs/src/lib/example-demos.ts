import { existsSync } from 'node:fs'
import { dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineMdastPlugin } from 'satteri'

/**
 * Fill each `<Example name="button/pending" />` in an MDX page with its live demo.
 *
 * Astro only hydrates a component it can trace to an import in the same file,
 * so `Example.astro` can't look the demo up by name at render time. This plugin
 * writes that import into the page instead, as if the author had typed it:
 *
 *     import ExampleDemo0 from '../../../examples/button/pending.tsx'
 *     <Example name="button/pending"><ExampleDemo0 client:visible /></Example>
 *
 * An unstyled twin (`pending.unstyled.tsx`) goes in the `unstyled` slot the same
 * way. The source shown under the demo is loaded by `Example.astro` itself.
 */

/** Demos live in src/examples/<component>/<name>.tsx. */
export const EXAMPLES_DIR = fileURLToPath(new URL('../examples/', import.meta.url))

export const exampleDemos = defineMdastPlugin({
  name: 'xenon-example-demos',
  mdxJsxFlowElement(node, ctx) {
    if (node.name !== 'Example' || node.children.length > 0) return
    const name = node.attributes.find(
      (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === 'name'
    )?.value
    if (typeof name !== 'string') {
      ctx.report({ message: 'Example name must be a string literal', node, severity: 'error' })
      return
    }
    if (!ctx.fileURL) return

    const page = dirname(fileURLToPath(ctx.fileURL))
    const file = (suffix: string) => `${EXAMPLES_DIR}${name}${suffix}.tsx`
    const specifier = (path: string) => {
      const relativePath = relative(page, path)
      return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
    }
    if (!existsSync(file(''))) {
      ctx.report({ message: `No example at src/examples/${name}.tsx`, node, severity: 'error' })
      return
    }

    const count = ((ctx.data.exampleDemos as number | undefined) ?? 0) + 1
    ctx.data.exampleDemos = count
    const styled = `ExampleDemo${count}`
    const unstyled = `ExampleDemo${count}Unstyled`
    const hasTwin = existsSync(file('.unstyled'))

    const imports = [`import ${styled} from '${specifier(file(''))}'`]
    const children = [`<${styled} client:visible />`]
    if (hasTwin) {
      imports.push(`import ${unstyled} from '${specifier(file('.unstyled'))}'`)
      children.push(`<${unstyled} slot="unstyled" client:visible />`)
    }
    const attributes = node.attributes
      .map((attribute) =>
        attribute.type === 'mdxJsxAttribute' && typeof attribute.value === 'string'
          ? `${attribute.name}=${JSON.stringify(attribute.value)}`
          : attribute.type === 'mdxJsxAttribute' && attribute.value === null
            ? attribute.name
            : ''
      )
      .join(' ')

    // Imports have to sit at the top level of the module, not inside a Section.
    ctx.data.exampleImports = [...((ctx.data.exampleImports as string[]) ?? []), ...imports]
    ctx.replaceNode(node, {
      raw: `<Example ${attributes}>\n${children.join('\n')}\n</Example>`,
    })
  },
  after(root, ctx) {
    const imports = ctx.data.exampleImports as string[] | undefined
    if (imports?.length) ctx.prependChild(root, { raw: imports.join('\n') })
  },
})
