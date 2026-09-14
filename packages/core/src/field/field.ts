import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

export interface FieldIds {
  control?: string
  label?: string
  description?: string
  error?: string
}

export interface FieldOptions {
  ids?: FieldIds
  disabled?: boolean
  required?: boolean
  readonly?: boolean
  invalid?: boolean
  name?: TagAttrs['input']['name']
  describedBy?: GlobalAttrs['aria-describedby']
  labelledBy?: GlobalAttrs['aria-labelledby']
  hasDescription?: boolean
  hasError?: boolean
}

export interface FieldState {
  disabled: boolean
  required: boolean
  readonly: boolean
  invalid: boolean
  name: string | undefined
}

export interface FieldControlProps {
  attrs: GlobalAttrs & { name?: TagAttrs['input']['name'] }
  on: Record<never, never>
}

export interface FieldResult {
  state: FieldState
  parts: {
    root: PartProps<'div'>
    label: PartProps<'label'>
    description: PartProps<'p'>
    error: PartProps<'p'>
    control: FieldControlProps
  }
}

function tokens(...values: (string | undefined)[]): string | undefined {
  const present = values.filter((value): value is string => value !== undefined && value !== '')
  return present.length > 0 ? present.join(' ') : undefined
}

export function field(options: FieldOptions = {}): FieldResult {
  const ids = options.ids ?? {}
  const disabled = options.disabled ?? false
  const required = options.required ?? false
  const readonly = options.readonly ?? false
  const invalid = options.invalid ?? false

  const state: FieldState = { disabled, required, readonly, invalid, name: options.name }

  const flags: GlobalAttrs = {
    'data-disabled': disabled ? '' : undefined,
    'data-required': required ? '' : undefined,
    'data-readonly': readonly ? '' : undefined,
    'data-invalid': invalid ? '' : undefined,
  }

  const named = tokens(options.labelledBy, ids.label)
  const labelledBy =
    options.labelledBy === undefined && ids.control !== undefined ? undefined : named

  const describedBy = tokens(
    options.describedBy,
    options.hasDescription ? ids.description : undefined,
    invalid && options.hasError ? ids.error : undefined
  )

  return {
    state,
    parts: {
      root: { attrs: { ...flags, role: 'group' }, on: {} },
      label: { attrs: { ...flags, id: ids.label, for: ids.control }, on: {} },
      description: { attrs: { ...flags, id: ids.description }, on: {} },
      error: { attrs: { ...flags, id: ids.error, role: 'alert' }, on: {} },
      control: {
        attrs: {
          ...flags,
          id: ids.control,
          name: options.name,
          'aria-labelledby': labelledBy,
          'aria-describedby': describedBy,
          'aria-invalid': invalid ? 'true' : undefined,
        },
        on: {},
      },
    },
  }
}
