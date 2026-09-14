import { activate } from '../internal/activate'
import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

export type CheckedHost = 'input' | 'button' | 'generic'

export interface CheckedOptions {
  host?: CheckedHost
  checked?: TagAttrs['input']['checked']
  disabled?: TagAttrs['input']['disabled']
  readonly?: TagAttrs['input']['readonly']
  required?: TagAttrs['input']['required']
  invalid?: boolean
  name?: TagAttrs['input']['name']
  value?: TagAttrs['input']['value']
  form?: TagAttrs['input']['form']
  autofocus?: GlobalAttrs['autofocus']
  onCheckedChange?: (checked: boolean) => void
}

export interface CheckedState {
  host: CheckedHost
  checked: boolean
  disabled: boolean
  readonly: boolean
  required: boolean
  invalid: boolean
  interactive: boolean
}

export type CheckedKind = { role: 'checkbox'; indeterminate: boolean } | { role: 'switch' }

export type CheckedRoot =
  | { host: 'input'; root: PartProps<'input'> }
  | { host: 'button'; root: PartProps<'button'> }
  | { host: 'generic'; root: PartProps<'div'> }

export function checkedState(options: CheckedOptions): CheckedState {
  const disabled = options.disabled ?? false
  const readonly = options.readonly ?? false
  return {
    host: options.host ?? 'input',
    checked: options.checked ?? false,
    disabled,
    readonly,
    required: options.required ?? false,
    invalid: options.invalid ?? false,
    interactive: !disabled && !readonly,
  }
}

export function checkedRoot(
  options: CheckedOptions,
  state: CheckedState,
  kind: CheckedKind
): CheckedRoot {
  const mixed = kind.role === 'checkbox' && kind.indeterminate

  const common: GlobalAttrs = {
    'data-state': mixed ? 'indeterminate' : state.checked ? 'checked' : 'unchecked',
    'data-checked': state.checked ? '' : undefined,
    ...(kind.role === 'checkbox' ? { 'data-indeterminate': mixed ? '' : undefined } : null),
    'data-disabled': state.disabled ? '' : undefined,
    'data-readonly': state.readonly ? '' : undefined,
    'data-required': state.required ? '' : undefined,
    'data-invalid': state.invalid ? '' : undefined,
    'data-autofocus': options.autofocus ? '' : undefined,
    autofocus: options.autofocus || undefined,
    'aria-readonly': state.readonly ? 'true' : undefined,
    'aria-invalid': state.invalid ? 'true' : undefined,
  }

  const ariaChecked: GlobalAttrs['aria-checked'] = mixed
    ? 'mixed'
    : state.checked
      ? 'true'
      : 'false'

  const block = (event: Event) => {
    if (!state.interactive) event.preventDefault()
  }

  if (state.host === 'input') {
    const root: PartProps<'input'> = {
      attrs: {
        ...common,
        ...(kind.role === 'switch' ? { role: 'switch' } : null),
        type: 'checkbox',
        checked: state.checked,
        disabled: state.disabled || undefined,
        required: state.required || undefined,
        name: options.name,
        value: options.value,
        form: options.form,
      },
      on: {
        click: block,
        change(event) {
          if (state.interactive) options.onCheckedChange?.(event.currentTarget.checked)
        },
      },
    }
    return { host: 'input', root }
  }

  const toggle = (event: Event) => {
    if (!state.interactive) {
      event.preventDefault()
      return
    }
    options.onCheckedChange?.(!state.checked)
  }

  const keydown = (event: KeyboardEvent) => {
    if (event.key === ' ') event.preventDefault()
  }

  if (state.host === 'button') {
    const root: PartProps<'button'> = {
      attrs: {
        ...common,
        role: kind.role,
        'aria-checked': ariaChecked,
        'aria-required': state.required ? 'true' : undefined,
        type: 'button',
        disabled: state.disabled || undefined,
      },
      on: { click: toggle, keydown },
    }
    return { host: 'button', root }
  }

  const root: PartProps<'div'> = {
    attrs: {
      ...common,
      role: kind.role,
      'aria-checked': ariaChecked,
      'aria-required': state.required ? 'true' : undefined,
      'aria-disabled': state.disabled ? 'true' : undefined,
      tabindex: state.disabled ? undefined : 0,
    },
    on: {
      click: toggle,
      keydown,
      keyup(event) {
        if (event.key !== ' ') return
        event.preventDefault()
        if (state.interactive) activate(event)
      },
    },
  }
  return { host: 'generic', root }
}
