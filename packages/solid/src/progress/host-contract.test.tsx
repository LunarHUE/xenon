import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Progress } from './index'

test('Progress preserves native ref arrays and reactive attribute removal', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [value, setValue] = createSignal<string | undefined>('active')
  const { container } = render(() => <Progress ref={refs} value={25} class={value()} />)
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  expect(host).toHaveAttribute('class', 'active')
  setValue(undefined)
  flush()
  expect(host).not.toHaveAttribute('class')
})

test('Progress infers the selected native host ref', () => {
  const [value] = createSignal<string | undefined>()
  render(() => (
    <Progress
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      value={25}
      class={value()}
    />
  ))
})
