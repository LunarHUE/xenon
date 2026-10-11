import type { PartProps } from '../part'

/** Inputs for a contiguous, segmented one-time code. */
export interface PinInputOptions {
  /** Current code. Invalid characters are filtered and overflow is truncated. */
  value?: string
  /** Number of slots; positive integers only, otherwise six. */
  length?: number
  /** Accepted ASCII characters; defaults to numeric. */
  type?: 'numeric' | 'alphanumeric' | 'alphabetic'
  /**
   * Letter case applied to typed, pasted and autofilled text before filtering.
   * Upper also starts mobile keyboards in capitals.
   * @defaultValue 'preserve'
   */
  case?: 'preserve' | 'upper' | 'lower'
  /**
   * Allow-list checked after type filtering and the case transform; other characters
   * are dropped. Matching is exact, so list both cases when case is preserve.
   */
  charset?: string
  /**
   * Autocomplete token for the first slot; later slots are always off. Pass off for
   * codes the browser should not fill from SMS, such as device codes.
   * @defaultValue 'one-time-code'
   */
  autocomplete?: string
  /** Render password inputs when true. */
  mask?: boolean
  /** Disable interaction and form participation. */
  disabled?: boolean
  /** Keep focus navigation but prevent edits. */
  readonly?: boolean
  /** Require a complete code. */
  required?: boolean
  /** Author supplied invalid state. */
  invalid?: boolean
  /** Localized accessible slot name; index is zero based. */
  getSlotLabel?: (index: number, length: number) => string
  /** Request a changed code. Initialization and no-op edits are silent. */
  onValueChange?: (value: string) => void
  /** Request focus by zero-based slot index. */
  onFocusChange?: (index: number) => void
}

/** Normalized code and insertion position. */
export interface PinInputState {
  /** Sanitized contiguous code without gaps. */
  value: string
  /** Resolved positive slot count. */
  length: number
  /** Whether every slot contains a character. */
  complete: boolean
  /** First empty slot, or the last slot when complete. */
  insertion: number
}

/** Pure code transitions and semantic part attributes. */
export interface PinInputResult {
  /** Normalized snapshot. */
  state: PinInputState
  /** Host bindings. */
  parts: {
    /** Group state markers. */
    root: PartProps<'div'>
    /** Indexed native input attributes and keyboard behavior. */
    input: (index: number) => PartProps<'input'>
  }
  /** Sanitize and overwrite characters from the requested slot; paste and autofill share this path. */
  insert: (index: number, text: string) => void
  /** Resolve a requested focus position without leaving holes. */
  focus: (index: number) => void
}

/** Build a pure segmented code controller. Deletion splices the scalar string. */
export function pinInput(options: PinInputOptions = {}): PinInputResult {
  const length = Number.isInteger(options.length) && options.length! > 0 ? options.length! : 6
  const charset = options.charset
  const clean = (text: string) => {
    const cased =
      options.case === 'upper'
        ? text.toUpperCase()
        : options.case === 'lower'
          ? text.toLowerCase()
          : text
    const typed = cased.replace(
      options.type === 'alphanumeric'
        ? /[^a-zA-Z0-9]/g
        : options.type === 'alphabetic'
          ? /[^a-zA-Z]/g
          : /[^0-9]/g,
      ''
    )
    return charset === undefined
      ? typed
      : [...typed].filter((char) => charset.includes(char)).join('')
  }
  const value = clean(options.value ?? '').slice(0, length)
  const insertion = Math.min(value.length, length - 1)
  const state = { value, length, complete: value.length === length, insertion }
  const flags = {
    'data-disabled': options.disabled ? '' : undefined,
    'data-readonly': options.readonly ? '' : undefined,
    'data-required': options.required ? '' : undefined,
    'data-invalid': options.invalid ? '' : undefined,
    'data-complete': state.complete ? '' : undefined,
  }
  const focus = (index: number) => {
    if (!options.disabled) options.onFocusChange?.(Math.max(0, Math.min(index, insertion)))
  }
  const change = (next: string) => {
    if (next !== value) options.onValueChange?.(next)
  }
  const insert = (index: number, text: string) => {
    if (options.disabled || options.readonly) return
    const start = Math.max(0, Math.min(index, insertion))
    const chars = clean(text).slice(0, length - start)
    if (!chars) return
    const next = (value.slice(0, start) + chars + value.slice(start + chars.length)).slice(
      0,
      length
    )
    change(next)
    options.onFocusChange?.(Math.min(start + chars.length, length - 1))
  }
  const input = (index: number): PartProps<'input'> => ({
    attrs: {
      ...flags,
      value: value[index] ?? '',
      type: options.mask ? 'password' : 'text',
      disabled: options.disabled || undefined,
      readonly: options.readonly || undefined,
      'aria-invalid': options.invalid ? 'true' : undefined,
      'aria-label': options.getSlotLabel?.(index, length) ?? `Pin code ${index + 1} of ${length}`,
      'data-index': String(index),
      'data-filled': value[index] ? '' : undefined,
      tabindex: index === insertion ? 0 : -1,
      inputmode: options.type && options.type !== 'numeric' ? 'text' : 'numeric',
      autocomplete: index === 0 ? (options.autocomplete ?? 'one-time-code') : 'off',
      autocapitalize: options.case === 'upper' ? 'characters' : 'off',
      spellcheck: 'false',
    },
    on: {
      keydown(event) {
        if (
          options.disabled ||
          event.defaultPrevented ||
          event.isComposing ||
          event.keyCode === 229
        )
          return
        if (event.key === 'Tab') {
          // Start native forward traversal at the sole tab stop so it leaves the
          // field even when an earlier, non-tabbable slot currently has focus.
          if (!event.shiftKey && index < insertion) focus(insertion)
          return
        }
        const modifier = event.ctrlKey || event.metaKey
        let target: number | undefined
        if (event.key === 'ArrowLeft') target = modifier ? 0 : index - 1
        if (event.key === 'ArrowRight') target = modifier ? insertion : index + 1
        if (event.key === 'Home' || event.key === 'ArrowUp') target = 0
        if (event.key === 'End' || event.key === 'ArrowDown') target = insertion
        if (target !== undefined) {
          event.preventDefault()
          focus(target)
          return
        }
        if (options.readonly || (event.key !== 'Backspace' && event.key !== 'Delete')) return
        event.preventDefault()
        if (event.key === 'Delete' && !value[index]) return
        if (modifier && event.key === 'Backspace') {
          change('')
          options.onFocusChange?.(0)
          return
        }
        const remove = event.key === 'Backspace' && !value[index] ? index - 1 : index
        if (remove >= 0) change(value.slice(0, remove) + value.slice(remove + 1))
        options.onFocusChange?.(
          event.key === 'Backspace'
            ? Math.max(0, index - 1)
            : Math.min(index, Math.max(0, value.length - 1))
        )
      },
    },
  })
  return {
    state,
    parts: { root: { attrs: { role: 'group', ...flags }, on: {} }, input },
    insert,
    focus,
  }
}
