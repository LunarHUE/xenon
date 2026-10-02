import type { ComponentProps } from '@solidjs/web'
import { CheckboxGroup } from './checkbox-group'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<CheckboxGroup.Item
    value="a"
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<CheckboxGroup.Item value="a" as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<CheckboxGroup.Item value="a" ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<CheckboxGroup.Item value="a" classList={{ active: true }} />
  ;<CheckboxGroup
    disabled=""
    required=""
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<CheckboxGroup.Item
    value="a"
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
