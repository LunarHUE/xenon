import { composite } from '../composite/composite'
import type { PartProps } from '../part'

/** Caller-owned top-level menu identities and open state. */
export interface MenubarOptions<T> {
  /** Ordered distinct trigger identities. */
  items: readonly T[]
  /** Current roving tab stop; defaults to the first enabled item. */
  active?: T
  /** Open top-level menu identity. */
  value?: T
  /** Exclude disabled triggers from navigation and activation. */
  disabled?: (item: T) => boolean
  /** Trigger text for single-character cyclic typeahead. */
  textValue?: (item: T) => string
  /** Top-level arrow axis; defaults to horizontal. */
  orientation?: 'horizontal' | 'vertical'
  /** Horizontal arrow direction; defaults to ltr. */
  dir?: 'ltr' | 'rtl'
  /** Wrap navigation at either end; defaults to true. */
  loop?: boolean
  /** Requests a new roving trigger. The adapter owns DOM focus. */
  onActiveChange?: (item: T) => void
  /** Requests visibility and an opening focus edge. Undefined closes all menus. */
  onValueChange?: (item: T | undefined, edge?: 'first' | 'last' | 'content') => void
}
/** Computes menubar roles, enabled roving navigation, top-level typeahead, and menu opening requests. */
export function menubar<T>(options: MenubarOptions<T>) {
  const navigation = composite({ ...options, direction: options.dir, loop: options.loop ?? true })
  const root: PartProps<'div'> = {
    attrs: { role: 'menubar', 'aria-orientation': options.orientation ?? 'horizontal' },
    on: {},
  }
  function trigger(value: T): PartProps<'button'> {
    const nav = navigation.parts.item(value)
    return {
      attrs: {
        ...nav.attrs,
        type: 'button',
        role: 'menuitem',
        'aria-haspopup': 'menu',
        'aria-expanded': options.value === value ? 'true' : 'false',
        'aria-disabled': options.disabled?.(value) ? 'true' : undefined,
        'data-disabled': options.disabled?.(value) ? '' : undefined,
      },
      on: {
        focus(event) {
          nav.on.focus?.(event as never)
        },
        click() {
          if (!options.disabled?.(value))
            options.onValueChange?.(options.value === value ? undefined : value, 'content')
        },
        keydown(event) {
          if (event.defaultPrevented || event.isComposing || options.disabled?.(value)) return
          if (event.key === 'Tab') {
            options.onValueChange?.(undefined)
            return
          }
          if (event.altKey || event.ctrlKey || event.metaKey) return
          nav.on.keydown?.(event as never)
          if (event.defaultPrevented) return
          const opening =
            options.orientation === 'vertical'
              ? [options.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight']
              : ['ArrowDown', 'ArrowUp']
          if (['Enter', ' ', ...opening].includes(event.key)) {
            event.preventDefault()
            options.onValueChange?.(
              (event.key === 'Enter' || event.key === ' ') && options.value === value
                ? undefined
                : value,
              event.key === 'ArrowUp' ? 'last' : 'first'
            )
          } else if (event.key.length === 1) {
            const start = options.items.indexOf(value)
            for (let offset = 1; offset <= options.items.length; offset++) {
              const item = options.items[(start + offset) % options.items.length]!
              if (
                !options.disabled?.(item) &&
                options
                  .textValue?.(item)
                  .trim()
                  .toLocaleLowerCase()
                  .startsWith(event.key.toLocaleLowerCase())
              ) {
                options.onActiveChange?.(item)
                event.preventDefault()
                break
              }
            }
          }
        },
      },
    }
  }
  return {
    /** Resolved top-level navigation and open identity. */
    state: { ...navigation.state, value: options.value },
    /** Container and top-level trigger bindings. Popup parts use Menu. */
    parts: { root, trigger },
  }
}
