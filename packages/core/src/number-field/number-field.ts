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
  /** Intl formatting options for decimal, currency, percent, and unit styles. Nonstandard notation throws RangeError. */
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

/**
 * Creates locale-aware formatting and strict finite parsing without browser APIs.
 * Only standard notation is supported; compact, scientific, and engineering modes
 * throw RangeError because their abbreviated display cannot be parsed as decimals.
 * Display rounding follows Intl options and never changes untouched numeric state.
 */
export function createNumberFieldFormat(locale = 'en-US', options: Intl.NumberFormatOptions = {}) {
  if (options.notation !== undefined && options.notation !== 'standard')
    throw new RangeError('NumberField supports only standard number notation')
  const formatter = new Intl.NumberFormat(locale, options)
  const parts = formatter.formatToParts(-12345.6)
  const decimal =
    new Intl.NumberFormat(locale).formatToParts(1.1).find((p) => p.type === 'decimal')?.value ?? '.'
  const groups = new Set(parts.filter((p) => p.type === 'group').map((p) => p.value))
  const tokenParts =
    options.style === 'unit' || options.currencyDisplay === 'name'
      ? [-12345.6, -2, -1, 0, 1, 2, 3, 4, 5, 6, 11, 21, 100, 101, 1.1, 2.1].flatMap((value) =>
          formatter.formatToParts(value)
        )
      : parts
  const tokens = new Set(
    tokenParts
      .filter((p) => ['currency', 'unit', 'percentSign', 'literal'].includes(p.type))
      .map((p) => p.value)
  )
  const implicitUnits = new Map<string, number>()
  if (options.style === 'unit') {
    for (const amount of [0, 1, 2]) {
      const unitParts = formatter.formatToParts(amount)
      if (!unitParts.some((part) => part.type === 'integer'))
        implicitUnits.set(formatter.format(amount).trim(), amount)
    }
  }
  const digits = new Intl.NumberFormat(locale, { useGrouping: false })
  return {
    /** Formats a finite number, or returns empty text for null. */
    format(value: number | null): string {
      if (value === null) return ''
      const text = formatter.format(value)
      // Some Arabic unit forms omit both the number and its sign. Retain the
      // negative number explicitly so formatting cannot reverse its meaning.
      return options.style === 'unit' &&
        value < 0 &&
        !formatter.formatToParts(value).some((part) => part.type === 'integer')
        ? `${digits.format(value)} ${text}`
        : text
    },
    /** Returns null for empty, NaN for invalid text, and a number for valid localized text. */
    parse(text: string): number | null {
      let normalized = text.trim()
      if (!normalized) return null
      if (implicitUnits.has(normalized)) return implicitUnits.get(normalized)!
      const negative = normalized.startsWith('(') && normalized.endsWith(')')
      if (negative && options.currencySign === 'accounting') normalized = normalized.slice(1, -1)
      for (let i = 0; i < 10; i++) normalized = normalized.split(digits.format(i)).join(String(i))
      // Fold punctuation before applying the locale's grouping and decimal rules.
      normalized = normalized.replace(/，/g, ',').replace(/．/g, '.')
      for (const token of [...groups, ...tokens].sort((a, b) => b.length - a.length))
        normalized = normalized.split(token).join('')
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
    const quotient = (parsed - origin) / amount
    const nearest = Math.round(quotient)
    // Subtraction and division can place an on-grid value just beside its integer
    // index. Correct only floating-point noise before choosing the next grid line.
    // Cap the tolerance so large indices retain meaningful fractional steps.
    const tolerance = Math.min(1e-7, Number.EPSILON * Math.max(1, Math.abs(quotient)) * 4)
    const position = Math.abs(quotient - nearest) <= tolerance ? nearest : quotient
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
    /** Present while the root is disabled. */
    'data-disabled': options.disabled ? '' : undefined,
    /** Present while edits are blocked without disabling focus. */
    'data-readonly': options.readonly ? '' : undefined,
    /** Present when a nonempty value is required. */
    'data-required': options.required ? '' : undefined,
    /** Present for author invalid state or a draft parse/range error. */
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
        parsed === null || !Number.isFinite(parsed)
          ? undefined
          : options.formatOptions?.style === 'currency' &&
              options.formatOptions.currencySign === 'accounting'
            ? new Intl.NumberFormat(options.locale ?? 'en-US', {
                ...options.formatOptions,
                currencySign: 'standard',
              })
                .formatToParts(parsed)
                // Announce accounting negatives explicitly while retaining locale order and bidi marks.
                .map((part) => (part.type === 'minusSign' ? '−' : part.value))
                .join('')
            : format.format(parsed),
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
    /** Committed numeric value, editable text, validation and step availability. */
    state: {
      /** Finite committed number, or null for empty or nonfinite input. */
      value,
      /** Supplied draft or the formatted committed value. */
      inputValue: text,
      /** Parsed draft, null for empty, or NaN for text that cannot be parsed. */
      parsedValue: parsed,
      /** Author invalid state or a nonempty draft outside the numeric bounds. */
      invalid,
      /** Whether increasing is blocked by interaction state or the upper bound. */
      incrementDisabled,
      /** Whether decreasing is blocked by interaction state or the lower bound. */
      decrementDisabled,
    },
    /** Commit the current draft, restoring invalid text and clamping finite values. */
    commit,
    /** Group, editable spinbutton and two directional step buttons. */
    parts: {
      /** Semantic group with disabled and invalid announcements. */
      root: {
        /** Group role, ARIA state and shared styling attributes. */
        attrs: {
          ...flags,
          /** Associates the input and step buttons as one group. */
          role: 'group',
          /** Announces disabled state on the group. */
          'aria-disabled': options.disabled ? 'true' : undefined,
          /** Announces author or draft validation errors. */
          'aria-invalid': invalid ? 'true' : undefined,
        },
        /** Root has no interaction handlers. */
        on: {},
      } satisfies PartProps<'div'>,
      /** Text spinbutton, draft input, blur commit and keyboard stepping. */
      input,
      /** Button requesting the next greater step. */
      incrementTrigger: trigger(1),
      /** Button requesting the next smaller step. */
      decrementTrigger: trigger(-1),
    },
  }
}
