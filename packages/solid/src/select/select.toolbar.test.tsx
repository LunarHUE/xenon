import { cleanup, render } from '@solidjs/testing-library'
import { flush } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'
import { Select } from './index'
import { Toolbar } from '../toolbar'

afterEach(cleanup)

test('toolbar focus preserves Select trigger descendants until their native click', () => {
  const open = vi.fn()
  const click = vi.fn()
  let forwarded: HTMLElement | undefined
  const view = render(() => (
    <Toolbar aria-label="Tools">
      <Toolbar.Button>Before</Toolbar.Button>
      <Select items={[{ value: 'a', label: 'Apple' }]} onOpenChange={open}>
        <Select.Trigger
          as={Toolbar.Button}
          aria-label="Fruit"
          ref={(element: HTMLElement) => {
            forwarded = element
          }}
          onClick={click}
        >
          <Select.Value data-testid="value" placeholder="Fruit" />
        </Select.Trigger>
        <Select.Positioner>
          <Select.Content>
            <Select.Item value="a" />
          </Select.Content>
        </Select.Positioner>
      </Select>
    </Toolbar>
  ))
  flush()
  const trigger = view.getByRole('combobox', { name: 'Fruit' })
  const valueHost = view.getByTestId('value')
  expect(forwarded).toBe(trigger)
  trigger.focus()
  flush()
  expect(view.getByTestId('value')).toBe(valueHost)
  valueHost.click()
  flush()
  expect(click).toHaveBeenCalledTimes(1)
  expect(open.mock.calls).toEqual([[true]])
  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(view.getByRole('listbox', { hidden: true })).toBeInTheDocument()
  trigger.click()
  flush()
  expect(click).toHaveBeenCalledTimes(2)
  expect(open.mock.calls).toEqual([[true], [false]])
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
})
