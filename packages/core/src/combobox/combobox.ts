import { collection } from '../collection'
import type { PartProps } from '../part'

/** A stable form value and its searchable display label. Values must be unique. */
export interface ComboboxItem {
  /** Unique nonempty submitted identity; the empty string is reserved for the native placeholder. */
  value: string
  /** Text displayed after selection and searched by the default filter. */
  label: string
  /** Excludes the option from activation and navigation. */
  disabled?: boolean
}

/** Snapshot inputs for an editable, single-selection listbox popup. */
export interface ComboboxOptions {
  /** Complete collection, including options not currently matching the query. */
  items: readonly ComboboxItem[]
  /** Adapter-generated base ID for the listbox and its options. */
  id: string
  /** Committed form value. Typing alone does not replace this value. */
  value?: string
  /** Current editable text, defaulting to the selected label. */
  inputValue?: string
  /** Logical popup visibility. Defaults to false. */
  open?: boolean
  /** Highlighted option, independent of committed selection. */
  activeValue?: string
  /** Disables input and option activation. */
  disabled?: boolean
  /** Allows text focus but blocks editing, opening, and selection. */
  readonly?: boolean
  /** Native required state supplied by the adapter. */
  required?: boolean
  /** Author-owned invalid state; the engine does not validate. */
  invalid?: boolean
  /** Wrap arrow navigation at enabled edges. Defaults to true. */
  loop?: boolean
  /** False retains all items; otherwise default case-insensitive substring matching or a custom predicate. */
  filter?: false | ((item: ComboboxItem, query: string) => boolean)
  /** Requests a committed value; initialization is silent. */
  onValueChange?: (value: string | undefined) => void
  /** Requests editable text independently of selection. */
  onInputValueChange?: (value: string) => void
  /** Requests popup visibility. */
  onOpenChange?: (open: boolean) => void
  /** Requests virtual focus without moving DOM focus. */
  onActiveChange?: (value: string | undefined) => void
}

/** Deterministic option ID derived from an adapter-owned base and unique string value. */
export function getComboboxItemId(base: string, value: string): string {
  return `${base}-option-${encodeURIComponent(value)}`
}

/** Pure combobox state and parts consumed by framework adapters. */
export interface ComboboxResult {
  /** Resolved selection, query, visibility, and filtered collection. */
  state: {
    /** Committed value, including values temporarily absent from an async collection. */
    value: string | undefined
    /** Current input text. */
    inputValue: string
    /** Requested popup visibility. */
    open: boolean
    /** Enabled, visible highlighted value, if any. */
    activeValue: string | undefined
    /** Matching options in author order. */
    items: readonly ComboboxItem[]
  }
  /** Host attributes and event handlers. */
  parts: {
    /** Editable combobox retaining DOM focus during option navigation. */
    input: PartProps<'input'>
    /** Non-tabbable popup listbox. */
    content: PartProps<'div'>
    /** Option attributes and click/hover handlers for a collection value. */
    item(value: string): PartProps<'div'>
  }
}

/**
 * Computes list filtering and virtual navigation without owning state or the DOM.
 * Enter commits only an enabled highlight; Tab closes without selection. Home,
 * End, and horizontal arrows clear the highlight and retain native caret behavior.
 * Composition and modified editing keys are left to the browser; composed text
 * filters and publishes once, at compositionend. Typing retains the committed
 * value until another option is explicitly chosen.
 */
