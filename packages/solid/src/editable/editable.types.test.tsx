import { Editable } from './editable'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  // @ts-expect-error refs must match the selected native host
  ;<Editable.Input ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Editable.Input classList={{ active: true }} />
  ;<Editable
    disabled=""
    readonly=""
    required=""
    prop:align="left"
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<Editable.Input
    as="textarea"
    rows={3}
    ref={(el) => {
      const textarea: HTMLTextAreaElement = el
      void textarea
    }}
  />
  // @ts-expect-error native host rejects this attribute value
  ;<Editable.Input as="textarea" type="number" />
}
test('native host types compile', () => {
  void nativeContracts
})
