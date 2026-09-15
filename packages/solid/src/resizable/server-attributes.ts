import { escape, resolveSSRNode, ssrAttribute } from '@solidjs/web'
import type { JSX } from '@solidjs/web'

/** Attribute names eligible for deferred resizable serialization. */
export type Association = string

/** Solid SSR node layouts preserved while finalizing association markers. */
interface ServerNode {
  /** Serialized template segments rewritten in place to contain final attributes. */
  t: string[]
  /** Pending render functions wrapped so later streamed output receives the same finalization. */
  h: (() => unknown)[]
  /** Pending promises retained unchanged for Solid's renderer. */
  p: unknown[]
}

/**
 * Creates one server-only association collector for a resizable render.
 *
 * @remarks
 * Attribute reads are deferred until native wrappers have serialized their children,
 * allowing later sibling registrations to contribute IDs. A fresh random namespace
 * identifies temporary attribute values without changing actual element IDs.
 * Requires the server renderer's resolveSSRNode and crypto.randomUUID support.
 * This rewrites serialized template segments rather than parsing HTML or rerendering
 * children; pending holes remain under Solid's streaming lifecycle.
 */
export function serverAttributes() {
  // These are temporary serialization markers, never element IDs. A fresh namespace
  // prevents authored markup and independently rendered layouts from matching them.
  const namespace = `tenon-resizable-${crypto.randomUUID()}`
  const attributes = new Map<string, () => string>()

  /**
   * Allocates a marker to place in one supported attribute. The reader runs during
   * finalization and must remain valid for later streaming holes. Final values use
   * Solid's attribute escaping/serialization, including omission for undefined.
   */
  const attribute = (name: Association, read: () => string | undefined): string => {
    const marker = `${namespace}-${attributes.size}`
    attributes.set(` ${name}="${marker}"`, () => ssrAttribute(name, escape(read(), true)))
    return marker
  }

  /**
   * Resolves SSR output, reads every current association once for this pass, and
   * replaces exact marker attributes in its template segments. Wraps pending holes
   * recursively and copies their enumerable annotations; mutates the resolved node.
   */
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

  return {
    /** Register a deferred attribute reader and return its temporary serialization value. */
    attribute,
    /** Finalize an SSR node and arrange finalization of its later streaming holes. */
    finish,
  }
}
