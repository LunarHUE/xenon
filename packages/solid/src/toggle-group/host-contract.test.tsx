import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { ToggleGroup } from './index'

test('ToggleGroup preserves native ref arrays and empty boolean attributes', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  const { container } = render(() => (
    <ToggleGroup ref={refs} disabled={disabled()}>
      <ToggleGroup.Item value="a">Action</ToggleGroup.Item>
    </ToggleGroup>
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  const button = container.querySelector('button')!
  expect(button).toHaveAttribute('aria-disabled', 'true')
  setDisabled(undefined)
  flush()
  expect(button).not.toHaveAttribute('aria-disabled')
})

test('ToggleGroup infers the selected native host ref', () => {
  const [disabled] = createSignal<boolean>(false)
  render(() => (
    <ToggleGroup
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      disabled={disabled()}
    >
      <ToggleGroup.Item value="a">Action</ToggleGroup.Item>
    </ToggleGroup>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <ToggleGroup>
      <ToggleGroup.Item ref={refs} value="a">
        Action
      </ToggleGroup.Item>
    </ToggleGroup>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(1)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
