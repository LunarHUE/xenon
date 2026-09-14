import type { PartProps } from '../part'

/** Numeric input snapshots. Null means empty; undefined also resolves to empty in core. */
export interface NumberFieldOptions {
  /** Current committed finite number, or null for empty. */
  value?: number | null
  /** Uncommitted editable text; omission formats the numeric value. */
  inputValue?: string
  /** Input element ID referenced by the step buttons. */
  id?: string
  /** Optional finite lower bound and step-grid origin. */
  min?: number
  /** Optional finite upper bound. Reversed bounds collapse to min. */
  max?: number
  /** Positive step size. Invalid values resolve to 1. */
  step?: number
  /** PageUp/PageDown step size, defaulting to ten steps. */
  largeStep?: number
  /** BCP 47 locale used for formatting and parsing. Defaults to en-US for stable SSR. */
  locale?: string
  /** Intl formatting options, also used to recognize currency and percent tokens. */
  formatOptions?: Intl.NumberFormatOptions
  /** Blocks all edits and form participation. */
  disabled?: boolean
  /** Blocks edits while keeping controls discoverable. */
  readonly?: boolean
  /** Native required state. */
  required?: boolean
  /** Author-supplied invalid state, combined with draft range/parse errors. */
  invalid?: boolean
  /** Requests a committed numeric change; empty commits null. */
  onValueChange?: (value: number | null) => void
  /** Requests draft text without changing the committed value. */
  onInputValueChange?: (value: string) => void
  /** Reports a completed edit or step when the numeric value changes. */
  onValueCommit?: (value: number | null) => void
}

/** Creates locale-aware formatting and strict finite parsing without browser APIs. */
export function createNumberFieldFormat(locale = 'en-US', options: Intl.NumberFormatOptions = {}) {
  const formatter = new Intl.NumberFormat(locale, options)
  const parts = formatter.formatToParts(-12345.6)
  const decimal =
    new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ?? '.'
  const groups = new Set(parts.filter((p) => p.type === 'group').map((p) => p.value))
  const tokens = new Set(
    parts
      .filter((p) => ['currency', 'unit', 'percentSign', 'literal'].includes(p.type))
      .map((p) => p.value)
  )
  const digits = new Intl.NumberFormat(locale, { useGrouping: false })
  return {
    /** Formats a finite number, or returns empty text for null. */
    format(value: number | null): string {
      return value === null ? '' : formatter.format(value)
    },
    /** Returns null for empty, NaN for invalid text, and a number for valid localized text. */
    parse(text: string): number | null {
      let normalized = text.trim()
      if (!normalized) return null
      const negative = normalized.startsWith('(') && normalized.endsWith(')')
      if (negative && options.currencySign === 'accounting') normalized = normalized.slice(1, -1)
      for (let i = 0; i < 10; i++) normalized = normalized.split(digits.format(i)).join(String(i))
      for (const token of [...groups, ...tokens]) normalized = normalized.split(token).join('')
      normalized = normalized
        .replace(/[\u061c\u200e\u200f]/g, '')
        .split(decimal)
        .join('.')
        .replace(/[−﹣－]/g, '-')
        .replace(/＋/g, '+')
        .trim()
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN
      let value = Number(normalized)
      if (negative) value = -value
      if (options.style === 'percent') value /= 100
      return Number.isFinite(value) ? value : NaN
    },
  }
}

