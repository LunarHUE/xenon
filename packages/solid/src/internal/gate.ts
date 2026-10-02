import { callEventHandler } from './events'

/** Event names suppressed for noninteractive controls. */
const pointerHandlers = ['onclick', 'onauxclick', 'ondblclick', 'onpointerdown', 'onmousedown']

/** Keyboard events gated only for activation keys. */
const keyHandlers = ['onkeydown', 'onkeyup']

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
 * author. Event names are case-insensitive after the lowercase on prefix, and
 * handlers use Solid's native function and bound-tuple forms. Apply once
 * to a fresh author-props copy before merging core handlers with spread.
 * Wrappers do not prevent defaults or stop propagation; core listeners own those
 * decisions. Reapplying the helper to the same object nests wrappers.
 *
 * @param props - Object mutated in place; nonhandler values remain unchanged.
 * @param interactive - Read during every wrapped event, so it can consult current reactive state.
 */
export function gate(props: Record<string, unknown>, interactive: () => boolean): void {
  for (const name of Object.keys(props)) {
    if (!name.startsWith('on')) continue
    const eventName = name.toLowerCase()
    const pointer = pointerHandlers.includes(eventName)
    const keyboard = keyHandlers.includes(eventName)
    if (!pointer && !keyboard) continue
    const user = props[name]
    if (user == null) continue
    props[name] = (event: Event) => {
      if (interactive() || (keyboard && !isActivationKey((event as KeyboardEvent).key))) {
        callEventHandler(user, event)
      }
    }
  }
}
