import type { ButtonProps as SolidButtonProps } from '@kit/solid'
import type { ValidComponent } from '@solidjs/web'

type Loose<P> = Omit<P, 'as'> & { as?: ValidComponent } & Record<string, unknown>

export type ButtonProps = Loose<SolidButtonProps>

export interface Components {
  button: ButtonProps
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
