import type { ComponentProps } from '@solidjs/web'
import { AccessibleIcon } from './index'

function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}

/** Compile selected native refs without mounting these components. */
export function hostContracts() {
  const custom = (
    <AccessibleIcon
      label="Named"
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
  const wrong = <AccessibleIcon label="Named" as="a" ref={wrongRef} />
  void wrong
  // @ts-expect-error custom hosts retain required props
  const missing = <AccessibleIcon label="Named" as={CustomHost} />
  void missing
  const host0 = (
    <AccessibleIcon
      as="a"
      label="Named"
      href="#"
      ref={(node) => {
        const anchor: HTMLAnchorElement = node
        void anchor
      }}
    />
  )
  void host0
}
