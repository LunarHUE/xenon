import { Combobox } from './combobox'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  // @ts-expect-error refs must match the selected native host
  ;<Combobox.Input ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Combobox.Input classList={{ active: true }} />
  ;<Combobox items={[]} disabled="" readonly="" required="">
    <Combobox.Input
      ref={(el) => {
        const input: HTMLInputElement = el
        void input
      }}
    />
  </Combobox>
  ;<Combobox.Trigger
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
