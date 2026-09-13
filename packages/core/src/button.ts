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

export function button(options: ButtonOptions = {}): PartProps {
  const native = options.native ?? true
  const disabled = options.disabled ?? false
  const dataDisabled = disabled ? '' : undefined

  if (native) {
    return {
      attrs: {
        type: options.type ?? 'button',
        disabled: disabled || undefined,
        'data-disabled': dataDisabled,
      },
      on: {},
    }
  }

  return {
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
              ;(event.currentTarget as HTMLElement).click()
            } else if (event.key === ' ') {
              event.preventDefault()
            }
          },
          keyup(event) {
            if (event.key === ' ') {
              event.preventDefault()
              ;(event.currentTarget as HTMLElement).click()
            }
          },
        },
  }
}
