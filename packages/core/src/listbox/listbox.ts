import { collection } from '../collection/collection'
import { selection } from '../selection/selection'
import type { PartProps } from '../part'

/** Scalar single selection, array multiple selection, or empty single selection. */
export type ListboxValue = string | readonly string[] | undefined
/** Caller-owned listbox state and ordered option metadata. */
export interface ListboxOptions {
  /** Distinct option values in display order. */
  items: readonly string[]
  /** Current selection; construction never selects an option. */
  value?: ListboxValue
  /** Active option, falling back to the first enabled selected option, then first enabled option. */
  activeValue?: string
  /** Selection payload shape; defaults to single. */
  selectionMode?: 'single' | 'multiple'
  /** Blocks navigation and selection. */
  disabled?: boolean
  /** Allows navigation but blocks selection changes. */
  readonly?: boolean
  /** Excludes an option from navigation and selection. */
  isItemDisabled?: (value: string) => boolean
  /** Searchable label; defaults to the value. */
  textValue?: (value: string) => string
  /** Keep DOM focus on the root or an external owner; defaults to false. */
  virtualFocus?: boolean
  /** Root ID used to derive stable option IDs. */
  id?: string
  /** Arrow navigation axis; defaults to vertical. */
  orientation?: 'vertical' | 'horizontal'
  /** Horizontal arrow direction; defaults to ltr. */
  dir?: 'ltr' | 'rtl'
  /** Wrap arrow navigation; defaults to true. */
  loop?: boolean
  /** Caller-owned typeahead buffer; caller resets after 700ms idle. */
  search?: string
  /** Reports each accepted character buffer, including unmatched prefixes. */
  onSearchChange?: (value: string) => void
  /** Reports accepted selection changes synchronously. */
  onValueChange?: (value: ListboxValue) => void
  /** Requests active identity changes; caller moves actual DOM focus. */
  onActiveChange?: (value: string) => void
  /** Fixed range-selection anchor retained by the adapter; missing items fall back to active. */
  anchorValue?: string
  /** Reports a new anchor on ordinary activation or first range extension. */
  onAnchorChange?: (value: string) => void
}
/** Derives a collision-free option ID from a root ID and UTF-16 value code units. */
export function getListboxItemId(base: string, value: string): string {
  const encoded = Array.from({ length: value.length }, (_, index) =>
    value.charCodeAt(index).toString(16)
  ).join('-')
  return `${base}-option-${encoded || 'empty'}`
}
/**
 * Computes listbox semantics, enabled-only navigation, selection, and typeahead.
 * Recompute after requests. Selection stays independent of focus; click, Enter,
 * and Space commit. Multiple selection toggles without modifiers; Shift extends
 * an inclusive enabled range without wrapping, and Ctrl/Meta+A selects all enabled options.
 * Author cancellation, composition, and Alt shortcuts are respected. Adapters
 * own DOM focus, stable root IDs, registration, and the typeahead idle timer.
 */