/** Pure number-field state, formatting, commands, and host parts. */
export function numberField(options: NumberFieldOptions = {}) {
  const format = createNumberFieldFormat(options.locale, options.formatOptions)
  const value =
    typeof options.value === 'number' && Number.isFinite(options.value) ? options.value : null
  const text = options.inputValue ?? format.format(value)
  const parsed = options.inputValue === undefined ? value : format.parse(text)
  const min = Number.isFinite(options.min) ? options.min : undefined
  const max = Number.isFinite(options.max) ? Math.max(options.max!, min ?? -Infinity) : undefined
  const step = Number.isFinite(options.step) && options.step! > 0 ? options.step! : 1
  const interactive = !options.disabled && !options.readonly
  const clamp = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n))
  // Decimal rounding removes accumulated binary noise while preserving useful precision.
  const clean = (n: number) => Number(n.toPrecision(16))
  const next = (direction: 1 | -1, amount = step) => {
    if (parsed === null || !Number.isFinite(parsed)) return clamp(0)
    const origin = min ?? 0
    const position = clean((parsed - origin) / amount)
    const index = direction > 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1
    const candidate = clean(origin + index * amount)
    if (!Number.isFinite(candidate)) return parsed
    return clamp(candidate)
  }
  const publish = (nextValue: number | null) => {
    options.onInputValueChange?.(format.format(nextValue))
    if (nextValue !== value) {
      options.onValueChange?.(nextValue)
      options.onValueCommit?.(nextValue)
    }
  }
  const commit = () => {
    if (!interactive || options.inputValue === undefined) return
    publish(parsed === null ? null : Number.isFinite(parsed) ? clamp(parsed) : value)
  }
  const incrementDisabled =
    !interactive || (parsed !== null && Number.isFinite(parsed) && next(1) <= parsed)
  const decrementDisabled =
    !interactive || (parsed !== null && Number.isFinite(parsed) && next(-1) >= parsed)
  const invalid =
    !!options.invalid ||
    (parsed !== null &&
      (!Number.isFinite(parsed) || parsed < (min ?? -Infinity) || parsed > (max ?? Infinity)))
  const flags = {
    'data-disabled': options.disabled ? '' : undefined,
    'data-readonly': options.readonly ? '' : undefined,
    'data-required': options.required ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }
  const move = (direction: 1 | -1, amount?: number) => {
    if (!interactive || (direction > 0 ? incrementDisabled : decrementDisabled)) return
    publish(next(direction, amount))
  }
  const trigger = (direction: 1 | -1): PartProps<'button'> => {
    const disabled = direction > 0 ? incrementDisabled : decrementDisabled
    return {
      attrs: {
        type: 'button',
        'aria-label': direction > 0 ? 'Increase' : 'Decrease',
        'aria-controls': options.id,
        disabled: options.disabled || undefined,
        'aria-disabled': disabled ? 'true' : undefined,
        'data-disabled': disabled ? '' : undefined,
      },
      on: {
        click(event) {
          if (!event.defaultPrevented) move(direction)
        },
      },
    }
  }
  const input: PartProps<'input'> = {
    attrs: {
      ...flags,
      id: options.id,
      type: 'text',
      role: 'spinbutton',
      inputmode: 'decimal',
      autocomplete: 'off',
      value: text,
      disabled: options.disabled || undefined,
      readonly: options.readonly || undefined,
      required: options.required || undefined,
      'aria-disabled': options.disabled ? 'true' : undefined,
      'aria-readonly': options.readonly ? 'true' : undefined,
      'aria-required': options.required ? 'true' : undefined,
      'aria-invalid': invalid ? 'true' : undefined,
      'aria-valuemin': min === undefined ? undefined : String(min),
      'aria-valuemax': max === undefined ? undefined : String(max),
      'aria-valuenow': parsed === null || !Number.isFinite(parsed) ? undefined : String(parsed),
      'aria-valuetext':
        parsed === null || !Number.isFinite(parsed) ? undefined : format.format(parsed),
    },
    on: {
      input(event) {
        if (interactive && !event.defaultPrevented)
          options.onInputValueChange?.(event.currentTarget.value)
      },
      blur() {
        commit()
      },
      keydown(event) {
        if (
          !interactive ||
          event.defaultPrevented ||
          event.isComposing ||
          event.keyCode === 229 ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        )
          return
        if (event.key === 'Enter') {
          commit()
          return
        }
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key)) {
          event.preventDefault()
          move(
            event.key === 'ArrowUp' || event.key === 'PageUp' ? 1 : -1,
            event.key.startsWith('Page')
              ? options.largeStep && options.largeStep > 0
                ? options.largeStep
                : step * 10
              : step
          )
        } else if (event.key === 'Home' && min !== undefined) {
          event.preventDefault()
          publish(min)
        } else if (event.key === 'End' && max !== undefined) {
          event.preventDefault()
          publish(max)
        }
      },
    },
  }
  return {
    state: {
      value,
      inputValue: text,
      parsedValue: parsed,
      invalid,
      incrementDisabled,
      decrementDisabled,
    },
    /** Commit the current draft, restoring invalid text and clamping finite values. */
    commit,
    parts: {
      root: {
        attrs: {
          ...flags,
          role: 'group',
          'aria-disabled': options.disabled ? 'true' : undefined,
          'aria-invalid': invalid ? 'true' : undefined,
        },
        on: {},
      } satisfies PartProps<'div'>,
      input,
      incrementTrigger: trigger(1),
      decrementTrigger: trigger(-1),
    },
  }
}
