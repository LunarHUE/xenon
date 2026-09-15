import { activate } from '../internal/activate'
import type { GlobalAttrs, TagAttrs } from '../attrs.generated'
import type { PartProps } from '../part'

/** Native button/input, hyperlink, or a host requiring button role and keyboard behavior. */
export type ButtonHost = 'button' | 'input' | 'link' | 'generic'

/** Host and interaction state used to build a button part. */
export interface ButtonOptions {
  /** Host semantics to generate. Defaults to 'button'. */
  host?: ButtonHost
  /** Generic host role, defaulting to button. A link role activates only on Enter. Native host behavior is unchanged. */
  role?: GlobalAttrs['role']
  /** Blocks activation. Native hosts receive disabled unless focusability is requested. Defaults to false. */
  disabled?: TagAttrs['button']['disabled']
  /** Keeps disabled native and generic hosts tabbable. Links retain their own focus behavior. Defaults to false. */
  focusableWhenDisabled?: boolean
  /** Blocks activation and sets aria-disabled without adding native disabled. Defaults to false. */
  pending?: boolean
  /** Native button/input type; ignored for links and generic hosts. Defaults to 'button'. */
  type?: TagAttrs['button']['type']
  /** Emits autofocus and its data hook when true; does not itself move focus. */
  autofocus?: GlobalAttrs['autofocus']
}

/** Resolved interaction snapshot for the generated button part. */
export interface ButtonState {
  /** Resolved host semantics. */
  host: ButtonHost
  /** Whether the caller disabled the button. */
  disabled: boolean
  /** Whether the caller marked an operation as pending. */
  pending: boolean
  /** True only when neither disabled nor pending. */
  interactive: boolean
}

/** Button state and its host-specific part; rebuild when options change. */
export interface ButtonResult<R> {
  /** Normalized values used by the returned listeners and attributes. */
  state: ButtonState
  /** Parts to bind to the rendered button. */
  parts: {
    /** Root attributes and listeners for the chosen host. */
    root: R
  }
}

/** Result when the host is known only at runtime; use a literal host for a narrower result. */
export type ButtonAny =
  | ButtonResult<PartProps<'button'>>
  | ButtonResult<PartProps<'input'>>
  | ButtonResult<PartProps<'a'>>
  | ButtonResult<PartProps<'div'>>

function isActivationKey(key: string) {
  return key === 'Enter' || key === ' '
}

/**
 * Builds native button attributes and click-default blocking from current options.
 *
 * @remarks
 * Construction neither binds DOM listeners nor moves focus. Bind the returned
 * part and rebuild when options change. Noninteractive clicks have their default
 * action canceled; callers must separately gate their own activation callbacks.
 * Event propagation is not stopped.
 */
export function button(
  options?: ButtonOptions & { host?: 'button' }
): ButtonResult<PartProps<'button'>>
/** Builds an input button part with native type and disabled handling. */
export function button(options: ButtonOptions & { host: 'input' }): ButtonResult<PartProps<'input'>>
/** Preserves native link role and keyboard behavior; callers supply href and manage its focusability. */
export function button(options: ButtonOptions & { host: 'link' }): ButtonResult<PartProps<'a'>>
/** Adds a role and clicks on non-repeated Enter keydown; generic link roles leave Space unclaimed. */
export function button(options: ButtonOptions & { host: 'generic' }): ButtonResult<PartProps<'div'>>
/** Builds the part selected by a runtime host value. See {@link ButtonOptions} for defaults. */
export function button(options: ButtonOptions): ButtonAny
export function button(options: ButtonOptions = {}): ButtonAny {
  const host = options.host ?? 'button'
  const disabled = options.disabled ?? false
  const pending = options.pending ?? false
  const focusable = !disabled || (options.focusableWhenDisabled ?? false)
  const interactive = !disabled && !pending
  const state: ButtonState = { host, disabled, pending, interactive }
  const inert = disabled || pending ? 'true' : undefined

  const common = {
    'data-disabled': disabled ? '' : undefined,
    'data-pending': pending ? '' : undefined,
    'data-autofocus': options.autofocus ? '' : undefined,
    autofocus: options.autofocus || undefined,
  }

  const block = (event: Event) => {
    if (!interactive) event.preventDefault()
  }

  if (host === 'button' || host === 'input') {
    const root: PartProps<'button'> = {
      attrs: {
        ...common,
        type: options.type ?? 'button',
        disabled: disabled && !focusable ? true : undefined,
        'aria-disabled': (disabled && focusable) || pending ? 'true' : undefined,
        tabindex: disabled && focusable ? 0 : undefined,
      },
      on: { click: block },
    }
    return { state, parts: { root } }
  }

  if (host === 'link') {
    const root: PartProps<'a'> = {
      attrs: { ...common, 'aria-disabled': inert },
      on: { click: block },
    }
    return { state, parts: { root } }
  }

  const root: PartProps<'div'> = {
    attrs: {
      ...common,
      role: options.role ?? 'button',
      tabindex: focusable ? 0 : undefined,
      'aria-disabled': inert,
    },
    on: {
      click: block,
      keydown(event) {
        if (!isActivationKey(event.key)) return
        if (event.key === ' ' && options.role === 'link') return
        event.preventDefault()
        if (event.repeat || !interactive) return
        if (event.key === 'Enter') activate(event)
      },
      keyup(event) {
        if (event.key !== ' ' || options.role === 'link') return
        event.preventDefault()
        if (interactive) activate(event)
      },
    },
  }
  return { state, parts: { root } }
}