export function listbox(options: ListboxOptions) {
  const disabled = options.disabled ?? false
  const orientation = options.orientation ?? 'vertical'
  const loop = options.loop ?? true
  const selected = selection<string>({ mode: options.selectionMode, value: options.value })
  const order = collection({
    items: options.items,
    disabled: (value) => disabled || !!options.isItemDisabled?.(value),
  })
  const activeValue =
    options.activeValue !== undefined && order.navigable.includes(options.activeValue)
      ? options.activeValue
      : (order.navigable.find(selected.isSelected) ?? order.first())
  const active = (value: string) => options.onActiveChange?.(value)
  const commit = (value: string, range = false) => {
    if (disabled || options.readonly || !order.navigable.includes(value)) return
    if (range && selected.mode === 'multiple') {
      const anchor =
        options.anchorValue !== undefined && options.items.includes(options.anchorValue)
          ? options.anchorValue
          : (activeValue ?? value)
      if (options.anchorValue !== anchor) options.onAnchorChange?.(anchor)
      options.onValueChange?.(order.range(anchor, value))
    } else {
      options.onAnchorChange?.(value)
      const next = selected.mode === 'multiple' ? selected.toggle(value) : selected.select(value)
      if (selected.mode === 'multiple' || !selected.isSelected(value)) options.onValueChange?.(next)
    }
  }
  const keydown = (event: KeyboardEvent, from = activeValue) => {
    if (event.defaultPrevented || disabled || event.isComposing || event.altKey) return
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'a' && selected.mode === 'multiple' && !options.readonly) {
        event.preventDefault()
        options.onValueChange?.([...order.navigable])
      }
      return
    }
    const forward =
      orientation === 'vertical' ? 'ArrowDown' : options.dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const backward =
      orientation === 'vertical' ? 'ArrowUp' : options.dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    if ([forward, backward, 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      const next =
        event.key === 'Home'
          ? order.first()
          : event.key === 'End'
            ? order.last()
            : event.key === forward
              ? order.next(from, { loop: loop && !event.shiftKey })
              : order.previous(from, { loop: loop && !event.shiftKey })
      if (next !== undefined) {
        if (event.shiftKey) commit(next, true)
        active(next)
      }
      return
    }
    if (event.key === 'Enter' || (event.key === ' ' && !options.search)) {
      event.preventDefault()
      if (from !== undefined) commit(from, event.shiftKey)
      return
    }
    if (event.key.length !== 1) return
    const search = (options.search ?? '') + event.key.toLocaleLowerCase()
    options.onSearchChange?.(search)
    const repeated = [...search].every((letter) => letter === search[0])
    const query = repeated ? search[0]! : search
    const start = from === undefined ? -1 : order.navigable.indexOf(from)
    for (let offset = repeated ? 1 : 0; offset <= order.navigable.length; offset++) {
      const candidate =
        order.navigable[(start + offset + order.navigable.length) % order.navigable.length]
      if (
        candidate !== undefined &&
        (options.textValue?.(candidate) ?? candidate).trim().toLocaleLowerCase().startsWith(query)
      ) {
        active(candidate)
        break
      }
    }
    event.preventDefault()
  }
  const root: PartProps<'div'> = {
    attrs: {
      id: options.id,
      dir: options.dir,
      role: 'listbox',
      tabindex: disabled ? -1 : options.virtualFocus || activeValue === undefined ? 0 : -1,
      'aria-multiselectable': selected.mode === 'multiple' ? 'true' : undefined,
      'aria-orientation': orientation,
      'aria-disabled': disabled ? 'true' : undefined,
      'aria-readonly': options.readonly ? 'true' : undefined,
      'aria-activedescendant':
        options.virtualFocus && options.id && activeValue !== undefined
          ? getListboxItemId(options.id, activeValue)
          : undefined,
      'data-disabled': disabled ? '' : undefined,
      'data-readonly': options.readonly ? '' : undefined,
      'data-orientation': orientation,
      'data-empty': options.items.length ? undefined : '',
    },
    on: {
      keydown: (event) => keydown(event),
      focus(event) {
        if (
          !disabled &&
          !options.virtualFocus &&
          event.target === event.currentTarget &&
          activeValue !== undefined
        )
          active(activeValue)
      },
    },
  }
  /** Option semantics and activation. Pointerdown never commits a value. */
  const item = (value: string): PartProps<'div'> => {
    const blocked = disabled || !!options.isItemDisabled?.(value)
    return {
      attrs: {
        id: options.id ? getListboxItemId(options.id, value) : undefined,
        role: 'option',
        tabindex: !options.virtualFocus && !blocked && activeValue === value ? 0 : -1,
        'aria-selected': selected.isSelected(value) ? 'true' : 'false',
        'aria-disabled': blocked ? 'true' : undefined,
        'data-disabled': blocked ? '' : undefined,
        'data-selected': selected.isSelected(value) ? '' : undefined,
        'data-highlighted': activeValue === value ? '' : undefined,
        'data-value': value,
      },
      on: {
        focus() {
          if (!blocked && activeValue !== value) active(value)
        },
        click(event) {
          if (event.defaultPrevented || blocked) return
          commit(value, event.shiftKey)
          active(value)
        },
        keydown(event) {
          keydown(event, value)
        },
      },
    }
  }
  return {
    /** Resolved snapshot; handlers never mutate it. */
    state: {
      /** Resolved enabled focus destination, absent for an empty or disabled collection. */
      activeValue,
      /** Supplied selection, without normalization or mutation. */
      value: options.value,
      /** Resolved selection behavior. */
      selectionMode: selected.mode,
      /** Whether arrow navigation wraps. */
      loop,
      /** Resolved arrow axis. */
      orientation,
    },
    /** Root host and option factory. */
    parts: { root, item },
  }
}
