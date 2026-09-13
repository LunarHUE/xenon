import type { PartProps } from './part'

export interface ButtonOptions {
  /**
   * Whether the host is a native `<button>`. Native buttons get the browser's
   * role, focus and keyboard behavior for free. Any other host (`a`, `div`)
   * gets `role="button"`, a tab stop, and Enter/Space activation per the APG
   * button pattern.
   */
  native?: boolean
  disabled?: boolean
  /** Defaults to `button` so a button inside a form never submits by accident. */
  type?: 'button' | 'submit' | 'reset'
}

export function button(options?: ButtonOptions & { native?: true }): PartProps<'button'>
export function button(options: ButtonOptions & { native: false }): PartProps<'div'>
export function button(options: ButtonOptions): PartProps<'button'> | PartProps<'div'>
export function button(options: ButtonOptions = {}): PartProps<'button'> | PartProps<'div'> {
  const native = options.native ?? true
  const disabled = options.disabled ?? false
  const dataDisabled = disabled ? '' : undefined

  if (native) {
    const part: PartProps<'button'> = {
      attrs: {
        type: options.type ?? 'button',
        disabled: disabled || undefined,
        'data-disabled': dataDisabled,
      },
      on: {},
    }
    return part
  }

  const part: PartProps<'div'> = {
    attrs: {
      role: 'button',
      tabindex: disabled ? undefined : 0,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-disabled': dataDisabled,
    },
    on: disabled
      ? {}
      : {
          keydown(event) {
            // Enter activates on keydown; Space activates on keyup, and its
            // keydown is only cancelled so the page does not scroll.
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.click()
            } else if (event.key === ' ') {
              event.preventDefault()
            }
          },
          keyup(event) {
            if (event.key === ' ') {
              event.preventDefault()
              event.currentTarget.click()
            }
          },
        },
  }
  return part
}
