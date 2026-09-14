import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'

import { createChecked } from '../internal/checked'
import type { CheckedOwn } from '../internal/checked'

export type SwitchProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  keyof CheckedOwn | 'as'
> &
  CheckedOwn & { as?: T }

export function Switch<T extends ValidComponent = 'input'>(props: SwitchProps<T>): JSX.Element {
  return createChecked(props, 'switch')
}
