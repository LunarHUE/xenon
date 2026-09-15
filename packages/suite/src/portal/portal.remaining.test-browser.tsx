import { Popover, Select } from '@xenon/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { afterEach, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'

const cleanups: (() => void)[] = []
const surface = { background: 'white', padding: '12px', 'min-width': '160px' }

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  flush()
})

function mount(children: () => JSX.Element) {
  const host = document.createElement('div')
  document.body.append(host)
  const dispose = render(children, host)
  cleanups.push(() => {
    dispose()
    host.remove()
  })
  flush()
  return within(document.body)
}

async function settle() {
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  flush()
}

test('portal.dismissal.2: Escape closes a portalled Select before its containing Popover', async () => {
  const destination = document.createElement('div')
  document.body.append(destination)
  cleanups.push(() => destination.remove())
  const query = mount(() => (
    <Popover defaultOpen modal>
      <Popover.Trigger>Outer</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          aria-label="Outer details"
          style={{ visibility: 'visible', 'pointer-events': 'auto' }}
        >
          <Select
            items={[
              { value: 'apple', label: 'Apple' },
              { value: 'pear', label: 'Pear' },
            ]}
          >
            <Select.Trigger aria-label="Fruit">
              <Select.Value placeholder="Choose" />
            </Select.Trigger>
            <Select.Portal container={destination}>
              <Select.Positioner>
                <Select.Content style={surface}>
                  <Select.Viewport>
                    <Select.Item value="apple" />
                    <Select.Item value="pear" />
                  </Select.Viewport>
                </Select.Content>
              </Select.Positioner>
            </Select.Portal>
          </Select>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = query.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  const listbox = query.getByRole('listbox', { hidden: true })
  expect(listbox).toBeInTheDocument()
  expect(destination.contains(listbox)).toBe(true)
  await userEvent.keyboard('{Escape}')
  await settle()
  expect(query.queryByRole('listbox', { hidden: true })).toBeNull()
  expect(trigger).toHaveFocus()
  expect(query.getByRole('dialog', { name: 'Outer details' })).toBeInTheDocument()
  expect(query.getByRole('dialog', { name: 'Outer details' })).toHaveAttribute('data-state', 'open')
  expect(query.getByText('Outer')).toHaveAttribute('aria-expanded', 'true')
  await userEvent.keyboard('{Tab}')
  expect(trigger).toHaveFocus()
  await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
  expect(trigger).toHaveFocus()
})

test('portal.dismissal.3: an outside press closes the inner portalled Select but leaves the Popover open', async () => {
  const outside = document.createElement('button')
  outside.textContent = 'Outside'
  document.body.append(outside)
  cleanups.push(() => outside.remove())
  const query = mount(() => (
    <Popover defaultOpen>
      <Popover.Trigger>Outer</Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content
          aria-label="Outer details"
          style={{ visibility: 'visible', 'pointer-events': 'auto' }}
        >
          <Select
            items={[
              { value: 'apple', label: 'Apple' },
              { value: 'pear', label: 'Pear' },
            ]}
          >
            <Select.Trigger aria-label="Fruit">
              <Select.Value placeholder="Choose" />
            </Select.Trigger>
            <Select.Portal>
              <Select.Positioner>
                <Select.Content style={surface}>
                  <Select.Viewport>
                    <Select.Item value="apple" />
                    <Select.Item value="pear" />
                  </Select.Viewport>
                </Select.Content>
              </Select.Positioner>
            </Select.Portal>
          </Select>
        </Popover.Content>
      </Popover.Positioner>
    </Popover>
  ))
  const trigger = query.getByRole('combobox', { name: 'Fruit' })
  await userEvent.click(trigger)
  await settle()
  await userEvent.click(outside)
  await settle()
  expect(query.queryByRole('listbox')).toBeNull()
  expect(query.getByRole('dialog', { name: 'Outer details' })).toBeInTheDocument()
  expect(query.getByRole('button', { name: 'Outer' })).toHaveAttribute('aria-expanded', 'true')
  expect(outside).toHaveFocus()
})
