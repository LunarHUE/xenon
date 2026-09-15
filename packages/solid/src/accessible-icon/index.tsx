import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { omit } from 'solid-js'
import { spread } from '../spread'

/** A named, noninteractive image wrapper. Children must be decorative content. */
export type AccessibleIconProps<T extends ValidComponent = 'span'> = ComponentProps<T> & {
  /** Accessible name exposed by the wrapper, required even for an empty icon. */
  label: string
  /** Host, defaulting to span. Use a noninteractive element. */
  as?: T
}

/**
 * Expose one named image and hide its decorative contents from assistive technology.
 * Supply noninteractive children. The inner hidden span avoids cloning or mutating
 * caller-owned SVG nodes; interactive descendants are outside this contract.
 * Author attributes override the generated role and label through spread.
 */
export function AccessibleIcon<T extends ValidComponent = 'span'>(
  props: AccessibleIconProps<T>
): JSX.Element {
  const rest = omit(props as Record<string, unknown>, 'as', 'label', 'children')
  return (
    <Dynamic
      component={props.as ?? 'span'}
      {...spread({ attrs: { role: 'img', 'aria-label': props.label }, on: {} }, { ...rest })}
    >
      <span aria-hidden="true">{props.children}</span>
    </Dynamic>
  )
}
