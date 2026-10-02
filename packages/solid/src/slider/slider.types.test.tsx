import { Slider } from './slider'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  // @ts-expect-error refs must match the selected native host
  ;<Slider.Thumb ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Slider.Thumb classList={{ active: true }} />
  ;<Slider
    disabled=""
    readonly=""
    required=""
    ref={(el) => {
      const div: HTMLDivElement = el
      void div
    }}
  />
  ;<Slider.Thumb
    ref={(el) => {
      const input: HTMLInputElement = el
      void input
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
