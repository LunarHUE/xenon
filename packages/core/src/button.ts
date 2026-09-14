import { activate } from './activate'
import type { GlobalAttrs, TagAttrs } from './attrs.generated'
import type { PartProps } from './part'

export type ButtonHost = 'button' | 'input' | 'link' | 'generic'

export interface ButtonOptions {
  host?: ButtonHost
  disabled?: TagAttrs['button']['disabled']
  focusableWhenDisabled?: boolean
  pending?: boolean
  type?: TagAttrs['button']['type']
  autofocus?: GlobalAttrs['autofocus']
}

export interface ButtonState {
  host: ButtonHost
  disabled: boolean
  pending: boolean
  interactive: boolean
}

export interface ButtonResult<R> {
  state: ButtonState
  parts: { root: R }
}

export type ButtonAny =
  | ButtonResult<PartProps<'button'>>
  | ButtonResult<PartProps<'input'>>
  | ButtonResult<PartProps<'a'>>
  | ButtonResult<PartProps<'div'>>

function isActivationKey(key: string) {
  return key === 'Enter' || key === ' '
}

export function button(
  options?: ButtonOptions & { host?: 'button' }
): ButtonResult<PartProps<'button'>>
export function button(options: ButtonOptions & { host: 'input' }): ButtonResult<PartProps<'input'>>
export function button(options: ButtonOptions & { host: 'link' }): ButtonResult<PartProps<'a'>>
export function button(options: ButtonOptions & { host: 'generic' }): ButtonResult<PartProps<'div'>>
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
      role: 'button',
      tabindex: focusable ? 0 : undefined,
      'aria-disabled': inert,
    },
    on: {
      click: block,
      keydown(event) {
        if (!isActivationKey(event.key)) return
        event.preventDefault()
        if (event.repeat || !interactive) return
        if (event.key === 'Enter') activate(event)
      },
      keyup(event) {
        if (event.key !== ' ') return
        event.preventDefault()
        if (interactive) activate(event)
      },
    },
  }
  return { state, parts: { root } }
}
