import type { ButtonProps } from '@kit/solid'

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
