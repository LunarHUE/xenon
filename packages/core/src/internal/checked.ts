import { activate } from '../internal/activate'
import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

/** Host semantics used by checkbox and switch parts. Generic hosts supply no native checking behavior. */
export type CheckedHost = 'input' | 'button' | 'generic'

/** Current checked-control values and the callback used to request a change. */
export interface CheckedOptions {
  /** Host semantics to generate. Defaults to 'input'. */
  host?: CheckedHost
  /** Current checked value, defaulting to false. The caller owns updates. */
  checked?: TagAttrs['input']['checked']
  /** Blocks changes and disables native hosts. Defaults to false. */
  disabled?: TagAttrs['input']['disabled']
  /** Blocks changes while preserving focusability; exposed through ARIA. Defaults to false. */
  readonly?: TagAttrs['input']['readonly']
  /** Marks input hosts as required and other hosts as aria-required. Defaults to false. */
  required?: TagAttrs['input']['required']
  /** Sets invalid ARIA state and the data hook without validating the value. Defaults to false. */
  invalid?: boolean
  /** Form field name, forwarded only to input hosts. */
  name?: TagAttrs['input']['name']
  /** Submission value, forwarded only to input hosts. */
  value?: TagAttrs['input']['value']
  /** Associated form ID, forwarded only to input hosts. */
  form?: TagAttrs['input']['form']
  /** Emits autofocus and its data hook when true; does not itself move focus. */
  autofocus?: GlobalAttrs['autofocus']
  /**
   * Reports an interactive input change using its current checked property, or proposes
   * the opposite of the supplied checked state on other hosts. Called synchronously
   * by the event handler, never during construction; does not update state.
   */
  onCheckedChange?: (checked: boolean) => void
}

/** Normalized snapshot shared by checkbox and switch part generation. */
export interface CheckedState {
  /** Resolved host semantics. */
  host: CheckedHost
  /** Current checked value, independent of checkbox indeterminacy. */
  checked: boolean
  /** Whether the control is disabled. */
  disabled: boolean
  /** Whether checking changes are blocked without disabling the host. */
  readonly: boolean
  /** Whether a checked value is required. */
  required: boolean
  /** Caller-supplied validity state. */
  invalid: boolean
  /** True only when neither disabled nor readonly. */
  interactive: boolean
}

/** Role-specific state; only checkboxes support the mixed presentation. */
export type CheckedKind =
  | {
      /** Uses checkbox semantics. */
      role: 'checkbox'
      /** Shows mixed state without changing the checked value or activation proposal. */
      indeterminate: boolean
    }
  | {
      /** Uses switch semantics, with no mixed state. */
      role: 'switch'
    }

/** Host discriminator and matching attributes/listeners for one checked-control root. */
export type CheckedRoot =
  | {
      /** Identifies the native checkbox input branch. */
      host: 'input'
      /** Input attributes and native change reporting. */
      root: PartProps<'input'>
    }
  | {
      /** Identifies the button branch. */
      host: 'button'
      /** Button attributes with checked-role click and Space handling. */
      root: PartProps<'button'>
    }
  | {
      /** Identifies a host without native checked-control semantics. */
      host: 'generic'
      /** ARIA attributes, tab stop, and checked-role click and Space handling. */
      root: PartProps<'div'>
    }

/** Resolves omitted values without invoking callbacks or retaining mutable state. */
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

/**
 * Builds a checked-control part from a matching options/state snapshot.
 *
 * @param state - State derived from the same options with {@link checkedState}.
 * @remarks
 * Rebuild after the caller changes state. Input hosts use native change events;
 * other hosts propose a toggle on click and synthesize clicks on Space release.
 * Their Enter keydown is canceled without activation. Blocked clicks cancel the
 * default action, but do not stop propagation. Adapters must apply an input's
 * indeterminate DOM property themselves; this function only emits its data hook.
 */
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

  const keys = {
    keydown(event: KeyboardEvent) {
      if (event.key === ' ' || event.key === 'Enter') event.preventDefault()
    },
    keyup(event: KeyboardEvent & { currentTarget: HTMLElement }) {
      if (event.key !== ' ') return
      event.preventDefault()
      if (state.interactive) activate(event)
    },
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
      on: { click: toggle, ...keys },
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
    on: { click: toggle, ...keys },
  }
  return { host: 'generic', root }
}
