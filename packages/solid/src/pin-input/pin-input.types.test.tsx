import { PinInput } from './pin-input'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  // @ts-expect-error refs must match the selected native host
  ;<PinInput.Input index={0} ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<PinInput.Input index={0} classList={{ active: true }} />
  ;<PinInput
    disabled=""
    readonly=""
    required=""
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<PinInput.Input
    index={0}
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
