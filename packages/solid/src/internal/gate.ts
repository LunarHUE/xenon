/** Author callback whose event type is erased while installing the interaction gate. */
type Handler = (event: Event) => void

/** Exact prop spellings whose callbacks are suppressed for noninteractive controls. */
const pointerHandlers = [
  'onClick',
  'onAuxClick',
  'onDblClick',
  'onPointerDown',
  'onMouseDown',
] as const

/** Exact keyboard prop spellings gated only for activation keys. */
const keyHandlers = ['onKeyDown', 'onKeyUp'] as const

/** Keys treated as activation by the author-handler gate. */
function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' '
}

/**
 * Replaces author handlers in a mutable props copy with interaction-aware wrappers.
 *
 * @remarks
 * Gates onClick, onAuxClick, onDblClick, onPointerDown, and onMouseDown entirely.
 * Gates onKeyDown/onKeyUp only for Enter and Space; other keys still reach the
 * author. Only these exact spellings and function values are wrapped. Apply once
 * to a fresh author-props copy before merging core handlers with spread.
 * Wrappers do not prevent defaults or stop propagation; core listeners own those
 * decisions. Reapplying the helper to the same object nests wrappers.
 *
 * @param props - Object mutated in place; nonhandler values remain unchanged.
 * @param interactive - Read during every wrapped event, so it can consult current reactive state.
 */
export function gate(props: Record<string, unknown>, interactive: () => boolean): void {
  for (const name of pointerHandlers) {
    const user = props[name]
    if (typeof user !== 'function') continue
    const run = user as Handler
    props[name] = (event: Event) => {
      if (interactive()) run(event)
    }
  }
  for (const name of keyHandlers) {
    const user = props[name]
    if (typeof user !== 'function') continue
    const run = user as Handler
    props[name] = (event: Event) => {
      if (interactive() || !isActivationKey((event as KeyboardEvent).key)) run(event)
    }
  }
}
