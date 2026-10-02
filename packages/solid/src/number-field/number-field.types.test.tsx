import { NumberField } from './number-field'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  // @ts-expect-error refs must match the selected native host
  ;<NumberField.Input ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<NumberField.Input classList={{ active: true }} />
  ;<NumberField
    disabled=""
    readonly=""
    required=""
    class={['a', { b: true }]}
    title="Native"
    prop:align="left"
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<NumberField.Input
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
