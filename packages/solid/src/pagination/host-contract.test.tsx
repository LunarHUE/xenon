import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Pagination } from './index'

test('Pagination preserves native ref arrays and empty boolean attributes', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  const { container } = render(() => (
    <Pagination ref={refs} count={5} disabled={disabled()}>
      <Pagination.Next>Action</Pagination.Next>
    </Pagination>
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

test('Pagination infers the selected native host ref', () => {
  const [disabled] = createSignal<boolean>(false)
  render(() => (
    <Pagination
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLElement>()
      }}
      count={5}
      disabled={disabled()}
    >
      <Pagination.Next>Action</Pagination.Next>
    </Pagination>
  ))
})
