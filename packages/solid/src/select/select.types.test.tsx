import type { ComponentProps } from '@solidjs/web'
import { Select } from './index'
import { test } from 'vitest'

/** Compile the selected native host contracts without mounting context-dependent parts. */
function CustomHost(props: ComponentProps<'button'> & { marker: string }) {
  return <button {...props} />
}
function nativeContracts() {
  const wrongRef = (el: HTMLTextAreaElement) => {
    void el
  }
  ;<Select.Trigger
    as={CustomHost}
    marker="custom"
    ref={(el) => {
      const button: HTMLButtonElement = el
      void button
    }}
  />
  // @ts-expect-error custom hosts keep their required props
  ;<Select.Trigger as={CustomHost} />
  // @ts-expect-error refs must match the selected native host
  ;<Select.Trigger ref={wrongRef} />
  // @ts-expect-error Solid 2 exposes native class, without classList compatibility
  ;<Select classList={{ active: true }} />
  ;<Select items={[]} disabled="" readonly="" required="">
    <Select.Trigger
      ref={(el) => {
        const button: HTMLButtonElement = el
        void button
      }}
    />
  </Select>
  ;<Select.Trigger
    as="a"
    href="#"
    ref={(el) => {
      const anchor: HTMLAnchorElement = el
      void anchor
    }}
  />
}
test('native host types compile', () => {
  void nativeContracts
})
