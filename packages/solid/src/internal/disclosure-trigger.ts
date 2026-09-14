import { button } from '@kit/core'
import type { AnyPart } from '@kit/core'

/** Reuse button activation for disclosure triggers with a non-native host. */
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
