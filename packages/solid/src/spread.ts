import type { AnyPart } from '@xenon/core'

/** Callable event shape used after erasing the core part's host-specific event type. */
type Handler = (event: Event) => void

/**
 * Merges a core part with author props for JSX spread without mutating either input.
 * Author attributes override core attributes, including explicit undefined values.
 * For matching event props, the author handler runs first; the core handler runs
 * only if the event default remains unprevented.
 *
 * @remarks
 * Matches author keys beginning with lowercase `on` case-insensitively against
 * core DOM event names, preserving the author's spelling. Use one spelling per
 * event; duplicate case variants are not removed. Without a match, the core
 * listener is copied to an `on`-prefixed prop without a cancellation wrapper.
 *
 * Matching author handlers and supplied core entries must be callable functions;
 * this helper does not interpret tuples or guard undefined handlers. Recompute
 * the merge when inputs change so Solid's JSX spread can apply new values.
 * This helper creates no reactive computation and binds no DOM listeners. Call it
 * from a tracked scope when its inputs are reactive.
 *
 * @returns A new shallow props object with composed handlers for matching events.
 */
export function spread(
  part: AnyPart,
  props: Record<string, unknown> = {}
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...part.attrs, ...props }
  const userKeys = new Map<string, string>()
  for (const key of Object.keys(props)) {
    if (key.startsWith('on')) userKeys.set(key.toLowerCase(), key)
  }
  for (const name in part.on) {
    const core = part.on[name as keyof typeof part.on] as Handler
    const userKey = userKeys.get(`on${name}`)
    if (!userKey) {
      out[`on${name}`] = core
      continue
    }
    const user = props[userKey] as Handler
    out[userKey] = (event: Event) => {
      user(event)
      if (!event.defaultPrevented) core(event)
    }
  }
  return out
}
