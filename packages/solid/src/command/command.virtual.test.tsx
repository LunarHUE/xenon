import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Command } from './index'
import type { CommandItemData } from './index'

beforeEach(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const settle = async () => {
  flush()
  await Promise.resolve()
  flush()
}
/** jsdom has no layout: give the scroll container a 100px viewport. */
const viewport = (element: HTMLElement) =>
  Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true })
const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]
function press(key: string) {
  input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  flush()
}
function type(value: string) {
  input().value = value
  input().dispatchEvent(new InputEvent('input', { bubbles: true }))
  flush()
}

const items: CommandItemData[] = Array.from({ length: 1000 }, (_, index) => ({
  value: `Machine ${index}`,
  group: index < 500 ? 'east' : 'west',
}))

test('renders only the rows in view and keeps the active descendant mounted', async () => {
  const run = vi.fn()
  render(() => (
    <Command items={items} onSelect={run}>
      <Command.Input aria-label="Machines" />
      <Command.List
        ref={viewport}
        virtual={{ size: 20, overscan: 2 }}
        renderItem={(item) => <span>{item.value}</span>}
      />
    </Command>
  ))
  await settle()
  expect(options().length).toBeLessThan(20)
  const first = options()[0]!
  expect(first).toHaveAttribute('aria-setsize', '1000')
  expect(first).toHaveAttribute('aria-posinset', '1')
  expect(input().getAttribute('aria-activedescendant')).toBe(first.id)
  press('End')
  await settle()
  const id = input().getAttribute('aria-activedescendant')!
  expect(document.getElementById(id)).toHaveTextContent('Machine 999')
  expect(document.getElementById(id)).toHaveAttribute('aria-posinset', '1000')
  press('Enter')
  expect(run).toHaveBeenCalledWith('Machine 999', expect.anything())
})

test('filtering updates the set size and every active id points at a mounted row', async () => {
  render(() => (
    <Command items={items}>
      <Command.Input aria-label="Machines" />
      <Command.List ref={viewport} virtual={{ size: 20 }} />
    </Command>
  ))
  await settle()
  type('Machine 99')
  await settle()
  // "Machine 99", "Machine 990" to "999", and the 3-digit numbers with 9, 9 in order.
  const count = Number(options()[0]!.getAttribute('aria-setsize'))
  expect(count).toBeGreaterThan(10)
  expect(options()[0]).toHaveTextContent('Machine 99')
  for (let step = 0; step < count; step++) {
    const id = input().getAttribute('aria-activedescendant')
    expect(id && document.getElementById(id)).toBeTruthy()
    press('ArrowDown')
    await settle()
  }
})

test('group headings render as sticky presentation rows outside the option count', async () => {
  render(() => (
    <Command items={items}>
      <Command.Input aria-label="Machines" />
      <Command.List
        ref={viewport}
        virtual={{ size: 20 }}
        groupHeading={(group) => <strong>{group}</strong>}
      />
    </Command>
  ))
  await settle()
  const heading = document.querySelector('[data-part="group-heading"]')!
  expect(heading).toHaveAttribute('role', 'presentation')
  expect(heading).toHaveAttribute('data-sticky')
  expect(heading).not.toHaveAttribute('aria-posinset')
  expect(heading).toHaveTextContent('east')
  expect(options()[0]).toHaveAttribute('aria-posinset', '1')
})
