import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Listbox } from './index'
import type { ListboxItemData } from './index'

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
const viewport = (element: HTMLElement) =>
  Object.defineProperty(element, 'clientHeight', { value: 100, configurable: true })
const items: ListboxItemData[] = Array.from({ length: 1000 }, (_, index) => ({
  value: `node-${index}`,
  disabled: index === 1,
}))
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]
function press(key: string) {
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  )
  flush()
}

test('roving focus follows the keyboard into rows that were not mounted', async () => {
  const change = vi.fn()
  const view = render(() => (
    <Listbox
      aria-label="Nodes"
      items={items}
      virtual={{ size: 20, overscan: 2 }}
      ref={viewport}
      onValueChange={change}
    />
  ))
  await settle()
  const root = view.getByRole('listbox')
  expect(options().length).toBeLessThan(20)
  expect(options()[0]).toHaveAttribute('aria-setsize', '1000')
  options()[0]!.focus()
  flush()
  press('ArrowDown')
  await settle()
  expect(document.activeElement).toHaveTextContent('node-2')
  press('End')
  await settle()
  expect(document.activeElement).toHaveTextContent('node-999')
  expect(document.activeElement).toHaveAttribute('aria-posinset', '1000')
  expect(root.scrollTop).toBeGreaterThan(0)
  press('Enter')
  expect(change).toHaveBeenLastCalledWith('node-999')
})

test('focus waits on the root while its row is scrolled out, then returns', async () => {
  const view = render(() => (
    <Listbox aria-label="Nodes" items={items} virtual={{ size: 20, overscan: 0 }} ref={viewport} />
  ))
  await settle()
  const root = view.getByRole('listbox')
  options()[0]!.focus()
  flush()
  root.scrollTop = 2000
  root.dispatchEvent(new Event('scroll'))
  await settle()
  expect(options().some((option) => option.textContent === 'node-0')).toBe(false)
  expect(document.activeElement).toBe(root)
  root.scrollTop = 0
  root.dispatchEvent(new Event('scroll'))
  await settle()
  expect(document.activeElement).toHaveTextContent('node-0')
})

test('typeahead searches every item, mounted or not', async () => {
  render(() => (
    <Listbox
      aria-label="Nodes"
      items={[...items.slice(0, 500), { value: 'zulu' }]}
      virtual={{ size: 20 }}
      ref={viewport}
    />
  ))
  await settle()
  options()[0]!.focus()
  flush()
  press('z')
  await settle()
  expect(document.activeElement).toHaveTextContent('zulu')
})