export function combobox(options: ComboboxOptions): ComboboxResult {
  const open = options.open ?? false
  const inputValue =
    options.inputValue ?? options.items.find((item) => item.value === options.value)?.label ?? ''
  const items = options.items.filter(
    (item) =>
      options.filter === false ||
      (options.filter
        ? options.filter(item, inputValue)
        : item.label.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase()))
  )
  const enabled = collection({
    items: items.map((item) => item.value),
    disabled: (value) => !!items.find((item) => item.value === value)?.disabled,
  })
  const activeValue = enabled.navigable.includes(options.activeValue ?? '')
    ? options.activeValue
    : undefined
  const interactive = !options.disabled && !options.readonly
  const highlight = (value: string | undefined) => {
    if (value !== options.activeValue) options.onActiveChange?.(value)
  }
  const visibility = (value: boolean) => {
    if (value !== open) options.onOpenChange?.(value)
  }
  const choose = (value: string) => {
    const item = items.find((candidate) => candidate.value === value)
    if (!interactive || !item || item.disabled) return
    if (value !== options.value) options.onValueChange?.(value)
    if (inputValue !== item.label) options.onInputValueChange?.(item.label)
    visibility(false)
    highlight(undefined)
  }
  return {
    state: { value: options.value, inputValue, open, activeValue, items },
    parts: {
      input: {
        attrs: {
          role: 'combobox',
          value: inputValue,
          disabled: options.disabled || undefined,
          readonly: options.readonly || undefined,
          required: options.required || undefined,
          'aria-autocomplete': options.filter === false ? 'none' : 'list',
          'aria-expanded': open ? 'true' : 'false',
          'aria-controls': `${options.id}-listbox`,
          'aria-activedescendant':
            open && activeValue !== undefined
              ? getComboboxItemId(options.id, activeValue)
              : undefined,
          'aria-invalid': options.invalid ? 'true' : undefined,
          'data-state': open ? 'open' : 'closed',
        },
        on: {
          input(event) {
            if (!interactive) return
            highlight(undefined)
            // Composed text, including WebKit's committing insertFromComposition
            // input, publishes once at compositionend whatever the event order.
            if (event.isComposing || event.inputType === 'insertFromComposition') return
            options.onInputValueChange?.(event.currentTarget.value)
            visibility(true)
          },
          compositionend(event) {
            if (!interactive) return
            options.onInputValueChange?.(event.currentTarget.value)
            visibility(true)
          },
          keydown(event) {
            if (
              !interactive ||
              event.defaultPrevented ||
              event.isComposing ||
              event.ctrlKey ||
              event.metaKey ||
              event.altKey
            )
              return
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              visibility(true)
              const next =
                event.key === 'ArrowDown'
                  ? enabled.next(open ? activeValue : undefined, { loop: options.loop ?? true })
                  : enabled.previous(open ? activeValue : undefined, { loop: options.loop ?? true })
              highlight(next ?? (open ? activeValue : undefined))
            } else if (event.key === 'Enter' && open) {
              if (activeValue !== undefined) {
                event.preventDefault()
                choose(activeValue)
              } else visibility(false)
            } else if (event.key === 'Escape' && open) {
              event.preventDefault()
              visibility(false)
              highlight(undefined)
            } else if (event.key === 'Tab') {
              visibility(false)
              highlight(undefined)
            } else if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key))
              highlight(undefined)
          },
        },
      },
      content: { attrs: { id: `${options.id}-listbox`, role: 'listbox', tabindex: -1 }, on: {} },
      item(value) {
        const item = items.find((candidate) => candidate.value === value)
        const disabled = !!options.disabled || !item || !!item.disabled
        return {
          attrs: {
            id: getComboboxItemId(options.id, value),
            role: 'option',
            tabindex: -1,
            hidden: !item || undefined,
            'aria-selected': options.value === value ? 'true' : 'false',
            'aria-disabled': disabled ? 'true' : undefined,
            'data-disabled': disabled ? '' : undefined,
            'data-highlighted': open && activeValue === value ? '' : undefined,
            'data-state': options.value === value ? 'checked' : 'unchecked',
          },
          on: {
            pointerdown(event) {
              if (event.button === 0) event.preventDefault()
            },
            pointermove() {
              if (!disabled && interactive && open) highlight(value)
            },
            click(event) {
              if (open && !event.defaultPrevented) choose(value)
            },
          },
        }
      },
    },
  }
}
