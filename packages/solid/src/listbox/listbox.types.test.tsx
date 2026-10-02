import type { ComponentProps } from '@solidjs/web'
import { Listbox } from './listbox'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<Listbox
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<Listbox as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<Listbox ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Listbox classList={{ active: true }} />
  ;<Listbox
    disabled=""
    readonly=""
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<Listbox.Item
    value="a"
    disabled=""
    as="button"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
