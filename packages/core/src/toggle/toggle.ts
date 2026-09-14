import { button } from '../button/button'
import type { ButtonOptions, ButtonState } from '../button/button'
import type { PartProps } from '../part'

export type ToggleHost = 'button' | 'input' | 'generic'

export interface ToggleOptions extends Omit<ButtonOptions, 'host'> {
  host?: ToggleHost
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

export interface ToggleState extends Omit<ButtonState, 'host'> {
  host: ToggleHost
  pressed: boolean
}

export interface ToggleResult<R> {
  state: ToggleState
  parts: { root: R }
}

export type ToggleAny =
  | ToggleResult<PartProps<'button'>>
  | ToggleResult<PartProps<'input'>>
  | ToggleResult<PartProps<'div'>>

export function toggle(
  options?: ToggleOptions & { host?: 'button' }
): ToggleResult<PartProps<'button'>>
export function toggle(options: ToggleOptions & { host: 'input' }): ToggleResult<PartProps<'input'>>
export function toggle(options: ToggleOptions & { host: 'generic' }): ToggleResult<PartProps<'div'>>
export function toggle(options: ToggleOptions): ToggleAny
export function toggle(options: ToggleOptions = {}): ToggleAny {
  const host = options.host ?? 'button'
  const base = button({
    host,
    disabled: options.disabled,
    focusableWhenDisabled: options.focusableWhenDisabled,
    pending: options.pending,
    type: options.type,
    autofocus: options.autofocus,
  })

  const pressed = options.pressed ?? false
  const state: ToggleState = { ...base.state, host, pressed }
  const source = base.parts.root as PartProps<'button'>
  const block = source.on.click

  const root: PartProps<'button'> = {
    attrs: {
      ...source.attrs,
      'aria-pressed': pressed ? 'true' : 'false',
      'data-state': pressed ? 'on' : 'off',
      'data-pressed': pressed ? '' : undefined,
    },
    on: {
      ...source.on,
      click(event) {
        block?.(event)
        if (!state.interactive) return
        options.onPressedChange?.(!pressed)
      },
    },
  }

  return { state, parts: { root } }
}
