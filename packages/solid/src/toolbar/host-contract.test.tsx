import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Toolbar } from './index'

test('Toolbar preserves native ref arrays and empty boolean attributes', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  const { container } = render(() => (
    <Toolbar ref={refs} disabled={disabled()}>
      <Toolbar.Button>Action</Toolbar.Button>
    </Toolbar>
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

test('Toolbar infers the selected native host ref', () => {
  const [disabled] = createSignal<boolean>(false)
  render(() => (
    <Toolbar
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      disabled={disabled()}
    >
      <Toolbar.Button>Action</Toolbar.Button>
    </Toolbar>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <Toolbar>
      <Toolbar.Group ref={refs}>
        <Toolbar.Button ref={refs}>Action</Toolbar.Button>
        <Toolbar.Link ref={refs} href="/file">
          Link
        </Toolbar.Link>
        <Toolbar.Separator ref={refs} />
      </Toolbar.Group>
    </Toolbar>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(4)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
