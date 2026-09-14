import { button } from '@tenon/core'
import type { AnyPart } from '@tenon/core'

/**
 * Add generic-button keyboard behavior to a disclosure part when its host is nonnative.
 *
 * @param part - Current disclosure attributes and handlers; its click handler owns
 * the actual disclosure action and must gate disabled activation itself.
 * @param native - True for a host that already has native button keyboard behavior.
 * Returns the original part by identity in this case; no host detection is performed.
 * @returns The original native part, or a new part with generic activation attributes
 * taking precedence and type/disabled explicitly cleared.
 * @remarks
 * Generic disabled state is derived solely from Boolean(part.attrs.disabled), not
 * aria-disabled or pending. Generic button role/tabindex/ARIA and data hooks overwrite
 * overlapping disclosure attributes. Non-keyboard handlers, including click, are
 * preserved unchanged; the generic button's click-blocking handler is not installed.
 *
 * Generic keyboard handlers run first, then the disclosure's corresponding handler
 * only if the event default remains unprevented. Enter keydown and Space keyup
 * synthesize a click on currentTarget when enabled; repeated Enter keydown does not.
 * Enter/Space keydown and Space keyup prevent default even when disabled. Modifiers
 * and composition are not filtered. Invoke the returned keyboard handlers during DOM
 * dispatch with an HTML currentTarget;
 * an outer adapter honoring author cancellation must skip these handlers when canceled.
 * Rebuild after part attributes or handlers change; this helper installs no listeners.
 */
export function disclosureTrigger(part: AnyPart, native: boolean): AnyPart {
  if (native) return part
  const activation = button({
    host: 'generic',
    disabled: Boolean((part.attrs as Record<string, unknown>)['disabled']),
  }).parts.root
  const attrs = { ...part.attrs, ...activation.attrs, type: undefined, disabled: undefined }
  return {
    attrs,
    on: {
      ...part.on,
      keydown(event: KeyboardEvent) {
        activation.on.keydown?.(event as never)
        if (!event.defaultPrevented) part.on.keydown?.(event as never)
      },
      keyup(event: KeyboardEvent) {
        activation.on.keyup?.(event as never)
        if (!event.defaultPrevented) part.on.keyup?.(event as never)
      },
    },
  }
}
