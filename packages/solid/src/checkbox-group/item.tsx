import type { JSX, ValidComponent } from '@solidjs/web'
import { Checkbox } from '../checkbox/checkbox'
import type { CheckboxProps } from '../checkbox/checkbox'
import { useCheckboxGroup } from './context'

/** Checkbox host props with membership owned by the enclosing group. */
export type CheckboxGroupItemProps<T extends ValidComponent = 'input'> = Omit<
  CheckboxProps<T>,
  'value' | 'checked' | 'defaultChecked'
> & {
  /** String identifying this selection and its native submitted value. Empty strings are valid. */
  value: string
}

/** Renders a group-owned checkbox. Native inputs remain independent browser tab stops. */
export function CheckboxGroupItem<T extends ValidComponent = 'input'>(
  props: CheckboxGroupItemProps<T>
): JSX.Element {
  if (!useCheckboxGroup())
    throw new Error('CheckboxGroup.Item must be rendered inside a <CheckboxGroup>')
  return <Checkbox {...(props as CheckboxProps<T>)} />
}
