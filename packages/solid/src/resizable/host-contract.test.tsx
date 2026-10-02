import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Resizable } from './index'

test('Resizable preserves native ref arrays and reactive attribute removal', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [value, setValue] = createSignal<string | undefined>('active')
  const { container } = render(() => (
    <Resizable>
      <Resizable.Panel ref={refs} index={0} class={value()} />
    </Resizable>
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  expect(host).toHaveAttribute('class', 'active')
  setValue(undefined)
  flush()
  expect(host).not.toHaveAttribute('class')
})

test('Resizable infers the selected native host ref', () => {
  const [value] = createSignal<string | undefined>()
  render(() => (
    <Resizable>
      <Resizable.Panel
        index={0}
        ref={(node) => {
          expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
        }}
      />
    </Resizable>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <Resizable>
      <Resizable.Panel index={0}>Left</Resizable.Panel>
      <Resizable.Handle index={0} ref={refs} />
      <Resizable.Panel index={1}>Right</Resizable.Panel>
    </Resizable>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(1)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
