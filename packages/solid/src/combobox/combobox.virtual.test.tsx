import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Combobox } from './index'

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
const items = Array.from({ length: 1000 }, (_, index) => ({
  value: `host-${index}`,
  label: `Host ${index}`,
}))
const options = () => [...document.querySelectorAll<HTMLElement>('[role="option"]')]

test('virtual viewport mounts the highlighted option before naming it', async () => {
  const change = vi.fn()
  const view = render(() => (
    <Combobox items={items} defaultOpen onValueChange={change}>
      <Combobox.Input aria-label="Host" />
      <Combobox.Positioner>
        <Combobox.Content>
          <Combobox.Viewport ref={viewport} virtual={{ size: 20, overscan: 2 }} />
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox>
  ))
  await settle()
  const input = view.getByRole('combobox')
  expect(options().length).toBeLessThan(20)
  expect(options()[0]).toHaveAttribute('aria-setsize', '1000')
  input.focus()
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, cancelable: true })
  )
  await settle()
  const id = input.getAttribute('aria-activedescendant')!
  expect(document.getElementById(id)).toHaveTextContent('Host 999')
  expect(document.getElementById(id)).toHaveAttribute('aria-posinset', '1000')
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
  )
  flush()
  expect(change).toHaveBeenCalledWith('host-999')
})

test('filtering renumbers the visible options', async () => {
  const view = render(() => (
    <Combobox items={items} defaultOpen>
      <Combobox.Input aria-label="Host" />
      <Combobox.Positioner>
        <Combobox.Content>
          <Combobox.Viewport ref={viewport} virtual={{ size: 20 }} />
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox>
  ))
  await settle()
  const input = view.getByRole('combobox') as HTMLInputElement
  input.value = 'Host 99'
  input.dispatchEvent(new InputEvent('input', { bubbles: true }))
  await settle()
  expect(options()[0]).toHaveTextContent('Host 99')
  expect(options()[0]).toHaveAttribute('aria-setsize', '11')
  expect(options()[1]).toHaveAttribute('aria-posinset', '2')
})
