import type { menu } from '@tenon/core/menu'
import { createContext, useContext } from 'solid-js'
import type { Presence } from '../internal/presence'

/** Stable registered menu-item identity and live typeahead/activation state. */
export interface MenuEntry {
  /** Rendered item host used for ordering and synchronous navigation focus. */
  el?: HTMLElement
  /** Current activation/typeahead exclusion flag; disabled entries remain arrow-navigation destinations. */
  disabled(): boolean
  /** Current searchable label; the core trims and locale-lowercases it for prefix matching. */
  text(): string
  /** Optional submenu opener stored by submenu items; the root navigation engine does not invoke it. */
  openSub?: () => void
}
/** Root/submenu state, focus helpers, registration, and delayed-close policies. */
export interface MenuContextValue {
  /** Logical parent supplied by Menu.Sub; absent for an independent Menu root. */
  parent?: MenuContextValue
  /** Effective visibility, gated by every parent before controlled/uncontrolled local state. */
  open(): boolean
  /** Requests visibility; opening an already-open menu focuses the requested edge without notifying. Closing clears typeahead. */
  change(open: boolean, edge?: 'first' | 'last'): void
  /** Requests closure recursively through parents, setting focus-restoration intent on each. Defaults to restoring. */
  closeAll(restore?: boolean): void
  /** Whether content release should attempt restoration; consumed by the hosting adapter. */
  restore(): boolean
  /** Own direction, then parent direction, then the trigger nearest dir attribute; defaults to ltr. */
  dir(): 'ltr' | 'rtl'
  /** Current core menu state/parts; server reads recompute directly. */
  engine(): ReturnType<typeof menu<MenuEntry>>
  /** Owned presence lifecycle used for mounted content and exit observation. */
  life: Presence
  /** Adds an entry sorted by known DOM hosts and returns idempotent removal. Caller owns cleanup; DOM moves alone do not re-sort. */
  register(entry: MenuEntry): () => void
  /** Sets active identity and synchronously focuses its host with preventScroll; undefined only clears active identity. */
  focus(entry?: MenuEntry): void
  /** Host at the requested first/last edge, including disabled entries; falls back to content if unavailable. */
  initial(): HTMLElement | undefined
  /** Latest trigger host, used for direction inference and restoration. */
  trigger(): HTMLElement | undefined
  /** Replaces the stored trigger host; there is no stack or clear operation. */
  setTrigger(el: HTMLElement): void
  /** Latest content host; retained until replaced. */
  content(): HTMLElement | undefined
  /** Records content for both direct access and presence exit-animation observation. */
  setContent(el: HTMLElement): void
  /** Reads directly on the client or allocates an SSR association marker for deferred finalization. */
  association(
    name: 'aria-controls' | 'aria-labelledby',
    read: () => string | undefined
  ): string | undefined
  /** Current trigger ID getter, otherwise the generated fallback. */
  triggerId(): string
  /** Current content ID getter, otherwise the generated fallback. */
  contentId(): string
  /** Installs an ID reader. Cleanup restores the generated fallback only if that reader still owns the slot. */
  setContentId(id: () => string): () => void
  /** Installs an ID reader. Cleanup restores the generated fallback only if that reader still owns the slot. */
  setTriggerId(id: () => string): () => void
  /** Cancels this hover-close timer and recursively cancels ancestor timers. */
  enter(): void
  /** Schedules local close after 200ms with restoration disabled; a later leave replaces the timer. */
  leave(): void
}
/** Nearest root or submenu context; undefined outside a provider. */
export const MenuContext = createContext<MenuContextValue>()
/**
 * Reads the enclosing menu within the current Solid owner.
 * @param name - Part name included in the missing-provider error.
 * @throws If no Menu context is available.
 */
export function useMenu(name: string): MenuContextValue {
  const context = useContext(MenuContext)
  if (!context) throw new Error(`${name} must be rendered inside <Menu>`)
  return context
}
