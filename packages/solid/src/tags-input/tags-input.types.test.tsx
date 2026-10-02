import { TagsInput } from './tags-input'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  // @ts-expect-error refs must match the selected native host
  ;<TagsInput.Input ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<TagsInput.Input classList={{ active: true }} />
  ;<TagsInput
    disabled=""
    readonly=""
    required=""
    prop:align="left"
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<TagsInput.Input
    prop:valueAsNumber={2}
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
