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

/** Whether arrow-key navigation commits the option it reaches or leaves that to Enter and click. */
export type ComboboxActivationMode = 'manual' | 'automatic'

/** Why the highlight moved. */
export interface ComboboxActiveChangeDetails {
  /**
   * `keyboard` for an arrow key and `pointer` for hover, both with a value. `reset`
   * when the highlight is cleared: by typing, choosing, closing, or a caret key.
   */
  reason: 'keyboard' | 'pointer' | 'reset'
}

/** Why the input text changed. */
export interface ComboboxInputValueChangeDetails {
  /**
   * `input` when the user typed or composed the text, `selection` when choosing an
   * option wrote its label, and `reset` when the adapter cleared a popup search.
   */
  reason: 'input' | 'selection' | 'reset'
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
  /**
   * With `automatic`, an arrow key in an open list commits the option it highlights,
   * and navigation starts from the committed option when nothing is highlighted.
   * Hover still only highlights, and the key that opens the list commits nothing.
   * The input text and the popup are left alone until Enter or a click. Meant for
   * a list that stays open. Defaults to `manual`.
   */
  activationMode?: ComboboxActivationMode
  /** False retains all items; otherwise default case-insensitive substring matching or a custom predicate. */
  filter?: false | ((item: ComboboxItem, query: string) => boolean)
  /** Requests a committed value; initialization is silent. */
  onValueChange?: (value: string | undefined) => void
  /** Requests editable text independently of selection, and says whether it was typed or chosen. */
  onInputValueChange?: (value: string, details: ComboboxInputValueChangeDetails) => void
  /** Requests popup visibility. */
  onOpenChange?: (open: boolean) => void
  /** Requests virtual focus without moving DOM focus, and says what moved it. */
  onActiveChange?: (value: string | undefined, details: ComboboxActiveChangeDetails) => void
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
 * value until another option is explicitly chosen, or, with automatic activation,
 * reached with an arrow key.
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
  const automatic = options.activationMode === 'automatic'
  const highlight = (value: string | undefined, reason: 'keyboard' | 'pointer' | 'reset') => {
    if (value !== options.activeValue)
      options.onActiveChange?.(value, { reason: value === undefined ? 'reset' : reason })
  }
  const visibility = (value: boolean) => {
    if (value !== open) options.onOpenChange?.(value)
  }
  const choose = (value: string) => {
    const item = items.find((candidate) => candidate.value === value)
    if (!interactive || !item || item.disabled) return
    if (value !== options.value) options.onValueChange?.(value)
    if (inputValue !== item.label) options.onInputValueChange?.(item.label, { reason: 'selection' })
    visibility(false)
    highlight(undefined, 'reset')
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
            highlight(undefined, 'reset')
            // Composed text, including WebKit's committing insertFromComposition
            // input, publishes once at compositionend whatever the event order.
            if (event.isComposing || event.inputType === 'insertFromComposition') return
            options.onInputValueChange?.(event.currentTarget.value, { reason: 'input' })
            visibility(true)
          },
          compositionend(event) {
            if (!interactive) return
            options.onInputValueChange?.(event.currentTarget.value, { reason: 'input' })
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
              // Automatic activation moves on from the committed option, so the first
              // arrow after a search does not land on the row that is already selected.
              const from = open
                ? (activeValue ??
                  (automatic && enabled.navigable.includes(options.value ?? '')
                    ? options.value
                    : undefined))
                : undefined
              const next =
                event.key === 'ArrowDown'
                  ? enabled.next(from, { loop: options.loop ?? true })
                  : enabled.previous(from, { loop: options.loop ?? true })
              highlight(next ?? (open ? activeValue : undefined), 'keyboard')
              if (automatic && open && next !== undefined && next !== options.value)
                options.onValueChange?.(next)
            } else if (event.key === 'Enter' && open) {
              if (activeValue !== undefined) {
                event.preventDefault()
                choose(activeValue)
              } else visibility(false)
            } else if (event.key === 'Escape' && open) {
              event.preventDefault()
              visibility(false)
              highlight(undefined, 'reset')
            } else if (event.key === 'Tab') {
              visibility(false)
              highlight(undefined, 'reset')
            } else if (['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key))
              highlight(undefined, 'reset')
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
              if (!disabled && interactive && open) highlight(value, 'pointer')
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
