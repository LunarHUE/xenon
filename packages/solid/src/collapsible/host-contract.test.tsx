import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Collapsible } from './index'

test('Collapsible preserves native ref arrays and empty boolean attributes', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  const { container } = render(() => (
    <Collapsible ref={refs} disabled={disabled()}>
      <Collapsible.Trigger>Action</Collapsible.Trigger>
    </Collapsible>
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  const button = container.querySelector('button')!
  expect(button).toBeDisabled()
  setDisabled(undefined)
  flush()
  expect(button).not.toBeDisabled()
})

test('Collapsible infers the selected native host ref', () => {
  const [disabled] = createSignal<boolean>(false)
  render(() => (
    <Collapsible
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      disabled={disabled()}
    >
      <Collapsible.Trigger>Action</Collapsible.Trigger>
    </Collapsible>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <Collapsible open>
      <Collapsible.Trigger ref={refs}>Action</Collapsible.Trigger>
      <Collapsible.Content ref={refs}>Panel</Collapsible.Content>
    </Collapsible>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(2)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
