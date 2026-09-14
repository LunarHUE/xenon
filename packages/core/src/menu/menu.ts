import { composite } from '../composite/composite'
import type { PartProps } from '../part'

export interface MenuOptions<T> {
  items: readonly T[]
  active?: T
  open?: boolean
  loop?: boolean
  dir?: 'ltr' | 'rtl'
  ids?: { trigger?: string; content?: string }
  disabled?: (item: T) => boolean
  textValue?: (item: T) => string
  search?: string
  onSearchChange?: (search: string) => void
  onActiveChange?: (item: T) => void
  onOpenChange?: (open: boolean, edge?: 'first' | 'last') => void
}
export function menu<T>(options: MenuOptions<T>) {
  const open = options.open ?? false
  const navigation = composite({
    items: options.items,
    active: options.active,
    orientation: 'vertical',
    loop: options.loop ?? true,
    onActiveChange: options.onActiveChange,
  })
  const flags = { 'data-state': open ? 'open' : 'closed' }
  const trigger: PartProps<'button'> = {
    attrs: {
      ...flags,
      id: options.ids?.trigger,
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': open ? options.ids?.content : undefined,
    },
    on: {
      click() {
        options.onOpenChange?.(!open, 'first')
      },
      keydown(event) {
        if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
        if (!['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) return
        event.preventDefault()
        options.onOpenChange?.(true, event.key === 'ArrowUp' ? 'last' : 'first')
      },
    },
  }
  const content: PartProps<'div'> = {
    attrs: {
      ...flags,
      id: options.ids?.content,
      role: 'menu',
      tabindex: -1,
      'aria-labelledby': options.ids?.trigger,
    },
    on: {},
  }
  function item(value: T): PartProps<'div'> {
    const part = navigation.parts.item(value)
    return {
      attrs: {
        ...part.attrs,
        role: 'menuitem',
        'aria-disabled': options.disabled?.(value) ? 'true' : undefined,
        'data-disabled': options.disabled?.(value) ? '' : undefined,
        'data-highlighted': navigation.state.active === value ? '' : undefined,
      },
      on: {
        ...part.on,
        keydown(event) {
          if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
          part.on.keydown?.(event)
          if (
            event.defaultPrevented ||
            event.key.length !== 1 ||
            (event.key === ' ' && !options.search)
          )
            return
          const search = (options.search ?? '') + event.key.toLocaleLowerCase()
          options.onSearchChange?.(search)
          const repeated = [...search].every((letter) => letter === search[0])
          const query = repeated ? search[0]! : search
          const start = options.items.indexOf(value)
          for (let offset = repeated ? 1 : 0; offset <= options.items.length; offset++) {
            const candidate =
              options.items[(start + offset + options.items.length) % options.items.length]
            if (
              candidate !== undefined &&
              !options.disabled?.(candidate) &&
              options.textValue?.(candidate).trim().toLocaleLowerCase().startsWith(query)
            ) {
              options.onActiveChange?.(candidate)
              break
            }
          }
          event.preventDefault()
        },
      },
    }
  }
  return {
    state: { open, active: navigation.state.active, loop: navigation.state.loop },
    parts: { trigger, content, item },
  }
}
