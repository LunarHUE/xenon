import type { AnyPart } from '@tenon/core'

type Handler = (event: Event) => void

/**
 * Turns a core PartProps plus the user's own props into one object for JSX
 * spread. Attributes: the user's win. Event handlers: the user's runs first,
 * and calling `preventDefault()` in it skips the core handler, which is the
 * same escape hatch Radix and Base UI give.
 *
 * Solid matches handler names case-insensitively after `on`, so a user's
 * `onKeyDown` and core's `keydown` are the same listener and must be merged
 * under one key or both would bind. Solid re-applies handlers on spread, so a
 * memoized part can be spread directly.
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
