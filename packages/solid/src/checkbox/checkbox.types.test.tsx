import type { ComponentProps } from '@solidjs/web'
import { Checkbox } from './checkbox'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<Checkbox
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<Checkbox as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<Checkbox ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Checkbox classList={{ active: true }} />
  ;<Checkbox
    disabled=""
    readonly=""
    required=""
    autofocus=""
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
  ;<Checkbox
    as="button"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error native host rejects this attribute value
  ;<Checkbox checked="" />
}
test('native host types compile', () => {
  void nativeContracts
})
