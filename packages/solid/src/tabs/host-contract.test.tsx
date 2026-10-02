import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Tabs } from './index'

test('Tabs preserves native ref arrays and empty boolean attributes', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  const { container } = render(() => (
    <Tabs ref={refs} disabled={disabled()}>
      <Tabs.List>
        <Tabs.Tab value="a">Action</Tabs.Tab>
      </Tabs.List>
    </Tabs>
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

test('Tabs infers the selected native host ref', () => {
  const [disabled] = createSignal<boolean>(false)
  render(() => (
    <Tabs
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
      }}
      disabled={disabled()}
    >
      <Tabs.List>
        <Tabs.Tab value="a">Action</Tabs.Tab>
      </Tabs.List>
    </Tabs>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <Tabs defaultValue="a">
      <Tabs.List ref={refs}>
        <Tabs.Tab ref={refs} value="a">
          Action
        </Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel ref={refs} value="a">
        Panel
      </Tabs.Panel>
    </Tabs>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(3)
  expect(second.mock.calls).toEqual(first.mock.calls)
})
