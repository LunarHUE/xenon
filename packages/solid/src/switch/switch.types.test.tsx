import type { ComponentProps } from '@solidjs/web'
import { Switch } from './switch'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<Switch
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<Switch as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<Switch ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Switch classList={{ active: true }} />
  ;<Switch
    disabled=""
    readonly=""
    required=""
    autofocus=""
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
  ;<Switch
    as="button"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error native host rejects this attribute value
  ;<Switch defaultChecked="" />
}
test('native host types compile', () => {
  void nativeContracts
})
