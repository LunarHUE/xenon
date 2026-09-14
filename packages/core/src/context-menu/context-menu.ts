import { menu } from '../menu/menu'
import type { MenuOptions } from '../menu/menu'
import type { PartProps } from '../part'

/** Viewport point supplied by an opening pointer gesture. */
export interface ContextMenuPoint {
  /** Horizontal client coordinate. */
  x: number
  /** Vertical client coordinate. */
  y: number
}
/** Menu options with a region opening gesture instead of a disclosure button. */
export interface ContextMenuOptions<T> extends MenuOptions<T> {
  /** Disable opening gestures while allowing the browser's context menu. */
  triggerDisabled?: boolean
  /** Request opening at a pointer point; undefined requests keyboard placement. */
  onOpenRequest?: (point?: ContextMenuPoint) => void
}
/** Reuses menu item semantics and supplies cancellable context and keyboard gestures. Timers and geometry belong to the adapter. */
export function contextMenu<T>(options: ContextMenuOptions<T>) {
  const shared = menu(options)
  const trigger: PartProps<'div'> = {
    attrs: {
      id: options.ids?.trigger,
      'data-state': shared.state.open ? 'open' : 'closed',
      'data-disabled': options.triggerDisabled ? '' : undefined,
    },
    on: {
      contextmenu(event) {
        if (event.defaultPrevented || options.triggerDisabled) return
        event.preventDefault()
        options.onOpenRequest?.({ x: event.clientX, y: event.clientY })
      },
      keydown(event) {
        if (event.defaultPrevented || options.triggerDisabled || event.isComposing) return
        if (event.altKey || event.ctrlKey || event.metaKey) return
        if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return
        event.preventDefault()
        options.onOpenRequest?.()
      },
    },
  }
  return { state: shared.state, parts: { ...shared.parts, trigger } }
}
