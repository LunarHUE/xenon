import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Calendar } from './index'

test('Calendar preserves native ref arrays and reactive attribute removal', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [value, setValue] = createSignal<string | undefined>('active')
  const { container } = render(() => (
    <Calendar ref={refs} today={{ year: 2024, month: 2, day: 15 }} class={value()}>
      <Calendar.Grid />
    </Calendar>
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  expect(host).toHaveAttribute('class', 'active')
  setValue(undefined)
  flush()
  expect(host).not.toHaveAttribute('class')
})

test('Calendar infers the selected native host ref', () => {
  const [value] = createSignal<string | undefined>()
  render(() => (
    <Calendar
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      today={{ year: 2024, month: 2, day: 15 }}
      class={value()}
    >
      <Calendar.Grid />
    </Calendar>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <Calendar today={{ year: 2024, month: 2, day: 15 }}>
      <Calendar.Day date={{ year: 2024, month: 2, day: 15 }} ref={refs} />
    </Calendar>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(1)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
