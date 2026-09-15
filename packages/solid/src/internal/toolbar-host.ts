import type { AnyPart } from '@xenon/core'
import type { ValidComponent } from '@solidjs/web'
import { useContext } from 'solid-js'

import { ToolbarContext } from '../toolbar/context'

/** Identifies the built-in toolbar button without importing it into Button. */
export const toolbarHosts = new WeakSet<ValidComponent & object>()

/** Leaves generated focus behavior to a composed toolbar host, before author props merge. */
export function toolbarHost(as: () => ValidComponent | undefined) {
  const toolbar = useContext(ToolbarContext)
  const matches = () => !!toolbar && toolbarHosts.has(as() as ValidComponent & object)
  return {
    matches,
    part(part: AnyPart): AnyPart {
      if (!matches()) return part
      const attrs = { ...part.attrs }
      delete attrs.tabindex
      const keydown = part.on.keydown
      return {
        attrs,
        on: {
          ...part.on,
          ...(keydown && {
            keydown(event: KeyboardEvent) {
              const arrows =
                toolbar!.orientation() === 'horizontal'
                  ? ['ArrowLeft', 'ArrowRight']
                  : ['ArrowUp', 'ArrowDown']
              if (['Home', 'End', ...arrows].includes(event.key)) return
              keydown(event as never)
            },
          }),
        },
      }
    },
  }
}
