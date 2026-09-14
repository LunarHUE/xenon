import type { ButtonProps as SolidButtonProps } from '@kit/solid'
import type { ValidComponent } from '@solidjs/web'

type Loose<P> = Omit<P, 'as'> & { as?: ValidComponent } & Record<string, unknown>

export type ButtonProps = Loose<SolidButtonProps>

interface CheckedProps {
  as?: ValidComponent
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  invalid?: boolean
  name?: string
  value?: string
  form?: string
  autofocus?: boolean
  ref?: (el: HTMLElement) => void
}

export type CheckboxProps = CheckedProps & { indeterminate?: boolean } & Record<string, unknown>

export type SwitchProps = CheckedProps & Record<string, unknown>

export interface Components {
  button: ButtonProps
  checkbox: CheckboxProps
  switch: SwitchProps
}

export type ComponentName = keyof Components

export interface Mounted<P> {
  container: HTMLElement
  setProps(next: Partial<P>): void
  unmount(): void
  settle(): Promise<void>
}

export interface Harness {
  mount<N extends ComponentName>(name: N, props: Components[N]): Mounted<Components[N]>
}
