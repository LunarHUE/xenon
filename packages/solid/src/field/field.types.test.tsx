import type { ComponentProps } from '@solidjs/web'
import { Field } from './field'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<Field.Control
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<Field.Control as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<Field.Control ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Field.Control classList={{ active: true }} />
  ;<Field.Control
    disabled=""
    readonly=""
    required=""
    autofocus=""
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
  ;<Field.Control
    as="textarea"
    rows={3}
    ref={(el) => {
      const textarea: HTMLTextAreaElement = el
      void textarea
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
