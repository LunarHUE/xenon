import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { ScrollArea } from './index'

test('ScrollArea preserves native ref arrays and reactive attribute removal', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [value, setValue] = createSignal<string | undefined>('active')
  render(() => (
    <ScrollArea>
      <ScrollArea.Viewport ref={refs} class={value()} />
    </ScrollArea>
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  expect(host).toHaveAttribute('class', 'active')
  setValue(undefined)
  flush()
  expect(host).not.toHaveAttribute('class')
})

test('ScrollArea infers the selected native host ref', () => {
  const [value] = createSignal<string | undefined>()
  render(() => (
    <ScrollArea>
      <ScrollArea.Viewport
        ref={(node) => {
          expectTypeOf(node).toEqualTypeOf<HTMLDivElement>()
        }}
      />
    </ScrollArea>
  ))
})

test('compound parts forward native ref arrays', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  render(() => (
    <ScrollArea type="always">
      <ScrollArea.Viewport>
        <ScrollArea.Content ref={refs}>Text</ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar ref={refs}>
        <ScrollArea.Thumb ref={refs} />
      </ScrollArea.Scrollbar>
    </ScrollArea>
  ))
  expect(new Set(first.mock.calls.map(([node]) => node)).size).toBe(3)
  expect(second.mock.calls).toEqual(first.mock.calls)
})

test('scroll area parts infer the selected native host ref', () => {
  render(() => (
    <ScrollArea>
      <ScrollArea.Viewport
        as="a"
        href="#content"
        ref={(node) => {
          expectTypeOf(node).toEqualTypeOf<HTMLAnchorElement>()
        }}
      />
    </ScrollArea>
  ))
})
