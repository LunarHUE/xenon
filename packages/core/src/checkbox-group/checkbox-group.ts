import { checkbox } from '../checkbox/checkbox'
import type { CheckboxAny, CheckboxOptions } from '../checkbox/checkbox'
import type { PartProps } from '../part'

/** Current group selection and shared checkbox behavior. */
export interface CheckboxGroupOptions {
  /** Selected strings. Omission is an empty selection; core never mutates the array. */
  value?: readonly string[]
  /** Shared native submission name; unchecked items contribute nothing. */
  name?: string
  /** Explicit native form owner ID shared by items. */
  form?: string
  /** Disables all items. Defaults to false. */
  disabled?: boolean
  /** Blocks all selection changes while retaining focusability. Defaults to false. */
  readonly?: boolean
  /** Requires at least one selected value. Defaults to false. */
  required?: boolean
  /** Author supplied invalid state; does not perform validation. Defaults to false. */
  invalid?: boolean
  /** Reports a new array on a permitted membership change. Initialization is silent. */
  onValueChange?: (value: string[]) => void
}

/** Resolved group snapshot. */
export interface CheckboxGroupState {
  /** Current selected values, preserving the supplied order. */
  value: readonly string[]
  /** Whether every item is disabled. */
  disabled: boolean
  /** Whether every item is read only. */
  readonly: boolean
  /** Whether a nonempty selection is required. */
  required: boolean
  /** Explicit invalid state. */
  invalid: boolean
  /** Whether group membership can change. */
  interactive: boolean
}

/** Pure group behavior and checkbox item factories. */
export interface CheckboxGroupResult {
  /** Resolved current values and flags. */
  state: CheckboxGroupState
  /** Proposes membership without mutating this snapshot; unchanged membership is silent. */
  change(value: string, checked: boolean): void
  /** Attribute and event bundles. */
  parts: {
    /** Group semantics and shared styling flags. */
    root: PartProps<'div'>
    /** Builds an ordinary checkbox. Group flags are OR combined; local required remains independent. */
    item(
      value: string,
      options?: Omit<CheckboxOptions, 'value' | 'checked' | 'onCheckedChange'>
    ): CheckboxAny
  }
}

/** Builds a multiple-selection group. Checkboxes retain independent native tab stops and keys. */
export function checkboxGroup(options: CheckboxGroupOptions = {}): CheckboxGroupResult {
  const value = options.value ?? []
  const disabled = options.disabled ?? false
  const readonly = options.readonly ?? false
  const required = options.required ?? false
  const invalid = options.invalid ?? false
  const state = {
    value,
    disabled,
    readonly,
    required,
    invalid,
    interactive: !disabled && !readonly,
  }
  const change = (item: string, checked: boolean) => {
    if (!state.interactive || value.includes(item) === checked) return
    options.onValueChange?.(checked ? [...value, item] : value.filter((entry) => entry !== item))
  }
  return {
    state,
    change,
    parts: {
      root: {
        attrs: {
          role: 'group',
          'data-state': value.length ? 'checked' : 'unchecked',
          'data-disabled': disabled ? '' : undefined,
          'data-readonly': readonly ? '' : undefined,
          'data-required': required ? '' : undefined,
          'data-invalid': invalid ? '' : undefined,
          'aria-disabled': disabled ? 'true' : undefined,
          'aria-invalid': invalid ? 'true' : undefined,
        },
        on: {},
      },
      item: (item, local = {}) =>
        checkbox({
          ...local,
          checked: value.includes(item),
          value: item,
          name: local.name ?? options.name,
          form: local.form ?? options.form,
          disabled: disabled || local.disabled,
          readonly: readonly || local.readonly,
          invalid: invalid || local.invalid,
          required: local.required || (required && value.length === 0),
          onCheckedChange: (checked) => change(item, checked),
        }),
    },
  }
}
