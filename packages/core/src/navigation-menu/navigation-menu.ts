import type { PartProps } from '../part'

/** Caller-owned disclosure selection. Null means closed; all strings are valid item values. */
export interface NavigationMenuOptions {
  /** Selected panel, defaulting to null. */
  value?: string | null
  /** Visual axis, published as data-orientation without composite ARIA. */
  orientation?: 'horizontal' | 'vertical'
  /** Stable paired IDs supplied by the adapter. */
  ids?: { trigger(value: string): string; content(value: string): string }
  /** Synchronous selection request; the caller stores the next value. */
  onValueChange?: (value: string | null) => void
}

/** Compute native navigation/disclosure semantics without DOM focus, hover timers, or menu roles. */
export function navigationMenu(options: NavigationMenuOptions = {}) {
  const value = options.value ?? null
  const flags = (selected: boolean) => ({
    'data-state': selected ? 'open' : 'closed',
    'data-orientation': options.orientation ?? 'horizontal',
  })
  const root: PartProps<'nav'> = { attrs: flags(value !== null), on: {} }
  const list: PartProps<'ul'> = { attrs: flags(value !== null), on: {} }
  return {
    state: { value, open: value !== null },
    parts: {
      root,
      list,
      trigger(item: string, disabled = false): PartProps<'button'> {
        const open = item === value
        return {
          attrs: {
            ...flags(open),
            type: 'button',
            disabled,
            id: options.ids?.trigger(item),
            'aria-expanded': open ? 'true' : 'false',
            'aria-controls': open ? options.ids?.content(item) : undefined,
            'data-disabled': disabled ? '' : undefined,
          },
          on: {
            click(event) {
              if (!disabled && !event.defaultPrevented) options.onValueChange?.(open ? null : item)
            },
          },
        }
      },
      content(item: string): PartProps<'div'> {
        return {
          attrs: {
            ...flags(item === value),
            hidden: item !== value,
            id: options.ids?.content(item),
            'aria-labelledby': options.ids?.trigger(item),
          },
          on: {},
        }
      },
      link(current = false): PartProps<'a'> {
        return { attrs: { 'aria-current': current ? 'page' : undefined }, on: {} }
      },
    },
  }
}
/** Computed navigation state and part factories. */
export type NavigationMenuResult = ReturnType<typeof navigationMenu>
