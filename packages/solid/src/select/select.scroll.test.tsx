import { cleanup, render, waitFor } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Select } from './index'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

test('opening scrolls the selected option after the lazy popup has been positioned', async () => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView')
  const scroll = vi.fn(function (this: HTMLElement) {
    return this.closest('[data-part="positioner"]')?.hasAttribute('data-positioned')
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scroll,
  })
  try {
    const view = render(() => (
      <Select
        items={[
          { value: 'a', label: 'Apple' },
          { value: 'b', label: 'Banana' },
        ]}
        defaultValue="b"
      >
        <Select.Trigger aria-label="Fruit">
          <Select.Value />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content>
            <Select.Viewport>
              <Select.Item value="a" />
              <Select.Item value="b" />
            </Select.Viewport>
          </Select.Content>
        </Select.Positioner>
      </Select>
    ))
    const trigger = view.getByRole('combobox')
    trigger.focus()
    trigger.click()
    flush()
    await waitFor(() => {
      flush()
      expect(scroll.mock.results.some((result) => result.value === true)).toBe(true)
    })
    expect(scroll.mock.contexts.at(-1)).toBe(view.getByRole('option', { name: 'Banana' }))
    expect(scroll).toHaveBeenLastCalledWith({ block: 'nearest' })
    expect(trigger).toHaveFocus()
  } finally {
    if (original) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', original)
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView')
  }
})
