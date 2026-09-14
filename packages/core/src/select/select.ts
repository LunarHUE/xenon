import type { PartProps } from '../part'

/** Data retained while the popup is unmounted, for display, typeahead, and forms. */
export interface SelectItem {
  /** Unique nonempty submitted identity; the empty string is reserved for the native placeholder. */
  value: string
  /** Plain text displayed by Value and searched by typeahead. */
  label: string
  /** Excludes this option from interaction. */
  disabled?: boolean
}
/** Caller-owned single selection, popup state, and typeahead buffer. */
export interface SelectOptions {
  /** Ordered option metadata; values must be unique. */
  items: readonly SelectItem[]
  /** Committed value, independent of highlighted option. */
  value?: string
  /** Highlighted option while open. */
  activeValue?: string
  /** Popup visibility, default false. */
  open?: boolean
  /** Blocks all interaction. */
  disabled?: boolean
  /** Blocks changes while preserving focusability. */
  readonly?: boolean
  /** Exposes required semantics. */
  required?: boolean
  /** Exposes invalid semantics. */
  invalid?: boolean
  /** Trigger and popup IDs supplied by the adapter. */
  ids?: {
    /** Trigger host ID. */
    trigger?: string
    /** Listbox host ID and option-ID prefix. */
    content?: string
  }
  /** Caller-managed search buffer, reset after an idle timeout by the adapter. */
  search?: string
  /** Reports a requested committed value; construction is silent. */
  onValueChange?: (value: string | undefined) => void
  /** Reports a requested highlight without committing. */
  onActiveChange?: (value: string | undefined) => void
  /** Reports visibility requests. */
  onOpenChange?: (open: boolean) => void
  /** Reports accumulated search text. */
  onSearchChange?: (search: string) => void
}
/** Computed selection state and host bundles, recomputed after state requests. */
export interface SelectResult {
  /** Resolved input snapshot; event requests do not mutate it. */
  state: {
    /** Popup visibility. */
    open: boolean
    /** Committed value. */
    value: string | undefined
    /** Enabled highlighted value. */
    activeValue: string | undefined
    /** Metadata for the committed value, including while closed. */
    selectedItem: SelectItem | undefined
  }
  /** Bind these bundles to their corresponding hosts. */
  parts: {
    /** Native button with select-only combobox semantics. */
    trigger: PartProps<'button'>
    /** Listbox surface with no DOM focus transfer. */
    content: PartProps<'div'>
    /** Option semantics and pointer selection handlers. */
    item(value: string): PartProps<'div'>
  }
}
/** Stable option ID derived from the popup ID and encoded value. */
export function getSelectItemId(id: string, value: string): string {
  return `${id}-option-${encodeURIComponent(value)}`
}
/**
 * Compute select-only combobox semantics with virtual option focus. Arrow navigation
 * skips disabled options and clamps. Enter/Space commit, Escape cancels, and Tab
 * closes without preventing native focus movement. Closed typeahead commits directly.
 * The adapter owns state, focus, mounting, positioning, and native form integration.
 */
