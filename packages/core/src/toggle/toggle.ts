import { button } from '../button/button'
import type { ButtonOptions, ButtonState } from '../button/button'
import type { PartProps } from '../part'

/** Hosts supporting pressed-button semantics; hyperlinks are excluded. */
export type ToggleHost = 'button' | 'input' | 'generic'

/** Button behavior from {@link ButtonOptions}, with caller-owned pressed state. */
export interface ToggleOptions extends Omit<ButtonOptions, 'host'> {
  /** Host semantics to generate. Defaults to 'button'. */
  host?: ToggleHost
  /** Current pressed state, defaulting to false; drives aria-pressed and styling hooks. */
  pressed?: boolean
  /**
   * Synchronously proposes the opposite of pressed on an interactive click.
   * Never called during construction or while disabled/pending. The caller must
   * supply the next pressed value; the returned snapshot is not updated.
   */
  onPressedChange?: (pressed: boolean) => void
}

/** Resolved {@link ButtonState} with the toggle host and pressed value. */
export interface ToggleState extends Omit<ButtonState, 'host'> {
  /** Resolved native or generic host semantics. */
  host: ToggleHost
  /** Current pressed value used by attributes and the click proposal. */
  pressed: boolean
}

/** State and a host-specific root part; rebuild after option changes. */
export interface ToggleResult<R> {
  /** Resolved values used to generate this part. */
  state: ToggleState
  /** Parts to bind to the rendered control. */
  parts: {
    /** Host attributes and event handlers for the control. */
    root: R
  }
}

/** Result union for a host selected at runtime; literal hosts return narrower part types. */
export type ToggleAny =
  | ToggleResult<PartProps<'button'>>
  | ToggleResult<PartProps<'input'>>
  | ToggleResult<PartProps<'div'>>

/**
 * Builds a native toggle button part with aria-pressed and pressed-state hooks.
 *
 * @remarks
 * Inherits {@link button} host behavior, adding a pressed-change proposal to
 * interactive clicks. Construction does not bind the part or change state.
 * Rebuild after updating options. Click cancellation does not stop propagation.
 */
export function toggle(
  options?: ToggleOptions & { host?: 'button' }
): ToggleResult<PartProps<'button'>>
/** Builds an input button part with pressed state and native button behavior. */
export function toggle(options: ToggleOptions & { host: 'input' }): ToggleResult<PartProps<'input'>>
/** Adds button role and clicks on Enter keydown and Space keyup when interactive. */
export function toggle(options: ToggleOptions & { host: 'generic' }): ToggleResult<PartProps<'div'>>
/** Builds the part for a runtime host using the defaults in {@link ToggleOptions}. */
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
