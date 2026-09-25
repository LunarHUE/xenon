import { Combobox } from '@xenon-ui/solid/combobox'
import { Menu, Select } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

function mount(children: () => JSX.Element) {
  const container = document.createElement('div')
  document.body.append(container)
  const dispose = render(children, container)
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  return { container, ...within(container) }
}

test('typeahead.keyboard.12 accepts key events from a Select trigger and popup', async () => {
  const view = mount(() => (
    <Select
      items={[
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ]}
    >
      <Select.Trigger aria-label="Fruit">
        <Select.Value placeholder="Pick" />
      </Select.Trigger>
      <Select.Positioner>
        <Select.Content>
          <Select.Item value="apple" />
          <Select.Item value="banana" />
        </Select.Content>
      </Select.Positioner>
    </Select>
  ))
  const trigger = view.getByRole('combobox', { name: 'Fruit' })
  trigger.focus()
  await userEvent.keyboard('b')
  expect(trigger).toHaveTextContent('Banana')

  await userEvent.click(trigger)
  await userEvent.keyboard('{ArrowUp}')
  expect(view.getByRole('option', { name: 'Apple' })).toHaveAttribute('data-highlighted')
  await userEvent.keyboard('b')
  expect(view.getByRole('option', { name: 'Banana' })).toHaveAttribute('data-highlighted')
})

test('typeahead.keyboard.13 leaves Home and End to the actual Combobox caret', async () => {
  const view = mount(() => (
    <Combobox items={[{ value: 'apple', label: 'Apple' }]}>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Positioner>
        <Combobox.Content />
      </Combobox.Positioner>
    </Combobox>
  ))
  const input = view.getByRole('combobox', { name: 'Fruit' }) as HTMLInputElement
  await userEvent.click(input)
  await userEvent.keyboard('Apple')
  await userEvent.keyboard('{Home}')
  expect(input.selectionStart).toBe(0)
  await userEvent.keyboard('{End}')
  expect(input.selectionStart).toBe(input.value.length)
  expect(input).toHaveFocus()
})

test('typeahead.keyboard.14 keeps nested input typing inside the input', async () => {
  const view = mount(() => (
    <Menu>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <input aria-label="Search" />
          <Menu.Item>Apple</Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu>
  ))
  await userEvent.click(view.getByRole('button', { name: 'Open' }))
  const input = view.getByRole('textbox', { name: 'Search' }) as HTMLInputElement
  await userEvent.click(input)
  await userEvent.keyboard('ap')
  expect(input).toHaveValue('ap')
  expect(input).toHaveFocus()
})