export function select(options: SelectOptions): SelectResult {
  const open = options.open ?? false
  const blocked = options.disabled || options.readonly
  const enabled = options.items.filter((item) => !item.disabled)
  const activeValue = enabled.some((item) => item.value === options.activeValue)
    ? options.activeValue
    : (enabled.find((item) => item.value === options.value)?.value ?? enabled[0]?.value)
  const commit = (value: string | undefined) => {
    if (blocked || !enabled.some((item) => item.value === value)) return
    if (value !== options.value) options.onValueChange?.(value)
  }
  const show = (edge?: 'first' | 'last') => {
    if (blocked || enabled.length === 0) return
    options.onActiveChange?.(
      edge ? (edge === 'first' ? enabled[0] : enabled.at(-1))?.value : activeValue
    )
    if (!open) options.onOpenChange?.(true)
  }
  const keydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || blocked || event.isComposing || event.ctrlKey || event.metaKey)
      return
    if (event.key === 'Tab') {
      if (open) options.onOpenChange?.(false)
      return
    }
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        options.onOpenChange?.(false)
      }
      return
    }
    if (event.altKey && !(event.key === 'ArrowDown' || event.key === 'ArrowUp')) return
    if (
      ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key) &&
      !(event.key === ' ' && options.search)
    ) {
      event.preventDefault()
      if (!open) {
        show(
          event.key === 'Home'
            ? 'first'
            : event.key === 'End' || (event.key === 'ArrowUp' && options.value === undefined)
              ? 'last'
              : undefined
        )
        return
      }
      if (event.key === 'Enter' || event.key === ' ' || (event.altKey && event.key === 'ArrowUp')) {
        commit(activeValue)
        options.onOpenChange?.(false)
        return
      }
      const index = enabled.findIndex((item) => item.value === activeValue)
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? enabled.length - 1
            : Math.max(0, Math.min(enabled.length - 1, index + (event.key === 'ArrowUp' ? -1 : 1)))
      options.onActiveChange?.(enabled[next]?.value)
      return
    }
    if (event.altKey || event.key.length !== 1) return
    const search = (options.search ?? '') + event.key.toLocaleLowerCase()
    options.onSearchChange?.(search)
    const repeated = [...search].every((letter) => letter === search[0])
    const query = repeated ? search[0]! : search
    const index = enabled.findIndex((item) => item.value === (open ? activeValue : options.value))
    for (let offset = repeated ? 1 : 0; offset <= enabled.length; offset++) {
      const item = enabled[(index + offset + enabled.length) % enabled.length]
      if (item?.label.trim().toLocaleLowerCase().startsWith(query)) {
        if (open) options.onActiveChange?.(item.value)
        else commit(item.value)
        break
      }
    }
    event.preventDefault()
  }
  const flags = {
    'data-state': open ? 'open' : 'closed',
    'data-disabled': options.disabled ? '' : undefined,
    'data-readonly': options.readonly ? '' : undefined,
    'data-required': options.required ? '' : undefined,
    'data-invalid': options.invalid ? '' : undefined,
  }
  const trigger: PartProps<'button'> = {
    attrs: {
      ...flags,
      id: options.ids?.trigger,
      type: 'button',
      role: 'combobox',
      disabled: options.disabled,
      'aria-haspopup': 'listbox',
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': open ? options.ids?.content : undefined,
      'aria-activedescendant':
        open && activeValue !== undefined && options.ids?.content
          ? getSelectItemId(options.ids.content, activeValue)
          : undefined,
      'aria-disabled': options.disabled ? 'true' : undefined,
      'aria-readonly': options.readonly ? 'true' : undefined,
      'aria-required': options.required ? 'true' : undefined,
      'aria-invalid': options.invalid ? 'true' : undefined,
      'data-placeholder': options.value === undefined ? '' : undefined,
    },
    on: {
      keydown,
      click(event) {
        if (event.defaultPrevented || blocked) return
        if (open) options.onOpenChange?.(false)
        else show()
      },
    },
  }
  const content: PartProps<'div'> = {
    attrs: {
      ...flags,
      id: options.ids?.content,
      role: 'listbox',
      'aria-labelledby': options.ids?.trigger,
    },
    on: {},
  }
  /** Option events preserve trigger focus; click commits only enabled metadata entries. */
  function item(value: string): PartProps<'div'> {
    const disabled = !enabled.some((entry) => entry.value === value)
    return {
      attrs: {
        role: 'option',
        id: options.ids?.content ? getSelectItemId(options.ids.content, value) : undefined,
        tabindex: -1,
        'data-value': value,
        'aria-selected': options.value === value ? 'true' : 'false',
        'aria-disabled': disabled ? 'true' : undefined,
        'data-disabled': disabled ? '' : undefined,
        'data-highlighted': open && activeValue === value ? '' : undefined,
        'data-state': options.value === value ? 'checked' : 'unchecked',
      },
      on: {
        pointerdown(event) {
          if (!event.defaultPrevented) event.preventDefault()
        },
        pointermove(event) {
          if (!event.defaultPrevented && !blocked && !disabled && open)
            options.onActiveChange?.(value)
        },
        click(event) {
          if (event.defaultPrevented || blocked || disabled || !open) return
          commit(value)
          options.onOpenChange?.(false)
        },
      },
    }
  }
  return {
    state: {
      open,
      value: options.value,
      activeValue,
      selectedItem: options.items.find((item) => item.value === options.value),
    },
    parts: { trigger, content, item },
  }
}
