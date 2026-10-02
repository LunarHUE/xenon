import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { RangeCalendar } from './index'

test('RangeCalendar preserves native ref arrays and reactive attribute removal', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [value, setValue] = createSignal<string | undefined>('active')
  const { container } = render(() => (
    <RangeCalendar ref={refs} today={{ year: 2024, month: 2, day: 15 }} class={value()}>
      <RangeCalendar.Grid />
    </RangeCalendar>
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  expect(host).toHaveAttribute('class', 'active')
  setValue(undefined)
  flush()
  expect(host).not.toHaveAttribute('class')
})

test('RangeCalendar infers the selected native host ref', () => {
  const [value] = createSignal<string | undefined>()
  render(() => (
    <RangeCalendar
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      today={{ year: 2024, month: 2, day: 15 }}
      class={value()}
    >
      <RangeCalendar.Grid />
    </RangeCalendar>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <RangeCalendar today={{ year: 2024, month: 2, day: 15 }}>
      <RangeCalendar.Day date={{ year: 2024, month: 2, day: 15 }} ref={refs} />
    </RangeCalendar>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(1)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
