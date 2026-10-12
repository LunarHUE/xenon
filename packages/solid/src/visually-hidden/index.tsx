import { dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createSignal, omit } from 'solid-js'
import { spread } from '../spread'

/** Polymorphic screen-reader content with optional focus reveal. */
export type VisuallyHiddenProps<T extends ValidComponent = 'span'> = Omit<
  ComponentProps<T>,
  'as'
> & {
  /** Rendered host, defaulting to span. */
  as?: T
  /** Reveal while the host or its descendants have focus. Defaults to false. */
  focusable?: boolean
}

/** Complete clipping recipe that preserves layout-independent accessible text. */
const hiddenStyle = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  'clip-path': 'inset(50%)',
  'white-space': 'nowrap',
  'border-width': '0',
} satisfies JSX.CSSProperties

/**
 * Hide content visually without removing it from the accessibility tree.
 * Author styles override the clipping recipe, including string styles. Focusable
 * only reveals existing focus targets; it does not add a tab stop to the wrapper.
 */
export function VisuallyHidden<T extends ValidComponent = 'span'>(
  props: VisuallyHiddenProps<T>
): JSX.Element {
  const [focused, setFocused] = createSignal(false)
  const rest = omit(props as Record<string, unknown>, 'as', 'focusable', 'children', 'style')
  const style = () => {
    const defaults = props.focusable && focused() ? {} : hiddenStyle
    return typeof props.style === 'string'
      ? `${Object.entries(defaults)
          .map(([key, value]) => `${key}:${value}`)
          .join(';')};${props.style}`
      : { ...defaults, ...props.style }
  }
  const Host = dynamic(() => props.as ?? 'span')
  return (
    <Host
      {...spread(
        {
          attrs: {},
          on: {
            focusin: () => setFocused(true),
            focusout: (event: FocusEvent) => {
              if (
                !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)
              )
                setFocused(false)
            },
          },
        },
        { ...rest }
      )}
      style={style()}
    >
      {props.children}
    </Host>
  )
}
