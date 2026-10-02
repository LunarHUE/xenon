import type { ComponentProps } from '@solidjs/web'
import { Avatar } from './index'

function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}

/** Compile selected native refs without mounting these components. */
export function hostContracts() {
  const custom = (
    <Avatar
      as={CustomHost}
      marker="custom"
      ref={(node) => {
        const button: HTMLButtonElement = node
        void button
      }}
    />
  )
  void custom
  const wrongRef = (node: HTMLInputElement) => {
    void node
  }
  // @ts-expect-error refs must match the selected native host
  const wrong = <Avatar as="a" ref={wrongRef} />
  void wrong
  // @ts-expect-error custom hosts retain required props
  const missing = <Avatar as={CustomHost} />
  void missing
  const host0 = (
    <Avatar
      as="a"
      href="#"
      ref={(node) => {
        const anchor: HTMLAnchorElement = node
        void anchor
      }}
    />
  )
  const host1 = (
    <Avatar.Fallback
      as="button"
      ref={(node) => {
        const button: HTMLButtonElement = node
        void button
      }}
    />
  )
  void host0
  void host1
}
