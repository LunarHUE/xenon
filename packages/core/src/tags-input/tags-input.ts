import type { PartProps } from '../part'

/** String-tag collection options. Core never mutates the supplied array. */
export interface TagsInputOptions {
  /** Current tags, defaulting to an empty collection. */
  value?: readonly string[]
  /** Disables input and removal. */
  disabled?: boolean
  /** Preserves focusability while preventing changes. */
  readonly?: boolean
  /** Requires at least one tag. */
  required?: boolean
  /** Author-supplied validation state. */
  invalid?: boolean
  /** Allows repeated text. Defaults to false. */
  allowDuplicates?: boolean
  /** Removes surrounding whitespace before validation. Defaults to true. */
  trim?: boolean
  /** Maximum number of accepted tags. Defaults to unlimited. */
  max?: number
  /** Optional predicate applied after trimming, before insertion or replacement. */
  validate?: (value: string) => boolean
  /** Receives a new array only for an accepted change. */
  onValueChange?: (value: string[]) => void
}

/** Pure tag validation, collection changes, and styling parts. */
export interface TagsInputResult {
  /** Current values and interaction state. */
  state: {
    /** Supplied collection. */
    value: readonly string[]
    /** Whether edits are allowed. */
    interactive: boolean
  }
  /** Adds accepted entries in one transaction, returning their normalized values. */
  add(values: readonly string[]): string[]
  /** Removes the indexed occurrence, returning whether it existed and was editable. */
  remove(index: number): boolean
  /** Replaces an indexed tag, or removes it when the normalized value is empty. */
  replace(index: number, value: string): boolean
  /** Removes every tag; an empty collection is silent. */
  clear(): void
  /** Presentational and native input attribute bundles. */
  parts: {
    /** Root styling. */
    root: PartProps<'div'>
    /** Main text input flags. Its adapter owns draft text and validation. */
    input: PartProps<'input'>
    /** Tag attributes for an index and its current focus state. */
    item(index: number, highlighted?: boolean): PartProps<'div'>
    /** Native removal button attributes. */
    remove(index: number): PartProps<'button'>
  }
}

/** Builds a tag collection snapshot with trim-before-uniqueness validation. */
export function tagsInput(options: TagsInputOptions = {}): TagsInputResult {
  const value = options.value ?? []
  const interactive = !options.disabled && !options.readonly
  const normalize = (text: string) => (options.trim === false ? text : text.trim())
  const valid = (text: string, against: readonly string[]) =>
    text !== '' &&
    (options.allowDuplicates || !against.includes(text)) &&
    (options.validate?.(text) ?? true)
  const flags = {
    'data-disabled': options.disabled ? '' : undefined,
    'data-readonly': options.readonly ? '' : undefined,
    'data-required': options.required ? '' : undefined,
    'data-invalid': options.invalid ? '' : undefined,
    'data-empty': value.length ? undefined : '',
  }
  const remove = (index: number) => {
    if (!interactive || index < 0 || index >= value.length) return false
    options.onValueChange?.(value.filter((_, position) => position !== index))
    return true
  }
  return {
    state: { value, interactive },
    add(values) {
      if (!interactive) return []
      const next = [...value]
      const accepted: string[] = []
      for (const raw of values) {
        const text = normalize(raw)
        if (next.length >= (options.max ?? Infinity) || !valid(text, next)) continue
        next.push(text)
        accepted.push(text)
      }
      if (accepted.length) options.onValueChange?.(next)
      return accepted
    },
    remove,
    replace(index, raw) {
      if (!interactive || index < 0 || index >= value.length) return false
      const text = normalize(raw)
      if (!text) return remove(index)
      if (
        !valid(
          text,
          value.filter((_, position) => position !== index)
        )
      )
        return false
      if (text !== value[index]) {
        const next = [...value]
        next[index] = text
        options.onValueChange?.(next)
      }
      return true
    },
    clear() {
      if (interactive && value.length) options.onValueChange?.([])
    },
    parts: {
      root: { attrs: { ...flags, 'data-state': value.length ? 'filled' : 'empty' }, on: {} },
      input: {
        attrs: {
          ...flags,
          type: 'text',
          disabled: options.disabled || undefined,
          readonly: options.readonly || undefined,
          autocomplete: 'off',
          autocapitalize: 'none',
          enterkeyhint: 'done',
          'aria-invalid': options.invalid ? 'true' : undefined,
        },
        on: {},
      },
      item: (index, highlighted = false) => ({
        attrs: {
          ...flags,
          tabindex: -1,
          'data-value': value[index],
          'data-highlighted': highlighted ? '' : undefined,
          'data-part': 'item',
        },
        on: {},
      }),
      remove: (index) => ({
        attrs: {
          ...flags,
          type: 'button',
          tabindex: -1,
          disabled: !interactive || undefined,
          'aria-label': `Remove ${value[index] ?? 'tag'}`,
        },
        on: { click: () => remove(index) },
      }),
    },
  }
}
