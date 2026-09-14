import { escape, resolveSSRNode, ssrAttribute } from '@solidjs/web'
import type { JSX } from '@solidjs/web'

export type Association = 'for' | 'aria-labelledby' | 'aria-describedby' | 'aria-controls'

interface ServerNode {
  t: string[]
  h: (() => unknown)[]
  p: unknown[]
}

/** Finalize field references after native wrappers have serialized their children. */
export function serverAssociations() {
  // These are temporary serialization markers, never element IDs. A fresh namespace
  // prevents authored markup and independently rendered fields from matching them.
  const namespace = `tenon-field-${crypto.randomUUID()}`
  const attributes = new Map<string, () => string>()

  const attribute = (name: Association, read: () => string | undefined): string => {
    const marker = `${namespace}-${attributes.size}`
    attributes.set(` ${name}="${marker}"`, () => ssrAttribute(name, escape(read(), true)))
    return marker
  }

  const finish = (element: unknown): JSX.Element => {
    // Use Solid's resolver rather than rendering children again or parsing HTML.
    // Preserve its template segments and pending holes so streaming still owns them.
    const node = resolveSSRNode(element) as ServerNode
    const values = [...attributes].map(([marker, read]) => [marker, read()] as const)
    node.t = node.t.map((segment) => {
      for (const [marker, value] of values) segment = segment.replaceAll(marker, () => value)
      return segment
    })
    // Retain enumerable annotations carried by Solid's pending functions.
    node.h = node.h.map((hole) => Object.assign(() => finish(hole()), hole))
    return node as unknown as JSX.Element
  }

  return { attribute, finish }
}
