import type { ComponentProps } from '@solidjs/web'
import { RadioGroup } from './radio-group'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<RadioGroup.Item
    value="a"
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<RadioGroup.Item value="a" as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<RadioGroup.Item value="a" ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<RadioGroup.Item value="a" classList={{ active: true }} />
  ;<RadioGroup
    disabled=""
    readonly=""
    required=""
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<RadioGroup.Item
    value="a"
    disabled=""
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
