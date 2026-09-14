import type { menu } from '@tenon/core/menu'
import { createContext, useContext } from 'solid-js'
import type { Presence } from '../internal/presence'

export interface MenuEntry {
  el?: HTMLElement
  disabled(): boolean
  text(): string
  openSub?: () => void
}
export interface MenuContextValue {
  parent?: MenuContextValue
  open(): boolean
  change(open: boolean, edge?: 'first' | 'last'): void
  closeAll(restore?: boolean): void
  restore(): boolean
  dir(): 'ltr' | 'rtl'
  engine(): ReturnType<typeof menu<MenuEntry>>
  life: Presence
  register(entry: MenuEntry): () => void
  focus(entry?: MenuEntry): void
  initial(): HTMLElement | undefined
  trigger(): HTMLElement | undefined
  setTrigger(el: HTMLElement): void
  content(): HTMLElement | undefined
  setContent(el: HTMLElement): void
  association(
    name: 'aria-controls' | 'aria-labelledby',
    read: () => string | undefined
  ): string | undefined
  triggerId(): string
  contentId(): string
  setContentId(id: () => string): () => void
  setTriggerId(id: () => string): () => void
  enter(): void
  leave(): void
}
export const MenuContext = createContext<MenuContextValue>()
export function useMenu(name: string): MenuContextValue {
  const context = useContext(MenuContext)
  if (!context) throw new Error(`${name} must be rendered inside <Menu>`)
  return context
}
