import type { ComponentProps, JSX, ValidComponent } from '@solidjs/web'

import { createChecked } from '../internal/checked'
import type { CheckedOwn } from '../internal/checked'

interface Own extends CheckedOwn {
  indeterminate?: boolean
}

export type CheckboxProps<T extends ValidComponent = 'input'> = Omit<
  ComponentProps<T>,
  keyof Own | 'as'
> &
  Own & { as?: T }

export function Checkbox<T extends ValidComponent = 'input'>(props: CheckboxProps<T>): JSX.Element {
  return createChecked(props, 'checkbox')
}
