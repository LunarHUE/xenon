import { button } from '@kit/core'
import type { ButtonOptions } from '@kit/core'
import { Dynamic } from '@solidjs/web'
import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'
import { createMemo, omit } from 'solid-js'

import { spread } from '../spread'

export interface ButtonProps extends Omit<ComponentProps<'button'>, 'type' | 'disabled'> {
  /** Host element or component. Non-`button` hosts get role and keyboard handling. */
  as?: ValidComponent
  disabled?: boolean
  type?: ButtonOptions['type']
}

export function Button(props: ButtonProps): JSX.Element {
  const rest = omit(props, 'as', 'disabled', 'type')
  const part = createMemo(() =>
    button({
      native: (props.as ?? 'button') === 'button',
      disabled: props.disabled,
      type: props.type,
    })
  )
  return <Dynamic component={props.as ?? 'button'} {...spread(part(), rest)} />
}
